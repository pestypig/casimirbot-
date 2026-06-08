import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
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
import { resetStagePlayLiveSourceInterpreterProfileStoreForTest } from "../services/stage-play/stage-play-live-source-interpreter-profile-store";
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

const resetLiveSourceMailRoutingState = (): void => {
  resetVisualSnapshotStoreForTest();
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
  resetStagePlayLiveSourceMailTranscriptStoreForTest();
  resetStagePlayLiveSourceInterpreterProfileStoreForTest();
};

beforeEach(() => {
  resetLiveSourceMailRoutingState();
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
  const liveEnvironmentToolNames = (response.body?.current_turn_artifact_ledger ?? [])
    .filter((artifact: any) => artifact?.kind === "live_environment_tool_observation")
    .map((artifact: any) => artifact?.payload?.tool_name)
    .filter(Boolean);
  return {
    response,
    decision: decisionArtifact?.payload?.observation,
    liveEnvironmentToolNames,
    debug: JSON.stringify(response.body, null, 2),
  };
};

const expectNoRawMailboxReceiptFinal = (answer: unknown, debug: string): void => {
  expect(String(answer ?? ""), debug).not.toMatch(/unread live-source mail item\(s\) were read/i);
  expect(String(answer ?? ""), debug).not.toMatch(/require a recorded agent decision/i);
  expect(String(answer ?? ""), debug).not.toMatch(/Latest preview:/i);
};

describe("Helix Ask live-source mail interpretation routing", () => {
  it("routes interpreter profile setup prompts to configure_interpreter_profile before mailbox reads", async () => {
    seedVisualMail("A Minecraft menu is visible, but this turn is only configuring interpretation policy.");

    const { response, liveEnvironmentToolNames, debug } = await askMailbox(
      "Create a Minecraft Survival Coach interpreter profile for this source. Call out danger, rare resources, and strategic decisions; ignore routine walking.",
    );

    expect(liveEnvironmentToolNames, debug).toContain("live_env.configure_interpreter_profile");
    expect(liveEnvironmentToolNames, debug).not.toContain("live_env.read_live_source_mail");
    expect(response.body?.source_target_intent?.target_source, debug).toBe("live_source_mailbox");
    expect(response.body?.source_target_intent?.requested_outputs, debug).toContain(
      "stage_play_live_source_interpreter_profile",
    );
    const profileArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.configure_interpreter_profile"
    );
    expect(profileArtifact?.payload?.observation, debug).toMatchObject({
      profile: expect.objectContaining({
        title: "Minecraft Survival Coach",
        domain: "minecraft",
        assistant_answer: false,
        terminal_eligible: false,
      }),
    });
    expect(response.body?.stage_play_live_source_mailbox_debug, debug).toMatchObject({
      capability: "live_env.configure_interpreter_profile",
      interpreter_profile_ref: expect.stringMatching(/^stage_play_live_source_interpreter_profile:/),
    });
  }, 60_000);

  it("routes active-profile interpretation prompts through read, compare, then decision", async () => {
    seedVisualMail("The player stands in a dim Minecraft cave with visible ore and no hostile mob in frame.");
    const profileObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        domain: "minecraft",
        objective_text: "Watch Minecraft as a survival coach.",
        interpretation_guidelines: "Compare visual mail against hazards, resources, and navigation opportunities.",
        salience_criteria: ["cave", "ore"],
        suppress_criteria: ["unchanged menu"],
        risk_criteria: ["hostile mob", "lava"],
        opportunity_criteria: ["ore"],
        voice_callout_criteria: ["hostile mob"],
      },
    });
    expect(profileObservation.ok).toBe(true);

    const { response, decision, liveEnvironmentToolNames, debug } = await askMailbox(
      "Interpret the active visual live-source mailbox using the active profile.",
    );

    expect(liveEnvironmentToolNames, debug).toEqual(expect.arrayContaining([
      "live_env.read_live_source_mail",
      "live_env.compare_mail_to_interpreter_profile",
      "live_env.record_live_source_mail_decision",
    ]));
    expect(liveEnvironmentToolNames.indexOf("live_env.compare_mail_to_interpreter_profile"), debug).toBeGreaterThan(
      liveEnvironmentToolNames.indexOf("live_env.read_live_source_mail"),
    );
    expect(liveEnvironmentToolNames.indexOf("live_env.record_live_source_mail_decision"), debug).toBeGreaterThan(
      liveEnvironmentToolNames.indexOf("live_env.compare_mail_to_interpreter_profile"),
    );
    expect(decision, debug).toMatchObject({
      decision: "record_interpretation",
      interpreterProfileRef: expect.stringMatching(/^stage_play_live_source_interpreter_profile:/),
      profileComparisonRefs: [expect.stringMatching(/^stage_play_live_source_interpreter_profile_comparison:/)],
      matchedCriteria: expect.arrayContaining(["cave", "ore"]),
    });
    expect(response.body?.source_target_intent?.requested_outputs, debug).toContain(
      "stage_play_live_source_interpreter_profile_comparison",
    );
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("does not execute profile tools for future, quoted, or negated profile-control wording", async () => {
    const prompts = [
      "In the future, create an interpreter profile for the live source, but for now just explain what that would mean.",
      "The screen says \"open the profile note\"; explain that label without using the profile tool.",
      "Do not use the Minecraft Survival Coach profile right now; just explain the profile idea.",
    ];

    for (const prompt of prompts) {
      const { liveEnvironmentToolNames, debug } = await askMailbox(prompt);
      expect(liveEnvironmentToolNames, debug).not.toContain("live_env.configure_interpreter_profile");
      expect(liveEnvironmentToolNames, debug).not.toContain("live_env.compare_mail_to_interpreter_profile");
      expect(liveEnvironmentToolNames, debug).not.toContain("live_env.read_live_source_mail");
    }
  }, 30_000);

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
    expect(decision?.evidenceRefs, debug).toContain(response.body?.turn_id);
    expect(response.body?.answer, debug).toMatch(/document editor|Watch next/i);
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 30_000);

  it("routes playbook visual-mail interpretation wording to record_interpretation", async () => {
    seedVisualMail("The visual summary shows a dark icon grid with multiple productivity apps.");

    const { response, decision, debug } = await askMailbox(
      "Read the visual mail and interpret what is happening. Say what should be watched next.",
    );

    expect(decision, debug).toMatchObject({
      decision: "record_interpretation",
      decision_validation_result: "forced_record_interpretation_for_read_mail_interpretation_intent",
      narrativeStateRef: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
    });
    expect(decision?.evidenceRefs, debug).toContain(response.body?.turn_id);
    expect(response.body?.answer, debug).toMatch(/icon grid|Watch next/i);
    expect(response.body?.stage_play_live_source_mailbox_debug?.trajectory, debug).toMatchObject({
      route: "live_source_mailbox",
      capability: "live_env.read_live_source_mail",
      mailIds: [expect.stringMatching(/^stage_play_live_source_mail:/)],
      decisionId: expect.stringMatching(/^stage_play_live_source_mail_decision:/),
      narrativeStateId: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      traceId: expect.stringMatching(/^live_source_trace:/),
      cycleId: expect.stringMatching(/^live_source_cycle:/),
      askTurnId: response.body?.turn_id,
    });
    expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
  }, 60_000);

  it("routes natural mailbox/update wording to the intended text or interpretation decision", async () => {
    const cases = [
      {
        question: "What does the latest visual update show?",
        summary: "The latest visual update shows a desktop launcher with a calendar and browser icon.",
        expectedDecision: "draft_text_answer",
        answerPattern: /desktop launcher|calendar/i,
      },
      {
        question: "Review the new source mail and say what changed.",
        summary: "The new source mail shows the browser tab changed from a launcher to a document page.",
        expectedDecision: "record_interpretation",
        answerPattern: /document page|Watch next/i,
      },
      {
        question: "Interpret these observations and say what should be watched next.",
        summary: "These observations show a video timeline paused on a dark interface with a preview panel.",
        expectedDecision: "record_interpretation",
        answerPattern: /video timeline|Watch next/i,
      },
      {
        question: "What changed in the latest visual update?",
        summary: "The latest visual update shows a chat window replacing the previous app icon grid.",
        expectedDecision: "record_interpretation",
        answerPattern: /chat window|Watch next/i,
      },
    ];

    for (const testCase of cases) {
      resetLiveSourceMailRoutingState();
      seedVisualMail(testCase.summary);

      const { response, decision, debug } = await askMailbox(testCase.question);

      expect(decision, debug).toMatchObject({
        decision: testCase.expectedDecision,
      });
      if (testCase.expectedDecision === "record_interpretation") {
        expect(decision?.narrativeStateRef, debug).toEqual(
          expect.stringMatching(/^stage_play_live_source_narrative_state:/),
        );
      }
      expect(decision?.evidenceRefs, debug).toContain(response.body?.turn_id);
      expect(response.body?.answer, debug).toMatch(testCase.answerPattern);
      expectNoRawMailboxReceiptFinal(response.body?.answer, debug);
    }
  }, 180_000);

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
