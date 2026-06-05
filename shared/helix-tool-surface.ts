export const HELIX_TOOL_SURFACE_ENTRY_SCHEMA = "helix.tool_surface_entry.v1" as const;
export const HELIX_TOOL_SURFACE_PACKET_SCHEMA = "helix.tool_surface_packet.v1" as const;

export type HelixToolRuntimeShape = "open_panel" | "run_panel_action";

export type HelixToolExecutionTarget =
  | "client_only"
  | "server_only"
  | "hybrid"
  | "observation_only";

export type HelixToolSurfaceEntry = {
  schema: typeof HELIX_TOOL_SURFACE_ENTRY_SCHEMA;
  capability_key: string;
  panel_id: string;
  action: string;
  display_name: string;
  description: string;
  runtime_shape: HelixToolRuntimeShape;
  execution_target: HelixToolExecutionTarget;
  mutating: boolean;
  manual_only: boolean;
  explicit_attachment_only: boolean;
  confirmation_required: boolean;
  requires_active_panel: boolean;
  active_panel_boost: boolean;
  source_requirements: Array<{
    source_kind: string;
    required: boolean;
  }>;
  input_schema: Record<string, unknown>;
  expected_observation_schema: string;
  terminal_eligible: false;
  safety_tags: string[];
  route_tags: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixToolSurfaceOmittedReason =
  | "irrelevant_to_goal"
  | "manual_only"
  | "explicit_attachment_missing"
  | "unsafe_without_confirmation"
  | "too_many_candidates"
  | "requires_missing_source"
  | "contextual_tool_reference_suppressed";

export type HelixToolSurfacePacket = {
  schema: typeof HELIX_TOOL_SURFACE_PACKET_SCHEMA;
  turn_id: string;
  total_registered_tools: number;
  visible_panel_count: number;
  workspace_action_count: number;
  entries: HelixToolSurfaceEntry[];
  omitted: Array<{
    panel_id: string;
    count: number;
    reason: HelixToolSurfaceOmittedReason;
  }>;
  active_panels: Array<{
    panel_id: string;
    active: boolean;
    focused: boolean;
  }>;
  generation_reason: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixToolSurfaceDebugSnapshot = {
  schema: "helix.tool_surface_debug_snapshot.v1";
  total_dynamic_tools: number;
  grouped_by_panel: Record<string, string[]>;
  visible_panels: string[];
  workspace_actions: string[];
  workspace_os_tools?: string[];
  open_panel_mappings: number;
  run_panel_action_mappings: number;
  manual_only_count: number;
  explicit_attachment_only_count: number;
  assistant_answer: false;
  raw_content_included: false;
};
