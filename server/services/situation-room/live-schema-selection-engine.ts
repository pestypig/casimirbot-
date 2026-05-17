import crypto from "node:crypto";
import {
  LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS,
  type LiveAnswerEnvironment,
  type LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_SCHEMA_SELECTION_SCHEMA,
  type HelixLiveSchemaSelection,
  type HelixLiveSchemaSelectionLine,
} from "@shared/helix-live-schema-selection";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import { listObservationJournalEntries } from "./observation-journal-store";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const linePurpose = (line: LiveAnswerLineDefinition): string =>
  line.description ?? `${line.label} line for the selected live answer schema.`;

const modalityForLine = (line: LiveAnswerLineDefinition, preset: "generic_visual" | "minecraft_cortana"): string[] => {
  if (preset === "generic_visual") {
    if (line.key === "evidence" || line.key === "uncertainty") return ["visual_frame", "audio_transcript", "world_event"];
    return ["visual_frame"];
  }
  if (line.key === "risk" || line.key === "progress") return ["world_event", "visual_frame"];
  return ["visual_frame", "world_event"];
};

const defaultToolForLine = (line: LiveAnswerLineDefinition, preset: "generic_visual" | "minecraft_cortana"): string | null => {
  if (preset === "generic_visual") {
    if (line.key === "evidence") return "observation_journal.latest";
    if (line.key === "uncertainty") return "interpretation_card.missing_evidence";
    if (line.key === "next_check") return "visual.compare_recent_frames";
    return "live-cognition.synthesize_line_from_observations";
  }
  if (line.key === "risk" || line.key === "progress") return "minecraft.query_event_window";
  if (line.key === "next_check") return "visual.align_latest_with_event_window";
  return "visual.latest_observation";
};

const toSelectionLine = (
  line: LiveAnswerLineDefinition,
  preset: "generic_visual" | "minecraft_cortana",
): HelixLiveSchemaSelectionLine => ({
  key: line.key,
  label: line.label,
  purpose: linePurpose(line),
  primary_modalities: modalityForLine(line, preset),
  default_tool: defaultToolForLine(line, preset),
});

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));

export const SOURCE_DESCRIBED_GENERIC_VISUAL_SCHEMA: LiveAnswerLineDefinition[] = [
  { key: "scene", label: "Scene", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "activity", label: "Activity", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "objects", label: "Objects", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "evidence", label: "Evidence", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "uncertainty", label: "Uncertainty", update_policy: "projection_only", visibility: "answer_card", priority: "warn" },
  { key: "next_check", label: "Next check", update_policy: "projection_only", visibility: "answer_card", priority: "action" },
  { key: "last_update", label: "Last update", update_policy: "projection_only", visibility: "answer_card", priority: "info" },
];

export const SOURCE_DESCRIBED_MINECRAFT_VISUAL_SCHEMA: LiveAnswerLineDefinition[] = [
  { key: "place", label: "Place", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "activity", label: "Activity", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "structure", label: "Structure", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "entities", label: "Entities", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "risk", label: "Risk", update_policy: "salience_only", visibility: "answer_card", priority: "warn" },
  { key: "missing_evidence", label: "Missing evidence", update_policy: "projection_only", visibility: "answer_card", priority: "warn" },
  { key: "next_check", label: "Next check", update_policy: "projection_only", visibility: "answer_card", priority: "action" },
];

