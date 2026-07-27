import {
  validateTheoryDerivationProgramV1,
  type TheoryDerivationProgramV1,
} from "./theory-derivation-program.v1";
import {
  THEORY_MASTER_PROBLEM_OPERATIONS,
  validateTheoryMasterProblemV1,
  type TheoryMasterProblemOperationV1,
  type TheoryMasterProblemV1,
} from "./theory-master-problem.v1";

export const THEORY_EXPERIMENT_PROCEDURE_ARTIFACT_ID =
  "theory_experiment_procedure" as const;
export const THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION =
  "theory_experiment_procedure/v1" as const;
export const THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN =
  "theory-experiment-procedure/v1" as const;
export const THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE =
  "selected_comparison_badge_id_overlap" as const;

export const THEORY_EXPERIMENT_EVIDENCE_KINDS = [
  "research_paper_sidecar",
  "scientific_image_sidecar",
  "repo_observation",
  "calculator_observation",
  "theory_reflection",
  "semantic_admission",
  "artifact_generation_receipt",
  "formal_certificate",
  "numerical_certificate",
  "empirical_observation",
] as const;

export const THEORY_EXPERIMENT_STAGE_IDS = [
  "question_and_provenance",
  "semantic_definition",
  "graph_and_scale_localization",
  "congruence_procedure",
  "artifact_and_formal_closure",
  "numerical_and_observational_closure",
  "evidence_reentry_and_synthesis",
] as const;

export const THEORY_EXPERIMENT_CAPABILITY_PHASES = [
  "retrieve",
  "reflect",
  "normalize",
  "admit_artifact",
  "verify_formal",
  "verify_numerical",
  "observe_empirical",
  "synthesize",
] as const;

export type TheoryExperimentEvidenceKindV1 =
  (typeof THEORY_EXPERIMENT_EVIDENCE_KINDS)[number];
export type TheoryExperimentStageIdV1 =
  (typeof THEORY_EXPERIMENT_STAGE_IDS)[number];
export type TheoryExperimentCapabilityPhaseV1 =
  (typeof THEORY_EXPERIMENT_CAPABILITY_PHASES)[number];

export type TheoryExperimentEvidenceClaimBindingV1 = {
  claimId: string;
  propositionSha256: string;
  observableIds: string[];
};

export type TheoryExperimentEvidenceLineageV1 = {
  sourceKind:
    | "semantic_claim_ir"
    | "artifact_generation_request"
    | "formal_verification_request"
    | "numerical_verification_request"
    | "empirical_observation";
  procedureId: string;
  candidateBadgeIds: string[];
  casimirSpecId: string | null;
  casimirSpecSemanticSha256: string;
  casimirSpecArtifactSha256: string;
  claims: TheoryExperimentEvidenceClaimBindingV1[];
  sourceGraphId: string | null;
  sourceGraphSnapshotSha256: string | null;
  sourceMasterProblemPlanId: string | null;
  sourceMasterProblemArtifactSha256: string | null;
  sourceDerivationProgramId: string | null;
  sourceDerivationProgramArtifactSha256: string | null;
  requestArtifactSha256: string | null;
  frozenCase: {
    caseId: string;
    inputsSha256: string;
    meshSha256: string;
    initialConditionsSha256: string;
    boundaryConditionsSha256: string;
    observableIds: string[];
  } | null;
};

export type TheoryExperimentEvidenceBindingV1 = {
  artifactRef: string;
  kind: TheoryExperimentEvidenceKindV1;
  schema: string;
  sourceTurnId: string;
  admissionTurnId: string;
  contentSha256: string;
  admission: "current_turn_admitted" | "retained_and_readmitted";
  lineage?: TheoryExperimentEvidenceLineageV1 | null;
  authority: "evidence_only";
  assistantAnswer: false;
  terminalEligible: false;
};

export type TheoryExperimentScaleCheckpointV1 = {
  badgeId: string;
  scaleBand: string;
  scaleLog10M: number | null;
  scaleEnvelope: {
    minLog10M: number | null;
    maxLog10M: number | null;
    characteristicLog10M: number | null;
    basis: string;
  };
  coordinateFrame: string | null;
  validityDomainRefs: string[];
  dependencyOrdinal: number;
  orderAuthority: "dependency_dag";
  interpretation: "scale_checkpoint_not_execution_order";
};

export type TheoryExperimentCapabilityAffordanceV1 = {
  capabilityId: string;
  phase: TheoryExperimentCapabilityPhaseV1;
  status: "admitted" | "conditional" | "blocked" | "not_applicable";
  requiresConfirmation: boolean;
  requiredInputKeys: string[];
  dependsOnArtifactRefs: string[];
  producesEvidenceKind: TheoryExperimentEvidenceKindV1 | null;
  reason: string;
  executesAutomatically: false;
};

