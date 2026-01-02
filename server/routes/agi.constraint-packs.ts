import crypto from "node:crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import {
  constraintPackCertificateResultSchema,
  constraintPackOverrideInputSchema,
  constraintPackSchema,
  constraintPackPolicyProfileInputSchema,
  constraintPackPolicyProfileSchema,
  policyLadderTierSchema,
  trainingTraceDeltaSchema,
  trainingTraceSourceSchema,
  type ConstraintPackOverride,
} from "@shared/schema";
import {
  constraintPacks,
  getConstraintPackById,
} from "@shared/constraint-packs";
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
  getConstraintPackPolicyProfiles,
  recordConstraintPackPolicyProfile,
} from "../services/constraint-packs/constraint-pack-policy-store.js";
import { applyConstraintPackOverrides } from "../services/constraint-packs/constraint-pack-policy.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};

const packs = constraintPacks.map((pack) => constraintPackSchema.parse(pack));

const constraintPacksRouter = Router();

const isAgiRequest = (req: Request): boolean =>
  req.baseUrl?.startsWith("/api/agi") ?? false;

const normalizeCustomerId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const guardAgiTenant = (req: Request) =>
  guardTenant(req, {
    require: isAgiRequest(req) && shouldRequireTenant(),
  });

constraintPacksRouter.options("/constraint-packs", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

constraintPacksRouter.options("/constraint-packs/:id", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

constraintPacksRouter.options("/constraint-packs/:id/evaluate", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

constraintPacksRouter.options("/constraint-packs/policies", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

constraintPacksRouter.options("/constraint-packs/policies/:id", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

constraintPacksRouter.get("/constraint-packs", (_req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  return res.json({ packs });
});

const policyListQuerySchema = z.object({
  customerId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

constraintPacksRouter.get(
  "/constraint-packs/policies",
  (req: Request, res: Response) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    const tenantGuard = guardAgiTenant(req);
    if (!tenantGuard.ok) {
      return res.status(tenantGuard.status).json({ error: tenantGuard.error });
    }
    const parsed = policyListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-policy-query",
        details: parsed.error.flatten(),
      });
    }
    const requestedCustomerId = normalizeCustomerId(parsed.data.customerId);
    if (
      tenantGuard.tenantId &&
      requestedCustomerId &&
      tenantGuard.tenantId !== requestedCustomerId
    ) {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    const profiles = getConstraintPackPolicyProfiles({
      customerId: tenantGuard.tenantId ?? requestedCustomerId,
      limit: parsed.data.limit,
    });
    return res.json({
      profiles: profiles.map((profile) =>
        constraintPackPolicyProfileSchema.parse(profile),
      ),
    });
  },
);

constraintPacksRouter.get(
  "/constraint-packs/policies/:id",
  (req: Request, res: Response) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    const tenantGuard = guardAgiTenant(req);
    if (!tenantGuard.ok) {
      return res.status(tenantGuard.status).json({ error: tenantGuard.error });
    }
    const profile = getConstraintPackPolicyProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "policy-profile-not-found" });
    }
    if (
      tenantGuard.tenantId &&
      profile.customerId !== tenantGuard.tenantId
    ) {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    return res.json({ profile: constraintPackPolicyProfileSchema.parse(profile) });
  },
);

constraintPacksRouter.post(
  "/constraint-packs/policies",
  (req: Request, res: Response) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    const tenantGuard = guardAgiTenant(req);
    if (!tenantGuard.ok) {
      return res.status(tenantGuard.status).json({ error: tenantGuard.error });
    }
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const requestedCustomerId = normalizeCustomerId(
      typeof body.customerId === "string" ? body.customerId : undefined,
    );
    if (
      tenantGuard.tenantId &&
      requestedCustomerId &&
      tenantGuard.tenantId !== requestedCustomerId
    ) {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    const normalizedBody = {
      ...body,
      ...(requestedCustomerId ? { customerId: requestedCustomerId } : {}),
      ...(tenantGuard.tenantId && !requestedCustomerId
        ? { customerId: tenantGuard.tenantId }
        : {}),
    };
    const parsed = constraintPackPolicyProfileInputSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-policy-profile",
        details: parsed.error.flatten(),
      });
    }
    const profile = recordConstraintPackPolicyProfile(parsed.data);
    return res.json({
      profile: constraintPackPolicyProfileSchema.parse(profile),
    });
  },
);

constraintPacksRouter.get(
  "/constraint-packs/:id",
  (req: Request, res: Response) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    const pack = getConstraintPackById(req.params.id);
    if (!pack) {
      return res.status(404).json({ error: "constraint-pack-not-found" });
    }
    return res.json({ pack: constraintPackSchema.parse(pack) });
  },
);

const metricValueSchema = z.union([
  z.number(),
  z.boolean(),
  z.string(),
  z.null(),
]);

