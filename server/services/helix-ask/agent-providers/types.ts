import type { IncomingHttpHeaders } from "node:http";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";

export type HelixAgentRunRoute = "/ask/turn" | "/ask/turn/stream" | "/ask";

export type HelixAgentRunRequest = {
  runtime: HelixAgentRuntimeId;
  route: HelixAgentRunRoute;
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
  signal?: AbortSignal;
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
  debug?: Record<string, unknown>;
  raw?: unknown;
};

export type HelixAgentProvider = {
  id: HelixAgentRuntimeId;
  label: string;
  enabled(): boolean;
  supports: {
    streaming: boolean;
    workstationTools: boolean;
    codeMutation: boolean;
  };
  runTurn(request: HelixAgentRunRequest): Promise<HelixAgentRunResult>;
  streamTurn?(request: HelixAgentRunRequest): AsyncIterable<HelixAgentRuntimeEvent>;
};
