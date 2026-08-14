import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isValidDesktopProviderCredentialKey,
  loadOrCreateDesktopProviderCredentialKey,
  resolveProviderCredentialKeyVaultPath,
  type ProviderCredentialKeyStoragePort,
} from "../apps/desktop/src/provider-credential-key";
import { buildDesktopServiceEnvironment } from
  "../apps/desktop/src/service-environment";

const roots: string[] = [];

const createRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "casimir-provider-key-"));
  roots.push(root);
  return root;
};

const createStorage = (): ProviderCredentialKeyStoragePort => ({
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(value, "utf8").map((byte) => byte ^ 0xa5),
  decryptString: (value) => {
    return Buffer.from(value).map((byte) => byte ^ 0xa5).toString("utf8");
  },
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("desktop provider credential key", () => {
  it("creates one protected key and reuses it across launches", () => {
    const root = createRoot();
    const storage = createStorage();
    const first = loadOrCreateDesktopProviderCredentialKey({
      userDataPath: root,
      storage,
    });
    const second = loadOrCreateDesktopProviderCredentialKey({
      userDataPath: root,
      storage,
    });

    expect(second).toBe(first);
    expect(isValidDesktopProviderCredentialKey(first)).toBe(true);
    const persisted = readFileSync(
      resolveProviderCredentialKeyVaultPath(root),
      "utf8",
    );
    expect(persisted).not.toContain(first);
  });

  it("migrates an existing valid deployment key into protected storage", () => {
    const root = createRoot();
    const configuredKey = Buffer.alloc(32, 7).toString("base64url");
    const resolved = loadOrCreateDesktopProviderCredentialKey({
      userDataPath: root,
      storage: createStorage(),
      configuredKey,
    });
    expect(resolved).toBe(configuredKey);
    expect(readFileSync(resolveProviderCredentialKeyVaultPath(root), "utf8"))
      .not.toContain(configuredKey);
  });

  it("fails closed when secure storage is unavailable or corrupt", () => {
    const unavailable = createRoot();
    expect(() => loadOrCreateDesktopProviderCredentialKey({
      userDataPath: unavailable,
      storage: {
        ...createStorage(),
        isEncryptionAvailable: () => false,
      },
    })).toThrow("desktop_provider_credential_key_vault_unavailable");

    const corrupt = createRoot();
    const vaultPath = resolveProviderCredentialKeyVaultPath(corrupt);
    mkdirSync(path.dirname(vaultPath), { recursive: true });
    writeFileSync(vaultPath, "not-protected", { flag: "wx" });
    expect(() => loadOrCreateDesktopProviderCredentialKey({
      userDataPath: corrupt,
      storage: createStorage(),
    })).toThrow("desktop_provider_credential_key_vault_invalid");
    expect(readFileSync(vaultPath, "utf8")).toBe("not-protected");
  });

  it("rejects an invalid configured key instead of silently replacing it", () => {
    expect(() => loadOrCreateDesktopProviderCredentialKey({
      userDataPath: createRoot(),
      storage: createStorage(),
      configuredKey: "short-secret",
    })).toThrow("desktop_provider_credential_key_configured_invalid");
  });

  it("passes only the explicit protected key to the service", () => {
    const key = Buffer.alloc(32, 3).toString("base64url");
    const environment = buildDesktopServiceEnvironment({
      processEnv: {
        SystemRoot: "C:\\Windows",
        HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY:
          Buffer.alloc(32, 9).toString("base64url"),
      },
      userDataPath: "C:\\Users\\test\\AppData\\Roaming\\CasimirBot",
      serviceOrigin: "http://127.0.0.1:32123",
      providerCredentialEncryptionKey: key,
    });

    expect(environment.HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY).toBe(key);
  });
});
