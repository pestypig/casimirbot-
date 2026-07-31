import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID =
  "scientific_evidence_execution_plan" as const;
export const SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION =
  "scientific_evidence_execution_plan/v1" as const;
export const SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_HASH_DOMAIN =
  "scientific-evidence-execution-plan/v1" as const;

export type ScientificEvidenceExecutionPlanV1 = {
  artifactId: typeof SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID;
  schemaVersion: typeof SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION;
  planId: string;
  generatedAt: string;
  artifactSha256: string;
  turnBinding: {
    turnId: string;
  };
  enrollment: {
    manifestId: string;
    manifestArtifactSha256: string;
  };
  selection: {
    orientationId: string;
    graphId: string;
    selectedBadgeIds: string[];
    sourceClaimId: string;
    sourceClaimArtifactSha256: string;
  };
  intervention: {
    parameterId: string;
    sourceSymbol: string;
    unit: string;
    baselineValue: string;
    selectedValue: string;
    frozenParametersSha256: string;
  };
  lanyonStaging: {
    producerId: string;
    repositoryUri: string;
    commitSha: string;
    caseId: string;
    sourceLogicalPath: string;
    sourceSha256: string;
    requiredCapabilityIds: [
      "theory-experiment-procedure.prepare",
      "theory-semantic-admitter.normalize",
      "theory-artifact-producer.prepare_lanyon_request",
      "theory-artifact-producer.admit_lanyon_snapshot",
    ];
  };
  formalReplay: {
    specId: string;
    claimId: string;
    propositionSha256: string;
    theoremName: string;
    theoremTypeSha256: string;
    requiredCapabilityIds: [
      "theory-formal-verifier.prepare_request",
      "theory-formal-verifier.plan",
      "theory-formal-verifier.start",
      "theory-formal-verifier.read_result",
    ];
  };
  numericalReplay: {
    specId: string;
    claimId: string;
    propositionSha256: string;
    baselineCaseId: string;
    interventionCaseId: string;
    primaryLineageId: string;
    independentLineageId: string;
    observableIds: string[];
    requiredCapabilityIds: [
      "theory-independent-numerical-verifier.prepare_request",
      "theory-independent-numerical-verifier.plan",
      "theory-independent-numerical-verifier.start",
      "theory-independent-numerical-verifier.read_result",
    ];
  };
  closure: {
    requiredAxes: string[];
    evaluationCapabilityId: "scientific-evidence-closure.evaluate";
    currentTurnEvidenceReentryRequired: true;
  };
  authority: {
    outputRole: "scientific_execution_plan";
    userSelectionBound: true;
    executesTools: false;
    grantsConfirmation: false;
    validatesScientificTruth: false;
    validatesTheory: false;
    validatesImplementationCorrectness: false;
    empiricalAuthority: false;
    physicalAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
    promotionAllowed: false;
  };
};

export type BuildScientificEvidenceExecutionPlanV1Input = Omit<
  ScientificEvidenceExecutionPlanV1,
  "artifactId" | "schemaVersion" | "planId" | "generatedAt" | "artifactSha256" | "authority"
> & {
  generatedAt?: string;
  planId?: string;
};

const SHA256 = /^[a-f0-9]{64}$/;
const EXACT_DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sortedUnique = (values: unknown): values is string[] =>
  Array.isArray(values) &&
  values.length > 0 &&
  values.every(nonEmpty) &&
  values.every(
    (entry, index) =>
      index === 0 || values[index - 1].localeCompare(entry, "en") < 0,
  );

export async function computeScientificEvidenceExecutionPlanSha256V1(
  value: Omit<ScientificEvidenceExecutionPlanV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_HASH_DOMAIN,
    value,
  });
}

