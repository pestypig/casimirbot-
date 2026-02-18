export type CertificateKind = "warp-viability" | "warp-simulation" | "stress-energy-check";

export interface PhysicsCertificateHeader {
  id: string; // stable identifier (e.g., UUID or hash)
  kind: CertificateKind;
  issuedAt: string; // ISO timestamp
  issuer: string; // e.g., "server/energy-pipeline", "ci/theory-checks"
  gitCommit?: string;
  pipelineVersion?: string;
  signer?: {
    keyId: string;
  };
}

export interface PhysicsCertificateVerificationProfile {
  hardened?: boolean;
  trustedSignerKeyIds?: string[];
  authenticityConsequence?: "low" | "medium" | "high";
  authenticityRequired?: boolean;
}

export interface PhysicsCertificateVerificationResult {
  integrity: {
    ok: boolean;
  };
  authenticity: {
    ok: boolean;
    enforced: boolean;
    consequence: "low" | "medium" | "high";
    signaturePresent: boolean;
    signatureValid: boolean;
    signerKeyId: string | null;
    signerTrusted: boolean;
    reasonCodes: string[];
  };
  overallOk: boolean;
}

export interface PhysicsCertificate<TPayload = unknown> {
  header: PhysicsCertificateHeader;
  payload: TPayload;
  // Integrity: hash over canonical payload
  payloadHash: string; // e.g., SHA-256 of canonical JSON(payload)
  // Optional: full-certificate hash or signature if you want
  certificateHash?: string;
  signature?: string;
}
