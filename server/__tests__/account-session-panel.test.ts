import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../routes/account-session";
import { getPool } from "../db/client";
import { discordRouter } from "../routes/discord";
import { profileIngressRouter } from "../routes/profile-ingress";
import {
  resetAccountSessionStore,
  signInWebAccountSession,
} from "../services/helix-account/account-session-store";
import { listEmailOutboxRecords } from "../services/email/email-outbox";
import { resetProfileIngressStore } from "../services/helix-account/profile-ingress-store";
import { resetDiscordSessionStore } from "../services/situation-room/discord-session-store";
import {
  __resetHelixThreadLedgerStore,
  appendHelixThreadEvent,
  getHelixThreadLedgerEvents,
} from "../services/helix-thread/ledger";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/account", accountSessionRouter);
  app.use("/api/discord", discordRouter);
  app.use("/api/profile-ingress", profileIngressRouter);
  return app;
};

describe("account session panel API", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
    resetProfileIngressStore();
    resetDiscordSessionStore();
    __resetHelixThreadLedgerStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts a local profile session without storing passwords", async () => {
    const app = createApp();
    const signIn = await request(app)
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:datdampig",
        display_name: "DatDamPig",
        password: "should-not-be-read",
      })
      .expect(200);

    expect(signIn.body).toMatchObject({
      ok: true,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      session: {
        profile: {
          profile_id: "profile:datdampig",
          display_name: "DatDamPig",
          auth_mode: "local_dev_profile",
        },
      },
    });
    expect(JSON.stringify(signIn.body).toLowerCase()).not.toContain("should-not-be-read");
  });

  it("treats no-cookie session status as user account policy", async () => {
    const status = await request(createApp()).get("/api/account/session").expect(200);

    expect(status.body).toMatchObject({
      session: null,
      account_policy: {
        account_type: "user",
        allowed_panels: expect.arrayContaining(["account-session", "docs-viewer", "scientific-calculator"]),
        locked_panels: expect.arrayContaining(["live-answer-environment", "stage-play-badge-graph"]),
      },
    });
  });

  it("returns developer and user account policy shape from session status", async () => {
    const app = createApp();
    const developerAgent = request.agent(app);
    await developerAgent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:developer", display_name: "Developer" })
      .expect(200);
    const developerStatus = await developerAgent.get("/api/account/session").expect(200);

    expect(developerStatus.body).toMatchObject({
      account_policy: {
        schema: "helix.account_capability_policy.v1",
        account_type: "developer",
        max_workstation_permission: "danger",
        allowed_panels: ["*"],
        allowed_runtime_agents: ["*"],
        allowed_workstation_capabilities: ["*"],
      },
      session: {
        profile: {
          account_type: "developer",
        },
      },
    });

    const userAgent = request.agent(app);
    await userAgent
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:user",
        display_name: "User",
        account_type: "user",
      })
      .expect(200);
    const userStatus = await userAgent.get("/api/account/session").expect(200);

    expect(userStatus.body).toMatchObject({
      account_policy: {
        schema: "helix.account_capability_policy.v1",
        account_type: "user",
        max_workstation_permission: "act",
        allowed_panels: expect.arrayContaining([
          "account-session",
          "workstation-clipboard-history",
          "docs-viewer",
          "image-lens",
          "narrator",
          "scientific-calculator",
          "agi-task-history",
          "theory-badge-graph",
          "workstation-notes",
          "workstation-storage-map",
          "workstation-task-manager",
          "moral-graph",
        ]),
        locked_panels: expect.arrayContaining([
          "code-admin",
          "rag-admin",
          "document-image-lens",
          "live-answer-environment",
          "situation-room-pipelines",
          "stage-play-badge-graph",
        ]),
        locked_features: expect.arrayContaining(["runtime_agent_controls", "workstation_gateway_act"]),
        allowed_runtime_agents: ["codex"],
      },
      session: {
        profile: {
          account_type: "user",
        },
      },
    });
    expect(userStatus.body.account_policy.quotas.profile_storage_bytes).toBeLessThan(
      developerStatus.body.account_policy.quotas.profile_storage_bytes,
    );
  });

  it("does not mint a new developer account from local sign-in in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HELIX_DEVELOPER_PROFILE_IDS", "");
    const app = createApp();
    const response = await request(app)
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:public-local",
        display_name: "Public Local",
        account_type: "developer",
      })
      .expect(200);

    expect(response.body.session.profile.account_type).toBe("user");
    expect(response.body.account_policy?.account_type ?? response.body.session.account_policy.account_type).toBe("user");
  });

  it("returns and enforces user profile storage quota metadata", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:quota-user",
        display_name: "Quota User",
        account_type: "user",
      })
      .expect(200);

    const snapshot = await agent.get("/api/account/profile-storage/snapshot").expect(200);
    expect(snapshot.body).toMatchObject({
      profile_id: "profile:quota-user",
      quota_bytes: 1024 * 1024,
    });

    const oversizedValue = "x".repeat((1024 * 1024) + 1);
    const receipt = await agent
      .post("/api/account/profile-storage/snapshot")
      .send({
        entries: [{
          storage_key: "quota:test",
          storage_backend: "localStorage",
          value: oversizedValue,
        }],
        artifacts: [{
          artifact_id: "artifact:quota:test",
          storage_key: "quota:test",
          storage_backend: "localStorage",
          sync_status: "profile_candidate",
        }],
      })
      .expect(413);

    expect(receipt.body).toMatchObject({
      ok: false,
      error: "profile_storage_quota_exceeded",
      quota_bytes: 1024 * 1024,
    });
  });

  it("starts a Google web-auth profile session keyed by provider subject", async () => {
    const receipt = await signInWebAccountSession({
      provider: "google",
      provider_subject: "google-sub-123",
      display_name: "DatDamPig",
      email: "dan@example.com",
      picture_url: "https://example.com/avatar.png",
    });

    expect(receipt).toMatchObject({
      ok: true,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      session: {
        profile: {
          profile_id: "google:google-sub-123",
          display_name: "DatDamPig",
          email: "dan@example.com",
          auth_mode: "web_auth",
          provider: "google",
          provider_subject: "google-sub-123",
          picture_url: "https://example.com/avatar.png",
        },
        memory_scope: "profile",
      },
    });
    expect(receipt.session?.profile.profile_id).not.toBe("dan@example.com");
  });

  it("creates and signs into a public password profile without granting developer policy", async () => {
    const app = createApp();
    const agent = request.agent(app);
    const signUp = await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "user@example.com",
        password: "correct horse battery staple",
        display_name: "Public User",
      })
      .expect(200);

    expect(signUp.body).toMatchObject({
      ok: true,
      raw_password_stored: false,
      credential_collection_allowed_in_agents: false,
      auth_method: "password_account",
      session: {
        profile: {
          display_name: "Public User",
          email: "user@example.com",
          email_verified_at: null,
          auth_mode: "password_account",
          account_type: "user",
        },
        account_policy: {
          account_type: "user",
        },
      },
    });
    expect(signUp.body.session.profile.profile_id).not.toBe("user@example.com");
    expect(JSON.stringify(signUp.body)).not.toContain("correct horse battery staple");

    await agent.post("/api/account/session/sign-out").expect(200);

    const signIn = await agent
      .post("/api/account/session/account-sign-in")
      .send({
        email: "USER@example.com",
        password: "correct horse battery staple",
      })
      .expect(200);

    expect(signIn.body.session.profile).toMatchObject({
      email: "user@example.com",
      auth_mode: "password_account",
      account_type: "user",
    });
    expect(JSON.stringify(signIn.body)).not.toContain("correct horse battery staple");
  });

  it("grants developer policy to whitelisted emails through the same password account portal", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HELIX_DEVELOPER_PROFILE_IDS", "dev-user@example.com");
    const app = createApp();
    const agent = request.agent(app);
    const signUp = await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "dev-user@example.com",
        password: "developer portal password",
        display_name: "Developer Portal User",
      })
      .expect(200);

    expect(signUp.body.session.profile).toMatchObject({
      email: "dev-user@example.com",
      auth_mode: "password_account",
      account_type: "developer",
    });
    expect(signUp.body.session.account_policy).toMatchObject({
      account_type: "developer",
      allowed_panels: ["*"],
      allowed_runtime_agents: ["*"],
    });

    await agent.post("/api/account/session/sign-out").expect(200);
    const signIn = await agent
      .post("/api/account/session/account-sign-in")
      .send({
        email: "DEV-user@example.com",
        password: "developer portal password",
      })
      .expect(200);

    expect(signIn.body.session.profile.account_type).toBe("developer");
    expect(signIn.body.session.account_policy.allowed_panels).toEqual(["*"]);
  });

  it("tracks failed public sign-ins and returns a generic reset hint after three misses", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "hint-user@example.com",
        password: "correct profile password",
        display_name: "Hint User",
      })
      .expect(200);
    await agent.post("/api/account/session/sign-out").expect(200);

    for (const attempt of [1, 2, 3]) {
      const response = await request(app)
        .post("/api/account/session/account-sign-in")
        .send({
          email: "hint-user@example.com",
          password: "wrong profile password",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        ok: false,
        message: "Sign-in failed. Check your email and password.",
        error: "invalid_password_account_credentials",
        show_password_reset_hint: attempt >= 3,
      });
      expect(JSON.stringify(response.body)).not.toContain("wrong profile password");
    }

    const missingEmail = await request(app)
      .post("/api/account/session/account-sign-in")
      .send({
        email: "missing-profile@example.com",
        password: "wrong profile password",
      })
      .expect(401);
    expect(missingEmail.body).toMatchObject({
      message: "Sign-in failed. Check your email and password.",
      error: "invalid_password_account_credentials",
    });

    const success = await request(app)
      .post("/api/account/session/account-sign-in")
      .send({
        email: "hint-user@example.com",
        password: "correct profile password",
      })
      .expect(200);
    expect(success.body.show_password_reset_hint).toBe(false);
  });

  it("verifies password-account email with a hashed one-use token", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "verify-user@example.com",
        password: "correct horse battery staple",
        display_name: "Verify User",
      })
      .expect(200);

    const tokenReceipt = await agent
      .post("/api/account/session/email-verification/request")
      .expect(200);

    expect(tokenReceipt.body).toMatchObject({
      ok: true,
      token_value_shown_once: true,
      raw_secret_stored: false,
    });
    expect(tokenReceipt.body.token_value).toMatch(/^acct_verify_/);

    const before = await getPool().query<{ password_hash: string; subject: string }>(
      `
        SELECT password_hash, subject
        FROM helix_account_credentials
        WHERE credential_type = 'email_verification'
          AND lower(subject) = lower($1)
          AND revoked_at IS NULL
        LIMIT 1
      `,
      ["verify-user@example.com"],
    );
    expect(before.rows[0]?.subject).toBe("verify-user@example.com");
    expect(before.rows[0]?.password_hash).not.toBe(tokenReceipt.body.token_value);

    await request(app)
      .post("/api/account/session/email-verification/confirm")
      .send({ token_value: tokenReceipt.body.token_value })
      .expect(200);

    const status = await agent.get("/api/account/session").expect(200);
    expect(status.body.session.profile.email_verified_at).toBeTruthy();
    expect(status.body.session.profile.account_type).toBe("user");

    await request(app)
      .post("/api/account/session/email-verification/confirm")
      .send({ token_value: tokenReceipt.body.token_value })
      .expect(400);
  });

  it("resets password-account passwords with a hashed one-use token and revokes active sessions", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "reset-user@example.com",
        password: "old profile password",
        display_name: "Reset User",
      })
      .expect(200);

    const tokenReceipt = await request(app)
      .post("/api/account/session/password-reset/request")
      .send({ email: "RESET-user@example.com" })
      .expect(200);

    expect(tokenReceipt.body).toMatchObject({
      ok: true,
      token_value_shown_once: true,
      raw_secret_stored: false,
      message: "If a workstation profile exists for that email, a password reset link has been sent.",
      email_delivery: {
        queued: true,
        provider: "local",
        status: "queued",
      },
    });
    expect(tokenReceipt.body.token_value).toMatch(/^acct_reset_/);
    const outbox = await listEmailOutboxRecords({
      recipient: "reset-user@example.com",
      template: "password_reset",
    });
    expect(outbox[0]).toMatchObject({
      recipient: "reset-user@example.com",
      template: "password_reset",
      provider: "local",
      status: "queued",
    });
    expect(outbox[0]?.text_body).toContain("/account/reset-password?token=");
    expect(outbox[0]?.text_body).toContain(tokenReceipt.body.token_value);

    const stored = await getPool().query<{ password_hash: string }>(
      `
        SELECT password_hash
        FROM helix_account_credentials
        WHERE credential_type = 'password_reset'
          AND lower(subject) = lower($1)
          AND revoked_at IS NULL
        LIMIT 1
      `,
      ["reset-user@example.com"],
    );
    expect(stored.rows[0]?.password_hash).not.toBe(tokenReceipt.body.token_value);

    await request(app)
      .post("/api/account/session/password-reset/confirm")
      .send({
        token_value: tokenReceipt.body.token_value,
        password: "new profile password",
      })
      .expect(200);

    const oldSessionStatus = await agent.get("/api/account/session").expect(200);
    expect(oldSessionStatus.body.session).toBeNull();

    await request(app)
      .post("/api/account/session/account-sign-in")
      .send({
        email: "reset-user@example.com",
        password: "old profile password",
      })
      .expect(401);

    const newSignIn = await request(app)
      .post("/api/account/session/account-sign-in")
      .send({
        email: "reset-user@example.com",
        password: "new profile password",
      })
      .expect(200);
    expect(newSignIn.body.session.profile).toMatchObject({
      auth_mode: "password_account",
      account_type: "user",
    });

    await request(app)
      .post("/api/account/session/password-reset/confirm")
      .send({
        token_value: tokenReceipt.body.token_value,
        password: "another new password",
      })
      .expect(400);
  });

  it("returns generic password reset request receipts without emailing unknown accounts", async () => {
    const app = createApp();
    await request(app)
      .post("/api/account/session/sign-up")
      .send({
        email: "known-reset@example.com",
        password: "known reset password",
        display_name: "Known Reset",
      })
      .expect(200);

    const unknown = await request(app)
      .post("/api/account/session/password-reset/request")
      .send({ email: "unknown-reset@example.com" })
      .expect(200);
    expect(unknown.body).toMatchObject({
      ok: true,
      message: "If a workstation profile exists for that email, a password reset link has been sent.",
      token_value_shown_once: false,
      token_value: null,
      email_delivery: {
        queued: false,
      },
    });
    expect(await listEmailOutboxRecords({ recipient: "unknown-reset@example.com" })).toEqual([]);

    const known = await request(app)
      .post("/api/account/session/password-reset/request")
      .send({ email: "known-reset@example.com" })
      .expect(200);
    expect(known.body).toMatchObject({
      ok: true,
      message: unknown.body.message,
      email_delivery: {
        queued: true,
      },
    });
    expect(await listEmailOutboxRecords({ recipient: "known-reset@example.com" })).toHaveLength(1);
  });

  it("rejects expired password reset tokens", async () => {
    const app = createApp();
    await request(app)
      .post("/api/account/session/sign-up")
      .send({
        email: "expired-reset@example.com",
        password: "expired reset password",
        display_name: "Expired Reset",
      })
      .expect(200);

    const tokenReceipt = await request(app)
      .post("/api/account/session/password-reset/request")
      .send({ email: "expired-reset@example.com" })
      .expect(200);

    await getPool().query(
      `
        UPDATE helix_account_credentials
        SET expires_at = now() - interval '1 minute'
        WHERE credential_type = 'password_reset'
          AND lower(subject) = lower($1);
      `,
      ["expired-reset@example.com"],
    );

    await request(app)
      .post("/api/account/session/password-reset/confirm")
      .send({
        token_value: tokenReceipt.body.token_value,
        password: "new expired reset password",
      })
      .expect(400);
  });

  it("rate-limits repeated password reset email jobs while preserving generic responses", async () => {
    const app = createApp();
    await request(app)
      .post("/api/account/session/sign-up")
      .send({
        email: "limited-reset@example.com",
        password: "limited reset password",
        display_name: "Limited Reset",
      })
      .expect(200);

    for (let index = 0; index < 7; index += 1) {
      const response = await request(app)
        .post("/api/account/session/password-reset/request")
        .send({ email: "limited-reset@example.com" })
        .expect(200);
      expect(response.body).toMatchObject({
        ok: true,
        message: "If a workstation profile exists for that email, a password reset link has been sent.",
      });
    }

    const outbox = await listEmailOutboxRecords({
      recipient: "limited-reset@example.com",
      template: "password_reset",
      limit: 20,
    });
    expect(outbox).toHaveLength(5);
  });

  it("exports encrypted profile storage and deletes profile data for password accounts", async () => {
    const app = createApp();
    const agent = request.agent(app);
    const signUp = await agent
      .post("/api/account/session/sign-up")
      .send({
        email: "storage-user@example.com",
        password: "profile storage password",
        display_name: "Storage User",
      })
      .expect(200);
    const profileId = signUp.body.session.profile.profile_id;

    await agent
      .post("/api/account/profile-storage/snapshot")
      .send({
        entries: [{
          storage_key: "agi-chat-sessions-v1",
          storage_backend: "localStorage",
          value: "{\"state\":{\"sessions\":{\"one\":{\"title\":\"private chat\"}}}}",
        }],
        artifacts: [{
          artifact_id: "artifact:private-chat",
          artifact_type: "helix_chat_session",
          storage_key: "agi-chat-sessions-v1",
          storage_backend: "localStorage",
          sync_status: "profile_candidate",
        }],
      })
      .expect(200);

    const { rows } = await getPool().query<{
      snapshot: Record<string, unknown>;
      encrypted_snapshot: string | null;
      encryption_algorithm: string | null;
    }>(
      `SELECT snapshot, encrypted_snapshot, encryption_algorithm FROM helix_account_profile_storage WHERE profile_id = $1`,
      [profileId],
    );
    expect(rows[0]?.encrypted_snapshot).toMatch(/^v1:/);
    expect(rows[0]?.encryption_algorithm).toBe("aes-256-gcm");
    expect(JSON.stringify(rows[0]?.snapshot)).not.toContain("private chat");

    const exported = await agent.get("/api/account/profile-storage/export").expect(200);
    expect(exported.body).toMatchObject({
      ok: true,
      raw_profile_content_included: true,
      snapshot: {
        profile_id: profileId,
        raw_profile_content_included: true,
      },
    });
    expect(exported.body.snapshot.entries[0].value).toContain("private chat");

    await agent.delete("/api/account/profile").expect(200);
    const status = await agent.get("/api/account/session").expect(200);
    expect(status.body.session).toBeNull();

    await agent
      .post("/api/account/session/account-sign-in")
      .send({
        email: "storage-user@example.com",
        password: "profile storage password",
      })
      .expect(401);
  });

  it("persists account sessions through a fresh app instance when the cookie is retained", async () => {
    const firstApp = createApp();
    const signIn = await request(firstApp)
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:persistent-user",
        display_name: "Persistent User",
        account_type: "user",
      })
      .expect(200);
    const cookie = signIn.headers["set-cookie"]?.[0];
    expect(cookie).toContain("helix_session=");

    const restartedApp = createApp();
    const status = await request(restartedApp)
      .get("/api/account/session")
      .set("Cookie", cookie ?? "")
      .expect(200);

    expect(status.body.session.profile).toMatchObject({
      profile_id: "profile:persistent-user",
      display_name: "Persistent User",
      account_type: "user",
    });
  });

  it("revokes a persisted session on sign out", async () => {
    const app = createApp();
    const signIn = await request(app)
      .post("/api/account/session/sign-in")
      .send({
        profile_id: "profile:sign-out-user",
        display_name: "Sign Out User",
        account_type: "user",
      })
      .expect(200);
    const cookie = signIn.headers["set-cookie"]?.[0] ?? "";

    await request(app)
      .post("/api/account/session/sign-out")
      .set("Cookie", cookie)
      .expect(200);

    const status = await request(createApp())
      .get("/api/account/session")
      .set("Cookie", cookie)
      .expect(200);
    expect(status.body.session).toBeNull();
    expect(status.body.account_policy.account_type).toBe("user");
  });

  it("reports usage from the thread ledger and linked Discord commander sessions", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:datdampig", display_name: "DatDamPig" })
      .expect(200);
    appendHelixThreadEvent({
      route: "/ask",
      thread_id: "helix-ask:account-test",
      turn_id: "turn:account-test",
      event_type: "item_completed",
      item_id: "item:answer",
      item_type: "answer",
      item_status: "completed",
      assistant_text: "Test answer",
    });
    const session = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-account",
        voice_channel_id: "voice-account",
        thread_id: "helix-ask:discord-account",
      })
      .expect(200);
    const linkCode = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: session.body.session.session_id,
        discord_user_id: "discord-account-user",
        display_name: "DatDamPig",
      })
      .expect(200);
    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linkCode.body.code.code,
        profile_id: "profile:datdampig",
        discord_user_id: "discord-account-user",
      })
      .expect(200);

    const status = await agent.get("/api/account/session").expect(200);

    expect(status.body).toMatchObject({
      ok: true,
      auth_boundary: {
        credential_collection_allowed_in_agents: false,
        raw_password_stored: false,
        discord_bot_password_collection_allowed: false,
      },
    });
    expect(status.body.usage.answer_count).toBeGreaterThanOrEqual(1);
    expect(status.body.linked_accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: "local", authority: "owner" }),
        expect.objectContaining({ provider: "discord", authority: "commander" }),
      ]),
    );
  });

  it("creates a profile ingress token and accepts scoped bearer events as observations", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:datdampig", display_name: "DatDamPig" })
      .expect(200);

    const tokenReceipt = await agent
      .post("/api/account/profile-ingress/token")
      .send({ label: "Minehut bridge", scopes: ["source_event", "live_environment_event"] })
      .expect(200);

    expect(tokenReceipt.body).toMatchObject({
      ok: true,
      token_value_shown_once: true,
      secret_stored_raw: false,
      token: {
        profile_id: "profile:datdampig",
        label: "Minehut bridge",
        secret_stored_raw: false,
      },
    });
    expect(tokenReceipt.body.token_value).toMatch(/^prof_live_/);
    expect(JSON.stringify(tokenReceipt.body.token).includes(tokenReceipt.body.token_value)).toBe(false);

    await request(app)
      .post("/api/profile-ingress/profile:datdampig/events")
      .send({ source_id: "minehut:test", payload: { event_type: "player_damage", health: 4 } })
      .expect(401);

    const accepted = await request(app)
      .post("/api/profile-ingress/profile:datdampig/events")
      .set("Authorization", `Bearer ${tokenReceipt.body.token_value}`)
      .send({
        source_id: "minehut:test",
        thread_id: "helix-ask:profile-ingress",
        payload: { event_type: "player_damage", health: 4 },
      })
      .expect(200);

    expect(accepted.body).toMatchObject({
      ok: true,
      accepted: true,
      profile_id: "profile:datdampig",
      raw_secret_included: false,
      context_policy: "compact_context_pack_only",
    });
    const status = await agent.get("/api/account/session").expect(200);
    expect(status.body.profile_ingress_usage).toMatchObject({
      request_count: 2,
      accepted_count: 1,
      rejected_count: 1,
    });
    expect(status.body.profile_ingress_tokens[0]).toMatchObject({
      request_count: 1,
      secret_stored_raw: false,
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:profile-ingress" });
    expect(events.some((event) => event.item_type === "toolObservation")).toBe(true);
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
    expect(JSON.stringify(events)).not.toContain(tokenReceipt.body.token_value);
  });
});
