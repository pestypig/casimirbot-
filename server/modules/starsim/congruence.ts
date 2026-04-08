import type { StarSimCongruence, StarSimLaneResult } from "./contract";

const MATURITY_WEIGHTS: Record<StarSimLaneResult["maturity"], number> = {
  teaching: 0.25,
  reduced_order: 0.6,
  grid_interp: 0.7,
  obs_fit: 0.8,
  research_sim: 0.9,
  ephemeris_exact: 1,
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const round = (value: number): number => Number(value.toFixed(6));

export function scoreLanes(lanes: StarSimLaneResult[]): {
  lanes: StarSimLaneResult[];
  congruence: StarSimCongruence;
} {
  const scoredLanes = lanes.map((lane) => {
    const maturityWeight = MATURITY_WEIGHTS[lane.maturity];
    const evidenceFit = clamp01(lane.evidence_fit);
    const domainPenalty = lane.availability === "available" ? clamp01(lane.domain_penalty) : 0;
    const laneScore = round(evidenceFit * domainPenalty * maturityWeight);
    return {
      ...lane,
      maturity_weight: maturityWeight,
      lane_score: laneScore,
    };
  });

  const laneScores = scoredLanes.map((lane) => ({
    lane_id: lane.lane_id,
    requested_lane: lane.requested_lane,
    availability: lane.availability,
    evidence_fit: round(lane.evidence_fit),
    domain_penalty: round(lane.domain_penalty),
    maturity_weight: round(lane.maturity_weight ?? 0),
    lane_score: round(lane.lane_score ?? 0),
  }));

  const numericScores = laneScores.map((lane) => lane.lane_score);
  const overallScore =
    numericScores.length === 0 || numericScores.some((score) => score <= 0)
      ? 0
      : round(numericScores.length / numericScores.reduce((sum, score) => sum + 1 / score, 0));

  return {
    lanes: scoredLanes,
    congruence: {
      scoring_model: "harmonic_mean",
      lane_scores: laneScores,
      overall_score: overallScore,
    },
  };
}
