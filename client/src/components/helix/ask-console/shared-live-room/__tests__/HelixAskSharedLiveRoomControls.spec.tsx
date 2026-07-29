/** @vitest-environment jsdom */

import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixSharedLiveRoomController } from
  "../useHelixSharedLiveRoom";
import { HelixAskSharedLiveRoomControls } from
  "../HelixAskSharedLiveRoomControls";

const hookState = vi.hoisted(() => ({
  controller: null as HelixSharedLiveRoomController | null,
}));

vi.mock("../useHelixSharedLiveRoom", () => ({
  useHelixSharedLiveRoom: () => hookState.controller,
}));

afterEach(() => {
  cleanup();
  hookState.controller = null;
});

describe("Helix Ask shared-room thread scope", () => {
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
});
