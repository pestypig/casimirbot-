import type { HelixAskGraphPack } from "./graph-resolver";

export type HelixAskMove =
  | "direct_answer"
  | "bounded_hypothesis"
  | "targeted_clarification"
  | "missing_evidence_report";

export type HelixAskMoveScoreInput = {
  groundedness: number;
  uncertainty: number;
  safety: number;
  coverage: number;
};

export type HelixAskSemanticQuality = {
  claimCitationLinkRate: number;
  unsupportedClaimRate: number;
  repetitionPenaltyFail: boolean;
  contradictionFlag: boolean;
};

export type HelixAskBridgeTraversalCandidate = {
  treeId: string;
  sourcePath: string;
  nodeId: string;
  relation: string;
  depth: number;
  score: number;
};

export type HelixAskEventStableFields = {
  retrieval_route: string;
  fallback_decision: string;
  contract_renderer_path: string;
  gate_outcomes: Record<string, boolean>;
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export const selectDeterministicMove = (input: HelixAskMoveScoreInput): HelixAskMove => {
  const groundedness = clamp01(input.groundedness);
  const uncertainty = clamp01(input.uncertainty);
  const safety = clamp01(input.safety);
  const coverage = clamp01(input.coverage);
  const direct = groundedness * 0.45 + coverage * 0.35 + (1 - uncertainty) * 0.2;
  const boundedHypothesis = groundedness * 0.3 + uncertainty * 0.45 + coverage * 0.25;
  const targetedClarification = (1 - groundedness) * 0.35 + uncertainty * 0.3 + (1 - coverage) * 0.35;
  const missingEvidence = (1 - coverage) * 0.5 + (1 - groundedness) * 0.3 + safety * 0.2;
  const ranked: Array<{ move: HelixAskMove; score: number }> = [
    { move: "direct_answer", score: direct },
    { move: "bounded_hypothesis", score: boundedHypothesis },
    { move: "targeted_clarification", score: targetedClarification },
    { move: "missing_evidence_report", score: missingEvidence },
  ].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.move.localeCompare(b.move);
  });
  return ranked[0]?.move ?? "targeted_clarification";
};

const splitClaims = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20 && !/^sources\s*:/i.test(line));

export const evaluateSemanticQuality = (input: {
  text: string;
  supportedClaimCount?: number;
  contradictionCount?: number;
}): HelixAskSemanticQuality => {
  const text = input.text ?? "";
  const claims = splitClaims(text);
  const linkHits = claims.filter((claim) => /\[[^\]]+\]|sources?:|docs\//i.test(claim)).length;
  const claimCitationLinkRate = claims.length > 0 ? linkHits / claims.length : 0;
  const supported = Math.max(0, Math.floor(input.supportedClaimCount ?? 0));
  const unsupportedClaims = Math.max(0, claims.length - supported);
  const unsupportedClaimRate = claims.length > 0 ? unsupportedClaims / claims.length : 0;
  const normalizedLines = claims.map((line) => line.toLowerCase().replace(/\s+/g, " "));
  const unique = new Set(normalizedLines);
  const repetitionPenaltyFail = normalizedLines.length >= 3 && unique.size / normalizedLines.length < 0.7;
  const contradictionFlag = Number(input.contradictionCount ?? 0) > 0;
  return {
    claimCitationLinkRate,
    unsupportedClaimRate,
    repetitionPenaltyFail,
    contradictionFlag,
  };
};

export const precomputeBridgeTraversalCandidates = (input: {
  graphPack: HelixAskGraphPack | null;
  maxCandidates?: number;
  maxDepth?: number;
}): HelixAskBridgeTraversalCandidate[] => {
  if (!input.graphPack?.frameworks?.length) return [];
  const maxCandidates = Math.max(1, Math.floor(input.maxCandidates ?? 12));
  const maxDepth = Math.max(0, Math.floor(input.maxDepth ?? 2));
  const out: HelixAskBridgeTraversalCandidate[] = [];
  for (const framework of input.graphPack.frameworks) {
    for (const node of framework.path) {
      if ((node.depth ?? 0) > maxDepth) continue;
      if (node.nodeType !== "bridge" && !/bridge|enables|constrains|verifies/i.test(node.relation ?? "")) {
        continue;
      }
      out.push({
        treeId: framework.treeId,
        sourcePath: framework.sourcePath,
        nodeId: node.id,
        relation: node.relation ?? "unknown",
        depth: node.depth ?? 0,
        score: Number.isFinite(node.score) ? node.score : 0,
      });
    }
  }
  return out
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (b.score !== a.score) return b.score - a.score;
      if (a.treeId !== b.treeId) return a.treeId.localeCompare(b.treeId);
      return a.nodeId.localeCompare(b.nodeId);
    })
    .slice(0, maxCandidates);
};

export const buildEventStableFields = (input: {
  retrievalRoute: string;
  fallbackDecision: string;
  contractRendererPath: string;
  gateOutcomes: Record<string, boolean>;
}): HelixAskEventStableFields => ({
  retrieval_route: input.retrievalRoute,
  fallback_decision: input.fallbackDecision,
  contract_renderer_path: input.contractRendererPath,
  gate_outcomes: { ...input.gateOutcomes },
});
