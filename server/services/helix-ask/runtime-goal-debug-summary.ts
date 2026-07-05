import type {
  HelixRuntimeGoalDebugExport,
  HelixRuntimeGoalSession,
} from "@shared/helix-runtime-goal-session";

export type HelixRuntimeGoalDebugSummary = {
  schema: "helix.runtime_goal.debug_copy_summary.v1";
  goal_id: string;
  job_title: string;
  runtime_agent_provider: string;
  runtime_session_id: string;
  session_status: string;
  status_reason: string | null;
  wake_count: number;
  last_wake_at: string | null;
  last_wake_event_id: string | null;
  session_updated_at: string;
  observed_source_label: string | null;
  observed_source_kind: string | null;
  observed_source_doc_path: string | null;
  observed_source_id: string | null;
  observed_source_freshness_ms: number | null;
  requested_observation_or_lane: string | null;
  wake_relevance_reason: string | null;
  wake_expected_terminal_product: string | null;
  current_progress_summary: string | null;
  next_wake_behavior: string | null;
  wake_timer_status: "armed" | "unarmed";
  wake_timer_ms: number | null;
  terminal_authority_status: string;
  latest_observation_refs: string[];
  latest_receipt_refs: string[];
  provider_terminal_candidate_ref: string | null;
  final_answer_source: string | null;
  terminal_answer_server_authoritative: boolean | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const buildRuntimeGoalDebugSummary = (
  session: HelixRuntimeGoalSession,
  debugExport: HelixRuntimeGoalDebugExport,
): HelixRuntimeGoalDebugSummary => {
  const progress = session.latest_progress_summary ?? debugExport.runtime_goal_progress_summary;
  const source =
    session.latest_source_binding ??
    debugExport.runtime_goal_source_binding ??
    progress?.observed_source ??
    null;
  const wakePlan = session.latest_wake_plan ?? debugExport.runtime_goal_wake_plan;
  const latestWake = debugExport.wake_events[debugExport.wake_events.length - 1] ?? null;
  const terminalAnswerAuthority = debugExport.terminal_answer_authority;
  const terminalAnswerServerAuthoritative =
    typeof terminalAnswerAuthority?.server_authoritative === "boolean"
      ? terminalAnswerAuthority.server_authoritative
      : null;
  return {
    schema: "helix.runtime_goal.debug_copy_summary.v1",
    goal_id: session.goal_id,
    job_title:
      session.job_brief.user_goal_text ||
      session.objective ||
      progress?.job ||
      session.goal_id,
    runtime_agent_provider: session.runtime_agent_provider,
    runtime_session_id: session.runtime_session_id,
    session_status: session.status,
    status_reason: session.status_reason,
    wake_count: session.wake_count,
    last_wake_at: latestWake?.created_at ?? null,
    last_wake_event_id: latestWake?.wake_event_id ?? null,
    session_updated_at: session.updated_at,
    observed_source_label: source?.source_label ?? null,
    observed_source_kind: source?.source_kind ?? null,
    observed_source_doc_path: source?.doc_path ?? null,
    observed_source_id: source?.source_id ?? null,
    observed_source_freshness_ms: source?.source_freshness_ms ?? null,
    requested_observation_or_lane:
      progress?.evidence_used.requested_tool_or_lane ??
      wakePlan?.requested_observation_or_lane ??
      null,
    wake_relevance_reason: wakePlan?.relevance_reason ?? null,
    wake_expected_terminal_product: wakePlan?.expected_terminal_product ?? null,
    current_progress_summary: progress?.current_summary ?? null,
    next_wake_behavior: progress?.next_wake_behavior ?? session.job_brief.expected_wake_behavior,
    wake_timer_status: session.wake_policy.timer_ms !== null ? "armed" : "unarmed",
    wake_timer_ms: session.wake_policy.timer_ms,
    terminal_authority_status: session.terminal_authority_status,
    latest_observation_refs: session.latest_observation_refs,
    latest_receipt_refs: session.latest_receipt_refs,
    provider_terminal_candidate_ref:
      session.latest_provider_terminal_candidate_ref ??
      progress?.evidence_used.provider_terminal_candidate_ref ??
      null,
    final_answer_source: session.latest_final_answer_source,
    terminal_answer_server_authoritative: terminalAnswerServerAuthoritative,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
