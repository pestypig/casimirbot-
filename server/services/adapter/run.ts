import crypto from "node:crypto";
import type { GrAgentLoopAttempt, GrAgentLoopOptions } from "../../gr/gr-agent-loop.js";
import { runGrAgentLoop } from "../../gr/gr-agent-loop.js";
import { getConstraintPackById } from "@shared/constraint-packs";
import type {
  AdapterAction,
  AdapterArtifactRef,
  AdapterRunRequest,
  ConstraintPackOverride,
  GrConstraintEntry,
  TrainingTraceConstraint,
  TrainingTraceDelta,
} from "../../../shared/schema.js";
import {
  buildAuditSafetyMetrics,
  buildRepoConvergenceMetrics,
  buildToolUseBudgetMetrics,
  evaluateConstraintPackFromMetrics,
  type AuditSafetyTelemetry,
  type ConstraintPackMetricMap,
  type RepoConvergenceTelemetry,
  type ToolUseBudgetTelemetry,
} from "../observability/constraint-pack-evaluator.js";
import {
  collectAuditSafetyTelemetry,
  collectRepoConvergenceTelemetry,
  collectToolUseBudgetTelemetry,
  isAutoTelemetryEnabled,
} from "../observability/constraint-pack-telemetry.js";
import { recordConstraintPackTrace } from "../observability/constraint-pack-normalizer.js";
import { recordGrAgentLoopRun } from "../observability/gr-agent-loop-store.js";
import { getConstraintPackPolicyProfileById } from "../constraint-packs/constraint-pack-policy-store.js";
import { applyConstraintPackOverrides } from "../constraint-packs/constraint-pack-policy.js";

export class AdapterExecutionError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

export type AdapterRunResult = {
  traceId?: string;
  runId: string;
  verdict: "PASS" | "FAIL";
  pass: boolean;
  firstFail?: TrainingTraceConstraint | null;
  deltas: TrainingTraceDelta[];
  certificate?: Record<string, unknown> | null;
  artifacts: AdapterArtifactRef[];
};

type ParamChange = {
  key: string;
  from?: unknown;
  to?: unknown;
  delta?: number;
  change: "added" | "removed" | "changed";
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const normalizeCustomerId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const flattenParams = (
  value: unknown,
  prefix = "",
  map: Map<string, unknown> = new Map(),
): Map<string, unknown> => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      const next = prefix ? `${prefix}[${index}]` : `[${index}]`;
      flattenParams(entry, next, map);
    });
    return map;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, entry]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenParams(entry, next, map);
    });
    return map;
  }
  if (prefix) map.set(prefix, value);
  return map;
};

const diffParams = (
  from?: Record<string, unknown>,
  to?: Record<string, unknown>,
): ParamChange[] => {
  const fromMap = flattenParams(from);
  const toMap = flattenParams(to);
  const keys = new Set<string>([...fromMap.keys(), ...toMap.keys()]);
  const changes: ParamChange[] = [];

  keys.forEach((key) => {
    const hasFrom = fromMap.has(key);
    const hasTo = toMap.has(key);
    const fromValue = hasFrom ? fromMap.get(key) : undefined;
    const toValue = hasTo ? toMap.get(key) : undefined;
    if (hasFrom && hasTo && Object.is(fromValue, toValue)) return;

    const change: ParamChange = {
      key,
      from: fromValue,
      to: toValue,
      change: hasFrom && !hasTo ? "removed" : !hasFrom && hasTo ? "added" : "changed",
    };
    if (typeof fromValue === "number" && typeof toValue === "number") {
      change.delta = toValue - fromValue;
    }
    changes.push(change);
  });

  return changes;
};

const toTrainingTraceDeltas = (changes: ParamChange[]): TrainingTraceDelta[] => {
  const deltas: TrainingTraceDelta[] = [];
  for (const change of changes) {
    const from = typeof change.from === "number" ? change.from : null;
    const to = typeof change.to === "number" ? change.to : null;
    const delta = typeof change.delta === "number" ? change.delta : undefined;
    if (from === null && to === null && delta === undefined) continue;
    deltas.push({ key: change.key, from, to, delta, change: change.change });
  }
  return deltas;
};

const toTrainingTraceConstraint = (
  constraint: GrConstraintEntry,
): TrainingTraceConstraint => ({
  id: constraint.id,
  severity: constraint.severity,
  status: constraint.status,
  value: constraint.value ?? null,
  limit: constraint.limit ?? null,
  note: constraint.note,
});

