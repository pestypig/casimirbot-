import { describe, expect, it } from "vitest";

import {
  PLANCK_LENGTH_M,
  buildQuantumSpacetimeCongruence,
  evaluateQuantumSpacetimeCongruenceScore,
} from "../shared/quantum-spacetime-congruence";

describe("quantum spacetime congruence proxy lane", () => {
  it("derives entropy stretch visibility without treating hbar as physically changed", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: Math.log(8) },
    });

    expect(qst.entropyStretch.lambda).toBeCloseTo(8);
    expect(qst.entropyStretch.hbarEffectiveRatio).toBeCloseTo(1 / 8);
    expect(qst.entropyStretch.quantumVisibility).toBeCloseTo(1 / 8);
    expect(qst.congruenceGate.spacetimeCL).toBe("proxy_only");
    expect(qst.congruenceGate.mayPromoteToCL4).toBe(false);
  });

  it("keeps cosmological expansion ratios separate from entropy stretch", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: 0 },
      cosmology: { redshift: 9 },
    });

    expect(qst.entropyStretch.lambda).toBeCloseTo(1);
    expect(qst.cosmology.scaleFactorRatio).toBeCloseTo(10);
    expect(qst.cosmology.areaStretch).toBeCloseTo(100);
    expect(qst.cosmology.volumeStretch).toBeCloseTo(1000);
  });

  it("computes a holographic area proxy only as an ER-density proxy", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 2,
        regionArea_m2: 8,
      },
    });

    const expectedArea = 4 * PLANCK_LENGTH_M ** 2 * 2;
    expect(qst.holographicProxy.rtAreaProxy_m2).toBeCloseTo(expectedArea);
    expect(qst.holographicProxy.erDensityProxy).toBeCloseTo(expectedArea / 8);
    expect(qst.holographicProxy.caveat).toBe("not_a_wormhole_count");
  });

  it("defaults ER/EPR eligibility off and contributes no holographic score", () => {
    const score = evaluateQuantumSpacetimeCongruenceScore({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        entanglementEntropy_nats: 10,
        regionArea_m2: 1,
      },
      vacuumChannel: { mode: "static_casimir_stress" },
    });

    expect(score.P_holographic).toBe(0);
    expect(score.C_QST).toBe(0);
  });

  it("blocks Hubble-rate-only dynamic Casimir photon production", () => {
    const score = evaluateQuantumSpacetimeCongruenceScore({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 1e70,
        regionArea_m2: 1,
      },
      vacuumChannel: {
        mode: "dynamic_casimir_photon_creation",
        expansionFrequency_Hz: 2.18e-18,
      },
    });

    expect(score.P_vacuum).toBe(0);
    expect(score.unsupportedCausalLinks).toContain("H0_to_local_virtual_photon_production_rate");
  });

  it("allows dynamic Casimir claims only with an explicit local boundary drive", () => {
    const score = evaluateQuantumSpacetimeCongruenceScore({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 1e70,
        regionArea_m2: 1,
      },
      vacuumChannel: {
        mode: "dynamic_casimir_photon_creation",
        localDriveFrequency_Hz: 10e9,
      },
    });

    expect(score.P_vacuum).toBe(1);
    expect(score.unsupportedCausalLinks).not.toContain("H0_to_local_virtual_photon_production_rate");
  });
});
