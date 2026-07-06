import crypto from "node:crypto";

const SCRYPT_PREFIX = "scrypt";
const DEFAULT_KEYLEN = 64;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const normalizeAccountEmail = (value: unknown): string =>
  normalize(value).toLowerCase();

export const isValidAccountEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidAccountPassword = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 10;

const scryptDigest = (
  password: string,
  salt: string,
  keylen = DEFAULT_KEYLEN,
): Buffer => crypto.scryptSync(password, salt, keylen);

export function createPasswordAccountHash(input: {
  password: string;
  salt?: string;
}): string {
  const salt = normalize(input.salt) || crypto.randomBytes(16).toString("base64url");
  const digest = scryptDigest(input.password, salt);
  return `${SCRYPT_PREFIX}$${salt}$${digest.toString("base64url")}`;
}

export function verifyPasswordAccountHash(input: {
  password: string;
  encoded_hash: string;
}): boolean {
  const parts = input.encoded_hash.split("$");
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) return false;
  const [, salt, digest] = parts;
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, "base64url");
  if (expected.length === 0) return false;
  const actual = scryptDigest(input.password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function publicProfileIdForEmail(email: string): string {
  const digest = crypto.createHash("sha256").update(email).digest("base64url").slice(0, 32);
  return `user:${digest}`;
}
