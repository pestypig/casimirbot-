import fs from "node:fs/promises";
import path from "node:path";
import type {
  AgiDatasetExport,
  AgiGateReport,
  AgiTrajectory,
} from "@shared/agi-refinery";
import type { TrainingTraceRecord } from "@shared/schema";
import { sha256Prefixed } from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";
import { getTrainingTraceExport, recordTrainingTrace } from "../observability/training-trace-store";
import { surfaceKey } from "./refinery-axes";
import { evaluateTrajectoryGates } from "./refinery-gates";
import { loadHoldoutIds } from "./refinery-holdout";

export type RefineryExportOptions = {
  limit?: number;
  tenantId?: string;
  outDir?: string;
  realRatio?: number;
  syntheticRatio?: number;
  minAlpha?: number;
  enforceGates?: boolean;
  requireNoUnknownExecution?: boolean;
  minClientShare?: number;
  minServerShare?: number;
  minClientServerShare?: number;
  maxDocsSharedShare?: number;
  negativesPerSample?: number;
  emitTrace?: boolean;
  variantReservoirPath?: string;
};

type DatasetPair = {
  id: string;
  x: string;
  E: AgiTrajectory["E"];
  y_pos: AgiTrajectory["y"];
  y_neg: AgiTrajectory["y"];
  meta?: Record<string, unknown>;
};

type DpoNegativeCandidate = {
  key: string;
  y: AgiTrajectory["y"];
  meta: Record<string, unknown>;
};

type MixResult = {
  selected: AgiTrajectory[];
  realRatio?: number;
  syntheticRatio?: number;
  alphaAvailable?: number;
  alphaTarget?: number;
  maxAtTargetAlpha?: number;
};

const trajectoryKey = (trajectory: AgiTrajectory): string =>
  trajectory.traceId ?? trajectory.id;

const buildPairId = (trajectory: AgiTrajectory, negKey: string): string =>
  sha256Prefixed(
    stableJsonStringify({
      x: trajectory.x,
      pos: trajectory.id,
      neg: negKey,
    }),
  );

const firstGateFailure = (report: AgiGateReport): string | undefined => {
  const failed = report.gates.find((gate) => !gate.pass);
  return failed ? failed.reason ?? failed.name : undefined;
};

const cloneTrajectory = (
  trajectory: AgiTrajectory,
  y: AgiTrajectory["y"],
): AgiTrajectory => ({
  ...trajectory,
  y,
  meta: trajectory.meta ? { ...trajectory.meta } : undefined,
});

const extractPayload = (
  traces: TrainingTraceRecord[],
): {
  trajectories: Map<string, AgiTrajectory>;
  gates: Map<string, AgiGateReport>;
} => {
  const trajectories = new Map<string, AgiTrajectory>();
  const gates = new Map<string, AgiGateReport>();
  for (const trace of traces) {
    if (!trace.payload) continue;
    if (trace.payload.kind === "trajectory") {
      const data = trace.payload.data as AgiTrajectory;
      trajectories.set(trajectoryKey(data), data);
    } else if (trace.payload.kind === "trajectory_gates") {
      const data = trace.payload.data as AgiGateReport;
      const key = data.traceId ?? data.trajectoryId ?? trace.traceId ?? trace.id;
      if (key) {
        gates.set(key, data);
      }
    }
  }
  return { trajectories, gates };
};

const clampRatio = (value: number): number => Math.min(Math.max(value, 0), 1);

const parseRatio = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return clampRatio(parsed);
};

const parseRatioWithDefault = (value: string | undefined, fallback: number): number => {
  const parsed = parseRatio(value);
  return parsed === undefined ? fallback : parsed;
};

const parseOptionalPositiveNumber = (
  value: string | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
};

const resolveReservoirMaxAgeMs = (): number | undefined => {
  const days = parseOptionalPositiveNumber(
    process.env.AGI_REFINERY_VARIANT_RESERVOIR_MAX_AGE_DAYS,
  );
  if (days === undefined) return undefined;
  return days * 24 * 60 * 60 * 1000;
};

