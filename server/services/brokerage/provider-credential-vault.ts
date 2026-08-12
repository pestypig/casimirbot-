import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const ENVELOPE_VERSION = "v1" as const;

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export type ProviderCredentialEnvelope = Readonly<{
  encryptedValue: string;
  keyId: string;
  algorithm: typeof ALGORITHM;
}>;

const resolveProviderCredentialKey = (): { key: Buffer; keyId: string } => {
  const configured = clean(
    process.env.HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
  );
  if (configured) {
    const decoded = Buffer.from(configured, "base64url");
    const key = decoded.length >= 32
      ? decoded.subarray(0, 32)
      : crypto.createHash("sha256").update(configured).digest();
    return {
      key,
      keyId: `env:${crypto
        .createHash("sha256")
        .update(key)
        .digest("base64url")
        .slice(0, 12)}`,
    };
  }
  if (clean(process.env.NODE_ENV).toLowerCase() === "production") {
    throw new Error("provider_credential_encryption_key_missing");
  }
  return {
    key: crypto
      .createHash("sha256")
      .update("casimirbot-local-provider-credential-dev-key")
      .digest(),
    keyId: "dev-local",
  };
};

export const encryptProviderCredential = (
  value: unknown,
  additionalAuthenticatedData: string,
): ProviderCredentialEnvelope => {
  const aad = clean(additionalAuthenticatedData);
  if (!aad) throw new Error("provider_credential_aad_required");
  const { key, keyId } = resolveProviderCredentialKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    encryptedValue: [
      ENVELOPE_VERSION,
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      encrypted.toString("base64url"),
    ].join(":"),
    keyId,
    algorithm: ALGORITHM,
  };
};

export const decryptProviderCredential = <T>(
  encryptedValue: string,
  additionalAuthenticatedData: string,
): T => {
  const aad = clean(additionalAuthenticatedData);
  if (!aad) throw new Error("provider_credential_aad_required");
  const parts = encryptedValue.split(":");
  if (parts.length !== 4 || parts[0] !== ENVELOPE_VERSION) {
    throw new Error("provider_credential_envelope_invalid");
  }
  const { key } = resolveProviderCredentialKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(parts[1], "base64url"),
  );
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as T;
};

