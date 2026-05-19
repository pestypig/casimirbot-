import crypto from "node:crypto";
import type { HelixVisualFrameEvidence } from "@shared/helix-visual-frame-evidence";
import {
  LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS,
  type LiveAnswerEnvironment,
  type LiveAnswerLineDefinition,
} from "@shared/helix-live-answer-environment";
import type { HelixSituationSourceModality } from "@shared/helix-situation-source-capability";
import {
  HELIX_LIVE_LINE_SCHEMA_DERIVATION_SCHEMA,
  type HelixLiveLineSchemaDerivation,
} from "@shared/helix-live-line-schema-derivation";
import {
  liveSchemaSelectionToLineDefinitions,
  selectLiveSchemaForEnvironment,
} from "./live-schema-selection-engine";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const line = (
  key: string,
  label: string,
  purpose: string,
  primaryModality: HelixSituationSourceModality | "mixed",
  initialValue: string,
  evidenceRefs: string[],
  missingEvidence: string[],
  nextBestTool?: string | null,
): HelixLiveLineSchemaDerivation["line_schema"][number] => ({
  key,
  label,
  description: purpose,
  update_policy: key === "next_check" || key === "last_update" ? "projection_only" : "episode_based",
  visibility: "answer_card",
  priority: key === "uncertainty" || key === "risk" ? "warn" : "info",
  purpose,
  primary_modality: primaryModality,
  initial_value: initialValue,
  evidence_refs: evidenceRefs,
  missing_evidence: missingEvidence,
  next_best_tool: nextBestTool ?? null,
});

export const GENERIC_VISUAL_LIVE_LINE_SCHEMA: LiveAnswerLineDefinition[] = [
  { key: "scene", label: "Scene", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "activity", label: "Activity", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "objects", label: "Objects", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "evidence", label: "Evidence", update_policy: "episode_based", visibility: "answer_card", priority: "info" },
  { key: "uncertainty", label: "Uncertainty", update_policy: "projection_only", visibility: "answer_card", priority: "warn" },
  { key: "next_check", label: "Next check", update_policy: "projection_only", visibility: "answer_card", priority: "action" },
  { key: "last_update", label: "Last update", update_policy: "projection_only", visibility: "answer_card", priority: "info" },
];

