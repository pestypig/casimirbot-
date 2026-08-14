import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-numerical-representation.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_numerical_representation_mean_binding" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_numerical_representation_mean_binding/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 =
  "e1ce8527fc9bef68d31e76ff122ece1d633400137256e4dc5e7bdd325effbb73" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES =
  16791 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256 =
  "749f705d1d64d8bb3867638b7b8b0fb20084191adaf83d206083bf4012a7a246" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES =
  20280 as const;

// Literal drift pins deliberately remain outside the canonical contract bytes.
// They change only through an audited contract revision.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SHA256 =
  "34e0208f194a95a9c4429079b55997cb92f16b327a4c16e02d3f99f6ffd7095c" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SIZE_BYTES =
  6085 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SHA256 =
  "11f062d22a66127a3b71c833ea16ff4facf973012203d135bcbdc4bb597610de" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SIZE_BYTES =
  6473 as const;

const CANONICALIZATION = "utf8_lexicographic_object_keys_json_v1" as const;
const RESOLVED_MEAN_BINDING_BLOCKER =
  "required_mean_renormalization_convention_binding_absent" as const;

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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS =
  Object.freeze([
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

const EXPECTED_UPSTREAM_BLOCKERS = Object.freeze([
  RESOLVED_MEAN_BINDING_BLOCKER,
  ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS =
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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS =
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

const NUMERICAL_REPRESENTATION_BINDING = canonicalBinding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION,
);
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES ||
  NUMERICAL_REPRESENTATION_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 ||
  NUMERICAL_REPRESENTATION_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_numerical_representation_literal_pin_mismatch",
  );
}

const MEAN_CONVENTION_BINDING = canonicalBinding(
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
);
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES ||
  MEAN_CONVENTION_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256 ||
  MEAN_CONVENTION_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_mean_convention_literal_pin_mismatch",
  );
}

const UPSTREAM_MEAN_REQUIREMENT =
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .requiredMeanConventionBinding;
if (
  UPSTREAM_MEAN_REQUIREMENT.artifactId !== null ||
  UPSTREAM_MEAN_REQUIREMENT.contractVersion !== null ||
  UPSTREAM_MEAN_REQUIREMENT.canonicalSha256 !== null ||
  UPSTREAM_MEAN_REQUIREMENT.canonicalSizeBytes !== null ||
  UPSTREAM_MEAN_REQUIREMENT.canonicalization !== null ||
  UPSTREAM_MEAN_REQUIREMENT.bindingAvailable !== false ||
  UPSTREAM_MEAN_REQUIREMENT.requiredBeforeExecution !== true ||
  UPSTREAM_MEAN_REQUIREMENT.nullBindingAuthorizesExecution !== false
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_upstream_requirement_drift",
  );
}

if (
  !sameStrings(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_BLOCKERS,
    EXPECTED_UPSTREAM_BLOCKERS,
  ) ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION.content
    .executionAdmissible !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
    .executionAdmissible !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
      .content.authority.locks,
  ).some((lock) => lock !== false) ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION
      .content.claimLocks,
  ).some((lock) => lock !== false)
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_upstream_blocked_state_drift",
  );
}

const CONTENT = {
  maturity: "stage_2_blocked_mean_binding_overlay",
  status: "blocked_mean_binding_resolved_remaining_representation_blockers",
  executionAdmissible: false,
  overlayScope: {
    role: "additive_exact_mean_convention_binding_only",
    modifiesNumericalRepresentationContract: false,
    modifiesMeanConventionContract: false,
    replacesEitherUpstreamContract: false,
    resolvesOnlyExternalRequiredMeanBindingRelation: true,
    resolvesNumericalFormulaOrProofGap: false,
    grantsExecutionAuthority: false,
  },
  upstreamBindings: {
    connectedNoiseNumericalRepresentation: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES,
      canonicalization: CANONICALIZATION,
      exactUpstreamBytesRequired: true,
      exactIdentityVerifiedAtModuleInitialization: true,
      semanticSubstitutionAllowed: false,
      role: "bound_blocked_numerical_representation_baseline",
    },
    meanRsetRenormalizationConvention: {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
      canonicalization: CANONICALIZATION,
      exactUpstreamBytesRequired: true,
      exactIdentityVerifiedAtModuleInitialization: true,
      semanticSubstitutionAllowed: false,
      role: "required_mean_renormalization_convention",
    },
  },
  resolvedMeanBindingRelation: {
    upstreamRequirementPointer: "/content/requiredMeanConventionBinding",
    upstreamRequiredBlocker: RESOLVED_MEAN_BINDING_BLOCKER,
    upstreamRequirementWasNullAndBlocking: true,
    resolutionKind: "additive_external_exact_identity_binding",
    boundArtifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_ARTIFACT_ID,
    boundContractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_CONTRACT_VERSION,
    boundCanonicalSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256,
    boundCanonicalSizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
    boundCanonicalization: CANONICALIZATION,
    bindingAvailableInThisOverlay: true,
    bindingRequirementResolvedInThisOverlay: true,
    blockerRemovedOnlyFromThisOverlayBlockerList: true,
    upstreamNullFieldModified: false,
    numericalRepresentationBytesModified: false,
    meanConventionBytesModified: false,
    resolvesAnyOtherBlocker: false,
    authorizesExecution: false,
  },
  inheritedBlockedState: {
    upstreamBlockerCount: 17,
    resolvedExternalBindingBlockerCount: 1,
    remainingBlockerCount: 16,
    remainingNumericalRepresentationBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    remainingBlockerOrderInheritedExactly: true,
    everyRemainingBlockerStillBlocking: true,
    upstreamUnresolvedExecutionFreezeInheritedByExactBinding: true,
    fillsAnyNumericalRepresentationNullField: false,
    suppliesStressOperator: false,
    suppliesTwoParticleStressSymbol: false,
    suppliesNormalizationConstant: false,
    suppliesOnShellMeasure: false,
    suppliesFourierConvention: false,
    suppliesDistributionalEquivalenceProof: false,
    suppliesTailCertificate: false,
    suppliesWorkLimit: false,
    suppliesTolerance: false,
    suppliesLineageEvidence: false,
    suppliesExecutionContract: false,
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
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING;

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

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(
        `Cannot canonicalize unsafe plain data: ${snapshot.violation}`,
      );
    }
    return canonicalJson(snapshot.value);
  };

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON =
  canonicalJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  );
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_numerical_representation_mean_binding_contract_literal_pin_mismatch",
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

