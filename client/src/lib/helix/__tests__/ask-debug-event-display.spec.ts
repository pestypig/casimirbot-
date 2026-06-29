import { describe, expect, it } from "vitest";
import {
  buildAskLiveEventLogDetailPayload,
  buildAskLiveEventLogExport,
  formatAskLiveEventLogLine,
  parseHelixAskQueuedQuestionsInput,
  readEventMetaString,
  resolveAskLiveEventTimestampMs,
  type AskLiveEventEntry,
} from "@/lib/helix/ask-debug-event-display";

describe("Helix Ask debug event display", () => {
  it("formats live event log lines with stable labels and clipped text", () => {
    const event: AskLiveEventEntry = {
      id: "event-1",
      text: `Observation ${"x".repeat(260)}`,
      tool: "helix.ask.route.product",
      tsMs: Date.UTC(2026, 0, 2, 3, 4, 5, 678),
      seq: 4.8,
      durationMs: 12.6,
      meta: {
        stage: "route",
        status: "ok",
        detail: "terminal",
      },
    };

    expect(formatAskLiveEventLogLine(event)).toBe(
      `[03:04:05.678] tool=route product | stage=route | status=ok | detail=terminal | seq=4 | dur=13ms | text=Observation ${"x".repeat(205)}...`,
    );
  });

  it("builds newline exports and leaves an empty event list empty", () => {
    expect(buildAskLiveEventLogExport([])).toBe("");
    expect(
      buildAskLiveEventLogExport([
        { id: "event-1", text: "first", tool: "helix.ask.first", tsMs: 0 },
        { id: "event-2", text: "second", tool: "custom.tool", tsMs: 1 },
      ]),
    ).toBe(
      [
        "[00:00:00.000] tool=first | text=first",
        "[00:00:00.001] tool=custom.tool | text=second",
      ].join("\n"),
    );
  });

  it("renders detail payloads with normalized timestamps, durations, and circular metadata", () => {
    const meta: Record<string, unknown> = { stage: "loop" };
    meta.self = meta;
    const detail = JSON.parse(
      buildAskLiveEventLogDetailPayload({
        id: "event-3",
        text: "payload",
        tool: "helix.ask.detail",
        ts: "2026-01-02T03:04:05.000Z",
        seq: 7,
        durationMs: 4.6,
        meta,
      }),
    ) as Record<string, unknown>;

    expect(detail).toMatchObject({
      id: "event-3",
      ts: "2026-01-02T03:04:05.000Z",
      tsMs: Date.UTC(2026, 0, 2, 3, 4, 5),
      tool: "helix.ask.detail",
      seq: 7,
      durationMs: 5,
      text: "payload",
    });
    expect(detail.meta).toMatchObject({ stage: "loop", self: "[Circular]" });
  });

  it("reads timestamp and metadata aliases without defaulting to UI state", () => {
    expect(resolveAskLiveEventTimestampMs({ id: "event-4", text: "", tsMs: 42 })).toBe(42);
    expect(resolveAskLiveEventTimestampMs({ id: "event-5", text: "", ts: "bad" })).toBeNull();
    expect(readEventMetaString({ trace_id: " trace-1 ", traceId: "trace-2" }, ["traceId", "trace_id"])).toBe(
      "trace-2",
    );
    expect(readEventMetaString({ trace_id: " trace-1 " }, ["traceId", "trace_id"])).toBe("trace-1");
    expect(readEventMetaString(undefined, ["traceId"])).toBeNull();
  });

  it("preserves queued prompt input as a single normalized turn", () => {
    const prompt = "First instruction\r\n\r\n---\r\nQuestion 2: keep this as content";

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([
      "First instruction\n\n---\nQuestion 2: keep this as content",
    ]);
    expect(parseHelixAskQueuedQuestionsInput("   \n")).toEqual([]);
  });
});
