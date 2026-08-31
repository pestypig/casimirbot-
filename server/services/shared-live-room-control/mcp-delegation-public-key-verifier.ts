import { createPublicKey, verify as verifySignature, type KeyObject } from "node:crypto";
import { buildHelixSharedLiveRoomMcpDelegationSignatureMessageV1 } from "@shared/contracts/helix-shared-live-room-mcp-delegation.v1";
import type { SharedLiveRoomMcpDelegationAuthenticityVerifier } from "./mcp-delegation-verifier";

export type TrustedSharedLiveRoomMcpDelegationPublicKey = {
  issuer: string;
  keyId: string;
  algorithm: "ed25519";
  publicKeyPem: string;
};

export const createTrustedSharedLiveRoomMcpDelegationEd25519Verifier = (input: {
  trustedPublicKeys: readonly TrustedSharedLiveRoomMcpDelegationPublicKey[];
}): SharedLiveRoomMcpDelegationAuthenticityVerifier => {
  const keys = new Map<string, { key: KeyObject | null; issue: string | null }[]>();
  const issuers = new Set<string>();
  for (const entry of input.trustedPublicKeys) {
    if (entry.issuer.trim() === entry.issuer && entry.issuer) issuers.add(entry.issuer);
    let parsed: KeyObject | null = null;
    let issue: string | null = null;
    try {
      parsed = createPublicKey(entry.publicKeyPem);
      if (entry.algorithm !== "ed25519" || parsed.type !== "public" || parsed.asymmetricKeyType !== "ed25519") {
        parsed = null;
        issue = "room_mcp_delegation_public_key_type_invalid";
      }
    } catch {
      issue = "room_mcp_delegation_public_key_invalid";
    }
    const identity = JSON.stringify([entry.issuer, entry.keyId]);
    keys.set(identity, [...(keys.get(identity) ?? []), { key: parsed, issue }]);
  }
  return ({ receipt, signedPayloadSha256 }) => {
    if (!issuers.has(receipt.issuer)) return { ok: false, issues: ["room_mcp_delegation_issuer_untrusted"] };
    const candidates = keys.get(JSON.stringify([receipt.issuer, receipt.keyId]));
    if (!candidates?.length) return { ok: false, issues: ["room_mcp_delegation_key_untrusted"] };
    if (candidates.length !== 1) return { ok: false, issues: ["room_mcp_delegation_key_registry_ambiguous"] };
    const candidate = candidates[0];
    if (!candidate.key) return { ok: false, issues: [candidate.issue ?? "room_mcp_delegation_public_key_invalid"] };
    if (signedPayloadSha256 !== receipt.signedPayloadSha256 || !/^[a-f0-9]{64}$/.test(signedPayloadSha256)) return { ok: false, issues: ["room_mcp_delegation_signed_payload_invalid"] };
    if (!/^[A-Za-z0-9_-]{86}$/.test(receipt.signature)) return { ok: false, issues: ["room_mcp_delegation_signature_encoding_invalid"] };
    const signature = Buffer.from(receipt.signature, "base64url");
    if (signature.byteLength !== 64 || signature.toString("base64url") !== receipt.signature) return { ok: false, issues: ["room_mcp_delegation_signature_encoding_invalid"] };
    try {
      return verifySignature(null, buildHelixSharedLiveRoomMcpDelegationSignatureMessageV1(signedPayloadSha256), candidate.key, signature)
        ? { ok: true }
        : { ok: false, issues: ["room_mcp_delegation_signature_invalid"] };
    } catch {
      return { ok: false, issues: ["room_mcp_delegation_signature_invalid"] };
    }
  };
};
