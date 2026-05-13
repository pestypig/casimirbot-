import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { discordRouter } from "../routes/discord";
import {
  resetDiscordSessionStore,
} from "../services/situation-room/discord-session-store";
import { resetCompanionPolicies } from "../services/situation-room/companion-policy-engine";
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
    resetDiscordSessionStore();
    resetCompanionPolicies();
    __resetHelixThreadLedgerStore();
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
});