export async function buildScientificEvidenceExecutionPlanV1(
  input: BuildScientificEvidenceExecutionPlanV1Input,
): Promise<ScientificEvidenceExecutionPlanV1> {
  const selectionSha256 = await computeCasimirSpecValueSha256V1({
    domain: "scientific-evidence-execution-selection/v1",
    value: {
      turnBinding: input.turnBinding,
      enrollment: input.enrollment,
      selection: input.selection,
      intervention: input.intervention,
    },
  });
  const withoutHash: Omit<
    ScientificEvidenceExecutionPlanV1,
    "artifactSha256"
  > = {
    ...input,
    artifactId: SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID,
    schemaVersion: SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION,
    planId:
      input.planId ??
      `scientific-evidence-plan:${selectionSha256.slice(0, 24)}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: {
      outputRole: "scientific_execution_plan",
      userSelectionBound: true,
      executesTools: false,
      grantsConfirmation: false,
      validatesScientificTruth: false,
      validatesTheory: false,
      validatesImplementationCorrectness: false,
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
      await computeScientificEvidenceExecutionPlanSha256V1(withoutHash),
  };
}

export function validateScientificEvidenceExecutionPlanShapeV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["plan must be an object"];
  if (value.artifactId !== SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (value.schemaVersion !== SCIENTIFIC_EVIDENCE_EXECUTION_PLAN_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  for (const key of ["planId", "generatedAt"] as const) {
    if (!nonEmpty(value[key])) issues.push(`${key} must be non-empty`);
  }
  if (typeof value.generatedAt === "string" && Number.isNaN(Date.parse(value.generatedAt)))
    issues.push("generatedAt must be an ISO-compatible timestamp");
  if (typeof value.artifactSha256 !== "string" || !SHA256.test(value.artifactSha256))
    issues.push("artifactSha256 must be lowercase SHA-256");

  const turnBinding = isRecord(value.turnBinding) ? value.turnBinding : {};
  if (!nonEmpty(turnBinding.turnId)) issues.push("turnBinding.turnId is required");
  const enrollment = isRecord(value.enrollment) ? value.enrollment : {};
  if (!nonEmpty(enrollment.manifestId)) issues.push("enrollment.manifestId is required");
  if (
    typeof enrollment.manifestArtifactSha256 !== "string" ||
    !SHA256.test(enrollment.manifestArtifactSha256)
  )
    issues.push("enrollment.manifestArtifactSha256 is invalid");

  const selection = isRecord(value.selection) ? value.selection : {};
  for (const key of ["orientationId", "graphId", "sourceClaimId"] as const) {
    if (!nonEmpty(selection[key])) issues.push(`selection.${key} is required`);
  }
  if (!sortedUnique(selection.selectedBadgeIds))
    issues.push("selection.selectedBadgeIds must be sorted and duplicate-free");
  if (
    typeof selection.sourceClaimArtifactSha256 !== "string" ||
    !SHA256.test(selection.sourceClaimArtifactSha256)
  )
    issues.push("selection.sourceClaimArtifactSha256 is invalid");

  const intervention = isRecord(value.intervention) ? value.intervention : {};
  for (const key of ["parameterId", "sourceSymbol", "unit"] as const) {
    if (!nonEmpty(intervention[key]))
      issues.push(`intervention.${key} is required`);
  }
  for (const key of ["baselineValue", "selectedValue"] as const) {
    if (
      typeof intervention[key] !== "string" ||
      !EXACT_DECIMAL.test(intervention[key])
    )
      issues.push(`intervention.${key} must be an exact decimal string`);
  }
  if (intervention.baselineValue === intervention.selectedValue)
    issues.push("intervention.selectedValue must differ from baselineValue");
  if (
    typeof intervention.frozenParametersSha256 !== "string" ||
    !SHA256.test(intervention.frozenParametersSha256)
  )
    issues.push("intervention.frozenParametersSha256 is invalid");

  const authority = isRecord(value.authority) ? value.authority : {};
  if (
    authority.outputRole !== "scientific_execution_plan" ||
    authority.userSelectionBound !== true ||
    authority.executesTools !== false ||
    authority.grantsConfirmation !== false ||
    authority.validatesScientificTruth !== false ||
    authority.validatesTheory !== false ||
    authority.validatesImplementationCorrectness !== false ||
    authority.empiricalAuthority !== false ||
    authority.physicalAuthority !== false ||
    authority.assistantAnswer !== false ||
    authority.terminalEligible !== false ||
    authority.postToolModelStepRequired !== true ||
    authority.promotionAllowed !== false
  )
    issues.push("authority is invalid");
  return issues;
}

export async function validateScientificEvidenceExecutionPlanIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateScientificEvidenceExecutionPlanShapeV1(value);
  if (issues.length > 0 || !isRecord(value)) return issues;
  const { artifactSha256, ...withoutHash } =
    value as unknown as ScientificEvidenceExecutionPlanV1;
  const expected =
    await computeScientificEvidenceExecutionPlanSha256V1(withoutHash);
  if (artifactSha256 !== expected)
    issues.push("artifactSha256 does not match plan content");
  return issues;
}
