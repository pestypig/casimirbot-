import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const ENVELOPE_VERSION = "v1" as const;
const LOCAL_DEVELOPMENT_KEY_ID = "dev-local" as const;
const NATIVE_BROKER_SCHEMA =
  "casimir_desktop_provider_credential_broker/1" as const;
const NATIVE_BROKER_TIMEOUT_MS = 5_000;

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export type ProviderCredentialEnvelope = Readonly<{
  encryptedValue: string;
  keyId: string;
  algorithm: typeof ALGORITHM;
}>;

type NativeBrokerConfig = Readonly<{
  origin: string;
  token: string;
}>;

export const isValidProviderCredentialEncryptionKey = (
  value: unknown,
): boolean => {
  const configured = clean(value);
  if (!/^[A-Za-z0-9_-]{43}$/u.test(configured)) return false;
  try {
    return Buffer.from(configured, "base64url").length === 32;
  } catch {
    return false;
  }
};

const localDevelopmentProviderCredentialKey = (): Buffer => crypto
  .createHash("sha256")
  .update("casimirbot-local-provider-credential-dev-key")
  .digest();

const resolveNativeBrokerConfig = (): NativeBrokerConfig | null => {
  const originValue = clean(
    process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN,
  );
  const token = clean(process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN);
  if (!originValue && !token) return null;
  if (!originValue || !token) {
    throw new Error("provider_credential_broker_config_incomplete");
  }
  const origin = new URL(originValue);
  if (
    origin.protocol !== "http:" ||
    origin.hostname !== "127.0.0.1" ||
    !origin.port ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("provider_credential_broker_origin_invalid");
  }
  if (
    !/^[A-Za-z0-9_-]{43}$/u.test(token) ||
    Buffer.from(token, "base64url").length !== 32
  ) {
    throw new Error("provider_credential_broker_token_invalid");
  }
  return { origin: origin.origin, token };
};

const callNativeBroker = async <T>(
  route: "/v1/key-id" | "/v1/encrypt" | "/v1/decrypt",
  body: Record<string, unknown>,
): Promise<T> => {
  const broker = resolveNativeBrokerConfig();
  if (!broker) throw new Error("provider_credential_broker_unavailable");
  let response: Response;
  try {
    response = await fetch(`${broker.origin}${route}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${broker.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(NATIVE_BROKER_TIMEOUT_MS),
    });
  } catch {
    throw new Error("provider_credential_broker_unavailable");
  }
  const result = await response.json().catch(() => null) as
    | Record<string, unknown>
    | null;
  if (
    !response.ok ||
    result?.schema !== NATIVE_BROKER_SCHEMA ||
    result.ok !== true
  ) {
    const reason = typeof result?.error === "string"
      ? result.error
      : "provider_credential_broker_failed";
    throw new Error(reason);
  }
  return result as T;
};

const resolveProviderCredentialKey = (): { key: Buffer; keyId: string } => {
  const configured = clean(
    process.env.HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
  );
  if (configured) {
    if (!isValidProviderCredentialEncryptionKey(configured)) {
      throw new Error("provider_credential_encryption_key_invalid");
    }
    const decoded = Buffer.from(configured, "base64url");
    const key = decoded;
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
    key: localDevelopmentProviderCredentialKey(),
    keyId: LOCAL_DEVELOPMENT_KEY_ID,
  };
};

export const readProviderCredentialEncryptionKeyId = (): string =>
  resolveProviderCredentialKey().keyId;

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

const decryptProviderCredentialWithKey = <T>(
  encryptedValue: string,
  additionalAuthenticatedData: string,
  key: Buffer,
): T => {
  const aad = clean(additionalAuthenticatedData);
  if (!aad) throw new Error("provider_credential_aad_required");
  const parts = encryptedValue.split(":");
  if (parts.length !== 4 || parts[0] !== ENVELOPE_VERSION) {
    throw new Error("provider_credential_envelope_invalid");
  }
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

export const decryptProviderCredential = <T>(
  encryptedValue: string,
  additionalAuthenticatedData: string,
): T => decryptProviderCredentialWithKey(
  encryptedValue,
  additionalAuthenticatedData,
  resolveProviderCredentialKey().key,
);

export const decryptStoredProviderCredential = <T>(
  encryptedValue: string,
  additionalAuthenticatedData: string,
  storedKeyId: string,
): T => {
  const current = resolveProviderCredentialKey();
  if (clean(storedKeyId) === current.keyId) {
    return decryptProviderCredentialWithKey(
      encryptedValue,
      additionalAuthenticatedData,
      current.key,
    );
  }
  const localDevelopmentRotation =
    clean(storedKeyId) === LOCAL_DEVELOPMENT_KEY_ID &&
    current.keyId !== LOCAL_DEVELOPMENT_KEY_ID &&
    clean(process.env.NODE_ENV).toLowerCase() !== "production";
  if (!localDevelopmentRotation) {
    throw new Error("provider_credential_key_id_mismatch");
  }
  return decryptProviderCredentialWithKey(
    encryptedValue,
    additionalAuthenticatedData,
    localDevelopmentProviderCredentialKey(),
  );
};

export const readProviderCredentialEncryptionKeyIdForStorage = async ():
Promise<string> => {
  if (!resolveNativeBrokerConfig()) {
    return readProviderCredentialEncryptionKeyId();
  }
  const result = await callNativeBroker<{ keyId: string }>(
    "/v1/key-id",
    {},
  );
  if (typeof result.keyId !== "string" || !result.keyId.startsWith("native:")) {
    throw new Error("provider_credential_broker_response_invalid");
  }
  return result.keyId;
};

export const encryptProviderCredentialForStorage = async (
  value: unknown,
  additionalAuthenticatedData: string,
): Promise<ProviderCredentialEnvelope> => {
  const aad = clean(additionalAuthenticatedData);
  if (!aad) throw new Error("provider_credential_aad_required");
  if (!resolveNativeBrokerConfig()) {
    return encryptProviderCredential(value, aad);
  }
  const result = await callNativeBroker<{
    envelope: ProviderCredentialEnvelope;
  }>("/v1/encrypt", { value, aad });
  const envelope = result.envelope;
  if (
    !envelope ||
    typeof envelope.encryptedValue !== "string" ||
    !envelope.encryptedValue.startsWith("v2:") ||
    typeof envelope.keyId !== "string" ||
    !envelope.keyId.startsWith("native:") ||
    envelope.algorithm !== ALGORITHM
  ) {
    throw new Error("provider_credential_broker_response_invalid");
  }
  return envelope;
};

export const decryptStoredProviderCredentialForStorage = async <T>(
  encryptedValue: string,
  additionalAuthenticatedData: string,
  storedKeyId: string,
): Promise<T> => {
  const aad = clean(additionalAuthenticatedData);
  if (!aad) throw new Error("provider_credential_aad_required");
  if (!resolveNativeBrokerConfig()) {
    return decryptStoredProviderCredential<T>(
      encryptedValue,
      aad,
      storedKeyId,
    );
  }
  const result = await callNativeBroker<{ value: T }>("/v1/decrypt", {
    encryptedValue,
    aad,
    storedKeyId,
  });
  if (!("value" in result)) {
    throw new Error("provider_credential_broker_response_invalid");
  }
  return result.value;
};