export const nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];

    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
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
    const representation =
      upstream != null &&
      isRecord(upstream.connectedNoiseNumericalRepresentation)
        ? upstream.connectedNoiseNumericalRepresentation
        : null;
    const mean =
      upstream != null && isRecord(upstream.meanRsetRenormalizationConvention)
        ? upstream.meanRsetRenormalizationConvention
        : null;
    if (
      representation?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SHA256 ||
      representation?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_NUMERICAL_REPRESENTATION_EXPECTED_SIZE_BYTES ||
      mean?.canonicalSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SHA256 ||
      mean?.canonicalSizeBytes !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_MEAN_CONVENTION_EXPECTED_SIZE_BYTES
    ) {
      violations.push("upstream_bindings_invalid");
    }

    const resolution =
      content != null && isRecord(content.resolvedMeanBindingRelation)
        ? content.resolvedMeanBindingRelation
        : null;
    if (
      resolution?.upstreamRequiredBlocker !== RESOLVED_MEAN_BINDING_BLOCKER ||
      resolution?.bindingAvailableInThisOverlay !== true ||
      resolution?.bindingRequirementResolvedInThisOverlay !== true ||
      resolution?.blockerRemovedOnlyFromThisOverlayBlockerList !== true ||
      resolution?.upstreamNullFieldModified !== false ||
      resolution?.resolvesAnyOtherBlocker !== false ||
      resolution?.authorizesExecution !== false
    ) {
      violations.push("mean_binding_resolution_invalid");
    }

    const inherited =
      content != null && isRecord(content.inheritedBlockedState)
        ? content.inheritedBlockedState
        : null;
    const remaining =
      inherited != null &&
      Array.isArray(inherited.remainingNumericalRepresentationBlockers)
        ? (inherited.remainingNumericalRepresentationBlockers as unknown[])
        : null;
    if (
      remaining == null ||
      !sameStrings(
        remaining.filter((entry): entry is string => typeof entry === "string"),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
      ) ||
      remaining.some((entry) => typeof entry !== "string") ||
      remaining.includes(RESOLVED_MEAN_BINDING_BLOCKER) ||
      inherited?.remainingBlockerCount !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS.length ||
      inherited?.everyRemainingBlockerStillBlocking !== true ||
      inherited?.fillsAnyNumericalRepresentationNullField !== false
    ) {
      violations.push("remaining_blockers_must_be_inherited_exactly");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const authorityBlockers =
      authority != null && Array.isArray(authority.blockers)
        ? (authority.blockers as unknown[])
        : null;
    const authorityLocks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    if (
      authority?.status !== "blocked" ||
      authority?.firstBlocker !==
        "primary_source_artifact_bytes_not_verified" ||
      authorityBlockers == null ||
      !sameStrings(
        authorityBlockers.filter(
          (entry): entry is string => typeof entry === "string",
        ),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_BLOCKERS,
      ) ||
      authorityBlockers.some((entry) => typeof entry !== "string") ||
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
      Object.values(implementation).some((entry) => entry !== false)
    ) {
      violations.push("builder_issuer_executor_receipts_must_remain_absent");
    }

    if (content == null || content.executionAdmissible !== false) {
      violations.push("execution_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1 =
  (
    value: unknown,
  ): value is Nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingV1 =>
    nhm2ConformallyFlatNeedleConnectedNoiseNumericalRepresentationMeanBindingViolations(
      value,
    ).length === 0;
