import {
  HELIX_LIVE_COGNITION_TOOL_SCHEMA,
  type HelixLiveCognitionTool,
  type HelixLiveCognitionToolRegistryRead,
} from "@shared/helix-live-cognition-tool";

export const LIVE_COGNITION_TOOL_REGISTRY_VERSION = "helix.live_cognition_tools.v1";

const wildcard = ["*"];

const tool = (input: Omit<HelixLiveCognitionTool, "schema" | "creates_assistant_answer">): HelixLiveCognitionTool => ({
  schema: HELIX_LIVE_COGNITION_TOOL_SCHEMA,
  creates_assistant_answer: false,
  ...input,
});

const tools: HelixLiveCognitionTool[] = [
  tool({
    tool_id: "minecraft.query_event_window",
    family: "minecraft_event",
    label: "Query event window",
    input_requirements: ["thread_id_or_room_id", "line_key"],
    output_evidence_kind: "missing_evidence",
    allowed_line_keys: ["now", "activity", "risk", "structure", "progress", "unknowns", "next_check"],
    can_run_automatically: true,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "minecraft.query_world_sense_window",
    family: "minecraft_world_sense",
    label: "Query world-sense window",
    input_requirements: ["room_id", "line_key"],
    output_evidence_kind: "verification",
    allowed_line_keys: ["place", "activity", "entities", "goal", "hypothesis", "missing_evidence"],
    can_run_automatically: true,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "minecraft.lookup_semantics",
    family: "semantic",
    label: "Lookup Minecraft semantics",
    input_requirements: ["line_value_or_refs"],
    output_evidence_kind: "semantic_reference",
    allowed_line_keys: ["place", "activity", "entities", "goal", "hypothesis", "missing_evidence"],
    can_run_automatically: true,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "visual.align_latest_with_event_window",
    family: "visual",
    label: "Align latest visual frame",
    input_requirements: ["latest_visual_frame", "event_window"],
    output_evidence_kind: "verification",
    allowed_line_keys: ["place", "activity", "structure", "entities", "missing_evidence", "next_check", "unknowns"],
    can_run_automatically: false,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "visual.capture_now",
    family: "visual",
    label: "Capture frame now",
    input_requirements: ["permission_bound_visual_source"],
    output_evidence_kind: "visual_frame_evidence",
    allowed_line_keys: ["place", "activity", "structure", "entities", "risk", "next_check"],
    can_run_automatically: false,
    requires_user_confirmation: true,
  }),
  tool({
    tool_id: "visual.compare_to_place_memory",
    family: "visual",
    label: "Compare visual frame to place memory",
    input_requirements: ["latest_visual_frame", "place_memory"],
    output_evidence_kind: "review",
    allowed_line_keys: ["place", "activity", "structure", "missing_evidence"],
    can_run_automatically: false,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "scientific-calculator.solve_with_steps",
    family: "calculator",
    label: "Solve with calculator",
    input_requirements: ["equation_or_numeric_expression"],
    output_evidence_kind: "calculation",
    allowed_line_keys: ["current_equation", "latest_result", "calculation", "computation", "progress"],
    can_run_automatically: true,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "docs-viewer.lookup_reference",
    family: "docs",
    label: "Lookup document reference",
    input_requirements: ["claim_or_document_ref"],
    output_evidence_kind: "verification",
    allowed_line_keys: ["claim", "evidence", "counterpoint", "open_question", "caveat"],
    can_run_automatically: false,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "workstation-notes.append_to_note",
    family: "notes",
    label: "Append to notes",
    input_requirements: ["compact_summary"],
    output_evidence_kind: "storage",
    allowed_line_keys: wildcard,
    can_run_automatically: false,
    requires_user_confirmation: true,
  }),
  tool({
    tool_id: "situation-room.run_agentic_review",
    family: "review",
    label: "Run agentic review",
    input_requirements: ["selected_context"],
    output_evidence_kind: "review",
    allowed_line_keys: wildcard,
    can_run_automatically: false,
    requires_user_confirmation: false,
  }),
  tool({
    tool_id: "situation-room.run_present_state_review",
    family: "review",
    label: "Review present state",
    input_requirements: ["present_state_card", "selected_evidence"],
    output_evidence_kind: "review",
    allowed_line_keys: wildcard,
    can_run_automatically: false,
    requires_user_confirmation: false,
  }),
];

export function listLiveCognitionTools(): HelixLiveCognitionTool[] {
  return [...tools];
}

export function getLiveCognitionTool(toolId: string): HelixLiveCognitionTool | null {
  return tools.find((entry) => entry.tool_id === toolId) ?? null;
}

export function readLiveCognitionToolRegistry(): HelixLiveCognitionToolRegistryRead {
  return {
    schema: "helix.live_cognition_tool_registry_read.v1",
    registry_version: LIVE_COGNITION_TOOL_REGISTRY_VERSION,
    tools: listLiveCognitionTools(),
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
}
