import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH,
  DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
  DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH,
} from "@shared/desktop-auth0-account-link";
import { resolveDesktopSessionConfig } from "../../security/desktop-session";
import { createDesktopAuth0AccountLinkRouter } from "../desktop-auth0-account-link";
import { Auth0NativeAccountLinkError } from "../../services/helix-account/auth0-native-account-link";

const desktopSecret = "desktop-session-secret-at-least-32-characters";
const session = {
  session_id: "session-active",
  profile: { profile_id: "profile-active" },
};

const harness = () => {
  const start = vi.fn(async () => ({
    schema: "casimir_desktop_auth0_account_link_start/1" as const,
    ok: true as const,
    authorization_url:
      "https://tenant.auth0.com/authorize?response_type=code",
    expires_at: "2026-08-11T20:10:00.000Z",
    provider: "auth0" as const,
    pkce: "S256" as const,
    client_secret_used: false as const,
    bearer_included: false as const,
    subject_included: false as const,
  }));
  const complete = vi.fn(async () => ({
    binding: {
      binding_ref: "agent-binding:sha256:sanitized",
      subject_included: false,
      bearer_included: false,
    },
  }));
  const resolveSession = vi.fn(async () => session);
  const app = express();
  app.use(
    "/api/account",
    createDesktopAuth0AccountLinkRouter({
      controller: { start, complete } as never,
      resolveSession,
      desktopSession: resolveDesktopSessionConfig({
        CASIMIR_DESKTOP_HOST: "1",
        CASIMIR_DESKTOP_SESSION_SECRET: desktopSecret,
      }),
    }),
  );
  return { app, start, complete, resolveSession };
};

describe("desktop Auth0 account-link routes", () => {
  it("requires both the native session header and active account cookie", async () => {
    const first = harness();
    await request(first.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH)
      .set("Cookie", "helix_session=session-active")
      .expect(401);
    expect(first.resolveSession).not.toHaveBeenCalled();

    const second = harness();
    await request(second.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH)
      .set("X-Casimir-Desktop-Session", desktopSecret)
      .expect(401);
    expect(second.start).not.toHaveBeenCalled();
  });

  it("starts only for the same cookie-authenticated desktop profile", async () => {
    const test = harness();
    const response = await request(test.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_START_PATH)
      .set("X-Casimir-Desktop-Session", desktopSecret)
      .set("Cookie", "helix_session=session-active")
      .expect(200);
    expect(test.start).toHaveBeenCalledWith({
      sessionId: "session-active",
      profileId: "profile-active",
    });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(JSON.stringify(response.body)).not.toContain("Bearer");
  });

  it("accepts the callback only through the native JSON relay", async () => {
    const test = harness();
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?code=authorization-code-123&state=${"s".repeat(43)}`;
    const response = await request(test.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH)
      .set("X-Casimir-Desktop-Session", desktopSecret)
      .send({ callback_url: callback })
      .expect(200);
    expect(test.complete).toHaveBeenCalledWith(callback);
    expect(response.body).toMatchObject({
      schema: "casimir_desktop_auth0_account_link_completion/1",
      ok: true,
      bearer_included: false,
      subject_included: false,
    });
  });

  it("returns a fixed error for malformed callback JSON", async () => {
    const test = harness();
    const response = await request(test.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH)
      .set("X-Casimir-Desktop-Session", desktopSecret)
      .set("Content-Type", "application/json")
      .send('{"callback_url":')
      .expect(400);
    expect(response.body).toMatchObject({
      schema: "casimir_desktop_auth0_account_link_completion/1",
      ok: false,
      error: "invalid_callback",
      bearer_included: false,
      subject_included: false,
    });
    expect(test.complete).not.toHaveBeenCalled();
  });

  it("returns only the safe missing-tenant-claim diagnostic", async () => {
    const test = harness();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    test.complete.mockRejectedValueOnce(
      new Auth0NativeAccountLinkError(
        403,
        "signed_tenant_claim_missing",
        "private verifier detail must not be reflected",
      ),
    );
    const callback = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?code=authorization-code-123&state=${"s".repeat(43)}`;
    const response = await request(test.app)
      .post(DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH)
      .set("X-Casimir-Desktop-Session", desktopSecret)
      .send({ callback_url: callback })
      .expect(403);

    expect(response.body).toEqual({
      schema: "casimir_desktop_auth0_account_link_completion/1",
      ok: false,
      error: "signed_tenant_claim_missing",
      message:
        "The Auth0 access token is missing the configured signed tenant claim.",
      bearer_included: false,
      subject_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("private verifier");
  });
});
