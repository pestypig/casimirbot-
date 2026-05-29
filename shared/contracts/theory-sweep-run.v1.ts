export const THEORY_SWEEP_RUN_ARTIFACT_ID = "theory_sweep_run" as const;
export const THEORY_SWEEP_RUN_SCHEMA_VERSION = "theory_sweep_run/v1" as const;

export const THEORY_SWEEP_SAMPLE_POLICY_KIND_VALUES = [
  "grid",
  "monte_carlo",
  "latin_hypercube",
  "interval_bounds",
] as const;

export const THEORY_SWEEP_DISTRIBUTION_KIND_VALUES = [
  "fixed",
  "uniform",
  "normal",
  "log_uniform",
  "samples",
] as const;

export const THEORY_SWEEP_SAMPLE_STATUS_VALUES = ["ok", "failed", "skipped"] as const;

export const THEORY_SWEEP_RATE_PROJECTION_KIND_VALUES = [
  "energy_to_frequency",
  "mass_to_compton_frequency",
  "energy_per_period",
  "parameter_derivative",
] as const;

export type TheorySweepSamplePolicyKind = (typeof THEORY_SWEEP_SAMPLE_POLICY_KIND_VALUES)[number];
export type TheorySweepDistributionKind = (typeof THEORY_SWEEP_DISTRIBUTION_KIND_VALUES)[number];
export type TheorySweepSampleStatus = (typeof THEORY_SWEEP_SAMPLE_STATUS_VALUES)[number];
export type TheorySweepRateProjectionKind = (typeof THEORY_SWEEP_RATE_PROJECTION_KIND_VALUES)[number];

export type TheorySweepDistributionV1 =
  | { kind: "fixed"; value: number }
  | { kind: "uniform"; min: number; max: number }
  | { kind: "normal"; mean: number; stddev: number }
  | { kind: "log_uniform"; min: number; max: number }
  | { kind: "samples"; values: number[] };

export type TheorySweepVariableV1 = {
  symbol: string;
  unit: string | null;
  dimensionSignature?: string | null;
  distribution: TheorySweepDistributionV1;
};

export type TheorySweepAggregateV1 = {
  resultSymbol: string;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  stddev: number | null;
  p05: number | null;
  p95: number | null;
  failedCount: number;
  okCount: number;
};

export type TheorySweepSampleV1 = {
  index: number;
  inputs: Record<string, number>;
  scalarResults: Record<string, number | null>;
  status: TheorySweepSampleStatus;
  warnings: string[];
};

export type TheorySweepRateProjectionV1 = {
  kind: TheorySweepRateProjectionKind;
  inputSymbol: string;
  outputSymbol: string;
  unit: string | null;
  aggregate: TheorySweepAggregateV1;
};

export type TheorySweepRunV1 = {
  artifactId: typeof THEORY_SWEEP_RUN_ARTIFACT_ID;
  schemaVersion: typeof THEORY_SWEEP_RUN_SCHEMA_VERSION;
  generatedAt: string;
  sweepId: string;
  graphId: string;
  targetBadgeIds: string[];
  sourceRunId?: string | null;
  samplePolicy: {
    kind: TheorySweepSamplePolicyKind;
    sampleCount: number;
    seed?: string | null;
  };
  variables: TheorySweepVariableV1[];
  samples: TheorySweepSampleV1[];
  aggregate: TheorySweepAggregateV1;
  rateProjections: TheorySweepRateProjectionV1[];
  quality: {
    confidence: number;
    uncertaintyModel: string;
    fallbackReason: string | null;
  };
  claimBoundary: {
    diagnosticOnly: boolean;
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
    notes: string[];
  };
};

