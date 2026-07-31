import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_ARTIFACT_ID =
  "scientific_evidence_conformance_manifest" as const;
export const SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION =
  "scientific_evidence_conformance_manifest/v1" as const;
export const SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_HASH_DOMAIN =
  "scientific-evidence-conformance-manifest/v1" as const;

export type ScientificEvidenceConformanceManifestV1 = {
  artifactId: typeof SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_ARTIFACT_ID;
  schemaVersion: typeof SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION;
  manifestId: string;
  generatedAt: string;
  artifactSha256: string;
  orientation: {
    orientationId: string;
    graphId: string;
    selectedBadgeIds: string[];
    orderedEdgeIds: string[];
    operation: "compare_parameter_intervention";
  };
  sourceClaim: {
    sourceClaimId: string;
    producerId: string;
    repositoryUri: string;
    commitSha: string;
    caseId: string;
    sourceArtifact: {
      role: "scientific_specification";
      logicalPath: string;
      sha256: string;
    };
    extraction: {
      language: string;
      selector: string;
      extractedStatementSha256: string;
    };
  };
  semanticBindings: {
    formalCasimirSpec: {
      specId: string;
      semanticSha256: string;
      artifactSha256: string;
      claimId: string;
      propositionSha256: string;
    };
    numericalCasimirSpec: {
      specId: string;
      semanticSha256: string;
      artifactSha256: string;
      claimId: string;
      propositionSha256: string;
    };
  };
  parameterPolicy: {
    mutableParameterId: string;
    sourceSymbol: string;
    unit: string;
    canonicalEncoding: "exact_decimal_string";
    minimumInclusive: string;
    maximumInclusive: string;
    baselineValue: string;
    permittedValues: string[];
    frozenParameters: Array<{
      parameterId: string;
      sourceSymbol: string;
      unit: string;
      value: string;
    }>;
  };
  formalContract: {
    formalArtifactId: string;
    theoremModule: string;
    theoremName: string;
    sourceLogicalPath: string;
    sourceSha256: string;
    propositionScope: "contract_subclaim";
    requiredClaimCeiling: "formal_contract_checked";
  };
  numericalContract: {
    baselineCaseId: string;
    interventionCaseId: string;
    primaryLineageId: string;
    independentLineageId: string;
    independentLaneKind: "numerical_solver";
    observableIds: string[];
    minimumRefinementLevels: number;
    replayCount: 2;
  };
  closurePolicy: {
    requiredAxes: Array<
      | "source"
      | "semantic"
      | "graph"
      | "formal"
      | "independent_numerical"
      | "comparison"
    >;
    empiricalEvidenceRequired: false;
    maximumClaimCeiling: "synthetic_computational";
    currentTurnEvidenceReentryRequired: true;
    immutableReceiptRequired: true;
  };
  authority: {
    outputRole: "scientific_execution_enrollment";
    executesTools: false;
    sourceAuthority: false;
    semanticAuthority: false;
    formalAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
    promotionAllowed: false;
  };
};

export type BuildScientificEvidenceConformanceManifestV1Input = Omit<
  ScientificEvidenceConformanceManifestV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & {
  generatedAt?: string;
};

const SHA256 = /^[a-f0-9]{64}$/;
const EXACT_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const PORTABLE_PATH = /^(?!\/)(?![A-Za-z]:[\\/])(?!.*(?:^|[\\/])\.\.(?:[\\/]|$)).+$/;
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const sha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sortedUnique = (values: string[]): boolean =>
  values.every(
    (entry, index) =>
      index === 0 || values[index - 1].localeCompare(entry, "en") < 0,
  );
const exactKeys = (
  value: unknown,
  expected: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  const observed = Object.keys(value).sort();
  const canonicalExpected = [...expected].sort();
  if (JSON.stringify(observed) !== JSON.stringify(canonicalExpected)) {
    issues.push(`${path} has unexpected or missing fields`);
    return false;
  }
  return true;
};
const requireString = (
  value: unknown,
  path: string,
  issues: string[],
): void => {
  if (!nonEmpty(value)) issues.push(`${path} must be non-empty`);
};
const requireSha = (
  value: unknown,
  path: string,
  issues: string[],
): void => {
  if (!sha(value)) issues.push(`${path} must be lowercase SHA-256`);
};
const requireSortedStrings = (
  value: unknown,
  path: string,
  issues: string[],
  allowEmpty = false,
): value is string[] => {
  if (
    !Array.isArray(value) ||
    (!allowEmpty && value.length === 0) ||
    !value.every(nonEmpty) ||
    !sortedUnique(value)
  ) {
    issues.push(`${path} must be a sorted, duplicate-free string array`);
    return false;
  }
  return true;
};

export async function computeScientificEvidenceConformanceManifestSha256V1(
  value: Omit<ScientificEvidenceConformanceManifestV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_HASH_DOMAIN,
    value,
  });
}

