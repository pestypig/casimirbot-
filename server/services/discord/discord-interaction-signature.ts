import crypto from "node:crypto";
import type { Request } from "express";

type RawBodyRequest = Request & { rawBody?: Buffer };

const DISCORD_SIGNATURE_HEADER = "x-signature-ed25519";
const DISCORD_TIMESTAMP_HEADER = "x-signature-timestamp";

const ED25519_SPKI_DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export function getDiscordRawRequestBody(req: Request): Buffer | null {
  const rawBody = (req as RawBodyRequest).rawBody;
  if (Buffer.isBuffer(rawBody)) return rawBody;
  return null;
}

export function buildDiscordEd25519PublicKey(publicKeyHex: string): crypto.KeyObject {
  const normalized = normalize(publicKeyHex);
  if (!/^[a-f0-9]{64}$/i.test(normalized)) {
    throw new Error("DISCORD_PUBLIC_KEY must be a 32-byte hex Ed25519 public key.");
  }
  return crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_DER_PREFIX, Buffer.from(normalized, "hex")]),
    format: "der",
    type: "spki",
  });
}

export function verifyDiscordInteractionSignature(input: {
  publicKeyHex?: string | null;
  timestamp?: string | null;
  signature?: string | null;
  rawBody?: Buffer | null;
}): { ok: true } | { ok: false; reason: string } {
  const publicKeyHex = normalize(input.publicKeyHex);
  const timestamp = normalize(input.timestamp);
  const signature = normalize(input.signature);
  const rawBody = input.rawBody;
  if (!publicKeyHex) return { ok: false, reason: "missing_public_key" };
  if (!timestamp || !signature) return { ok: false, reason: "missing_signature_headers" };
  if (!rawBody) return { ok: false, reason: "missing_raw_body" };
  if (!/^[a-f0-9]+$/i.test(signature) || signature.length !== 128) {
    return { ok: false, reason: "invalid_signature_format" };
  }
  try {
    const key = buildDiscordEd25519PublicKey(publicKeyHex);
    const message = Buffer.concat([Buffer.from(timestamp, "utf8"), rawBody]);
    const ok = crypto.verify(null, message, key, Buffer.from(signature, "hex"));
    return ok ? { ok: true } : { ok: false, reason: "invalid_signature" };
  } catch {
    return { ok: false, reason: "signature_verification_failed" };
  }
}

export function verifyDiscordInteractionRequest(req: Request): { ok: true } | { ok: false; reason: string } {
  return verifyDiscordInteractionSignature({
    publicKeyHex: process.env.DISCORD_PUBLIC_KEY,
    timestamp: normalize(req.headers[DISCORD_TIMESTAMP_HEADER]),
    signature: normalize(req.headers[DISCORD_SIGNATURE_HEADER]),
    rawBody: getDiscordRawRequestBody(req),
  });
}
