import { describe, expect, it } from "vitest";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
  isNhm2ProlateBosonStarCoherentCandidatePlanV1,
  nhm2ProlateBosonStarCoherentCandidatePlanViolations,
} from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v1";

const clone = (): Record<string, any> =>
  JSON.parse(
    JSON.stringify(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN),
  ) as Record<string, any>;

describe("NHM2 prolate boson-star coherent candidate preregistration", () => {
  it("freezes one exact plan but grants no candidate or claim authority", () => {
    const plan = NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.selectionFrozen).toBe(true);
    expect(plan.scientificCandidateAdmissible).toBe(false);
    expect(
      Object.values(plan.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(plan.unresolvedEvidence.candidateManifest).toBeNull();
    expect(plan.unresolvedEvidence.scientificPreseal).toBeNull();
    expect(plan.unresolvedEvidence.replayReceipt).toBeNull();
    expect(plan.unresolvedEvidence.independentPairReceipt).toBeNull();
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV1(plan)).toBe(true);
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV1(clone())).toBe(false);
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanViolations(clone()),
    ).toEqual(["candidate_plan_external_copy_not_authoritative"]);
  });

  it("fixes the weak-field 2p branch before observing an eigenfrequency", () => {
    const plan = NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
    expect(plan.frozenBranchSelector.multipolarQuantumNumbers).toEqual({
      N: 2,
      ell: 1,
      m: 0,
    });
    expect(plan.frozenBranchSelector.radialNodeCount).toBe(0);
    expect(plan.frozenBranchSelector.omegaOverMu).toBeNull();
    expect(plan.frozenBranchSelector.arbitraryLiteratureFrequencyAllowed).toBe(
      false,
    );
    expect(plan.matterModel.dimensionlessGravitationalCoupling.exact).toBe(
      "2^-40",
    );
    expect(plan.matterModel.coherentPeakAmplitude.exact).toBe("2^-10");
    expect(
      plan.matterModel.coherentPeakAmplitude
        .heldFixedThroughoutBackreactionIteration,
    ).toBe(true);
    expect(plan.matterModel.coherentPeakAmplitude.expression).toContain(
      "phi_c=<Phi>",
    );
  });

  it("fixes all 64 sample centers and narrow spacetime smears", () => {
    const sampling =
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.chartTetradSamplingAndSmearing;
    expect(sampling.centers).toHaveLength(64);
    expect(sampling.centers[0]).toMatchObject({
      ordinal: 0,
      muTimesCoordinate: {
        x: { exact: "-3/8" },
        y: { exact: "-3/8" },
        z: { exact: "-3/8" },
      },
    });
    expect(sampling.centers[63]).toMatchObject({
      ordinal: 63,
      muTimesCoordinate: {
        x: { exact: "3/8" },
        y: { exact: "3/8" },
        z: { exact: "3/8" },
      },
    });
    expect(sampling.smearing.dimensionlessHalfWidths.muDeltaT.exact).toBe(
      "1/64",
    );
    expect(sampling.everyTensorComponentMustBeNonzero).toBe(false);
    expect(sampling.coordinateGamingToPopulateStructuralZerosAllowed).toBe(
      false,
    );
    expect(sampling.tetrad.postsolveLorentzOrSpatialRotationAllowed).toBe(
      false,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.frozenBranchSelector
        .geometryGauge.residualCoordinateTransformAllowed,
    ).toBe(false);
  });

  it("requires vacuum polarization, connected noise, and total constraints", () => {
    const plan = NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
    expect(
      plan.jointSemiclassicalState.vacuumPolarizationMayBeDroppedOrFit,
    ).toBe(false);
    expect(plan.governedOutputPlan.connectedNoiseKernel.shape).toEqual([
      64, 64, 100,
    ]);
    expect(plan.totalConstraintDuty.matterOnlyWardIdentitySufficient).toBe(
      false,
    );
    expect(
      plan.totalConstraintDuty.fixedStateDuringGravityVariationAllowed,
    ).toBe(false);
    expect(plan.totalConstraintDuty.alternativesAfterFreezeAllowed).toBe(false);
    expect(
      plan.totalConstraintDuty.dimensionlessRescaling
        .rawConstraintArraysAreDimensionless,
    ).toBe(true);
    expect(
      plan.totalConstraintDuty.dimensionlessRescaling
        .mixingBarredAndUnbarredQuantitiesAllowed,
    ).toBe(false);
    expect(
      plan.totalConstraintDuty.canonicalPhaseSpace.gravityVariables,
    ).toEqual(["qbar_ab", "pibar^ab"]);
    expect(plan.totalConstraintDuty.spatialProbeDefinition.chi).toContain(
      "sqrt(det(qbar_star))*d3xbar",
    );
    expect(
      plan.totalConstraintDuty.spatialProbeDefinition
        .metricVariationThroughProbeNormalizationAllowed,
    ).toBe(false);
    expect(
      plan.totalConstraintDuty.spatialProbeDefinition.variationalTreatment,
    ).toContain(
      "held_fixed_during_every_inner_outer_forward_and_reverse_Poissonbar_variation",
    );
    expect(
      plan.totalConstraintDuty.canonicalIdentityDerivation
        .finiteProbeCoverageProvesTheFullFunctionalIdentity,
    ).toBe(false);
    expect(
      plan.totalConstraintDuty.canonicalIdentityDerivation.jacobi.term1,
    ).toContain("{Cbar[xi],{Cbar[eta],Cbar[zeta]}_total}_total");
    expect(plan.totalConstraintDuty.regulator.levels).toHaveLength(3);
    expect(
      plan.totalConstraintDuty.regulator.levels.map((level) => level.hExact),
    ).toEqual(["1/16", "1/32", "1/64"]);
    expect(plan.totalConstraintDuty.regulator.errorRoles).toEqual({
      level0: "E_0=2*d01",
      level1: "E_1=2*d12",
      level2: "E_2=d12",
    });
    expect(plan.totalConstraintDuty.regulator.derivatives).toContain(
      "Chebyshev_Lobatto",
    );
    expect(
      plan.totalConstraintDuty.regulator.quantumModeRegulator
        .scatteringBoundaryAndNormalization,
    ).toContain("unit_Klein_Gordon_flux");
    expect(
      plan.totalConstraintDuty.regulator.perLevelOperandReplay
        .serverMustRecomputeEveryFamilyResidualBeforeDifferencing,
    ).toBe(true);
    expect(
      plan.totalConstraintDuty.regulator.perLevelOperandReplay
        .currentProducerDerivedThreeArrayRegulatorRolesSufficient,
    ).toBe(false);
    expect(
      plan.totalConstraintDuty.regulator.perLevelOperandReplay
        .standaloneSchemaImplemented,
    ).toBe(true);
    expect(
      plan.totalConstraintDuty.regulator.perLevelOperandReplay
        .serverDecoderAndArithmeticReplayImplemented,
    ).toBe(false);
    expect(
      plan.totalConstraintDuty.regulator.levels.map(
        (level) => level.continuumMomentumPoints,
      ),
    ).toEqual([64, 128, 256]);
    expect(
      plan.totalConstraintDuty.normalization
        .computedTargetResidualOrUncertaintyDependent,
    ).toBe(false);
    expect(plan.totalConstraintDuty.tolerances).toMatchObject({
      bracketResidualUpper95: 0.1,
      antisymmetryResidualUpper95: 0.1,
      jacobiResidualUpper95: 0.1,
    });
  });

  it("preserves every fixed blocker", () => {
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.blockers).toEqual(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
    );
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.blockers).toContain(
      "self_consistent_semiclassical_backreaction_not_converged",
    );
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.blockers).toContain(
      "total_effective_action_constraint_algebra_not_computed",
    );
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.blockers).toContain(
      "constraint_regulator_operand_replay_not_integrated_into_v3_lane",
    );
    expect(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.blockers).toContain(
      "candidate_manifest_and_preseal_absent",
    );
  });

  it("records literature as motivation rather than candidate proof", () => {
    const references =
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN.primaryScientificReferences;
    expect(references.map((entry) => entry.locator)).toEqual([
      "arXiv:2008.10608",
      "arXiv:2601.05129",
      "arXiv:gr-qc/0010019",
    ]);
    expect(references[1].limitation).toContain("spherical_fixed_background");
    expect(references[1].limitation).toContain("future_work");
  });

  it.each([
    [
      "branch",
      (value: Record<string, any>) =>
        (value.frozenBranchSelector.multipolarQuantumNumbers.N = 3),
    ],
    [
      "amplitude",
      (value: Record<string, any>) =>
        (value.matterModel.coherentPeakAmplitude.value = 0.5),
    ],
    [
      "frequency",
      (value: Record<string, any>) =>
        (value.frozenBranchSelector.omegaOverMu = 0.9),
    ],
    [
      "sample",
      (value: Record<string, any>) =>
        (value.chartTetradSamplingAndSmearing.centers[0].ordinal = 1),
    ],
    [
      "retune",
      (value: Record<string, any>) =>
        (value.candidateIdentity.retuningAfterObservationAllowed = true),
    ],
    [
      "authority",
      (value: Record<string, any>) => (value.claimLocks.diagnosticPass = true),
    ],
    [
      "lever",
      (value: Record<string, any>) => (value.submittedLeverTensor = [1, 2, 3]),
    ],
  ])("rejects %s mutation", (_label, mutate) => {
    const value = clone();
    mutate(value);
    expect(nhm2ProlateBosonStarCoherentCandidatePlanViolations(value)).toEqual([
      "candidate_plan_semantic_mismatch",
    ]);
  });

  it("rejects hidden, symbolic, prototype, and cyclic surfaces", () => {
    const hidden = clone();
    Object.defineProperty(hidden, "outputDirectory", {
      value: "private-output",
      enumerable: false,
    });
    expect(nhm2ProlateBosonStarCoherentCandidatePlanViolations(hidden)[0]).toBe(
      "object_property_surface:/outputDirectory",
    );

    const symbolic = clone();
    Object.defineProperty(symbolic, Symbol("authority"), {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanViolations(symbolic)[0],
    ).toBe("symbol_key:/");

    const nullPrototype = Object.assign(Object.create(null), clone());
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanViolations(nullPrototype)[0],
    ).toBe("non_plain_object:/");

    const prototypeKey = clone();
    Object.defineProperty(prototypeKey, "__proto__", {
      value: { diagnosticPass: true },
      enumerable: true,
    });
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanViolations(prototypeKey)[0],
    ).toBe("forbidden_key:/__proto__");

    const cyclic = clone();
    cyclic.self = cyclic;
    expect(nhm2ProlateBosonStarCoherentCandidatePlanViolations(cyclic)[0]).toBe(
      "cyclic_value:/self",
    );
  });

  it("rejects accessors without invoking them", () => {
    const value = clone();
    let invocations = 0;
    Object.defineProperty(value, "authority", {
      get() {
        invocations += 1;
        return "preregistered_science_plan_only";
      },
      enumerable: true,
    });
    expect(nhm2ProlateBosonStarCoherentCandidatePlanViolations(value)[0]).toBe(
      "object_property_surface:/authority",
    );
    expect(invocations).toBe(0);
  });

  it("never grants authority to Proxy-wrapped or detached plan objects", () => {
    const nested = clone();
    const rawLocks = nested.claimLocks;
    nested.claimLocks = new Proxy(rawLocks, {
      get(target, key, receiver) {
        if (key === "diagnosticPass") return true;
        return Reflect.get(target, key, receiver);
      },
    });
    expect(nested.claimLocks.diagnosticPass).toBe(true);
    expect(nhm2ProlateBosonStarCoherentCandidatePlanViolations(nested)).toEqual(
      ["candidate_plan_external_copy_not_authoritative"],
    );
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV1(nested)).toBe(false);

    const topLevel = new Proxy(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
      {},
    );
    expect(
      nhm2ProlateBosonStarCoherentCandidatePlanViolations(topLevel),
    ).toEqual(["candidate_plan_external_copy_not_authoritative"]);
    expect(isNhm2ProlateBosonStarCoherentCandidatePlanV1(topLevel)).toBe(false);
  });
});
