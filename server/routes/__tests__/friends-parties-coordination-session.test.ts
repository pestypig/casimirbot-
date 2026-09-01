import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE,
} from "@shared/helix-friends-voice-party";
import type {
  HelixAgentAccessTokenVerifier,
  HelixAgentVerifiedToken,
} from "../../auth/helix-agent-principal";
import { createFriendsPartiesCoordinationSessionRouter } from
  "../friends-parties-coordination-session";

const verified = (patch: Partial<HelixAgentVerifiedToken> = {}): HelixAgentVerifiedToken => ({
  issuer: "https://issuer.example/",
  subject: "auth0|friends-user",
  tenantId: "tenant:friends",
  scopes: new Set([HELIX_FRIENDS_PARTIES_COORDINATION_SCOPE]),
  expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  claims: {
    azp: "native-client-friends",
    name: "Friends User",
    email: "friends@example.test",
    email_verified: true,
  },
  ...patch,
});

const verifier = (value: HelixAgentVerifiedToken): HelixAgentAccessTokenVerifier => ({
  verify: vi.fn(async () => value),
  authorizationServer: () => value.issuer,
  audience: () => "https://casimirbot.com/mcp",
  providerAlias: () => "auth0",
});

const sessionReceipt = {
  schema: "helix.account_session.receipt.v1",
  ok: true,
  session: {
    schema: "helix.account_session.v1",
    session_id: "account_session:remote-friends",
    profile: {
      profile_id: "auth0:auth0|friends-user",
      display_name: "Friends User",
      email: "friends@example.test",
      email_verified_at: null,
      auth_mode: "web_auth",
      account_type: "user",
      provider: "auth0",
      provider_alias: "auth0",
      provider_subject: "auth0|friends-user",
      picture_url: null,
      created_at: "2026-08-31T00:00:00.000Z",
      updated_at: "2026-08-31T00:00:00.000Z",
    },
    account_policy: { account_type: "user" },
    status: "active",
    memory_scope: "profile",
    created_at: "2026-08-31T00:00:00.000Z",
    updated_at: "2026-08-31T00:00:00.000Z",
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  },
  message: "Signed in with Auth0.",
  error: null,
  raw_password_stored: false,
  credential_collection_allowed_in_agents: false,
  auth_method: "web_auth",
} as const;

const appFor = (token: HelixAgentVerifiedToken) => {
  const signIn = vi.fn(async () => sessionReceipt as never);
  const boundSessionExpiry = vi.fn(async () => undefined);
  const app = express();
  app.use(express.json());
  app.use("/api/account", createFriendsPartiesCoordinationSessionRouter({
    verifier: verifier(token),
    signIn,
    boundSessionExpiry,
    nativeClientId: "native-client-friends",
  }));
  return { app, signIn, boundSessionExpiry };
};

describe("Friends & Parties coordination session exchange", () => {
  it("exchanges an exact native scoped proof for a bounded HttpOnly domain session", async () => {
    const { app, signIn, boundSessionExpiry } = appFor(verified());
    const result = await request(app)
      .post("/api/account/session/friends-parties-coordination/exchange")
      .set("Authorization", "Bearer opaque-native-access-token")
      .send({ profile_id: "spoofed" })
      .expect(200);

    expect(signIn).toHaveBeenCalledWith(expect.objectContaining({
      provider: "auth0",
      provider_subject: "auth0|friends-user",
      display_name: "Friends User",
    }));
    expect(boundSessionExpiry).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "account_session:remote-friends",
    }));
    expect(result.headers["set-cookie"]?.[0]).toContain("helix_session=");
    expect(result.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(result.headers["cache-control"]).toContain("no-store");
    expect(result.body).toMatchObject({
      schema: "helix.friends_parties.coordination_session.v1",
      ok: true,
      bearer_included: false,
      session_cookie_included: false,
      model_visible: false,
      persistable: false,
    });
    expect(JSON.stringify(result.body)).not.toContain("opaque-native-access-token");
    expect(JSON.stringify(result.body)).not.toContain("account_session:remote-friends");
    expect(JSON.stringify(result.body)).not.toContain("spoofed");
  });

  it("fails closed for a missing scope or a different native OAuth client", async () => {
    const missingScope = appFor(verified({ scopes: new Set() }));
    await request(missingScope.app)
      .post("/api/account/session/friends-parties-coordination/exchange")
      .set("Authorization", "Bearer opaque-native-access-token")
      .send({})
      .expect(403)
      .expect(({ body }) => expect(body.error).toBe("coordination_scope_required"));
    expect(missingScope.signIn).not.toHaveBeenCalled();

    const wrongClient = appFor(verified({ claims: { azp: "another-client" } }));
    await request(wrongClient.app)
      .post("/api/account/session/friends-parties-coordination/exchange")
      .set("Authorization", "Bearer opaque-native-access-token")
      .send({})
      .expect(403)
      .expect(({ body }) => expect(body.error).toBe("coordination_native_client_required"));
    expect(wrongClient.signIn).not.toHaveBeenCalled();
  });
});