const resolveTargetRealRatio = (options?: RefineryExportOptions): number | undefined => {
  if (options?.realRatio !== undefined) return clampRatio(options.realRatio);
  if (options?.syntheticRatio !== undefined) {
    return 1 - clampRatio(options.syntheticRatio);
  }
  return parseRatio(process.env.AGI_REFINERY_ALPHA_TARGET);
};

const computeMaxAtTargetAlpha = (
  alphaTarget: number,
  realCount: number,
  syntheticCount: number,
): number => {
  if (alphaTarget <= 0) return syntheticCount;
  if (alphaTarget >= 1) return realCount;
  const maxByReal = realCount / alphaTarget;
  const maxBySynthetic = syntheticCount / (1 - alphaTarget);
  return Math.floor(Math.min(maxByReal, maxBySynthetic));
};

const applyMixRatio = (
  accepted: AgiTrajectory[],
  realRatio?: number,
  syntheticRatio?: number,
): MixResult => {
  const real = accepted.filter((item) => item.meta?.origin !== "variant");
  const synthetic = accepted.filter((item) => item.meta?.origin === "variant");
  const total = accepted.length;
  const alphaAvailable = total ? real.length / total : undefined;
  const takeRecent = <T,>(items: T[], count: number): T[] => {
    if (count <= 0) return [];
    return items.slice(-count);
  };
  if (realRatio === undefined && syntheticRatio === undefined) {
    return {
      selected: accepted,
      realRatio: alphaAvailable,
      syntheticRatio: total ? synthetic.length / total : undefined,
      alphaAvailable,
    };
  }
  const targetRealRatio =
    realRatio !== undefined
      ? clampRatio(realRatio)
      : syntheticRatio !== undefined
        ? 1 - clampRatio(syntheticRatio)
        : 0;
  const alphaTarget = targetRealRatio;
  const maxAtTargetAlpha = computeMaxAtTargetAlpha(
    targetRealRatio,
    real.length,
    synthetic.length,
  );
  let selectedRealCount = 0;
  let selectedSyntheticCount = 0;
  if (targetRealRatio <= 0) {
    selectedSyntheticCount = synthetic.length;
  } else if (targetRealRatio >= 1) {
    selectedRealCount = real.length;
  } else {
    const maxByReal = real.length / targetRealRatio;
    const maxBySynthetic = synthetic.length / (1 - targetRealRatio);
    if (maxByReal <= maxBySynthetic) {
      selectedRealCount = real.length;
      selectedSyntheticCount = Math.min(
        synthetic.length,
        Math.floor((real.length * (1 - targetRealRatio)) / targetRealRatio),
      );
    } else {
      selectedSyntheticCount = synthetic.length;
      selectedRealCount = Math.min(
        real.length,
        Math.floor((synthetic.length * targetRealRatio) / (1 - targetRealRatio)),
      );
    }
  }
  const selected = [
    ...takeRecent(real, selectedRealCount),
    ...takeRecent(synthetic, selectedSyntheticCount),
  ];
  const ratioReal = selected.length ? selectedRealCount / selected.length : 0;
  return {
    selected,
    realRatio: ratioReal,
    syntheticRatio: selected.length ? 1 - ratioReal : 0,
    alphaAvailable,
    alphaTarget,
    maxAtTargetAlpha,
  };
};

const isExecutionUnknown = (trajectory: AgiTrajectory): boolean => {
  if (trajectory.meta?.executionOk !== false) return false;
  const errorTypes = trajectory.meta?.executionErrorTypes ?? [];
  if (errorTypes.length === 0) return true;
  return errorTypes.some((entry) => entry.toLowerCase().includes("unknown"));
};

