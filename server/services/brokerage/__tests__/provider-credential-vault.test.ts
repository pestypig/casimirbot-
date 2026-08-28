import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decryptProviderCredential,
  decryptStoredProviderCredential,
  encryptProviderCredential,
  readProviderCredentialEncryptionKeyId,
} from "../provider-credential-vault";

describe("provider credential vault", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("encrypts token bundles with authenticated owner/connection context", () => {
    vi.stubEnv(
      "HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY",
      crypto.randomBytes(32).toString("base64url"),
    );
    const aad = "robinhood-connection\nconnection:test\nprofile:owner";
    const bundle = {
      access_token: "access-token-that-must-stay-secret",
      refresh_token: "refresh-token-that-must-stay-secret",
    };
    const encrypted = encryptProviderCredential(bundle, aad);

    expect(encrypted.encryptedValue).toMatch(/^v1:/u);
    expect(encrypted.encryptedValue).not.toContain(bundle.access_token);
    expect(encrypted.encryptedValue).not.toContain(bundle.refresh_token);
    expect(decryptProviderCredential(encrypted.encryptedValue, aad)).toEqual(
      bundle,
    );
    expect(() => decryptProviderCredential(
      encrypted.encryptedValue,
      `${aad}\nwrong-owner`,
    )).toThrow();
  });

  it("fails closed without a production encryption key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", "");
    expect(() => encryptProviderCredential({ token: "secret" }, "owner"))
      .toThrow("provider_credential_encryption_key_missing");
  });

  it("rejects configured keys that are not exactly 32 base64url bytes", () => {
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", "short-secret");
    expect(() => encryptProviderCredential({ token: "secret" }, "owner"))
      .toThrow("provider_credential_encryption_key_invalid");
  });

  it("rotates an explicitly identified local-development envelope", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", "");
    const aad = "robinhood-connection\nconnection:test\nprofile:owner";
    const bundle = { access_token: "legacy-local-token" };
    const legacy = encryptProviderCredential(bundle, aad);
    expect(legacy.keyId).toBe("dev-local");

    vi.stubEnv(
      "HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY",
      crypto.randomBytes(32).toString("base64url"),
    );
    expect(readProviderCredentialEncryptionKeyId()).toMatch(/^env:/u);
    expect(decryptStoredProviderCredential(
      legacy.encryptedValue,
      aad,
      legacy.keyId,
    )).toEqual(bundle);
  });

  it("never admits the local-development fallback in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY", "");
    const aad = "robinhood-connection\nconnection:test\nprofile:owner";
    const legacy = encryptProviderCredential({ token: "legacy" }, aad);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY",
      crypto.randomBytes(32).toString("base64url"),
    );
    expect(() => decryptStoredProviderCredential(
      legacy.encryptedValue,
      aad,
      legacy.keyId,
    )).toThrow("provider_credential_key_id_mismatch");
  });
});
