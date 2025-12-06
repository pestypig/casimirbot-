import crypto from "node:crypto";
import { evaluateWarpViability } from "./warpViability";
import type { PhysicsCertificateHeader } from "../types/physicsCertificate";
import type {
  WarpConfig,
  WarpViabilityCertificate,
  WarpViabilityPayload,
} from "../types/warpViability";

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
  return {
    id: crypto.randomUUID(),
    kind,
    issuedAt: new Date().toISOString(),
    issuer: "server/warp-viability-oracle",
    gitCommit,
    pipelineVersion,
  };
}

export async function issueWarpViabilityCertificate(config: WarpConfig): Promise<WarpViabilityCertificate> {
  // 1. Compute the viability payload (this runs the live physics).
  const viability = await evaluateWarpViability(config);

  const payload: WarpViabilityPayload = {
    status: viability.status,
    config,
    constraints: viability.constraints,
    snapshot: viability.snapshot,
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

  return cert;
}
