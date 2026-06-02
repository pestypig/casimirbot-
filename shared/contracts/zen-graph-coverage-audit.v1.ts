export const ZEN_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID = "zen_graph_coverage_audit" as const;
export const ZEN_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION = "zen_graph_coverage_audit/v1" as const;

export const ZEN_GRAPH_COVERAGE_STATUSES = [
  "mapped",
  "partial",
  "conceptual_only",
  "unmapped",
] as const;

export type ZenGraphCoverageStatusV1 = (typeof ZEN_GRAPH_COVERAGE_STATUSES)[number];

export const ZEN_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES = [
  "add_badge",
  "add_constraint",
  "add_action_gate",
  "add_reference",
  "no_change",
] as const;

export type ZenGraphCoverageRecommendedPatchTypeV1 =
  (typeof ZEN_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES)[number];

export type ZenGraphCoverageAuditNodeV1 = {
  ideologyNodeId: string;
  ideologyNodeLabel: string;
  coverageStatus: ZenGraphCoverageStatusV1;
  mappedBadgeIds: string[];
  mappedPrincipleIds: string[];
  mappedActionIds: string[];
  missingProceduralPieces: string[];
  notes: string[];
  recommendedPatchType: ZenGraphCoverageRecommendedPatchTypeV1;
};

export type ZenGraphCoverageAuditSummaryV1 = Record<ZenGraphCoverageStatusV1, number> & {
  total: number;
};

export type ZenGraphCoverageAuditV1 = {
  artifactId: typeof ZEN_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof ZEN_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION;
  graphId: string;
  source: string;
  rootId: string;
  summary: ZenGraphCoverageAuditSummaryV1;
  nodes: ZenGraphCoverageAuditNodeV1[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isCoverageStatus(value: unknown): value is ZenGraphCoverageStatusV1 {
  return typeof value === "string" && ZEN_GRAPH_COVERAGE_STATUSES.includes(value as ZenGraphCoverageStatusV1);
}

function isRecommendedPatchType(value: unknown): value is ZenGraphCoverageRecommendedPatchTypeV1 {
  return (
    typeof value === "string" &&
    ZEN_GRAPH_COVERAGE_RECOMMENDED_PATCH_TYPES.includes(value as ZenGraphCoverageRecommendedPatchTypeV1)
  );
}

export function validateZenGraphCoverageAuditV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["zen graph coverage audit must be an object"];

  if (value.artifactId !== ZEN_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${ZEN_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== ZEN_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${ZEN_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION}`);
  }
  for (const field of ["graphId", "source", "rootId"] as const) {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
      issues.push(`${field} must be a non-empty string`);
    }
  }

  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    for (const status of ZEN_GRAPH_COVERAGE_STATUSES) {
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

export function isZenGraphCoverageAuditV1(value: unknown): value is ZenGraphCoverageAuditV1 {
  return validateZenGraphCoverageAuditV1(value).length === 0;
}