export type TheoryExperimentMissingRequirementV1 = {
  code: string;
  stageId: TheoryExperimentStageIdV1;
  message: string;
  retryable: boolean;
  repair:
    | "retrieve_evidence"
    | "bind_observable"
    | "declare_boundary_conditions"
    | "declare_formal_system"
    | "register_bridge"
    | "select_badges"
    | "choose_supported_case"
    | "ask_user"
    | "stop_at_boundary";
};

export type TheoryExperimentLanyonEligibilityV1 = {
  requested: boolean;
  status: "not_requested" | "eligible" | "conditional" | "ineligible";
  requestedCaseId: string | null;
  eligibleCaseIds: string[];
  dimensions: 1 | 2 | 3 | null;
  caseKind:
    | "linear_advection"
    | "advection_diffusion_isotropic"
    | "advection_diffusion_full"
    | null;
  semanticIdentityBound: boolean;
  blockers: string[];
  reasons: string[];
  authority: {
    selectsPinnedCandidateOnly: true;
    trustsProducerOutput: false;
    validatesTheory: false;
    validatesGeneratedCode: false;
    validatesNumericalImplementation: false;
  };
};

export type TheoryExperimentProcedureStageV1 = {
  id: TheoryExperimentStageIdV1;
  ordinal: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  status: "ready" | "complete" | "blocked" | "not_applicable";
  evidenceRefs: string[];
  missingRequirementCodes: string[];
  capabilityIds: string[];
};

