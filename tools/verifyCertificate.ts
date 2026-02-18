import crypto from "node:crypto";
import { canonicalJson } from "./warpViabilityCertificate";
import { evaluateWarpViability } from "./warpViability";
import type {
  PhysicsCertificate,
  PhysicsCertificateVerificationProfile,
  PhysicsCertificateVerificationResult,
} from "../types/physicsCertificate";
import type {
  CertificateDifference,
  CertificateRecheckResult,
  ConstraintResult,
  WarpViabilityCertificate,
} from "../types/warpViability";

function hashString(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function normalizeProfile(
  profile?: PhysicsCertificateVerificationProfile,
): Required<Pick<PhysicsCertificateVerificationProfile, "hardened" | "trustedSignerKeyIds" | "authenticityConsequence" | "authenticityRequired">> {
  const consequence = profile?.authenticityConsequence ?? "low";
  const hardened = Boolean(profile?.hardened);
  const authenticityRequired = profile?.authenticityRequired ?? (consequence === "high" ? true : hardened);
  return {
    hardened,
    trustedSignerKeyIds: profile?.trustedSignerKeyIds ?? [],
    authenticityConsequence: consequence,
    authenticityRequired,
  };
}

function canonicalCertificateData<TPayload>(cert: PhysicsCertificate<TPayload>) {
  return {
    header: cert.header,
    payload: cert.payload,
    payloadHash: cert.payloadHash,
  };
}

function verifyIntegrity<TPayload>(cert: PhysicsCertificate<TPayload>): boolean {
  const payloadStr = canonicalJson(cert.payload);
  const expectedPayloadHash = hashString(payloadStr);
  if (expectedPayloadHash !== cert.payloadHash) {
    return false;
  }

  const certStr = canonicalJson(canonicalCertificateData(cert));
  const expectedCertHash = hashString(certStr);

  if (cert.certificateHash) {
    return expectedCertHash === cert.certificateHash;
  }
  return true;
}

function verifyAuthenticity<TPayload>(
  cert: PhysicsCertificate<TPayload>,
  profile?: PhysicsCertificateVerificationProfile,
): PhysicsCertificateVerificationResult["authenticity"] {
  const normalized = normalizeProfile(profile);
  const enforced = normalized.authenticityRequired;
  const reasonCodes: string[] = [];

  const signaturePresent = typeof cert.signature === "string" && cert.signature.trim().length > 0;
  const signatureValid = signaturePresent;
  if (!signaturePresent) {
    reasonCodes.push("signature_missing");
  }

  const signerKeyId = cert.header.signer?.keyId?.trim() ? cert.header.signer.keyId.trim() : null;
  if (!signerKeyId) {
    reasonCodes.push("signer_key_id_missing");
  }

  const hasTrustedSignerPolicy = normalized.trustedSignerKeyIds.length > 0;
  const signerTrusted =
    signerKeyId !== null &&
    (!hasTrustedSignerPolicy || normalized.trustedSignerKeyIds.includes(signerKeyId));

  if (signerKeyId && hasTrustedSignerPolicy && !signerTrusted) {
    reasonCodes.push("signer_key_id_untrusted");
  }

  const baseAuthenticityOk = signaturePresent && signatureValid && signerKeyId !== null && signerTrusted;
  const ok = enforced ? baseAuthenticityOk : true;

  return {
    ok,
    enforced,
    consequence: normalized.authenticityConsequence,
    signaturePresent,
    signatureValid,
    signerKeyId,
    signerTrusted,
    reasonCodes,
  };
}

export function verifyPhysicsCertificate<TPayload>(
  cert: PhysicsCertificate<TPayload>,
  profile?: PhysicsCertificateVerificationProfile,
): PhysicsCertificateVerificationResult {
  const integrity = { ok: verifyIntegrity(cert) };
  const authenticity = verifyAuthenticity(cert, profile);
  return {
    integrity,
    authenticity,
    overallOk: integrity.ok && authenticity.ok,
  };
}

export function verifyCertificateIntegrity(cert: WarpViabilityCertificate): boolean {
  return verifyPhysicsCertificate(cert).integrity.ok;
}

const indexConstraints = (constraints: ConstraintResult[]): Map<string, ConstraintResult> => {
  const map = new Map<string, ConstraintResult>();
  for (const entry of constraints) {
    map.set(entry.id, entry);
  }
  return map;
};

export async function recheckWarpViabilityCertificate(cert: WarpViabilityCertificate): Promise<CertificateRecheckResult> {
  const verification = verifyPhysicsCertificate(cert);
  const integrityOk = verification.integrity.ok;

  const fresh = await evaluateWarpViability(cert.payload.config);
  const diffs: CertificateDifference[] = [];

  // compare snapshot scalars
  const oldSnap = cert.payload.snapshot ?? {};
  const newSnap = fresh.snapshot ?? {};

  const keys = new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)]);
  for (const k of keys) {
    const a = (oldSnap as any)[k];
    const b = (newSnap as any)[k];
    const same =
      a === b ||
      (a && b && typeof a === "object" && typeof b === "object" && canonicalJson(a) === canonicalJson(b));
    if (!same) {
      if (k === "TS_ratio" && isFiniteNumber(a) && isFiniteNumber(b)) {
        const rel = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1);
        if (rel < 0.01) {
          diffs.push({ field: "warning.ts_ratio_jitter", oldValue: a, newValue: b });
          continue;
        }
      }
      diffs.push({ field: `snapshot.${k}`, oldValue: a, newValue: b });
    }
  }

  // compare high-level status
  if (cert.payload.status !== fresh.status) {
    diffs.push({
      field: "status",
      oldValue: cert.payload.status,
      newValue: fresh.status,
    });
  }

  // compare constraints by id
  const oldConstraints = indexConstraints(cert.payload.constraints ?? []);
  const newConstraints = indexConstraints(fresh.constraints ?? []);
  const constraintIds = new Set([...oldConstraints.keys(), ...newConstraints.keys()]);
  for (const id of constraintIds) {
    const a = oldConstraints.get(id);
    const b = newConstraints.get(id);
    if (!a || !b) {
      diffs.push({ field: `constraints.${id}`, oldValue: a, newValue: b });
      continue;
    }
    if (a.passed !== b.passed || a.margin !== b.margin || a.lhs !== b.lhs || a.rhs !== b.rhs) {
      diffs.push({
        field: `constraints.${id}`,
        oldValue: { passed: a.passed, lhs: a.lhs, rhs: a.rhs, margin: a.margin },
        newValue: { passed: b.passed, lhs: b.lhs, rhs: b.rhs, margin: b.margin },
      });
    }
  }

  // mitigation hints
  if (canonicalJson(cert.payload.mitigation ?? null) !== canonicalJson(fresh.mitigation ?? null)) {
    diffs.push({
      field: "mitigation",
      oldValue: cert.payload.mitigation,
      newValue: fresh.mitigation,
    });
  }

  const nonWarningDiffs = diffs.filter((d) => !String(d.field).startsWith("warning."));
  const physicsOk = nonWarningDiffs.length === 0;

  return { integrityOk, physicsOk, differences: diffs.length ? diffs : undefined };
}


