import { describe, expect, it } from "vitest";

import {
  askLiveEventBelongsToActiveTurn,
  createHelixAskConsoleStreamIngressDebug,
  incrementHelixAskConsoleDropReason,
} from "@/lib/helix/ask-active-turn-stream";

describe("ask active turn stream", () => {
  it("creates console stream ingress debug counters with normalized ids", () => {
    expect(
      createHelixAskConsoleStreamIngressDebug({
        turnId: " turn-1 ",
        traceId: " trace-1 ",
        startedAtMs: 12.7,
      }),
    ).toMatchObject({
      schema: "helix.ask.console_stream_ingress_debug.v1",
      turnId: "turn-1",
      traceId: "trace-1",
      startedAtMs: 12,
      rawStreamPacketCount: 0,
      droppedReasons: {},
    });
  });

  it("increments dropped reason counts without mutating the previous object", () => {
    const previous = { old: 2 };
    const next = incrementHelixAskConsoleDropReason(previous, " invalid_transcript_record ");
    const fallback = incrementHelixAskConsoleDropReason(next, " ");

    expect(previous).toEqual({ old: 2 });
    expect(next).toEqual({ old: 2, invalid_transcript_record: 1 });
    expect(fallback).toEqual({ old: 2, invalid_transcript_record: 1, unknown: 1 });
  });

  it("matches active live events by turn or trace identity before timestamp fallback", () => {
    expect(
      askLiveEventBelongsToActiveTurn({
        activeTurnId: "turn-1",
        activeTraceId: "trace-1",
        event: {
          id: "event-1",
          ts: "2026-07-01T12:00:00.000Z",
          text: "working",
          meta: { turn_id: "turn-1" },
        },
      }),
    ).toBe(true);

    expect(
      askLiveEventBelongsToActiveTurn({
        activeTurnId: "turn-1",
        activeTraceId: "trace-1",
        activeStartedAtMs: Date.parse("2026-07-01T12:00:00.000Z"),
        event: {
          id: "event-2",
          ts: "2026-07-01T12:00:01.000Z",
          text: "stale",
          meta: { trace_id: "trace-older" },
        },
      }),
    ).toBe(false);
  });

  it("admits timestamp-only active live events started near the active turn", () => {
    const activeStartedAtMs = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      askLiveEventBelongsToActiveTurn({
        activeStartedAtMs,
        event: {
          id: "event-near",
          ts: "2026-07-01T11:59:59.600Z",
          text: "near start",
          meta: {},
        },
      }),
    ).toBe(true);

    expect(
      askLiveEventBelongsToActiveTurn({
        activeStartedAtMs,
        event: {
          id: "event-old",
          ts: "2026-07-01T11:59:59.000Z",
          text: "old",
          meta: {},
        },
      }),
    ).toBe(false);
  });
});