const metricsSchema = z.record(metricValueSchema).optional();

const repoConvergenceTelemetrySchema = z
  .object({
    build: z
      .object({
        status: metricValueSchema.optional(),
        ok: metricValueSchema.optional(),
        exitCode: z.number().optional(),
        durationMs: z.number().optional(),
      })
      .optional(),
    tests: z
      .object({
        status: metricValueSchema.optional(),
        ok: metricValueSchema.optional(),
        failed: z.number().int().nonnegative().optional(),
        passed: z.number().int().nonnegative().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
    schema: z
      .object({
        contracts: metricValueSchema.optional(),
        ok: metricValueSchema.optional(),
      })
      .optional(),
    deps: z
      .object({
        coherence: metricValueSchema.optional(),
      })
      .optional(),
    timeToGreenMs: z.number().nonnegative().optional(),
    lint: z
      .object({
        status: metricValueSchema.optional(),
      })
      .optional(),
    typecheck: z
      .object({
        status: metricValueSchema.optional(),
      })
      .optional(),
    metrics: metricsSchema,
  })
  .optional();

const toolUseBudgetTelemetrySchema = z
  .object({
    steps: z
      .object({
        used: z.number().nonnegative().optional(),
        total: z.number().nonnegative().optional(),
      })
      .optional(),
    cost: z
      .object({
        usd: z.number().nonnegative().optional(),
      })
      .optional(),
    ops: z
      .object({
        forbidden: z.number().nonnegative().optional(),
        approvalMissing: z.number().nonnegative().optional(),
      })
      .optional(),
    provenance: z
      .object({
        missing: z.number().nonnegative().optional(),
      })
      .optional(),
    runtime: z
      .object({
        ms: z.number().nonnegative().optional(),
      })
      .optional(),
    tools: z
      .object({
        calls: z.number().nonnegative().optional(),
        total: z.number().nonnegative().optional(),
      })
      .optional(),
    metrics: metricsSchema,
  })
  .optional();

const evalBaseSchema = z.object({
  traceId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  policyProfileId: z.string().min(1).optional(),
  policyOverride: constraintPackOverrideInputSchema.optional(),
  source: trainingTraceSourceSchema.optional(),
  autoTelemetry: z.boolean().optional(),
  telemetryPath: z.string().min(1).optional(),
  junitPath: z.string().min(1).optional(),
  ladderTier: policyLadderTierSchema.optional(),
  metrics: metricsSchema,
  certificate: constraintPackCertificateResultSchema.optional(),
  deltas: z.array(trainingTraceDeltaSchema).optional(),
  notes: z.array(z.string()).optional(),
  proxy: z.boolean().optional(),
});

const repoConvergenceEvalSchema = evalBaseSchema.extend({
  telemetry: repoConvergenceTelemetrySchema,
});

const toolUseBudgetEvalSchema = evalBaseSchema.extend({
  telemetry: toolUseBudgetTelemetrySchema,
});

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

const hasAnyTelemetry = (telemetry?: Record<string, unknown>): boolean => {
  if (!telemetry) return false;
  return Object.keys(telemetry).length > 0;
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

constraintPacksRouter.post(
  "/constraint-packs/:id/evaluate",
  async (req: Request, res: Response) => {
    setCors(res);
    res.setHeader("Cache-Control", "no-store");
    const tenantGuard = guardAgiTenant(req);
    if (!tenantGuard.ok) {
      return res.status(tenantGuard.status).json({ error: tenantGuard.error });
    }
    const pack = getConstraintPackById(req.params.id);
    if (!pack) {
      return res.status(404).json({ error: "constraint-pack-not-found" });
    }
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const schema =
      pack.id === "repo-convergence"
        ? repoConvergenceEvalSchema
        : pack.id === "tool-use-budget"
          ? toolUseBudgetEvalSchema
          : null;
    if (!schema) {
      return res
        .status(400)
        .json({ error: "constraint-pack-evaluator-missing" });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid-constraint-pack-evaluation",
        details: parsed.error.flatten(),
      });
    }
    const requestedCustomerId = normalizeCustomerId(parsed.data.customerId);
    if (
      tenantGuard.tenantId &&
      requestedCustomerId &&
      tenantGuard.tenantId !== requestedCustomerId
    ) {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    const policyNotes: string[] = [];
    const overrides: ConstraintPackOverride[] = [];
    let resolvedPack = pack;
    let policyProfileSummary:
      | {
          id: string;
          customerId: string;
          version: number;
          name?: string;
        }
      | undefined;
    let effectiveTenantId = tenantGuard.tenantId ?? requestedCustomerId;
    if (parsed.data.policyProfileId) {
      const profile = getConstraintPackPolicyProfileById(
        parsed.data.policyProfileId,
      );
      if (!profile) {
        return res.status(404).json({ error: "policy-profile-not-found" });
      }
      if (tenantGuard.tenantId && profile.customerId !== tenantGuard.tenantId) {
        return res.status(403).json({ error: "tenant-mismatch" });
      }
      if (
        requestedCustomerId &&
        profile.customerId !== requestedCustomerId
      ) {
        return res.status(400).json({
          error: "policy-profile-customer-mismatch",
          message: "Policy profile does not match the requested customer.",
        });
      }
      if (!effectiveTenantId) {
        effectiveTenantId = profile.customerId;
      }
      policyProfileSummary = {
        id: profile.id,
        customerId: profile.customerId,
        version: profile.version,
        name: profile.name,
      };
      const packOverride = profile.packs.find(
        (entry) => entry.packId === pack.id,
      );
      if (packOverride) {
        overrides.push(packOverride);
        policyNotes.push(`policy_profile=${profile.id}`);
        policyNotes.push(`policy_version=${profile.version}`);
        policyNotes.push(`policy_customer=${profile.customerId}`);
      } else {
        policyNotes.push(`policy_profile_missing_pack=${pack.id}`);
      }
    }
    if (parsed.data.policyOverride) {
      const inlineOverride = parsed.data.policyOverride;
      if (inlineOverride.packId && inlineOverride.packId !== pack.id) {
        return res.status(400).json({
          error: "policy-override-pack-mismatch",
          message: "policyOverride.packId must match the pack being evaluated.",
        });
      }
      const normalizedOverride = { ...inlineOverride, packId: pack.id };
      if (hasPolicyOverridePayload(normalizedOverride)) {
        overrides.push(normalizedOverride);
        policyNotes.push("policy_override=inline");
      }
    }
    if (overrides.length) {
      const resolved = applyConstraintPackOverrides(
        resolvedPack,
        overrides,
      );
      resolvedPack = resolved.pack;
      if (resolved.warnings.length) {
        policyNotes.push(...resolved.warnings.map((warning) => `policy_${warning}`));
      }
    }
    const shouldAutoTelemetry = resolveAutoTelemetry({
      autoTelemetry: parsed.data.autoTelemetry,
      telemetryPath: parsed.data.telemetryPath,
      junitPath: parsed.data.junitPath,
    });
    let telemetry = parsed.data.telemetry;
    const autoTelemetryNotes: string[] = [];
    if (shouldAutoTelemetry) {
      if (pack.id === "repo-convergence") {
        const collected = await collectRepoConvergenceTelemetry({
          explicit: telemetry as RepoConvergenceTelemetry,
          telemetryPath: parsed.data.telemetryPath,
          junitPath: parsed.data.junitPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      } else if (pack.id === "tool-use-budget") {
        const collected = await collectToolUseBudgetTelemetry({
          explicit: telemetry as ToolUseBudgetTelemetry,
          telemetryPath: parsed.data.telemetryPath,
        });
        telemetry = collected.telemetry;
        autoTelemetryNotes.push(...collected.notes);
      }
    }

    if (!hasAnyTelemetry(telemetry) && !hasAnyTelemetry(parsed.data.metrics)) {
      return res.status(400).json({
        error: "constraint-pack-telemetry-missing",
        message: "Provide telemetry or metrics to evaluate the pack.",
      });
    }

    const metrics =
      pack.id === "repo-convergence"
        ? buildRepoConvergenceMetrics(telemetry as RepoConvergenceTelemetry)
        : buildToolUseBudgetMetrics(telemetry as ToolUseBudgetTelemetry);
    mergeMetricOverrides(metrics, parsed.data.metrics);

    const evaluationNotes = [
      ...(parsed.data.notes ?? []),
      ...policyNotes,
      ...autoTelemetryNotes,
    ];
    const evaluation = evaluateConstraintPackFromMetrics(resolvedPack, metrics, {
      certificate: parsed.data.certificate,
      deltas: parsed.data.deltas,
      notes: evaluationNotes.length ? evaluationNotes : undefined,
      proxy: parsed.data.proxy,
      ladderTier: parsed.data.ladderTier,
    });
    const traceId =
      parsed.data.traceId ??
      `constraint-pack:${pack.id}:${crypto.randomUUID()}`;
    const source = {
      system: "constraint-pack",
      component: "constraint-pack-evaluator",
      tool: pack.id,
      version: String(resolvedPack.version),
      ...parsed.data.source,
    };
    const trace = recordConstraintPackTrace({
      traceId,
      tenantId: effectiveTenantId,
      pack: resolvedPack,
      evaluation,
      source,
    });

    return res.json({
      pack: constraintPackSchema.parse(resolvedPack),
      policyProfile: policyProfileSummary,
      evaluation,
      trace,
    });
  },
);

export { constraintPacksRouter };
