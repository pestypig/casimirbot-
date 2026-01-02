import { describe, expect, it } from "vitest";
import {
  GEOM_TO_SI_STRESS,
  SI_TO_GEOM_STRESS,
  resolveStressScale,
  toGeometricTime,
  toSiTime,
} from "../shared/gr-units";
import { C } from "../shared/physics-const";

describe("gr units", () => {
  it("round-trips time conversions", () => {
    const seconds = 1.2345;
    const meters = toGeometricTime(seconds);
    expect(meters).toBeCloseTo(seconds * C, 8);
    expect(toSiTime(meters)).toBeCloseTo(seconds, 8);
  });

  it("resolves stress scaling for unit systems", () => {
    expect(resolveStressScale("geometric")).toBeCloseTo(1, 12);
    expect(resolveStressScale("SI")).toBeCloseTo(SI_TO_GEOM_STRESS, 12);
    expect(SI_TO_GEOM_STRESS * GEOM_TO_SI_STRESS).toBeCloseTo(1, 12);
  });
});
