import { describe, expect, it, vi } from "vitest";
import type { HelixAgentAccessTokenVerifier } from "../../../auth/helix-agent-principal";
import {
  Auth0WebAccountSessionController,
  type Auth0WebAccountSessionConfig,
} from "../auth0-web-account-session";

const config: Auth0WebAccountSessionConfig = {
  issuer: "https://tenant.example/",
  audience: "https://api.example/mcp",
  clientId: "public-client-123",
  redirectUri: "http://127.0.0.1:1522/api/auth/auth0/callback",
  scope: "openid profile email",
};

const verifier = (subject = "auth0|player"): HelixAgentAccessTokenVerifier => ({
  authorizationServer: () => config.issuer,
  audience: () => config.audience,
  providerAlias: () => "auth0",
  verify: vi.fn(async () => ({
    issuer: config.issuer,
    subject,
    tenantId: "tenant-one",
    scopes: new Set(["openid", "profile"]),
    expiresAt: "2030-01-01T00:00:00.000Z",
    claims: { name: "Minecraft owner", email: "owner@example.com" },
  })),
});

describe("Auth0WebAccountSessionController", () => {
  it("starts exact-callback PKCE without a client secret or bearer", () => {
    const controller = new Auth0WebAccountSessionController({
      config: () => config,
      randomBytes: (size) => Buffer.alloc(size, size),
      now: () => new Date("2026-08-25T12:00:00.000Z"),
    });
    const started = controller.start(
      "/desktop?panels=account-session&focus=account-session",
    );
    const authorize = new URL(started.authorizationUrl);
    expect(authorize.origin).toBe("https://tenant.example");
    expect(authorize.pathname).toBe("/authorize");
    expect(authorize.searchParams.get("client_id")).toBe(config.clientId);
    expect(authorize.searchParams.get("redirect_uri")).toBe(config.redirectUri);
    expect(authorize.searchParams.get("audience")).toBe(config.audience);
    expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorize.searchParams.has("client_secret")).toBe(false);
    expect(authorize.searchParams.has("access_token")).toBe(false);
  });

  it("exchanges and verifies server-side, then returns only a Casimir session receipt", async () => {
    const signIn = vi.fn(async () => ({
      schema: "helix.account_session_receipt.v1" as const,
      ok: true,
      session: {
        session_id: "session:auth0",
      },
      message: "Signed in with Auth0.",
      raw_password_stored: false as const,
      credential_collection_allowed_in_agents: false as const,
    })) as never;
    const exchange = vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "verified-access-token-value" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const controller = new Auth0WebAccountSessionController({
      config: () => config,
      verifier: verifier(),
      fetch: exchange as typeof fetch,
      signIn,
      randomBytes: (size) => Buffer.alloc(size, size + 1),
      now: () => new Date("2026-08-25T12:00:00.000Z"),
    });
    const started = controller.start("https://evil.example/steal");
    const state = new URL(started.authorizationUrl).searchParams.get("state")!;
    const completed = await controller.complete({ state, code: "code-value-123" });

    expect(exchange).toHaveBeenCalledOnce();
    const exchangeInit = exchange.mock.calls[0]?.[1] as RequestInit;
    const exchangeBody = exchangeInit.body as URLSearchParams;
    expect(exchangeBody.get("client_secret")).toBeNull();
    expect(exchangeBody.get("code_verifier")).toBeTruthy();
    expect(signIn).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "auth0",
        provider_subject: "auth0|player",
      }),
    );
    expect(completed.returnTo).toBe(
      "/desktop?panels=account-session&focus=account-session",
    );
    expect(completed).not.toHaveProperty("access_token");
  });

  it("consumes state once and fails closed on replay", async () => {
    const controller = new Auth0WebAccountSessionController({
      config: () => config,
      verifier: verifier(),
      fetch: vi.fn(async () =>
        new Response(JSON.stringify({ access_token: "verified-access-token-value" }), {
          status: 200,
        }),
      ) as typeof fetch,
      signIn: vi.fn(async () => ({
        ok: true,
        session: { session_id: "session:auth0" },
      })) as never,
      randomBytes: (size) => Buffer.alloc(size, 9),
    });
    const state = new URL(controller.start("/desktop").authorizationUrl).searchParams.get(
      "state",
    )!;
    await controller.complete({ state, error: "access_denied" }).catch(() => null);
    await expect(
      controller.complete({ state, code: "code-value-123" }),
    ).rejects.toMatchObject({ code: "login_intent_not_found" });
  });
});
