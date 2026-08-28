import crypto from "node:crypto";
import { z } from "zod";

const receiptPayloadSchema = z.object({
  schema: z.literal("helix.local_supervisor_ownership_receipt.v1"),
  workspace_ref: z.string().regex(/^workspace:[a-f0-9]{64}$/u),
  boot_nonce: z.string().regex(/^[A-Za-z0-9_-]{24,160}$/u),
  issued_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  supervisor_mode: z.literal("external_keyed_launcher"),
}).strict();

const envelopeSchema = z.object({
  payload: z.string().min(1).max(4096),
  signature: z.string().regex(/^[A-Za-z0-9_-]{40,512}$/u),
}).strict();

const decodeBase64Url = (value: string): Buffer => Buffer.from(value, "base64url");

export type VerifiedHelixLocalSupervisorOwnershipReceipt = Readonly<{
  bootNonce: string;
  workspaceRef: string;
  expiresAt: string;
}>;

export const verifyHelixLocalSupervisorOwnershipReceipt = (input: {
  encodedReceipt: string | undefined;
  trustedPublicKeysPem: string | undefined;
  trustedPublicKeysSpkiBase64Url?: string | undefined;
  expectedWorkspaceRef: string;
  now?: Date;
}): VerifiedHelixLocalSupervisorOwnershipReceipt | null => {
  try {
    if (!input.encodedReceipt?.trim() ||
        (!input.trustedPublicKeysPem?.trim() &&
         !input.trustedPublicKeysSpkiBase64Url?.trim())) return null;
    const envelope = envelopeSchema.parse(JSON.parse(
      decodeBase64Url(input.encodedReceipt.trim()).toString("utf8"),
    ));
    const payloadBytes = decodeBase64Url(envelope.payload);
    const payload = receiptPayloadSchema.parse(JSON.parse(payloadBytes.toString("utf8")));
    if (payload.workspace_ref !== input.expectedWorkspaceRef) return null;
    const nowMs = (input.now ?? new Date()).getTime();
    const issuedMs = Date.parse(payload.issued_at);
    const expiresMs = Date.parse(payload.expires_at);
    if (issuedMs > nowMs + 30_000 || expiresMs <= nowMs || expiresMs - issuedMs > 300_000) return null;
    const pemKeys = (input.trustedPublicKeysPem ?? "")
      .split(/\n(?=-----BEGIN PUBLIC KEY-----)/u)
      .map((value) => value.trim())
      .filter(Boolean);
    const spkiKeys = (input.trustedPublicKeysSpkiBase64Url ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^[A-Za-z0-9_-]{40,2048}$/u.test(value));
    const signature = decodeBase64Url(envelope.signature);
    const verified = pemKeys.some((key) => {
      try { return crypto.verify(null, payloadBytes, key, signature); } catch { return false; }
    }) || spkiKeys.some((key) => {
      try {
        return crypto.verify(null, payloadBytes, crypto.createPublicKey({
          key: decodeBase64Url(key),
          format: "der",
          type: "spki",
        }), signature);
      } catch {
        return false;
      }
    });
    return verified ? Object.freeze({
      bootNonce: payload.boot_nonce,
      workspaceRef: payload.workspace_ref,
      expiresAt: payload.expires_at,
    }) : null;
  } catch {
    return null;
  }
};
