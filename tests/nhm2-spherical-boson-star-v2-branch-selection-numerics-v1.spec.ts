import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-execution-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import {
  cloneNhm2SphericalBosonStarV2BranchSelectionNumericsV1CanonicalWire,
  isNhm2SphericalBosonStarV2BranchSelectionNumericsV1Wire,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VALIDATOR_LIMITS,
  nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1";

const CONTRACT = NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1;

const recursivelyExpectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): void => {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    recursivelyExpectFrozen(child, seen);
  }
};

const binary64Word = (value: number): string => {
  const bytes = new ArrayBuffer(8);
  new DataView(bytes).setFloat64(0, value, false);
  return new DataView(bytes)
    .getBigUint64(0, false)
    .toString(16)
    .padStart(16, "0");
};

describe("spherical boson-star v2 branch-selection numerics v1", () => {
  it("exact-binds the final candidate freeze and four prerequisite semantic contracts", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING_PINS;
    expect(pins.finalCandidateFreezeV2).toEqual({
      semanticSha256:
        "a8e4d9cb4b07efc053fddc72339b8c3db464129a992731453059d3e160ca2ce2",
      plainCanonicalSha256:
        "ae7e7f17b67dca7bbb25cbddb60e20b08135dd513977a620463122e153f58932",
      canonicalSizeBytes: 20_843,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
    ).toMatchObject(pins.finalCandidateFreezeV2);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_EXECUTION_POLICY_V1_BINDING,
    ).toMatchObject({
      sha256: pins.branchExecutionPolicy.semanticSha256,
      canonicalSizeBytes: pins.branchExecutionPolicy.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    ).toMatchObject({
      sha256: pins.branchSolverPolicy.semanticSha256,
      canonicalSizeBytes: pins.branchSolverPolicy.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_BINDING,
    ).toMatchObject({
      sha256: pins.radialPrimaryNumerics.semanticSha256,
      canonicalSizeBytes: pins.radialPrimaryNumerics.canonicalSizeBytes,
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_BINDING).toMatchObject({
      sha256: pins.branchBvp.semanticSha256,
      canonicalSizeBytes: pins.branchBvp.canonicalSizeBytes,
    });
    expect(
      CONTRACT.exactDefinitionBindings.bindingsImportDefinitionOnlyNotAuthority,
    ).toBe(true);
    expect(CONTRACT.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2.selectedCandidateIdentity
        .candidateId,
    );
  });

  it("retains the exact complete eleven-source finite-solver closure without calling it proof closure", () => {
    const closure = CONTRACT.existingFiniteSolverSourceClosure;
    expect(closure.exactFileCount).toBe(11);
    expect(closure.files).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RADIAL_PRIMARY_NUMERICS_V1_SOURCE_PINS,
    );
    expect(closure.files.map((pin) => pin.ordinal)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(
      closure.files.map((pin) => pin.relativePath.split("/").at(-1)),
    ).toEqual([
      "binary64_environment.py",
      "radial_residual.py",
      "radial_residual_jacobian.py",
      "radial_collocation_interior.py",
      "radial_origin_series.py",
      "radial_tail_asymptotics.py",
      "radial_lobatto_grid.py",
      "radial_compactified_system.py",
      "deterministic_dense_lu.py",
      "deterministic_newton.py",
      "radial_continuation.py",
    ]);
    for (const pin of closure.files) {
      const bytes = readFileSync(pin.relativePath);
      expect(bytes.byteLength).toBe(pin.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(pin.sha256);
    }
    expect(closure).toMatchObject({
      exactPathSizeAndSha256ClosureRequired: true,
      finitePrimitiveClosureIsNotIntegratedCandidateSolverClosure: true,
      finitePrimitiveClosureIsNotProofProgramClosure: true,
      finitePrimitiveClosureIsNotRuntimeOrExecutionAuthority: true,
    });
  });

  it("labels every schedule tolerance and proof dimension as a new preregistered choice", () => {
    const policy = CONTRACT.policyDecisionClassification;
    expect(policy.classification).toBe(
      "new_preexecution_scientific_policy_decision_not_inferred_from_diagnostics_or_pass_evidence",
    );
    expect(policy.decisionLedger).toHaveLength(44);
    expect(
      new Set(policy.decisionLedger.map((entry) => entry.dimension)).size,
    ).toBe(44);
    for (const [ordinal, entry] of policy.decisionLedger.entries()) {
      expect(entry).toEqual({
        ordinal,
        dimension: entry.dimension,
        decisionClass: policy.classification,
        priorDiagnosticPresenceIsNotJustification: true,
        passEvidenceInspectedOrUsed: false,
        derivedErrorBoundClaimed: false,
      });
    }
    expect(policy).toMatchObject({
      everyScheduleToleranceAndProofDimensionCoveredByLedger: true,
      numericalValuesAreConservativeEngineeringDecisions: true,
      numericalValuesAreNotDerivedDiscretizationErrorBounds: true,
      noTargetOutputOrPassEvidenceUsedToChooseValues: true,
    });
    expect(CONTRACT.additiveBoundary).toMatchObject({
      importsPassEvidence: false,
      importsDiagnosticResults: false,
      claimsPolicyValuesAreUniquelyImpliedByPriorArtifacts: false,
      priorDiagnosticCountsAdoptedOnlyAsNewPreregisteredPolicy: true,
    });
  });

  it("freezes four independent full solves and forbids cross-grid predictor reuse", () => {
    const policy = CONTRACT.frozenGridAndChronologyPolicy;
    expect(
      policy.levels.map((level) => [level.levelId, level.nodeCount]),
    ).toEqual([
      ["L0", 64],
      ["L1", 96],
      ["L2", 128],
      ["L3", 256],
    ]);
    expect(policy.everyLevelIsAnIndependentFullSolve).toBe(true);
    expect(policy.initializerLambda).toEqual({ exact: "2^-5", value: 2 ** -5 });
    expect(policy.amplitudeScheduleExact).toEqual([
      "2^-16",
      "2^-15",
      "2^-14",
      "2^-13",
      "2^-12",
      "2^-11",
      "2^-10",
    ]);
    expect(policy.amplitudeScheduleValues).toEqual([
      2 ** -16,
      2 ** -15,
      2 ** -14,
      2 ** -13,
      2 ** -12,
      2 ** -11,
      2 ** -10,
    ]);
    expect(policy).toMatchObject({
      coarseGridStateMayInitializeFinerGrid: false,
      crossGridInterpolationRole: "diagnostic_gate_only_never_predictor",
      interpolationPredictorAllowed: false,
      alternateGridFallbackAllowed: false,
      alternateInitializerFallbackAllowed: false,
      terminalCandidateState: "L3_N256_A2^-10",
      firstFailureStopsWholeCandidate: true,
    });
  });

  it("freezes state packing deterministic projection normalized Linf and three adjacent gates", () => {
    expect(CONTRACT.statePackingAndProjectionPolicy.packedStateOrder).toEqual([
      "F0_nodes_ascending_rho",
      "F1_nodes_ascending_rho",
      "varphi_nodes_ascending_rho",
      "w",
    ]);
    expect(CONTRACT.statePackingAndProjectionPolicy.adjacentPairOrder).toEqual([
      "64_to_96",
      "96_to_128",
      "128_to_256",
    ]);
    expect(CONTRACT.statePackingAndProjectionPolicy.projection).toMatchObject({
      algorithm: "deterministic_second_form_chebyshev_lobatto_barycentric",
      exactBitEqualNodeHit: "copy_source_value",
      exactMaximumTieRule: "retain_lowest_ordinal",
      outputZeroRule: "canonicalize_to_positive_zero",
      alternateProjectionAllowed: false,
    });

    const convergence = CONTRACT.crossGridConvergencePolicy;
    expect(convergence.overallNorm).toBe("E=max(E_F0,E_F1,E_varphi,E_w)");
    expect(convergence.pairPassRule).toBe("E<=1");
    expect(convergence.requiredConsecutivePairCount).toBe(3);
    const expected = {
      F0: ["2^-36", "2^-24", "3db0000000000000", "3e70000000000000"],
      F1: ["2^-36", "2^-24", "3db0000000000000", "3e70000000000000"],
      varphi: ["2^-40", "2^-24", "3d70000000000000", "3e70000000000000"],
      w: ["2^-40", "2^-32", "3d70000000000000", "3df0000000000000"],
    } as const;
    for (const component of ["F0", "F1", "varphi", "w"] as const) {
      const tolerance = convergence.componentTolerances[component];
      expect([
        tolerance.absolute.exact,
        tolerance.relative.exact,
        tolerance.absolute.binary64Word,
        tolerance.relative.binary64Word,
      ]).toEqual(expected[component]);
      expect(binary64Word(tolerance.absolute.value)).toBe(
        tolerance.absolute.binary64Word,
      );
      expect(binary64Word(tolerance.relative.value)).toBe(
        tolerance.relative.binary64Word,
      );
    }
    expect(convergence.currentObservedPairErrors).toBeNull();
    expect(convergence.established).toBe(false);
  });

  it("freezes the desingularized lambda cover and radii-polynomial proof dimensions", () => {
    const vacuum = CONTRACT.continuousVacuumConnectionPolicy;
    expect(vacuum.weakFieldScaling).toEqual({
      physicalOriginAmplitude: "A=lambda^2_in_[0,2^-10]",
      scaledRadius: "y=lambda*x",
      scalar: "varphi=lambda^2*u",
      metricF0: "F0=lambda^2*v0",
      metricF1: "F1=lambda^2*v1",
      scaledFrequency: "nu=(w^2-1)/(2*lambda^2)",
      scaledAdmCoefficient: "m=M/lambda",
    });
    expect(vacuum.lambdaZeroRule).toMatchObject({
      independentlyProveLimitingNewtonianGroundState: true,
      independentlyProveSimpleKernel: true,
      independentlyProveBifurcationTransversality: true,
      ordinaryIntervalNewtonOnUnscaledVacuumEquationsForbidden: true,
    });
    const cover = vacuum.fixedRadiiPolynomialCover;
    expect(cover).toMatchObject({
      exactParameterCellCount: 1_024,
      mpfrPrecisionBits: 256,
      intervalRounding: "directed_outward",
      coreScaledRadialDomain: "y_in_[0,64]",
      spatialChebyshevCoefficientsPerUnknown: 256,
      parameterChebyshevDegreePerCell: 32,
      analyticTailFactorizationBeyondY: 64,
      adaptiveCellSubdivisionAllowed: false,
      truncationIncreaseAllowed: false,
      precisionEscalationAllowed: false,
      existenceInequality: "Y+(Z0+Z1-1)*r+Z2*r^2<0",
      contractionInequality: "Z0+Z1+2*Z2*r<1",
      adjacentTubeSharedFaceOverlapRequired: true,
      adjacentTubeCompatibleOrientationRequired: true,
    });
    expect(cover.exactOrderedRadiusExponentSet).toEqual(
      Array.from({ length: 73 }, (_, index) => -80 + index),
    );
    expect(cover.coefficientWeight).toEqual({
      exact: "17/16",
      numerator: 17,
      denominator: 16,
    });
    expect(vacuum.sevenStagesMaySubstituteForContinuousCover).toBe(false);
    expect(vacuum.established).toBe(false);
  });

  it("freezes tangent no-fold and continuum sign proofs without claiming either exists", () => {
    expect(CONTRACT.tangentAndNoFoldPolicy).toMatchObject({
      tangentEquation: "D_zG*t_z+partial_lambda_G=0",
      affineNormalization: "t_lambda=1",
      orientation: "strictly_increasing_lambda",
      signReversalAllowed: false,
      branchSwitchAllowed: false,
      foldObservable: "min(beta,-dw/dA,dM/dlambda)",
      foldPassRule: "foldMargin>=2^-40_everywhere",
      observedFrequencyProgressionAloneIsProof: false,
      thresholdIsEvidenceDerived: false,
      established: false,
    });
    expect(CONTRACT.tangentAndNoFoldPolicy.margins).toMatchObject({
      exactThreshold: "2^-40",
      thresholdValue: 2 ** -40,
      thresholdBinary64Word: "3d70000000000000",
    });
    const sign = CONTRACT.continuumPositivityAndMonotonicityPolicy;
    expect(sign.originDomain).toMatchObject({
      x: "0<x<=2^-8",
      proveUPositive: true,
      proveNormalizedDerivative: "u_x/x<0",
    });
    expect(sign.interiorDomain).toMatchObject({
      rho: "[1/257,64/(kappa+64)]",
      exactEqualAffineCellCount: 4_096,
      enclosure: "interval_chebyshev_to_bernstein",
      prove: ["u>0", "u_x<0"],
    });
    expect(sign.tailDomain).toMatchObject({
      condition: "kappa*x>=64",
      proveFactoredScalarTailPositive: true,
      proveLogarithmicDerivativeStrictlyNegative: true,
    });
    expect(sign.lambdaZero).toMatchObject({
      limitingGroundStateProfileCertifiedPositiveAndDecreasingSeparately: true,
      physicalVacuumFieldExemptFromStrictPositivity: true,
    });
    expect(sign.uniformAbsolutePositivityMarginRequired).toBe(false);
    expect(sign.established).toBe(false);
  });

  it("freezes x12 origin and z8 tail recurrences and remainders as absent proof duties", () => {
    const origin = CONTRACT.originRecurrenceAndRemainderPolicy;
    expect(origin).toMatchObject({
      finiteRepresentativeThrough: "x^12",
      firstOmittedPower: "x^14",
      analyticRadiusMinimum: "R_o>=2^-4",
      evaluationDomain: "0<=x<=x_o=2^-8",
      normalizedRadius: "z=x/R_o_with_0<=z<=1/16",
      derivativeOrders: [0, 1, 2],
      remainderRule: "abs(R_q^(j)(x))<=C_q*R_o^(-j)*d^j/dz^j[z^14/(1-z^2)]",
      recurrenceExpressionsPresent: false,
      majorantConstantsPresent: false,
      established: false,
    });
    expect(origin.recurrenceForEveryNGreaterThanOrEqualToZero).toHaveLength(4);

    const tail = CONTRACT.tailRecurrenceAndRemainderPolicy;
    expect(tail).toMatchObject({
      emittedRepresentative: {
        metricCoefficientRange: "A_n_and_B_n_for_n=1,...,8",
        scalarCorrectionCoefficientRange: "C_n_for_n=0,...,8_with_C_0=1",
        metricSeriesThrough: "z^8",
        scalarCorrectionSeriesThrough: "z^8",
      },
      normalizedRemainderRule: "abs(R_q^(j)(z))<=K_q*d^j/dz^j[z^9/(1-z)]",
      derivativeOrders: [0, 1, 2],
      firstOmittedGeometricFactorUpperBoundAtDomainEdge: "2^-54",
      recurrencePresent: false,
      scratchMetricCoefficientsPresent: false,
      scalarCompatibilityReceiptPresent: false,
      denominatorSeparationReceiptPresent: false,
      majorantProofPresent: false,
      established: false,
    });
  });

  it("regresses the rejected C and C0 scale degeneracy", () => {
    const scale =
      CONTRACT.tailRecurrenceAndRemainderPolicy.scalarScaleNormalization;
    expect(scale).toEqual({
      outerPrincipalAmplitude: "C>0",
      actualOuterPrincipalAmplitude: null,
      exactScalarCorrectionLeadingCoefficient: "C_0=1",
      scalarCorrectionLeadingCoefficientValue: 1,
      C0MayBeAdjusted: false,
      independentCAndC0RescalingAllowed: false,
      noCC0ScaleDegeneracy: true,
      zeroOrNegativeOuterAmplitudeAllowed: false,
    });
    expect(
      CONTRACT.tailRecurrenceAndRemainderPolicy.emittedRepresentative.varphi,
    ).toBe("C*exp(-kappa*x)*x^sigma*(1+sum_n=1^8 C_n*z^n+R_S)");
  });

  it("regresses missing non-emitted A9 and B9 before the KG C8 diagonal", () => {
    expect(
      CONTRACT.tailRecurrenceAndRemainderPolicy.emittedRepresentative
        .exactAlgebraicMetricCoefficients,
    ).toEqual({
      A_n: "-2*q^n/n_for_odd_n_and_0_for_even_n",
      B_n: "2*(-1)^(n+1)*q^n/n",
    });
    expect(
      CONTRACT.tailRecurrenceAndRemainderPolicy
        .algebraicMetricDiagonalRecurrence,
    ).toEqual({
      massMode: "B_1=M*kappa=2*q_and_A_1=-M*kappa=-2*q",
      BnRow: "2*n*(n-1)*B_n+sum_(i+j=n)_i*j*B_i*B_j=0",
      AnBnRow: "n^2*(A_n+B_n)+sum_(i+j=n)_i*j*A_i*A_j=0",
      diagonalRowOrder: ["BnRow", "AnBnRow"],
      diagonalUnknownOrder: ["B_n", "A_n"],
      diagonalRange: "n=2,...,9",
      diagonalDeterminant: "+2*n^3*(n-1)",
      diagonalDeterminantNonzeroForEveryRequiredN: true,
      scalarStressTreatment:
        "exponentially_flat_at_z=0_and_not_part_of_algebraic_metric_coefficient_rows",
    });
    const scratch =
      CONTRACT.tailRecurrenceAndRemainderPolicy
        .internalNonEmittedMetricProofScratch;
    expect(scratch).toEqual({
      exactCoefficientNames: ["A_9", "B_9"],
      exactCoefficientCount: 2,
      generatedFrom:
        "exact_coefficient_extraction_from_frozen_Et_t_and_Etheta_theta_Einstein_rows",
      generatedBefore: "Klein_Gordon_C_8_diagonal_from_z^9",
      exactScratchValues: {
        A_9: "-2*q^9/9",
        B_9: "2*q^9/9",
      },
      includedInEmittedMetricRepresentative: false,
      mustBeBoundByFutureProofReceipt: true,
      futureProofReceiptBinding: null,
      missingEitherCoefficientDisposition: "fail_candidate",
    });
    const chronology =
      CONTRACT.tailRecurrenceAndRemainderPolicy
        .scalarCompatibilityAndDiagonalChronology;
    expect(chronology.leadingExponentialCompatibility).toEqual({
      exactKleinGordonCoefficient: "z^0",
      condition: "kappa^2=1-w^2_with_kappa>0",
    });
    expect(chronology.leadingPowerCompatibility).toEqual({
      exactKleinGordonCoefficient: "z^1",
      condition: "sigma=M*(2*w^2-1)/kappa-1",
    });
    expect(chronology.C0Role).toBe(
      "exact_normalization_C_0=1_not_a_diagonal_unknown",
    );
    expect(chronology.exactDifferentialOperator).toBe(
      "L_sigma(S)=(-1+sigma*z)*S-z^2*dS/dz",
    );
    expect(chronology.exactScalarDiagonal).toBe("2*kappa^2*n");
    expect(chronology.exactScalarDiagonalRange).toBe("n=1,...,8");
    expect(chronology.scalarDiagonalNonzeroWhenKappaStrictlyPositive).toBe(
      true,
    );
    expect(chronology.recurrenceRule).toBe(
      "for_n=1,...,8_extract_exact_Klein_Gordon_coefficient_z^(n+1)_and_solve_only_for_C_n_after_required_metric_coefficients_through_A_(n+1)_and_B_(n+1)_are_available",
    );
    expect(chronology.exactChronology.slice(-3)).toEqual([
      "generate_internal_non_emitted_A_9_and_B_9_from_exact_frozen_Einstein_coefficient_rows",
      "bind_A_9_and_B_9_in_future_proof_receipt_before_the_C_8_diagonal",
      "solve_C_8_from_exact_Klein_Gordon_z^9_only_after_A_9_and_B_9_are_bound",
    ]);
    expect(chronology.futureCompatibilityAndDiagonalReceiptBinding).toBeNull();
  });

  it("regresses the positive metric determinant for the frozen row and unknown order", () => {
    const recurrence =
      CONTRACT.tailRecurrenceAndRemainderPolicy
        .algebraicMetricDiagonalRecurrence;
    expect(recurrence.diagonalRowOrder).toEqual(["BnRow", "AnBnRow"]);
    expect(recurrence.diagonalUnknownOrder).toEqual(["B_n", "A_n"]);
    expect(recurrence.diagonalDeterminant).toBe("+2*n^3*(n-1)");
    for (let n = 2; n <= 9; n += 1) {
      expect(2 * n ** 3 * (n - 1)).toBeGreaterThan(0);
    }
  });

  it("regresses kappa mass q signs bounds and strict tail separation duties", () => {
    const domain =
      CONTRACT.tailRecurrenceAndRemainderPolicy.parameterAndDomainClosure;
    expect(domain).toEqual({
      frequency: "0<w<1",
      kappa: "kappa=sqrt(1-w^2)>0",
      admMass: "M=-F0[x^-1]=F1[x^-1]>0",
      coulombParameter: "q=M*kappa/2",
      coulombParameterDomain: "0<q<64",
      normalizedInverseRadius: "z=(kappa*x)^-1",
      tailDomain: "0<z<=1/64",
      exactDomainConsequence: "0<q*z<1_and_1-q*z>0",
      schwarzschildCoordinateSingularity: "q*z=1",
      schwarzschildCoordinateSingularityOutsideTailDomain: true,
      everyScalarDiagonalDenominatorMustExcludeZero: true,
      everyCoordinateOrPrefactorSingularityMustBeSeparatedFromDomain: true,
      candidateSpecificStrictIntervalSeparationRequired: true,
      domainBoundsAloneMayStandInForSeparationReceipt: false,
      actualParameterTuple: null,
      futureDenominatorAndSingularitySeparationReceipt: null,
      lambdaZeroIncludedInThisTailChart: false,
      lambdaZeroDisposition:
        "covered_only_by_separate_desingularized_limiting_proof_because_kappa=0_makes_z_undefined_and_scalar_diagonals_vanish",
    });
    expect(
      CONTRACT.tailRecurrenceAndRemainderPolicy
        .scalarCompatibilityAndDiagonalChronology
        .everyDiagonalDenominatorMustHaveStrictIntervalSeparationFromZero,
    ).toBe(true);
  });

  it("regresses the exact second x derivative and complete scalar-prefactor rule", () => {
    const derivatives =
      CONTRACT.tailRecurrenceAndRemainderPolicy.physicalXDerivativeOperators;
    expect(derivatives).toEqual({
      first: "d/dx=-kappa*z^2*d/dz",
      second: "d2/dx2=kappa^2*(z^4*d2/dz2+2*z^3*d/dz)",
      applyToMetricRemainders: true,
      applyToCompleteScalarPrefactorPlusSeries:
        "C*exp(-kappa*x)*x^sigma*(1+sum_n=1^8 C_n*z^n+R_S)",
      completeScalarFirstDerivativeMustUse: "kappa*L_sigma",
      completeScalarSecondDerivativeMustUse: "kappa^2*L_sigma^2",
      differentiatingOnlyNormalizedScalarCorrectionIsForbidden: true,
    });
  });

  it("keeps Newton residual constraint terminal and continuum replay gates separate", () => {
    const gates = CONTRACT.separateResidualAndConstraintGatePolicy;
    expect(gates.residualAndConstraintGatesAreSeparate).toBe(true);
    expect(gates.retainedNewtonGates).toMatchObject({
      solvedResidualLinfMaximum: {
        exact: "2^-40",
        value: 2 ** -40,
        binary64Word: "3d70000000000000",
      },
      scaledAcceptedStepLinfMaximum: {
        exact: "2^-42",
        value: 2 ** -42,
        binary64Word: "3d50000000000000",
      },
      consecutiveAcceptedFullPassCount: 2,
      unchangedFromBoundFiniteNewtonPolicy: true,
    });
    expect(
      gates.everyAmplitudeStageEveryGridUnusedConstraintGate,
    ).toMatchObject({
      row: "unused_Ex_x",
      normalizedLinfMaximum: {
        exact: "2^-28",
        value: 2 ** -28,
        binary64Word: "3e30000000000000",
      },
    });
    expect(gates.terminalN256IndependentReplayGates).toMatchObject({
      normalizedSolvedRowLinfMaximum: { exact: "2^-36" },
      normalizedUnusedExXConstraintLinfMaximum: { exact: "2^-32" },
      normalizedEndpointBoundaryRowLinfMaximum: { exact: "2^-36" },
    });
    expect(gates.continuumIntervalReplayOfTerminalInterpolant).toMatchObject({
      cover: "origin_interior_tail",
      normalizedSolvedRowLinfMaximum: { exact: "2^-32" },
    });
    expect(gates.observedGateValues).toBeNull();
    expect(gates.residualGatePassed).toBe(false);
    expect(gates.constraintGatePassed).toBe(false);
  });

  it("fails fixed-policy violations without retry retune fallback or same-version edits", () => {
    expect(CONTRACT.fixedFailureAndVersioningPolicy).toEqual({
      firstGridNewtonProjectionConvergenceProofResidualOrConstraintFailureStopsCandidate: true,
      retryAllowed: false,
      retuneAllowed: false,
      toleranceChangeAllowed: false,
      scheduleChangeAllowed: false,
      adaptiveFallbackAllowed: false,
      alternateGridAllowed: false,
      alternateInitializerAllowed: false,
      branchSwitchAllowed: false,
      publicOverrideAllowed: false,
      anyPolicyChangeRequiresNewContractVersion: true,
      failedCandidateMayNotBeRelabeledAsPassing: true,
    });
  });

  it("keeps all programs sources receipts instances readiness lamps and claims null or false", () => {
    expect(
      Object.values(CONTRACT.missingImplementationAndProofBindings),
    ).toEqual(
      Array(
        Object.keys(CONTRACT.missingImplementationAndProofBindings).length,
      ).fill(null),
    );
    expect(Object.values(CONTRACT.actualInstances)).toEqual(
      Array(Object.keys(CONTRACT.actualInstances).length).fill(null),
    );
    expect(
      Object.values(CONTRACT.authorityLocks).every((value) => !value),
    ).toBe(true);
    expect(CONTRACT.candidateAndClaimBoundary).toEqual({
      sourceMode: "state_derived_not_declared_lever",
      declaredLeverTensorUsed: false,
      declaredTileTensorUsed: false,
      candidateAdmittedInstanceCount: 0,
      policyDefinitionIsCandidatePassEvidence: false,
      policyDefinitionIsPhysicalViabilityEvidence: false,
      policyDefinitionMayUnlockPropulsionOrTransportClaims: false,
    });
    expect(CONTRACT.authorityLocks).toMatchObject({
      executionAuthorized: false,
      executionObserved: false,
      primaryReplayReady: false,
      independentReplayReady: false,
      pairAgreementObserved: false,
      diagnosticPass: false,
      stressNoiseLamp: false,
      constraintAlgebraLamp: false,
      theoryGraphLamp: false,
      physicalViability: false,
      propulsion: false,
      transport: false,
    });
    recursivelyExpectFrozen(CONTRACT);
  });

  it("matches the exact literals frozen after independent P2 acknowledgement", () => {
    const semantic = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    const plain = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(semantic).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_SEMANTIC_SHA256,
    );
    expect(plain).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_PLAIN_CANONICAL_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_SEMANTIC_SHA256,
    ).toBe(semantic);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    ).toBe(plain);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_after_independent_parent_acknowledgement_of_P2_determinant_metadata_repair_before_candidate_execution",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
    ).toMatchObject({
      semanticSha256: semantic,
      plainCanonicalSha256: plain,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_SIZE_BYTES,
      observedRawBinding: null,
      literalSealStatus:
        "sealed_after_independent_parent_acknowledgement_of_P2_determinant_metadata_repair_before_candidate_execution",
    });
  });

  it("validates only bounded primitive canonical JSON without observing hostile traps", () => {
    const canonical =
      cloneNhm2SphericalBosonStarV2BranchSelectionNumericsV1CanonicalWire();
    expect(canonical).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_CANONICAL_JSON,
    );
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(
        canonical,
      ),
    ).toEqual([]);
    expect(
      isNhm2SphericalBosonStarV2BranchSelectionNumericsV1Wire(canonical),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(
        `${canonical} `,
      ),
    ).toEqual([
      "spherical_v2_branch_selection_numerics_v1_canonical_wire_mismatch",
    ]);

    let trapObserved = false;
    const hostile = new Proxy(
      {},
      {
        get: () => {
          trapObserved = true;
          throw new Error("must_not_observe_get_trap");
        },
        ownKeys: () => {
          trapObserved = true;
          throw new Error("must_not_observe_own_keys_trap");
        },
        getPrototypeOf: () => {
          trapObserved = true;
          throw new Error("must_not_observe_prototype_trap");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(hostile),
    ).toEqual([
      "spherical_v2_branch_selection_numerics_v1_wire_must_be_primitive_string",
    ]);
    expect(trapObserved).toBe(false);
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(
        new String(canonical),
      ),
    ).toEqual([
      "spherical_v2_branch_selection_numerics_v1_wire_must_be_primitive_string",
    ]);

    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_VALIDATOR_LIMITS;
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(
        "x".repeat(limits.maximumWireUtf16CodeUnits + 1),
      ),
    ).toEqual(["spherical_v2_branch_selection_numerics_v1_wire_utf16_limit"]);
    expect(
      nhm2SphericalBosonStarV2BranchSelectionNumericsV1WireViolations(
        "é".repeat(Math.floor(limits.maximumWireUtf8Bytes / 2) + 1),
      ),
    ).toEqual(["spherical_v2_branch_selection_numerics_v1_wire_utf8_limit"]);
  });
});
