import { describe, expect, it } from "vitest";
import type { JWTPayload } from "jose";
import { AUTH0_MFA_ACR } from "@shared/desktop-auth0-step-up";
import type {
  HelixAgentAccessTokenVerifier,
  HelixAgentVerifiedToken,
} from "../../../auth/helix-agent-principal";
import {
  Auth0StepUpController,
  type Auth0StepUpConfig,
} from "../auth0-step-up";
import { HelixStepUpReceiptStore } from "../auth0-step-up-receipt-store";

const NOW = new Date("2026-08-27T20:00:00.000Z");
const CONFIG: Auth0StepUpConfig = Object.freeze({
  issuer: "https://tenant.example.auth0.com/",
  audience: "https://casimirbot.example/mcp",
  clientId: "nativeClient_123456",
  jwksUrl: "https://tenant.example.auth0.com/.well-known/jwks.json",
  algorithms: Object.freeze(["RS256"]),
  redirectUri: "casimirbot://oauth/callback",
  scope: "openid profile",
  maximumAgeSeconds: 300,
  receiptTtlSeconds: 120,
});

class AccessVerifier implements HelixAgentAccessTokenVerifier {
  constructor(private readonly subject = "auth0|owner") {}

  async verify(): Promise<HelixAgentVerifiedToken> {
    return {
      issuer: CONFIG.issuer,
      subject: this.subject,
      tenantId: "profile_owner",
      scopes: new Set(["openid"]),
      expiresAt: "2026-08-27T20:05:00.000Z",
      claims: {},
    };
  }

  authorizationServer(): string { return CONFIG.issuer; }
  audience(): string { return CONFIG.audience; }
  providerAlias(): string { return "auth0"; }
}

const fixture = (
  override: Partial<JWTPayload> = {},
  linked = true,
  accessScopes: ReadonlySet<string> = new Set(["openid"]),
) => {
  let authorizationUrl = "";
  const receiptStore = new HelixStepUpReceiptStore({
    now: () => NOW,
    randomBytes: (size) => Buffer.alloc(size, 7),
    randomId: () => "receipt-id",
  });
  const controller = new Auth0StepUpController({
    config: () => CONFIG,
    now: () => NOW,
    randomBytes: (size) => Buffer.alloc(size, size),
    receiptStore,
    accessTokenVerifier: Object.assign(new AccessVerifier(), {
      verify: async (): Promise<HelixAgentVerifiedToken> => ({
        issuer: CONFIG.issuer,
        subject: "auth0|owner",
        tenantId: "profile_owner",
        scopes: accessScopes,
        expiresAt: "2026-08-27T20:05:00.000Z",
        claims: {},
      }),
    }),
    fetch: async () => new Response(JSON.stringify({
      access_token: "access-token-value-1234",
      id_token: "identity-token-value-1234",
    }), { status: 200, headers: { "content-type": "application/json" } }),
    verifyIdToken: async () => {
      const nonce = new URL(authorizationUrl).searchParams.get("nonce") ?? "";
      return {
        sub: "auth0|owner",
        exp: Math.floor(NOW.getTime() / 1_000) + 300,
        iat: Math.floor(NOW.getTime() / 1_000),
        nonce,
        acr: AUTH0_MFA_ACR,
        amr: ["pwd", "mfa"],
        auth_time: Math.floor(NOW.getTime() / 1_000),
        ...override,
      };
    },
    validateLinkedIdentity: async () => linked,
  });
  const started = controller.start({
    session: { sessionId: "session_owner", profileId: "profile_owner" },
    deviceId: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
    purpose: "device_register",
    targetRef: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
  });
  authorizationUrl = started.authorization_url;
  const state = new URL(authorizationUrl).searchParams.get("state")!;
  const callback = `casimirbot://oauth/callback?code=valid-code-123&state=${state}`;
  return { controller, started, callback, receiptStore };
};

describe("Auth0StepUpController", () => {
  it("requests an exact fresh Auth0 MFA authorization code flow", () => {
    const { controller, started } = fixture();
    const url = new URL(started.authorization_url);
    expect(url.origin).toBe("https://tenant.example.auth0.com");
    expect(url.pathname).toBe("/authorize");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: "code",
      client_id: CONFIG.clientId,
      redirect_uri: CONFIG.redirectUri,
      audience: CONFIG.audience,
      code_challenge_method: "S256",
      acr_values: AUTH0_MFA_ACR,
      max_age: "300",
    });
    expect(url.searchParams.has("prompt")).toBe(false);
    expect(url.searchParams.get("nonce")).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(url.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(controller.inspectStart(started.authorization_url)).toMatchObject({
      purpose: "device_register",
      target_ref: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
    });
  });

  it("issues one receipt only after signed-claim, freshness, and link validation", async () => {
    const { controller, callback, receiptStore } = fixture();
    const completed = await controller.complete(callback);
    expect(completed).toMatchObject({
      purpose: "device_register",
      target_ref: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
    });
    expect(completed.token).toMatch(/^stepup_[A-Za-z0-9_-]{43}$/u);
    expect(receiptStore.consumeNativeOperation({
      token: completed.token,
      deviceId: "desktop_device_AAAAAAAAAAAAAAAAAAAAAA",
      purpose: "device_register",
    }).projection.status).toBe("consumed");
    await expect(controller.complete(callback)).rejects.toMatchObject({
      code: "step_up_intent_not_found",
    });
  });

  it.each([
    ["wrong ACR", { acr: "urn:not-mfa" }, "mfa_required"],
    ["missing ACR", { acr: undefined }, "mfa_required"],
    ["missing MFA AMR", { amr: ["pwd"] }, "mfa_required"],
    ["missing AMR", { amr: undefined }, "mfa_required"],
    ["missing authentication time", { auth_time: undefined }, "authentication_stale"],
    ["stale authentication", { auth_time: Math.floor(NOW.getTime() / 1_000) - 301 }, "authentication_stale"],
    ["future authentication", { auth_time: Math.floor(NOW.getTime() / 1_000) + 6 }, "authentication_stale"],
    ["nonce mismatch", { nonce: "wrong-nonce" }, "identity_mismatch"],
    ["subject mismatch", { sub: "auth0|someone-else" }, "identity_mismatch"],
  ] as const)("fails closed for %s", async (_label, claims, code) => {
    const { controller, callback } = fixture(claims);
    await expect(controller.complete(callback)).rejects.toMatchObject({ code });
  });

  it("rejects an identity that is not linked to the active profile", async () => {
    const { controller, callback } = fixture({}, false);
    await expect(controller.complete(callback)).rejects.toMatchObject({
      code: "identity_mismatch",
    });
  });

  it("rejects a valid identity whose access token lacks the required scope", async () => {
    const { controller, callback } = fixture({}, true, new Set());
    await expect(controller.complete(callback)).rejects.toMatchObject({
      code: "scope_required",
    });
  });
});
