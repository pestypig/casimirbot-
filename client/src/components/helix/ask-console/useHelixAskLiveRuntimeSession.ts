import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HelixLiveRuntimeAgentAuthority,
  HelixLiveRuntimeAgentMode,
} from "@shared/helix-live-runtime-agent";
import type { HelixRealtimeSessionResponse } from "@shared/helix-realtime-session";
import {
  buildHelixAskLiveRuntimeClientReceiptPayload,
  buildHelixAskLiveRuntimeRouteRequest,
  buildHelixAskLiveRuntimeTransportHandoffPlan,
  type HelixAskLiveRuntimeLifecycleState,
  type HelixAskLiveRuntimeTransportControllerState,
} from "./HelixAskLiveRuntimeLifecycle";
import {
  createHelixAskLiveRuntimeBrowserTransportController,
  type HelixAskLiveRuntimeBrowserTransportController,
} from "./HelixAskLiveRuntimeTransportController";
import { createHelixAskRealtimeProviderEventHandler } from "./HelixAskRealtimeProviderEventHandler";
import { getAudioFocusSnapshot } from "@/lib/audio-focus";

type LiveRuntimeSessionState = {
  lifecycleState: HelixAskLiveRuntimeLifecycleState;
  transportState: HelixAskLiveRuntimeTransportControllerState;
  realtimeSessionId: string | null;
  error: string | null;
  active: boolean;
};

const INITIAL_STATE: LiveRuntimeSessionState = {
  lifecycleState: "off",
  transportState: "idle",
  realtimeSessionId: null,
  error: null,
  active: false,
};

type LiveRuntimeSafeContext = {
  transportReceiptRef: string | null;
  vadState: string | null;
  interruptionCount: number;
};

const postJson = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as T & { blocked_reason?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.blocked_reason || payload.error || `realtime_http_${response.status}`);
  }
  return payload;
};

