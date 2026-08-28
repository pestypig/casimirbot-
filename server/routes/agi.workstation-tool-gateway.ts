import { Router } from "express";
import type { Request, Response } from "express";
import {
  callAccountAuthorizedWorkstationGatewayCapability,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  resolveWorkstationGatewayAccountContext,
} from "../services/helix-ask/workstation-tool-gateway/account-policy";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  isRealtimeTexturePackHarnessAction,
  sanitizeRealtimeTexturePackHarnessClientState,
} from "@shared/realtime-texture-pack-harness";
import { realtimeTexturePackHarnessStore } from "../services/helix-ask/workstation-tool-gateway/realtime-texture-pack-harness-store";

export const workstationToolGatewayRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

workstationToolGatewayRouter.get(
  "/workstation-tool-gateway/capabilities",
  async (req: Request, res: Response) => {
    const accountContext = await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(req.headers.cookie),
    );
    const requestedMode = readString(req.query.mode);
    const requestedRuntime =
      readString(req.query.agent_runtime) ?? readString(req.query.agentRuntime);
    return res.status(200).json(
      listAccountAuthorizedWorkstationGatewayCapabilities({
        accountContext,
        requestedMode,
        requestedRuntime,
      }),
    );
  },
);

workstationToolGatewayRouter.post(
  "/workstation-tool-gateway/call",
  async (req: Request, res: Response) => {
    const body = readRecord(req.body);
    const accountContext = await resolveWorkstationGatewayAccountContext(
      readHelixSessionCookie(req.headers.cookie),
    );
    const result = await callAccountAuthorizedWorkstationGatewayCapability({
      accountContext,
      requestedMode: readString(body.mode),
      requestedRuntime:
        readString(body.agent_runtime) ?? readString(body.agentRuntime),
      capabilityId:
        readString(body.capability_id) ?? readString(body.capabilityId) ?? "",
      arguments: readRecord(body.arguments ?? body.args),
      approvalReceipt: body.approval_receipt ?? body.approvalReceipt,
      approvalToken:
        readString(body.approval_token) ?? readString(body.approvalToken),
      turnId: readString(body.turn_id) ?? readString(body.turnId),
      conversationThreadId:
        readString(body.conversation_thread_id) ??
        readString(body.conversationThreadId),
      toolCallId:
        readString(body.tool_call_id) ?? readString(body.toolCallId),
      providerExecutionId:
        readString(body.provider_execution_id) ??
        readString(body.providerExecutionId),
      iteration: typeof body.iteration === "number" ? body.iteration : null,
    });
    return res.status(result.status_code).json(result.body);
  },
);

const requireRealtimeTexturePackDeveloper = async (req: Request, res: Response) => {
  const context = await resolveWorkstationGatewayAccountContext(
    readHelixSessionCookie(req.headers.cookie),
  );
  if (
    context.account_policy.account_type !== "developer" ||
    !context.trusted_account_session ||
    !context.profile_id
  ) {
    res.status(403).json({
      ok: false,
      error: "realtime_texture_pack_developer_session_required",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    return null;
  }
  return context;
};

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/harness/lease",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const operation = readString(body.operation);
    const sessionId = readString(body.session_id);
    if (operation === "disable") {
      return res.status(200).json({
        ok: true,
        harness: realtimeTexturePackHarnessStore.revoke(context.profile_id, sessionId),
      });
    }
    if (!sessionId) return res.status(400).json({ ok: false, error: "session_id_required" });
    const actions = Array.isArray(body.allowed_actions)
      ? body.allowed_actions.filter(isRealtimeTexturePackHarnessAction)
      : [];
    return res.status(200).json({
      ok: true,
      harness: realtimeTexturePackHarnessStore.renew({
        profileId: context.profile_id,
        sessionId,
        allowedActions: actions,
        clientState: sanitizeRealtimeTexturePackHarnessClientState(body.client_state),
      }),
    });
  },
);

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/harness/poll",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const sessionId = readString(body.session_id);
    if (!sessionId) return res.status(400).json({ ok: false, error: "session_id_required" });
    const actions = Array.isArray(body.allowed_actions)
      ? body.allowed_actions.filter(isRealtimeTexturePackHarnessAction)
      : [];
    realtimeTexturePackHarnessStore.renew({
      profileId: context.profile_id,
      sessionId,
      allowedActions: actions,
      clientState: sanitizeRealtimeTexturePackHarnessClientState(body.client_state),
    });
    return res.status(200).json(realtimeTexturePackHarnessStore.poll(context.profile_id, sessionId));
  },
);

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/harness/ack",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const sessionId = readString(body.session_id);
    const commandId = readString(body.command_id);
    const outcome = body.outcome === "completed" ? "completed" : "blocked";
    if (!sessionId || !commandId) return res.status(400).json({ ok: false, error: "command_identity_required" });
    const acknowledged = realtimeTexturePackHarnessStore.acknowledge({
      profileId: context.profile_id,
      sessionId,
      commandId,
      outcome,
      failureReason: readString(body.failure_reason),
    });
    return res.status(acknowledged ? 200 : 404).json({ ok: acknowledged });
  },
);
