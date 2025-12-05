import { describe, expect, it } from "vitest";
import { initQiAutoscaleState, stepQiAutoscale, type QiAutoscaleClampReason } from "../qi-autoscale.js";

describe("qi-autoscale step", () => {
  it("computes proposed scale from guard output", () => {
    const clamps: QiAutoscaleClampReason[] = [];
    const next = stepQiAutoscale({
      guard: { marginRatioRaw: 2.65, sumWindowDt: 1, rhoSource: "tile-telemetry" },
      enableFlag: true,
      target: 0.9,
      minScale: 0.02,
      slewPerS: 1,
      now: 1_000,
      prev: initQiAutoscaleState(0.9, 0),
      clamps,
    });

    expect(next.gating).toBe("active");
    expect(next.proposedScale).toBeCloseTo(0.3396, 4);
    expect(next.appliedScale).toBeCloseTo(0.3396, 4);
    expect(clamps.length).toBe(0);
  });

  it("slew-limits scale changes over successive ticks", () => {
    const prev = initQiAutoscaleState(0.9, 0);
    const clamps: QiAutoscaleClampReason[] = [];
    const next = stepQiAutoscale({
      guard: { marginRatioRaw: 2.65, sumWindowDt: 1, rhoSource: "tile-telemetry" },
      enableFlag: true,
      target: 0.9,
      minScale: 0.02,
      slewPerS: 0.25,
      now: 1_000,
      prev,
      clamps,
    });

    expect(next.appliedScale).toBeCloseTo(0.75, 2);
    expect(next.slewLimitedScale).toBeCloseTo(0.75, 2);
    expect(clamps.some((c) => c.kind === "slew_limit")).toBe(true);
  });

  it("marks no_effect when zeta does not fall after the observation window", () => {
    const first = stepQiAutoscale({
      guard: { marginRatioRaw: 29.05, sumWindowDt: 1, rhoSource: "tile-telemetry" },
      enableFlag: true,
      target: 0.9,
      minScale: 0.02,
      slewPerS: 0.5,
      now: 0,
      prev: initQiAutoscaleState(0.9, 0),
    });

    const stuck = stepQiAutoscale({
      guard: { marginRatioRaw: 29.05, sumWindowDt: 1, rhoSource: "tile-telemetry" },
      enableFlag: true,
      target: 0.9,
      minScale: 0.02,
      slewPerS: 0.5,
      now: 6_000,
      prev: first,
      noEffectSeconds: 5,
    });

    expect(stuck.gating).toBe("no_effect");
  });
});
