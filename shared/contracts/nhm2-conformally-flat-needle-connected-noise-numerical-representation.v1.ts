import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_numerical_representation" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_numerical_representation/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 =
  "539ffe78e91f20a93eb1dcdf07f68af26529da4fd1062b7bd336434cea27c336" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES =
  9209 as const;

// Literal drift pins deliberately remain outside the canonical contract bytes.
// They change only through an audited contract revision.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SHA256 =
  "8a2f6f2efaa9a1e0c794619605b731eafeb372db95de0e399a5aefdf24cee739" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SIZE_BYTES =
  16428 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 =
  "e1ce8527fc9bef68d31e76ff122ece1d633400137256e4dc5e7bdd325effbb73" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES =
  16791 as const;

const CANONICALIZATION = "utf8_lexicographic_object_keys_json_v1" as const;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError(
        "Canonical JSON requires finite, non-negative-zero numbers.",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (
    value == null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const canonicalBinding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return Object.freeze({
    canonicalization: CANONICALIZATION,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  });
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const SCALAR_REFERENCE_BINDING = canonicalBinding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
);
if (
  SCALAR_REFERENCE_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SHA256 ||
  SCALAR_REFERENCE_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_scalar_reference_literal_pin_mismatch",
  );
}

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_observables_literal_pin_mismatch",
  );
}

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_distribution_convention_literal_pin_mismatch",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS =
  Object.freeze([
    "required_mean_renormalization_convention_binding_absent",
    "primary_source_artifact_bytes_not_verified",
    "exact_stress_tensor_operator_not_frozen",
    "exact_two_particle_stress_symbol_not_frozen",
    "two_particle_normalization_constant_not_frozen",
    "on_shell_measure_not_frozen",
    "two_particle_symmetry_factor_not_frozen",
    "fourier_transform_convention_not_frozen",
    "distributional_equivalence_proof_not_discharged",
    "certified_fourier_decay_derivative_order_not_frozen",
    "core_and_tail_cutoffs_not_frozen",
    "work_limits_not_frozen",
    "error_tolerances_not_frozen",
    "joint_psd_certificate_scheme_not_frozen",
    "primary_executor_lineage_not_observed",
    "independent_executor_lineage_not_observed",
    "execution_contract_absent",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_AUTHORITY_LOCKS =
  Object.freeze({
    sourceByteAuthority: false as const,
    exactOperatorAuthority: false as const,
    numericalRepresentationAuthority: false as const,
    distributionalEquivalenceAuthority: false as const,
    deterministicErrorAuthority: false as const,
    jointPsdAuthority: false as const,
    meanConventionAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    agreementAuthority: false as const,
    lampAuthority: false as const,
    admConstraintAuthority: false as const,
    physicalClaimAuthority: false as const,
    propulsionAuthority: false as const,
    transportAuthority: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CLAIM_LOCKS =
  Object.freeze({
    representationImplemented: false as const,
    distributionalEquivalenceProved: false as const,
    deterministicErrorCertified: false as const,
    jointPsdCertified: false as const,
    primaryExecutionPass: false as const,
    independentExecutionPass: false as const,
    independentAgreementPass: false as const,
    connectedNoiseDiagnosticPass: false as const,
    fixedBackgroundNoiseLamp: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    admConstraintClosure: false as const,
    hamiltonianConstraintClosure: false as const,
    momentumConstraintClosure: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const UNRESOLVED_EXECUTION_FREEZE = {
  requiredMeanRenormalizationConventionBinding: null,
  primarySourceArtifactByteVerificationSet: null,
  exactStressTensorOperator: null,
  exactTwoParticleStressSymbol: null,
  twoParticleNormalizationConstant: null,
  onShellMeasure: null,
  twoParticleSymmetryFactor: null,
  fourierTransformConvention: null,
  fourierPhaseConvention: null,
  exactSpectralDensityFormula: null,
  distributionalEquivalenceProof: null,
  certifiedFourierDecayDerivativeOrder: null,
  certifiedFourierDerivativeNorms: null,
  primaryCoreDomainCutoff: null,
  independentCoreDomainCutoff: null,
  tailSectorCutoffs: null,
  cubatureRules: null,
  workLimits: null,
  absoluteAndRelativeTolerances: null,
  jointPsdCertificateScheme: null,
  primaryExecutorLineageIdentity: null,
  independentExecutorLineageIdentity: null,
  executionContract: null,
  executorIdentities: null,
  executionReceipt: null,
  replayReceipt: null,
} as const;

const CONTENT = {
  maturity: "stage_2_blocked_numerical_representation_overlay",
  status: "blocked_pending_exact_representation_and_error_freeze",
  executionAdmissible: false,
  upstreamBindings: {
    scalarReference: {
      artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      canonicalSha256: SCALAR_REFERENCE_BINDING.sha256,
      canonicalSizeBytes: SCALAR_REFERENCE_BINDING.sizeBytes,
      canonicalization: CANONICALIZATION,
      exactUpstreamBytesRequired: true,
      semanticSubstitutionAllowed: false,
    },
    fixedBackgroundObservables: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      canonicalization: CANONICALIZATION,
      exactUpstreamBytesRequired: true,
      semanticSubstitutionAllowed: false,
    },
    connectedNoiseDistributionConvention: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
      canonicalization: CANONICALIZATION,
      exactUpstreamBytesRequired: true,
      semanticSubstitutionAllowed: false,
      role: "semantic_distribution_baseline_only",
    },
  },
  requiredMeanConventionBinding: {
    artifactId: null,
    contractVersion: null,
    canonicalSha256: null,
    canonicalSizeBytes: null,
    canonicalization: null,
    bindingAvailable: false,
    requiredBeforeExecution: true,
    runtimeOrConcurrentContractImportAllowedInV1: false,
    nullBindingAuthorizesExecution: false,
  },
  scopeBoundary: {
    fieldTheory: "free_massless_conformally_coupled_real_scalar",
    background: "one_frozen_conformally_flat_needle_candidate",
    observable: "compact_C_infinity_smeared_connected_stress_noise",
    representationRole: "additive_blocked_execution_design_overlay",
    modifiesSemanticDistributionConvention: false,
    fixedBackgroundDiagnosticOnly: true,
    constraintObservable: false,
    fullSemiclassicalBackreaction: false,
  },
  sourceArtifactBoundary: {
    semanticSourceAuditInheritedFromBoundConvention: true,
    sourceArtifactByteVerificationSet: null,
    exactPdfSha256AndSizeRequiredForEverySource: true,
    sourceVersionStringsAloneAuthorizeExecution: false,
    unverifiedSourceBytesAuthorizeExecution: false,
  },
  twoParticleGramRepresentationPlan: {
    representationId: "centered_stress_two_particle_Fock_Gram_v1_plan",
    stateRepresentation: "GNS_Fock_representation_of_the_fixed_quasifree_state",
    smearedCenteredOperatorDefinition: "A_pI=t_hatI(f_p)",
    twoParticleVectorDefinition: "Psi_pI=A_pI*Omega_state",
    connectedNoiseDefinition: "N_pI_qJ=Re(inner_product(Psi_pI,Psi_qJ))",
    formalModeTemplate: "Psi_pI(k,l)=C_stress*P_I(k,l)*Fourier(bar_f_p)(k+l)",
    formalModeTemplateIsSchematicUntilNullFieldsAreFrozen: true,
    ordinaryLocalWickAlgebraProductRequired: true,
    centeredBeforeGramPairing: true,
    realPartImplementsSymmetrization: true,
    uniformRepresentationForEverySampleAndComponentPair: true,
    diagonalObtainedByDistributionPairingNotPointwiseLimit: true,
    evaluatesWightmanSquareAsPointwiseFunction: false,
    positiveSemidefiniteAtExactDistributionLevel: true,
    exactStressTensorOperator: null,
    exactTwoParticleStressSymbol: null,
    twoParticleNormalizationConstant: null,
    onShellMeasure: null,
    twoParticleSymmetryFactor: null,
    fourierTransformConvention: null,
    fourierPhaseConvention: null,
    exactFormulaFrozen: false,
    executionAllowed: false,
  },
  conformalAndUnitsPlan: {
    coordinateNoiseLaw:
      "Omega(x)^(-2)*Omega(y)^(-2)_on_covariant_coordinate_noise",
    tetradNoiseLaw: "Omega(x)^(-4)*Omega(y)^(-4)_on_orthonormal_tetrad_noise",
    omegaAppliedAtEachPointBeforeSmearing: true,
    omegaFactoredAtSmearingCenterAllowed: false,
    volumeFormCancellationToFlatSmear: "required_proof_obligation",
    volumeFormCancellationMayBeAssumedWithoutProof: false,
    siRestoration:
      "multiply_geometric_unit_tetrad_component_pairs_by_(hbar*c)^2_after_projection_and_smearing",
    projectNoiseEqualsFourTimesPhillipsHuNoise: true,
    normalizationCrosswalkMustBeReplayed: true,
    executionAllowed: false,
  },
  supportSeparationLedger: {
    source: "exact_arithmetic_inference_from_bound_scalar_reference",
    sampleCount: 64,
    bumpHalfWidthsM: { cTau: 0.002, dx: 0.01, dy: 0.002, dz: 0.002 },
    combinedPairHalfWidthsM: { X0: 0.004, X: 0.02, Y: 0.004, Z: 0.004 },
    minimumDistinctCenterSeparationM: { X: 0.075, Y: 0.015, Z: 0.015 },
    maximumTemporalCoordinateSeparationM: 0.004,
    minimumResidualSpatialSeparationM: 0.011,
    minimumStrictSpacelikeMarginM: 0.007,
    everyDistinctSamplePairStrictlySpacelike: true,
    distinctOrderedSamplePairs: 4032,
    distinctOrderedComponentPairScalars: 403200,
    sameSampleBlocks: 64,
    sameSampleComponentPairScalars: 6400,
    sameSampleSupportsContainCoincidence: true,
    sameSampleSupportsContainNullRelatedPairs: true,
    everyOneHundredComponentPairInSameSampleBlockRequiresDistributionPairing: true,
    covarianceDimension: 640,
    covarianceMatrixDiagonalVariances: 640,
    sameSampleOffComponentEntriesAreCovariancesNotMatrixDiagonal: true,
    offDiagonalPointSeparationMayReplaceUniformGramRepresentation: false,
    independentLedgerReplayReceipt: null,
    ledgerAloneAuthorizesExecution: false,
  },
  storageMapping: {
    role: "fixed_background_connected_noise_kernel",
    shape: [64, 64, 100],
    axisOrder: [
      "left_sample_ordinal",
      "right_sample_ordinal",
      "tensor_component_pair_ordinal",
    ],
    sampleOrdinalFormula: "p=16*i_z+4*i_y+i_x",
    sampleEnumerationOrder: ["z_outer", "y_middle", "x_inner"],
    xVariesFastest: true,
    componentOrder:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.tensorConvention
        .symmetricTensorComponentOrder,
    pairOrder:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.tensorConvention
        .noiseKernelComponentPairOrder,
    pairOrdinalFormula: "k=10*I+J",
    leftMajorPairOrdering: true,
    flatElementIndexFormula: "((p*64+q)*100+k)",
    byteOffsetFormula: "8*((p*64+q)*100+(10*I+J))",
    encoding: "raw_ieee754_float64_little_endian",
    headerBytes: 0,
    elementCount: 409600,
    elementSizeBytes: 8,
    expectedSizeBytes: 3276800,
    covarianceRowFormula: "r=10*p+I",
    covarianceColumnFormula: "s=10*q+J",
    exchangeTransposeMapping: "[q,p,10*J+I]",
    absoluteUncertainty95UsesIdenticalMapping: true,
    explicitIndexMapReceiptRequiredBeforeExecution: true,
  },
  algorithmPlans: {
    primary: {
      role: "primary",
      implementationId: "anomaly_wess_zumino_arb_spectral_primary",
      representation: "analytic_two_particle_phase_space_pushforward",
      integralDimension: 4,
      integrationDomain: "closed_future_total_momentum_cone",
      plannedIntegral:
        "Re_integral_over_Vplus(conj(Fourier(bar_f_p)(K))*rho_IJ(K)*Fourier(bar_f_q)(K)*d4K)",
      exactSpectralDensityFormula: null,
      arithmeticPlan: "directed_rounding_Arb_ball_arithmetic",
      coreCubatureRule: null,
      tailCertificate: null,
      sourceLineageIdentity: null,
      dependencyLineageIdentity: null,
      executableIdentity: null,
      status: "planned_blocked",
      executionAllowed: false,
    },
    independent: {
      role: "independent",
      implementationId: "hadamard_ad_mpfr_two_particle_independent",
      representation: "direct_unreduced_two_future_mass_shell_pair_integral",
      integralDimension: 6,
      integrationCoordinates: "two_independent_on_shell_spatial_momenta",
      plannedIntegral:
        "Re_integral_dmu(k)_dmu(l)*conj(Psi_pI(k,l))*Psi_qJ(k,l)",
      exactOnShellMeasure: null,
      arithmeticPlan:
        "separate_MPFR_interval_sparse_grid_or_validated_Galerkin",
      coreCubatureRule: null,
      tailCertificate: null,
      sourceLineageIdentity: null,
      dependencyLineageIdentity: null,
      executableIdentity: null,
      status: "planned_blocked",
      executionAllowed: false,
    },
    independentAgreement: {
      comparesSameFrozenMathematicalObservable: true,
      primaryReductionMayBeShared: false,
      generatedStressSymbolMayBeShared: false,
      equationTranscriptionMayBeShared: false,
      sourceFilesMayBeShared: false,
      dependencyGraphMayBeShared: false,
      runtimeMayBeShared: false,
      executableMayBeShared: false,
      intermediateCachesMayBeShared: false,
      onlyFrozenContractAndExactInputBytesMayBeShared: true,
      observedSourceDependencyExecutableHashesRequired: true,
      presealedAgreementTolerance: null,
      agreementReceipt: null,
      executionAllowed: false,
    },
  },
  distributionalEquivalenceProofObligations: {
    status: "undischarged",
    requiredSteps: [
      "represent_the_Moretti_smeared_local_Wick_stress_in_the_fixed_state_GNS_Fock_space",
      "subtract_the_state_mean_and_prove_c_number_shifts_cancel_only_in_the_centered_fluctuation",
      "derive_the_two_particle_vector_from_the_exact_frozen_stress_operator",
      "prove_the_real_Gram_pairing_equals_the_centered_symmetrized_ordinary_algebra_product",
      "prove_the_mass_shell_integral_equals_the_microlocal_boundary_value_distribution_pairing",
      "prove_the_identity_in_D_prime_of_M_times_M_for_all_real_C_c_infinity_test_functions",
      "specialize_only_afterward_to_diagonal_overlapping_and_strictly_spacelike_project_bumps",
      "prove_the_conformal_tetrad_and_volume_form_reduction_without_center_factoring",
      "replay_the_exact_Phillips_Hu_factor_four_crosswalk_and_post_smearing_SI_restoration",
    ],
    diagonalPointwiseLimitAcceptedAsProof: false,
    pointSeparatedAgreementAcceptedAsDiagonalExtensionProof: false,
    numericalRefinementAcceptedAsDistributionalProof: false,
    proofArtifactSha256: null,
    proofArtifactSizeBytes: null,
    independentlyReplayed: false,
    allObligationsDischarged: false,
    executionAllowed: false,
  },
  forbiddenExecutionPaths: {
    positionSpacePointSamplingOfSingularKernelAllowed: false,
    pointwiseWightmanSquareAllowed: false,
    epsilonToZeroSamplingWithoutCertifiedDistributionProofAllowed: false,
    termwisePrincipalValueDeltaDecompositionAllowed: false,
    termwisePrincipalValueDeltaMultiplicationAllowed: false,
    deltaSquaredAllowed: false,
    batesEquation2_11ExecutionAllowed: false,
    batesEquation2_11Role: "semantic_warning_anchor_only",
    independentlyAddedContactTermsAllowed: false,
    regulatorDependentContactTermsAllowed: false,
    pointSeparatedFormulaUsedAsDiagonalRecipeAllowed: false,
  },
  deterministicErrorAndTailPlan: {
    arithmetic: "directed_rounding_interval_or_ball_arithmetic_required",
    bumpDefinitionInheritedExactlyFromScalarReference: true,
    fourierDecayProofMethod:
      "integration_by_parts_with_interval_certified_L1_derivative_norms_or_a_separately_verified_Gevrey_envelope",
    fourierDecayDerivativeOrder: null,
    fourierDerivativeNorms: null,
    exactStressPolynomialDegree: null,
    ultravioletPowerCount: null,
    infraredPowerCount: null,
    requiredTailSectors: [
      "compact_core",
      "simultaneous_large_k_and_l",
      "one_large_k_one_small_l",
      "one_small_k_one_large_l",
      "massless_infrared_near_k_or_l_zero",
      "future_cone_null_boundary",
      "collinear_and_angular_endpoints",
      "bump_normalization_integral",
      "rounding_reduction_and_output_conversion",
    ],
    primaryCoreDomainCutoff: null,
    independentCoreDomainCutoff: null,
    tailSectorCutoffs: null,
    cubatureRules: null,
    maximumAdaptiveCells: null,
    maximumFunctionEvaluations: null,
    maximumWallClockMs: null,
    maximumPrecisionBits: null,
    absoluteToleranceByComponentPair: null,
    relativeToleranceByComponentPair: null,
    presealedBeforeExecution: false,
    postExecutionRetuningAllowed: false,
    refinementDeltaAloneIsProof: false,
    workLimitDisposition: "fail_closed_without_retuning",
    nullNumericalPolicyExecutionAllowed: false,
  },
  deterministicEnclosureAndU95Semantics: {
    centralOutput: "midpoint_of_outward_deterministic_enclosure",
    uncertainty95Output:
      "outward_deterministic_absolute_radius_covering_the_exact_value",
    uncertainty95NameIsLegacyStorageRole: true,
    statisticalConfidenceInterval: false,
    probabilisticSamplingErrorModelUsed: false,
    deterministicCoverageLowerBound: 1,
    simultaneousCoverageOfAll409600EntriesRequired: true,
    entrywiseMarginalCoverageAloneAllowed: false,
    nonnegativeFiniteRadiusRequired: true,
    exactValueMustLieInMidpointPlusOrMinusRadius: true,
    jointCoverageProofArtifact: null,
    semanticsAuthorizeExecutionWithoutProof: false,
  },
  jointPositiveSemidefiniteCertificateRequirements: {
    covarianceDimension: 640,
    analyticGramPositivityProofRequired: true,
    numericalCertificateMustCoverSameJointEnclosures: true,
    fullDimensionCertificateRequiredForPositiveAuthority: true,
    pointwiseUncertainty95AloneSufficient: false,
    GershgorinLowerBoundsMayGrantPositiveAuthority: false,
    absenceOfNegativeWitnessMayGrantPositiveAuthority: false,
    acceptedNegativeAuthority:
      "interval_robust_diagonal_or_two_by_two_Rayleigh_witness_only",
    positiveCertificateScheme: null,
    certificateArtifactSha256: null,
    certificateArtifactSizeBytes: null,
    certificatePresent: false,
    executionAllowedWithoutCertificateScheme: false,
  },
  unresolvedExecutionFreeze: {
    ...UNRESOLVED_EXECUTION_FREEZE,
    allFieldsRequiredBeforeExecution: true,
    nullFieldExecutionAllowed: false,
  },
  implementationBoundary: {
    builderPresent: false,
    issuerPresent: false,
    executorPresent: false,
    replayReceiptPresent: false,
    runContractBinding: null,
    candidatePresealBinding: null,
  },
  authority: {
    status: "blocked",
    firstBlocker: "required_mean_renormalization_convention_binding_absent",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION;

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(
        `Cannot canonicalize unsafe plain data: ${snapshot.violation}`,
      );
    }
    return canonicalJson(snapshot.value);
  };

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_contract_literal_pin_mismatch",
  );
}

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
): SnapshotResult => {
  const at = pointer || "/";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, violation: `nonfinite_number:${at}` };
    }
    if (Object.is(value, -0)) {
      return { ok: false, violation: `negative_zero:${at}` };
    }
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${at}` };
  }
  if (nodeUtilTypes.isProxy(value)) {
    return { ok: false, violation: `proxy_forbidden:${at}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle_forbidden:${at}` };
  }
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
    const stringKeys = keys as string[];
    if (
      stringKeys.length !== value.length + 1 ||
      !stringKeys.includes("length") ||
      stringKeys.some((key) => {
        if (key === "length") return false;
        if (!/^(?:0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index >= value.length;
      })
    ) {
      ancestors.delete(value);
      return { ok: false, violation: `array_keys_invalid:${at}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return {
          ok: false,
          violation: `accessor_sparse_or_hidden_array_entry:${pointer}/${index}`,
        };
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    ancestors.delete(value);
    return { ok: false, violation: `non_plain_object:${at}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    if (FORBIDDEN_DATA_KEYS.has(key)) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `forbidden_data_key:${pointer}/${key}`,
      };
    }
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `accessor_or_hidden_property_forbidden:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
    );
    if (!nested.ok) {
      ancestors.delete(value);
      return nested;
    }
    output[key] = nested.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactDifferences = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    for (
      let index = 0;
      index < Math.min(actual.length, expected.length);
      index += 1
    ) {
      violations.push(
        ...exactDifferences(
          actual[index],
          expected[index],
          `${pointer}/${index}`,
        ),
      );
    }
    return violations;
  }
  if (isRecord(actual) || isRecord(expected)) {
    if (!isRecord(actual) || !isRecord(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
    }
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDifferences(actual[key], expected[key], `${pointer}/${key}`),
        );
      }
    }
    return violations;
  }
  return Object.is(actual, expected) ? [] : [`value_drift:${pointer || "/"}`];
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];
    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
    );
    const root = isRecord(snapshot.value) ? snapshot.value : null;
    const content =
      root != null && isRecord(root.content) ? root.content : null;

    if (content != null) {
      try {
        const actualContentBinding = canonicalBinding(content);
        const declaredContentBinding = isRecord(root?.contentBinding)
          ? root.contentBinding
          : null;
        if (
          declaredContentBinding == null ||
          declaredContentBinding.sha256 !== actualContentBinding.sha256 ||
          declaredContentBinding.sizeBytes !== actualContentBinding.sizeBytes ||
          declaredContentBinding.canonicalization !== CANONICALIZATION
        ) {
          violations.push("content_binding_invalid");
        }
      } catch {
        violations.push("content_binding_invalid");
      }
    } else {
      violations.push("content_binding_invalid");
    }

    const upstream =
      content != null && isRecord(content.upstreamBindings)
        ? content.upstreamBindings
        : null;
    const scalar =
      upstream != null && isRecord(upstream.scalarReference)
        ? upstream.scalarReference
        : null;
    const observables =
      upstream != null && isRecord(upstream.fixedBackgroundObservables)
        ? upstream.fixedBackgroundObservables
        : null;
    const convention =
      upstream != null &&
      isRecord(upstream.connectedNoiseDistributionConvention)
        ? upstream.connectedNoiseDistributionConvention
        : null;
    if (
      scalar?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SHA256 ||
      scalar?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES ||
      observables?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SHA256 ||
      observables?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_OBSERVABLES_EXPECTED_SIZE_BYTES ||
      convention?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 ||
      convention?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES
    ) {
      violations.push("upstream_bindings_invalid");
    }

    const meanBinding =
      content != null && isRecord(content.requiredMeanConventionBinding)
        ? content.requiredMeanConventionBinding
        : null;
    const meanNullKeys = [
      "artifactId",
      "contractVersion",
      "canonicalSha256",
      "canonicalSizeBytes",
      "canonicalization",
    ] as const;
    if (
      meanBinding == null ||
      meanNullKeys.some((key) => meanBinding[key] !== null) ||
      meanBinding.bindingAvailable !== false ||
      meanBinding.nullBindingAuthorizesExecution !== false
    ) {
      violations.push("mean_convention_binding_must_remain_null_and_blocking");
    }

    const sourceBoundary =
      content != null && isRecord(content.sourceArtifactBoundary)
        ? content.sourceArtifactBoundary
        : null;
    if (sourceBoundary?.sourceArtifactByteVerificationSet !== null) {
      violations.push("source_byte_verification_must_remain_null");
    }

    const unresolved =
      content != null && isRecord(content.unresolvedExecutionFreeze)
        ? content.unresolvedExecutionFreeze
        : null;
    const unresolvedKeys = Object.keys(UNRESOLVED_EXECUTION_FREEZE);
    if (
      unresolved == null ||
      unresolvedKeys.some((key) => unresolved[key] !== null) ||
      unresolved.nullFieldExecutionAllowed !== false
    ) {
      violations.push("unresolved_execution_fields_must_remain_null");
    }

    const forbidden =
      content != null && isRecord(content.forbiddenExecutionPaths)
        ? content.forbiddenExecutionPaths
        : null;
    if (
      forbidden == null ||
      Object.entries(forbidden).some(
        ([key, entry]) => key.endsWith("Allowed") && entry !== false,
      )
    ) {
      violations.push("unsafe_distribution_execution_path_forbidden");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const authorityLocks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    if (
      authority == null ||
      authority.status !== "blocked" ||
      authorityLocks == null ||
      Object.values(authorityLocks).some((lock) => lock !== false)
    ) {
      violations.push("authority_must_remain_blocked");
    }

    const claimLocks =
      content != null && isRecord(content.claimLocks)
        ? content.claimLocks
        : null;
    if (
      claimLocks == null ||
      Object.values(claimLocks).some((lock) => lock !== false)
    ) {
      violations.push("claim_locks_must_remain_false");
    }

    const implementation =
      content != null && isRecord(content.implementationBoundary)
        ? content.implementationBoundary
        : null;
    if (
      implementation == null ||
      implementation.builderPresent !== false ||
      implementation.issuerPresent !== false ||
      implementation.executorPresent !== false
    ) {
      violations.push("builder_issuer_executor_must_remain_absent");
    }

    if (content == null || content.executionAdmissible !== false) {
      violations.push("execution_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationV1 =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationV1 =>
    nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationViolations(
      value,
    ).length === 0;
