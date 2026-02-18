import crypto from "node:crypto";
import { evaluateWarpViability } from "./warpViability";
import { pullSettledSnapshot, type LivePullOpts } from "./liveSnapshot";
import type { PhysicsCertificateHeader } from "../types/physicsCertificate";
import type {
  WarpConfig,
  WarpViabilityCertificate,
  WarpViabilityPayload,
} from "../types/warpViability";
import { withSpan } from "../server/services/observability/otel-tracing.js";

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
};

const envUseLiveSnapshot = () => {
  const raw = process.env.WARP_CERT_USE_LIVE ?? process.env.HELIX_CERT_USE_LIVE;
  if (!raw) return true;
  return raw !== "0" && raw.toLowerCase() !== "false";
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
      const shouldUseLive = opts.useLiveSnapshot ?? envUseLiveSnapshot();
      const live = shouldUseLive ? await pullSettledSnapshot(opts.livePull) : null;
      const viability = await evaluateWarpViability(config, {
        snapshot: live?.snap,
        telemetrySource: live ? "pipeline-live" : "solver",
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

      const payload: WarpViabilityPayload = {
        status: viability.status,
        config,
        constraints: viability.constraints,
        snapshot: {
          ...viability.snapshot,
          warp_mechanics_provenance_class: warpMechanicsProvenanceClass,
          warp_mechanics_claim_tier: warpMechanicsClaimTier,
        },
        citations: viability.citations,
        mitigation: viability.mitigation,
      };

      // 2. Build header and hashes.
      const header = makeHeader("warp-viability");
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
