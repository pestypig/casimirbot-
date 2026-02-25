import { issueWarpViabilityCertificate } from "../../tools/warpViabilityCertificate.js";
import { verifyCertificateIntegrity, verifyPhysicsCertificate } from "../../tools/verifyCertificate.js";
import type {
  GrConstraintPolicy,
  GrConstraintThresholds,
  GrEvaluation,
} from "../../shared/schema.js";
import type { WarpConfig, WarpViabilityCertificate } from "../../types/warpViability.js";
import type { GrPipelineDiagnostics } from "../energy-pipeline.js";
import {
  evaluateGrConstraintGateFromDiagnostics,
  type SemiclassicalPolicyHooks,
} from "./constraint-evaluator.js";
import { resolveGrConstraintPolicyBundle } from "./gr-constraint-policy.js";
import { withSpan } from "../services/observability/otel-tracing.js";

export type GrEvaluationInput = {
  diagnostics?: GrPipelineDiagnostics | null;
  warpConfig?: WarpConfig;
  thresholds?: Partial<GrConstraintThresholds>;
  policy?: Partial<GrConstraintPolicy>;
  semiclassical?: SemiclassicalPolicyHooks;
  useLiveSnapshot?: boolean;
};

export type GrEvaluationResult = {
  evaluation: GrEvaluation;
  certificate: WarpViabilityCertificate;
  integrityOk: boolean;
};

export type G4ConstraintDiagnostics = {
  fordRomanStatus: "pass" | "fail" | "unknown" | "missing";
  thetaAuditStatus: "pass" | "fail" | "unknown" | "missing";
  reason: string[];
};

export const extractG4ConstraintDiagnostics = (constraints: GrEvaluation["constraints"]): G4ConstraintDiagnostics => {
  const ford = constraints.find((entry) => entry.id === "FordRomanQI");
  const theta = constraints.find((entry) => entry.id === "ThetaAudit");
  const normalize = (status: string | undefined): G4ConstraintDiagnostics["fordRomanStatus"] => {
    if (!status) return "missing";
    if (status === "pass" || status === "fail" || status === "unknown") return status;
    return "unknown";
  };
  return {
    fordRomanStatus: normalize(ford?.status),
    thetaAuditStatus: normalize(theta?.status),
    reason: [ford?.message, theta?.message].filter((entry): entry is string => Boolean(entry && entry.trim())),
  };
};


const normalizeConstraintStatus = (status: string | undefined): "pass" | "fail" | "unknown" => {
  if (status === "pass" || status === "fail" || status === "unknown") return status;
  return "unknown";
};

const ensureHardConstraintEntries = (constraints: GrEvaluation["constraints"]): GrEvaluation["constraints"] => {
  const byId = new Map(constraints.map((entry) => [entry.id, entry]));
  const hardIds = ["FordRomanQI", "ThetaAudit"] as const;
  for (const id of hardIds) {
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        label: id,
        severity: "HARD",
        status: "unknown",
        message: `${id} missing from evaluator output; defaulted to unknown for deterministic payload completeness.`,
      });
      continue;
    }
    const entry = byId.get(id)!;
    byId.set(id, { ...entry, status: normalizeConstraintStatus(entry.status) });
  }
  return Array.from(byId.values());
};

