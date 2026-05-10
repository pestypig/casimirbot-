import { describe, expect, it } from "vitest";

import {
  evaluateErEprSimulation,
  type ErEprSimulationInput,
} from "../shared/er-epr-simulation";

const passingInput: ErEprSimulationInput = {
  modelFamily: "two_sided_SYK",
  nQubitsOrModes: 12,
  temperatureRegime: "low",
  initialState: "thermofield_double",
  coupling: "double_trace_correct_sign",
  probeInsertionTime: -4,
  measurementWindow: 8,
  entropyStretch: { deltaS_nats: 0 },
  observables: {
    mutualInformation: 1.8,
    entanglementEntropy_nats: 3.2,
    teleportationFidelity: 0.86,
    causalOrderingScore: 0.84,
    timeDelayScore: 0.82,
    operatorSizeWindingScore: 0.85,
    scramblingScore: 0.83,
    thermalizationScore: 0.84,
    entropyAreaProxyTrackingScore: 0.86,
    ordinaryTeleportationControlScore: 0.12,
    shuffledHamiltonianControlScore: 0.18,
    disentangledControlScore: 0.1,
    wrongSignCouplingControlScore: 0.14,
  },
};

describe("ER=EPR Stage 1 simulation verdict lane", () => {
  it("allows strong model-internal support only inside a controlled holographic model", () => {
    const evaluation = evaluateErEprSimulation(passingInput);

    expect(evaluation.evidence.verdict).toBe("dual_model_support_strong");
    expect(evaluation.gates.canClaimModelInternalSupport).toBe(true);
    expect(evaluation.guards.spacetimeCL).toBe("proxy_only");
    expect(evaluation.guards.mayPromoteToCL4).toBe(false);
    expect(evaluation.guards.overclaimWarnings).toContain("not_real_universe_er_bridge_proof");
    expect(evaluation.qst.congruenceGate.spacetimeCL).toBe("proxy_only");
    expect(evaluation.qst.congruenceGate.mayPromoteToCL4).toBe(false);
  });

  it("fails when ordinary controls also carry the signal", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      observables: {
        ...passingInput.observables,
        shuffledHamiltonianControlScore: 0.71,
      },
    });

    expect(evaluation.evidence.verdict).toBe("ordinary_control_explains_signal");
    expect(evaluation.gates.ordinaryControlsFail).toBe(false);
    expect(evaluation.gates.canClaimModelInternalSupport).toBe(false);
  });

  it("blocks attempts to promote a simulated ER=EPR result into CL evidence", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      requestedSpacetimeCL: "CL4",
    });

    expect(evaluation.evidence.verdict).toBe("overclaim_blocked");
    expect(evaluation.guards.blockedClaims).toContain("er_epr_sim_to_spacetime_CL_promotion");
    expect(evaluation.guards.spacetimeCL).toBe("proxy_only");
    expect(evaluation.qst.guards.blockedCausalLinks).toContain("qst_proxy_to_spacetime_CL_promotion");
  });

  it("blocks StarSim astrometry when it is treated as direct ER=EPR evidence", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      starSim: {
        role: "direct_er_epr_evidence",
        clusteringEntropy_nats: 4,
        localDensityContrast: 1.2,
        velocityDispersion_km_s: 32,
      },
    });

    expect(evaluation.evidence.verdict).toBe("overclaim_blocked");
    expect(evaluation.guards.blockedClaims).toContain("astrometric_prior_as_direct_er_epr_evidence");
    expect(evaluation.guards.overclaimWarnings).toContain("starsim_is_structure_prior_only");
  });

  it("keeps StarSim as a proxy-only structure prior for non-holographic controls", () => {
    const evaluation = evaluateErEprSimulation({
      ...passingInput,
      modelFamily: "random_matrix_control",
      initialState: "random_control",
      coupling: "none",
      starSim: {
        role: "cosmological_structure_prior",
        clusteringEntropy_nats: 3,
      },
    });

    expect(evaluation.evidence.verdict).toBe("proxy_only_structure_prior");
    expect(evaluation.gates.holographicModel).toBe(false);
    expect(evaluation.guards.blockedClaims).not.toContain("astrometric_prior_as_direct_er_epr_evidence");
    expect(evaluation.guards.overclaimWarnings).toContain("starsim_is_structure_prior_only");
  });

  it("uses entropy stretch to demote visible ER=EPR-like signatures", () => {
    const lowEntropy = evaluateErEprSimulation(passingInput);
    const highEntropy = evaluateErEprSimulation({
      ...passingInput,
      entropyStretch: { deltaS_nats: Math.log(100) },
    });

    expect(lowEntropy.values.entropyVisibility).toBeGreaterThan(highEntropy.values.entropyVisibility);
    expect(lowEntropy.values.visibilityAdjustedSignal).toBeGreaterThan(highEntropy.values.visibilityAdjustedSignal);
    expect(highEntropy.gates.entropyVisibilityPass).toBe(false);
    expect(highEntropy.evidence.verdict).toBe("ordinary_control_explains_signal");
  });
});
