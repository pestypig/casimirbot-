import crypto from "node:crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import type {
  GrAgentLoopOptions,
  GrAgentLoopAttempt,
} from "../gr/gr-agent-loop.js";
import { runGrAgentLoop } from "../gr/gr-agent-loop.js";
import { recordGrAgentLoopRun } from "../services/observability/gr-agent-loop-store.js";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import { getConstraintPackById } from "@shared/constraint-packs";
import {
  adapterRunRequestSchema,
  type AdapterAction,
  type AdapterArtifactRef,
  type ConstraintPackOverride,
  type TrainingTraceConstraint,
  type TrainingTraceDelta,
  type GrConstraintEntry,
} from "../../shared/schema.js";
import {
  buildRepoConvergenceMetrics,
  buildToolUseBudgetMetrics,
  evaluateConstraintPackFromMetrics,
  type ConstraintPackMetricMap,
  type RepoConvergenceTelemetry,
  type ToolUseBudgetTelemetry,
} from "../services/observability/constraint-pack-evaluator.js";
import {
  collectRepoConvergenceTelemetry,
  collectToolUseBudgetTelemetry,
  isAutoTelemetryEnabled,
} from "../services/observability/constraint-pack-telemetry.js";
import { recordConstraintPackTrace } from "../services/observability/constraint-pack-normalizer.js";
import {
  getConstraintPackPolicyProfileById,
} from "../services/constraint-packs/constraint-pack-policy-store.js";
import { applyConstraintPackOverrides } from "../services/constraint-packs/constraint-pack-policy.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
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
  if (prefix) {
    map.set(prefix, value);
  }
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
    if (hasFrom && hasTo && Object.is(fromValue, toValue)) {
      return;
    }
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
    if (from === null && to === null && delta === undefined) {
      continue;
    }
    deltas.push({
      key: change.key,
      from,
      to,
      delta,
      change: change.change,
    });
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
  if (!Array.isArray(constraints) || constraints.length === 0) {
    return undefined;
  }
  const failing = constraints.find(
    (entry) => entry.severity === "HARD" && entry.status !== "pass",
  );
  return failing ? toTrainingTraceConstraint(failing) : undefined;
};

const hasAnyTelemetry = (telemetry?: Record<string, unknown>): boolean => {
  if (!telemetry) return false;
  return Object.keys(telemetry).length > 0;
};

const mergeMetricOverrides = (
  target: ConstraintPackMetricMap,
  overrides?: ConstraintPackMetricMap,
) => {
  if (!overrides) return;
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      target[key] = value;
    }
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
}): boolean => {
  if (input.autoTelemetry === true) return true;
  if (input.autoTelemetry === false) {
    return !!(input.telemetryPath || input.junitPath);
  }
  if (input.telemetryPath || input.junitPath) return true;
  return isAutoTelemetryEnabled();
};

const resolveTerminalAttempt = (
  attempts: GrAgentLoopAttempt[],
  acceptedIteration?: number,
): GrAgentLoopAttempt | undefined => {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return undefined;
  }
  if (acceptedIteration !== undefined) {
    const match = attempts.find((attempt) => attempt.iteration === acceptedIteration);
    if (match) return match;
  }
  return attempts[attempts.length - 1];
};

const buildActionProposals = (actions?: AdapterAction[]) => {
  if (!Array.isArray(actions) || actions.length === 0) {
    return undefined;
  }
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
    artifacts.push({
      kind: "constraint-pack-certificate-hash",
      ref: input.certificateHash,
    });
  }
  if (input.certificateId) {
    artifacts.push({
      kind: "constraint-pack-certificate-id",
      ref: input.certificateId,
    });
  }
  return artifacts;
};

const adapterRouter = Router();

