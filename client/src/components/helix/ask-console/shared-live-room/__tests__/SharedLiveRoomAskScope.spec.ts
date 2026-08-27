import { describe, expect, it, vi } from "vitest";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { HelixSharedLiveRoomApi } from "../SharedLiveRoomApi";
import { resolveHelixAskSharedLiveRoomId } from "../SharedLiveRoomAskScope";

const room = (
  roomId: string,
  status: HelixSharedRealtimeRoom["status"],
  updatedAt: string,
): HelixSharedRealtimeRoom => ({
  room_id: roomId,
  status,
  updated_at: updatedAt,
} as HelixSharedRealtimeRoom);

describe("Shared Live Room typed Ask scope", () => {
  it("validates the selected room before using its thread scope", async () => {
    const api = {
      getRoom: vi.fn().mockResolvedValue(room("room:selected", "ready", "2026-08-26T12:00:00Z")),
      listRooms: vi.fn(),
    } as unknown as HelixSharedLiveRoomApi;

    await expect(resolveHelixAskSharedLiveRoomId({
      api,
      selectedRoomId: "room:selected",
    })).resolves.toBe("room:selected");
    expect(api.listRooms).not.toHaveBeenCalled();
  });

  it("fails closed when more than one open room exists and selection has not hydrated", async () => {
    const api = {
      getRoom: vi.fn(),
      listRooms: vi.fn().mockResolvedValue([
        room("room:closed", "closed", "2026-08-26T12:03:00Z"),
        room("room:older", "ready", "2026-08-26T12:01:00Z"),
        room("room:newer", "active", "2026-08-26T12:02:00Z"),
      ]),
    } as unknown as HelixSharedLiveRoomApi;

    await expect(resolveHelixAskSharedLiveRoomId({
      api,
      selectedRoomId: null,
    })).resolves.toBeNull();
  });

  it("restores the only open room when client selection has not hydrated", async () => {
    const api = {
      getRoom: vi.fn(),
      listRooms: vi.fn().mockResolvedValue([
        room("room:closed", "closed", "2026-08-26T12:03:00Z"),
        room("room:only-open", "ready", "2026-08-26T12:01:00Z"),
      ]),
    } as unknown as HelixSharedLiveRoomApi;

    await expect(resolveHelixAskSharedLiveRoomId({
      api,
      selectedRoomId: null,
    })).resolves.toBe("room:only-open");
  });

  it("does not use a closed selected room", async () => {
    const api = {
      getRoom: vi.fn().mockResolvedValue(room("room:closed", "closed", "2026-08-26T12:00:00Z")),
      listRooms: vi.fn(),
    } as unknown as HelixSharedLiveRoomApi;

    await expect(resolveHelixAskSharedLiveRoomId({
      api,
      selectedRoomId: "room:closed",
    })).resolves.toBeNull();
  });

  it("fails closed when room identity cannot be verified", async () => {
    const api = {
      getRoom: vi.fn(),
      listRooms: vi.fn().mockRejectedValue(new Error("room service unavailable")),
    } as unknown as HelixSharedLiveRoomApi;

    await expect(resolveHelixAskSharedLiveRoomId({
      api,
      selectedRoomId: null,
    })).rejects.toThrow("room service unavailable");
  });
});
