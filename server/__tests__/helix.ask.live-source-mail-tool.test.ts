import { beforeEach, describe, expect, it } from "vitest";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";
import { resetStagePlayLiveSourceMailboxForTest } from "../services/stage-play/stage-play-live-source-mailbox-store";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";

const threadId = "thread:helix-ask-live-source-mail-tool";
const roomId = "room:helix-ask-live-source-mail-tool";
const sourceId = "visual_source:helix-ask-live-source-mail-tool";

beforeEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
  resetVisualSnapshotStoreForTest();
});

const seedVisualSummary = () => {
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
    frame_id: "visual_frame:helix-ask-live-source-mail-tool",
    ts: "2026-06-04T12:10:00.000Z",
  });
  analyzeVisualFrame({
    thread_id: threadId,
    frame_id: frame.frame_id,
    evidence_id: "visual_evidence:helix-ask-live-source-mail-tool",
    summary: "Minecraft-like scene with a player, cat, book stand, and distant mountains.",
    supports_claims: [
      {
        claim: "The active visual source has compact evidence.",
        support_status: "supports",
        confidence: 0.78,
      },
    ],
  });
};

const seedVisualSummaries = (count: number) => {
  startVisualSnapshotSource({
    source_id: sourceId,
    thread_id: threadId,
    room_id: roomId,
    source_surface: "browser_tab",
    capture_mode: "interval",
    status: "active",
  });
  for (let index = 0; index < count; index += 1) {
    const frame = recordVisualFrame({
      source_id: sourceId,
      thread_id: threadId,
      room_id: roomId,
      frame_id: `visual_frame:helix-ask-live-source-mail-tool:${index}`,
      ts: `2026-06-04T12:10:${String(index).padStart(2, "0")}.000Z`,
    });
    analyzeVisualFrame({
      thread_id: threadId,
      frame_id: frame.frame_id,
      evidence_id: `visual_evidence:helix-ask-live-source-mail-tool:${index}`,
      summary: `Live frame ${index + 1} shows a fabric recommendation interface with cotton ripstop option ${index + 1}.`,
      supports_claims: [
        {
          claim: "The active visual source has compact evidence.",
          support_status: "supports",
          confidence: 0.78,
        },
      ],
    });
  }
};

