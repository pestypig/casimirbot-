import { describe, expect, it } from "vitest";
import {
  applyLatestWinsVoiceQueue,
  createVoicePlaybackUtterance,
  segmentVoicePlaybackText,
  trimVoicePlaybackQueue,
} from "@/lib/helix/voice-playback";

describe("segmentVoicePlaybackText", () => {
  it("splits long text using punctuation-first boundaries", () => {
    const text =
      "Negative energy density is a theoretical concept in quantum field theory. " +
      "It appears in discussions of Casimir effects, wormholes, and warp-drive papers. " +
      "Practical engineering remains speculative, and constraints from quantum inequalities are strict.";
    const chunks = segmentVoicePlaybackText(text, {
      targetMinChars: 90,
      targetMaxChars: 160,
      hardMaxChars: 220,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 220)).toBe(true);
    expect(chunks[0]?.endsWith(".")).toBe(true);
  });

  it("falls back to hard word-boundary splits when a phrase is too long", () => {
    const word = "a".repeat(260);
    const chunks = segmentVoicePlaybackText(`${word} ${word}`, {
      targetMinChars: 60,
      targetMaxChars: 120,
      hardMaxChars: 140,
    });

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.length <= 140)).toBe(true);
  });
});

describe("applyLatestWinsVoiceQueue", () => {
  const make = (
    utteranceId: string,
    turnKey: string,
    kind: "brief" | "final",
    revision = 1,
    text = "test",
  ) =>
    createVoicePlaybackUtterance({
      utteranceId,
      turnKey,
      kind,
      revision,
      text,
      eventId: utteranceId,
      enqueuedAtMs: 1,
    });

  it("replaces queued brief for same turn and clears stale queued briefs from prior turns", () => {
    const queue = [
      make("brief-old-turn-a", "turn-a", "brief"),
      make("brief-old-turn-b", "turn-b", "brief"),
      make("final-turn-z", "turn-z", "final"),
    ];
    const incoming = make("brief-new-turn-b", "turn-b", "brief", 2);
    const next = applyLatestWinsVoiceQueue({
      queue,
      incoming,
      active: make("brief-active-turn-b", "turn-b", "brief"),
    });

    expect(next.queue.map((entry) => entry.utteranceId)).toEqual([
      "brief-new-turn-b",
      "final-turn-z",
    ]);
    expect(next.droppedUtteranceIds.sort()).toEqual([
      "brief-old-turn-a",
      "brief-old-turn-b",
    ]);
    expect(next.supersededActiveReason).toBe(null);
    expect(next.pendingPreemptPolicy).toBe("pending_regen");
  });

  it("queues same-turn final and marks active same-turn brief for sentence-boundary handoff", () => {
    const queue = [
      make("brief-turn-c", "turn-c", "brief", 1),
      make("final-turn-a", "turn-a", "final", 1),
    ];
    const incoming = make("final-turn-c", "turn-c", "final", 2);
    const next = applyLatestWinsVoiceQueue({
      queue,
      incoming,
      active: make("brief-active-turn-c", "turn-c", "brief", 1),
    });

    expect(next.queue.map((entry) => entry.utteranceId)).toEqual(["final-turn-a", "final-turn-c"]);
    expect(next.droppedUtteranceIds).toEqual(["brief-turn-c"]);
    expect(next.pendingPreemptPolicy).toBe("pending_final");
    expect(next.supersededActiveReason).toBe(null);
  });

  it("marks active prior-turn playback for boundary cancel when new-turn brief arrives", () => {
    const queue = [make("final-queued-turn-z", "turn-z", "final")];
    const incoming = make("brief-new-turn-b", "turn-b", "brief");
    const next = applyLatestWinsVoiceQueue({
      queue,
      incoming,
      active: make("final-active-turn-a", "turn-a", "final"),
    });

    expect(next.queue.map((entry) => entry.utteranceId)).toEqual([
      "brief-new-turn-b",
      "final-queued-turn-z",
    ]);
    expect(next.pendingPreemptPolicy).toBe("pending_regen");
    expect(next.supersededActiveReason).toBe(null);
  });

  it("drops stale queued same-turn finals when a newer final revision arrives", () => {
    const queue = [
      make("final-turn-c-r1", "turn-c", "final", 1),
      make("final-turn-c-r2", "turn-c", "final", 2),
      make("final-turn-z-r1", "turn-z", "final", 1),
    ];
    const incoming = make("final-turn-c-r3", "turn-c", "final", 3);
    const next = applyLatestWinsVoiceQueue({
      queue,
      incoming,
      active: null,
    });

    expect(next.queue.map((entry) => entry.utteranceId)).toEqual([
      "final-turn-z-r1",
      "final-turn-c-r3",
    ]);
    expect(next.droppedUtteranceIds.sort()).toEqual(["final-turn-c-r1", "final-turn-c-r2"]);
  });
});

describe("trimVoicePlaybackQueue", () => {
  it("keeps newest utterances when queue exceeds max length", () => {
    const queue = ["a", "b", "c", "d"].map((id, index) =>
      createVoicePlaybackUtterance({
        utteranceId: id,
        turnKey: `turn-${index}`,
        kind: "brief",
        revision: 1,
        text: id,
        eventId: id,
        enqueuedAtMs: index,
      }),
    );
    const next = trimVoicePlaybackQueue(queue, 2);

    expect(next.queue.map((entry) => entry.utteranceId)).toEqual(["c", "d"]);
    expect(next.droppedUtteranceIds).toEqual(["a", "b"]);
  });
});
