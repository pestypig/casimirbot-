import crypto from "node:crypto";
import {
  HELIX_SITUATION_PREDICTION_SCHEMA,
  type SituationPrediction,
} from "@shared/helix-situation-prediction";
import type { SituationNarrationReceipt } from "@shared/helix-situation-narration";
import type { SituationSemanticEvent } from "@shared/helix-situation-semantics";

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const predictionFromClues = (clues: Set<string>, tags: Set<string>): {
  goal: string;
  nextAction: string | null;
  confidence: number;
  status: SituationPrediction["status"];
} | null => {
  if (clues.has("collect_blaze_rods")) {
    return {
      goal: "collect blaze rods",
      nextAction: "continue Nether fortress search while watching health and blaze spawns",
      confidence: 0.82,
      status: "active",
    };
  }
  if (clues.has("gather_wood")) {
    return {
      goal: "building shelter or basic tools",
      nextAction: "craft planks, sticks, or early tools",
      confidence: 0.66,
      status: "tentative",
    };
  }
  if (tags.has("risk")) {
    return {
      goal: "survive immediate danger",
      nextAction: "heal, retreat, or avoid nearby hazards",
      confidence: 0.78,
      status: "active",
    };
  }
  if (tags.has("goal_blocked")) {
    return {
      goal: "navigation or objective blocked",
      nextAction: "reassess route or ask for next step",
      confidence: 0.72,
      status: "active",
    };
  }
  return null;
};

export function reduceGoalPredictions(args: {
  roomId: string;
  graphId?: string | null;
  semanticEvents: SituationSemanticEvent[];
  narration?: SituationNarrationReceipt | null;
  existing?: SituationPrediction[];
}): SituationPrediction[] {
  const { roomId, graphId, semanticEvents, narration } = args;
  const clues = new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.goal_clues));
  const tags = new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.tags));
  const base = predictionFromClues(clues, tags);
  if (!base || !narration) return args.existing ?? [];
  const actorId = semanticEvents.find((event: SituationSemanticEvent) => event.actor_id)?.actor_id ?? null;
  const evidenceRefs = Array.from(
    new Set([
      ...(narration.evidence_refs ?? []),
      ...semanticEvents.flatMap((event: SituationSemanticEvent) => event.evidence_refs),
    ]),
  );
  const prediction: SituationPrediction = {
    schema: HELIX_SITUATION_PREDICTION_SCHEMA,
    prediction_id: `prediction:${roomId}:${hashShort([actorId, base.goal], 12)}`,
    room_id: roomId,
    graph_id: graphId ?? null,
    actor_id: actorId,
    predicted_goal: base.goal,
    predicted_next_action: base.nextAction,
    confidence: base.confidence,
    status: base.status,
    evidence_refs: evidenceRefs,
    derived_from_narration_ids: [narration.narration_id],
    updated_at: narration.ts,
  };
  const retained = (args.existing ?? []).filter(
    (entry: SituationPrediction) => entry.prediction_id !== prediction.prediction_id,
  );
  return [...retained.slice(-5), prediction];
}
