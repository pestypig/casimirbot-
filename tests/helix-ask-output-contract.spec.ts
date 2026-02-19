import { describe, expect, it } from "vitest";

import { __testHelixAskOutputContract } from "../server/routes/agi.plan";

describe("Helix Ask output contract normalization", () => {
  it("classifies timeout semantics into soft vs hard classes", () => {
    expect(__testHelixAskOutputContract.classifyHelixAskTimeoutFailClass("This operation was aborted")).toBe("timeout_soft");
    expect(__testHelixAskOutputContract.classifyHelixAskTimeoutFailClass("request timeout after 10000ms")).toBe("timeout_hard");
    expect(__testHelixAskOutputContract.classifyHelixAskTimeoutFailClass("validation failed")).toBeNull();
  });

  it("normalizes error payloads into phase 6 scoring envelope", () => {
    const requestMetadata = __testHelixAskOutputContract.buildHelixAskRequestMetadata({
      question: "why",
      traceId: "phase6-live-A-p01-s7-r2",
      seed: 7,
      sessionId: "s1",
    });
    const payload = __testHelixAskOutputContract.normalizeHelixAskErrorEnvelope(
      500,
      { ok: false, error: "helix_ask_unhandled", message: "This operation was aborted" },
      requestMetadata,
      Date.now() - 25,
    ) as {
      contract_version?: string;
      request_metadata?: { replay?: { index?: number | null; isReplay?: boolean } };
      status?: { ok?: boolean; http_status?: number; fail_class?: string; fail_reason?: string };
      timing?: { elapsed_ms?: number };
      debug?: { trace_id?: string | null };
    };

    expect(payload.contract_version).toBe(__testHelixAskOutputContract.contractVersion);
    expect(payload.request_metadata?.replay?.index).toBe(2);
    expect(payload.request_metadata?.replay?.isReplay).toBe(true);
    expect(payload.status).toMatchObject({
      ok: false,
      http_status: 500,
      fail_class: "timeout_soft",
      fail_reason: "This operation was aborted",
    });
    expect((payload.timing?.elapsed_ms ?? 0) >= 20).toBe(true);
    expect(payload.debug?.trace_id).toBe("phase6-live-A-p01-s7-r2");
  });
});
