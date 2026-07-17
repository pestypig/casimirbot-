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
import { readRealtimeSessionFeatureGate } from "../services/helix-ask/realtime-session/config";
import {
  admitRealtimeSession,
  buildRealtimeRequesterRef,
  readAdmittedRealtimeSession,
  removeAdmittedRealtimeSession,
  updateAdmittedRealtimeSession,
} from "../services/helix-ask/realtime-session/session-registry";
import {
  exchangeOpenAiRealtimeSdp,
  isValidRealtimeOfferSdp,
} from "../services/helix-ask/realtime-session/sdp-transport";
import { bridgeRealtimeTranscriptToStagePlay } from "../services/helix-ask/live-source/realtime-stage-play-handoff";
import {
  recordRealtimeStagePlayActivity,
  startRealtimeStagePlaySideband,
} from "../services/helix-ask/realtime-session/sideband-context-sync";
import { buildRealtimeStagePlayDebugProvenance } from "../services/helix-ask/realtime-session/debug-provenance";
import { createRealtimeGroundedAnswerFeedbackMiddleware } from "../services/helix-ask/realtime-session/grounded-answer-feedback";
import { recordRealtimeGroundedRelayClientReceipt } from "../services/helix-ask/realtime-session/grounded-answer-relay";
import {
  isHelixRealtimeToolSuggestionEventType,
  isHelixRealtimeTranscriptEventType,
} from "@shared/helix-realtime-observation";
import {
  HELIX_REALTIME_SDP_EXCHANGE_RESPONSE_SCHEMA,
  type HelixRealtimeSdpExchangeResponse,
  type HelixRealtimeSessionAction,
} from "@shared/helix-realtime-session";
import {
  mergeRealtimeWorkstationSourceBinding,
  readSafeRealtimeSourceBinding,
} from "../services/helix-ask/realtime-session/source-binding";

export const realtimeSessionRouter = Router();

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const accountPolicyForRequest = async (req: Request) =>
  getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readThreadId = (body: Record<string, unknown>, sourceBinding: Record<string, unknown> | null): string =>
  /^helix-ask:[A-Za-z0-9._:-]{1,160}$/.test(
    readString(sourceBinding?.thread_id ?? body.thread_id ?? body.threadId) ?? "",
  )
    ? readString(sourceBinding?.thread_id ?? body.thread_id ?? body.threadId)!
    : "helix-ask:desktop";

const requesterRefForRequest = (req: Request): string =>
  buildRealtimeRequesterRef(readHelixSessionCookie(req.headers.cookie));

