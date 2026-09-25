import { describe, expect, it } from "vitest";
import {
  idealSuccessfulPairsForUncertainty,
  matchingOutcomeProbability,
  responseCoefficients,
  terrestrialClockSignal,
} from "../shared/theory/ytterbium-clock-proposal-calculation";

describe("171Yb terrestrial clock proposal arithmetic", () => {
  it("reproduces both supplied table scales from the same constants", () => {
    const cm = terrestrialClockSignal(0.01);
    const ten = terrestrialClockSignal(10);
    const hundred = terrestrialClockSignal(100);
    expect(cm.frequencyDifferenceHz).toBeCloseTo(0.000565531747, 11);
    expect(cm.phaseRateRadS * 10).toBeCloseTo(0.03553340765, 9);
    expect(ten.potentialDifferenceM2S2).toBeCloseTo(98.0665, 8);
    expect(ten.fractionalRateDifference).toBeCloseTo(1.0911e-15, 19);
    expect(ten.frequencyDifferenceHz).toBeCloseTo(0.565531747, 8);
    expect(ten.secondsForHalfRadian).toBeCloseTo(0.140712651, 8);
    expect(hundred.potentialDifferenceM2S2).toBeCloseTo(980.665, 8);
    expect(hundred.frequencyDifferenceHz).toBeCloseTo(5.655317473, 8);
    expect(hundred.phaseRateRadS).toBeCloseTo(35.53340765, 7);
    expect(hundred.secondsForHalfRadian).toBeCloseTo(0.0140712651, 9);
    expect(hundred.frequencyDifferenceHz / ten.frequencyDifferenceHz).toBeCloseTo(10, 12);
  });

  it("keeps the expected control-pattern difference separate from a response difference", () => {
    const { kappa0, etaES } = responseCoefficients(1, 1);
    expect(kappa0).toBe(1);
    expect(etaES).toBe(0);
    const plus = matchingOutcomeProbability(0.5, 1, 1, Math.PI / 2);
    const minus = matchingOutcomeProbability(0.5, -1, 1, Math.PI / 2);
    expect(plus).toBeCloseTo(0.26028723, 7);
    expect(minus).toBeCloseTo(0.73971277, 7);
  });

  it("states the ideal successful-pair count without folding in efficiency", () => {
    expect(idealSuccessfulPairsForUncertainty(100, 1, 0.8, 1e-3)).toBe(1238);
    expect(idealSuccessfulPairsForUncertainty(100, 1, 0.8, 1e-4)).toBe(123751);
  });
});
