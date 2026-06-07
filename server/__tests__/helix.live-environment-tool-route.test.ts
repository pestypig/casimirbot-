import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { helixLiveEnvironmentRouter } from "../routes/helix/live-environment";
import {
  listPendingVoiceSteeringEvents,
  resetVoiceSteeringEventsForTest,
} from "../services/helix-ask/voice-steering-event-store";
import { resetInterimVoiceCalloutsForTest } from "../services/helix-ask/interim-voice-callout-store";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/live-environment", helixLiveEnvironmentRouter);
  return app;
};

describe("Helix live environment client tool route", () => {
  beforeEach(() => {
    resetVoiceSteeringEventsForTest();
    resetInterimVoiceCalloutsForTest();
  });

  it("records voice steering through the narrow evidence-only client bridge", async () => {
    const app = buildApp();

    const response = await request(app)
      .post("/api/helix/live-environment/tool")
      .send({
        tool_name: "live_env.record_voice_steering",
        thread_id: "thread:route-voice-steering",
        environment_id: "env:desktop",
        args: {
          turn_id: "turn:active",
          expected_turn_id: "turn:active",
          transcript_text: "Actually use meters per second.",
          source: "voice_capture",
          timing: "during_reasoning",
          evidence_refs: ["voice_capture:segment:1"],
        },
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        tool_name: "live_env.record_voice_steering",
        ok: true,
        assistant_answer: false,
        raw_content_included: false,
        instruction_authority: "none",
        ask_instruction_authority: "none",
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        observation: {
          schema: "helix.voice_steering_tool_result.v1",
          queuedForSafeBoundary: true,
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          steeringEvent: {
            artifactId: "helix_voice_steering_event",
            threadId: "thread:route-voice-steering",
            turnId: "turn:active",
            expectedTurnId: "turn:active",
            classification: "correction",
            queueDecision: "queued_for_safe_boundary",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            instruction_authority: "none",
            ask_instruction_authority: "none",
          },
        },
      },
    });

    const steeringEventId = response.body.observation.observation.steeringEvent.steeringEventId;
    expect(listPendingVoiceSteeringEvents({
      threadId: "thread:route-voice-steering",
      turnId: "turn:active",
    }).map((event) => event.steeringEventId)).toEqual([steeringEventId]);
  });

  it("does not expose a generic client-side live environment tool executor", async () => {
    const app = buildApp();

    const response = await request(app)
      .post("/api/helix/live-environment/tool")
      .send({
        tool_name: "live_env.query_event_log",
        thread_id: "thread:route-voice-steering",
        args: {},
      })
      .expect(400);

    expect(response.body).toEqual({
      ok: false,
      error: "live_environment_tool_not_allowed",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(listPendingVoiceSteeringEvents({
      threadId: "thread:route-voice-steering",
      turnId: "turn:active",
    })).toEqual([]);
  });
});