const computeSurfaceShares = (items: AgiTrajectory[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = surfaceKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = items.length || 1;
  const shares: Record<string, number> = {};
  for (const [key, count] of Object.entries(counts)) {
    shares[key] = count / total;
  }
  return shares;
};

const buildSftRecord = (trajectory: AgiTrajectory): Record<string, unknown> => ({
  id: trajectory.id,
  traceId: trajectory.traceId,
  x: trajectory.x,
  z: trajectory.z ?? null,
  s: trajectory.s ?? null,
  q: trajectory.q ?? [],
  E: trajectory.E ?? [],
  y: trajectory.y ?? null,
  meta: trajectory.meta ?? null,
});

const buildSyntheticNegatives = (
  pos: AgiTrajectory,
): DpoNegativeCandidate[] => {
  if (!pos.y) return [];
  const seed = pos.id.slice(0, 8);
  const base = pos.y ?? {};
  const fakeRef = `nonexistent/dpo-${seed}.txt`;
  const candidates = [
    {
      key: "unlinked_citations",
      y: { ...base, citations: [fakeRef] },
    },
    {
      key: "missing_citations",
      y: { ...base, citations: [] },
    },
  ];
  const negatives: DpoNegativeCandidate[] = [];
  for (const candidate of candidates) {
    const gateReport = evaluateTrajectoryGates(
      cloneTrajectory(pos, candidate.y),
    );
    if (gateReport.accepted) continue;
    negatives.push({
      key: candidate.key,
      y: candidate.y,
      meta: {
        negSource: "synthetic",
        negKind: candidate.key,
        negGate: firstGateFailure(gateReport) ?? "failed_gate",
      },
    });
  }
  return negatives;
};

const buildDpoPairs = (
  accepted: AgiTrajectory[],
  rejected: AgiTrajectory[],
  negativesPerSample = 1,
): DatasetPair[] => {
  if (negativesPerSample <= 0) return [];
  const pairs: DatasetPair[] = [];
  const rejectedByX = new Map<string, AgiTrajectory[]>();
  for (const item of rejected) {
    rejectedByX.set(item.x, [...(rejectedByX.get(item.x) ?? []), item]);
  }
  for (const pos of accepted) {
    if (!pos.y) continue;
    let remaining = negativesPerSample;
    let negIndex = 0;
    const candidates = rejectedByX.get(pos.x) ?? [];
    for (const neg of candidates) {
      if (!neg.y) continue;
      const negKey = neg.traceId ?? neg.id ?? `rejected-${negIndex}`;
      pairs.push({
        id: buildPairId(pos, negKey),
        x: pos.x,
        E: pos.E ?? [],
        y_pos: pos.y ?? undefined,
        y_neg: neg.y ?? undefined,
        meta: {
          posTraceId: pos.traceId,
          posOrigin: pos.meta?.origin,
          negTraceId: neg.traceId,
          negOrigin: neg.meta?.origin,
          negSource: "rejected",
          negIndex,
        },
      });
      negIndex += 1;
      remaining -= 1;
      if (remaining <= 0) break;
    }
    if (remaining <= 0) continue;
    const synthetic = buildSyntheticNegatives(pos);
    for (const neg of synthetic) {
      const negKey = `${neg.key}-${negIndex}`;
      pairs.push({
        id: buildPairId(pos, negKey),
        x: pos.x,
        E: pos.E ?? [],
        y_pos: pos.y ?? undefined,
        y_neg: neg.y ?? undefined,
        meta: {
          posTraceId: pos.traceId,
          posOrigin: pos.meta?.origin,
          negSource: neg.meta.negSource,
          negKind: neg.meta.negKind,
          negGate: neg.meta.negGate,
          negIndex,
        },
      });
      negIndex += 1;
      remaining -= 1;
      if (remaining <= 0) break;
    }
  }
  return pairs;
};

const resolveReservoirPath = (
  options: RefineryExportOptions | undefined,
  outDir: string,
): string | undefined => {
  if (options?.variantReservoirPath === "") return undefined;
  if (options?.variantReservoirPath) return options.variantReservoirPath;
  const envPath = process.env.AGI_REFINERY_VARIANT_RESERVOIR_PATH;
  if (envPath === "0") return undefined;
  if (envPath) return envPath;
  return path.join(outDir, "agi-refinery-variant-reservoir.jsonl");
};

const loadReservoirCandidates = async (
  filePath: string,
  excludeIds: Set<string>,
  maxAgeMs: number | undefined,
): Promise<{ items: AgiTrajectory[]; available: number }> => {
  try {
    const payload = await fs.readFile(filePath, "utf8");
    const now = Date.now();
    const entries: Array<{ item: AgiTrajectory; createdAtMs: number }> = [];
    for (const line of payload.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as AgiTrajectory;
        const key = trajectoryKey(parsed);
        if (!key || excludeIds.has(key)) continue;
        if (parsed.meta?.origin !== "variant") continue;
        const createdAtMs = Number.isFinite(Date.parse(parsed.createdAt))
          ? Date.parse(parsed.createdAt)
          : 0;
        if (maxAgeMs !== undefined && createdAtMs > 0) {
          if (now - createdAtMs > maxAgeMs) continue;
        }
        entries.push({ item: parsed, createdAtMs });
      } catch {
        continue;
      }
    }
    entries.sort((a, b) => a.createdAtMs - b.createdAtMs);
    return { items: entries.map((entry) => entry.item), available: entries.length };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if ((error as { code?: string }).code === "ENOENT") {
        return { items: [], available: 0 };
      }
    }
    throw error;
  }
};

