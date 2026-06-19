import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_RUNTIME_PACKET_SCHEMA,
  type HelixLiveEnvironmentRuntimePacket,
  type HelixLiveEnvironmentToolName,
} from "@shared/helix-live-agent-step";
import { getActiveLiveAnswerEnvironmentForThread, getLiveAnswerEnvironment } from "./live-answer-environment-store";
import { listInterpretedEvents } from "./interpreted-event-log-store";
import { queryMinecraftNavigationState } from "./minecraft-navigation-state-store";
import { readSituationSourceCapabilities } from "./situation-source-capability-store";
import {
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS,
  executableAliasesForWorkstationContextFeedQuerySpec,
} from "../helix-ask/workstation-context-feed-query-tool-contracts";
import {
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
} from "../stage-play/stage-play-goal-context-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const LIVE_ENV_TOOLS: Array<{
  tool_id: HelixLiveEnvironmentToolName;
  requires_user_confirmation: boolean;
  can_run_automatically: boolean;
  tool_aliases?: string[];
}> = [
  { tool_id: "live_env.read_card", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_event_log", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_world_events", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_navigation_state", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.describe_stage_builder", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_stage_sources", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.draft_stage_play_graph", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.validate_stage_play_graph", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.plan_stage_play_job", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.request_stage_play_checkpoint", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.reflect_stage_play_context", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.check_live_source_mail", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.read_live_source_mail", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.process_live_source_mail", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.read_processed_live_source_mail", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.reflect_live_source_mail_loop", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_workstation_goal_context", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.start_agent_goal_session", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_trace_memory", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_packet_traces", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_visual_summaries", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_audio_transcripts", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_translation_segments", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_microdeck_outputs", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_live_answer_state", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_narrator_events", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_route_evidence", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_automation_policies", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.change_workstation_preset", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.set_visual_preset", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.set_audio_preset", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.bind_workstation_source", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.unbind_workstation_source", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.pause_workstation_loop", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.resume_workstation_loop", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.set_workstation_loop_state", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.repair_loop", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.repair_workstation_source", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.update_live_answer_projection", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.focus_process_graph", requires_user_confirmation: true, can_run_automatically: false },
  {
    tool_id: "live_env.narrator_say",
    requires_user_confirmation: true,
    can_run_automatically: false,
    tool_aliases: ["narrator.say", "narrator_say"],
  },
  {
    tool_id: "live_env.narrator_bind_stream",
    requires_user_confirmation: true,
    can_run_automatically: false,
    tool_aliases: ["narrator.bind_stream", "narrator_bind_stream"],
  },
  { tool_id: "live_env.query_micro_reasoner_prompts", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_micro_reasoner_presets", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.draft_micro_reasoner_preset", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.route_micro_reasoner_prompt", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.apply_micro_reasoner_preset", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.create_micro_reasoner_preset", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.update_micro_reasoner_prompt", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.test_micro_reasoner_prompt", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.configure_visual_observer_profile", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.apply_visual_observer_profile", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_visual_observer_profiles", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.test_visual_observer_profile", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.compare_visual_observer_profiles", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.request_visual_action_replay", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.configure_route_watch", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.configure_live_source_watch_job", requires_user_confirmation: true, can_run_automatically: false },
  { tool_id: "live_env.configure_interpreter_profile", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.compare_mail_to_interpreter_profile", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.record_live_source_mail_decision", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.predict_live_source_immediate", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.compare_live_source_prediction", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.project_live_source_narrative", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.update_live_source_immersion_state", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.validate_live_source_prediction", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_live_source_loop_health", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.record_voice_steering", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.request_interim_voice_callout", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_source_health", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_live_source_quality", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.summarize_live_source_current_state", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_constructs", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.query_job_evidence", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.request_probe", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.spawn_field_worker", requires_user_confirmation: false, can_run_automatically: false },
  { tool_id: "live_env.record_commentary", requires_user_confirmation: false, can_run_automatically: true },
  { tool_id: "live_env.evaluate_goal_satisfaction", requires_user_confirmation: false, can_run_automatically: true },
];

const CONTEXT_FEED_QUERY_TOOL_ALIASES = new Map<HelixLiveEnvironmentToolName, string[]>(
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => [
    spec.capability as HelixLiveEnvironmentToolName,
    executableAliasesForWorkstationContextFeedQuerySpec(spec),
  ]),
);

const staleLineKeys = (lines: Array<{ key: string; updated_at: string }>, nowMs: number): string[] =>
  lines
    .filter((line) => {
      const updated = Date.parse(line.updated_at);
      return !Number.isFinite(updated) || nowMs - updated > 60_000;
    })
    .map((line) => line.key);

const missingEvidenceLineKeys = (lines: Array<{ key: string; value: string }>): string[] =>
  lines
    .filter((line) => /\b(?:missing|unknown|waiting|not available|no .*evidence|unconfirmed)\b/i.test(line.value))
    .map((line) => line.key);

export function buildLiveEnvironmentRuntimePacket(input: {
  threadId: string;
  environmentId?: string | null;
  roomId?: string | null;
  mode?: HelixLiveEnvironmentRuntimePacket["mode"];
  goal?: Partial<HelixLiveEnvironmentRuntimePacket["current_goal"]> | null;
  now?: string;
}): HelixLiveEnvironmentRuntimePacket {
  const now = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  const environment =
    (input.environmentId ? getLiveAnswerEnvironment(input.environmentId) : null) ??
    getActiveLiveAnswerEnvironmentForThread(input.threadId);
  const roomId = input.roomId ?? environment?.room_id ?? null;
  const recentEvents = listInterpretedEvents({
    threadId: input.threadId,
    roomId,
    limit: 30,
  });
  const sourceHealth = readSituationSourceCapabilities({
    threadId: input.threadId,
    roomId,
  });
  const navigation = queryMinecraftNavigationState({
    roomId,
    limit: 4,
  });
  const activeGoalSessions = listStagePlayAgentGoalSessions({
    threadId: input.threadId,
    status: "active",
    limit: 6,
  });
  const recentGoalContextUpdates = listStagePlayGoalContextUpdates({
    threadId: input.threadId,
    limit: 16,
  });
  const lineKeys = environment?.lines.map((line) => line.key) ?? [];
  const staleLines = environment ? staleLineKeys(environment.lines, Number.isFinite(nowMs) ? nowMs : Date.now()) : [];
  const missingLines = environment ? missingEvidenceLineKeys(environment.lines) : [];
  const missingEvidence = [
    ...(environment ? [] : ["No live answer environment is active for this thread."]),
    ...sourceHealth.capabilities
      .filter((capability) => capability.status !== "active")
      .map((capability) => capability.missing_reason ?? `${capability.modality} source is ${capability.status}.`),
    ...navigation.missing_evidence,
  ].slice(0, 12);
  const goal = input.goal ?? {};
  return {
    schema: HELIX_LIVE_ENVIRONMENT_RUNTIME_PACKET_SCHEMA,
    packet_id: `live_env_runtime_packet:${hashShort([input.threadId, environment?.environment_id ?? null, now])}`,
    thread_id: input.threadId,
    environment_id: environment?.environment_id ?? input.environmentId ?? null,
    room_id: roomId,
    mode: input.mode ?? "auntie_dottie",
    current_goal: {
      goal_id: goal.goal_id ?? `live_goal:${hashShort([input.threadId, environment?.objective ?? "live_environment_review"])}`,
      goal_kind: goal.goal_kind ?? "live_environment_review",
      user_visible_goal_summary:
        goal.user_visible_goal_summary ??
        environment?.objective ??
        "Use live environment evidence to decide the next tool step.",
      terminal_contract: goal.terminal_contract ?? {
        allowed_terminal_kinds: ["terminal_assistant_answer", "typed_failure"],
        forbidden_terminal_kinds: ["live_card_projection", "panel_generated_answer", "model_only_concept"],
        requires_goal_satisfaction: true,
      },
    },
    live_card_snapshot: {
      line_keys: lineKeys,
      stale_lines: staleLines,
      missing_evidence_lines: missingLines,
    },
    recent_commentary_refs: recentEvents
      .filter((event) => event.kind === "agentic_review" || event.kind === "tool_trace" || event.kind === "callout_proposal")
      .map((event) => event.event_id),
    recent_event_refs: recentEvents.map((event) => event.event_id),
    source_health_refs: sourceHealth.capabilities.map((capability) => capability.source_id),
    navigation_state_ref: navigation.navigation_state?.state_id ?? null,
    missing_evidence: Array.from(new Set(missingEvidence)),
    goal_context_snapshot: {
      active_goal_session_count: activeGoalSessions.length,
      recent_goal_context_update_count: recentGoalContextUpdates.length,
      active_goal_sessions: activeGoalSessions.map((session) => ({
        goal_id: session.goalId,
        status: session.status,
        source_refs: session.sourceRefs.slice(0, 12),
        loop_refs: session.loopRefs.slice(0, 12),
        context_feed_kinds: Array.from(new Set(session.contextFeeds.map((feed) => feed.sourceKind))).slice(0, 16),
        context_feed_refs: session.contextFeeds.map((feed) => `agent_goal_context_feed:${feed.feedId}`).slice(0, 16),
        allowed_actuators: session.allowedActuators.slice(0, 20),
        allowed_actuator_refs: session.allowedActuators.map((actuator) => `agent_goal_allowed_actuator:${actuator}`).slice(0, 20),
        checkpoint_refs: session.checkpoints.map((checkpoint) => checkpoint.checkpointId).slice(-6),
        final_reports_require_terminal_authority: session.authority.finalReportsRequireTerminalAuthority,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      })),
      recent_goal_context_update_refs: recentGoalContextUpdates.map((update) => update.updateId),
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    available_tools: LIVE_ENV_TOOLS.map((entry) => {
      const toolAliases = entry.tool_aliases ?? CONTEXT_FEED_QUERY_TOOL_ALIASES.get(entry.tool_id);
      return {
        ...entry,
        ...(toolAliases && toolAliases.length > 0 ? { tool_aliases: toolAliases } : {}),
        family: "live_env" as const,
        creates_assistant_answer: false as const,
      };
    }),
    policy: {
      may_surface_user_text: false,
      may_spawn_worker: true,
      may_call_probe: true,
      may_mutate_sources: false,
    },
    assistant_answer: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    created_at: now,
  };
}