const findFirstFailingHardConstraint = (
  constraints?: GrConstraintEntry[],
): TrainingTraceConstraint | undefined => {
  if (!Array.isArray(constraints) || constraints.length === 0) return undefined;
  const failing = constraints.find(
    (entry) => entry.severity === "HARD" && entry.status !== "pass",
  );
  return failing ? toTrainingTraceConstraint(failing) : undefined;
};

const hasAnyTelemetry = (telemetry?: Record<string, unknown>): boolean =>
  !!telemetry && Object.keys(telemetry).length > 0;

const mergeMetricOverrides = (
  target: ConstraintPackMetricMap,
  overrides?: ConstraintPackMetricMap,
): void => {
  if (!overrides) return;
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) target[key] = value;
  }
};

const hasPolicyOverridePayload = (
  override: ConstraintPackOverride | undefined,
): boolean => {
  if (!override) return false;
  return (
    override.policy !== undefined ||
    override.certificate !== undefined ||
    (override.constraints?.length ?? 0) > 0 ||
    (override.proxies?.length ?? 0) > 0
  );
};

const resolveAutoTelemetry = (input: {
  autoTelemetry?: boolean;
  telemetryPath?: string;
  junitPath?: string;
  vitestPath?: string;
  jestPath?: string;
  eslintPath?: string;
  tscPath?: string;
  toolLogTraceId?: string;
  toolLogWindowMs?: number;
  toolLogLimit?: number;
}): boolean => {
  const hasAutoHint = !!(
    input.telemetryPath ||
    input.junitPath ||
    input.vitestPath ||
    input.jestPath ||
    input.eslintPath ||
    input.tscPath ||
    input.toolLogTraceId ||
    input.toolLogWindowMs ||
    input.toolLogLimit
  );
  if (input.autoTelemetry === true) return true;
  if (input.autoTelemetry === false) return hasAutoHint;
  if (hasAutoHint) return true;
  return isAutoTelemetryEnabled();
};

const resolveTerminalAttempt = (
  attempts: GrAgentLoopAttempt[],
  acceptedIteration?: number,
): GrAgentLoopAttempt | undefined => {
  if (!Array.isArray(attempts) || attempts.length === 0) return undefined;
  if (acceptedIteration !== undefined) {
    const match = attempts.find((attempt) => attempt.iteration === acceptedIteration);
    if (match) return match;
  }
  return attempts[attempts.length - 1];
};

const buildActionProposals = (actions?: AdapterAction[]) => {
  if (!Array.isArray(actions) || actions.length === 0) return undefined;
  return actions.map((action, index) => ({
    label: action.label ?? action.id ?? action.kind ?? `action-${index + 1}`,
    params: action.params ?? {},
  }));
};

