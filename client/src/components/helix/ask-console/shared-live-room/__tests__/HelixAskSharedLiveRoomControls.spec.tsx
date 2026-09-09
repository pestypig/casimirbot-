/** @vitest-environment jsdom */

import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixSharedLiveRoomController } from
  "../useHelixSharedLiveRoom";
import { HelixAskSharedLiveRoomControls } from
  "../HelixAskSharedLiveRoomControls";
import { HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT } from
  "../SharedLiveRoomGuideProjection";

const hookState = vi.hoisted(() => ({
  controller: null as HelixSharedLiveRoomController | null,
}));

vi.mock("../useHelixSharedLiveRoom", () => ({
  useHelixSharedLiveRoom: () => hookState.controller,
}));

vi.mock("../SharedLiveRoomDialog", () => ({
  SharedLiveRoomDialog: () => <div role="dialog" aria-label="Shared Live Room proof" />,
}));

afterEach(() => {
  cleanup();
  hookState.controller = null;
});

describe("Helix Ask shared-room thread scope", () => {
  it.each([
    ["room:exact", "ready", true],
    ["room:exact", "closed", false],
  ])("gates exact room navigation for %s in %s", async (roomId, status, accepted) => {
    hookState.controller = {
      room: { room_id: roomId, status, participants: [],
        runtime: { state: "idle", transport_owner: "none", realtime_session_ref_hash: null } },
      selfParticipant: null,
    } as unknown as HelixSharedLiveRoomController;
    render(<HelixAskSharedLiveRoomControls realtimeSessionId={null}
      runtimeActive={false} realtimeModel="gpt-realtime" />);
    const event = new CustomEvent(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT,
      { detail: { roomId: "room:exact" }, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(accepted);
    if (accepted) {
      expect(await screen.findByRole("dialog")).toBeTruthy();
    } else {
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  });
  it("reads the exact requested room before showing settings and ignores cancelled navigation", async () => {
    const makeRoom = (id: string) => ({ room_id: id, status: "ready", participants: [],
      runtime: { state: "idle", transport_owner: "none", realtime_session_ref_hash: null } });
    let finish!: (opened: boolean) => void;
    const openRoom = vi.fn((_roomId: string, _signal?: AbortSignal) => new Promise<boolean>(resolve => { finish = resolve; }));
    hookState.controller = { room: makeRoom("room:other"), selfParticipant: null, openRoom } as unknown as HelixSharedLiveRoomController;
    const view = render(<HelixAskSharedLiveRoomControls realtimeSessionId={null} runtimeActive={false} realtimeModel="gpt-realtime" />);
    const onResult = vi.fn();
    const request = () => new CustomEvent(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT,
      { detail: { roomId: "room:exact", environmentBindingId: "environment:exact", onResult }, cancelable: true });
    const first = request();
    act(() => { window.dispatchEvent(first); });
    expect(first.defaultPrevented).toBe(true);
    expect(openRoom.mock.calls[0][0]).toBe("room:exact");
    expect(screen.queryByRole("dialog")).toBeNull();
    const staleFinish = finish;
    act(() => { window.dispatchEvent(request()); });
    expect(openRoom.mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => { staleFinish(true); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onResult).not.toHaveBeenCalled();
    await act(async () => {
      hookState.controller = { ...hookState.controller!, room: makeRoom("room:exact") } as unknown as HelixSharedLiveRoomController;
      view.rerender(<HelixAskSharedLiveRoomControls realtimeSessionId={null} runtimeActive={false} realtimeModel="gpt-realtime" />);
      finish(true);
    });
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });
  it("reports failed exact-room reads without opening the current other room", async () => {
    const openRoom = vi.fn(async () => false);
    hookState.controller = { room: { room_id: "room:other", status: "ready", participants: [],
      runtime: { state: "idle", transport_owner: "none", realtime_session_ref_hash: null } },
      selfParticipant: null, openRoom } as unknown as HelixSharedLiveRoomController;
    render(<HelixAskSharedLiveRoomControls realtimeSessionId={null} runtimeActive={false} realtimeModel="gpt-realtime" />);
    const onResult = vi.fn();
    await act(async () => { window.dispatchEvent(new CustomEvent(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT,
      { detail: { roomId: "room:exact", onResult }, cancelable: true })); });
    expect(onResult).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("publishes the active room id for typed Ask and clears it when the room closes", async () => {
    const onActiveRoomChange = vi.fn();
    hookState.controller = {
      room: {
        room_id: "shared_realtime_room:test",
        status: "ready",
        participants: [],
        runtime: {
          state: "idle",
          transport_owner: "none",
          realtime_session_ref_hash: null,
        },
      },
      selfParticipant: null,
    } as unknown as HelixSharedLiveRoomController;

    const view = render(
      <HelixAskSharedLiveRoomControls
        realtimeSessionId={null}
        runtimeActive={false}
        realtimeModel="gpt-realtime"
        onActiveRoomChange={onActiveRoomChange}
      />,
    );
    await waitFor(() =>
      expect(onActiveRoomChange).toHaveBeenCalledWith(
        "shared_realtime_room:test",
      ),
    );

    hookState.controller = {
      ...hookState.controller,
      room: {
        ...hookState.controller!.room!,
        status: "closed",
      },
    } as HelixSharedLiveRoomController;
    view.rerender(
      <HelixAskSharedLiveRoomControls
        realtimeSessionId={null}
        runtimeActive={false}
        realtimeModel="gpt-realtime"
        onActiveRoomChange={onActiveRoomChange}
      />,
    );
    await waitFor(() =>
      expect(onActiveRoomChange).toHaveBeenLastCalledWith(null),
    );
  });

  it("opens the existing dialog when the Guide sends its navigation-only event", async () => {
    hookState.controller = {
      room: null,
      selfParticipant: null,
      busyAction: null,
      error: null,
      mediaBridge: {
        state: "idle",
        role: "participant",
        provider_attachment_mode: "required",
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
    } as unknown as HelixSharedLiveRoomController;

    render(
      <HelixAskSharedLiveRoomControls
        realtimeSessionId={null}
        runtimeActive={false}
        realtimeModel="gpt-realtime"
      />,
    );
    window.dispatchEvent(new CustomEvent(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT));

    expect(await screen.findByRole("dialog", { name: "Shared Live Room proof" })).toBeTruthy();
  });
});