const buildSdpExchangeResponse = (
  patch: Partial<HelixRealtimeSdpExchangeResponse> &
    Pick<HelixRealtimeSdpExchangeResponse, "ok" | "error" | "blocked_reason">,
): HelixRealtimeSdpExchangeResponse => ({
  schema: HELIX_REALTIME_SDP_EXCHANGE_RESPONSE_SCHEMA,
  ok: patch.ok,
  error: patch.error,
  blocked_reason: patch.blocked_reason,
  realtime_session_id: patch.realtime_session_id ?? null,
  provider_call_ref: patch.provider_call_ref ?? null,
  answer_sdp: patch.answer_sdp ?? null,
  openai_network_call_attempted: patch.openai_network_call_attempted === true,
  webrtc_started: patch.webrtc_started === true,
  sideband_started: patch.sideband_started === true,
  realtime_stage_play_context_sync: patch.realtime_stage_play_context_sync ?? null,
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const respondRealtimeBoundary = async (input: {
  req: Request;
  res: Response;
  action: HelixRealtimeSessionAction;
  realtimeSessionId?: string | null;
}) => {
  const body = readRecord(input.req.body);
  const accountPolicy = await accountPolicyForRequest(input.req);
  const policyGate = resolveRealtimeSessionPolicyGate({ accountPolicy, body });

  if (!policyGate.runtime_agent_controls_available) {
    return input.res.status(403).json(buildRealtimeSessionBoundaryResponse({
      action: input.action,
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      blockedReason: "account_policy_locked",
    }));
  }

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

  if (
    input.action === "start" &&
    adapterResult.ok === true &&
    adapterResult.blocked_reason === "openai_realtime_contract_ready"
  ) {
    const response = buildRealtimeSessionAdmissionResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    });
    const consentReceipt = readString(
      body.visible_user_consent_receipt ?? body.visibleUserConsentReceipt,
    );
    if (response.realtime_session_id && consentReceipt) {
      const sourceBinding = readSafeRealtimeSourceBinding(body.source_binding ?? body.sourceBinding);
      admitRealtimeSession({
        realtimeSessionId: response.realtime_session_id,
        requesterRef: requesterRefForRequest(input.req),
        visibleUserConsentReceipt: consentReceipt,
        model:
          readString(body.selected_model_or_service ?? body.selectedModelOrService) ??
          "gpt-realtime-2.1",
        voice: readString(body.selected_realtime_voice ?? body.selectedRealtimeVoice ?? body.voice),
        threadId: readThreadId(body, sourceBinding),
        sourceBinding,
      });
    }
    return input.res.status(200).json(response);
  }

  if (
    input.action === "start" &&
    adapterResult.transport_plan.descriptor_enabled &&
    adapterResult.transport_plan.adapter_enabled &&
    adapterResult.adapter_id === "openai_realtime_stub"
  ) {
    return input.res.status(200).json(buildRealtimeSessionAdmissionResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    }));
  }

  if (input.action === "record_client_receipt") {
    const session = input.realtimeSessionId
      ? readAdmittedRealtimeSession({
          realtimeSessionId: input.realtimeSessionId,
          requesterRef: requesterRefForRequest(input.req),
        })
      : null;
    const receiptKind = readString(body.receipt_kind ?? body.receiptKind);
    if (session && receiptKind) {
      recordRealtimeGroundedRelayClientReceipt({
        realtimeSessionId: session.realtimeSessionId,
        receiptKind,
        clientReceiptRef: readString(body.client_receipt_ref ?? body.clientReceiptRef),
        providerResponseRef: readString(body.provider_response_ref ?? body.providerResponseRef),
        nowMs: typeof body.observed_at_ms === "number" ? body.observed_at_ms : undefined,
      });
      const activities = new Set([
        "vad_speech_started",
        "vad_speech_stopped",
        "response_started",
        "response_completed",
        "response_failed",
        "response_interrupted",
        "playback_started",
        "playback_ended",
        "playback_failed",
      ]);
      if (activities.has(receiptKind)) {
        recordRealtimeStagePlayActivity({
          realtimeSessionId: session.realtimeSessionId,
          activity: receiptKind as Parameters<typeof recordRealtimeStagePlayActivity>[0]["activity"],
        });
      }
    }
    const response = buildRealtimeClientReceiptResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    });
    const refreshed = session
      ? readAdmittedRealtimeSession({
          realtimeSessionId: session.realtimeSessionId,
          requesterRef: session.requesterRef,
        })
      : null;
    return input.res.status(200).json(refreshed
      ? {
          ...response,
          server_sideband_requested: Boolean(refreshed.providerCallId),
          sideband_started: refreshed.sidebandState === "open",
          realtime_stage_play_context_sync: refreshed.latestContextSync,
          realtime_runtime_session_summary: {
            ...response.realtime_runtime_session_summary,
            sideband_started: refreshed.sidebandState === "open",
          },
        }
      : response);
  }

  if (input.action === "stop" && input.realtimeSessionId) {
    removeAdmittedRealtimeSession({
      realtimeSessionId: input.realtimeSessionId,
      requesterRef: requesterRefForRequest(input.req),
    });
  }

  if (input.action === "record_event" && isHelixRealtimeTranscriptEventType(body.event_type)) {
    const response = buildRealtimeTranscriptEventResponse({
      accountPolicy,
      body,
      realtimeSessionId: input.realtimeSessionId ?? null,
      adapterResult,
    });
    const session = input.realtimeSessionId
      ? readAdmittedRealtimeSession({
          realtimeSessionId: input.realtimeSessionId,
          requesterRef: requesterRefForRequest(input.req),
        })
      : null;
    const currentWorkstationSourceBinding = readSafeRealtimeSourceBinding(
      body.workstation_source_binding ?? body.workstationSourceBinding,
    );
    const contextualSession = session && currentWorkstationSourceBinding
      ? updateAdmittedRealtimeSession({
          realtimeSessionId: session.realtimeSessionId,
          requesterRef: session.requesterRef,
          patch: {
            sourceBinding: mergeRealtimeWorkstationSourceBinding({
              base: session.sourceBinding,
              current: currentWorkstationSourceBinding,
            }),
          },
        }) ?? session
      : session;
    const observation = response.realtime_transcript_observations[0] ?? null;
    const transcriptText = readString(body.transcript_text ?? body.transcriptText ?? body.text);
    const providerEventRef = readString(body.event_ref ?? body.eventRef) ?? observation?.observation_ref ?? null;
    const handoff = contextualSession && observation && transcriptText && providerEventRef && body.event_type === "transcript.final"
      ? bridgeRealtimeTranscriptToStagePlay({
          realtimeSessionId: contextualSession.realtimeSessionId,
          threadId: contextualSession.threadId,
          providerEventRef,
          transcriptText,
          observation,
          sourceBinding: contextualSession.sourceBinding,
          providerCallRef: contextualSession.providerCallRef,
          transportReceiptRef: readString(
            body.realtime_transport_receipt_ref ?? body.transport_receipt_ref,
          ),
          vadState: readString(body.realtime_vad_state ?? body.vad_state),
          interruptionCount:
            typeof body.realtime_interruption_count === "number"
              ? body.realtime_interruption_count
              : null,
          audioFocusOwner: readString(body.realtime_audio_focus_owner ?? body.audio_focus_owner),
          qualifiedUserInterruption: body.qualified_user_interruption === true,
          terminalVoiceInterrupted: body.terminal_voice_interrupted === true,
        })
      : null;
    const refreshed = contextualSession
      ? readAdmittedRealtimeSession({
          realtimeSessionId: contextualSession.realtimeSessionId,
          requesterRef: contextualSession.requesterRef,
        })
      : null;
    return input.res.status(200).json({
      ...response,
      ...(handoff ? { realtime_stage_play_ask_handoff: handoff } : {}),
      ...(refreshed
        ? {
            server_sideband_requested: Boolean(refreshed.providerCallId),
            sideband_started: refreshed.sidebandState === "open",
            realtime_stage_play_context_sync: refreshed.latestContextSync,
            realtime_runtime_session_summary: {
              ...response.realtime_runtime_session_summary,
              sideband_started: refreshed.sidebandState === "open",
              session_lifecycle: handoff
                ? [
                    ...response.realtime_runtime_session_summary.session_lifecycle,
                    "stage_play_conversation_event_recorded",
                    "server_readonly_ask_handoff_issued",
                  ]
                : response.realtime_runtime_session_summary.session_lifecycle,
            },
          }
        : {}),
    });
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
      : adapterResult.blocked_reason === "openai_realtime_contract_ready"
        ? "openai_realtime_contract_failed"
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

realtimeSessionRouter.post("/realtime/session/:id/sdp", async (req: Request, res: Response) => {
  const accountPolicy = await accountPolicyForRequest(req);
  if (
    accountPolicy.account_type !== "developer" ||
    accountPolicy.locked_features.includes("runtime_agent_controls")
  ) {
    return res.status(403).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_runtime_agent_locked_by_account_policy",
      blocked_reason: "developer_runtime_agent_controls_required",
      realtime_session_id: req.params.id,
    }));
  }

  const gate = readRealtimeSessionFeatureGate(process.env);
  if (
    !gate.descriptor_enabled ||
    !gate.adapter_enabled ||
    !gate.live_transport_enabled ||
    !gate.openai_contract_enabled
  ) {
    return res.status(409).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_sdp_exchange_disabled",
      blocked_reason: "realtime_sdp_exchange_disabled_by_env",
      realtime_session_id: req.params.id,
    }));
  }

  const session = readAdmittedRealtimeSession({
    realtimeSessionId: req.params.id,
    requesterRef: requesterRefForRequest(req),
  });
  if (!session) {
    return res.status(404).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_session_not_found",
      blocked_reason: "realtime_session_not_found",
      realtime_session_id: req.params.id,
    }));
  }

  const body = readRecord(req.body);
  const offerSdp = body.offer_sdp ?? body.offerSdp;
  const consentReceipt = readString(
    body.visible_user_consent_receipt ?? body.visibleUserConsentReceipt,
  );
  if (!isValidRealtimeOfferSdp(offerSdp) || consentReceipt !== session.visibleUserConsentReceipt) {
    return res.status(400).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_sdp_offer_invalid",
      blocked_reason:
        consentReceipt !== session.visibleUserConsentReceipt
          ? "visible_user_consent_receipt_mismatch"
          : "realtime_sdp_offer_invalid",
      realtime_session_id: req.params.id,
    }));
  }

  const apiKey = readString(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    return res.status(409).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_sdp_exchange_disabled",
      blocked_reason: "missing_openai_key",
      realtime_session_id: req.params.id,
    }));
  }

  const result = await exchangeOpenAiRealtimeSdp({
    apiKey,
    offerSdp,
    model: session.model,
    voice: session.voice,
    safetyIdentifier: session.requesterRef,
  });
  if (!result.ok || !result.answerSdp) {
    return res.status(502).json(buildSdpExchangeResponse({
      ok: false,
      error: "realtime_openai_contract_failed",
      blocked_reason: readString(result.failureReason) ?? "openai_realtime_contract_failed",
      realtime_session_id: req.params.id,
      openai_network_call_attempted: true,
    }));
  }

  const providerCallRef = readString(result.providerCallRef);
  updateAdmittedRealtimeSession({
    realtimeSessionId: session.realtimeSessionId,
    requesterRef: session.requesterRef,
    patch: {
      providerCallId: readString(result.providerCallId),
      providerCallRef,
    },
  });
  const contextSync = result.providerCallId && providerCallRef
    ? startRealtimeStagePlaySideband({
        realtimeSessionId: session.realtimeSessionId,
        requesterRef: session.requesterRef,
        providerCallId: result.providerCallId,
        providerCallRef,
        apiKey,
      })
    : null;
  const refreshed = readAdmittedRealtimeSession({
    realtimeSessionId: session.realtimeSessionId,
    requesterRef: session.requesterRef,
  });

  return res.status(200).json(buildSdpExchangeResponse({
    ok: true,
    error: null,
    blocked_reason: null,
    realtime_session_id: req.params.id,
    provider_call_ref: providerCallRef,
    answer_sdp: result.answerSdp,
    openai_network_call_attempted: true,
    webrtc_started: true,
    sideband_started: refreshed?.sidebandState === "open",
    realtime_stage_play_context_sync: refreshed?.latestContextSync ?? contextSync,
  }));
});

realtimeSessionRouter.get("/realtime/session/:id/debug", async (req: Request, res: Response) => {
  const accountPolicy = await accountPolicyForRequest(req);
  if (
    accountPolicy.account_type !== "developer" ||
    accountPolicy.locked_features.includes("runtime_agent_controls")
  ) {
    return res.status(403).json({
      ok: false,
      error: "realtime_runtime_agent_locked_by_account_policy",
      raw_content_included: false,
    });
  }
  const session = readAdmittedRealtimeSession({
    realtimeSessionId: req.params.id,
    requesterRef: requesterRefForRequest(req),
  });
  if (!session) {
    return res.status(404).json({
      ok: false,
      error: "realtime_session_not_found",
      raw_content_included: false,
    });
  }
  return res.status(200).json(buildRealtimeStagePlayDebugProvenance(session));
});

// This extracted middleware observes only server-final Ask responses carrying a
// previously issued Realtime handoff. It does not sample, execute tools, or write
// terminal answers.
realtimeSessionRouter.use(createRealtimeGroundedAnswerFeedbackMiddleware());
