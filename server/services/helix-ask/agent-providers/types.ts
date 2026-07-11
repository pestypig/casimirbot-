import type { IncomingHttpHeaders } from "node:http";
import type {
  HelixAgentPermissionProfile,
  HelixAgentRuntimeId,
} from "@shared/helix-agent-runtime";

export type HelixAgentRunRoute = "/ask/turn" | "/ask/turn/stream" | "/ask";

export type HelixAgentRunRequest = {
  runtime: HelixAgentRuntimeId;
  route: HelixAgentRunRoute;
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
  signal?: AbortSignal;
  onTranscriptEvent?: (event: Record<string, unknown>) => void;
};

export type HelixAgentRuntimeEvent = {
  event:
    | "agent_runtime_selected"
    | "agent_message_delta"
    | "agent_tool_request"
    | "agent_tool_result"
    | "agent_final"
    | "agent_error"
    | string;
  data: Record<string, unknown>;
};

export type HelixAgentRunResult = {
  ok: boolean;
  runtime: HelixAgentRuntimeId;
  response_type: string;
  final_status: string;
  text?: string;
  answer?: string;
  selected_final_answer?: string;
  turn_transcript_events?: Record<string, unknown>[];
  turn_transcript_event_count?: number;
  turn_transcript_source?: string;
  action_envelope?: Record<string, unknown> | null;
  workstation_actions?: Record<string, unknown>[];
  support_refs?: string[];
  tool_output_refs?: string[];
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  terminal_error_code?: string | null;
  terminal_failure_text?: string | null;
  typed_failure?: Record<string, unknown> | null;
  current_turn_artifact_ledger?: Record<string, unknown> | null;
  compound_evidence_synthesis_answer?: Record<string, unknown>;
  compound_capability_contract?: Record<string, unknown>;
  debug?: Record<string, unknown>;
  raw?: unknown;
};

export type HelixAgentProvider = {
  id: HelixAgentRuntimeId;
  label: string;
  permissionProfile: HelixAgentPermissionProfile;
  enabled(): boolean;
  runtimeStatus?(): {
    launchable: boolean;
    reason: string | null;
    resolved_bin: string | null;
    args: string[];
  };
  supports: {
    streaming: boolean;
    workstationTools: boolean;
    capabilityLanes: boolean;
    capabilityLaneOneShot: boolean;
    capabilityLaneSessions: boolean;
    codeMutation: boolean;
  };
  runTurn(request: HelixAgentRunRequest): Promise<HelixAgentRunResult>;
  streamTurn?(request: HelixAgentRunRequest): AsyncIterable<HelixAgentRuntimeEvent>;
};
