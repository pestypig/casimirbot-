import type { IncomingHttpHeaders } from "node:http";
import {
  DEFAULT_HELIX_AGENT_RUNTIME_ID,
  HELIX_AGENT_RUNTIME_IDS,
  type HelixAgentRuntimeId,
} from "@shared/helix-agent-runtime";

const runtimeSet = new Set<string>(HELIX_AGENT_RUNTIME_IDS);

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export function selectHelixAgentRuntime(input: {
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
}): HelixAgentRuntimeId {
  const fromBody =
    readString(input.body.agent_runtime) ||
    readString(input.body.agentRuntime);

  const rawHeader = input.headers?.["x-helix-agent-runtime"];
  const fromHeader = Array.isArray(rawHeader)
    ? readString(rawHeader[0])
    : readString(rawHeader);

  const fromEnv = readString(process.env.HELIX_ASK_AGENT_RUNTIME);
  const selected = fromBody || fromHeader || fromEnv || DEFAULT_HELIX_AGENT_RUNTIME_ID;

  return runtimeSet.has(selected) ? (selected as HelixAgentRuntimeId) : DEFAULT_HELIX_AGENT_RUNTIME_ID;
}
