export const HELIX_LIVE_COGNITION_TOOL_SCHEMA =
  "helix.live_cognition_tool.v1" as const;

export type HelixLiveCognitionToolFamily =
  | "minecraft_event"
  | "minecraft_world_sense"
  | "visual"
  | "semantic"
  | "calculator"
  | "docs"
  | "notes"
  | "review";

export type HelixLiveCognitionTool = {
  schema: typeof HELIX_LIVE_COGNITION_TOOL_SCHEMA;
  tool_id: string;
  family: HelixLiveCognitionToolFamily;
  label: string;
  input_requirements: string[];
  output_evidence_kind: string;
  allowed_line_keys: string[];
  can_run_automatically: boolean;
  requires_user_confirmation: boolean;
  creates_assistant_answer: false;
};

export type HelixLiveCognitionToolRegistryRead = {
  schema: "helix.live_cognition_tool_registry_read.v1";
  registry_version: string;
  tools: HelixLiveCognitionTool[];
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
