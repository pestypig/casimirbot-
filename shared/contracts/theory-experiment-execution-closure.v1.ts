import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import {
  THEORY_EXPERIMENT_STAGE_IDS,
  type TheoryExperimentEvidenceKindV1,
  type TheoryExperimentEvidenceLineageV1,
  type TheoryExperimentStageIdV1,
} from "./theory-experiment-procedure.v1";

export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_ARTIFACT_ID =
  "theory_experiment_execution_closure" as const;
export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_SCHEMA_VERSION =
  "theory_experiment_execution_closure/v1" as const;
export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN =
  "theory-experiment-execution-closure/v1" as const;
export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID =
  "theory_execution_closure_evidence_coverage/v1" as const;
export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1 = {
  policyId: THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID,
  objective: "maximize_admitted_evidence_coverage_then_graph_congruence",
  applicableAxisTreatment: "exclude_not_applicable",
  partialAxisCredit: 0.5,
  tieDefinition: "equal_comparability_and_rounded_evidence_coverage",
  interpretation: "candidate_preference_not_theory_truth",
} as const;

export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_IDS = [
  "semantic_identity",
  "graph_congruence",
  "derivation_readiness",
  "scale_localization",
  "artifact_admission",
  "formal_replay",
  "independent_numerical_replay",
  "empirical_grounding",
] as const;

export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_STATUSES = [
  "satisfied",
  "partial",
  "failed",
  "blocked",
  "missing",
  "not_applicable",
] as const;

export type TheoryExperimentExecutionClosureAxisIdV1 =
  (typeof THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_IDS)[number];
export type TheoryExperimentExecutionClosureAxisStatusV1 =
  (typeof THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_STATUSES)[number];

export type TheoryExperimentExecutionClosureEvidenceObservationV1 = {
  artifactRef: string;
  boundArtifactRef: string;
  kind: Extract<
    TheoryExperimentEvidenceKindV1,
    | "semantic_admission"
    | "artifact_generation_receipt"
    | "formal_certificate"
    | "numerical_certificate"
    | "empirical_observation"
  >;
  schema: string;
  contentSha256: string;
  sourceTurnId: string;
  status: "referenced" | "admitted" | "passed" | "failed" | "blocked";
  scope:
    | "bound_procedure_reference"
    | "shared_procedure_evidence"
    | "unscoped_current_turn_evidence";
  closureSatisfied: boolean;
  lineage: TheoryExperimentEvidenceLineageV1;
  authority: "evidence_only";
};

export type TheoryExperimentExecutionClosureAxisV1 = {
  axisId: TheoryExperimentExecutionClosureAxisIdV1;
  status: TheoryExperimentExecutionClosureAxisStatusV1;
  applicable: boolean;
  evidenceRefs: string[];
  reason: string;
};

export type TheoryExperimentExecutionClosureCandidateV1 = {
  candidateId: string;
  badgeId: string;
  role: "selected" | "comparison";
  comparable: boolean;
  comparabilityBlockers: string[];
  masterProblemNodeIds: string[];
  derivationStepIds: string[];
  scaleCheckpointOrdinals: number[];
  bridgeStatuses: Array<"verified" | "partial" | "missing">;
  axes: TheoryExperimentExecutionClosureAxisV1[];
  applicableAxisCount: number;
  satisfiedAxisCount: number;
  evidenceCoverageScore: number;
  rankingGroup: number | null;
  displayOrdinal: number;
  supportingEvidenceRefs: string[];
  interpretation: "evidence_closure_priority_not_truth_probability";
};

export type TheoryExperimentExecutionClosureStageV1 = {
  id: TheoryExperimentStageIdV1;
  ordinal: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  procedureStatus: "ready" | "complete" | "blocked" | "not_applicable";
  closureStatus: "satisfied" | "partial" | "blocked" | "not_applicable";
  evidenceRefs: string[];
  blockerCodes: string[];
};

