import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { discordRouter } from "../routes/discord";
import {
  resetDiscordSessionStore,
} from "../services/situation-room/discord-session-store";
import {
  createProfileIngressToken,
  ingestProfileIngressEvent,
  resetProfileIngressStore,
} from "../services/helix-account/profile-ingress-store";
import { getCompanionPolicy, resetCompanionPolicies } from "../services/situation-room/companion-policy-engine";
import {
  getLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  __resetHelixThreadLedgerStore,
  getHelixThreadLedgerEvents,
} from "../services/helix-thread/ledger";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/discord", discordRouter);
  return app;
};

describe("Discord session bridge", () => {
  beforeEach(() => {
    delete process.env.HELIX_DISCORD_BOT_REQUIRE_TOKEN;
    delete process.env.HELIX_DISCORD_BOT_SHARED_TOKEN;
    resetDiscordSessionStore();
    resetCompanionPolicies();
    resetLiveAnswerEnvironments();
    resetProfileIngressStore();
    __resetHelixThreadLedgerStore();
  });

  it("requires bot-service auth when configured without leaking the token", async () => {
    process.env.HELIX_DISCORD_BOT_REQUIRE_TOKEN = "1";
    process.env.HELIX_DISCORD_BOT_SHARED_TOKEN = "super-secret-discord-token";
    const app = createApp();

    const missing = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-auth",
        voice_channel_id: "voice-auth",
      })
      .expect(401);

    expect(missing.body).toMatchObject({
      ok: false,
      error: "discord_bot_auth_required",
      credential_collection_allowed: false,
    });
    expect(JSON.stringify(missing.body)).not.toContain("super-secret-discord-token");

    await request(app)
      .post("/api/discord/session/start")
      .set("Authorization", "Bearer super-secret-discord-token")
      .send({
        guild_id: "guild-auth",
        voice_channel_id: "voice-auth",
      })
      .expect(200);
  });

  it("starts an unlinked voice session without credential collection fields", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-1",
        voice_channel_id: "voice-1",
        text_channel_id: "text-1",
        thread_id: "helix-ask:discord-test",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      credential_collection_allowed: false,
      session: {
        guild_id: "guild-1",
        voice_channel_id: "voice-1",
        status: "unlinked",
        thread_id: "helix-ask:discord-test",
      },
    });
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain("password");
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:discord-test" });
    expect(events.some((event) => event.item_type === "toolObservation")).toBe(true);
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
  });

  it("creates and consumes a short-lived single-use profile link code", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-2",
        voice_channel_id: "voice-2",
        thread_id: "helix-ask:discord-link",
      })
      .expect(200);

    const linked = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: started.body.session.session_id,
        discord_user_id: "discord-user-1",
        display_name: "DatDamPig",
        public_base_url: "https://casimirbot.com",
      })
      .expect(200);

    expect(linked.body).toMatchObject({
      ok: true,
      credential_collection_allowed: false,
      code: {
        session_id: started.body.session.session_id,
        discord_user_id: "discord-user-1",
        single_use: true,
        credential_collection_allowed: false,
      },
    });
    expect(linked.body.code.link_url).toContain("/link-discord?code=");

    const completed = await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linked.body.code.code,
        profile_id: "profile:datdampig",
        discord_user_id: "discord-user-1",
      })
      .expect(200);

    expect(completed.body).toMatchObject({
      ok: true,
      linked_profile_id: "profile:datdampig",
      commander_discord_user_id: "discord-user-1",
      credential_collection_allowed: false,
    });
    expect(getCompanionPolicy("helix-ask:discord-link")).toMatchObject({
      voice_input_active: true,
      voice_output_enabled: false,
      companion_mode: "direct_address_only",
      commentary_mode: "off",
      allowed_outputs: ["silent_keep_in_context", "show_text", "start_user_turn"],
    });

    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linked.body.code.code,
        profile_id: "profile:datdampig",
        discord_user_id: "discord-user-1",
      })
      .expect(400);
  });

  it("routes Discord direct-address transcript through the voice lane without hidden answers", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-3",
        voice_channel_id: "voice-3",
        thread_id: "helix-ask:discord-voice",
      })
      .expect(200);
    const linkCode = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: started.body.session.session_id,
        discord_user_id: "discord-user-voice",
      })
      .expect(200);
    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linkCode.body.code.code,
        profile_id: "profile:voice",
        discord_user_id: "discord-user-voice",
      })
      .expect(200);

    const event = await request(app)
      .post("/api/discord/source-event")
      .send({
        session_id: started.body.session.session_id,
        event_type: "direct_address",
        discord_user_id: "discord-user-voice",
        text: "Helix, what just happened?",
        evidence_refs: ["discord:test:direct"],
      })
      .expect(200);

    expect(event.body).toMatchObject({
      ok: true,
      voice_lane_receipt: {
        ok: true,
        decision: "start_user_turn",
        classification: {
          direct_addressed: true,
          conversation_mode: "direct_address",
        },
      },
      ask_turn_bridge: {
        ok: true,
        decision: "queued",
        answer_created: false,
      },
      direct_address_receipt: {
        decision: "start_user_turn",
        prompt_text: "Helix, what just happened?",
        answer_created: false,
        credential_collection_allowed: false,
      },
      credential_collection_allowed: false,
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:discord-voice" });
    expect(events.some((ledgerEvent) => ledgerEvent.item_type === "answer")).toBe(false);
    expect(events.every((ledgerEvent) => !ledgerEvent.assistant_text)).toBe(true);
  });

  it("records Discord voice output as a delivery receipt, not an answer", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-4",
        voice_channel_id: "voice-4",
        thread_id: "helix-ask:discord-output",
      })
      .expect(200);

    const receipt = await request(app)
      .post("/api/discord/voice-output/receipt")
      .send({
        session_id: started.body.session.session_id,
        delivered: false,
        channel: "none",
        reason: "voice_not_enabled",
        evidence_refs: ["discord:test:voice-output"],
      })
      .expect(200);

    expect(receipt.body).toMatchObject({
      ok: true,
      receipt: {
        delivered: false,
        reason: "voice_not_enabled",
        raw_audio_included: false,
        raw_transcript_included: false,
      },
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:discord-output" });
    expect(events.some((event) => event.item_type === "toolObservation")).toBe(true);
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
  });

  it("keeps unlinked participants from command-authorized direct-address turns", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-guest",
        voice_channel_id: "voice-guest",
        thread_id: "helix-ask:discord-guest",
      })
      .expect(200);
    const linkCode = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: started.body.session.session_id,
        discord_user_id: "commander-user",
      })
      .expect(200);
    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linkCode.body.code.code,
        profile_id: "profile:commander",
        discord_user_id: "commander-user",
      })
      .expect(200);

    const event = await request(app)
      .post("/api/discord/source-event")
      .send({
        session_id: started.body.session.session_id,
        event_type: "direct_address",
        discord_user_id: "guest-user",
        display_name: "Guest",
        text: "Helix, open the calculator",
        evidence_refs: ["discord:test:guest"],
      })
      .expect(200);

    expect(event.body).toMatchObject({
      ok: true,
      voice_lane_receipt: {
        decision: "record_context",
        classification: {
          speaker_authority: "untrusted_speaker",
        },
      },
      ask_turn_bridge: {
        decision: "not_requested",
        answer_created: false,
      },
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:discord-guest" });
    expect(events.some((ledgerEvent) => ledgerEvent.item_type === "answer")).toBe(false);
  });

  it("does not invent a Minecraft source when the linked profile has no active ingress source", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-missing-mc",
        voice_channel_id: "voice-missing-mc",
        thread_id: "helix-ask:discord-missing-minecraft",
      })
      .expect(200);
    const linkCode = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: started.body.session.session_id,
        discord_user_id: "discord-missing-mc-user",
      })
      .expect(200);
    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linkCode.body.code.code,
        profile_id: "profile:no-mc",
        discord_user_id: "discord-missing-mc-user",
      })
      .expect(200);

    const attached = await request(app)
      .post(`/api/discord/session/${encodeURIComponent(started.body.session.session_id)}/attach-minecraft`)
      .send({})
      .expect(400);

    expect(attached.body).toMatchObject({
      ok: false,
      error: "missing_source",
      resolution: {
        resolved: false,
        reason: "missing_source",
      },
      credential_collection_allowed: false,
    });
  });

  it("attaches Minecraft from a linked profile ingress source", async () => {
    const app = createApp();
    const started = await request(app)
      .post("/api/discord/session/start")
      .send({
        guild_id: "guild-mc",
        voice_channel_id: "voice-mc",
        thread_id: "helix-ask:discord-minecraft",
      })
      .expect(200);
    const linkCode = await request(app)
      .post("/api/discord/session/link-code")
      .send({
        session_id: started.body.session.session_id,
        discord_user_id: "discord-mc-user",
      })
      .expect(200);
    await request(app)
      .post("/api/discord/session/complete-link")
      .send({
        code: linkCode.body.code.code,
        profile_id: "profile:mc",
        discord_user_id: "discord-mc-user",
      })
      .expect(200);
    const token = createProfileIngressToken({
      profile_id: "profile:mc",
      label: "Minehut bridge",
      scopes: ["source_event", "minecraft_bridge"],
    });
    expect(token.ok).toBe(true);
    const ingress = ingestProfileIngressEvent({
      profile_id: "profile:mc",
      authorization: `Bearer ${token.token_value}`,
      source_id: "source:minehut:datdampig",
      payload: {
        source_family: "minecraft_events",
        world_id: "minecraft:minehut",
        room_id: "room:minehut",
        event_type: "source_health",
      },
    });
    expect(ingress.ok).toBe(true);

    const attached = await request(app)
      .post(`/api/discord/session/${encodeURIComponent(started.body.session.session_id)}/attach-minecraft`)
      .send({})
      .expect(200);

    expect(attached.body).toMatchObject({
      ok: true,
      credential_collection_allowed: false,
      resolution: {
        resolved: true,
        source_id: "source:minehut:datdampig",
      },
      session: {
        thread_id: "helix-ask:discord-minecraft",
      },
    });
    expect(attached.body.environment_id).toBeTruthy();
    const environment = getLiveAnswerEnvironment(attached.body.environment_id);
    expect(environment).toMatchObject({
      thread_id: "helix-ask:discord-minecraft",
      preset: "minecraft_run_monitor",
      raw_transcript_included: false,
      raw_audio_included: false,
    });
    expect(environment?.source_ids).toEqual(
      expect.arrayContaining(["source:minehut:datdampig", `discord:${started.body.session.session_id}:voice`]),
    );
  });
});
