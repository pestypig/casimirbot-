import crypto from "node:crypto";
import type {
  StagePlayBadgeGraphV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import {
  buildStagePlayPredictionHypothesisV1,
  type StagePlayPredictedMoveClassV1,
  type StagePlayPredictionHorizonKindV1,
  type StagePlayPredictionHypothesisV1,
} from "@shared/contracts/stage-play-prediction.v1";

export type BuildStagePlayPredictionHypothesisFromGraphInput = {
  graph: StagePlayBadgeGraphV1;
  horizonKind?: StagePlayPredictionHorizonKindV1;
  generatedAt?: string;
  expiresAfterTs?: string | null;
};

type CandidateScore = {
  moveClass: StagePlayPredictedMoveClassV1;
  score: number;
  badgeIds: string[];
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const lower = (value: string | null | undefined): string => String(value ?? "").toLowerCase();

const badgeText = (badge: StagePlayBadgeV1): string =>
  lower([
    badge.id,
    badge.title,
    badge.plainMeaning,
    badge.whyItMatters,
    badge.kind,
    badge.status,
    ...badge.tags,
    ...badge.reasonCodes,
    badge.intentModule?.verb,
  ].filter(Boolean).join(" "));

const scoreFor = (
  graph: StagePlayBadgeGraphV1,
  moveClass: StagePlayPredictedMoveClassV1,
  patterns: RegExp[],
): CandidateScore => {
  const badgeIds = graph.badges
    .filter((badge) => patterns.some((pattern) => pattern.test(badgeText(badge))))
    .map((badge) => badge.id);
  const proceduralBonus = graph.badges.some((badge) =>
    badge.kind === "procedural_binding" && badgeIds.includes(badge.id)
  ) ? 2 : 0;
  const affordanceBonus = graph.badges.some((badge) =>
    badge.kind === "affordance" && badgeIds.includes(badge.id)
  ) ? 1 : 0;
  return {
    moveClass,
    score: badgeIds.length + proceduralBonus + affordanceBonus,
    badgeIds,
  };
};

const blockedForMove = (
  graph: StagePlayBadgeGraphV1,
  moveClass: StagePlayPredictedMoveClassV1,
): string[] => {
  const patterns: Partial<Record<StagePlayPredictedMoveClassV1, RegExp>> = {
    attack: /attack|engage|fire|assault/,
    retreat: /retreat|withdraw|fall back/,
    reveal_information: /reveal|secret|disclose|expose/,
    delay: /delay|stall|wait/,
    negotiate: /negotiate|bargain|terms/,
    deceive: /deceive|mislead|bluff|feint/,
  };
  const pattern = patterns[moveClass];
  if (!pattern) return [];
  return graph.badges
    .filter((badge) => badge.kind === "blocked_affordance" && pattern.test(badgeText(badge)))
    .map((badge) => badge.id);
};

export function buildStagePlayPredictionHypothesisFromGraph(
  input: BuildStagePlayPredictionHypothesisFromGraphInput,
): StagePlayPredictionHypothesisV1 {
  const graph = input.graph;
  const candidates = [
    scoreFor(graph, "delay", [/delay|stall|wait|buy time|controlled_stalling|resource\.time|preserve.*leverage/]),
    scoreFor(graph, "attack", [/affordance\.attack|intent.*attack|strike|assault|engage/]),
    scoreFor(graph, "retreat", [/affordance\.retreat|intent.*retreat|withdraw|tactical_disadvantage/]),
    scoreFor(graph, "reveal_information", [/affordance\.reveal|reveal_information|expose_deception|evidence_backed_reveal|resource\.intel/]),
    scoreFor(graph, "seek_confirmation", [/affordance\.confirm|seek_confirmation|verify|proof|confirmation/]),
    scoreFor(graph, "negotiate", [/affordance\.negotiate|leveraged_negotiation|gain_legitimacy|bargain|terms/]),
    scoreFor(graph, "deceive", [/affordance\.deceive|deceive|mislead|bluff|feint/]),
    scoreFor(graph, "escalate", [/escalate|attack|hazard\.chain_of_command_conflict|hazard\.betrayal/]),
    scoreFor(graph, "deescalate", [/deescalate|de-escalate|delay_conflict|avoid.*battle/]),
  ].sort((a, b) => b.score - a.score);
  const selected = candidates.find((candidate) => candidate.score > 0) ?? {
    moveClass: "unknown" as const,
    score: 0,
    badgeIds: [],
  };
  const selectedBlockedIds = blockedForMove(graph, selected.moveClass);
  const genericBlockedIds = graph.badges
    .filter((badge) => badge.kind === "blocked_affordance")
    .map((badge) => badge.id);
  const blockedMoveIds = unique([...selectedBlockedIds, ...genericBlockedIds]).slice(0, 8);
  const actorRefs = graph.badges
    .filter((badge) => badge.kind === "actor")
    .map((badge) => badge.id)
    .slice(0, 6);
  const hazardIds = graph.badges
    .filter((badge) => badge.kind === "hazard")
    .map((badge) => badge.id)
    .slice(0, 6);
  const supportingBadgeIds = unique([
    ...selected.badgeIds,
    ...graph.badges
      .filter((badge) => badge.kind === "procedural_binding")
      .map((badge) => badge.id),
  ]).slice(0, 12);
  const evidenceRefs = unique([
    ...graph.sourceWindow.latestObservationRefs,
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...supportingBadgeIds.flatMap((id) => graph.badges.find((badge) => badge.id === id)?.evidenceRefs ?? []),
    ...blockedMoveIds.flatMap((id) => graph.badges.find((badge) => badge.id === id)?.evidenceRefs ?? []),
  ]);
  const confidence = selected.moveClass === "unknown"
    ? 0.2
    : Math.max(0.35, Math.min(0.86, 0.42 + selected.score * 0.07 + supportingBadgeIds.length * 0.015));
  const scoreableSignals = unique([
    `move_class:${selected.moveClass}`,
    ...actorRefs.map((id) => `actor:${id}`),
    ...supportingBadgeIds.map((id) => `badge:${id}`),
    ...blockedMoveIds.map((id) => `blocked_move:${id}`),
    ...hazardIds.map((id) => `hazard:${id}`),
  ]);
  const claim = selected.moveClass === "unknown"
    ? "The compact Stage Play graph does not yet constrain a scoreable next move class."
    : `The constrained next move class is likely ${selected.moveClass.replace(/_/g, " ")} based on ${supportingBadgeIds.length} supporting badge(s).`;

  return buildStagePlayPredictionHypothesisV1({
    predictionId: `stage_play_prediction_hypothesis:${hashShort([
      graph.graphId,
      selected.moveClass,
      supportingBadgeIds,
      blockedMoveIds,
      input.horizonKind ?? "next_scene_beat",
    ])}`,
    graphId: graph.graphId,
    sourceObservationWindow: {
      fromTs: graph.sourceWindow.fromTs ?? graph.generatedAt,
      toTs: graph.sourceWindow.toTs ?? graph.generatedAt,
      evidenceRefs,
    },
    predictionWindow: {
      horizonKind: input.horizonKind ?? "next_scene_beat",
      expiresAfterTs: input.expiresAfterTs ?? null,
    },
    predictedMoveClass: selected.moveClass,
    actorRefs,
    supportingBadgeIds,
    blockedMoveIds,
    claim,
    confidence,
    scoreableSignals,
    evidenceRefs,
  });
}