export type TheoryExperimentExecutionClosureV1 = {
  artifactId: typeof THEORY_EXPERIMENT_EXECUTION_CLOSURE_ARTIFACT_ID;
  schemaVersion: typeof THEORY_EXPERIMENT_EXECUTION_CLOSURE_SCHEMA_VERSION;
  generatedAt: string;
  closureId: string;
  closureSha256: string;
  turnId: string;
  procedureBinding: {
    artifactRef: string;
    procedureId: string;
    procedureSha256: string;
    graphId: string;
  };
  candidateSet: {
    candidateIds: string[];
    selectedCandidateIds: string[];
    comparisonCandidateIds: string[];
    evidenceScope: "shared_procedure_evidence";
  };
  evidenceObservations: TheoryExperimentExecutionClosureEvidenceObservationV1[];
  stages: TheoryExperimentExecutionClosureStageV1[];
  candidates: TheoryExperimentExecutionClosureCandidateV1[];
  ranking: {
    policyId: typeof THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID;
    policySha256: string;
    objective: "maximize_admitted_evidence_coverage_then_graph_congruence";
    outcome:
      | "unique_preference"
      | "tied_top"
      | "incomparable"
      | "blocked"
      | "no_candidates";
    orderedCandidateIds: string[];
    topCandidateIds: string[];
    interpretation: "candidate_preference_not_theory_truth";
    probabilityClaimAllowed: false;
  };
  synthesisReadiness: {
    status: "blocked" | "bounded_proposal_ready" | "bounded_comparison_ready";
    claimCeiling:
      | "procedure_only"
      | "semantic_comparison"
      | "formally_checked_comparison"
      | "numerically_checked_comparison"
      | "empirically_grounded_comparison";
    modelSynthesisAllowed: boolean;
    requiredSupportRefs: string[];
    blockerCodes: string[];
    openRequirementCodes: string[];
    reason: string;
  };
  nextCapabilityCandidates: Array<{
    capabilityId: string;
    status: "admitted" | "conditional";
    requiresConfirmation: boolean;
    missingInputKeys: string[];
    reason: string;
  }>;
  incompletenessBoundary: {
    outOfGraphMassPreserved: true;
    missingRelationsRemainOpenWorld: true;
    empiricalObservationSchemaRegistered: boolean;
    failedEvidenceRetainedWithoutSatisfyingClosure: true;
    candidateScopedEvidenceMayDiscriminateCandidates: true;
  };
  authority: {
    executorOwner: "agent_runtime";
    evaluatesEvidenceOnly: true;
    executesTools: false;
    ranksEvidenceCoverageOnly: true;
    validatesTheory: false;
    validatesGeneratedCode: false;
    proofAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalTruthAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

type BuildTheoryExperimentExecutionClosureInput = Omit<
  TheoryExperimentExecutionClosureV1,
  "artifactId" | "schemaVersion"
>;

export function buildTheoryExperimentExecutionClosureV1(
  input: BuildTheoryExperimentExecutionClosureInput,
): TheoryExperimentExecutionClosureV1 {
  return {
    artifactId: THEORY_EXPERIMENT_EXECUTION_CLOSURE_ARTIFACT_ID,
    schemaVersion: THEORY_EXPERIMENT_EXECUTION_CLOSURE_SCHEMA_VERSION,
    ...input,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isNonEmptyString);
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);
const includes = <T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] => typeof value === "string" && values.includes(value);
const CLOSURE_EVIDENCE_KINDS = [
  "semantic_admission",
  "artifact_generation_receipt",
  "formal_certificate",
  "numerical_certificate",
  "empirical_observation",
] as const;

const sameOrderedStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const sameStringSet = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length && left.every((entry) => right.includes(entry));

const candidateSortOrdinal = (candidate: Record<string, unknown>): number => {
  const ordinals = Array.isArray(candidate.scaleCheckpointOrdinals)
    ? candidate.scaleCheckpointOrdinals.filter(
        (entry): entry is number => isInteger(entry) && entry >= 0,
      )
    : [];
  return ordinals.length > 0 ? Math.min(...ordinals) : Number.MAX_SAFE_INTEGER;
};

const compareCandidateRecords = (
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): number => {
  if (left.comparable !== right.comparable) {
    return left.comparable === true ? -1 : 1;
  }
  const leftScore = isInteger(left.evidenceCoverageScore)
    ? left.evidenceCoverageScore
    : -1;
  const rightScore = isInteger(right.evidenceCoverageScore)
    ? right.evidenceCoverageScore
    : -1;
  if (rightScore !== leftScore) return rightScore - leftScore;
  if (left.role !== right.role) return left.role === "selected" ? -1 : 1;
  const leftOrdinal = candidateSortOrdinal(left);
  const rightOrdinal = candidateSortOrdinal(right);
  if (leftOrdinal !== rightOrdinal) return leftOrdinal - rightOrdinal;
  return String(left.candidateId).localeCompare(String(right.candidateId));
};

export function validateTheoryExperimentExecutionClosureV1(
  value: unknown,
): string[] {
  if (!isRecord(value)) {
    return ["execution closure must be an object"];
  }
  const issues: string[] = [];
  if (value.artifactId !== THEORY_EXPERIMENT_EXECUTION_CLOSURE_ARTIFACT_ID) {
    issues.push("artifactId is invalid");
  }
  if (
    value.schemaVersion !== THEORY_EXPERIMENT_EXECUTION_CLOSURE_SCHEMA_VERSION
  ) {
    issues.push("schemaVersion is invalid");
  }
  for (const field of ["generatedAt", "closureId", "turnId"] as const) {
    if (!isNonEmptyString(value[field]))
      issues.push(`${field} must be non-empty`);
  }
  if (!isSha256(value.closureSha256)) {
    issues.push("closureSha256 must be a lowercase sha256");
  }

  if (!isRecord(value.procedureBinding)) {
    issues.push("procedureBinding must be an object");
  } else {
    for (const field of ["artifactRef", "procedureId", "graphId"] as const) {
      if (!isNonEmptyString(value.procedureBinding[field])) {
        issues.push(`procedureBinding.${field} must be non-empty`);
      }
    }
    if (!isSha256(value.procedureBinding.procedureSha256)) {
      issues.push("procedureBinding.procedureSha256 is invalid");
    }
  }

  const candidateIds = new Set<string>();
  let declaredCandidateIds: string[] = [];
  let declaredSelectedCandidateIds: string[] = [];
  let declaredComparisonCandidateIds: string[] = [];
  if (!isRecord(value.candidateSet)) {
    issues.push("candidateSet must be an object");
  } else {
    for (const field of [
      "candidateIds",
      "selectedCandidateIds",
      "comparisonCandidateIds",
    ] as const) {
      if (!isStringArray(value.candidateSet[field])) {
        issues.push(`candidateSet.${field} must contain non-empty strings`);
      }
    }
    if (Array.isArray(value.candidateSet.candidateIds)) {
      declaredCandidateIds =
        value.candidateSet.candidateIds.filter(isNonEmptyString);
      for (const id of value.candidateSet.candidateIds) {
        if (isNonEmptyString(id)) {
          if (candidateIds.has(id))
            issues.push("candidateSet contains duplicates");
          candidateIds.add(id);
        }
      }
    }
    if (Array.isArray(value.candidateSet.selectedCandidateIds)) {
      declaredSelectedCandidateIds =
        value.candidateSet.selectedCandidateIds.filter(isNonEmptyString);
    }
    if (Array.isArray(value.candidateSet.comparisonCandidateIds)) {
      declaredComparisonCandidateIds =
        value.candidateSet.comparisonCandidateIds.filter(isNonEmptyString);
    }
    const selectedSet = new Set(declaredSelectedCandidateIds);
    const comparisonSet = new Set(declaredComparisonCandidateIds);
    if (
      selectedSet.size !== declaredSelectedCandidateIds.length ||
      comparisonSet.size !== declaredComparisonCandidateIds.length
    ) {
      issues.push("candidateSet role lists must be duplicate-free");
    }
    if (declaredSelectedCandidateIds.some((id) => comparisonSet.has(id))) {
      issues.push(
        "candidateSet selected and comparison roles must be disjoint",
      );
    }
    if (
      !sameStringSet(declaredCandidateIds, [
        ...declaredSelectedCandidateIds,
        ...declaredComparisonCandidateIds,
      ])
    ) {
      issues.push(
        "candidateSet candidateIds must equal the selected and comparison union",
      );
    }
    if (value.candidateSet.evidenceScope !== "shared_procedure_evidence") {
      issues.push("candidateSet.evidenceScope is invalid");
    }
  }

  const evidenceRefs = new Set<string>();
  if (!Array.isArray(value.evidenceObservations)) {
    issues.push("evidenceObservations must be an array");
  } else {
    value.evidenceObservations.forEach((entry, index) => {
      if (!isRecord(entry)) {
        issues.push(`evidenceObservations[${index}] must be an object`);
        return;
      }
      for (const field of [
        "artifactRef",
        "boundArtifactRef",
        "kind",
        "schema",
        "sourceTurnId",
      ] as const) {
        if (!isNonEmptyString(entry[field])) {
          issues.push(
            `evidenceObservations[${index}].${field} must be non-empty`,
          );
        }
      }
      if (!includes(CLOSURE_EVIDENCE_KINDS, entry.kind)) {
        issues.push(`evidenceObservations[${index}].kind is invalid`);
      }
      if (isNonEmptyString(entry.artifactRef)) {
        if (evidenceRefs.has(entry.artifactRef)) {
          issues.push(
            `evidenceObservations[${index}].artifactRef is duplicated`,
          );
        }
        evidenceRefs.add(entry.artifactRef);
      }
      if (!isSha256(entry.contentSha256)) {
        issues.push(`evidenceObservations[${index}].contentSha256 is invalid`);
      }
      if (
        !["referenced", "admitted", "passed", "failed", "blocked"].includes(
          String(entry.status),
        )
      ) {
        issues.push(`evidenceObservations[${index}].status is invalid`);
      }
      if (
        ![
          "bound_procedure_reference",
          "shared_procedure_evidence",
          "unscoped_current_turn_evidence",
        ].includes(String(entry.scope)) ||
        entry.authority !== "evidence_only" ||
        typeof entry.closureSatisfied !== "boolean"
      ) {
        issues.push(
          `evidenceObservations[${index}] authority or scope is invalid`,
        );
      }
      if (
        entry.scope !== "shared_procedure_evidence" &&
        entry.closureSatisfied !== false
      ) {
        issues.push(
          `evidenceObservations[${index}] non-reentered evidence cannot satisfy closure`,
        );
      }
      if (
        entry.closureSatisfied === true &&
        !["admitted", "passed"].includes(String(entry.status))
      ) {
        issues.push(
          `evidenceObservations[${index}] failed or blocked evidence cannot satisfy closure`,
        );
      }
      if (
        entry.status === "referenced" &&
        entry.scope !== "bound_procedure_reference"
      ) {
        issues.push(
          `evidenceObservations[${index}] referenced evidence must remain a bound procedure reference`,
        );
      }
      if (!isRecord(entry.lineage)) {
        issues.push(`evidenceObservations[${index}].lineage is required`);
      } else {
        const procedureId = isRecord(value.procedureBinding)
          ? value.procedureBinding.procedureId
          : null;
        if (
          !isNonEmptyString(entry.lineage.procedureId) ||
          entry.lineage.procedureId !== procedureId
        ) {
          issues.push(
            `evidenceObservations[${index}].lineage.procedureId does not match procedureBinding`,
          );
        }
        if (
          !isStringArray(entry.lineage.candidateBadgeIds) ||
          (entry.scope !== "unscoped_current_turn_evidence" &&
            entry.lineage.candidateBadgeIds.length === 0) ||
          entry.lineage.candidateBadgeIds.some(
            (badgeId) => !candidateIds.has(badgeId),
          )
        ) {
          issues.push(
            `evidenceObservations[${index}].lineage candidate scope is invalid`,
          );
        }
        if (
          !isSha256(entry.lineage.casimirSpecSemanticSha256) ||
          !isSha256(entry.lineage.casimirSpecArtifactSha256) ||
          !Array.isArray(entry.lineage.claims) ||
          entry.lineage.claims.length === 0
        ) {
          issues.push(
            `evidenceObservations[${index}].lineage scientific identity is invalid`,
          );
        }
      }
    });
  }

  if (!Array.isArray(value.stages) || value.stages.length !== 7) {
    issues.push("stages must contain exactly seven entries");
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
        issues.push(`stages[${index}] order is invalid`);
      }
      if (
        !["ready", "complete", "blocked", "not_applicable"].includes(
          String(stage.procedureStatus),
        )
      ) {
        issues.push(`stages[${index}].procedureStatus is invalid`);
      }
      if (
        !["satisfied", "partial", "blocked", "not_applicable"].includes(
          String(stage.closureStatus),
        )
      ) {
        issues.push(`stages[${index}].closureStatus is invalid`);
      }
      if (
        !isStringArray(stage.evidenceRefs) ||
        !isStringArray(stage.blockerCodes)
      ) {
        issues.push(`stages[${index}] refs or blockers are invalid`);
      }
    });
  }

  if (!Array.isArray(value.candidates)) {
    issues.push("candidates must be an array");
  } else {
    if (candidateIds.size !== value.candidates.length) {
      issues.push("candidates must match candidateSet.candidateIds");
    }
    value.candidates.forEach((candidate, index) => {
      if (!isRecord(candidate)) {
        issues.push(`candidates[${index}] must be an object`);
        return;
      }
      if (
        !isNonEmptyString(candidate.candidateId) ||
        !candidateIds.has(candidate.candidateId) ||
        candidate.badgeId !== candidate.candidateId
      ) {
        issues.push(`candidates[${index}] identity is invalid`);
      }
      if (!["selected", "comparison"].includes(String(candidate.role))) {
        issues.push(`candidates[${index}].role is invalid`);
      } else if (
        (candidate.role === "selected" &&
          !declaredSelectedCandidateIds.includes(
            String(candidate.candidateId),
          )) ||
        (candidate.role === "comparison" &&
          !declaredComparisonCandidateIds.includes(
            String(candidate.candidateId),
          ))
      ) {
        issues.push(`candidates[${index}].role does not match candidateSet`);
      }
      if (
        typeof candidate.comparable !== "boolean" ||
        !isStringArray(candidate.comparabilityBlockers) ||
        !isStringArray(candidate.masterProblemNodeIds) ||
        !isStringArray(candidate.derivationStepIds) ||
        !Array.isArray(candidate.scaleCheckpointOrdinals) ||
        !candidate.scaleCheckpointOrdinals.every(
          (entry) => isInteger(entry) && entry >= 0,
        ) ||
        !Array.isArray(candidate.bridgeStatuses) ||
        !candidate.bridgeStatuses.every((entry) =>
          ["verified", "partial", "missing"].includes(String(entry)),
        )
      ) {
        issues.push(`candidates[${index}] graph fields are invalid`);
      }
      if (
        !Array.isArray(candidate.axes) ||
        candidate.axes.length !==
          THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_IDS.length
      ) {
        issues.push(`candidates[${index}].axes are invalid`);
      } else {
        candidate.axes.forEach((axis, axisIndex) => {
          if (!isRecord(axis)) {
            issues.push(
              `candidates[${index}].axes[${axisIndex}] must be an object`,
            );
            return;
          }
          if (
            axis.axisId !==
              THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_IDS[axisIndex] ||
            !includes(
              THEORY_EXPERIMENT_EXECUTION_CLOSURE_AXIS_STATUSES,
              axis.status,
            ) ||
            typeof axis.applicable !== "boolean" ||
            !isStringArray(axis.evidenceRefs) ||
            !isNonEmptyString(axis.reason)
          ) {
            issues.push(`candidates[${index}].axes[${axisIndex}] is invalid`);
          }
          if (axis.applicable === false && axis.status !== "not_applicable") {
            issues.push(
              `candidates[${index}].axes[${axisIndex}] non-applicable status mismatch`,
            );
          }
        });
        const applicableAxes = candidate.axes.filter(
          (axis) => isRecord(axis) && axis.applicable === true,
        );
        const satisfiedAxes = applicableAxes.filter(
          (axis) => axis.status === "satisfied",
        );
        const credit = applicableAxes.reduce((sum, axis) => {
          if (axis.status === "satisfied") return sum + 1;
          if (axis.status === "partial") return sum + 0.5;
          return sum;
        }, 0);
        const expectedScore =
          applicableAxes.length === 0
            ? 0
            : Math.round((credit / applicableAxes.length) * 100);
        if (
          candidate.applicableAxisCount !== applicableAxes.length ||
          candidate.satisfiedAxisCount !== satisfiedAxes.length ||
          candidate.evidenceCoverageScore !== expectedScore
        ) {
          issues.push(
            `candidates[${index}] evidence coverage summary is inconsistent`,
          );
        }
      }
      for (const field of [
        "applicableAxisCount",
        "satisfiedAxisCount",
        "evidenceCoverageScore",
        "displayOrdinal",
      ] as const) {
        if (!isInteger(candidate[field]) || Number(candidate[field]) < 0) {
          issues.push(`candidates[${index}].${field} is invalid`);
        }
      }
      if (
        isInteger(candidate.evidenceCoverageScore) &&
        (candidate.evidenceCoverageScore < 0 ||
          candidate.evidenceCoverageScore > 100)
      ) {
        issues.push(
          `candidates[${index}].evidenceCoverageScore is out of range`,
        );
      }
      if (
        candidate.rankingGroup !== null &&
        (!isInteger(candidate.rankingGroup) || candidate.rankingGroup < 1)
      ) {
        issues.push(`candidates[${index}].rankingGroup is invalid`);
      }
      if (
        !isStringArray(candidate.supportingEvidenceRefs) ||
        candidate.interpretation !==
          "evidence_closure_priority_not_truth_probability"
      ) {
        issues.push(`candidates[${index}] evidence interpretation is invalid`);
      } else if (
        Array.isArray(candidate.axes) &&
        !sameStringSet(
          candidate.supportingEvidenceRefs,
          Array.from(
            new Set(
              candidate.axes.flatMap((axis) =>
                isRecord(axis) && Array.isArray(axis.evidenceRefs)
                  ? axis.evidenceRefs.filter(isNonEmptyString)
                  : [],
              ),
            ),
          ),
        )
      ) {
        issues.push(
          `candidates[${index}].supportingEvidenceRefs do not match axis evidence`,
        );
      }
    });
    const candidateRecords = value.candidates.filter(isRecord);
    if (candidateRecords.length === value.candidates.length) {
      const actualIds = candidateRecords
        .map((candidate) => candidate.candidateId)
        .filter(isNonEmptyString);
      if (!sameOrderedStrings(actualIds, declaredCandidateIds)) {
        issues.push("candidateSet.candidateIds must match candidate order");
      }
      const expectedIds = [...candidateRecords]
        .sort(compareCandidateRecords)
        .map((candidate) => candidate.candidateId)
        .filter(isNonEmptyString);
      if (!sameOrderedStrings(actualIds, expectedIds)) {
        issues.push("candidates are not in deterministic ranking order");
      }
      let expectedRankingGroup = 0;
      let priorRankingKey = "";
      candidateRecords.forEach((candidate, index) => {
        const rankingKey = `${String(candidate.comparable)}:${String(
          candidate.evidenceCoverageScore,
        )}`;
        if (rankingKey !== priorRankingKey) expectedRankingGroup += 1;
        const expectedGroup =
          candidate.comparable === true ? expectedRankingGroup : null;
        if (
          candidate.displayOrdinal !== index + 1 ||
          candidate.rankingGroup !== expectedGroup
        ) {
          issues.push(
            `candidates[${index}] ranking group or display ordinal is inconsistent`,
          );
        }
        priorRankingKey = rankingKey;
      });
    }
  }

  if (!isRecord(value.ranking)) {
    issues.push("ranking must be an object");
  } else {
    if (
      value.ranking.policyId !==
        THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_ID ||
      !isSha256(value.ranking.policySha256) ||
      value.ranking.objective !==
        "maximize_admitted_evidence_coverage_then_graph_congruence" ||
      ![
        "unique_preference",
        "tied_top",
        "incomparable",
        "blocked",
        "no_candidates",
      ].includes(String(value.ranking.outcome)) ||
      !isStringArray(value.ranking.orderedCandidateIds) ||
      !isStringArray(value.ranking.topCandidateIds) ||
      value.ranking.interpretation !==
        "candidate_preference_not_theory_truth" ||
      value.ranking.probabilityClaimAllowed !== false
    ) {
      issues.push("ranking contract is invalid");
    }
    if (
      Array.isArray(value.candidates) &&
      isStringArray(value.ranking.orderedCandidateIds)
    ) {
      const expectedOrder = value.candidates
        .map((candidate) =>
          isRecord(candidate) ? candidate.candidateId : null,
        )
        .filter(isNonEmptyString);
      if (
        !sameOrderedStrings(value.ranking.orderedCandidateIds, expectedOrder)
      ) {
        issues.push("ranking.orderedCandidateIds must match candidate order");
      }
      const comparableCandidates = value.candidates.filter(
        (candidate) => isRecord(candidate) && candidate.comparable === true,
      ) as Record<string, unknown>[];
      const topScore =
        comparableCandidates.length > 0 &&
        isInteger(comparableCandidates[0].evidenceCoverageScore)
          ? comparableCandidates[0].evidenceCoverageScore
          : null;
      const expectedTopIds =
        topScore === null
          ? []
          : comparableCandidates
              .filter(
                (candidate) => candidate.evidenceCoverageScore === topScore,
              )
              .map((candidate) => candidate.candidateId)
              .filter(isNonEmptyString);
      if (
        !isStringArray(value.ranking.topCandidateIds) ||
        !sameOrderedStrings(value.ranking.topCandidateIds, expectedTopIds)
      ) {
        issues.push("ranking.topCandidateIds are inconsistent");
      }
      const blockerCodes =
        isRecord(value.synthesisReadiness) &&
        Array.isArray(value.synthesisReadiness.blockerCodes)
          ? value.synthesisReadiness.blockerCodes.filter(isNonEmptyString)
          : [];
      const expectedOutcome =
        expectedOrder.length === 0
          ? "no_candidates"
          : blockerCodes.includes("graph_or_derivation_runtime_blocked")
            ? "blocked"
            : comparableCandidates.length === 0
              ? "incomparable"
              : expectedTopIds.length === 1
                ? "unique_preference"
                : "tied_top";
      if (value.ranking.outcome !== expectedOutcome) {
        issues.push("ranking.outcome is inconsistent");
      }
    }
  }

  if (!isRecord(value.synthesisReadiness)) {
    issues.push("synthesisReadiness must be an object");
  } else if (
    !["blocked", "bounded_proposal_ready", "bounded_comparison_ready"].includes(
      String(value.synthesisReadiness.status),
    ) ||
    ![
      "procedure_only",
      "semantic_comparison",
      "formally_checked_comparison",
      "numerically_checked_comparison",
      "empirically_grounded_comparison",
    ].includes(String(value.synthesisReadiness.claimCeiling)) ||
    typeof value.synthesisReadiness.modelSynthesisAllowed !== "boolean" ||
    !isStringArray(value.synthesisReadiness.requiredSupportRefs) ||
    !isStringArray(value.synthesisReadiness.blockerCodes) ||
    !isStringArray(value.synthesisReadiness.openRequirementCodes) ||
    !isNonEmptyString(value.synthesisReadiness.reason)
  ) {
    issues.push("synthesisReadiness contract is invalid");
  } else {
    const synthesisCandidates = Array.isArray(value.candidates)
      ? value.candidates.filter(isRecord)
      : [];
    const allCandidatesComparable =
      synthesisCandidates.length > 0 &&
      synthesisCandidates.every((candidate) => candidate.comparable === true);
    const axisSatisfiedAcrossCandidates = (axisId: string): boolean =>
      allCandidatesComparable &&
      synthesisCandidates.every((candidate) => {
        const axes = Array.isArray(candidate.axes)
          ? candidate.axes.filter(isRecord)
          : [];
        const candidateAxis = axes.find((axis) => axis.axisId === axisId);
        return (
          candidateAxis?.applicable === true &&
          candidateAxis.status === "satisfied"
        );
      });
    const semanticSatisfied =
      axisSatisfiedAcrossCandidates("semantic_identity");
    const expectedClaimCeiling =
      semanticSatisfied && axisSatisfiedAcrossCandidates("empirical_grounding")
        ? "empirically_grounded_comparison"
        : semanticSatisfied &&
            axisSatisfiedAcrossCandidates("independent_numerical_replay")
          ? "numerically_checked_comparison"
          : semanticSatisfied && axisSatisfiedAcrossCandidates("formal_replay")
            ? "formally_checked_comparison"
            : semanticSatisfied
              ? "semantic_comparison"
              : "procedure_only";
    if (value.synthesisReadiness.claimCeiling !== expectedClaimCeiling) {
      issues.push("synthesisReadiness.claimCeiling is inconsistent");
    }
    if (
      (value.synthesisReadiness.status === "blocked") !==
      (value.synthesisReadiness.modelSynthesisAllowed === false)
    ) {
      issues.push(
        "synthesisReadiness status and modelSynthesisAllowed are inconsistent",
      );
    }
    const expectedSupportRefs = Array.isArray(value.candidates)
      ? Array.from(
          new Set(
            value.candidates.flatMap((candidate) =>
              isRecord(candidate) && Array.isArray(candidate.axes)
                ? candidate.axes.flatMap((axis) =>
                    isRecord(axis) &&
                    axis.status === "satisfied" &&
                    Array.isArray(axis.evidenceRefs)
                      ? axis.evidenceRefs.filter(isNonEmptyString)
                      : [],
                  )
                : [],
            ),
          ),
        )
      : [];
    if (
      !sameStringSet(
        value.synthesisReadiness.requiredSupportRefs,
        expectedSupportRefs,
      )
    ) {
      issues.push(
        "synthesisReadiness.requiredSupportRefs do not match candidate support",
      );
    }
  }

  if (!Array.isArray(value.nextCapabilityCandidates)) {
    issues.push("nextCapabilityCandidates must be an array");
  } else {
    value.nextCapabilityCandidates.forEach((candidate, index) => {
      if (
        !isRecord(candidate) ||
        !isNonEmptyString(candidate.capabilityId) ||
        !["admitted", "conditional"].includes(String(candidate.status)) ||
        typeof candidate.requiresConfirmation !== "boolean" ||
        !isStringArray(candidate.missingInputKeys) ||
        !isNonEmptyString(candidate.reason)
      ) {
        issues.push(`nextCapabilityCandidates[${index}] is invalid`);
      }
    });
  }

  const boundary = isRecord(value.incompletenessBoundary)
    ? value.incompletenessBoundary
    : null;
  if (
    !boundary ||
    boundary.outOfGraphMassPreserved !== true ||
    boundary.missingRelationsRemainOpenWorld !== true ||
    typeof boundary.empiricalObservationSchemaRegistered !== "boolean" ||
    boundary.failedEvidenceRetainedWithoutSatisfyingClosure !== true ||
    boundary.candidateScopedEvidenceMayDiscriminateCandidates !== true
  ) {
    issues.push("incompletenessBoundary is invalid");
  }

  const authority = isRecord(value.authority) ? value.authority : null;
  if (
    !authority ||
    authority.executorOwner !== "agent_runtime" ||
    authority.evaluatesEvidenceOnly !== true ||
    authority.executesTools !== false ||
    authority.ranksEvidenceCoverageOnly !== true ||
    authority.validatesTheory !== false ||
    authority.validatesGeneratedCode !== false ||
    authority.proofAuthority !== false ||
    authority.numericalAuthority !== false ||
    authority.empiricalAuthority !== false ||
    authority.physicalTruthAuthority !== false ||
    authority.assistantAnswer !== false ||
    authority.terminalEligible !== false ||
    authority.postToolModelStepRequired !== true
  ) {
    issues.push("authority is invalid");
  }
  return issues;
}

export async function validateTheoryExperimentExecutionClosureIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateTheoryExperimentExecutionClosureV1(value);
  if (!isRecord(value)) return issues;
  const {
    closureSha256,
    artifactId: _artifactId,
    schemaVersion: _schemaVersion,
    ...unsigned
  } = value;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN,
    value: unsigned,
  });
  if (closureSha256 !== expected) issues.push("closureSha256 mismatch");
  const expectedPolicySha256 = await computeCasimirSpecValueSha256V1({
    domain: "theory-experiment-execution-closure-ranking-policy/v1",
    value: THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1,
  });
  const ranking = isRecord(value.ranking) ? value.ranking : null;
  if (ranking?.policySha256 !== expectedPolicySha256) {
    issues.push("ranking.policySha256 mismatch");
  }
  return issues;
}

export function isTheoryExperimentExecutionClosureV1(
  value: unknown,
): value is TheoryExperimentExecutionClosureV1 {
  return validateTheoryExperimentExecutionClosureV1(value).length === 0;
}