const buildArtifactRefs = (input: {
  runId: string;
  certificateHash?: string | null;
  certificateId?: string | null;
}): AdapterArtifactRef[] => {
  const artifacts: AdapterArtifactRef[] = [
    { kind: "gr-agent-loop-run", ref: input.runId },
    { kind: "gr-agent-loop-run-url", ref: `/api/helix/gr-agent-loop/${input.runId}` },
    { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
  ];
  if (input.certificateHash) {
    artifacts.push({ kind: "warp-certificate-hash", ref: input.certificateHash });
  }
  if (input.certificateId) {
    artifacts.push({ kind: "warp-certificate-id", ref: input.certificateId });
  }
  return artifacts;
};

const buildConstraintPackArtifacts = (input: {
  packId: string;
  traceId: string;
  certificateHash?: string | null;
  certificateId?: string | null;
}): AdapterArtifactRef[] => {
  const artifacts: AdapterArtifactRef[] = [
    { kind: "constraint-pack", ref: input.packId },
    { kind: "training-trace-id", ref: input.traceId },
    { kind: "training-trace-url", ref: `/api/agi/training-trace/${input.traceId}` },
    { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
  ];
  if (input.certificateHash) {
    artifacts.push({ kind: "constraint-pack-certificate-hash", ref: input.certificateHash });
  }
  if (input.certificateId) {
    artifacts.push({ kind: "constraint-pack-certificate-id", ref: input.certificateId });
  }
  return artifacts;
};

export async function runAdapterExecution(
  parsed: AdapterRunRequest,
  opts?: { tenantId?: string },
): Promise<AdapterRunResult> {
  const { actions, budget, policy, pack, mode } = parsed;
  const isConstraintPackRun = mode === "constraint-pack" || !!pack;

  if (isConstraintPackRun) {
    if (!pack) {
      throw new AdapterExecutionError(400, "adapter-pack-missing", "Provide pack details for constraint-pack mode.");
    }
    const resolvedPack = getConstraintPackById(pack.id);
    if (!resolvedPack) {
      throw new AdapterExecutionError(404, "constraint-pack-not-found");
    }

    const requestedCustomerId = normalizeCustomerId(pack.customerId);
    if (opts?.tenantId && requestedCustomerId && opts.tenantId !== requestedCustomerId) {
      throw new AdapterExecutionError(403, "tenant-mismatch");
    }

    const policyNotes: string[] = [];
    const overrides: ConstraintPackOverride[] = [];
    let effectiveTenantId = opts?.tenantId ?? requestedCustomerId;

    if (pack.policyProfileId) {
      const profile = getConstraintPackPolicyProfileById(pack.policyProfileId);
      if (!profile) {
        throw new AdapterExecutionError(404, "policy-profile-not-found");
      }
      if (opts?.tenantId && profile.customerId !== opts.tenantId) {
        throw new AdapterExecutionError(403, "tenant-mismatch");
      }
      if (requestedCustomerId && profile.customerId !== requestedCustomerId) {
        throw new AdapterExecutionError(
          400,
          "policy-profile-customer-mismatch",
          "Policy profile does not match the requested customer.",
        );
      }
      if (!effectiveTenantId) {
        effectiveTenantId = profile.customerId;
      }
      const packOverride = profile.packs.find((entry) => entry.packId === resolvedPack.id);
      if (packOverride) {
        overrides.push(packOverride);
        policyNotes.push(`policy_profile=${profile.id}`);
        policyNotes.push(`policy_version=${profile.version}`);
        policyNotes.push(`policy_customer=${profile.customerId}`);
      }
    }

    if (pack.policyOverride) {
      if (pack.policyOverride.packId && pack.policyOverride.packId !== resolvedPack.id) {
        throw new AdapterExecutionError(
          400,
          "policy-override-pack-mismatch",
          "policyOverride.packId must match the pack being evaluated.",
        );
      }
      const normalizedOverride = { ...pack.policyOverride, packId: resolvedPack.id };
      if (hasPolicyOverridePayload(normalizedOverride)) {
        overrides.push(normalizedOverride);
        policyNotes.push("policy_override=inline");
      }
    }

    let effectivePack = resolvedPack;
    if (overrides.length) {
      const resolved = applyConstraintPackOverrides(effectivePack, overrides);
      effectivePack = resolved.pack;
      if (resolved.warnings.length) {
        policyNotes.push(...resolved.warnings.map((warning) => `policy_${warning}`));
      }
    }

    const shouldAutoTelemetry =
      effectivePack.id === "provenance-safety"
        ? pack.autoTelemetry !== false
        : resolveAutoTelemetry({
            autoTelemetry: pack.autoTelemetry,
            telemetryPath: pack.telemetryPath,
            junitPath: pack.junitPath,
            vitestPath: pack.vitestPath,
            jestPath: pack.jestPath,
            eslintPath: pack.eslintPath,
            tscPath: pack.tscPath,
            toolLogTraceId: pack.toolLogTraceId,
            toolLogWindowMs: pack.toolLogWindowMs,
            toolLogLimit: pack.toolLogLimit,
          });

    let telemetry = pack.telemetry;
    const autoTelemetryNotes: string[] = [];
    if (shouldAutoTelemetry) {
      if (effectivePack.id === "repo-convergence") {
        const collected = await collectRepoConvergenceTelemetry({
          autoTelemetry: shouldAutoTelemetry,
          explicit: telemetry as RepoConvergenceTelemetry,
          telemetryPath: pack.telemetryPath,
          junitPath: pack.junitPath,
          vitestPath: pack.vitestPath,
          jestPath: pack.jestPath,
          eslintPath: pack.eslintPath,
          tscPath: pack.tscPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      } else if (effectivePack.id === "tool-use-budget") {
        const collected = await collectToolUseBudgetTelemetry({
          explicit: telemetry as ToolUseBudgetTelemetry,
          telemetryPath: pack.telemetryPath,
          toolLogTraceId: pack.toolLogTraceId,
          toolLogWindowMs: pack.toolLogWindowMs,
          toolLogLimit: pack.toolLogLimit,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      } else if (effectivePack.id === "provenance-safety") {
        const collected = await collectAuditSafetyTelemetry({
          autoTelemetry: shouldAutoTelemetry,
          explicit: telemetry as AuditSafetyTelemetry,
          telemetryPath: pack.telemetryPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      }
    }

    if (!hasAnyTelemetry(telemetry) && !hasAnyTelemetry(pack.metrics)) {
      throw new AdapterExecutionError(
        400,
        "constraint-pack-telemetry-missing",
        "Provide telemetry or metrics to evaluate the pack.",
      );
    }

    const metrics =
      effectivePack.id === "repo-convergence"
        ? buildRepoConvergenceMetrics(telemetry as RepoConvergenceTelemetry)
        : effectivePack.id === "tool-use-budget"
          ? buildToolUseBudgetMetrics(telemetry as ToolUseBudgetTelemetry)
          : buildAuditSafetyMetrics(telemetry as AuditSafetyTelemetry);
    mergeMetricOverrides(metrics, pack.metrics);

    const evaluation = evaluateConstraintPackFromMetrics(effectivePack, metrics, {
      certificate: pack.certificate,
      deltas: pack.deltas,
      notes: [...(pack.notes ?? []), ...policyNotes, ...autoTelemetryNotes],
      proxy: pack.proxy,
      ladderTier: pack.ladderTier,
    });

    const traceId = parsed.traceId ?? `adapter:${crypto.randomUUID()}`;
    const trace = recordConstraintPackTrace({
      traceId,
      tenantId: effectiveTenantId,
      pack: effectivePack,
      evaluation,
      metrics,
      source: {
        system: "constraint-pack",
        component: "adapter",
        tool: effectivePack.id,
        version: String(effectivePack.version),
      },
    });

    return {
      traceId,
      runId: trace.id,
      verdict: trace.pass ? "PASS" : "FAIL",
      pass: trace.pass,
      firstFail: trace.firstFail ?? null,
      deltas: trace.deltas,
      certificate: evaluation.certificate ?? null,
      artifacts: buildConstraintPackArtifacts({
        packId: effectivePack.id,
        traceId: trace.id,
        certificateHash: evaluation.certificate?.certificateHash ?? null,
        certificateId: evaluation.certificate?.certificateId ?? null,
      }),
    };
  }

  const proposals = buildActionProposals(actions);
  const proposalCount = proposals?.length ?? 0;
  const resolvedMaxIterations =
    budget?.maxIterations ?? (proposalCount > 0 ? Math.min(proposalCount, 50) : undefined);

  const options: GrAgentLoopOptions = {
    ...(proposals ? { proposals } : {}),
    ...(resolvedMaxIterations !== undefined ? { maxIterations: resolvedMaxIterations } : {}),
    ...(budget?.maxAttemptMs !== undefined || budget?.maxTotalMs !== undefined
      ? { budget: { maxAttemptMs: budget.maxAttemptMs, maxTotalMs: budget.maxTotalMs } }
      : {}),
    ...(policy?.thresholds ? { thresholds: policy.thresholds } : {}),
    ...(policy?.gate ? { policy: policy.gate } : {}),
  };

  const traceId = parsed.traceId ?? `adapter:${crypto.randomUUID()}`;
  const startedAt = Date.now();
  const result = await runGrAgentLoop(options);
  const durationMs = Math.max(0, Date.now() - startedAt);

  const run = recordGrAgentLoopRun({
    result,
    options,
    durationMs,
    tenantId: opts?.tenantId,
  });

  const terminalAttempt = resolveTerminalAttempt(result.attempts, result.acceptedIteration);
  const firstFail = terminalAttempt
    ? findFirstFailingHardConstraint(terminalAttempt.evaluation.constraints)
    : undefined;

  const baselineParams = result.attempts.length > 0 ? result.attempts[0].proposal.params : undefined;
  const terminalParams = terminalAttempt?.proposal.params;

  return {
    traceId,
    runId: run.id,
    verdict: result.accepted ? "PASS" : "FAIL",
    pass: result.accepted,
    firstFail: firstFail ?? null,
    deltas: toTrainingTraceDeltas(
      diffParams(
        baselineParams as Record<string, unknown> | undefined,
        terminalParams as Record<string, unknown> | undefined,
      ),
    ),
    certificate: terminalAttempt?.evaluation.certificate ?? null,
    artifacts: buildArtifactRefs({
      runId: run.id,
      certificateHash: terminalAttempt?.evaluation.certificate.certificateHash,
      certificateId: terminalAttempt?.evaluation.certificate.certificateId,
    }),
  };
}