export const useHelixAskLiveRuntimeSession = (input: {
  enabled: boolean;
  mode: HelixLiveRuntimeAgentMode;
  authority: HelixLiveRuntimeAgentAuthority;
  initialLifecycleState?: HelixAskLiveRuntimeLifecycleState;
  initialTransportState?: HelixAskLiveRuntimeTransportControllerState;
}) => {
  const [state, setState] = useState<LiveRuntimeSessionState>(() => ({
    ...INITIAL_STATE,
    lifecycleState: input.initialLifecycleState ?? INITIAL_STATE.lifecycleState,
    transportState: input.initialTransportState ?? INITIAL_STATE.transportState,
  }));
  const controllerRef = useRef<HelixAskLiveRuntimeBrowserTransportController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const runtimeContextRef = useRef<LiveRuntimeSafeContext>({
    transportReceiptRef: null,
    vadState: null,
    interruptionCount: 0,
  });

  const stop = useCallback(async () => {
    const sessionId = sessionIdRef.current ?? state.realtimeSessionId;
    setState((current) => ({
      ...current,
      lifecycleState: "stopping",
      transportState: "stopping",
    }));
    await controllerRef.current?.stopTransport({ realtimeSessionId: sessionId }).catch(() => null);
    controllerRef.current = null;
    sessionIdRef.current = null;
    runtimeContextRef.current = {
      transportReceiptRef: null,
      vadState: null,
      interruptionCount: 0,
    };
    if (sessionId) {
      await postJson(`/api/agi/realtime/session/${encodeURIComponent(sessionId)}/stop`, {
        receipt_kind: "stop_requested",
        observed_at_ms: Date.now(),
      }).catch(() => null);
    }
    setState({
      lifecycleState: "stopped",
      transportState: "stopped",
      realtimeSessionId: null,
      error: null,
      active: false,
    });
  }, [state.realtimeSessionId]);

  const start = useCallback(async () => {
    if (!input.enabled || state.active || state.lifecycleState === "requesting") return;
    const mode = input.mode === "off" ? "live_voice" : input.mode;
    const observedAtMs = Date.now();
    const consentReceipt = buildHelixAskLiveRuntimeClientReceiptPayload({
      receiptKind: "consent_granted",
      runtimeAgentMode: mode,
      runtimeAgentAuthority: input.authority,
      clientReceiptRef: `receipt:live-runtime:consent:${crypto.randomUUID()}`,
      observedAtMs,
    });
    setState({
      lifecycleState: "requesting",
      transportState: "awaiting_server_session",
      realtimeSessionId: null,
      error: null,
      active: false,
    });
    try {
      const startReceipt = buildHelixAskLiveRuntimeClientReceiptPayload({
        receiptKind: "session_start_requested",
        runtimeAgentMode: mode,
        runtimeAgentAuthority: input.authority,
        clientReceiptRef: consentReceipt.client_receipt_ref,
        observedAtMs,
      });
      const request = buildHelixAskLiveRuntimeRouteRequest(startReceipt);
      const response = await postJson<HelixRealtimeSessionResponse>(request.path, {
        ...request.body,
        runtime_agent_mode: mode,
        runtime_agent_authority: input.authority,
        transport: "webrtc",
        sdp_exchange_mode: "server",
        requested_backend_provider: "realtime_session.openai_realtime",
        selected_model_or_service:
          mode === "live_voice_mini" ? "gpt-realtime-2.1-mini" : "gpt-realtime-2.1",
        selected_realtime_voice: "marin",
        visible_user_consent_receipt: consentReceipt.client_receipt_ref,
      });
      if (!response.ok || !response.realtime_session_id) {
        throw new Error(response.blocked_reason || response.error || "realtime_session_admission_failed");
      }
      const eventHandler = createHelixAskRealtimeProviderEventHandler({
        realtimeSessionId: response.realtime_session_id,
        runtimeAgentAuthority: input.authority,
        selectedRealtimeModel:
          mode === "live_voice_mini" ? "gpt-realtime-2.1-mini" : "gpt-realtime-2.1",
        providerSessionRef: response.provider_session_ref,
        getRuntimeContext: () => ({
          ...runtimeContextRef.current,
          audioFocusOwner: getAudioFocusSnapshot().active_kind,
        }),
        onProjection: (projection) => {
          if (projection.vad_state) {
            runtimeContextRef.current.vadState = projection.vad_state;
          }
          if (projection.response_interrupted) {
            runtimeContextRef.current.interruptionCount += 1;
          }
          const nextLifecycle: HelixAskLiveRuntimeLifecycleState | null = projection.event_kind === "playback"
            ? projection.provider_event_type.endsWith(".done")
              ? "listening"
              : "speaking"
            : projection.event_kind === "interruption" || projection.event_kind === "vad"
              ? "listening"
              : projection.event_kind === "response"
                ? projection.provider_event_type === "response.created"
                  ? "active"
                  : "listening"
              : null;
          if (nextLifecycle) {
            setState((current) => current.realtimeSessionId === response.realtime_session_id
              ? { ...current, lifecycleState: nextLifecycle }
              : current);
          }
        },
      });
      const controller = createHelixAskLiveRuntimeBrowserTransportController({
        onProviderEvent: (event) => {
          void eventHandler.handle(event);
        },
        onAudioState: (audioState) => {
          setState((current) => current.realtimeSessionId === response.realtime_session_id
            ? { ...current, lifecycleState: audioState }
            : current);
        },
      });
      controllerRef.current = controller;
      sessionIdRef.current = response.realtime_session_id;
      const handoffPlan = buildHelixAskLiveRuntimeTransportHandoffPlan({
        consentReceipt,
        serverResponse: response,
      });
      setState((current) => ({
        ...current,
        transportState: "connecting",
        realtimeSessionId: response.realtime_session_id,
      }));
      const result = await controller.startTransport({ handoffPlan, serverResponse: response });
      runtimeContextRef.current.transportReceiptRef = result.receipt.client_receipt_ref;
      await postJson(
        `/api/agi/realtime/session/${encodeURIComponent(response.realtime_session_id)}/client-receipt`,
        {
          ...result.receipt,
          runtime_agent_mode: mode,
          runtime_agent_authority: input.authority,
          selected_model_or_service:
            mode === "live_voice_mini" ? "gpt-realtime-2.1-mini" : "gpt-realtime-2.1",
          provider_session_ref: response.provider_session_ref,
          audio_focus_owner: getAudioFocusSnapshot().active_kind,
          failure_code: result.ok ? null : result.blocked_reason,
          failure_reason: result.ok ? null : result.blocked_reason,
        },
      ).catch(() => null);
      if (!result.ok) throw new Error(result.blocked_reason);
      setState({
        lifecycleState: "listening",
        transportState: "active",
        realtimeSessionId: response.realtime_session_id,
        error: null,
        active: true,
      });
    } catch (error) {
      const failedSessionId = sessionIdRef.current;
      await controllerRef.current?.stopTransport({
        realtimeSessionId: failedSessionId,
      }).catch(() => null);
      if (failedSessionId) {
        await postJson(`/api/agi/realtime/session/${encodeURIComponent(failedSessionId)}/stop`, {
          receipt_kind: "start_failed_cleanup",
          observed_at_ms: Date.now(),
        }).catch(() => null);
      }
      controllerRef.current = null;
      sessionIdRef.current = null;
      runtimeContextRef.current = {
        transportReceiptRef: null,
        vadState: null,
        interruptionCount: 0,
      };
      setState({
        lifecycleState: "error",
        transportState: "error",
        realtimeSessionId: null,
        error: error instanceof Error ? error.message : "realtime_session_start_failed",
        active: false,
      });
    }
  }, [input.authority, input.enabled, input.mode, state.active, state.lifecycleState, state.realtimeSessionId]);

  useEffect(() => () => {
    const controller = controllerRef.current;
    const sessionId = sessionIdRef.current;
    controllerRef.current = null;
    sessionIdRef.current = null;
    runtimeContextRef.current = {
      transportReceiptRef: null,
      vadState: null,
      interruptionCount: 0,
    };
    void controller?.stopTransport({ realtimeSessionId: sessionId });
    if (sessionId) {
      void postJson(`/api/agi/realtime/session/${encodeURIComponent(sessionId)}/stop`, {
        receipt_kind: "component_unmounted",
        observed_at_ms: Date.now(),
      }).catch(() => null);
    }
  }, []);

  return { ...state, start, stop };
};
