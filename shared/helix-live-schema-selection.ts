import type { LiveAnswerLineDefinition } from "./helix-live-answer-environment";

export const HELIX_LIVE_SCHEMA_SELECTION_SCHEMA =
  "helix.live_schema_selection.v1" as const;

export type HelixLiveSchemaPresetHint =
  | "minecraft_cortana"
  | "generic_visual"
  | "equation_stream"
  | "transcript_compare"
  | "document_math"
  | null;

export type HelixLiveSchemaPresetAuthority =
  | "none"
  | "hint_only"
  | "explicit_user_selected";

export type HelixLiveSchemaSelectionLine = {
  key: string;
  label: string;
  purpose: string;
  primary_modalities: string[];
  default_tool?: string | null;
};

export type HelixLiveSchemaSelection = {
  schema: typeof HELIX_LIVE_SCHEMA_SELECTION_SCHEMA;
  selection_id: string;
  thread_id: string;
  environment_id: string;
  objective_text: string;
  source_descriptor_refs: string[];
  observation_refs: string[];
  selected_schema: HelixLiveSchemaSelectionLine[];
  rationale: string;
  confidence: number;
  preset_hint?: HelixLiveSchemaPresetHint;
  preset_authority: HelixLiveSchemaPresetAuthority;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixLiveSchemaCompatibilityIssue = {
  code:
    | "generic_objective_with_domain_schema"
    | "file_manager_with_game_lines"
    | "world_risk_without_world_source"
    | "stale_schema_retained"
    | "control_prompt_in_schema";
  severity: "info" | "warn" | "error";
  summary: string;
  evidence_refs: string[];
};

export type HelixLiveSchemaCompatibility = {
  schema: "helix.live_schema_compatibility.v1";
  thread_id: string;
  environment_id: string;
  selection_id: string;
  ok: boolean;
  issues: HelixLiveSchemaCompatibilityIssue[];
  recommended_schema?: LiveAnswerLineDefinition[] | null;
  assistant_answer: false;
  raw_content_included: false;
};
