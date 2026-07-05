import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountSessionRouter } from "../routes/account-session";
import { discordRouter } from "../routes/discord";
import { profileIngressRouter } from "../routes/profile-ingress";
import {
  resetAccountSessionStore,
  signInWebAccountSession,
} from "../services/helix-account/account-session-store";
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