export function excludedLiveSchemaDomains(objectiveText: string): string[] {
  const text = lower(objectiveText);
  const domains: string[] = [];
  if (
    /\b(?:do\s+not|don't|not|without|exclude|avoid|stop)\b[\s\S]{0,80}\b(?:minecraft|minehut|game[-\s]?specific|game)\b/.test(text) ||
    /\b(?:minecraft|minehut|game[-\s]?specific|game)\b[\s\S]{0,80}\b(?:do\s+not|don't|not|without|exclude|avoid|assumptions?)\b/.test(text)
  ) domains.push("game");
  return domains;
}

function sourceLooksGenericWorkstation(descriptors: HelixLiveSourceDescriptor[], observations: HelixObservationJournalEntry[]): boolean {
  if (descriptors.some((descriptor) =>
    descriptor.serving_context.surface === "file_manager" ||
    descriptor.serving_context.surface === "document" ||
    descriptor.serving_context.surface === "browser_tab" ||
    /\b(?:file explorer|windows explorer|finder|folder|directory|document|pdf|browser|tab)\b/i.test(`${descriptor.serving_context.app_hint ?? ""} ${descriptor.serving_context.window_title_hint ?? ""} ${descriptor.user_label ?? ""}`),
  )) return true;
  return observations.some((entry) =>
    entry.modality === "visual_frame" &&
    /\b(?:file explorer|windows explorer|folder|directory|document|pdf|browser tab|app screen|workstation|\.wav|\.asd|image files?)\b/i.test(entry.text),
  );
}

function sourceLooksGame(descriptors: HelixLiveSourceDescriptor[], observations: HelixObservationJournalEntry[]): boolean {
  if (descriptors.some((descriptor) => descriptor.serving_context.surface === "game" || descriptor.serving_context.source_origin === "minehut_plugin")) return true;
  return observations.some((entry) =>
    entry.modality === "visual_frame" &&
    /\b(?:minecraft|minehut|game|hotbar|inventory|java edition)\b/i.test(entry.text),
  );
}

function objectiveAsksGameMonitoring(objectiveText: string): boolean {
  return /\b(?:minecraft|minehut|game monitoring|game mode|watch.*game|world event)\b/i.test(objectiveText);
}

function objectiveAsksGenericVisual(objectiveText: string): boolean {
  return /\b(?:generic workstation|generic visual|workstation live answer|screen|window|file explorer|folder|document|latest visual observation|do not use minecraft)\b/i.test(objectiveText);
}

export function liveSchemaSelectionToLineDefinitions(selection: HelixLiveSchemaSelection): LiveAnswerLineDefinition[] {
  return selection.selected_schema.map((line) => ({
    key: line.key,
    label: line.label,
    description: line.purpose,
    update_policy: line.key === "next_check" || line.key === "last_update" ? "projection_only" : "episode_based",
    visibility: "answer_card",
    priority: line.key === "uncertainty" || line.key === "risk" ? "warn" : line.key === "next_check" ? "action" : "info",
  }));
}

export function selectLiveSchemaForEnvironment(input: {
  environment: LiveAnswerEnvironment;
  objectiveText?: string | null;
  descriptors?: HelixLiveSourceDescriptor[] | null;
  observations?: HelixObservationJournalEntry[] | null;
  activeModalities?: string[] | null;
  explicitPreset?: string | null;
  now?: string | null;
}): HelixLiveSchemaSelection {
  const objectiveText = input.objectiveText ?? input.environment.objective;
  const sourceIds = new Set(input.environment.source_ids);
  const descriptors = input.descriptors ?? listLiveSourceDescriptors({
    threadId: input.environment.thread_id,
    environmentId: input.environment.environment_id,
    limit: 80,
  });
  const looseDescriptors = descriptors.length > 0
    ? descriptors
    : listLiveSourceDescriptors({ threadId: input.environment.thread_id, limit: 80 })
        .filter((descriptor) => sourceIds.size === 0 || sourceIds.has(descriptor.source_id));
  const observations = input.observations ?? listObservationJournalEntries({
    threadId: input.environment.thread_id,
    limit: 80,
  }).filter((entry) => !entry.source_id || sourceIds.size === 0 || sourceIds.has(entry.source_id));
  const excludedDomains = excludedLiveSchemaDomains(objectiveText);
  const explicitPreset = input.explicitPreset && input.explicitPreset !== "custom" ? input.explicitPreset : null;
  const genericSource = sourceLooksGenericWorkstation(looseDescriptors, observations);
  const gameSource = sourceLooksGame(looseDescriptors, observations);
  const wantsGeneric = objectiveAsksGenericVisual(objectiveText) || excludedDomains.includes("game");
  const wantsGame = objectiveAsksGameMonitoring(objectiveText);
  const environmentMinecraftPreset =
    input.environment.preset === "minecraft_run_monitor" &&
    wantsGame &&
    !wantsGeneric &&
    !excludedDomains.includes("game");
  const explicitMinecraft = explicitPreset === "minecraft_run_monitor" || environmentMinecraftPreset;
  const useMinecraft = explicitMinecraft || (!excludedDomains.includes("game") && gameSource && wantsGame && !genericSource && !wantsGeneric);
  const selectedPreset: "generic_visual" | "minecraft_cortana" = useMinecraft ? "minecraft_cortana" : "generic_visual";
  const sourceDescriptorRefs = looseDescriptors.map((descriptor) => descriptor.descriptor_id);
  const observationRefs = observations.slice(-12).map((entry) => entry.observation_id);
  const baseSchema = selectedPreset === "minecraft_cortana"
    ? SOURCE_DESCRIBED_MINECRAFT_VISUAL_SCHEMA
    : SOURCE_DESCRIBED_GENERIC_VISUAL_SCHEMA;
  const selectedSchema = baseSchema.map((line) => toSelectionLine(line, selectedPreset));
  const rationale = useMinecraft
    ? explicitMinecraft
      ? "Explicit user-selected Minecraft preset is authoritative."
      : "Source descriptor and objective both indicate game monitoring."
    : genericSource
      ? "Source descriptor or recent observations indicate a generic workstation/file/document surface."
      : wantsGeneric
        ? "Objective asks for generic visual/workstation presentation or excludes game-specific assumptions."
        : "No explicit domain preset is supported by source descriptors, so generic visual schema is selected.";
  const confidence = useMinecraft
    ? explicitMinecraft ? 0.92 : 0.76
    : genericSource ? 0.84 : wantsGeneric ? 0.78 : 0.68;
  return {
    schema: HELIX_LIVE_SCHEMA_SELECTION_SCHEMA,
    selection_id: `live_schema_selection:${hashShort([
      input.environment.environment_id,
      objectiveText,
      sourceDescriptorRefs,
      observationRefs.slice(-4),
      selectedPreset,
      explicitPreset,
    ])}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    objective_text: objectiveText,
    source_descriptor_refs: sourceDescriptorRefs,
    observation_refs: observationRefs,
    selected_schema: selectedSchema,
    rationale,
    confidence,
    preset_hint: selectedPreset,
    preset_authority: explicitPreset
      ? "explicit_user_selected"
      : selectedPreset === "minecraft_cortana"
        ? "hint_only"
        : "none",
    assistant_answer: false,
    raw_content_included: false,
  };
}
