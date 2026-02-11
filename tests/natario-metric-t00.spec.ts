import { describe, expect, it } from "vitest";
import { calculateNatarioWarpBubble, type NatarioWarpParams } from "../modules/warp/natario-warp";

describe("natario metric-derived T00", () => {
  const baseParams: NatarioWarpParams = {
    bowlRadius: 25000, // um
    sagDepth: 16, // nm
    gap: 1, // nm
    cavityQ: 1e9,
    burstDuration: 10, // us
    cycleDuration: 1000, // us
    sectorCount: 400,
    dutyFactor: 0.01,
    effectiveDuty: 2.5e-5,
    shiftAmplitude: 1e-6,
    expansionTolerance: 1e-12,
    warpFieldType: "natario",
  };

  it("uses metric-derived stress for natario", () => {
    const result = calculateNatarioWarpBubble(baseParams);
    expect(result.stressEnergySource).toBe("metric");
    expect(result.metricT00Source).toBe("metric");
    expect(result.metricT00Ref).toBe("warp.metric.T00.natario.shift");
    expect(result.metricT00).toBeDefined();
    expect(result.metricStressDiagnostics?.sampleCount ?? 0).toBeGreaterThan(0);
    expect(Number.isFinite(result.stressEnergyTensor.T00)).toBe(true);
  });

  it("uses metric-derived stress for natario_sdf", () => {
    const result = calculateNatarioWarpBubble({
      ...baseParams,
      warpFieldType: "natario_sdf",
      warpGridResolution: 12,
    });
    expect(result.stressEnergySource).toBe("metric");
    expect(result.metricT00Source).toBe("metric");
    expect(result.metricT00Ref).toBe("warp.metric.T00.natario_sdf.shift");
    expect(result.metricT00).toBeDefined();
    expect(result.metricStressDiagnostics?.sampleCount ?? 0).toBeGreaterThan(0);
    expect(Number.isFinite(result.stressEnergyTensor.T00)).toBe(true);
  });

  it("uses metric-derived stress for irrotational fallback path", () => {
    const result = calculateNatarioWarpBubble({
      ...baseParams,
      warpFieldType: "irrotational",
    });
    expect(result.stressEnergySource).toBe("metric");
    expect(result.metricT00Source).toBe("metric");
    expect(result.metricT00Ref).toBe("warp.metric.T00.irrotational.shift");
    expect(result.metricT00).toBeDefined();
    expect(result.metricStressDiagnostics?.sampleCount ?? 0).toBeGreaterThan(0);
    expect(Number.isFinite(result.stressEnergyTensor.T00)).toBe(true);
  });
});
