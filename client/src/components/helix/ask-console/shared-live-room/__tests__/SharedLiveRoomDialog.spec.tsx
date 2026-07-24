/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedLiveRoomDialog } from "../SharedLiveRoomDialog";
import type { HelixSharedLiveRoomController } from "../useHelixSharedLiveRoom";

const buildController = (): HelixSharedLiveRoomController => ({
  rooms: [],
  room: null,
  selfParticipant: null,
  frames: [],
  debug: null,
  inviteCode: null,
  inviteExpiresAt: null,
  busyAction: null,
  error: null,
  runtimeActive: false,
  realtimeSessionId: null,
  frameUpload: {
    status: "idle",
    sourceId: null,
    historyId: null,
    observedAt: null,
    providerDelivery: null,
    error: null,
  },
  mediaBridge: {
    state: "idle",
    role: "participant",
    peer_audio_connected: false,
    remote_audio_playback_ready: false,
    provider_input_mixed: false,
    provider_input_enabled: false,
    provider_audio_forwarded: false,
    active_model_speaker_participant_id: null,
    latest_shared_transcript: null,
    ice_configuration: "default_stun",
    ice_configuration_error: null,
    failure: null,
  },
  clearError: vi.fn(),
  createRoom: vi.fn(async () => true),
  joinRoom: vi.fn(async () => true),
  openRoom: vi.fn(async () => true),
  createInvite: vi.fn(async () => true),
  patchOwnConsent: vi.fn(async () => true),
  connectRuntime: vi.fn(async () => true),
  reserveRuntime: vi.fn(async () => true),
  bindRuntime: vi.fn(async () => true),
  takeFloor: vi.fn(async () => true),
  releaseFloor: vi.fn(async () => true),
  startMediaBridge: vi.fn(async () => undefined),
  stopMediaBridge: vi.fn(async () => undefined),
  resumeMediaPlayback: vi.fn(async () => true),
  refreshDebug: vi.fn(async () => true),
  leaveRoom: vi.fn(async () => true),
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("Shared Live Room dialog plane", () => {
  it("portals above the Ask plane with an opaque top-down viewport layout", async () => {
    const controller = buildController();
    const askPlaneClick = vi.fn();
    const host = document.createElement("div");
    host.style.transform = "translate3d(0, 0, 0)";
    document.body.appendChild(host);

    const view = render(
      <div data-testid="ask-plane" onClick={askPlaneClick}>
        <SharedLiveRoomDialog
          room={null}
          controller={controller}
          titleId="room-title"
          descriptionId="room-description"
          onClose={vi.fn()}
        />
      </div>,
      { container: host },
    );

    const overlay = screen.getByTestId("shared-live-room-overlay");
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveClass("fixed", "inset-0", "items-start", "z-[2147483000]");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bg-slate-950", "opacity-100");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    await waitFor(() => expect(controller.createRoom).toHaveBeenCalledWith(""));
    expect(askPlaneClick).not.toHaveBeenCalled();

    view.unmount();
    expect(document.body.style.overflow).toBe("");
    host.remove();
  });

  it("closes from both the shield and Escape", () => {
    const onClose = vi.fn();
    render(
      <SharedLiveRoomDialog
        room={null}
        controller={buildController()}
        titleId="room-title"
        descriptionId="room-description"
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Close Shared GPT Live Room dialog",
    }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
