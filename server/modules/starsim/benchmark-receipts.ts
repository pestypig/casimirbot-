import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { hashStableJson } from "../../utils/information-boundary";
import { resolveStarSimArtifactRoot } from "./artifacts";
import { listBenchmarkTargets } from "./benchmark-targets";
import type {
  RequestedLane,
  StarSimBenchmarkDriftCategory,
  StarSimBenchmarkEnvelopeDiagnostic,
  StarSimBenchmarkReceipt,
  StarSimBenchmarkReceiptStage,
  StarSimBenchmarkRepeatability,
  StarSimBenchmarkTargetIdentityBasis,
  StarSimBenchmarkTargetMatchMode,
  StarSimDiagnosticSummary,
  StarSimLanePlan,
  StarSimRequest,
  StarSimResponse,
  StarSimSourceIdentifiers,
  StarSimSourceSelectionOrigin,
  StarSimSourceFieldSelection,
} from "./contract";
import { STAR_SIM_BENCHMARK_RECEIPT_SCHEMA_VERSION } from "./contract";

type BenchmarkObservableFieldPath =
  | "spectroscopy.teff_K"
  | "asteroseismology.numax_uHz"
  | "asteroseismology.deltanu_uHz";

const BENCHMARK_OBSERVABLE_FIELDS: BenchmarkObservableFieldPath[] = [
  "asteroseismology.deltanu_uHz",
  "asteroseismology.numax_uHz",
  "spectroscopy.teff_K",
];

const laneOrder: RequestedLane[] = [
  "classification",
  "structure_1d",
  "structure_mesa",
  "oscillation_gyre",
  "activity",
  "barycenter",
];

const asRelative = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const writeJsonAtomic = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
};

const sortRecord = <T>(record: Record<string, T> | undefined): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record ?? {})
      .sort(([left], [right]) => left.localeCompare(right)),
  );

const sortArray = (values: string[] | undefined): string[] => [...(values ?? [])].sort((left, right) => left.localeCompare(right));

const sortIdentifiers = (identifiers: StarSimSourceIdentifiers | undefined): StarSimSourceIdentifiers | undefined => {
  if (!identifiers) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(identifiers)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  ) as StarSimSourceIdentifiers;
};

const orderedLanes = (lanes: RequestedLane[]): RequestedLane[] =>
  [...lanes].sort((left, right) => laneOrder.indexOf(left) - laneOrder.indexOf(right));

const getRequestObservableValue = (requestDraft: StarSimRequest | null | undefined, fieldPath: BenchmarkObservableFieldPath): number | null => {
  if (!requestDraft) {
    return null;
  }
  if (fieldPath === "spectroscopy.teff_K") {
    return typeof requestDraft.spectroscopy?.teff_K === "number" ? requestDraft.spectroscopy.teff_K : null;
  }
  if (fieldPath === "asteroseismology.numax_uHz") {
    return typeof requestDraft.asteroseismology?.numax_uHz === "number" ? requestDraft.asteroseismology.numax_uHz : null;
  }
  return typeof requestDraft.asteroseismology?.deltanu_uHz === "number" ? requestDraft.asteroseismology.deltanu_uHz : null;
};

const getTargetMetadata = (benchmarkTargetId: string) =>
  listBenchmarkTargets().find((target) => target.id === benchmarkTargetId) ?? null;

const buildEnvelopeDiagnostics = (args: {
  benchmarkTargetId: string;
  requestDraft: StarSimRequest | null | undefined;
}): StarSimBenchmarkEnvelopeDiagnostic[] => {
  const target = getTargetMetadata(args.benchmarkTargetId);
  const envelopes = target?.observable_envelopes ?? {};
  return Object.entries(envelopes)
    .filter((entry): entry is [BenchmarkObservableFieldPath, { min: number; max: number }] =>
      BENCHMARK_OBSERVABLE_FIELDS.includes(entry[0] as BenchmarkObservableFieldPath),
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fieldPath, envelope]) => {
      const actual = getRequestObservableValue(args.requestDraft, fieldPath);
      return {
        field_path: fieldPath,
        status:
          typeof actual === "number"
            ? actual >= envelope.min && actual <= envelope.max
              ? "in_envelope"
              : "out_of_envelope"
            : "missing",
        actual: typeof actual === "number" ? actual : undefined,
        min: envelope.min,
        max: envelope.max,
      };
    });
};

