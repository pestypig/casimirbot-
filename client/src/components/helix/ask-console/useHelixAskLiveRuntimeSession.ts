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
import {
  beginHelixAskLiveRuntimeClientDebugAttempt,
  recordHelixAskLiveRuntimeClientDebugEvent,
  recordHelixAskLiveRuntimeServerStagePlayDebug,
} from "./HelixAskLiveRuntimeDebugState";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { buildHelixAskLiveRuntimeSourceBinding } from "./HelixAskMinimalRuntimeWorkspaceContext";

type LiveRuntimeSessionState = {
  lifecycleState: HelixAskLiveRuntimeLifecycleState;
  transportState: HelixAskLiveRuntimeTransportControllerState;
  realtimeSessionId: string | null;
  error: string | null;
  active: boolean;
  microphoneEnabled: boolean;
};

const INITIAL_STATE: LiveRuntimeSessionState = {
  lifecycleState: "off",
  transportState: "idle",
  realtimeSessionId: null,
  error: null,
  active: false,
  microphoneEnabled: false,
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

const readLiveRuntimeSourceBinding = (): Record<string, unknown> =>
  buildHelixAskLiveRuntimeSourceBinding({
    desktopUrl: typeof window === "undefined" ? "" : window.location.href,
    layoutState: useWorkstationLayoutStore.getState(),
  });

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
  const microphoneEnabledRef = useRef(false);
  const runtimeContextRef = useRef<LiveRuntimeSafeContext>({
    transportReceiptRef: null,
    vadState: null,
    interruptionCount: 0,
  });

  const stop = useCallback(async () => {
    const sessionId = sessionIdRef.current ?? state.realtimeSessionId;
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "session_stop_requested",
      realtimeSessionId: sessionId,
      lifecycleState: "stopping",
      transportState: "stopping",
    });
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
      microphoneEnabled: false,
    });
    microphoneEnabledRef.current = false;
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: "session_stopped",
      realtimeSessionId: sessionId,
      lifecycleState: "stopped",
      transportState: "stopped",
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
    beginHelixAskLiveRuntimeClientDebugAttempt({
      attemptRef: consentReceipt.client_receipt_ref,
      runtimeAgentMode: mode,
      runtimeAgentAuthority: input.authority,
      observedAtMs,
    });
    setState({
      lifecycleState: "requesting",
      transportState: "awaiting_server_session",
      realtimeSessionId: null,
      error: null,
      active: false,
      microphoneEnabled: false,
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
        source_binding: readLiveRuntimeSourceBinding(),
        visible_user_consent_receipt: consentReceipt.client_receipt_ref,
      });
      if (!response.ok || !response.realtime_session_id) {
        throw new Error(response.blocked_reason || response.error || "realtime_session_admission_failed");
      }
      recordHelixAskLiveRuntimeClientDebugEvent({
        eventKind: "server_session_admitted",
        realtimeSessionId: response.realtime_session_id,
        selectedModelOrService:
          mode === "live_voice_mini" ? "gpt-realtime-2.1-mini" : "gpt-realtime-2.1",
        lifecycleState: "requesting",
        transportState: "connecting",
      });
      const eventHandler = createHelixAskRealtimeProviderEventHandler({
        realtimeSessionId: response.realtime_session_id,
        runtimeAgentAuthority: input.authority,
        selectedRealtimeModel:
          mode === "live_voice_mini" ? "gpt-realtime-2.1-mini" : "gpt-realtime-2.1",
        providerSessionRef: response.provider_session_ref,
        getRuntimeContext: () => ({
          ...runtimeContextRef.current,
          audioFocusOwner: getAudioFocusSnapshot().active_kind,
          sourceBinding: readLiveRuntimeSourceBinding(),
        }),
        onProjection: (projection) => {
          if (projection.vad_state) {
            runtimeContextRef.current.vadState = projection.vad_state;
          }
          if (projection.response_interrupted) {
            runtimeContextRef.current.interruptionCount += 1;
          }
          const nextLifecycle: HelixAskLiveRuntimeLifecycleState | null = projection.event_kind === "playback"
            ? projection.provider_event_type.endsWith(".done") ||
                projection.provider_event_type === "output_audio_buffer.stopped"
              ? microphoneEnabledRef.current ? "listening" : "active"
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
              ? current.error?.startsWith("remote_audio_")
                ? current
                : { ...current, lifecycleState: nextLifecycle }
              : current);
          }
        },
      });
      let remoteAudioPlaybackFailure: string | null = null;
      const controller = createHelixAskLiveRuntimeBrowserTransportController({
        onProviderEvent: (event) => {
          const providerEvent = event && typeof event === "object" && !Array.isArray(event)
            ? event as Record<string, unknown>
            : null;
          const providerEventType = typeof providerEvent?.type === "string"
            ? providerEvent.type
            : "provider_event_unknown";
          const providerError = providerEvent?.error &&
            typeof providerEvent.error === "object" &&
            !Array.isArray(providerEvent.error)
            ? providerEvent.error as Record<string, unknown>
            : null;
          const providerErrorCode = typeof providerError?.code === "string"
            ? providerError.code
            : typeof providerError?.type === "string"
              ? providerError.type
              : null;
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: "provider_event_received",
            realtimeSessionId: response.realtime_session_id,
            providerEventType,
            detailCode: providerErrorCode,
          });
          void eventHandler.handle(event);
        },
        onMicrophoneState: (outcome) => {
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: "microphone_tracks_observed",
            realtimeSessionId: response.realtime_session_id,
            microphoneTrackCount: outcome.trackCount,
            microphoneLiveTrackCount: outcome.liveTrackCount,
            microphoneEnabledTrackCount: outcome.enabledTrackCount,
            microphoneMutedTrackCount: outcome.mutedTrackCount,
            microphoneDeviceLabel: outcome.deviceLabel,
            microphoneLoopbackSource: outcome.loopbackSource,
          });
        },
        onDataChannelState: (outcome) => {
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: outcome.initialAudioProbe === "requested"
              ? "initial_audio_probe_requested"
              : outcome.initialAudioProbe === "failed"
                ? "initial_audio_probe_failed"
                : outcome.state === "open"
                  ? "data_channel_opened"
                  : outcome.state === "closed"
                    ? "data_channel_closed"
                    : "data_channel_error",
            realtimeSessionId: response.realtime_session_id,
            detailCode: outcome.errorCode,
          });
        },
        onAudioState: (audioState) => {
          const projectedAudioState = audioState === "listening" && !microphoneEnabledRef.current
            ? "active"
            : audioState;
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: "audio_state_changed",
            realtimeSessionId: response.realtime_session_id,
            lifecycleState: projectedAudioState,
            detailCode: projectedAudioState,
          });
          setState((current) => current.realtimeSessionId === response.realtime_session_id
            ? current.error?.startsWith("remote_audio_")
              ? current
              : { ...current, lifecycleState: projectedAudioState }
            : current);
        },
        onRemoteAudioTrack: (outcome) => {
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: "remote_audio_track_attached",
            realtimeSessionId: response.realtime_session_id,
            remoteTrackSource: outcome.source,
            remoteAudioMuted: outcome.muted,
            audioFocusGranted: outcome.focusGranted,
          });
        },
        onRemoteAudioPlayback: (outcome) => {
          remoteAudioPlaybackFailure = outcome.errorCode;
          recordHelixAskLiveRuntimeClientDebugEvent({
            eventKind: outcome.status === "failed"
              ? "remote_audio_playback_failed"
              : "remote_audio_playback_started",
            realtimeSessionId: response.realtime_session_id,
            lifecycleState: outcome.status === "failed" ? "error" : "active",
            detailCode: outcome.errorCode,
            remoteAudioMuted: outcome.muted,
            audioFocusGranted: getAudioFocusSnapshot().active_kind === "helix_realtime",
          });
          setState((current) => {
            if (current.realtimeSessionId !== response.realtime_session_id) return current;
            if (outcome.status === "failed") {
              return {
                ...current,
                lifecycleState: "error",
                error: outcome.errorCode ?? "remote_audio_playback_failed",
              };
            }
            return {
              ...current,
              lifecycleState: current.lifecycleState === "error" ? "listening" : current.lifecycleState,
              error: null,
            };
          });
          const receipt = buildHelixAskLiveRuntimeClientReceiptPayload({
            receiptKind: outcome.status === "failed" ? "playback_failed" : "playback_started",
            realtimeSessionId: response.realtime_session_id,
            runtimeAgentMode: mode,
            runtimeAgentAuthority: input.authority,
            lifecycleState: outcome.status === "failed" ? "error" : "active",
            clientReceiptRef: `receipt:live-runtime:browser-audio:${crypto.randomUUID()}`,
            observedAtMs: Date.now(),
            errorCode: outcome.errorCode,
          });
          void postJson(receipt.route_path, {
            ...receipt,
            source_binding_ref: "browser:remote_audio",
            provider_event_type: "browser.remote_audio.play",
            audio_focus_owner: getAudioFocusSnapshot().active_kind,
            failure_code: outcome.errorCode,
            failure_reason: outcome.errorCode,
            browser_media_api_referenced: true,
            webrtc_started: true,
          }).catch(() => null);
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
      recordHelixAskLiveRuntimeClientDebugEvent({
        eventKind: "transport_active",
        realtimeSessionId: response.realtime_session_id,
        lifecycleState: remoteAudioPlaybackFailure ? "error" : "active",
        transportState: "active",
        detailCode: remoteAudioPlaybackFailure,
      });
      setState({
        lifecycleState: remoteAudioPlaybackFailure ? "error" : "active",
        transportState: "active",
        realtimeSessionId: response.realtime_session_id,
        error: remoteAudioPlaybackFailure,
        active: true,
        microphoneEnabled: false,
      });
    } catch (error) {
      const failureCode = error instanceof Error ? error.message : "realtime_session_start_failed";
      recordHelixAskLiveRuntimeClientDebugEvent({
        eventKind: "transport_failed",
        realtimeSessionId: sessionIdRef.current,
        lifecycleState: "error",
        transportState: "error",
        detailCode: failureCode,
      });
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
        microphoneEnabled: false,
      });
      microphoneEnabledRef.current = false;
    }
  }, [input.authority, input.enabled, input.mode, state.active, state.lifecycleState, state.realtimeSessionId]);

  const setMicrophoneEnabled = useCallback((enabled: boolean): boolean => {
    const controller = controllerRef.current;
    const sessionId = sessionIdRef.current;
    if (!controller || !sessionId || !controller.setMicrophoneEnabled(enabled)) return false;
    microphoneEnabledRef.current = enabled;
    recordHelixAskLiveRuntimeClientDebugEvent({
      eventKind: enabled ? "microphone_enabled" : "microphone_disabled",
      realtimeSessionId: sessionId,
      lifecycleState: enabled ? "listening" : "active",
      detailCode: enabled ? "live_microphone_enabled" : "live_microphone_disabled",
    });
    setState((current) => ({
      ...current,
      microphoneEnabled: enabled,
      lifecycleState: enabled ? "listening" : "active",
    }));
    return true;
  }, []);

  useEffect(() => {
    const sessionId = state.realtimeSessionId;
    if (!state.active || !sessionId) return;
    let disposed = false;
    const refresh = async () => {
      try {
        const response = await fetch(
          `/api/agi/realtime/session/${encodeURIComponent(sessionId)}/debug`,
        );
        if (!response.ok || disposed) return;
        const payload = await response.json();
        if (!disposed) recordHelixAskLiveRuntimeServerStagePlayDebug(payload);
      } catch {
        // Debug refresh is observational and must not affect the live transport.
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 1_500);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [state.active, state.realtimeSessionId]);

  useEffect(() => () => {
    const controller = controllerRef.current;
    const sessionId = sessionIdRef.current;
    controllerRef.current = null;
    sessionIdRef.current = null;
    microphoneEnabledRef.current = false;
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

  return { ...state, start, stop, setMicrophoneEnabled };
};
