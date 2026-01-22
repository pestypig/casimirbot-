import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AgiGateReport, AgiTrajectory } from "@shared/agi-refinery";
import type { TrainingTraceRecord } from "@shared/schema";
import { assessGrounding, evaluateTrajectoryGates } from "./refinery-gates";
import {
  difficultyKey,
  intentKey,
  strategyKey,
  surfaceKey,
} from "./refinery-axes";
import { normalizeEvidenceRef } from "./refinery-identity";

export type HoldoutEntry = {
  id: string;
  traceId?: string;
  createdAt?: string;
  intent?: string;
  strategy?: string;
  difficulty?: string;
  surface?: string;
};

export type HoldoutSet = {
  version: 1;
  createdAt: string;
  entries: HoldoutEntry[];
};

export type HoldoutBuildOptions = {
  ratio?: number;
  minPerIntent?: number;
  maxTotal?: number;
  recentFraction?: number;
};

export type CoverageHoldoutBuildOptions = HoldoutBuildOptions & {
  minPerSurface?: number;
  minPerDifficulty?: number;
};

export type HoldoutMetrics = {
  createdAt: string;
  total: number;
  n_total: number;
  n_with_gold: number;
  n_gold_in_index: number;
  n_gold_in_candidates: number;
  n_gold_selected: number;
  n_gold_cited: number;
  accepted: number;
  acceptanceRate: number;
  groundednessFailRate: number;
  precision: number;
  recall: number;
  attributionPrecision: number;
  attributionRecall: number;
  citationPrecision: number;
  citationRecall: number;
  citationRecallCount: number;
  evidenceRecallCandidate: number;
  candidateRecall: number;
  candidateRecallAvg: number;
  candidateRecallCount: number;
  evidenceRecallSelected: number;
  selectedRecall: number;
  selectedRecallAvg: number;
  selectedRecallCount: number;
  hintRecall: number;
  hintCandidateRecall: number;
  hintCandidateRecallCount: number;
  hintSelectedRecall: number;
  hintSelectedRecallCount: number;
  hintRecallCount: number;
  hintUsedInCitations: number;
  hintUsedInCitationsCount: number;
  refusalRate: number;
  clarifyRate: number;
  latencyMsAvg: number;
  latencyMsP50: number;
  latencyMsP95: number;
  latencyMsP99: number;
  latencyMsCount: number;
  byIntent?: Record<string, number>;
  byStrategy?: Record<string, number>;
  byDifficulty?: Record<string, number>;
  bySurface?: Record<string, number>;
  acceptanceByIntent?: Record<string, number>;
  acceptanceByStrategy?: Record<string, number>;
  acceptanceByDifficulty?: Record<string, number>;
  acceptanceBySurface?: Record<string, number>;
};

export const DEFAULT_HOLDOUT_PATH =
  process.env.AGI_REFINERY_HOLDOUT_PATH ??
  path.resolve(process.cwd(), "artifacts", "agi-refinery-holdout.json");
export const DEFAULT_COVERAGE_HOLDOUT_PATH =
  process.env.AGI_REFINERY_COVERAGE_HOLDOUT_PATH ??
  path.resolve(
    process.cwd(),
    "artifacts",
    "agi-refinery-holdout-coverage.json",
  );

const holdoutEntrySchema = z.object({
  id: z.string(),
  traceId: z.string().optional(),
  createdAt: z.string().optional(),
  intent: z.string().optional(),
  strategy: z.string().optional(),
  difficulty: z.string().optional(),
  surface: z.string().optional(),
});

const holdoutSetSchema = z.object({
  version: z.literal(1),
  createdAt: z.string(),
  entries: z.array(holdoutEntrySchema),
});

const refusalPattern =
  /\b(can't|cannot|unable to|not able to|won't|refuse|policy|not permitted|cannot comply|disallowed)\b/i;
const clarifyPattern =
  /\b(need more information|could you provide|can you provide|clarify|more details|please specify|what exactly)\b/i;