export function deriveLiveLineSchema(input: {
  environment: LiveAnswerEnvironment;
  visualEvidence?: HelixVisualFrameEvidence | null;
  activeModalities?: HelixSituationSourceModality[];
  now?: string;
}): HelixLiveLineSchemaDerivation {
  const now = input.now ?? new Date().toISOString();
  const evidence = input.visualEvidence ?? null;
  const evidenceRefs = evidence ? [evidence.evidence_id] : [`live_answer_environment:${input.environment.environment_id}:line_schema_derivation`];
  const summary = evidence?.summary?.trim() || "";
  const objects = evidence?.detected_objects?.length ? evidence.detected_objects.join(", ") : "Waiting for visual objects.";
  const uncertainty = evidence?.uncertainty?.length
    ? evidence.uncertainty.join("; ")
    : evidence
      ? "No audio or world-event corroboration is attached yet."
      : "Waiting for the first analyzed visual frame.";
  const missing = [
    ...(input.activeModalities?.includes("audio_transcript") ? [] : ["audio transcript source is not attached"]),
    ...(input.activeModalities?.includes("world_event") ? [] : ["world-event source is not attached"]),
  ];
  const schemaSelection = selectLiveSchemaForEnvironment({
    environment: input.environment,
    activeModalities: input.activeModalities,
    observations: evidence
      ? [{
          schema: "helix.observation_journal_entry.v1",
          observation_id: `observation:visual-evidence:${evidence.evidence_id}`,
          thread_id: input.environment.thread_id,
          room_id: input.environment.room_id ?? null,
          source_id: evidence.source_id ?? null,
          modality: "visual_frame",
          role: "model_perception_observation",
          text: summary,
          summary,
          evidence_refs: [evidence.evidence_id],
          model_invoked: true,
          confidence: null,
          raw_content_included: false,
          assistant_answer: false,
          context_policy: "compact_context_pack_only",
          created_at: evidence.ts ?? now,
        }]
      : null,
  });
  const selectedKeys = new Set(liveSchemaSelectionToLineDefinitions(schemaSelection).map((entry) => entry.key));

  const environmentLines: HelixLiveLineSchemaDerivation["line_schema"] =
    LIVE_ANSWER_ENVIRONMENT_LINE_PRESETS.environment_run_monitor.map((entry: LiveAnswerLineDefinition) =>
      line(
        entry.key,
        entry.label,
        entry.description ?? `${entry.label} line for environment state.`,
        entry.key === "rehearsal" || entry.key === "possibilities" ? "procedure_graph" : entry.key === "affordances" ? "environment_affordance" : "environment_state",
        entry.key === "recommendation" ? "Awaiting rehearsal before recommending action." : `Waiting for ${entry.label.toLowerCase()} evidence.`,
        evidenceRefs,
        missing,
        entry.key === "rehearsal" ? "environment.rehearse_possibility_graph" : "environment.reduce_state_snapshot",
      )
    );

  const schema = schemaSelection.preset_hint === "environment_run_monitor"
    ? environmentLines
    : selectedKeys.has("place") || schemaSelection.preset_hint === "minecraft_cortana"
    ? [
        line("place", "Place", "Current Minecraft place or scene.", "visual_frame", summary || "Waiting for visual or world evidence.", evidenceRefs, missing, "visual.align_latest_with_event_window"),
        line("activity", "Activity", "Current player activity.", "mixed", "Waiting for supported activity evidence.", evidenceRefs, missing, "visual.align_latest_with_event_window"),
        line("structure", "Structure", "Visible or inferred structure purpose.", "mixed", "No structure purpose confirmed yet.", evidenceRefs, missing, "minecraft.query_world_sense_window"),
        line("entities", "Entities", "Visible entities or entity patterns.", "mixed", objects, evidenceRefs, missing, "minecraft.query_world_sense_window"),
        line("risk", "Risk", "Current risk from visual/world evidence.", "world_event", "No risk confirmed without world-event or visual evidence.", evidenceRefs, missing, "minecraft.query_event_window"),
        line("missing_evidence", "Missing evidence", "Source gaps that limit confidence.", "mixed", uncertainty, evidenceRefs, missing, "visual.align_latest_with_event_window"),
        line("next_check", "Next check", "Most useful next verification step.", "mixed", "Capture another frame or attach the world-event source.", evidenceRefs, missing, "visual.align_latest_with_event_window"),
      ]
    : [
        line("scene", "Scene", "What the visual source appears to show.", "visual_frame", summary || "Waiting for first visual frame.", evidenceRefs, missing, "visual.capture_now"),
        line("activity", "Activity", "What appears to be happening now.", "visual_frame", "Waiting for visual activity evidence.", evidenceRefs, missing, "visual.capture_now"),
        line("objects", "Objects", "Visible objects, people, UI, or focal elements.", "visual_frame", objects, evidenceRefs, missing, "visual.capture_now"),
        line("evidence", "Evidence", "Compact evidence basis for the current card.", "mixed", evidence ? "Latest visual frame supports this card." : "No analyzed frame yet.", evidenceRefs, missing, "visual.capture_now"),
        line("uncertainty", "Uncertainty", "What the current sources cannot prove.", "mixed", uncertainty, evidenceRefs, missing, "visual.capture_now"),
        line("next_check", "Next check", "Most useful next verification step.", "mixed", "Capture the next frame or attach audio/world sources if relevant.", evidenceRefs, missing, "visual.capture_now"),
        line("last_update", "Last update", "Most recent visual source update.", "visual_frame", evidence ? `Visual frame analyzed at ${evidence.ts}.` : "Waiting for first frame.", evidenceRefs, missing, "visual.capture_now"),
      ];

  return {
    schema: HELIX_LIVE_LINE_SCHEMA_DERIVATION_SCHEMA,
    derivation_id: `live_line_schema_derivation:${hashShort([input.environment.environment_id, evidence?.evidence_id ?? null, schema.map((entry) => entry.key)])}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    objective: input.environment.objective,
    line_schema: schema,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}
