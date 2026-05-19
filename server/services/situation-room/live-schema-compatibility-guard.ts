import {
  type LiveAnswerEnvironment,
  type LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";
import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import {
  type HelixLiveSchemaCompatibility,
  type HelixLiveSchemaSelection,
} from "@shared/helix-live-schema-selection";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import {
  liveSchemaSelectionToLineDefinitions,
  selectLiveSchemaForEnvironment,
} from "./live-schema-selection-engine";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const hasGameLine = (lines: LiveAnswerLineDefinition[]): boolean =>
  lines.some((line) => ["place", "structure", "entities", "risk", "missing_evidence"].includes(line.key));

const hasGenericLine = (lines: LiveAnswerLineDefinition[]): boolean =>
  lines.some((line) => line.key === "scene") && lines.some((line) => line.key === "objects");

const descriptorIsFileManager = (descriptor: HelixLiveSourceDescriptor): boolean =>
  descriptor.serving_context.surface === "file_manager" ||
  /\b(?:file explorer|windows explorer|finder|folder|directory)\b/.test(lower(`${descriptor.serving_context.app_hint ?? ""} ${descriptor.serving_context.window_title_hint ?? ""} ${descriptor.user_label ?? ""}`));

export function inspectLiveSchemaCompatibility(input: {
  environment: LiveAnswerEnvironment;
  selection?: HelixLiveSchemaSelection | null;
  descriptors?: HelixLiveSourceDescriptor[] | null;
  activeModalities?: string[] | null;
}): HelixLiveSchemaCompatibility {
  const descriptors = input.descriptors ?? listLiveSourceDescriptors({
    threadId: input.environment.thread_id,
    environmentId: input.environment.environment_id,
    limit: 80,
  });
  const scopedDescriptors = descriptors.length > 0
    ? descriptors
    : listLiveSourceDescriptors({ threadId: input.environment.thread_id, limit: 80 })
        .filter((descriptor) => input.environment.source_ids.includes(descriptor.source_id));
  const selection = input.selection ?? selectLiveSchemaForEnvironment({
    environment: input.environment,
    descriptors: scopedDescriptors,
    activeModalities: input.activeModalities,
  });
  const selectedDefinitions = liveSchemaSelectionToLineDefinitions(selection);
  const sourceRefs = scopedDescriptors.map((descriptor) => descriptor.descriptor_id);
  const capabilityModalities = input.activeModalities ?? buildSituationSourceCapabilities({
    threadId: input.environment.thread_id,
    roomId: input.environment.room_id ?? null,
  }).filter((entry) => entry.status === "active").map((entry) => entry.modality);
  const issues: HelixLiveSchemaCompatibility["issues"] = [];
  const selectedGeneric = hasGenericLine(selectedDefinitions) && !hasGameLine(selectedDefinitions);
  const currentGame = hasGameLine(input.environment.line_schema);
  if (selectedGeneric && currentGame) {
    issues.push({
      code: "generic_objective_with_domain_schema",
      severity: "warn",
      summary: "Current live card has domain/game lines, but source-described schema selection is generic visual.",
      evidence_refs: [selection.selection_id, ...sourceRefs],
    });
  }
  if (scopedDescriptors.some(descriptorIsFileManager) && currentGame) {
    issues.push({
      code: "file_manager_with_game_lines",
      severity: "warn",
      summary: "A file-manager source should not retain Place/Structure/Entities/Risk lines unless explicitly selected.",
      evidence_refs: sourceRefs,
    });
  }
  if (
    input.environment.line_schema.some((line) => line.key === "risk") &&
    !capabilityModalities.includes("world_event") &&
    selection.preset_hint !== "minecraft_cortana" &&
    selection.preset_hint !== "environment_run_monitor"
  ) {
    issues.push({
      code: "world_risk_without_world_source",
      severity: "info",
      summary: "Risk/world-event line exists without an active world-event source.",
      evidence_refs: [selection.selection_id],
    });
  }
  if (/\b(?:set|interval|cadence|rate|pause|resume)\b/.test(lower(input.environment.objective)) && hasGameLine(input.environment.line_schema)) {
    issues.push({
      code: "control_prompt_in_schema",
      severity: "warn",
      summary: "A source-control prompt appears to have been retained as live-card schema context.",
      evidence_refs: [selection.selection_id],
    });
  }
  return {
    schema: "helix.live_schema_compatibility.v1",
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    selection_id: selection.selection_id,
    ok: issues.length === 0,
    issues,
    recommended_schema: issues.length > 0 ? selectedDefinitions : null,
    assistant_answer: false,
    raw_content_included: false,
  };
}
