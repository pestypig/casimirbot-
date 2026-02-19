import type { HelixAskGraphPack } from "./graph-resolver";

export type HelixAskMove =
  | "direct_answer"
  | "retrieve_more"
  | "relation_build"
  | "clarify"
  | "fail_closed";

export type HelixAskMovePolicyProfile = "balanced" | "evidence_first" | "latency_first";

export type HelixAskMoveScoreInput = {
  groundedness: number;
  uncertainty: number;
  safety: number;
  coverage: number;
  evidenceGain: number;
  latencyCost: number;
  risk: number;
  budgetPressure: number;
  relationIntentActive?: boolean;
  profile?: HelixAskMovePolicyProfile;
  clarifyFailClosedThreshold?: number;
};

export type HelixAskMoveSelection = {
  selectedMove: HelixAskMove;
  moveScores: Record<HelixAskMove, number>;
  rejectedMoves: HelixAskMove[];
  rejectReasons: Record<HelixAskMove, string[]>;
  budgetPressure: number;
  stopReason: string;
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

const MOVE_TIE_BREAK_ORDER: HelixAskMove[] = [
  "direct_answer",
  "retrieve_more",
  "relation_build",
  "clarify",
  "fail_closed",
];

const PROFILE_WEIGHTS: Record<
  HelixAskMovePolicyProfile,
  { goal: number; evidenceGain: number; latencyCost: number; risk: number; budgetPressure: number }
> = {
  balanced: { goal: 1, evidenceGain: 1, latencyCost: 1, risk: 1, budgetPressure: 1 },
  evidence_first: { goal: 1, evidenceGain: 1.35, latencyCost: 0.85, risk: 1, budgetPressure: 0.9 },
  latency_first: { goal: 1, evidenceGain: 0.8, latencyCost: 1.35, risk: 1, budgetPressure: 1.2 },
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export const rankMovesDeterministically = (
  moveScores: Record<HelixAskMove, number>,
): Array<{ move: HelixAskMove; score: number }> =>
  MOVE_TIE_BREAK_ORDER.map((move) => ({ move, score: Number(moveScores[move] ?? 0) })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return MOVE_TIE_BREAK_ORDER.indexOf(a.move) - MOVE_TIE_BREAK_ORDER.indexOf(b.move);
  });

const scoreMoveDeterministically = (input: {
  profile: HelixAskMovePolicyProfile;
  wGoal: number;
  wEvidenceGain: number;
  wLatencyCost: number;
  wRisk: number;
  wBudgetPressure: number;
}): number => {
  const weights = PROFILE_WEIGHTS[input.profile] ?? PROFILE_WEIGHTS.balanced;
  return (
    weights.goal * input.wGoal +
    weights.evidenceGain * input.wEvidenceGain -
    weights.latencyCost * input.wLatencyCost -
    weights.risk * input.wRisk -
    weights.budgetPressure * input.wBudgetPressure
  );
};

export const selectDeterministicMoveWithDebug = (
  input: HelixAskMoveScoreInput,
): HelixAskMoveSelection => {
  const groundedness = clamp01(input.groundedness);
  const uncertainty = clamp01(input.uncertainty);
  const safety = clamp01(input.safety);
  const coverage = clamp01(input.coverage);
  const evidenceGain = clamp01(input.evidenceGain);
  const latencyCost = clamp01(input.latencyCost);
  const risk = clamp01(input.risk);
  const budgetPressure = clamp01(input.budgetPressure);
  const relationIntentActive = input.relationIntentActive === true;
  const profile = input.profile ?? "balanced";
  const clarifyFailClosedThreshold = clamp01(input.clarifyFailClosedThreshold ?? 0.72);

  const relationBoost = relationIntentActive ? 0.14 : 0;
  const bridgeEvidenceBoost = relationIntentActive ? 0.1 : 0;
  const goalTerms: Record<HelixAskMove, number> = {
    direct_answer: groundedness * 0.5 + coverage * 0.35 + (1 - uncertainty) * 0.15,
    retrieve_more: (1 - coverage) * 0.5 + uncertainty * 0.3 + evidenceGain * 0.2,
    relation_build:
      relationBoost +
      uncertainty * 0.35 +
      (1 - groundedness) * 0.2 +
      evidenceGain * 0.3 +
      bridgeEvidenceBoost,
    clarify: (1 - groundedness) * 0.4 + uncertainty * 0.35 + (1 - coverage) * 0.25,
    fail_closed: safety * 0.55 + risk * 0.35 + budgetPressure * 0.1,
  };
  const evidenceTerms: Record<HelixAskMove, number> = {
    direct_answer: coverage * 0.6 + groundedness * 0.4,
    retrieve_more: evidenceGain * 0.65 + (1 - coverage) * 0.35,
    relation_build: evidenceGain * (0.5 + bridgeEvidenceBoost) + relationBoost,
    clarify: uncertainty * 0.45 + (1 - groundedness) * 0.25,
    fail_closed: risk * 0.3,
  };
  const latencyTerms: Record<HelixAskMove, number> = {
    direct_answer: latencyCost * 0.2,
    retrieve_more: 0.5 + latencyCost * 0.5,
    relation_build: 0.55 + latencyCost * 0.45,
    clarify: 0.25 + latencyCost * 0.35,
    fail_closed: 0.05 + latencyCost * 0.1,
  };
  const riskTerms: Record<HelixAskMove, number> = {
    direct_answer: risk * 0.45 + (1 - groundedness) * 0.2,
    retrieve_more: risk * 0.3,
    relation_build: risk * 0.35,
    clarify: risk * 0.2,
    fail_closed: 0,
  };
  const budgetTerms: Record<HelixAskMove, number> = {
    direct_answer: budgetPressure * 0.2,
    retrieve_more: budgetPressure * 0.6,
    relation_build: budgetPressure * 0.55,
    clarify: budgetPressure * 0.35,
    fail_closed: budgetPressure * 0.1,
  };

  const computedScores = Object.fromEntries(
    MOVE_TIE_BREAK_ORDER.map((move) => [
      move,
      scoreMoveDeterministically({
        profile,
        wGoal: goalTerms[move],
        wEvidenceGain: evidenceTerms[move],
        wLatencyCost: latencyTerms[move],
        wRisk: riskTerms[move],
        wBudgetPressure: budgetTerms[move],
      }),
    ]),
  ) as Record<HelixAskMove, number>;
  const ranked = rankMovesDeterministically(computedScores);

  const selectedMove = ranked[0]?.move ?? "clarify";
  const moveScores = Object.fromEntries(
    ranked.map((entry) => [entry.move, entry.score]),
  ) as Record<HelixAskMove, number>;
  const rejectedMoves = ranked.slice(1).map((entry) => entry.move);
  const rejectReasons: Record<HelixAskMove, string[]> = {
    direct_answer: [],
    retrieve_more: [],
    relation_build: [],
    clarify: [],
    fail_closed: [],
  };
  for (const move of rejectedMoves) {
    const reasons: string[] = [];
    if (moveScores[selectedMove] > moveScores[move]) reasons.push("lower_score");
    if (move === "relation_build" && !relationIntentActive) reasons.push("relation_intent_inactive");
    if (move === "fail_closed" && risk < clarifyFailClosedThreshold) reasons.push("risk_below_fail_closed_threshold");
    rejectReasons[move] = reasons.length > 0 ? reasons : ["deprioritized"];
  }
  const stopReason =
    selectedMove === "fail_closed"
      ? "risk_or_budget_guard"
      : selectedMove === "clarify"
        ? "clarify_needed"
        : selectedMove === "retrieve_more"
          ? "evidence_gain"
          : selectedMove === "relation_build"
            ? "relation_bridge_expansion"
            : "goal_satisfied";

  return {
    selectedMove,
    moveScores,
    rejectedMoves,
    rejectReasons,
    budgetPressure,
    stopReason,
  };
};

export const selectDeterministicMove = (input: HelixAskMoveScoreInput): HelixAskMove =>
  selectDeterministicMoveWithDebug(input).selectedMove;

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
