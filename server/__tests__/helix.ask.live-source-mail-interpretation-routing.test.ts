import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";
import {
  enqueueStagePlayLiveSourceMailItem,
  resetStagePlayLiveSourceMailboxForTest,
} from "../services/stage-play/stage-play-live-source-mailbox-store";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";
import { resetStagePlayLiveSourceMailTranscriptStoreForTest } from "../services/stage-play/stage-play-live-source-mail-transcript-store";
import { recordLiveSourceMailDecisionForAsk } from "../services/stage-play/stage-play-visual-summary-mail-ingest";

const threadId = "thread:mail-interpretation-routing";
const roomId = "room:mail-interpretation-routing";
const sourceId = "visual_source:mail-interpretation-routing";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

beforeEach(() => {
  resetVisualSnapshotStoreForTest();
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
  resetStagePlayLiveSourceMailTranscriptStoreForTest();
  process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
  process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
    {
      next_step: "next_action",
      chosen_capability: "live_env.read_live_source_mail",
      reason: "Read the mailbox batch.",
      args: {},
      expected_artifacts: ["stage_play_live_source_mail_read_result"],
      confidence: 0.9,
    },
    {
      next_step: "next_action",
      chosen_capability: "live_env.record_live_source_mail_decision",
      reason: "Let decision repair enforce the correct mailbox decision.",
      args: {
        decision: "wait_for_next_summary",
        rationale_preview: "No user-facing update selected.",
        next_loop_state: "armed_for_next_summary",
      },
      expected_artifacts: ["stage_play_live_source_mail_decision"],
      confidence: 0.8,
    },
  ]);
  process.env.HELIX_POST_OBSERVATION_COMPOSER_TEST_RESPONSE =
    "Live-source mail decision recorded: wait_for_next_summary.";
});

afterEach(() => {
  delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
  delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
  delete process.env.HELIX_POST_OBSERVATION_COMPOSER_TEST_RESPONSE;
});

const seedVisualMail = (summary: string): void => {
  startVisualSnapshotSource({
    source_id: sourceId,
    thread_id: threadId,
    room_id: roomId,
    source_surface: "browser_tab",
    capture_mode: "interval",
    status: "active",
  });
  const frame = recordVisualFrame({
    source_id: sourceId,
    thread_id: threadId,
    room_id: roomId,
    frame_id: `visual_frame:${Math.random().toString(16).slice(2)}`,
    ts: "2026-06-04T12:00:00.000Z",
  });
  analyzeVisualFrame({
    thread_id: threadId,
    frame_id: frame.frame_id,
    evidence_id: `visual_evidence:${Math.random().toString(16).slice(2)}`,
    summary,
    supports_claims: [
      {
        claim: "The latest mailbox item includes compact visual summary text.",
        support_status: "supports",
        confidence: 0.9,
      },
    ],
  });
};

const askMailbox = async (question: string) => {
  const response = await request(createApp())
    .post("/api/agi/ask/turn")
    .send({
      question,
      sessionId: threadId,
      debug: true,
    })
    .expect(200);
  const decisionArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
    artifact?.kind === "live_environment_tool_observation" &&
    artifact?.payload?.tool_name === "live_env.record_live_source_mail_decision"
  );
  return {
    response,
    decision: decisionArtifact?.payload?.observation,
    debug: JSON.stringify(response.body, null, 2),
  };
};

const expectNoRawMailboxReceiptFinal = (answer: unknown, debug: string): void => {
  expect(String(answer ?? ""), debug).not.toMatch(/unread live-source mail item\(s\) were read/i);
  expect(String(answer ?? ""), debug).not.toMatch(/require a recorded agent decision/i);
  expect(String(answer ?? ""), debug).not.toMatch(/Latest preview:/i);
};

