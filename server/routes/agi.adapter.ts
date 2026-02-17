import { Router } from "express";
import type { Request, Response } from "express";
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
  type AdapterPremeditationResult,
  type AdapterRoboticsSafety,
} from "../../shared/schema.js";
import {
  buildRepoConvergenceMetrics,
  buildToolUseBudgetMetrics,
  buildAuditSafetyMetrics,
  evaluateConstraintPackFromMetrics,
  type ConstraintPackMetricMap,
  type AuditSafetyTelemetry,
  type RepoConvergenceTelemetry,
  type ToolUseBudgetTelemetry,
} from "../services/observability/constraint-pack-evaluator.js";
import {
  collectRepoConvergenceTelemetry,
  collectToolUseBudgetTelemetry,
  collectAuditSafetyTelemetry,
  isAutoTelemetryEnabled,
} from "../services/observability/constraint-pack-telemetry.js";
import { recordConstraintPackTrace } from "../services/observability/constraint-pack-normalizer.js";
import {
  getConstraintPackPolicyProfileById,
} from "../services/constraint-packs/constraint-pack-policy-store.js";
import { applyConstraintPackOverrides } from "../services/constraint-packs/constraint-pack-policy.js";
import { scorePremeditation } from "../services/premeditation-scorer.js";
import { recordTrainingTrace } from "../services/observability/training-trace-store.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};




type RoboticsSafetyGateResult = {
  pass: boolean;
  firstFail?: TrainingTraceConstraint;
  deltas: TrainingTraceDelta[];
  certificate: {
    status: string;
    certificateHash: string | null;
    certificateId: string | null;
    integrityOk: boolean;
  };
};

const buildRoboticsSafetyGate = (
  roboticsSafety: AdapterRoboticsSafety,
): RoboticsSafetyGateResult => {
  const checks = [
    {
      id: "collision.margin",
      pass: roboticsSafety.collisionMargin_m >= roboticsSafety.collisionMarginMin_m,
      value: roboticsSafety.collisionMargin_m,
      limit: `>= ${roboticsSafety.collisionMarginMin_m}`,
      severity: "HARD",
    },
    {
      id: "torque.bounds",
      pass: roboticsSafety.torqueUsageRatio <= roboticsSafety.torqueUsageMax,
      value: roboticsSafety.torqueUsageRatio,
      limit: `<= ${roboticsSafety.torqueUsageMax}`,
      severity: "HARD",
    },
    {
      id: "speed.bounds",
      pass: roboticsSafety.speedUsageRatio <= roboticsSafety.speedUsageMax,
      value: roboticsSafety.speedUsageRatio,
      limit: `<= ${roboticsSafety.speedUsageMax}`,
      severity: "HARD",
    },
    {
      id: "stability.margin",
      pass: roboticsSafety.stabilityMargin >= roboticsSafety.stabilityMarginMin,
      value: roboticsSafety.stabilityMargin,
      limit: `>= ${roboticsSafety.stabilityMarginMin}`,
      severity: "HARD",
    },
  ];
  const firstFailCheck = checks.find((entry) => !entry.pass);
  const pass = !firstFailCheck;
  const payload = {
    mode: "robotics-safety-v1",
    checks,
  };
  const certificateHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload), "utf8")
    .digest("hex");
  const integrityOk = roboticsSafety.integrityOk ?? true;
  const deltas: TrainingTraceDelta[] = [
    {
      key: "robotics.collision.margin_m",
      from: null,
      to: roboticsSafety.collisionMargin_m,
      delta: roboticsSafety.collisionMargin_m - roboticsSafety.collisionMarginMin_m,
      change: "added",
    },
    {
      key: "robotics.torque.usage_ratio",
      from: null,
      to: roboticsSafety.torqueUsageRatio,
      delta: roboticsSafety.torqueUsageRatio - roboticsSafety.torqueUsageMax,
      change: "added",
    },
    {
      key: "robotics.speed.usage_ratio",
      from: null,
      to: roboticsSafety.speedUsageRatio,
      delta: roboticsSafety.speedUsageRatio - roboticsSafety.speedUsageMax,
      change: "added",
    },
    {
      key: "robotics.stability.margin",
      from: null,
      to: roboticsSafety.stabilityMargin,
      delta: roboticsSafety.stabilityMargin - roboticsSafety.stabilityMarginMin,
      change: "added",
    },
  ];
  return {
    pass,
    firstFail: firstFailCheck
      ? {
          id: firstFailCheck.id,
          severity: firstFailCheck.severity,
          status: "fail",
          value: firstFailCheck.value,
          limit: firstFailCheck.limit,
          note: "robotics-safety-veto",
        }
      : undefined,
    deltas,
    certificate: {
      status: pass ? "GREEN" : "RED",
      certificateHash,
      certificateId: `robotics-safety:${certificateHash.slice(0, 12)}`,
      integrityOk,
    },
  };
};

