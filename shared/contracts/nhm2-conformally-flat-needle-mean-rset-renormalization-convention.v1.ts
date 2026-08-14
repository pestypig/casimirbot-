import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_mean_rset_renormalization_convention" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_mean_rset_renormalization_convention/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256 =
  "539ffe78e91f20a93eb1dcdf07f68af26529da4fd1062b7bd336434cea27c336" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES =
  9209 as const;

// These literal pins are deliberately outside the canonical contract bytes.
// They change only through an audited revision of this convention.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SHA256 =
  "ded4ff597c2f5432d6401b3314e55f09a28f091b954b0e4083af0864fc167d24" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES =
  19925 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256 =
  "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES =
  20280 as const;

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
    canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
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
const OBSERVABLES_BINDING = canonicalBinding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
);
const CONNECTED_NOISE_BINDING = canonicalBinding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
);

if (
  SCALAR_REFERENCE_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256 ||
  SCALAR_REFERENCE_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES
) {
  throw new Error("nhm2_mean_rset_scalar_reference_literal_pin_mismatch");
}
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES ||
  OBSERVABLES_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 ||
  OBSERVABLES_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES
) {
  throw new Error("nhm2_mean_rset_observables_literal_pin_mismatch");
}
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES ||
  CONNECTED_NOISE_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256 ||
  CONNECTED_NOISE_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES
) {
  throw new Error("nhm2_mean_rset_connected_noise_literal_pin_mismatch");
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_BLOCKERS =
  Object.freeze([
    "primary_source_artifacts_not_vendored_and_locally_hash_verified",
    "formula_transcriptions_not_implemented",
    "hadamard_recurrence_executor_absent",
    "covariant_coincidence_limit_executor_absent",
    "directed_rounding_interval_or_ball_proof_absent",
    "runtime_evidence_absent",
    "independent_implementation_not_executed",
    "independent_formula_agreement_not_established",
    "mean_rset_and_uncertainty_arrays_absent",
    "fixed_background_matter_ward_identity_not_verified",
    "full_gravity_matter_ADM_constraint_algebra_out_of_scope_and_unproved",
    "certificate_ineligible",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    formulaExecutionAuthority: false as const,
    hadamardRecurrenceAuthority: false as const,
    coincidenceLimitAuthority: false as const,
    intervalProofAuthority: false as const,
    meanRsetOutputAuthority: false as const,
    runtimeEvidenceAuthority: false as const,
    replayAuthority: false as const,
    independentImplementationAuthority: false as const,
    independentAgreementAuthority: false as const,
    lampAuthority: false as const,
    admConstraintAuthority: false as const,
    hamiltonianConstraintAuthority: false as const,
    momentumConstraintAuthority: false as const,
    constraintAlgebraAuthority: false as const,
    physicalClaimAuthority: false as const,
    propulsionAuthority: false as const,
    transportAuthority: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS =
  Object.freeze({
    meanRsetDiagnosticPass: false as const,
    conservationVerified: false as const,
    traceAnomalyVerified: false as const,
    recurrenceExecuted: false as const,
    coincidenceLimitExecuted: false as const,
    intervalProofEstablished: false as const,
    runtimeEvidenceProduced: false as const,
    independentReplayPass: false as const,
    independentAgreementPass: false as const,
    fixedBackgroundMeanRsetLamp: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    admConstraintClosure: false as const,
    hamiltonianConstraintClosure: false as const,
    momentumConstraintClosure: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const PRIMARY_SOURCE_AUDIT = [
  {
    sourceId: "moretti_conserved_stress_tensor",
    sourceVersion: "arXiv:gr-qc/0109048v2",
    revisionDate: "2002-05-14",
    abstractUrl: "https://arxiv.org/abs/gr-qc/0109048v2",
    equationAnchors: [
      "2-3",
      "6",
      "9-10",
      "12-23",
      "44-45",
      "47",
      "52",
      "55-60",
    ],
    auditedUses: [
      "signature_and_Klein_Gordon_operator",
      "G1_equals_real_part_of_Wightman",
      "eta_D_equals_D_over_2_times_D_plus_2",
      "eta_4_equals_one_third_and_restores_conservation",
      "compactly_supported_smooth_smearing",
    ],
    observedRemoteArtifacts: [
      {
        format: "pdf",
        url: "https://arxiv.org/pdf/gr-qc/0109048v2",
        sha256:
          "fb2b3117f435e2a9bfbd85e1761883790ad33bee966b1c35c29ec7c81f57d5c4",
        sizeBytes: 368678,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
      {
        format: "e-print",
        url: "https://arxiv.org/e-print/gr-qc/0109048v2",
        sha256:
          "f28fb4b058978cf95817bc22326dc6e1d41267608f1880cf0773f81fc142425f",
        sizeBytes: 38039,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
    ],
  },
  {
    sourceId: "hack_moretti_hadamard_normalization_and_operator",
    sourceVersion: "arXiv:1202.5107v2",
    revisionDate: "2012-05-24",
    abstractUrl: "https://arxiv.org/abs/1202.5107v2",
    equationAnchors: ["2", "5-9", "Lemma_3", "Theorem_4"],
    auditedUses: [
      "Wightman_Hadamard_form_with_one_over_eight_pi_squared",
      "sigma_epsilon_boundary_value",
      "Hadamard_transport_recurrences",
      "one_sided_Dcan_plus_one_third_gP_operator",
    ],
    observedRemoteArtifacts: [
      {
        format: "pdf",
        url: "https://arxiv.org/pdf/1202.5107v2",
        sha256:
          "93c890f03ac3268b09de2f305d3f36465fa5c48cc717f7d02ff891ee6b640c69",
        sizeBytes: 301586,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
      {
        format: "e-print",
        url: "https://arxiv.org/e-print/1202.5107v2",
        sha256:
          "23cf491c73cfbfd9bd6c4852b29e479fdec1d05fcff1857d6e745b28747b792f",
        sizeBytes: 25840,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
    ],
  },
  {
    sourceId: "decanini_folacci_conserved_baseline_anomaly_and_ambiguity",
    sourceVersion: "arXiv:gr-qc/0512118v2",
    revisionDate: "2008-05-12",
    abstractUrl: "https://arxiv.org/abs/gr-qc/0512118v2",
    equationAnchors: [
      "2-5",
      "21",
      "23",
      "25",
      "61",
      "70",
      "109",
      "111",
      "136-144",
    ],
    auditedUses: [
      "curvature_and_sigma_conventions",
      "independently_conserved_point_split_baseline",
      "v1_and_positive_standard_trace_anomaly",
      "finite_Wald_ambiguity_basis_and_Box_R_scheme_dependence",
    ],
    observedRemoteArtifacts: [
      {
        format: "pdf",
        url: "https://arxiv.org/pdf/gr-qc/0512118v2",
        sha256:
          "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977",
        sizeBytes: 448374,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
      {
        format: "e-print",
        url: "https://arxiv.org/e-print/gr-qc/0512118v2",
        sha256:
          "878e9c9dc98497c49a803fba2d9f401a92b7d650b4f6be1579f3281aca91405b",
        sizeBytes: 42585,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
    ],
  },
  {
    sourceId: "cho_hu_conformal_state_mapping",
    sourceVersion: "arXiv:1407.3907v1",
    revisionDate: "2014-07-15",
    abstractUrl: "https://arxiv.org/abs/1407.3907v1",
    equationAnchors: ["1", "6"],
    auditedUses: [
      "Minkowski_Wightman_boundary_value",
      "four_dimensional_conformal_two_point_mapping",
    ],
    observedRemoteArtifacts: [
      {
        format: "pdf",
        url: "https://arxiv.org/pdf/1407.3907v1",
        sha256:
          "ee3cccfc3c3c3476032afa2aa6a1b356e3d993e51a44eb1704947c8dbb2dfac6",
        sizeBytes: 164590,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
      {
        format: "e-print",
        url: "https://arxiv.org/e-print/1407.3907v1",
        sha256:
          "a6aadd6363c4105c2571ddae2e889d4056dfc249da4f0f2fdc48e9a05905443f",
        sizeBytes: 11844,
        observedOn: "2026-08-12",
        remoteObservationAuditOnly: true,
        localRepoPath: null,
        localBytesVendored: false,
        localHashVerified: false,
        authoritativeSourceBytes: false,
        authorizesFormulaExecution: false,
      },
    ],
  },
] as const;

const CONTENT = {
  maturity: "stage_2_diagnostic_semantic_convention_only",
  status: "blocked_semantic_convention_frozen_execution_unavailable",
  mathematicalConventionResolved: true,
  semanticConventionFrozen: true,
  exactCrossSourceFormulaPacketRecorded: true,
  singleSourceLiteralTranscriptionSafe: false,
  executionAdmissible: false,
  authorityIssuanceAllowed: false,
  upstreamBindings: {
    scalarReference: {
      artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      exactLiteralIdentityRequired: true,
      semanticSubstitutionAllowed: false,
    },
    fixedBackgroundObservables: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      exactLiteralIdentityRequired: true,
      semanticSubstitutionAllowed: false,
    },
    connectedNoiseConvention: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      exactLiteralIdentityRequired: true,
      semanticSubstitutionAllowed: false,
      connectedNoiseDefinitionUnchanged: true,
      projectToPhillipsHuFactorUnchanged: 4,
    },
  },
  scopeBoundary: {
    field: "free_massless_conformally_coupled_real_scalar",
    spacetimeDimension: 4,
    background: "fixed_conformally_flat_needle_reference_only",
    observable: "renormalized_mean_stress_energy_tensor",
    compactSmoothSmearingRequired: true,
    fixedBackgroundDiagnosticOnly: true,
    backreactionSolved: false,
    currentNhm2ShiftLapseMetric: false,
    metricDemandSubstitutionAllowed: false,
    fullGravityMatterConstraintObservable: false,
    physicalNeedleHullInterpretationAllowed: false,
  },
  primarySourceAudit: {
    status: "remote_artifact_hashes_observed_for_audit_not_local_authority",
    sources: PRIMARY_SOURCE_AUDIT,
    sourceVersionsAndEquationAnchorsExplicit: true,
    remoteHashesAreAuditRecordsOnly: true,
    localSourceArtifactSet: null,
    localVendoringComplete: false,
    localHashVerificationComplete: false,
    primarySourceByteBindingsComplete: false,
    sourceAuditAloneAuthorizesExecution: false,
  },
  geometricAndFieldConventions: {
    signature: "(-,+,+,+)",
    dAlembertian: "Box=g^ab*nabla_a*nabla_b",
    kleinGordonOperator: "P=-Box+(1/6)*R",
    fieldEquation: "P*phi=0_equivalently_(Box-(1/6)*R)*phi=0",
    mass: 0,
    curvatureCoupling: "xi=1/6",
    fieldKind: "real_scalar",
    action:
      "S=-(1/2)*integral_d4x_sqrt(-g)*(g^ab*nabla_a(phi)*nabla_b(phi)+(1/6)*R*phi^2)",
    riemannConvention:
      "R^rho_{sigma mu nu}=partial_mu(Gamma^rho_{nu sigma})-partial_nu(Gamma^rho_{mu sigma})+Gamma^rho_{mu lambda}*Gamma^lambda_{nu sigma}-Gamma^rho_{nu lambda}*Gamma^lambda_{mu sigma}",
    ricciConvention: "R_{sigma nu}=R^rho_{sigma rho nu}",
    syngeWorldFunction: "sigma(x,y)=(1/2)*signed_squared_geodesic_distance",
    timelikeSigmaSign: "sigma<0",
    spacelikeSigmaSign: "sigma>0",
    naturalUnitsDuringRenormalization: "hbar=c=1",
  },
  twoPointAndHadamardNormalization: {
    terminologyRule:
      "do_not_use_Hadamard_function_without_stating_Wightman_symmetric_or_anticommutator_normalization",
    wightmanDefinition: "W_plus(x,y)=omega(phi(x)*phi(y))",
    symmetricKernelDefinition:
      "S(x,y)=(1/2)*(W_plus(x,y)+W_plus(y,x))=Re(W_plus(x,y))",
    anticommutatorRelation: "omega({phi(x),phi(y)})=2*S(x,y)",
    morettiG1Relation: "G_Moretti^(1)=S=Re(W_plus)",
    morettiG1IsFullAnticommutator: false,
    relativeFactorAmbiguous: false,
    sigmaEpsilon:
      "sigma_epsilon=sigma+2*i*epsilon*(T(x)-T(y))+epsilon^2_with_epsilon_down_to_0_positive",
    timeFunctionDirection: "T_increases_toward_the_future",
    wightmanParametrix:
      "H_plus_ell=lim_(epsilon_down_to_0)[1/(8*pi^2)]*[u/sigma_epsilon+sum_(n>=0)(v_n*sigma^n*log(sigma_epsilon/ell^2))]",
    symmetricParametrix:
      "H_S_ell(x,y)=(1/2)*(H_plus_ell(x,y)+H_plus_ell(y,x))=Re(H_plus_ell(x,y))",
    smoothSymmetricRemainder: "K_ell=S-H_S_ell",
    decaniniFolacciRemainderRelation:
      "K_ell=W_DF/(8*pi^2)_where_W_DF_is_the_smooth_Hadamard_coefficient_in_DF_Eq70",
    uCoincidenceNormalization: "[u]=1",
    seriesStatus:
      "local_asymptotic_Hadamard_series_with_suitable_cutoffs_required_for_a_distribution",
    operatorActsOnRemainderBeforeCoincidence: true,
  },
  hadamardRecurrences: {
    recurrenceDomain: "geodesically_convex_neighborhood",
    uTransport: "2*u_;mu*sigma^;mu+(Box_x(sigma)-4)*u=0_with_[u]=1",
    v0Transport: "-P_x(u)+2*v0_;mu*sigma^;mu+(Box_x(sigma)-2)*v0=0",
    vnTransport:
      "-P_x(v_n)+2*(n+1)*v_(n+1);mu*sigma^;mu+((n+1)*Box_x(sigma)+2*n*(n+1))*v_(n+1)=0_for_n>=0",
    recurrencesAreFormulaSpecificationOnly: true,
    executableRecurrenceImplementationPresent: false,
  },
  morettiConservedPointSplitPrescription: {
    pointAssignment:
      "unprimed_indices_and_curvature_at_x_primed_indices_at_y_parallel_propagators_join_y_to_x",
    canonicalOperator:
      "Dcan_ab=(2/3)*g_b^{b'}*nabla_a*nabla_{b'}-(1/3)*nabla_a*nabla_b+(1/6)*G_ab+g_ab*((1/3)*Box_x-(1/6)*g^{rho rho'}*nabla_rho*nabla_{rho'})",
    correctionFamily: "D^(eta)_ab=Dcan_ab+eta*g_ab*P_x",
    dimensionFormula: "eta_D=D/(2*(D+2))",
    dimension: 4,
    etaNumerator: 1,
    etaDenominator: 3,
    conservedOperator: "D^(1/3)_ab=Dcan_ab+(1/3)*g_ab*P_x",
    conservationCorrectionRequired: true,
    correctionClassicallyVanishesOnShell: true,
    meanFormula: "<T_ab>_ell=[D^(1/3)_ab*K_ell]+Theta_ab",
    coincidenceRule:
      "square_brackets_mean_covariant_coincidence_limit_after_all_bidifferential_operations",
    conservationIdentity: "nabla^a(<T_ab>_ell)=0",
    conservationIdentitySpecifiedNotRuntimeVerified: true,
  },
  decaniniFolacciIndependentCrosscheck: {
    canonicalPointSplitOperator:
      "T0_ab=(2/3)*g_b^{b'}*nabla_a*nabla_{b'}-(1/6)*g_ab*g^{c d'}*nabla_c*nabla_{d'}-(1/3)*g_a^{a'}*g_b^{b'}*nabla_{a'}*nabla_{b'}+(1/3)*g_ab*Box_x+(1/6)*G_ab",
    v1: "v1=(1/720)*(Box(R)-R_cd*R^cd+R_cdef*R^cdef)",
    meanFormula: "<T_ab>_ell=[T0_ab*K_ell]+(1/(4*pi^2))*g_ab*v1+Theta_ab",
    pkCoincidenceIdentity: "[P_x*K_ell]=(3/(4*pi^2))*v1",
    exactEquivalence: "[D^(1/3)_ab*K_ell]=[T0_ab*K_ell]+(1/(4*pi^2))*g_ab*v1",
    crosscheckStatus: "formula_level_cross_source_identity_not_executed",
    noDoubleCountRule:
      "use_either_the_improved_D^(1/3)_formula_or_the_DF_T0_plus_explicit_g_ab_v1_formula_never_add_explicit_g_ab_v1_to_D^(1/3)",
    explicitV1TermAddedToImprovedOperator: false,
    cumulativeUseOfBothPrescriptionsAllowed: false,
  },
  traceAnomaly: {
    generalFourDimensional:
      "<T^a_a>=(1/(2880*pi^2))*(Box(R)-R_ab*R^ab+R_abcd*R^abcd)",
    conformallyFlatCurvatureIdentity: "R_abcd*R^abcd=2*R_ab*R^ab-(1/3)*R^2",
    conformallyFlat: "<T^a_a>=(1/(2880*pi^2))*(Box(R)+R_ab*R^ab-(1/3)*R^2)",
    anomalySign: "positive_v1_over_4_pi_squared",
    stateIndependent: true,
    boxRCoefficientSchemeDependent: true,
    ricciSquaredAndRiemannSquaredCoefficientsSchemeIndependent: true,
    runtimeTraceVerificationPresent: false,
  },
  finiteWaldAmbiguity: {
    functionalDerivativeConvention:
      "Hk_ab=(1/sqrt(-g))*delta_with_respect_to_g^ab_of_the_named_curvature_action",
    H1: {
      action: "integral_d4x_sqrt(-g)*R^2",
      formula: "H1_ab=2*nabla_a*nabla_b(R)-2*R*R_ab+g_ab*(-2*Box(R)+(1/2)*R^2)",
    },
    H2: {
      action: "integral_d4x_sqrt(-g)*R_cd*R^cd",
      formula:
        "H2_ab=nabla_a*nabla_b(R)-Box(R_ab)-2*R^cd*R_cadb+g_ab*(-(1/2)*Box(R)+(1/2)*R_cd*R^cd)",
    },
    H3: {
      action: "integral_d4x_sqrt(-g)*R_cdef*R^cdef",
      formula:
        "H3_ab=2*nabla_a*nabla_b(R)-4*Box(R_ab)+4*R_a^c*R_cb-4*R^cd*R_cadb-2*R_a^cde*R_bcde+(1/2)*g_ab*R_cdef*R^cdef",
    },
    gaussBonnetIdentity: "H1_ab-4*H2_ab+H3_ab=0_in_four_dimensions",
    generalMasslessAmbiguity: "Theta_ab=C1*H1_ab+C2*H2_ab+C3*H3_ab",
    ambiguityTrace: "g^ab*Theta_ab=(-6*C1-2*C2-2*C3)*Box(R)",
    conformalMasslessScaleShift:
      "Delta_ell<T_ab>=log(M^2)/(4*pi)^2*((-1/180)*H2_ab+(1/180)*H3_ab)_with_the_source_scale_parameterization",
    conformalMasslessScaleShiftTrace: 0,
    projectChoice: {
      choiceKind: "project_renormalization_choice_not_source_fact",
      referenceLength: { symbol: "ell", value: 1, unit: "m", exact: true },
      gaussBonnetEliminatedTensor: "H3",
      cosmologicalCountertermCoefficient: 0,
      newtonCountertermCoefficient: 0,
      C1: 0,
      C2: 0,
      C3: 0,
      thetaFormulaAtReferenceLength: "Theta_ab=0",
      boxRScheme:
        "Decanini_Folacci_v2_Eq111_unshifted_plus_BoxR_coefficient_at_ell_1_m",
      unnamedFiniteCountertermsAllowed: false,
      zeroMeaning:
        "chosen_finite_renormalization_convention_not_absence_of_Wald_ambiguity",
    },
  },
  conformalStateMapping: {
    stateId: "conformal_minkowski_vacuum",
    stateClass: "pulled_back_quasifree_Hadamard_state",
    geometryRelation: "g=F^*(Omega^2*eta)_with_Omega_strictly_positive",
    scalarFieldConformalWeight: "phi_g(x)=Omega(F(x))^(-1)*phi_eta(F(x))",
    minkowskiWightman:
      "W0_plus(X,Y)=lim_(epsilon_down_to_0)[1/(4*pi^2)]*[-(Delta_X0-i*epsilon)^2+abs(Delta_X_vector)^2]^(-1)",
    curvedWightman:
      "Wg_plus(x,y)=Omega(F(x))^(-1)*Omega(F(y))^(-1)*W0_plus(F(x),F(y))",
    mappingDefinesState: true,
    dynamicalPreparationClaim: false,
    empiricalStateReceipt: false,
    physicalRealizationClaim: false,
  },
  compactSmoothSmearingAndUnits: {
    testFunctionSpace: "C_c^infinity(M,real)",
    smearingId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing
        .smearingId,
    physicalTestFunction:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing
        .physicalTestFunction,
    normalization:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing
        .pullbackNormalizationIdentity,
    componentSmearing:
      "<T_hatAhatB[f]>=integral_M(dmu_g*f*e_hatA^a*e_hatB^b*<T_ab>)",
    pointValueSubstitutionAllowed: false,
    centerValueSubstitutionAllowed: false,
    meanGeometricDimension: "length^(-4)",
    meanSiRestoration:
      "multiply_final_geometric_unit_tetrad_components_by_hbar*c_to_obtain_J_per_m^3",
    connectedNoiseSiRestorationUnchanged:
      "multiply_final_geometric_unit_tetrad_component_pairs_by_(hbar*c)^2",
  },
  connectedNoiseBoundary: {
    definitionUnchanged:
      "N_project=(1/2)*omega(anticommutator(t,t))_with_t=T-omega(T)*1",
    projectToPhillipsHuRelationUnchanged: "N_project=4*N_PH",
    cNumberRenormalizationShiftCancelsOnlyAfterCentering: true,
    meanLocalTermsMayBeDroppedBecauseNoiseIsConnected: false,
    thisConventionSelectsConnectedNoiseExecution: false,
  },
  sourceDefectLedger: [
    {
      defectId: "moretti_v2_equation_10_eta_bracket_placement",
      sourceVersion: "arXiv:gr-qc/0109048v2",
      anchor: "Eq10_crosschecked_against_Eq9_and_Theorem2.1",
      defect:
        "the_TeX_places_eta*g_ab*(P_x+P_y)/2_inside_the_xi_bracket_even_though_eta_is_independent_of_xi",
      frozenResolution:
        "place_eta*g_ab*(P_x+P_y)/2_outside_the_xi_bracket_and_use_eta_4=1/3",
      literalSourceTranscriptionAllowed: false,
      executableResolutionImplemented: false,
    },
    {
      defectId: "moretti_v2_equations_44_45_curvature_terms",
      sourceVersion: "arXiv:gr-qc/0109048v2",
      anchor: "Eqs44-45_crosschecked_against_Eq2",
      defect:
        "Eq44_contains_an_extraneous_minus_one_half_gXY_R_phi_squared_term_and_Eq45_prints_R_plus_m_squared_instead_of_xi_R_plus_m_squared",
      frozenResolution:
        "use_P=-Box+xi*R+m^2_and_the_Eq9_Eq10_Theorem2.1_operator_lineage",
      literalSourceTranscriptionAllowed: false,
      executableResolutionImplemented: false,
    },
    {
      defectId: "hack_moretti_v2_equation_9_parametrix_prefactor",
      sourceVersion: "arXiv:1202.5107v2",
      anchor: "Definition2_Eq5_crosschecked_against_Eq9",
      defect:
        "Definition2_sets_W_plus=(h_epsilon+w)/(8*pi^2)_while_Eq9_prints_subtraction_of_unscaled_h_epsilon",
      frozenResolution:
        "subtract_H_plus=h_epsilon/(8*pi^2)_from_W_plus_and_symmetrize_consistently",
      literalSourceTranscriptionAllowed: false,
      executableResolutionImplemented: false,
    },
    {
      defectId: "hack_moretti_v2_theorem_4_trace_sign",
      sourceVersion: "arXiv:1202.5107v2",
      anchor:
        "Theorem4_crosschecked_against_Lemma3_D_plus_one_third_gP_and_DF_Eqs109_111",
      defect:
        "Theorem4_prints_minus_v1_over_4_pi_squared_in_conflict_with_the_operator_and_independent_DF_baseline",
      frozenResolution:
        "use_plus_v1_over_4_pi_squared_and_the_DF_Eq111_trace_anomaly",
      literalSourceTranscriptionAllowed: false,
      executableResolutionImplemented: false,
    },
  ],
  upstreamCompatibilityLedger: {
    scalarReferenceConservationCoefficientWasNull: true,
    frozenOverlayCoefficient: "eta_4=1/3",
    scalarReferenceIFormulaSignMismatch:
      "the_current_I_candidate_is_minus_H1_relative_to_its_declared_inverse_metric_functional_derivative",
    frozenOverlayBasis: "H1_H2_with_H3_eliminated_by_Gauss_Bonnet",
    upstreamFilesMutatedByThisConvention: false,
    additiveOverlayOnly: true,
  },
  unresolvedExecutionFreeze: {
    localSourceArtifactPathSet: null,
    locallyVerifiedSourceArtifactHashSet: null,
    formulaTranscriptionImplementation: null,
    hadamardRecurrenceExecutor: null,
    coincidenceLimitExecutor: null,
    directedRoundingIntervalOrBallProof: null,
    truncationAndRoundoffBudget: null,
    runtimeEvidence: null,
    independentImplementationReceipt: null,
    independentAgreementReceipt: null,
    meanRsetOutput: null,
    meanRsetUncertaintyOutput: null,
    matterWardIdentityReceipt: null,
    admConstraintReceipt: null,
    physicalReceipt: null,
    propulsionReceipt: null,
    transportReceipt: null,
    certificate: null,
    sourceBytesLocallyVendored: false,
    sourceHashesLocallyVerified: false,
    formulaImplementationComplete: false,
    recurrenceExecutionComplete: false,
    coincidenceExecutionComplete: false,
    intervalProofComplete: false,
    runtimeEvidenceComplete: false,
    independentAgreementComplete: false,
    nullFieldExecutionAllowed: false,
  },
  authority: {
    status: "blocked",
    firstBlocker:
      "primary_source_artifacts_not_vendored_and_locally_hash_verified",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_mean_rset_content_literal_pin_mismatch:${CONTENT_BINDING.sha256}:${CONTENT_BINDING.sizeBytes}`,
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_mean_rset_contract_literal_pin_mismatch:${NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256}:${NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES}`,
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

export const canonicalNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(snapshot.violation);
    }
    return canonicalJson(snapshot.value);
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

export const nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];
    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
    );
    const root = isRecord(snapshot.value) ? snapshot.value : null;
    const content =
      root != null && isRecord(root.content) ? root.content : null;

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
    const noise =
      upstream != null && isRecord(upstream.connectedNoiseConvention)
        ? upstream.connectedNoiseConvention
        : null;
    if (
      scalar?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SHA256 ||
      scalar?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES ||
      observables?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 ||
      observables?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES ||
      noise?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SHA256 ||
      noise?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONNECTED_NOISE_EXPECTED_SIZE_BYTES
    ) {
      violations.push("upstream_literal_bindings_invalid");
    }

    const sourceAudit =
      content != null && isRecord(content.primarySourceAudit)
        ? content.primarySourceAudit
        : null;
    const sources = Array.isArray(sourceAudit?.sources)
      ? sourceAudit.sources
      : [];
    const artifacts = sources.flatMap((source) => {
      if (!isRecord(source) || !Array.isArray(source.observedRemoteArtifacts)) {
        return [];
      }
      return source.observedRemoteArtifacts;
    });
    if (
      sources.length !== PRIMARY_SOURCE_AUDIT.length ||
      artifacts.length !== 8 ||
      artifacts.some(
        (artifact) =>
          !isRecord(artifact) ||
          artifact.remoteObservationAuditOnly !== true ||
          artifact.localRepoPath !== null ||
          artifact.localBytesVendored !== false ||
          artifact.localHashVerified !== false ||
          artifact.authoritativeSourceBytes !== false ||
          artifact.authorizesFormulaExecution !== false,
      ) ||
      sourceAudit?.localSourceArtifactSet !== null ||
      sourceAudit?.primarySourceByteBindingsComplete !== false
    ) {
      violations.push("source_artifacts_must_remain_remote_audit_only");
    }

    const moretti =
      content != null &&
      isRecord(content.morettiConservedPointSplitPrescription)
        ? content.morettiConservedPointSplitPrescription
        : null;
    const df =
      content != null && isRecord(content.decaniniFolacciIndependentCrosscheck)
        ? content.decaniniFolacciIndependentCrosscheck
        : null;
    if (
      moretti?.etaNumerator !== 1 ||
      moretti?.etaDenominator !== 3 ||
      moretti?.conservationCorrectionRequired !== true ||
      df?.explicitV1TermAddedToImprovedOperator !== false ||
      df?.cumulativeUseOfBothPrescriptionsAllowed !== false
    ) {
      violations.push("conserved_operator_or_no_double_count_rule_invalid");
    }

    const finite =
      content != null && isRecord(content.finiteWaldAmbiguity)
        ? content.finiteWaldAmbiguity
        : null;
    const projectChoice =
      finite != null && isRecord(finite.projectChoice)
        ? finite.projectChoice
        : null;
    if (
      projectChoice == null ||
      projectChoice.C1 !== 0 ||
      projectChoice.C2 !== 0 ||
      projectChoice.C3 !== 0 ||
      projectChoice.cosmologicalCountertermCoefficient !== 0 ||
      projectChoice.newtonCountertermCoefficient !== 0 ||
      projectChoice.thetaFormulaAtReferenceLength !== "Theta_ab=0"
    ) {
      violations.push("finite_renormalization_choice_invalid");
    }

    const unresolved =
      content != null && isRecord(content.unresolvedExecutionFreeze)
        ? content.unresolvedExecutionFreeze
        : null;
    if (
      unresolved == null ||
      Object.entries(unresolved).some(([key, entry]) =>
        key === "nullFieldExecutionAllowed"
          ? entry !== false
          : entry !== null && entry !== false,
      )
    ) {
      violations.push("execution_gaps_must_remain_null_or_false");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const authorityLocks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    if (
      authority?.status !== "blocked" ||
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
    if (
      content?.executionAdmissible !== false ||
      content?.authorityIssuanceAllowed !== false
    ) {
      violations.push("execution_and_authority_issuance_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionV1 =>
  nhm2ConformallyFlatNeedleMeanRsetRenormalizationConventionViolations(value)
    .length === 0;
