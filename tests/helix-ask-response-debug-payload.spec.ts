import { describe, expect, it, vi } from "vitest";

import {
  attachFinalTraceDebugPayload,
  attachTraceSummaryDebugPayload,
  buildTraceSummary,
  type HelixAskTraceEvent,
} from "../server/services/helix-ask/surface/response-debug-payload";

const makeEvent = (overrides: Partial<HelixAskTraceEvent> = {}): HelixAskTraceEvent => ({
  ts: "2026-04-10T00:00:00.000Z",
  tool: "helix.ask.event",
  stage: "retrieval",
  detail: "lookup",
  ok: true,
  durationMs: 120,
  meta: { fn: "buildAskContextFromQueries" },
  ...overrides,
});

describe("helix ask response debug payload", () => {
  it("builds a duration-sorted trace summary from instrumented events", () => {
    const summary = buildTraceSummary([
      makeEvent({ stage: "slow", durationMs: 400 }),
      makeEvent({ stage: "fast", durationMs: 10 }),
      makeEvent({ stage: "skip-no-fn", meta: {} }),
      makeEvent({ stage: "skip-zero", durationMs: 0 }),
    ]);

    expect(summary).toEqual([
      expect.objectContaining({ stage: "slow", durationMs: 400 }),
      expect.objectContaining({ stage: "fast", durationMs: 10 }),
    ]);
  });

  it("attaches live events, trace events, and summary to the debug payload", () => {
    const debugPayload: Record<string, unknown> = {};
    const attachReasoningSidebarToDebug = vi.fn();
    const traceEvents = [makeEvent({ stage: "retrieval" }), makeEvent({ stage: "finalize", durationMs: 220 })];

    attachTraceSummaryDebugPayload({
      debugPayload,
      traceEvents,
      attachReasoningSidebarToDebug,
    });

    expect(debugPayload.live_events).toBe(traceEvents);
    expect(debugPayload.trace_events).toBe(traceEvents);
    expect(debugPayload.trace_summary).toEqual([
      expect.objectContaining({ stage: "finalize", durationMs: 220 }),
      expect.objectContaining({ stage: "retrieval", durationMs: 120 }),
    ]);
    expect(attachReasoningSidebarToDebug).toHaveBeenCalledOnce();
  });

  it("adds stable event fields and journal metadata for the final trace payload", () => {
    const debugPayload: Record<string, unknown> = {};
    const traceEvents = [makeEvent({ stage: "retrieval" }), makeEvent({ stage: "finalize", durationMs: 220 })];
    const attachReasoningSidebarToDebug = vi.fn();

    attachFinalTraceDebugPayload({
      debugPayload,
      captureLiveHistory: true,
      traceEvents,
      buildEventStableFields: () => ({ retrieval_route: "repo" }),
      hashStableJson: () => "stable-hash",
      attachReasoningSidebarToDebug,
      retrievalRoute: "retrieval:repo",
      fallbackDecision: "none",
      contractRendererPath: "unknown",
      gateOutcomes: {
        evidence_gate_ok: true,
        claim_gate_ok: true,
        doc_slot_gate_ok: true,
      },
    });

    expect(debugPayload.trace_summary).toEqual([
      expect.objectContaining({ stage: "finalize", durationMs: 220 }),
      expect.objectContaining({ stage: "retrieval", durationMs: 120 }),
    ]);
    expect(debugPayload.event_stable_fields).toEqual({ retrieval_route: "repo" });
    expect(debugPayload.event_journal).toEqual(
      expect.objectContaining({
        version: "quake_frame_loop_v1",
        replay_parity: true,
        deterministic: true,
        event_count: 2,
        event_hash: "stable-hash",
        stable_fields: { retrieval_route: "repo" },
      }),
    );
    expect(attachReasoningSidebarToDebug).toHaveBeenCalledOnce();
  });
});
