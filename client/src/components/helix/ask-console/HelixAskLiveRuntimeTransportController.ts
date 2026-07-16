import { releaseAudioFocus, requestAudioFocus } from "@/lib/audio-focus";
import type {
  HelixRealtimeSdpExchangeResponse,
  HelixRealtimeSessionResponse,
} from "@shared/helix-realtime-session";
import {
  buildHelixAskLiveRuntimeTransportLifecycleReceiptPayload,
  type HelixAskLiveRuntimeTransportBoundaryResult,
  type HelixAskLiveRuntimeTransportExecutionBoundary,
  type HelixAskLiveRuntimeTransportHandoffPlan,
} from "./HelixAskLiveRuntimeLifecycle";

export type HelixAskLiveRuntimeTrackLike = { stop(): void };

export type HelixAskLiveRuntimeMediaStreamLike = {
  getTracks(): HelixAskLiveRuntimeTrackLike[];
};

export type HelixAskLiveRuntimeDataChannelLike = {
  close(): void;
  onmessage?: ((event: { data: unknown }) => void) | null;
};

export type HelixAskLiveRuntimeSessionDescriptionLike = {
  type: "offer" | "answer";
  sdp?: string;
};

export type HelixAskLiveRuntimePeerConnectionLike = {
  createDataChannel?(label: string): HelixAskLiveRuntimeDataChannelLike;
  addTrack?(track: HelixAskLiveRuntimeTrackLike, stream: HelixAskLiveRuntimeMediaStreamLike): unknown;
  createOffer?(): Promise<HelixAskLiveRuntimeSessionDescriptionLike>;
  setLocalDescription?(description: HelixAskLiveRuntimeSessionDescriptionLike): Promise<void>;
  setRemoteDescription?(description: HelixAskLiveRuntimeSessionDescriptionLike): Promise<void>;
  ontrack?: ((event: { streams?: HelixAskLiveRuntimeMediaStreamLike[] }) => void) | null;
  close(): void;
};

export type HelixAskLiveRuntimeRemoteAudioLike = {
  autoplay: boolean;
  muted: boolean;
  srcObject: unknown;
  play(): Promise<void>;
  pause(): void;
  remove?(): void;
};

export type HelixAskLiveRuntimeSdpExchange = (input: {
  realtimeSessionId: string;
  offerSdp: string;
  visibleUserConsentReceipt: string;
}) => Promise<{
  answerSdp: string;
  providerCallRef: string | null;
}>;

export type HelixAskLiveRuntimeBrowserResources = {
  mediaStream: HelixAskLiveRuntimeMediaStreamLike | null;
  peerConnection: HelixAskLiveRuntimePeerConnectionLike | null;
  dataChannel: HelixAskLiveRuntimeDataChannelLike | null;
  remoteAudio: HelixAskLiveRuntimeRemoteAudioLike | null;
};

export type HelixAskLiveRuntimeBrowserTransportDeps = {
  requestMicrophone?: () => Promise<HelixAskLiveRuntimeMediaStreamLike>;
  createPeerConnection?: () => HelixAskLiveRuntimePeerConnectionLike;
  createRemoteAudio?: () => HelixAskLiveRuntimeRemoteAudioLike;
  exchangeSdp?: HelixAskLiveRuntimeSdpExchange;
  onProviderEvent?: (event: unknown) => void;
  onAudioState?: (state: "listening" | "speaking" | "muted") => void;
  nowMs?: () => number;
};

export type HelixAskLiveRuntimeBrowserTransportController =
  HelixAskLiveRuntimeTransportExecutionBoundary & {
    getResources(): HelixAskLiveRuntimeBrowserResources;
  };

const defaultNowMs = (): number => Date.now();

const defaultRequestMicrophone = async (): Promise<HelixAskLiveRuntimeMediaStreamLike> => {
  const mediaDevices = globalThis.navigator?.mediaDevices;
  if (!mediaDevices?.getUserMedia) throw new Error("browser_media_api_unavailable");
  return mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
};

