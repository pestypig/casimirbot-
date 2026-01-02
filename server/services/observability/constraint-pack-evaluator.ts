import type {
  ConstraintPack,
  ConstraintPackConstraint,
  ConstraintPackConstraintResult,
  ConstraintPackEvaluation,
  ConstraintPackCertificateResult,
  TrainingTraceDelta,
  type PolicyLadderTier,
} from "../../../shared/schema.js";

type MetricValue = number | boolean | string | null | undefined;
export type ConstraintPackMetricMap = Record<string, MetricValue>;

export type RepoConvergenceTelemetry = {
  build?: {
    status?: MetricValue;
    ok?: MetricValue;
    exitCode?: number;
    durationMs?: number;
  };
  tests?: {
    status?: MetricValue;
    ok?: MetricValue;
    failed?: number;
    passed?: number;
    total?: number;
  };
  schema?: {
    contracts?: MetricValue;
    ok?: MetricValue;
  };
  deps?: {
    coherence?: MetricValue;
  };
  timeToGreenMs?: number;
  lint?: {
    status?: MetricValue;
  };
  typecheck?: {
    status?: MetricValue;
  };
  metrics?: ConstraintPackMetricMap;
};

export type ToolUseBudgetTelemetry = {
  steps?: {
    used?: number;
    total?: number;
  };
  cost?: {
    usd?: number;
  };
  ops?: {
    forbidden?: number;
    approvalMissing?: number;
  };
  provenance?: {
    missing?: number;
  };
  runtime?: {
    ms?: number;
  };
  tools?: {
    calls?: number;
    total?: number;
  };
  metrics?: ConstraintPackMetricMap;
};

type ConstraintPackEvaluationInput = {
  certificate?: ConstraintPackCertificateResult;
  deltas?: TrainingTraceDelta[];
  notes?: string[];
  proxy?: boolean;
  ladderTier?: PolicyLadderTier;
};

const TRUTHY_VALUES = new Set([
  "1",
  "true",
  "yes",
  "ok",
  "pass",
  "passed",
  "green",
  "success",
]);
const FALSY_VALUES = new Set([
  "0",
  "false",
  "no",
  "fail",
  "failed",
  "red",
  "error",
]);

const LADDER_ORDER: PolicyLadderTier[] = [
  "reduced-order",
  "diagnostic",
  "certified",
];

const isTierAtLeast = (
  tier: PolicyLadderTier,
  minimum: PolicyLadderTier,
): boolean => {
  const tierIndex = LADDER_ORDER.indexOf(tier);
  const minimumIndex = LADDER_ORDER.indexOf(minimum);
  if (tierIndex === -1 || minimumIndex === -1) return false;
  return tierIndex >= minimumIndex;
};

const resolveLadderTier = (input: {
  requested?: PolicyLadderTier;
  certified: boolean;
  proxy: boolean;
}): PolicyLadderTier => {
  const actual: PolicyLadderTier = input.certified
    ? "certified"
    : input.proxy
      ? "reduced-order"
      : "diagnostic";
  if (!input.requested) return actual;
  const requestedIndex = LADDER_ORDER.indexOf(input.requested);
  const actualIndex = LADDER_ORDER.indexOf(actual);
  if (requestedIndex === -1 || actualIndex === -1) return actual;
  return requestedIndex <= actualIndex ? input.requested : actual;
};

const coerceMetricValue = (
  raw: MetricValue,
): { value: number | null; issue?: "missing" | "unparseable" | "not-finite" } => {
  if (raw === null || raw === undefined) {
    return { value: null, issue: "missing" };
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw)
      ? { value: raw }
      : { value: null, issue: "not-finite" };
  }
  if (typeof raw === "boolean") {
    return { value: raw ? 1 : 0 };
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { value: null, issue: "missing" };
    }
    const lowered = trimmed.toLowerCase();
    if (TRUTHY_VALUES.has(lowered)) {
      return { value: 1 };
    }
    if (FALSY_VALUES.has(lowered)) {
      return { value: 0 };
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed)
      ? { value: parsed }
      : { value: null, issue: "unparseable" };
  }
  return { value: null, issue: "unparseable" };
};

