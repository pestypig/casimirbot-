export const MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID = "moral_graph_coverage_audit" as const;
export const MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION = "moral_graph_coverage_audit/v1" as const;

export const MORAL_GRAPH_COVERAGE_STATUSES = [
  "mapped",
  "partial",
  "conceptual_only",
  "unmapped",
] as const;

export type MoralGraphCoverageStatusV1 = (typeof MORAL_GRAPH_COVERAGE_STATUSES)[number];

export const MORAL_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES = [
  "add_badge",
  "add_constraint",
  "add_action_gate",
  "add_reference",
  "no_change",
] as const;

export type MoralGraphCoverageRecommendedPatchTypeV1 =
  (typeof MORAL_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES)[number];

export type MoralGraphCoverageAuditNodeV1 = {
  ideologyNodeId: string;
  ideologyNodeLabel: string;
  coverageStatus: MoralGraphCoverageStatusV1;
  mappedBadgeIds: string[];
  mappedPrincipleIds: string[];
  mappedActionIds: string[];
  missingProceduralPieces: string[];
  notes: string[];
  recommendedPatchType: MoralGraphCoverageRecommendedPatchTypeV1;
};

export type MoralGraphCoverageAuditSummaryV1 = Record<MoralGraphCoverageStatusV1, number> & {
  total: number;
};

export type MoralGraphCoverageAuditV1 = {
  artifactId: typeof MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION;
  graphId: string;
  source: string;
  rootId: string;
  summary: MoralGraphCoverageAuditSummaryV1;
  nodes: MoralGraphCoverageAuditNodeV1[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isCoverageStatus(value: unknown): value is MoralGraphCoverageStatusV1 {
  return typeof value === "string" && MORAL_GRAPH_COVERAGE_STATUSES.includes(value as MoralGraphCoverageStatusV1);
}

function isRecommendedPatchType(value: unknown): value is MoralGraphCoverageRecommendedPatchTypeV1 {
  return (
    typeof value === "string" &&
    MORAL_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES.includes(value as MoralGraphCoverageRecommendedPatchTypeV1)
  );
}

export function validateMoralGraphCoverageAuditV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["moral graph coverage audit must be an object"];

  if (value.artifactId !== MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION}`);
  }
  for (const field of ["graphId", "source", "rootId"] as const) {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
      issues.push(`${field} must be a non-empty string`);
    }
  }

  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    for (const status of MORAL_GRAPH_COVERAGE_STATUSES) {
      if (typeof value.summary[status] !== "number") issues.push(`summary.${status} must be a number`);
    }
    if (typeof value.summary.total !== "number") issues.push("summary.total must be a number");
  }

  if (!Array.isArray(value.nodes)) {
    issues.push("nodes must be an array");
    return issues;
  }

  value.nodes.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`nodes[${index}] must be an object`);
      return;
    }
    for (const field of ["ideologyNodeId", "ideologyNodeLabel"] as const) {
      if (typeof entry[field] !== "string" || entry[field].trim().length === 0) {
        issues.push(`nodes[${index}].${field} must be a non-empty string`);
      }
    }
    if (!isCoverageStatus(entry.coverageStatus)) {
      issues.push(`nodes[${index}].coverageStatus is invalid`);
    }
    for (const field of ["mappedBadgeIds", "mappedPrincipleIds", "mappedActionIds", "missingProceduralPieces", "notes"] as const) {
      if (!isStringArray(entry[field])) issues.push(`nodes[${index}].${field} must be a string array`);
    }
    if (!isRecommendedPatchType(entry.recommendedPatchType)) {
      issues.push(`nodes[${index}].recommendedPatchType is invalid`);
    }
  });

  return issues;
}

export function isMoralGraphCoverageAuditV1(value: unknown): value is MoralGraphCoverageAuditV1 {
  return validateMoralGraphCoverageAuditV1(value).length === 0;
}
