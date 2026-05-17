import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type { HelixLiveCardLineReasoningModalityScope } from "@shared/helix-live-card-line-reasoning";
import { listGoalCards } from "./goal-finder-store";
import { listInterpretationCards } from "./interpretation-card-store";
import { listObservationJournalEntries } from "./observation-journal-store";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

export function inferLineReasoningModalityScope(input: {
  environment: LiveAnswerEnvironment;
  hasFreshWorld?: boolean;
}): HelixLiveCardLineReasoningModalityScope {
  const text = lower(`${input.environment.preset ?? ""} ${input.environment.objective} ${input.environment.line_schema.map((line) => `${line.key} ${line.label}`).join(" ")}`);
  if (/\b(?:calculator|equation|residual|prime|simulation)\b/.test(text)) return "calculator_stream";
  if (/\b(?:audio|transcript|dialogue|speaker|voice)\b/.test(text)) return "audio_transcript";
  if (/\b(?:document|folder|file|pdf|reference|docs?)\b/.test(text)) return "generic_visual";
  if (/\b(?:minecraft|minehut|place|entities|structure|risk)\b/.test(text)) {
    return input.hasFreshWorld ? "minecraft_world" : "minecraft_visual";
  }
  return "generic_visual";
}

export function selectLiveLineObservationContext(input: {
  environment: LiveAnswerEnvironment;
  now?: string;
}) {
  const capabilities = buildSituationSourceCapabilities({
    threadId: input.environment.thread_id,
    roomId: input.environment.room_id ?? null,
  });
  const hasFreshWorld = capabilities.some((entry) => entry.modality === "world_event" && entry.status === "active");
  const sourceIds = new Set(input.environment.source_ids);
  const observations = listObservationJournalEntries({
    threadId: input.environment.thread_id,
    limit: 80,
  }).filter((entry) =>
    !entry.source_id ||
    sourceIds.size === 0 ||
    sourceIds.has(entry.source_id) ||
    entry.evidence_refs.some((ref) => Array.from(sourceIds).some((sourceId) => ref.includes(sourceId))),
  );
  const interpretations = listInterpretationCards({
    threadId: input.environment.thread_id,
    limit: 80,
  }).filter((card) => !card.room_id || card.room_id === input.environment.room_id || card.room_id === input.environment.environment_id);
  const goals = listGoalCards({
    threadId: input.environment.thread_id,
    limit: 80,
  }).filter((card) => !card.room_id || card.room_id === input.environment.room_id || card.room_id === input.environment.environment_id);
  const modalityScope = inferLineReasoningModalityScope({
    environment: input.environment,
    hasFreshWorld,
  });
  return {
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    objective_text: input.environment.objective,
    modality_scope: modalityScope,
    observations,
    interpretations,
    goals,
    capabilities,
    latest_observation_refs: observations.slice(-8).map((entry) => entry.observation_id),
    latest_interpretation_refs: interpretations.slice(-8).map((entry) => entry.interpretation_id),
    latest_goal_refs: goals.slice(-8).map((entry) => entry.goal_id),
    source_fidelity_refs: capabilities.slice(-8).map((entry) => entry.source_id),
    user_steering_refs: [] as string[],
    has_fresh_world: hasFreshWorld,
  };
}
