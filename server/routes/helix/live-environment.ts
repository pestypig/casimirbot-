import { Router } from "express";
import type { Request, Response } from "express";
import type { HelixLiveEnvironmentToolName } from "../../../shared/helix-live-agent-step";
import { recordInterimVoicePlaybackOutcome } from "../../services/helix-ask/interim-voice-callout-store";
import { executeLiveEnvironmentTool } from "../../services/helix-ask/live-environment-tool-adapter";

export const helixLiveEnvironmentRouter = Router();

const CLIENT_ALLOWED_LIVE_ENV_TOOLS = new Set<HelixLiveEnvironmentToolName>([
  "live_env.record_voice_steering",
  "live_env.request_interim_voice_callout",
]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

helixLiveEnvironmentRouter.post("/tool", (req: Request, res: Response) => {
  const body = readRecord(req.body) ?? {};
  const toolName = readString(body.tool_name ?? body.toolName) as HelixLiveEnvironmentToolName | null;
  if (!toolName || !CLIENT_ALLOWED_LIVE_ENV_TOOLS.has(toolName)) {
    return res.status(400).json({
      ok: false,
      error: "live_environment_tool_not_allowed",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }
  const threadId = readString(body.thread_id ?? body.threadId) ?? "helix-ask:desktop";
  const environmentId = readString(body.environment_id ?? body.environmentId);
  const args = readRecord(body.args) ?? {};
  const observation = executeLiveEnvironmentTool({
    tool_name: toolName,
    thread_id: threadId,
    environment_id: environmentId,
    args,
  });
  return res.status(observation.ok ? 200 : 422).json({
    ok: observation.ok,
    observation,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  });
});

helixLiveEnvironmentRouter.post("/voice-playback/outcome", (req: Request, res: Response) => {
  const body = readRecord(req.body) ?? {};
  const result = recordInterimVoicePlaybackOutcome({
    requestId: readString(body.request_id ?? body.requestId),
    sourceReceiptId: readString(body.source_receipt_id ?? body.sourceReceiptId),
    utteranceId: readString(body.utterance_id ?? body.utteranceId),
    status: readString(body.status),
    message: readString(body.message ?? body.error),
    provider: readString(body.provider),
  });
  return res.status(result.ok ? 200 : 422).json({
    ok: result.ok,
    request: result.request,
    receipt: result.receipt,
    error: result.error ?? null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  });
});
