// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { helixSharedLiveRoomApi } from "../SharedLiveRoomApi";

const responseBody = {
  schema: "helix.shared_realtime_room.response.v1",
  ok: true,
  error: null,
  message: "ok",
  room: { room_id: "room:test" },
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

afterEach(() => vi.unstubAllGlobals());

describe("Shared Live Room API transport", () => {
  it("sends the selected Realtime model when reserving the room slot", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await helixSharedLiveRoomApi.reserveRuntime("room:test", "gpt-realtime-2.1-mini");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agi/realtime/rooms/room%3Atest/runtime/reserve",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ model: "gpt-realtime-2.1-mini" }),
      }),
    );
  });

  it("uses a keepalive request when page exit reports away presence", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await helixSharedLiveRoomApi.updatePresence("room:test", "away", { keepalive: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agi/realtime/rooms/room%3Atest/presence",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        body: JSON.stringify({ presence: "away" }),
      }),
    );
  });
});
