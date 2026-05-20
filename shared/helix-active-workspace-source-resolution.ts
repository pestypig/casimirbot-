import type { HelixAskSourceTarget } from "./helix-ask-source-target-intent";

export const HELIX_ACTIVE_WORKSPACE_SOURCE_RESOLUTION_SCHEMA =
  "helix.active_workspace_source_resolution.v1" as const;

export type HelixActiveWorkspaceSourceResolutionReason =
  | "active_docs_viewer_valid_doc"
  | "generic_deictic_bound_to_active_docs"
  | "active_doc_location_prompt"
  | "explicit_visual_prompt_bypasses_workspace"
  | "ambiguous_without_active_workspace_source"
  | "no_active_workspace_resolution";

export type HelixActiveWorkspaceSourceResolution = {
  schema: typeof HELIX_ACTIVE_WORKSPACE_SOURCE_RESOLUTION_SCHEMA;
  turn_id: string;
  prompt_hash: string;
  active_panel: string | null;
  active_doc_path: string | null;
  doc_context_valid: boolean;
  generic_deictic: boolean;
  explicit_visual: boolean;
  resolved_source_target: HelixAskSourceTarget;
  resolved_target_kind: HelixAskSourceTarget;
  requested_terminal_kind: string | null;
  reason: HelixActiveWorkspaceSourceResolutionReason;
  confidence: number;
  assistant_answer: false;
  raw_content_included: false;
};
