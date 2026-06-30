import { describe, expect, it } from "vitest";

import {
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
});
