import express from "express";
import request from "supertest";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { voiceRouter } from "../server/routes/voice";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/voice", voiceRouter);
  return app;
};

const uniqueId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const ORIGINAL_ENV = {
  VOICE_PROXY_DRY_RUN: process.env.VOICE_PROXY_DRY_RUN,
  TTS_BASE_URL: process.env.TTS_BASE_URL,
};

describe("voice routes", () => {
  afterEach(() => {
    if (ORIGINAL_ENV.VOICE_PROXY_DRY_RUN === undefined) {
      delete process.env.VOICE_PROXY_DRY_RUN;
    } else {
      process.env.VOICE_PROXY_DRY_RUN = ORIGINAL_ENV.VOICE_PROXY_DRY_RUN;
    }
    if (ORIGINAL_ENV.TTS_BASE_URL === undefined) {
      delete process.env.TTS_BASE_URL;
    } else {
      process.env.TTS_BASE_URL = ORIGINAL_ENV.TTS_BASE_URL;
    }
  });

  it("rejects invalid payloads with deterministic envelope", async () => {
    delete process.env.VOICE_PROXY_DRY_RUN;
    delete process.env.TTS_BASE_URL;
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({ text: " " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("voice_invalid_request");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.details).toBeTruthy();
  });

  it("requires consent_asserted when reference audio is provided", async () => {
    delete process.env.VOICE_PROXY_DRY_RUN;
    delete process.env.TTS_BASE_URL;
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Reference clip detected.",
      referenceAudioHash: "sha256:test-ref",
      consent_asserted: false,
      traceId: "trace-consent",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("voice_consent_required");
    expect(res.body.traceId).toBe("trace-consent");
  });

  it("returns voice_unavailable when backend is not configured", async () => {
    delete process.env.VOICE_PROXY_DRY_RUN;
    delete process.env.TTS_BASE_URL;
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Speak this callout.",
      mode: "callout",
      priority: "info",
      traceId: "trace-unconfigured",
    });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("voice_unavailable");
    expect(res.body.traceId).toBe("trace-unconfigured");
    expect(res.body.details?.providerConfigured).toBe(false);
  });

  it("supports dry-run mode and suppresses dedupe duplicates", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    delete process.env.TTS_BASE_URL;
    const app = buildApp();
    const missionId = uniqueId("mission");
    const dedupeKey = uniqueId("event");

    const first = await request(app).post("/api/voice/speak").send({
      text: "Evidence gate passed.",
      mode: "callout",
      priority: "warn",
      missionId,
      eventId: dedupeKey,
      dedupe_key: dedupeKey,
      traceId: "trace-first",
    });
    expect(first.status).toBe(200);
    expect(first.body.ok).toBe(true);
    expect(first.body.dryRun).toBe(true);

    const second = await request(app).post("/api/voice/speak").send({
      text: "Evidence gate passed.",
      mode: "callout",
      priority: "warn",
      missionId,
      eventId: dedupeKey,
      dedupe_key: dedupeKey,
      traceId: "trace-second",
    });
    expect(second.status).toBe(200);
    expect(second.body.suppressed).toBe(true);
    expect(second.body.reason).toBe("dedupe_cooldown");
  });

  it("enforces mission-level rate cap for non-critical callouts", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    delete process.env.TTS_BASE_URL;
    const app = buildApp();
    const missionId = uniqueId("mission-rate");

    const send = (eventId: string) =>
      request(app).post("/api/voice/speak").send({
        text: "Status update.",
        mode: "callout",
        priority: "info",
        missionId,
        eventId,
        dedupe_key: eventId,
      });

    const first = await send(uniqueId("evt"));
    const second = await send(uniqueId("evt"));
    const third = await send(uniqueId("evt"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error).toBe("voice_rate_limited");
  });

  it("proxies configured backend audio bytes", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "0";
    const upstreamApp = express();
    upstreamApp.use(express.json());
    upstreamApp.post("/speak", (_req, res) => {
      res.setHeader("content-type", "audio/wav");
      res.status(200).send(Buffer.from("RIFFTESTWAVE", "utf8"));
    });
    const upstreamServer = await new Promise<Server>((resolve) => {
      const server = upstreamApp.listen(0, () => resolve(server));
    });

    try {
      const address = upstreamServer.address();
      if (!address || typeof address !== "object") {
        throw new Error("Failed to resolve upstream listen port");
      }
      process.env.TTS_BASE_URL = `http://127.0.0.1:${address.port}`;
      const app = buildApp();

      const res = await request(app)
        .post("/api/voice/speak")
        .buffer(true)
        .parse((response, callback) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => callback(null, Buffer.concat(chunks)));
        })
        .send({
          text: "Proxy this voice message.",
          mode: "callout",
          priority: "action",
          missionId: uniqueId("mission-audio"),
          eventId: uniqueId("event-audio"),
        });

      expect(res.status).toBe(200);
      expect(res.headers["x-voice-provider"]).toBe("proxy");
      expect(res.headers["content-type"]).toContain("audio/wav");
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect((res.body as Buffer).length).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve) => upstreamServer.close(() => resolve()));
    }
  });
});
