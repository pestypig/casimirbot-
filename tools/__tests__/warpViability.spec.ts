import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpyInstance } from "vitest";
import { evaluateWarpViability } from "../warpViability";
import { initializePipelineState } from "../../server/energy-pipeline";
import * as energyPipeline from "../../server/energy-pipeline";
import type { EnergyPipelineState, PipelineRunOptions } from "../../server/energy-pipeline";
import type { PipelineSnapshot } from "../../types/pipeline";

type CalcSpy = SpyInstance<[EnergyPipelineState, PipelineRunOptions?], Promise<EnergyPipelineState>>;

const envBackup = {
  TS_AUTOSCALE_ENABLE: process.env.TS_AUTOSCALE_ENABLE,
  TS_AUTOSCALE_TARGET: process.env.TS_AUTOSCALE_TARGET,
  WARP_STRICT_CONGRUENCE: process.env.WARP_STRICT_CONGRUENCE,
};

let calcSpy: CalcSpy | null = null;

beforeEach(() => {
  process.env.WARP_STRICT_CONGRUENCE = "0";
  if (calcSpy) {
    calcSpy.mockRestore();
    calcSpy = null;
  }
});

afterEach(() => {
  process.env.TS_AUTOSCALE_ENABLE = envBackup.TS_AUTOSCALE_ENABLE;
  process.env.TS_AUTOSCALE_TARGET = envBackup.TS_AUTOSCALE_TARGET;
  process.env.WARP_STRICT_CONGRUENCE = envBackup.WARP_STRICT_CONGRUENCE;
  if (calcSpy) {
    calcSpy.mockRestore();
    calcSpy = null;
  }
});

