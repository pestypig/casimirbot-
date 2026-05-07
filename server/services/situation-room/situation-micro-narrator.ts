import crypto from "node:crypto";
import {
  HELIX_SITUATION_NARRATION_RECEIPT_SCHEMA,
  type SituationNarrationReceipt,
} from "@shared/helix-situation-narration";
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

const renderTemplate = (semantic: SituationSemanticEvent): string =>
  semantic.narrative_template
    .replace("{subject}", semantic.subject ?? "Someone")
    .replace("{verb}", semantic.verb)
    .replace("{object}", semantic.object ?? "something");

const inferIntent = (semanticEvents: SituationSemanticEvent[]): {
  inferredIntent: string | null;
  confidence: number | null;
  prediction: string | null;
  predictionConfidence: number | null;
} => {
  const clues = new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.goal_clues));
  const tags = new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.tags));
  if (clues.has("collect_blaze_rods")) {
    return {
      inferredIntent: "collect blaze rods",
      confidence: 0.82,
      prediction: "The player may continue toward Nether fortress combat or brewing preparation.",
      predictionConfidence: 0.76,
    };
  }
  if (clues.has("gather_wood")) {
    return {
      inferredIntent: "wood/tool/building goal",
      confidence: 0.68,
      prediction: "The player may craft basic tools, planks, or shelter next.",
      predictionConfidence: 0.62,
    };
  }
  if (tags.has("risk")) {
    return {
      inferredIntent: "survive immediate danger",
      confidence: 0.78,
      prediction: "The player may need to heal, retreat, or avoid nearby hazards.",
      predictionConfidence: 0.74,
    };
  }
  if (tags.has("travel")) {
    return {
      inferredIntent: null,
      confidence: null,
      prediction: null,
      predictionConfidence: null,
    };
  }
  return {
    inferredIntent: clues.values().next().value ?? null,
    confidence: clues.size > 0 ? 0.55 : null,
    prediction: null,
    predictionConfidence: null,
  };
};

export function buildSituationMicroNarration(args: {
  roomId: string;
  graphId?: string | null;
  semanticEvents: SituationSemanticEvent[];
  ts?: string;
}): SituationNarrationReceipt | null {
  const { roomId, graphId, semanticEvents } = args;
  if (semanticEvents.length === 0) return null;
  const ts = args.ts ?? semanticEvents.at(-1)?.ts ?? new Date().toISOString();
  const text = semanticEvents.map(renderTemplate).join(" ");
  const intent = inferIntent(semanticEvents);
  const tags = new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.tags));
  const memoryPolicy: SituationNarrationReceipt["memory_policy"] =
    tags.has("risk") || tags.has("goal_blocked")
      ? "promote_to_goal_context"
      : tags.has("travel")
        ? "ignore"
        : "session_keep";

  return {
    schema: HELIX_SITUATION_NARRATION_RECEIPT_SCHEMA,
    narration_id: `narration:${roomId}:${hashShort(semanticEvents.map((event: SituationSemanticEvent) => event.semantic_event_id), 14)}`,
    room_id: roomId,
    graph_id: graphId ?? null,
    source_signal_ids: semanticEvents.map((event: SituationSemanticEvent) => event.source_signal_id),
    semantic_event_ids: semanticEvents.map((event: SituationSemanticEvent) => event.semantic_event_id),
    mode: "deterministic_template",
    text,
    perspective: "third_person",
    inferred_intent: intent.inferredIntent,
    inferred_intent_confidence: intent.confidence,
    prediction: intent.prediction,
    prediction_confidence: intent.predictionConfidence,
    memory_policy: memoryPolicy,
    evidence_refs: Array.from(new Set(semanticEvents.flatMap((event: SituationSemanticEvent) => event.evidence_refs))),
    ts,
  };
}
