import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  TokamakAddedValueReport,
  type TTokamakAddedValueReport,
} from "@shared/tokamak-added-value";
import {
  TokamakPrecursorDataset,
  type TTokamakPrecursorDataset,
} from "@shared/tokamak-precursor";
import { withDerivedArtifactInformationBoundary } from "@shared/information-boundary-derived";
import { loadTokamakPrecursorDataset, runTokamakPrecursorDataset } from "./tokamak-precursor-runner";
import {
  buildInformationBoundary,
  hashStableJson,
  sha256Hex,
} from "../server/utils/information-boundary";
import { stableJsonStringify } from "../server/utils/stable-json";
import { putBlob } from "../server/storage";
import { putEnvelopeWithPolicy } from "../server/skills/provenance";

const DEFAULT_DATASET_PATH = path.resolve(
  process.cwd(),
  "datasets",
  "tokamak-rz-precursor.fixture.json",
);
const DEFAULT_RECALL_TARGET = 0.8;
const REPORT_MIME = "application/json";

type AddedValueArtifactsOptions = {
  dir?: string;
  output_path?: string;
  write?: boolean;
};

type AddedValueOptions = {
  dataset_path?: string;
  recall_target?: number;
  generated_at_iso?: string;
  persona_id?: string;
  artifacts?: AddedValueArtifactsOptions;
};

type LogisticModel = {
  weights: number[];
  bias: number;
  means: number[];
  scales: number[];
};

const percentile = (values: number[], p: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = Math.min(1, Math.max(0, p)) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const t = pos - lower;
  return sorted[lower] * (1 - t) + sorted[upper] * t;
};

const sigmoid = (value: number): number => {
  const clamped = Math.max(-60, Math.min(60, value));
  return 1 / (1 + Math.exp(-clamped));
};