const defaultCreatePeerConnection = (): HelixAskLiveRuntimePeerConnectionLike => {
  if (typeof globalThis.RTCPeerConnection !== "function") {
    throw new Error("webrtc_api_unavailable");
  }
  return new globalThis.RTCPeerConnection() as HelixAskLiveRuntimePeerConnectionLike;
};

const defaultCreateRemoteAudio = (): HelixAskLiveRuntimeRemoteAudioLike => {
  if (typeof document === "undefined") throw new Error("browser_audio_api_unavailable");
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.setAttribute("playsinline", "true");
  return audio;
};

const defaultExchangeSdp: HelixAskLiveRuntimeSdpExchange = async (input) => {
  const response = await fetch(
    `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/sdp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offer_sdp: input.offerSdp,
        visible_user_consent_receipt: input.visibleUserConsentReceipt,
      }),
    },
  );
  const payload = (await response.json()) as HelixRealtimeSdpExchangeResponse;
  if (!response.ok || payload.ok !== true || !payload.answer_sdp) {
    throw new Error(payload.blocked_reason || payload.error || `realtime_sdp_http_${response.status}`);
  }
  return {
    answerSdp: payload.answer_sdp,
    providerCallRef: payload.provider_call_ref,
  };
};

const normalizeBrowserTransportFailure = (error: unknown): string => {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.trim() : "";
  if (name === "NotAllowedError" || /permission\s+denied/i.test(message)) {
    return "microphone_permission_denied";
  }
  if (name === "NotFoundError") return "microphone_not_found";
  if (/^[a-z0-9_:-]{1,160}$/i.test(message)) return message;
  return "realtime_browser_transport_failed";
};

const hasServerReturnedRealtimeSessionContract = (
  response: HelixRealtimeSessionResponse | null | undefined,
): response is HelixRealtimeSessionResponse & { realtime_session_id: string } =>
  Boolean(
    response?.ok === true &&
      response.realtime_session_id &&
      response.sdp_exchange_requested === true,
  );

const canStartBrowserTransport = (
  handoffPlan: HelixAskLiveRuntimeTransportHandoffPlan,
): boolean =>
  handoffPlan.server_session_response_ok === true &&
  handoffPlan.can_start_browser_transport === true &&
  handoffPlan.sdp_exchange_allowed === true &&
  Boolean(handoffPlan.visible_user_consent_receipt);

const buildResult = (args: {
  ok: boolean;
  method: HelixAskLiveRuntimeTransportBoundaryResult["method"];
  receiptKind:
    | "transport_start_requested"
    | "transport_start_blocked"
    | "transport_stopped"
    | "transport_error";
  handoffPlan?: HelixAskLiveRuntimeTransportHandoffPlan | null;
  realtimeSessionId?: string | null;
  observedAtMs: number;
  blockedReason: string;
  controllerState: HelixAskLiveRuntimeTransportBoundaryResult["controller_state"];
  transportExecutionAttempted?: boolean;
  mediaCaptureStarted?: boolean;
  webrtcStarted?: boolean;
  openAiNetworkCallAttempted?: boolean;
  browserTracksCreated?: boolean;
  dataChannelsCreated?: boolean;
  browserMediaApiReferenced?: boolean;
}): HelixAskLiveRuntimeTransportBoundaryResult => {
  const receipt = buildHelixAskLiveRuntimeTransportLifecycleReceiptPayload({
    receiptKind: args.receiptKind,
    realtimeSessionId: args.realtimeSessionId,
    handoffPlan: args.handoffPlan,
    observedAtMs: args.observedAtMs,
    blockedReason: args.blockedReason,
    controllerState: args.controllerState,
    transportExecutionAttempted: args.transportExecutionAttempted,
    mediaCaptureStarted: args.mediaCaptureStarted,
    webrtcStarted: args.webrtcStarted,
    openAiNetworkCallAttempted: args.openAiNetworkCallAttempted,
    browserTracksCreated: args.browserTracksCreated,
    dataChannelsCreated: args.dataChannelsCreated,
    browserMediaApiReferenced: args.browserMediaApiReferenced,
  });
  return {
    schema: "helix.ask.live_runtime.transport_boundary_result.v1",
    ok: args.ok,
    method: args.method,
    controller_state: args.controllerState,
    receipt,
    transport_execution_attempted: args.transportExecutionAttempted === true,
    media_capture_started: args.mediaCaptureStarted === true,
    browser_media_api_referenced: args.browserMediaApiReferenced === true,
    webrtc_started: args.webrtcStarted === true,
    openai_network_call_attempted: args.openAiNetworkCallAttempted === true,
    browser_tracks_created: args.browserTracksCreated === true,
    data_channels_created: args.dataChannelsCreated === true,
    blocked_reason: args.blockedReason,
  };
};

export const createHelixAskLiveRuntimeBrowserTransportController = (
  deps: HelixAskLiveRuntimeBrowserTransportDeps = {},
): HelixAskLiveRuntimeBrowserTransportController => {
  let mediaStream: HelixAskLiveRuntimeMediaStreamLike | null = null;
  let peerConnection: HelixAskLiveRuntimePeerConnectionLike | null = null;
  let dataChannel: HelixAskLiveRuntimeDataChannelLike | null = null;
  let remoteAudio: HelixAskLiveRuntimeRemoteAudioLike | null = null;
  let audioFocusId: string | null = null;
  const nowMs = deps.nowMs ?? defaultNowMs;
  const requestMicrophone = deps.requestMicrophone ?? defaultRequestMicrophone;
  const createPeerConnection = deps.createPeerConnection ?? defaultCreatePeerConnection;
  const createRemoteAudio = deps.createRemoteAudio ?? defaultCreateRemoteAudio;
  const exchangeSdp = deps.exchangeSdp ?? defaultExchangeSdp;

  const closeResources = () => {
    const tracks = mediaStream?.getTracks() ?? [];
    tracks.forEach((track) => track.stop());
    if (audioFocusId) releaseAudioFocus(audioFocusId);
    remoteAudio?.pause();
    remoteAudio?.remove?.();
    dataChannel?.close();
    peerConnection?.close();
    const closed = {
      hadTracks: tracks.length > 0,
      hadPeerConnection: Boolean(peerConnection),
      hadDataChannel: Boolean(dataChannel),
    };
    mediaStream = null;
    peerConnection = null;
    dataChannel = null;
    remoteAudio = null;
    audioFocusId = null;
    return closed;
  };

  return {
    getResources: () => ({ mediaStream, peerConnection, dataChannel, remoteAudio }),
    prepareTransport: async ({ handoffPlan, observedAtMs }) =>
      buildResult({
        ok: canStartBrowserTransport(handoffPlan),
        method: "prepareTransport",
        receiptKind: canStartBrowserTransport(handoffPlan)
          ? "transport_stopped"
          : "transport_start_blocked",
        handoffPlan,
        observedAtMs: observedAtMs ?? nowMs(),
        blockedReason: canStartBrowserTransport(handoffPlan)
          ? "transport_ready_requires_explicit_start"
          : handoffPlan.blocked_reason || "transport_prepare_blocked",
        controllerState: canStartBrowserTransport(handoffPlan) ? "ready" : "ready_blocked",
      }),
    startTransport: async ({ handoffPlan, serverResponse, observedAtMs }) => {
      if (!canStartBrowserTransport(handoffPlan) || !hasServerReturnedRealtimeSessionContract(serverResponse)) {
        return buildResult({
          ok: false,
          method: "startTransport",
          receiptKind: "transport_start_blocked",
          handoffPlan,
          observedAtMs: observedAtMs ?? nowMs(),
          blockedReason: handoffPlan.blocked_reason || "server_realtime_session_contract_required",
          controllerState: "starting_blocked",
        });
      }

      let openAiNetworkCallAttempted = false;
      try {
        mediaStream = await requestMicrophone();
        peerConnection = createPeerConnection();
        if (
          !peerConnection.addTrack ||
          !peerConnection.createOffer ||
          !peerConnection.setLocalDescription ||
          !peerConnection.setRemoteDescription
        ) {
          throw new Error("webrtc_offer_answer_api_unavailable");
        }
        remoteAudio = createRemoteAudio();
        audioFocusId = `helix-realtime:${serverResponse.realtime_session_id}`;
        peerConnection.ontrack = (event) => {
          const stream = event.streams?.[0];
          if (!remoteAudio || !stream || !audioFocusId) return;
          remoteAudio.srcObject = stream;
          const focusGranted = requestAudioFocus({
            id: audioFocusId,
            kind: "helix_realtime",
            priority: 20,
            resumeWhenAvailable: true,
            stop: () => {
              if (remoteAudio) remoteAudio.muted = true;
              deps.onAudioState?.("muted");
            },
            resume: () => {
              if (!remoteAudio) return;
              remoteAudio.muted = false;
              deps.onAudioState?.("speaking");
              void remoteAudio.play().catch(() => undefined);
            },
          });
          remoteAudio.muted = !focusGranted;
          deps.onAudioState?.(focusGranted ? "listening" : "muted");
          void remoteAudio.play().catch(() => undefined);
        };
        for (const track of mediaStream.getTracks()) {
          peerConnection.addTrack(track, mediaStream);
        }
        dataChannel = peerConnection.createDataChannel?.("oai-events") ?? null;
        if (dataChannel) {
          dataChannel.onmessage = (event) => {
            try {
              deps.onProviderEvent?.(
                typeof event.data === "string" ? JSON.parse(event.data) : event.data,
              );
            } catch {
              deps.onProviderEvent?.({ type: "helix.realtime.provider_event.invalid" });
            }
          };
        }
        const offer = await peerConnection.createOffer();
        if (!offer.sdp) throw new Error("webrtc_offer_sdp_missing");
        await peerConnection.setLocalDescription(offer);
        openAiNetworkCallAttempted = true;
        const exchange = await exchangeSdp({
          realtimeSessionId: serverResponse.realtime_session_id,
          offerSdp: offer.sdp,
          visibleUserConsentReceipt: handoffPlan.visible_user_consent_receipt as string,
        });
        await peerConnection.setRemoteDescription({ type: "answer", sdp: exchange.answerSdp });
        return buildResult({
          ok: true,
          method: "startTransport",
          receiptKind: "transport_start_requested",
          handoffPlan,
          realtimeSessionId: serverResponse.realtime_session_id,
          observedAtMs: observedAtMs ?? nowMs(),
          blockedReason: "transport_active_waiting_for_provider_events",
          controllerState: "active",
          transportExecutionAttempted: true,
          mediaCaptureStarted: true,
          webrtcStarted: true,
          openAiNetworkCallAttempted,
          browserMediaApiReferenced: true,
          browserTracksCreated: mediaStream.getTracks().length > 0,
          dataChannelsCreated: Boolean(dataChannel),
        });
      } catch (error) {
        closeResources();
        return buildResult({
          ok: false,
          method: "startTransport",
          receiptKind: "transport_error",
          handoffPlan,
          realtimeSessionId: serverResponse.realtime_session_id,
          observedAtMs: observedAtMs ?? nowMs(),
          blockedReason: normalizeBrowserTransportFailure(error),
          controllerState: "error",
          transportExecutionAttempted: true,
          openAiNetworkCallAttempted,
          browserMediaApiReferenced: true,
        });
      }
    },
    stopTransport: async ({ realtimeSessionId, observedAtMs }) => {
      const closed = closeResources();
      return buildResult({
        ok: false,
        method: "stopTransport",
        receiptKind: "transport_stopped",
        realtimeSessionId,
        observedAtMs: observedAtMs ?? nowMs(),
        blockedReason: closed.hadTracks || closed.hadPeerConnection || closed.hadDataChannel
          ? "transport_resources_stopped"
          : "transport_stop_recorded_without_browser_resources",
        controllerState: "stopped",
        browserTracksCreated: closed.hadTracks,
        dataChannelsCreated: closed.hadDataChannel,
      });
    },
  };
};
