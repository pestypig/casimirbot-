import {
  CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";
import {
  CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION,
  type CasimirArtifactGenerationReceiptV1,
} from "./casimir-artifact-generation.v1";

export const CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_ARTIFACT_ID =
  "casimir_independent_numerical_verification_request" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION =
  "casimir_independent_numerical_verification_request/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_HASH_DOMAIN =
  "casimir-independent-numerical-verification-request/v1" as const;

export const CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_ARTIFACT_ID =
  "casimir_independent_numerical_verification_certificate" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_SCHEMA_VERSION =
  "casimir_independent_numerical_verification_certificate/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_HASH_DOMAIN =
  "casimir-independent-numerical-verification-certificate/v1" as const;

export const CASIMIR_NUMERICAL_COMPARISON_NORMS = [
  "linf",
  "l2_relative",
] as const;
export type CasimirNumericalComparisonNormV1 =
  (typeof CASIMIR_NUMERICAL_COMPARISON_NORMS)[number];

export const CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_STATUSES = [
  "passed",
  "failed",
  "blocked",
] as const;
export type CasimirIndependentNumericalCertificateStatusV1 =
  (typeof CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_STATUSES)[number];

export type CasimirNumericalImplementationBindingV1 = {
  implementationId: string;
  lineageId: string;
  sourceSha256: string;
  buildManifestSha256: string;
  producerReceipt: {
    schemaVersion: typeof CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION;
    receiptId: string;
    artifactSha256: string;
  };
};

export type CasimirNumericalEnvironmentBindingV1 = {
  environmentId: string;
  toolchainSha256: string;
  runtimeSha256: string;
  platformSha256: string;
};

type CasimirIndependentNumericalAuthorityV1 = {
  outputRole: "evidence_for_bounded_synthesis";
  frozenNumericalComparisonChecked: boolean;
  independentImplementationCompared: boolean;
  validatesSemanticIntent: false;
  validatesTheory: false;
  validatesGeneratedCode: false;
  validatesNumericalImplementation: false;
  validatesEmpiricalClaim: false;
  validatesPhysicalMechanism: false;
  formalPropositionChecked: false;
  assistantAnswer: false;
  terminalEligible: false;
  promotionAllowed: false;
  postToolModelStepRequired: true;
};

export type CasimirIndependentNumericalVerificationRequestV1 = {
  artifactId: typeof CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION;
  generatedAt: string;
  requestId: string;
  artifactSha256: string;
  casimirSpec: {
    specId: string;
    schemaVersion: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION;
    semanticSha256: string;
    artifactSha256: string;
  };
  claim: {
    claimId: string;
    propositionSha256: string;
  };
  primaryImplementation: CasimirNumericalImplementationBindingV1;
  independentImplementation: CasimirNumericalImplementationBindingV1;
  frozenCase: {
    caseId: string;
    inputsSha256: string;
    meshSha256: string;
    initialConditionsSha256: string;
    boundaryConditionsSha256: string;
    observables: Array<{
      observableId: string;
      unit: string;
    }>;
  };
  comparisonPolicy: {
    policyId: string;
    artifactSha256: string;
    norm: CasimirNumericalComparisonNormV1;
    tolerances: Array<{
      observableId: string;
      absoluteTolerance: number;
      relativeTolerance: number;
    }>;
    minimumRefinementLevels: number;
    minimumObservedOrder: number;
    deterministicSeed: string;
  };
  environments: {
    primary: CasimirNumericalEnvironmentBindingV1;
    independent: CasimirNumericalEnvironmentBindingV1;
  };
  executionPolicy: {
    replayCount: 2;
    networkAllowed: false;
    arbitraryCommandAllowed: false;
    outerObservedProcessRequired: true;
  };
  authority: Omit<
    CasimirIndependentNumericalAuthorityV1,
    "frozenNumericalComparisonChecked" | "independentImplementationCompared"
  > & {
    frozenNumericalComparisonChecked: false;
    independentImplementationCompared: false;
  };
};

export type CasimirIndependentNumericalVerificationCertificateV1 = {
  artifactId: typeof CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_SCHEMA_VERSION;
  generatedAt: string;
  certificateId: string;
  artifactSha256: string;
  request: {
    schemaVersion: typeof CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION;
    requestId: string;
    artifactSha256: string;
    casimirSpec: {
      semanticSha256: string;
      artifactSha256: string;
    };
    claimId: string;
    propositionSha256: string;
    frozenCase: {
      caseId: string;
      inputsSha256: string;
      meshSha256: string;
      initialConditionsSha256: string;
      boundaryConditionsSha256: string;
      observableIds: string[];
    };
  };
  status: CasimirIndependentNumericalCertificateStatusV1;
  lineageAudit: {
    primaryLineageId: string;
    independentLineageId: string;
    sourceDistinct: boolean;
    buildManifestDistinct: boolean;
    independenceEstablished: boolean;
  };
  runs: {
    primary: {
      implementationId: string;
      completedReplayCount: number;
      byteIdentical: boolean;
      aggregateOutputManifestSha256: string;
      aggregateTranscriptSha256: string;
      refinementLevels: number;
    };
    independent: {
      implementationId: string;
      completedReplayCount: number;
      byteIdentical: boolean;
      aggregateOutputManifestSha256: string;
      aggregateTranscriptSha256: string;
      refinementLevels: number;
    };
  };
  comparisons: Array<{
    observableId: string;
    unit: string;
    maximumAbsoluteError: number;
    maximumRelativeError: number;
    observedConvergenceOrder: number;
    absoluteTolerance: number;
    relativeTolerance: number;
    withinTolerance: boolean;
    convergenceSatisfied: boolean;
  }>;
  blockers: Array<{
    code: string;
    message: string;
    evidenceRefs: string[];
  }>;
  authority: CasimirIndependentNumericalAuthorityV1;
};

export type BuildCasimirIndependentNumericalVerificationRequestV1Input = Omit<
  CasimirIndependentNumericalVerificationRequestV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & { generatedAt?: string };

export type BuildCasimirIndependentNumericalVerificationCertificateV1Input =
  Omit<
    CasimirIndependentNumericalVerificationCertificateV1,
    | "artifactId"
    | "schemaVersion"
    | "generatedAt"
    | "artifactSha256"
    | "authority"
  > & { generatedAt?: string };

const REQUEST_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "requestId",
  "artifactSha256",
  "casimirSpec",
  "claim",
  "primaryImplementation",
  "independentImplementation",
  "frozenCase",
  "comparisonPolicy",
  "environments",
  "executionPolicy",
  "authority",
] as const;
const CERTIFICATE_KEYS = [
  "artifactId",
  "schemaVersion",
  "generatedAt",
  "certificateId",
  "artifactSha256",
  "request",
  "status",
  "lineageAudit",
  "runs",
  "comparisons",
  "blockers",
  "authority",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isNonNegativeFinite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;
const isSortedUnique = (values: string[]): boolean =>
  values.every(
    (value, index) =>
      index === 0 || values[index - 1].localeCompare(value, "en") < 0,
  );
const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
};

