export const HELIX_WORKSTATION_REASONING_TRACE_SCHEMA =
  "helix.workstation_reasoning_trace.v1" as const;

export type HelixWorkstationReasoningTraceSourceFamily =
  | "multimodal"
  | "minecraft_events"
  | "calculator"
  | "docs"
  | "notes"
  | "situation_room"
  | "custom";

export type HelixWorkstationReasoningTraceExtractionScope =
  | "hotbar"
  | "inventory"
  | "chest"
  | "container"
  | "visible_items"
  | "scene"
  | "text"
  | "custom"
  | "unknown";

export type HelixWorkstationReasoningTraceScopeMatch =
  | "exact"
  | "partial"
  | "mismatch"
  | "unknown";

export type HelixWorkstationReasoningTraceProofStatus =
  | "complete"
  | "partial"
  | "failed";

export type HelixWorkstationReasoningTraceStep = {
  label: string;
  summary: string;
  artifact_ref?: string | null;
  status: "completed" | "partial" | "failed" | "skipped";
};

export type HelixWorkstationReasoningTrace = {
  schema: typeof HELIX_WORKSTATION_REASONING_TRACE_SCHEMA;
  trace_id: string;
  thread_id: string;
  turn_id: string;
  source_family: HelixWorkstationReasoningTraceSourceFamily;
  user_goal: string;
  route_reason_code: string;
  input_item_refs: string[];
  evidence_refs: string[];
  tool_receipt_ids: string[];
  lifecycle_event_refs: string[];
  artifacts: {
    multimodal_subgoal_plan_id?: string | null;
    visual_extraction_id?: string | null;
    derived_equation_id?: string | null;
    workstation_tool_plan_id?: string | null;
    workstation_tool_evaluation_id?: string | null;
    terminal_authority_hash?: string | null;
    poison_audit_id?: string | null;
  };
  requested_extraction_scope: HelixWorkstationReasoningTraceExtractionScope;
  actual_extraction_scope: HelixWorkstationReasoningTraceExtractionScope;
  scope_match: HelixWorkstationReasoningTraceScopeMatch;
  proof_status: HelixWorkstationReasoningTraceProofStatus;
  compact_steps: HelixWorkstationReasoningTraceStep[];
  caveats: string[];
  final_answer_snapshot: string;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
