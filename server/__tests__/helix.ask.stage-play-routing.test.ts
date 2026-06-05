import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import {
  recordLiveSourceObservation,
  resetLiveSourceObservationStoreForTest,
} from "../services/live-source/live-source-observation-store";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";
import {
  resetLiveSourceChunkBufferForTest,
  upsertLiveSourceProducer,
} from "../services/situation-room/live-source-chunk-buffer";
import {
  resetLiveSourceDescriptorsForTest,
  upsertLiveSourceDescriptor,
} from "../services/situation-room/live-source-descriptor-builder";
import {
  classifyLiveSourceContinuationIntent,
  isLiveSourceMailLoopPrompt,
} from "../services/helix-ask/live-source-continuation-intent";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA } from "../services/stage-play/stage-play-output-lane-reducer";
import { evaluateTerminalBoundaryEligibility } from "../services/helix-ask/runtime-authority-contract";
import { buildStagePlayGraphFromWorld } from "../services/stage-play/stage-play-badge-graph-builder";
import { resetStagePlayAskCheckpointReceiptsForTest } from "../services/stage-play/stage-play-ask-checkpoint-store";
import { resetStagePlayCheckpointQueueForTest } from "../services/stage-play/stage-play-checkpoint-queue";
import { resetStagePlayLiveSourceMailboxForTest } from "../services/stage-play/stage-play-live-source-mailbox-store";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";
import { resetStagePlayLiveSourceMailTranscriptStoreForTest } from "../services/stage-play/stage-play-live-source-mail-transcript-store";

const threadId = "helix-ask:desktop";
const roomId = "room:stage-play-routing";
const sourceId = "visual_source:stage_play_visual_tab";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

beforeEach(() => {
  resetLiveAnswerEnvironments();
  resetLiveSourceObservationStoreForTest();
  resetLiveSourceDescriptorsForTest();
  resetLiveSourceChunkBufferForTest();
  resetVisualSnapshotStoreForTest();
  resetStagePlayAskCheckpointReceiptsForTest();
  resetStagePlayCheckpointQueueForTest();
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
  resetStagePlayLiveSourceMailTranscriptStoreForTest();
});

afterEach(() => {
  delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
  delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
  delete process.env.HELIX_POST_OBSERVATION_COMPOSER_TEST_RESPONSE;
});

