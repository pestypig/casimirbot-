/** @vitest-environment jsdom */

import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixSharedRealtimeRoom } from
  "@shared/helix-shared-realtime-room";
import type { HelixSharedLiveRoomApi } from "../SharedLiveRoomApi";
import { useSharedLiveRoomSync } from "../useSharedLiveRoomSync";

const room = {
  room_id: "room:fast-floor-sync",
  updated_at: new Date(0).toISOString(),
} as HelixSharedRealtimeRoom;

function Harness({ api }: { api: HelixSharedLiveRoomApi }) {
  useSharedLiveRoomSync({
    api,
    activeRoomId: room.room_id,
    onInitialRooms: vi.fn(),
    onRoom: vi.fn(),
    onFrames: vi.fn(),
    onClearRoomArtifacts: vi.fn(),
    onError: vi.fn(),
    onLoading: vi.fn(),
  });
  return null;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Shared Live Room state refresh", () => {
  it("propagates floor/media state faster than the heavier frame carousel", async () => {
    vi.useFakeTimers();
    const api = {
      listRooms: vi.fn(async () => []),
      getRoom: vi.fn(async () => room),
      listVisualFrames: vi.fn(async () => []),
      updatePresence: vi.fn(async () => room),
    } as unknown as HelixSharedLiveRoomApi;

    render(<Harness api={api} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(api.getRoom).toHaveBeenCalledTimes(1);
    expect(api.listVisualFrames).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(api.getRoom).toHaveBeenCalledTimes(2);
    expect(api.listVisualFrames).toHaveBeenCalledTimes(1);
  });
});
