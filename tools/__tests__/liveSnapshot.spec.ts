import { afterEach, describe, expect, it, vi } from "vitest";
import { pullSettledSnapshot } from "../liveSnapshot";
import type { PipelineSnapshot } from "../../types/pipeline";

const asResponse = (body: PipelineSnapshot, headers: Record<string, string> = {}) => ({
  headers: {
    get: (key: string) => headers[key] ?? null,
  },
  json: async () => body,
});

describe("pullSettledSnapshot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects when mock header is present", async () => {
    const snap: PipelineSnapshot = { ts: { ratio: 120, tauLC_ms: 1, tauPulse_ns: 1_000 } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(asResponse(snap, { "X-Helix-Mock": "1" })));

    await expect(pullSettledSnapshot({ maxWaitMs: 5, pollEveryMs: 1 })).rejects.toThrow(/DEV mock/);
  });

  it("resolves when TS and QI are within targets", async () => {
    const live: PipelineSnapshot = {
      ts: {
        ratio: 120,
        tauLC_ms: 1,
        tauPulse_ns: 1_000,
        autoscale: { engaged: false, gating: "idle", appliedBurst_ns: 1_000, target: 120 },
      },
      qiGuardrail: {
        marginRatioRaw: 0.5,
        marginRatio: 0.5,
        lhs_Jm3: -0.36,
        bound_Jm3: 1,
        window_ms: 40,
        sumWindowDt: 1,
      },
      qiAutoscale: { engaged: false, gating: "idle", appliedScale: 1, target: 1 },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(asResponse(live, { "X-Helix-Mock": "0", "X-Server-PID": "42" })),
    );

    const { snap, meta } = await pullSettledSnapshot({ maxWaitMs: 10, pollEveryMs: 1, requireTsTarget: 100 });
    expect(snap).toEqual(live);
    expect(meta["X-Helix-Mock"]).toBe("0");
    expect(meta["X-Server-PID"]).toBe("42");
  });

  it("fails with reason when TS stays below target", async () => {
    const low: PipelineSnapshot = {
      ts: { ratio: 50, tauLC_ms: 1, tauPulse_ns: 5_000, autoscale: { engaged: false, gating: "idle", appliedBurst_ns: 5_000, target: 120 } },
      qiGuardrail: { marginRatioRaw: 0.5, marginRatio: 0.5, lhs_Jm3: -0.36, bound_Jm3: 1, window_ms: 40, sumWindowDt: 1 },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(asResponse(low, { "X-Helix-Mock": "0" })));

    await expect(pullSettledSnapshot({ maxWaitMs: 5, pollEveryMs: 1, requireTsTarget: 100 })).rejects.toThrow(
      /TS=50/,
    );
  });
});