describe("Helix Ask Stage Play routing", () => {
  it("keeps Stage Play reflection prompts out of live source continuation", () => {
    expect(
      classifyLiveSourceContinuationIntent(
        "Use the active Stage Play Badge Graph for the current visual source. Reflect the source, project/update Live Answer from Stage Play, and tell me what evidence is still missing before this can become a model-reviewed answer snapshot.",
      ),
    ).toBeNull();
    expect(
      classifyLiveSourceContinuationIntent(
        "Use the routed visual source in narrative_stage_play to predict next scene and show checkpoint freshness for the live interpretation.",
      ),
    ).toBeNull();
  });

  it("keeps explicit Stage Play capture cadence prompts on live source control", () => {
    const intent = classifyLiveSourceContinuationIntent(
      "Start Stage Play visual capture every 10 seconds.",
    );

    expect(intent).toMatchObject({
      kind: "live_pipeline_control",
      requested_rate_ms: 10_000,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("routes visual watch prompts through live-source mail and records a decision", async () => {
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
      frame_id: "visual_frame:stage-play-mail-route",
      ts: "2026-06-04T16:30:00.000Z",
    });
    analyzeVisualFrame({
      thread_id: threadId,
      frame_id: frame.frame_id,
      evidence_id: "visual_evidence:stage-play-mail-route",
      summary: "Minecraft-like scene with a player near a cat, book stand, and distant mountains.",
      supports_claims: [
        {
          claim: "The active visual source has compact evidence.",
          support_status: "supports",
          confidence: 0.82,
        },
      ],
    });

    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Watch this visual source and tell me if anything important happens.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      terminalContract: response.body?.goal_satisfaction_evaluation?.terminal_contract,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
      currentTurnArtifactKinds: response.body?.current_turn_artifact_ledger?.map((artifact: any) => artifact?.kind),
    }, null, 2);

    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(response.body?.canonical_goal_frame?.classifier_reasons, routeDebug).toContain("prefer_read_live_source_mail");
    expect(response.body?.source_target_intent, routeDebug).toMatchObject({
      target_source: "live_source_mailbox",
      target_kind: "live_source_mailbox",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.stage_play_live_source_mailbox_debug, routeDebug).toMatchObject({
      route_admission: {
        status: "won",
        selected_target_source: "live_source_mailbox",
      },
      source_target_intent: expect.objectContaining({
        target_source: "live_source_mailbox",
        target_kind: "live_source_mailbox",
      }),
      capability: "live_env.read_live_source_mail",
      ask_turn_id: response.body?.turn_id,
      next_loop_state: "armed_for_next_summary",
      voice_policy: expect.objectContaining({
        allowedNow: false,
      }),
    });
    expect(response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability), routeDebug)
      .toEqual(expect.arrayContaining([
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
      ]));
    const liveToolArtifacts = response.body?.current_turn_artifact_ledger
      ?.filter((artifact: any) => artifact?.kind === "live_environment_tool_observation")
      ?? [];
    const readArtifact = liveToolArtifacts.find((artifact: any) =>
      artifact?.payload?.tool_name === "live_env.read_live_source_mail"
    );
    expect(readArtifact?.payload?.observation, routeDebug).toMatchObject({
      artifactId: "stage_play_live_source_mail_read_result",
      items: [
        expect.objectContaining({
          mailId: expect.stringMatching(/^stage_play_live_source_mail:/),
          sourceRefs: expect.objectContaining({
            frameRef: "visual_frame:stage-play-mail-route",
            evidenceRef: "visual_evidence:stage-play-mail-route",
          }),
        }),
      ],
    });
    const decisionArtifact = liveToolArtifacts.find((artifact: any) =>
      artifact?.payload?.tool_name === "live_env.record_live_source_mail_decision"
    );
    expect(decisionArtifact?.payload?.observation, routeDebug).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "wait_for_next_summary",
      nextLoopState: "armed_for_next_summary",
    });
    expect(response.body?.stage_play_live_source_mailbox_debug?.mail_ids, routeDebug).toContain(
      readArtifact?.payload?.observation?.items?.[0]?.mailId,
    );
    expect(response.body?.stage_play_live_source_mailbox_debug?.decision_ids, routeDebug).toContain(
      decisionArtifact?.payload?.observation?.decisionId,
    );
    expect(response.body?.terminal_artifact_kind, routeDebug).toBe("model_synthesized_answer");
    expect(response.body?.solver_controller_decision?.blocking_reasons ?? [], routeDebug).not.toContain("terminal_route_mismatch");
    expect(response.body?.answer, routeDebug).not.toContain("visual evidence is unavailable");
    expect(response.body?.answer, routeDebug).not.toContain("visual capture evidence is unavailable");
    expect(response.body?.answer, routeDebug).toContain("wait_for_next_summary");
    expect(response.body?.answer, routeDebug).toContain("standing by for the next source update");
    expect(response.body?.answer, routeDebug).not.toContain("one unread live-source mail item requiring a decision");

    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(response.body.turn_id)}/debug-export`)
      .expect(200);
    expect(debugExport.body?.payload?.source_target_intent, routeDebug).toMatchObject({
      target_source: "live_source_mailbox",
      target_kind: "live_source_mailbox",
    });
    expect(debugExport.body?.payload?.stage_play_live_source_mailbox_debug, routeDebug).toMatchObject({
      route_admission: expect.objectContaining({
        status: "won",
        reason: expect.stringMatching(/mail/i),
      }),
      source_target_intent: expect.objectContaining({
        target_source: "live_source_mailbox",
        target_kind: "live_source_mailbox",
      }),
      capability: "live_env.read_live_source_mail",
      mail_ids: expect.arrayContaining([readArtifact?.payload?.observation?.items?.[0]?.mailId]),
      ask_turn_id: response.body?.turn_id,
      decision_ids: expect.arrayContaining([decisionArtifact?.payload?.observation?.decisionId]),
      next_loop_state: "armed_for_next_summary",
      voice_policy: expect.objectContaining({
        allowedNow: false,
      }),
    });
    expect(debugExport.body?.payload?.evidence_target_arbitration, routeDebug).toMatchObject({
      selected_target_source: "live_source_mailbox",
      selected_target_kind: "live_source_mailbox",
    });
    expect(debugExport.body?.payload?.tool_call_admission_decision, routeDebug).toMatchObject({
      source_target: "live_source_mailbox",
      reason: "live_source_mailbox_requires_mail_read_then_decision",
    });
  }, 30_000);

  it("configures visual watch-job policy without reading mail when the user gives a standing watch objective", async () => {
    const question = "Watch the visual source and only announce if a hostile mob appears.";

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question,
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      canonical: response.body?.canonical_goal_frame,
      availableCapabilities: response.body?.available_capabilities,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
      currentTurnArtifacts: response.body?.current_turn_artifact_ledger,
    }, null, 2);

    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(response.body?.canonical_goal_frame?.classifier_reasons, routeDebug).toEqual(expect.arrayContaining([
      "live_source_mail_loop_intent",
      "live_source_watch_job_setup_intent",
      "prefer_configure_live_source_watch_job",
    ]));
    expect(response.body?.canonical_goal_frame?.classifier_reasons ?? [], routeDebug).not.toContain("prefer_read_live_source_mail");
    expect(response.body?.available_capabilities?.recommended_capability_key, routeDebug).toBe("live_env.configure_live_source_watch_job");
    const chosenCapabilities = response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability) ?? [];
    expect(chosenCapabilities, routeDebug).toContain("live_env.configure_live_source_watch_job");
    expect(chosenCapabilities, routeDebug).not.toContain("live_env.read_live_source_mail");
    expect(chosenCapabilities, routeDebug).not.toContain("live_env.record_live_source_mail_decision");
    expect(response.body?.agent_runtime_loop?.stop_reason, routeDebug).not.toBe("budget_exhausted");
    expect(response.body?.terminal_error_code, routeDebug).not.toBe("agent_loop_budget_exhausted");

    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.configure_live_source_watch_job"
    );
    expect(liveToolArtifact?.payload?.observation, routeDebug).toMatchObject({
      artifactId: "stage_play_live_source_watch_job_policy_result",
      watchJobPolicyRef: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
      watch_job_policy_ref: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
      policy: {
        objectiveText: question,
        decisionPolicyPrompt: question,
        outputPolicy: {
          allowTextAnswer: true,
          allowVoiceCallout: true,
          voiceRequiresUrgency: true,
        },
        assistant_answer: false,
        terminal_eligible: false,
      },
      jobState: {
        objective: question,
        watchJobPolicyRef: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
        nextLoopState: "armed_for_next_summary",
      },
    });
    expect(response.body?.answer, routeDebug).not.toContain("Reviewed");
    expect(response.body?.answer, routeDebug).not.toContain("latest unread source update");
    expect(response.body?.answer, routeDebug).not.toContain("wait_for_next_summary");

    const debugExport = await request(createApp())
      .get(`/api/agi/ask/turn/${encodeURIComponent(response.body.turn_id)}/debug-export`)
      .expect(200);
    const exportedObservation = debugExport.body?.payload?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.configure_live_source_watch_job"
    );
    expect(exportedObservation?.payload?.observation?.watchJobPolicyRef, routeDebug).toMatch(/^stage_play_live_source_watch_job_policy:/);
    expect(exportedObservation?.payload?.observation?.watch_job_policy_ref, routeDebug).toMatch(/^stage_play_live_source_watch_job_policy:/);
  }, 30_000);

  it("routes explicit live-source mail wake prompts through the mailbox loop", async () => {
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
      frame_id: "visual_frame:stage-play-mail-wake-route",
      ts: "2026-06-04T16:31:00.000Z",
    });
    analyzeVisualFrame({
      thread_id: threadId,
      frame_id: frame.frame_id,
      evidence_id: "visual_evidence:stage-play-mail-wake-route",
      summary: "Minecraft-like scene with a player HUD and stable terrain.",
      supports_claims: [
        {
          claim: "The active visual source has compact evidence.",
          support_status: "supports",
          confidence: 0.8,
        },
      ],
    });

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: [
          "Read the active live-source mailbox and decide what to do with the latest unread source update.",
          "Use live_env.read_live_source_mail first, then record the decision with live_env.record_live_source_mail_decision.",
          "Wake request: stage_play_live_source_mail_wake:test",
          "Mail refs: stage_play_live_source_mail:test",
          `Source refs: ${sourceId}`,
        ].join("\n"),
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      runtimeLoop: response.body?.agent_runtime_loop,
      terminal: response.body?.terminal_artifact_kind,
      answer: response.body?.answer,
    }, null, 2);

    expect(response.body?.route_reason_code, routeDebug).not.toBe("live_pipeline_control");
    expect(response.body?.terminal_artifact_kind, routeDebug).not.toBe("live_pipeline_receipt");
    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(response.body?.canonical_goal_frame?.classifier_reasons, routeDebug).toContain("prefer_read_live_source_mail");
    expect(response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability), routeDebug)
      .toEqual(expect.arrayContaining([
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
      ]));
    const liveToolArtifacts = response.body?.current_turn_artifact_ledger
      ?.filter((artifact: any) => artifact?.kind === "live_environment_tool_observation")
      ?? [];
    const decisionArtifact = liveToolArtifacts.find((artifact: any) =>
      artifact?.payload?.tool_name === "live_env.record_live_source_mail_decision"
    );
    expect(decisionArtifact?.payload?.observation, routeDebug).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
    });
    expect(response.body?.stage_play_live_source_mailbox_debug, routeDebug).toMatchObject({
      route_admission: expect.objectContaining({
        status: "won",
        selected_target_source: "live_source_mailbox",
      }),
      capability: "live_env.read_live_source_mail",
      wake_request_id: "stage_play_live_source_mail_wake:test",
      wake_request_ids: expect.arrayContaining(["stage_play_live_source_mail_wake:test"]),
      mail_ids: expect.arrayContaining(["stage_play_live_source_mail:test"]),
      ask_turn_id: response.body?.turn_id,
      decision_ids: expect.arrayContaining([decisionArtifact?.payload?.observation?.decisionId]),
    });
  }, 30_000);

  it("does not execute mailbox tools from a negated live-source mail mention", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: "Do not read live source mail right now; explain conceptually what that mailbox is for.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      canonical: response.body?.canonical_goal_frame,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
    }, null, 2);

    expect(response.body?.canonical_goal_frame?.classifier_reasons ?? [], routeDebug).not.toContain("prefer_read_live_source_mail");
    expect(response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability) ?? [], routeDebug)
      .not.toContain("live_env.read_live_source_mail");
    expect(response.body?.stage_play_live_source_mailbox_debug, routeDebug).toMatchObject({
      route_admission: expect.objectContaining({
        status: "rejected",
        selected_target_source: expect.any(String),
      }),
      capability: null,
    });
    const debugExport = await request(createApp())
      .get(`/api/agi/ask/turn/${encodeURIComponent(response.body.turn_id)}/debug-export`)
      .expect(200);
    expect(debugExport.body?.payload?.stage_play_live_source_mailbox_debug, routeDebug).toMatchObject({
      route_admission: expect.objectContaining({
        status: "rejected",
        reason: expect.stringMatching(/selected/i),
      }),
      capability: null,
    });
  }, 30_000);

  it.each([
    [
      "future mailbox command",
      "In the future, use live_env.read_live_source_mail when I ask you to watch the mailbox; for now explain what that tool is.",
    ],
    [
      "quoted mailbox command",
      "\"live_env.read_live_source_mail\" is the literal command text I saw; explain what it means without running it.",
    ],
    [
      "screen-visible mailbox command",
      "The screen says \"read live source mail\" on a button. Do not press or execute it; just explain the label.",
    ],
  ])("does not execute mailbox tools from %s", async (_label, question) => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question,
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      mailboxDebug: response.body?.stage_play_live_source_mailbox_debug,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
    }, null, 2);

    const chosenCapabilities = response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability) ?? [];
    expect(chosenCapabilities, routeDebug).not.toContain("live_env.read_live_source_mail");
    expect(chosenCapabilities, routeDebug).not.toContain("live_env.record_live_source_mail_decision");
    expect(response.body?.stage_play_live_source_mailbox_debug?.route_admission?.status, routeDebug).not.toBe("won");

    const debugExport = await request(createApp())
      .get(`/api/agi/ask/turn/${encodeURIComponent(response.body.turn_id)}/debug-export`)
      .expect(200);
    expect(debugExport.body?.payload?.stage_play_live_source_mailbox_debug?.route_admission?.status, routeDebug)
      .not.toBe("won");
  }, 45_000);

  it("routes natural active visual mailbox prompts away from Situation Room visual capture", async () => {
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
      frame_id: "visual_frame:natural-mailbox-route",
      ts: "2026-06-04T16:32:00.000Z",
    });
    analyzeVisualFrame({
      thread_id: threadId,
      frame_id: frame.frame_id,
      evidence_id: "visual_evidence:natural-mailbox-route",
      summary: "Cosmic ambient YouTube scene with a planet and star field.",
      supports_claims: [
        {
          claim: "The active visual mailbox has compact evidence.",
          support_status: "supports",
          confidence: 0.82,
        },
      ],
    });

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: "Check the active visual live-source mailbox now. Read the latest visual summary mail, record the decision, and wait for next summary if nothing important changed.",
        sessionId: threadId,
        workspace_context_snapshot: {
          visual_context_capability: {
            status: "error",
            evidence_available: false,
            error: "visual capture evidence is unavailable",
          },
        },
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      availableCapabilities: response.body?.available_capabilities,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
      terminalErrorCode: response.body?.terminal_error_code,
    }, null, 2);

    expect(response.body?.canonical_goal_frame?.classifier_reasons, routeDebug).toContain("prefer_read_live_source_mail");
    expect(response.body?.source_target_intent, routeDebug).toMatchObject({
      target_source: "live_source_mailbox",
      target_kind: "live_source_mailbox",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(response.body?.source_target_intent?.requested_outputs, routeDebug).toEqual(expect.arrayContaining([
      "stage_play_live_source_mail_read_result",
      "stage_play_live_source_mail_decision",
    ]));
    expect(response.body?.source_target_intent?.suppressed_routes, routeDebug).toContain("visual_capture_describe");
    expect(response.body?.available_capabilities?.recommended_capability_key, routeDebug).toBe("live_env.read_live_source_mail");
    expect(response.body?.route_reason_code, routeDebug).not.toBe("clarify:missing_args");
    expect(response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability), routeDebug)
      .toEqual(expect.arrayContaining([
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
      ]));
    expect(response.body?.answer, routeDebug).not.toMatch(/visual capture evidence is unavailable|can't inspect the screen/i);
  }, 60_000);

  it("lets explicit observer mailbox wording suppress screen-capture routing", () => {
    const prompt = "Check the observer mailbox for the latest visual summary, not screen capture.";

    expect(isLiveSourceMailLoopPrompt(prompt)).toBe(true);
    const sourceTarget = arbitrateAskSourceTarget({
      turnId: "ask:test-observer-mailbox",
      threadId,
      promptText: prompt,
    });

    expect(sourceTarget).toMatchObject({
      target_source: "live_source_mailbox",
      target_kind: "live_source_mailbox",
      precedence_reason: "explicit_live_source_mail_loop_source_target",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(sourceTarget.suppressed_routes).toContain("visual_capture_describe");
  });

  it("forces a wait decision after a no-mail read instead of repeating the read tool", async () => {
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "live_env.read_live_source_mail",
        reason: "Read the live-source mailbox first.",
        args: {},
        expected_artifacts: ["stage_play_live_source_mail_read_result"],
        confidence: 0.9,
      },
      {
        next_step: "next_action",
        chosen_capability: "live_env.read_live_source_mail",
        reason: "Incorrectly repeat the mailbox read.",
        args: {},
        expected_artifacts: ["stage_play_live_source_mail_read_result"],
        confidence: 0.9,
      },
      {
        next_step: "next_action",
        chosen_capability: "live_env.read_live_source_mail",
        reason: "Incorrectly repeat the mailbox read again.",
        args: {},
        expected_artifacts: ["stage_play_live_source_mail_read_result"],
        confidence: 0.9,
      },
    ]);

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: "Use live_env.read_live_source_mail for the active Stage Play live-source mailbox. Watch this visual source and tell me if anything important happens.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      terminal: response.body?.terminal_artifact_kind,
      error: response.body?.terminal_error_code,
      runtimeLoop: response.body?.agent_runtime_loop,
      answer: response.body?.answer,
      currentTurnArtifactKinds: response.body?.current_turn_artifact_ledger?.map((artifact: any) => artifact?.kind),
    }, null, 2);

    expect(response.body?.terminal_error_code, routeDebug).not.toBe("agent_loop_budget_exhausted");
    expect(response.body?.agent_runtime_loop?.iterations?.map((iteration: any) => iteration?.chosen_capability), routeDebug)
      .toEqual(expect.arrayContaining([
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
      ]));
    const liveToolArtifacts = response.body?.current_turn_artifact_ledger
      ?.filter((artifact: any) => artifact?.kind === "live_environment_tool_observation")
      ?? [];
    const readArtifacts = liveToolArtifacts.filter((artifact: any) =>
      artifact?.payload?.tool_name === "live_env.read_live_source_mail"
    );
    expect(readArtifacts, routeDebug).toHaveLength(1);
    const decisionArtifact = liveToolArtifacts.find((artifact: any) =>
      artifact?.payload?.tool_name === "live_env.record_live_source_mail_decision"
    );
    expect(decisionArtifact?.payload?.observation, routeDebug).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "wait_for_next_summary",
      mailIds: [],
      nextLoopState: "armed_for_next_summary",
    });
    expect(response.body?.answer, routeDebug).toContain("No unread live-source updates were available at this check");
    expect(response.body?.answer, routeDebug).toContain("live-source mailbox is still armed");
    expect(response.body?.answer, routeDebug).not.toMatch(/visual evidence is unavailable|next visual summary/i);
  }, 30_000);

  it("answers Stage Play panel concept questions from repo/product evidence instead of live environment state", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: "ok what is the stage play panel?",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      evidenceTargetArbitration: response.body?.evidence_target_arbitration,
      availableCapabilities: response.body?.available_capabilities,
      runtimeLoop: response.body?.agent_runtime_loop,
      repoEvidenceRelevanceGate: response.body?.repo_evidence_relevance_gate,
      answer: response.body?.answer,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      finalAnswerSource: response.body?.final_answer_source,
    }, null, 2);

    expect(response.body?.evidence_target_arbitration, routeDebug).toMatchObject({
      schema: "helix.ask_evidence_target_arbitration.v1",
      selected_target_source: "repo_code",
      selected_target_kind: "repo_code",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body?.evidence_target_arbitration?.evidence_target_candidates, routeDebug).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target_source: "repo_code",
          capability_keys: expect.arrayContaining(["repo-code.search_concept"]),
        }),
        expect.objectContaining({
          target_source: "live_environment",
          reason_codes: expect.arrayContaining(["stage_play_lexical_candidate_only"]),
        }),
      ]),
    );
    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "repo_entity_definition",
      required_terminal_kind: "repo_code_evidence_answer",
    });
    expect(response.body?.source_target_intent, routeDebug).toMatchObject({
      target_source: "repo_code",
      target_kind: "repo_code",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("repo-code.search_concept");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "repo-code.search_concept"
    ), routeDebug).toBe(true);
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      String(iteration?.chosen_capability ?? "").startsWith("live_env.")
    ), routeDebug).toBe(false);
    expect(response.body?.repo_evidence_relevance_gate, routeDebug).toMatchObject({
      terminal_allowed: true,
      selected_evidence_roles: expect.arrayContaining(["runtime_contract"]),
    });
    expect(response.body?.terminal_artifact_kind, routeDebug).toBe("repo_code_evidence_answer");
    expect(response.body?.answer, routeDebug).toMatch(/Stage Play|stage_play|Badge Graph/i);
    expect(response.body?.answer, routeDebug).not.toMatch(/currently not accessible|absence of a live answer environment/i);
  }, 60_000);

  it("plans a Stage Play visual prediction job instead of treating attach as live-source control", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question:
          "I'm about to attach a YouTube tab and I want you to predict what happens next based on visual capture.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      selectedAction: response.body?.selected_action,
      answer: response.body?.answer,
      finalAnswerSource: response.body?.final_answer_source,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      terminalErrorCode: response.body?.terminal_error_code,
      routeProductContract: response.body?.route_product_contract,
      terminalArtifactSelectionGuard: response.body?.terminal_artifact_selection_guard,
      finalRouteReconciliation: response.body?.final_route_reconciliation,
      solverControllerDecision: response.body?.solver_controller_decision,
      runtimeLoop: response.body?.agent_runtime_loop,
    }, null, 2);

    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "direct_answer_text",
    });
    expect(response.body?.route_reason_code, routeDebug).not.toBe("live_source_continuation");
    expect(response.body?.live_source_continuation_intent, routeDebug).toBeFalsy();
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "live_environment",
      target_kind: "live_environment",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.plan_stage_play_job");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.plan_stage_play_job"
    )).toBe(true);
    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.plan_stage_play_job"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      artifactId: "stage_play_job_plan",
      schemaVersion: "stage_play_job_plan/v1",
      domain: "narrative_media",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.requiredSources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        modality: "visual_frame",
        required: true,
        routeTo: "narrative_stage_play",
      }),
      expect.objectContaining({
        modality: "audio_transcript",
        required: false,
        routeTo: "narrative_stage_play",
      }),
    ]));
    expect(response.body?.answer).toContain("Stage Play job planned");
    expect(response.body?.answer).toContain("Needed: Browser tab visual source");
    expect(response.body?.answer).toContain("Optional: Optional audio transcript source");
    expect(response.body?.answer).toContain("did not start capture");
    expect(response.body?.answer).not.toContain("\"artifactId\":\"stage_play_job_plan\"");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(response.body?.terminal_artifact_kind).not.toBe("live_pipeline_receipt");
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);
  }, 60_000);

  it("routes Stage Play checkpoint requests to the checkpoint queue tool", async () => {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed-stage-play-checkpoint-routing",
      objective: "Run the Stage Play checkpoint for the active visual source.",
      preset: "narrative_scene_monitor",
      room_id: roomId,
      source_ids: [sourceId],
      line_schema: STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA,
      now: "2026-06-02T12:25:00.000Z",
    });
    upsertLiveSourceDescriptor({
      source_id: sourceId,
      thread_id: threadId,
      environment_id: environment.environment_id,
      modality: "visual_frame",
      user_label: "Browser tab visual",
      serving_context: {
        surface: "browser_tab",
        source_origin: "browser_getDisplayMedia",
        app_hint: "Chrome",
      },
      current_state: "active_interval",
      cadence_ms: 10000,
      latest_observation_refs: ["live_source_observation:stage-play-checkpoint-routing"],
    });
    upsertLiveSourceProducer({
      sourceId,
      threadId,
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      latestChunkId: "live_source_chunk:stage-play-checkpoint-routing",
      now: "2026-06-02T12:25:01.000Z",
    });
    recordLiveSourceObservation({
      schema: "helix.live_source_observation.v1",
      observation_id: "live_source_observation:stage-play-checkpoint-routing",
      thread_id: threadId,
      room_id: roomId,
      environment_id: environment.environment_id,
      source_id: sourceId,
      source_kind: "visual_frame",
      event_kind: "visual_frame_summary",
      observed_at: "2026-06-02T12:25:02.000Z",
      freshness: { status: "fresh", age_ms: 20 },
      provenance: { adapter: "browser.visual", confidence: "medium" },
      compact_summary: "The active visual source has a compact frame summary ready for a Stage Play checkpoint.",
      evidence_refs: ["evidence:stage-play-checkpoint-routing"],
      assistant_answer: false,
      raw_content_included: false,
    });

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Run the Stage Play checkpoint for the active visual source.",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: response.body?.canonical_goal_frame,
      sourceTarget: response.body?.source_target_intent,
      selectedAction: response.body?.selected_action,
      answer: response.body?.answer,
      finalAnswerSource: response.body?.final_answer_source,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      terminalErrorCode: response.body?.terminal_error_code,
      productAuthorityGuard: response.body?.product_authority_guard,
      finalRouteReconciliation: response.body?.final_route_reconciliation,
      solverControllerDecision: response.body?.solver_controller_decision,
      runtimeLoop: response.body?.agent_runtime_loop,
    }, null, 2);

    expect(
      classifyLiveSourceContinuationIntent(
        "Run the Stage Play checkpoint for the active visual source.",
      ),
    ).toBeNull();
    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(response.body?.route_reason_code, routeDebug).not.toBe("live_source_continuation");
    expect(response.body?.live_source_continuation_intent, routeDebug).toBeFalsy();
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "live_environment",
      target_kind: "live_environment",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.request_stage_play_checkpoint");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.request_stage_play_checkpoint"
    )).toBe(true);
    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.request_stage_play_checkpoint"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      schema: "stage_play_checkpoint_request_result/v1",
      checkpointRequest: {
        artifactId: "stage_play_checkpoint_request",
        schemaVersion: "stage_play_checkpoint_request/v1",
        status: "running",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      readyToRun: true,
      queueState: {
        schema: "stage_play_checkpoint_queue/v1",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.queueState.requests).toEqual(expect.arrayContaining([
      expect.objectContaining({
        artifactId: "stage_play_checkpoint_request",
        schemaVersion: "stage_play_checkpoint_request/v1",
        status: "running",
        assistant_answer: false,
        context_role: "tool_evidence",
      }),
    ]));
    expect(response.body?.answer, routeDebug).toContain("Stage Play checkpoint request running");
    expect(response.body?.answer, routeDebug).toContain("tool evidence only");
    expect(response.body?.answer, routeDebug).toContain("did not produce the final answer snapshot");
    expect(response.body?.answer).not.toContain("\"schema\":\"stage_play_checkpoint_request_result/v1\"");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.final_answer_source).not.toBe("live_pipeline_receipt");
    expect(response.body?.final_answer_source).not.toBe("live_environment_tool_observation");
    expect(response.body?.terminal_artifact_kind).not.toBe("live_environment_tool_observation");
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);
  }, 60_000);

  it("prefers reflect_stage_play_context over generic visual Live Answer setup", async () => {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:seed-stage-play-routing",
      objective: "Project Stage Play graph into Live Interpretation.",
      preset: "custom",
      room_id: roomId,
      source_ids: [sourceId],
      line_schema: STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA,
      now: "2026-06-02T12:30:00.000Z",
    });
    upsertLiveSourceDescriptor({
      source_id: sourceId,
      thread_id: threadId,
      environment_id: environment.environment_id,
      modality: "visual_frame",
      user_label: "Browser tab visual",
      serving_context: {
        surface: "browser_tab",
        source_origin: "browser_getDisplayMedia",
        app_hint: "Chrome",
      },
      current_state: "active_interval",
      cadence_ms: 10000,
      latest_observation_refs: ["visual_observation:stage-play-routing"],
    });
    upsertLiveSourceProducer({
      sourceId,
      threadId,
      modality: "visual_frame",
      status: "active",
      cadenceMs: 10000,
      captureMode: "interval",
      latestChunkId: "live_source_chunk:stage-play-routing",
      now: "2026-06-02T12:30:01.000Z",
    });

    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        question: [
          "Use the Stage Play reflection capability live_env.reflect_stage_play_context.",
          "Reflect the active Stage Play Badge Graph and project the current Live Interpretation.",
          "Stage Play checkpoint handle: stage_play_checkpoint_request:ui-handoff.",
          "Stage Play graph handle: stage_play_badge_graph:ui-handoff.",
          "Stage Play evidence handles: live_source_descriptor:stage-play-routing, live_source_producer:stage-play-routing, visual_observation:stage-play-routing.",
          "Checkpoint focus: Given the first usable Stage Play observation, what checkpoint answer should be summarized for the active visual evidence?",
          "Report checkpoint freshness, missing evidence, and whether a current model-reviewed Answer Snapshot exists after the reflection.",
          "Leave visual/audio capture cadence unchanged.",
        ].join("\n"),
        sessionId: threadId,
        workspace_context_snapshot: {
          visual_context_capability: {
            status: "error",
            evidence_available: false,
            error: "visual capture evidence is unavailable",
          },
        },
        debug: true,
      })
      .expect(200);

    const routeDebug = JSON.stringify({
      route: response.body?.route_reason_code,
      canonical: {
        goal_kind: response.body?.canonical_goal_frame?.goal_kind,
        required_terminal_kind: response.body?.canonical_goal_frame?.required_terminal_kind,
      },
      sourceTarget: {
        target_source: response.body?.source_target_intent?.target_source,
        target_kind: response.body?.source_target_intent?.target_kind,
        reasons: response.body?.source_target_intent?.reasons,
      },
      selectedAction: response.body?.selected_action,
      workstationPlan: response.body?.workstation_tool_plan,
      actionEnvelope: response.body?.action_envelope?.governance,
      capabilityPlan: {
        requested_action: response.body?.capability_plan?.requested_action,
        admission_status: response.body?.capability_plan?.admission_status,
      },
      capabilityResult: {
        status: response.body?.capability_result?.status,
        selected_for_answer: response.body?.capability_result?.selected_for_answer,
        reentered_solver: response.body?.capability_result?.reentered_solver,
      },
      capabilityLifecycleLedger: {
        ok: response.body?.capability_lifecycle_ledger?.ok,
        failure_codes: response.body?.capability_lifecycle_ledger?.failure_codes,
      },
      solverControllerDecision: {
        decision: response.body?.solver_controller_decision?.decision,
        selected_terminal_artifact_kind: response.body?.solver_controller_decision?.selected_terminal_artifact_kind,
        blocking_reasons: response.body?.solver_controller_decision?.blocking_reasons,
      },
      goalSatisfaction: {
        satisfaction: response.body?.goal_satisfaction_evaluation?.satisfaction,
        next_decision: response.body?.goal_satisfaction_evaluation?.next_decision,
        required_terminal_kind: response.body?.goal_satisfaction_evaluation?.required_terminal_kind,
      },
      terminalAuthority: {
        final_answer_source: response.body?.terminal_answer_authority?.final_answer_source,
        terminal_artifact_kind: response.body?.terminal_answer_authority?.terminal_artifact_kind,
      },
      finalAnswerSource: response.body?.final_answer_source,
      terminalArtifactKind: response.body?.terminal_artifact_kind,
      finalAnswerDraftAuthority: response.body?.final_answer_draft?.authority,
      askTurnSolverTrace: {
        completed_solver_path: response.body?.ask_turn_solver_trace?.completed_solver_path,
        final_arbitration: response.body?.ask_turn_solver_trace?.final_arbitration,
      },
      stagePlayAskCheckpointReceipt: response.body?.stage_play_ask_checkpoint_receipt,
      stagePlayCheckpointQueueCompletion: response.body?.stage_play_checkpoint_queue_completion,
      currentTurnArtifactKinds: response.body?.current_turn_artifact_ledger?.map((artifact: any) => artifact?.kind),
      stagePlayReceiptArtifacts: response.body?.current_turn_artifact_ledger
        ?.filter((artifact: any) => artifact?.kind === "stage_play_ask_checkpoint_receipt")
        ?.map((artifact: any) => artifact?.payload),
      answer: response.body?.answer,
    }, null, 2);

    expect(response.body?.canonical_goal_frame, routeDebug).toMatchObject({
      goal_kind: "live_environment_review",
      required_terminal_kind: "direct_answer_text",
    });
    expect(response.body?.route_reason_code, routeDebug).not.toBe("live_source_continuation");
    expect(response.body?.live_source_continuation_intent, routeDebug).toBeFalsy();
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "live_environment",
      target_kind: "live_environment",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.route_product_contract).toMatchObject({
      source_target: "live_environment",
      precedence_reason: "live_environment_source_target_requires_tool_observation_then_model_synthesis",
    });
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("live_env.reflect_stage_play_context");
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "live_env.reflect_stage_play_context"
    )).toBe(true);
    const dynamicToolActionNames = response.body?.current_turn_artifact_ledger
      ?.filter((artifact: any) => artifact?.kind === "dynamic_tool_call")
      ?.map((artifact: any) => artifact?.payload?.tool_action_name ?? artifact?.payload?.action_name ?? artifact?.payload?.name)
      ?? [];
    expect(dynamicToolActionNames, routeDebug).not.toContain("situation-room.pipeline.compose");
    expect(dynamicToolActionNames, routeDebug).not.toContain("situation-room.pipeline.execute");

    const liveToolArtifact = response.body?.current_turn_artifact_ledger?.find((artifact: any) =>
      artifact?.kind === "live_environment_tool_observation" &&
      artifact?.payload?.tool_name === "live_env.reflect_stage_play_context"
    );
    expect(liveToolArtifact?.payload?.observation).toMatchObject({
      schema: "stage_play_reflection_result/v1",
      graph: { artifactId: "stage_play_badge_graph" },
      outputLaneProjection: { artifactId: "stage_play_output_lane_projection" },
      liveAnswerProjection: {
        attempted: true,
        projected: true,
      },
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.debugReceipt).toMatchObject({
      schema: "stage_play_tool_receipt_debug/v1",
      toolName: "live_env.reflect_stage_play_context",
      graphId: expect.stringContaining("stage_play_badge_graph:"),
      sourceRefs: expect.arrayContaining([
        expect.stringMatching(/live_source_descriptor|live_source_producer|visual_observation|live_source_chunk/),
      ]),
      visualSourceStatus: expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          modality: "visual_frame",
          status: "active",
          selectedForStagePlay: true,
          routeTo: expect.any(String),
        }),
      ]),
      outputProjectionKeys: expect.arrayContaining(["risk", "possibilities", "unknowns", "next_check"]),
      checkpointFreshness: expect.objectContaining({
        reason: "no_checkpoint",
        modelReviewed: false,
        fresh: false,
      }),
      checkpointRequestId: expect.any(String),
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(liveToolArtifact.payload.observation.liveAnswerProjection.changedLineKeys).toEqual(
      expect.arrayContaining(["risk", "possibilities", "unknowns", "next_check"]),
    );
    expect(response.body?.answer, routeDebug).toContain("Stage Play reflected the active visual source and queued a checkpoint.");
    expect(response.body?.answer).toContain("No model-reviewed answer snapshot exists yet.");
    expect(response.body?.answer).toContain("Stage Play reflected the active visual source");
    expect(response.body?.answer).toContain("queued a checkpoint");
    expect(response.body?.answer).not.toContain("visual capture evidence is unavailable");
    expect(response.body?.terminal_error_code).not.toBe("visual_evidence_missing");
    expect(response.body?.answer).not.toContain("\"artifactId\":\"stage_play_badge_graph\"");
    expect(response.body?.final_answer_draft?.authority, routeDebug).toBe("deterministic_receipt_fallback");
    expect(response.body?.terminal_artifact_kind, routeDebug).toBe("tool_receipt");
    expect(response.body?.terminal_artifact_kind, routeDebug).not.toBe("model_synthesized_answer");
    expect(response.body?.final_answer_source, routeDebug).toBe("deterministic_receipt_fallback");
    expect(response.body?.terminal_eligible, routeDebug).toBe(false);
    expect(response.body?.assistant_answer, routeDebug).toBe(false);
    expect(response.body?.terminal_answer_authority, routeDebug).toMatchObject({
      terminal_artifact_kind: "tool_receipt",
      final_answer_source: "deterministic_receipt_fallback",
      server_authoritative: false,
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(response.body?.terminal_presentation, routeDebug).toMatchObject({
      terminal_artifact_kind: "tool_receipt",
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(response.body?.stage_play_checkpoint_queue_completion, routeDebug).toBeFalsy();
    expect(response.body?.stage_play_ask_checkpoint_receipt, routeDebug).toBeFalsy();
    const boundaryReport = evaluateTerminalBoundaryEligibility(response.body as Record<string, unknown>);
    expect(boundaryReport.checks.agent_runtime_loop).toBe(true);
    expect(boundaryReport.checks.agent_step_decision).toBe(true);
    expect(boundaryReport.checks.selected_capability_observation).toBe(true);
    expect(boundaryReport.checks.post_observation_model_decision).toBe(true);
    expect(boundaryReport.eligible).toBe(true);

    const refreshedGraph = buildStagePlayGraphFromWorld({
      threadId,
      roomId,
      environmentId: environment.environment_id,
      now: new Date("2026-06-02T12:30:03.000Z"),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "helix_ask.checkpoint.latest")).toMatchObject({
      status: "missing_evidence",
      checkpoint: expect.objectContaining({
        askTurnId: null,
        solverTraceRef: null,
        terminalArtifactKind: null,
        finalAnswerSource: null,
        modelReviewed: false,
      }),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "answer_snapshot.latest")).toMatchObject({
      status: "missing_evidence",
      output: expect.objectContaining({
        state: "stale",
      }),
    });
    expect(refreshedGraph.badges.find((badge) => badge.id === "live_output.current")).toMatchObject({
      status: "missing_evidence",
      output: expect.objectContaining({
        state: "stale",
        voiceEligible: false,
      }),
    });
  }, 60_000);
});
