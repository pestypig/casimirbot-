import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_fixed_background_pair_agreement_policy" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_fixed_background_pair_agreement_policy/v1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_POLICY_ID =
  "nhm2.server_owned.conformally_flat_needle.fixed_background_pair_agreement/v1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SHA256 =
  "fe7f02dceeb72b9644270debb0b3430d04c6a658a12c892037c1d6d026e97264" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SIZE_BYTES =
  660 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SHA256 =
  "4bbdf624e9236a0a73b04e58e17ab524c1312818db67cb26d10755bcd545f73c" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SIZE_BYTES =
  8399 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SHA256 =
  "db54b1887cf7c73f0da7fa912bde63a6c9e14ab4d9c6c5b699cff180e5404075" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SIZE_BYTES =
  8847 as const;

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

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING =
  Object.freeze({
    artifactId:
      "nhm2.conformally_flat_needle_fixed_background_observables" as const,
    contractVersion:
      "nhm2_conformally_flat_needle_fixed_background_observables/v1" as const,
    sha256:
      "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const,
    sizeBytes: 13189 as const,
    canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
  });

const observableBindingMatchesExpected =
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID ===
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.artifactId &&
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION ===
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.contractVersion &&
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 ===
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.sha256 &&
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES ===
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.sizeBytes;

if (!observableBindingMatchesExpected) {
  throw new Error(
    "nhm2_fixed_background_pair_agreement_observables_binding_drift",
  );
}

const OBSERVABLE_OUTPUTS =
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
    .outputBoundary.allowedArrayOutputs;
