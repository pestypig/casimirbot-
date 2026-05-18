import { describe, expect, it } from "vitest";

import {
  PLANCK_LENGTH_M,
  QST_MAX_MATERIALIZED_LOG_LAMBDA,
  buildQuantumSpacetimeCongruence,
  evaluateQuantumSpacetimeCongruenceScore,
} from "../shared/quantum-spacetime-congruence";

describe("quantum spacetime congruence proxy lane", () => {
  it("derives entropy stretch visibility without treating hbar as physically changed", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: Math.log(8) },
    });

    expect(qst.entropyStretch.lambda).toBeCloseTo(8);
    expect(qst.entropyStretch.logLambda).toBeCloseTo(Math.log(8));
    expect(qst.entropyStretch.hbarEffectiveRatio).toBeCloseTo(1 / 8);
    expect(qst.entropyStretch.hbarEffectiveLogRatio).toBeCloseTo(-Math.log(8));
    expect(qst.entropyStretch.quantumVisibility).toBeCloseTo(1 / 8);
    expect(qst.entropyStretch.usesLogSpace).toBe(false);
    expect(qst.values.lambda).toBeCloseTo(8);
    expect(qst.guards.overclaimWarnings).toContain("not_metric_equivalence_lane");
    expect(qst.congruenceGate.spacetimeCL).toBe("proxy_only");
    expect(qst.congruenceGate.mayPromoteToCL4).toBe(false);
  });

  it("navigates QST proxy claims through representation-space boundaries", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: Math.log(2) },
    });

    expect(qst.representationNavigation.boundaryId).toBe("qst_proxy_to_adm_metric_boundary");
    expect(qst.representationNavigation.sourceCategory).toBe("quantum_spacetime_proxy_space");
    expect(qst.representationNavigation.targetCategory).toBe("adm_dimensional_metric_space");
    expect(qst.representationNavigation.targetInvariant).toBe("same_chart_tensor_equivalence");
    expect(qst.representationNavigation.blockedOverclaims).toContain("qst_proxy_as_metric_equivalence");
    expect(qst.guards.representationBoundaryId).toBe(qst.representationNavigation.boundaryId);
  });

  it("uses log-space entropy bookkeeping before lambda overflows", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: QST_MAX_MATERIALIZED_LOG_LAMBDA + 10 },
    });

    expect(qst.entropyStretch.deltaS_nats).toBeGreaterThan(0);
    expect(qst.entropyStretch.lambda).toBe(Number.MAX_VALUE);
    expect(Number.isFinite(qst.entropyStretch.lambda)).toBe(true);
    expect(qst.entropyStretch.logLambda).toBeCloseTo(QST_MAX_MATERIALIZED_LOG_LAMBDA + 10);
    expect(qst.entropyStretch.hbarEffectiveLogRatio).toBeCloseTo(-(QST_MAX_MATERIALIZED_LOG_LAMBDA + 10));
    expect(qst.entropyStretch.hbarEffectiveRatio).toBe(0);
    expect(qst.entropyStretch.quantumVisibility).toBe(0);
    expect(qst.entropyStretch.usesLogSpace).toBe(true);
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
    expect(qst.guards.overclaimWarnings).toContain("not_wormhole_inventory");
    expect(qst.holographicProxy.erDensityProxy).toBeGreaterThanOrEqual(0);
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

  it("monotonically demotes quantum-structure score as entropy stretch grows", () => {
    const baseInput = {
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 1e70,
        regionArea_m2: 1,
      },
      vacuumChannel: { mode: "static_casimir_stress" as const },
    };

    const score0 = evaluateQuantumSpacetimeCongruenceScore({
      ...baseInput,
      entropyStretch: { deltaS_nats: 0 },
    });
    const score1 = evaluateQuantumSpacetimeCongruenceScore({
      ...baseInput,
      entropyStretch: { deltaS_nats: 1 },
    });
    const score10 = evaluateQuantumSpacetimeCongruenceScore({
      ...baseInput,
      entropyStretch: { deltaS_nats: 10 },
    });

    expect(score0.C_QST).toBeGreaterThanOrEqual(score1.C_QST);
    expect(score1.C_QST).toBeGreaterThanOrEqual(score10.C_QST);
    expect(score0.P_entropy).toBeGreaterThanOrEqual(score1.P_entropy);
    expect(score1.P_entropy).toBeGreaterThanOrEqual(score10.P_entropy);
  });

  it("blocks Hubble-rate-only dynamic Casimir photon production", () => {
    const input = {
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
    } as const;
    const qst = buildQuantumSpacetimeCongruence(input);
    const score = evaluateQuantumSpacetimeCongruenceScore(input);

    expect(score.P_vacuum).toBe(0);
    expect(score.unsupportedCausalLinks).toContain("H0_to_local_virtual_photon_production_rate");
    expect(qst.guards.blockedCausalLinks).toContain("H0_to_local_virtual_photon_production_rate");
    expect(qst.guards.overclaimWarnings).toContain("unsupported_causal_link");
    expect(qst.guards.allowedVacuumChannels).not.toContain("dynamic_casimir_photon_creation");
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

  it("poisons downstream promotional attempts from unsupported Hubble-driven paths", () => {
    const qst = buildQuantumSpacetimeCongruence({
      entropyStretch: { deltaS_nats: 0 },
      vacuumChannel: {
        mode: "dynamic_casimir_photon_creation",
        expansionFrequency_Hz: 2.18e-18,
      },
      congruenceGate: {
        spacetimeCL: "CL4",
        quantumCL: "QCL2_vacuum_field_channel",
      },
    });

    expect(qst.congruenceGate.spacetimeCL).toBe("proxy_only");
    expect(qst.congruenceGate.mayPromoteToCL4).toBe(false);
    expect(qst.guards.blockedCausalLinks).toEqual(
      expect.arrayContaining([
        "H0_to_local_virtual_photon_production_rate",
        "qst_proxy_to_spacetime_CL_promotion",
      ]),
    );
    expect(qst.guards.overclaimWarnings).toContain("unsupported_causal_link");
  });

  it("requires explicit model evidence for curved-spacetime particle creation", () => {
    const missingModel = evaluateQuantumSpacetimeCongruenceScore({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 1e70,
        regionArea_m2: 1,
      },
      vacuumChannel: { mode: "curved_spacetime_particle_creation" },
    });
    const withModel = evaluateQuantumSpacetimeCongruenceScore({
      entropyStretch: { deltaS_nats: 0 },
      holographicProxy: {
        erEprEligible: true,
        entanglementEntropy_nats: 1e70,
        regionArea_m2: 1,
      },
      vacuumChannel: {
        mode: "curved_spacetime_particle_creation",
        modelEvidenceRef: "qft-curved-spacetime-model:v1",
      },
    });

    expect(missingModel.P_vacuum).toBe(0);
    expect(withModel.P_vacuum).toBe(1);
  });
});