adapterRouter.options("/run", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

adapterRouter.post("/run", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const tenantGuard = guardTenant(req, { require: shouldRequireTenant() });
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const parsed = adapterRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-adapter-run",
      details: parsed.error.flatten(),
    });
  }

  const { actions, budget, policy, pack, mode } = parsed.data;
  const isConstraintPackRun = mode === "constraint-pack" || !!pack;
  if (isConstraintPackRun) {
    if (!pack) {
      return res.status(400).json({
        error: "adapter-pack-missing",
        message: "Provide pack details for constraint-pack mode.",
      });
    }
    const resolvedPack = getConstraintPackById(pack.id);
    if (!resolvedPack) {
      return res.status(404).json({ error: "constraint-pack-not-found" });
    }
    const requestedCustomerId = normalizeCustomerId(pack.customerId);
    if (
      tenantGuard.tenantId &&
      requestedCustomerId &&
      tenantGuard.tenantId !== requestedCustomerId
    ) {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    const policyNotes: string[] = [];
    const overrides: ConstraintPackOverride[] = [];
    let effectiveTenantId = tenantGuard.tenantId ?? requestedCustomerId;
    if (pack.policyProfileId) {
      const profile = getConstraintPackPolicyProfileById(
        pack.policyProfileId,
      );
      if (!profile) {
        return res.status(404).json({ error: "policy-profile-not-found" });
      }
      if (tenantGuard.tenantId && profile.customerId !== tenantGuard.tenantId) {
        return res.status(403).json({ error: "tenant-mismatch" });
      }
      if (requestedCustomerId && profile.customerId !== requestedCustomerId) {
        return res.status(400).json({
          error: "policy-profile-customer-mismatch",
          message: "Policy profile does not match the requested customer.",
        });
      }
      if (!effectiveTenantId) {
        effectiveTenantId = profile.customerId;
      }
      const packOverride = profile.packs.find(
        (entry) => entry.packId === resolvedPack.id,
      );
      if (packOverride) {
        overrides.push(packOverride);
        policyNotes.push(`policy_profile=${profile.id}`);
        policyNotes.push(`policy_version=${profile.version}`);
        policyNotes.push(`policy_customer=${profile.customerId}`);
      } else {
        policyNotes.push(`policy_profile_missing_pack=${resolvedPack.id}`);
      }
    }
    if (pack.policyOverride) {
      const inlineOverride = pack.policyOverride;
      if (
        inlineOverride.packId &&
        inlineOverride.packId !== resolvedPack.id
      ) {
        return res.status(400).json({
          error: "policy-override-pack-mismatch",
          message: "policyOverride.packId must match the pack being evaluated.",
        });
      }
      const normalizedOverride = { ...inlineOverride, packId: resolvedPack.id };
      if (hasPolicyOverridePayload(normalizedOverride)) {
        overrides.push(normalizedOverride);
        policyNotes.push("policy_override=inline");
      }
    }
    let effectivePack = resolvedPack;
    if (overrides.length) {
      const resolved = applyConstraintPackOverrides(
        effectivePack,
        overrides,
      );
      effectivePack = resolved.pack;
      if (resolved.warnings.length) {
        policyNotes.push(
          ...resolved.warnings.map((warning) => `policy_${warning}`),
        );
      }
    }
    const shouldAutoTelemetry = resolveAutoTelemetry({
      autoTelemetry: pack.autoTelemetry,
      telemetryPath: pack.telemetryPath,
      junitPath: pack.junitPath,
    });
    let telemetry = pack.telemetry;
    const autoTelemetryNotes: string[] = [];
    if (shouldAutoTelemetry) {
      if (effectivePack.id === "repo-convergence") {
        const collected = await collectRepoConvergenceTelemetry({
          explicit: telemetry as RepoConvergenceTelemetry,
          telemetryPath: pack.telemetryPath,
          junitPath: pack.junitPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      } else if (effectivePack.id === "tool-use-budget") {
        const collected = await collectToolUseBudgetTelemetry({
          explicit: telemetry as ToolUseBudgetTelemetry,
          telemetryPath: pack.telemetryPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      }
    }
    if (!hasAnyTelemetry(telemetry) && !hasAnyTelemetry(pack.metrics)) {
      return res.status(400).json({
        error: "constraint-pack-telemetry-missing",
        message: "Provide telemetry or metrics to evaluate the pack.",
      });
    }

    const metrics =
      effectivePack.id === "repo-convergence"
        ? buildRepoConvergenceMetrics(telemetry as RepoConvergenceTelemetry)
        : buildToolUseBudgetMetrics(telemetry as ToolUseBudgetTelemetry);
    mergeMetricOverrides(metrics, pack.metrics);
    const evaluationNotes = [
      ...(pack.notes ?? []),
      ...policyNotes,
      ...autoTelemetryNotes,
    ];
    const evaluation = evaluateConstraintPackFromMetrics(effectivePack, metrics, {
      certificate: pack.certificate,
      deltas: pack.deltas,
      notes: evaluationNotes.length ? evaluationNotes : undefined,
      proxy: pack.proxy,
      ladderTier: pack.ladderTier,
    });
    const traceId = parsed.data.traceId ?? `adapter:${crypto.randomUUID()}`;
    const trace = recordConstraintPackTrace({
      traceId,
      tenantId: effectiveTenantId,
      pack: effectivePack,
      evaluation,
      source: {
        system: "constraint-pack",
        component: "adapter",
        tool: effectivePack.id,
        version: String(effectivePack.version),
      },
    });
    const artifacts = buildConstraintPackArtifacts({
      packId: effectivePack.id,
      traceId: trace.id,
      certificateHash: evaluation.certificate?.certificateHash ?? null,
      certificateId: evaluation.certificate?.certificateId ?? null,
    });
    return res.json({
      traceId,
      runId: trace.id,
      verdict: trace.pass ? "PASS" : "FAIL",
      pass: trace.pass,
      firstFail: trace.firstFail ?? null,
      deltas: trace.deltas,
      artifacts,
    });
  }

  const proposals = buildActionProposals(actions);
  const proposalCount = proposals?.length ?? 0;
  const resolvedMaxIterations =
    budget?.maxIterations ?? (proposalCount > 0 ? Math.min(proposalCount, 50) : undefined);
  const options: GrAgentLoopOptions = {
    ...(proposals ? { proposals } : {}),
    ...(resolvedMaxIterations !== undefined
      ? { maxIterations: resolvedMaxIterations }
      : {}),
    ...(budget?.maxAttemptMs !== undefined || budget?.maxTotalMs !== undefined
      ? {
          budget: {
            maxAttemptMs: budget?.maxAttemptMs,
            maxTotalMs: budget?.maxTotalMs,
          },
        }
      : {}),
    ...(policy?.thresholds ? { thresholds: policy.thresholds } : {}),
    ...(policy?.gate ? { policy: policy.gate } : {}),
  };

  const traceId = parsed.data.traceId ?? `adapter:${crypto.randomUUID()}`;
  const start = Date.now();
  try {
    const result = await runGrAgentLoop(options);
    const durationMs = Date.now() - start;
    const run = recordGrAgentLoopRun({
      result,
      options,
      durationMs,
      tenantId: tenantGuard.tenantId,
    });
    const terminalAttempt = resolveTerminalAttempt(
      result.attempts,
      result.acceptedIteration,
    );
    const firstFail = terminalAttempt
      ? findFirstFailingHardConstraint(terminalAttempt.evaluation.constraints)
      : undefined;
    const baselineParams =
      result.attempts.length > 0 ? result.attempts[0].proposal.params : undefined;
    const terminalParams = terminalAttempt?.proposal.params;
    const deltas = toTrainingTraceDeltas(
      diffParams(
        baselineParams as Record<string, unknown> | undefined,
        terminalParams as Record<string, unknown> | undefined,
      ),
    );
    const artifacts = buildArtifactRefs({
      runId: run.id,
      certificateHash: terminalAttempt?.evaluation.certificate.certificateHash,
      certificateId: terminalAttempt?.evaluation.certificate.certificateId,
    });

    return res.json({
      traceId,
      runId: run.id,
      verdict: result.accepted ? "PASS" : "FAIL",
      pass: result.accepted,
      firstFail: firstFail ?? null,
      deltas,
      artifacts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[adapter] run failed:", message);
    return res.status(500).json({ error: "adapter-run-failed", message });
  }
});

export { adapterRouter };
