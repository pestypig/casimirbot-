import { describe, expect, it, vi } from "vitest";
import type { HelixAgentAccessTokenVerifier } from "../../../auth/helix-agent-principal";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
} from "@shared/desktop-auth0-account-link";
import {
  Auth0NativeAccountLinkController,
  type Auth0NativeAccountLinkConfig,
} from "../auth0-native-account-link";
import { HelixAgentApiServiceError } from "../../helix-agent-api/errors";

const config: Auth0NativeAccountLinkConfig = Object.freeze({
  issuer: "https://tenant.auth0.com/",
  audience: "https://casimirbot.com/mcp",
  providerAlias: "auth0",
  clientId: "nativeClientId_123456",
  redirectUri: DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
  scope: "openid profile",
});

const session = { sessionId: "session-1", profileId: "profile-1" };
const state = "state_0123456789abcdefghijklmnopqrstuvwxyzABCDEFG";
const expiresAt = "2026-08-11T20:10:00.000Z";

const createHarness = () => {
  const createLinkIntent = vi.fn(async () => ({
    schema: "helix.agent_account_link_intent.v1" as const,
    intent_id: "intent-1",
    state,
    expected_issuer: config.issuer,
    expected_audience: config.audience,
    expected_provider: config.providerAlias,
    expires_at: expiresAt,
    state_persisted_raw: false as const,
  }));
  const completeLinkIntent = vi.fn(async () => ({
    schema: "helix.agent_account_binding_receipt.v1" as const,
    operation: "agent_account_binding.complete" as const,
    binding: {
      binding_ref: "agent-binding:sha256:0123456789abcdef",
      issuer: config.issuer,
      tenant_ref: "tenant:sha256:0123456789abcdef",
      provider: "auth0",
      status: "active" as const,
      created_at: "2026-08-11T20:00:00.000Z",
      updated_at: "2026-08-11T20:00:00.000Z",
      revoked_at: null,
      subject_included: false as const,
      bearer_included: false as const,
    },
    reactivated: false,
    reused_binding: false,
    answer_authority: false as const,
    assistant_answer: false as const,
    raw_identity_included: false as const,
    bearer_included: false as const,
  }));
  const verifier: HelixAgentAccessTokenVerifier = {
    verify: vi.fn(async () => ({
      issuer: config.issuer,
      subject: "auth0|verified-subject",
      tenantId: "tenant-1",
      scopes: new Set(["openid"]),
      expiresAt: "2026-08-11T21:00:00.000Z",
      claims: {},
    })),
    authorizationServer: () => config.issuer,
    audience: () => config.audience,
    providerAlias: () => config.providerAlias,
  };
  const exchange = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
    expect(String(_input)).toBe("https://tenant.auth0.com/oauth/token");
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("client_id")).toBe(config.clientId);
    expect(body.get("client_secret")).toBeNull();
    expect(body.get("code_verifier")).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    return new Response(
      JSON.stringify({ access_token: "verified-access-token-value" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  const controller = new Auth0NativeAccountLinkController({
    store: { createLinkIntent, completeLinkIntent },
    verifier,
    fetch: exchange as typeof fetch,
    now: () => new Date("2026-08-11T20:00:00.000Z"),
    randomBytes: (size) => Buffer.alloc(size, 7),
    config: () => config,
  });
  return {
    controller,
    createLinkIntent,
    completeLinkIntent,
    verifier,
    exchange,
  };
};

describe("Auth0 native account-link controller", () => {
  it("creates a public-client S256 request without exposing its verifier", async () => {
    const harness = createHarness();
    const receipt = await harness.controller.start(session);
    const authorization = new URL(receipt.authorization_url);

    expect(harness.createLinkIntent).toHaveBeenCalledWith({
      session,
      expectedIssuer: config.issuer,
      expectedAudience: config.audience,
      expectedProvider: "auth0",
      ttlSeconds: 600,
    });
    expect(authorization.origin).toBe("https://tenant.auth0.com");
    expect(authorization.pathname).toBe("/authorize");
    expect(authorization.searchParams.get("redirect_uri")).toBe(
      DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
    );
    expect(authorization.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorization.searchParams.get("code_verifier")).toBeNull();
    expect(authorization.searchParams.has("client_secret")).toBe(false);
    expect(receipt.client_secret_used).toBe(false);
  });

  it("exchanges the callback once and completes only from verified identity", async () => {
    const harness = createHarness();
    await harness.controller.start(session);
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?code=authorization-code-123&state=${state}`;

    const receipt = await harness.controller.complete(callback);

    expect(harness.verifier.verify).toHaveBeenCalledWith(
      "verified-access-token-value",
    );
    expect(harness.completeLinkIntent).toHaveBeenCalledWith({
      session,
      state,
      identity: {
        issuer: config.issuer,
        audience: config.audience,
        tenantId: "tenant-1",
        providerAlias: "auth0",
        subject: "auth0|verified-subject",
      },
    });
    expect(receipt.bearer_included).toBe(false);
    await expect(harness.controller.complete(callback)).rejects.toMatchObject({
      code: "link_intent_not_found",
    });
    expect(harness.exchange).toHaveBeenCalledTimes(1);
  });

  it("fails closed on a different callback target before token exchange", async () => {
    const harness = createHarness();
    await harness.controller.start(session);
    await expect(
      harness.controller.complete(
        `casimirbot://attacker/callback?code=authorization-code-123&state=${state}`,
      ),
    ).rejects.toMatchObject({ code: "invalid_callback" });
    expect(harness.exchange).not.toHaveBeenCalled();
  });

  it("consumes a denied callback without attempting token exchange", async () => {
    const harness = createHarness();
    await harness.controller.start(session);
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?error=access_denied&state=${state}`;
    await expect(harness.controller.complete(callback)).rejects.toMatchObject({
      code: "authorization_denied",
    });
    await expect(harness.controller.complete(callback)).rejects.toMatchObject({
      code: "link_intent_not_found",
    });
    expect(harness.exchange).not.toHaveBeenCalled();
  });

  it("reports a missing signed tenant claim without exposing token material", async () => {
    const harness = createHarness();
    vi.mocked(harness.verifier.verify).mockRejectedValueOnce(
      new HelixAgentApiServiceError(
        401,
        "tenant_required",
        "A signed tenant claim is required.",
      ),
    );
    await harness.controller.start(session);
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?code=authorization-code-123&state=${state}`;

    await expect(harness.controller.complete(callback)).rejects.toMatchObject({
      status: 403,
      code: "signed_tenant_claim_missing",
    });
    expect(harness.completeLinkIntent).not.toHaveBeenCalled();
  });
});
