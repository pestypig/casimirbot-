import type { Request } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildHelixAccountCapabilityPolicy,
  buildHelixSharedRealtimeRoomsExperimentPolicy,
} from
  "@shared/helix-account-session";
import {
  HELIX_AGENT_RUN_DEVELOPER_SCOPE,
  HELIX_AGENT_RUN_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
} from "@shared/contracts/helix-agent-api.v1";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY } from
  "@shared/helix-environment-connector";

const databaseMocks = vi.hoisted(() => ({
  ensureDatabase: vi.fn(),
  query: vi.fn(),
}));
const accountSessionMocks = vi.hoisted(() => ({
  getAccountSessionById: vi.fn(),
}));

vi.mock("../../db/client", () => ({
  ensureDatabase: (...args: unknown[]) =>
    databaseMocks.ensureDatabase(...args),
  getPool: () => ({
    query: (...args: unknown[]) => databaseMocks.query(...args),
  }),
}));
vi.mock("../../services/helix-account/account-session-store", () => ({
  buildSharedRealtimeRoomsSessionPolicy: (accountType: "developer" | "user") => {
    const policy = buildHelixSharedRealtimeRoomsExperimentPolicy(accountType);
    const publicIngressEnabled =
      process.env.HELIX_PUBLIC_ROOMS_EXPERIMENT === "1" &&
      (process.env.NODE_ENV !== "production" ||
        process.env.HELIX_PUBLIC_ROOM_SOURCE_INGRESS === "1");
    if (accountType !== "developer" && publicIngressEnabled) {
      policy.feature_flags.push("room_source_ingress");
      policy.locked_features = policy.locked_features.filter(
        (feature) => feature !== "room_source_ingress",
      );
      policy.allowed_workstation_capabilities.push(
        HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
      );
    }
    return policy;
  },
  getAccountSessionById: (...args: unknown[]) =>
    accountSessionMocks.getAccountSessionById(...args),
}));

import {
  DefaultHelixAgentAccessTokenVerifier,
  requireHelixAgentApiScope,
  resolveHelixAgentApiPrincipal,
  resolveHelixDesktopMcpPrincipal,
  type HelixAgentAccessTokenVerifier,
  type HelixAgentVerifiedToken,
} from "../helix-agent-principal";

const relevantEnvironmentKeys = [
  "NODE_ENV",
  "PORT",
  "HELIX_AGENT_OAUTH_ISSUER",
  "HELIX_AGENT_OAUTH_AUDIENCE",
  "HELIX_AGENT_OAUTH_PROVIDER",
  "HELIX_AGENT_OAUTH_JWKS_URL",
  "HELIX_AGENT_OAUTH_ALGORITHMS",
  "HELIX_AGENT_OAUTH_TENANT_CLAIM",
  "HELIX_AGENT_ALLOW_LOCAL_HS256",
  "HELIX_AGENT_LOCAL_JWT_SECRET",
  "HELIX_DEVELOPER_PROFILE_IDS",
  "HELIX_PUBLIC_ROOMS_EXPERIMENT",
  "HELIX_PUBLIC_ROOM_SOURCE_INGRESS",
  "CASIMIR_DESKTOP_HOST",
  "CASIMIR_DESKTOP_SESSION_SECRET",
  "HELIX_DESKTOP_DEVICE_ID",
] as const;

const originalEnvironment = Object.fromEntries(
  relevantEnvironmentKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof relevantEnvironmentKeys)[number], string | undefined>;

