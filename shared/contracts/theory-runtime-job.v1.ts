import {
  isTheoryRuntimeRunRequestV1,
  type TheoryRuntimeRunRequestV1,
} from "./theory-runtime-run-request.v1";

export const THEORY_RUNTIME_JOB_SCHEMA = "theory_runtime_job/v1" as const;

export type TheoryRuntimeJobSnapshotV1 = {
  schema: typeof THEORY_RUNTIME_JOB_SCHEMA;
  jobId: string;
  request: TheoryRuntimeRunRequestV1;
  result: {
    available: boolean;
    receiptId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

export function buildTheoryRuntimeJobSnapshotV1(input: Omit<TheoryRuntimeJobSnapshotV1, "schema">): TheoryRuntimeJobSnapshotV1 {
  return { schema: THEORY_RUNTIME_JOB_SCHEMA, ...input };
}

export function validateTheoryRuntimeJobSnapshotV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime job must be an object"];
  if (value.schema !== THEORY_RUNTIME_JOB_SCHEMA) issues.push(`schema must be ${THEORY_RUNTIME_JOB_SCHEMA}`);
  if (typeof value.jobId !== "string" || !value.jobId.trim()) issues.push("jobId must be a non-empty string");
  if (!isTheoryRuntimeRunRequestV1(value.request)) issues.push("request must be a valid theory runtime run request");
  if (!isRecord(value.result)) {
    issues.push("result must be an object");
  } else {
    if (typeof value.result.available !== "boolean") issues.push("result.available must be boolean");
    if (!isNullableString(value.result.receiptId)) issues.push("result.receiptId must be a string or null");
    if (!isNullableString(value.result.errorCode)) issues.push("result.errorCode must be a string or null");
    if (!isNullableString(value.result.errorMessage)) issues.push("result.errorMessage must be a string or null");
  }
  return issues;
}

export function isTheoryRuntimeJobSnapshotV1(value: unknown): value is TheoryRuntimeJobSnapshotV1 {
  return validateTheoryRuntimeJobSnapshotV1(value).length === 0;
}
