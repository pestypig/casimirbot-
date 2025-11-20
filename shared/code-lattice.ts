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
};

export type ResonancePatchStats = {
  activationTotal: number;
  telemetryWeight: number;
  failingTests: number;
  activePanels: number;
  nodeCount: number;
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
};
