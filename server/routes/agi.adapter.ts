import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import {
  adapterRunRequestSchema,
  type AdapterAction,
  type AdapterPremeditationResult,
  type AdapterRoboticsSafety,
  type TrainingTraceConstraint,
  type TrainingTraceDelta,
} from "../../shared/schema.js";
import { scorePremeditation } from "../services/premeditation-scorer.js";
import { recordTrainingTrace } from "../services/observability/training-trace-store.js";
import { verifyRoboticsSafetyCertificateIntegrity } from "../../tools/verifyCertificate.js";
import { runAdapterExecution } from "../services/adapter/run.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};


type CanonicalFirstFailClass = "constraint" | "certificate_integrity" | "certificate_status" | "certificate_missing";

const normalizeFailFirstFail = (
  verdict: "PASS" | "FAIL",
  firstFail: TrainingTraceConstraint | null | undefined,
  certificate?: { status?: string; certificateHash?: string | null; integrityOk?: boolean } | null,
): TrainingTraceConstraint | null => {
  if (verdict === "PASS") return firstFail ?? null;
  if (firstFail) return firstFail;
  const certificateHash = typeof certificate?.certificateHash === "string" ? certificate.certificateHash.trim() : "";
  const certificateStatus = typeof certificate?.status === "string" ? certificate.status.trim() : "";
  const canonicalClass: CanonicalFirstFailClass = certificate?.integrityOk === false
    ? "certificate_integrity"
    : !certificateHash
      ? "certificate_missing"
      : certificateStatus && certificateStatus !== "FAIL"
        ? "certificate_status"
        : "constraint";
  const id = canonicalClass === "certificate_integrity"
    ? "ADAPTER_CERTIFICATE_INTEGRITY"
    : canonicalClass === "certificate_missing"
      ? "ADAPTER_CERTIFICATE_MISSING"
      : canonicalClass === "certificate_status"
        ? `ADAPTER_CERTIFICATE_STATUS_${certificateStatus.toUpperCase()}`
        : "ADAPTER_CONSTRAINT_FAIL";
  return {
    id,
    severity: "HARD",
    status: "fail",
    value: null,
    limit: null,
    note: `class=${canonicalClass},adapter_fail_without_explicit_firstfail`,
  };
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
  const payload = {
    mode: "robotics-safety-v1",
    checks,
  };
  const computedCertificateHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload), "utf8")
    .digest("hex");
  const certificateHash = roboticsSafety.certificateHash ?? computedCertificateHash;
  const integrityByHash = verifyRoboticsSafetyCertificateIntegrity({
    mode: "robotics-safety-v1",
    checks,
    certificateHash,
  });
  const integrityOk = (roboticsSafety.integrityOk ?? true) && integrityByHash;
  const certificateFail = !integrityOk
    ? {
        id: "robotics.certificate.integrity",
        pass: false,
        value: 0,
        limit: "integrityOk=true",
        severity: "HARD",
      }
    : null;
  const firstFailCheck = checks.find((entry) => !entry.pass) ?? certificateFail;
  const pass = !firstFailCheck;
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

  const { actions, premeditation, roboticsSafety } = parsed.data;
  if (hasForbiddenActuationCommand(actions)) {
    return res.status(400).json({
      error: "controller-boundary-violation",
      message: "LLM actions may propose intent only; direct motor/actuator commands are forbidden.",
    });
  }

  const traceId = parsed.data.traceId ?? `adapter:${crypto.randomUUID()}`;
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
        firstFail: normalizeFailFirstFail("FAIL", safety.firstFail ?? null, safety.certificate),
        deltas: safety.deltas,
        premeditation: premeditationResult,
        certificate: safety.certificate,
        artifacts: [
          { kind: "training-trace-export", ref: "/api/agi/training-trace/export" },
          ...(safety.certificate.certificateHash
            ? [
                {
                  kind: "robotics-safety-certificate-hash",
                  ref: safety.certificate.certificateHash,
                },
              ]
            : []),
          ...(safety.certificate.certificateId
            ? [{ kind: "robotics-safety-certificate-id", ref: safety.certificate.certificateId }]
            : []),
        ],
      });
    }
  }

  try {
    const result = await runAdapterExecution(
      { ...parsed.data, traceId },
      { tenantId: tenantGuard.tenantId },
    );

    if (premeditationResult) {
      const nowIso = new Date().toISOString();
      recordTrainingTrace({
        traceId,
        tenantId: tenantGuard.tenantId,
        pass: result.pass,
        deltas: result.deltas,
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
      traceId: result.traceId ?? traceId,
      runId: result.runId,
      verdict: result.verdict,
      pass: result.pass,
      firstFail: normalizeFailFirstFail(result.verdict, result.firstFail ?? null, result.certificate as { status?: string; certificateHash?: string | null; integrityOk?: boolean } | null),
      deltas: result.deltas,
      premeditation: premeditationResult,
      certificate: result.certificate ?? null,
      artifacts: result.artifacts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[adapter] run failed:", message);
    return res.status(500).json({ error: "adapter-run-failed", message });
  }
});

export { adapterRouter };
