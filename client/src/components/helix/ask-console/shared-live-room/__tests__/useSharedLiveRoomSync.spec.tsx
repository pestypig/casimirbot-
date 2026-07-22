/** @vitest-environment jsdom */

import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { HelixSharedLiveRoomApi } from "../SharedLiveRoomApi";
import { useSharedLiveRoomSync } from "../useSharedLiveRoomSync";

const room = {
  room_id: "room:presence-test",
} as HelixSharedRealtimeRoom;

const noop = () => undefined;

const Harness = ({ api }: { api: HelixSharedLiveRoomApi }) => {
  useSharedLiveRoomSync({
    api,
    activeRoomId: room.room_id,
    onInitialRooms: noop,
    onRoom: noop,
    onFrames: noop,
    onClearRoomArtifacts: noop,
    onError: noop,
    onLoading: noop,
  });
  return null;
};

afterEach(() => cleanup());

describe("Shared Live Room presence synchronization", () => {
  it("keeps a background screen-sharing tab present and reports away only on page exit", async () => {
    const updatePresence = vi.fn(async () => room);
    const api = {
      listRooms: vi.fn(async () => []),
      getRoom: vi.fn(async () => room),
      listVisualFrames: vi.fn(async () => []),
      updatePresence,
    } as unknown as HelixSharedLiveRoomApi;
    render(<Harness api={api} />);

    await waitFor(() => expect(updatePresence).toHaveBeenCalledWith(
      room.room_id,
      "present",
    ));
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(updatePresence.mock.calls.some(([, presence]) => presence === "away")).toBe(false);

    window.dispatchEvent(new Event("pagehide"));
    await waitFor(() => expect(updatePresence).toHaveBeenCalledWith(
      room.room_id,
      "away",
      { keepalive: true },
    ));
  });
});
