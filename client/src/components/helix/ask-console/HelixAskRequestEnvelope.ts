import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAskContextBridgeSnapshot } from "./HelixAskContextBridge";

export type HelixAskConsoleRequestEnvelope = {
  question: string;
  agentRuntime: HelixAgentRuntimeId;
  agent_runtime: HelixAgentRuntimeId;
  doc_path?: string;
};

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

function normalizeAskConsoleDocPath(value: unknown): string {
  const text = coerceText(value).trim();
  if (!text) return "";
  return text.replace(/\\/g, "/").replace(/^workspace:\/\//i, "").replace(/^\/+/, "");
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function buildHelixAskConsoleContextFiles(args: {
  docsViewerAnchorPath?: string | null;
  workspaceContextSnapshot?: Record<string, unknown> | null;
}): string[] | undefined {
  const candidates = [
    args.docsViewerAnchorPath,
    args.workspaceContextSnapshot?.activeDocPath,
    args.workspaceContextSnapshot?.active_doc_path,
    args.workspaceContextSnapshot?.docContextPath,
    args.workspaceContextSnapshot?.doc_context_path,
  ]
    .map(normalizeAskConsoleDocPath)
    .filter(Boolean);
  const unique = dedupeStrings(candidates);
  return unique.length > 0 ? unique : undefined;
}

export function buildHelixAskConsoleRequestEnvelope(args: {
  question: string;
  agentRuntime: HelixAgentRuntimeId;
  context: HelixAskContextBridgeSnapshot;
}): HelixAskConsoleRequestEnvelope {
  const envelope: HelixAskConsoleRequestEnvelope = {
    question: args.question,
    agentRuntime: args.agentRuntime,
    agent_runtime: args.agentRuntime,
  };
  if (args.context.activeDocPath) envelope.doc_path = args.context.activeDocPath;
  return envelope;
}

export function buildHelixAskConsoleBackendTurnPayloadCore(args: {
  sessionId?: string | null;
  agentRuntime: HelixAgentRuntimeId;
  traceId: string;
  turnId: string;
  maxTokens: number;
  question: string;
  contextFiles?: string[];
  docPath?: string | null;
}) {
  const activeDocPath =
    normalizeAskConsoleDocPath(args.docPath) ||
    normalizeAskConsoleDocPath(args.contextFiles?.[0]);
  return {
    sessionId: args.sessionId ?? undefined,
    agentRuntime: args.agentRuntime,
    agent_runtime: args.agentRuntime,
    traceId: args.traceId,
    turnId: args.turnId,
    maxTokens: args.maxTokens,
    question: args.question,
    ...(activeDocPath
      ? {
          doc_path: activeDocPath,
          active_doc_path: activeDocPath,
        }
      : {}),
    contextFiles: args.contextFiles,
  };
}
