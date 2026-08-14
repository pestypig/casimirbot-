import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const VAULT_SCHEMA_VERSION =
  "casimir_desktop_provider_credential_key/1" as const;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export type ProviderCredentialKeyStoragePort = Readonly<{
  isEncryptionAvailable: () => boolean;
  encryptString: (value: string) => Buffer;
  decryptString: (value: Buffer) => string;
}>;

export const isValidDesktopProviderCredentialKey = (
  value: unknown,
): value is string => {
  if (typeof value !== "string" || !KEY_PATTERN.test(value)) return false;
  try {
    return Buffer.from(value, "base64url").length === 32;
  } catch {
    return false;
  }
};

const parseVault = (raw: string): string => {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed.schemaVersion !== VAULT_SCHEMA_VERSION ||
    !isValidDesktopProviderCredentialKey(parsed.key)
  ) {
    throw new Error("desktop_provider_credential_key_vault_invalid");
  }
  return parsed.key;
};

export const resolveProviderCredentialKeyVaultPath = (
  userDataPath: string,
): string => path.join(
  path.resolve(userDataPath),
  "brokerage",
  "provider-credential-key.dpapi",
);

export const loadOrCreateDesktopProviderCredentialKey = (input: {
  userDataPath: string;
  storage: ProviderCredentialKeyStoragePort;
  configuredKey?: string;
}): string => {
  if (!input.storage.isEncryptionAvailable()) {
    throw new Error("desktop_provider_credential_key_vault_unavailable");
  }
  const vaultPath = resolveProviderCredentialKeyVaultPath(input.userDataPath);
  if (existsSync(vaultPath)) {
    try {
      return parseVault(input.storage.decryptString(readFileSync(vaultPath)));
    } catch {
      throw new Error("desktop_provider_credential_key_vault_invalid");
    }
  }

  const configured = input.configuredKey?.trim() ?? "";
  if (configured && !isValidDesktopProviderCredentialKey(configured)) {
    throw new Error("desktop_provider_credential_key_configured_invalid");
  }
  const key = configured || randomBytes(32).toString("base64url");
  const encrypted = input.storage.encryptString(JSON.stringify({
    schemaVersion: VAULT_SCHEMA_VERSION,
    key,
  }));
  mkdirSync(path.dirname(vaultPath), { recursive: true });
  const temporaryPath = `${vaultPath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    writeFileSync(temporaryPath, encrypted, { mode: 0o600, flag: "wx" });
    renameSync(temporaryPath, vaultPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
  return key;
};