describe("live-source mail live environment tools", () => {
  it("advertises live-source mail tools as automatic evidence-only capabilities", () => {
    const packet = buildLiveEnvironmentRuntimePacket({
      threadId,
      roomId,
      now: "2026-06-04T12:10:01.000Z",
    });

    expect(packet.available_tools).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tool_id: "live_env.check_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.read_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.configure_live_source_watch_job",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.record_live_source_mail_decision",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
    ]));
  });

  it("configures a live-source watch job policy without reading mail or answering", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_live_source_watch_job",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        objective: "Watch the visual source and only announce if a hostile mob appears.",
        decision_policy_prompt: "Only call out hostile mobs. Ignore ordinary camera movement.",
        importance_criteria: ["hostile mob appears"],
        suppress_criteria: ["ordinary camera movement"],
        output_policy: {
          allow_text_answer: true,
          allow_voice_callout: true,
          voice_requires_urgency: true,
          confirmation_required: false,
        },
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.configure_live_source_watch_job",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toContain("Configured live-source watch job policy");
    expect(observation.summary).toContain("no mail was read");
    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_watch_job_policy_config_result",
      schema: "stage_play_live_source_watch_job_policy_config_result/v1",
      schemaVersion: "stage_play_live_source_watch_job_policy_config_result/v1",
      watchJobPolicyRef: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
      watch_job_policy_ref: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
      policyCount: 1,
      policy: {
        artifactId: "stage_play_live_source_watch_job_policy",
        objectiveText: "Watch the visual source and only announce if a hostile mob appears.",
        decisionPolicyPrompt: "Only call out hostile mobs. Ignore ordinary camera movement.",
        sourceIds: [sourceId],
        outputPolicy: {
          allowTextAnswer: true,
          allowVoiceCallout: true,
          voiceRequiresUrgency: true,
        },
        importanceCriteria: ["hostile mob appears"],
        suppressCriteria: ["ordinary camera movement"],
        assistant_answer: false,
        terminal_eligible: false,
      },
      jobState: {
        objective: "Watch the visual source and only announce if a hostile mob appears.",
        watchJobPolicyRef: expect.stringMatching(/^stage_play_live_source_watch_job_policy:/),
        nextLoopState: "armed_for_next_summary",
      },
      transcriptRows: [
        expect.objectContaining({
          rowKind: "loop_state",
          title: "Watch job configured",
          terminalEligible: false,
          assistantAnswer: false,
        }),
        expect.objectContaining({
          rowKind: "loop_state",
          title: "Objective",
          body: "Objective: Watch the visual source and only announce if a hostile mob appears.",
        }),
        expect.objectContaining({
          rowKind: "loop_state",
          title: "Source",
          body: `Source: ${sourceId}`,
        }),
        expect.objectContaining({
          rowKind: "loop_state",
          title: "Policy",
          body: expect.stringContaining("text answer allowed"),
        }),
        expect.objectContaining({
          rowKind: "loop_state",
          title: "Loop state",
          body: "Loop state: armed for next summary.",
        }),
      ],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });
    expect(payload.artifactId).not.toBe("stage_play_live_source_mail_read_result");
    expect(payload.mailboxThreadId).toBe(threadId);
  });

  it("generates a strong default decision policy for describe-each-batch visual watch jobs", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_live_source_watch_job",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        objective: "Watch the active visual source and describe each new mail batch in one sentence.",
      },
    });

    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_watch_job_policy_config_result",
      policy: {
        objectiveText: "Watch the active visual source and describe each new visual-summary mail batch in one sentence.",
        interpretationMode: "latest_scene_answer",
        decisionPolicyPrompt: [
          "For each unread mail batch, read the listed mail refs as the current observation window.",
          "If the mail batch contains any compact visual summary, record draft_text_answer.",
          "The textAnswerDraft must be one sentence describing what was observed.",
          "If the batch is empty, record wait_for_next_summary.",
          "Do not claim visual evidence is unavailable when mail refs or compact summaries exist.",
          "After recording the decision, set nextLoopState to armed_for_next_summary.",
        ].join("\n"),
        outputPolicy: {
          allowTextAnswer: true,
          allowVoiceCallout: false,
          voiceRequiresUrgency: true,
          confirmationRequired: true,
        },
        importanceCriteria: [
          "Any new visual-summary mail batch should produce a one-sentence text answer.",
        ],
        suppressCriteria: [
          "Suppress only if no unread mail items exist or mail lacks compact summary text.",
        ],
      },
      jobState: {
        objective: "Watch the active visual source and describe each new visual-summary mail batch in one sentence.",
        nextLoopState: "armed_for_next_summary",
      },
    });
    expect(payload.artifactId).not.toBe("stage_play_live_source_mail_read_result");
    expect(payload.transcriptRows.map((row: any) => row.title)).toEqual([
      "Watch job configured",
      "Objective",
      "Source",
      "Policy",
      "Loop state",
    ]);
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Objective",
        body: "Objective: Watch the active visual source and describe each new visual-summary mail batch in one sentence.",
      }),
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Source",
        body: `Source: ${sourceId}`,
      }),
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining("latest_scene_answer"),
      }),
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining("voice disabled"),
      }),
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining("confirmation required"),
      }),
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Loop state",
        body: "Loop state: armed for next summary.",
      }),
    ]));
    expect(observation.assistant_answer).toBe(false);
    expect(payload.terminal_eligible).toBe(false);
  });

  it.each(["live_env.check_live_source_mail", "live_env.read_live_source_mail"] as const)(
    "reads latest visual summary mail as evidence through %s and requires a follow-up model decision",
    (toolName) => {
    seedVisualSummary();

    const observation = executeLiveEnvironmentTool({
      tool_name: toolName,
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: toolName,
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toBe("Read 1 unread live-source mail item(s); decision required.");
    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_read_result",
      items: [
        expect.objectContaining({
          sourceId,
          sourceRefs: expect.objectContaining({
            frameRef: "visual_frame:helix-ask-live-source-mail-tool",
            evidenceRef: "visual_evidence:helix-ask-live-source-mail-tool",
          }),
          assistant_answer: false,
          terminal_eligible: false,
        }),
      ],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "mail_read_tool_call",
      "mail_read_receipt",
    ]));
    expect(observation.evidence_refs).toEqual(expect.arrayContaining([
      sourceId,
      "visual_frame:helix-ask-live-source-mail-tool",
      "visual_evidence:helix-ask-live-source-mail-tool",
    ]));
  });

  it("reads a full default same-source batch through live_env.read_live_source_mail when args are empty", () => {
    seedVisualSummaries(5);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const payload = observation.observation as any;
    expect(observation.summary).toBe("Read 5 unread live-source mail item(s); decision required.");
    expect(payload.items.map((item: any) => item.mailId)).toHaveLength(5);
    expect(payload.items.map((item: any) => item.summary.text)).toEqual([
      expect.stringContaining("Live frame 1"),
      expect.stringContaining("Live frame 2"),
      expect.stringContaining("Live frame 3"),
      expect.stringContaining("Live frame 4"),
      expect.stringContaining("Live frame 5"),
    ]);
  });

  it("keeps live_env.check_live_source_mail as a lightweight three-item status check", () => {
    seedVisualSummaries(5);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.check_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const payload = observation.observation as any;
    expect(observation.summary).toBe("Read 3 unread live-source mail item(s); decision required.");
    expect(payload.items).toHaveLength(3);
  });

  it.each([
    {
      objective: "Watch the active visual source and describe each new mail batch in one sentence.",
      expectedMode: "latest_scene_answer",
    },
    {
      objective: "Watch the active visual source and interpret what is happening across the summaries.",
      expectedMode: "batch_interpretation",
    },
    {
      objective: "Watch the active visual source and do not bother me unless something important changes.",
      expectedMode: "salience_watch",
    },
    {
      objective: "Watch the active visual source, interpret the summaries, and predict what might happen next.",
      expectedMode: "prediction_watch",
    },
    {
      objective: "Watch the active visual source and announce if anything important happens.",
      expectedMode: "voice_callout_watch",
    },
  ])("classifies watch-job policy mode: $expectedMode", ({ objective, expectedMode }) => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_live_source_watch_job",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        objective,
      },
    });

    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_watch_job_policy_config_result",
      policy: {
        interpretationMode: expectedMode,
      },
    });
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining(expectedMode),
      }),
    ]));
  });

  it("records a wait decision when no unread live-source updates exist", () => {
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_kind: "visual_frame",
      },
    });

    expect(readObservation).toMatchObject({
      tool_name: "live_env.read_live_source_mail",
      ok: true,
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    const readPayload = readObservation.observation as any;
    expect(readPayload.items).toEqual([]);
    expect(readPayload.transcriptRows.find((row: any) => row.rowKind === "wait_for_next_summary")?.body)
      .toBe("No unread live-source updates. Standing by for the next source update.");

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [],
        decision: "wait_for_next_summary",
        rationale_preview: "No unread live-source updates. Standing by for the next source update.",
        next_loop_state: "armed_for_next_summary",
      },
    });

    expect(decisionObservation).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      ok: true,
      summary: "Recorded wait_for_next_summary; no unread live-source updates. Standing by for the next source update.",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    const decisionPayload = decisionObservation.observation as any;
    expect(decisionPayload).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "wait_for_next_summary",
      nextLoopState: "armed_for_next_summary",
      terminal_eligible: false,
      assistant_answer: false,
    });
  });

  it("records the model decision as evidence and keeps text/voice drafts non-terminal", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.check_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
      },
    });
    const mailId = (readObservation.observation as any).items[0].mailId;

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "draft_text_answer",
        rationale_preview: "The compact summary is enough to draft a visible text update.",
        text_answer_draft: "The active visual source shows a Minecraft-like scene with a player and cat.",
        text_answer_terminal_eligible: false,
      },
    });

    expect(decisionObservation).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    const payload = decisionObservation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "draft_text_answer",
      nextLoopState: "armed_for_next_summary",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(payload.textAnswerDraft).toMatchObject({
      terminalEligible: false,
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "text_answer",
      "loop_state",
    ]));
    expect(payload.transcriptRows.find((row: any) => row.rowKind === "text_answer").terminalEligible).toBe(false);
  });

  it("records structured interpretation payloads as narrative state and transcript rows", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
      },
    });
    const mailId = (readObservation.observation as any).items[0].mailId;

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "record_interpretation",
        rationale_preview: "The scene shifted into a readable Minecraft-like overwatch state.",
        interpretation: {
          currentSceneSummary: "A player is near a cat, book stand, and distant mountains.",
          runningStorySummary: "The live source is showing a Minecraft-like scene around a player base.",
          setting: "Minecraft-like game scene",
          activeWindowOrScene: "player base overlook",
          entities: ["player", "cat"],
          objects: ["book stand", "distant mountains"],
          activities: ["standing near base objects"],
          userRelevantMeaning: "The player appears stationary near base objects while the outside scene remains visible.",
          meaningfulChanges: ["The compact summary now highlights base objects and distant terrain."],
          uncertainties: ["The raw frame is not included, so exact inventory or UI state is unknown."],
          watchNextTargets: ["player movement", "nearby mobs", "base objects"],
          watchNextReason: "Watch whether the player moves or a risk appears near the base.",
          predictionText: "The next summary will likely confirm whether the player stays near the base or moves away.",
          predictionHorizon: "next_mail",
          predictionConfidence: 0.62,
          validationSignals: ["player remains near base", "player moves away", "hostile mob appears"],
        },
      },
    });

    expect(decisionObservation).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    const payload = decisionObservation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "record_interpretation",
      narrativeStateRef: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      narrativeState: {
        narrativeStateId: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
        currentSceneSummary: "A player is near a cat, book stand, and distant mountains.",
        runningStorySummary: "The live source is showing a Minecraft-like scene around a player base.",
        interpretedSituation: {
          setting: "Minecraft-like game scene",
          activeWindowOrScene: "player base overlook",
          entities: ["player", "cat"],
          objects: ["book stand", "distant mountains"],
          activities: ["standing near base objects"],
          userRelevantMeaning: "The player appears stationary near base objects while the outside scene remains visible.",
        },
        meaningfulChanges: ["The compact summary now highlights base objects and distant terrain."],
        uncertainties: ["The raw frame is not included, so exact inventory or UI state is unknown."],
        watchNext: {
          targets: ["player movement", "nearby mobs", "base objects"],
          reason: "Watch whether the player moves or a risk appears near the base.",
        },
        prediction: {
          text: "The next summary will likely confirm whether the player stays near the base or moves away.",
          horizon: "next_mail",
          confidence: 0.62,
          validationSignals: ["player remains near base", "player moves away", "hostile mob appears"],
        },
      },
      post_tool_model_step_required: true,
      terminal_eligible: false,
    });
    expect(payload.transcriptRows.map((row: any) => row.title)).toEqual(expect.arrayContaining([
      "Interpretation",
      "Watch next",
      "Prediction",
      "Narrative state",
    ]));
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "interpretation",
      "watch_next",
      "prediction",
      "narrative_state",
    ]));
    expect(payload.transcriptRows.filter((row: any) => (
      row.rowKind === "interpretation" ||
      row.rowKind === "watch_next" ||
      row.rowKind === "narrative_state"
    )).every((row: any) => row.terminalEligible === false)).toBe(true);
    expect(payload.transcriptRows.find((row: any) => row.title === "Watch next")?.body)
      .toContain("player movement");
    expect(payload.transcriptRows.find((row: any) => row.title === "Prediction")?.body)
      .toContain("62%");
  });

  it("records requested_tool from the decision tool as the next requested action", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });
    const mailId = (readObservation.observation as any).items[0].mailId;

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "request_more_evidence",
        rationale_preview: "Need the next compact visual summary before answering.",
        requested_tool: {
          tool_name: "live_env.read_live_source_mail",
          args: {
            source_kind: "visual_frame",
            limit: 1,
          },
        },
      },
    });

    const payload = decisionObservation.observation as any;
    expect(payload.requestedTool).toEqual({
      toolName: "live_env.read_live_source_mail",
      args: {
        source_kind: "visual_frame",
        limit: 1,
      },
    });
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "agent_decision",
      "requested_tool",
      "loop_state",
    ]));
    expect(payload.transcriptRows.find((row: any) => row.rowKind === "requested_tool").terminalEligible).toBe(false);
  });

  it("blocks voice requested_tool when mailbox voice policy requires confirmation", () => {
    seedVisualSummary();
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        voice_enabled: true,
        voice_requires_confirmation: true,
        voice_allowed_now: false,
        voice_policy_reason: "voice_requires_confirmation",
      },
    });
    const readPayload = readObservation.observation as any;
    const mailId = readPayload.items[0].mailId;
    expect(readPayload.voicePolicy).toMatchObject({
      voiceEnabled: true,
      requiresConfirmation: true,
      allowedNow: false,
      reason: "voice_requires_confirmation",
    });

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "request_voice_callout",
        rationale_preview: "A callout is useful, but confirmation is required before speech.",
        voice_callout_draft: "Hostile mob appeared near the player.",
        voice_enabled: true,
        voice_requires_confirmation: true,
        voice_allowed_now: false,
        voice_policy_reason: "voice_requires_confirmation",
        requested_tool: {
          tool_name: "situation-room-pipelines.voice_delivery.confirm_speak",
          args: {
            text: "Hostile mob appeared near the player.",
          },
        },
      },
    });

    const payload = decisionObservation.observation as any;
    expect(payload.voicePolicy).toMatchObject({
      voiceEnabled: true,
      requiresConfirmation: true,
      allowedNow: false,
      reason: "voice_requires_confirmation",
    });
    expect(payload.voiceCalloutDraft).toMatchObject({
      text: "Hostile mob appeared near the player.",
      voiceEligible: false,
      requiresConfirmation: true,
    });
    expect(payload.requestedTool).toBeNull();
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toContain("voice_callout_request");
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).not.toContain("voice_tool_call");
  });
});
