import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_mean_rset_anomaly_reduction" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_mean_rset_anomaly_reduction/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SHA256 =
  "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SIZE_BYTES =
  20280 as const;

// Literal drift pins deliberately remain outside the canonical bytes.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SHA256 =
  "bd48fb363243a493c249d30b1eae01facdb32901970e605eb1e391b367020fea" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SIZE_BYTES =
  10788 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SHA256 =
  "23407c8531145652f7ffd7100612268570f3f67d9f3a1897bb5de07ba48563ce" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SIZE_BYTES =
  11125 as const;

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

const assertExactUpstreamBinding = (
  label: string,
  value: unknown,
  expectedSha256: string,
  expectedSizeBytes: number,
  reportedSha256?: string,
  reportedSizeBytes?: number,
): void => {
  const actual = canonicalBinding(value);
  if (
    actual.sha256 !== expectedSha256 ||
    actual.sizeBytes !== expectedSizeBytes ||
    (reportedSha256 != null && reportedSha256 !== expectedSha256) ||
    (reportedSizeBytes != null && reportedSizeBytes !== expectedSizeBytes)
  ) {
    throw new Error(
      `nhm2_mean_rset_anomaly_reduction_${label}_literal_pin_mismatch`,
    );
  }
};

assertExactUpstreamBinding(
  "scalar_reference",
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "observables",
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "mean_convention",
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_BLOCKERS =
  Object.freeze([
    "herzog_huang_source_artifact_bytes_not_vendored_and_locally_hash_verified",
    "cross_source_anomaly_reduction_not_independently_symbolically_verified",
    "formula_transcription_implementation_absent",
    "directed_rounding_interval_or_ball_proof_absent",
    "deterministic_cubature_policy_not_frozen",
    "runtime_evidence_absent",
    "independent_hadamard_implementation_not_executed",
    "independent_formula_agreement_not_established",
    "mean_rset_and_uncertainty_arrays_absent",
    "fixed_background_matter_ward_identity_not_verified",
    "full_gravity_matter_ADM_constraint_algebra_out_of_scope_and_unproved",
    "certificate_ineligible",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_AUTHORITY_LOCKS =
  Object.freeze({
    analyticFormulaExecution: false,
    outputArrayAuthority: false,
    uncertaintyAuthority: false,
    replayAuthority: false,
    certificationAuthority: false,
    physicalViabilityAuthority: false,
  } as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CLAIM_LOCKS =
  Object.freeze({
    executable: false,
    numericallyVerified: false,
    independentlyReproduced: false,
    wardVerified: false,
    certified: false,
    physicallyViable: false,
  } as const);

const CONTENT = {
  schema:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTRACT_VERSION,
  status: "blocked_exact_anomaly_reduction_frozen_execution_unavailable",
  maturity: "diagnostic_contract_only",
  additiveOverlayOnly: true,
  mutatesUpstreamContracts: false,
  upstreamBindings: {
    scalarReference: {
      artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      canonicalization: CANONICALIZATION,
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      exactBindingRequired: true,
    },
    fixedBackgroundObservables: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      canonicalization: CANONICALIZATION,
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
      exactBindingRequired: true,
    },
    meanRsetRenormalizationConvention: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
      canonicalization: CANONICALIZATION,
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
      exactBindingRequired: true,
    },
  },
  notationAndGeometry: {
    spacetimeDimension: 4,
    signature: "(-,+,+,+)",
    chart: "conformal_inertial_chart_X^A",
    metric: "g_AB=Omega^2*eta_AB",
    inverseMetric: "g^AB=Omega^(-2)*eta^AB",
    conformalLog: "omega=ln(Omega)",
    flatDAlambertian: "Box_eta=eta^AB*partial_A*partial_B",
    flatGradientSquare:
      "(partial_omega)^2=eta^AB*partial_A(omega)*partial_B(omega)",
    covariantDAlambertian: "Box_g=g^AB*nabla_A*nabla_B",
    strictlyPositiveOmegaRequired: true,
    staticOmegaRequired: true,
  },
  exactConformalCurvatureReduction: {
    provenanceClass: "project_derivation_from_standard_conformal_geometry",
    ricciTensor:
      "R_AB=-2*partial_A*partial_B(omega)-eta_AB*Box_eta(omega)+2*partial_A(omega)*partial_B(omega)-2*eta_AB*(partial_omega)^2",
    ricciScalar: "R=Omega^(-2)*(-6*Box_eta(omega)-6*(partial_omega)^2)",
    einsteinConsistencyIdentity:
      "G_AB=-2*partial_A*partial_B(omega)+2*partial_A(omega)*partial_B(omega)+2*eta_AB*Box_eta(omega)+eta_AB*(partial_omega)^2",
    indexRaisingForCurvatureContractions: "use_g_inverse_not_eta_inverse",
    runtimeImplementationPresent: false,
  },
  conformalAnomalyTensor: {
    tensorName: "conformalAnomalyK",
    formula:
      "conformalAnomalyK_AB=-R_A^C*R_BC+(2/3)*R*R_AB+(1/2)*g_AB*R_CD*R^CD-(1/4)*g_AB*R^2",
    mixedRicciDefinition: "R_A^C=g^CD*R_AD",
    traceIdentity: "g^AB*conformalAnomalyK_AB=R_AB*R^AB-(1/3)*R^2",
    conformallyFlatConservationIdentity:
      "nabla^A*conformalAnomalyK_AB=0_on_conformally_flat_backgrounds",
    mechanicallyDistinctFromMeanConventionFiniteWaldH3: true,
    equalsMeanConventionFiniteWaldVariationalH3: false,
    historicalH3NameRejected: true,
    rejectedAlias: "H^(3)_AB",
    rejectionReason:
      "historical anomaly notation H^(3) is algebraic and is not the mean convention variational H3 from delta integral sqrt(-g) Riemann^2 / delta g^AB",
    meanConventionVariationalH3Pointer: "content.finiteWaldAmbiguity.H3",
  },
  meanConventionH1: {
    tensorName: "H1",
    formula: "H1_AB=2*nabla_A*nabla_B(R)-2*R*R_AB+g_AB*(-2*Box_g(R)+(1/2)*R^2)",
    traceIdentity: "g^AB*H1_AB=-6*Box_g(R)",
    sourceClass: "exactly_inherited_project_mean_convention",
  },
  reducedMeanRset: {
    formula: "<T_AB>_ren=(conformalAnomalyK_AB-(1/6)*H1_AB)/(2880*pi^2)",
    traceIdentity: "g^AB*<T_AB>_ren=(Box_g(R)+R_AB*R^AB-(1/3)*R^2)/(2880*pi^2)",
    completeOnlyUnderFrozenStateTopologyAndSchemeAssumptions: true,
    traceAnomalyAloneIsInsufficientForGeneralStateOrTopology: true,
    h1TermRole:
      "frozen_type_D_baseline_needed_to_match_the_positive_Box_g_R_mean_convention",
    h1TermIsNewFiniteWaldAmbiguity: false,
    formulaExecutionAuthorized: false,
  },
  sourceAudit: {
    sourceFacts: {
      citationKey: "Herzog_Huang_2013",
      authors: ["Christopher P. Herzog", "Kuo-Wei Huang"],
      title: "Stress Tensors from Trace Anomalies in Conformal Field Theories",
      arxivId: "1301.5002v3",
      remoteLandingUrl: "https://arxiv.org/abs/1301.5002v3",
      remotePdfUrl: "https://arxiv.org/pdf/1301.5002v3",
      equationAnchors: ["Eq.(1)", "Eqs.(5)-(13)", "Eqs.(20)-(23)"],
      coefficientAnchor:
        "page_9_conformally_coupled_scalar_a4_equals_1_over_360",
      scopedFact:
        "the Weyl-flat conformal-vacuum type-A stress tensor is locally determined in the paper's type-D-free scheme",
      sourceBytesLocation: "remote_unvendored",
      sourceArtifactSha256: null,
      sourceArtifactSizeBytes: null,
      sourceBytesVendored: false,
      sourceBytesVerified: false,
      authoritativeSourceBytes: false,
      authorizesFormulaExecution: false,
    },
    projectDerivation: {
      classification:
        "project_cross_source_derivation_not_verbatim_source_fact",
      typeAMapping:
        "Herzog-Huang Eq.(23) with conformal-scalar a4=1/360 maps to conformalAnomalyK_AB/(2880*pi^2)",
      schemeMapping:
        "the pinned mean convention positive Box_g(R) trace is obtained by subtracting H1_AB/6 inside the same 1/(2880*pi^2) normalization",
      independentSymbolicVerificationPresent: false,
      executionAuthority: false,
    },
  },
  uniquenessAssumptions: {
    spacetimeTopology: "R^4",
    globallyConformalToMinkowski: true,
    conformalFactorStrictlyPositiveEverywhere: true,
    geometryRelatedByPureDiffeomorphismPullback: true,
    quantumState: "conformal_Minkowski_vacuum",
    flatSpaceRsetNormalization: "zero",
    boundaryCasimirContribution: "zero",
    topologicalContribution: "zero",
    spontaneousBreakingContribution: "zero",
    additionalStateDependentConservedTracelessTensor: "zero",
    integrationConstantFixedByTheseAssumptions: true,
    assumptionsAreRuntimeVerified: false,
  },
  finiteRenormalizationAndNoDoubleCount: {
    referenceLength: { value: 1, unit: "m", exact: true },
    cosmologicalCountertermCoefficient: 0,
    newtonCountertermCoefficient: 0,
    C1: 0,
    C2: 0,
    C3: 0,
    Theta_AB: "0",
    reductionIsCompleteMeanFormulaUnderAssumptions: true,
    addMorettiImprovedDOneThirdResultAgain: false,
    addDecaniniFolacciT0Again: false,
    addExplicitGv1Again: false,
    addAnotherAnomalyTensorAgain: false,
    allowedMeanPrescription:
      "either_improved_D_one_third_or_Decanini_Folacci_T0_plus_one_explicit_gv1_never_cumulative",
  },
  exactSmearingConvention: {
    oneDimensionalBump:
      "q(u)=exp(-u^2/(1-u^2)) for |u|<1 and q(u)=0 for |u|>=1",
    productBump: "Q(u_x,u_y,u_z)=q(u_x)*q(u_y)*q(u_z)",
    sampleMap: "X_n(u)=(X_n+dx*u_x,Y_n+dy*u_y,Z_n+dz*u_z)",
    integrationDomain: "[-1,1]^3",
    denominator: "D_n=integral_[-1,1]^3 d^3u Q(u)*Omega(X_n(u))^4",
    smearedMeanSI:
      "mean_n,hatAhatB^SI=(hbar*c)*(integral_[-1,1]^3 d^3u Q(u)*Omega(X_n(u))^2*<T_AB>_ren^geom)/D_n",
    tetrad: "e_hatA^A=Omega^(-1)*delta_hatA^A",
    timeFactorCancellation: "exact_for_static_Omega",
    spatialJacobianCancellation: "dx*dy*dz_cancels_exactly",
    pullbackAndTetradCancellation:
      "the_pure_diffeomorphism_pullback_F_and_orthonormal_tetrad_are_algebraically_equivalent_and_cancel_exactly_in_the_frozen_chart_formula",
    individualSmearContainsOneOver64: false,
    campaignWeightOneOver64AppliedAfterIndividualSmears: true,
    centerPointSubstitutionAllowed: false,
    siConversion: {
      formula: "hbar*c=h*c/(2*pi)",
      planckConstant: {
        symbol: "h",
        exactDecimal: "6.62607015e-34",
        unit: "J*s",
        exactBySI: true,
      },
      speedOfLight: {
        symbol: "c",
        exactInteger: "299792458",
        unit: "m/s",
        exactBySI: true,
      },
      roundedHbarLiteralAllowed: false,
    },
  },
  sampleAndComponentStructure: {
    intendedArrayShape: [64, 10],
    componentOrder: [
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33",
    ],
    outputUnit: "J/m^3",
    timeSpaceComponents: {
      T01: "+0",
      T02: "+0",
      T03: "+0",
      reason: "static_geometry_structural_zero_with_parity_consistency",
      numericalToleranceZeroForbidden: true,
    },
    parityUnderSampleSigns: {
      T00: "even",
      T11: "even",
      T12: "sign(sx*sy)",
      T13: "sign(sx*sz)",
      T22: "even",
      T23: "sign(sy*sz)",
      T33: "even",
    },
    absoluteCoordinateMultipliersPerAxis: ["1/5", "1/2"],
    absoluteSampleClassCount: 8,
    fullSignedSampleCount: 64,
    classFormula: "2^3=8_absolute_classes",
  },
  supportAndDenominatorProof: {
    supportSMaximum: "2187/2500",
    supportSMaximumDecimal: "0.8748",
    oneMinusSMinimum: "313/2500",
    oneMinusSMinimumDecimal: "0.1252",
    strictInterior: true,
    centralSubcube: "[-1/2,1/2]^3",
    qLowerBoundPerAxisOnCentralSubcube: "exp(-1/3)",
    productBumpLowerBoundOnCentralSubcube: "exp(-1)",
    centralSubcubeVolume: 1,
    omegaFourthLowerBound: 1,
    denominatorLowerBound: "D_n>=exp(-1)>0",
    divisionByZeroExcludedAnalyticallyUnderFrozenAssumptions: true,
    proofIsRuntimeEvidence: false,
  },
  exactAlgebraFixtures: {
    flatOrConstantOmega: {
      premise: "Omega_is_any_positive_constant",
      omegaDerivatives: "0",
      R_AB: "0",
      R: "0",
      conformalAnomalyK_AB: "0",
      H1_AB: "0",
      meanRset_AB: "0",
      fixtureIsExecutionEvidence: false,
    },
    constantCurvature: {
      premise: "R_AB=(R/4)*g_AB_and_nabla_A(R)=0",
      ricciSquared: "R_AB*R^AB=R^2/4",
      boxR: "0",
      conformalAnomalyK_AB: "-(R^2/48)*g_AB",
      H1_AB: "0",
      meanRset_AB: "-(R^2/(138240*pi^2))*g_AB",
      trace: "-R^2/(34560*pi^2)",
      anomalyTraceCrossCheck: "(R^2/4-R^2/3)/(2880*pi^2)=-R^2/(34560*pi^2)",
      fixtureIsExecutionEvidence: false,
    },
  },
  unresolvedExecutionFreeze: {
    vendoredHerzogHuangSourceArtifact: null,
    locallyVerifiedHerzogHuangSourceHash: null,
    independentSymbolicDerivation: null,
    primaryFormulaExecutor: null,
    independentHadamardExecutor: null,
    deterministicCubaturePolicy: null,
    directedRoundingPolicy: null,
    deterministicUncertaintyPolicy: null,
    meanRsetArray64x10: null,
    uncertaintyArray64x10: null,
    wardEvidence: null,
    replayReceipt: null,
    allFieldsRequiredBeforeExecution: true,
    nullFieldExecutionAllowed: false,
  },
  implementationBoundary: {
    builderPresent: false,
    issuerPresent: false,
    executorPresent: false,
    kernelPresent: false,
    registryEntryPresent: false,
    upstreamMutationPresent: false,
    replayIntegrationPresent: false,
    runtimeReceiptPresent: false,
    certificatePresent: false,
  },
  authority: {
    status: "blocked",
    firstBlocker:
      "herzog_huang_source_artifact_bytes_not_vendored_and_locally_hash_verified",
    blockers: NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_mean_rset_anomaly_reduction_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION;

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
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }
  const stringKeys = keys as string[];
  const forbiddenKey = stringKeys.find((key) => FORBIDDEN_DATA_KEYS.has(key));
  if (forbiddenKey != null) {
    ancestors.delete(value);
    return {
      ok: false,
      violation: `forbidden_data_key:${pointer}/${forbiddenKey}`,
    };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
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
  for (const key of stringKeys) {
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

export const canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson = (
  value: unknown,
): string => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) {
    throw new TypeError(
      `Cannot canonicalize unsafe plain data: ${snapshot.violation}`,
    );
  }
  return canonicalJson(snapshot.value);
};

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CANONICAL_JSON =
  canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION);
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_mean_rset_anomaly_reduction_contract_literal_pin_mismatch",
  );
}

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