export type TheoryExperimentProcedureV1 = {
  artifactId: typeof THEORY_EXPERIMENT_PROCEDURE_ARTIFACT_ID;
  schemaVersion: typeof THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION;
  generatedAt: string;
  procedureId: string;
  procedureSha256: string;
  turnId: string;
  graphId: string;
  request: {
    operation: TheoryMasterProblemOperationV1;
    target: string;
    targetObservable: string | null;
    selectedBadgeIds: string[];
    comparisonBadgeIds: string[];
    coordinateFrame: string | null;
    scaleLog10M: { min: number | null; max: number | null } | null;
    initialBoundaryConditions: string[];
    formalSystem: string | null;
    requestedPrecision: string | null;
    evidenceMaturityCeiling:
      "exploratory" | "reduced_order" | "diagnostic" | "certified";
  };
  evidenceBindings: TheoryExperimentEvidenceBindingV1[];
  reflection: {
    reflectionId: string;
    representedProbabilityMass: number;
    outOfGraphProbability: number;
    openWorldEntropyBits: number;
    suggestedBiomeChunkIds: string[];
    suggestedSemanticChunkIds: string[];
    suggestedScaleBands: string[];
    claimBoundaries: string[];
  };
  dependencyOrder: {
    source: "theory_derivation_program/v1";
    stepIds: string[];
    badgeIds: string[];
    physicalScaleDefinesOrder: false;
  };
  scaleCheckpoints: TheoryExperimentScaleCheckpointV1[];
  masterProblem: TheoryMasterProblemV1;
  derivationProgram: TheoryDerivationProgramV1;
  lanyonEligibility: TheoryExperimentLanyonEligibilityV1;
  capabilityAffordances: TheoryExperimentCapabilityAffordanceV1[];
  missingRequirements: TheoryExperimentMissingRequirementV1[];
  stages: TheoryExperimentProcedureStageV1[];
  readiness: {
    status: "ready_for_agent_runtime" | "conditional" | "blocked";
    nextAdmissibleCapabilityIds: string[];
    terminalSynthesisAllowed: false;
    reason: string;
  };
  incompletenessBoundary: {
    formalSystem: string | null;
    formalStatus:
      | "not_assessed"
      | "formal_system_required"
      | "proof_obligation_present"
      | "noncomputable_reference_present";
    outOfGraphMassPreserved: true;
    missingRelationsRemainOpenWorld: true;
    noIndependenceClaimWithoutCertificate: true;
  };
  authority: {
    executorOwner: "agent_runtime";
    preparesProcedureOnly: true;
    executesTools: false;
    semanticIntentAuthority: false;
    proofAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalTruthAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

type BuildTheoryExperimentProcedureInput = Omit<
  TheoryExperimentProcedureV1,
  "artifactId" | "schemaVersion"
>;

export function buildTheoryExperimentProcedureV1(
  input: BuildTheoryExperimentProcedureInput,
): TheoryExperimentProcedureV1 {
  return {
    artifactId: THEORY_EXPERIMENT_PROCEDURE_ARTIFACT_ID,
    schemaVersion: THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION,
    ...input,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString);
const isSortedUniqueStringArray = (value: unknown): value is string[] =>
  isNonEmptyStringArray(value) &&
  value.every((entry, index) => index === 0 || value[index - 1] < entry);
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNullableNonEmptyString = (value: unknown): value is string | null =>
  value === null || isNonEmptyString(value);
const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);
const includes = <T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] => typeof value === "string" && values.includes(value);

const THEORY_EXPERIMENT_EVIDENCE_ADMISSIONS = [
  "current_turn_admitted",
  "retained_and_readmitted",
] as const;
const THEORY_EXPERIMENT_EVIDENCE_MATURITY_CEILINGS = [
  "exploratory",
  "reduced_order",
  "diagnostic",
  "certified",
] as const;
const THEORY_EXPERIMENT_CAPABILITY_STATUSES = [
  "admitted",
  "conditional",
  "blocked",
  "not_applicable",
] as const;
const THEORY_EXPERIMENT_MISSING_REQUIREMENT_REPAIRS = [
  "retrieve_evidence",
  "bind_observable",
  "declare_boundary_conditions",
  "declare_formal_system",
  "register_bridge",
  "select_badges",
  "choose_supported_case",
  "ask_user",
  "stop_at_boundary",
] as const;
const THEORY_EXPERIMENT_LANYON_STATUSES = [
  "not_requested",
  "eligible",
  "conditional",
  "ineligible",
] as const;
const THEORY_EXPERIMENT_LANYON_CASE_KINDS = [
  "linear_advection",
  "advection_diffusion_isotropic",
  "advection_diffusion_full",
] as const;
const THEORY_EXPERIMENT_STAGE_STATUSES = [
  "ready",
  "complete",
  "blocked",
  "not_applicable",
] as const;
const THEORY_EXPERIMENT_READINESS_STATUSES = [
  "ready_for_agent_runtime",
  "conditional",
  "blocked",
] as const;
const THEORY_EXPERIMENT_FORMAL_STATUSES = [
  "not_assessed",
  "formal_system_required",
  "proof_obligation_present",
  "noncomputable_reference_present",
] as const;
const THEORY_EXPERIMENT_LINEAGE_EVIDENCE_KINDS = [
  "semantic_admission",
  "artifact_generation_receipt",
  "formal_certificate",
  "numerical_certificate",
  "empirical_observation",
] as const;
const THEORY_EXPERIMENT_LINEAGE_SOURCE_BY_KIND = {
  semantic_admission: "semantic_claim_ir",
  artifact_generation_receipt: "artifact_generation_request",
  formal_certificate: "formal_verification_request",
  numerical_certificate: "numerical_verification_request",
  empirical_observation: "empirical_observation",
} as const;

export function validateTheoryExperimentProcedureV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value))
    return ["theory experiment procedure must be an object"];
  if (value.artifactId !== THEORY_EXPERIMENT_PROCEDURE_ARTIFACT_ID) {
    issues.push(
      `artifactId must be ${THEORY_EXPERIMENT_PROCEDURE_ARTIFACT_ID}`,
    );
  }
  if (value.schemaVersion !== THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION) {
    issues.push(
      `schemaVersion must be ${THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION}`,
    );
  }
  for (const field of [
    "generatedAt",
    "procedureId",
    "turnId",
    "graphId",
  ] as const) {
    if (!isNonEmptyString(value[field])) {
      issues.push(`${field} must be a non-empty string`);
    }
  }
  if (!isSha256(value.procedureSha256)) {
    issues.push("procedureSha256 must be lowercase SHA-256");
  }
  if (!isRecord(value.request)) {
    issues.push("request must be an object");
  } else {
    if (!includes(THEORY_MASTER_PROBLEM_OPERATIONS, value.request.operation)) {
      issues.push("request.operation is invalid");
    }
    if (!isNonEmptyString(value.request.target)) {
      issues.push("request.target must be a non-empty string");
    }
    if (!isNullableNonEmptyString(value.request.targetObservable)) {
      issues.push(
        "request.targetObservable must be null or a non-empty string",
      );
    }
    if (
      !isNonEmptyStringArray(value.request.selectedBadgeIds) ||
      value.request.selectedBadgeIds.length === 0
    ) {
      issues.push("request.selectedBadgeIds must contain non-empty strings");
    }
    if (!isNonEmptyStringArray(value.request.comparisonBadgeIds)) {
      issues.push("request.comparisonBadgeIds must contain non-empty strings");
    }
    if (
      isNonEmptyStringArray(value.request.selectedBadgeIds) &&
      isNonEmptyStringArray(value.request.comparisonBadgeIds)
    ) {
      const comparisonBadgeIds = new Set(value.request.comparisonBadgeIds);
      if (
        value.request.selectedBadgeIds.some((badgeId) =>
          comparisonBadgeIds.has(badgeId),
        )
      ) {
        issues.push(
          `${THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE}: request.selectedBadgeIds and request.comparisonBadgeIds must be disjoint`,
        );
      }
    }
    if (!isNullableNonEmptyString(value.request.coordinateFrame)) {
      issues.push("request.coordinateFrame must be null or a non-empty string");
    }
    if (value.request.scaleLog10M !== null) {
      if (!isRecord(value.request.scaleLog10M)) {
        issues.push("request.scaleLog10M must be null or an object");
      } else {
        if (!isNullableFiniteNumber(value.request.scaleLog10M.min)) {
          issues.push("request.scaleLog10M.min must be null or finite");
        }
        if (!isNullableFiniteNumber(value.request.scaleLog10M.max)) {
          issues.push("request.scaleLog10M.max must be null or finite");
        }
      }
    }
    if (!isNonEmptyStringArray(value.request.initialBoundaryConditions)) {
      issues.push(
        "request.initialBoundaryConditions must contain non-empty strings",
      );
    }
    if (!isNullableNonEmptyString(value.request.formalSystem)) {
      issues.push("request.formalSystem must be null or a non-empty string");
    }
    if (!isNullableNonEmptyString(value.request.requestedPrecision)) {
      issues.push(
        "request.requestedPrecision must be null or a non-empty string",
      );
    }
    if (
      !includes(
        THEORY_EXPERIMENT_EVIDENCE_MATURITY_CEILINGS,
        value.request.evidenceMaturityCeiling,
      )
    ) {
      issues.push("request.evidenceMaturityCeiling is invalid");
    }
  }
  if (!Array.isArray(value.evidenceBindings)) {
    issues.push("evidenceBindings must be an array");
  } else {
    value.evidenceBindings.forEach((binding, index) => {
      if (!isRecord(binding)) {
        issues.push(`evidenceBindings[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(binding.artifactRef)) {
        issues.push(
          `evidenceBindings[${index}].artifactRef must be a non-empty string`,
        );
      }
      if (!includes(THEORY_EXPERIMENT_EVIDENCE_KINDS, binding.kind)) {
        issues.push(`evidenceBindings[${index}].kind is invalid`);
      }
      if (!isNonEmptyString(binding.schema)) {
        issues.push(
          `evidenceBindings[${index}].schema must be a non-empty string`,
        );
      }
      if (!isNonEmptyString(binding.sourceTurnId)) {
        issues.push(
          `evidenceBindings[${index}].sourceTurnId must be a non-empty string`,
        );
      }
      if (!isNonEmptyString(binding.admissionTurnId)) {
        issues.push(
          `evidenceBindings[${index}].admissionTurnId must be a non-empty string`,
        );
      }
      if (!isSha256(binding.contentSha256)) {
        issues.push(`evidenceBindings[${index}].contentSha256 is invalid`);
      }
      if (binding.admissionTurnId !== value.turnId) {
        issues.push(
          `evidenceBindings[${index}].admissionTurnId must match turnId`,
        );
      }
      if (!includes(THEORY_EXPERIMENT_EVIDENCE_ADMISSIONS, binding.admission)) {
        issues.push(`evidenceBindings[${index}].admission is invalid`);
      }
      if (
        binding.authority !== "evidence_only" ||
        binding.assistantAnswer !== false ||
        binding.terminalEligible !== false
      ) {
        issues.push(`evidenceBindings[${index}] exceeds evidence authority`);
      }
      const requiresLineage = includes(
        THEORY_EXPERIMENT_LINEAGE_EVIDENCE_KINDS,
        binding.kind,
      );
      if (!requiresLineage && binding.lineage != null) {
        issues.push(
          `evidenceBindings[${index}].lineage must be null for non-closure evidence`,
        );
      } else if (requiresLineage && !isRecord(binding.lineage)) {
        issues.push(
          `evidenceBindings[${index}].lineage is required for closure evidence`,
        );
      } else if (isRecord(binding.lineage)) {
        const lineage = binding.lineage;
        const expectedSourceKind =
          THEORY_EXPERIMENT_LINEAGE_SOURCE_BY_KIND[
            binding.kind as keyof typeof THEORY_EXPERIMENT_LINEAGE_SOURCE_BY_KIND
          ];
        if (lineage.sourceKind !== expectedSourceKind) {
          issues.push(
            `evidenceBindings[${index}].lineage.sourceKind does not match kind`,
          );
        }
        if (
          !isNonEmptyString(lineage.procedureId) ||
          lineage.procedureId !== value.procedureId
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage.procedureId must match procedureId`,
          );
        }
        if (
          !isSortedUniqueStringArray(lineage.candidateBadgeIds) ||
          lineage.candidateBadgeIds.length === 0
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage.candidateBadgeIds must be sorted, unique, and non-empty`,
          );
        } else if (isRecord(value.request)) {
          const procedureCandidates = new Set([
            ...(Array.isArray(value.request.selectedBadgeIds)
              ? value.request.selectedBadgeIds.filter(isNonEmptyString)
              : []),
            ...(Array.isArray(value.request.comparisonBadgeIds)
              ? value.request.comparisonBadgeIds.filter(isNonEmptyString)
              : []),
          ]);
          if (
            lineage.candidateBadgeIds.some(
              (badgeId) => !procedureCandidates.has(badgeId),
            )
          ) {
            issues.push(
              `evidenceBindings[${index}].lineage.candidateBadgeIds exceed the procedure candidate set`,
            );
          }
        }
        if (
          !isNullableNonEmptyString(lineage.casimirSpecId) ||
          !isSha256(lineage.casimirSpecSemanticSha256) ||
          !isSha256(lineage.casimirSpecArtifactSha256)
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage Casimir Spec identity is invalid`,
          );
        }
        if (
          lineage.sourceKind === "semantic_claim_ir" &&
          !isNonEmptyString(lineage.casimirSpecId)
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage.casimirSpecId is required for semantic admission`,
          );
        }
        if (!Array.isArray(lineage.claims) || lineage.claims.length === 0) {
          issues.push(
            `evidenceBindings[${index}].lineage.claims must be non-empty`,
          );
        } else {
          const claimIds: string[] = [];
          lineage.claims.forEach((claim, claimIndex) => {
            if (!isRecord(claim)) {
              issues.push(
                `evidenceBindings[${index}].lineage.claims[${claimIndex}] must be an object`,
              );
              return;
            }
            if (!isNonEmptyString(claim.claimId)) {
              issues.push(
                `evidenceBindings[${index}].lineage.claims[${claimIndex}].claimId is invalid`,
              );
            } else {
              claimIds.push(claim.claimId);
            }
            if (!isSha256(claim.propositionSha256)) {
              issues.push(
                `evidenceBindings[${index}].lineage.claims[${claimIndex}].propositionSha256 is invalid`,
              );
            }
            if (!isSortedUniqueStringArray(claim.observableIds)) {
              issues.push(
                `evidenceBindings[${index}].lineage.claims[${claimIndex}].observableIds must be sorted and unique`,
              );
            }
          });
          if (
            claimIds.some(
              (claimId, claimIndex) =>
                claimIndex > 0 && claimIds[claimIndex - 1] >= claimId,
            )
          ) {
            issues.push(
              `evidenceBindings[${index}].lineage.claims must be sorted and unique by claimId`,
            );
          }
        }
        if (
          !isNullableNonEmptyString(lineage.sourceGraphId) ||
          !(
            lineage.sourceGraphSnapshotSha256 === null ||
            isSha256(lineage.sourceGraphSnapshotSha256)
          ) ||
          !isNullableNonEmptyString(lineage.sourceMasterProblemPlanId) ||
          !(
            lineage.sourceMasterProblemArtifactSha256 === null ||
            isSha256(lineage.sourceMasterProblemArtifactSha256)
          ) ||
          !isNullableNonEmptyString(lineage.sourceDerivationProgramId) ||
          !(
            lineage.sourceDerivationProgramArtifactSha256 === null ||
            isSha256(lineage.sourceDerivationProgramArtifactSha256)
          ) ||
          !(
            lineage.requestArtifactSha256 === null ||
            isSha256(lineage.requestArtifactSha256)
          )
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage source identities are invalid`,
          );
        }
        if (
          (lineage.sourceMasterProblemPlanId === null) !==
            (lineage.sourceMasterProblemArtifactSha256 === null) ||
          (lineage.sourceDerivationProgramId === null) !==
            (lineage.sourceDerivationProgramArtifactSha256 === null)
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage source identity pairs are incomplete`,
          );
        }
        if (
          lineage.sourceGraphId !== null &&
          lineage.sourceGraphId !== value.graphId
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage.sourceGraphId must match graphId`,
          );
        }
        if (
          lineage.sourceMasterProblemPlanId !== null &&
          isRecord(value.masterProblem) &&
          lineage.sourceMasterProblemPlanId !== value.masterProblem.planId
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage Master Problem planId does not match procedure`,
          );
        }
        if (
          lineage.sourceDerivationProgramId !== null &&
          isRecord(value.derivationProgram) &&
          lineage.sourceDerivationProgramId !==
            value.derivationProgram.programId
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage derivation programId does not match procedure`,
          );
        }
        if (
          [
            "artifact_generation_request",
            "formal_verification_request",
          ].includes(String(lineage.sourceKind)) &&
          (lineage.sourceMasterProblemPlanId === null ||
            lineage.sourceDerivationProgramId === null)
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage must bind the exact Master Problem and derivation program`,
          );
        }
        if (
          lineage.sourceKind === "formal_verification_request" &&
          (lineage.sourceGraphId === null ||
            lineage.sourceGraphSnapshotSha256 === null)
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage formal graph snapshot is required`,
          );
        }
        if (
          lineage.sourceKind === "semantic_claim_ir" &&
          lineage.requestArtifactSha256 !== null
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage semantic evidence cannot claim a verifier request`,
          );
        }
        if (
          !["semantic_claim_ir", "empirical_observation"].includes(
            String(lineage.sourceKind),
          ) &&
          lineage.requestArtifactSha256 === null
        ) {
          issues.push(
            `evidenceBindings[${index}].lineage requestArtifactSha256 is required`,
          );
        }
        if (lineage.sourceKind === "numerical_verification_request") {
          if (!isRecord(lineage.frozenCase)) {
            issues.push(
              `evidenceBindings[${index}].lineage.frozenCase is required for numerical evidence`,
            );
          } else {
            if (!isNonEmptyString(lineage.frozenCase.caseId)) {
              issues.push(
                `evidenceBindings[${index}].lineage.frozenCase.caseId is invalid`,
              );
            }
            for (const field of [
              "inputsSha256",
              "meshSha256",
              "initialConditionsSha256",
              "boundaryConditionsSha256",
            ] as const) {
              if (!isSha256(lineage.frozenCase[field])) {
                issues.push(
                  `evidenceBindings[${index}].lineage.frozenCase.${field} is invalid`,
                );
              }
            }
            if (
              !isSortedUniqueStringArray(lineage.frozenCase.observableIds) ||
              lineage.frozenCase.observableIds.length === 0
            ) {
              issues.push(
                `evidenceBindings[${index}].lineage.frozenCase.observableIds must be sorted, unique, and non-empty`,
              );
            }
            if (
              isRecord(value.lanyonEligibility) &&
              lineage.frozenCase.caseId !==
                value.lanyonEligibility.requestedCaseId
            ) {
              issues.push(
                `evidenceBindings[${index}].lineage frozen case does not match the procedure`,
              );
            }
          }
        } else if (lineage.frozenCase !== null) {
          issues.push(
            `evidenceBindings[${index}].lineage.frozenCase is only valid for numerical evidence`,
          );
        }
      }
    });
  }
  if (!isRecord(value.reflection)) {
    issues.push("reflection must be an object");
  } else {
    if (!isNonEmptyString(value.reflection.reflectionId)) {
      issues.push("reflection.reflectionId must be a non-empty string");
    }
    for (const field of [
      "representedProbabilityMass",
      "outOfGraphProbability",
      "openWorldEntropyBits",
    ] as const) {
      if (!isFiniteNumber(value.reflection[field])) {
        issues.push(`reflection.${field} must be finite`);
      }
    }
    for (const field of [
      "suggestedBiomeChunkIds",
      "suggestedSemanticChunkIds",
      "suggestedScaleBands",
      "claimBoundaries",
    ] as const) {
      if (!isNonEmptyStringArray(value.reflection[field])) {
        issues.push(`reflection.${field} must contain non-empty strings`);
      }
    }
  }
  if (!isRecord(value.dependencyOrder)) {
    issues.push("dependencyOrder must be an object");
  } else {
    if (
      value.dependencyOrder.source !== "theory_derivation_program/v1" ||
      value.dependencyOrder.physicalScaleDefinesOrder !== false
    ) {
      issues.push("dependencyOrder must preserve derivation-DAG authority");
    }
    if (!isNonEmptyStringArray(value.dependencyOrder.stepIds)) {
      issues.push("dependencyOrder.stepIds must contain non-empty strings");
    }
    if (!isNonEmptyStringArray(value.dependencyOrder.badgeIds)) {
      issues.push("dependencyOrder.badgeIds must contain non-empty strings");
    }
  }
  if (!Array.isArray(value.scaleCheckpoints)) {
    issues.push("scaleCheckpoints must be an array");
  } else {
    value.scaleCheckpoints.forEach((checkpoint, index) => {
      if (!isRecord(checkpoint)) {
        issues.push(`scaleCheckpoints[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(checkpoint.badgeId)) {
        issues.push(
          `scaleCheckpoints[${index}].badgeId must be a non-empty string`,
        );
      }
      if (!isNonEmptyString(checkpoint.scaleBand)) {
        issues.push(
          `scaleCheckpoints[${index}].scaleBand must be a non-empty string`,
        );
      }
      if (!isNullableFiniteNumber(checkpoint.scaleLog10M)) {
        issues.push(
          `scaleCheckpoints[${index}].scaleLog10M must be null or finite`,
        );
      }
      if (!isRecord(checkpoint.scaleEnvelope)) {
        issues.push(
          `scaleCheckpoints[${index}].scaleEnvelope must be an object`,
        );
      } else {
        for (const field of [
          "minLog10M",
          "maxLog10M",
          "characteristicLog10M",
        ] as const) {
          if (!isNullableFiniteNumber(checkpoint.scaleEnvelope[field])) {
            issues.push(
              `scaleCheckpoints[${index}].scaleEnvelope.${field} must be null or finite`,
            );
          }
        }
        if (!isNonEmptyString(checkpoint.scaleEnvelope.basis)) {
          issues.push(
            `scaleCheckpoints[${index}].scaleEnvelope.basis must be a non-empty string`,
          );
        }
      }
      if (!isNullableNonEmptyString(checkpoint.coordinateFrame)) {
        issues.push(
          `scaleCheckpoints[${index}].coordinateFrame must be null or a non-empty string`,
        );
      }
      if (!isNonEmptyStringArray(checkpoint.validityDomainRefs)) {
        issues.push(
          `scaleCheckpoints[${index}].validityDomainRefs must contain non-empty strings`,
        );
      }
      if (
        !Number.isInteger(checkpoint.dependencyOrdinal) ||
        Number(checkpoint.dependencyOrdinal) < 0
      ) {
        issues.push(
          `scaleCheckpoints[${index}].dependencyOrdinal must be a non-negative integer`,
        );
      }
      if (
        checkpoint.orderAuthority !== "dependency_dag" ||
        checkpoint.interpretation !== "scale_checkpoint_not_execution_order"
      ) {
        issues.push(
          `scaleCheckpoints[${index}] must not use physical scale as execution order`,
        );
      }
    });
  }
  for (const issue of validateTheoryMasterProblemV1(value.masterProblem)) {
    issues.push(`masterProblem.${issue}`);
  }
  for (const issue of validateTheoryDerivationProgramV1(
    value.derivationProgram,
  )) {
    issues.push(`derivationProgram.${issue}`);
  }
  if (!isRecord(value.lanyonEligibility)) {
    issues.push("lanyonEligibility must be an object");
  } else {
    const eligibility = value.lanyonEligibility;
    if (typeof eligibility.requested !== "boolean") {
      issues.push("lanyonEligibility.requested must be boolean");
    }
    if (!includes(THEORY_EXPERIMENT_LANYON_STATUSES, eligibility.status)) {
      issues.push("lanyonEligibility.status is invalid");
    }
    if (!isNullableNonEmptyString(eligibility.requestedCaseId)) {
      issues.push(
        "lanyonEligibility.requestedCaseId must be null or a non-empty string",
      );
    }
    if (!isNonEmptyStringArray(eligibility.eligibleCaseIds)) {
      issues.push(
        "lanyonEligibility.eligibleCaseIds must contain non-empty strings",
      );
    }
    if (
      eligibility.dimensions !== null &&
      eligibility.dimensions !== 1 &&
      eligibility.dimensions !== 2 &&
      eligibility.dimensions !== 3
    ) {
      issues.push("lanyonEligibility.dimensions is invalid");
    }
    if (
      eligibility.caseKind !== null &&
      !includes(THEORY_EXPERIMENT_LANYON_CASE_KINDS, eligibility.caseKind)
    ) {
      issues.push("lanyonEligibility.caseKind is invalid");
    }
    if (typeof eligibility.semanticIdentityBound !== "boolean") {
      issues.push("lanyonEligibility.semanticIdentityBound must be boolean");
    }
    if (!isNonEmptyStringArray(eligibility.blockers)) {
      issues.push("lanyonEligibility.blockers must contain non-empty strings");
    }
    if (!isNonEmptyStringArray(eligibility.reasons)) {
      issues.push("lanyonEligibility.reasons must contain non-empty strings");
    }
    if (!isRecord(eligibility.authority)) {
      issues.push("lanyonEligibility.authority must be an object");
    } else if (
      eligibility.authority.selectsPinnedCandidateOnly !== true ||
      eligibility.authority.trustsProducerOutput !== false ||
      eligibility.authority.validatesTheory !== false ||
      eligibility.authority.validatesGeneratedCode !== false ||
      eligibility.authority.validatesNumericalImplementation !== false
    ) {
      issues.push("lanyonEligibility.authority is invalid");
    }
  }
  if (!Array.isArray(value.capabilityAffordances)) {
    issues.push("capabilityAffordances must be an array");
  } else {
    value.capabilityAffordances.forEach((affordance, index) => {
      if (!isRecord(affordance)) {
        issues.push(`capabilityAffordances[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(affordance.capabilityId)) {
        issues.push(
          `capabilityAffordances[${index}].capabilityId must be a non-empty string`,
        );
      }
      if (!includes(THEORY_EXPERIMENT_CAPABILITY_PHASES, affordance.phase)) {
        issues.push(`capabilityAffordances[${index}].phase is invalid`);
      }
      if (!includes(THEORY_EXPERIMENT_CAPABILITY_STATUSES, affordance.status)) {
        issues.push(`capabilityAffordances[${index}].status is invalid`);
      }
      if (typeof affordance.requiresConfirmation !== "boolean") {
        issues.push(
          `capabilityAffordances[${index}].requiresConfirmation must be boolean`,
        );
      }
      if (!isNonEmptyStringArray(affordance.requiredInputKeys)) {
        issues.push(
          `capabilityAffordances[${index}].requiredInputKeys must contain non-empty strings`,
        );
      }
      if (!isNonEmptyStringArray(affordance.dependsOnArtifactRefs)) {
        issues.push(
          `capabilityAffordances[${index}].dependsOnArtifactRefs must contain non-empty strings`,
        );
      }
      if (
        affordance.producesEvidenceKind !== null &&
        !includes(
          THEORY_EXPERIMENT_EVIDENCE_KINDS,
          affordance.producesEvidenceKind,
        )
      ) {
        issues.push(
          `capabilityAffordances[${index}].producesEvidenceKind is invalid`,
        );
      }
      if (!isNonEmptyString(affordance.reason)) {
        issues.push(
          `capabilityAffordances[${index}].reason must be a non-empty string`,
        );
      }
      if (affordance.executesAutomatically !== false) {
        issues.push(
          `capabilityAffordances[${index}] must never execute automatically`,
        );
      }
    });
  }
  if (!Array.isArray(value.missingRequirements)) {
    issues.push("missingRequirements must be an array");
  } else {
    value.missingRequirements.forEach((requirement, index) => {
      if (!isRecord(requirement)) {
        issues.push(`missingRequirements[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(requirement.code)) {
        issues.push(
          `missingRequirements[${index}].code must be a non-empty string`,
        );
      }
      if (!includes(THEORY_EXPERIMENT_STAGE_IDS, requirement.stageId)) {
        issues.push(`missingRequirements[${index}].stageId is invalid`);
      }
      if (!isNonEmptyString(requirement.message)) {
        issues.push(
          `missingRequirements[${index}].message must be a non-empty string`,
        );
      }
      if (typeof requirement.retryable !== "boolean") {
        issues.push(`missingRequirements[${index}].retryable must be boolean`);
      }
      if (
        !includes(
          THEORY_EXPERIMENT_MISSING_REQUIREMENT_REPAIRS,
          requirement.repair,
        )
      ) {
        issues.push(`missingRequirements[${index}].repair is invalid`);
      }
    });
  }
  if (
    !Array.isArray(value.stages) ||
    value.stages.length !== THEORY_EXPERIMENT_STAGE_IDS.length
  ) {
    issues.push("stages must contain the canonical seven stages");
  } else {
    value.stages.forEach((stage, index) => {
      if (!isRecord(stage)) {
        issues.push(`stages[${index}] must be an object`);
        return;
      }
      if (
        stage.id !== THEORY_EXPERIMENT_STAGE_IDS[index] ||
        stage.ordinal !== index + 1
      ) {
        issues.push(`stages[${index}] must preserve canonical stage order`);
      }
      if (!includes(THEORY_EXPERIMENT_STAGE_STATUSES, stage.status)) {
        issues.push(`stages[${index}].status is invalid`);
      }
      if (!isNonEmptyStringArray(stage.evidenceRefs)) {
        issues.push(
          `stages[${index}].evidenceRefs must contain non-empty strings`,
        );
      }
      if (!isNonEmptyStringArray(stage.missingRequirementCodes)) {
        issues.push(
          `stages[${index}].missingRequirementCodes must contain non-empty strings`,
        );
      }
      if (!isNonEmptyStringArray(stage.capabilityIds)) {
        issues.push(
          `stages[${index}].capabilityIds must contain non-empty strings`,
        );
      }
    });
  }
  if (!isRecord(value.readiness)) {
    issues.push("readiness must be an object");
  } else {
    if (
      !includes(THEORY_EXPERIMENT_READINESS_STATUSES, value.readiness.status)
    ) {
      issues.push("readiness.status is invalid");
    }
    if (!isNonEmptyStringArray(value.readiness.nextAdmissibleCapabilityIds)) {
      issues.push(
        "readiness.nextAdmissibleCapabilityIds must contain non-empty strings",
      );
    }
    if (value.readiness.terminalSynthesisAllowed !== false) {
      issues.push("readiness must remain non-terminal");
    }
    if (!isNonEmptyString(value.readiness.reason)) {
      issues.push("readiness.reason must be a non-empty string");
    }
  }
  if (!isRecord(value.incompletenessBoundary)) {
    issues.push("incompletenessBoundary must be an object");
  } else {
    if (!isNullableNonEmptyString(value.incompletenessBoundary.formalSystem)) {
      issues.push(
        "incompletenessBoundary.formalSystem must be null or a non-empty string",
      );
    }
    if (
      !includes(
        THEORY_EXPERIMENT_FORMAL_STATUSES,
        value.incompletenessBoundary.formalStatus,
      )
    ) {
      issues.push("incompletenessBoundary.formalStatus is invalid");
    }
    if (
      value.incompletenessBoundary.outOfGraphMassPreserved !== true ||
      value.incompletenessBoundary.missingRelationsRemainOpenWorld !== true ||
      value.incompletenessBoundary.noIndependenceClaimWithoutCertificate !==
        true
    ) {
      issues.push("incompletenessBoundary is invalid");
    }
  }
  if (!isRecord(value.authority)) {
    issues.push("authority must be an object");
  } else if (
    value.authority.executorOwner !== "agent_runtime" ||
    value.authority.preparesProcedureOnly !== true ||
    value.authority.executesTools !== false ||
    value.authority.semanticIntentAuthority !== false ||
    value.authority.proofAuthority !== false ||
    value.authority.numericalAuthority !== false ||
    value.authority.empiricalAuthority !== false ||
    value.authority.physicalTruthAuthority !== false ||
    value.authority.assistantAnswer !== false ||
    value.authority.terminalEligible !== false ||
    value.authority.postToolModelStepRequired !== true
  ) {
    issues.push("authority boundary is invalid");
  }
  return issues;
}

export function isTheoryExperimentProcedureV1(
  value: unknown,
): value is TheoryExperimentProcedureV1 {
  return validateTheoryExperimentProcedureV1(value).length === 0;
}
