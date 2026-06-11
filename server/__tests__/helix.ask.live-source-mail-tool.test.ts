import { beforeEach, describe, expect, it } from "vitest";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  analyzeVisualFrame,
  recordVisualFrame,
  resetVisualSnapshotStoreForTest,
  startVisualSnapshotSource,
} from "../services/situation-room/visual-snapshot-store";
import {
  listStagePlayLiveSourceMailItems,
  resetStagePlayLiveSourceMailboxForTest,
} from "../services/stage-play/stage-play-live-source-mailbox-store";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";
import { resetStagePlayLiveSourceNarrativeStoreForTest } from "../services/stage-play/stage-play-live-source-narrative-store";
import { resetStagePlayLiveSourceInterpreterProfileStoreForTest } from "../services/stage-play/stage-play-live-source-interpreter-profile-store";
import { resetStagePlayProcessedMailPacketStoreForTest } from "../services/stage-play/stage-play-processed-mail-packet-store";
import { resetStagePlayVisualObserverProfileStoreForTest } from "../services/stage-play/stage-play-visual-observer-profile-store";

const threadId = "thread:helix-ask-live-source-mail-tool";
const roomId = "room:helix-ask-live-source-mail-tool";
const sourceId = "visual_source:helix-ask-live-source-mail-tool";

beforeEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
  resetStagePlayLiveSourceMailWakeStoreForTest();
  resetStagePlayLiveSourceNarrativeStoreForTest();
  resetStagePlayLiveSourceInterpreterProfileStoreForTest();
  resetStagePlayProcessedMailPacketStoreForTest();
  resetStagePlayVisualObserverProfileStoreForTest();
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