const pickFirstDefined = <T>(...values: Array<T | undefined>): T | undefined =>
  values.find((value) => value !== undefined);

const mergeMetrics = (
  target: ConstraintPackMetricMap,
  source?: ConstraintPackMetricMap,
): void => {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      target[key] = value;
    }
  }
};

const resolveStatusFromExitCode = (
  exitCode?: number,
): number | undefined => {
  if (!Number.isFinite(exitCode)) return undefined;
  return exitCode === 0 ? 1 : 0;
};

const resolveTestStatus = (
  tests?: RepoConvergenceTelemetry["tests"],
): MetricValue => {
  if (!tests) return undefined;
  if (tests.failed !== undefined && Number.isFinite(tests.failed)) {
    return tests.failed > 0 ? 0 : 1;
  }
  if (
    tests.total !== undefined &&
    Number.isFinite(tests.total) &&
    tests.passed !== undefined &&
    Number.isFinite(tests.passed)
  ) {
    return tests.passed >= tests.total ? 1 : 0;
  }
  return undefined;
};

export const buildRepoConvergenceMetrics = (
  telemetry?: RepoConvergenceTelemetry,
): ConstraintPackMetricMap => {
  const metrics: ConstraintPackMetricMap = {};
  if (!telemetry) return metrics;

  const buildStatus = pickFirstDefined(
    telemetry.build?.status,
    telemetry.build?.ok,
    resolveStatusFromExitCode(telemetry.build?.exitCode),
  );
  const testStatus = pickFirstDefined(
    telemetry.tests?.status,
    telemetry.tests?.ok,
    resolveTestStatus(telemetry.tests),
  );
  const schemaStatus = pickFirstDefined(
    telemetry.schema?.contracts,
    telemetry.schema?.ok,
  );

  const lintStatus = telemetry.lint?.status;
  const typecheckStatus = telemetry.typecheck?.status;

  if (buildStatus !== undefined) {
    metrics["build.status"] = buildStatus;
  }
  if (testStatus !== undefined) {
    metrics["tests.status"] = testStatus;
  }
  if (schemaStatus !== undefined) {
    metrics["schema.contracts"] = schemaStatus;
  }
  if (telemetry.deps?.coherence !== undefined) {
    metrics["deps.coherence"] = telemetry.deps?.coherence;
  }
  if (telemetry.timeToGreenMs !== undefined) {
    metrics["time_to_green_ms"] = telemetry.timeToGreenMs;
  }
  if (lintStatus !== undefined) {
    metrics["lint.status"] = lintStatus;
  }
  if (typecheckStatus !== undefined) {
    metrics["typecheck.status"] = typecheckStatus;
  }

  mergeMetrics(metrics, telemetry.metrics);
  return metrics;
};

export const buildToolUseBudgetMetrics = (
  telemetry?: ToolUseBudgetTelemetry,
): ConstraintPackMetricMap => {
  const metrics: ConstraintPackMetricMap = {};
  if (!telemetry) return metrics;

  const stepUsage = pickFirstDefined(
    telemetry.steps?.used,
    telemetry.steps?.total,
  );
  if (stepUsage !== undefined) {
    metrics["steps.used"] = stepUsage;
  }
  if (telemetry.cost?.usd !== undefined) {
    metrics["cost.usd"] = telemetry.cost.usd;
  }
  if (telemetry.ops?.forbidden !== undefined) {
    metrics["ops.forbidden.count"] = telemetry.ops.forbidden;
  }
  if (telemetry.ops?.approvalMissing !== undefined) {
    metrics["ops.approval_missing.count"] = telemetry.ops.approvalMissing;
  }
  if (telemetry.provenance?.missing !== undefined) {
    metrics["provenance.missing.count"] = telemetry.provenance.missing;
  }
  if (telemetry.runtime?.ms !== undefined) {
    metrics["runtime.ms"] = telemetry.runtime.ms;
  }
  const toolCalls = pickFirstDefined(telemetry.tools?.calls, telemetry.tools?.total);
  if (toolCalls !== undefined) {
    metrics["tools.calls"] = toolCalls;
  }

  mergeMetrics(metrics, telemetry.metrics);
  return metrics;
};

