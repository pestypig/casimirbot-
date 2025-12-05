import crypto from "node:crypto";
import { canonicalJson } from "./warpViabilityCertificate";
import { evaluateWarpViability } from "./warpViability";
import type {
  CertificateDifference,
  CertificateRecheckResult,
  ConstraintResult,
  WarpViabilityCertificate,
} from "../types/warpViability";

function hashString(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export function verifyCertificateIntegrity(cert: WarpViabilityCertificate): boolean {
  const payloadStr = canonicalJson(cert.payload);
  const expectedPayloadHash = hashString(payloadStr);
  if (expectedPayloadHash !== cert.payloadHash) {
    return false;
  }

  const base = {
    header: cert.header,
    payload: cert.payload,
    payloadHash: cert.payloadHash,
  };
  const certStr = canonicalJson(base);
  const expectedCertHash = hashString(certStr);

  return expectedCertHash === cert.certificateHash;
}

const indexConstraints = (constraints: ConstraintResult[]): Map<string, ConstraintResult> => {
  const map = new Map<string, ConstraintResult>();
  for (const entry of constraints) {
    map.set(entry.id, entry);
  }
  return map;
};

export async function recheckWarpViabilityCertificate(cert: WarpViabilityCertificate): Promise<CertificateRecheckResult> {
  const integrityOk = verifyCertificateIntegrity(cert);

  const fresh = await evaluateWarpViability(cert.payload.config);
  const diffs: CertificateDifference[] = [];

  // compare snapshot scalars
  const oldSnap = cert.payload.snapshot ?? {};
  const newSnap = fresh.snapshot ?? {};

  const keys = new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)]);
  for (const k of keys) {
    const a = (oldSnap as any)[k];
    const b = (newSnap as any)[k];
    if (a !== b) {
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

  const physicsOk = diffs.length === 0;

  return { integrityOk, physicsOk, differences: diffs.length ? diffs : undefined };
}
