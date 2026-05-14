export const HELIX_LIVE_LINE_TOOL_REQUEST_SCHEMA =
  "helix.live_line_tool_request.v1" as const;

export type HelixLiveLineRequestedTool =
  | "minecraft.query_event_window"
  | "minecraft.query_world_sense_window"
  | "minecraft.lookup_semantics"
  | "scientific-calculator.solve_with_steps"
  | "docs-viewer.lookup_reference"
  | "workstation-notes.create_note"
  | "workstation-notes.append_to_note"
  | "situation-room.run_agentic_review"
  | "live-environment.run_window_review";

export type HelixLiveLineExpectedEvidenceKind =
  | "verification"
  | "missing_evidence"
  | "semantic_reference"
  | "calculation"
  | "storage"
  | "review"
  | "debug_replay";

export type HelixLiveLineToolRequestReason =
  | "missing_evidence"
  | "verify_math"
  | "lookup_semantics"
  | "query_event_window"
  | "store_context"
  | "review_uncertainty";

export type HelixLiveLineToolRequestPriority =
  | "info"
  | "warn"
  | "critical"
  | "action";

export type HelixLiveLineToolRequestStatus =
  | "proposed"
  | "approved"
  | "dispatched"
  | "observed"
  | "evaluated"
  | "dismissed"
  | "failed";

export type HelixLiveLineToolRequest = {
  schema: typeof HELIX_LIVE_LINE_TOOL_REQUEST_SCHEMA;
  request_id: string;
  thread_id: string;
  environment_id?: string | null;
  artifact_id?: string | null;
  line_key: string;
  line_label: string;
  hypothesis_id?: string | null;
  subgoal_id?: string | null;
  requested_tool: HelixLiveLineRequestedTool;
  reason: HelixLiveLineToolRequestReason;
  reason_summary: string;
  expected_evidence_kind: HelixLiveLineExpectedEvidenceKind;
  priority: HelixLiveLineToolRequestPriority;
  status: HelixLiveLineToolRequestStatus;
  evidence_refs: string[];
  deterministic_content_role: "evidence_not_assistant_answer";
  raw_content_included: false;
  assistant_answer: false;
  created_at: string;
};
