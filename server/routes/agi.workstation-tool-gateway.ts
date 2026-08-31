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
  isRealtimeTexturePackVisualDirectionCommand,
  sanitizeRealtimeTexturePackHarnessClientState,
} from "@shared/realtime-texture-pack-harness";
import { realtimeTexturePackHarnessStore } from "../services/helix-ask/workstation-tool-gateway/realtime-texture-pack-harness-store";
import {
  parseRealtimeTexturePackTransformRequest,
  type RealtimeTexturePackTransformRequestV1,
} from "@shared/realtime-texture-pack";
import {
  AttendedFalSessionError,
  attendedFalSessionStore,
  readAttendedFalReadinessFromRuntime,
} from "../services/realtime-texture-pack/attended-fal-session";
import { attendedFalRuntimeRegistry } from "../services/realtime-texture-pack/attended-fal-runtime";

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

const attendedFalReadiness = () => readAttendedFalReadinessFromRuntime({
  sdkAvailable: attendedFalRuntimeRegistry.sdkAvailable(),
});

const attendedFalFailure = (res: Response, error: unknown, fallbackStatus = 409) => {
  const code = error instanceof AttendedFalSessionError
    ? error.code
    : error instanceof Error && /^[a-z0-9_]{1,160}$/u.test(error.message)
      ? error.message
      : "attended_fal_operation_failed";
  const status = code.endsWith("_required") || code.endsWith("_invalid") ? 400 : fallbackStatus;
  return res.status(status).json({
    ok: false,
    error: code,
    credential_included: false,
    prompt_included: false,
    pixels_included: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

workstationToolGatewayRouter.get(
  "/realtime-texture-pack/fal/readiness",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    return res.status(200).json({ ok: true, readiness: attendedFalReadiness() });
  },
);

workstationToolGatewayRouter.get(
  "/realtime-texture-pack/fal/session",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    return res.status(200).json({
      ok: true,
      session: attendedFalSessionStore.inspect(context.profile_id),
      credential_included: false,
      prompt_included: false,
      pixels_included: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  },
);

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/fal/session/arm",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const sessionId = readString(body.session_id);
    if (!sessionId) return attendedFalFailure(res, new AttendedFalSessionError("session_id_required"), 400);
    try {
      const session = attendedFalSessionStore.arm({
        profileId: context.profile_id,
        sessionId,
        readiness: attendedFalReadiness(),
        approvalVersion: readString(body.approval_version) ?? "",
        providerId: readString(body.provider_id) ?? "",
        durationCapSeconds: Number(body.duration_cap_seconds),
        requestCap: Number(body.request_cap),
        spendCapUsd: Number(body.spend_cap_usd),
        externalFrameEgressAcknowledged: body.external_frame_egress_acknowledged === true,
        billableCallsAcknowledged: body.billable_calls_acknowledged === true,
      });
      return res.status(200).json({ ok: true, session });
    } catch (error) {
      return attendedFalFailure(res, error);
    }
  },
);

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/fal/transform",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const requestCandidate = body.request as RealtimeTexturePackTransformRequestV1;
    try {
      const request = parseRealtimeTexturePackTransformRequest(requestCandidate);
      const permit = attendedFalSessionStore.beginRequest({
        profileId: context.profile_id,
        sessionId: request.session_id,
        requestId: request.request_id,
      });
      let timeout: ReturnType<typeof setTimeout> | null = null;
      let aborted = false;
      const abortProvider = () => {
        aborted = true;
        void attendedFalRuntimeRegistry.close({
          profileId: context.profile_id!,
          sessionId: request.session_id,
        });
      };
      req.once("aborted", abortProvider);
      const startedAt = Date.now();
      try {
        const frame = await Promise.race([
          attendedFalRuntimeRegistry.transform({
            profileId: context.profile_id,
            sessionId: request.session_id,
            request,
          }),
          new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(
              () => reject(new AttendedFalSessionError("provider_request_timeout")),
              permit.max_runtime_ms,
            );
          }),
        ]);
        const session = attendedFalSessionStore.settleRequest({
          profileId: context.profile_id,
          sessionId: request.session_id,
          requestId: request.request_id,
          providerComputeMs: Math.max(0, Date.now() - startedAt),
          accepted: true,
        });
        if (aborted || res.writableEnded) return;
        return res.status(200).json({ ok: true, frame, session });
      } catch (error) {
        if (error instanceof AttendedFalSessionError && error.code === "provider_request_timeout") {
          await attendedFalRuntimeRegistry.close({ profileId: context.profile_id, sessionId: request.session_id });
          attendedFalSessionStore.cancel({
            profileId: context.profile_id,
            sessionId: request.session_id,
            reason: "provider_request_timeout",
          });
        } else {
          try {
            attendedFalSessionStore.settleRequest({
              profileId: context.profile_id,
              sessionId: request.session_id,
              requestId: request.request_id,
              providerComputeMs: Math.min(permit.max_runtime_ms, Math.max(0, Date.now() - startedAt)),
              accepted: false,
            });
          } catch {
            await attendedFalRuntimeRegistry.close({ profileId: context.profile_id, sessionId: request.session_id });
          }
        }
        if (aborted || res.writableEnded) return;
        return attendedFalFailure(res, error, 502);
      } finally {
        if (timeout) clearTimeout(timeout);
        req.off("aborted", abortProvider);
      }
    } catch (error) {
      return attendedFalFailure(res, error, 400);
    }
  },
);

workstationToolGatewayRouter.post(
  "/realtime-texture-pack/fal/session/stop",
  async (req: Request, res: Response) => {
    const context = await requireRealtimeTexturePackDeveloper(req, res);
    if (!context?.profile_id) return;
    const body = readRecord(req.body);
    const sessionId = readString(body.session_id);
    if (!sessionId) return attendedFalFailure(res, new AttendedFalSessionError("session_id_required"), 400);
    try {
      await attendedFalRuntimeRegistry.close({ profileId: context.profile_id, sessionId });
      const session = attendedFalSessionStore.cancel({
        profileId: context.profile_id,
        sessionId,
        reason: readString(body.reason) ?? "user_stopped",
      });
      return res.status(200).json({ ok: true, session });
    } catch (error) {
      return attendedFalFailure(res, error, 404);
    }
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
    const visualDirectionCommands = Array.isArray(body.allowed_visual_direction_commands)
      ? body.allowed_visual_direction_commands.filter(isRealtimeTexturePackVisualDirectionCommand)
      : [];
    return res.status(200).json({
      ok: true,
      harness: realtimeTexturePackHarnessStore.renew({
        profileId: context.profile_id,
        sessionId,
        allowedActions: actions,
        visualDirectionControlEnabled: body.visual_direction_control_enabled === true,
        allowedVisualDirectionCommands: visualDirectionCommands,
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
    const visualDirectionCommands = Array.isArray(body.allowed_visual_direction_commands)
      ? body.allowed_visual_direction_commands.filter(isRealtimeTexturePackVisualDirectionCommand)
      : [];
    realtimeTexturePackHarnessStore.renew({
      profileId: context.profile_id,
      sessionId,
      allowedActions: actions,
      visualDirectionControlEnabled: body.visual_direction_control_enabled === true,
      allowedVisualDirectionCommands: visualDirectionCommands,
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
      appliedConfigurationRevision:
        typeof body.applied_configuration_revision === "number" &&
        Number.isInteger(body.applied_configuration_revision)
          ? body.applied_configuration_revision
          : null,
      clientState: sanitizeRealtimeTexturePackHarnessClientState(body.client_state),
    });
    return res.status(acknowledged ? 200 : 404).json({ ok: acknowledged });
  },
);