type BuildTheorySweepRunV1Input = Omit<
  TheorySweepRunV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & {
  generatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const recordValuesAre = (
  value: unknown,
  predicate: (entry: unknown) => boolean,
): value is Record<string, unknown> =>
  isRecord(value) && Object.values(value).every(predicate);

function validateDistribution(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!includes(THEORY_SWEEP_DISTRIBUTION_KIND_VALUES, value.kind)) {
    issues.push(`${prefix}.kind is invalid`);
    return;
  }
  if (value.kind === "fixed" && !isFiniteNumber(value.value)) issues.push(`${prefix}.value must be finite`);
  if ((value.kind === "uniform" || value.kind === "log_uniform") && (!isFiniteNumber(value.min) || !isFiniteNumber(value.max))) {
    issues.push(`${prefix}.min/max must be finite`);
  }
  if (value.kind === "normal" && (!isFiniteNumber(value.mean) || !isFiniteNumber(value.stddev))) {
    issues.push(`${prefix}.mean/stddev must be finite`);
  }
  if (value.kind === "samples" && (!Array.isArray(value.values) || !value.values.every(isFiniteNumber))) {
    issues.push(`${prefix}.values must be finite numbers`);
  }
}

function validateAggregate(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.resultSymbol)) issues.push(`${prefix}.resultSymbol must be non-empty`);
  for (const field of ["mean", "median", "min", "max", "stddev", "p05", "p95"] as const) {
    if (!isNullableFiniteNumber(value[field])) issues.push(`${prefix}.${field} must be finite or null`);
  }
  if (!Number.isInteger(value.failedCount) || Number(value.failedCount) < 0) {
    issues.push(`${prefix}.failedCount must be a non-negative integer`);
  }
  if (!Number.isInteger(value.okCount) || Number(value.okCount) < 0) {
    issues.push(`${prefix}.okCount must be a non-negative integer`);
  }
}

export function buildTheorySweepRunV1(input: BuildTheorySweepRunV1Input): TheorySweepRunV1 {
  return {
    artifactId: THEORY_SWEEP_RUN_ARTIFACT_ID,
    schemaVersion: THEORY_SWEEP_RUN_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sweepId: input.sweepId,
    graphId: input.graphId,
    targetBadgeIds: input.targetBadgeIds,
    sourceRunId: input.sourceRunId ?? null,
    samplePolicy: input.samplePolicy,
    variables: input.variables,
    samples: input.samples,
    aggregate: input.aggregate,
    rateProjections: input.rateProjections,
    quality: input.quality,
    claimBoundary: input.claimBoundary,
  };
}