const asDiagnosticSummary = (value: unknown): StarSimDiagnosticSummary | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const summary: StarSimDiagnosticSummary = {};
  if (candidate.fit_quality === "good" || candidate.fit_quality === "borderline" || candidate.fit_quality === "poor") {
    summary.fit_quality = candidate.fit_quality;
  }
  if (
    candidate.comparison_quality === "good"
    || candidate.comparison_quality === "borderline"
    || candidate.comparison_quality === "poor"
  ) {
    summary.comparison_quality = candidate.comparison_quality;
  }
  if (Array.isArray(candidate.top_residual_fields)) {
    summary.top_residual_fields = candidate.top_residual_fields.filter((entry): entry is string => typeof entry === "string");
  }
  if (candidate.observable_coverage && typeof candidate.observable_coverage === "object") {
    const coverage = candidate.observable_coverage as Record<string, unknown>;
    if (
      typeof coverage.used === "number"
      && typeof coverage.requested === "number"
      && typeof coverage.ratio === "number"
    ) {
      summary.observable_coverage = {
        used: coverage.used,
        requested: coverage.requested,
        ratio: coverage.ratio,
      };
    }
  }
  return Object.keys(summary).length > 0 ? summary : null;
};

const collectLaneDiagnostics = (response: StarSimResponse | null | undefined): Partial<Record<RequestedLane, StarSimDiagnosticSummary>> => {
  if (!response) {
    return {};
  }
  const diagnostics: Partial<Record<RequestedLane, StarSimDiagnosticSummary>> = {};
  for (const lane of response.lanes) {
    const fromResult =
      lane.result && typeof lane.result === "object"
        ? asDiagnosticSummary((lane.result as Record<string, unknown>).diagnostic_summary)
        : null;
    const fromValidation = asDiagnosticSummary(lane.benchmark_validation?.diagnostic_summary);
    const fromDomain =
      lane.domain_validity && typeof lane.domain_validity === "object"
        ? asDiagnosticSummary((lane.domain_validity as Record<string, unknown>).diagnostic_summary)
        : null;
    const diagnostic = fromResult ?? fromValidation ?? fromDomain;
    if (diagnostic) {
      diagnostics[lane.requested_lane] = diagnostic;
    }
  }
  return diagnostics;
};

const buildSelectedBenchmarkObservables = (requestDraft: StarSimRequest | null | undefined): Partial<Record<BenchmarkObservableFieldPath, number>> => {
  const values: Partial<Record<BenchmarkObservableFieldPath, number>> = {};
  for (const fieldPath of BENCHMARK_OBSERVABLE_FIELDS) {
    const value = getRequestObservableValue(requestDraft, fieldPath);
    if (typeof value === "number") {
      values[fieldPath] = value;
    }
  }
  return values;
};

type PersistedBenchmarkReceipt = {
  receipt: StarSimBenchmarkReceipt;
  ref: string;
};

export const buildSelectedFieldOriginsSnapshot = (
  fields: Record<string, { selected_from: StarSimSourceSelectionOrigin } | StarSimSourceFieldSelection>,
): Record<string, StarSimSourceSelectionOrigin> =>
  Object.fromEntries(
    Object.entries(fields)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fieldPath, field]) => [fieldPath, field.selected_from]),
  );

