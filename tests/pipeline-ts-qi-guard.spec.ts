import { afterEach, describe, expect, it, vi } from "vitest";

const envBackup = {
  TS_AUTOSCALE_ENABLE: process.env.TS_AUTOSCALE_ENABLE,
  TS_AUTOSCALE_TARGET: process.env.TS_AUTOSCALE_TARGET,
  QI_AUTOSCALE_ENABLE: process.env.QI_AUTOSCALE_ENABLE,
  QI_AUTOSCALE_TARGET: process.env.QI_AUTOSCALE_TARGET,
  QI_AUTOSCALE_SOURCE: process.env.QI_AUTOSCALE_SOURCE,
};

const loadPipeline = async () => {
  vi.resetModules();
  const mod = await import("../server/energy-pipeline");
  return mod;
};

afterEach(() => {
  process.env.TS_AUTOSCALE_ENABLE = envBackup.TS_AUTOSCALE_ENABLE;
  process.env.TS_AUTOSCALE_TARGET = envBackup.TS_AUTOSCALE_TARGET;
  process.env.QI_AUTOSCALE_ENABLE = envBackup.QI_AUTOSCALE_ENABLE;
  process.env.QI_AUTOSCALE_TARGET = envBackup.QI_AUTOSCALE_TARGET;
  process.env.QI_AUTOSCALE_SOURCE = envBackup.QI_AUTOSCALE_SOURCE;
});

describe("pipeline ts/qi autoscale integration", () => {
  it("keeps QI guard consistent when TS autoscale is active", async () => {
    process.env.TS_AUTOSCALE_ENABLE = "true";
    process.env.TS_AUTOSCALE_TARGET = "1000000"; // force TS servo to engage hard
    process.env.QI_AUTOSCALE_ENABLE = "false";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();

    const baseline = await calculateEnergyPipeline(initializePipelineState());
    await new Promise((resolve) => setTimeout(resolve, 200));
    const autoscaled = await calculateEnergyPipeline(baseline);

    const baseBurst =
      (baseline as any).lightCrossing?.burst_ns ??
      ((baseline as any).lightCrossing?.burst_ms ?? 0) * 1e6;
    const autoBurst =
      (autoscaled as any).lightCrossing?.burst_ns ??
      ((autoscaled as any).lightCrossing?.burst_ms ?? 0) * 1e6;

    expect(autoscaled.tsAutoscale?.engaged ?? false).toBe(true);
    expect(autoBurst).toBeLessThanOrEqual(baseBurst);

    const guard = (autoscaled as any).qiGuardrail;
    expect(guard?.marginRatioRaw).toBeDefined();
    expect(guard?.marginRatioRaw ?? 0).toBeLessThan(1);
    expect(Math.abs((guard?.sumWindowDt ?? 1) - 1)).toBeLessThanOrEqual(0.1);
  });

  it("keeps TS timing stable when only QI autoscale is active", async () => {
    process.env.TS_AUTOSCALE_ENABLE = "false";
    process.env.TS_AUTOSCALE_TARGET = "120";
    process.env.QI_AUTOSCALE_ENABLE = "true";
    process.env.QI_AUTOSCALE_TARGET = "0.0000005"; // force QI servo to engage
    process.env.QI_AUTOSCALE_SOURCE = "duty-fallback";

    const { calculateEnergyPipeline, initializePipelineState } = await loadPipeline();

    const baseline = await calculateEnergyPipeline(initializePipelineState());
    await new Promise((resolve) => setTimeout(resolve, 200));
    const autoscaled = await calculateEnergyPipeline(baseline);

    const baseBurst =
      (baseline as any).lightCrossing?.burst_ns ??
      ((baseline as any).lightCrossing?.burst_ms ?? 0) * 1e6;
    const autoBurst =
      (autoscaled as any).lightCrossing?.burst_ns ??
      ((autoscaled as any).lightCrossing?.burst_ms ?? 0) * 1e6;

    expect(autoscaled.qiAutoscale?.engaged ?? false).toBe(true);
    expect((autoscaled.qiAutoscale as any).gating).toBe("active");
    expect(autoBurst).toBeCloseTo(baseBurst, 6);
    expect(autoscaled.tsAutoscale?.engaged ?? false).toBe(false);
  });
});