export function validateTheorySweepRunV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["sweep run must be an object"];

  if (value.artifactId !== THEORY_SWEEP_RUN_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_SWEEP_RUN_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_SWEEP_RUN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_SWEEP_RUN_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "sweepId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.targetBadgeIds)) issues.push("targetBadgeIds must be an array of strings");
  if (value.sourceRunId !== undefined && !isNullableString(value.sourceRunId)) {
    issues.push("sourceRunId must be string or null");
  }

  if (!isRecord(value.samplePolicy)) {
    issues.push("samplePolicy must be an object");
  } else {
    if (!includes(THEORY_SWEEP_SAMPLE_POLICY_KIND_VALUES, value.samplePolicy.kind)) {
      issues.push("samplePolicy.kind is invalid");
    }
    if (!Number.isInteger(value.samplePolicy.sampleCount) || Number(value.samplePolicy.sampleCount) < 0) {
      issues.push("samplePolicy.sampleCount must be a non-negative integer");
    }
    if (value.samplePolicy.seed !== undefined && !isNullableString(value.samplePolicy.seed)) {
      issues.push("samplePolicy.seed must be string or null");
    }
  }

  if (!Array.isArray(value.variables)) {
    issues.push("variables must be an array");
  } else {
    for (const [index, variable] of value.variables.entries()) {
      const prefix = `variables[${index}]`;
      if (!isRecord(variable)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(variable.symbol)) issues.push(`${prefix}.symbol must be non-empty`);
      if (!isNullableString(variable.unit)) issues.push(`${prefix}.unit must be string or null`);
      if (variable.dimensionSignature !== undefined && !isNullableString(variable.dimensionSignature)) {
        issues.push(`${prefix}.dimensionSignature must be string or null`);
      }
      validateDistribution(`${prefix}.distribution`, variable.distribution, issues);
    }
  }

  if (!Array.isArray(value.samples)) {
    issues.push("samples must be an array");
  } else {
    let okSampleCount = 0;
    let failedSampleCount = 0;
    for (const [index, sample] of value.samples.entries()) {
      const prefix = `samples[${index}]`;
      if (!isRecord(sample)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (sample.index !== index + 1) issues.push(`${prefix}.index must be ${index + 1}`);
      if (!recordValuesAre(sample.inputs, isFiniteNumber)) {
        issues.push(`${prefix}.inputs must contain finite numbers`);
      }
      if (!recordValuesAre(sample.scalarResults, isNullableFiniteNumber)) {
        issues.push(`${prefix}.scalarResults must contain finite numbers or null`);
      }
      if (!includes(THEORY_SWEEP_SAMPLE_STATUS_VALUES, sample.status)) {
        issues.push(`${prefix}.status is invalid`);
      } else if (sample.status === "ok") {
        okSampleCount += 1;
      } else if (sample.status === "failed") {
        failedSampleCount += 1;
      }
      if (!isStringArray(sample.warnings)) issues.push(`${prefix}.warnings must be an array of strings`);
    }
    if (isRecord(value.samplePolicy) && value.samplePolicy.sampleCount !== value.samples.length) {
      issues.push("samplePolicy.sampleCount must match samples.length");
    }
    if (isRecord(value.aggregate)) {
      if (value.aggregate.okCount !== okSampleCount) issues.push(`aggregate.okCount must be ${okSampleCount}`);
      if (value.aggregate.failedCount !== failedSampleCount) {
        issues.push(`aggregate.failedCount must be ${failedSampleCount}`);
      }
    }
  }

  validateAggregate("aggregate", value.aggregate, issues);
  if (!Array.isArray(value.rateProjections)) {
    issues.push("rateProjections must be an array");
  } else {
    for (const [index, projection] of value.rateProjections.entries()) {
      const prefix = `rateProjections[${index}]`;
      if (!isRecord(projection)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!includes(THEORY_SWEEP_RATE_PROJECTION_KIND_VALUES, projection.kind)) issues.push(`${prefix}.kind is invalid`);
      for (const field of ["inputSymbol", "outputSymbol"] as const) {
        if (!isNonEmptyString(projection[field])) issues.push(`${prefix}.${field} must be non-empty`);
      }
      if (!isNullableString(projection.unit)) issues.push(`${prefix}.unit must be string or null`);
      validateAggregate(`${prefix}.aggregate`, projection.aggregate, issues);
      if (
        isRecord(projection.aggregate) &&
        Array.isArray(value.samples) &&
        Number(projection.aggregate.okCount) + Number(projection.aggregate.failedCount) > value.samples.length
      ) {
        issues.push(`${prefix}.aggregate okCount + failedCount cannot exceed samples.length`);
      }
    }
  }

  if (!isRecord(value.quality)) {
    issues.push("quality must be an object");
  } else {
    if (!isFiniteNumber(value.quality.confidence) || value.quality.confidence < 0 || value.quality.confidence > 1) {
      issues.push("quality.confidence must be in [0, 1]");
    }
    if (!isNonEmptyString(value.quality.uncertaintyModel)) {
      issues.push("quality.uncertaintyModel must be non-empty");
    }
    if (!isNullableString(value.quality.fallbackReason)) issues.push("quality.fallbackReason must be string or null");
  }

  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    if (typeof value.claimBoundary.diagnosticOnly !== "boolean") {
      issues.push("claimBoundary.diagnosticOnly must be boolean");
    }
    if (value.claimBoundary.validationClaimAllowed !== false) {
      issues.push("claimBoundary.validationClaimAllowed must be false");
    }
    if (value.claimBoundary.physicalMechanismClaimAllowed !== false) {
      issues.push("claimBoundary.physicalMechanismClaimAllowed must be false");
    }
    if (value.claimBoundary.promotionAllowed !== false) {
      issues.push("claimBoundary.promotionAllowed must be false");
    }
    if (!isStringArray(value.claimBoundary.notes)) issues.push("claimBoundary.notes must be an array of strings");
  }

  return issues;
}

export function isTheorySweepRunV1(value: unknown): value is TheorySweepRunV1 {
  return validateTheorySweepRunV1(value).length === 0;
}