const standardizeVectors = (vectors: number[][]) => {
  if (vectors.length === 0) {
    return { standardized: vectors, means: [] as number[], scales: [] as number[] };
  }
  const dim = vectors[0].length;
  const means = new Array(dim).fill(0);
  const scales = new Array(dim).fill(0);
  for (const row of vectors) {
    for (let i = 0; i < dim; i++) {
      means[i] += row[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    means[i] /= vectors.length;
  }
  for (const row of vectors) {
    for (let i = 0; i < dim; i++) {
      const diff = row[i] - means[i];
      scales[i] += diff * diff;
    }
  }
  for (let i = 0; i < dim; i++) {
    const variance = scales[i] / Math.max(1, vectors.length);
    const std = Math.sqrt(variance);
    scales[i] = std > 0 ? std : 1;
  }
  const standardized = vectors.map((row) =>
    row.map((value, i) => (value - means[i]) / scales[i]),
  );
  return { standardized, means, scales };
};

const trainLogisticModel = (vectors: number[][], labels: number[]): LogisticModel => {
  const { standardized, means, scales } = standardizeVectors(vectors);
  const dim = standardized[0]?.length ?? 0;
  const weights = new Array(dim).fill(0);
  let bias = 0;
  if (vectors.length === 0 || dim === 0) {
    return { weights, bias, means, scales };
  }
  const lr = 0.4;
  const l2 = 0.01;
  const iterations = 250;
  for (let iter = 0; iter < iterations; iter += 1) {
    const grad = new Array(dim).fill(0);
    let gradBias = 0;
    for (let i = 0; i < standardized.length; i++) {
      const row = standardized[i];
      let z = bias;
      for (let j = 0; j < dim; j++) {
        z += weights[j] * row[j];
      }
      const p = sigmoid(z);
      const err = p - labels[i];
      gradBias += err;
      for (let j = 0; j < dim; j++) {
        grad[j] += err * row[j];
      }
    }
    const invN = 1 / standardized.length;
    for (let j = 0; j < dim; j++) {
      weights[j] -= lr * (grad[j] * invN + l2 * weights[j]);
    }
    bias -= lr * gradBias * invN;
  }
  return { weights, bias, means, scales };
};

const predictLogistic = (vector: number[], model: LogisticModel): number => {
  let z = model.bias;
  for (let i = 0; i < model.weights.length; i++) {
    const scaled = (vector[i] - model.means[i]) / model.scales[i];
    z += model.weights[i] * scaled;
  }
  return sigmoid(z);
};

const buildRocCurve = (pairs: Array<{ score: number; label: boolean }>) => {
  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const pos = sorted.filter((pair) => pair.label).length;
  const neg = sorted.length - pos;
  if (pos === 0 || neg === 0) {
    return { auc: null, roc: [] as Array<{ threshold: number; tpr: number; fpr: number }> };
  }
  let tp = 0;
  let fp = 0;
  let tpPrev = 0;
  let fpPrev = 0;
  let aucSum = 0;
  const roc: Array<{ threshold: number; tpr: number; fpr: number }> = [];
  for (const pair of sorted) {
    if (pair.label) tp += 1;
    else fp += 1;
    const tpr = tp / pos;
    const fpr = fp / neg;
    aucSum += (fp - fpPrev) * (tp + tpPrev) / 2;
    tpPrev = tp;
    fpPrev = fp;
    roc.push({ threshold: pair.score, tpr, fpr });
  }
  const auc = aucSum / (pos * neg);
  return { auc, roc };
};

const buildPrecisionRecallCurve = (pairs: Array<{ score: number; label: boolean }>) => {
  const sorted = [...pairs].sort((a, b) => b.score - a.score);
  const pos = sorted.filter((pair) => pair.label).length;
  if (pos === 0) {
    return {
      auc: null,
      curve: [] as Array<{ threshold: number; precision: number; recall: number }>,
    };
  }
  let tp = 0;
  let fp = 0;
  let prevRecall = 0;
  let prevPrecision = 1;
  let aucSum = 0;
  const curve: Array<{ threshold: number; precision: number; recall: number }> = [];
  for (const pair of sorted) {
    if (pair.label) tp += 1;
    else fp += 1;
    const recall = tp / pos;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    aucSum += (recall - prevRecall) * (precision + prevPrecision) / 2;
    prevRecall = recall;
    prevPrecision = precision;
    curve.push({ threshold: pair.score, precision, recall });
  }
  return { auc: aucSum, curve };
};

const computeLeadTimeSummary = (
  frames: Array<{ score: number; label: boolean; t_s: number }>,
  threshold: number,
) => {
  const leadTimes: number[] = [];
  for (let i = 0; i < frames.length; i++) {
    if (!frames[i].label) continue;
    if (i > 0 && frames[i - 1].label) continue;
    let alarmIndex = -1;
    for (let j = i - 1; j >= 0; j -= 1) {
      if (frames[j].score >= threshold) {
        alarmIndex = j;
        break;
      }
    }
    if (alarmIndex >= 0) {
      const dt = frames[i].t_s - frames[alarmIndex].t_s;
      if (Number.isFinite(dt) && dt >= 0) {
        leadTimes.push(dt);
      }
    }
  }
  if (!leadTimes.length) {
    return undefined;
  }
  return {
    mean: leadTimes.reduce((sum, v) => sum + v, 0) / leadTimes.length,
    p50: percentile(leadTimes, 0.5),
  };
};

const buildLeadTimeCurve = (
  frames: Array<{ score: number; label: boolean; t_s: number }>,
  duration_s: number,
) => {
  const thresholds = Array.from(new Set(frames.map((frame) => frame.score))).sort(
    (a, b) => b - a,
  );
  const totalPos = frames.filter((frame) => frame.label).length;
  const hours = duration_s > 0 ? duration_s / 3600 : null;
  return thresholds.map((threshold) => {
    const tp = frames.filter((frame) => frame.label && frame.score >= threshold).length;
    const fp = frames.filter((frame) => !frame.label && frame.score >= threshold).length;
    const recall = totalPos > 0 ? tp / totalPos : 0;
    const lead = computeLeadTimeSummary(frames, threshold);
    return {
      threshold,
      recall,
      false_alarms_per_hour: hours ? fp / hours : 0,
      ...(lead?.mean !== undefined ? { lead_time_mean_s: lead.mean } : {}),
      ...(lead?.p50 !== undefined ? { lead_time_p50_s: lead.p50 } : {}),
    };
  });
};

const selectFixedRecall = (
  curve: Array<{
    threshold: number;
    recall: number;
    false_alarms_per_hour: number;
  }>,
  recallTarget: number,
) => {
  const eligible = curve.filter((point) => point.recall >= recallTarget);
  if (!eligible.length) {
    return { recall: recallTarget, false_alarms_per_hour: null as number | null };
  }
  eligible.sort((a, b) => {
    if (a.false_alarms_per_hour !== b.false_alarms_per_hour) {
      return a.false_alarms_per_hour - b.false_alarms_per_hour;
    }
    return b.recall - a.recall;
  });
  const best = eligible[0];
  return {
    recall: recallTarget,
    threshold: best.threshold,
    false_alarms_per_hour: best.false_alarms_per_hour,
  };
};

const toEpochSeconds = (iso: string): number | null => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms / 1000 : null;
};

const computeDurationSeconds = (times: number[]): number => {
  if (times.length < 2) return 0;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min;
  if (span > 0) return span;
  return Math.max(0, times.length - 1);
};

async function persistAddedValueEnvelope(
  report: TTokamakAddedValueReport,
  opts?: { personaId?: string; dataset_path?: string },
): Promise<void> {
  const json = stableJsonStringify(report);
  const buffer = Buffer.from(json, "utf8");
  const reportDigest = sha256Hex(buffer);
  const blob = await putBlob(buffer, { contentType: REPORT_MIME });
  const now = new Date().toISOString();
  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
      source: {
        uri: "compute://tokamak-added-value-report",
        original_hash: { algo: "sha256", value: reportDigest },
        creator_id: opts?.personaId ?? "persona:tokamak-added-value",
        cid: blob.cid,
        mime: REPORT_MIME,
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      physics: {
        kind: "tokamak-added-value",
        summary: {
          dataset_path: opts?.dataset_path ?? null,
          report_hash: report.report_hash,
          recall_target: report.recall_target,
          physics_only_auc: report.physics_only.auc,
          combined_auc: report.combined.auc,
          delta_auc: report.delta.auc,
        },
        artifacts: {
          report_url: blob.uri,
          report_cid: blob.cid,
        },
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "tokamak-added-value",
          impl_version: "1.0.0",
          lib_hash: {
            algo: "sha256",
            value: sha256Hex(Buffer.from("tokamak-added-value@1", "utf8")),
          },
          params: {
            dataset_path: opts?.dataset_path ?? null,
            recall_target: report.recall_target,
            physics_feature_count: report.physics_only.features.length,
            combined_feature_count: report.combined.features.length,
          },
          input_hash: {
            algo: "sha256",
            value: report.inputs_hash.replace(/^sha256:/, ""),
          },
          output_hash: { algo: "sha256", value: reportDigest },
          started_at: report.generated_at_iso,
          ended_at: report.generated_at_iso,
        },
      ],
      merkle_root: { algo: "sha256", value: reportDigest },
      previous: null,
      signatures: [],
      information_boundary: report.information_boundary,
    },
  });
  await putEnvelopeWithPolicy(envelope);
}

