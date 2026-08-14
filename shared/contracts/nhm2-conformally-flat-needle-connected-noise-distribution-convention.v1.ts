import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_distribution_convention" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_distribution_convention/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;

// These literal pins are deliberately outside the canonical contract bytes.
// They are replaced only by an audited contract revision, never derived here.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SHA256 =
  "2d9c95e80681a2d1f4cdf437ec3987cf45dea6dfb5f12e52ce4cad411b7b6755" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES =
  8849 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 =
  "539ffe78e91f20a93eb1dcdf07f68af26529da4fd1062b7bd336434cea27c336" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES =
  9209 as const;

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

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_distribution_convention_observables_literal_pin_mismatch",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_BLOCKERS =
  Object.freeze([
    "primary_source_artifact_bytes_not_observed_or_pinned",
    "exact_stress_operator_not_frozen",
    "hadamard_wightman_relative_normalization_not_frozen",
    "numerical_boundary_value_representation_not_frozen",
    "distributional_equivalence_proof_absent",
    "mean_renormalization_convention_not_frozen",
    "execution_contract_absent",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_AUTHORITY_LOCKS =
  Object.freeze({
    primarySourceByteAuthority: false as const,
    exactStressOperatorAuthority: false as const,
    hadamardNormalizationAuthority: false as const,
    numericalRepresentationAuthority: false as const,
    distributionalEquivalenceAuthority: false as const,
    meanConventionAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    agreementAuthority: false as const,
    lampAuthority: false as const,
    admConstraintAuthority: false as const,
    physicalClaimAuthority: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CLAIM_LOCKS =
  Object.freeze({
    connectedNoiseDiagnosticPass: false as const,
    independentReplayPass: false as const,
    independentAgreementPass: false as const,
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

const PRIMARY_SOURCE_AUDIT = [
  {
    sourceId: "moretti_extended_local_wick_star_algebra",
    sourceVersion: "arXiv:gr-qc/0109048v2",
    sourceUrl: "https://arxiv.org/abs/gr-qc/0109048v2",
    equationAnchors: ["27-29", "33-43", "44", "47-53"],
    pageAnchors: [],
    auditedUses: [
      "extended_local_Wick_star_algebra_construction",
      "compactly_supported_smooth_test_function_domain",
      "stress_tensor_as_an_algebra_valued_distribution",
    ],
    sourceArtifactSha256: null,
    sourceArtifactSizeBytes: null,
    authoritativelySelectedByteArtifact: false,
  },
  {
    sourceId: "bates_noise_kernel_distribution_audit",
    sourceVersion: "arXiv:1301.2501v1",
    sourceUrl: "https://arxiv.org/abs/1301.2501v1",
    equationAnchors: ["2.1-2.6", "2.11"],
    pageAnchors: ["pp.16-17_discussion"],
    auditedUses: [
      "centered_connected_symmetrized_noise_definition",
      "equation_2_11_is_not_an_executable_termwise_distribution_recipe",
    ],
    sourceArtifactSha256: null,
    sourceArtifactSizeBytes: null,
    authoritativelySelectedByteArtifact: false,
  },
  {
    sourceId: "cho_hu_conformal_noise_transformation",
    sourceVersion: "arXiv:1407.3907v1",
    sourceUrl: "https://arxiv.org/abs/1407.3907v1",
    equationAnchors: ["1", "6", "17-21"],
    pageAnchors: [],
    auditedUses: [
      "conditional_coordinate_covariant_noise_scaling_at_each_point",
      "renormalization_anomaly_is_a_c_number_shift_for_connected_fluctuations",
    ],
    sourceArtifactSha256: null,
    sourceArtifactSizeBytes: null,
    authoritativelySelectedByteArtifact: false,
  },
  {
    sourceId: "phillips_hu_noise_kernel_normalization",
    sourceVersion: "arXiv:gr-qc/0010019v2",
    sourceUrl: "https://arxiv.org/abs/gr-qc/0010019v2",
    equationAnchors: ["3.9-3.12", "3.21-3.25", "4.4-4.7"],
    pageAnchors: [],
    auditedUses: [
      "noise_kernel_normalization_crosswalk",
      "point_separated_Wightman_boundary_value_structure",
    ],
    sourceArtifactSha256: null,
    sourceArtifactSizeBytes: null,
    authoritativelySelectedByteArtifact: false,
  },
] as const;

const CONTENT = {
  maturity: "stage_2_diagnostic_contract_only",
  status: "blocked_pending_complete_distribution_execution_freeze",
  executionAdmissible: false,
  upstreamObservablesBinding: {
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
    canonicalSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    canonicalSizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
    exactUpstreamBytesRequired: true,
    semanticSubstitutionAllowed: false,
  },
  scopeBoundary: {
    fieldTheory: "free_massless_conformally_coupled_real_scalar",
    background: "one_frozen_conformally_flat_needle_candidate",
    observable: "connected_symmetrized_stress_tensor_noise_distribution",
    fixedBackgroundDiagnosticOnly: true,
    declaredLeverTensorInputAllowed: false,
    metricDemandSubstitutionAllowed: false,
    constraintObservable: false,
    fullSemiclassicalBackreaction: false,
  },
  primarySourceAudit: {
    status: "semantic_audit_recorded_but_source_bytes_unbound",
    sources: PRIMARY_SOURCE_AUDIT,
    everySourceVersionExplicit: true,
    everyEquationAnchorExplicit: true,
    primarySourceArtifactByteBindingsComplete: false,
    sourceAuditAloneAuthorizesExecution: false,
  },
  algebraicDistributionConvention: {
    construction: "Moretti_extended_local_Wick_star_algebra",
    constructionRole: "semantic_distribution_baseline_only",
    testFunctionSpace: "C_c^infinity(M)",
    stressObjectKind: "algebra_valued_operator_distribution",
    product: "ordinary_algebra_multiplication",
    productSymbol: "juxtaposition",
    sourceStarDenotesInvolutionNotMultiplication: true,
    contractionKernel: "state_Wightman_two_point_boundary_value_distribution",
    productDefinedMicrolocallyBeforeSmearing: true,
    timeOrderedProduct: false,
    euclideanProduct: false,
    pointwiseOrdinaryFunctionMultiplication: false,
    numericalPointSamplingBeforeDistributionPairing: false,
  },
  centeredConnectedObservable: {
    stressSymbol: "T_ab(f)",
    stateSymbol: "omega",
    identitySymbol: "1",
    centeredFluctuationDefinition: "t_ab(f)=T_ab(f)-omega(T_ab(f))*1",
    noiseDefinition: "N_abcd(f,h)=(1/2)*omega(t_ab(f)t_cd(h)+t_cd(h)t_ab(f))",
    centered: true,
    connected: true,
    symmetrized: true,
    symmetrizationFactorNumerator: 1,
    symmetrizationFactorDenominator: 2,
    productIsOrdinaryAlgebraMultiplication: true,
    uncenteredSecondMomentAllowedAsNoise: false,
    commutatorAllowedAsNoise: false,
  },
  noiseKernelNormalizationCrosswalk: {
    phillipsHuDefinition: "8*N_PH=<anticommutator(t,t)>",
    projectDefinition: "N_project=(1/2)*<anticommutator(t,t)>",
    exactRelation: "N_project=4*N_PH",
    projectToPhillipsHuFactor: 4,
    appliesToConnectedSymmetrizedNoiseOnly: true,
    changesHadamardTwoPointRelativeNormalization: false,
    changesMeanStressConvention: false,
  },
  distributionProductBoundary: {
    requiredInterpretation:
      "microlocal_Wightman_boundary_value_product_as_one_distribution",
    evaluationOrder: [
      "construct_the_ordinary_algebra_product_distribution",
      "center_and_symmetrize_the_algebra_observable",
      "pair_the_result_with_C_c^infinity(M)_test_functions",
    ],
    termwisePrincipalValueDeltaDecompositionAllowed: false,
    termwisePrincipalValueDeltaMultiplicationAllowed: false,
    deltaSquaredAllowed: false,
    batesEquation2_11ExecutionAllowed: false,
    batesEquation2_11Role: "primary_source_audit_anchor_only",
    independentlyAddedContactTermsAllowed: false,
    regulatorDependentContactsMayBeInvented: false,
    distributionalIdentityMayBeAssumedFromPointwiseAgreement: false,
  },
  currentBumpAdmission: {
    smearingId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .frozenInputIdentities.smearing.smearingId,
    declaredClass: "normalized_C_infinity_spacetime_product_bumps",
    admittedTestFunctionSpace: "C_c^infinity(M)",
    admittedAsTestFunctions: true,
    admissionBasis: "source_audited_semantic_inference_only",
    exactProjectBumpNamedByPrimarySource: false,
    admissionIsNumericalRepresentationProof: false,
    admissionAuthorizesExecution: false,
  },
  renormalizationShiftBoundary: {
    cNumberShiftForm: "T_ab(f)->T_ab(f)+C_ab(f)*1",
    centeredCancellation: "t'_ab(f)=T'_ab(f)-omega(T'_ab(f))*1=t_ab(f)",
    cancelsInConnectedFluctuation: true,
    cancelsInConnectedSymmetrizedNoise: true,
    cancelsInMeanStress: false,
    cancelsInUncenteredSecondMoment: false,
    licensesDroppingMeanLocalTerms: false,
    selectsMeanRenormalizationConvention: false,
    scope: "connected_fluctuation_only",
  },
  conditionalConformalLaw: {
    status: "conditional_semantic_rule_not_execution_authority",
    assumptions: [
      "free_massless_conformally_coupled_scalar",
      "conformally_related_backgrounds",
      "state_correspondence_fixed",
      "connected_centered_stress_fluctuation",
      "same_covariant_index_placement",
    ],
    coordinateCovariantComponents: {
      formula: "N_abcd(x,y)=Omega(x)^(-2)*Omega(y)^(-2)*Nbar_abcd(x,y)",
      omegaAppliedAtX: true,
      omegaAppliedAtY: true,
      factorOmegaAtSmearingCenterAllowed: false,
      replaceOmegaXAndOmegaYWithOneCenterValueAllowed: false,
      pointwiseFactorsAppliedBeforeSmearing: true,
      executionAllowed: false,
    },
    orthonormalTetradComponents: {
      status: "inferred_from_coordinate_law_and_tetrad_scaling",
      formula:
        "N_hat(a)hat(b)hat(c)hat(d)(x,y)=Omega(x)^(-4)*Omega(y)^(-4)*Nbar_hat(a)hat(b)hat(c)hat(d)(x,y)",
      omegaAppliedAtX: true,
      omegaAppliedAtY: true,
      factorOmegaAtSmearingCenterAllowed: false,
      replaceOmegaXAndOmegaYWithOneCenterValueAllowed: false,
      directPrimarySourceQuotation: false,
      sourceAuditedSemanticInference: true,
      executionAllowed: false,
    },
  },
  unresolvedExecutionFreeze: {
    exactStressTensorOperator: null,
    hadamardWightmanRelativeNormalization: null,
    numericalBoundaryValueRepresentation: null,
    distributionalEquivalenceProof: null,
    primarySourceArtifactByteBindingSet: null,
    meanRenormalizationConvention: null,
    executionContract: null,
    executorIdentity: null,
    executionReceipt: null,
    allFieldsRequiredBeforeExecution: true,
    nullFieldExecutionAllowed: false,
  },
  authority: {
    status: "blocked",
    firstBlocker: "primary_source_artifact_bytes_not_observed_or_pinned",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_distribution_convention_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION;

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionJson =
  (
    value: Nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1,
  ): string => canonicalJson(value);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_distribution_convention_contract_literal_pin_mismatch",
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

export const nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];
    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
    );
    const root = isRecord(snapshot.value) ? snapshot.value : null;
    const content =
      root != null && isRecord(root.content) ? root.content : null;

    const upstream =
      content != null && isRecord(content.upstreamObservablesBinding)
        ? content.upstreamObservablesBinding
        : null;
    if (
      upstream == null ||
      upstream.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256 ||
      upstream.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES
    ) {
      violations.push("upstream_observables_binding_invalid");
    }

    const sourceAudit =
      content != null && isRecord(content.primarySourceAudit)
        ? content.primarySourceAudit
        : null;
    const sources = Array.isArray(sourceAudit?.sources)
      ? sourceAudit.sources
      : [];
    if (
      sources.length !== PRIMARY_SOURCE_AUDIT.length ||
      sources.some((source) => {
        if (!isRecord(source)) return true;
        return (
          source.sourceArtifactSha256 !== null ||
          source.sourceArtifactSizeBytes !== null ||
          source.authoritativelySelectedByteArtifact !== false
        );
      })
    ) {
      violations.push("primary_source_bytes_must_remain_unbound");
    }

    const product =
      content != null && isRecord(content.distributionProductBoundary)
        ? content.distributionProductBoundary
        : null;
    if (
      product == null ||
      product.termwisePrincipalValueDeltaDecompositionAllowed !== false ||
      product.termwisePrincipalValueDeltaMultiplicationAllowed !== false ||
      product.deltaSquaredAllowed !== false ||
      product.batesEquation2_11ExecutionAllowed !== false ||
      product.independentlyAddedContactTermsAllowed !== false
    ) {
      violations.push("unsafe_distribution_recipe_forbidden");
    }

    const unresolved =
      content != null && isRecord(content.unresolvedExecutionFreeze)
        ? content.unresolvedExecutionFreeze
        : null;
    const unresolvedNullKeys = [
      "exactStressTensorOperator",
      "hadamardWightmanRelativeNormalization",
      "numericalBoundaryValueRepresentation",
      "distributionalEquivalenceProof",
      "primarySourceArtifactByteBindingSet",
      "meanRenormalizationConvention",
      "executionContract",
      "executorIdentity",
      "executionReceipt",
    ] as const;
    if (
      unresolved == null ||
      unresolvedNullKeys.some((key) => unresolved[key] !== null) ||
      unresolved.nullFieldExecutionAllowed !== false
    ) {
      violations.push("unresolved_execution_fields_must_remain_null");
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

    if (content == null || content.executionAdmissible !== false) {
      violations.push("execution_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1 =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1 =>
    nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
      value,
    ).length === 0;
