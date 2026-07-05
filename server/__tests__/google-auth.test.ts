import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../routes/account-session";
import { createGoogleAuthRouter } from "../routes/google-auth";
import { resetAccountSessionStore } from "../services/helix-account/account-session-store";

const createApp = (options: Parameters<typeof createGoogleAuthRouter>[0] = {}): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", createGoogleAuthRouter(options));
  app.use("/api/account", accountSessionRouter);
  return app;
};

describe("Google auth route", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("rejects missing Google client id", async () => {
    const app = createApp({ clientId: "" });
    await request(app)
      .post("/api/auth/google")
      .set("Cookie", "g_csrf_token=csrf")
      .send({ credential: "jwt", g_csrf_token: "csrf" })
      .expect(500)
      .expect((res) => {
        expect(res.body.error).toBe("google_client_id_missing");
      });
  });

  it("rejects missing credential", async () => {
    const app = createApp({ clientId: "client-id" });
    await request(app)
      .post("/api/auth/google")
      .set("Cookie", "g_csrf_token=csrf")
      .send({ g_csrf_token: "csrf" })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe("missing_google_credential");
      });
  });

  it("rejects CSRF mismatch", async () => {
    const app = createApp({ clientId: "client-id" });
    await request(app)
      .post("/api/auth/google")
      .set("Cookie", "g_csrf_token=csrf-a")
      .send({ credential: "jwt", g_csrf_token: "csrf-b" })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe("google_csrf_failed");
      });
  });

  it("rejects verification failure", async () => {
    const verifyIdToken = vi.fn(async () => {
      throw new Error("bad token");
    });
    const app = createApp({ clientId: "client-id", verifyIdToken });
    await request(app)
      .post("/api/auth/google")
      .set("Cookie", "g_csrf_token=csrf")
      .send({ credential: "jwt", g_csrf_token: "csrf" })
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe("google_token_verification_failed");
      });
  });

  it("accepts verified Google payload and exposes profile session through account status", async () => {
    const verifyIdToken = vi.fn(async () => ({
      sub: "google-sub-123",
      name: "DatDamPig",
      email: "dan@example.com",
      picture: "https://example.com/avatar.png",
    }));
    const app = createApp({ clientId: "client-id", verifyIdToken });
    const agent = request.agent(app);

    const signIn = await agent
      .post("/api/auth/google")
      .set("Cookie", "g_csrf_token=csrf")
      .send({ credential: "jwt", g_csrf_token: "csrf" })
      .expect(200);

    expect(signIn.headers["set-cookie"]?.join(";")).toContain("helix_session=");
    expect(signIn.body).toMatchObject({
      ok: true,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      session: {
        profile: {
          profile_id: "google:google-sub-123",
          auth_mode: "web_auth",
          provider: "google",
          provider_subject: "google-sub-123",
          email: "dan@example.com",
        },
      },
    });
    expect(verifyIdToken).toHaveBeenCalledWith("jwt", "client-id");

    const status = await agent.get("/api/account/session").expect(200);
    expect(status.body.session.profile.profile_id).toBe("google:google-sub-123");
    expect(status.body.linked_accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "google",
          external_id: "google-sub-123",
          authority: "owner",
        }),
      ]),
    );
  });
});
