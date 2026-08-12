import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESKTOP_LOCAL_DATABASE_RELATIVE_PATH,
  buildDesktopServiceEnvironment,
  resolveDesktopUserDataOverride,
} from "../apps/desktop/src/service-environment";

describe("desktop service environment", () => {
  it("inherits only the Windows process allowlist", () => {
    const environment = buildDesktopServiceEnvironment({
      processEnv: {
        SystemRoot: "C:\\Windows",
        PATH: "C:\\Windows\\System32",
        DATABASE_URL: "postgres://must-not-cross-the-boundary",
        OPENAI_API_KEY: "must-not-cross-the-boundary",
        NODE_OPTIONS: "--require=must-not-cross-the-boundary",
        HELIX_LOCAL_DB_PATH: "C:\\untrusted\\override.json",
      },
      userDataPath: "C:\\Users\\person\\AppData\\Roaming\\CasimirBot",
      serviceOrigin: "http://127.0.0.1:43121",
    });

    expect(environment.SystemRoot).toBe("C:\\Windows");
    expect(environment.PATH).toBe("C:\\Windows\\System32");
    expect(environment.DATABASE_URL).toBeUndefined();
    expect(environment.OPENAI_API_KEY).toBeUndefined();
    expect(environment.NODE_OPTIONS).toBeUndefined();
    expect(environment.HELIX_LOCAL_DB_PATH).not.toBe(
      "C:\\untrusted\\override.json",
    );
  });

  it("inherits only the exact developer identity allowlist for pilot policy", () => {
    const environment = buildDesktopServiceEnvironment({
      processEnv: {
        HELIX_DEVELOPER_PROFILE_IDS:
          " profile:developer-one,developer@example.com ",
        HELIX_LOCAL_PROFILE_PASSWORD_HASH: "must-not-flow",
        HELIX_LOCAL_PROFILE_PASSWORD: "must-not-flow",
      },
      userDataPath: "C:\\Users\\person\\AppData\\Roaming\\CasimirBot",
      serviceOrigin: "http://127.0.0.1:43121",
    });

    expect(environment.HELIX_DEVELOPER_PROFILE_IDS).toBe(
      "profile:developer-one,developer@example.com",
    );
    expect(environment.HELIX_LOCAL_PROFILE_PASSWORD_HASH).toBeUndefined();
    expect(environment.HELIX_LOCAL_PROFILE_PASSWORD).toBeUndefined();
  });

  it("pins local state beneath Electron userData with immediate persistence", () => {
    const userDataPath = path.resolve("C:\\Users\\person\\CasimirBot");
    const environment = buildDesktopServiceEnvironment({
      processEnv: {},
      userDataPath,
      serviceOrigin: "http://127.0.0.1:43121",
    });
    const databasePath = environment.HELIX_LOCAL_DB_PATH!;
    const relative = path.relative(userDataPath, databasePath);

    expect(relative).toBe(DESKTOP_LOCAL_DATABASE_RELATIVE_PATH);
    expect(relative.startsWith("..")).toBe(false);
    expect(path.isAbsolute(relative)).toBe(false);
    expect(environment.HELIX_LOCAL_PG_MEM_PERSIST).toBe("1");
    expect(environment.HELIX_LOCAL_PG_MEM_WRITE_MODE).toBe("immediate");
  });

  it("admits public OAuth verifier metadata without inheriting OAuth or admin secrets", () => {
    const environment = buildDesktopServiceEnvironment({
      processEnv: {
        SystemRoot: "C:\\Windows",
        HELIX_AGENT_OAUTH_ISSUER: "https://tenant.auth0.com/",
        HELIX_AGENT_OAUTH_AUDIENCE: "https://casimirbot.com/mcp",
        HELIX_AGENT_OAUTH_JWKS_URL:
          "https://tenant.auth0.com/.well-known/jwks.json",
        HELIX_AGENT_OAUTH_PROVIDER: "auth0",
        HELIX_AGENT_OAUTH_ALGORITHMS: "RS256",
        HELIX_AGENT_OAUTH_TENANT_CLAIM:
          "https://casimirbot.com/tenant_id",
        HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID: "nativeClientId_123456",
        HELIX_AGENT_OAUTH_LINK_SCOPE: "openid profile",
        CASIMIR_PUBLIC_BASE_URL: "https://casimirbot.com",
        OPENAI_API_KEY: "must-not-flow",
        OPENAI_ADMIN_KEY: "must-not-flow",
        AUTH0_CLIENT_SECRET: "must-not-flow",
      },
      userDataPath: "C:\\Users\\test\\AppData\\Roaming\\CasimirBot",
      serviceOrigin: "http://127.0.0.1:43121",
    });
    expect(environment).toMatchObject({
      HELIX_AGENT_OAUTH_ISSUER: "https://tenant.auth0.com/",
      HELIX_AGENT_OAUTH_AUDIENCE: "https://casimirbot.com/mcp",
      HELIX_AGENT_OAUTH_PROVIDER: "auth0",
      HELIX_AGENT_OAUTH_TENANT_CLAIM:
        "https://casimirbot.com/tenant_id",
      HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID: "nativeClientId_123456",
      HELIX_AGENT_OAUTH_LINK_SCOPE: "openid profile",
      CASIMIR_PUBLIC_BASE_URL: "http://127.0.0.1:43121",
    });
    expect(environment).not.toHaveProperty("OPENAI_API_KEY");
    expect(environment).not.toHaveProperty("OPENAI_ADMIN_KEY");
    expect(environment).not.toHaveProperty("AUTH0_CLIENT_SECRET");
  });

  it("pins OAuth discovery to the exact private desktop origin", () => {
    const environment = buildDesktopServiceEnvironment({
      processEnv: {
        CASIMIR_PUBLIC_BASE_URL: "https://stale-public-site.example",
      },
      userDataPath: "C:\\Users\\test\\AppData\\Roaming\\CasimirBot",
      serviceOrigin: "http://127.0.0.1:43121",
    });

    expect(environment.CASIMIR_PUBLIC_BASE_URL).toBe(
      "http://127.0.0.1:43121",
    );
    expect(() =>
      buildDesktopServiceEnvironment({
        processEnv: {},
        userDataPath: "C:\\Users\\test\\AppData\\Roaming\\CasimirBot",
        serviceOrigin: "https://casimirbot.com",
      }),
    ).toThrow(/exact HTTP 127\.0\.0\.1 origin/);
  });

  it("rejects an empty per-user data root", () => {
    expect(() =>
      buildDesktopServiceEnvironment({
        processEnv: {},
        userDataPath: "  ",
        serviceOrigin: "http://127.0.0.1:43121",
      }),
    ).toThrow(/userData path is required/);
  });

  it("accepts only absolute local-drive user-data overrides", () => {
    expect(resolveDesktopUserDataOverride("  ")).toBeNull();
    expect(
      resolveDesktopUserDataOverride("C:\\Temp\\casimir-profile\\..\\profile"),
    ).toBe("C:\\Temp\\profile");
    expect(() => resolveDesktopUserDataOverride("relative\\profile")).toThrow(
      /absolute local Windows drive path/,
    );
    expect(() =>
      resolveDesktopUserDataOverride("\\\\server\\share\\profile"),
    ).toThrow(/absolute local Windows drive path/);
  });
});