const restoreEnvironment = (): void => {
  for (const key of relevantEnvironmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

const configureLocalVerifier = (): {
  issuer: string;
  audience: string;
  secret: string;
} => {
  const issuer = "https://issuer.example";
  const audience = "https://agent.example/agent-resource";
  const secret = "test-only-secret-that-is-at-least-32-characters";
  process.env.NODE_ENV = "test";
  process.env.HELIX_AGENT_OAUTH_ISSUER = issuer;
  process.env.HELIX_AGENT_OAUTH_AUDIENCE = audience;
  process.env.HELIX_AGENT_OAUTH_PROVIDER = "oidc-test";
  delete process.env.HELIX_AGENT_OAUTH_JWKS_URL;
  delete process.env.HELIX_AGENT_OAUTH_ALGORITHMS;
  delete process.env.HELIX_AGENT_OAUTH_TENANT_CLAIM;
  process.env.HELIX_AGENT_ALLOW_LOCAL_HS256 = "1";
  process.env.HELIX_AGENT_LOCAL_JWT_SECRET = secret;
  return { issuer, audience, secret };
};

const signToken = async (input: {
  secret: string;
  issuer: string;
  audience: string;
  subject?: string;
  tenantId?: string;
  extra?: Record<string, unknown>;
}): Promise<string> => {
  const payload: Record<string, unknown> = {
    ...(input.tenantId === undefined
      ? {}
      : { tenant_id: input.tenantId }),
    ...(input.extra ?? {}),
  };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(input.issuer)
    .setAudience(input.audience)
    .setSubject(input.subject ?? "subject-1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(input.secret));
};

const requestWithHeaders = (
  headers: Record<string, string | undefined>,
): Request =>
  ({
    get: (name: string) => headers[name.toLowerCase()],
    headers,
  }) as unknown as Request;

const verifiedToken = (
  overrides: Partial<HelixAgentVerifiedToken> = {},
): HelixAgentVerifiedToken => ({
  issuer: "https://issuer.example",
  subject: "subject-1",
  tenantId: "tenant-1",
  scopes: new Set([
    HELIX_AGENT_RUN_READ_SCOPE,
    HELIX_AGENT_RUN_WRITE_SCOPE,
  ]),
  expiresAt: "2099-01-01T00:00:00.000Z",
  claims: {},
  ...overrides,
});

const verifierDouble = (
  token: HelixAgentVerifiedToken = verifiedToken(),
  providerAlias = "oidc-test",
): HelixAgentAccessTokenVerifier => ({
  verify: vi.fn().mockResolvedValue(token),
  authorizationServer: () => "https://issuer.example",
  audience: () => "https://agent.example/agent-resource",
  providerAlias: () => providerAlias,
});

const linkedAccount = (overrides: Record<string, unknown> = {}) => ({
  profile_id: "profile-1",
  display_name: "Linked User",
  email: "linked@example.com",
  account_type: "user",
  picture_url: null,
  ...overrides,
});

beforeEach(() => {
  restoreEnvironment();
  databaseMocks.ensureDatabase.mockReset().mockResolvedValue(undefined);
  databaseMocks.query.mockReset().mockResolvedValue({
    rows: [linkedAccount()],
  });
  accountSessionMocks.getAccountSessionById.mockReset();
});

afterEach(() => {
  restoreEnvironment();
  vi.restoreAllMocks();
});

describe("DefaultHelixAgentAccessTokenVerifier", () => {
  it("verifies local HS256 claims and combines standard scope claim shapes", async () => {
    const config = configureLocalVerifier();
    const jwt = await signToken({
      ...config,
      tenantId: "tenant-signed",
      extra: {
        scope: HELIX_AGENT_RUN_READ_SCOPE,
        scp: [HELIX_AGENT_RUN_WRITE_SCOPE],
        scopes: "custom.agent.scope",
      },
    });
    const verifier = new DefaultHelixAgentAccessTokenVerifier();

    const result = await verifier.verify(jwt);

    expect(verifier.authorizationServer()).toBe(config.issuer);
    expect(verifier.audience()).toBe(config.audience);
    expect(verifier.providerAlias()).toBe("oidc-test");
    expect(result).toMatchObject({
      issuer: config.issuer,
      subject: "subject-1",
      tenantId: "tenant-signed",
    });
    expect(Array.from(result.scopes).sort()).toEqual([
      "custom.agent.scope",
      HELIX_AGENT_RUN_READ_SCOPE,
      HELIX_AGENT_RUN_WRITE_SCOPE,
    ]);
    expect(Number.isNaN(Date.parse(result.expiresAt))).toBe(false);
  });

  it("rejects wrong audiences, signatures, and missing signed tenant identity", async () => {
    const config = configureLocalVerifier();
    const verifier = new DefaultHelixAgentAccessTokenVerifier();

    const wrongAudience = await signToken({
      ...config,
      audience: "https://other.example/resource",
      tenantId: "tenant-1",
    });
    await expect(verifier.verify(wrongAudience)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });

    const wrongSignature = await signToken({
      ...config,
      secret: "different-secret-that-is-also-at-least-32-characters",
      tenantId: "tenant-1",
    });
    await expect(verifier.verify(wrongSignature)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });

    const missingTenant = await signToken(config);
    await expect(verifier.verify(missingTenant)).rejects.toMatchObject({
      status: 401,
      code: "tenant_required",
    });
  });

  it("accepts only the exact port-derived loopback MCP audience outside production", async () => {
    const config = configureLocalVerifier();
    process.env.PORT = "1522";
    const verifier = new DefaultHelixAgentAccessTokenVerifier();
    const loopbackToken = await signToken({
      ...config,
      audience: "http://127.0.0.1:1522/mcp",
      tenantId: "tenant-1",
    });

    await expect(verifier.verify(loopbackToken)).resolves.toMatchObject({
      tenantId: "tenant-1",
    });

    const wrongPortToken = await signToken({
      ...config,
      audience: "http://127.0.0.1:1523/mcp",
      tenantId: "tenant-1",
    });
    await expect(verifier.verify(wrongPortToken)).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });

    process.env.NODE_ENV = "production";
    await expect(verifier.verify(loopbackToken)).rejects.toMatchObject({
      status: 503,
      code: "auth_not_configured",
    });
  });

  it("uses only the exact configured namespaced tenant claim", async () => {
    const config = configureLocalVerifier();
    const tenantClaim = "https://casimirbot.com/tenant_id";
    process.env.HELIX_AGENT_OAUTH_TENANT_CLAIM = tenantClaim;
    const verifier = new DefaultHelixAgentAccessTokenVerifier();
    const admitted = await signToken({
      ...config,
      tenantId: "legacy-tenant-must-not-win",
      extra: { [tenantClaim]: "tenant-namespaced" },
    });
    await expect(verifier.verify(admitted)).resolves.toMatchObject({
      tenantId: "tenant-namespaced",
    });

    const missingExactClaim = await signToken({
      ...config,
      tenantId: "legacy-tenant-must-not-fallback",
    });
    await expect(verifier.verify(missingExactClaim)).rejects.toMatchObject({
      status: 401,
      code: "tenant_required",
    });
  });

  it("fails closed when local verification is not explicitly enabled", async () => {
    const config = configureLocalVerifier();
    delete process.env.HELIX_AGENT_ALLOW_LOCAL_HS256;
    const jwt = await signToken({
      ...config,
      tenantId: "tenant-1",
    });

    await expect(
      new DefaultHelixAgentAccessTokenVerifier().verify(jwt),
    ).rejects.toMatchObject({
      status: 503,
      code: "auth_not_configured",
    });
  });

  it("requires the configured OAuth audience to be an absolute resource URI", () => {
    configureLocalVerifier();
    process.env.HELIX_AGENT_OAUTH_AUDIENCE = "casimirbot-mcp";

    expect(() =>
      new DefaultHelixAgentAccessTokenVerifier().audience(),
    ).toThrow(expect.objectContaining({
      status: 503,
      code: "auth_not_configured",
    }));
  });

  it("requires an HTTPS OAuth audience in production", () => {
    configureLocalVerifier();
    process.env.NODE_ENV = "production";
    process.env.HELIX_AGENT_OAUTH_AUDIENCE =
      "http://agent.example/agent-resource";

    expect(() =>
      new DefaultHelixAgentAccessTokenVerifier().audience(),
    ).toThrow(expect.objectContaining({
      status: 503,
      code: "auth_not_configured",
    }));
  });

  it("preserves the exact configured OAuth issuer identifier", () => {
    process.env.NODE_ENV = "test";
    process.env.HELIX_AGENT_OAUTH_ISSUER =
      "https://issuer.example/oauth/";
    process.env.HELIX_AGENT_OAUTH_AUDIENCE =
      "https://agent.example/agent-resource";
    process.env.HELIX_AGENT_OAUTH_PROVIDER = "oidc-test";
    process.env.HELIX_AGENT_OAUTH_JWKS_URL =
      "https://issuer.example/oauth/jwks.json";
    delete process.env.HELIX_AGENT_ALLOW_LOCAL_HS256;

    expect(
      new DefaultHelixAgentAccessTokenVerifier().authorizationServer(),
    ).toBe("https://issuer.example/oauth/");
  });
});

