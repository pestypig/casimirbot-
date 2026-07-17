import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  listStagePlayLiveSourceConversationEvents,
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import {
  bridgeRealtimeTranscriptToStagePlay,
  resetRealtimeStagePlayAskHandoffsForTests,
} from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../route-boundary";
import {
  createRealtimeGroundedAnswerFeedbackMiddleware,
  readRealtimeGroundedAnswer,
  recordRealtimeGroundedAnswerFromPayload,
  resetRealtimeGroundedAnswerFeedbackForTests,
} from "../grounded-answer-feedback";

const terminalPayload = (answer: string) => ({
  schema: "helix.ask.turn.response.v1",
  turn_id: "ask:grounded:1",
  content: answer,
  final_answer_source: "final_answer_draft",
  terminal_artifact_kind: "model_synthesized_answer",
  selected_terminal_support_refs: ["evidence:tool:1"],
  ask_turn_solver_trace: { completed_solver_path: true },
  terminal_answer_authority: {
    server_authoritative: true,
    terminal_artifact_kind: "model_synthesized_answer",
    final_answer_source: "final_answer_draft",
  },
});

const createHandoff = (suffix: string) => {
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: "realtime:test",
    body: {
      event_type: "transcript.final",
      event_ref: `provider-event:${suffix}`,
      transcript_text: `Question ${suffix}`,
    },
  })!;
  return bridgeRealtimeTranscriptToStagePlay({
    realtimeSessionId: "realtime:test",
    threadId: "helix-ask:desktop",
    providerEventRef: `provider-event:${suffix}`,
    transcriptText: `Question ${suffix}`,
    observation,
  });
};

describe("Realtime grounded answer feedback", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
    resetRealtimeGroundedAnswerFeedbackForTests();
  });

  it("records a server-authoritative completed Ask answer and ignores incomplete candidates", () => {
    const handoff = createHandoff("direct");
    expect(recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: {
        ...terminalPayload("The grounded answer."),
        ask_turn_solver_trace: { completed_solver_path: false },
      },
    })).toBeNull();

    const feedback = recordRealtimeGroundedAnswerFromPayload({
      handoffId: handoff.handoff_id,
      payload: terminalPayload("The grounded answer."),
    });
    expect(feedback).toMatchObject({
      handoff_id: handoff.handoff_id,
      ask_turn_id: "ask:grounded:1",
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "model_synthesized_answer",
      completed_solver_path: true,
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(feedback?.evidence_refs).toEqual(expect.arrayContaining([
      handoff.transcript_observation_ref,
      handoff.stage_play_event_ref,
      "evidence:tool:1",
    ]));
    expect(listStagePlayLiveSourceConversationEvents({
      threadId: "helix-ask:desktop",
      source: "assistant_answer",
    })).toEqual([
      expect.objectContaining({ textPreview: "The grounded answer." }),
    ]);
  });

  it("observes JSON and streaming turn-final responses without changing their payload", async () => {
    const jsonHandoff = createHandoff("json");
    const streamHandoff = createHandoff("stream");
    const app = express();
    app.use(express.json());
    app.use(createRealtimeGroundedAnswerFeedbackMiddleware());
    app.post("/ask/turn", (_req, res) => res.json(terminalPayload("JSON grounded answer.")));
    app.post("/ask/turn/stream", (_req, res) => {
      res.type("text/event-stream");
      res.write("event: turn_started\ndata: {\"ok\":true}\n\n");
      res.write(`event: turn_delta\ndata: ${"x".repeat(1_300_000)}\n\n`);
      res.end(`event: turn_final\ndata: ${JSON.stringify(terminalPayload("Stream grounded answer."))}\n\n`);
    });

    const jsonResponse = await request(app).post("/ask/turn").send({
      turnId: "ask:json",
      routeMetadata: jsonHandoff.route_metadata,
    }).expect(200);
    expect(jsonResponse.body.content).toBe("JSON grounded answer.");
    expect(readRealtimeGroundedAnswer(jsonHandoff.handoff_id)?.answer_text_char_count)
      .toBe("JSON grounded answer.".length);

    const streamResponse = await request(app).post("/ask/turn/stream").send({
      turnId: "ask:stream",
      routeMetadata: streamHandoff.route_metadata,
    }).expect(200);
    expect(streamResponse.text).toContain("event: turn_final");
    expect(streamResponse.text).toContain("Stream grounded answer.");
    expect(readRealtimeGroundedAnswer(streamHandoff.handoff_id)?.ask_turn_id).toBe("ask:stream");
  });
});
