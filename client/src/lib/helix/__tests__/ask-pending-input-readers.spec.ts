import { describe, expect, it } from "vitest";

import {
  normalizeHelixPendingTransitionMarker,
  readHelixPendingInputRecord,
  readHelixPendingTransitionTrace,
} from "../ask-pending-input-readers";

describe("ask pending input readers", () => {
  it("returns only active pending input records", () => {
    const byRequestId = { request_id: "req-1" };
    const byPrompt = { prompt: "Choose a document" };
    const byFields = { required_fields: ["doc_path"] };
    const byKind = { kind: "request_user_input" };

    expect(readHelixPendingInputRecord(byRequestId)).toBe(byRequestId);
    expect(readHelixPendingInputRecord(byPrompt)).toBe(byPrompt);
    expect(readHelixPendingInputRecord(byFields)).toBe(byFields);
    expect(readHelixPendingInputRecord(byKind)).toBe(byKind);
  });

  it("rejects non-records and resolved pending records", () => {
    expect(readHelixPendingInputRecord(null)).toBeNull();
    expect(readHelixPendingInputRecord(["req-1"])).toBeNull();
    expect(readHelixPendingInputRecord({ request_id: "req-1", status: "resolved" })).toBeNull();
    expect(readHelixPendingInputRecord({ request_id: "req-1", state: "cancelled" })).toBeNull();
    expect(readHelixPendingInputRecord({ request_id: "req-1", resolution_status: "superseded" })).toBeNull();
    expect(readHelixPendingInputRecord({ note: "not pending" })).toBeNull();
  });

  it("normalizes pending transition markers", () => {
    expect(normalizeHelixPendingTransitionMarker(" Pending Clarify-Canceled ")).toBe("pending_clarify_canceled");
    expect(normalizeHelixPendingTransitionMarker("request user input canceled")).toBe(
      "request_user_input_canceled",
    );
    expect(normalizeHelixPendingTransitionMarker(null)).toBe("");
  });

  it("normalizes pending transition traces from arrays or scalar values", () => {
    expect(readHelixPendingTransitionTrace([" Pending Clarify-Canceled ", "", null, "cancel pending"])).toEqual([
      "pending_clarify_canceled",
      "cancel_pending",
    ]);
    expect(readHelixPendingTransitionTrace("request user input canceled")).toEqual([
      "request_user_input_canceled",
    ]);
    expect(readHelixPendingTransitionTrace("   ")).toEqual([]);
  });
});
