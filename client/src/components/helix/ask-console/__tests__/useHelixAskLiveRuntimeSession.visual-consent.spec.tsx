/**
 * @vitest-environment jsdom
 */
import React from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  frameSubscribers: new Set<(frame: Record<string, unknown>) => void>(),
  sendVisualFrame: vi.fn(() => ({ ok: true, code: "visual_frame_sent" })),
  startTransport: vi.fn(async () => ({
    ok: true,
    blocked_reason: "transport_active",
    receipt: { client_receipt_ref: "receipt:transport:test" },
  })),
  stopTransport: vi.fn(async () => undefined),
}));

vi.mock("@/lib/helix/visualFrameProducer", () => ({
  getLatestVisualFrameProducerFrame: () => null,
  isVisualFrameProducerSourceActive: () => true,
  subscribeVisualFrameProducerFrames: (subscriber: (frame: Record<string, unknown>) => void) => {
    mocks.frameSubscribers.add(subscriber);
    return () => mocks.frameSubscribers.delete(subscriber);
  },
}));

vi.mock("../HelixAskLiveRuntimeTransportController", () => ({
  createHelixAskLiveRuntimeBrowserTransportController: () => ({
    startTransport: mocks.startTransport,
    stopTransport: mocks.stopTransport,
    setMicrophoneEnabled: () => true,
    sendVisualFrame: mocks.sendVisualFrame,
  }),
}));

vi.mock("../HelixAskLiveRuntimeLifecycle", () => ({
  buildHelixAskLiveRuntimeClientReceiptPayload: (input: Record<string, unknown>) => ({
    ...input,
    client_receipt_ref: input.clientReceiptRef,
    route_path: "/api/agi/realtime/client-receipt",
  }),
  buildHelixAskLiveRuntimeRouteRequest: () => ({
    path: "/api/agi/realtime/session/start",
    body: {},
  }),
  buildHelixAskLiveRuntimeTransportHandoffPlan: () => ({
    can_start_browser_transport: true,
  }),
}));

vi.mock("../HelixAskRealtimeProviderEventHandler", () => ({
  createHelixAskRealtimeProviderEventHandler: () => ({ handle: vi.fn() }),
}));

vi.mock("../HelixAskLiveRuntimeDebugState", () => ({
  beginHelixAskLiveRuntimeClientDebugAttempt: vi.fn(),
  recordHelixAskLiveRuntimeClientDebugEvent: vi.fn(),
  recordHelixAskLiveRuntimeServerStagePlayDebug: vi.fn(),
  recordHelixAskLiveRuntimeVisualFrameReceipt: vi.fn(),
}));

vi.mock("@/lib/audio-focus", () => ({
  getAudioFocusSnapshot: () => ({ active_kind: null }),
}));

vi.mock("@/store/useWorkstationLayoutStore", () => ({
  useWorkstationLayoutStore: { getState: () => ({}) },
}));

vi.mock("../HelixAskMinimalRuntimeWorkspaceContext", () => ({
  buildHelixAskLiveRuntimeSourceBinding: () => ({}),
}));

import { useHelixAskLiveRuntimeSession } from "../useHelixAskLiveRuntimeSession";
import { requestHelixAskVisualFrameLivePromotion } from "../HelixAskVisualFramePromotion";

type SessionApi = ReturnType<typeof useHelixAskLiveRuntimeSession>;

let latestSession: SessionApi | null = null;

const Harness = () => {
  latestSession = useHelixAskLiveRuntimeSession({
    enabled: true,
    mode: "live_voice",
    authority: "observe_only",
  });
  return null;
};

const frame = (clientFrameId: string) => ({
  clientFrameId,
  sourceId: "visual:consent-test",
  threadId: "helix-ask:desktop",
  capturedAt: new Date().toISOString(),
  previewHash: `sha256:${clientFrameId}`,
  mimeType: "image/jpeg",
  dataUrl: "data:image/jpeg;base64,AQID",
  sourceSurface: "screen",
  sourceOrigin: "browser_getDisplayMedia",
  liveRuntimeEligible: true,
});

describe("Helix Ask GPT Live visual consent", () => {
  beforeEach(() => {
    latestSession = null;
    mocks.frameSubscribers.clear();
    mocks.sendVisualFrame.mockClear();
    mocks.startTransport.mockClear();
    mocks.stopTransport.mockClear();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      realtime_session_id: "realtime:visual-consent-test",
      sdp_exchange_requested: true,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("blocks a same-turn frame immediately after Vision Off, before effect cleanup", async () => {
    render(<Harness />);

    await act(async () => {
      await latestSession!.start();
    });
    await waitFor(() => expect(latestSession?.active).toBe(true));

    act(() => {
      expect(latestSession!.setVisualInputEnabled(true)).toBe(true);
    });
    await waitFor(() => expect(mocks.frameSubscribers.size).toBe(1));
    const subscribedRoute = [...mocks.frameSubscribers][0]!;

    act(() => subscribedRoute(frame("frame-before-off")));
    expect(mocks.sendVisualFrame).toHaveBeenCalledTimes(1);

    act(() => {
      expect(latestSession!.setVisualInputEnabled(false)).toBe(true);
      // React has not yet had an opportunity to clean up the old subscription.
      subscribedRoute(frame("frame-after-off"));
    });

    expect(mocks.sendVisualFrame).toHaveBeenCalledTimes(1);
    expect(latestSession?.visualInputEnabled).toBe(false);
  });

  it("requires explicit Vision consent before promoting a selected carousel frame", async () => {
    render(<Harness />);

    await act(async () => {
      await latestSession!.start();
    });
    await waitFor(() => expect(latestSession?.active).toBe(true));

    expect(requestHelixAskVisualFrameLivePromotion({
      imageDataUrl: "data:image/jpeg;base64,AQID",
      sourceKind: "screen",
      sourceLabel: "Selected visual frame",
    })).toMatchObject({
      ok: false,
      code: "visual_input_consent_required",
      receipt: null,
      answer_authority: false,
    });

    act(() => {
      latestSession!.setVisualInputEnabled(true);
    });
    const outcome = requestHelixAskVisualFrameLivePromotion({
      imageDataUrl: "data:image/jpeg;base64,AQID",
      sourceKind: "screen",
      sourceLabel: "Selected visual frame",
    });
    expect(outcome).toMatchObject({ ok: true, code: "visual_frame_sent" });
    expect(mocks.sendVisualFrame).toHaveBeenCalledTimes(1);
  });
});