const trajectoryKey = (trajectory: AgiTrajectory): string =>
  trajectory.traceId ?? trajectory.id;

const collectHintPaths = (trajectory: AgiTrajectory): string[] =>
  (trajectory.meta?.resourceHints ?? [])
    .map((hint) => normalizeEvidenceRef(hint))
    .filter((hint): hint is string => Boolean(hint));
const collectCitationPaths = (trajectory: AgiTrajectory): string[] =>
  (trajectory.y?.citations ?? [])
    .map((citation) => normalizeEvidenceRef(String(citation)))
    .filter((citation): citation is string => Boolean(citation));

const collectCandidatePaths = (trajectory: AgiTrajectory): string[] => {
  const paths: string[] = [];
  for (const item of trajectory.meta?.retrievalCandidates ?? []) {
    const normalized = normalizeEvidenceRef(item.path);
    if (normalized) paths.push(normalized);
  }
  return paths.filter(Boolean);
};

const collectSelectedPaths = (trajectory: AgiTrajectory): string[] => {
  const paths: string[] = [];
  for (const item of trajectory.meta?.retrievalSelected ?? []) {
    const normalized = normalizeEvidenceRef(item.path);
    if (normalized) paths.push(normalized);
  }
  return paths.filter(Boolean);
};

const collectEvidencePaths = (trajectory: AgiTrajectory): string[] => {
  const paths: string[] = [];
  for (const item of trajectory.E ?? []) {
    const normalized = normalizeEvidenceRef(item.path);
    if (normalized) paths.push(normalized);
  }
  return paths.filter(Boolean);
};

const collectRetrievalPaths = (trajectory: AgiTrajectory): string[] => {
  const paths: string[] = [];
  for (const item of trajectory.meta?.retrievalCandidates ?? []) {
    const normalized = normalizeEvidenceRef(item.path);
    if (normalized) paths.push(normalized);
  }
  for (const item of trajectory.meta?.retrievalSelected ?? []) {
    const normalized = normalizeEvidenceRef(item.path);
    if (normalized) paths.push(normalized);
  }
  return paths.filter(Boolean);
};

const hintMatches = (hint: string, path: string): boolean =>
  path === hint || path.endsWith(hint);