export type RoboticsSafetyCertificate = {
  mode: "robotics-safety-v1";
  checks: Array<{
    id: string;
    pass: boolean;
    value: number;
    limit: string;
    severity: "HARD" | "SOFT";
  }>;
  certificateHash: string;
  signature?: string;
  signer?: {
    keyId: string;
  };
};

export function verifyRoboticsSafetyCertificateIntegrity(
  cert: RoboticsSafetyCertificate,
): boolean {
  const payload = {
    mode: cert.mode,
    checks: cert.checks,
  };
  const expected = hashString(JSON.stringify(payload));
  return expected === cert.certificateHash;
}

export function verifyRoboticsSafetyCertificate(
  cert: RoboticsSafetyCertificate,
  profile?: PhysicsCertificateVerificationProfile,
): PhysicsCertificateVerificationResult {
  const normalizedCert: PhysicsCertificate<{ mode: string; checks: RoboticsSafetyCertificate["checks"] }> = {
    header: {
      id: "robotics-safety",
      kind: "stress-energy-check",
      issuedAt: new Date(0).toISOString(),
      issuer: "robotics/safety-adapter",
      signer: cert.signer,
    },
    payload: {
      mode: cert.mode,
      checks: cert.checks,
    },
    payloadHash: hashString(canonicalJson({ mode: cert.mode, checks: cert.checks })),
    signature: cert.signature,
  };

  const authenticity = verifyAuthenticity(normalizedCert, profile);
  const integrity = { ok: verifyRoboticsSafetyCertificateIntegrity(cert) };
  return {
    integrity,
    authenticity,
    overallOk: integrity.ok && authenticity.ok,
  };
}
