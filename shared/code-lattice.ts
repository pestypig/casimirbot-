import type { KnowledgeProjectExport } from "./knowledge";
import type { TCodeFeature, TCodeResonanceKind, TEssenceEnvelope } from "./essence-schema";

export const CODE_LATTICE_VERSION = "code-lattice/0.1.0" as const;

export type CodeTubulinNode = TCodeFeature;

export type CodeEdgeKind = CodeTubulinNode["neighbors"][number]["kind"];

export type ResonanceNodeKind = TCodeResonanceKind;

export type CodeEdge = {
  id: string;
  from: string;
  to: string;
  kind: CodeEdgeKind;
  weight?: number;
  label?: string;
};

export type CodeLatticeSnapshot = {
  version: typeof CODE_LATTICE_VERSION;
  generatedAt: string;
  repoRoot: string;
  commit: string;
  filesIndexed: number;
  nodes: CodeTubulinNode[];
  edges: CodeEdge[];
  envelopes: TEssenceEnvelope[];
  diagnostics?: string[];
  latticeVersion?: number;
};

export type ResonancePatchMode = "local" | "module" | "ideology";

export type ResonancePatchNode = {
  id: string;
  symbol: string;
  filePath: string;
  score: number;
  kind?: ResonanceNodeKind;
  panels?: string[];
  attention?: number;
  tests?: string;
  summary?: string;
  bands?: string[];
  sources?: string[];
};

export type ResonancePatchStats = {
  activationTotal: number;
  telemetryWeight: number;
  failingTests: number;
  activePanels: number;
  nodeCount: number;
  casimirBandTotalCoherence?: number;
};

export type ResonancePatch = {
  id: string;
  label: string;
  mode: ResonancePatchMode;
  hops: number;
  limit: number;
  score: number;
  summary: string;
  stats: ResonancePatchStats;
  nodes: ResonancePatchNode[];
  knowledge: KnowledgeProjectExport;
};

export type ResonanceCollapseRanking = {
  patchId: string;
  label: string;
  mode: ResonancePatchMode;
  weightedScore: number;
  stats: ResonancePatchStats;
};

export type ResonanceCollapse = {
  primaryPatchId: string;
  backupPatchId?: string;
  rationale: string;
  ranking: ResonanceCollapseRanking[];
};

export type ResonanceBundle = {
  goal: string;
  query: string;
  capturedAt: string;
  baseLimit: number;
  seedCount: number;
  candidates: ResonancePatch[];
  telemetry?: ResonanceTelemetrySummary;
};

export type ResonanceTelemetryBand = {
  name: string;
  seed: number;
  coherence?: number;
  q?: number;
  occupancy?: number;
  eventRate?: number;
  lastEventIso?: string;
  sourceIds?: string[];
  nodeIds?: string[];
};

export type ResonanceTelemetrySummary = {
  casimir?: {
    bands: ResonanceTelemetryBand[];
    tileSample?: {
      total?: number;
      active?: number;
      hot?: number[];
    };
    totalCoherence?: number;
  };
};

export type ResonanceWeightConfig = {
  wOcc: number;
  wQ: number;
  wCoh: number;
  wRec: number;
  wEvt: number;
  tauMs: number;
};

export const RESONANCE_WEIGHT_DEFAULTS: ResonanceWeightConfig = {
  wOcc: 0.2,
  wQ: 0.25,
  wCoh: 0.35,
  wRec: 0.15,
  wEvt: 0.05,
  tauMs: 30_000,
};

const readNumber = (value: string | undefined, fallback: number): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return num;
};

export function readResonanceWeightsFromEnv(env: Record<string, string | undefined> = typeof process !== "undefined"
  ? (process.env as Record<string, string | undefined>)
  : {}): ResonanceWeightConfig {
  const base = RESONANCE_WEIGHT_DEFAULTS;
  return {
    wOcc: readNumber(env.RESO_W_OCC, base.wOcc),
    wQ: readNumber(env.RESO_W_Q, base.wQ),
    wCoh: readNumber(env.RESO_W_COH, base.wCoh),
    wRec: readNumber(env.RESO_W_REC, base.wRec),
    wEvt: readNumber(env.RESO_W_EVT, base.wEvt),
    tauMs: readNumber(env.RESO_TAU_MS, base.tauMs),
  };
}
