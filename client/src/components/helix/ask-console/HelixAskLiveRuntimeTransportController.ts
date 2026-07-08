import type { HelixRealtimeSessionResponse } from "@shared/helix-realtime-session";
import {
  buildHelixAskLiveRuntimeTransportLifecycleReceiptPayload,
  type HelixAskLiveRuntimeTransportBoundaryResult,
  type HelixAskLiveRuntimeTransportExecutionBoundary,
  type HelixAskLiveRuntimeTransportHandoffPlan,
} from "./HelixAskLiveRuntimeLifecycle";

export type HelixAskLiveRuntimeTrackLike = {
  stop(): void;
};

export type HelixAskLiveRuntimeMediaStreamLike = {
  getTracks(): HelixAskLiveRuntimeTrackLike[];
};

export type HelixAskLiveRuntimeDataChannelLike = {
  close(): void;
};

export type HelixAskLiveRuntimePeerConnectionLike = {
  createDataChannel?(label: string): HelixAskLiveRuntimeDataChannelLike;
  close(): void;
};

export type HelixAskLiveRuntimeBrowserResources = {
  mediaStream: HelixAskLiveRuntimeMediaStreamLike | null;
  peerConnection: HelixAskLiveRuntimePeerConnectionLike | null;
  dataChannel: HelixAskLiveRuntimeDataChannelLike | null;
};

export type HelixAskLiveRuntimeBrowserTransportDeps = {
  requestMicrophone?: () => Promise<HelixAskLiveRuntimeMediaStreamLike>;
  createPeerConnection?: () => HelixAskLiveRuntimePeerConnectionLike;
  nowMs?: () => number;
};

export type HelixAskLiveRuntimeBrowserTransportController =
  HelixAskLiveRuntimeTransportExecutionBoundary & {
    getResources(): HelixAskLiveRuntimeBrowserResources;
  };

const defaultNowMs = (): number => Date.now();

const defaultRequestMicrophone = async (): Promise<HelixAskLiveRuntimeMediaStreamLike> => {
  const mediaDevices = globalThis.navigator?.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    throw new Error("browser_media_api_unavailable");
  }
  return mediaDevices.getUserMedia({ audio: true });
};

const defaultCreatePeerConnection = (): HelixAskLiveRuntimePeerConnectionLike => {
  if (typeof globalThis.RTCPeerConnection !== "function") {
    throw new Error("webrtc_api_unavailable");
  }
  return new globalThis.RTCPeerConnection();
};

const hasServerReturnedRealtimeSessionContract = (
  response: HelixRealtimeSessionResponse | null | undefined,
): boolean => {
  const record = response as unknown as Record<string, unknown> | null | undefined;
  if (!record || record.ok !== true) return false;
  if (record.client_secret_issued !== true && record.sdp_exchange_requested !== true) return false;
  if (record.openai_network_call_attempted === true) return false;
  if (record.ephemeral_credential_minted === true && record.client_secret_issued !== true) return false;
  return true;
};

const canStartBrowserTransport = (
  handoffPlan: HelixAskLiveRuntimeTransportHandoffPlan,
): boolean =>
  handoffPlan.server_session_response_ok === true &&
  handoffPlan.can_start_browser_transport === true &&
  handoffPlan.client_secret_issued === true &&
  handoffPlan.sdp_exchange_allowed === true;

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
    openai_network_call_attempted: false,
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
  const nowMs = deps.nowMs ?? defaultNowMs;
  const requestMicrophone = deps.requestMicrophone ?? defaultRequestMicrophone;
  const createPeerConnection = deps.createPeerConnection ?? defaultCreatePeerConnection;

  const closeResources = () => {
    const tracks = mediaStream?.getTracks() ?? [];
    tracks.forEach((track) => track.stop());
    dataChannel?.close();
    peerConnection?.close();
    const hadTracks = tracks.length > 0;
    const hadPeerConnection = Boolean(peerConnection);
    const hadDataChannel = Boolean(dataChannel);
    mediaStream = null;
    peerConnection = null;
    dataChannel = null;
    return { hadTracks, hadPeerConnection, hadDataChannel };
  };

  return {
    getResources: () => ({ mediaStream, peerConnection, dataChannel }),
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
        controllerState: canStartBrowserTransport(handoffPlan) ? "awaiting_server_session" : "ready_blocked",
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

      try {
        mediaStream = await requestMicrophone();
        peerConnection = createPeerConnection();
        dataChannel = peerConnection.createDataChannel?.("helix-realtime-events") ?? null;
        return buildResult({
          ok: true,
          method: "startTransport",
          receiptKind: "transport_start_requested",
          handoffPlan,
          observedAtMs: observedAtMs ?? nowMs(),
          blockedReason: "transport_started_waiting_for_provider_events",
          controllerState: "awaiting_server_session",
          transportExecutionAttempted: true,
          mediaCaptureStarted: true,
          webrtcStarted: true,
          browserMediaApiReferenced: true,
          browserTracksCreated: (mediaStream.getTracks() ?? []).length > 0,
          dataChannelsCreated: Boolean(dataChannel),
        });
      } catch (error) {
        closeResources();
        return buildResult({
          ok: false,
          method: "startTransport",
          receiptKind: "transport_error",
          handoffPlan,
          observedAtMs: observedAtMs ?? nowMs(),
          blockedReason: error instanceof Error ? error.message : "transport_start_error",
          controllerState: "error",
          transportExecutionAttempted: true,
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
        mediaCaptureStarted: false,
        webrtcStarted: false,
        browserTracksCreated: closed.hadTracks,
        dataChannelsCreated: closed.hadDataChannel,
      });
    },
  };
};
