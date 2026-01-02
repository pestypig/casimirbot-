import {
  constraintPackEvaluationSchema,
  constraintPackSchema,
  type ConstraintPack,
  type ConstraintPackConstraintResult,
  type ConstraintPackEvaluation,
  type TrainingTraceConstraint,
  type TrainingTraceDelta,
  type TrainingTraceRecord,
  type TrainingTraceSignal,
  type PolicyLadder,
  type PolicyLadderTier,
  type TrainingTraceSource,
} from "../../../shared/schema.js";
import {
  recordTrainingTrace,
  type TrainingTraceInput,
} from "./training-trace-store.js";

export type NormalizeConstraintPackTraceInput = {
  traceId?: string;
  tenantId?: string;
  pack: ConstraintPack;
  evaluation: ConstraintPackEvaluation;
  source?: TrainingTraceSource;
  deltas?: TrainingTraceDelta[];
  notes?: string[];
  ts?: string;
  id?: string;
};

const normalizeLimit = (limit: string | number | null | undefined): string | null => {
  if (limit === null || limit === undefined) {
    return null;
  }
  if (typeof limit === "string") {
    return limit;
  }
  if (Number.isFinite(limit)) {
    return String(limit);
  }
  return null;
};

const normalizeConstraintResult = (
  entry: ConstraintPackConstraintResult,
): Required<Pick<ConstraintPackConstraintResult, "id" | "severity" | "status">> &
  ConstraintPackConstraintResult => ({
  ...entry,
  severity: entry.severity ?? "SOFT",
  status: entry.status ?? "unknown",
});

const toTrainingTraceConstraint = (
  entry: ConstraintPackConstraintResult,
): TrainingTraceConstraint => {
  const normalized = normalizeConstraintResult(entry);
  return {
    id: normalized.id,
    severity: normalized.severity,
    status: normalized.status,
    value:
      typeof normalized.value === "number" && Number.isFinite(normalized.value)
        ? normalized.value
        : null,
    limit: normalizeLimit(normalized.limit),
    note: normalized.note,
  };
};

const pickFirstFailingHardConstraint = (
  constraints: ConstraintPackConstraintResult[],
): TrainingTraceConstraint | undefined => {
  const normalized = constraints.map(normalizeConstraintResult);
  const hardFail = normalized.find(
    (entry) => entry.severity === "HARD" && entry.status === "fail",
  );
  if (hardFail) return toTrainingTraceConstraint(hardFail);
  const anyFail = normalized.find((entry) => entry.status === "fail");
  return anyFail ? toTrainingTraceConstraint(anyFail) : undefined;
};

const resolveConstraintsPass = (
  pack: ConstraintPack,
  constraints: ConstraintPackConstraintResult[],
): boolean => {
  if (constraints.length === 0) return true;
  const normalized = constraints.map(normalizeConstraintResult);
  const relevant =
    pack.policy.mode === "hard-only"
      ? normalized.filter((entry) => entry.severity === "HARD")
      : normalized;
  if (relevant.length === 0) return true;
  const hasFail = relevant.some((entry) => entry.status === "fail");
  const hasUnknown = relevant.some((entry) => entry.status === "unknown");
  if (hasFail) return false;
  if (hasUnknown && pack.policy.unknownAsFail) return false;
  return true;
};

const resolveCertificatePass = (
  pack: ConstraintPack,
  evaluation: ConstraintPackEvaluation,
): boolean => {
  const certificate = evaluation.certificate;
  const requiresCertificate =
    pack.certificate.treatMissingCertificateAsNotCertified;
  const certificateHash = certificate?.certificateHash ?? null;
  const hasCertificate =
    typeof certificateHash === "string" && certificateHash.trim().length > 0;
  const status = certificate?.status;
  const statusOk =
    status === pack.certificate.admissibleStatus ||
    (pack.certificate.allowMarginalAsViable && status === "MARGINAL");
  const integrityOk = certificate?.integrityOk !== false;
  if (!integrityOk) return false;
  if (!hasCertificate) {
    return !requiresCertificate;
  }
  return statusOk;
};

const LADDER_ORDER: PolicyLadderTier[] = [
  "reduced-order",
  "diagnostic",
  "certified",
];

const resolveLadderTier = (
  evaluation: ConstraintPackEvaluation,
  certified: boolean,
  proxy: boolean,
): PolicyLadderTier => {
  const actual: PolicyLadderTier = certified
    ? "certified"
    : proxy
      ? "reduced-order"
      : "diagnostic";
  const requested = evaluation.ladderTier;
  if (!requested) return actual;
  const requestedIndex = LADDER_ORDER.indexOf(requested);
  const actualIndex = LADDER_ORDER.indexOf(actual);
  if (requestedIndex === -1 || actualIndex === -1) return actual;
  return requestedIndex <= actualIndex ? requested : actual;
};

const resolveSignal = (
  pack: ConstraintPack,
  evaluation: ConstraintPackEvaluation,
  pass: boolean,
  proxy: boolean,
): TrainingTraceSignal => {
  const certificate = evaluation.certificate;
  const hasCertificate =
    typeof certificate?.certificateHash === "string" &&
    certificate.certificateHash.trim().length > 0;
  const certified =
    pass && hasCertificate && certificate?.integrityOk === true && !proxy;      
  const ladderTier = resolveLadderTier(evaluation, certified, proxy);
  const ladder: PolicyLadder = {
    tier: ladderTier,
    policy: pack.id,
    policyVersion: String(pack.version),
  };
  return {
    kind: certified ? pack.signalKinds.certified : pack.signalKinds.diagnostic,
    ladder,
    ...(proxy ? { proxy: true } : {}),
  };
};

export function normalizeConstraintPackTrace(
  input: NormalizeConstraintPackTraceInput,
): TrainingTraceInput {
  const pack = constraintPackSchema.parse(input.pack);
  const evaluation = constraintPackEvaluationSchema.parse(input.evaluation);
  const constraints = evaluation.constraints ?? [];
  const pass =
    evaluation.pass ??
    (resolveConstraintsPass(pack, constraints) &&
      resolveCertificatePass(pack, evaluation));
  const proxy =
    typeof evaluation.proxy === "boolean"
      ? evaluation.proxy
      : constraints.some((entry) => entry.proxy);
  const firstFail = evaluation.firstFail
    ? toTrainingTraceConstraint(evaluation.firstFail)
    : pickFirstFailingHardConstraint(constraints);
  const mergedNotes = [
    ...(evaluation.notes ?? []),
    ...(input.notes ?? []),
  ].filter((note): note is string => typeof note === "string" && note.trim().length > 0);
  const deltas = input.deltas ?? evaluation.deltas ?? [];
  const signal = resolveSignal(pack, evaluation, pass, proxy);
  return {
    traceId: input.traceId,
    tenantId: input.tenantId,
    source: input.source,
    signal,
    pass,
    deltas,
    firstFail,
    certificate: evaluation.certificate,
    notes: mergedNotes.length ? mergedNotes : undefined,
    ts: input.ts,
    id: input.id,
  };
}

export function recordConstraintPackTrace(
  input: NormalizeConstraintPackTraceInput,
): TrainingTraceRecord {
  return recordTrainingTrace(normalizeConstraintPackTrace(input));
}
