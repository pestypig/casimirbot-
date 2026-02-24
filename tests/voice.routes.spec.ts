import express from "express";
import request from "supertest";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { resetVoiceRouteState, voiceRouter } from "../server/routes/voice";

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
  VOICE_PROVIDER_MODE: process.env.VOICE_PROVIDER_MODE,
  VOICE_PROVIDER_ALLOWLIST: process.env.VOICE_PROVIDER_ALLOWLIST,
  VOICE_COMMERCIAL_MODE: process.env.VOICE_COMMERCIAL_MODE,
  VOICE_MANAGED_PROVIDERS_ENABLED: process.env.VOICE_MANAGED_PROVIDERS_ENABLED,
  VOICE_LOCAL_ONLY_MISSION_MODE: process.env.VOICE_LOCAL_ONLY_MISSION_MODE,
  VOICE_BUDGET_MISSION_WINDOW_MS: process.env.VOICE_BUDGET_MISSION_WINDOW_MS,
  VOICE_BUDGET_MISSION_MAX_REQUESTS: process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS,
  VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS: process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS,
  VOICE_REPLAY_CLOCK_TRUSTED: process.env.VOICE_REPLAY_CLOCK_TRUSTED,
};

describe("voice routes", () => {
  afterEach(() => {
    resetVoiceRouteState();
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
    if (ORIGINAL_ENV.VOICE_PROVIDER_MODE === undefined) {
      delete process.env.VOICE_PROVIDER_MODE;
    } else {
      process.env.VOICE_PROVIDER_MODE = ORIGINAL_ENV.VOICE_PROVIDER_MODE;
    }
    if (ORIGINAL_ENV.VOICE_PROVIDER_ALLOWLIST === undefined) {
      delete process.env.VOICE_PROVIDER_ALLOWLIST;
    } else {
      process.env.VOICE_PROVIDER_ALLOWLIST = ORIGINAL_ENV.VOICE_PROVIDER_ALLOWLIST;
    }
    if (ORIGINAL_ENV.VOICE_COMMERCIAL_MODE === undefined) {
      delete process.env.VOICE_COMMERCIAL_MODE;
    } else {
      process.env.VOICE_COMMERCIAL_MODE = ORIGINAL_ENV.VOICE_COMMERCIAL_MODE;
    }
    if (ORIGINAL_ENV.VOICE_MANAGED_PROVIDERS_ENABLED === undefined) {
      delete process.env.VOICE_MANAGED_PROVIDERS_ENABLED;
    } else {
      process.env.VOICE_MANAGED_PROVIDERS_ENABLED = ORIGINAL_ENV.VOICE_MANAGED_PROVIDERS_ENABLED;
    }
    if (ORIGINAL_ENV.VOICE_LOCAL_ONLY_MISSION_MODE === undefined) {
      delete process.env.VOICE_LOCAL_ONLY_MISSION_MODE;
    } else {
      process.env.VOICE_LOCAL_ONLY_MISSION_MODE = ORIGINAL_ENV.VOICE_LOCAL_ONLY_MISSION_MODE;
    }
    if (ORIGINAL_ENV.VOICE_BUDGET_MISSION_WINDOW_MS === undefined) {
      delete process.env.VOICE_BUDGET_MISSION_WINDOW_MS;
    } else {
      process.env.VOICE_BUDGET_MISSION_WINDOW_MS = ORIGINAL_ENV.VOICE_BUDGET_MISSION_WINDOW_MS;
    }
    if (ORIGINAL_ENV.VOICE_BUDGET_MISSION_MAX_REQUESTS === undefined) {
      delete process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS;
    } else {
      process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS = ORIGINAL_ENV.VOICE_BUDGET_MISSION_MAX_REQUESTS;
    }
    if (ORIGINAL_ENV.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS === undefined) {
      delete process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS;
    } else {
      process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS = ORIGINAL_ENV.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS;
    }
    if (ORIGINAL_ENV.VOICE_REPLAY_CLOCK_TRUSTED === undefined) {
      delete process.env.VOICE_REPLAY_CLOCK_TRUSTED;
    } else {
      process.env.VOICE_REPLAY_CLOCK_TRUSTED = ORIGINAL_ENV.VOICE_REPLAY_CLOCK_TRUSTED;
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

  it("enforces local-only provider mode", async () => {
    process.env.VOICE_PROVIDER_MODE = "local_only";
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Remote callout",
      provider: "remote-tts",
      traceId: "trace-local-only",
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("voice_provider_not_allowed");
    expect(res.body.traceId).toBe("trace-local-only");
  });

  it("enforces commercial allowlist when enabled", async () => {
    process.env.VOICE_PROVIDER_MODE = "allow_remote";
    process.env.VOICE_PROVIDER_ALLOWLIST = "local-chatterbox,remote-approved";
    process.env.VOICE_COMMERCIAL_MODE = "1";
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const denied = await request(app).post("/api/voice/speak").send({
      text: "Denied callout",
      provider: "remote-denied",
    });
    expect(denied.status).toBe(403);
    expect(denied.body.error).toBe("voice_provider_not_allowed");

    const allowed = await request(app).post("/api/voice/speak").send({
      text: "Allowed callout",
      provider: "remote-approved",
    });
    expect(allowed.status).toBe(200);
    expect(allowed.body.ok).toBe(true);
  });


  it("routes mission-critical requests to local provider in local-only mission mode", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_LOCAL_ONLY_MISSION_MODE = "1";
    process.env.VOICE_PROVIDER_MODE = "allow_remote";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Critical escalation",
      priority: "critical",
      provider: "remote-approved",
      traceId: "trace-critical-local",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.provider).toBe("dry-run");
  });

  it("blocks managed providers when disabled for non-critical callouts", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_PROVIDER_MODE = "allow_remote";
    process.env.VOICE_MANAGED_PROVIDERS_ENABLED = "0";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Non-critical remote",
      priority: "warn",
      provider: "remote-tts",
      traceId: "trace-managed-disabled",
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("voice_provider_not_allowed");
    expect(res.body.details?.managedProvidersEnabled).toBe(false);
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
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
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
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
      eventId: dedupeKey,
      dedupe_key: dedupeKey,
      traceId: "trace-second",
    });
    expect(second.status).toBe(200);
    expect(second.body.suppressed).toBe(true);
    expect(second.body.reason).toBe("dedupe_cooldown");
  });

  it("returns normalized metering in dry-run mode", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Meter this callout.",
      missionId: uniqueId("mission-meter"),
      repoAttributed: false,
      durationMs: 1200,
    });

    expect(res.status).toBe(200);
    expect(res.body.metering?.requestCount).toBe(1);
    expect(res.body.metering?.charCount).toBe("Meter this callout.".length);
    expect(res.body.metering?.durationMs).toBe(1200);
  });

  it("ignores untrusted policy clock overrides for mission budget enforcement", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_BUDGET_MISSION_WINDOW_MS = "60000";
    process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS = "1";
    delete process.env.VOICE_REPLAY_CLOCK_TRUSTED;
    const app = buildApp();
    const missionId = uniqueId("mission-untrusted-clock");

    const first = await request(app).post("/api/voice/speak").send({
      text: "first",
      missionId,
      eventId: uniqueId("evt-untrusted"),
      repoAttributed: false,
      policyTsMs: 0,
      replayMode: true,
    });
    const second = await request(app).post("/api/voice/speak").send({
      text: "second",
      missionId,
      eventId: uniqueId("evt-untrusted"),
      repoAttributed: false,
      policyTsMs: 4102444800000,
      replayMode: true,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("voice_budget_exceeded");
  });

  it("allows trusted replay mode policy clock overrides deterministically", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_BUDGET_MISSION_WINDOW_MS = "60000";
    process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS = "1";
    process.env.VOICE_REPLAY_CLOCK_TRUSTED = "1";
    const app = buildApp();
    const missionId = uniqueId("mission-trusted-clock");

    const first = await request(app).post("/api/voice/speak").send({
      text: "first",
      missionId,
      eventId: uniqueId("evt-trusted"),
      repoAttributed: false,
      policyTsMs: 1000,
      replayMode: true,
    });
    const second = await request(app).post("/api/voice/speak").send({
      text: "second",
      missionId,
      eventId: uniqueId("evt-trusted"),
      repoAttributed: false,
      policyTsMs: 62000,
      replayMode: true,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.ok).toBe(true);
  });

  it("enforces mission and tenant voice budgets deterministically", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_BUDGET_MISSION_WINDOW_MS = "60000";
    process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS = "2";
    process.env.VOICE_BUDGET_TENANT_DAILY_MAX_REQUESTS = "3";
    const app = buildApp();
    const missionId = uniqueId("mission-budget");

    const first = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-a")
      .send({ text: "one", missionId, eventId: uniqueId("event"), repoAttributed: false });
    const second = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-a")
      .send({ text: "two", missionId, eventId: uniqueId("event"), repoAttributed: false });
    const missionBudget = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-a")
      .send({ text: "three", missionId, eventId: uniqueId("event"), repoAttributed: false });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(missionBudget.status).toBe(429);
    expect(missionBudget.body.error).toBe("voice_budget_exceeded");
    expect(missionBudget.body.details?.scope).toBe("mission_window");

    const tenantMissionA = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-b")
      .send({ text: "b-one", missionId: uniqueId("mission-b"), repoAttributed: false });
    const tenantMissionB = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-b")
      .send({ text: "b-two", missionId: uniqueId("mission-b"), repoAttributed: false });
    const tenantDaily = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-b")
      .send({ text: "b-three", missionId: uniqueId("mission-b"), repoAttributed: false });
    const tenantDailyExceeded = await request(app)
      .post("/api/voice/speak")
      .set("x-tenant-id", "tenant-b")
      .send({ text: "b-four", missionId: uniqueId("mission-b"), repoAttributed: false });

    expect(tenantMissionA.status).toBe(200);
    expect(tenantMissionB.status).toBe(200);
    expect(tenantDaily.status).toBe(200);
    expect(tenantDailyExceeded.status).toBe(429);
    expect(tenantDailyExceeded.body.details?.scope).toBe("tenant_day");
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
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
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



  it("passes voice_profile_id through to proxy contract without breaking legacy shape", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "0";
    const upstreamApp = express();
    upstreamApp.use(express.json());
    let seenProfile: string | null = null;
    upstreamApp.post("/speak", (req, res) => {
      seenProfile = req.body.voice_profile_id ?? req.body.voiceProfile ?? null;
      res.setHeader("content-type", "audio/wav");
      res.send(Buffer.from("ok"));
    });
    const upstreamServer = await new Promise<Server>((resolve) => {
      const server = upstreamApp.listen(0, () => resolve(server));
    });

    try {
      const address = upstreamServer.address();
      if (!address || typeof address !== "object") throw new Error("no port");
      process.env.TTS_BASE_URL = `http://127.0.0.1:${address.port}`;
      const app = buildApp();
      const res = await request(app).post("/api/voice/speak").send({
        text: "profile passthrough",
        voice_profile_id: "dottie_governed",
      });

      expect(res.status).toBe(200);
      expect(seenProfile).toBe("dottie_governed");
      expect(res.headers["x-voice-profile"]).toBe("dottie_governed");
    } finally {
      await new Promise<void>((resolve) => upstreamServer.close(() => resolve()));
    }
  });

  it("opens deterministic circuit breaker after repeated backend failures", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "0";
    const upstreamApp = express();
    upstreamApp.use(express.json());
    upstreamApp.post("/speak", (_req, res) => {
      res.status(500).json({ error: "upstream_failure" });
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

      const sendFail = () =>
        request(app).post("/api/voice/speak").send({
          text: "Backend unstable.",
          mode: "callout",
          priority: "warn",
          missionId: uniqueId("mission-breaker"),
          eventId: uniqueId("event-breaker"),
          evidenceRefs: ["docs/helix-ask-flow.md#L1"],
        });

      const first = await sendFail();
      const second = await sendFail();
      const third = await sendFail();
      const fourth = await sendFail();

      expect(first.status).toBe(502);
      expect(second.status).toBe(502);
      expect(third.status).toBe(502);
      expect(fourth.status).toBe(503);
      expect(fourth.body.error).toBe("voice_backend_error");
      expect(fourth.body.details?.circuitBreakerOpen).toBe(true);
      expect(fourth.body.details?.retryAfterMs).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve) => upstreamServer.close(() => resolve()));
    }
  });

  it("meets voice dry-run latency budget", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const start = Date.now();
    const res = await request(app).post("/api/voice/speak").send({
      text: "Latency check",
      missionId: uniqueId("mission-latency"),
      eventId: uniqueId("event-latency"),
    });
    const latencyMs = Date.now() - start;

    expect(res.status).toBe(200);
    expect(latencyMs).toBeLessThan(250);
  });

  it("keeps deterministic envelope under controlled overload", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    process.env.VOICE_BUDGET_MISSION_WINDOW_MS = "60000";
    process.env.VOICE_BUDGET_MISSION_MAX_REQUESTS = "1";
    const app = buildApp();
    const missionId = uniqueId("mission-overload");

    const first = await request(app).post("/api/voice/speak").send({
      text: "baseline",
      missionId,
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
      eventId: uniqueId("event-overload"),
    });
    const overloaded = await request(app).post("/api/voice/speak").send({
      text: "overload",
      missionId,
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
      eventId: uniqueId("event-overload"),
    });

    expect(first.status).toBe(200);
    expect(overloaded.status).toBe(429);
    expect(overloaded.body.error).toBe("voice_budget_exceeded");
    expect(typeof overloaded.body.message).toBe("string");
    expect(overloaded.body.details?.scope).toBe("mission_window");
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
          evidenceRefs: ["docs/helix-ask-flow.md#L1"],
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

  it("suppresses non-eligible context callouts", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Context ping",
      priority: "warn",
      contextTier: "tier0",
      sessionState: "idle",
      voiceMode: "normal",
      traceId: "trace-context-suppress",
    });

    expect(res.status).toBe(200);
    expect(res.body.suppressed).toBe(true);
    expect(res.body.reason).toBe("voice_context_ineligible");
    expect(res.body.traceId).toBe("trace-context-suppress");
  });


  it("suppresses mission callout without evidence by default", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Mission callout without evidence",
      mode: "callout",
      missionId: uniqueId("mission-parity"),
      priority: "action",
    });

    expect(res.status).toBe(200);
    expect(res.body.suppressed).toBe(true);
    expect(res.body.reason).toBe("missing_evidence");
  });

  it("keeps explicit repoAttributed false behavior for mission callouts", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Mission callout without evidence explicit false",
      mode: "callout",
      missionId: uniqueId("mission-nonrepo"),
      priority: "action",
      repoAttributed: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.suppressed ?? false).toBe(false);
    expect(res.body.reason).toBeUndefined();
  });

  it("suppresses when voice certainty exceeds text certainty", async () => {
    process.env.VOICE_PROXY_DRY_RUN = "1";
    const app = buildApp();

    const res = await request(app).post("/api/voice/speak").send({
      text: "Critical certainty mismatch",
      priority: "action",
      textCertainty: "reasoned",
      voiceCertainty: "confirmed",
      deterministic: true,
      evidenceRefs: ["docs/helix-ask-flow.md#L1"],
      repoAttributed: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.suppressed).toBe(true);
    expect(res.body.reason).toBe("contract_violation");
  });
});
