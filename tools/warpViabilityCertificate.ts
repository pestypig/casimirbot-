import crypto from "node:crypto";
import { evaluateWarpViability } from "./warpViability";
import { pullSettledSnapshot, type LivePullOpts } from "./liveSnapshot";
import type { PhysicsCertificateHeader } from "../types/physicsCertificate";
import type {
  WarpConfig,
  WarpNhm2FullLoopPolicyLayer,
  WarpViabilityCertificate,
  WarpViabilityPayload,
} from "../types/warpViability";
import type { PipelineSnapshot } from "../types/pipeline.js";
import { withSpan } from "../server/services/observability/otel-tracing.js";
import { buildNhm2FullLoopAuditContract } from "../shared/contracts/nhm2-full-loop-audit.v1";

// Canonical JSON to make hashes stable and deterministic across runtimes.
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    return v === undefined ? null : v;
  });
}

// Simple hash helper for integrity checks.
function hashString(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

// Wire repo context from env for reproducibility; can be replaced by config later.
function getRepoContext(): { gitCommit?: string; pipelineVersion?: string } {
  return {
    gitCommit: process.env.GIT_COMMIT || undefined,
    pipelineVersion: process.env.PIPELINE_VERSION || undefined,
  };
}

function makeHeader(kind: "warp-viability"): PhysicsCertificateHeader {
  const { gitCommit, pipelineVersion } = getRepoContext();
  const signerKeyId = process.env.WARP_CERT_SIGNER_KEY_ID?.trim();
  return {
    id: crypto.randomUUID(),
    kind,
    issuedAt: new Date().toISOString(),
    issuer: "server/warp-viability-oracle",
    gitCommit,
    pipelineVersion,
    ...(signerKeyId ? { signer: { keyId: signerKeyId } } : {}),
  };
}

type CertOpts = {
  useLiveSnapshot?: boolean;
  livePull?: LivePullOpts;
  snapshot?: PipelineSnapshot;
};

const envUseLiveSnapshot = () => {
  const raw = process.env.WARP_CERT_USE_LIVE ?? process.env.HELIX_CERT_USE_LIVE;
  if (!raw) return true;
  return raw !== "0" && raw.toLowerCase() !== "false";
};

const updateNhm2PolicyLayerForCertificate = (args: {
  policyLayer: WarpNhm2FullLoopPolicyLayer | undefined;
  viabilityStatus: WarpViabilityPayload["status"];
  constraints: WarpViabilityPayload["constraints"];
  issuedAt: string;
}): WarpNhm2FullLoopPolicyLayer | undefined => {
  const policyLayer = args.policyLayer;
  if (!policyLayer) return undefined;

  const firstHardFailure =
    args.constraints.find((entry) => entry.severity === "HARD" && !entry.passed) ?? null;
  const hardConstraintPass = firstHardFailure == null;
  const reasons: typeof policyLayer.artifact.sections.certificate_policy_result.reasons = [];
  if (!hardConstraintPass) reasons.push("hard_constraint_failed");
  if (args.viabilityStatus !== "ADMISSIBLE") reasons.push("status_non_admissible");

  const certificatePolicyResult = {
    ...policyLayer.artifact.sections.certificate_policy_result,
    state: (hardConstraintPass && args.viabilityStatus === "ADMISSIBLE"
      ? "pass"
      : "fail") as const,
    reasons,
    artifactRefs: [
      ...policyLayer.artifact.sections.certificate_policy_result.artifactRefs,
      {
        artifactId: "warp_viability_certificate",
        path: "runtime://certificate/warp-viability",
        contractVersion: null,
        status: args.viabilityStatus,
      },
    ],
    viabilityStatus: args.viabilityStatus,
    hardConstraintPass,
    firstHardFailureId: firstHardFailure?.id ?? null,
    certificateStatus: args.viabilityStatus,
    certificateHash: null,
    certificateIntegrity: "ok" as const,
    promotionTier: policyLayer.currentClaimTier,
    promotionReason: policyLayer.artifact.sections.claim_tier.promotionReason,
  };

  const artifact = buildNhm2FullLoopAuditContract({
    generatedAt: args.issuedAt,
    sections: {
      ...policyLayer.artifact.sections,
      certificate_policy_result: certificatePolicyResult,
    },
  });
  if (!artifact) return policyLayer;

  return {
    policyId: policyLayer.policyId,
    state: artifact.overallState,
    currentClaimTier: artifact.currentClaimTier,
    maximumClaimTier: artifact.maximumClaimTier,
    highestPassingClaimTier: artifact.highestPassingClaimTier,
    blockingReasons: [...artifact.blockingReasons],
    artifact,
  };
};

export async function issueWarpViabilityCertificate(
  config: WarpConfig,
  opts: CertOpts = {},
): Promise<WarpViabilityCertificate> {
  return withSpan(
    "warp.viability.certificate",
    {
      spanKind: "internal",
      attributes: {
        "warp.use_live_snapshot": Boolean(opts.useLiveSnapshot ?? envUseLiveSnapshot()),
      },
    },
    async (span) => {
      const explicitSnapshot = opts.snapshot;
      const shouldUseLive = explicitSnapshot ? false : opts.useLiveSnapshot ?? envUseLiveSnapshot();
      const live = shouldUseLive ? await pullSettledSnapshot(opts.livePull) : null;
      const viability = await evaluateWarpViability(config, {
        snapshot: explicitSnapshot ?? live?.snap,
        telemetrySource: explicitSnapshot ? "gr-diagnostics" : live ? "pipeline-live" : "solver",
        telemetryHeaders: live?.meta,
      });

      const snapshot = viability.snapshot as Record<string, unknown>;
      const warpMechanicsProvenanceClass =
        typeof snapshot.warp_mechanics_provenance_class === "string"
          ? String(snapshot.warp_mechanics_provenance_class)
          : "proxy";
      const warpMechanicsClaimTier =
        typeof snapshot.warp_mechanics_claim_tier === "string"
          ? String(snapshot.warp_mechanics_claim_tier)
          : "diagnostic";
      const header = makeHeader("warp-viability");
      const policyLayers = viability.policyLayers?.nhm2_full_loop_audit
        ? {
            ...viability.policyLayers,
            nhm2_full_loop_audit: updateNhm2PolicyLayerForCertificate({
              policyLayer: viability.policyLayers.nhm2_full_loop_audit,
              viabilityStatus: viability.status,
              constraints: viability.constraints,
              issuedAt: header.issuedAt,
            }),
          }
        : viability.policyLayers;

      const payload: WarpViabilityPayload = {
        status: viability.status,
        config,
        constraints: viability.constraints,
        snapshot: {
          ...viability.snapshot,
          warp_mechanics_provenance_class: warpMechanicsProvenanceClass,
          warp_mechanics_claim_tier: warpMechanicsClaimTier,
        },
        policyLayers,
        citations: viability.citations,
        mitigation: viability.mitigation,
      };

      // 2. Build header and hashes.
      const payloadStr = canonicalJson(payload);
      const payloadHash = hashString(payloadStr);

      const certBase = { header, payload, payloadHash };
      const certificateStr = canonicalJson(certBase);
      const certificateHash = hashString(certificateStr);

      const cert: WarpViabilityCertificate = {
        ...certBase,
        certificateHash,
      };

      span.addAttributes({
        "warp.status": payload.status,
        "warp.constraints.count": payload.constraints.length,
        "warp.certificate.hash_present": Boolean(cert.certificateHash),
      });
      span.status =
        payload.status === "ADMISSIBLE"
          ? { code: "OK" }
          : { code: "ERROR", message: `status=${payload.status}` };

      return cert;
    },
  );
}