const formatLimitLabel = (
  constraint: ConstraintPackConstraint,
  threshold?: number,
): string | null => {
  if (threshold === undefined || !Number.isFinite(threshold)) {
    if (
      constraint.min !== undefined &&
      constraint.max !== undefined &&
      Number.isFinite(constraint.min) &&
      Number.isFinite(constraint.max)
    ) {
      return `[${constraint.min}, ${constraint.max}]`;
    }
    return null;
  }
  const op = constraint.op?.trim();
  if (!op || op === "eq") return String(threshold);
  return `${op} ${threshold}`;
};

const resolveConstraintThreshold = (
  constraint: ConstraintPackConstraint,
): { op: string; threshold?: number; min?: number; max?: number } => {
  const op = (constraint.op ?? "").trim();
  if (op === "eq") {
    return {
      op,
      threshold: pickFirstDefined(constraint.limit, constraint.min, constraint.max),
    };
  }
  if (op === "<=" || op === "<") {
    return { op, threshold: pickFirstDefined(constraint.max, constraint.limit) };
  }
  if (op === ">=" || op === ">") {
    return { op, threshold: pickFirstDefined(constraint.min, constraint.limit) };
  }
  if (
    constraint.min !== undefined &&
    constraint.max !== undefined &&
    Number.isFinite(constraint.min) &&
    Number.isFinite(constraint.max)
  ) {
    return { op: "band", min: constraint.min, max: constraint.max };
  }
  if (constraint.min !== undefined && Number.isFinite(constraint.min)) {
    return { op: ">=", threshold: constraint.min };
  }
  if (constraint.max !== undefined && Number.isFinite(constraint.max)) {
    return { op: "<=", threshold: constraint.max };
  }
  return { op };
};

const evaluateConstraint = (
  constraint: ConstraintPackConstraint,
  metrics: ConstraintPackMetricMap,
): ConstraintPackConstraintResult => {
  const metricKey = constraint.metric;
  const raw = metricKey ? metrics[metricKey] : undefined;
  const { value, issue } = coerceMetricValue(raw);
  const noteParts: string[] = [];
  let status: ConstraintPackConstraintResult["status"] = "unknown";
  let limit: string | null = null;

  if (!metricKey) {
    noteParts.push("metric_not_configured");
  }
  if (issue) {
    noteParts.push(metricKey ? `${metricKey}_${issue}` : issue);
  }

  if (value !== null) {
    const resolved = resolveConstraintThreshold(constraint);
    const threshold = resolved.threshold;
    limit = formatLimitLabel(constraint, threshold);
    if (resolved.op === "band") {
      if (
        typeof resolved.min === "number" &&
        typeof resolved.max === "number"
      ) {
        status =
          value >= resolved.min && value <= resolved.max ? "pass" : "fail";
      } else {
        noteParts.push("limit_missing");
      }
    } else if (resolved.op === "eq") {
      if (threshold === undefined || !Number.isFinite(threshold)) {
        noteParts.push("limit_missing");
      } else {
        status = value === threshold ? "pass" : "fail";
      }
    } else if (resolved.op === "<=") {
      if (threshold === undefined || !Number.isFinite(threshold)) {
        noteParts.push("limit_missing");
      } else {
        status = value <= threshold ? "pass" : "fail";
      }
    } else if (resolved.op === "<") {
      if (threshold === undefined || !Number.isFinite(threshold)) {
        noteParts.push("limit_missing");
      } else {
        status = value < threshold ? "pass" : "fail";
      }
    } else if (resolved.op === ">=") {
      if (threshold === undefined || !Number.isFinite(threshold)) {
        noteParts.push("limit_missing");
      } else {
        status = value >= threshold ? "pass" : "fail";
      }
    } else if (resolved.op === ">") {
      if (threshold === undefined || !Number.isFinite(threshold)) {
        noteParts.push("limit_missing");
      } else {
        status = value > threshold ? "pass" : "fail";
      }
    } else if (resolved.op) {
      noteParts.push("unsupported_op");
    }
  }

  return {
    id: constraint.id,
    severity: constraint.severity,
    status,
    value,
    limit,
    proxy: constraint.proxy,
    note: noteParts.length ? noteParts.join(",") : undefined,
  };
};