export const nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];

  const violations = exactDifferences(
    snapshot.value,
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
  );
  const root = isRecord(snapshot.value) ? snapshot.value : null;
  const content = root != null && isRecord(root.content) ? root.content : null;

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

  const anomaly =
    content != null && isRecord(content.conformalAnomalyTensor)
      ? content.conformalAnomalyTensor
      : null;
  if (
    anomaly == null ||
    anomaly.tensorName !== "conformalAnomalyK" ||
    anomaly.mechanicallyDistinctFromMeanConventionFiniteWaldH3 !== true ||
    anomaly.equalsMeanConventionFiniteWaldVariationalH3 !== false ||
    anomaly.historicalH3NameRejected !== true
  ) {
    violations.push("conformal_anomaly_K_H3_separation_invalid");
  }

  const sourceAudit =
    content != null && isRecord(content.sourceAudit)
      ? content.sourceAudit
      : null;
  const sourceFacts =
    sourceAudit != null && isRecord(sourceAudit.sourceFacts)
      ? sourceAudit.sourceFacts
      : null;
  if (
    sourceFacts == null ||
    sourceFacts.sourceBytesLocation !== "remote_unvendored" ||
    sourceFacts.sourceArtifactSha256 !== null ||
    sourceFacts.sourceArtifactSizeBytes !== null ||
    sourceFacts.sourceBytesVendored !== false ||
    sourceFacts.sourceBytesVerified !== false ||
    sourceFacts.authoritativeSourceBytes !== false ||
    sourceFacts.authorizesFormulaExecution !== false
  ) {
    violations.push("source_audit_authority_invalid");
  }

  const authority =
    content != null && isRecord(content.authority) ? content.authority : null;
  const implementation =
    content != null && isRecord(content.implementationBoundary)
      ? content.implementationBoundary
      : null;
  const claims =
    content != null && isRecord(content.claimLocks) ? content.claimLocks : null;
  if (
    authority == null ||
    authority.status !== "blocked" ||
    authority.firstBlocker !==
      "herzog_huang_source_artifact_bytes_not_vendored_and_locally_hash_verified" ||
    implementation == null ||
    Object.values(implementation).some((entry) => entry !== false) ||
    claims == null ||
    Object.values(claims).some((entry) => entry !== false)
  ) {
    violations.push("blocked_nonexecution_authority_invalid");
  }

  return unique(violations);
};

export const isNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionV1 =>
  nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(value).length ===
  0;