function exactObject(
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (!hasExactKeys(value, keys)) {
    issues.push(`${path} must contain exactly: ${keys.join(", ")}`);
  }
  return true;
}

function sha(value: unknown, path: string, issues: string[]): void {
  if (!isSha256(value)) issues.push(`${path} must be lowercase SHA-256`);
}

function timestamp(value: unknown, path: string, issues: string[]): void {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    issues.push(`${path} must be an ISO-compatible timestamp`);
  }
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: string[],
): string[] {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    issues.push(`${path} must be an array of non-empty strings`);
    return [];
  }
  if (!isSortedUnique(value))
    issues.push(`${path} must be sorted and duplicate-free`);
  return value;
}

function validateImplementation(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (
    !exactObject(
      value,
      [
        "implementationId",
        "lineageId",
        "sourceSha256",
        "buildManifestSha256",
        "producerReceipt",
      ],
      path,
      issues,
    )
  )
    return;
  for (const field of ["implementationId", "lineageId"] as const) {
    if (!isNonEmptyString(value[field]))
      issues.push(`${path}.${field} must be non-empty`);
  }
  sha(value.sourceSha256, `${path}.sourceSha256`, issues);
  sha(value.buildManifestSha256, `${path}.buildManifestSha256`, issues);
  if (
    exactObject(
      value.producerReceipt,
      ["schemaVersion", "receiptId", "artifactSha256"],
      `${path}.producerReceipt`,
      issues,
    )
  ) {
    if (
      value.producerReceipt.schemaVersion !==
      CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION
    ) {
      issues.push(
        `${path}.producerReceipt.schemaVersion must be ${CASIMIR_ARTIFACT_GENERATION_RECEIPT_SCHEMA_VERSION}`,
      );
    }
    if (!isNonEmptyString(value.producerReceipt.receiptId))
      issues.push(`${path}.producerReceipt.receiptId must be non-empty`);
    sha(
      value.producerReceipt.artifactSha256,
      `${path}.producerReceipt.artifactSha256`,
      issues,
    );
  }
}

function validateEnvironment(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (
    !exactObject(
      value,
      ["environmentId", "toolchainSha256", "runtimeSha256", "platformSha256"],
      path,
      issues,
    )
  )
    return;
  if (!isNonEmptyString(value.environmentId))
    issues.push(`${path}.environmentId must be non-empty`);
  for (const field of [
    "toolchainSha256",
    "runtimeSha256",
    "platformSha256",
  ] as const) {
    sha(value[field], `${path}.${field}`, issues);
  }
}

