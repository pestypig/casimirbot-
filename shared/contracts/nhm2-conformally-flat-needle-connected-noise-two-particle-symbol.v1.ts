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
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_two_particle_symbol" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_two_particle_symbol/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 =
  "539ffe78e91f20a93eb1dcdf07f68af26529da4fd1062b7bd336434cea27c336" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES =
  9209 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256 =
  "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES =
  20280 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 =
  "e1ce8527fc9bef68d31e76ff122ece1d633400137256e4dc5e7bdd325effbb73" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES =
  16791 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256 =
  "11f062d22a66127a3b71c833ea16ff4facf973012203d135bcbdc4bb597610de" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES =
  6473 as const;

// Literal drift pins deliberately remain outside the canonical contract bytes.
// They change only through an audited contract revision.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SHA256 =
  "cb0542a9dcb3e795675f6ffa8464f24898855b35088e8edaf2dc4aa353535fe3" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SIZE_BYTES =
  17672 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SHA256 =
  "5ce5b293559b42b26a1c71dff782aebe5b4daf88ddfcdec131101a3fc4fee57a" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SIZE_BYTES =
  18025 as const;

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

const sameStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

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
      `nhm2_connected_noise_two_particle_symbol_${label}_literal_pin_mismatch`,
    );
  }
};

