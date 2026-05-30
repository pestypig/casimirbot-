import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
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
  app.use(express.json());
  app.use("/api/account", accountSessionRouter);
  app.use("/api/discord", discordRouter);
  app.use("/api/profile-ingress", profileIngressRouter);
  return app;
};

describe("account session panel API", () => {
  beforeEach(() => {
    resetAccountSessionStore();
    resetProfileIngressStore();
    resetDiscordSessionStore();
    __resetHelixThreadLedgerStore();
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

  it("starts a Google web-auth profile session keyed by provider subject", () => {
    const receipt = signInWebAccountSession({
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

  it("reports usage from the thread ledger and linked Discord commander sessions", async () => {
    const app = createApp();
    await request(app)
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

    const status = await request(app).get("/api/account/session").expect(200);

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
    await request(app)
      .post("/api/account/session/sign-in")
      .send({ profile_id: "profile:datdampig", display_name: "DatDamPig" })
      .expect(200);

    const tokenReceipt = await request(app)
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
    const status = await request(app).get("/api/account/session").expect(200);
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
