import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-branch-bvp.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
} from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_SHA256,
  isNhm2ProlateBosonStarNewtonianSeedV1,
  nhm2ProlateBosonStarNewtonianSeedV1Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";
import {
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";

const SEED = NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1;
const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const everyObjectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, seen),
    )
  );
};

describe("NHM2 prolate boson-star Newtonian seed v1", () => {
  it("binds the exact candidate-v2 pins and domain-separated BVP digest singleton", () => {
    expect(SEED.bindings.candidatePlanV2).toMatchObject({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      authoritativeSingletonIdentityRequired: true,
    });
    expect(SEED.bindings.candidatePlanV2.bindingPins).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
    );
    expect(SEED.bindings.candidatePlanV2.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    );
    expect(SEED.bindings.candidatePlanV2.binding).toEqual({
      artifactId: "nhm2.prolate_boson_star_coherent_candidate_plan",
      contractVersion: "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
      candidateId:
        "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
      sha256Domain: "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
      sha256:
        "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
      canonicalSizeBytes: 134951,
    });
    expect(SEED.bindings.candidatePlanV2.candidateId).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2.candidateIdentity
        .candidateId,
    );
    expect(SEED.bindings.branchBvpV1.binding).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
    );
    expect(SEED.bindings.branchBvpV1.binding).toEqual({
      artifactId: "nhm2.prolate_boson_star_branch_bvp",
      contractVersion: "nhm2_prolate_boson_star_branch_bvp/v1",
      sha256Domain: "nhm2-prolate-boson-star-branch-bvp/v1\n",
      sha256:
        "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
      canonicalSizeBytes: 17355,
    });
    expect(SEED.bindings.branchBvpV1.requiredSeedKind).toBe(
      "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
    );
    expect(SEED.bindings.branchBvpV1.requiredRuntimeSeedSha256Domain).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
        .newtonianSeed.sha256Domain,
    );
  });

  it("freezes the exact two-dimensional dimensionless SP system and scale gauge", () => {
    expect(SEED.branchIdentity.quantumNumbers).toEqual({ N: 2, ell: 1, m: 0 });
    expect(SEED.branchIdentity.radialNodeCount).toBe(0);
    expect(SEED.continuumProblem.schrodingerEquation).toBe(
      "R_S:=-(1/2)*Delta_axi(u)+V*u-nu*u=0",
    );
    expect(SEED.continuumProblem.poissonEquation).toBe(
      "R_P:=Delta_axi(V)-u^2=0",
    );
    expect(SEED.nondimensionalization.definitions).toMatchObject({
      x: "mu*r",
      u: "sqrt(8*pi*G)*phi",
      nu: "((omega/mu)^2-1)/2",
    });
    expect(
      SEED.nondimensionalization.frozenCandidateCoupling
        .appearsInDimensionlessSeedPde,
    ).toBe(false);
    expect(SEED.scaleFixingAndContinuation.baseScaleGauge).toEqual({
      nu0Exact: "-1/2",
      nu0: -0.5,
      impliedW0: 0,
      mathematicalNonphysicalScaleRepresentative: true,
      frequencyAuthority: false,
    });
    expect(SEED.nondimensionalization.targetBoundStateConditions).toEqual([
      "nu_A<0",
      "1+2*nu_A>0",
      "0<wSeed_A<1",
    ]);
    expect(SEED.nondimensionalization.baseGaugeFrequencyBoundary).toEqual({
      nu0: -0.5,
      w0: 0,
      role: "mathematical_SP_scale_gauge_only",
      exemptFromTargetBoundStateConditions: true,
      suppliesRelativisticFrequencyAuthority: false,
    });
    expect(SEED.scaleFixingAndContinuation.exactScalingSymmetry).toMatchObject({
      scalar: "u_lambda(x,theta)=lambda^2*u0(lambda*x,theta)",
      potential: "V_lambda(x,theta)=lambda^2*V0(lambda*x,theta)",
      eigenvalue: "nu_lambda=lambda^2*nu0",
    });
    expect(SEED.scaleFixingAndContinuation.targetRule).toMatchObject({
      lambda: "sqrt(A_target/A0)",
      nu: "-lambda^2/2",
      wSeed: "sqrt(1-lambda^2)",
      frequencyIsInitializerNotRelativisticBranchSelector: true,
    });
  });

  it("fixes the 64x32, 96x48, 128x64 solve grids and 256x128 audit grid", () => {
    expect(SEED.domainAndDiscretization.levels).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    );
    expect(
      SEED.domainAndDiscretization.levels.map(
        ({ id, radialNodeCount, angularNodeCount }) => [
          id,
          radialNodeCount,
          angularNodeCount,
        ],
      ),
    ).toEqual([
      ["L0", 64, 32],
      ["L1", 96, 48],
      ["L2", 128, 64],
      ["AUDIT", 256, 128],
    ]);
    expect(SEED.domainAndDiscretization.mappedNodes).toMatchObject({
      rho: "rho_j=(1-cos(pi*j/(Nr-1)))/2",
      theta: "theta_k=(pi/4)*(1-cos(pi*k/(Ntheta-1)))",
      arrayLinearIndex: "j*Ntheta+k",
      nodeArraysMustBeBitwiseEqualToTheseValues: true,
      producerSuppliedOrPlatformLibmNodeValuesAllowed: false,
    });
    expect(SEED.domainAndDiscretization.auditGridRule).toContain(
      "must_not_be_solved_or_retuned",
    );
    expect(
      SEED.domainAndDiscretization.authoritativeInteriorReconstructionBasis,
    ).toContain("scalar_odd_or_potential_even_Legendre_modes");
    expect(SEED.deterministicSchedule.auditSolveAllowed).toBe(false);
    expect(SEED.authoritativeSeedContinuum).toMatchObject({
      id: "piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
      exactJoin: { xTail: 32, rhoTailExact: "32/33", rhoTail: 32 / 33 },
      raw_L2_values_for_x_greater_than_32_have_continuum_authority: false,
      alternateProducerChosenContinuumAllowed: false,
    });
    expect(SEED.authoritativeSeedContinuum.soleAuthorityFor).toEqual([
      "AUDIT_array_generation",
      "continuous_nodeless_proof",
      "continuous_peak_proof",
      "all_global_observables",
      "all_target_scaling",
      "relativistic_BVP_initialization",
    ]);
    expect(SEED.nodePhaseAndPeakConditions.discreteNodelessGate).toContain(
      "allow_other_positive_zero_only_for_certified_strictly_positive_tail_underflow",
    );
    expect(SEED.nodePhaseAndPeakConditions.discreteNodelessGate).toContain(
      "forbid_negative_and_negative_zero_everywhere",
    );
    expect(
      SEED.nodePhaseAndPeakConditions.discreteNodelessEligibleNodeCounts,
    ).toEqual({
      auditBaseScalarTotal: 32768,
      auditBasePrescribedBoundaryPositiveZero: 510,
      auditBaseEligibleNonBoundary: 32258,
      auditBaseAndSevenTargetsTotal: 262144,
      auditBaseAndSevenTargetsPrescribedBoundaryPositiveZero: 4080,
      auditBaseAndSevenTargetsEligibleNonBoundary: 258064,
      negativeOrNegativeZeroAllowedCount: 0,
      underflowPositiveZeroMayOverlapPrescribedBoundary: false,
    });
  });

  it("fixes the seven amplitude targets and never imports a literature omega", () => {
    expect(SEED.scaleFixingAndContinuation.amplitudes).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
    );
    expect(
      SEED.scaleFixingAndContinuation.amplitudes.map(({ exact }) => exact),
    ).toEqual(["2^-16", "2^-15", "2^-14", "2^-13", "2^-12", "2^-11", "2^-10"]);
    expect(SEED.scaleFixingAndContinuation.noLiteratureOmegaSubstitution).toBe(
      true,
    );
    expect(
      SEED.purposeAndAuthorityBoundary.relativisticBvpMustResolveFrequencyAgain,
    ).toBe(true);
  });

  it("freezes the exact weak-field map onto the imported BVP 16x12 initialization grid", () => {
    const map = SEED.relativisticBvpInitializationMap;
    expect(map.authority).toBe(
      "initial_guess_only_no_branch_or_equation_authority",
    );
    expect(map.perAmplitudeFieldMap).toEqual({
      varphi_init: "u_A",
      F0_init: "V_A",
      F1_init: "-V_A",
      F2_init: "-V_A",
      w_init: "sqrt(1-lambda^2)",
      rhoPeak_init:
        "selected_rho_coordinate_of_the_server_certified_unique_theta=0_global_peak_of_u_A_not_a_discrete_node_maximum",
    });
    expect(map.peakScalingIdentity).toEqual({
      xPeak_A: "xPeak_0/lambda",
      rhoPeak_A: "rhoPeak_0/(lambda+(1-lambda)*rhoPeak_0)",
      directContinuousPeakRecomputationRequired: true,
    });
    expect(map.bvpL0Destination).toMatchObject({
      radialNodeCount: 16,
      angularNodeCount: 12,
      evaluation:
        "evaluate_the_scaled_single_authoritative_piecewise_continuum_directly_at_BVP_L0_nodes",
      producerChosenIntermediateGridAllowed: false,
      AUDITGridMaySupplyInitializationValues: false,
    });
    expect(map.bvpL0Destination.rhoNodes).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.mappedNodes
        .rho,
    );
    expect(map.bvpL0Destination.thetaNodes).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.mappedNodes
        .theta,
    );
    expect(map.bvpConsumptionRule).toEqual({
      seedInitializedAmplitudeExact: "2^-16",
      laterAmplitudeRule:
        "each_later_BVP_amplitude_uses_only_the_immediately_preceding_accepted_relativistic_solution",
      seedMayReplaceLaterRelativisticContinuation: false,
    });
    expect(map.relativisticFrequencyMustBeSolvedAgain).toBe(true);
    expect(map.satisfiesRelativisticEquationsByConstruction).toBe(false);
    expect(map.establishesRelativisticBranchIdentity).toBe(false);
    expect(map.establishesRelativisticResidualOrConvergence).toBe(false);
  });

  it("fixes boundary row precedence, Y10 axis regularity, and a non-authoritative origin reference series", () => {
    expect(SEED.boundaryAndRegularityConditions).toMatchObject({
      originRho0: ["u=0", "partial_rho(V)=0"],
      infinityRho1: ["u=0", "V=0"],
      northAxisTheta0: ["partial_theta(u)=0", "partial_theta(V)=0"],
      equatorThetaPiOver2: ["u=0", "partial_theta(V)=0"],
    });
    expect(
      SEED.boundaryAndRegularityConditions.rowMap.radialBoundaryPrecedence,
    ).toContain("replace_angular_rows_at_all_four_corners");
    expect(
      SEED.boundaryAndRegularityConditions.rowMap.rowAveragingOrFallbackAllowed,
    ).toBe(false);
    expect(
      SEED.boundaryAndRegularityConditions.fullDomainParity.y10AxisConsequence,
    ).toBe("partial_theta(u)=0_at_theta=0");
    expect(
      SEED.boundaryAndRegularityConditions.continuumReferenceSeries.scalar,
    ).toContain("a1*x*P1");
    expect(
      SEED.boundaryAndRegularityConditions.continuumReferenceSeries.potential,
    ).toContain("(a1^2/60)*P0");
    expect(
      SEED.boundaryAndRegularityConditions.continuumReferenceSeries
        .forbiddenTerms,
    ).toContain("potential_x^2_P0");
    expect(
      SEED.boundaryAndRegularityConditions.continuumReferenceSeries.authority,
    ).toContain("not_exact_regularity_or_PDE_authority");
    const projection =
      SEED.boundaryAndRegularityConditions.postSolveDirichletProjection;
    expect(
      projection.acceptedL2ScalarAndPotentialSourceHashesUsePostProjectionBytes,
    ).toBe(true);
    expect(
      projection.serverReplaysAllResidualBoundaryParityScalingAndProofGatesAfterProjection,
    ).toBe(true);
    expect(
      projection.angularAxisAndEquatorNeumannParityIsExactByLegendreBasis,
    ).toBe(true);
    expect(projection.radialPotentialOriginNeumannProjectedOrClaimedExact).toBe(
      false,
    );
    expect(projection.exactFieldEntryCounts).toMatchObject({
      allLevelsScalarAcrossBaseAndSevenTargets: 8640,
      allLevelsPotentialAcrossBaseAndSevenTargets: 2176,
      allLevelsProjectedEntries: 10816,
      allLevelsMultipoleProjectedEntries: 408,
      scalarPerFieldFormula: "2*Ntheta+Nr-2",
      potentialPerFieldFormula: "Ntheta",
    });
    expect(
      projection.exactFieldEntryCounts.perLevel.map(
        ({ levelId, scalarPerField, allProjectedEntries }) => [
          levelId,
          scalarPerField,
          allProjectedEntries,
        ],
      ),
    ).toEqual([
      ["L0", 126, 1264],
      ["L1", 190, 1904],
      ["L2", 254, 2544],
      ["AUDIT", 510, 5104],
    ]);
    expect(SEED.boundaryAndRegularityConditions.infinitySeries.scalar).toBe(
      "u=exp(-kappa*x)*x^(C/kappa-1)*(a_infinity(theta)+O(1/x))",
    );
    expect(
      SEED.boundaryAndRegularityConditions.infinitySeries.coulombCoefficient,
    ).toBe("C=N/(4*pi)");
  });

  it("rejects a radial Y10-only truncation because nonlinear harmonic mixing is compulsory", () => {
    const duty = SEED.angularExpansionAndMultipoleDuty;
    expect(duty.scalarExpansion).toContain("u_(2k+1)");
    expect(duty.potentialExpansion).toContain("V_(2k)");
    expect(duty.auditScalarEllOrder).toBe("1,3,...,127");
    expect(duty.auditPotentialEllOrder).toBe("0,2,...,126");
    expect(duty.nonlinearClosure.scalarSquareDuty).toContain(
      "P0_and_P2_potential",
    );
    expect(duty.nonlinearClosure.potentialTimesScalarDuty).toContain(
      "higher_odd_scalar_multipoles",
    );
    expect(duty.nonlinearClosure.radialY10OnlyTruncationValid).toBe(false);
    expect(duty.prohibitedApproximation).toContain(
      "no_single_radial_Y10_scalar_truncation",
    );
  });

  it("requires a server-replayed continuous factored-field proof before using the nodeless artifact kind", () => {
    const proof = SEED.nodePhaseAndPeakConditions.continuousNodelessProof;
    expect(proof.requiredBeforeNodelessArtifactEmission).toBe(true);
    expect(proof.proofSubject).toBe(
      "piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
    );
    expect(proof.factoredField).toBe("g(rho,theta)=u(x,theta)/(x*cos(theta))");
    expect(proof.compactInteriorProof).toContain(
      "parity_Legendre_interval_enclosures",
    );
    expect(proof.tailProof).toContain("a_infinity(theta)/cos(theta)>0");
    expect(proof.tailProof).toContain("error_bounds_are_strictly_dominated");
    expect(proof.rhoTailSelection).toContain("rhoTail=32/33");
    expect(proof.rhoTailExact).toBe("32/33");
    expect(proof.intervalReplayPolicy).toEqual({
      arithmetic: "MPFR_binary256_with_directed_outward_rounding",
      binary64ArrayValuesEnclosedByExactBitPattern: true,
      analyticRemovalOfOriginAndEquatorFactorsRequired: true,
      strictAcceptanceRule: "lower_bound_of_g_is_strictly_greater_than_zero",
      maximumAdaptiveBoxes: 262144,
      maximumSubdivisionDepthPerCoordinate: 24,
      retryWithMorePrecisionOrBoxesAllowed: false,
    });
    expect(proof.producerProofReceiptHasAuthority).toBe(false);
    expect(proof.targetPropagation).toContain(
      "transport_the_base_proof_to_all_seven_scaled_targets",
    );
    expect(proof.serverReplayRequired).toBe(true);
    expect(proof.proofReceipt).toBeNull();
    expect(proof.established).toBe(false);
    expect(SEED.serverRecomputedGates.hardDiscreteConditions).toContain(
      "server_replayed_continuous_factored_field_nodeless_proof_passed",
    );
    expect(SEED.executionState.continuousNodelessProofReceipt).toBeNull();
    expect(SEED.executionState.continuousNodelessProofEstablished).toBe(false);
    expect(SEED.blockers).toContain(
      "continuous_nodeless_interval_proof_absent",
    );
  });

  it("blocks amplitude scaling on a null server-replayed continuous peak certificate", () => {
    const proof = SEED.nodePhaseAndPeakConditions.continuousPeakProof;
    expect(proof.requiredBeforeAmplitudeScalingOrArtifactEmission).toBe(true);
    expect(proof.stationaryIsolation).toContain(
      "only_on_the_closed_physical-derivative_middle",
    );
    expect(proof.boundaryInventory).toEqual([
      "origin_value_cover_s_in_[0,2^-12]",
      "physical_middle_theta=0_regular_axis",
      "physical_middle_theta=pi/2",
      "C1_join_value_cover_s_in_[1-2^-12,1]",
      "both_closed-cover_shared_faces_s=2^-12_and_s=1-2^-12_with_consistent_adjoining_value_enclosures",
      "exterior_x>=32_including_infinity_by_the_scaled_D_tail_proof",
    ]);
    expect(proof.uniquenessRule).toContain(
      "2_by_2_meridional_H_xx*H_TT-H_xT^2",
    );
    expect(proof.axisHessianRule).toContain(
      "H_TT=partial_x(u)/x+partial_theta_theta(u)/x^2",
    );
    expect(proof.globalDominanceRule).toContain(
      "strictly_exceed_the_value_upper_bound_of_every_other",
    );
    expect(proof.enclosureOutputs).toEqual([
      "A0_interval",
      "rhoPeak0_interval",
      "thetaPeak0_exact_[0,0]",
      "xPeak0_interval",
    ]);
    expect(proof.axisPeakRequired).toBe(true);
    expect(proof.offAxisMaximumBlocksArtifactAndBvpInitialization).toBe(true);
    expect(proof.maximumA0IntervalWidth).toBe(2 ** -40);
    expect(proof.maximumRhoPeakIntervalWidth).toBe(2 ** -40);
    expect(proof.metadataSelection).toEqual({
      A0: "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_A0_interval",
      rhoPeak0:
        "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_rhoPeak0_interval",
      xPeak0:
        "unique_RN_even_binary64_result_of_MPFR256(rhoPeak0/(1-rhoPeak0))_which_must_lie_in_the_xPeak0_interval",
      producerSelectionInsideAnIntervalAllowed: false,
    });
    expect(proof.intervalReplayPolicy).toEqual({
      arithmetic: "MPFR_binary256_with_directed_outward_rounding",
      maximumAdaptiveBoxes: 262144,
      maximumRadialSubdivisionDepth: 52,
      maximumAngularSubdivisionDepth: 56,
      maximumTreeDepth: 108,
      childConstruction: "exact_dyadic_midpoint_only",
      contractedIntervalNewtonOrKrawczykBoxAcceptedAsARecord: false,
      originCutoffExact: "2^-12",
      joinCutoffExact: "1-2^-12",
      cutoffWidenRetuneOrShiftAllowed: false,
      exactRegionRecordCountsAndTreeDepthRegionOrderRequired: true,
      unresolvedStationaryOrDominanceBoxPasses: false,
      retryWithRetunedPrecisionOrBudgetAllowed: false,
    });
    expect(proof.producerPeakSummaryHasAuthority).toBe(false);
    expect(proof.serverReplayRequired).toBe(true);
    expect(proof.proofReceipt).toBeNull();
    expect(proof.established).toBe(false);
    expect(SEED.executionState.continuousPeakProofReceipt).toBeNull();
    expect(SEED.executionState.continuousPeakProofEstablished).toBe(false);
    expect(SEED.blockers).toContain("continuous_peak_interval_proof_absent");
    expect(SEED.serverRecomputedGates.hardDiscreteConditions).toContain(
      "server_replayed_continuous_peak_existence_uniqueness_and_global_dominance_proof_passed",
    );
    expect(
      SEED.relativisticBvpInitializationMap.peakReceiptCrossBinding,
    ).toEqual({
      baseThetaPeakRequiredExact: "[0,0]",
      baseRhoPeakMustEqualSelectedReceiptMidpoint: true,
      baseXPeakMustEqualDirectedRhoImageSelection: true,
      scaledRhoPeakMustUseTheSameCertifiedAxisCandidate: true,
      bvpNormalizationPoint:
        "varphi(rhoPeak_init,theta=0)=A_with_partial_rho_varphi=0",
      offAxisReceiptAccepted: false,
    });
  });

  it("blocks emission on a null numerical origin-series defect receipt without claiming exact regularity", () => {
    const proof =
      SEED.nodePhaseAndPeakConditions.numericalOriginSeriesDefectGate;
    expect(proof.requiredBeforeArtifactEmission).toBe(true);
    expect(proof.replayProtocolBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    );
    expect(proof.proofKernelBinding).toBeNull();
    expect(proof.metadataBindings).toEqual(["a1", "Vc"]);
    expect(
      proof.metadataSelection.producerSelectionInsideAnIntervalAllowed,
    ).toBe(false);
    expect(proof.producerOriginSummaryHasAuthority).toBe(false);
    expect(proof.proofReceipt).toBeNull();
    expect(proof.passed).toBe(false);
    expect(proof.establishesExactRegularityOrPdeSeriesEquality).toBe(false);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL
        .originSeriesDefectReplay
        .exhaustiveReferenceCoefficientInventoryThroughX4,
    ).toContain(
      "potential_x2_free_ell2_target_with_ell0_and_ell_ge_4_forbidden",
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL
        .originSeriesDefectReplay
        .exhaustiveReferenceCoefficientInventoryThroughX4,
    ).toContain(
      "potential_x4_ell0_and_ell2_identities_free_ell4_target_with_ell_ge_6_and_all_other_multipoles_forbidden",
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL
        .originSeriesDefectReplay.establishesExactRegularityOrPdeSeriesEquality,
    ).toBe(false);
    const defectProtocol =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL.originSeriesDefectReplay;
    expect(defectProtocol.defectDefinitions.scalarX3P1IdentityDefect).toBe(
      "abs(U_3,1-(Vc-nu0)*a1/5)/(1+abs(U_3,1)+abs((Vc-nu0)*a1/5))",
    );
    expect(defectProtocol.defectDefinitions.scalarX2AllMultipoleDefect).toBe(
      "sup_theta_abs(U_2(theta))",
    );
    expect(
      defectProtocol.zeroTargetDefectsUseAbsoluteDimensionlessCoefficientOrSupremum,
    ).toBe(true);
    expect(
      defectProtocol.nonzeroIdentityDefectsUseOnePlusSumAbsoluteTermsDenominator,
    ).toBe(true);
    expect(defectProtocol.receiptIntervalBindings).toMatchObject({
      a1Interval:
        "the_exact_outward_MPFR256_interval_evaluation_of_partial_x(u_L2)(0,0)",
      a3Interval:
        "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_U_3,3",
      b2Interval:
        "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_V_2,2",
      b4Interval:
        "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_V_4,4",
      producerChosenOrPostHocRetunedIntervalAllowed: false,
    });
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL
        .removableFactorEvaluation.origin,
    ).toContain("partial_x(u)(0,theta)/cos(theta)");
    expect(SEED.executionState.numericalOriginSeriesDefectReceipt).toBeNull();
    expect(SEED.executionState.numericalOriginSeriesDefectGatePassed).toBe(
      false,
    );
    expect(SEED.blockers).toContain(
      "numerical_origin_series_defect_gate_absent",
    );
  });

  it("makes all PDE, convergence, virial, Poisson, flux, tail, and scaling gates server-recomputed", () => {
    const gates = SEED.serverRecomputedGates;
    expect(gates.producerResidualOrObservableArraysHaveAuthority).toBe(false);
    expect(gates.thresholds).toEqual({
      productionSchrodingerNormalizedLInfMaximum: 1e-10,
      productionPoissonNormalizedLInfMaximum: 1e-10,
      auditSchrodingerNormalizedLInfMaximum: 1e-10,
      auditPoissonNormalizedLInfMaximum: 1e-10,
      boundaryAndParityLInfMaximum: 1e-12,
      targetAmplitudeAbsoluteErrorMaximumExact: "2^-30",
      targetAmplitudeAbsoluteErrorMaximum: 2 ** -30,
      L1ToL2FieldRelativeLInfMaximum: 1e-8,
      minimumObservedDifferenceRatioD01OverD12: 4,
      L1ToL2InteriorObservableRelativeDifferenceMaximum: 1e-9,
      virialRelativeDefectMaximum: 1e-9,
      eigenvalueIdentityRelativeDefectMaximum: 1e-9,
      poissonEnergyRelativeDefectMaximum: 1e-9,
      gaussFluxRelativeDefectMaximum: 1e-9,
      radialSpectralTailRelativeMaximum: 1e-10,
      angularMultipoleTailRelativeMaximum: 1e-10,
      targetScalingRelativeLInfMaximum: 1e-12,
    });
    expect(SEED.observablesAndIdentities).toMatchObject({
      virialIdentity: "2*T+W=0",
      eigenvalueIdentity: "nu*N=T+2*W",
      poissonEnergyIdentity: "P_V+2*W=0",
      gaussIdentity: "N_flux=N",
    });
    expect(SEED.observablesAndIdentities.authorityScope).toContain(
      "deterministic_L2_piecewise_representative",
    );
    expect(SEED.observablesAndIdentities.authorityScope).toContain(
      "L0_L1_have_no_full_space_observable_authority",
    );
    expect(
      SEED.serverRecomputedGates.convergenceDefinitions.fieldDifference,
    ).toContain("normInf_on_0<=x<=32");
    expect(
      SEED.serverRecomputedGates.convergenceDefinitions
        .interiorObservableDifference,
    ).toContain("A32,N32,T32,W32");
    expect(gates.identityNormalizations.virial).toBe("abs(2*T+W)/(2*T+abs(W))");
    expect(gates.hardDiscreteConditions).toContain("all_gates_are_conjunctive");
  });

  it("defines exact array roles while containing no solver result or output", () => {
    expect(SEED.outputArtifactPolicy.outputRoles).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
    );
    expect(
      SEED.outputArtifactPolicy.outputRoles.map(({ role }) => role),
    ).toEqual([
      "newtonian_seed.grid.rho_nodes",
      "newtonian_seed.grid.theta_nodes",
      "newtonian_seed.base.scalar_u0",
      "newtonian_seed.base.potential_V0",
      "newtonian_seed.target.scalar_u_A",
      "newtonian_seed.target.potential_V_A",
      "newtonian_seed.multipole.scalar_odd",
      "newtonian_seed.multipole.potential_even",
    ]);
    expect(SEED.outputArtifactPolicy.sha256Domain).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
        .newtonianSeed.sha256Domain,
    );
    expect(SEED.outputArtifactPolicy.artifactKind).toBe(
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
        .newtonianSeed.requiredKind,
    );
    expect(SEED.solverImplemented).toBe(false);
    expect(SEED.executionAuthorized).toBe(false);
    expect(SEED.executionState).toMatchObject({
      executionPresent: false,
      solverImplementation: null,
      baseSolutions: null,
      targetSeedArrays: null,
      outputArtifact: null,
      outputArtifactSha256: null,
      structurallyAdmissible: false,
    });
  });

  it("closes an exact 32-array level-outer role-inner inventory and unambiguous hash framing", () => {
    const policy = SEED.outputArtifactPolicy;
    const inventory = policy.levelOuterRoleInnerInventory;
    expect(inventory).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
    );
    expect(policy.inventoryTotals).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS,
    );
    expect(inventory).toHaveLength(32);
    expect(policy.inventoryTotals).toEqual({
      arrayCount: 32,
      float64ElementCount: 810288,
      byteLength: 6482304,
    });
    expect(inventory.reduce((sum, entry) => sum + entry.elementCount, 0)).toBe(
      810288,
    );
    expect(inventory.reduce((sum, entry) => sum + entry.byteLength, 0)).toBe(
      6482304,
    );
    expect(
      new Set(inventory.map(({ relativePath }) => relativePath)).size,
    ).toBe(32);
    expect(inventory[0]).toEqual({
      inventoryIndex: 0,
      levelIndex: 0,
      roleIndex: 0,
      levelId: "L0",
      role: "newtonian_seed.grid.rho_nodes",
      relativePath: "arrays/L0/00-rho_nodes.f64le",
      dtype: "float64_le",
      order: "C_row_major",
      shape: [64],
      elementCount: 64,
      byteLength: 512,
    });
    expect(inventory[31]).toEqual({
      inventoryIndex: 31,
      levelIndex: 3,
      roleIndex: 7,
      levelId: "AUDIT",
      role: "newtonian_seed.multipole.potential_even",
      relativePath: "arrays/AUDIT/07-multipole_potential_even.f64le",
      dtype: "float64_le",
      order: "C_row_major",
      shape: [256, 64],
      elementCount: 16384,
      byteLength: 131072,
    });
    for (const [index, entry] of inventory.entries()) {
      expect(entry.inventoryIndex).toBe(index);
      expect(entry.levelIndex).toBe(Math.floor(index / 8));
      expect(entry.roleIndex).toBe(index % 8);
      expect(entry.byteLength).toBe(entry.elementCount * 8);
    }
    expect(policy.arrayHashRecipe).toContain(
      "u64be(path_utf8_byte_length)+path_utf8",
    );
    expect(policy.arrayHashRecipe).toContain(
      "u64be(array_byte_length)+raw_array_bytes",
    );
    expect(policy.artifactHashRecipe).toContain(
      "u64be(canonical_descriptor_utf8_byte_length)",
    );
    expect(policy.closedInventoryRule).toContain(
      "artifact_hash_closes_all_array_bytes",
    );
    expect(policy.exactRoleSourceMatrix).toMatchObject({
      target_scalar_u_A:
        "scaled_deterministic_L2_piecewise_continuum_directly_sampled_at_every_level",
      target_potential_V_A:
        "scaled_deterministic_L2_piecewise_continuum_directly_sampled_at_every_level",
      alternateRoleSourceAllowed: false,
    });
    expect(policy.perLevelArraySemantics.L0).toContain(
      "all_target_u_A_V_A_arrays_are_direct_RN_even_samples",
    );
    expect(policy.runtimeDescriptorSchemaBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    );
    expect(policy.proofReplayProtocolBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    );

    const closure = policy.containerClosure;
    expect(closure.requiredFilePathOrder).toHaveLength(33);
    expect(closure.requiredFilePathOrder[0]).toBe(
      "seed-descriptor.canonical.json",
    );
    expect(new Set(closure.requiredFilePathOrder).size).toBe(33);
    expect(closure.requiredExplicitDirectoryPathOrder).toEqual([
      "arrays",
      "arrays/L0",
      "arrays/L1",
      "arrays/L2",
      "arrays/AUDIT",
    ]);
    expect(closure).toMatchObject({
      extraFilesAllowed: false,
      extraDirectoriesAllowed: false,
      symlinksAllowed: false,
      reparsePointsAllowed: false,
      hardlinksAllowed: false,
      alternateDataStreamsAllowed: false,
      anyExtraMissingAliasOrSpecialEntryFailsClosed: true,
    });
    expect(closure.descriptorRawByteIdentityRule).toContain(
      "raw_bytes_must_equal_the_exact_RFC8785_canonical_UTF8_serialization_byte_for_byte",
    );
    expect(closure.differentlyFormattedEquivalentJsonAllowed).toBe(false);
    const admitsDescriptorBytes = (
      raw: Uint8Array,
      canonical: Uint8Array,
    ): boolean =>
      raw.byteLength === canonical.byteLength &&
      raw.every((byte, index) => byte === canonical[index]);
    const canonicalDescriptor = Buffer.from('{"a":1}', "utf8");
    expect(
      admitsDescriptorBytes(canonicalDescriptor, canonicalDescriptor),
    ).toBe(true);
    expect(
      admitsDescriptorBytes(
        Buffer.from('{ "a": 1 }\n', "utf8"),
        canonicalDescriptor,
      ),
    ).toBe(false);
    expect(
      admitsDescriptorBytes(
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), canonicalDescriptor]),
        canonicalDescriptor,
      ),
    ).toBe(false);

    const admitsPathSets = (
      files: readonly string[],
      dirs: readonly string[],
    ) =>
      files.length === closure.requiredFilePathOrder.length &&
      dirs.length === closure.requiredExplicitDirectoryPathOrder.length &&
      new Set(files).size === files.length &&
      new Set(dirs).size === dirs.length &&
      [...files].sort().join("\n") ===
        [...closure.requiredFilePathOrder].sort().join("\n") &&
      [...dirs].sort().join("\n") ===
        [...closure.requiredExplicitDirectoryPathOrder].sort().join("\n");
    expect(
      admitsPathSets(
        closure.requiredFilePathOrder,
        closure.requiredExplicitDirectoryPathOrder,
      ),
    ).toBe(true);
    expect(
      admitsPathSets(
        [...closure.requiredFilePathOrder, "extra.bin"],
        closure.requiredExplicitDirectoryPathOrder,
      ),
    ).toBe(false);
    expect(
      admitsPathSets(
        closure.requiredFilePathOrder.map((path, index) =>
          index === 1 ? path.toUpperCase() : path,
        ),
        closure.requiredExplicitDirectoryPathOrder,
      ),
    ).toBe(false);
  });

  it("binds a recursively closed runtime descriptor grammar with exact metadata and receipt shapes", () => {
    const schema =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA;
    expect(everyObjectFrozen(schema)).toBe(true);
    expect(schema.recursiveRules).toEqual({
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowedInJsonOrRawArrays: false,
      stringsRequireExactUtf8: true,
    });
    expect(schema.topLevel.extraKeysAllowed).toBe(false);
    expect(schema.topLevel.exactKeys).toEqual([
      "schemaVersion",
      "artifactKind",
      "seedContractBinding",
      "candidatePlanV2Binding",
      "branchBvpV1Binding",
      "levelOrder",
      "gridDefinitions",
      "amplitudeOrder",
      "scalarMetadata",
      "serverRecomputedGateReport",
      "continuousNodelessProofReceipt",
      "continuousPeakProofReceipt",
      "numericalOriginSeriesDefectReceipt",
      "arrayInventory",
      "arrayCount",
      "float64ElementCount",
      "arrayByteLength",
    ]);
    const fields = schema.topLevel.fields;
    expect(fields.scalarMetadata.extraKeysAllowed).toBe(false);
    expect(fields.scalarMetadata.exactKeys).not.toContain(
      "serverRecomputedGateReport",
    );
    expect(fields.scalarMetadata.fields.perTarget).toMatchObject({
      kind: "tuple",
      exactLength: 7,
      extraEntriesAllowed: false,
    });
    expect(fields.scalarMetadata.fields.perSolveInterior).toMatchObject({
      kind: "tuple",
      exactLength: 3,
      extraEntriesAllowed: false,
    });
    expect(fields.serverRecomputedGateReport.extraKeysAllowed).toBe(false);
    expect(
      fields.serverRecomputedGateReport.fields.interiorLevelGates.exactLength,
    ).toBe(3);
    expect(
      fields.serverRecomputedGateReport.fields.authoritativeGlobalIdentityGate
        .fields.subject.value,
    ).toBe("deterministic_L2_piecewise_representative_only");
    expect(
      fields.serverRecomputedGateReport.fields.targetGates.exactLength,
    ).toBe(7);
    expect(fields.continuousNodelessProofReceipt.extraKeysAllowed).toBe(false);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .leadingScalarCorrectionCoefficientIntervals.exactLength,
    ).toBe(64);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .tailScalarContinuationCoefficientIntervals.exactLength,
    ).toBe(1088);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .tailPotentialContinuationCoefficientIntervals.exactLength,
    ).toBe(1088);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .tailScalarRepresentativeCoefficients.exactLength,
    ).toBe(1088);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .tailPotentialRepresentativeCoefficients.exactLength,
    ).toBe(1088);
    expect(
      fields.continuousNodelessProofReceipt.fields
        .coulombConsistencyRelativeDefect.constraint,
    ).toBe("0<=value<=1e-12");
    expect(
      fields.continuousNodelessProofReceipt.fields
        .negativeOrNegativeZeroNodeCount,
    ).toEqual({ kind: "literal", value: 0 });
    expect(
      fields.continuousNodelessProofReceipt.fields
        .prescribedBoundaryPositiveZeroNodeCount,
    ).toEqual({ kind: "literal", value: 510 });
    expect(
      fields.continuousNodelessProofReceipt.fields.eligibleNonBoundaryNodeCount,
    ).toEqual({ kind: "literal", value: 32258 });
    expect(
      fields.continuousNodelessProofReceipt.fields.interiorNInterval.kind,
    ).toBe("object");
    expect(fields.continuousNodelessProofReceipt.invariants).toContain(
      "tailContractionUpper_equals_the_directed_outward_upper_bound_of_Zprime(tailRadius)_and_is_strictly_less_than_one",
    );
    expect(
      fields.continuousNodelessProofReceipt.fields.tailSchrodingerNormalizedLInf
        .constraint,
    ).toBe("0<=value<=1e-10");
    expect(fields.continuousPeakProofReceipt.extraKeysAllowed).toBe(false);
    expect(
      fields.continuousPeakProofReceipt.fields.thetaPeakInterval.fields,
    ).toEqual({
      lower: { kind: "literal", value: 0 },
      upper: { kind: "literal", value: 0 },
    });
    expect(
      fields.continuousPeakProofReceipt.fields
        .regularTransverseHessianEigenvalueUpper.constraint,
    ).toBe("value<0");
    expect(fields.continuousPeakProofReceipt.exactKeys).toContain(
      "sourceRepresentativeContinuumSha256",
    );
    expect(fields.numericalOriginSeriesDefectReceipt.extraKeysAllowed).toBe(
      false,
    );
    expect(fields.arrayInventory).toMatchObject({
      kind: "tuple",
      exactLength: 32,
      extraEntriesAllowed: false,
    });
    expect(fields.arrayInventory.itemSchema.extraKeysAllowed).toBe(false);
    expect(fields.arrayInventory.itemSchema.exactKeys).toContain("sha256");
    expect(fields.serverRecomputedGateReport.invariants).toContain(
      "if_D12=0_then_D01=0_and_differenceRatio=0_otherwise_differenceRatio=D01/D12_and_differenceRatio>=4",
    );
    expect(fields.serverRecomputedGateReport.invariants).toContain(
      "L1ToL2FieldRelativeLInf_is_bitwise_the_same_binary64_value_as_D12_and_is_derived_once_from_the_frozen_0<=x<=32_field_norm_then_L1ToL2FieldRelativeLInf<=1e-8",
    );
    expect(fields.serverRecomputedGateReport.exactKeys).toContain(
      "numericalOriginSeriesDefectPassed",
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING.sha256,
    ).toBe("deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING.canonicalSizeBytes,
    ).toBe(56194);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_SHA256,
    ).toBe("deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(56194);
  });

  it("freezes deterministic interval cover, factor removal, Coulomb tail, and peak replay", () => {
    const protocol =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL;
    expect(everyObjectFrozen(protocol)).toBe(true);
    expect(protocol.compactCover).toMatchObject({
      endpointEncoding: "reduced_dyadic_integer_numerator_and_power_of_two",
      splitDimension:
        "largest_normalized_width_with_s_before_eta_on_an_exact_tie",
      splitPoint: "exact_dyadic_midpoint",
      childOrder: "lower_child_then_upper_child",
      maximumAdaptiveBoxes: 262144,
      maximumSubdivisionDepthPerCoordinate: 24,
      unresolvedBoxPasses: false,
    });
    expect(protocol.interpolant.intervalExtension).toContain(
      "Legendre_Clenshaw",
    );
    expect(protocol.interpolant.exactAngularFactors).toContain(
      "exact_symbolic_cos(theta)_factor",
    );
    expect(
      protocol.removableFactorEvaluation
        .rawDivisionByIntervalsContainingZeroAllowed,
    ).toBe(false);
    expect(protocol.coulombTail.definitions).toEqual([
      "N_rep=RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_server_MPFR256_outward_integral_interval_for_the_single_deterministic_piecewise_representative",
      "C_rep=the_unique_RN_even_binary64_value_selected_by_the_frozen_Coulomb_consistency_isolation_and_enclosing_N_rep/(4*pi)",
      "kappa=sqrt(-2*nu)_with_kappa0=1_for_the_base_gauge",
      "p_rep=the_unique_RN_even_binary64_result_of_MPFR256(C_rep/kappa-1)_without_an_independent_producer_choice",
      "H_J(theta)=u_L2(32,theta)/(exp(-kappa*32)*32^p_rep*cos(theta))_with_axis_and_equator_regular_quotient_limits_and_H_sJ=partial_s_of_that_scaled_quotient_derived_from_exact_L2_u_and_partial_x_u",
      "H_rep(s,theta)=H_J(theta)+(s-1)*H_sJ(theta)+(1-s)^2*sum_(n=0..16,q=0..63)(cU_rep[n,q]*s^n*P_(2q)(cos(theta)))",
      "u_rep=exp(-kappa*x)*x^p_rep*cos(theta)*H_rep(32/x,theta)",
      "Q_J(theta)=32^3*(V_L2(32,theta)+C_rep/32)_and_Q_sJ=partial_s((V_L2+C_rep/x)*x^3)_at_s=1_from_exact_L2_V_and_partial_x_V",
      "Q_rep(s,theta)=Q_J(theta)+(s-1)*Q_sJ(theta)+(1-s)^2*sum_(n=0..16,q=0..63)(cV_rep[n,q]*s^n*P_(2q)(cos(theta)))",
      "V_rep=-C_rep/x+Q_rep(32/x,theta)/x^3",
      "H_u=u_rep/(exp(-kappa*x)*x^p_rep*cos(theta))",
      "D_tail=-partial_x(u_rep)/(exp(-kappa*x)*x^p_rep*cos(theta))",
    ]);
    expect(protocol.coulombTail.exactBoundaryLifting).toContain("(1-s)^2");
    expect(protocol.coulombTail.representativeAuthority).toContain(
      "only_exterior_values",
    );
    expect(
      protocol.coulombTail.deterministicCoulombSelector
        .producerChosenFixedPointOrRepresentativeAllowed,
    ).toBe(false);
    expect(
      protocol.coulombTail.deterministicCoulombSelector.admissibleSearchDomain,
    ).toEqual({
      exact: "[2^-32,2^16]",
      lower: 2 ** -32,
      upper: 2 ** 16,
      endpointsAreAdmissibleRoots: false,
    });
    expect(
      protocol.coulombTail.deterministicCoulombSelector
        .postRunBracketAdjustmentAllowed,
    ).toBe(false);
    expect(protocol.coulombTail.remainderEvaluation.scalar).toContain(
      "never_an_additive_or_selectable_function_value",
    );
    expect(protocol.coulombTail.radiiPolynomialSemantics.acceptance).toBe(
      "tailRadiiY+tailRadiiZ<=tailRadius_and_tailContractionUpper<1",
    );
    expect(protocol.coulombTail.matchConditions).toHaveLength(4);
    expect(protocol.coulombTail.positivityProof).toContain(
      "global_absolute_remainder_ratio_is_strictly_less_than_one",
    );
    expect(protocol.stationaryAndPeakReplay.dominance).toContain(
      "strictly_exceeds_every_other_compact_box_upper_bound",
    );
    expect(protocol.stationaryAndPeakReplay.closedRegionCover).toMatchObject({
      originCutoff: { exact: "2^-12", value: 2 ** -12 },
      joinCutoff: { exact: "1-2^-12", value: 1 - 2 ** -12 },
      cutoffRetuneWidenOrShiftAllowed: false,
      originValueCover: {
        exactDomain: "[0,2^-12]_s_times_[0,1]_eta",
        derivativeAuthority: false,
      },
      physicalDerivative: {
        exactDomain: "[2^-12,1-2^-12]_s_times_[0,1]_eta",
        derivativeAuthority: true,
      },
      c1JoinValueCover: {
        exactDomain: "[1-2^-12,1]_s_times_[0,1]_eta",
        derivativeAuthority: false,
      },
    });
    expect(
      protocol.stationaryAndPeakReplay.closedRegionCover.overlapAndGapRule,
    ).toContain("three-region_closed_cover_not_a_disjoint_closed_partition");
    expect(
      protocol.stationaryAndPeakReplay.closedRegionCover.queueAndDepthRule,
    ).toContain(
      "sDepth_is_at_most_52_etaDepth_is_at_most_56_treeDepth=sDepth+etaDepth_is_at_most_108",
    );
    expect(
      protocol.stationaryAndPeakReplay.closedRegionCover
        .contractedNewtonOrKrawczykBoxBecomesARecordAllowed,
    ).toBe(false);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING.sha256,
    ).toBe("c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING.canonicalSizeBytes,
    ).toBe(46365);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_SHA256,
    ).toBe("c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(46365);
    expect(
      SEED.nodePhaseAndPeakConditions.continuousNodelessProof
        .replayProtocolBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    );
    expect(
      SEED.nodePhaseAndPeakConditions.continuousPeakProof.proofKernelBinding,
    ).toBeNull();
  });

  it("freezes unique domain-separated length-delimited recipes for every derived proof hash", () => {
    const registry =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY;
    expect(everyObjectFrozen(registry)).toBe(true);
    expect(registry.entries.map(({ receiptField }) => receiptField)).toEqual([
      "coverTraceSha256",
      "coulombSelectorTraceSha256",
      "scalarBoundaryLiftSha256",
      "potentialBoundaryLiftSha256",
      "tailCoefficientInventorySha256",
      "representativeContinuumSha256",
      "exteriorRoundingTraceSha256",
      "derivativeMultipoleTraceSha256",
      "stationaryTraceSha256",
    ]);
    expect(new Set(registry.entries.map(({ domain }) => domain)).size).toBe(9);
    expect(
      registry.strictRecordSchemas.map(({ schemaId }) => schemaId),
    ).toEqual([
      "coverRecord/v1",
      "selectorRecord/v1",
      "liftDerivationRecord/v1",
      "roundingRecord/v1",
      "extractionRecord/v1",
      "stationaryRecord/v1",
    ]);
    const streamEncodings: string[] = [];
    for (const entry of registry.entries) {
      for (const [, encoding] of entry.orderedFields as readonly (readonly [
        string,
        string,
      ])[]) {
        if (encoding.startsWith("strictRecordStream:")) {
          streamEncodings.push(encoding);
        }
      }
    }
    expect(streamEncodings).toEqual([
      "strictRecordStream:coverRecord/v1",
      "strictRecordStream:selectorRecord/v1",
      "strictRecordStream:liftDerivationRecord/v1",
      "strictRecordStream:liftDerivationRecord/v1",
      "strictRecordStream:roundingRecord/v1",
      "strictRecordStream:extractionRecord/v1",
      "strictRecordStream:stationaryRecord/v1",
    ]);
    expect(
      registry.strictRecordSchemas.every(
        ({ exactKeys, fields, extraKeysAllowed, totalOrder }) =>
          extraKeysAllowed === false &&
          exactKeys.join("\n") === Object.keys(fields).join("\n") &&
          totalOrder.includes("contiguous_ordinal"),
      ),
    ).toBe(true);
    const liftSchema = registry.strictRecordSchemas.find(
      ({ schemaId }) => schemaId === "liftDerivationRecord/v1",
    );
    expect(liftSchema).toMatchObject({
      fields: {
        ordinal: { constraint: "value<32" },
        angularModeEll: { constraint: "even_value<=62" },
      },
    });
    const coverSchema = registry.strictRecordSchemas.find(
      ({ schemaId }) => schemaId === "coverRecord/v1",
    );
    expect(coverSchema).toMatchObject({
      exactKeys: [
        "ordinal",
        "treeDepth",
        "sDepth",
        "etaDepth",
        "sLower",
        "sUpper",
        "etaLower",
        "etaUpper",
        "disposition",
        "gInterval",
      ],
      fields: { treeDepth: { constraint: "value<=48" } },
      recordInvariants: expect.arrayContaining(["treeDepth=sDepth+etaDepth"]),
    });
    const roundingSchema = registry.strictRecordSchemas.find(
      ({ schemaId }) => schemaId === "roundingRecord/v1",
    );
    expect(roundingSchema).toMatchObject({
      fields: { ordinal: { constraint: "value<524288" } },
    });
    const extractionSchema = registry.strictRecordSchemas.find(
      ({ schemaId }) => schemaId === "extractionRecord/v1",
    );
    expect(extractionSchema).toMatchObject({
      fields: {
        ordinal: { constraint: "value<320" },
        radialOrder: { constraint: "value<=4" },
        ell: { constraint: "value<=63" },
      },
    });
    const stationarySchema = registry.strictRecordSchemas.find(
      ({ schemaId }) => schemaId === "stationaryRecord/v1",
    );
    expect(stationarySchema?.exactKeys).toEqual([
      "ordinal",
      "treeDepth",
      "regionId",
      "candidateKind",
      "domainFace",
      "derivativeEvidenceKind",
      "sDepth",
      "etaDepth",
      "sLower",
      "sUpper",
      "etaLower",
      "etaUpper",
      "valueInterval",
      "radialGradientInterval",
      "regularTransverseGradientInterval",
      "radialHessianInterval",
      "mixedHessianInterval",
      "regularTransverseHessianInterval",
      "disposition",
    ]);
    expect(stationarySchema).toMatchObject({
      normalizedCoordinates: {
        s: "s=rho/(32/33)=33*rho/32",
        eta: "eta=2*theta/pi",
      },
      physicalFaceMap: {
        originSlab: "0<=s<=2^-12_including_the_physical_rho=0_face",
        c1JoinSlab: "1-2^-12<=s<=1_including_rho=32/33_x=32_C1_join_face",
        theta0: "eta=0_maps_to_theta=0",
        thetaPiOver2: "eta=1_maps_to_theta=pi/2",
      },
      derivativeCoordinateMap: {
        regularTransverseHessian: expect.stringContaining(
          "partial_x(u)/x+partial_theta_theta(u)/x^2",
        ),
        originSlabValueCover: expect.stringContaining(
          "terminal_leaf_has_disposition=excluded",
        ),
        c1JoinSlabValueCover: expect.stringContaining(
          "piecewise_continuum_is_only_C1",
        ),
      },
    });
    expect(stationarySchema).toMatchObject({
      fields: {
        derivativeEvidenceKind: {
          values: [
            "physical_regular",
            "not_applicable_value_cover_origin_slab",
            "not_applicable_value_cover_c1_join_slab",
          ],
        },
        treeDepth: { constraint: "value<=108" },
        sDepth: { constraint: "value<=52" },
        etaDepth: { constraint: "value<=56" },
        regionId: {
          values: [
            "origin_value_cover",
            "physical_derivative",
            "c1_join_value_cover",
          ],
        },
      },
    });
    expect(stationarySchema?.exactKeys).not.toContain("rhoLower");
    expect(stationarySchema?.exactKeys).not.toContain("thetaLower");

    const populationByReceipt = Object.fromEntries(
      registry.entries.map((entry) => [
        entry.receiptField,
        "streamPopulation" in entry ? entry.streamPopulation : null,
      ]),
    );
    expect(populationByReceipt).toMatchObject({
      coverTraceSha256: expect.stringContaining("every_deterministic"),
      coulombSelectorTraceSha256: expect.stringContaining(
        "coulombSearchIntervalCount",
      ),
      scalarBoundaryLiftSha256: expect.stringContaining("exactly_32_scalar"),
      potentialBoundaryLiftSha256: expect.stringContaining(
        "exactly_32_potential",
      ),
      exteriorRoundingTraceSha256: expect.stringContaining("exactly_524288"),
      derivativeMultipoleTraceSha256: expect.stringContaining(
        "exactly_320_records",
      ),
      stationaryTraceSha256: expect.stringContaining("stationaryRecordCount"),
    });
    const auditFieldInventory =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.filter(
        ({ levelId, roleIndex }) =>
          levelId === "AUDIT" && [2, 3, 4, 5].includes(roleIndex),
      );
    expect(auditFieldInventory.map(({ relativePath }) => relativePath)).toEqual(
      [
        "arrays/AUDIT/02-base_scalar_u0.f64le",
        "arrays/AUDIT/03-base_potential_V0.f64le",
        "arrays/AUDIT/04-target_scalar_u_A.f64le",
        "arrays/AUDIT/05-target_potential_V_A.f64le",
      ],
    );
    expect(
      auditFieldInventory.reduce(
        (total, { elementCount }) => total + elementCount,
        0,
      ),
    ).toBe(524288);
    expect(
      registry.entries.find(
        ({ receiptField }) => receiptField === "exteriorRoundingTraceSha256",
      ),
    ).toMatchObject({
      auditGridDefinitionSource: {
        exactValue: {
          gridLevel: {
            id: "AUDIT",
            radialNodeCount: 256,
            angularNodeCount: 128,
          },
          fieldArrayInventory: auditFieldInventory.map(
            ({ role, relativePath, shape, elementCount }, index) => ({
              arrayRole: role,
              relativePath,
              shape,
              elementCount,
              flatIndex: index < 2 ? "i*128+j" : "stage*32768+i*128+j",
            }),
          ),
        },
      },
    });
    const receiptFields =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
        .topLevel.fields;
    expect(
      receiptFields.continuousNodelessProofReceipt.fields
        .scalarBoundaryLiftRecordCount,
    ).toEqual({ kind: "literal", value: 32 });
    expect(
      receiptFields.continuousNodelessProofReceipt.fields
        .potentialBoundaryLiftRecordCount,
    ).toEqual({ kind: "literal", value: 32 });
    expect(
      receiptFields.continuousNodelessProofReceipt.fields
        .exteriorRoundingRecordCount,
    ).toEqual({ kind: "literal", value: 524288 });
    expect(
      receiptFields.numericalOriginSeriesDefectReceipt.fields
        .extractionRecordCount,
    ).toEqual({ kind: "literal", value: 320 });
    expect(receiptFields.continuousPeakProofReceipt.exactKeys).toContain(
      "stationaryRecordCount",
    );
    expect(receiptFields.continuousPeakProofReceipt.exactKeys).toEqual(
      expect.arrayContaining([
        "originValueCoverRecordCount",
        "physicalDerivativeRecordCount",
        "c1JoinValueCoverRecordCount",
      ]),
    );
    expect(
      receiptFields.continuousPeakProofReceipt.fields.uniquePeakBoxIndex
        .constraint,
    ).toContain("actual_stationaryTrace_record_ordinal");
    expect(
      receiptFields.continuousPeakProofReceipt.fields.hessianDeterminantLower
        .meaning,
    ).toContain("2_by_2_meridional");
    expect(
      registry.entries.find(
        ({ receiptField }) => receiptField === "representativeContinuumSha256",
      )?.orderedFields,
    ).toEqual([
      ["protocolBinding", "canonicalJson"],
      ["sourceL2ScalarSha256", "rawSha256"],
      ["sourceL2PotentialSha256", "rawSha256"],
      ["CRepresentative", "finiteF64"],
      ["pRepresentative", "finiteF64"],
      ["scalarBoundaryLiftSha256", "rawSha256"],
      ["potentialBoundaryLiftSha256", "rawSha256"],
      ["tailCoefficientInventorySha256", "rawSha256"],
      ["formulaId", "exactUtf8:piecewise_L2_HQ_lifted_tail/v1"],
    ]);

    const u16be = (value: number): Buffer => {
      const output = Buffer.alloc(2);
      output.writeUInt16BE(value);
      return output;
    };
    const u64be = (value: number): Buffer => {
      const output = Buffer.alloc(8);
      output.writeBigUInt64BE(BigInt(value));
      return output;
    };
    const framedDigest = (
      domain: string,
      fields: readonly (readonly [string, Buffer])[],
    ): string => {
      const payload = Buffer.concat(
        fields.flatMap(([tag, value]) => {
          const tagBytes = Buffer.from(tag, "utf8");
          return [u16be(tagBytes.length), tagBytes, u64be(value.length), value];
        }),
      );
      return createHash("sha256")
        .update(domain, "utf8")
        .update(u64be(payload.length))
        .update(payload)
        .digest("hex");
    };
    const domain = registry.entries[0].domain;
    const fields = [
      ["a", Buffer.from([1])],
      ["b", Buffer.from([2, 3])],
    ] as const;
    const baseline = framedDigest(domain, fields);
    expect(framedDigest(domain, [...fields].reverse())).not.toBe(baseline);
    expect(
      framedDigest(domain, [fields[0], ["b", Buffer.from([2, 4])]]),
    ).not.toBe(baseline);
    expect(framedDigest(`${domain}mutated`, fields)).not.toBe(baseline);
  });

  it("fails closed on absent dependency, runtime, and OS resource closure", () => {
    const closure = SEED.dependencyRuntimeAndResourceClosure;
    expect(closure.requiredImplementationInputs).toHaveLength(11);
    expect(closure.everyInputRequiresArtifactSha256AndByteLength).toBe(true);
    expect(closure.implementationClosureManifest).toBeNull();
    expect(closure.proofKernelBinding).toBeNull();
    expect(closure.implementationClosureComplete).toBe(false);
    expect(closure.runtimeReceipt).toBeNull();
    expect(closure.runtimeClosureComplete).toBe(false);
    expect(closure.resourcePolicy).toEqual({
      maximumChildRssMiB: 768,
      maximumWallSeconds: 1800,
      maximumProcesses: 1,
      maximumThreads: 1,
      maximumBlasThreads: 1,
      minimumHostReserveGiB: 2,
      network: "denied",
      osLevelEnforcementImplemented: false,
      executionBlockedUntilEnforced: true,
    });
    expect(SEED.blockers).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS,
    );
  });

  it("cannot clear boson_star_branch_not_solved or any v3 claim lock", () => {
    expect(SEED.authority).toBe("initializer_only");
    expect(SEED.structuralAuthorityLocks).toEqual({
      authority: "initializer_only",
      initializer_only: true,
      relativisticBranchSolved: false,
      boson_star_branch_not_solved: true,
      candidateAdmissible: false,
      seedMayClearBosonStarBranchNotSolved: false,
      allV3ClaimLocksFalse: true,
    });
    expect(
      SEED.purposeAndAuthorityBoundary.mayClearBosonStarBranchNotSolved,
    ).toBe(false);
    expect(SEED.claimLockKeys).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
    );
    expect(SEED.claimLocks).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
    );
    expect(SEED.claimLockKeys).toHaveLength(27);
    expect(Object.keys(SEED.claimLocks)).toEqual([...SEED.claimLockKeys]);
    expect(
      Object.values(SEED.claimLocks).every((value) => value === false),
    ).toBe(true);
  });

  it("exports a self-consistent domain-separated canonical binding", () => {
    const independentlyComputed = createHash("sha256")
      .update(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN, "utf8")
      .update(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON, "utf8")
      .digest("hex");
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN).toBe(
      "nhm2-prolate-boson-star-newtonian-seed/v1\n",
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      independentlyComputed,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES).toBe(
      50226,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING).toEqual({
      artifactId: "nhm2.prolate_boson_star_newtonian_seed",
      contractVersion: "nhm2_prolate_boson_star_newtonian_seed/v1",
      sha256Domain: "nhm2-prolate-boson-star-newtonian-seed/v1\n",
      sha256:
        "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
      canonicalSizeBytes: 50226,
    });
  });

  it("is recursively frozen and accepts only its authoritative singleton", () => {
    expect(everyObjectFrozen(SEED)).toBe(true);
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(SEED)).toEqual([]);
    expect(isNhm2ProlateBosonStarNewtonianSeedV1(SEED)).toBe(true);

    const externalCopy = jsonClone(SEED);
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(externalCopy)).toEqual(
      ["newtonian_seed_v1_external_copy_not_authoritative"],
    );
    expect(isNhm2ProlateBosonStarNewtonianSeedV1(externalCopy)).toBe(false);

    const retuned = jsonClone(SEED) as any;
    retuned.serverRecomputedGates.thresholds.virialRelativeDefectMaximum = 1e-3;
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(retuned)).toEqual([
      "newtonian_seed_v1_semantic_mismatch",
    ]);

    const unlocked = jsonClone(SEED) as any;
    unlocked.claimLocks.physicalViability = true;
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(unlocked)).toEqual([
      "newtonian_seed_v1_semantic_mismatch",
    ]);

    const descriptorRetuned = jsonClone(SEED) as any;
    descriptorRetuned.outputArtifactPolicy.runtimeDescriptorSchemaBinding.sha256 =
      "0".repeat(64);
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(descriptorRetuned),
    ).toEqual(["newtonian_seed_v1_semantic_mismatch"]);

    const negativeZero = jsonClone(SEED) as any;
    negativeZero.serverRecomputedGates.thresholds.virialRelativeDefectMaximum =
      -0;
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(negativeZero)[0],
    ).toContain("invalid_number");
  });

  it("rejects accessors, hidden or symbol keys, sparse/cyclic data, and hostile proxies", () => {
    let getterCalls = 0;
    const accessor = jsonClone(SEED) as any;
    Object.defineProperty(accessor.branchIdentity, "radialNodeCount", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 0;
      },
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(accessor)[0],
    ).toContain("object_property_surface");
    expect(getterCalls).toBe(0);

    const hidden = jsonClone(SEED) as any;
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(hidden)[0]).toContain(
      "object_property_surface",
    );

    const symbol = jsonClone(SEED) as any;
    symbol[Symbol("hidden")] = true;
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(symbol)[0]).toContain(
      "symbol_key",
    );

    const sparse = jsonClone(SEED) as any;
    delete sparse.outputArtifactPolicy.outputRoles[0];
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(sparse)[0]).toContain(
      "array_surface",
    );

    const cyclic = jsonClone(SEED) as any;
    cyclic.self = cyclic;
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(cyclic)[0]).toContain(
      "cyclic_value",
    );

    const throwingProxy = new Proxy(jsonClone(SEED), {
      getPrototypeOf: () => {
        throw new Error("hostile");
      },
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(throwingProxy),
    ).toEqual(["newtonian_seed_v1_plain_data_snapshot_invalid"]);

    const revocable = Proxy.revocable(jsonClone(SEED), {});
    revocable.revoke();
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(revocable.proxy),
    ).toEqual(["newtonian_seed_v1_plain_data_snapshot_invalid"]);
  });

  it("bounds hostile snapshot depth and string work before canonical comparison", () => {
    const tooDeep: Record<string, unknown> = {};
    let cursor = tooDeep;
    for (let index = 0; index < 66; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(nhm2ProlateBosonStarNewtonianSeedV1Violations(tooDeep)[0]).toContain(
      "snapshot_depth_limit",
    );

    const oversizedString = jsonClone(SEED) as any;
    oversizedString.artifactId = "x".repeat(131_073);
    expect(
      nhm2ProlateBosonStarNewtonianSeedV1Violations(oversizedString)[0],
    ).toContain("snapshot_string_limit");
  });
});
