import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../routes/account-session";
import {
  resetAccountSessionStore,
} from "../services/helix-account/account-session-store";
import {
  createLocalPasswordProfileHash,
} from "../services/helix-account/local-password-profile-auth";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/account", accountSessionRouter);
  return app;
};

describe("local password account session", () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    await resetAccountSessionStore();
  });

  it("signs into a local admin profile with a server-side scrypt hash", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("HELIX_LOCAL_PASSWORD_PROFILE_ENABLED", "1");
    vi.stubEnv("HELIX_LOCAL_PROFILE_USERNAME", "admin");
    vi.stubEnv("HELIX_LOCAL_PROFILE_ID", "local:admin");
    vi.stubEnv("HELIX_LOCAL_PROFILE_DISPLAY_NAME", "Admin Operator");
    vi.stubEnv("HELIX_LOCAL_PROFILE_PASSWORD_HASH", createLocalPasswordProfileHash({
      password: "correct-password",
      salt: "test-salt",
    }));
    const agent = request.agent(createApp());

    const signIn = await agent
      .post("/api/account/session/password-sign-in")
      .send({ username: "admin", password: "correct-password" })
      .expect(200);

    expect(signIn.headers["set-cookie"]?.join(";")).toContain("helix_session=");
    expect(signIn.body).toMatchObject({
      ok: true,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "local_password_profile",
      session: {
        profile: {
          profile_id: "local:admin",
          auth_mode: "local_password_profile",
          provider: "local",
          provider_subject: "admin",
        },
      },
    });
    expect(JSON.stringify(signIn.body)).not.toContain("correct-password");

    const status = await agent.get("/api/account/session").expect(200);
    expect(status.body.session.profile.profile_id).toBe("local:admin");
    expect(status.body.auth_boundary).toMatchObject({
      credential_collection_allowed_in_agents: false,
      raw_password_stored: false,
      discord_bot_password_collection_allowed: false,
      local_password_profile_available: true,
    });
  });

  it("rejects invalid local admin credentials without creating a session", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("HELIX_LOCAL_PASSWORD_PROFILE_ENABLED", "1");
    vi.stubEnv("HELIX_LOCAL_PROFILE_PASSWORD_HASH", createLocalPasswordProfileHash({
      password: "correct-password",
      salt: "test-salt",
    }));

    const response = await request(createApp())
      .post("/api/account/session/password-sign-in")
      .send({ username: "admin", password: "wrong-password" })
      .expect(401);

    expect(response.body).toMatchObject({
      ok: false,
      session: null,
      error: "invalid_local_profile_credentials",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("wrong-password");
  });

  it("keeps the password profile disabled in production unless explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HELIX_LOCAL_PASSWORD_PROFILE_ENABLED", "");

    const response = await request(createApp())
      .post("/api/account/session/password-sign-in")
      .send({ username: "admin", password: "password" })
      .expect(401);

    expect(response.body).toMatchObject({
      ok: false,
      error: "local_password_profile_disabled",
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
    });
  });
});