const hasForbiddenActuationCommand = (actions?: AdapterAction[]): boolean => {
  if (!Array.isArray(actions)) return false;
  return actions.some((action) => {
    const kind = String(action.kind ?? "").toLowerCase();
    const label = String(action.label ?? "").toLowerCase();
    return (
      kind.includes("motor") ||
      kind.includes("actuat") ||
      label.includes("motor") ||
      label.includes("actuat") ||
      Object.keys(action.params ?? {}).some((key) => /motor|torque|servo/i.test(key))
    );
  });
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

  const { actions, budget, policy, pack, mode, premeditation, roboticsSafety } = parsed.data;

  if (hasForbiddenActuationCommand(actions)) {
    return res.status(400).json({
      error: "controller-boundary-violation",
      message: "LLM actions may propose intent only; direct motor/actuator commands are forbidden.",
    });
  }

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
      return res.status(400).json({
        error: "constraint-pack-telemetry-missing",
        message: "Provide telemetry or metrics to evaluate the pack.",
      });
    }

    const metrics =
      effectivePack.id === "repo-convergence"
        ? buildRepoConvergenceMetrics(telemetry as RepoConvergenceTelemetry)
        : effectivePack.id === "tool-use-budget"
          ? buildToolUseBudgetMetrics(telemetry as ToolUseBudgetTelemetry)
          : buildAuditSafetyMetrics(telemetry as AuditSafetyTelemetry);
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
      metrics,
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
      certificate: evaluation.certificate ?? null,
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
  const premeditationResult: AdapterPremeditationResult | undefined =
    premeditation ? scorePremeditation(premeditation) : undefined;
  if (roboticsSafety) {
    const safety = buildRoboticsSafetyGate(roboticsSafety);
    if (!safety.pass) {
      recordTrainingTrace({
        traceId,
        tenantId: tenantGuard.tenantId,
        pass: false,
        deltas: safety.deltas,
        firstFail: safety.firstFail,
        certificate: safety.certificate,
        notes: ["phase=5", "robotics-safety=veto"],
      });
      return res.json({
        traceId,
        runId: `robotics-veto:${crypto.randomUUID()}`,
        verdict: "FAIL",
        pass: false,
        firstFail: safety.firstFail ?? null,
        deltas: safety.deltas,
        certificate: safety.certificate,
        artifacts: [
          { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
          { kind: "robotics-safety-certificate-hash", ref: safety.certificate.certificateHash ?? "" },
          { kind: "robotics-safety-certificate-id", ref: safety.certificate.certificateId ?? "" },
        ],
      });
    }
  }
  try {
    const result = await runAdapterExecution(parsed.data, {
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

    if (premeditationResult) {
      const nowIso = new Date().toISOString();
      recordTrainingTrace({
        traceId,
        tenantId: tenantGuard.tenantId,
        pass: result.accepted,
        deltas,
        metrics: {
          optimism: premeditationResult.optimism,
          entropy: premeditationResult.entropy,
        },
        payload: {
          kind: "movement_episode",
          data: {
            episodeId: `${traceId}:episode`,
            traceId,
            primitivePath: premeditationResult.chosenCandidateId
              ? [premeditationResult.chosenCandidateId]
              : [],
            metrics: {
              optimism: premeditationResult.optimism,
              entropy: premeditationResult.entropy,
            },
            events: [
              {
                phase: "premeditate",
                ts: nowIso,
                candidateId: premeditationResult.chosenCandidateId,
                metadata: {
                  rationaleTags: premeditationResult.rationaleTags,
                },
              },
              {
                phase: "act",
                ts: nowIso,
                controllerRef: "gr-agent-loop",
              },
            ],
            notes: premeditationResult.rationaleTags,
          },
        },
        notes: ["phase=2", "premeditation=enabled"],
      });
    }

    return res.json({
      traceId,
      runId: run.id,
      verdict: result.accepted ? "PASS" : "FAIL",
      pass: result.accepted,
      firstFail: firstFail ?? null,
      deltas,
      premeditation: premeditationResult,
      certificate: terminalAttempt?.evaluation.certificate ?? null,
      artifacts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[adapter] run failed:", message);
    return res.status(500).json({ error: "adapter-run-failed", message });
  }
});

export { adapterRouter };
