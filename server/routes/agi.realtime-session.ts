import { Router } from "express";
import type { Request, Response } from "express";
import { getAccountCapabilityPolicy } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  buildRealtimeClientReceiptResponse,
  buildRealtimeSessionAdmissionResponse,
  buildRealtimeSessionBoundaryResponse,
  buildRealtimeToolSuggestionEventResponse,
  buildRealtimeTranscriptEventResponse,
  resolveRealtimeSessionPolicyGate,
} from "../services/helix-ask/realtime-session/route-boundary";
import { selectRealtimeSessionAdapter } from "../services/helix-ask/realtime-session/adapter";
import {
  isHelixRealtimeToolSuggestionEventType,
  isHelixRealtimeTranscriptEventType,
} from "@shared/helix-realtime-observation";
import type { HelixRealtimeSessionAction } from "@shared/helix-realtime-session";

export const realtimeSessionRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const accountPolicyForRequest = async (req: Request) =>
  getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));

const respondRealtimeBoundary = async (input: {
  req: Request;
  res: Response;
  action: HelixRealtimeSessionAction;
  realtimeSessionId?: string | null;
}) => {
  const body = readRecord(input.req.body);
  const accountPolicy = await accountPolicyForRequest(input.req);
  const policyGate = resolveRealtimeSessionPolicyGate({ accountPolicy, body });
  const adapter = selectRealtimeSessionAdapter();
  const adapterArgs = {
    body,
    realtimeSessionId: input.realtimeSessionId ?? null,
    env: process.env,
  };
  const adapterResult =
    input.action === "start"
      ? await adapter.createSession(adapterArgs)
      : input.action === "stop"
        ? await adapter.stopSession(adapterArgs)
        : input.action === "record_client_receipt"
          ? await adapter.recordClientReceipt(adapterArgs)
          : await adapter.recordProviderEvent(adapterArgs);

  if (!policyGate.runtime_agent_controls_available) {
    return input.res.status(403).json(buildRealtimeSessionBoundaryResponse({
      action: input.action,
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      blockedReason: "account_policy_locked",
      adapterResult,
    }));
  }

  if (
    input.action === "start" &&
    adapterResult.transport_plan.descriptor_enabled &&
    adapterResult.transport_plan.adapter_enabled
  ) {
    return input.res.status(200).json(buildRealtimeSessionAdmissionResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    }));
  }

  if (input.action === "record_client_receipt") {
    return input.res.status(200).json(buildRealtimeClientReceiptResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    }));
  }

  if (input.action === "record_event" && isHelixRealtimeTranscriptEventType(body.event_type)) {
    return input.res.status(200).json(buildRealtimeTranscriptEventResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    }));
  }

  if (input.action === "record_event" && isHelixRealtimeToolSuggestionEventType(body.event_type)) {
    return input.res.status(200).json(buildRealtimeToolSuggestionEventResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    }));
  }

  return input.res.status(409).json(buildRealtimeSessionBoundaryResponse({
    action: input.action,
    accountPolicy,
    body,
    realtimeSessionId: input.realtimeSessionId ?? null,
    blockedReason: adapterResult.blocked_reason === "realtime_adapter_disabled_by_env"
      ? "capability_lane_disabled_by_policy"
      : adapterResult.blocked_reason,
    adapterResult,
  }));
};

realtimeSessionRouter.post("/realtime/session", async (req: Request, res: Response) =>
  respondRealtimeBoundary({
    req,
    res,
    action: "start",
  }),
);

realtimeSessionRouter.post("/realtime/session/:id/stop", async (req: Request, res: Response) =>
  respondRealtimeBoundary({
    req,
    res,
    action: "stop",
    realtimeSessionId: req.params.id,
  }),
);

realtimeSessionRouter.post("/realtime/session/:id/client-receipt", async (req: Request, res: Response) =>
  respondRealtimeBoundary({
    req,
    res,
    action: "record_client_receipt",
    realtimeSessionId: req.params.id,
  }),
);

realtimeSessionRouter.post("/realtime/session/:id/event", async (req: Request, res: Response) =>
  respondRealtimeBoundary({
    req,
    res,
    action: "record_event",
    realtimeSessionId: req.params.id,
  }),
);