describe("warp viability oracle (TS)", () => {
  it("resamples when TS autoscale is active and converges to green", async () => {
    const base = { ...initializePipelineState(), currentMode: "hover" as const };
    const first = {
      ...base,
      TS_ratio: 50,
      tsMetricDerived: true,
      tsMetricDerivedSource: "warp.metricAdapter+clocking",
      sectorPeriod_ms: 25,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 8, dwell_ms: 10 },
      tsAutoscale: { engaged: true, gating: "active", appliedBurst_ns: 8_000, targetTS: 120 },
    };
    const settled = {
      ...base,
      TS_ratio: 130,
      tsMetricDerived: true,
      tsMetricDerivedSource: "warp.metricAdapter+clocking",
      sectorPeriod_ms: 25,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 2, dwell_ms: 10 },
      tsAutoscale: { engaged: true, gating: "idle", appliedBurst_ns: 2_000, targetTS: 120 },
    };
    calcSpy = vi
      .spyOn(energyPipeline, "calculateEnergyPipeline")
      .mockResolvedValueOnce(first as any)
      .mockResolvedValueOnce(settled as any);

    const result = await evaluateWarpViability({});
    const tsConstraint = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect(tsConstraint?.passed).toBe(true);
    expect(tsConstraint?.details).toMatch(/resamples=1/);
    expect(result.mitigation).toEqual(["TS_autoscale_resampled"]);
  });

  it("passes TS with idle jitter buffer when settled just under the hard floor", async () => {
    const base = { ...initializePipelineState(), currentMode: "hover" as const };
    const idleSnapshot = {
      ...base,
      TS_ratio: 99.8,
      tsMetricDerived: true,
      tsMetricDerivedSource: "warp.metricAdapter+clocking",
      sectorPeriod_ms: 30,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 10, dwell_ms: 10 },
      tsAutoscale: { engaged: false, gating: "idle", targetTS: 120 },
    };
    calcSpy = vi.spyOn(energyPipeline, "calculateEnergyPipeline").mockResolvedValue(idleSnapshot as any);

    const result = await evaluateWarpViability({});
    const tsConstraint = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect(tsConstraint?.passed).toBe(true);
    expect(tsConstraint?.note).toContain("idle_jitter_buffer");
  });

  it("returns MARGINAL when autoscale is idle and TS stays low", async () => {
    const base = { ...initializePipelineState(), currentMode: "hover" as const };
    const lowTs = {
      ...base,
      TS_ratio: 50,
      tsMetricDerived: true,
      tsMetricDerivedSource: "warp.metricAdapter+clocking",
      sectorPeriod_ms: 30,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 10, dwell_ms: 10 },
      tsAutoscale: { engaged: false, gating: "idle", targetTS: 120 },
    };
    calcSpy = vi.spyOn(energyPipeline, "calculateEnergyPipeline").mockResolvedValue(lowTs as any);

    const result = await evaluateWarpViability({});
    const tsConstraint = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect(tsConstraint?.passed).toBe(false);
    expect(result.status).toBe("MARGINAL");
    expect(result.mitigation).toBeUndefined();
  });

  it("uses live pipeline snapshot telemetry when provided", async () => {
    const base = { ...initializePipelineState(), currentMode: "hover" as const };
    const simulatedPipeline = {
      ...base,
      TS_ratio: 50,
      tsMetricDerived: true,
      tsMetricDerivedSource: "warp.metricAdapter+clocking",
      sectorPeriod_ms: 30,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 10, dwell_ms: 10 },
      tsAutoscale: { engaged: false, gating: "idle", appliedBurst_ns: 10_000, targetTS: 120 },
      qiGuardrail: { marginRatioRaw: 0.5, marginRatio: 0.5, lhs_Jm3: -0.3, bound_Jm3: 1, window_ms: 40 },
    };
    calcSpy = vi.spyOn(energyPipeline, "calculateEnergyPipeline").mockResolvedValue(simulatedPipeline as any);

    const liveSnapshot: PipelineSnapshot = {
      ts: {
        ratio: 130,
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
      __ts: 123,
    };

    const result = await evaluateWarpViability(
      {},
      { snapshot: liveSnapshot, telemetrySource: "pipeline-live", telemetryHeaders: { "X-Helix-Mock": "0" } },
    );
    const tsConstraint = result.constraints.find((c) => c.id === "TS_ratio_min");
    expect(tsConstraint?.passed).toBe(true);
    expect(result.snapshot.telemetrySource).toBe("pipeline-live");
    expect((result.snapshot as any).pipelineHeaders?.["X-Helix-Mock"]).toBe("0");
    expect(result.snapshot.ts?.TS_ratio).toBe(130);
    expect(result.snapshot.ts?.tauLC_ms).toBe(1);
    expect(result.snapshot.ts?.tauPulse_ns).toBe(1_000);
  });

  it("fails TS_ratio_min on proxy timing in strict mode and passes when strict mode is disabled", async () => {
    const base = { ...initializePipelineState(), currentMode: "hover" as const };
    const proxyTiming = {
      ...base,
      TS_ratio: 150,
      tsMetricDerived: false,
      tsMetricDerivedSource: "hardware_timing",
      tsMetricDerivedReason: "clocking provenance is hardware telemetry",
      sectorPeriod_ms: 30,
      lightCrossing: { tauLC_ns: 1e6, burst_ms: 10, dwell_ms: 10 },
      tsAutoscale: { engaged: false, gating: "idle", targetTS: 120 },
    };
    calcSpy = vi.spyOn(energyPipeline, "calculateEnergyPipeline").mockResolvedValue(proxyTiming as any);

    process.env.WARP_STRICT_CONGRUENCE = "1";
    const strictResult = await evaluateWarpViability({});
    const strictTs = strictResult.constraints.find((c) => c.id === "TS_ratio_min");
    expect(strictTs?.passed).toBe(false);
    expect(strictTs?.note).toBe("proxy_input");

    process.env.WARP_STRICT_CONGRUENCE = "0";
    const relaxedResult = await evaluateWarpViability({});
    const relaxedTs = relaxedResult.constraints.find((c) => c.id === "TS_ratio_min");
    expect(relaxedTs?.passed).toBe(true);
  });
});