describe("resolveHelixAgentApiPrincipal", () => {
  it("requires an exact bearer token and an active linked account", async () => {
    const verifier = verifierDouble();
    const missingBearer = requestWithHeaders({});
    await expect(
      resolveHelixAgentApiPrincipal(missingBearer, verifier),
    ).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });
    expect(verifier.verify).not.toHaveBeenCalled();

    databaseMocks.query.mockResolvedValueOnce({ rows: [] });
    const request = requestWithHeaders({
      authorization: "Bearer access-token",
    });
    await expect(
      resolveHelixAgentApiPrincipal(request, verifier),
    ).rejects.toMatchObject({
      status: 403,
      code: "account_not_linked",
    });
    expect(databaseMocks.ensureDatabase).toHaveBeenCalledTimes(1);
    expect(databaseMocks.query).toHaveBeenCalledWith(
      expect.stringContaining("b.revoked_at IS NULL"),
      [
        "https://issuer.example",
        "tenant-1",
        "oidc-test",
        "subject-1",
      ],
    );
  });

  it("rejects an asserted tenant that differs from the signed claim before database access", async () => {
    const verifier = verifierDouble();
    const request = requestWithHeaders({
      authorization: "Bearer access-token",
      "x-tenant-id": "tenant-attacker",
    });

    await expect(
      resolveHelixAgentApiPrincipal(request, verifier),
    ).rejects.toMatchObject({
      status: 403,
      code: "tenant_mismatch",
    });
    expect(databaseMocks.ensureDatabase).not.toHaveBeenCalled();
    expect(databaseMocks.query).not.toHaveBeenCalled();
  });

  it("binds ownership to signed tenant, issuer, subject, and linked profile", async () => {
    const token = verifiedToken({
      issuer: "https://issuer.example",
      subject: "subject-linked",
      tenantId: "tenant-linked",
      claims: { azp: "codex-desktop-client" },
    });
    const verifier = verifierDouble(token);
    const request = requestWithHeaders({
      authorization: "Bearer access-token",
      "x-customer-id": "tenant-linked",
    });

    const result = await resolveHelixAgentApiPrincipal(request, verifier);

    expect(verifier.verify).toHaveBeenCalledWith("access-token");
    expect(result).toMatchObject({
      tenantId: "tenant-linked",
      issuer: "https://issuer.example",
      subjectId: "subject-linked",
      accountProfileId: "profile-1",
      accountType: "user",
      mcpClientRef: expect.stringMatching(/^oauth_client:[a-f0-9]{64}$/),
      oauthClientRef: expect.stringMatching(/^oauth_client:[a-f0-9]{64}$/),
      tokenExpiresAt: token.expiresAt,
      accountContext: {
        profile_id: "profile-1",
        trusted_account_session: true,
        account_session: {
          profile: {
            provider: "external_oauth",
            provider_alias: "oidc-test",
            provider_subject: "subject-linked",
          },
        },
      },
    });
    expect(result.accountContext.session_id).toMatch(
      /^external-oauth:[a-f0-9]{32}$/,
    );
    expect(databaseMocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [
        "https://issuer.example",
        "tenant-linked",
        "oidc-test",
        "subject-linked",
      ],
    );
  });

  it("derives a stable opaque MCP client identity for native desktop delegation", async () => {
    const desktopSecret = "desktop-test-secret-that-is-at-least-32-characters";
    const sessionId = "account_session:native-client-session";
    process.env.CASIMIR_DESKTOP_HOST = "1";
    process.env.CASIMIR_DESKTOP_SESSION_SECRET = desktopSecret;
    process.env.HELIX_DESKTOP_DEVICE_ID =
      "desktop_device_abcdefghijklmnopqrstuv";
    accountSessionMocks.getAccountSessionById.mockResolvedValue({
      schema: "helix.account_session.v1",
      session_id: sessionId,
      profile: {
        profile_id: "profile-native",
        display_name: "Native User",
        email: null,
        auth_mode: "local_dev",
        account_type: "developer",
        provider: "local_dev",
        provider_alias: "local_dev",
        provider_subject: "profile-native",
        picture_url: null,
        created_at: "2026-08-29T00:00:00.000Z",
        updated_at: "2026-08-29T00:00:00.000Z",
      },
      account_policy: buildHelixAccountCapabilityPolicy("developer"),
      status: "active",
      memory_scope: "profile",
      created_at: "2026-08-29T00:00:00.000Z",
      updated_at: "2026-08-29T00:00:00.000Z",
      expires_at: null,
    });
    const request = requestWithHeaders({
      host: "127.0.0.1:65190",
      "x-casimir-desktop-session": desktopSecret,
      "x-casimir-desktop-account-session": sessionId,
    });

    const first = await resolveHelixDesktopMcpPrincipal(request, [
      "helix.rooms.read",
      "helix.rooms.manage",
    ]);
    const second = await resolveHelixDesktopMcpPrincipal(request, [
      "helix.rooms.read",
      "helix.rooms.manage",
    ]);

    expect(first).toMatchObject({
      accountProfileId: "profile-native",
      oauthClientRef: null,
      mcpClientRef: expect.stringMatching(
        /^mcp_client:native_desktop:[a-f0-9]{64}$/,
      ),
    });
    expect(first.mcpClientRef).toBe(second.mcpClientRef);
    expect(first.mcpClientRef).not.toContain("profile-native");
    expect(first.mcpClientRef).not.toContain(sessionId);
    expect(first.scopes).toEqual(new Set([
      "helix.rooms.read",
      "helix.rooms.manage",
    ]));
  });

  it("preserves the Google provider family while retaining its exact alias", async () => {
    const result = await resolveHelixAgentApiPrincipal(
      requestWithHeaders({
        authorization: "Bearer access-token",
      }),
      verifierDouble(verifiedToken(), "google"),
    );

    expect(result.accountContext.account_session?.profile).toMatchObject({
      provider: "google",
      provider_alias: "google",
      provider_subject: "subject-1",
    });
    expect(databaseMocks.query).toHaveBeenCalledWith(
      expect.any(String),
      [
        "https://issuer.example",
        "tenant-1",
        "google",
        "subject-1",
      ],
    );
  });

  it("requires the account binding to match issuer and signed tenant exactly", async () => {
    databaseMocks.query.mockResolvedValueOnce({ rows: [] });
    const token = verifiedToken({
      issuer: "https://issuer.example",
      subject: "subject-linked",
      tenantId: "tenant-b",
    });

    await expect(
      resolveHelixAgentApiPrincipal(
        requestWithHeaders({
          authorization: "Bearer access-token",
        }),
        verifierDouble(token),
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: "account_not_linked",
    });

    expect(databaseMocks.query).toHaveBeenCalledWith(
      expect.stringContaining("b.tenant_id = $2"),
      [
        "https://issuer.example",
        "tenant-b",
        "oidc-test",
        "subject-linked",
      ],
    );
  });

  it("clamps developer accounts in production unless both whitelist and developer scope pass", async () => {
    process.env.NODE_ENV = "production";
    process.env.HELIX_DEVELOPER_PROFILE_IDS = "subject-developer";
    databaseMocks.query.mockResolvedValue({
      rows: [
        linkedAccount({
          profile_id: "profile-developer",
          account_type: "developer",
        }),
      ],
    });
    const request = requestWithHeaders({
      authorization: "Bearer access-token",
    });

    const withoutDeveloperScope = await resolveHelixAgentApiPrincipal(
      request,
      verifierDouble(
        verifiedToken({
          subject: "subject-developer",
          scopes: new Set([HELIX_AGENT_RUN_READ_SCOPE]),
        }),
      ),
    );
    expect(withoutDeveloperScope.accountType).toBe("user");
    expect(withoutDeveloperScope.trustedDeveloperProfile).toBe(true);

    const withDeveloperScope = await resolveHelixAgentApiPrincipal(
      request,
      verifierDouble(
        verifiedToken({
          subject: "subject-developer",
          scopes: new Set([
            HELIX_AGENT_RUN_READ_SCOPE,
            HELIX_AGENT_RUN_DEVELOPER_SCOPE,
          ]),
        }),
      ),
    );
    expect(withDeveloperScope.accountType).toBe("developer");
    expect(withDeveloperScope.trustedDeveloperProfile).toBe(true);
  });

  it("retains a stored developer profile on the local development runtime without production elevation scope", async () => {
    process.env.NODE_ENV = "development";
    databaseMocks.query.mockResolvedValue({
      rows: [
        linkedAccount({
          profile_id: "profile-developer",
          account_type: "developer",
        }),
      ],
    });

    const principal = await resolveHelixAgentApiPrincipal(
      requestWithHeaders({ authorization: "Bearer access-token" }),
      verifierDouble(
        verifiedToken({
          subject: "subject-developer",
          scopes: new Set([HELIX_AGENT_RUN_READ_SCOPE]),
        }),
      ),
    );

    expect(principal.accountType).toBe("developer");
    expect(principal.trustedDeveloperProfile).toBe(true);
  });

  it("unlocks only the room experiment for an exact room OAuth scope", async () => {
    process.env.NODE_ENV = "production";
    process.env.HELIX_DEVELOPER_PROFILE_IDS = "subject-developer";
    databaseMocks.query.mockResolvedValue({
      rows: [
        linkedAccount({
          profile_id: "profile-developer",
          account_type: "developer",
        }),
      ],
    });

    const principal = await resolveHelixAgentApiPrincipal(
      requestWithHeaders({ authorization: "Bearer access-token" }),
      verifierDouble(
        verifiedToken({
          subject: "subject-developer",
          scopes: new Set([HELIX_SHARED_LIVE_ROOM_READ_SCOPE]),
        }),
      ),
    );

    expect(principal.accountType).toBe("user");
    expect(principal.trustedDeveloperProfile).toBe(true);
    expect(principal.accountContext.account_policy?.feature_flags).toContain(
      "shared_realtime_rooms",
    );
    expect(principal.accountContext.account_policy?.locked_features).not.toContain(
      "shared_realtime_rooms",
    );
    expect(principal.accountContext.account_policy?.locked_features).toContain(
      "developer_workstation_panels",
    );
  });

  it("applies the governed public room-source policy to an exact room OAuth principal", async () => {
    process.env.NODE_ENV = "production";
    process.env.HELIX_PUBLIC_ROOMS_EXPERIMENT = "1";
    process.env.HELIX_PUBLIC_ROOM_SOURCE_INGRESS = "1";
    databaseMocks.query.mockResolvedValue({
      rows: [linkedAccount({ account_type: "user" })],
    });

    const principal = await resolveHelixAgentApiPrincipal(
      requestWithHeaders({ authorization: "Bearer access-token" }),
      verifierDouble(
        verifiedToken({
          scopes: new Set([HELIX_SHARED_LIVE_ROOM_READ_SCOPE]),
        }),
      ),
    );

    expect(principal.accountType).toBe("user");
    expect(principal.accountContext.account_policy?.feature_flags).toEqual(
      expect.arrayContaining(["shared_realtime_rooms", "room_source_ingress"]),
    );
    expect(principal.accountContext.account_policy?.locked_features).not.toContain(
      "room_source_ingress",
    );
    expect(
      principal.accountContext.account_policy?.allowed_workstation_capabilities,
    ).toContain(HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY);
  });
});

describe("requireHelixAgentApiScope", () => {
  it("admits exact scopes and returns a typed insufficient-scope failure", () => {
    const readPrincipal = {
      ...principalForScopeTest(),
      scopes: new Set([HELIX_AGENT_RUN_READ_SCOPE]),
    };
    expect(() =>
      requireHelixAgentApiScope(
        readPrincipal,
        HELIX_AGENT_RUN_READ_SCOPE,
      ),
    ).not.toThrow();
    expect(() =>
      requireHelixAgentApiScope(
        readPrincipal,
        HELIX_AGENT_RUN_WRITE_SCOPE,
      ),
    ).toThrowError(
      expect.objectContaining({
        status: 403,
        code: "insufficient_scope",
      }),
    );
  });
});

const principalForScopeTest = () =>
  ({
    tenantId: "tenant-1",
    issuer: "https://issuer.example",
    subjectId: "subject-1",
    accountProfileId: "profile-1",
    accountType: "user",
    scopes: new Set<string>(),
    tokenExpiresAt: null,
    accountContext: {
      session_id: "scope-test",
      profile_id: "profile-1",
      trusted_account_session: true,
    },
  }) as Parameters<typeof requireHelixAgentApiScope>[0];