function validateAuthority(
  value: unknown,
  checked: boolean,
  path: string,
  issues: string[],
): void {
  if (
    !exactObject(
      value,
      [
        "outputRole",
        "frozenNumericalComparisonChecked",
        "independentImplementationCompared",
        "validatesSemanticIntent",
        "validatesTheory",
        "validatesGeneratedCode",
        "validatesNumericalImplementation",
        "validatesEmpiricalClaim",
        "validatesPhysicalMechanism",
        "formalPropositionChecked",
        "assistantAnswer",
        "terminalEligible",
        "promotionAllowed",
        "postToolModelStepRequired",
      ],
      path,
      issues,
    )
  )
    return;
  if (value.outputRole !== "evidence_for_bounded_synthesis")
    issues.push(`${path}.outputRole must be evidence_for_bounded_synthesis`);
  for (const field of [
    "frozenNumericalComparisonChecked",
    "independentImplementationCompared",
  ] as const) {
    if (value[field] !== checked)
      issues.push(`${path}.${field} must be ${String(checked)}`);
  }
  for (const field of [
    "validatesSemanticIntent",
    "validatesTheory",
    "validatesGeneratedCode",
    "validatesNumericalImplementation",
    "validatesEmpiricalClaim",
    "validatesPhysicalMechanism",
    "formalPropositionChecked",
    "assistantAnswer",
    "terminalEligible",
    "promotionAllowed",
  ] as const) {
    if (value[field] !== false) issues.push(`${path}.${field} must be false`);
  }
  if (value.postToolModelStepRequired !== true)
    issues.push(`${path}.postToolModelStepRequired must be true`);
}

