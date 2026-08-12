import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { createHelixAskTurnStreamAbortBoundary } from "../ask-turn-stream-abort";

describe("Helix Ask stream abort boundary", () => {
  it("aborts unfinished provider work when the response closes", () => {
    const request = new EventEmitter();
    const response = Object.assign(new EventEmitter(), { writableEnded: false });
    const boundary = createHelixAskTurnStreamAbortBoundary({
      request: request as never,
      response: response as never,
    });

    response.emit("close");

    expect(boundary.signal.aborted).toBe(true);
    boundary.dispose();
  });

  it("does not turn a normal completed response close into cancellation", () => {
    const request = new EventEmitter();
    const response = Object.assign(new EventEmitter(), { writableEnded: true });
    const boundary = createHelixAskTurnStreamAbortBoundary({
      request: request as never,
      response: response as never,
    });

    response.emit("close");

    expect(boundary.signal.aborted).toBe(false);
    boundary.dispose();
  });
});
