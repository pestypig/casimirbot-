import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixLanguageModelProfileId } from "@shared/helix-language-model-policy";
import type { HelixAskRouteMetadata } from "@/lib/helix/ask-prompt-launch";

import {
  buildHelixAskConsoleBackendTurnPayloadCore,
  buildHelixAskConsoleContextFiles,
} from "./HelixAskRequestEnvelope";
import type { HelixAskMinimalRuntimeSubmitPlan } from "./HelixAskMinimalRuntimeSubmitPlan";

export type HelixAskMinimalRuntimeTurnPayload = {
  sessionId?: string;
  agentRuntime: HelixAgentRuntimeId;
  agent_runtime: HelixAgentRuntimeId;
  languageModelProfile?: HelixLanguageModelProfileId;
  language_model_profile?: HelixLanguageModelProfileId;
  traceId: string;
  turnId: string;
  maxTokens: number;
  question: string;
  contextFiles?: string[];
  workspace_context_snapshot?: Record<string, unknown>;
  routeMetadata?: HelixAskRouteMetadata;
  route_metadata?: HelixAskRouteMetadata;
  bypassWorkstationDispatch?: boolean;
  bypass_workstation_dispatch?: boolean;
  forceReasoningDispatch?: boolean;
  force_reasoning_dispatch?: boolean;
  requiresBackendAskEntrypoint?: boolean;
  requires_backend_ask_entrypoint?: boolean;
  suppressWorkstationPayloadActions?: boolean;
  suppress_workstation_payload_actions?: boolean;
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
    languageModelProfile: envelope.language_model_profile,
    traceId: args.traceId,
    turnId: args.turnId,
    maxTokens: args.maxTokens,
    question: envelope.question,
    contextFiles: buildHelixAskConsoleContextFiles({
      docsViewerAnchorPath: args.submitPlan.context.activeDocPath,
      workspaceContextSnapshot: args.submitPlan.context as unknown as Record<string, unknown>,
    }),
    workspaceContextSnapshot: args.submitPlan.context as unknown as Record<string, unknown>,
    routeMetadata: args.submitPlan.pendingPrompt?.routeMetadata,
    bypassWorkstationDispatch: args.submitPlan.pendingPrompt?.bypassWorkstationDispatch,
    forceReasoningDispatch: args.submitPlan.pendingPrompt?.forceReasoningDispatch,
    requiresBackendAskEntrypoint: args.submitPlan.pendingPrompt?.requiresBackendAskEntrypoint,
    suppressWorkstationPayloadActions: args.submitPlan.pendingPrompt?.suppressWorkstationPayloadActions,
  });
}

export async function runHelixAskMinimalRuntimeInjectedTransport(args: {
  runner: HelixAskMinimalRuntimeTurnRunner;
  payload: HelixAskMinimalRuntimeTurnPayload;
  onEvent?: (event: HelixAskMinimalRuntimeStreamEvent) => void;
}): Promise<HelixAskMinimalRuntimeTransportResult> {
  return args.runner(args.payload, args.onEvent);
}
