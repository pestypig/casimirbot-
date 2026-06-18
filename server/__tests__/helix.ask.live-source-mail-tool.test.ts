import { beforeEach, describe, expect, it } from "vitest";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
  updateLiveAnswerEnvironment,
} from "../services/situation-room/live-answer-environment-store";
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
import { enqueueAudioTranscriptMailFromChunk } from "../services/stage-play/stage-play-audio-transcript-mail-ingest";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";
import { resetStagePlayLiveSourceNarrativeStoreForTest } from "../services/stage-play/stage-play-live-source-narrative-store";
import { resetStagePlayLiveSourceInterpreterProfileStoreForTest } from "../services/stage-play/stage-play-live-source-interpreter-profile-store";
import { resetStagePlayProcessedMailPacketStoreForTest } from "../services/stage-play/stage-play-processed-mail-packet-store";
import { resetStagePlayVisualObserverProfileStoreForTest } from "../services/stage-play/stage-play-visual-observer-profile-store";
import {
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
  resetStagePlayGoalContextStoreForTest,
} from "../services/stage-play/stage-play-goal-context-store";
import {
  clearWorkstationReasoningTracesForTest,
  recordWorkstationReasoningTrace,
} from "../services/helix-ask/workstation-reasoning-trace-store";

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
  resetStagePlayGoalContextStoreForTest();
  clearWorkstationReasoningTracesForTest();
  resetVisualSnapshotStoreForTest();
  resetLiveAnswerEnvironments();
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
        tool_id: "live_env.reflect_live_source_mail_loop",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_workstation_goal_context",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.start_agent_goal_session",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_trace_memory",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_visual_summaries",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_audio_transcripts",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_translation_segments",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_microdeck_outputs",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_live_answer_state",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.change_workstation_preset",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.bind_workstation_source",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.unbind_workstation_source",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.set_workstation_loop_state",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.update_live_answer_projection",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.focus_process_graph",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.narrator_say",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.narrator_bind_stream",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: true,
        can_run_automatically: false,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_micro_reasoner_prompts",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.query_micro_reasoner_presets",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.draft_micro_reasoner_preset",
        family: "live_env",
        creates_assistant_answer: false,
        requires_user_confirmation: false,
        can_run_automatically: true,
      }),
      expect.objectContaining({
        tool_id: "live_env.route_micro_reasoner_prompt",
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

  it("queries MicroDeck presets as evidence-only preset query observations", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_micro_reasoner_presets",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        include_presets: true,
        limit: 10,
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.query_micro_reasoner_presets",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.summary).toMatch(/Found \d+ MicroDeck preset\(s\) and \d+ prompt\(s\)\./);
    expect(observation.observation).toMatchObject({
      schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
      sourceId,
      source_id: sourceId,
      sourceIds: [sourceId],
      source_ids: [sourceId],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect((observation.observation as any).presets.length).toBeGreaterThan(0);
    expect((observation.observation as any).prompts.length).toBeGreaterThan(0);
    expect(observation.evidence_refs).toEqual(
      expect.arrayContaining([sourceId]),
    );
  });

  it("drafts a MicroDeck setup from a scenario without creating or applying the preset", () => {
    const before = executeLiveEnvironmentTool({
      tool_name: "live_env.query_micro_reasoner_presets",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        include_presets: true,
        limit: 100,
      },
    });
    const beforeCustomCount = (before.observation as any).presets
      .filter((preset: any) => String(preset.presetId).includes(":custom:"))
      .length;

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.draft_micro_reasoner_preset",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        scenario_text: "Use the visual source to choose whether to prepare a tool call, append a wake-bound Ask contract, or ask the operator for confirmation.",
        candidate_prompts: [
          "Prepare the next tool call if the visual summary has enough evidence.",
          "Append a concise wake-bound context contract for Helix Ask.",
          "Ask the operator one confirmation question when the evidence is ambiguous.",
        ],
        wake_contract_prompt: "Only append this contract when the MicroDeck result is wake-bound for Ask handoff.",
        wake_contract_title: "Operator Wake Contract",
      },
    });

    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.draft_micro_reasoner_preset",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(observation.observation).toMatchObject({
      artifactId: "stage_play_micro_reasoner_prompt_preset_draft",
      schema: "stage_play_micro_reasoner_prompt_preset_draft/v1",
      schemaVersion: "stage_play_micro_reasoner_prompt_preset_draft/v1",
      confirmationRequired: true,
      createToolCall: {
        toolName: "live_env.create_micro_reasoner_preset",
        args: {
          source_ids: [sourceId],
          candidate_prompts: expect.any(Array),
          wake_prompt_contract: {
            title: "Operator Wake Contract",
            attachOnlyWhenWakeBound: true,
          },
        },
      },
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "micro_reasoner_evidence",
      ask_context_policy: "evidence_only",
    });
    expect((observation.observation as any).draft.candidatePrompts).toHaveLength(3);
    expect(observation.producedRefs).toEqual([(observation.observation as any).draftId]);

    const after = executeLiveEnvironmentTool({
      tool_name: "live_env.query_micro_reasoner_presets",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        include_presets: true,
        limit: 100,
      },
    });
    const afterCustomCount = (after.observation as any).presets
      .filter((preset: any) => String(preset.presetId).includes(":custom:"))
      .length;
    expect(afterCustomCount).toBe(beforeCustomCount);
  });

  it("creates and routes a MicroDeck prompt delegation preset from up to three prompts", () => {
    const create = executeLiveEnvironmentTool({
      tool_name: "live_env.create_micro_reasoner_preset",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        title: "Visual Prompt Router",
        candidate_prompts: [
          {
            candidateId: "candidate_a",
            title: "Calculator follow-up",
            promptText: "Explain the calculator result and identify any missing variables.",
          },
          {
            candidateId: "candidate_b",
            title: "Minecraft hazard review",
            promptText: "Review the Minecraft visual capture for lava, mobs, low health, and urgent survival hazards.",
          },
          {
            candidateId: "candidate_c",
            title: "Document summary",
            promptText: "Summarize the visible document section and cite its headings.",
          },
        ],
        confidence_threshold: 0.12,
        escalation_mode: "handoff_only_if_confident",
      },
    });

    expect(create).toMatchObject({
      tool_name: "live_env.create_micro_reasoner_preset",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    const preset = (create.observation as any).preset;
    expect(preset).toMatchObject({
      deckRunPlan: "prompt_delegation_router",
      outputPolicy: "ask_prompt_delegation",
      promptedRoles: ["prompt_router"],
      delegationRouter: {
        confidenceThreshold: 0.12,
        escalationMode: "handoff_only_if_confident",
        allowNone: true,
      },
    });
    expect(preset.delegationRouter.candidates).toHaveLength(3);

    const route = executeLiveEnvironmentTool({
      tool_name: "live_env.route_micro_reasoner_prompt",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        preset_id: preset.presetId,
        source_summary: "The Minecraft scene shows lava beside the player, low health, and a hostile mob nearby.",
      },
    });

    expect(route).toMatchObject({
      tool_name: "live_env.route_micro_reasoner_prompt",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(route.observation).toMatchObject({
      schema: "stage_play_micro_reasoner_prompt_delegation_result/v1",
      schemaVersion: "stage_play_micro_reasoner_prompt_delegation_result/v1",
      selectedCandidateId: "candidate_b",
      shouldHandoffToHelixAsk: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "micro_reasoner_evidence",
      ask_context_policy: "evidence_only",
      helixAskHandoff: {
        selectedCandidateId: "candidate_b",
        prompt: "Review the Minecraft visual capture for lava, mobs, low health, and urgent survival hazards.",
      },
    });
  });

  it("routes wake-bound contract appender presets only into Ask handoff receipts", () => {
    const route = executeLiveEnvironmentTool({
      tool_name: "live_env.route_micro_reasoner_prompt",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        preset_id: "stage_play_micro_reasoner_prompt_preset:wake-bound-contract-appender:v1",
        source_summary: "The live source has a completed result that should wake Ask under the operator contract.",
      },
    });

    expect(route).toMatchObject({
      tool_name: "live_env.route_micro_reasoner_prompt",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(route.observation).toMatchObject({
      schema: "stage_play_micro_reasoner_prompt_delegation_result/v1",
      presetId: "stage_play_micro_reasoner_prompt_preset:wake-bound-contract-appender:v1",
      selectedCandidateId: "wake_contract_a",
      shouldHandoffToHelixAsk: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "micro_reasoner_evidence",
      ask_context_policy: "evidence_only",
      helixAskHandoff: {
        selectedCandidateId: "wake_contract_a",
        wakePromptContract: {
          title: "Wake-Bound Operator Contract",
          attachOnlyWhenWakeBound: true,
        },
      },
    });
    expect((route.observation as any).helixAskHandoff.appendedPrompt).toContain("Wake-bound contract:");
    expect((route.observation as any).helixAskHandoff.appendedPrompt).toContain("If the packet is stale, superseded, or no longer wake-bound, ignore this contract.");
  });

  it("rejects MicroDeck prompt delegation presets with more than three prompts", () => {
    const create = executeLiveEnvironmentTool({
      tool_name: "live_env.create_micro_reasoner_preset",
      thread_id: threadId,
      args: {
        source_id: sourceId,
        candidate_prompts: [
          "Prompt one",
          "Prompt two",
          "Prompt three",
          "Prompt four",
        ],
      },
    });

    expect(create).toMatchObject({
      tool_name: "live_env.create_micro_reasoner_preset",
      ok: false,
      summary: "Custom MicroDeck prompt-router presets accept at most three candidate prompts.",
      observation: {
        schema: "stage_play_micro_reasoner_prompt_preset_create_response/v1",
        created: false,
        reason: "too_many_candidate_prompts",
        candidateCount: 4,
        maxCandidatePrompts: 3,
        assistant_answer: false,
        terminal_eligible: false,
      },
    });
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
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:route_watch:/),
    });
    expect(payload.artifactId).not.toBe("stage_play_live_source_mail_read_result");
    expect(payload.mailboxThreadId).toBe(threadId);
    expect(observation.producedRefs).toEqual(expect.arrayContaining([
      payload.policy.policyId,
      payload.jobState.jobId,
      payload.goalContextUpdateId,
    ]));
    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
    });
    expect(updates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        updateId: payload.goalContextUpdateId,
        contentRef: payload.policy.policyId,
        producerKind: "route_watch",
        updateKind: "source_status",
        sourceRefs: expect.arrayContaining([sourceId]),
        loopRefs: expect.arrayContaining([
          payload.jobState.jobId,
          payload.policy.policyId,
        ]),
        evidenceRefs: expect.arrayContaining([
          payload.policy.policyId,
          payload.jobState.jobId,
        ]),
        freshness: expect.objectContaining({
          status: "fresh",
          staleAfterMs: 120_000,
        }),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]));
    const routeWatchUpdate = updates.find((update) => update.updateId === payload.goalContextUpdateId);
    expect(routeWatchUpdate?.suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: payload.policy.policyId }),
      expect.objectContaining({ kind: "update_panel", panelId: "stage-play-badge-graph" }),
      expect.objectContaining({ kind: "set_loop_state", loopRef: payload.jobState.jobId, state: "running" }),
    ]));
    expect(routeWatchUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("wake_agent");
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
    expect(processPayload.packets[0].evidenceHandles).toMatchObject({
      sourceReceipts: expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          sourceKind: "visual_frame",
        }),
      ]),
      frameReceipts: expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          sourceKind: "visual_frame",
          parentMailId: expect.any(String),
        }),
      ]),
      frameIntervals: expect.arrayContaining([
        expect.objectContaining({
          sourceId,
          keyFrameIds: expect.any(Array),
          reasonCaptured: expect.any(String),
        }),
      ]),
      lensProducts: [],
      situationSlices: expect.any(Array),
    });
    expect(processPayload.packets[0].actionPredictions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actorId: sourceId,
        basis: expect.arrayContaining(["goal_object"]),
        frameIntervalRefs: expect.any(Array),
        sourceSliceRefs: expect.any(Array),
        recommendedNext: "request_voice_callout",
      }),
    ]));
    expect(processPayload.packets[0].unresolvedLeads).toEqual(expect.arrayContaining([
      expect.objectContaining({
        neededSources: expect.arrayContaining([sourceId]),
        suggestedFrameIntervals: expect.arrayContaining([
          expect.objectContaining({
            lensPresets: expect.arrayContaining(["raw_thumbnail", "motion_delta", "object_track", "occlusion_map"]),
          }),
        ]),
      }),
    ]));
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

  it("starts an agent goal session through live_env.start_agent_goal_session as non-terminal tool evidence", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:frog-classification",
        objective: "Monitor the image source and prepare frog classification evidence.",
        construct_refs: ["live_answer_environment:frog"],
        context_feeds: [
          { source_kind: "visual", freshness_ms: 15_000, relevance_policy: "frog classification" },
          { source_kind: "translation", query: "species hints" },
          { source_kind: "trace_memory" },
        ],
        allowed_actuators: [
          "query_visual_summaries",
          "query_translation_segments",
          "query_source_health",
          "set_visual_preset",
          "bind_source",
          "bind_narrator",
          "narrator_bind_stream",
          "query_trace_memory",
          "set_loop_state",
          "focus_process_graph",
        ],
        cadence: { kind: "event_accumulation", min_updates: 3 },
        stop_conditions: ["frog classified with terminal authority"],
        checkpoint_summary: "Goal session initialized from ImageLens frog classification prompt.",
        actions_taken: ["bind_visual_source"],
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.start_agent_goal_session",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "stage_play_agent_goal_session_tool_result/v1",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      session: {
        goalId: "goal:frog-classification",
        objective: "Monitor the image source and prepare frog classification evidence.",
        sourceRefs: expect.arrayContaining([sourceId]),
        constructRefs: ["live_answer_environment:frog"],
        contextFeeds: expect.arrayContaining([
          expect.objectContaining({
            sourceKind: "visual_summaries",
            freshnessMs: 15000,
            relevancePolicy: "frog classification",
          }),
          expect.objectContaining({
            sourceKind: "translated_transcripts",
            query: "species hints",
          }),
          expect.objectContaining({ sourceKind: "trace_memory" }),
        ]),
        allowedActuators: expect.arrayContaining([
          "query_visual_summaries",
          "query_translation_segments",
          "query_source_health",
          "set_visual_preset",
          "bind_source",
          "bind_narrator",
          "narrator_bind_stream",
          "query_trace_memory",
          "set_loop_state",
          "focus_process_graph",
        ]),
        cadence: { kind: "event_accumulation", minUpdates: 3 },
        stopConditions: expect.arrayContaining(["frog classified with terminal authority"]),
        checkpoints: expect.arrayContaining([
          expect.objectContaining({
            summary: "Goal session initialized from ImageLens frog classification prompt.",
            actionsTaken: expect.arrayContaining(["bind_visual_source", "start_agent_goal_session"]),
            nextStep: "continue",
          }),
        ]),
        authority: {
          assistantAnswer: false,
          finalReportsRequireTerminalAuthority: true,
        },
      },
    });
    expect(observation.producedRefs).toEqual(["goal:frog-classification"]);
    expect(observation.evidence_refs).toEqual(expect.arrayContaining([
      "goal:frog-classification",
      sourceId,
    ]));
  });

  it("queries synced workstation goal context through live_env.query_workstation_goal_context", () => {
    seedVisualSummaryText("ImageLens shows a frog image ready for classification.", "goal-context");

    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:context-query",
        objective: "Inspect visual goal-context updates and session controls.",
        context_feeds: ["visual_summaries", "microdeck_outputs", "trace_memory"],
        allowed_actuators: ["query_visual_summaries", "query_microdeck_outputs", "query_trace_memory"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

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

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_workstation_goal_context",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryObservation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.query_workstation_goal_context",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_goal_context_read_result/v1",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      syncedWindow: {
        mailItemCount: 1,
        processedPacketCount: 1,
      },
    });
    expect(queryPayload.agentGoalSessions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        goalId: "goal:context-query",
        authority: {
          assistantAnswer: false,
          finalReportsRequireTerminalAuthority: true,
        },
      }),
    ]));
    expect(queryPayload.authoritySummary).toMatchObject({
      schema: "helix.workstation_goal_context_authority_summary.v1",
      updateCount: 2,
      observationOnlyUpdateCount: 2,
      assistantAnswerCount: 0,
      terminalEligibleCount: 0,
      rawContentIncludedCount: 0,
      postToolModelStepRequiredCount: 2,
      activeGoalSessionCount: 1,
      finalReportsRequireTerminalAuthorityCount: 1,
      wakeInterruptCount: 0,
      answerAuthority: "completed_solver_path_required",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      post_tool_model_step_required: true,
    });
    expect(queryPayload.authoritySummary.allowedActuators).toEqual(expect.arrayContaining([
      "query_visual_summaries",
      "query_microdeck_outputs",
      "query_trace_memory",
    ]));
    expect(queryPayload.authoritySummary.dispatchCounts).toMatchObject({
      append_goal_context: expect.any(Number),
      log_receipt: expect.any(Number),
      update_panel: expect.any(Number),
    });
    expect(queryPayload.goalContextUpdates).toHaveLength(2);
    const processedUpdate = queryPayload.goalContextUpdates.find((update: any) => update.contentRef === processPayload.packets[0].packetId);
    expect(processedUpdate).toMatchObject({
      contentRef: processPayload.packets[0].packetId,
      sourceRefs: expect.arrayContaining([sourceId]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryPayload.goalContextUpdates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentRef: processPayload.packets[0].packetId,
      }),
      expect.objectContaining({
        contentRef: expect.stringMatching(/^stage_play_live_source_mail:/),
      }),
    ]));
    expect(processedUpdate.suggestedDispatch.map((action: any) => action.kind)).toEqual(expect.arrayContaining([
      "log_receipt",
      "append_goal_context",
      "update_panel",
    ]));
    expect(queryObservation.producedRefs).toContain(processedUpdate.updateId);
    expect(queryObservation.producedRefs).toContain("goal:context-query");
    expect(queryObservation.evidence_refs).toEqual(expect.arrayContaining([
      processPayload.packets[0].packetId,
      "goal:context-query",
      sourceId,
    ]));
  });

  it("queries visual summaries through a feed-specific non-terminal tool result", () => {
    seedVisualSummaryText("ImageLens visual summary: frog sitting on a green leaf.", "visual-feed");

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

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_visual_summaries",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryObservation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.query_visual_summaries",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "visual_summaries",
      sourceRef: sourceId,
      goalId: null,
      updateCount: 2,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload.authoritySummary).toMatchObject({
      schema: "helix.workstation_goal_context_authority_summary.v1",
      updateCount: 2,
      observationOnlyUpdateCount: 2,
      assistantAnswerCount: 0,
      terminalEligibleCount: 0,
      rawContentIncludedCount: 0,
      activeGoalSessionCount: 0,
      finalReportsRequireTerminalAuthorityCount: 0,
      answerAuthority: "completed_solver_path_required",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(queryPayload.goalContextUpdates[0]).toMatchObject({
      producerKind: "microdeck",
      updateKind: "visual_observation",
      contentRef: processPayload.packets[0].packetId,
      sourceRefs: expect.arrayContaining([sourceId]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryPayload.goalContextUpdates[1]).toMatchObject({
      producerKind: "visual_capture",
      updateKind: "visual_observation",
      contentRef: expect.stringMatching(/^stage_play_live_source_mail:/),
      sourceRefs: expect.arrayContaining([sourceId]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryPayload.goalContextUpdateId).toMatch(/^stage_play_goal_context_update:route_watch:/);
    const routeUpdates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
    });
    expect(routeUpdates.map((update) => update.updateId)).toContain(queryPayload.goalContextUpdateId);
    expect(routeUpdates.find((update) => update.updateId === queryPayload.goalContextUpdateId)?.suggestedDispatch.map((action) => action.kind)).toEqual(expect.arrayContaining([
      "log_receipt",
      "update_panel",
    ]));
    expect(queryObservation.producedRefs).toEqual(expect.arrayContaining([
      queryPayload.goalContextUpdateId,
      queryPayload.resultId,
      queryPayload.goalContextUpdates[0].updateId,
      queryPayload.goalContextUpdates[1].updateId,
    ]));
  });

  it("appends agent goal session checkpoints when querying allowed context feeds", () => {
    seedVisualSummaryText("ImageLens visual summary: frog sitting on a mossy rock.", "visual-goal-feed");

    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-checkpoint",
        objective: "Track frog visual evidence through goal-context feeds.",
        context_feeds: ["visual_summaries", "microdeck_outputs"],
        allowed_actuators: ["query_visual_summaries", "query_microdeck_outputs"],
      },
    });
    expect(sessionObservation.ok).toBe(true);
    const startSession = (sessionObservation.observation as any).session;
    const startingCheckpointCount = startSession.checkpoints.length;

    executeLiveEnvironmentTool({
      tool_name: "live_env.process_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_visual_summaries",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        goal_id: "goal:visual-checkpoint",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "visual_summaries",
      goalId: "goal:visual-checkpoint",
      status: "read",
      agentGoalSession: expect.objectContaining({
        goalId: "goal:visual-checkpoint",
        authority: {
          assistantAnswer: false,
          finalReportsRequireTerminalAuthority: true,
        },
      }),
      authoritySummary: expect.objectContaining({
        activeGoalSessionCount: 1,
        finalReportsRequireTerminalAuthorityCount: 1,
        allowedActuators: expect.arrayContaining(["query_visual_summaries", "query_microdeck_outputs"]),
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(queryPayload.agentGoalSession.checkpoints.length).toBe(startingCheckpointCount + 1);
    expect(queryPayload.agentGoalSession.checkpoints.at(-1)).toMatchObject({
      summary: "Queried visual summaries feed and read 2 update(s) for this goal session.",
      actionsTaken: expect.arrayContaining([
        "query_visual_summaries",
        "live_env.query_visual_summaries",
      ]),
      nextStep: "continue",
    });
    expect(queryPayload.agentGoalSession.checkpoints.at(-1).evidenceRefs).toEqual(expect.arrayContaining([
      queryPayload.goalContextUpdateId,
      queryPayload.resultId,
      queryPayload.goalContextUpdates[0].updateId,
    ]));

    const storedSession = listStagePlayAgentGoalSessions({
      threadId,
      goalId: "goal:visual-checkpoint",
      limit: 1,
    })[0];
    expect(storedSession?.checkpoints.length).toBe(startingCheckpointCount + 1);
    expect(storedSession?.checkpoints.at(-1)?.summary).toBe("Queried visual summaries feed and read 2 update(s) for this goal session.");
    expect(queryObservation.producedRefs).toEqual(expect.arrayContaining([
      queryPayload.goalContextUpdateId,
      queryPayload.resultId,
    ]));
  });

  it("blocks feed-specific queries outside an explicit goal session context-feed policy", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-feed-only",
        objective: "Observe visual summaries without translation feeds.",
        context_feeds: ["visual_summaries"],
        allowed_actuators: ["query_translation_segments", "query_visual_summaries"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_translation_segments",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        goal_id: "goal:visual-feed-only",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryObservation).toMatchObject({
      tool_name: "live_env.query_translation_segments",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "translated_transcripts",
      status: "blocked",
      goalId: "goal:visual-feed-only",
      goalSessionFound: true,
      feedAllowed: false,
      missingRequirements: ["context_feed:translated_transcripts"],
      updateCount: 0,
      goalContextUpdates: [],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
    });
    const queryUpdate = updates.find((update) => update.updateId === queryPayload.goalContextUpdateId);
    expect(queryUpdate).toMatchObject({
      contentRef: queryPayload.resultId,
      freshness: expect.objectContaining({ status: "blocked" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("append_goal_context");
  });

  it("blocks feed-specific queries when the goal session omits the query actuator", () => {
    seedVisualSummaryText("ImageLens visual summary: frog on a stone path.", "visual-feed-actuator");

    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-feed-no-query-action",
        objective: "Keep visual summaries available but do not let the agent query them yet.",
        context_feeds: ["visual_summaries"],
        allowed_actuators: ["query_source_health"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_visual_summaries",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        goal_id: "goal:visual-feed-no-query-action",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryObservation).toMatchObject({
      tool_name: "live_env.query_visual_summaries",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "visual_summaries",
      status: "blocked",
      goalId: "goal:visual-feed-no-query-action",
      goalSessionFound: true,
      feedAllowed: true,
      requiredActuator: "query_visual_summaries",
      actuatorAllowed: false,
      missingRequirements: ["allowed_actuator:query_visual_summaries"],
      updateCount: 0,
      goalContextUpdates: [],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("queries translation segments from translation-loop packet evidence", () => {
    const audioSourceId = "audio_source:helix-ask-live-source-mail-tool";
    const audioMail = enqueueAudioTranscriptMailFromChunk({
      threadId,
      roomId,
      sourceId: audioSourceId,
      transcript: "la rana esta en la hoja",
      eventRef: "audio_event:helix-ask-live-source-mail-tool",
      chunkRef: "audio_chunk:helix-ask-live-source-mail-tool",
      now: "2026-06-04T12:10:00.000Z",
    });

    const audioQueryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_audio_transcripts",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: audioSourceId,
        source_kind: "audio_transcript",
      },
    });
    const audioQueryPayload = audioQueryObservation.observation as any;
    expect(audioQueryObservation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.query_audio_transcripts",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(audioQueryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "audio_transcripts",
      sourceRef: audioSourceId,
      updateCount: 1,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(audioQueryPayload.goalContextUpdates[0]).toMatchObject({
      producerKind: "audio_capture",
      updateKind: "transcript_window",
      contentRef: audioMail.mailId,
      sourceRefs: expect.arrayContaining([audioSourceId, "audio_event:helix-ask-live-source-mail-tool", "audio_chunk:helix-ask-live-source-mail-tool"]),
      evidenceRefs: expect.arrayContaining([audioMail.mailId, "audio_event:helix-ask-live-source-mail-tool", "audio_chunk:helix-ask-live-source-mail-tool"]),
      freshness: expect.objectContaining({ status: "fresh" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(audioQueryPayload.authoritySummary).toMatchObject({
      updateCount: 1,
      observationOnlyUpdateCount: 1,
      assistantAnswerCount: 0,
      terminalEligibleCount: 0,
      rawContentIncludedCount: 0,
      answerAuthority: "completed_solver_path_required",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });

    const processObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.process_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: audioSourceId,
        source_kind: "audio_transcript",
      },
    });
    const processPayload = processObservation.observation as any;
    const audioUpdatesAfterProcess = listStagePlayGoalContextUpdates({
      threadId,
      sourceRef: audioSourceId,
      producerKind: "audio_capture",
      updateKind: "transcript_window",
    });
    expect(audioUpdatesAfterProcess).toEqual(expect.arrayContaining([
      expect.objectContaining({
        contentRef: audioMail.mailId,
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]));

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_translation_segments",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: audioSourceId,
        source_kind: "audio_transcript",
      },
    });

    const queryPayload = queryObservation.observation as any;
    expect(queryObservation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.query_translation_segments",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "translated_transcripts",
      sourceRef: audioSourceId,
      updateCount: 1,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(queryPayload.goalContextUpdates[0]).toMatchObject({
      producerKind: "translation_loop",
      updateKind: "translated_transcript",
      contentRef: processPayload.packets[0].packetId,
      sourceRefs: expect.arrayContaining([audioSourceId]),
      evidenceRefs: expect.arrayContaining([processPayload.packets[0].packetId]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryObservation.producedRefs).toEqual(expect.arrayContaining([
      queryPayload.goalContextUpdateId,
      queryPayload.resultId,
      queryPayload.goalContextUpdates[0].updateId,
    ]));
  });

  it("prepares workstation preset changes as governed non-terminal control receipts", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.change_workstation_preset",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        target_ref: "source:visual:active",
        preset_id: "preset:frog-classifier",
        reason: "Apply frog classification MicroDeck to the visual source.",
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.change_workstation_preset",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "stage_play_workstation_control_receipt/v1",
      controlKind: "change_preset",
      status: "prepared",
      missingRequirements: [],
      targetRef: "source:visual:active",
      presetId: "preset:frog-classifier",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: payload.receiptId }),
      expect.objectContaining({ kind: "update_panel", panelId: "stage-play-badge-graph" }),
      expect.objectContaining({ kind: "change_preset", targetRef: "source:visual:active", presetId: "preset:frog-classifier" }),
    ]));
    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "suggested_action",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: payload.goalContextUpdateId,
      contentRef: payload.receiptId,
      freshness: expect.objectContaining({ status: "fresh" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "change_preset", targetRef: "source:visual:active", presetId: "preset:frog-classifier" }),
    ]));
    expect(observation.producedRefs).toEqual(expect.arrayContaining([payload.receiptId, payload.goalContextUpdateId]));
  });

  it("blocks workstation controls that are outside an explicit goal session actuator policy", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-query-only",
        objective: "Observe visual summaries without changing workstation presets.",
        allowed_actuators: ["query_visual_summaries", "query_source_health"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.change_workstation_preset",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-query-only",
        target_ref: "source:visual:active",
        preset_id: "preset:frog-classifier",
        reason: "Try to apply a preset from a query-only goal.",
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.change_workstation_preset",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "stage_play_workstation_control_receipt/v1",
      controlKind: "change_preset",
      status: "blocked",
      goalId: "goal:visual-query-only",
      goalSessionFound: true,
      requiredActuator: "change_preset",
      actuatorAllowed: false,
      missingRequirements: ["allowed_actuator:change_preset"],
      targetRef: "source:visual:active",
      presetId: "preset:frog-classifier",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(payload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: payload.receiptId }),
      expect.objectContaining({ kind: "update_panel", panelId: "stage-play-badge-graph" }),
    ]));
    expect(payload.dispatch.map((action: any) => action.kind)).not.toContain("change_preset");

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "suggested_action",
    });
    const controlUpdate = updates.find((update) => update.updateId === payload.goalContextUpdateId);
    expect(controlUpdate).toMatchObject({
      contentRef: payload.receiptId,
      freshness: expect.objectContaining({ status: "blocked" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(controlUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("change_preset");
  });

  it("blocks incomplete workstation control receipts without terminalizing them", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.bind_workstation_source",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_ref: "audio_source:earbuds",
      },
    });

    const payload = observation.observation as any;
    expect(observation.ok).toBe(false);
    expect(observation).toMatchObject({
      tool_name: "live_env.bind_workstation_source",
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "stage_play_workstation_control_receipt/v1",
      controlKind: "bind_source",
      status: "blocked",
      missingRequirements: ["target_ref"],
      sourceRef: "audio_source:earbuds",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "suggested_action",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0].freshness.status).toBe("blocked");
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).not.toContain("bind_source");
  });

  it("governs loop state controls with state-specific goal actuators and a generic override", () => {
    const pauseSession = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:pause-only-loop",
        objective: "Allow the agent to pause the visual loop without resuming it.",
        allowed_actuators: ["pause_loop"],
      },
    });
    expect(pauseSession.ok).toBe(true);
    const initialPauseCheckpointCount = ((pauseSession.observation as any).session.checkpoints ?? []).length;

    const pauseObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.set_workstation_loop_state",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:pause-only-loop",
        loop_ref: "loop:visual-capture",
        state: "paused",
      },
    });
    const pausePayload = pauseObservation.observation as any;
    expect(pauseObservation.ok).toBe(true);
    expect(pausePayload).toMatchObject({
      schema: "stage_play_workstation_control_receipt/v1",
      controlKind: "set_loop_state",
      status: "prepared",
      goalId: "goal:pause-only-loop",
      requiredActuator: "pause_loop",
      actuatorAllowed: true,
      loopRef: "loop:visual-capture",
      loopState: "paused",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(pausePayload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "set_loop_state", loopRef: "loop:visual-capture", state: "paused" }),
    ]));
    expect(pausePayload.agentGoalSession).toMatchObject({
      goalId: "goal:pause-only-loop",
      checkpoints: expect.arrayContaining([
        expect.objectContaining({
          summary: "Prepared set workstation loop state control dispatch for this goal session.",
          actionsTaken: expect.arrayContaining(["pause_loop", "set_loop_state", "live_env.set_workstation_loop_state"]),
          evidenceRefs: expect.arrayContaining([pausePayload.goalContextUpdateId, pausePayload.receiptId]),
          nextStep: "continue",
        }),
      ]),
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
      },
    });
    expect(pausePayload.agentGoalSession.checkpoints).toHaveLength(initialPauseCheckpointCount + 1);
    const storedPauseSession = listStagePlayAgentGoalSessions({
      threadId,
      goalId: "goal:pause-only-loop",
      limit: 1,
    })[0];
    expect(storedPauseSession?.checkpoints.at(-1)).toMatchObject({
      summary: "Prepared set workstation loop state control dispatch for this goal session.",
      actionsTaken: expect.arrayContaining(["pause_loop", "set_loop_state", "live_env.set_workstation_loop_state"]),
      evidenceRefs: expect.arrayContaining([pausePayload.goalContextUpdateId, pausePayload.receiptId]),
    });

    const resumeObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.set_workstation_loop_state",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:pause-only-loop",
        loop_ref: "loop:visual-capture",
        state: "running",
      },
    });
    const resumePayload = resumeObservation.observation as any;
    expect(resumeObservation.ok).toBe(false);
    expect(resumePayload).toMatchObject({
      controlKind: "set_loop_state",
      status: "blocked",
      goalId: "goal:pause-only-loop",
      requiredActuator: "resume_loop",
      actuatorAllowed: false,
      missingRequirements: ["allowed_actuator:resume_loop"],
      loopState: "running",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(resumePayload.dispatch.map((action: any) => action.kind)).not.toContain("set_loop_state");

    const genericSession = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:generic-loop-control",
        objective: "Allow generic loop-state control for repair.",
        allowed_actuators: ["set_loop_state"],
      },
    });
    expect(genericSession.ok).toBe(true);

    const repairObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.set_workstation_loop_state",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:generic-loop-control",
        loop_ref: "loop:visual-capture",
        state: "repaired",
      },
    });
    const repairPayload = repairObservation.observation as any;
    expect(repairObservation.ok).toBe(true);
    expect(repairPayload).toMatchObject({
      controlKind: "set_loop_state",
      status: "prepared",
      goalId: "goal:generic-loop-control",
      requiredActuator: "repair_source",
      actuatorAllowed: true,
      loopState: "repaired",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(repairPayload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "set_loop_state", loopRef: "loop:visual-capture", state: "repaired" }),
      expect.objectContaining({ kind: "repair_loop", loopRef: "loop:visual-capture" }),
    ]));
  });

  it("prepares narrator say requests as durable non-terminal goal-context updates", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.narrator_say",
      thread_id: threadId,
      args: {
        text: "Translation is now routed through Narrator.",
        source_kind: "helix_console",
        source_id: "helix_ask:translation",
        delivery_mode: "confirm_to_speak",
        evidence_refs: ["translation_segment:latest"],
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      schema: "helix.live_environment_tool_observation.v1",
      tool_name: "live_env.narrator_say",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.narrator_say_request.v1",
      schemaVersion: "helix.narrator_say_request.v1",
      text: "Translation is now routed through Narrator.",
      sourceKind: "helix_console",
      sourceId: "helix_ask:translation",
      deliveryMode: "confirm_to_speak",
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(payload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: payload.requestId }),
      expect.objectContaining({ kind: "update_panel", panelId: "narrator" }),
      expect.objectContaining({ kind: "speak_narrator", mode: "confirm" }),
    ]));
    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "narrator",
      updateKind: "suggested_action",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: payload.goalContextUpdateId,
      contentRef: payload.requestId,
      sourceRefs: expect.arrayContaining(["helix_ask:translation", "helix_console"]),
      evidenceRefs: expect.arrayContaining([payload.requestId, "translation_segment:latest"]),
      receiptRefs: [payload.requestId],
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
  });

  it("blocks narrator say when an explicit goal session does not allow speech actuation", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:narrator-query-only",
        objective: "Observe translated segments without speaking them.",
        allowed_actuators: ["query_translation_segments", "query_trace_memory"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.narrator_say",
      thread_id: threadId,
      args: {
        goal_id: "goal:narrator-query-only",
        text: "Translation is ready.",
        source_kind: "helix_console",
        source_id: "helix_ask:translation",
        delivery_mode: "confirm_to_speak",
        evidence_refs: ["translation_segment:latest"],
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.narrator_say",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.narrator_say_request.v1",
      status: "blocked",
      goalId: "goal:narrator-query-only",
      goalSessionFound: true,
      requiredActuator: "narrator_say",
      actuatorAllowed: false,
      missingRequirements: ["allowed_actuator:narrator_say"],
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(payload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: payload.requestId }),
      expect.objectContaining({ kind: "update_panel", panelId: "narrator" }),
    ]));
    expect(payload.dispatch.map((action: any) => action.kind)).not.toContain("speak_narrator");

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "narrator",
      updateKind: "suggested_action",
    });
    const narratorUpdate = updates.find((update) => update.updateId === payload.goalContextUpdateId);
    expect(narratorUpdate).toMatchObject({
      contentRef: payload.requestId,
      freshness: expect.objectContaining({ status: "blocked" }),
      evidenceRefs: expect.arrayContaining([payload.requestId, "translation_segment:latest"]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(narratorUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("speak_narrator");
  });

  it("prepares narrator stream bindings and blocks missing stream requirements", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: "source:browser-audio",
        goal_id: "goal:narrator-stream",
        objective: "Route translated transcript audio through Narrator.",
        context_feeds: [{ source_kind: "translation" }],
        allowed_actuators: ["narrator_bind_stream", "query_translation_segments"],
      },
    });
    expect(sessionObservation.ok).toBe(true);
    const initialNarratorCheckpointCount = ((sessionObservation.observation as any).session.checkpoints ?? []).length;

    const prepared = executeLiveEnvironmentTool({
      tool_name: "live_env.narrator_bind_stream",
      thread_id: threadId,
      args: {
        goal_id: "goal:narrator-stream",
        source_ref: "source:browser-audio",
        stream_kind: "translated_transcript",
        delivery_mode: "visible_only",
        voice_policy: "confirm_speak_required",
      },
    });
    const preparedPayload = prepared.observation as any;
    expect(prepared).toMatchObject({
      tool_name: "live_env.narrator_bind_stream",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(preparedPayload).toMatchObject({
      schema: "helix.narrator_bind_stream_request.v1",
      streamKind: "translated_transcript",
      sourceRef: "source:browser-audio",
      deliveryMode: "visible_only",
      voicePolicy: "confirm_speak_required",
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(preparedPayload.agentGoalSession).toMatchObject({
      goalId: "goal:narrator-stream",
      checkpoints: expect.arrayContaining([
        expect.objectContaining({
          summary: "Prepared narrator translated_transcript binding for this goal session.",
          actionsTaken: expect.arrayContaining(["narrator_bind_stream", "live_env.narrator_bind_stream"]),
          evidenceRefs: expect.arrayContaining([preparedPayload.goalContextUpdateId, preparedPayload.requestId]),
          nextStep: "continue",
        }),
      ]),
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
      },
    });
    expect(preparedPayload.agentGoalSession.checkpoints).toHaveLength(initialNarratorCheckpointCount + 1);
    expect(preparedPayload.dispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "bind_narrator_stream", sourceRef: "source:browser-audio", streamKind: "translated_transcript" }),
      expect.objectContaining({ kind: "speak_narrator", mode: "visible_only" }),
    ]));
    const storedNarratorSession = listStagePlayAgentGoalSessions({
      threadId,
      goalId: "goal:narrator-stream",
      limit: 1,
    })[0];
    expect(storedNarratorSession?.checkpoints.at(-1)).toMatchObject({
      summary: "Prepared narrator translated_transcript binding for this goal session.",
      actionsTaken: expect.arrayContaining(["narrator_bind_stream", "live_env.narrator_bind_stream"]),
      evidenceRefs: expect.arrayContaining([preparedPayload.goalContextUpdateId, preparedPayload.requestId]),
    });

    const blocked = executeLiveEnvironmentTool({
      tool_name: "live_env.narrator_bind_stream",
      thread_id: threadId,
      args: {
        source_ref: "source:browser-audio",
      },
    });
    const blockedPayload = blocked.observation as any;
    expect(blocked.ok).toBe(false);
    expect(blockedPayload).toMatchObject({
      schema: "helix.narrator_bind_stream_request.v1",
      status: "blocked",
      missingRequirements: ["stream_kind"],
      terminal_eligible: false,
      assistant_answer: false,
    });
    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "narrator",
      updateKind: "suggested_action",
    });
    expect(updates.map((update) => update.freshness.status)).toEqual(expect.arrayContaining(["fresh", "blocked"]));
  });

  it("records source health queries as durable non-terminal goal-context updates", () => {
    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_source_health",
      thread_id: threadId,
      args: {
        room_id: roomId,
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_source_health",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.situation_source_capability_read.v1",
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:source_health:/),
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
    });

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "source_health",
      updateKind: "source_status",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: payload.goalContextUpdateId,
      producerKind: "source_health",
      updateKind: "source_status",
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).toEqual(expect.arrayContaining([
      "log_receipt",
      "update_panel",
    ]));
    expect(observation.producedRefs).toEqual([payload.goalContextUpdateId]);
  });

  it("appends agent goal session checkpoints when querying allowed source health", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:source-health-watch",
        objective: "Track source health while monitoring workstation loops.",
        context_feeds: ["source_health"],
        allowed_actuators: ["query_source_health"],
      },
    });
    expect(sessionObservation.ok).toBe(true);
    const initialCheckpointCount = ((sessionObservation.observation as any).session.checkpoints ?? []).length;

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_source_health",
      thread_id: threadId,
      args: {
        room_id: roomId,
        goal_id: "goal:source-health-watch",
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_source_health",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.situation_source_capability_read.v1",
      status: "read",
      goalId: "goal:source-health-watch",
      goalSessionFound: true,
      feedAllowed: true,
      actuatorAllowed: true,
      requiredActuator: "query_source_health",
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:source_health:/),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      agentGoalSession: expect.objectContaining({
        goalId: "goal:source-health-watch",
        authority: {
          assistantAnswer: false,
          finalReportsRequireTerminalAuthority: true,
        },
      }),
    });
    expect(payload.agentGoalSession.checkpoints).toHaveLength(initialCheckpointCount + 1);
    expect(payload.agentGoalSession.checkpoints.at(-1)).toMatchObject({
      summary: expect.stringMatching(/^Queried source health and read \d+ capability state\(s\) for this goal session\.$/),
      actionsTaken: expect.arrayContaining(["query_source_health", "live_env.query_source_health"]),
      evidenceRefs: expect.arrayContaining([payload.goalContextUpdateId]),
    });

    const storedSession = listStagePlayAgentGoalSessions({
      threadId,
      goalId: "goal:source-health-watch",
      limit: 1,
    })[0];
    expect(storedSession?.checkpoints).toHaveLength(initialCheckpointCount + 1);
    expect(storedSession?.checkpoints.at(-1)).toMatchObject({
      actionsTaken: expect.arrayContaining(["query_source_health", "live_env.query_source_health"]),
      evidenceRefs: expect.arrayContaining([payload.goalContextUpdateId]),
    });
  });

  it("blocks source health queries outside an explicit goal session context-feed policy", () => {
    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:no-source-health",
        objective: "Inspect visual summaries without source-health feed access.",
        context_feeds: ["visual_summaries"],
        allowed_actuators: ["query_source_health", "query_visual_summaries"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_source_health",
      thread_id: threadId,
      args: {
        room_id: roomId,
        goal_id: "goal:no-source-health",
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_source_health",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.situation_source_capability_read.v1",
      status: "blocked",
      goalId: "goal:no-source-health",
      goalSessionFound: true,
      feedAllowed: false,
      missingRequirements: ["context_feed:source_health"],
      capabilities: [],
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:source_health:/),
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "source_health",
      updateKind: "source_status",
    });
    const sourceHealthUpdate = updates.find((update) => update.updateId === payload.goalContextUpdateId);
    expect(sourceHealthUpdate).toMatchObject({
      contentRef: expect.stringMatching(/^stage_play_source_health:/),
      freshness: expect.objectContaining({ status: "blocked" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(sourceHealthUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("repair_loop");
  });

  it("records current live-source state queries as Live Answer goal-context updates", () => {
    seedVisualSummaryText("Live Answer compact state shows a frog photo in ImageLens.", "current-state");

    executeLiveEnvironmentTool({
      tool_name: "live_env.check_live_source_mail",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.summarize_live_source_current_state",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.summarize_live_source_current_state",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schemaVersion: "stage_play_live_source_current_state/v1",
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:live_answer:/),
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
    });

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      sourceRef: sourceId,
      producerKind: "live_answer",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: payload.goalContextUpdateId,
      contentRef: payload.currentStateId,
      producerKind: "live_answer",
      updateKind: "summary",
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).toEqual(expect.arrayContaining([
      "log_receipt",
      "update_live_answer",
      "update_panel",
    ]));
    expect(observation.producedRefs).toEqual([payload.goalContextUpdateId]);
  });

  it("records Live Answer card reads as queryable non-terminal goal-context projection updates", () => {
    const liveAnswerSourceId = "visual_source:live-answer-card-read";
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:live-answer-card-read",
      objective: "Track the ImageLens frog classification card.",
      room_id: roomId,
      source_ids: [liveAnswerSourceId],
      preset: "custom",
      line_schema: [
        {
          key: "scene",
          label: "Scene",
          update_policy: "episode_based",
          visibility: "answer_card",
          priority: "info",
        },
        {
          key: "uncertainty",
          label: "Uncertainty",
          update_policy: "projection_only",
          visibility: "answer_card",
          priority: "warn",
        },
      ],
    });
    updateLiveAnswerEnvironment({
      environment_id: environment.environment_id,
      reason: "subgoal_update",
      line_values: {
        scene: {
          value: "ImageLens shows a frog on a green leaf.",
          confidence: 0.86,
          evidence_refs: ["visual_frame:frog-card"],
        },
      },
      latest_summary: "Live Answer card projected frog classification context.",
      evidence_refs: ["visual_frame:frog-card"],
      now: "2026-06-17T14:05:00.000Z",
    });

    const readObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.read_card",
      thread_id: threadId,
      environment_id: environment.environment_id,
      args: {
        room_id: roomId,
        line_keys: ["scene"],
      },
    });

    const readPayload = readObservation.observation as any;
    expect(readObservation).toMatchObject({
      tool_name: "live_env.read_card",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(readPayload).toMatchObject({
      schema: "helix.live_environment_card_read.v1",
      environment_id: environment.environment_id,
      assistant_answer: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      raw_content_included: false,
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:live_answer:/),
    });
    expect(readPayload.lines).toEqual([
      expect.objectContaining({
        key: "scene",
        label: "Scene",
        ui_summary_only: true,
        assistant_answer: false,
      }),
    ]);
    expect(readObservation.producedRefs).toEqual(expect.arrayContaining([
      readPayload.goalContextUpdateId,
    ]));

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      sourceRef: liveAnswerSourceId,
      producerKind: "live_answer",
      updateKind: "summary",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: readPayload.goalContextUpdateId,
      producerKind: "live_answer",
      updateKind: "summary",
      contentRef: expect.stringMatching(/^live_answer_card_read:/),
      sourceRefs: expect.arrayContaining([
        environment.environment_id,
        liveAnswerSourceId,
        "live_answer_line:scene",
      ]),
      evidenceRefs: expect.arrayContaining([
        environment.environment_id,
        "visual_frame:frog-card",
      ]),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "update_live_answer", lineKey: "scene" }),
      expect.objectContaining({ kind: "update_panel", panelId: "live-answer-environment" }),
    ]));

    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_live_answer_state",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: liveAnswerSourceId,
      },
    });
    const queryPayload = queryObservation.observation as any;
    expect(queryPayload).toMatchObject({
      schema: "stage_play_workstation_context_feed_query_result/v1",
      feedKind: "live_answer_lines",
      updateCount: 1,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      post_tool_model_step_required: true,
    });
    expect(queryPayload.goalContextUpdates[0]).toMatchObject({
      updateId: readPayload.goalContextUpdateId,
      producerKind: "live_answer",
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
  });

  it("queries compact trace memory and records route-watch goal context", () => {
    const trace = recordWorkstationReasoningTrace({
      schema: "helix.workstation_reasoning_trace.v1",
      trace_id: "workstation_trace:hotbar-total",
      thread_id: threadId,
      turn_id: "turn:hotbar-total",
      source_family: "multimodal",
      user_goal: "Add visible hotbar item counts.",
      route_reason_code: "visual_to_calculator",
      input_item_refs: ["visual_evidence:hotbar"],
      evidence_refs: ["visual_evidence:hotbar", "derived_equation:hotbar"],
      tool_receipt_ids: ["calculator_receipt:hotbar"],
      lifecycle_event_refs: ["tool_lifecycle:hotbar"],
      artifacts: {
        visual_extraction_id: "visual_extraction:hotbar",
        derived_equation_id: "derived_equation:hotbar",
        workstation_tool_evaluation_id: "workstation-tool-eval:hotbar",
        terminal_authority_hash: "hash:hotbar-total",
      },
      requested_extraction_scope: "hotbar",
      actual_extraction_scope: "hotbar",
      scope_match: "exact",
      proof_status: "complete",
      compact_steps: [
        {
          label: "Visual extraction",
          summary: "Extracted compact hotbar counts.",
          artifact_ref: "visual_extraction:hotbar",
          status: "completed",
        },
        {
          label: "Calculator",
          summary: "Added 64 + 12 + 3.",
          artifact_ref: "calculator_receipt:hotbar",
          status: "completed",
        },
      ],
      caveats: [],
      final_answer_snapshot: "The hotbar total is 79.",
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
      created_at: "2026-06-17T15:00:00.000Z",
    });

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_trace_memory",
      thread_id: threadId,
      args: {
        trace_id: trace.trace_id,
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_trace_memory",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.workstation_reasoning_trace_query_result.v1",
      trace_id: trace.trace_id,
      trace_count: 1,
      selectedTrace: {
        trace_id: trace.trace_id,
        assistant_answer: false,
        raw_content_included: false,
      },
      goalContextUpdateId: expect.stringMatching(/^stage_play_goal_context_update:route_watch:/),
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      updateId: payload.goalContextUpdateId,
      contentRef: payload.resultId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).toEqual(expect.arrayContaining([
      "log_receipt",
      "append_goal_context",
      "update_panel",
    ]));
    expect(observation.producedRefs).toEqual(expect.arrayContaining([
      payload.resultId,
      payload.goalContextUpdateId,
      trace.trace_id,
    ]));
  });

  it("blocks trace-memory queries outside an explicit goal session context-feed policy", () => {
    const trace = recordWorkstationReasoningTrace({
      schema: "helix.workstation_reasoning_trace.v1",
      trace_id: "trace:blocked-by-feed-policy",
      thread_id: threadId,
      turn_id: "turn:blocked-by-feed-policy",
      source_family: "multimodal",
      user_goal: "Remember prior visual reasoning.",
      route_reason_code: "visual_to_calculator",
      input_item_refs: ["visual_evidence:blocked-feed"],
      evidence_refs: ["visual_evidence:blocked-feed"],
      tool_receipt_ids: ["calculator_receipt:blocked-feed"],
      lifecycle_event_refs: ["tool_lifecycle:blocked-feed"],
      artifacts: {},
      requested_extraction_scope: "visual",
      actual_extraction_scope: "visual",
      scope_match: "exact",
      proof_status: "complete",
      compact_steps: [],
      caveats: [],
      final_answer_snapshot: "Prior trace should not be exposed to this visual-only feed request.",
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
      created_at: "2026-06-17T15:05:00.000Z",
    });

    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:visual-no-trace",
        objective: "Inspect visual summaries only.",
        context_feeds: ["visual_summaries"],
        allowed_actuators: ["query_trace_memory", "query_visual_summaries"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_trace_memory",
      thread_id: threadId,
      args: {
        goal_id: "goal:visual-no-trace",
        trace_id: trace.trace_id,
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_trace_memory",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.workstation_reasoning_trace_query_result.v1",
      trace_id: trace.trace_id,
      goalId: "goal:visual-no-trace",
      status: "blocked",
      goalSessionFound: true,
      feedAllowed: false,
      missingRequirements: ["context_feed:trace_memory"],
      traces: [],
      trace_count: 0,
      selectedTrace: null,
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observation.producedRefs).not.toContain(trace.trace_id);

    const updates = listStagePlayGoalContextUpdates({
      threadId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
    });
    const queryUpdate = updates.find((update) => update.updateId === payload.goalContextUpdateId);
    expect(queryUpdate).toMatchObject({
      contentRef: payload.resultId,
      freshness: expect.objectContaining({ status: "blocked" }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(queryUpdate?.suggestedDispatch.map((action) => action.kind)).not.toContain("append_goal_context");
  });

  it("blocks trace-memory queries when the goal session omits the query actuator", () => {
    const trace = recordWorkstationReasoningTrace({
      schema: "helix.workstation_reasoning_trace.v1",
      trace_id: "trace:blocked-by-actuator-policy",
      thread_id: threadId,
      turn_id: "turn:blocked-by-actuator-policy",
      source_family: "multimodal",
      user_goal: "Remember prior trace evidence.",
      route_reason_code: "visual_to_calculator",
      input_item_refs: ["visual_evidence:blocked-actuator"],
      evidence_refs: ["visual_evidence:blocked-actuator"],
      tool_receipt_ids: ["calculator_receipt:blocked-actuator"],
      lifecycle_event_refs: ["tool_lifecycle:blocked-actuator"],
      artifacts: {},
      requested_extraction_scope: "visual",
      actual_extraction_scope: "visual",
      scope_match: "exact",
      proof_status: "complete",
      compact_steps: [],
      caveats: [],
      final_answer_snapshot: "Prior trace should not be exposed without the query actuator.",
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
      created_at: "2026-06-17T15:08:00.000Z",
    });

    const sessionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.start_agent_goal_session",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        goal_id: "goal:trace-feed-no-query-action",
        objective: "Keep trace memory available but do not let the agent query it yet.",
        context_feeds: ["trace_memory"],
        allowed_actuators: ["query_visual_summaries"],
      },
    });
    expect(sessionObservation.ok).toBe(true);

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_trace_memory",
      thread_id: threadId,
      args: {
        goal_id: "goal:trace-feed-no-query-action",
        trace_id: trace.trace_id,
      },
    });

    const payload = observation.observation as any;
    expect(observation).toMatchObject({
      tool_name: "live_env.query_trace_memory",
      ok: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(payload).toMatchObject({
      schema: "helix.workstation_reasoning_trace_query_result.v1",
      trace_id: trace.trace_id,
      goalId: "goal:trace-feed-no-query-action",
      status: "blocked",
      goalSessionFound: true,
      feedAllowed: true,
      requiredActuator: "query_trace_memory",
      actuatorAllowed: false,
      missingRequirements: ["allowed_actuator:query_trace_memory"],
      traces: [],
      trace_count: 0,
      selectedTrace: null,
      post_tool_model_step_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observation.producedRefs).not.toContain(trace.trace_id);
  });

  it("reflects live-source mail-loop causality as a read-only evidence packet", () => {
    seedVisualSummaryText("Minecraft cave scene with low light and the player near fire damage.", "reflection");

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

    const reflectionObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.reflect_live_source_mail_loop",
      thread_id: threadId,
      args: {
        room_id: roomId,
        source_id: sourceId,
        source_kind: "visual_frame",
        read_only: true,
      },
    });

    const reflection = reflectionObservation.observation as any;
    expect(reflectionObservation.summary).toContain("Reflected live-source mail-loop causality");
    expect(reflection).toMatchObject({
      artifactId: "stage_play_live_source_mail_loop_reflection",
      schemaVersion: "stage_play_live_source_mail_loop_reflection/v1",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(reflection.inspectionWindow.processedPacketRefs).toEqual(expect.arrayContaining([
      processPayload.packets[0].packetId,
    ]));
    expect(reflection.inspectionWindow.microReasonerRunRefs.length).toBeGreaterThan(0);
    expect(reflection.inspectionWindow.currentStateRef).toMatch(/^stage_play_live_source_current_state:/);
    expect(reflection.inspectionWindow.loopHealthRef).toMatch(/^stage_play_live_source_loop_health:/);
    expect(reflection.inspectionWindow.stagePlayGraphRef).toMatch(/^stage_play_badge_graph:/);
    expect(reflection.causalGraph).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relation: "processed_into_packet",
        toRef: processPayload.packets[0].packetId,
      }),
      expect.objectContaining({
        relation: "reasoned_by_microdeck",
      }),
      expect.objectContaining({
        relation: "eligible_for_terminal_context",
        fromRef: processPayload.packets[0].packetId,
      }),
    ]));
    expect(reflection.whatEnteredAnswerContext.join(" ")).toContain(processPayload.packets[0].packetId);
    expect(reflection.causalTrace).toMatchObject({
      producedRefs: expect.arrayContaining([reflection.reflectionId]),
      evidenceRefs: expect.arrayContaining([processPayload.packets[0].packetId]),
    });
    expect(reflectionObservation.producedRefs).toContain(reflection.reflectionId);
    expect(reflectionObservation.artifactRefs).toMatchObject({
      processedPacketIds: expect.arrayContaining([processPayload.packets[0].packetId]),
    });
  });

  it("configures visual observer profiles and maps structured Minecraft observer output into processed packets", () => {
    const queryObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_visual_observer_profiles",
      thread_id: threadId,
      args: {},
    });
    const queryPayload = queryObservation.observation as any;
    const minecraftProfile = queryPayload.profiles.find((profile: any) => profile.domain === "minecraft_gameplay");
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
    expect(packet.actionPredictions[0]).toMatchObject({
      actorId: sourceId,
      recommendedNext: "request_voice_callout",
      basis: expect.arrayContaining(["goal_object", "recovery_pattern", "salience"]),
      frameIntervalRefs: expect.any(Array),
      sourceSliceRefs: expect.any(Array),
    });
    expect(packet.unresolvedLeads.map((lead: any) => lead.urgency)).toContain("high");
    expect(packet.evidenceRefs).toEqual(expect.arrayContaining([
      packet.actionPredictions[0].predictionId,
      packet.evidenceHandles.frameIntervals[0].intervalId,
      packet.unresolvedLeads[0].leadId,
    ]));
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
