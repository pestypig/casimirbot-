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

const LEGACY_VAULT_SCHEMA_VERSION =
  "casimir_desktop_provider_credential_key/1" as const;
const VAULT_SCHEMA_VERSION =
  "casimir_desktop_provider_credential_keyring/2" as const;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const MAX_RETIRED_KEYS = 2;

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

export type DesktopProviderCredentialKeyring = Readonly<{
  activeKey: string;
  retiredKeys: readonly string[];
}>;

type ParsedVault = Readonly<{
  keyring: DesktopProviderCredentialKeyring;
  migrated: boolean;
}>;

const parseVault = (raw: string): ParsedVault => {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed.schemaVersion === LEGACY_VAULT_SCHEMA_VERSION) {
    if (!isValidDesktopProviderCredentialKey(parsed.key)) {
      throw new Error("desktop_provider_credential_key_vault_invalid");
    }
    return {
      keyring: { activeKey: parsed.key, retiredKeys: [] },
      migrated: true,
    };
  }
  if (
    parsed.schemaVersion !== VAULT_SCHEMA_VERSION ||
    !isValidDesktopProviderCredentialKey(parsed.activeKey) ||
    !Array.isArray(parsed.retiredKeys) ||
    parsed.retiredKeys.length > MAX_RETIRED_KEYS ||
    !parsed.retiredKeys.every(isValidDesktopProviderCredentialKey) ||
    new Set([parsed.activeKey, ...parsed.retiredKeys]).size !==
      parsed.retiredKeys.length + 1
  ) {
    throw new Error("desktop_provider_credential_key_vault_invalid");
  }
  return {
    keyring: {
      activeKey: parsed.activeKey,
      retiredKeys: Object.freeze([...parsed.retiredKeys]),
    },
    migrated: false,
  };
};

export const resolveProviderCredentialKeyVaultPath = (
  userDataPath: string,
): string => path.join(
  path.resolve(userDataPath),
  "brokerage",
  "provider-credential-key.dpapi",
);

const writeProtectedKeyring = (input: {
  vaultPath: string;
  storage: ProviderCredentialKeyStoragePort;
  keyring: DesktopProviderCredentialKeyring;
}): void => {
  const encrypted = input.storage.encryptString(JSON.stringify({
    schemaVersion: VAULT_SCHEMA_VERSION,
    activeKey: input.keyring.activeKey,
    retiredKeys: input.keyring.retiredKeys,
  }));
  mkdirSync(path.dirname(input.vaultPath), { recursive: true });
  const temporaryPath = `${input.vaultPath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    writeFileSync(temporaryPath, encrypted, { mode: 0o600, flag: "wx" });
    renameSync(temporaryPath, input.vaultPath);
  } catch (error) {
    rmSync(temporaryPath, { force: true });
    throw error;
  }
};

export const loadOrCreateDesktopProviderCredentialKeyring = (input: {
  userDataPath: string;
  storage: ProviderCredentialKeyStoragePort;
  configuredKey?: string;
}): DesktopProviderCredentialKeyring => {
  if (!input.storage.isEncryptionAvailable()) {
    throw new Error("desktop_provider_credential_key_vault_unavailable");
  }
  const vaultPath = resolveProviderCredentialKeyVaultPath(input.userDataPath);
  if (existsSync(vaultPath)) {
    try {
      const parsed = parseVault(
        input.storage.decryptString(readFileSync(vaultPath)),
      );
      if (parsed.migrated) {
        writeProtectedKeyring({
          vaultPath,
          storage: input.storage,
          keyring: parsed.keyring,
        });
      }
      return parsed.keyring;
    } catch {
      throw new Error("desktop_provider_credential_key_vault_invalid");
    }
  }

  const configured = input.configuredKey?.trim() ?? "";
  if (configured && !isValidDesktopProviderCredentialKey(configured)) {
    throw new Error("desktop_provider_credential_key_configured_invalid");
  }
  const key = configured || randomBytes(32).toString("base64url");
  const keyring = { activeKey: key, retiredKeys: [] } as const;
  writeProtectedKeyring({ vaultPath, storage: input.storage, keyring });
  return keyring;
};

export const loadOrCreateDesktopProviderCredentialKey = (input: {
  userDataPath: string;
  storage: ProviderCredentialKeyStoragePort;
  configuredKey?: string;
}): string => loadOrCreateDesktopProviderCredentialKeyring(input).activeKey;

export const rotateDesktopProviderCredentialKey = (input: {
  userDataPath: string;
  storage: ProviderCredentialKeyStoragePort;
}): DesktopProviderCredentialKeyring => {
  const current = loadOrCreateDesktopProviderCredentialKeyring(input);
  const next = {
    activeKey: randomBytes(32).toString("base64url"),
    retiredKeys: Object.freeze([
      current.activeKey,
      ...current.retiredKeys,
    ].slice(0, MAX_RETIRED_KEYS)),
  };
  writeProtectedKeyring({
    vaultPath: resolveProviderCredentialKeyVaultPath(input.userDataPath),
    storage: input.storage,
    keyring: next,
  });
  return next;
};