const loadReservoirIds = async (filePath: string): Promise<Set<string>> => {
  try {
    const payload = await fs.readFile(filePath, "utf8");
    const ids = new Set<string>();
    for (const line of payload.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as { id?: string; traceId?: string };
        const key = parsed.traceId ?? parsed.id;
        if (key) ids.add(key);
      } catch {
        continue;
      }
    }
    return ids;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if ((error as { code?: string }).code === "ENOENT") return new Set();
    }
    throw error;
  }
};

const appendToReservoir = async (
  filePath: string,
  items: AgiTrajectory[],
): Promise<number> => {
  if (items.length === 0) return 0;
  const existingIds = await loadReservoirIds(filePath);
  const lines: string[] = [];
  let added = 0;
  for (const item of items) {
    const key = trajectoryKey(item);
    if (!key || existingIds.has(key)) continue;
    existingIds.add(key);
    lines.push(JSON.stringify(item));
    added += 1;
  }
  if (lines.length === 0) return 0;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${lines.join("\n")}\n`, "utf8");
  return added;
};

export const exportRefineryDataset = async (
  options?: RefineryExportOptions,
): Promise<AgiDatasetExport> => {
  const traces = getTrainingTraceExport({
    limit: options?.limit,
    tenantId: options?.tenantId,
  });
  const { trajectories, gates } = extractPayload(traces);
  const holdoutIds = await loadHoldoutIds();
  const accepted: AgiTrajectory[] = [];
  const rejected: AgiTrajectory[] = [];
  let executionUnknownCount = 0;
  for (const trajectory of trajectories.values()) {
    if (
      holdoutIds.size > 0 &&
      (holdoutIds.has(trajectory.id) ||
        (trajectory.traceId && holdoutIds.has(trajectory.traceId)))
    ) {
      continue;
    }
    if (isExecutionUnknown(trajectory)) {
      executionUnknownCount += 1;
    }
    const key = trajectoryKey(trajectory);
    const gateReport = gates.get(key) ?? evaluateTrajectoryGates(trajectory);
    if (gateReport.accepted) {
      accepted.push(trajectory);
    } else {
      rejected.push(trajectory);
    }
  }
  const realCount = accepted.filter((item) => item.meta?.origin !== "variant").length;
  const alphaRun = accepted.length > 0 ? realCount / accepted.length : 0;
  const outDir =
    options?.outDir ?? process.env.AGI_REFINERY_EXPORT_DIR ?? "artifacts";
  const targetRealRatio = resolveTargetRealRatio(options);
  const reservoirPath = resolveReservoirPath(options, outDir);
  const currentSyntheticCount = accepted.length - realCount;
  const maxSyntheticAtTarget =
    targetRealRatio !== undefined && targetRealRatio > 0 && targetRealRatio < 1
      ? Math.floor((realCount * (1 - targetRealRatio)) / targetRealRatio)
      : 0;
  const desiredTotal =
    targetRealRatio !== undefined && targetRealRatio > 0 && targetRealRatio < 1
      ? options?.limit ?? realCount + maxSyntheticAtTarget
      : options?.limit ?? accepted.length;
  const desiredSynthetic =
    targetRealRatio !== undefined && targetRealRatio > 0 && targetRealRatio < 1
      ? Math.min(maxSyntheticAtTarget, Math.max(0, desiredTotal - realCount))
      : 0;
  const reservoirNeeded = Math.max(0, desiredSynthetic - currentSyntheticCount);
  let reservoirUsed = 0;
  let reservoirAvailable = 0;
  let reservoirSample: AgiTrajectory[] = [];
  if (reservoirPath && reservoirNeeded > 0) {
    const excludeIds = new Set<string>(holdoutIds);
    for (const item of accepted) {
      const key = trajectoryKey(item);
      if (key) excludeIds.add(key);
    }
    const maxAgeMs = resolveReservoirMaxAgeMs();
    const reservoir = await loadReservoirCandidates(
      reservoirPath,
      excludeIds,
      maxAgeMs,
    );
    reservoirAvailable = reservoir.available;
    if (reservoir.items.length > 0) {
      reservoirSample = reservoir.items.slice(-reservoirNeeded);
    }
  }
  const reservoirIds = new Set(
    reservoirSample.map((item) => trajectoryKey(item)).filter(Boolean) as string[],
  );
  const mixSource =
    reservoirSample.length > 0 ? [...reservoirSample, ...accepted] : accepted;
  const mixResult = applyMixRatio(
    mixSource,
    targetRealRatio,
    options?.syntheticRatio,
  );
  const filteredAccepted = mixResult.selected;
  if (reservoirIds.size > 0) {
    for (const item of filteredAccepted) {
      const key = trajectoryKey(item);
      if (key && reservoirIds.has(key)) reservoirUsed += 1;
    }
  }
  const surfaceShares = computeSurfaceShares(filteredAccepted);
  const minAlpha = options?.minAlpha ?? parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_ALPHA,
    0.25,
  );
  const minClientShare = options?.minClientShare ?? parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_CLIENT_SHARE,
    0.25,
  );
  const minServerShare = options?.minServerShare ?? parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_SERVER_SHARE,
    0.25,
  );
  const minClientServerShare = options?.minClientServerShare ?? parseRatioWithDefault(
    process.env.AGI_REFINERY_MIN_CLIENT_SERVER_SHARE,
    0.5,
  );
  const maxDocsSharedShare = options?.maxDocsSharedShare ?? parseRatioWithDefault(
    process.env.AGI_REFINERY_MAX_DOCS_SHARED_SHARE,
    0.5,
  );
  const requireNoUnknown =
    options?.requireNoUnknownExecution ??
    process.env.AGI_REFINERY_REQUIRE_NO_EXECUTION_UNKNOWN !== "0";
  const enforceGates =
    options?.enforceGates ??
    process.env.AGI_REFINERY_EXPORT_ENFORCE !== "0";
  const desiredCount = options?.limit ?? accepted.length;
  const alphaShortfall =
    mixResult.alphaTarget !== undefined
      ? Math.max(
          0,
          Math.ceil(mixResult.alphaTarget * desiredCount) -
            realCount,
        )
      : undefined;
  const clientShare = surfaceShares.client ?? 0;
  const serverShare = surfaceShares.server ?? 0;
  const docsShare = surfaceShares.docs ?? 0;
  const sharedShare = surfaceShares.shared ?? 0;
  const clientServerShare = clientShare + serverShare;
  const docsSharedShare = docsShare + sharedShare;
  const blockers: string[] = [];
  if (requireNoUnknown && executionUnknownCount > 0) {
    blockers.push("execution_unknown_error");
  }
  if (minAlpha > 0 && (mixResult.realRatio ?? 0) < minAlpha) {
    blockers.push("alpha_below_min");
  }
  if (
    mixResult.alphaTarget !== undefined &&
    mixResult.maxAtTargetAlpha !== undefined &&
    options?.limit !== undefined &&
    desiredCount > mixResult.maxAtTargetAlpha
  ) {
    blockers.push("alpha_shortfall");
  }
  if (minClientShare > 0 && clientShare < minClientShare) {
    blockers.push("coverage_min_client");
  }
  if (minServerShare > 0 && serverShare < minServerShare) {
    blockers.push("coverage_min_server");
  }
  if (minClientServerShare > 0 && clientServerShare < minClientServerShare) {
    blockers.push("coverage_min_client_server");
  }
  if (maxDocsSharedShare > 0 && docsSharedShare > maxDocsSharedShare) {
    blockers.push("coverage_max_docs_shared");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const sftPath = path.join(outDir, `agi-refinery-sft.${stamp}.jsonl`);
  const dpoPath = path.join(outDir, `agi-refinery-dpo.${stamp}.jsonl`);
  const shouldExport = !enforceGates || blockers.length === 0;
  let dpoPairs: DatasetPair[] = [];
  const selectedIds = new Set(filteredAccepted.map((item) => trajectoryKey(item)));
  const overflowVariants = accepted.filter(
    (item) =>
      item.meta?.origin === "variant" &&
      !selectedIds.has(trajectoryKey(item)),
  );
  const reservoirAdded =
    reservoirPath && overflowVariants.length > 0
      ? await appendToReservoir(reservoirPath, overflowVariants)
      : 0;
  if (shouldExport) {
    await fs.mkdir(outDir, { recursive: true });
    const sftLines = filteredAccepted.map((item) =>
      JSON.stringify(buildSftRecord(item)),
    );
    await fs.writeFile(sftPath, `${sftLines.join("\n")}\n`, "utf8");
    dpoPairs = buildDpoPairs(
      filteredAccepted,
      rejected,
      options?.negativesPerSample ?? 1,
    );
    const dpoLines = dpoPairs.map((pair) => JSON.stringify(pair));
    await fs.writeFile(dpoPath, `${dpoLines.join("\n")}\n`, "utf8");
  }

  const exportSummary: AgiDatasetExport = {
    createdAt: new Date().toISOString(),
    total: trajectories.size,
    accepted: filteredAccepted.length,
    rejected: rejected.length,
    realRatio: mixResult.realRatio,
    syntheticRatio: mixResult.syntheticRatio,
    alphaAvailable: mixResult.alphaAvailable,
    alphaTarget: mixResult.alphaTarget,
    maxAtTargetAlpha: mixResult.maxAtTargetAlpha,
    alphaShortfall,
    minAlpha,
    alphaRun,
    alphaExport: mixResult.realRatio,
    variantReservoirPath: reservoirPath,
    variantReservoirAdded: reservoirAdded,
    variantReservoirUsed: reservoirUsed,
    variantReservoirAvailable: reservoirAvailable,
    executionUnknownCount,
    surfaceShares,
    surfaceMinimums: {
      client: minClientShare,
      server: minServerShare,
    },
    surfaceMaximums: {
      docs_shared: maxDocsSharedShare,
    },
    minClientServerShare,
    maxDocsSharedShare,
    blocked: shouldExport ? undefined : true,
    blockedReasons: blockers.length > 0 ? blockers : undefined,
    sftPath: shouldExport ? sftPath : undefined,
    dpoPath: shouldExport ? dpoPath : undefined,
    dpoPairs: dpoPairs.length,
    dpoDensity:
      filteredAccepted.length > 0 ? dpoPairs.length / filteredAccepted.length : 0,
  };

  if (options?.emitTrace !== false) {
    recordTrainingTrace({
      pass: shouldExport,
      deltas: [],
      metrics: {
        dataset_total: exportSummary.total,
        dataset_accepted: exportSummary.accepted,
        dataset_dpo_pairs: dpoPairs.length,
        dataset_dpo_density: exportSummary.dpoDensity ?? 0,
      },
      source: { system: "agi-refinery", component: "export", tool: "dataset" },
      payload: { kind: "dataset_export", data: exportSummary },
      notes: shouldExport
        ? [`sft=${sftPath}`, `dpo=${dpoPath}`]
        : blockers.map((reason) => `blocked:${reason}`),
    });
  }

  return exportSummary;
};