const OBSERVABLE_OUTPUT_BINDING = canonicalBinding(OBSERVABLE_OUTPUTS);
if (
  OBSERVABLE_OUTPUT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SHA256 ||
  OBSERVABLE_OUTPUT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_pair_agreement_observable_outputs_literal_pin_mismatch",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_BLOCKERS =
  Object.freeze([
    "observables_contract_execution_not_admissible",
    "componentwise_tolerances_not_scale_derived_or_frozen",
    "uncertainty_absolute_floors_not_scale_derived_or_frozen",
    "same_frozen_science_pair_evidence_absent",
    "primary_run_evidence_absent",
    "independent_run_evidence_absent",
    "lineage_independence_evidence_absent",
    "pair_numeric_evidence_absent",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CLAIM_LOCKS =
  Object.freeze({
    meanRsetPairAgreementDiagnosticPass: false as const,
    connectedNoisePairAgreementDiagnosticPass: false as const,
    uncertaintyPairAgreementDiagnosticPass: false as const,
    independentAgreementEstablished: false as const,
    fixedBackgroundDiagnosticPass: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    fullAdmConstraintClosure: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const TOLERANCES = {
  fixedBackgroundMeanRset: {
    valueRole: "fixed_background_mean_rset",
    uncertaintyRole: "fixed_background_mean_rset_absolute_uncertainty95",
    unit: "J/m^3",
    absoluteToleranceA: null,
    relativeToleranceR: null,
    absoluteUncertaintyFactorFloor: null,
  },
  fixedBackgroundConnectedNoise: {
    valueRole: "fixed_background_connected_noise_kernel",
    uncertaintyRole: "fixed_background_connected_noise_absolute_uncertainty95",
    unit: "(J/m^3)^2",
    absoluteToleranceA: null,
    relativeToleranceR: null,
    absoluteUncertaintyFactorFloor: null,
  },
  fixedBackgroundSampleWeights: {
    valueRole: "fixed_background_sample_weights",
    uncertaintyRole: null,
    unit: "1",
    absoluteToleranceA: null,
    relativeToleranceR: null,
    absoluteUncertaintyFactorFloor: null,
  },
} as const;

const NULL_EVIDENCE = {
  toleranceScaleDerivation: null,
  frozenToleranceBinding: null,
  sameFrozenSciencePairBinding: null,
  primaryRunBinding: null,
  independentRunBinding: null,
  primaryUncertaintyCoverageEvidence: null,
  independentUncertaintyCoverageEvidence: null,
  lineageIndependenceEvidence: null,
  pairNumericEvidence: null,
} as const;

const CONTENT = {
  maturity: "diagnostic_pair_agreement_policy_plan_only",
  status: "blocked_missing_frozen_tolerances_and_pair_evidence",
  executionAdmissible: false,
  relationship: {
    kind: "separate_additive_policy_over_exact_observables_contract",
    mutatesObservablesContract: false,
    runPlanDependency: null,
    runPlanImported: false,
    futureRunPlanMayBindThisPolicyByExactHash: true,
    futureRunPlanMayOverrideThisPolicy: false,
  },
  observablesBinding: {
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
    sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    sizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
    exactCanonicalBytesRequired: true,
    semanticRelabelingAllowed: false,
    outputBoundaryBinding: {
      sha256: OBSERVABLE_OUTPUT_BINDING.sha256,
      sizeBytes: OBSERVABLE_OUTPUT_BINDING.sizeBytes,
      canonicalization: OBSERVABLE_OUTPUT_BINDING.canonicalization,
    },
  },
  comparisonScope: {
    exactAllowedRoles: [
      "fixed_background_mean_rset",
      "fixed_background_mean_rset_absolute_uncertainty95",
      "fixed_background_connected_noise_kernel",
      "fixed_background_connected_noise_absolute_uncertainty95",
      "fixed_background_sample_weights",
    ],
    roleOrderMustMatchObservablesContract: true,
    everyArrayElementComparedExactlyOnce: true,
    missingOrDuplicateRoleDisposition: "blocked",
    unknownRoleDisposition: "blocked",
    declaredLeverTensorPresent: false,
    declaredLeverTensorAllowed: false,
    declaredLeverTensorForbidden: true,
    constraintArrayRolesAllowed: false,
    constraintComparisonAllowed: false,
    forbiddenRolePatterns: [
      "^H$",
      "^H_i$",
      "constraint",
      "hamiltonian",
      "momentum",
      "antisymmetry",
      "jacobi",
    ],
  },
  sameFrozenScience: {
    exactObservablesContractBytesMustMatchBothLanes: true,
    exactScientificInputDescriptorBytesMustMatchBothLanes: true,
    exactScientificInputValueBytesMustMatchBothLanes: true,
    exactReferenceGeometryStateChartTetradSamplesAndSmearingRequired: true,
    implementationInputBytesMustMatch: false,
    implementationInputBytesMustBeDistinct: true,
    producerDeclaredEquivalenceAcceptedAsExactScienceEvidence: false,
    serverObservedBindingsRequired: true,
    currentEvidence: null,
  },
  scalarComparison: {
    formula:
      "abs(x_primary-x_independent)<=A+R*max(abs(x_primary),abs(x_independent))+u_primary+u_independent",
    deltaDefinition: "abs(x_primary-x_independent)",
    scaleDefinition: "max(abs(x_primary),abs(x_independent))",
    budgetDefinition:
      "A+R*max(abs(x_primary),abs(x_independent))+u_primary+u_independent",
    componentwiseEveryScalarMustPass: true,
    comparisonSymmetricUnderLaneSwap: true,
    sampleWeightUncertaintyConvention:
      "u_primary=u_independent=0_for_fixed_background_sample_weights",
    normAggregationAllowed: false,
    meanAggregationAllowed: false,
    rmsAggregationAllowed: false,
    averagingCanRescueFailedComponent: false,
    worstComponentOnlySufficient: false,
    everyInputAndDerivedScalarMustBeFinite: true,
    derivedOverflowOrNonfiniteDisposition: "blocked",
  },
  intervalOverlap: {
    formula:
      "max(x_primary-u_primary,x_independent-u_independent)<=min(x_primary+u_primary,x_independent+u_independent)",
    requiredForEveryMeanAndNoiseValueComponent: true,
    inclusiveEndpoints: true,
    pairPassRequiresBothBudgetFormulaAndIntervalOverlap: true,
    producerSuppliedOverlapBooleanAuthoritative: false,
    serverReplayFromDetachedArraysRequired: true,
    missingInvalidOrNonfiniteEndpointDisposition: "blocked",
  },
  uncertaintyValidation: {
    appliesToRoles: [
      "fixed_background_mean_rset_absolute_uncertainty95",
      "fixed_background_connected_noise_absolute_uncertainty95",
    ],
    finiteRequired: true,
    nonnegativeRequired: true,
    independentlyDerivedRequired: true,
    independentlyServerReplayedRequired: true,
    zeroAllowedOnlyWhenExactZeroIsSymbolicallyProven: true,
    agreementCannotEstablishCoverageByItself: true,
    coverageEvidenceRequiredBeforePairExecution: true,
    factorRule: {
      formula:
        "max(u_primary,u_independent)<=4*max(min(u_primary,u_independent),absolute_floor)",
      factorLimit: 4,
      absoluteFloorMustBeScaleDerivedAndPresealed: true,
      absoluteFloorByRole: {
        fixedBackgroundMeanRsetAbsoluteUncertainty95: null,
        fixedBackgroundConnectedNoiseAbsoluteUncertainty95: null,
      },
      nullAbsoluteFloorExecutionAllowed: false,
      factorRuleMustPassEveryUncertaintyComponent: true,
    },
    negativeUncertaintyDisposition: "blocked",
    missingOrNonfiniteUncertaintyDisposition: "blocked",
  },
  tolerancePlan: {
    status: "blocked_not_scale_derived_or_frozen",
    valuesFrozen: false,
    roleTolerances: TOLERANCES,
    allAbsoluteAndRelativeTolerancesMustBeScaleDerived: true,
    allToleranceValuesMustBePresealedBeforeEitherRun: true,
    nullToleranceExecutionAllowed: false,
    producerSelectedToleranceAllowed: false,
    observedOutputSelectedToleranceAllowed: false,
  },
  lineageAndIsolation: {
    distinctImplementationIdRequired: true,
    distinctSourceSha256Required: true,
    distinctDependencyLockSha256Required: true,
    distinctExecutableSha256Required: true,
    distinctRunIdRequired: true,
    distinctOutputRootRequired: true,
    disjointOutputRootsRequired: true,
    crossLaneOutputReadForbidden: true,
    sharedDerivedScienceSourceFilesAllowed: false,
    sharedEquationTranscriptionAllowed: false,
    sharedGeneratedScienceCodeAllowed: false,
    sharedNumericalKernelAllowed: false,
    sharedDependencyGraphAllowed: false,
    sharedExecutableAllowed: false,
    sharedIntermediateCachesAllowed: false,
    sharedFourierOrQuadratureTablesAllowed: false,
    onlyExactContractSchemasAndFrozenScientificInputBytesMayBeShared: true,
    serverObservedSourceDependencyExecutableRunAndRootEvidenceRequired: true,
    exactOutputByteIdentityGrantsIndependence: false,
    wholeNonstructuralOutputByteIdentityDisposition:
      "blocked_pending_independence_review",
  },
  preregistrationAndRetuning: {
    policyMustBeHashSealedBeforeEitherRun: true,
    toleranceValuesMustBeInANewHashSealedPolicyBeforeEitherRun: true,
    postObservationToleranceRetuningAllowed: false,
    postFailureToleranceRetuningAllowed: false,
    postFailureNormAveragingAllowed: false,
    inPlaceMutationAllowed: false,
    anyToleranceOrRuleChangeRequiresNewContractVersion: true,
    automaticLegacyUpgradeAllowed: false,
  },
  evidence: NULL_EVIDENCE,
  authorityBoundary: {
    status: "blocked",
    firstBlocker: "observables_contract_execution_not_admissible",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_BLOCKERS,
    policyPlanOnly: true,
    builderExported: false,
    issuerAuthority: false,
    receiptAuthority: false,
    comparatorIntegrated: false,
    pairAgreementAuthority: false,
    diagnosticPassAuthority: false,
    lampAuthority: false,
    fullAdmConstraintAuthority: false,
    theoryGraphAuthority: false,
    physicalViabilityAuthority: false,
    propulsionAuthority: false,
    transportAuthority: false,
    certificateAuthority: false,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_pair_agreement_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTRACT_VERSION,
  policyId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_POLICY_ID,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT;

export const canonicalNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementJson =
  (value: Nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1): string =>
    canonicalJson(value);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON =
  canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT);
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_pair_agreement_contract_literal_pin_mismatch",
  );
}
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_BINDING =
  Object.freeze({
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTRACT_VERSION,
    policyId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_POLICY_ID,
    sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256,
    sizeBytes:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

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
    if (
      keys.some(
        (key) => key !== "length" && !/^(?:0|[1-9][0-9]*)$/.test(key as string),
      )
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

export const nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  const violations = exactDifferences(
    snapshot.value,
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT,
  );
  const root = isRecord(snapshot.value) ? snapshot.value : null;
  const content = root != null && isRecord(root.content) ? root.content : null;
  const observables =
    content != null && isRecord(content.observablesBinding)
      ? content.observablesBinding
      : null;
  if (
    observables == null ||
    observables.artifactId !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.artifactId ||
    observables.contractVersion !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.contractVersion ||
    observables.sha256 !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.sha256 ||
    observables.sizeBytes !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING.sizeBytes
  ) {
    violations.push("exact_observables_binding_invalid");
  }

  const scope =
    content != null && isRecord(content.comparisonScope)
      ? content.comparisonScope
      : null;
  if (
    scope == null ||
    scope.declaredLeverTensorPresent !== false ||
    scope.declaredLeverTensorAllowed !== false ||
    scope.declaredLeverTensorForbidden !== true
  ) {
    violations.push("declared_lever_tensor_forbidden");
  }
  if (
    scope == null ||
    scope.constraintArrayRolesAllowed !== false ||
    scope.constraintComparisonAllowed !== false
  ) {
    violations.push("constraint_comparison_forbidden");
  }

  const tolerance =
    content != null && isRecord(content.tolerancePlan)
      ? content.tolerancePlan
      : null;
  if (exactDifferences(tolerance, CONTENT.tolerancePlan).length > 0) {
    violations.push("tolerance_plan_must_remain_null_and_blocked");
  }
  const evidence =
    content != null && isRecord(content.evidence) ? content.evidence : null;
  if (exactDifferences(evidence, NULL_EVIDENCE).length > 0) {
    violations.push("pair_evidence_must_remain_null");
  }

  const scalar =
    content != null && isRecord(content.scalarComparison)
      ? content.scalarComparison
      : null;
  if (
    scalar == null ||
    scalar.componentwiseEveryScalarMustPass !== true ||
    scalar.normAggregationAllowed !== false ||
    scalar.meanAggregationAllowed !== false ||
    scalar.rmsAggregationAllowed !== false ||
    scalar.averagingCanRescueFailedComponent !== false
  ) {
    violations.push("componentwise_no_aggregation_policy_invalid");
  }

  const authority =
    content != null && isRecord(content.authorityBoundary)
      ? content.authorityBoundary
      : null;
  if (
    authority == null ||
    Object.entries(authority).some(
      ([key, entry]) => key.endsWith("Authority") && entry !== false,
    )
  ) {
    violations.push("authority_must_remain_blocked");
  }
  const locks =
    content != null && isRecord(content.claimLocks) ? content.claimLocks : null;
  if (locks == null) {
    violations.push("claim_locks_invalid");
  } else {
    for (const [key, lock] of Object.entries(locks)) {
      if (lock !== false) {
        violations.push(`claim_lock_must_remain_false:${key}`);
      }
    }
  }
  return unique(violations);
};

export const isNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1 =>
  nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(value)
    .length === 0;