describe("Helix Ask live-source mail interpretation routing", () => {
  it("routes latest-mail visibility prompts to draft_text_answer", async () => {
    seedVisualMail("A dark app launcher shows Docs, Gmail, Drive, YouTube, and Instagram icons.");

    const { response, decision, debug } = await askMailbox(
      "Check the active visual live-source mailbox. What does the latest mail show?",
    );

    expect(decision, debug).toMatchObject({
      decision: "draft_text_answer",
      textAnswerDraft: {
        text: expect.stringContaining("dark app launcher"),
      },
    });
    expect(response.body?.answer, debug).toContain("dark app launcher");
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("routes interpretation and watch-next prompts to record_interpretation", async () => {
    seedVisualMail("The visual summary changed from an app launcher to a document editor on a dark desktop.");

    const { response, decision, debug } = await askMailbox(
      "Check the active visual live-source mailbox. Interpret the mail and say what should be watched next.",
    );

    expect(decision, debug).toMatchObject({
      decision: "record_interpretation",
      narrativeState: expect.objectContaining({
        currentSceneSummary: expect.stringContaining("document editor"),
        watchNext: expect.objectContaining({
          targets: expect.any(Array),
        }),
      }),
    });
    expect(response.body?.answer, debug).toMatch(/document editor|Watch next/i);
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("routes change-across-summaries prompts to record_interpretation", async () => {
    seedVisualMail("The latest visual summary shows a new browser tab replacing the previous launcher grid.");

    const { decision, debug } = await askMailbox(
      "Check the active visual live-source mailbox. What changed across these summaries?",
    );

    expect(decision, debug).toMatchObject({
      decision: "record_interpretation",
      decision_validation_result: "forced_record_interpretation_for_read_mail_interpretation_intent",
    });
  }, 30_000);

  it("keeps importance-only prompts waiting when no salience fixture is present", async () => {
    seedVisualMail("The same dark launcher remains visible with no obvious user-facing risk.");

    const { response, decision, debug } = await askMailbox(
      "Check the active visual live-source mailbox, but only tell me if important.",
    );

    expect(decision, debug).toMatchObject({
      decision: "wait_for_next_summary",
      nextLoopState: "armed_for_next_summary",
    });
    expect(decision?.textAnswerDraft, debug).toBeFalsy();
    expect(decision?.narrativeStateRef, debug).toBeFalsy();
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("routes explicit important voice prompts to request_voice_callout without terminalizing the raw mail receipt", async () => {
    seedVisualMail("A hostile mob appears near the player and should be called out quickly.");

    const { response, decision, debug } = await askMailbox(
      "Check the active visual live-source mailbox and announce if important.",
    );

    expect(decision, debug).toMatchObject({
      decision: "request_voice_callout",
      decision_validation_result: "forced_request_voice_callout_for_read_mail_voice_intent",
      voiceCalloutDraft: {
        text: expect.stringContaining("hostile mob"),
        voiceEligible: true,
      },
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(response.body?.answer, debug).toContain("hostile mob");
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("records voice callouts only when voice policy allows the decision", () => {
    const mail = enqueueStagePlayLiveSourceMailItem({
      threadId,
      roomId,
      sourceId,
      sourceKind: "visual_frame",
      frameRef: "visual_frame:voice-policy",
      evidenceRef: "visual_evidence:voice-policy",
      summaryText: "A hostile mob appears near the player.",
      createdAt: "2026-06-04T12:10:00.000Z",
    });

    const disabled = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mail.mailId],
      decision: "request_voice_callout",
      rationalePreview: "Announce if important.",
      voiceCalloutDraft: "Hostile mob appeared near the player.",
      voiceEnabled: false,
      voiceAllowedNow: false,
      nextLoopState: "armed_for_next_summary",
    });
    expect(disabled).toMatchObject({
      decision: "draft_text_answer",
      voiceCalloutDraft: null,
      textAnswerDraft: {
        text: "Hostile mob appeared near the player.",
      },
    });

    const allowed = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId,
      mailIds: [mail.mailId],
      decision: "request_voice_callout",
      rationalePreview: "Announce if important.",
      voiceCalloutDraft: "Hostile mob appeared near the player.",
      voiceEnabled: true,
      voiceAllowedNow: true,
      nextLoopState: "armed_for_next_summary",
    });
    expect(allowed).toMatchObject({
      decision: "request_voice_callout",
      voiceCalloutDraft: {
        text: "Hostile mob appeared near the player.",
        voiceEligible: true,
      },
    });
  });
});