const seedVisualSummaryText = (summary: string, suffix: string) => {
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
    frame_id: `visual_frame:helix-ask-live-source-mail-tool:${suffix}`,
    ts: "2026-06-04T12:10:00.000Z",
  });
  analyzeVisualFrame({
    thread_id: threadId,
    frame_id: frame.frame_id,
    evidence_id: `visual_evidence:helix-ask-live-source-mail-tool:${suffix}`,
    summary,
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
        tool_id: "live_env.process_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.read_processed_live_source_mail",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_micro_reasoner_prompts",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.update_micro_reasoner_prompt",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.test_micro_reasoner_prompt",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.configure_visual_observer_profile",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.apply_visual_observer_profile",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_visual_observer_profiles",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.test_visual_observer_profile",
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
        tool_id: "live_env.configure_interpreter_profile",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.compare_mail_to_interpreter_profile",
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
      expect.objectContaining({
        tool_id: "live_env.predict_live_source_immediate",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.compare_live_source_prediction",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.project_live_source_narrative",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
    ]));
  });

  it("configures an interpreter profile without reading mail or answering", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        job_id: "stage_play_live_source_job:profile-test",
        policy_id: "stage_play_live_source_watch_job_policy:profile-test",
        domain: "minecraft",
        objective_text: "Watch Minecraft and compare observations against a survival coach profile.",
        interpretation_guidelines: "Treat visible hazards as observed facts and route likely intent as inference.",
        lenses: ["hazards", "resources", "navigation"],
        salience_criteria: ["hostile mob appears"],
        suppress_criteria: ["unchanged camera angle"],
        risk_criteria: ["lava", "hostile mob"],
        opportunity_criteria: ["visible ore"],
        voice_callout_criteria: ["immediate hazard"],
        text_answer_style: "brief_explanation",
        voice_style: "short_callout",
        ask_when_uncertain: true,
        create_linked_note: true,
        evidence_refs: ["stage_play_live_source_mail:profile-test"],
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.configure_interpreter_profile",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toContain("Configured interpreter profile");
    expect(observation.summary).toContain("no live-source mail was read");
    const payload = observation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_interpreter_profile_config_result",
      schema: "stage_play_interpreter_profile_config_result/v1",
      schemaVersion: "stage_play_interpreter_profile_config_result/v1",
      profile: {
        artifactId: "stage_play_live_source_interpreter_profile",
        schemaVersion: "stage_play_live_source_interpreter_profile/v1",
        title: "Minecraft Survival Coach",
        threadId,
        roomId,
        jobId: "stage_play_live_source_job:profile-test",
        policyId: "stage_play_live_source_watch_job_policy:profile-test",
        sourceKinds: ["visual_frame"],
        domain: "minecraft",
        objectiveText: "Watch Minecraft and compare observations against a survival coach profile.",
        interpretationGuidelines: "Treat visible hazards as observed facts and route likely intent as inference.",
        lenses: ["hazards", "resources", "navigation"],
        salienceCriteria: ["hostile mob appears"],
        suppressCriteria: ["unchanged camera angle"],
        riskCriteria: ["lava", "hostile mob"],
        opportunityCriteria: ["visible ore"],
        voiceCalloutCriteria: ["immediate hazard"],
        evidenceRules: {
          preserveRawObservation: true,
          distinguishObservedVsInferred: true,
          requireEvidenceRefs: true,
          askWhenUncertain: true,
        },
        outputStyle: {
          textAnswerStyle: "brief_explanation",
          voiceStyle: "short_callout",
        },
        status: "active",
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
        raw_content_included: false,
      },
      linkedNote: {
        noteId: expect.stringMatching(/^note:interpreter_profile:/),
        title: "Minecraft Survival Coach Guidelines",
      },
      transcriptRows: [
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Interpreter profile configured",
          terminalEligible: false,
          assistantAnswer: false,
        }),
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Objective",
          body: "Objective: Watch Minecraft and compare observations against a survival coach profile.",
        }),
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Guidelines",
          body: expect.stringContaining("Treat visible hazards as observed facts"),
        }),
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Scope",
          body: "Domain: minecraft; source kinds: visual_frame; status: active.",
        }),
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Criteria",
          body: expect.stringContaining("hostile mob appears"),
        }),
        expect.objectContaining({
          rowKind: "profile_note_link",
          title: "Linked note",
          body: expect.stringContaining("Minecraft Survival Coach Guidelines"),
        }),
      ],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });
    expect(payload.profile.profileId).toMatch(/^stage_play_live_source_interpreter_profile:/);
    expect(payload.interpreterProfileRef).toBe(payload.profile.profileId);
    expect(payload.profile.evidenceRefs).toEqual(expect.arrayContaining([
      sourceId,
      "stage_play_live_source_job:profile-test",
      "stage_play_live_source_watch_job_policy:profile-test",
      "stage_play_live_source_mail:profile-test",
      payload.linkedNote.noteId,
    ]));
    expect(payload.artifactId).not.toBe("stage_play_live_source_mail_read_result");
    expect(observation.transcriptRows?.map((row: any) => row.title)).toEqual([
      "Interpreter profile configured",
      "Objective",
      "Guidelines",
      "Scope",
      "Criteria",
      "Linked note",
    ]);
  });

  it("manages an existing interpreter profile without reading mail", () => {
    const configured = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        domain: "minecraft",
        objective_text: "Watch Minecraft like a survival coach.",
        interpretation_guidelines: "Call out danger, resources, and strategic route changes.",
        create_linked_note: true,
      },
    });
    const configuredPayload = configured.observation as any;
    const profileId = configuredPayload.profile.profileId;
    const noteId = configuredPayload.linkedNote.noteId;

    const paused = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        profile_action: "pause",
        profile_id: profileId,
      },
    });

    expect(paused).toMatchObject({
      tool_name: "live_env.configure_interpreter_profile",
      ok: true,
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(paused.summary).toContain("no live-source mail was read");
    expect(paused.observation as any).toMatchObject({
      schema: "stage_play_interpreter_profile_action_result/v1",
      profileAction: "pause",
      profile: {
        profileId,
        status: "paused",
      },
      transcriptRows: [
        expect.objectContaining({
          rowKind: "interpreter_profile",
          title: "Interpreter profile paused",
          terminalEligible: false,
          assistantAnswer: false,
        }),
      ],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });

    const opened = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        profile_action: "open_note",
        profile_id: profileId,
        note_id: noteId,
      },
    });

    expect(opened.summary).toContain("Opened interpreter profile note");
    expect(opened.observation as any).toMatchObject({
      schema: "stage_play_interpreter_profile_action_result/v1",
      profileAction: "open_note",
      note: {
        noteId,
      },
      transcriptRows: [
        expect.objectContaining({
          rowKind: "profile_note_link",
          title: "Profile note opened",
          terminalEligible: false,
          assistantAnswer: false,
        }),
      ],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });
    expect((opened.observation as any).artifactId).not.toBe("stage_play_live_source_mail_read_result");
  });

  it("compares selected mail to the active interpreter profile as evidence only", () => {
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
    const readPayload = readObservation.observation as any;
    const mailId = readPayload.items[0].mailId;
    const profileObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        job_id: "stage_play_live_source_job:compare-profile",
        policy_id: "stage_play_live_source_watch_job_policy:compare-profile",
        domain: "minecraft",
        objective_text: "Watch Minecraft like a survival coach.",
        interpretation_guidelines: "Separate observed visible hazards from inferred player strategy.",
        salience_criteria: ["player", "cat", "mountains"],
        suppress_criteria: ["unchanged menu"],
        risk_criteria: ["hostile mob", "lava"],
        opportunity_criteria: ["book stand", "mountains"],
        voice_callout_criteria: ["hostile mob"],
      },
    });
    const profilePayload = profileObservation.observation as any;

    const comparisonObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.compare_mail_to_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        profile_id: profilePayload.profile.profileId,
        mail_ids: [mailId],
        job_id: "stage_play_live_source_job:compare-profile",
        policy_id: "stage_play_live_source_watch_job_policy:compare-profile",
      },
    });

    expect(comparisonObservation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.compare_mail_to_interpreter_profile",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(comparisonObservation.summary).toContain("recommended record_interpretation");
    const comparison = comparisonObservation.observation as any;
    expect(comparison).toMatchObject({
      artifactId: "stage_play_live_source_interpreter_profile_comparison",
      schemaVersion: "stage_play_live_source_interpreter_profile_comparison/v1",
      profileId: profilePayload.profile.profileId,
      jobId: "stage_play_live_source_job:compare-profile",
      policyId: "stage_play_live_source_watch_job_policy:compare-profile",
      mailIds: [mailId],
      observedFacts: [
        expect.stringContaining("Minecraft-like scene with a player, cat, book stand, and distant mountains."),
      ],
      inferredMeaning: expect.arrayContaining([
        expect.stringContaining("Matched salience criteria"),
        expect.stringContaining("Opportunity criteria matched"),
      ]),
      matchedCriteria: expect.arrayContaining(["player", "cat", "mountains"]),
      opportunityMatches: expect.arrayContaining(["book stand", "mountains"]),
      recommendedDecision: "record_interpretation",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
      post_tool_model_step_required: true,
      ask_context_policy: "evidence_only",
    });
    expect(comparison.riskMatches).not.toEqual(expect.arrayContaining(["hostile mob", "lava"]));
    expect(comparison.evidenceRefs).toEqual(expect.arrayContaining([
      profilePayload.profile.profileId,
      mailId,
      "visual_evidence:helix-ask-live-source-mail-tool",
    ]));
    expect(comparison.transcriptRows).toEqual([
      expect.objectContaining({
        rowKind: "profile_comparison",
        title: "Interpreter profile comparison",
        terminalEligible: false,
        assistantAnswer: false,
      }),
      expect.objectContaining({
        rowKind: "agent_decision",
        title: "Recommended decision",
        body: "Recommended decision: record_interpretation.",
      }),
      expect.objectContaining({
        rowKind: "profile_comparison",
        title: "Criteria matches",
        body: expect.stringContaining("salience="),
      }),
    ]);
  });

  it.each([
    {
      name: "waits on routine daylight movement under a warning-only profile",
      summary: "The player is walking through a daylight forest with no visible threat.",
      suffix: "profile-voice-daylight",
      expectedDecision: "wait_for_next_summary",
      expectedSuppressed: ["routine movement"],
      expectedRiskAbsent: ["minecraft hazard hint", "hostile mob", "lava", "low health"],
      expectedVoiceAbsent: ["minecraft urgent hazard hint", "hostile mob", "lava", "low health"],
    },
    {
      name: "treats cave low light as risk context without auto-speaking",
      summary: "The player approaches a cave entrance with low light and no visible torch cues.",
      suffix: "profile-voice-cave-low-light",
      expectedDecision: "record_interpretation",
      expectedRisk: ["low light", "cave exploration", "minecraft hazard hint"],
      expectedVoiceAbsent: ["minecraft urgent hazard hint", "hostile mob", "lava", "low health"],
    },
    {
      name: "requests a voice callout when hostile mob criteria match",
      summary: "A creeper is near the player at the edge of the cave.",
      suffix: "profile-voice-creeper",
      expectedDecision: "request_voice_callout",
      expectedRisk: ["minecraft hazard hint"],
      expectedVoice: ["minecraft urgent hazard hint", "hostile mob"],
    },
  ])("profile voice behavior: $name", ({
    summary,
    suffix,
    expectedDecision,
    expectedSuppressed,
    expectedRisk,
    expectedRiskAbsent,
    expectedVoice,
    expectedVoiceAbsent,
  }) => {
    seedVisualSummaryText(summary, suffix);
    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });
    const readPayload = readObservation.observation as any;
    const mailId = readPayload.items[0].mailId;
    const profileObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.configure_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        job_id: `stage_play_live_source_job:${suffix}`,
        policy_id: `stage_play_live_source_watch_job_policy:${suffix}`,
        domain: "minecraft",
        objective_text: "Watch Minecraft like a warning-only survival coach.",
        interpretation_guidelines: "Call out only urgent hazards; otherwise preserve observed risk context for interpretation.",
        salience_criteria: ["cave exploration", "low light", "hostile mob"],
        suppress_criteria: ["routine movement"],
        risk_criteria: ["low light", "cave exploration", "lava", "hostile mob", "low health"],
        opportunity_criteria: ["rare resource"],
        voice_callout_criteria: ["hostile mob", "lava", "low health", "nightfall without shelter"],
        voice_style: "warning_only",
      },
    });
    const profilePayload = profileObservation.observation as any;

    const comparisonObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.compare_mail_to_interpreter_profile",
      thread_id: threadId,
      args: {
        room_id: roomId,
        profile_id: profilePayload.profile.profileId,
        mail_ids: [mailId],
        job_id: `stage_play_live_source_job:${suffix}`,
        policy_id: `stage_play_live_source_watch_job_policy:${suffix}`,
      },
    });
    const comparison = comparisonObservation.observation as any;

    expect(comparison).toMatchObject({
      recommendedDecision: expectedDecision,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
    if (expectedSuppressed) {
      expect(comparison.suppressedCriteria).toEqual(expect.arrayContaining(expectedSuppressed));
    }
    if (expectedRisk) {
      expect(comparison.riskMatches).toEqual(expect.arrayContaining(expectedRisk));
    }
    if (expectedRiskAbsent) {
      for (const value of expectedRiskAbsent) {
        expect(comparison.riskMatches).not.toContain(value);
      }
    }
    if (expectedVoice) {
      expect(comparison.voiceCalloutMatches).toEqual(expect.arrayContaining(expectedVoice));
    }
    if (expectedVoiceAbsent) {
      for (const value of expectedVoiceAbsent) {
        expect(comparison.voiceCalloutMatches).not.toContain(value);
      }
    }
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

  it("processes and reads processed live-source mail packets as evidence-only receipts", () => {
    seedVisualSummaryText("Minecraft cave scene with low light and the player near fire damage.", "processed");

    const processObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.process_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const processPayload = processObservation.observation as any;
    expect(processPayload.schema).toBe("stage_play_processed_live_source_mail_read_result/v1");
    expect(processPayload.processedPacketRefs).toHaveLength(1);
    expect(processPayload.packets[0]).toMatchObject({
      artifactId: "stage_play_processed_mail_packet",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
    });
    expect(processPayload.packets[0].salience.voiceCandidate).toBe(true);
    expect(processPayload.microReasonerRunRefs.length).toBeGreaterThanOrEqual(8);
    expect(processPayload.microReasonerRuns.map((run: any) => run.role)).toEqual(expect.arrayContaining([
      "decision_selector",
      "voice_callout_drafter",
    ]));
    expect(processPayload.microReasonerRuns.find((run: any) => run.role === "decision_selector")).toMatchObject({
      selectedDecision: "request_voice_callout",
      recommendedNextTool: "live_env.record_live_source_mail_decision",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "micro_reasoner_evidence",
    });
    expect(processPayload.transcriptRows.map((row: any) => row.rowKind)).toContain("micro_reasoner_run");
    expect(processPayload.microReasonerRuns.every((run: any) => run.promptId)).toBe(true);

    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_processed_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        route_metadata: {
          wakeRequestId: "stage_play_mail_wake:test-read",
          askTurnId: "ask:test-read",
        },
      },
    });

    const readPayload = readObservation.observation as any;
    expect(readObservation.summary).toContain("processed live-source packet");
    expect(readObservation.producedRefs).toContain(processPayload.packets[0].packetId);
    expect(readObservation.artifactRefs).toMatchObject({
      processedPacketIds: expect.arrayContaining([processPayload.packets[0].packetId]),
      wakeRequestId: "stage_play_mail_wake:test-read",
      askTurnId: "ask:test-read",
    });
    expect(readPayload.packets.map((packet: any) => packet.packetId)).toContain(processPayload.packets[0].packetId);
    expect(readPayload.missingRawMailIds).toEqual([]);
    expect(readPayload.fallbackTool).toBeNull();
    expect(readPayload.assistant_answer).toBe(false);
    expect(readPayload.terminal_eligible).toBe(false);
  });

  it("configures visual observer profiles and maps structured Minecraft observer output into processed packets", () => {
    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_visual_observer_profiles",
      thread_id: threadId,
      args: {},
    });
    const queryPayload = queryObservation.observation as any;
    const minecraftProfile = queryPayload.profiles.find((profile: any) => profile.title === "Minecraft Gameplay Observer");
    expect(minecraftProfile).toBeTruthy();
    expect(queryPayload.assistant_answer).toBe(false);
    expect(queryPayload.terminal_eligible).toBe(false);

    const applyObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.apply_visual_observer_profile",
      thread_id: threadId,
      args: {
        profile_id: minecraftProfile.profileId,
        source_ids: [sourceId],
      },
    });
    const applyPayload = applyObservation.observation as any;
    expect(applyPayload.applied).toBe(true);
    expect(applyPayload.profile.sourceIds).toContain(sourceId);

    const structuredSummary = JSON.stringify({
      scene: "underground Minecraft cave",
      hud: "fire overlay visible; health uncertain",
      hotbar: "pickaxe and sword visible",
      selected_item: "pickaxe",
      visible_entities: [],
      current_action: "moving through a dark cave",
      changed_since_last_frame: ["fire or damage cue appeared"],
      risk_cues: ["fire", "low light"],
      opportunity_cues: ["ore may be nearby"],
      next_10s_prediction: "watch for recovery from fire or nearby hostile mobs",
      confidence: 0.82,
    });
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
      frame_id: "visual_frame:helix-ask-live-source-mail-tool:minecraft-observer-json",
      ts: "2026-06-04T12:10:00.000Z",
    });
    analyzeVisualFrame({
      thread_id: threadId,
      frame_id: frame.frame_id,
      evidence_id: "visual_evidence:helix-ask-live-source-mail-tool:minecraft-observer-json",
      summary: structuredSummary,
      visual_observer_profile_id: minecraftProfile.profileId,
      visual_observer_profile_title: minecraftProfile.title,
      visual_prompt_hash: minecraftProfile.promptHash,
      visual_output_mode: minecraftProfile.outputMode,
      visual_observer_structured_output: structuredSummary,
      supports_claims: [
        {
          claim: "The Minecraft observer profile produced compact structured visual evidence.",
          support_status: "supports",
          confidence: 0.82,
        },
      ],
    });
    const stampedMail = listStagePlayLiveSourceMailItems({ threadId, sourceId }).at(-1);
    expect(stampedMail?.sourceRefs).toMatchObject({
      frameRef: frame.frame_id,
      evidenceRef: "visual_evidence:helix-ask-live-source-mail-tool:minecraft-observer-json",
    });
    expect(stampedMail?.evidenceRefs).toEqual(expect.arrayContaining([
      minecraftProfile.profileId,
      `visual_prompt_hash:${minecraftProfile.promptHash}`,
    ]));

    const testObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.test_visual_observer_profile",
      thread_id: threadId,
      args: {
        profile_id: minecraftProfile.profileId,
        source_id: sourceId,
        summary: structuredSummary,
      },
    });
    const testPayload = testObservation.observation as any;
    expect(testPayload.parseOk).toBe(true);
    expect(testPayload.enqueuedAsMail).toBe(false);
    expect(testPayload.parsedProfileOutput.scene).toBe("underground Minecraft cave");

    const processObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.process_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });
    const packet = (processObservation.observation as any).packets[0];
    expect(packet.observedFacts).toEqual(expect.arrayContaining([
      expect.stringContaining("scene: underground Minecraft cave"),
      expect.stringContaining("selected_item: pickaxe"),
    ]));
    expect(packet.changedFacts).toEqual(expect.arrayContaining([expect.stringContaining("fire or damage cue appeared")]));
    expect(packet.riskMatches).toEqual(expect.arrayContaining(["fire", "low light"]));
    expect(packet.opportunityMatches).toEqual(expect.arrayContaining(["ore may be nearby"]));
    expect(packet.watchNext).toEqual(expect.arrayContaining(["watch for recovery from fire or nearby hostile mobs"]));
    expect(packet.mailIds).toContain(stampedMail?.mailId);
    expect(packet.visualEvidenceRefs).toEqual(expect.arrayContaining([
      "visual_evidence:helix-ask-live-source-mail-tool:minecraft-observer-json",
    ]));
    expect(packet.evidenceRefs).toEqual(expect.arrayContaining([
      minecraftProfile.profileId,
      `visual_prompt_hash:${minecraftProfile.promptHash}`,
    ]));
    expect(packet.recommendedNext).toBe("request_voice_callout");
    expect(packet.effortEstimate).toMatchObject({
      currentEffort: "combat_or_recovery",
      nextLikelyEfforts: expect.arrayContaining(["recover_or_retreat"]),
    });
    expect(packet.axioms.axioms).toEqual(expect.arrayContaining([
      "current effort: combat_or_recovery",
      "location: cave or underground exploration context",
      "hazard: immediate risk cue present",
    ]));
    expect(packet.hypotheses.map((hypothesis: any) => hypothesis.label)).toEqual(expect.arrayContaining([
      "recover_or_create_distance",
      "continue_engagement",
    ]));
    expect(packet.arbiter).toMatchObject({
      recommendedNext: "request_voice_callout",
      wakeAsk: true,
      voiceCandidate: true,
      confidence: "high",
    });
    expect(packet.microReasonerRunRefs.length).toBeGreaterThanOrEqual(11);
    const processedRuns = (processObservation.observation as any).microReasonerRuns ?? [];
    expect(processedRuns.map((run: any) => run.role)).toEqual(expect.arrayContaining([
      "effort_estimator",
      "axiom_extractor",
      "hypothesis_generator",
      "hypothesis_arbiter",
    ]));
    expect(packet.assistant_answer).toBe(false);
    expect(packet.terminal_eligible).toBe(false);
  });

  it("records a processed-mail interpretation with recovered mail ids and narrative aliases", () => {
    seedVisualSummaryText("Minecraft cave scene with low light and the player near fire damage.", "processed-default-interpretation");

    const processObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.process_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });
    const packet = (processObservation.observation as any).packets[0];

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        decision: "record_interpretation",
        rationale_preview: "Interpret the latest processed Minecraft packet and say what to watch next.",
        route_metadata: {
          wakeRequestId: "stage_play_mail_wake:test-decision",
          askTurnId: "ask:test-decision",
        },
        live_source_mail_output_intent: {
          wants_interpretation: true,
        },
      },
    });

    const payload = decisionObservation.observation as any;
    expect(decisionObservation).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(payload).toMatchObject({
      decision: "record_interpretation",
      mailIds: expect.arrayContaining(packet.mailIds),
      narrativeStateRef: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      narrativeStateId: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      narrative_state_ref: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      narrative_state_id: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      narrativeState: {
        narrativeStateId: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
        mailBatchRefs: expect.arrayContaining(packet.mailIds),
        interpretedSituation: {
          userRelevantMeaning: expect.any(String),
        },
        watchNext: {
          targets: expect.any(Array),
          reason: expect.any(String),
        },
      },
      processedPacketRefs: expect.arrayContaining([packet.packetId]),
      processed_packet_refs: expect.arrayContaining([packet.packetId]),
      post_tool_model_step_required: true,
      terminal_eligible: false,
    });
    expect(decisionObservation.producedRefs).toContain(payload.decisionId);
    expect(decisionObservation.artifactRefs).toMatchObject({
      processedPacketIds: expect.arrayContaining([packet.packetId]),
      decisionIds: expect.arrayContaining([payload.decisionId]),
      wakeRequestId: "stage_play_mail_wake:test-decision",
      askTurnId: "ask:test-decision",
    });
    expect(payload.narrativeStateId).toBe(payload.narrativeStateRef);
    expect(payload.narrative_state_id).toBe(payload.narrativeStateRef);
    expect(payload.narrativeState.currentSceneSummary).toContain("Minecraft");
    expect(payload.transcriptRows.map((row: any) => row.rowKind)).toEqual(expect.arrayContaining([
      "interpretation",
      "watch_next",
      "narrative_state",
    ]));
  });

  it("reads the same-source unread batch through live_env.read_live_source_mail even when model args supply a small limit", () => {
    seedVisualSummaries(6);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        limit: 3,
      },
    });

    const payload = observation.observation as any;
    expect(observation.summary).toBe("Read 6 unread live-source mail item(s); decision required.");
    expect(payload.items).toHaveLength(6);
    expect(payload.readWindow).toMatchObject({
      sourceId,
      sourceKind: "visual_frame",
      requestedLimit: 3,
      effectiveLimit: 12,
      sameSourceBatch: true,
      unreadBeforeRead: 6,
      remainingUnreadCount: 0,
      retainedUnreadMailIds: [],
    });
    expect(payload.items.map((item: any) => item.summary.text)).toEqual([
      expect.stringContaining("Live frame 1"),
      expect.stringContaining("Live frame 2"),
      expect.stringContaining("Live frame 3"),
      expect.stringContaining("Live frame 4"),
      expect.stringContaining("Live frame 5"),
      expect.stringContaining("Live frame 6"),
    ]);
  });

  it("reports retained same-source unread backlog when read_live_source_mail reaches the batch cap", () => {
    seedVisualSummaries(14);

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
    expect(observation.summary).toBe("Read 12 unread live-source mail item(s); 2 same-source unread item(s) remain queued; decision required.");
    expect(payload.items).toHaveLength(12);
    expect(payload.readWindow).toMatchObject({
      sourceId,
      sourceKind: "visual_frame",
      requestedLimit: 12,
      effectiveLimit: 12,
      sameSourceBatch: true,
      unreadBeforeRead: 14,
      remainingUnreadCount: 2,
    });
    expect(payload.readWindow.retainedUnreadMailIds).toHaveLength(2);
    expect(payload.items.at(0).summary.text).toContain("Live frame 1");
    expect(payload.items.at(-1).summary.text).toContain("Live frame 12");
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
      expectedMailProcessingMode: "latest_only",
      expectedOutputCadence: "every_batch",
    },
    {
      objective: "Watch the active visual source and interpret what is happening across the summaries.",
      expectedMode: "prediction_watch",
      expectedMailProcessingMode: "chronological_batch",
      expectedOutputCadence: "only_salient",
    },
    {
      objective: "Watch the active visual source and do not bother me unless something important changes.",
      expectedMode: "salience_watch",
      expectedMailProcessingMode: "salience_window",
      expectedOutputCadence: "only_salient",
    },
    {
      objective: "Watch the active visual source, interpret the summaries, and predict what might happen next.",
      expectedMode: "prediction_watch",
      expectedMailProcessingMode: "chronological_batch",
      expectedOutputCadence: "only_salient",
    },
    {
      objective: "Watch the active visual source and announce if anything important happens.",
      expectedMode: "salience_watch",
      expectedMailProcessingMode: "salience_window",
      expectedOutputCadence: "voice_only_salient",
    },
    {
      objective: "Commentate while I play from the active visual source.",
      expectedMode: "voice_commentary_watch",
      expectedMailProcessingMode: "micro_batch",
      expectedOutputCadence: "voice_only_salient",
    },
  ])("classifies watch-job policy modes: $expectedMode", ({
    objective,
    expectedMode,
    expectedMailProcessingMode,
    expectedOutputCadence,
  }) => {
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
        mailProcessingMode: expectedMailProcessingMode,
        outputCadence: expectedOutputCadence,
      },
    });
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining(expectedMode),
      }),
    ]));
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining(expectedMailProcessingMode),
      }),
    ]));
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "loop_state",
        title: "Policy",
        body: expect.stringContaining(expectedOutputCadence),
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

  it("records profile comparison refs on live-source mail decisions", () => {
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
    const profileRef = "stage_play_live_source_interpreter_profile:decision-profile";
    const comparisonRef = "stage_play_live_source_interpreter_profile_comparison:decision-profile";

    const decisionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_live_source_mail_decision",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        decision: "draft_text_answer",
        rationale_preview: "The profile comparison matched a visible scene update.",
        text_answer_draft: "The active visual source shows a Minecraft-like player scene.",
        interpreter_profile_ref: profileRef,
        profile_comparison_refs: [comparisonRef],
        matched_criteria: ["player scene"],
        suppressed_criteria: ["routine walking"],
        observed_facts: ["Mail summary shows a player and cat."],
        inferred_meaning: ["The survival-coach profile should keep watching for hazards."],
        evidence_refs: [comparisonRef],
      },
    });

    const payload = decisionObservation.observation as any;
    expect(payload).toMatchObject({
      artifactId: "stage_play_live_source_mail_decision",
      decision: "draft_text_answer",
      interpreterProfileRef: profileRef,
      profileComparisonRefs: [comparisonRef],
      matchedCriteria: ["player scene"],
      suppressedCriteria: ["routine walking"],
      observedFacts: ["Mail summary shows a player and cat."],
      inferredMeaning: ["The survival-coach profile should keep watching for hazards."],
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(payload.evidenceRefs).toEqual(expect.arrayContaining([
      profileRef,
      comparisonRef,
      mailId,
    ]));
    expect(payload.transcriptRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        rowKind: "profile_comparison",
        title: "Interpreter profile context",
        body: expect.stringContaining(`Profile: ${profileRef}.`),
      }),
      expect.objectContaining({
        rowKind: "profile_comparison",
        title: "Interpreter profile context",
        body: expect.stringContaining(`Comparisons: ${comparisonRef}.`),
      }),
      expect.objectContaining({
        rowKind: "agent_decision",
        title: "Agent decision",
      }),
    ]));
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

  it("predicts the immediate next live-source mail as evidence only", () => {
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

    const predictionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.predict_live_source_immediate",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
      },
    });

    expect(predictionObservation).toMatchObject({
      tool_name: "live_env.predict_live_source_immediate",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(predictionObservation.observation).toMatchObject({
      schema: "helix.live_source_immediate_prediction.v1",
      predictionHorizon: "next_mail",
      expectedChanges: expect.any(Array),
      watchTargets: expect.arrayContaining(["player"]),
      validationSignals: expect.any(Array),
      salienceHint: expect.stringMatching(/low|medium|high|urgent/),
      evidenceRefs: expect.arrayContaining([mailId]),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("compares latest mail against prior narrative prediction as evidence only", () => {
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
        rationale_preview: "Record prediction for the next mail.",
        interpretation: {
          currentSceneSummary: "A player is near a cat, book stand, and distant mountains.",
          userRelevantMeaning: "The scene is stable around a player base.",
          watchNextTargets: ["player", "cat"],
          watchNextReason: "Watch whether the player or cat moves.",
          predictionText: "The next summary will likely still show the player and cat near the base.",
          predictionHorizon: "next_mail",
          predictionConfidence: 0.62,
          validationSignals: ["player remains visible", "cat remains visible"],
        },
      },
    });
    const narrativeStateId = (decisionObservation.observation as any).narrativeStateRef;

    const comparisonObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.compare_live_source_prediction",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        narrative_state_id: narrativeStateId,
      },
    });

    expect(comparisonObservation).toMatchObject({
      tool_name: "live_env.compare_live_source_prediction",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(comparisonObservation.observation).toMatchObject({
      schema: "helix.live_source_prediction_comparison.v1",
      result: expect.stringMatching(/supported|contradicted|unresolved|no_prior_prediction/),
      meaningfulDifferences: expect.any(Array),
      salienceHint: expect.stringMatching(/low|medium|high|urgent/),
      wakeRecommendation: expect.stringMatching(/wait|record_interpretation|draft_text_answer|request_voice_callout|request_checkpoint/),
      evidenceRefs: expect.arrayContaining([mailId, narrativeStateId]),
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("projects live-source narrative through the existing narrative state store", () => {
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

    const projectionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.project_live_source_narrative",
      thread_id: threadId,
      args: {
        room_id: roomId,
        mail_ids: [mailId],
        user_relevant_meaning: "The player base scene should be watched for movement or hostile mobs.",
        watch_next_targets: ["player movement", "hostile mobs"],
        watch_next_reason: "Movement or hostile mobs would change the operator response.",
        prediction_text: "The next mail should confirm whether the player remains near the base.",
        prediction_confidence: 0.57,
      },
    });

    expect(projectionObservation).toMatchObject({
      tool_name: "live_env.project_live_source_narrative",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    });
    expect(projectionObservation.observation).toMatchObject({
      schema: "helix.live_source_narrative_projection.v1",
      narrativeStateId: expect.stringMatching(/^stage_play_live_source_narrative_state:/),
      runningStorySummary: expect.any(String),
      userRelevantMeaning: "The player base scene should be watched for movement or hostile mobs.",
      watchNext: {
        targets: ["player movement", "hostile mobs"],
        reason: "Movement or hostile mobs would change the operator response.",
      },
      prediction: {
        text: "The next mail should confirm whether the player remains near the base.",
        horizon: "next_mail",
        confidence: 0.57,
      },
      evidenceRefs: expect.arrayContaining([mailId]),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
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
