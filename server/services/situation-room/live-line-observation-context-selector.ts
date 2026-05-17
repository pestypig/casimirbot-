import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type { HelixLiveCardLineReasoningModalityScope } from "@shared/helix-live-card-line-reasoning";
import { listGoalCards } from "./goal-finder-store";
import { listInterpretationCards } from "./interpretation-card-store";
import { listObservationJournalEntries } from "./observation-journal-store";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { selectLiveSchemaForEnvironment } from "./live-schema-selection-engine";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const isExplicitGenericNonMinecraftVisual = (value: unknown): boolean => {
  const text = lower(value);
  return (
    /\b(?:generic\s+workstation|generic\s+visual|workstation\s+live\s+answer|document|folder|file explorer|app screen)\b/.test(text) ||
    /\b(?:do\s+not|don't|not|without|exclude|avoid)\b[\s\S]{0,80}\b(?:minecraft|minehut|game[-\s]?specific|game)\b/.test(text) ||
    /\b(?:minecraft|minehut|game[-\s]?specific|game)\b[\s\S]{0,80}\b(?:do\s+not|don't|not|without|exclude|avoid|assumptions?)\b/.test(text)
  );
};

export function inferLineReasoningModalityScope(input: {
  environment: LiveAnswerEnvironment;
  hasFreshWorld?: boolean;
}): HelixLiveCardLineReasoningModalityScope {
  const descriptors = listLiveSourceDescriptors({
    threadId: input.environment.thread_id,
    environmentId: input.environment.environment_id,
    limit: 20,
  });
  const descriptorText = lower(descriptors.map((descriptor) =>
    `${descriptor.modality} ${descriptor.serving_context.surface} ${descriptor.serving_context.app_hint ?? ""} ${descriptor.serving_context.window_title_hint ?? ""} ${descriptor.user_label ?? ""}`,
  ).join("\n"));
  if (/\b(?:file_manager|document|browser_tab|screen|window)\b/.test(descriptorText)) return "generic_visual";
  if (/\b(?:game|minehut_plugin)\b/.test(descriptorText) && !isExplicitGenericNonMinecraftVisual(input.environment.objective)) {
    return input.hasFreshWorld ? "minecraft_world" : "minecraft_visual";
  }
  const text = lower(`${input.environment.preset ?? ""} ${input.environment.objective} ${input.environment.line_schema.map((line) => `${line.key} ${line.label}`).join(" ")}`);
  if (isExplicitGenericNonMinecraftVisual(input.environment.objective)) return "generic_visual";
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
  const descriptors = listLiveSourceDescriptors({
    threadId: input.environment.thread_id,
    environmentId: input.environment.environment_id,
    limit: 40,
  });
  const schemaSelection = selectLiveSchemaForEnvironment({
    environment: input.environment,
    descriptors,
    observations,
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
    source_descriptors: descriptors,
    schema_selection: schemaSelection,
    latest_observation_refs: observations.slice(-8).map((entry) => entry.observation_id),
    latest_interpretation_refs: interpretations.slice(-8).map((entry) => entry.interpretation_id),
    latest_goal_refs: goals.slice(-8).map((entry) => entry.goal_id),
    source_fidelity_refs: capabilities.slice(-8).map((entry) => entry.source_id),
    user_steering_refs: [] as string[],
    has_fresh_world: hasFreshWorld,
  };
}