const resolvePass = (
  pack: ConstraintPack,
  constraints: ConstraintPackConstraintResult[],
): boolean => {
  if (!constraints.length) return true;
  const relevant =
    pack.policy.mode === "hard-only"
      ? constraints.filter((entry) => entry.severity === "HARD")
      : constraints;
  if (!relevant.length) return true;
  const hasFail = relevant.some((entry) => entry.status === "fail");
  const hasUnknown = relevant.some((entry) => entry.status === "unknown");
  if (hasFail) return false;
  if (hasUnknown && pack.policy.unknownAsFail) return false;
  return true;
};

const resolveFirstFail = (
  constraints: ConstraintPackConstraintResult[],
): ConstraintPackConstraintResult | undefined => {
  const hardFail = constraints.find(
    (entry) => entry.severity === "HARD" && entry.status === "fail",
  );
  if (hardFail) return hardFail;
  return constraints.find((entry) => entry.status === "fail");
};

const resolveProxyFlag = (
  inputProxy: boolean | undefined,
  constraints: ConstraintPackConstraintResult[],
): boolean | undefined => {
  if (typeof inputProxy === "boolean") {
    return inputProxy;
  }
  const hasRealData = constraints.some(
    (entry) => !entry.proxy && entry.status !== "unknown",
  );
  const hasProxyData = constraints.some(
    (entry) => entry.proxy && entry.status !== "unknown",
  );
  if (!hasRealData && hasProxyData) {
    return true;
  }
  return undefined;
};

export const evaluateConstraintPackFromMetrics = (
  pack: ConstraintPack,
  metrics: ConstraintPackMetricMap,
  input: ConstraintPackEvaluationInput = {},
): ConstraintPackEvaluation => {
  const constraintResults = pack.constraints.map((constraint) =>
    evaluateConstraint(constraint, metrics),
  );
  const proxyResults = (pack.proxies ?? []).map((constraint) =>
    evaluateConstraint(constraint, metrics),
  );
  const allConstraints = [...constraintResults, ...proxyResults];
  let pass = resolvePass(pack, constraintResults);
  const firstFail = resolveFirstFail(constraintResults);
  const proxy = resolveProxyFlag(input.proxy, allConstraints);
  const certificate = input.certificate;
  const certificateHash = certificate?.certificateHash ?? null;
  const hasCertificate =
    typeof certificateHash === "string" && certificateHash.trim().length > 0;
  const certified =
    pass && hasCertificate && certificate?.integrityOk === true && !proxy;
  const ladderTier = resolveLadderTier({
    requested: input.ladderTier,
    certified,
    proxy: Boolean(proxy),
  });
  const ladderNotes: string[] = [];
  if (pack.policy.minLadderTier) {
    if (!isTierAtLeast(ladderTier, pack.policy.minLadderTier)) {
      pass = false;
      ladderNotes.push(`ladder_min_tier=${pack.policy.minLadderTier}`);
      ladderNotes.push(`ladder_actual=${ladderTier}`);
    }
  }
  const mergedNotes = [
    ...(input.notes ?? []),
    ...ladderNotes,
  ].filter((note): note is string => typeof note === "string" && note.length);

  return {
    pass,
    constraints: allConstraints,
    ...(certificate ? { certificate } : {}),
    ...(input.deltas ? { deltas: input.deltas } : {}),
    ...(mergedNotes.length ? { notes: mergedNotes } : {}),
    ...(firstFail ? { firstFail } : {}),
    ...(proxy ? { proxy } : {}),
    ladderTier,
  };
};
