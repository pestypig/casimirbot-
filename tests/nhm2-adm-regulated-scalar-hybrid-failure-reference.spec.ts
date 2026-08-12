import { describe, expect, it } from "vitest";

import * as referenceModule from "../shared/contracts/nhm2-adm-regulated-scalar-hybrid-failure-reference.v1";
import {
  NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE,
  NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_ARTIFACT_ID,
  NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CLAIM_LOCKS,
  NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CONTRACT_VERSION,
  isNhm2AdmRegulatedScalarHybridFailureReferenceV1,
  nhm2AdmRegulatedScalarHybridFailureReferenceViolations,
} from "../shared/contracts/nhm2-adm-regulated-scalar-hybrid-failure-reference.v1";

const clone = (): any =>
  structuredClone(NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE);

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      isDeepFrozen(entry, seen),
    )
  );
};

describe("NHM2 ADM regulated-scalar hybrid frozen failure reference", () => {
  it("exports one exact deeply frozen negative-control reference and no builder", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.artifactId).toBe(
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_ARTIFACT_ID,
    );
    expect(reference.contractVersion).toBe(
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CONTRACT_VERSION,
    );
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(reference),
    ).toEqual([]);
    expect(isNhm2AdmRegulatedScalarHybridFailureReferenceV1(reference)).toBe(
      true,
    );
    expect(isDeepFrozen(reference)).toBe(true);
    expect(
      Object.keys(referenceModule).filter((name) =>
        /^(?:build|create)/i.test(name),
      ),
    ).toEqual([]);
    expect(reference.negativeControl).toMatchObject({
      passOracle: false,
      retuningAfterFreezeAllowed: false,
      fallbackCandidateSelectionAllowed: false,
      expectedDispositionIsNotAnOutput: true,
    });
  });

  it("freezes a gravity-plus-frozen-state canonical hybrid rather than a fixed-background Ward substitution", () => {
    const formulation =
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.canonicalFormulation;
    expect(formulation.phaseSpace.gravityCanonicalPair).toEqual([
      "q_ab",
      "pi^ab",
    ]);
    expect(
      formulation.phaseSpace.quantumStateIncludedInSymplecticPhaseSpace,
    ).toBe(false);
    expect(formulation.gravityHamiltonianDensity).toContain(
      "pi_ab*pi^ab-(1/2)*pi^2",
    );
    expect(
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.conventions
        .symmetricCanonicalStorage,
    ).toEqual({
      qOrder: ["q_xx", "q_yy", "q_zz", "q_xy", "q_xz", "q_yz"],
      pOrder: ["P_xx", "P_yy", "P_zz", "P_xy", "P_xz", "P_yz"],
      momentumDecoding: {
        diagonal: "pi_xx=P_xx, pi_yy=P_yy, pi_zz=P_zz",
        offDiagonal: "pi_xy=P_xy/2, pi_xz=P_xz/2, pi_yz=P_yz/2",
      },
      reason:
        "P_xy=2*pi_xy_and_corresponding_xz_yz_relations_preserve_pi^ab*dq_ab=sum_I(P_I*dQ_I)_for_symmetric_tensors",
    });
    expect(formulation.scalarHamiltonianDensity).toContain(
      "p_phi(j)^2/sqrt(q(j))",
    );
    expect(formulation.effectiveGenerators.hamiltonian).toContain(
      "H_G+h_omega[q]",
    );
    expect(formulation.fixedBackgroundWardIdentitySubstitutionAllowed).toBe(
      false,
    );
    expect(formulation.anomalyWitness).toContain(
      "omit_the_nonzero_c_omega[W]_term",
    );
  });

  it("freezes exact powers-of-two state and off-shell conformal ADM data", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.frozenBaseData.admSlice).toMatchObject({
      conformalFactor: "psi=1+2^-8*b(s)",
      conformalAmplitude: { exact: "2^-8", value: 1 / 256 },
      spatialMetric: "q_ab=psi^4*delta_ab",
      canonicalMomentum: "pi^ab=0",
      constraintSolved: false,
    });
    expect(reference.scalarState).toMatchObject({
      scalarMass: { exact: "2^-2", value: 1 / 4 },
      meanFieldAmplitude: { exact: "2^-3", value: 1 / 8 },
      meanMomentumAmplitude: { exact: "2^-3", value: 1 / 8 },
      momentumTiltAmplitude: { exact: "2^-3", value: 1 / 8 },
      stateIsPositiveFiniteDimensionalGaussian: true,
      stateIsSubmittedArrayFixture: false,
      continuumHadamardLimitEstablished: false,
    });
    expect(reference.scalarState.covariance).toEqual({
      C_phi_phi: "(h_level^-3/2)*K_h^(-1/2)",
      C_p_p: "(h_level^-3/2)*K_h^(1/2)",
      C_sym_phi_p: "0",
      matrixFunctions:
        "real_symmetric_spectral_decomposition_with_positive_mass_removing_the_zero_mode_singularity",
      uncertaintySaturation:
        "C_phi_phi*C_p_p=(h_level^-6/4)*I_in_the_common_K_h_eigenbasis_matching_[phi_j,p_phi_k]=i*h_level^-3*delta_jk",
    });
    expect(reference.scalarState.latticeCanonicalCommutator).toBe(
      "[phi_j,p_phi_k]=i*h_level^-3*delta_jk",
    );
    expect(reference.scalarState.referenceHamiltonian).toBe(
      "H_ref=(h_level^3/2)*(p_phi_transpose*p_phi+phi_transpose*K_h*phi)",
    );
  });

  it("freezes the concrete nested 4^3, 8^3, and 16^3 regulator and all 64 anchors", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.regulator.grids).toEqual([
      {
        level: 0,
        pointsPerAxis: 4,
        pointCount: 64,
        spacingExact: "2^-1",
        spacing: 1 / 2,
      },
      {
        level: 1,
        pointsPerAxis: 8,
        pointCount: 512,
        spacingExact: "2^-2",
        spacing: 1 / 4,
      },
      {
        level: 2,
        pointsPerAxis: 16,
        pointCount: 4096,
        spacingExact: "2^-3",
        spacing: 1 / 8,
      },
    ]);
    expect(reference.regulator.formalOrder).toBe(2);
    expect(reference.regulator.sevenPointLaplacian).toBe(
      "Delta_h(f)_j=sum_a(f_(j+e_a)-2*f_j+f_(j-e_a))/h^2_with_periodic_indices",
    );
    expect(reference.regulator.discreteCanonicalPoissonBracket).toContain(
      "h^-3*sum_grid,sum_I",
    );
    expect(reference.samplingAndProbes.sampleCount).toBe(64);
    expect(reference.samplingAndProbes.anchors).toHaveLength(64);
    expect(reference.samplingAndProbes.anchors[0]).toEqual({
      ordinal: 0,
      coordinateExact: { x: "-3/8", y: "-3/8", z: "-3/8" },
    });
    expect(reference.samplingAndProbes.anchors[63]).toEqual({
      ordinal: 63,
      coordinateExact: { x: "3/8", y: "3/8", z: "3/8" },
    });
    expect(reference.samplingAndProbes.compactProbe).toMatchObject({
      supportRadius: { exact: "2^-1", value: 1 / 2 },
      normalizedOnEveryLevel: true,
      directionCoordinates: "u_p,a=d_p^a/(2^-1)",
    });
    expect(reference.discreteGeometryAndMatterEvaluation).toMatchObject({
      momentumDecode:
        "decode_pi_xx=P_xx_pi_yy=P_yy_pi_zz=P_zz_pi_xy=P_xy/2_pi_xz=P_xz/2_pi_yz=P_yz/2_before_lowering_or_contraction",
      christoffel:
        "Gamma^a_bc(j)=(1/2)*q^ad(j)*(D0_b(q_dc)(j)+D0_c(q_db)(j)-D0_d(q_bc)(j))",
      ricci:
        "R_ab(j)=D0_c(Gamma^c_ab)(j)-D0_b(Gamma^c_ac)(j)+Gamma^c_ab(j)*Gamma^d_cd(j)-Gamma^c_ad(j)*Gamma^d_bc(j)",
      scalarCurvature: "R3(j)=q^ab(j)*R_ab(j)",
      momentumDivergence:
        "D_c(pi^bc)(j)=D0_c(pi^bc)(j)+Gamma^b_cd(j)*pi^cd(j)_after_the_Gamma^c_cd*pi^bd_and_weight_one_minus_Gamma^d_dc*pi^bc_terms_cancel",
      gravityDensityPlacement:
        "sqrt_q_inverse_q_lowered_pi_pi_trace_and_R3_are_all_formed_pointwise_then_H_G_and_D_G_are_multiplied_by_the_sampled_smearing_and_summed_with_h^3",
      scalarExpectationPlacement:
        "h_omega(j)=(1/2)*(P2_j/sqrt(q_j)+sqrt(q_j)*(q^ab(j)*G_ab(j)+m^2*Phi2_j))_and_c_omega_a(j)=C_a(j)_with_all_products_at_node_j",
      scalarCrossCovarianceConsequence:
        "C_sym_p_phi=transpose(C_sym_phi_p)=0_so_c_omega_a(j)=p_phi_bar(j)*D0_a(phi_bar)(j)",
      generatorQuadrature:
        "H_eff[N]=h^3*sum_j(N_j*(H_G_j+h_omega_j))_and_D_eff[X]=h^3*sum_j(X_j^a*(D_G_a_j+c_omega_a_j))",
      derivativeAndProductOrderingMutable: false,
    });
  });

  it("freezes exact H-H, H-D, and D-D target signs and channel assignments", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.canonicalFormulation.classicalDiracTargets).toEqual({
      H_H: "{H_eff[N],H_eff[M]}_target=D_eff[W_D0], W_D0^a(j)=q^ab(j)*(N(j)*D0_b(M)(j)-M(j)*D0_b(N)(j))",
      H_Hi: "{H_eff[N],D_eff[X]}_target=-H_eff[L_X_D0(N)], L_X_D0(N)(j)=X^a(j)*D0_a(N)(j)",
      Hi_Hj:
        "{D_eff[X],D_eff[Y]}_target=D_eff[[X,Y]_D0], [X,Y]_D0^a(j)=X^b(j)*D0_b(Y^a)(j)-Y^b(j)*D0_b(X^a)(j)",
    });
    expect(reference.bracketArrayDerivation.outputShape).toEqual([64, 4]);
    expect(reference.bracketArrayDerivation.componentOrder).toEqual([
      "hamiltonian",
      "momentum_x",
      "momentum_y",
      "momentum_z",
    ]);
    expect(reference.bracketArrayDerivation.H_H.momentumChannels).toContain(
      "{H_eff[chi_p],H_eff[u_p,a*chi_p]}",
    );
    expect(reference.bracketArrayDerivation.H_Hi.hamiltonianChannel).toContain(
      "target[p,0]=-H_eff",
    );
    expect(reference.bracketArrayDerivation.Hi_Hj.momentumChannels).toContain(
      "target[p,a]=D_eff[[X_p,a,Y_p,a]_D0]",
    );
    expect(reference.bracketArrayDerivation.H_H.WDefinition).toContain("D0_c");
    expect(reference.bracketArrayDerivation.H_Hi.hamiltonianChannel).toContain(
      "D0_a(chi_p)",
    );
    expect(
      JSON.stringify(reference.canonicalFormulation.classicalDiracTargets),
    ).not.toContain("partial_");
    expect(reference.bracketArrayDerivation.residualDefinition).toBe(
      "residual[p,A]=computed[p,A]-target[p,A]",
    );
  });

  it("requires input-only normalization and separately evaluated antisymmetry and Jacobi", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.normalization).toMatchObject({
      normalizationId: "fixed_level_independent_one_code_unit_scale/v1",
      referenceScale: { exact: "2^0", value: 1, unit: "dimensionless" },
      levelIndependent: true,
      pointIndependent: true,
      computedOrTargetDependentDenominatorAllowed: false,
      serverRecomputedOnlyFromFrozenConstant: true,
      submittedOutputDependentDenominatorAllowed: false,
      toleranceRetuningAllowed: false,
    });
    expect(reference.canonicalIdentityDerivation.antisymmetry).toMatchObject({
      residual: "A_residual=A_forward+A_reverse",
      targetArraysUsed: false,
    });
    expect(
      reference.canonicalIdentityDerivation.antisymmetry.reverse,
    ).toContain("separate_bracket_call");
    expect(reference.canonicalIdentityDerivation.Jacobi).toMatchObject({
      residual: "J_residual=J1+J2+J3",
      eachInnerAndOuterBracketSeparatelyEvaluated: true,
      targetArraysUsed: false,
    });
  });

  it("binds regulator roles to positive second-order discretization-error estimates only", () => {
    const regulator =
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.regulatorDisposition;
    expect(regulator).toMatchObject({
      derivationKind: "producer_derived_finite_grid_diagnostic",
      serverRecomputedDerivationAuthority: false,
      level0ErrorEstimate: "E_0[p,A]=(4/3)*d_01[p,A]",
      level1ErrorEstimate: "E_1[p,A]=(4/3)*d_12[p,A]",
      level2ErrorEstimate: "E_2[p,A]=(1/3)*d_12[p,A]",
      roleValueBinding:
        "regulator_level.l.residual[p,A]=E_l[p,A]_for_l_in_[0,1,2]",
      formalOrder: 2,
      valueDomain: "finite_nonnegative_for_every_governed_role_entry",
      governedLevelwiseUpper95:
        "q_level=max_over_p_A(abs(E_level[p,A])+U_E_level[p,A])",
      governedLevelwiseRequirement: "q_level_must_be_strictly_positive",
      zeroValueDisposition:
        "individual_exact_zero_entries_are_allowed_but_a_level_with_q_level_equal_zero_is_governed_replay_blocked_and_the_finite_grid_result_is_inconclusive",
      zeroFlooringOrSyntheticPerturbationAllowed: false,
      closureMagnitudeOrContinuumInterceptAllowed: false,
      continuumExtrapolationAuthorized: false,
      continuumAnomalyAttributionAuthorized: false,
      retuningOrCandidateReplacementAfterObservationAllowed: false,
    });
    expect(
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.finiteGridFailureSemantics,
    ).toMatchObject({
      diagnosticClosureTolerance: { exact: "1/10", value: 0.1 },
      continuumInferenceAllowed: false,
      noRetuneTerminal: true,
    });
    expect("continuumInterceptCoarseMiddle" in regulator).toBe(false);
    expect("exactZeroAllLevelsDisposition" in regulator).toBe(false);
  });

  it("contains future role semantics but no output, receipt, execution, or promotion surface", () => {
    const reference = NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE;
    expect(reference.futureRawArrayPlan.rawValues).toBeNull();
    expect(reference.futureRawArrayPlan.bracketRoles).toHaveLength(12);
    expect(reference.futureRawArrayPlan.identityRoles).toHaveLength(9);
    expect(reference.futureRawArrayPlan.regulatorRoles).toHaveLength(6);
    expect(
      reference.futureRawArrayPlan.identityRoles.map((entry) => entry.role),
    ).toEqual([
      "antisymmetry.forward",
      "antisymmetry.reverse",
      "antisymmetry.residual",
      "antisymmetry.absolute_uncertainty95",
      "jacobi.term_1",
      "jacobi.term_2",
      "jacobi.term_3",
      "jacobi.residual",
      "jacobi.absolute_uncertainty95",
    ]);
    expect(
      reference.futureRawArrayPlan.regulatorRoles.map((entry) => entry.role),
    ).toEqual([
      "regulator_level.0.residual",
      "regulator_level.0.absolute_uncertainty95",
      "regulator_level.1.residual",
      "regulator_level.1.absolute_uncertainty95",
      "regulator_level.2.residual",
      "regulator_level.2.absolute_uncertainty95",
    ]);
    const descriptors = [
      ...reference.futureRawArrayPlan.bracketRoles,
      ...reference.futureRawArrayPlan.identityRoles,
      ...reference.futureRawArrayPlan.regulatorRoles,
    ];
    expect(descriptors).toHaveLength(27);
    expect(
      descriptors.every(
        (entry) =>
          entry.unit === "dimensionless" &&
          entry.dtype === "float64" &&
          entry.binaryEncoding === "raw_ieee754" &&
          entry.endianness === "little" &&
          entry.storageOrder === "row-major",
      ),
    ).toBe(true);
    expect(
      reference.futureRawArrayPlan.governedCentralArrayGridBinding,
    ).toEqual({
      sourceRegulatorLevel: 2,
      sourcePointsPerAxis: 16,
      roleCount: 21,
      roles: descriptors.slice(0, 21).map((entry) => entry.role),
      rule: "every_governed_bracket_and_identity_central_or_uncertainty_array_is_derived_from_level_2_only",
    });
    expect(reference.futureRawArrayPlan.regulatorOperandGridBinding).toEqual({
      sourceRegulatorLevels: [0, 1, 2],
      sourcePointsPerAxis: [4, 8, 16],
      rule: "the_producer_derives_regulator_error_estimates_from_frozen_closure_and_identity_operands_on_all_three_levels",
    });
    expect(reference.futureRawArrayPlan.binary64Centralization).toMatchObject({
      roundingMode: "IEEE754_roundTiesToEven",
      certifiedIntervalMaximumWidth:
        "strictly_less_than_0.5_ULP_of_the_candidate_binary64",
      uniqueRoundingCellRequired: true,
      exactZeroEncoding: "positive_zero_0x0000000000000000",
      negativeZeroAllowed: false,
      nonfiniteCentralValueAllowed: false,
    });
    expect(reference.executionBoundary).toEqual({
      semanticReferenceOnly: true,
      candidateManifest: null,
      scientificPreseal: null,
      rawArrays: null,
      replayReceipt: null,
      pairReceipt: null,
      lampReceipt: null,
      theoryGraphReceipt: null,
      implementationsExecuted: false,
      empiricalReceiptPresent: false,
    });
    expect(
      Object.values(reference.claimLocks).every((value) => value === false),
    ).toBe(true);
  });

  it("freezes genuinely separate unexecuted primary and independent lineages", () => {
    const lineages =
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.implementationLineages;
    expect(lineages.map((lineage) => lineage.role)).toEqual([
      "primary",
      "independent",
    ]);
    expect(lineages[0].method).not.toBe(lineages[1].method);
    expect(lineages[1].method).toContain(
      "exact_same_frozen_nodewise_D0_7_point",
    );
    expect(lineages[1].derivativeScheme).toContain(
      "exact_same_frozen_periodic_D0_and_7_point_operators",
    );
    expect(lineages[0].centralValueRoundingDuty).toBe(
      lineages[1].centralValueRoundingDuty,
    );
    expect(lineages[0].centralValueRoundingDuty).toContain(
      "narrower_than_0.5_ULP",
    );
    expect(
      lineages.every(
        (lineage) =>
          lineage.sharedCodeAllowedWithIndependent === false &&
          lineage.executionStatus === "planned_not_executed" &&
          lineage.sourceSha256 === null &&
          lineage.dependencyLockSha256 === null &&
          lineage.executableSha256 === null,
      ),
    ).toBe(true);
  });

  it("rejects amplitude drift, output-dependent normalization, and target echo shortcuts", () => {
    const amplitude = clone();
    amplitude.scalarState.meanFieldAmplitude.value = 1 / 4;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(amplitude),
    ).toContain("value_drift:/scalarState/meanFieldAmplitude/value");

    const outputScale = clone();
    outputScale.normalization.submittedOutputDependentDenominatorAllowed = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(outputScale),
    ).toContain(
      "value_drift:/normalization/submittedOutputDependentDenominatorAllowed",
    );

    const targetScale = clone();
    targetScale.normalization.computedOrTargetDependentDenominatorAllowed = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(targetScale),
    ).toContain(
      "value_drift:/normalization/computedOrTargetDependentDenominatorAllowed",
    );

    const echo = clone();
    echo.bracketArrayDerivation.computedMayNotReadTargetBytes = false;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(echo),
    ).toContain(
      "value_drift:/bracketArrayDerivation/computedMayNotReadTargetBytes",
    );
  });

  it("rejects retuning, fallback selection, output injection, or lineage self-promotion", () => {
    const retuned = clone();
    retuned.negativeControl.retuningAfterFreezeAllowed = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(retuned),
    ).toContain("negative_control_no_retune_boundary_invalid");

    const fallback = clone();
    fallback.negativeControl.fallbackCandidateSelectionAllowed = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(fallback),
    ).toContain("negative_control_no_retune_boundary_invalid");

    const output = clone();
    output.futureRawArrayPlan.rawValues = [[0, 0, 0, 0]];
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(output),
    ).toContain("semantic_reference_execution_or_output_inflation_forbidden");

    const executed = clone();
    executed.implementationLineages[0].executionStatus = "executed";
    executed.implementationLineages[0].sourceSha256 = "a".repeat(64);
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(executed),
    ).toContain("primary_independent_unexecuted_lineage_boundary_invalid");
  });

  it("rejects Hadamard, RSET, noise, NHM2, Casimir, and active-goal false promotion", () => {
    const continuum = clone();
    continuum.scalarState.continuumHadamardLimitEstablished = true;
    continuum.scalarState.covariantlyRenormalizedContinuumRsetEstablished = true;
    continuum.scalarState.connectedContinuumNoiseKernelEstablished = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(continuum),
    ).toContain("continuum_scalar_science_promotion_forbidden");

    for (const key of [
      "currentNhm2GeometryEstablished",
      "currentNhm2SourceEstablished",
      "casimirMaterialOrApparatusEstablished",
      "semanticRelabelingAsNhm2OrCasimirAllowed",
      "negativeControlFailureCompletesActiveTheoryGoal",
    ]) {
      const promoted = clone();
      promoted.scientificBoundary[key] = true;
      expect(
        nhm2AdmRegulatedScalarHybridFailureReferenceViolations(promoted),
        key,
      ).toContain("nhm2_casimir_or_goal_promotion_forbidden");
    }

    const anomaly = clone();
    anomaly.scientificBoundary.continuumConstraintAnomalyEstablished = true;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(anomaly),
    ).toContain("continuum_constraint_anomaly_promotion_forbidden");
  });

  it("rejects every claim unlock and malformed non-plain or nonfinite data", () => {
    expect(
      Object.values(
        NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    for (const key of Object.keys(
      NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE_CLAIM_LOCKS,
    )) {
      const promoted = clone();
      promoted.claimLocks[key] = true;
      expect(
        nhm2AdmRegulatedScalarHybridFailureReferenceViolations(promoted),
        key,
      ).toContain(`claim_lock_must_remain_false:${key}`);
    }

    const accessor = clone();
    Object.defineProperty(accessor, "scalarState", {
      enumerable: true,
      get: () => NHM2_ADM_REGULATED_SCALAR_HYBRID_FAILURE_REFERENCE.scalarState,
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(accessor),
    ).toEqual(["accessor_property_forbidden:/scalarState"]);

    const nonfinite = clone();
    nonfinite.regulator.grids[0].spacing = Number.NaN;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(nonfinite),
    ).toEqual(["nonfinite_number:/regulator/grids/0/spacing"]);
  });

  it("rejects non-enumerable object properties and array entries that JSON would drop", () => {
    const hiddenObjectProperty = clone();
    Object.defineProperty(hiddenObjectProperty, "scalarState", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: hiddenObjectProperty.scalarState,
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(
        hiddenObjectProperty,
      ),
    ).toEqual(["non_enumerable_property_forbidden:/scalarState"]);

    const hiddenArrayEntry = clone();
    Object.defineProperty(hiddenArrayEntry.samplingAndProbes.anchors, "0", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: hiddenArrayEntry.samplingAndProbes.anchors[0],
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(hiddenArrayEntry),
    ).toEqual([
      "non_enumerable_array_entry_forbidden:/samplingAndProbes/anchors/0",
    ]);
  });

  it("rejects prototype keys, out-of-range array keys, and cyclic graphs", () => {
    const protoKey = clone();
    Object.defineProperty(protoKey, "__proto__", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { promoted: true },
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(protoKey),
    ).toEqual(["forbidden_property_key:/__proto__"]);

    const constructorKey = clone();
    Object.defineProperty(constructorKey.scalarState, "constructor", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: "promotion",
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(constructorKey),
    ).toEqual(["forbidden_property_key:/scalarState/constructor"]);

    const outOfRange = clone();
    Object.defineProperty(outOfRange.samplingAndProbes.anchors, "4294967295", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { promoted: true },
    });
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(outOfRange),
    ).toEqual([
      "array_index_out_of_range:/samplingAndProbes/anchors/4294967295",
    ]);

    const cyclic = clone();
    cyclic.scientificBoundary.loop = cyclic.scientificBoundary;
    expect(
      nhm2AdmRegulatedScalarHybridFailureReferenceViolations(cyclic),
    ).toEqual(["cyclic_value:/scientificBoundary/loop"]);
  });

  it.each(["toString", "valueOf", "hasOwnProperty"])(
    "rejects an own enumerable Object.prototype-shadowing %s key",
    (key) => {
      const shadowed = clone();
      Object.defineProperty(shadowed, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: "promotion",
      });
      expect(
        nhm2AdmRegulatedScalarHybridFailureReferenceViolations(shadowed),
      ).toContain(`extra_key:/${key}`);
    },
  );
});