assertExactUpstreamBinding(
  "scalar_reference",
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "observables",
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "distribution_convention",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "mean_convention",
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "numerical_representation",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
);
assertExactUpstreamBinding(
  "mean_binding",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS =
  Object.freeze([
    "exact_stress_tensor_operator_not_frozen",
    "exact_two_particle_stress_symbol_not_frozen",
    "two_particle_normalization_constant_not_frozen",
    "on_shell_measure_not_frozen",
    "two_particle_symmetry_factor_not_frozen",
    "fourier_transform_convention_not_frozen",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS =
  Object.freeze([
    "primary_source_artifact_bytes_not_verified",
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

const EXPECTED_MEAN_BINDING_BLOCKERS = Object.freeze([
  "primary_source_artifact_bytes_not_verified",
  ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
  ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS.slice(
    1,
  ),
] as const);

if (
  !sameStrings(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    EXPECTED_MEAN_BINDING_BLOCKERS,
  ) ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING
    .content.executionAdmissible !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING
      .content.authority.locks,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING
      .content.claimLocks,
  ).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_two_particle_symbol_mean_binding_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    exactOperatorExecutionAuthority: false as const,
    exactSymbolExecutionAuthority: false as const,
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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CLAIM_LOCKS =
  Object.freeze({
    sourceBytesVerified: false as const,
    executableDistributionalEquivalenceProved: false as const,
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

const upstreamBinding = (
  artifactId: string,
  contractVersion: string,
  canonicalSha256: string,
  canonicalSizeBytes: number,
  role: string,
) => ({
  artifactId,
  contractVersion,
  canonicalSha256,
  canonicalSizeBytes,
  canonicalization: CANONICALIZATION,
  exactUpstreamBytesRequired: true,
  exactIdentityVerifiedAtModuleInitialization: true,
  semanticSubstitutionAllowed: false,
  role,
});

const CONTENT = {
  maturity: "stage_2_blocked_exact_symbol_convention",
  status: "blocked_exact_two_particle_symbol_and_spectral_convention_frozen",
  executionAdmissible: false,
  scopeBoundary: {
    role: "additive_exact_two_particle_stress_symbol_convention_only",
    fieldTheory: "free_massless_conformally_coupled_real_scalar",
    background: "one_frozen_conformally_flat_needle_candidate",
    fixedBackgroundDiagnosticOnly: true,
    modifiesAnyUpstreamContract: false,
    replacesAnyUpstreamContract: false,
    declaredLeverTensorInputAllowed: false,
    metricDemandSubstitutionAllowed: false,
    constraintObservable: false,
    fullSemiclassicalBackreaction: false,
    grantsExecutionAuthority: false,
  },
  upstreamBindings: {
    scalarReference: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      "frozen_geometry_state_smearing_tensor_and_SI_boundary",
    ),
    fixedBackgroundObservables: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES,
      "frozen_tetrad_component_order_and_connected_noise_output_boundary",
    ),
    connectedNoiseDistributionConvention: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
      "centered_local_Wick_distribution_and_project_to_Phillips_Hu_crosswalk",
    ),
    meanRsetRenormalizationConvention: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
      "frozen_mean_RSET_convention_for_centered_fluctuation_boundary",
    ),
    connectedNoiseNumericalRepresentation: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
      "blocked_two_particle_Gram_numerical_design",
    ),
    numericalRepresentationMeanBinding: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES,
      "blocked_exact_mean_binding_overlay_and_inherited_blocker_baseline",
    ),
  },
  provenanceBoundary: {
    status: "source_facts_separated_from_project_derivations",
    sourceFactRecords: [
      {
        factId: "flat_improved_conformal_scalar_stress_formula",
        sourceVersion: "arXiv:2004.08668v2",
        sourceUrl: "https://arxiv.org/abs/2004.08668v2",
        equationAnchors: ["11"],
        sourceFact:
          "flat_improved_real_scalar_stress_tensor_at_conformal_coupling_xi=1/6",
        useInThisContract:
          "formula_reconciled_with_declared_signature_phase_and_normal_ordering_conventions",
        sourceArtifactSha256: null,
        sourceArtifactSizeBytes: null,
        sourceBytesVendored: false,
        sourceBytesVerified: false,
      },
      {
        factId: "Phillips_Hu_noise_normalization_and_stress_construction",
        sourceVersion: "arXiv:gr-qc/0010019v2",
        sourceUrl: "https://arxiv.org/abs/gr-qc/0010019v2",
        equationAnchors: ["22-34", "40"],
        sourceFact:
          "8*N_PH_equals_the_centered_stress_anticommutator_expectation",
        useInThisContract:
          "normalization_crosswalk_only_not_a_pointwise_execution_recipe",
        sourceArtifactSha256: null,
        sourceArtifactSizeBytes: null,
        sourceBytesVendored: false,
        sourceBytesVerified: false,
      },
      {
        factId: "Cho_Hu_conformal_connected_noise_scaling",
        sourceVersion: "arXiv:1407.3907v1",
        sourceUrl: "https://arxiv.org/abs/1407.3907v1",
        equationAnchors: ["1", "6", "17-21"],
        sourceFact:
          "coordinate_covariant_centered_stress_noise_scales_with_one_Omega^-2_factor_per_covariant_stress_at_each_point",
        useInThisContract:
          "derive_tetrad_Omega^-4_scaling_and_exact_smeared_Omega_cancellation",
        sourceArtifactSha256: null,
        sourceArtifactSizeBytes: null,
        sourceBytesVendored: false,
        sourceBytesVerified: false,
      },
      {
        factId: "Bates_centered_symmetrized_noise_definition",
        sourceVersion: "arXiv:1301.2501v1",
        sourceUrl: "https://arxiv.org/abs/1301.2501v1",
        equationAnchors: ["2.1-2.6"],
        sourceFact:
          "connected_noise_is_the_centered_symmetrized_stress_fluctuation_distribution",
        useInThisContract:
          "Gram_inner_product_is_matched_to_the_project_connected_noise_normalization",
        sourceArtifactSha256: null,
        sourceArtifactSizeBytes: null,
        sourceBytesVendored: false,
        sourceBytesVerified: false,
      },
    ],
    everySourceArtifactByteBindingComplete: false,
    sourceAuditAloneAuthorizesExecution: false,
    declaredProjectConventions: [
      "metric_signature_and_index_placement",
      "mode_expansion_phase_and_CCR_normalization",
      "Fourier_transform_pair",
      "symmetric_two_particle_Hilbert_space_normalization",
    ],
    projectDerivedIdentities: [
      "actual_creation_creation_stress_symbol",
      "on_shell_equivalent_symbol_formula",
      "Bose_symmetric_wavefunction_and_factor_two_Gram_form",
      "positive_frequency_LIPS_spectral_tensor",
      "bare_delta_and_standard_LIPS_coefficient_crosswalk",
      "real_smearing_all_cone_density",
      "boundary_safe_polynomial_projector_density",
      "conformal_tetrad_smearing_cancellation",
      "exact_rational_microfixture",
    ],
    projectDerivationsAreDirectPrimarySourceQuotations: false,
    executableIndependentProofStillRequired: true,
  },
  minkowskiAndModeConventions: {
    unitConvention: "hbar=c=1",
    coordinateOrder: ["X0", "X1", "X2", "X3"],
    metricSignature: "(-,+,+,+)",
    etaCovariantDiagonal: [-1, 1, 1, 1],
    dotProduct: "k_dot_X=k_a*X^a=-k^0*X^0+k_vector_dot_X_vector",
    futureNullMomentum: "k^a=(abs(k_vector),k_vector)",
    loweredFutureNullMomentum: "k_a=(-abs(k_vector),k_1,k_2,k_3)",
    fieldExpansion:
      "phi(X)=integral_dmu(k)[a(k)*exp(+i*k_dot_X)+a_dagger(k)*exp(-i*k_dot_X)]",
    onShellMeasure: "dmu(k)=d^3k/((2*pi)^3*2*abs(k_vector))",
    canonicalCommutator:
      "[a(k),a_dagger(l)]=(2*pi)^3*2*abs(k_vector)*delta^3(k_vector-l_vector)",
    annihilationCommutatorZero: true,
    creationCommutatorZero: true,
    minkowskiVacuumCondition: "a(k)|0>=0",
    wightmanFromModeExpansion:
      "W0_plus(X,Y)=integral_dmu(k)*exp(+i*k_dot_(X-Y))",
  },
  fourierConvention: {
    forward: "f_hat(K)=integral_d4X*f(X)*exp(-i*K_dot_X)",
    inverse: "f(X)=integral_d4K/(2*pi)^4*f_hat(K)*exp(+i*K_dot_X)",
    measureInForward: "d4X",
    measureInInverse: "d4K/(2*pi)^4",
    creationCreationSmearingUses: "f_hat(k+l)",
    semanticSubstitutionAllowed: false,
  },
  flatCenteredStressOperator: {
    stressTensor:
      "T_ab=:partial_a(phi)*partial_b(phi)-(1/2)*eta_ab*partial^c(phi)*partial_c(phi)+(1/6)*(eta_ab*Box-partial_a*partial_b)*phi^2:",
    centeredFluctuation: "t_ab=T_ab-<T_ab>*1",
    minkowskiVacuumNormalOrderedMean: "<0|T_ab|0>=0",
    box: "Box=eta^ab*partial_a*partial_b",
    conformalCoupling: "xi=1/6",
    mass: 0,
    operatorConventionFrozen: true,
    formulaExecutionImplemented: false,
  },
  twoParticleStressSymbol: {
    totalMomentum: "K=k+l",
    actualCreationCreationCoefficient:
      "P_ab(k,l)=-(1/2)*(k_a*l_b+l_a*k_b)+(1/2)*eta_ab*(k_dot_l)+(1/6)*(K_a*K_b-eta_ab*K^2)",
    equivalentOnShellFormula:
      "P_ab(k,l)=(1/6)*[k_a*k_b+l_a*l_b-2*(k_a*l_b+l_a*k_b)+eta_ab*(k_dot_l)]",
    equivalenceAssumptions: ["k^2=0", "l^2=0", "K^2=2*k_dot_l", "K=k+l"],
    coefficientIsActualNotTwiceActual: true,
    tensorIndexSymmetry: "P_ab=P_ba",
    BoseExchangeSymmetry: "P_ab(k,l)=P_ab(l,k)",
    transversality: "K^a*P_ab=0",
    tracelessness: "eta^ab*P_ab=0",
    exactSymbolConventionFrozen: true,
    executableAlgebraProofPresent: false,
  },
  twoParticleHilbertSpaceAndGramForm: {
    symmetricState:
      "|psi>=(1/sqrt(2))*integral_dmu(k)*dmu(l)*psi(k,l)*a_dagger(k)*a_dagger(l)|0>",
    wavefunctionSymmetry: "psi(k,l)=psi(l,k)",
    stateInnerProduct:
      "<psi|chi>=integral_dmu(k)*dmu(l)*conjugate(psi(k,l))*chi(k,l)",
    smearedObservable: "A_I[f]=integral_d4X*f_I(X)*t_I(X)",
    vacuumCreatedState:
      "A_I[f]|0>=integral_dmu(k)*dmu(l)*P_I(k,l)*f_hat_I(k+l)*a_dagger(k)*a_dagger(l)|0>",
    exactSymmetricWavefunction: "Psi_I[f](k,l)=sqrt(2)*P_I(k,l)*f_hat_I(k+l)",
    BoseSymmetryFactor: 2,
    projectNoiseGram:
      "N_project(f_I,h_J)=2*Re*integral_dmu(k)*dmu(l)*P_I(k,l)*P_J(k,l)*conjugate(f_hat_I(k+l))*h_hat_J(k+l)",
    normalizationConstant: "sqrt(2)",
    normalizationAndSymmetryFrozen: true,
  },
  tetradComponentConvention: {
    projection: "P_hatAhatB=e_hatA^a*e_hatB^b*P_ab",
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
    rawSymmetricComponentsStored: true,
    frobeniusSqrt2OffDiagonalWeightApplied: false,
    componentPairOrderInheritedFromObservablesExactly: true,
  },
  spectralConvention: {
    invariantDefinitions: {
      s: "s=-K^2",
      timelikeSupport: "theta(K^0)*theta(s)",
      covariantTransverseTensor: "h_ab=eta_ab+K_a*K_b/s",
      spinTwoProjector: "Pi_abcd=(1/2)*(h_ac*h_bd+h_ad*h_bc)-(1/3)*h_ab*h_cd",
    },
    positiveFrequencyStandardLips: {
      formula: "rho_plus_abcd(K)=theta(K^0)*theta(s)*s^2*Pi_abcd(K)/(480*pi)",
      coefficientNumerator: 1,
      coefficientDenominatorInteger: 480,
      coefficientPiPower: 1,
      standardMomentumDeltaIncludes: "(2*pi)^4*delta^4(K-k-l)",
      noisePairing:
        "N_project(f,h)=Re*integral_d4K/(2*pi)^4*conjugate(f_hat_ab(K))*rho_plus_abcd(K)*h_hat_cd(K)",
      exactCoefficientDerivation: {
        GramBoseFactor: "2",
        standardMasslessTwoBodyPhaseSpace: "1/(8*pi)",
        phaseSpaceRationalPartAfterFactoringPiInverse: "1/8",
        centerOfMomentumSymbolScaleSquared: "1/16",
        tracelessAngularAverage: "2/15",
        identity: "2*(1/(8*pi))*(1/16)*(2/15)=1/(480*pi)",
        rationalCoefficientIdentity: "2*(1/8)*(1/16)*(2/15)=1/480",
        numeratorProduct: 4,
        denominatorProduct: 1920,
        reducedNumerator: 1,
        reducedDenominator: 480,
      },
    },
    bareDeltaEquivalent: {
      definition:
        "rho_bare_abcd(K)=2*integral_dmu(k)*dmu(l)*delta^4(K-k-l)*P_ab(k,l)*P_cd(k,l)",
      formula:
        "rho_bare_abcd(K)=theta(K^0)*theta(s)*s^2*Pi_abcd(K)/(7680*pi^5)",
      coefficientNumerator: 1,
      coefficientDenominatorInteger: 7680,
      coefficientPiPower: 5,
      relationToStandard: "rho_plus=(2*pi)^4*rho_bare",
      exactRationalCrosscheck: "16/7680=1/480",
    },
    realSmearingAllCone: {
      assumptions: [
        "f_and_h_are_real",
        "f_hat(-K)=conjugate(f_hat(K))",
        "projector_density_is_even_under_K_to_minus_K",
      ],
      formula: "rho_real_all_cone_abcd(K)=theta(s)*s^2*Pi_abcd(K)/(960*pi)",
      coefficientNumerator: 1,
      coefficientDenominatorInteger: 960,
      coefficientPiPower: 1,
      noisePairing:
        "N_project(f,h)=Re*integral_d4K/(2*pi)^4*conjugate(f_hat_ab(K))*rho_real_all_cone_abcd(K)*h_hat_cd(K)",
      exactHalfDensityCrosscheck: "1/960=(1/2)*(1/480)",
    },
    boundarySafePolynomial: {
      formula:
        "s^2*Pi_abcd=(1/2)*[(s*eta_ac+K_a*K_c)*(s*eta_bd+K_b*K_d)+(s*eta_ad+K_a*K_d)*(s*eta_bc+K_b*K_c)]-(1/3)*(s*eta_ab+K_a*K_b)*(s*eta_cd+K_c*K_d)",
      containsDivisionByS: false,
      useForNumericalBoundaryEvaluation: true,
      equivalentToProjectorFormForSPositive: true,
      boundaryValueDistributionStillRequired: true,
    },
    normalizationCrosswalk: {
      phillipsHuDefinition: "8*N_PH=<anticommutator(t,t)>",
      projectDefinition: "N_project=(1/2)*<anticommutator(t,t)>",
      exactRelation: "N_project=4*N_PH",
      projectToPhillipsHuFactor: 4,
    },
    analyticIdentityFrozen: true,
    executableDistributionalEquivalenceProofDischarged: false,
  },
  conformalTetradAndSmearingCancellation: {
    conformalMetric: "g_ab=Omega^2*eta_ab",
    coordinateCovariantCenteredStress: "t_ab[g](X)=Omega(X)^-2*t_ab[eta](X)",
    conformalInertialTetrad: "e_hatA^a[g]=Omega^-1*delta_hatA^a",
    tetradCenteredStress: "t_hatAhatB[g](X)=Omega(X)^-4*t_hatAhatB[eta](X)",
    curvedVolume: "dmu_g=Omega^4*d4X",
    smearingOwnership:
      "barf_is_the_component_test_function_in_conformal_X_coordinates_and_f=F^*barf_is_its_curved_M_pullback",
    physicalSmearingPullback: "f_on_M=F^*barf_on_X",
    curvedObservable: "A_M[f]=integral_M_dmu_g*f^hatAhatB*t_hatAhatB[g]",
    exactCancellation: "A_M[F^*barf]=integral_R4_d4X*barf^AB(X)*t_AB[eta](X)",
    cancellationFactors: "Omega^4*Omega^-4=1",
    barfCurvedNormalizationPreserved: true,
    barfAssertedNormalizedAgainstFlatLebesgueMeasure: false,
    factorOmegaAtSmearingCenterAllowed: false,
    diffeomorphismAndConformalMapMustRemainExact: true,
  },
  siRestoration: {
    geometricUnitStressDimension: "L^-4",
    geometricUnitConnectedCovarianceDimension: "L^-8",
    meanTetradComponents:
      "multiply_geometric_unit_mean_tetrad_components_by_hbar*c",
    connectedCovariance:
      "multiply_geometric_unit_connected_tetrad_component_pairs_by_(hbar*c)^2",
    connectedCovarianceMultiplier: "(hbar*c)^2",
  },
  exactRationalMicrofixture: {
    fixtureId: "opposed_unit_future_null_pair_z_axis",
    contravariantK: [1, 0, 0, 1],
    contravariantL: [1, 0, 0, -1],
    covariantK: [-1, 0, 0, 1],
    covariantL: [-1, 0, 0, -1],
    contravariantTotalK: [2, 0, 0, 0],
    covariantTotalK: [-2, 0, 0, 0],
    kDotL: -2,
    totalKSquared: -4,
    s: 4,
    sixTimesPCovariantMatrix: [
      [0, 0, 0, 0],
      [0, -2, 0, 0],
      [0, 0, -2, 0],
      [0, 0, 0, 4],
    ],
    componentsInFrozenOrder: [
      "0",
      "0",
      "0",
      "0",
      "-1/3",
      "0",
      "0",
      "-1/3",
      "0",
      "2/3",
    ],
    P11: "-1/3",
    P22: "-1/3",
    P33: "2/3",
    allOtherSymmetricComponents: "0",
    exactTrace: "-P00+P11+P22+P33=0",
    exactTransversality: "K^a*P_ab=2*P_0b=0",
    fixtureIsExecutionEvidence: false,
  },
  inheritedBlockerAccounting: {
    meanBindingOverlayBlockerCount: 16,
    resolvedBlockerCount: 6,
    resolvedBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
    remainingBlockerCount: 10,
    remainingBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
    resolvedBlockerOrderInheritedExactly: true,
    remainingBlockerOrderInheritedExactly: true,
    resolvesAnyOtherMeanBindingOverlayBlocker: false,
    modifiesMeanBindingOverlayBytes: false,
    analyticConventionFreezeAuthorizesExecution: false,
  },
  unresolvedExecutionFreeze: {
    primarySourceArtifactByteBindingSet: null,
    executableDistributionalEquivalenceProof: null,
    certifiedFourierDecayDerivativeOrder: null,
    coreAndTailCutoffs: null,
    workLimits: null,
    errorTolerances: null,
    jointPsdCertificateScheme: null,
    primaryExecutorLineage: null,
    independentExecutorLineage: null,
    executionContract: null,
    executionReceipt: null,
    allFieldsRequiredBeforeExecution: true,
    nullFieldExecutionAllowed: false,
  },
  implementationBoundary: {
    builderPresent: false,
    issuerPresent: false,
    executorPresent: false,
    executionContractPresent: false,
    executionReceiptPresent: false,
    replayReceiptPresent: false,
    certificatePresent: false,
  },
  authority: {
    status: "blocked",
    firstBlocker: "primary_source_artifact_bytes_not_verified",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_two_particle_symbol_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL;

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

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(
        `Cannot canonicalize unsafe plain data: ${snapshot.violation}`,
      );
    }
    return canonicalJson(snapshot.value);
  };

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_two_particle_symbol_contract_literal_pin_mismatch",
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

export const nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];

    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
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
    const expectedBindings = [
      [
        "scalarReference",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      ],
      [
        "fixedBackgroundObservables",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_OBSERVABLES_EXPECTED_SIZE_BYTES,
      ],
      [
        "connectedNoiseDistributionConvention",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
      ],
      [
        "meanRsetRenormalizationConvention",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
      ],
      [
        "connectedNoiseNumericalRepresentation",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
      ],
      [
        "numericalRepresentationMeanBinding",
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_MEAN_BINDING_EXPECTED_SIZE_BYTES,
      ],
    ] as const;
    if (
      upstream == null ||
      expectedBindings.some(([key, sha256, sizeBytes]) => {
        const entry = isRecord(upstream[key]) ? upstream[key] : null;
        return (
          entry?.canonicalSha256 !== sha256 ||
          entry?.canonicalSizeBytes !== sizeBytes ||
          entry?.canonicalization !== CANONICALIZATION ||
          entry?.exactUpstreamBytesRequired !== true ||
          entry?.semanticSubstitutionAllowed !== false
        );
      })
    ) {
      violations.push("upstream_bindings_invalid");
    }

    const blockerAccounting =
      content != null && isRecord(content.inheritedBlockerAccounting)
        ? content.inheritedBlockerAccounting
        : null;
    const resolved =
      blockerAccounting != null &&
      Array.isArray(blockerAccounting.resolvedBlockers)
        ? blockerAccounting.resolvedBlockers
        : null;
    const remaining =
      blockerAccounting != null &&
      Array.isArray(blockerAccounting.remainingBlockers)
        ? blockerAccounting.remainingBlockers
        : null;
    if (
      resolved == null ||
      remaining == null ||
      !sameStrings(
        resolved.filter((entry): entry is string => typeof entry === "string"),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_RESOLVED_BLOCKERS,
      ) ||
      resolved.some((entry) => typeof entry !== "string") ||
      !sameStrings(
        remaining.filter((entry): entry is string => typeof entry === "string"),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
      ) ||
      remaining.some((entry) => typeof entry !== "string") ||
      blockerAccounting?.resolvedBlockerCount !== 6 ||
      blockerAccounting?.remainingBlockerCount !== 10 ||
      blockerAccounting?.resolvesAnyOtherMeanBindingOverlayBlocker !== false ||
      blockerAccounting?.analyticConventionFreezeAuthorizesExecution !== false
    ) {
      violations.push("blocker_accounting_invalid");
    }

    const provenance =
      content != null && isRecord(content.provenanceBoundary)
        ? content.provenanceBoundary
        : null;
    if (
      provenance?.status !==
        "source_facts_separated_from_project_derivations" ||
      provenance?.everySourceArtifactByteBindingComplete !== false ||
      provenance?.sourceAuditAloneAuthorizesExecution !== false ||
      provenance?.projectDerivationsAreDirectPrimarySourceQuotations !==
        false ||
      provenance?.executableIndependentProofStillRequired !== true
    ) {
      violations.push("source_derivation_boundary_invalid");
    }

    const symbol =
      content != null && isRecord(content.twoParticleStressSymbol)
        ? content.twoParticleStressSymbol
        : null;
    const spectral =
      content != null && isRecord(content.spectralConvention)
        ? content.spectralConvention
        : null;
    const conformal =
      content != null &&
      isRecord(content.conformalTetradAndSmearingCancellation)
        ? content.conformalTetradAndSmearingCancellation
        : null;
    if (
      symbol?.coefficientIsActualNotTwiceActual !== true ||
      symbol?.exactSymbolConventionFrozen !== true ||
      symbol?.executableAlgebraProofPresent !== false ||
      spectral?.analyticIdentityFrozen !== true ||
      spectral?.executableDistributionalEquivalenceProofDischarged !== false ||
      conformal?.barfCurvedNormalizationPreserved !== true ||
      conformal?.barfAssertedNormalizedAgainstFlatLebesgueMeasure !== false
    ) {
      violations.push("symbol_spectral_or_conformal_boundary_invalid");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const authorityBlockers =
      authority != null && Array.isArray(authority.blockers)
        ? authority.blockers
        : null;
    const authorityLocks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    const claimLocks =
      content != null && isRecord(content.claimLocks)
        ? content.claimLocks
        : null;
    const implementation =
      content != null && isRecord(content.implementationBoundary)
        ? content.implementationBoundary
        : null;
    if (
      content?.executionAdmissible !== false ||
      authority?.status !== "blocked" ||
      authority?.firstBlocker !==
        "primary_source_artifact_bytes_not_verified" ||
      authorityBlockers == null ||
      !sameStrings(
        authorityBlockers.filter(
          (entry): entry is string => typeof entry === "string",
        ),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
      ) ||
      authorityBlockers.some((entry) => typeof entry !== "string") ||
      authorityLocks == null ||
      Object.values(authorityLocks).some((value) => value !== false)
    ) {
      violations.push("authority_must_remain_blocked");
    }
    if (
      claimLocks == null ||
      Object.values(claimLocks).some((value) => value !== false)
    ) {
      violations.push("claim_locks_must_remain_false");
    }
    if (
      implementation == null ||
      Object.values(implementation).some((value) => value !== false)
    ) {
      violations.push("builder_issuer_executor_receipts_must_remain_absent");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolV1 =>
  nhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolViolations(value)
    .length === 0;
