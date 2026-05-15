import crypto from "node:crypto";
import express, { type Request } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discordRouter } from "../routes/discord";
import {
  resetDiscordInteractionReceipts,
} from "../services/discord/discord-interaction-router";
import {
  listDiscordFollowupRecords,
  resetDiscordFollowupRecords,
} from "../services/discord/discord-followup-client";
import {
  setDiscordHelixAskExecutorForTests,
} from "../services/discord/discord-helix-ask-bridge";
import { resetDiscordSessionStore } from "../services/situation-room/discord-session-store";

type SignedInteraction = {
  body: string;
  timestamp: string;
  signature: string;
};

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }));
  app.use("/api/discord", discordRouter);
  return app;
};

function createDiscordSigningContext() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicDer = publicKey.export({ format: "der", type: "spki" }) as Buffer;
  const publicKeyHex = publicDer.subarray(-32).toString("hex");
  return {
    publicKeyHex,
    sign(body: unknown): SignedInteraction {
      const raw = typeof body === "string" ? body : JSON.stringify(body);
      const timestamp = "1778810000";
      const signature = crypto
        .sign(null, Buffer.concat([Buffer.from(timestamp, "utf8"), Buffer.from(raw, "utf8")]), privateKey)
        .toString("hex");
      return { body: raw, timestamp, signature };
    },
  };
}

function baseInteraction(data: Record<string, unknown>) {
  return {
    id: "interaction-1",
    application_id: "app-1",
    type: 2,
    guild_id: "guild-1",
    channel_id: "channel-1",
    token: "interaction-token-1",
    member: {
      user: {
        id: "discord-user-1",
        username: "DatDamPig",
      },
    },
    data,
  };
}

function postSigned(app: express.Express, signed: SignedInteraction) {
  return request(app)
    .post("/api/discord/interactions")
    .set("Content-Type", "application/json")
    .set("X-Signature-Ed25519", signed.signature)
    .set("X-Signature-Timestamp", signed.timestamp)
    .send(signed.body);
}

describe("Discord interactions endpoint", () => {
  let signing: ReturnType<typeof createDiscordSigningContext>;

  beforeEach(() => {
    signing = createDiscordSigningContext();
    process.env.DISCORD_PUBLIC_KEY = signing.publicKeyHex;
    delete process.env.HELIX_DISCORD_BOT_REQUIRE_TOKEN;
    delete process.env.DISCORD_BOT_TOKEN;
    resetDiscordSessionStore();
    resetDiscordInteractionReceipts();
    resetDiscordFollowupRecords();
    setDiscordHelixAskExecutorForTests(null);
  });

  afterEach(() => {
    setDiscordHelixAskExecutorForTests(null);
  });

  it("returns PONG for a valid signed Discord PING", async () => {
    const app = createApp();
    const signed = signing.sign({ id: "ping-1", application_id: "app-1", type: 1 });
    const response = await postSigned(app, signed).expect(200);
    expect(response.body).toEqual({ type: 1 });
  });

  it("rejects missing and invalid signatures before command routing", async () => {
    const app = createApp();
    await request(app)
      .post("/api/discord/interactions")
      .send({ id: "ping-1", application_id: "app-1", type: 1 })
      .expect(401);

    const signed = signing.sign({ id: "ping-2", application_id: "app-1", type: 1 });
    await postSigned(app, { ...signed, signature: "0".repeat(128) }).expect(401);
  });

  it("starts a Helix Discord session through /helix start", async () => {
    const app = createApp();
    const signed = signing.sign(baseInteraction({
      name: "helix",
      options: [{ type: 1, name: "start" }],
    }));
    const response = await postSigned(app, signed).expect(200);
    expect(response.body.type).toBe(4);
    expect(response.body.data.content).toContain("Started Helix Discord session");

    const sessions = await request(app).get("/api/discord/sessions").expect(200);
    expect(sessions.body.sessions[0]).toMatchObject({
      guild_id: "guild-1",
      voice_channel_id: "channel-1",
      thread_id: "helix-ask:discord:guild-1:channel-1",
    });
    expect(sessions.body.interaction_endpoint.latest_interaction).toMatchObject({
      command: "start",
      answer_created: false,
    });
  });

  it("returns a profile link URL through /helix link without credential collection", async () => {
    const app = createApp();
    process.env.CASIMIRBOT_PUBLIC_URL = "https://casimirbot.com";
    const signed = signing.sign(baseInteraction({
      name: "helix",
      options: [{ type: 1, name: "link" }],
    }));
    const response = await postSigned(app, signed).expect(200);
    expect(response.body.type).toBe(4);
    expect(response.body.data.content).toContain("https://casimirbot.com/link-discord?code=");
    expect(response.body.data.content.toLowerCase()).not.toContain("password");
  });

  it("defers /helix ask, runs Helix Ask through the bridge, and records terminal-authoritative followup", async () => {
    const app = createApp();
    setDiscordHelixAskExecutorForTests(async (input) => ({
      ok: true,
      answer: `Terminal answer for: ${input.prompt}`,
      turn_id: "ask:discord-test",
      final_answer_source: "artifact_synthesis",
      terminal_artifact_kind: "assistant_answer",
      terminal_hash: "hash:terminal",
      poison_audit_ok: true,
      terminal_authority_ok: true,
      error: null,
    }));
    const signed = signing.sign(baseInteraction({
      name: "helix",
      options: [
        {
          type: 1,
          name: "ask",
          options: [{ type: 3, name: "prompt", value: "What is my current Minecraft situation?" }],
        },
      ],
    }));
    const response = await postSigned(app, signed).expect(200);
    expect(response.body).toEqual({ type: 5 });

    await new Promise((resolve) => setTimeout(resolve, 20));
    const followups = listDiscordFollowupRecords();
    expect(followups.at(-1)?.payload.content).toContain("Terminal answer for: What is my current Minecraft situation?");
    expect(followups.at(-1)?.payload.content).toContain("poison_audit: clean");

    const sessions = await request(app).get("/api/discord/sessions").expect(200);
    expect(sessions.body.interaction_endpoint.latest_interaction).toMatchObject({
      command: "ask",
      terminal_answer_source: "artifact_synthesis",
      terminal_hash: "hash:terminal",
      poison_audit_ok: true,
      answer_created: true,
    });
  });

  it("reports a safe Discord followup when Helix Ask fails the poison audit", async () => {
    const app = createApp();
    setDiscordHelixAskExecutorForTests(async () => ({
      ok: true,
      answer: "Unsafe fallback",
      final_answer_source: "client_fallback",
      terminal_artifact_kind: "fallback",
      terminal_hash: "hash:fallback",
      poison_audit_ok: false,
      terminal_authority_ok: true,
      error: null,
    }));
    const signed = signing.sign(baseInteraction({
      name: "helix",
      options: [
        {
          type: 1,
          name: "ask",
          options: [{ type: 3, name: "prompt", value: "Use Helix." }],
        },
      ],
    }));
    await postSigned(app, signed).expect(200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(listDiscordFollowupRecords().at(-1)?.payload.content).toContain("could not return a clean terminal answer");
    expect(listDiscordFollowupRecords().at(-1)?.payload.content).toContain("poison_audit: blocked");
  });
});
