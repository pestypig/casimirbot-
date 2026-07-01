import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";

import {
  buildHelixAskConsoleBackendTurnPayloadCore,
  buildHelixAskConsoleContextFiles,
} from "./HelixAskRequestEnvelope";
import type { HelixAskMinimalRuntimeSubmitPlan } from "./HelixAskMinimalRuntimeSubmitPlan";

export type HelixAskMinimalRuntimeTurnPayload = {
  sessionId?: string;
  agentRuntime: HelixAgentRuntimeId;
  agent_runtime: HelixAgentRuntimeId;
  traceId: string;
  turnId: string;
  maxTokens: number;
  question: string;
  contextFiles?: string[];
};

export type HelixAskMinimalRuntimeStreamEvent = {
  event: string;
  data: unknown;
};

export type HelixAskMinimalRuntimeTransportResult = {
  text?: string;
  turn_id?: string | null;
  debug?: unknown;
  [key: string]: unknown;
};

export type HelixAskMinimalRuntimeTurnRunner = (
  payload: HelixAskMinimalRuntimeTurnPayload,
  onEvent?: (event: HelixAskMinimalRuntimeStreamEvent) => void,
) => Promise<HelixAskMinimalRuntimeTransportResult>;

export function buildHelixAskMinimalRuntimeTurnPayload(args: {
  submitPlan: HelixAskMinimalRuntimeSubmitPlan;
  sessionId?: string | null;
  traceId: string;
  turnId: string;
  maxTokens: number;
}): HelixAskMinimalRuntimeTurnPayload | null {
  const envelope = args.submitPlan.envelope;
  if (!envelope?.question.trim()) return null;
  return buildHelixAskConsoleBackendTurnPayloadCore({
    sessionId: args.sessionId,
    agentRuntime: envelope.agent_runtime,
    traceId: args.traceId,
    turnId: args.turnId,
    maxTokens: args.maxTokens,
    question: envelope.question,
    contextFiles: buildHelixAskConsoleContextFiles({
      docsViewerAnchorPath: args.submitPlan.context.activeDocPath,
    }),
  });
}

export async function runHelixAskMinimalRuntimeInjectedTransport(args: {
  runner: HelixAskMinimalRuntimeTurnRunner;
  payload: HelixAskMinimalRuntimeTurnPayload;
  onEvent?: (event: HelixAskMinimalRuntimeStreamEvent) => void;
}): Promise<HelixAskMinimalRuntimeTransportResult> {
  return args.runner(args.payload, args.onEvent);
}
