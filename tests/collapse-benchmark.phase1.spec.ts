import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { C } from "@shared/physics-const";
import {
  collapseDeterministicUniform01,
  collapseTriggerDecision,
  hazardProbability,
  kappaPresentFromLength,
  presentLengthMeters,
} from "@shared/collapse-benchmark";

describe("collapse benchmark (Phase 1): core math + determinism", () => {
  it("computes hazard probability with correct limits", () => {
    expect(hazardProbability(0, 1000)).toBe(0);
    expect(hazardProbability(50, 1000)).toBeGreaterThan(0);
    expect(hazardProbability(50, 1000)).toBeLessThan(1);

    // tau -> 0+ implies p_trigger -> 1 for dt>0
    expect(hazardProbability(1, 1e-9)).toBe(1);

    // tau -> +inf implies p_trigger -> 0 for finite dt
    expect(hazardProbability(1, 1e12)).toBeGreaterThanOrEqual(0);
    expect(hazardProbability(1, 1e12)).toBeLessThan(1e-9);
  });

  it("computes L_present=min(r_c, c*tau) and kappa=1/L^2", () => {
    const tau_ms = 1_000;
    const r_c_m = 0.25;
    const L = presentLengthMeters(r_c_m, tau_ms, C);
    expect(L).toBeCloseTo(r_c_m, 12);
    expect(L).toBeLessThanOrEqual((C * tau_ms) / 1000);
    const kappa = kappaPresentFromLength(L);
    expect(kappa).toBeCloseTo(1 / (r_c_m * r_c_m), 12);
  });

  it("produces deterministic trigger decisions for same seed + step", () => {
    const seed = "deadbeef";
    const p_trigger = hazardProbability(50, 1_000);
    const a = collapseTriggerDecision(seed, 42, p_trigger);
    const b = collapseTriggerDecision(seed, 42, p_trigger);
    expect(a).toEqual(b);
    expect(a.u).toBeGreaterThanOrEqual(0);
    expect(a.u).toBeLessThan(1);
  });

  it("changes RNG output across stepIndex (replayable sequence)", () => {
    const seed = "deadbeef";
    const u0 = collapseDeterministicUniform01(seed, 0);
    const u1 = collapseDeterministicUniform01(seed, 1);
    expect(u0).not.toBe(u1);
  });

  it("maintains invariants over fuzzed parameter ranges", () => {
    fc.assert(
      fc.property(
        fc.record({
          dt_ms: fc.double({ min: 0, max: 10_000, noNaN: true, noDefaultInfinity: true }),
          tau_ms: fc.double({ min: 1e-9, max: 1e9, noNaN: true, noDefaultInfinity: true }),
          r_c_m: fc.double({ min: 1e-9, max: 1e9, noNaN: true, noDefaultInfinity: true }),
          c_mps: fc.double({ min: 1, max: 1e9, noNaN: true, noDefaultInfinity: true }),
          stepIndex: fc.integer({ min: 0, max: 10_000 }),
          seed: fc.hexaString({ minLength: 8, maxLength: 32 }),
        }),
        (params) => {
          const p = hazardProbability(params.dt_ms, params.tau_ms);
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);

          const L = presentLengthMeters(params.r_c_m, params.tau_ms, params.c_mps);
          expect(Number.isFinite(L)).toBe(true);
          expect(L).toBeGreaterThan(0);
          expect(L).toBeLessThanOrEqual(params.r_c_m + 1e-12);
          const L_lc_m = params.c_mps * (params.tau_ms / 1000);
          expect(L).toBeLessThanOrEqual(L_lc_m);

          const kappa = kappaPresentFromLength(L);
          expect(Number.isFinite(kappa)).toBe(true);
          expect(kappa).toBeGreaterThanOrEqual(0);

          const decision = collapseTriggerDecision(params.seed, params.stepIndex, p);
          expect(decision.step_index).toBe(params.stepIndex);
          expect(decision.u).toBeGreaterThanOrEqual(0);
          expect(decision.u).toBeLessThan(1);
          expect(decision.trigger).toBe(decision.u < p);
        },
      ),
      { numRuns: 200, seed: 1337 },
    );
  });
});
