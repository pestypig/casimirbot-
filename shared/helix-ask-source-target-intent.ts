export const HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA =
  "helix.ask_source_target_intent.v1" as const;

export type HelixAskSourceTarget =
  | "visual_capture"
  | "world_event"
  | "docs_viewer"
  | "active_doc"
  | "active_note"
  | "workspace_panel"
  | "procedure_memory"
  | "model_only"
  | "unknown";

export type HelixAskSourceTargetIntent = {
  schema: typeof HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA;
  turn_id: string;
  thread_id: string;
  target_source: HelixAskSourceTarget;
  explicit_cues: string[];
  suppressed_routes: string[];
  precedence_reason: string;
  confidence: number;
  assistant_answer: false;
  raw_content_included: false;
};