const parseTimestamp = (value?: string): number => {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

const normalizeLatencyMs = (value?: number): number | null => {
  if (!Number.isFinite(value as number)) return null;
  const normalized = Math.max(0, Math.floor(value as number));
  return Number.isFinite(normalized) ? normalized : null;
};

const sumExecutionEnvelopes = (trajectory: AgiTrajectory): number | null => {
  const envelopes = trajectory.meta?.executionEnvelopes;
  if (!envelopes || envelopes.length === 0) return null;
  let total = 0;
  let hasValue = false;
  for (const envelope of envelopes) {
    const duration = normalizeLatencyMs(envelope.durationMs);
    if (duration === null) continue;
    total += duration;
    hasValue = true;
  }
  return hasValue ? total : null;
};

const resolveLatencyMs = (trajectory: AgiTrajectory): number | null => {
  const duration = normalizeLatencyMs(trajectory.meta?.durationMs);
  if (duration !== null) return duration;
  const envelopeTotal = sumExecutionEnvelopes(trajectory);
  if (envelopeTotal !== null) return envelopeTotal;
  const completion = normalizeLatencyMs(trajectory.meta?.completionLatencyMs);
  if (completion !== null) return completion;
  return null;
};

const percentile = (sorted: number[], quantile: number): number => {
  if (sorted.length === 0) return 0;
  const clamped = Math.min(Math.max(quantile, 0), 1);
  const idx = (sorted.length - 1) * clamped;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
};

const recordCount = (counter: Record<string, number>, key: string): void => {
  counter[key] = (counter[key] ?? 0) + 1;
};

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

export const extractHoldoutPayload = extractPayload;

export const buildHoldoutSet = (
  trajectories: AgiTrajectory[],
  options?: HoldoutBuildOptions,
): HoldoutSet => {
  const ratio = options?.ratio ?? 0.1;
  const minPerIntent = Math.max(1, options?.minPerIntent ?? 3);
  const total = trajectories.length;
  const target = Math.max(1, Math.ceil(total * ratio));
  const maxTotal = Math.min(options?.maxTotal ?? target, total);
  const recentFraction = options?.recentFraction ?? 0.3;
  const sorted = [...trajectories].sort(
    (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
  );
  const recentCount = Math.min(
    sorted.length,
    Math.max(maxTotal, Math.ceil(sorted.length * recentFraction)),
  );
  const recent = sorted.slice(-recentCount);

  const intentGroups = new Map<string, AgiTrajectory[]>();
  for (const entry of recent) {
    const key = intentKey(entry.z);
    intentGroups.set(key, [...(intentGroups.get(key) ?? []), entry]);
  }
  const intentCount = intentGroups.size || 1;
  const perIntent = Math.max(1, Math.min(minPerIntent, Math.floor(maxTotal / intentCount)));
  const selected = new Map<string, AgiTrajectory>();

  const addSelection = (item: AgiTrajectory): void => {
    const key = trajectoryKey(item);
    if (!selected.has(key)) {
      selected.set(key, item);
    }
  };

  for (const items of intentGroups.values()) {
    const sortedGroup = [...items].sort(
      (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
    );
    const slice = sortedGroup.slice(-perIntent);
    slice.forEach(addSelection);
  }

  const surfaces = new Set<string>(
    Array.from(selected.values()).map((item) => surfaceKey(item)),
  );
  const surfaceGroups = new Map<string, AgiTrajectory[]>();
  for (const entry of sorted) {
    const key = surfaceKey(entry);
    surfaceGroups.set(key, [...(surfaceGroups.get(key) ?? []), entry]);
  }
  for (const [surface, items] of surfaceGroups) {
    if (selected.size >= maxTotal) break;
    if (surfaces.has(surface)) continue;
    const sortedGroup = [...items].sort(
      (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
    );
    const pick = sortedGroup[sortedGroup.length - 1];
    if (pick) {
      addSelection(pick);
      surfaces.add(surface);
    }
  }

  const fillFrom = (list: AgiTrajectory[]): void => {
    for (let idx = list.length - 1; idx >= 0 && selected.size < maxTotal; idx -= 1) {
      addSelection(list[idx]);
    }
  };
  fillFrom(recent);
  fillFrom(sorted);

  const entries: HoldoutEntry[] = Array.from(selected.values()).map((item) => ({
    id: item.id,
    traceId: item.traceId,
    createdAt: item.createdAt,
    intent: intentKey(item.z),
    strategy: strategyKey(item),
    difficulty: difficultyKey(item),
    surface: surfaceKey(item),
  }));

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    entries,
  };
};

export const buildCoverageHoldoutSet = (
  trajectories: AgiTrajectory[],
  options?: CoverageHoldoutBuildOptions,
): HoldoutSet => {
  const ratio = options?.ratio ?? 0.1;
  const minPerIntent = Math.max(1, options?.minPerIntent ?? 1);
  const minPerSurface = Math.max(1, options?.minPerSurface ?? 1);
  const minPerDifficulty = Math.max(1, options?.minPerDifficulty ?? 1);
  const total = trajectories.length;
  const target = Math.max(1, Math.ceil(total * ratio));
  const maxTotal = Math.min(options?.maxTotal ?? target, total);
  const recentFraction = options?.recentFraction ?? 0.3;
  const sorted = [...trajectories].sort(
    (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
  );
  const recentCount = Math.min(
    sorted.length,
    Math.max(maxTotal, Math.ceil(sorted.length * recentFraction)),
  );
  const recent = sorted.slice(-recentCount);
  const selected = new Map<string, AgiTrajectory>();

  const addSelection = (item: AgiTrajectory): void => {
    if (selected.size >= maxTotal) return;
    const key = trajectoryKey(item);
    if (!selected.has(key)) {
      selected.set(key, item);
    }
  };

  const addCoverage = (
    items: AgiTrajectory[],
    keyFn: (item: AgiTrajectory) => string,
    minPerGroup: number,
  ): void => {
    if (selected.size >= maxTotal) return;
    const groups = new Map<string, AgiTrajectory[]>();
    for (const entry of items) {
      const key = keyFn(entry);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    const counts = new Map<string, number>();
    for (const entry of selected.values()) {
      const key = keyFn(entry);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [key, group] of groups) {
      if (selected.size >= maxTotal) break;
      const current = counts.get(key) ?? 0;
      if (current >= minPerGroup) continue;
      const sortedGroup = [...group].sort(
        (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
      );
      const needed = minPerGroup - current;
      const slice = sortedGroup.slice(-needed);
      for (const item of slice) {
        if (selected.size >= maxTotal) break;
        addSelection(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  };

  addCoverage(recent, (entry) => intentKey(entry.z), minPerIntent);
  addCoverage(sorted, (entry) => intentKey(entry.z), minPerIntent);
  addCoverage(recent, surfaceKey, minPerSurface);
  addCoverage(sorted, surfaceKey, minPerSurface);
  addCoverage(recent, difficultyKey, minPerDifficulty);
  addCoverage(sorted, difficultyKey, minPerDifficulty);

  const fillBalancedBySurface = (list: AgiTrajectory[]): void => {
    if (selected.size >= maxTotal) return;
    const groups = new Map<string, AgiTrajectory[]>();
    for (const entry of list) {
      const key = surfaceKey(entry);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    const queues = Array.from(groups.values()).map((group) =>
      [...group].sort(
        (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
      ),
    );
    let progressed = true;
    while (selected.size < maxTotal && progressed) {
      progressed = false;
      for (const queue of queues) {
        if (selected.size >= maxTotal) break;
        while (queue.length > 0) {
          const candidate = queue.pop();
          if (!candidate) break;
          const key = trajectoryKey(candidate);
          if (selected.has(key)) continue;
          addSelection(candidate);
          progressed = true;
          break;
        }
      }
    }
  };
  fillBalancedBySurface(sorted);

  const entries: HoldoutEntry[] = Array.from(selected.values()).map((item) => ({
    id: item.id,
    traceId: item.traceId,
    createdAt: item.createdAt,
    intent: intentKey(item.z),
    strategy: strategyKey(item),
    difficulty: difficultyKey(item),
    surface: surfaceKey(item),
  }));

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    entries,
  };
};

export const saveHoldoutSet = async (
  set: HoldoutSet,
  filePath: string = DEFAULT_HOLDOUT_PATH,
): Promise<string> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(set, null, 2)}\n`, "utf8");
  return filePath;
};

export const loadHoldoutSet = async (
  filePath: string = DEFAULT_HOLDOUT_PATH,
): Promise<HoldoutSet | null> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const result = holdoutSetSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
};

export const collectHoldoutIds = (set: HoldoutSet | null): Set<string> => {
  const ids = new Set<string>();
  if (!set) return ids;
  for (const entry of set.entries) {
    ids.add(entry.id);
    if (entry.traceId) ids.add(entry.traceId);
  }
  return ids;
};

export const loadHoldoutIds = async (
  filePath: string = DEFAULT_HOLDOUT_PATH,
): Promise<Set<string>> => {
  const set = await loadHoldoutSet(filePath);
  return collectHoldoutIds(set);
};

export const filterHoldoutTrajectories = (
  trajectories: Map<string, AgiTrajectory>,
  holdout: HoldoutSet | null,
): { holdout: AgiTrajectory[]; remaining: AgiTrajectory[] } => {
  const ids = collectHoldoutIds(holdout);
  const holdoutItems: AgiTrajectory[] = [];
  const remaining: AgiTrajectory[] = [];
  for (const item of trajectories.values()) {
    if (ids.has(item.id) || (item.traceId && ids.has(item.traceId))) {
      holdoutItems.push(item);
    } else {
      remaining.push(item);
    }
  }
  return { holdout: holdoutItems, remaining };
};

export const computeHoldoutMetrics = (
  trajectories: AgiTrajectory[],
  gates?: Map<string, AgiGateReport>,
): HoldoutMetrics => {
  let total = 0;
  let accepted = 0;
  let groundingFails = 0;
  let refusalCount = 0;
  let clarifyCount = 0;
  let precisionSum = 0;
  let recallSum = 0;
  let citationRecallCount = 0;
    let candidateRecallSum = 0;
    let candidateRecallCount = 0;
    let selectedRecallSum = 0;
    let selectedRecallCount = 0;
    let goldTotal = 0;
    let goldInCandidates = 0;
    let goldInSelected = 0;
    let goldInCited = 0;
  let hintRecallSum = 0;
  let hintRecallCount = 0;
  let hintCandidateRecallSum = 0;
  let hintCandidateRecallCount = 0;
  let hintSelectedRecallSum = 0;
  let hintSelectedRecallCount = 0;
  let hintUsedInCitationsSum = 0;
  let hintUsedInCitationsCount = 0;
  let latencyTotal = 0;
  const latencySamples: number[] = [];
  const byIntent: Record<string, number> = {};
  const byStrategy: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const bySurface: Record<string, number> = {};
  const acceptedByIntent: Record<string, number> = {};
  const acceptedByStrategy: Record<string, number> = {};
  const acceptedByDifficulty: Record<string, number> = {};
  const acceptedBySurface: Record<string, number> = {};

  for (const trajectory of trajectories) {
    total += 1;
    const gateReport = gates?.get(trajectoryKey(trajectory)) ?? evaluateTrajectoryGates(trajectory);
    if (gateReport.accepted) {
      accepted += 1;
    } else if (gateReport.gates.some((gate) => gate.name === "grounding" && !gate.pass)) {
      groundingFails += 1;
    }

      const grounding = assessGrounding(trajectory);
      goldTotal += grounding.totalCitations;
      goldInCandidates += grounding.candidateLinkedCitations;
      goldInSelected += grounding.retrievalLinkedCitations;
      goldInCited += grounding.linkedCitations;
    const precision =
      grounding.totalCitations > 0
        ? grounding.linkedCitations / grounding.totalCitations
        : grounding.hasClaims
          ? 0
          : 1;
    const selectedPaths = collectSelectedPaths(trajectory);
    const evidencePathCount = new Set(
      selectedPaths.length > 0
        ? selectedPaths
        : collectEvidencePaths(trajectory),
    ).size;
    const evidenceCount =
      evidencePathCount > 0
        ? evidencePathCount
        : (trajectory.E?.length ?? 0) +
          (trajectory.meta?.retrievalSelected?.length ?? 0);
    const recallDenom = Math.max(1, evidenceCount);
    const recall = Math.min(1, grounding.linkedCitations / recallDenom);
    precisionSum += precision;
    recallSum += recall;
    citationRecallCount += 1;
    const citationDenom = grounding.totalCitations;
    const candidateRecall =
      citationDenom > 0
        ? grounding.candidateLinkedCitations / citationDenom
        : grounding.hasClaims
          ? 0
          : 1;
    const selectedRecall =
      citationDenom > 0
        ? grounding.retrievalLinkedCitations / citationDenom
        : grounding.hasClaims
          ? 0
          : 1;
    candidateRecallSum += candidateRecall;
    candidateRecallCount += 1;
    selectedRecallSum += selectedRecall;
    selectedRecallCount += 1;

    const hints = collectHintPaths(trajectory);
    const citationPaths = collectCitationPaths(trajectory);
    if (hints.length > 0) {
      const candidatePaths = collectCandidatePaths(trajectory);
      const selectedPaths = collectSelectedPaths(trajectory);
      const retrievalPaths = collectRetrievalPaths(trajectory);
      if (candidatePaths.length > 0) {
        const candidateHits = hints.filter((hint) =>
          candidatePaths.some((path) => hintMatches(hint, path)),
        ).length;
        hintCandidateRecallSum += candidateHits / hints.length;
        hintCandidateRecallCount += 1;
      }
      if (selectedPaths.length > 0) {
        const selectedHits = hints.filter((hint) =>
          selectedPaths.some((path) => hintMatches(hint, path)),
        ).length;
        hintSelectedRecallSum += selectedHits / hints.length;
        hintSelectedRecallCount += 1;
      }
      const hitCount = hints.filter((hint) =>
        retrievalPaths.some((path) => hintMatches(hint, path)),
      ).length;
      hintRecallSum += hitCount / hints.length;
      hintRecallCount += 1;
    }
    if (hints.length > 0 && citationPaths.length > 0) {
      const citationHits = hints.filter((hint) =>
        citationPaths.some((path) => hintMatches(hint, path)),
      ).length;
      hintUsedInCitationsSum += citationHits / hints.length;
      hintUsedInCitationsCount += 1;
    }

    const outputText = (trajectory.y?.summary ?? trajectory.y?.text ?? "").toLowerCase();
    if (outputText && refusalPattern.test(outputText)) {
      refusalCount += 1;
    }
    if (outputText && clarifyPattern.test(outputText)) {
      clarifyCount += 1;
    }

    const latencyMs = resolveLatencyMs(trajectory);
    if (latencyMs !== null) {
      latencySamples.push(latencyMs);
      latencyTotal += latencyMs;
    }

    const intentLabel = intentKey(trajectory.z);
    const strategyLabel = strategyKey(trajectory);
    const difficultyLabel = difficultyKey(trajectory);
    const surfaceLabel = surfaceKey(trajectory);
    recordCount(byIntent, intentLabel);
    recordCount(byStrategy, strategyLabel);
    recordCount(byDifficulty, difficultyLabel);
    recordCount(bySurface, surfaceLabel);
    if (gateReport.accepted) {
      recordCount(acceptedByIntent, intentLabel);
      recordCount(acceptedByStrategy, strategyLabel);
      recordCount(acceptedByDifficulty, difficultyLabel);
      recordCount(acceptedBySurface, surfaceLabel);
    }
  }

  const acceptanceRate = total > 0 ? accepted / total : 0;
  const groundednessFailRate = total > 0 ? groundingFails / total : 0;
  const precisionAvg = total > 0 ? precisionSum / total : 0;
  const recallAvg = total > 0 ? recallSum / total : 0;
    const candidateRecallAvg =
      candidateRecallCount > 0 ? candidateRecallSum / candidateRecallCount : 0;
    const selectedRecallAvg =
      selectedRecallCount > 0 ? selectedRecallSum / selectedRecallCount : 0;
    const candidateRecallWeighted =
      goldTotal > 0 ? goldInCandidates / goldTotal : 0;
    const selectedRecallWeighted =
      goldTotal > 0 ? goldInSelected / goldTotal : 0;
  const hintRecallAvg = hintRecallCount > 0 ? hintRecallSum / hintRecallCount : 0;
  const hintCandidateRecallAvg =
    hintCandidateRecallCount > 0
      ? hintCandidateRecallSum / hintCandidateRecallCount
      : 0;
  const hintSelectedRecallAvg =
    hintSelectedRecallCount > 0
      ? hintSelectedRecallSum / hintSelectedRecallCount
      : 0;
  const hintUsedInCitationsAvg =
    hintUsedInCitationsCount > 0
      ? hintUsedInCitationsSum / hintUsedInCitationsCount
      : 0;
  const refusalRate = total > 0 ? refusalCount / total : 0;
  const clarifyRate = total > 0 ? clarifyCount / total : 0;
  latencySamples.sort((a, b) => a - b);
  const latencyMsCount = latencySamples.length;
  const latencyMsAvg = latencyMsCount > 0 ? latencyTotal / latencyMsCount : 0;
  const latencyMsP50 = latencyMsCount > 0 ? percentile(latencySamples, 0.5) : 0;
  const latencyMsP95 = latencyMsCount > 0 ? percentile(latencySamples, 0.95) : 0;
  const latencyMsP99 = latencyMsCount > 0 ? percentile(latencySamples, 0.99) : 0;

  const acceptanceByIntent: Record<string, number> = {};
  const acceptanceByStrategy: Record<string, number> = {};
  const acceptanceByDifficulty: Record<string, number> = {};
  const acceptanceBySurface: Record<string, number> = {};
  for (const [key, value] of Object.entries(byIntent)) {
    acceptanceByIntent[key] = value > 0 ? (acceptedByIntent[key] ?? 0) / value : 0;
  }
  for (const [key, value] of Object.entries(byStrategy)) {
    acceptanceByStrategy[key] =
      value > 0 ? (acceptedByStrategy[key] ?? 0) / value : 0;
  }
  for (const [key, value] of Object.entries(byDifficulty)) {
    acceptanceByDifficulty[key] =
      value > 0 ? (acceptedByDifficulty[key] ?? 0) / value : 0;
  }
  for (const [key, value] of Object.entries(bySurface)) {
    acceptanceBySurface[key] = value > 0 ? (acceptedBySurface[key] ?? 0) / value : 0;
  }

  return {
      createdAt: new Date().toISOString(),
      total,
      n_total: total,
      n_with_gold: goldTotal,
      n_gold_in_index: goldInCandidates,
      n_gold_in_candidates: goldInCandidates,
      n_gold_selected: goldInSelected,
      n_gold_cited: goldInCited,
      accepted,
      acceptanceRate,
      groundednessFailRate,
      precision: precisionAvg,
      recall: recallAvg,
      attributionPrecision: precisionAvg,
      attributionRecall: recallAvg,
      citationPrecision: precisionAvg,
      citationRecall: recallAvg,
      citationRecallCount,
      evidenceRecallCandidate: candidateRecallWeighted,
      candidateRecall: candidateRecallWeighted,
      candidateRecallAvg,
      candidateRecallCount,
      evidenceRecallSelected: selectedRecallWeighted,
      selectedRecall: selectedRecallWeighted,
      selectedRecallAvg,
      selectedRecallCount,
    hintRecall: hintRecallAvg,
    hintCandidateRecall: hintCandidateRecallAvg,
    hintCandidateRecallCount,
    hintSelectedRecall: hintSelectedRecallAvg,
    hintSelectedRecallCount,
    hintRecallCount,
    hintUsedInCitations: hintUsedInCitationsAvg,
    hintUsedInCitationsCount,
    refusalRate,
    clarifyRate,
    latencyMsAvg,
    latencyMsP50,
    latencyMsP95,
    latencyMsP99,
    latencyMsCount,
    byIntent: Object.keys(byIntent).length ? byIntent : undefined,
    byStrategy: Object.keys(byStrategy).length ? byStrategy : undefined,
    byDifficulty: Object.keys(byDifficulty).length ? byDifficulty : undefined,
    bySurface: Object.keys(bySurface).length ? bySurface : undefined,
    acceptanceByIntent: Object.keys(acceptanceByIntent).length
      ? acceptanceByIntent
      : undefined,
    acceptanceByStrategy: Object.keys(acceptanceByStrategy).length
      ? acceptanceByStrategy
      : undefined,
    acceptanceByDifficulty: Object.keys(acceptanceByDifficulty).length
      ? acceptanceByDifficulty
      : undefined,
    acceptanceBySurface: Object.keys(acceptanceBySurface).length
      ? acceptanceBySurface
      : undefined,
  };
};