export const buildStarSimBenchmarkInputSignature = (args: {
  benchmarkTargetId: string;
  benchmarkTargetMatchMode?: StarSimBenchmarkTargetMatchMode;
  benchmarkTargetIdentityBasis?: StarSimBenchmarkTargetIdentityBasis;
  benchmarkFamilyOrPackIds: string[];
  identifiersTrusted?: StarSimSourceIdentifiers;
  selectedFieldOrigins: Record<string, StarSimSourceSelectionOrigin>;
  requestDraft: StarSimRequest | null | undefined;
  requestedLanes: RequestedLane[];
  policyUsed: StarSimLanePlan["policy"];
  sourceCacheKey: string | null;
  resolvedDraftHash: string | null;
}): string =>
  hashStableJson({
    schema_version: "star-sim-benchmark-input/1",
    benchmark_target_id: args.benchmarkTargetId,
    benchmark_target_match_mode: args.benchmarkTargetMatchMode ?? null,
    benchmark_target_identity_basis: args.benchmarkTargetIdentityBasis ?? null,
    benchmark_family_or_pack_ids: [...args.benchmarkFamilyOrPackIds].sort((left, right) => left.localeCompare(right)),
    identifiers_trusted: sortIdentifiers(args.identifiersTrusted) ?? {},
    selected_field_origins: sortRecord(args.selectedFieldOrigins),
    benchmark_observables: buildSelectedBenchmarkObservables(args.requestDraft),
    requested_lanes: orderedLanes(args.requestedLanes),
    policy_used: args.policyUsed,
    source_cache_key: args.sourceCacheKey,
    resolved_draft_hash: args.resolvedDraftHash,
  });

export const buildStarSimBenchmarkReceipt = (args: {
  receiptStage: StarSimBenchmarkReceiptStage;
  jobId?: string | null;
  benchmarkTargetId?: string;
  benchmarkTargetMatchMode?: StarSimBenchmarkTargetMatchMode;
  benchmarkTargetConflictReason?: string;
  benchmarkTargetIdentityBasis?: StarSimBenchmarkTargetIdentityBasis;
  benchmarkTargetQualityOk?: boolean;
  identifiersObserved?: StarSimSourceIdentifiers;
  identifiersTrusted?: StarSimSourceIdentifiers;
  selectedFieldOrigins: Record<string, StarSimSourceSelectionOrigin>;
  requestedLanes: RequestedLane[];
  lanePlan: StarSimLanePlan;
  blockedReasons: string[];
  sourceCacheKey: string | null;
  sourceResolutionRef: string | null;
  resolvedDraftHash: string | null;
  requestDraft: StarSimRequest | null | undefined;
  response?: StarSimResponse | null;
}): StarSimBenchmarkReceipt | null => {
  if (!args.benchmarkTargetId) {
    return null;
  }
  const target = getTargetMetadata(args.benchmarkTargetId);
  if (!target) {
    return null;
  }
  const benchmarkInputSignature = buildStarSimBenchmarkInputSignature({
    benchmarkTargetId: args.benchmarkTargetId,
    benchmarkTargetMatchMode: args.benchmarkTargetMatchMode,
    benchmarkTargetIdentityBasis: args.benchmarkTargetIdentityBasis,
    benchmarkFamilyOrPackIds: target.benchmark_family_or_pack_ids,
    identifiersTrusted: args.identifiersTrusted,
    selectedFieldOrigins: args.selectedFieldOrigins,
    requestDraft: args.requestDraft,
    requestedLanes: args.requestedLanes,
    policyUsed: args.lanePlan.policy,
    sourceCacheKey: args.sourceCacheKey,
    resolvedDraftHash: args.resolvedDraftHash,
  });

  return {
    schema_version: STAR_SIM_BENCHMARK_RECEIPT_SCHEMA_VERSION,
    benchmark_backed: true,
    receipt_stage: args.receiptStage,
    written_at_iso: new Date().toISOString(),
    job_id: args.jobId ?? null,
    benchmark_target_id: args.benchmarkTargetId,
    benchmark_family_or_pack_ids: [...target.benchmark_family_or_pack_ids].sort((left, right) => left.localeCompare(right)),
    benchmark_target_match_mode: args.benchmarkTargetMatchMode,
    benchmark_target_conflict_reason: args.benchmarkTargetConflictReason,
    benchmark_target_identity_basis: args.benchmarkTargetIdentityBasis,
    benchmark_target_quality_ok: args.benchmarkTargetQualityOk,
    benchmark_input_signature: benchmarkInputSignature,
    identifiers_observed: sortIdentifiers(args.identifiersObserved),
    identifiers_trusted: sortIdentifiers(args.identifiersTrusted),
    selected_field_origins: sortRecord(args.selectedFieldOrigins),
    requested_lanes: orderedLanes(args.requestedLanes),
    runnable_lanes: orderedLanes(args.lanePlan.runnable_lanes),
    blocked_lanes: orderedLanes(args.lanePlan.blocked_lanes),
    blocked_reasons: [...args.blockedReasons].sort((left, right) => left.localeCompare(right)),
    policy_used: args.lanePlan.policy,
    source_cache_key: args.sourceCacheKey,
    source_resolution_ref: args.sourceResolutionRef,
    resolved_draft_hash: args.resolvedDraftHash,
    observable_envelope_diagnostics: buildEnvelopeDiagnostics({
      benchmarkTargetId: args.benchmarkTargetId,
      requestDraft: args.requestDraft,
    }),
    lane_diagnostics: collectLaneDiagnostics(args.response),
  };
};