export async function loadTokamakAddedValueDataset(
  datasetPath = DEFAULT_DATASET_PATH,
): Promise<TTokamakPrecursorDataset> {
  const src = await fs.readFile(datasetPath, "utf8");
  return TokamakPrecursorDataset.parse(JSON.parse(src));
}

export async function runTokamakAddedValueReport(
  dataset: TTokamakPrecursorDataset,
  opts: AddedValueOptions = {},
): Promise<TTokamakAddedValueReport> {
  const normalized = TokamakPrecursorDataset.parse(dataset);
  const generated_at_iso =
    opts.generated_at_iso ?? new Date().toISOString();
  const recallTarget = Math.min(
    1,
    Math.max(0, opts.recall_target ?? DEFAULT_RECALL_TARGET),
  );
  const precursor = runTokamakPrecursorDataset(normalized, {
    dataset_path: opts.dataset_path,
    score_key: "k_combo_v1",
    artifacts: { write_culpability: false },
  });
  if (!precursor.feature_vectors) {
    throw new Error("tokamak_added_value_missing_feature_vectors");
  }

  const labels = normalized.frames.map((frame) => frame.label.event_present);
  const labelValues = labels.map((label) => (label ? 1 : 0));
  const startEpoch =
    normalized.frames.length > 0
      ? toEpochSeconds(normalized.frames[0].timestamp_iso)
      : null;
  const times = normalized.frames.map((frame, index) => {
    const epoch = toEpochSeconds(frame.timestamp_iso);
    return startEpoch !== null && epoch !== null ? epoch - startEpoch : index;
  });
  const duration_s = computeDurationSeconds(times);

  const physicsVectors = precursor.feature_vectors.physics_only.vectors;
  const combinedVectors = precursor.feature_vectors.physics_plus_curvature.vectors;
  const physicsModel = trainLogisticModel(physicsVectors, labelValues);
  const combinedModel = trainLogisticModel(combinedVectors, labelValues);

  const buildScores = (vectors: number[], model: LogisticModel) =>
    predictLogistic(vectors, model);

  const physicsScores = physicsVectors.map((vector) =>
    buildScores(vector, physicsModel),
  );
  const combinedScores = combinedVectors.map((vector) =>
    buildScores(vector, combinedModel),
  );

  const buildPairs = (scores: number[]) =>
    scores.map((score, idx) => ({ score, label: labels[idx] }));

  const physicsPairs = buildPairs(physicsScores);
  const combinedPairs = buildPairs(combinedScores);

  const physicsRoc = buildRocCurve(physicsPairs);
  const combinedRoc = buildRocCurve(combinedPairs);
  const physicsPr = buildPrecisionRecallCurve(physicsPairs);
  const combinedPr = buildPrecisionRecallCurve(combinedPairs);

  const buildLeadCurve = (scores: number[]) => {
    const frames = scores.map((score, idx) => ({
      score,
      label: labels[idx],
      t_s: times[idx],
    }));
    return buildLeadTimeCurve(frames, duration_s);
  };

  const physicsLeadCurve = buildLeadCurve(physicsScores);
  const combinedLeadCurve = buildLeadCurve(combinedScores);

  const physicsFixedRecall = selectFixedRecall(physicsLeadCurve, recallTarget);
  const combinedFixedRecall = selectFixedRecall(combinedLeadCurve, recallTarget);

  const physicsOnly = {
    features: precursor.feature_vectors.physics_only.features,
    auc: physicsRoc.auc,
    pr_auc: physicsPr.auc,
    lead_time_curve: physicsLeadCurve,
    false_alarms_at_recall: physicsFixedRecall,
  };
  const combined = {
    features: precursor.feature_vectors.physics_plus_curvature.features,
    auc: combinedRoc.auc,
    pr_auc: combinedPr.auc,
    lead_time_curve: combinedLeadCurve,
    false_alarms_at_recall: combinedFixedRecall,
  };

  const delta = {
    auc:
      physicsRoc.auc !== null && combinedRoc.auc !== null
        ? combinedRoc.auc - physicsRoc.auc
        : null,
    pr_auc:
      physicsPr.auc !== null && combinedPr.auc !== null
        ? combinedPr.auc - physicsPr.auc
        : null,
    false_alarms_per_hour:
      physicsFixedRecall.false_alarms_per_hour !== null &&
      combinedFixedRecall.false_alarms_per_hour !== null
        ? combinedFixedRecall.false_alarms_per_hour -
          physicsFixedRecall.false_alarms_per_hour
        : null,
  };

  const report_hash = hashStableJson({
    dataset_created_at: normalized.created_at,
    recall_target: recallTarget,
    physics_only: {
      features: physicsOnly.features,
      auc: physicsOnly.auc,
      pr_auc: physicsOnly.pr_auc,
      lead_time_curve: physicsOnly.lead_time_curve,
      false_alarms_at_recall: physicsOnly.false_alarms_at_recall,
    },
    combined: {
      features: combined.features,
      auc: combined.auc,
      pr_auc: combined.pr_auc,
      lead_time_curve: combined.lead_time_curve,
      false_alarms_at_recall: combined.false_alarms_at_recall,
    },
    delta,
  });

  const informationBoundary = buildInformationBoundary({
    data_cutoff_iso: normalized.created_at,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs: {
      kind: "tokamak_added_value",
      v: 1,
      dataset_created_at: normalized.created_at,
      dataset_path: opts.dataset_path,
      recall_target: recallTarget,
      physics_features: physicsOnly.features,
      combined_features: combined.features,
    },
    features: {
      kind: "tokamak_added_value",
      v: 1,
      report_hash,
      physics_only: physicsOnly,
      combined,
      delta,
    },
  });

  const reportBase = {
    schema_version: "tokamak_added_value_report/1",
    kind: "tokamak_added_value_report",
    generated_at_iso,
    dataset_path: opts.dataset_path,
    report_hash,
    recall_target: recallTarget,
    physics_only: physicsOnly,
    combined,
    delta,
  };

  const report = TokamakAddedValueReport.parse(
    withDerivedArtifactInformationBoundary(reportBase, informationBoundary),
  );

  const write = opts.artifacts?.write ?? true;
  if (write) {
    const artifactDir = opts.artifacts?.dir ?? path.resolve(process.cwd(), "artifacts");
    const outputPath =
      opts.artifacts?.output_path ??
      path.join(artifactDir, "tokamak-added-value.json");
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, stableJsonStringify(report), "utf8");
  }

  await persistAddedValueEnvelope(report, {
    personaId: opts.persona_id,
    dataset_path: opts.dataset_path,
  });

  return report;
}

export async function runTokamakAddedValueFromPath(
  datasetPath = DEFAULT_DATASET_PATH,
  opts: AddedValueOptions = {},
): Promise<TTokamakAddedValueReport> {
  const dataset = await loadTokamakPrecursorDataset(datasetPath);
  return runTokamakAddedValueReport(dataset, {
    ...opts,
    dataset_path: opts.dataset_path ?? datasetPath,
  });
}

export function defaultAddedValueOutputPath(): string {
  return path.resolve(process.cwd(), "artifacts", "tokamak-added-value.json");
}
