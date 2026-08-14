import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";
import { NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING } from "../shared/contracts/nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-1s-v3-tolerance-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN as PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarCoherentCandidatePlan,
  nhm2SphericalBosonStarCoherentCandidatePlanViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const everyObjectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value))
    return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, seen),
    )
  );
};

describe("NHM2 spherical boson-star coherent candidate plan v1", () => {
  it("pins the complete preregistration bytes", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN,
    ).toBe("nhm2-spherical-boson-star-coherent-candidate-plan/v1\n");
    expect(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256).toBe(
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
    ).toBe(93214);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256);
    expect(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING).toEqual({
      artifactId: "nhm2.spherical_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_spherical_boson_star_coherent_candidate_plan/v1",
      candidateId:
        "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1",
      sha256Domain: "nhm2-spherical-boson-star-coherent-candidate-plan/v1\n",
      sha256:
        "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
      canonicalSizeBytes: 93214,
      mediaType: "application/json",
    });
  });

  it("is a new spherical 1s control, not a retune of the prolate observation", () => {
    expect(PLAN.candidateIdentity.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID,
    );
    expect(PLAN.candidateIdentity).toMatchObject({
      prolateCandidateInherited: false,
      prolateObservationUsedToChooseNumericValues: false,
      declaredLeverOrTileTensorUsed: false,
      retuningAfterObservationAllowed: false,
      fallbackBranchAfterObservationAllowed: false,
      failureDisposition: "fail_this_candidate_without_retuning",
    });
    expect(PLAN.candidateIdentity.lineage).toContain(
      "not_a_retune_fallback_or_branch_switch",
    );
    expect(PLAN.frozenBranchSelector.multipolarQuantumNumbers).toEqual({
      N: 1,
      ell: 0,
      m: 0,
    });
    expect(PLAN.frozenBranchSelector).toMatchObject({
      commonName: "lowest_nodeless_1s_spherical_branch",
      radialNodeCount: 0,
      parity: "even_under_every_spatial_inversion_and_reflection",
      symmetry: "static_spherically_symmetric",
      boundaryCondition: "asymptotically_flat",
      omegaOverMu: null,
    });
    expect(PLAN.frozenBranchSelector.scalarAnsatz).toBe(
      "Phi(t,r)=phi(r)*exp(-i*omega*t)",
    );
    expect(PLAN.frozenBranchSelector.geometryGauge.metricAnsatz).toContain(
      "F0(r)",
    );
    expect(PLAN.frozenBranchSelector.geometryGauge.metricAnsatz).toContain(
      "F1(r)",
    );
    expect(PLAN.frozenBranchSelector.geometryGauge.unknownFunctions).toEqual([
      "F0(r)",
      "F1(r)",
    ]);
    expect(PLAN.frozenBranchSelector.geometryGauge).toMatchObject({
      residualCoordinateTransformAllowed: false,
      postsolveRadialReparameterizationAllowed: false,
    });
    expect(PLAN.frozenBranchSelector.radialProfileRules).toMatchObject({
      nodelessForFiniteRadius: true,
      nonincreasingAwayFromOrigin: true,
      secondaryRadialExtremaAllowed: false,
      observedMonotonicityReceipt: null,
      monotonicityEstablished: false,
    });
    expect(PLAN.frozenBranchSelector.noFoldRules).toMatchObject({
      mustRemainOnVacuumConnectedFirstWeakFieldSegment: true,
      firstMassOrFrequencyTurningPointMayBeCrossed: false,
      branchReplacementAfterFoldAllowed: false,
      observedNoFoldReceipt: null,
      noFoldEstablished: false,
    });
  });

  it("freezes the scalar, state, renormalization, backreaction, chart and smearing", () => {
    expect(PLAN.matterModel).toMatchObject({
      field: "single_minimally_coupled_complex_scalar",
      curvatureCouplingXi: { exact: "0", value: 0 },
      selfCouplingLambda: { exact: "0", value: 0 },
      dimensionlessGravitationalCoupling: {
        expression: "8*pi*G*mu^2",
        exact: "2^-40",
        value: 2 ** -40,
      },
      coherentPeakAmplitude: {
        exact: "2^-10",
        value: 2 ** -10,
        heldFixedThroughoutBackreactionIteration: true,
        quantumOperatorAmplitudeSelectorAllowed: false,
      },
    });
    expect(PLAN.jointSemiclassicalState).toMatchObject({
      stateClass:
        "coherent_displacement_of_static_ground_state_hadamard_vacuum",
      groundStateTime: "asymptotic_static_Killing_time",
      vacuumPolarizationMayBeDroppedOrFit: false,
      coherentDisplacementPreservesHadamardSingularity: true,
      submittedLeverOrTileTensorAllowed: false,
    });
    expect(PLAN.renormalization).toMatchObject({
      scheme: "locally_covariant_Hadamard_point_splitting",
      hadamardLength: { expression: "ell=mu^-1", exact: "1/mu" },
      conservationRestoringCoefficient: null,
      producerSelectedFiniteCountertermsAllowed: false,
    });
    expect(PLAN.selfConsistency).toMatchObject({
      classicalGeometryOnlyAllowed: false,
      relativeLInfConvergenceTarget: { exact: "10^-3", value: 1e-3 },
      converged: null,
      residualRelativeLInf: null,
      branchReplacementAfterFailureAllowed: false,
    });
    const sampling = PLAN.chartTetradSamplingAndSmearing;
    expect(sampling.sampleCount).toBe(64);
    expect(sampling.axisCoordinates.map((entry) => entry.exact)).toEqual([
      "-3/8",
      "-1/8",
      "1/8",
      "3/8",
    ]);
    expect(sampling.centers).toHaveLength(64);
    expect(sampling.centers[0]).toEqual({
      ordinal: 0,
      muTimesCoordinate: {
        x: { exact: "-3/8", value: -3 / 8 },
        y: { exact: "-3/8", value: -3 / 8 },
        z: { exact: "-3/8", value: -3 / 8 },
      },
    });
    expect(sampling.centers[63].ordinal).toBe(63);
    expect(sampling.smearing.dimensionlessHalfWidths).toEqual({
      muDeltaT: { exact: "1/64", value: 1 / 64 },
      muDeltaX: { exact: "1/64", value: 1 / 64 },
      muDeltaY: { exact: "1/64", value: 1 / 64 },
      muDeltaZ: { exact: "1/64", value: 1 / 64 },
    });
  });

  it("binds the candidate-specific tolerances and leaves nondegeneracy unresolved", () => {
    expect(PLAN.tolerancePolicy.binding).toBe(
      NHM2_SPHERICAL_BOSON_STAR_1S_V3_TOLERANCE_POLICY_BINDING,
    );
    expect(PLAN.tolerancePolicy.literalSha256Pin).toBe(
      "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d",
    );
    expect(PLAN.tolerancePolicy.presealReceipt).toBeNull();
    expect(PLAN.tolerancePolicy.presealed).toBe(false);
    expect(PLAN.nondegeneracyPresealGate).toEqual({
      source: "tolerancePolicy.policy.nondegeneracyPresealGate",
      requiredBeforeScientificPreseal: true,
      metricDemandLowerBoundReceipt: null,
      established: false,
      candidateSelectionOrSphericalSymmetryIsProof: false,
      failureDisposition: "fail_candidate_without_retuning",
      scientificCandidateAdmissible: false,
    });
  });

  it("freezes all uncompressed v3 arrays, constraints, inputs and exact pins", () => {
    expect(PLAN.governedOutputPlan.outputRoleOrder).toBe(
      NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
    );
    expect(PLAN.governedOutputPlan).toMatchObject({
      valuesPresent: false,
      noCompression: true,
      noReducedBasisSubstitution: true,
      everyOutputRoleMustBeMaterializedAsRawFloat64Array: true,
      outputArrayCount: 68,
      decodedFloat64ArrayCount: 70,
      solverSciencePayloadFileCount: 71,
    });
    expect(PLAN.governedOutputPlan.connectedNoiseKernel).toEqual({
      shape: [64, 64, 100],
      unit: "(J/m^3)^2",
      value: null,
      rawFullArrayRequired: true,
      lowRankFactorOrMomentSummarySufficient: false,
    });
    const schema = PLAN.totalConstraintDuty.constraintOperandSchema;
    expect(schema.outputRoles).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
    );
    expect(schema).toMatchObject({
      operandArraysPerLevel: 21,
      operandArrayCount: 63,
      operandArraySizeBytes: 2048,
      noCompression: true,
      noAggregateResidualSubstitution: true,
      everyPrimitiveComputedTargetReverseAndNestedTermRequired: true,
      runtimeManifest: null,
      structurallyAdmissible: false,
    });
    expect(PLAN.totalConstraintDuty.regulator.levels).toHaveLength(3);
    expect(
      PLAN.totalConstraintDuty.regulator.levels.map((x) => x.hExact),
    ).toEqual(["1/16", "1/32", "1/64"]);

    expect(PLAN.inputClosureTopology.scientific.roles).toBe(
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.implementation.roles).toBe(
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.completeRun.roles).toBe(
      NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
    );
    expect(PLAN.inputClosureTopology.scientific.roleCount).toBe(25);
    expect(PLAN.inputClosureTopology.implementation.roleCount).toBe(3);
    expect(PLAN.inputClosureTopology.completeRun.roleCount).toBe(28);
    expect(PLAN.v3Bindings.replayEpoch.binding).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
    );
    expect(PLAN.v3Bindings.constraintArithmetic.binding).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    );
    expect(PLAN.v3Bindings.pairNumericAgreement.binding).toBe(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
    );
    expect(PLAN.v3Bindings.bindingPins).toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING_PINS,
    );
    expect(PLAN.v3Bindings.bindingPins).toMatchObject({
      replayEpochPolicySha256:
        "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
      constraintArithmeticPolicySha256:
        "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
      pairNumericAgreementPolicySha256:
        "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    });
  });

  it("has no issuer, build, execution, evidence, lamp, or physical authority", () => {
    expect(PLAN.selectionFrozen).toBe(true);
    expect(PLAN.scientificCandidateAdmissible).toBe(false);
    expect(
      Object.values(PLAN.preregistrationLifecycle).every(
        (value) => value === null,
      ),
    ).toBe(true);
    expect(
      Object.values(PLAN.unresolvedEvidence).every((value) => value === null),
    ).toBe(true);
    expect(
      Object.values(PLAN.authorityBoundary).every((value) => value === false),
    ).toBe(true);
    expect(PLAN.claimLocks).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
    );
    expect(Object.values(PLAN.claimLocks).every((value) => !value)).toBe(true);
    expect(PLAN.blockers).toBe(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BLOCKERS,
    );
  });

  it("is recursively frozen and singleton-authoritative only as plan identity", () => {
    expect(everyObjectFrozen(PLAN)).toBe(true);
    expect(nhm2SphericalBosonStarCoherentCandidatePlanViolations(PLAN)).toEqual(
      [],
    );
    expect(isNhm2SphericalBosonStarCoherentCandidatePlan(PLAN)).toBe(true);
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(clone(PLAN)),
    ).toEqual(["spherical_candidate_plan_external_copy_not_authoritative"]);

    const retuned = clone(PLAN) as any;
    retuned.frozenBranchSelector.multipolarQuantumNumbers.ell = 1;
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(retuned),
    ).toEqual(["spherical_candidate_plan_semantic_mismatch"]);
    const inventedReceipt = clone(PLAN) as any;
    inventedReceipt.nondegeneracyPresealGate.established = true;
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(inventedReceipt),
    ).toEqual(["spherical_candidate_plan_semantic_mismatch"]);
    const unlocked = clone(PLAN) as any;
    unlocked.authorityBoundary.physicalViability = true;
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(unlocked),
    ).toEqual(["spherical_candidate_plan_semantic_mismatch"]);
  });

  it("rejects accessors, hidden and side keys, symbols, forbidden keys, sparse arrays, cycles and bad numbers", () => {
    let getterCalls = 0;
    const accessor = clone(PLAN) as any;
    Object.defineProperty(accessor.candidateIdentity, "candidateId", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANDIDATE_ID;
      },
    });
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(accessor)[0],
    ).toContain("object_property_surface");
    expect(getterCalls).toBe(0);

    const hidden = clone(PLAN) as any;
    Object.defineProperty(hidden, "side", { value: true, enumerable: false });
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(hidden)[0],
    ).toContain("object_property_surface");
    const side = clone(PLAN) as any;
    side.side = true;
    expect(nhm2SphericalBosonStarCoherentCandidatePlanViolations(side)).toEqual(
      ["spherical_candidate_plan_semantic_mismatch"],
    );
    const symbol = clone(PLAN) as any;
    symbol[Symbol("side")] = true;
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(symbol)[0],
    ).toContain("symbol_key");
    const forbidden = clone(PLAN) as any;
    Object.defineProperty(forbidden, "constructor", {
      value: "side",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(forbidden)[0],
    ).toContain("forbidden_key");
    const sparse = clone(PLAN) as any;
    delete sparse.governedOutputPlan.outputRoleOrder[0];
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(sparse)[0],
    ).toContain("array_surface");
    const cyclic = clone(PLAN) as any;
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(cyclic)[0],
    ).toContain("cyclic_value");
    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone(PLAN) as any;
      numeric.matterModel.coherentPeakAmplitude.value = invalid;
      expect(
        nhm2SphericalBosonStarCoherentCandidatePlanViolations(numeric)[0],
      ).toContain("invalid_number");
    }
    const throwingProxy = new Proxy(clone(PLAN), {
      ownKeys: () => {
        throw new Error("hostile");
      },
    });
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(throwingProxy),
    ).toEqual(["spherical_candidate_plan_plain_data_snapshot_invalid"]);
    const revoked = Proxy.revocable(clone(PLAN), {});
    revoked.revoke();
    expect(
      nhm2SphericalBosonStarCoherentCandidatePlanViolations(revoked.proxy),
    ).toEqual(["spherical_candidate_plan_plain_data_snapshot_invalid"]);
  });

  it("bounds hostile snapshot work", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_VALIDATOR_LIMITS,
    ).toEqual({
      maximumDepth: 32,
      maximumNodes: 8192,
      maximumArrayLength: 512,
      maximumObjectPropertyCount: 256,
      maximumStringUtf8Bytes: 8192,
    });
    const long = clone(PLAN) as any;
    long.authority = "x".repeat(8193);
    expect(nhm2SphericalBosonStarCoherentCandidatePlanViolations(long)).toEqual(
      ["string_byte_length_limit:/authority"],
    );
    const wide = clone(PLAN) as any;
    wide.side = Object.fromEntries(
      Array.from({ length: 257 }, (_, index) => [`k${index}`, index]),
    );
    expect(nhm2SphericalBosonStarCoherentCandidatePlanViolations(wide)).toEqual(
      ["object_property_count_limit:/side"],
    );
  });
});
