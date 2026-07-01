import type { HelixAgentRuntimeId } from "./helix-agent-runtime";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneId,
} from "./helix-capability-lane";

export const HELIX_CAPABILITY_LANE_SESSION_SCHEMA =
  "helix.capability_lane.session.v1" as const;
export const HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA =
  "helix.capability_lane.session_event.v1" as const;
export const HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA =
  "helix.capability_lane.session_debug_summary.v1" as const;

export type HelixCapabilityLaneSessionStatus =
  | "running"
  | "paused"
  | "stopped"
  | "blocked";

export type HelixCapabilityLaneSessionHealth =
  | "healthy"
  | "degraded"
  | "blocked"
  | "stopped";

export type HelixCapabilityLaneSessionAction =
  | "start"
  | "pause"
  | "resume"
  | "stop";

export type HelixCapabilityLaneSessionSourceBinding = {
  source_id: string;
  source_kind:
    | "docs"
    | "docs_hover"
    | "docs_selection"
    | "audio"
    | "visual"
    | "ask_turn"
    | "unknown";
  projection_target: string | null;
  account_locale: string | null;
};

export type HelixCapabilityLaneSessionPermissions = {
  read: boolean;
  observe: boolean;
  act: boolean;
  write: false;
  shell: false;
  code_mutation: false;
};

export type HelixCapabilityLaneSessionEvent = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA;
  event_id: string;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  action: HelixCapabilityLaneSessionAction;
  status: HelixCapabilityLaneSessionStatus;
  at_ms: number;
  reason: string;
  source_id: string | null;
  observation_ref: string | null;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSession = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  status: HelixCapabilityLaneSessionStatus;
  health: HelixCapabilityLaneSessionHealth;
  source_binding: HelixCapabilityLaneSessionSourceBinding;
  permissions: HelixCapabilityLaneSessionPermissions;
  created_at_ms: number;
  updated_at_ms: number;
  last_observation_ref: string | null;
  debug_history: HelixCapabilityLaneSessionEvent[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSessionDebugSummary = {
  schema: typeof HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA;
  lane_session_id: string;
  lane_id: HelixCapabilityLaneId;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  selected_backend_provider: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  session_status: HelixCapabilityLaneSessionStatus;
  session_health: HelixCapabilityLaneSessionHealth;
  source_id: string | null;
  source_kind: HelixCapabilityLaneSessionSourceBinding["source_kind"];
  projection_target: string | null;
  account_locale: string | null;
  created_at_ms: number;
  updated_at_ms: number;
  last_observation_ref: string | null;
  latest_session_event: HelixCapabilityLaneSessionEvent | null;
  session_event_count: number;
  terminal_authority_status: "not_terminal_authority" | "pending_helix_terminal_authority";
  reentry_required: true;
  backend_provider_becomes_root_agent: false;
  final_reports_require_terminal_authority: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneSessionResult = {
  ok: boolean;
  action: HelixCapabilityLaneSessionAction;
  lane_session: HelixCapabilityLaneSession | null;
  blocked_reason: string | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
