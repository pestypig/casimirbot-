import { issueWarpViabilityCertificate } from "../../tools/warpViabilityCertificate.js";
import { verifyCertificateIntegrity } from "../../tools/verifyCertificate.js";
import type {
  GrConstraintPolicy,
  GrConstraintThresholds,
  GrEvaluation,
} from "../../shared/schema.js";
import type { WarpConfig, WarpViabilityCertificate } from "../../types/warpViability.js";
import type { GrPipelineDiagnostics } from "../energy-pipeline.js";
import { evaluateGrConstraintGateFromDiagnostics } from "./constraint-evaluator.js";
import { resolveGrConstraintPolicyBundle } from "./gr-constraint-policy.js";
import { withSpan } from "../services/observability/otel-tracing.js";

export type GrEvaluationInput = {
  diagnostics?: GrPipelineDiagnostics | null;
  warpConfig?: WarpConfig;
  thresholds?: Partial<GrConstraintThresholds>;
  policy?: Partial<GrConstraintPolicy>;
  useLiveSnapshot?: boolean;
};

export type GrEvaluationResult = {
  evaluation: GrEvaluation;
  certificate: WarpViabilityCertificate;
  integrityOk: boolean;
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
        },
      );
      const certificate = await issueWarpViabilityCertificate(
        input.warpConfig ?? {},
        { useLiveSnapshot: input.useLiveSnapshot },
      );
      const integrityOk = verifyCertificateIntegrity(certificate);
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
      });
      span.status = pass
        ? { code: "OK" }
        : { code: "ERROR", message: "GR constraint gate failed" };

      const evaluation: GrEvaluation = {
        kind: "gr-evaluation",
        updatedAt: Date.now(),
        policy: policyBundle,
        residuals,
        gate: gateEval.gate,
        constraints: gateEval.constraints,
        certificate: {
          status: certificateStatus,
          admissibleStatus,
          hasCertificate,
          certificateHash: certificate.certificateHash ?? null,
          certificateId: certificate.header?.id ?? null,
          integrityOk,
        },
        pass,
        notes: notes.length ? notes : undefined,
      };

      return { evaluation, certificate, integrityOk };
    },
  );
}