const resolveBenchmarkReceiptPath = (benchmarkInputSignature: string): string =>
  path.join(
    resolveStarSimArtifactRoot(),
    "benchmarks",
    benchmarkInputSignature.replace(/^sha256:/, ""),
    "benchmark-receipt.json",
  );

const resolveBenchmarkReceiptHistoryRoot = (benchmarkInputSignature: string): string =>
  path.join(
    resolveStarSimArtifactRoot(),
    "benchmarks",
    benchmarkInputSignature.replace(/^sha256:/, ""),
    "history",
  );

const resolveBenchmarkReceiptHistoryPath = (receipt: StarSimBenchmarkReceipt): string => {
  const timestampSegment = receipt.written_at_iso.replace(/[:.]/g, "-");
  return path.join(
    resolveBenchmarkReceiptHistoryRoot(receipt.benchmark_input_signature),
    `${timestampSegment}-${receipt.receipt_stage}-${randomUUID()}.json`,
  );
};

const readBenchmarkReceiptFile = async (filePath: string): Promise<StarSimBenchmarkReceipt | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StarSimBenchmarkReceipt;
    if (parsed.schema_version !== STAR_SIM_BENCHMARK_RECEIPT_SCHEMA_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const listPriorBenchmarkReceipts = async (benchmarkTargetId: string): Promise<PersistedBenchmarkReceipt[]> => {
  const benchmarkRoot = path.join(resolveStarSimArtifactRoot(), "benchmarks");
  try {
    const signatureDirs = await fs.readdir(benchmarkRoot, { withFileTypes: true });
    const receipts: PersistedBenchmarkReceipt[] = [];
    for (const signatureDir of signatureDirs) {
      if (!signatureDir.isDirectory()) {
        continue;
      }
      const historyRoot = path.join(benchmarkRoot, signatureDir.name, "history");
      try {
        const historyEntries = await fs.readdir(historyRoot, { withFileTypes: true });
        for (const historyEntry of historyEntries) {
          if (!historyEntry.isFile() || !historyEntry.name.endsWith(".json")) {
            continue;
          }
          const absolutePath = path.join(historyRoot, historyEntry.name);
          const receipt = await readBenchmarkReceiptFile(absolutePath);
          if (!receipt || receipt.benchmark_target_id !== benchmarkTargetId) {
            continue;
          }
          receipts.push({
            receipt,
            ref: asRelative(absolutePath),
          });
        }
      } catch {
        // No history for this signature yet.
      }
    }
    return receipts;
  } catch {
    return [];
  }
};

const latestReceipt = (receipts: PersistedBenchmarkReceipt[]): PersistedBenchmarkReceipt | null =>
  receipts
    .sort((left, right) => Date.parse(right.receipt.written_at_iso) - Date.parse(left.receipt.written_at_iso))[0]
    ?? null;

const selectComparableReceipt = async (currentReceipt: StarSimBenchmarkReceipt): Promise<PersistedBenchmarkReceipt | null> => {
  const priorReceipts = await listPriorBenchmarkReceipts(currentReceipt.benchmark_target_id);
  if (priorReceipts.length === 0) {
    return null;
  }

  const sameSignature = priorReceipts.filter(
    (entry) => entry.receipt.benchmark_input_signature === currentReceipt.benchmark_input_signature,
  );
  const sameStage = priorReceipts.filter(
    (entry) => entry.receipt.receipt_stage === currentReceipt.receipt_stage,
  );

  if (currentReceipt.receipt_stage === "completed") {
    return (
      latestReceipt(
        sameSignature.filter((entry) => entry.receipt.receipt_stage === "completed"),
      )
      ?? latestReceipt(sameStage)
    );
  }

  return (
    latestReceipt(
      sameSignature.filter((entry) => entry.receipt.receipt_stage === currentReceipt.receipt_stage),
    )
    ?? latestReceipt(sameStage)
    ?? latestReceipt(sameSignature)
    ?? latestReceipt(priorReceipts)
  );
};

const sameLaneDiagnostics = (
  current: Partial<Record<RequestedLane, StarSimDiagnosticSummary>>,
  previous: Partial<Record<RequestedLane, StarSimDiagnosticSummary>>,
): boolean => hashStableJson(sortRecord(current)) === hashStableJson(sortRecord(previous));

const summarizeRepeatability = (args: {
  currentReceipt: StarSimBenchmarkReceipt;
  previousReceipt: StarSimBenchmarkReceipt;
}): StarSimBenchmarkRepeatability => {
  const driftCategories = new Set<StarSimBenchmarkDriftCategory>();
  const sameInputSignature =
    args.currentReceipt.benchmark_input_signature === args.previousReceipt.benchmark_input_signature;

  if (
    hashStableJson({
      benchmark_target_id: args.currentReceipt.benchmark_target_id,
      benchmark_target_identity_basis: args.currentReceipt.benchmark_target_identity_basis ?? null,
      identifiers_trusted: sortIdentifiers(args.currentReceipt.identifiers_trusted) ?? {},
    })
    !== hashStableJson({
      benchmark_target_id: args.previousReceipt.benchmark_target_id,
      benchmark_target_identity_basis: args.previousReceipt.benchmark_target_identity_basis ?? null,
      identifiers_trusted: sortIdentifiers(args.previousReceipt.identifiers_trusted) ?? {},
    })
  ) {
    driftCategories.add("trusted_identity_changed");
  }

  if (
    hashStableJson(sortRecord(args.currentReceipt.selected_field_origins))
    !== hashStableJson(sortRecord(args.previousReceipt.selected_field_origins))
  ) {
    driftCategories.add("selected_field_origins_changed");
  }

  if (
    hashStableJson({
      requested_lanes: orderedLanes(args.currentReceipt.requested_lanes),
      runnable_lanes: orderedLanes(args.currentReceipt.runnable_lanes),
      blocked_lanes: orderedLanes(args.currentReceipt.blocked_lanes),
      policy_used: args.currentReceipt.policy_used,
    })
    !== hashStableJson({
      requested_lanes: orderedLanes(args.previousReceipt.requested_lanes),
      runnable_lanes: orderedLanes(args.previousReceipt.runnable_lanes),
      blocked_lanes: orderedLanes(args.previousReceipt.blocked_lanes),
      policy_used: args.previousReceipt.policy_used,
    })
  ) {
    driftCategories.add("lane_plan_changed");
  }

  if (
    hashStableJson(sortArray(args.currentReceipt.blocked_reasons))
    !== hashStableJson(sortArray(args.previousReceipt.blocked_reasons))
  ) {
    driftCategories.add("blocked_reasons_changed");
  }

  if (
    hashStableJson(
      args.currentReceipt.observable_envelope_diagnostics.map((entry) => ({
        field_path: entry.field_path,
        status: entry.status,
      })),
    )
    !== hashStableJson(
      args.previousReceipt.observable_envelope_diagnostics.map((entry) => ({
        field_path: entry.field_path,
        status: entry.status,
      })),
    )
  ) {
    driftCategories.add("envelope_status_changed");
  }

  if (!sameLaneDiagnostics(args.currentReceipt.lane_diagnostics, args.previousReceipt.lane_diagnostics)) {
    driftCategories.add("diagnostic_summary_changed");
  }

  const notes: string[] = [];
  if (sameInputSignature) {
    notes.push("Compared against the most recent benchmark receipt with the same input signature.");
  } else {
    notes.push("Compared against the most recent benchmark receipt for the same benchmark target.");
  }
  if (args.currentReceipt.receipt_stage !== args.previousReceipt.receipt_stage) {
    notes.push(
      `Previous comparable receipt stage was ${args.previousReceipt.receipt_stage}; current stage is ${args.currentReceipt.receipt_stage}.`,
    );
  }

  return {
    repeatable: sameInputSignature && driftCategories.size === 0,
    same_input_signature: sameInputSignature,
    drift_categories: [...driftCategories],
    notes,
  };
};

export const buildAndPersistStarSimBenchmarkReceipt = async (args: {
  receiptStage: StarSimBenchmarkReceiptStage;
  jobId?: string | null;
  benchmarkTargetId?: string;
  benchmarkTargetMatchMode?: StarSimBenchmarkTargetMatchMode;
  benchmarkTargetConflictReason?: string;
  benchmarkTargetIdentityBasis?: StarSimBenchmarkTargetIdentityBasis;
  benchmarkTargetQualityOk?: boolean;
  identifiersObserved?: StarSimSourceIdentifiers;
  identifiersTrusted?: StarSimSourceIdentifiers;
  selectedFieldOrigins: Record<string, StarSimSourceSelectionOrigin>;
  requestedLanes: RequestedLane[];
  lanePlan: StarSimLanePlan;
  blockedReasons: string[];
  sourceCacheKey: string | null;
  sourceResolutionRef: string | null;
  resolvedDraftHash: string | null;
  requestDraft: StarSimRequest | null | undefined;
  response?: StarSimResponse | null;
}): Promise<{
  benchmark_receipt: StarSimBenchmarkReceipt;
  benchmark_receipt_ref: string;
  benchmark_input_signature: string;
  previous_benchmark_receipt_ref: string | null;
  benchmark_repeatability?: StarSimBenchmarkRepeatability;
} | null> => {
  const receipt = buildStarSimBenchmarkReceipt(args);
  if (!receipt) {
    return null;
  }
  const previousReceipt = await selectComparableReceipt(receipt);
  const benchmarkRepeatability = previousReceipt
    ? summarizeRepeatability({
        currentReceipt: receipt,
        previousReceipt: previousReceipt.receipt,
      })
    : undefined;
  const receiptPath = resolveBenchmarkReceiptPath(receipt.benchmark_input_signature);
  const historyPath = resolveBenchmarkReceiptHistoryPath(receipt);
  await writeJsonAtomic(receiptPath, receipt);
  await writeJsonAtomic(historyPath, receipt);
  return {
    benchmark_receipt: receipt,
    benchmark_receipt_ref: asRelative(receiptPath),
    benchmark_input_signature: receipt.benchmark_input_signature,
    previous_benchmark_receipt_ref: previousReceipt?.ref ?? null,
    benchmark_repeatability: benchmarkRepeatability,
  };
};