export async function runGrEvaluation(
  input: GrEvaluationInput,
): Promise<GrEvaluationResult> {
  return withSpan(
    "gr.constraint.evaluate",
    {
      spanKind: "internal",
      attributes: {
        "gr.has_diagnostics": Boolean(input.diagnostics),
        "gr.use_live_snapshot": Boolean(input.useLiveSnapshot),
      },
    },
    async (span) => {
      const diagnostics = input.diagnostics ?? null;
      const policyBundle = await resolveGrConstraintPolicyBundle({
        thresholds: input.thresholds,
        policy: input.policy,
      });
      const gateEval = evaluateGrConstraintGateFromDiagnostics(
        diagnostics?.constraints ?? null,
        {
          thresholds: policyBundle.gate.thresholds,
          policy: policyBundle.gate.policy,
          semiclassical: input.semiclassical,
        },
      );
      const certificate = await issueWarpViabilityCertificate(
        input.warpConfig ?? {},
        { useLiveSnapshot: input.useLiveSnapshot },
      );
      const integrityOk = verifyCertificateIntegrity(certificate);
      const authenticity = verifyPhysicsCertificate(certificate, {
        authenticityConsequence: "low",
      }).authenticity;
      const certificateStatus = certificate.payload?.status ?? "NOT_CERTIFIED";
      const admissibleStatus = policyBundle.certificate.admissibleStatus;
      const allowMarginal = policyBundle.certificate.allowMarginalAsViable;
      const hasCertificate = Boolean(certificate.certificateHash);
      const requiresCertificate =
        policyBundle.certificate.treatMissingCertificateAsNotCertified;
      const statusOk =
        certificateStatus === admissibleStatus ||
        (allowMarginal && certificateStatus === "MARGINAL");

      const residuals = {
        H_rms: diagnostics?.constraints?.H_constraint?.rms,
        M_rms: diagnostics?.constraints?.M_constraint?.rms,
        H_maxAbs: diagnostics?.constraints?.H_constraint?.maxAbs,
        M_maxAbs: diagnostics?.constraints?.M_constraint?.maxAbs,
        semiclassical: gateEval.semiclassicalResiduals,
      };

      const notes = [...gateEval.notes];
      const cfl = diagnostics?.solver?.cfl;
      if (Number.isFinite(cfl) && (cfl as number) > 1) {
        notes.push(
          `CFL=${(cfl as number).toExponential(2)} too high; lower evolveDt_s or increase grid resolution.`,
        );
      } else if (!Number.isFinite(cfl)) {
        notes.push("CFL is non-finite; check GR evolve step settings.");
      }
      if (gateEval.firstFailId) {
        notes.push(`Deterministic first-fail id: ${gateEval.firstFailId}`);
      }
      if (!integrityOk) {
        notes.push("Warp viability certificate integrity check failed.");
      }
      if (!hasCertificate && requiresCertificate) {
        notes.push("Warp viability certificate missing; policy requires certification.");
      }
      if (hasCertificate && !statusOk) {
        const allowed = allowMarginal ? `${admissibleStatus} or MARGINAL` : admissibleStatus;
        notes.push(`Warp viability status ${certificateStatus} does not satisfy policy (${allowed}).`);
      }

      const certificateOk =
        integrityOk &&
        (hasCertificate || !requiresCertificate) &&
        (hasCertificate ? statusOk : true);
      const pass = gateEval.gate.status === "pass" && certificateOk;

      span.addAttributes({
        "gr.gate.status": gateEval.gate.status,
        "gr.constraints.count": gateEval.constraints.length,
        "gr.pass": pass,
        "warp.certificate.status": certificateStatus,
        "warp.certificate.integrity_ok": integrityOk,
        "warp.certificate.authenticity_ok": authenticity.ok,
        "warp.certificate.authenticity_required": authenticity.enforced,
      });
      span.status = pass
        ? { code: "OK" }
        : { code: "ERROR", message: "GR constraint gate failed" };

      const completeConstraints = ensureHardConstraintEntries(gateEval.constraints);
      const g4Diagnostics = extractG4ConstraintDiagnostics(completeConstraints);
      if (g4Diagnostics.reason.length > 0) {
        notes.push(`G4 diagnostics: FordRomanQI=${g4Diagnostics.fordRomanStatus}, ThetaAudit=${g4Diagnostics.thetaAuditStatus}. ${g4Diagnostics.reason.join(" | ")}`);
      }

      const evaluation: GrEvaluation = {
        kind: "gr-evaluation",
        updatedAt: Date.now(),
        policy: policyBundle,
        residuals,
        gate: { ...gateEval.gate, status: normalizeConstraintStatus(gateEval.gate.status) },
        constraints: completeConstraints,
        certificate: {
          status: certificateStatus,
          admissibleStatus,
          hasCertificate,
          certificateHash: certificate.certificateHash ?? null,
          certificateId: certificate.header?.id ?? null,
          integrityOk,
          authenticityOk: authenticity.ok,
          authenticityRequired: authenticity.enforced,
          authenticityConsequence: authenticity.consequence,
          authenticityReasonCodes: authenticity.reasonCodes,
        },
        pass,
        notes: notes.length ? notes : undefined,
      };

      return { evaluation, certificate, integrityOk };
    },
  );
}