export function validateCasimirIndependentNumericalVerificationRequestV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!exactObject(value, REQUEST_KEYS, "$", issues)) return issues;
  if (value.artifactId !== CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_ARTIFACT_ID)
    issues.push(
      `artifactId must be ${CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_ARTIFACT_ID}`,
    );
  if (
    value.schemaVersion !== CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION}`,
    );
  }
  timestamp(value.generatedAt, "generatedAt", issues);
  if (!isNonEmptyString(value.requestId))
    issues.push("requestId must be non-empty");
  sha(value.artifactSha256, "artifactSha256", issues);

  if (
    exactObject(
      value.casimirSpec,
      ["specId", "schemaVersion", "semanticSha256", "artifactSha256"],
      "casimirSpec",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.casimirSpec.specId))
      issues.push("casimirSpec.specId must be non-empty");
    if (
      value.casimirSpec.schemaVersion !==
      CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION
    ) {
      issues.push(
        `casimirSpec.schemaVersion must be ${CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION}`,
      );
    }
    sha(value.casimirSpec.semanticSha256, "casimirSpec.semanticSha256", issues);
    sha(value.casimirSpec.artifactSha256, "casimirSpec.artifactSha256", issues);
  }
  if (
    exactObject(value.claim, ["claimId", "propositionSha256"], "claim", issues)
  ) {
    if (!isNonEmptyString(value.claim.claimId))
      issues.push("claim.claimId must be non-empty");
    sha(value.claim.propositionSha256, "claim.propositionSha256", issues);
  }
  validateImplementation(
    value.primaryImplementation,
    "primaryImplementation",
    issues,
  );
  validateImplementation(
    value.independentImplementation,
    "independentImplementation",
    issues,
  );
  if (
    isRecord(value.primaryImplementation) &&
    isRecord(value.independentImplementation)
  ) {
    if (
      value.primaryImplementation.lineageId ===
      value.independentImplementation.lineageId
    ) {
      issues.push("implementation lineageIds must be distinct");
    }
    if (
      value.primaryImplementation.sourceSha256 ===
      value.independentImplementation.sourceSha256
    ) {
      issues.push("implementation source hashes must be distinct");
    }
    if (
      value.primaryImplementation.buildManifestSha256 ===
      value.independentImplementation.buildManifestSha256
    ) {
      issues.push("implementation build manifest hashes must be distinct");
    }
    if (
      isRecord(value.primaryImplementation.producerReceipt) &&
      isRecord(value.independentImplementation.producerReceipt) &&
      (value.primaryImplementation.producerReceipt.receiptId ===
        value.independentImplementation.producerReceipt.receiptId ||
        value.primaryImplementation.producerReceipt.artifactSha256 ===
          value.independentImplementation.producerReceipt.artifactSha256)
    ) {
      issues.push("implementation producer receipts must be distinct");
    }
  }

  if (
    exactObject(
      value.frozenCase,
      [
        "caseId",
        "inputsSha256",
        "meshSha256",
        "initialConditionsSha256",
        "boundaryConditionsSha256",
        "observables",
      ],
      "frozenCase",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.frozenCase.caseId))
      issues.push("frozenCase.caseId must be non-empty");
    for (const field of [
      "inputsSha256",
      "meshSha256",
      "initialConditionsSha256",
      "boundaryConditionsSha256",
    ] as const) {
      sha(value.frozenCase[field], `frozenCase.${field}`, issues);
    }
    if (
      !Array.isArray(value.frozenCase.observables) ||
      value.frozenCase.observables.length === 0
    ) {
      issues.push("frozenCase.observables must be a non-empty array");
    } else {
      const ids: string[] = [];
      value.frozenCase.observables.forEach((entry, index) => {
        const path = `frozenCase.observables[${index}]`;
        if (!exactObject(entry, ["observableId", "unit"], path, issues)) return;
        if (!isNonEmptyString(entry.observableId))
          issues.push(`${path}.observableId must be non-empty`);
        else ids.push(entry.observableId);
        if (!isNonEmptyString(entry.unit))
          issues.push(`${path}.unit must be non-empty`);
      });
      if (!isSortedUnique(ids)) {
        issues.push(
          "frozenCase.observables must be sorted by observableId and duplicate-free",
        );
      }
    }
  }

  if (
    exactObject(
      value.comparisonPolicy,
      [
        "policyId",
        "artifactSha256",
        "norm",
        "tolerances",
        "minimumRefinementLevels",
        "minimumObservedOrder",
        "deterministicSeed",
      ],
      "comparisonPolicy",
      issues,
    )
  ) {
    if (!isNonEmptyString(value.comparisonPolicy.policyId))
      issues.push("comparisonPolicy.policyId must be non-empty");
    sha(
      value.comparisonPolicy.artifactSha256,
      "comparisonPolicy.artifactSha256",
      issues,
    );
    if (
      !CASIMIR_NUMERICAL_COMPARISON_NORMS.includes(
        value.comparisonPolicy.norm as CasimirNumericalComparisonNormV1,
      )
    ) {
      issues.push("comparisonPolicy.norm is invalid");
    }
    if (
      !Array.isArray(value.comparisonPolicy.tolerances) ||
      value.comparisonPolicy.tolerances.length === 0
    ) {
      issues.push("comparisonPolicy.tolerances must be a non-empty array");
    } else {
      const ids: string[] = [];
      value.comparisonPolicy.tolerances.forEach((entry, index) => {
        const path = `comparisonPolicy.tolerances[${index}]`;
        if (
          !exactObject(
            entry,
            ["observableId", "absoluteTolerance", "relativeTolerance"],
            path,
            issues,
          )
        )
          return;
        if (!isNonEmptyString(entry.observableId))
          issues.push(`${path}.observableId must be non-empty`);
        else ids.push(entry.observableId);
        for (const field of [
          "absoluteTolerance",
          "relativeTolerance",
        ] as const) {
          if (!isNonNegativeFinite(entry[field]))
            issues.push(`${path}.${field} must be finite and non-negative`);
        }
      });
      if (!isSortedUnique(ids)) {
        issues.push(
          "comparisonPolicy.tolerances must be sorted by observableId and duplicate-free",
        );
      }
      if (
        isRecord(value.frozenCase) &&
        Array.isArray(value.frozenCase.observables)
      ) {
        const observableIds = value.frozenCase.observables
          .filter(isRecord)
          .map((entry) => entry.observableId);
        if (JSON.stringify(ids) !== JSON.stringify(observableIds)) {
          issues.push(
            "comparisonPolicy tolerances must exactly cover frozenCase observables",
          );
        }
      }
    }
    if (
      !isPositiveInteger(value.comparisonPolicy.minimumRefinementLevels) ||
      Number(value.comparisonPolicy.minimumRefinementLevels) < 2
    ) {
      issues.push(
        "comparisonPolicy.minimumRefinementLevels must be an integer of at least 2",
      );
    }
    if (!isNonNegativeFinite(value.comparisonPolicy.minimumObservedOrder)) {
      issues.push(
        "comparisonPolicy.minimumObservedOrder must be finite and non-negative",
      );
    }
    if (!isNonEmptyString(value.comparisonPolicy.deterministicSeed))
      issues.push("comparisonPolicy.deterministicSeed must be non-empty");
  }

  if (
    exactObject(
      value.environments,
      ["primary", "independent"],
      "environments",
      issues,
    )
  ) {
    validateEnvironment(
      value.environments.primary,
      "environments.primary",
      issues,
    );
    validateEnvironment(
      value.environments.independent,
      "environments.independent",
      issues,
    );
  }
  if (
    exactObject(
      value.executionPolicy,
      [
        "replayCount",
        "networkAllowed",
        "arbitraryCommandAllowed",
        "outerObservedProcessRequired",
      ],
      "executionPolicy",
      issues,
    )
  ) {
    if (value.executionPolicy.replayCount !== 2)
      issues.push("executionPolicy.replayCount must be 2");
    if (value.executionPolicy.networkAllowed !== false)
      issues.push("executionPolicy.networkAllowed must be false");
    if (value.executionPolicy.arbitraryCommandAllowed !== false)
      issues.push("executionPolicy.arbitraryCommandAllowed must be false");
    if (value.executionPolicy.outerObservedProcessRequired !== true)
      issues.push("executionPolicy.outerObservedProcessRequired must be true");
  }
  validateAuthority(value.authority, false, "authority", issues);
  return issues;
}

function validateRun(value: unknown, path: string, issues: string[]): void {
  if (
    !exactObject(
      value,
      [
        "implementationId",
        "completedReplayCount",
        "byteIdentical",
        "aggregateOutputManifestSha256",
        "aggregateTranscriptSha256",
        "refinementLevels",
      ],
      path,
      issues,
    )
  )
    return;
  if (!isNonEmptyString(value.implementationId))
    issues.push(`${path}.implementationId must be non-empty`);
  if (
    !Number.isSafeInteger(value.completedReplayCount) ||
    Number(value.completedReplayCount) < 0 ||
    Number(value.completedReplayCount) > 2
  ) {
    issues.push(`${path}.completedReplayCount must be an integer from 0 to 2`);
  }
  if (typeof value.byteIdentical !== "boolean")
    issues.push(`${path}.byteIdentical must be boolean`);
  sha(
    value.aggregateOutputManifestSha256,
    `${path}.aggregateOutputManifestSha256`,
    issues,
  );
  sha(
    value.aggregateTranscriptSha256,
    `${path}.aggregateTranscriptSha256`,
    issues,
  );
  if (!isPositiveInteger(value.refinementLevels))
    issues.push(`${path}.refinementLevels must be a positive safe integer`);
}

function validateBlockers(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return;
  }
  const codes: string[] = [];
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    if (
      !exactObject(entry, ["code", "message", "evidenceRefs"], itemPath, issues)
    )
      return;
    if (!isNonEmptyString(entry.code))
      issues.push(`${itemPath}.code must be non-empty`);
    else codes.push(entry.code);
    if (!isNonEmptyString(entry.message))
      issues.push(`${itemPath}.message must be non-empty`);
    validateStringArray(entry.evidenceRefs, `${itemPath}.evidenceRefs`, issues);
  });
  if (!isSortedUnique(codes))
    issues.push(`${path} must be sorted by code and duplicate-free`);
}

export function validateCasimirIndependentNumericalVerificationCertificateV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!exactObject(value, CERTIFICATE_KEYS, "$", issues)) return issues;
  if (
    value.artifactId !== CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_ARTIFACT_ID
  ) {
    issues.push(
      `artifactId must be ${CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_ARTIFACT_ID}`,
    );
  }
  if (
    value.schemaVersion !==
    CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_SCHEMA_VERSION
  ) {
    issues.push(
      `schemaVersion must be ${CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_SCHEMA_VERSION}`,
    );
  }
  timestamp(value.generatedAt, "generatedAt", issues);
  if (!isNonEmptyString(value.certificateId))
    issues.push("certificateId must be non-empty");
  sha(value.artifactSha256, "artifactSha256", issues);

  if (
    exactObject(
      value.request,
      [
        "schemaVersion",
        "requestId",
        "artifactSha256",
        "casimirSpec",
        "claimId",
        "propositionSha256",
        "frozenCase",
      ],
      "request",
      issues,
    )
  ) {
    if (
      value.request.schemaVersion !==
      CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION
    ) {
      issues.push(
        `request.schemaVersion must be ${CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION}`,
      );
    }
    for (const field of ["requestId", "claimId"] as const) {
      if (!isNonEmptyString(value.request[field]))
        issues.push(`request.${field} must be non-empty`);
    }
    for (const field of ["artifactSha256", "propositionSha256"] as const) {
      sha(value.request[field], `request.${field}`, issues);
    }
    if (
      exactObject(
        value.request.casimirSpec,
        ["semanticSha256", "artifactSha256"],
        "request.casimirSpec",
        issues,
      )
    ) {
      sha(
        value.request.casimirSpec.semanticSha256,
        "request.casimirSpec.semanticSha256",
        issues,
      );
      sha(
        value.request.casimirSpec.artifactSha256,
        "request.casimirSpec.artifactSha256",
        issues,
      );
    }
    if (
      exactObject(
        value.request.frozenCase,
        [
          "caseId",
          "inputsSha256",
          "meshSha256",
          "initialConditionsSha256",
          "boundaryConditionsSha256",
          "observableIds",
        ],
        "request.frozenCase",
        issues,
      )
    ) {
      if (!isNonEmptyString(value.request.frozenCase.caseId)) {
        issues.push("request.frozenCase.caseId must be non-empty");
      }
      for (const field of [
        "inputsSha256",
        "meshSha256",
        "initialConditionsSha256",
        "boundaryConditionsSha256",
      ] as const) {
        sha(
          value.request.frozenCase[field],
          `request.frozenCase.${field}`,
          issues,
        );
      }
      const observableIds = validateStringArray(
        value.request.frozenCase.observableIds,
        "request.frozenCase.observableIds",
        issues,
      );
      if (observableIds.length === 0) {
        issues.push(
          "request.frozenCase.observableIds must be a non-empty array",
        );
      }
    }
  }

  const passed = value.status === "passed";
  if (
    !CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_STATUSES.includes(
      value.status as CasimirIndependentNumericalCertificateStatusV1,
    )
  ) {
    issues.push("status is invalid");
  }
  let independenceEstablished: unknown;
  if (
    exactObject(
      value.lineageAudit,
      [
        "primaryLineageId",
        "independentLineageId",
        "sourceDistinct",
        "buildManifestDistinct",
        "independenceEstablished",
      ],
      "lineageAudit",
      issues,
    )
  ) {
    for (const field of ["primaryLineageId", "independentLineageId"] as const) {
      if (!isNonEmptyString(value.lineageAudit[field]))
        issues.push(`lineageAudit.${field} must be non-empty`);
    }
    for (const field of [
      "sourceDistinct",
      "buildManifestDistinct",
      "independenceEstablished",
    ] as const) {
      if (typeof value.lineageAudit[field] !== "boolean")
        issues.push(`lineageAudit.${field} must be boolean`);
    }
    independenceEstablished = value.lineageAudit.independenceEstablished;
    const derived =
      value.lineageAudit.primaryLineageId !==
        value.lineageAudit.independentLineageId &&
      value.lineageAudit.sourceDistinct === true &&
      value.lineageAudit.buildManifestDistinct === true;
    if (independenceEstablished !== derived) {
      issues.push(
        "lineageAudit.independenceEstablished must exactly reflect distinct lineages and artifacts",
      );
    }
  }

  if (exactObject(value.runs, ["primary", "independent"], "runs", issues)) {
    validateRun(value.runs.primary, "runs.primary", issues);
    validateRun(value.runs.independent, "runs.independent", issues);
  }
  if (!Array.isArray(value.comparisons) || value.comparisons.length === 0) {
    issues.push("comparisons must be a non-empty array");
  } else {
    const ids: string[] = [];
    value.comparisons.forEach((entry, index) => {
      const path = `comparisons[${index}]`;
      if (
        !exactObject(
          entry,
          [
            "observableId",
            "unit",
            "maximumAbsoluteError",
            "maximumRelativeError",
            "observedConvergenceOrder",
            "absoluteTolerance",
            "relativeTolerance",
            "withinTolerance",
            "convergenceSatisfied",
          ],
          path,
          issues,
        )
      )
        return;
      if (!isNonEmptyString(entry.observableId))
        issues.push(`${path}.observableId must be non-empty`);
      else ids.push(entry.observableId);
      if (!isNonEmptyString(entry.unit))
        issues.push(`${path}.unit must be non-empty`);
      for (const field of [
        "maximumAbsoluteError",
        "maximumRelativeError",
        "observedConvergenceOrder",
        "absoluteTolerance",
        "relativeTolerance",
      ] as const) {
        if (!isNonNegativeFinite(entry[field]))
          issues.push(`${path}.${field} must be finite and non-negative`);
      }
      if (typeof entry.withinTolerance !== "boolean")
        issues.push(`${path}.withinTolerance must be boolean`);
      if (typeof entry.convergenceSatisfied !== "boolean")
        issues.push(`${path}.convergenceSatisfied must be boolean`);
      if (
        isNonNegativeFinite(entry.maximumAbsoluteError) &&
        isNonNegativeFinite(entry.maximumRelativeError) &&
        isNonNegativeFinite(entry.absoluteTolerance) &&
        isNonNegativeFinite(entry.relativeTolerance)
      ) {
        const within =
          entry.maximumAbsoluteError <= entry.absoluteTolerance ||
          entry.maximumRelativeError <= entry.relativeTolerance;
        if (entry.withinTolerance !== within) {
          issues.push(
            `${path}.withinTolerance must exactly reflect the declared tolerances`,
          );
        }
      }
    });
    if (!isSortedUnique(ids)) {
      issues.push(
        "comparisons must be sorted by observableId and duplicate-free",
      );
    }
  }
  validateBlockers(value.blockers, "blockers", issues);
  validateAuthority(value.authority, passed, "authority", issues);

  if (passed) {
    if (independenceEstablished !== true)
      issues.push("passed status requires independent implementation lineage");
    for (const lane of ["primary", "independent"] as const) {
      const run = isRecord(value.runs) ? value.runs[lane] : null;
      if (
        !isRecord(run) ||
        run.completedReplayCount !== 2 ||
        run.byteIdentical !== true
      ) {
        issues.push(
          `passed status requires two byte-identical ${lane} replays`,
        );
      }
    }
    if (
      Array.isArray(value.comparisons) &&
      value.comparisons.some(
        (entry) =>
          !isRecord(entry) ||
          entry.withinTolerance !== true ||
          entry.convergenceSatisfied !== true,
      )
    ) {
      issues.push(
        "passed status requires every comparison within tolerance and converged",
      );
    }
    if (Array.isArray(value.blockers) && value.blockers.length > 0)
      issues.push("passed status requires no blockers");
  } else if (Array.isArray(value.blockers) && value.blockers.length === 0) {
    issues.push("non-passed status requires at least one blocker");
  }
  return issues;
}

const authority = <Checked extends boolean>(
  checked: Checked,
): Omit<
  CasimirIndependentNumericalAuthorityV1,
  "frozenNumericalComparisonChecked" | "independentImplementationCompared"
> & {
  frozenNumericalComparisonChecked: Checked;
  independentImplementationCompared: Checked;
} => ({
  outputRole: "evidence_for_bounded_synthesis",
  frozenNumericalComparisonChecked: checked,
  independentImplementationCompared: checked,
  validatesSemanticIntent: false,
  validatesTheory: false,
  validatesGeneratedCode: false,
  validatesNumericalImplementation: false,
  validatesEmpiricalClaim: false,
  validatesPhysicalMechanism: false,
  formalPropositionChecked: false,
  assistantAnswer: false,
  terminalEligible: false,
  promotionAllowed: false,
  postToolModelStepRequired: true,
});

export async function buildCasimirIndependentNumericalVerificationRequestV1(
  input: BuildCasimirIndependentNumericalVerificationRequestV1Input,
): Promise<CasimirIndependentNumericalVerificationRequestV1> {
  const withoutHash: Omit<
    CasimirIndependentNumericalVerificationRequestV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_ARTIFACT_ID,
    schemaVersion: CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    casimirSpec: input.casimirSpec,
    claim: input.claim,
    primaryImplementation: input.primaryImplementation,
    independentImplementation: input.independentImplementation,
    frozenCase: input.frozenCase,
    comparisonPolicy: input.comparisonPolicy,
    environments: input.environments,
    executionPolicy: input.executionPolicy,
    authority: authority(false),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function buildCasimirIndependentNumericalVerificationCertificateV1(
  input: BuildCasimirIndependentNumericalVerificationCertificateV1Input,
): Promise<CasimirIndependentNumericalVerificationCertificateV1> {
  const withoutHash: Omit<
    CasimirIndependentNumericalVerificationCertificateV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_ARTIFACT_ID,
    schemaVersion: CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    certificateId: input.certificateId,
    request: input.request,
    status: input.status,
    lineageAudit: input.lineageAudit,
    runs: input.runs,
    comparisons: input.comparisons,
    blockers: input.blockers,
    authority: authority(input.status === "passed"),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

async function integrity(
  value: unknown,
  domain: string,
  validate: (candidate: unknown) => string[],
  label: string,
): Promise<string[]> {
  const issues = validate(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain,
    value: withoutHash,
  });
  if (artifactSha256 !== expected)
    issues.push(`artifactSha256 does not match ${label} content`);
  return issues;
}

export async function validateCasimirIndependentNumericalVerificationRequestIntegrityV1(
  value: unknown,
): Promise<string[]> {
  return integrity(
    value,
    CASIMIR_INDEPENDENT_NUMERICAL_REQUEST_HASH_DOMAIN,
    validateCasimirIndependentNumericalVerificationRequestV1,
    "request",
  );
}

export async function validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
  value: unknown,
): Promise<string[]> {
  return integrity(
    value,
    CASIMIR_INDEPENDENT_NUMERICAL_CERTIFICATE_HASH_DOMAIN,
    validateCasimirIndependentNumericalVerificationCertificateV1,
    "certificate",
  );
}

export function validateCasimirIndependentNumericalCertificateAgainstRequestV1(
  certificate: CasimirIndependentNumericalVerificationCertificateV1,
  request: CasimirIndependentNumericalVerificationRequestV1,
): string[] {
  const issues: string[] = [];
  if (certificate.request.requestId !== request.requestId)
    issues.push("certificate requestId does not match request");
  if (certificate.request.artifactSha256 !== request.artifactSha256)
    issues.push("certificate request hash does not match request");
  if (
    certificate.request.casimirSpec.semanticSha256 !==
    request.casimirSpec.semanticSha256
  ) {
    issues.push(
      "certificate Casimir Spec semantic hash does not match request",
    );
  }
  if (
    certificate.request.casimirSpec.artifactSha256 !==
    request.casimirSpec.artifactSha256
  ) {
    issues.push(
      "certificate Casimir Spec artifact hash does not match request",
    );
  }
  if (certificate.request.claimId !== request.claim.claimId)
    issues.push("certificate claimId does not match request");
  if (certificate.request.propositionSha256 !== request.claim.propositionSha256)
    issues.push("certificate proposition hash does not match request");
  if (certificate.request.frozenCase.caseId !== request.frozenCase.caseId) {
    issues.push("certificate frozen caseId does not match request");
  }
  for (const field of [
    "inputsSha256",
    "meshSha256",
    "initialConditionsSha256",
    "boundaryConditionsSha256",
  ] as const) {
    if (certificate.request.frozenCase[field] !== request.frozenCase[field]) {
      issues.push(`certificate frozen case ${field} does not match request`);
    }
  }
  const requestedObservableIds = request.frozenCase.observables.map(
    (observable) => observable.observableId,
  );
  if (
    JSON.stringify(certificate.request.frozenCase.observableIds) !==
    JSON.stringify(requestedObservableIds)
  ) {
    issues.push("certificate frozen case observableIds do not match request");
  }
  if (
    certificate.lineageAudit.primaryLineageId !==
    request.primaryImplementation.lineageId
  ) {
    issues.push("certificate primary lineage does not match request");
  }
  if (
    certificate.lineageAudit.independentLineageId !==
    request.independentImplementation.lineageId
  ) {
    issues.push("certificate independent lineage does not match request");
  }
  if (
    certificate.runs.primary.implementationId !==
    request.primaryImplementation.implementationId
  ) {
    issues.push("certificate primary implementation does not match request");
  }
  if (
    certificate.runs.independent.implementationId !==
    request.independentImplementation.implementationId
  ) {
    issues.push(
      "certificate independent implementation does not match request",
    );
  }
  const expectedObservables = new Map(
    request.frozenCase.observables.map((observable) => [
      observable.observableId,
      observable,
    ]),
  );
  const tolerances = new Map(
    request.comparisonPolicy.tolerances.map((tolerance) => [
      tolerance.observableId,
      tolerance,
    ]),
  );
  const observed = new Set<string>();
  for (const comparison of certificate.comparisons) {
    observed.add(comparison.observableId);
    const observable = expectedObservables.get(comparison.observableId);
    const tolerance = tolerances.get(comparison.observableId);
    if (!observable) {
      issues.push(
        `certificate comparison is not requested: ${comparison.observableId}`,
      );
      continue;
    }
    if (comparison.unit !== observable.unit)
      issues.push(`comparison unit mismatch: ${comparison.observableId}`);
    if (
      !tolerance ||
      comparison.absoluteTolerance !== tolerance.absoluteTolerance ||
      comparison.relativeTolerance !== tolerance.relativeTolerance
    ) {
      issues.push(`comparison tolerance mismatch: ${comparison.observableId}`);
    }
    if (
      comparison.observedConvergenceOrder <
      request.comparisonPolicy.minimumObservedOrder
    ) {
      issues.push(
        `comparison convergence order below policy: ${comparison.observableId}`,
      );
    }
  }
  for (const observableId of expectedObservables.keys()) {
    if (!observed.has(observableId))
      issues.push(`requested observable missing: ${observableId}`);
  }
  for (const [lane, run] of [
    ["primary", certificate.runs.primary],
    ["independent", certificate.runs.independent],
  ] as const) {
    if (
      run.refinementLevels < request.comparisonPolicy.minimumRefinementLevels
    ) {
      issues.push(`${lane} refinement levels below comparison policy`);
    }
  }
  return issues;
}

export function validateCasimirNumericalImplementationAgainstProducerReceiptV1(
  implementation: CasimirNumericalImplementationBindingV1,
  receipt: CasimirArtifactGenerationReceiptV1,
): string[] {
  const issues: string[] = [];
  if (implementation.producerReceipt.receiptId !== receipt.receiptId)
    issues.push("implementation producer receiptId does not match receipt");
  if (
    implementation.producerReceipt.artifactSha256 !== receipt.artifactSha256
  ) {
    issues.push("implementation producer receipt hash does not match receipt");
  }
  const sourceMatch = receipt.artifacts.some(
    (artifact) =>
      artifact.role === "implementation_source" &&
      artifact.artifactSha256 === implementation.sourceSha256,
  );
  if (!sourceMatch)
    issues.push("implementation source hash is absent from producer receipt");
  const manifestMatch = receipt.artifacts.some(
    (artifact) =>
      artifact.role === "build_manifest" &&
      artifact.artifactSha256 === implementation.buildManifestSha256,
  );
  if (!manifestMatch)
    issues.push(
      "implementation build manifest is absent from producer receipt",
    );
  return issues;
}