export async function buildScientificEvidenceConformanceManifestV1(
  input: BuildScientificEvidenceConformanceManifestV1Input,
): Promise<ScientificEvidenceConformanceManifestV1> {
  const withoutHash: Omit<
    ScientificEvidenceConformanceManifestV1,
    "artifactSha256"
  > = {
    ...input,
    artifactId: SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_ARTIFACT_ID,
    schemaVersion: SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: {
      outputRole: "scientific_execution_enrollment",
      executesTools: false,
      sourceAuthority: false,
      semanticAuthority: false,
      formalAuthority: false,
      numericalAuthority: false,
      empiricalAuthority: false,
      physicalAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
      promotionAllowed: false,
    },
  };
  return {
    ...withoutHash,
    artifactSha256:
      await computeScientificEvidenceConformanceManifestSha256V1(withoutHash),
  };
}

export function validateScientificEvidenceConformanceManifestShapeV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactKeys(
      value,
      [
        "artifactId",
        "schemaVersion",
        "manifestId",
        "generatedAt",
        "artifactSha256",
        "orientation",
        "sourceClaim",
        "semanticBindings",
        "parameterPolicy",
        "formalContract",
        "numericalContract",
        "closurePolicy",
        "authority",
      ],
      "manifest",
      issues,
    )
  ) {
    return issues;
  }
  if (value.artifactId !== SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (
    value.schemaVersion !==
    SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION
  )
    issues.push("schemaVersion is invalid");
  requireString(value.manifestId, "manifestId", issues);
  requireString(value.generatedAt, "generatedAt", issues);
  if (
    typeof value.generatedAt === "string" &&
    Number.isNaN(Date.parse(value.generatedAt))
  )
    issues.push("generatedAt must be an ISO-compatible timestamp");
  requireSha(value.artifactSha256, "artifactSha256", issues);

  if (
    exactKeys(
      value.orientation,
      [
        "orientationId",
        "graphId",
        "selectedBadgeIds",
        "orderedEdgeIds",
        "operation",
      ],
      "orientation",
      issues,
    )
  ) {
    requireString(value.orientation.orientationId, "orientation.orientationId", issues);
    requireString(value.orientation.graphId, "orientation.graphId", issues);
    requireSortedStrings(
      value.orientation.selectedBadgeIds,
      "orientation.selectedBadgeIds",
      issues,
    );
    requireSortedStrings(
      value.orientation.orderedEdgeIds,
      "orientation.orderedEdgeIds",
      issues,
    );
    if (value.orientation.operation !== "compare_parameter_intervention")
      issues.push("orientation.operation is invalid");
  }

  if (
    exactKeys(
      value.sourceClaim,
      [
        "sourceClaimId",
        "producerId",
        "repositoryUri",
        "commitSha",
        "caseId",
        "sourceArtifact",
        "extraction",
      ],
      "sourceClaim",
      issues,
    )
  ) {
    for (const field of [
      "sourceClaimId",
      "producerId",
      "repositoryUri",
      "caseId",
    ] as const)
      requireString(value.sourceClaim[field], `sourceClaim.${field}`, issues);
    if (
      typeof value.sourceClaim.repositoryUri === "string" &&
      !/^https:\/\/[^/]+\/.+/.test(value.sourceClaim.repositoryUri)
    )
      issues.push("sourceClaim.repositoryUri must be an HTTPS repository URI");
    if (
      typeof value.sourceClaim.commitSha !== "string" ||
      !/^[a-f0-9]{40}$/.test(value.sourceClaim.commitSha)
    )
      issues.push("sourceClaim.commitSha must be lowercase Git SHA-1");
    if (
      exactKeys(
        value.sourceClaim.sourceArtifact,
        ["role", "logicalPath", "sha256"],
        "sourceClaim.sourceArtifact",
        issues,
      )
    ) {
      if (
        value.sourceClaim.sourceArtifact.role !== "scientific_specification"
      )
        issues.push("sourceClaim.sourceArtifact.role is invalid");
      requireString(
        value.sourceClaim.sourceArtifact.logicalPath,
        "sourceClaim.sourceArtifact.logicalPath",
        issues,
      );
      if (
        typeof value.sourceClaim.sourceArtifact.logicalPath === "string" &&
        !PORTABLE_PATH.test(value.sourceClaim.sourceArtifact.logicalPath)
      )
        issues.push("sourceClaim.sourceArtifact.logicalPath is not portable");
      requireSha(
        value.sourceClaim.sourceArtifact.sha256,
        "sourceClaim.sourceArtifact.sha256",
        issues,
      );
    }
    if (
      exactKeys(
        value.sourceClaim.extraction,
        ["language", "selector", "extractedStatementSha256"],
        "sourceClaim.extraction",
        issues,
      )
    ) {
      requireString(
        value.sourceClaim.extraction.language,
        "sourceClaim.extraction.language",
        issues,
      );
      requireString(
        value.sourceClaim.extraction.selector,
        "sourceClaim.extraction.selector",
        issues,
      );
      requireSha(
        value.sourceClaim.extraction.extractedStatementSha256,
        "sourceClaim.extraction.extractedStatementSha256",
        issues,
      );
    }
  }

  if (
    exactKeys(
      value.semanticBindings,
      ["formalCasimirSpec", "numericalCasimirSpec"],
      "semanticBindings",
      issues,
    )
  ) {
    for (const key of [
      "formalCasimirSpec",
      "numericalCasimirSpec",
    ] as const) {
      const binding = value.semanticBindings[key];
      if (
        exactKeys(
          binding,
          [
            "specId",
            "semanticSha256",
            "artifactSha256",
            "claimId",
            "propositionSha256",
          ],
          `semanticBindings.${key}`,
          issues,
        )
      ) {
        requireString(binding.specId, `semanticBindings.${key}.specId`, issues);
        requireString(binding.claimId, `semanticBindings.${key}.claimId`, issues);
        for (const field of [
          "semanticSha256",
          "artifactSha256",
          "propositionSha256",
        ] as const)
          requireSha(
            binding[field],
            `semanticBindings.${key}.${field}`,
            issues,
          );
      }
    }
  }

  if (
    exactKeys(
      value.parameterPolicy,
      [
        "mutableParameterId",
        "sourceSymbol",
        "unit",
        "canonicalEncoding",
        "minimumInclusive",
        "maximumInclusive",
        "baselineValue",
        "permittedValues",
        "frozenParameters",
      ],
      "parameterPolicy",
      issues,
    )
  ) {
    for (const field of [
      "mutableParameterId",
      "sourceSymbol",
      "unit",
    ] as const)
      requireString(
        value.parameterPolicy[field],
        `parameterPolicy.${field}`,
        issues,
      );
    if (value.parameterPolicy.canonicalEncoding !== "exact_decimal_string")
      issues.push("parameterPolicy.canonicalEncoding is invalid");
    for (const field of [
      "minimumInclusive",
      "maximumInclusive",
      "baselineValue",
    ] as const) {
      const observed = value.parameterPolicy[field];
      if (typeof observed !== "string" || !EXACT_DECIMAL.test(observed))
        issues.push(`parameterPolicy.${field} must be an exact decimal string`);
    }
    if (
      requireSortedStrings(
        value.parameterPolicy.permittedValues,
        "parameterPolicy.permittedValues",
        issues,
      ) &&
      !value.parameterPolicy.permittedValues.every((entry) =>
        EXACT_DECIMAL.test(entry),
      )
    )
      issues.push("parameterPolicy.permittedValues contains an invalid decimal");
    if (
      Array.isArray(value.parameterPolicy.permittedValues) &&
      typeof value.parameterPolicy.baselineValue === "string" &&
      !value.parameterPolicy.permittedValues.includes(
        value.parameterPolicy.baselineValue,
      )
    )
      issues.push("parameterPolicy baseline must be a permitted value");
    if (
      !Array.isArray(value.parameterPolicy.frozenParameters) ||
      value.parameterPolicy.frozenParameters.length === 0
    ) {
      issues.push("parameterPolicy.frozenParameters must be non-empty");
    } else {
      value.parameterPolicy.frozenParameters.forEach((entry, index) => {
        if (
          exactKeys(
            entry,
            ["parameterId", "sourceSymbol", "unit", "value"],
            `parameterPolicy.frozenParameters[${index}]`,
            issues,
          )
        ) {
          for (const field of [
            "parameterId",
            "sourceSymbol",
            "unit",
          ] as const)
            requireString(
              entry[field],
              `parameterPolicy.frozenParameters[${index}].${field}`,
              issues,
            );
          if (typeof entry.value !== "string" || !EXACT_DECIMAL.test(entry.value))
            issues.push(
              `parameterPolicy.frozenParameters[${index}].value must be an exact decimal string`,
            );
        }
      });
      const ids = value.parameterPolicy.frozenParameters
        .map((entry) => (isRecord(entry) ? String(entry.parameterId ?? "") : ""))
        .filter(Boolean);
      if (!sortedUnique(ids))
        issues.push(
          "parameterPolicy.frozenParameters must be sorted and duplicate-free",
        );
    }
  }

  if (
    exactKeys(
      value.formalContract,
      [
        "formalArtifactId",
        "theoremModule",
        "theoremName",
        "sourceLogicalPath",
        "sourceSha256",
        "propositionScope",
        "requiredClaimCeiling",
      ],
      "formalContract",
      issues,
    )
  ) {
    for (const field of [
      "formalArtifactId",
      "theoremModule",
      "theoremName",
      "sourceLogicalPath",
    ] as const)
      requireString(value.formalContract[field], `formalContract.${field}`, issues);
    requireSha(
      value.formalContract.sourceSha256,
      "formalContract.sourceSha256",
      issues,
    );
    if (value.formalContract.propositionScope !== "contract_subclaim")
      issues.push("formalContract.propositionScope is invalid");
    if (
      value.formalContract.requiredClaimCeiling !== "formal_contract_checked"
    )
      issues.push("formalContract.requiredClaimCeiling is invalid");
  }

  if (
    exactKeys(
      value.numericalContract,
      [
        "baselineCaseId",
        "interventionCaseId",
        "primaryLineageId",
        "independentLineageId",
        "independentLaneKind",
        "observableIds",
        "minimumRefinementLevels",
        "replayCount",
      ],
      "numericalContract",
      issues,
    )
  ) {
    for (const field of [
      "baselineCaseId",
      "interventionCaseId",
      "primaryLineageId",
      "independentLineageId",
    ] as const)
      requireString(
        value.numericalContract[field],
        `numericalContract.${field}`,
        issues,
      );
    if (value.numericalContract.independentLaneKind !== "numerical_solver")
      issues.push("numericalContract.independentLaneKind is invalid");
    requireSortedStrings(
      value.numericalContract.observableIds,
      "numericalContract.observableIds",
      issues,
    );
    if (
      !Number.isInteger(value.numericalContract.minimumRefinementLevels) ||
      Number(value.numericalContract.minimumRefinementLevels) < 3
    )
      issues.push(
        "numericalContract.minimumRefinementLevels must be an integer >= 3",
      );
    if (value.numericalContract.replayCount !== 2)
      issues.push("numericalContract.replayCount must equal 2");
    if (
      value.numericalContract.primaryLineageId ===
      value.numericalContract.independentLineageId
    )
      issues.push("numerical implementation lineages must be distinct");
  }

  if (
    exactKeys(
      value.closurePolicy,
      [
        "requiredAxes",
        "empiricalEvidenceRequired",
        "maximumClaimCeiling",
        "currentTurnEvidenceReentryRequired",
        "immutableReceiptRequired",
      ],
      "closurePolicy",
      issues,
    )
  ) {
    const expectedAxes = [
      "comparison",
      "formal",
      "graph",
      "independent_numerical",
      "semantic",
      "source",
    ];
    if (
      !Array.isArray(value.closurePolicy.requiredAxes) ||
      JSON.stringify(value.closurePolicy.requiredAxes) !==
        JSON.stringify(expectedAxes)
    )
      issues.push("closurePolicy.requiredAxes is invalid");
    if (value.closurePolicy.empiricalEvidenceRequired !== false)
      issues.push("closurePolicy.empiricalEvidenceRequired must be false");
    if (
      value.closurePolicy.maximumClaimCeiling !== "synthetic_computational"
    )
      issues.push("closurePolicy.maximumClaimCeiling is invalid");
    if (value.closurePolicy.currentTurnEvidenceReentryRequired !== true)
      issues.push(
        "closurePolicy.currentTurnEvidenceReentryRequired must be true",
      );
    if (value.closurePolicy.immutableReceiptRequired !== true)
      issues.push("closurePolicy.immutableReceiptRequired must be true");
  }

  if (
    exactKeys(
      value.authority,
      [
        "outputRole",
        "executesTools",
        "sourceAuthority",
        "semanticAuthority",
        "formalAuthority",
        "numericalAuthority",
        "empiricalAuthority",
        "physicalAuthority",
        "assistantAnswer",
        "terminalEligible",
        "postToolModelStepRequired",
        "promotionAllowed",
      ],
      "authority",
      issues,
    )
  ) {
    if (value.authority.outputRole !== "scientific_execution_enrollment")
      issues.push("authority.outputRole is invalid");
    for (const field of [
      "executesTools",
      "sourceAuthority",
      "semanticAuthority",
      "formalAuthority",
      "numericalAuthority",
      "empiricalAuthority",
      "physicalAuthority",
      "assistantAnswer",
      "terminalEligible",
      "promotionAllowed",
    ] as const)
      if (value.authority[field] !== false)
        issues.push(`authority.${field} must be false`);
    if (value.authority.postToolModelStepRequired !== true)
      issues.push("authority.postToolModelStepRequired must be true");
  }

  return issues;
}

export async function validateScientificEvidenceConformanceManifestV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateScientificEvidenceConformanceManifestShapeV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } =
    value as unknown as ScientificEvidenceConformanceManifestV1;
  const expected =
    await computeScientificEvidenceConformanceManifestSha256V1(withoutHash);
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match manifest content");
  return issues;
}
