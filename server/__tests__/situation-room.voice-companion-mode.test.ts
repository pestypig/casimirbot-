import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  resetCompanionPolicies,
  upsertCompanionPolicy,
} from "../services/situation-room/companion-policy-engine";
import {
  listLiveAgenticReviewRequests,
  resetLiveAgenticReviews,
} from "../services/situation-room/live-agentic-review-runner";
import {
  __resetHelixThreadLedgerStore,
  getHelixThreadLedgerEvents,
} from "../services/helix-thread/ledger";
import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

describe("voice-aware companion mode", () => {
  beforeEach(() => {
    resetLiveAnswerEnvironments();
    resetCompanionPolicies();
    resetLiveAgenticReviews();
    __resetHelixThreadLedgerStore();
  });

  it("records ambient mic context without creating answer items", async () => {
    const app = createApp();
    upsertCompanionPolicy({
      thread_id: "helix-ask:voice",
      voice_input_active: true,
      companion_mode: "direct_address_only",
    });

    const response = await request(app)
      .post("/api/agi/situation/voice-lane/event")
      .send({
        thread_id: "helix-ask:voice",
        source_id: "voice:mic",
        transcript: "I probably need more wood before night.",
        evidence_refs: ["voice:test:ambient"],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      classification: {
        transcript_kind: "ambient",
        conversation_mode: "ambient_listening",
        model_invoked: false,
        deterministic: true,
      },
      decision: "record_context",
      raw_audio_included: false,
      raw_transcript_included: false,
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:voice" });
    expect(events.some((event) => event.item_type === "toolObservation")).toBe(true);
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
    expect(events.every((event) => !event.assistant_text)).toBe(true);
  });

  it("classifies direct address as start_user_turn without running the turn itself", async () => {
    const app = createApp();
    upsertCompanionPolicy({
      thread_id: "helix-ask:voice-direct",
      voice_input_active: true,
      companion_mode: "active_companion",
      direct_address_names: ["dottie", "helix"],
    });

    const response = await request(app)
      .post("/api/agi/situation/voice-lane/event")
      .send({
        thread_id: "helix-ask:voice-direct",
        transcript: "Dottie, what just happened?",
        evidence_refs: ["voice:test:direct"],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      classification: {
        transcript_kind: "direct_address",
        conversation_mode: "direct_address",
        direct_addressed: true,
      },
      decision: "start_user_turn",
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:voice-direct" });
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
  });

  it("can request an agentic review from active companion speech over compact context", async () => {
    const app = createApp();
    createLiveAnswerEnvironment({
      thread_id: "helix-ask:voice-review",
      created_turn_id: "turn:voice-review",
      objective: "Watch my Minecraft run and tell me about danger or progress.",
      source_ids: ["source:minecraft-server"],
      preset: "minecraft_run_monitor",
      mode: "text_only",
      now: "2026-05-13T12:00:00.000Z",
    });
    upsertCompanionPolicy({
      thread_id: "helix-ask:voice-review",
      voice_input_active: true,
      companion_mode: "active_companion",
    });

    const response = await request(app)
      .post("/api/agi/situation/voice-lane/event")
      .send({
        thread_id: "helix-ask:voice-review",
        transcript: "Keep me company while I play and watch for danger.",
        evidence_refs: ["voice:test:companion"],
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      decision: "request_agentic_review",
      classification: {
        conversation_mode: "active_companion",
        active_companion_requested: true,
      },
    });
    expect(response.body.review_id).toBeTruthy();
    expect(listLiveAgenticReviewRequests()).toHaveLength(1);
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:voice-review" });
    expect(events.some((event) => event.item_type === "answer")).toBe(false);
  });
});
