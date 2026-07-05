import { Router } from "express";
import type { Request, Response } from "express";
import {
  listHelixAgentProviders,
  resolveDefaultHelixAgentProvider,
  resolveHelixAgentProvider,
} from "../services/helix-ask/agent-providers/registry";
import { resolveHelixRuntimeAgentAccess } from "@shared/helix-account-session";
import { getAccountCapabilityPolicy } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  buildCapabilityLaneProviderTimeline,
  buildHelixCapabilityLaneProviderAdapterContext,
} from "../services/helix-ask/capability-lanes/provider-adapter-context";
import { buildCapabilityLaneTimelineSummary } from "../services/helix-ask/debug/capability-lane-debug-export";
import { routeLiveTranslationObservationToMailLoop } from "../services/helix-ask/capability-lanes/mail-loop-adapter";
import { helixCapabilityLaneSessionStore } from "../services/helix-ask/capability-lanes/session-manager";
import { buildHelixCapabilityLaneSessionDebugSummaries } from "../services/helix-ask/capability-lanes/session-summary";
import { buildHelixCapabilityLaneSessionListTimeline } from "../services/helix-ask/capability-lanes/session-list-timeline";
import type { HelixLiveTranslationOneShotResult } from "@shared/helix-live-translation-lane";
import {
  helixRuntimeGoalSessionStore,
  type GoalRuntimeSessionResult,
} from "../services/helix-ask/agent-providers/goal-runtime-session";
import { buildRuntimeGoalDebugSummary } from "../services/helix-ask/runtime-goal-debug-summary";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type {
  HelixRuntimeGoalReportPolicy,
  HelixRuntimeGoalSessionStatus,
  HelixRuntimeGoalStopPolicy,
  HelixRuntimeGoalWakeEventKind,
} from "@shared/helix-runtime-goal-session";

export const agentProvidersRouter = Router();

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readQueryString = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter(Boolean)
    : typeof value === "string" && value.trim()
      ? value.split(",").map((entry) => entry.trim()).filter(Boolean)
      : [];

const readBodyRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readRuntimeId = (value: unknown): HelixAgentRuntimeId =>
  readString(value) === "codex" || readString(value) === "future" ? (readString(value) as HelixAgentRuntimeId) : "helix";

const runtimeGoalDebugSummaryFor = (result: GoalRuntimeSessionResult) =>
  buildRuntimeGoalDebugSummary(result.session, result.debug_export);

const readGoalReportPolicy = (value: unknown): HelixRuntimeGoalReportPolicy | undefined => {
  const normalized = readString(value);
  return normalized === "report_only_failure" ||
    normalized === "report_only_when_asked" ||
    normalized === "report_summary_every_n_wakes" ||
    normalized === "report_every_terminal_authorized_result"
    ? normalized
    : undefined;
};

const readGoalWakeEventKind = (value: unknown): HelixRuntimeGoalWakeEventKind | undefined => {
  const normalized = readString(value);
  return normalized === "user_message" ||
    normalized === "visible_context_changed" ||
    normalized === "document_changed" ||
    normalized === "account_language_changed" ||
    normalized === "lane_session_observation" ||
    normalized === "tool_receipt_ready" ||
    normalized === "timer" ||
    normalized === "manual_resume" ||
    normalized === "failure" ||
    normalized === "escalation"
    ? normalized
    : undefined;
};

const readGoalStopStatus = (
  value: unknown,
): Extract<HelixRuntimeGoalSessionStatus, "completed" | "cancelled" | "failed"> | undefined => {
  const normalized = readString(value);
  return normalized === "completed" || normalized === "cancelled" || normalized === "failed"
    ? normalized
    : undefined;
};

const readGoalStopPolicy = (value: unknown): Partial<HelixRuntimeGoalStopPolicy> | undefined => {
  const record = readBodyRecord(value);
  const repeatedFailureThreshold = Number(record.repeated_failure_threshold ?? record.repeatedFailureThreshold);
  const staleSourceMs = Number(record.stale_source_ms ?? record.staleSourceMs);
  const policy: Partial<HelixRuntimeGoalStopPolicy> = {};
  if (Number.isFinite(repeatedFailureThreshold) && repeatedFailureThreshold > 0) {
    policy.repeated_failure_threshold = Math.floor(repeatedFailureThreshold);
  }
  if (Number.isFinite(staleSourceMs) && staleSourceMs >= 0) {
    policy.stale_source_ms = Math.floor(staleSourceMs);
  }
  return Object.keys(policy).length ? policy : undefined;
};

agentProvidersRouter.get("/agent-providers", (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const defaultProvider = resolveDefaultHelixAgentProvider();
  const providers = listHelixAgentProviders();
  const visibleProviders = providers.filter((provider) =>
    resolveHelixRuntimeAgentAccess(accountPolicy, provider.id).state === "available",
  );
  const effectiveDefaultProvider =
    visibleProviders.some((provider) => provider.id === defaultProvider.id)
      ? defaultProvider.id
      : visibleProviders[0]?.id ?? defaultProvider.id;
  res.json({
    schema: "helix.agent_providers.v1",
    providers: visibleProviders,
    locked_providers: providers
      .filter((provider) =>
        resolveHelixRuntimeAgentAccess(accountPolicy, provider.id).state === "locked",
      )
      .map((provider) => ({
        ...provider,
        locked: true,
        locked_reason: resolveHelixRuntimeAgentAccess(accountPolicy, provider.id).reason,
      })),
    default_provider: effectiveDefaultProvider,
    default_provider_label:
      visibleProviders.find((provider) => provider.id === effectiveDefaultProvider)?.label ??
      defaultProvider.label,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.get("/goal/runtime-session", (req: Request, res: Response) => {
  const goalId = readQueryString(req.query.goal_id ?? req.query.goalId);
  const sessions = helixRuntimeGoalSessionStore.listGoalRuntimeSessions()
    .filter((session) => !goalId || session.goal_id === goalId);
  res.json({
    schema: "helix.runtime_goal.session_list_response.v1",
    ok: true,
    goal_session_count: sessions.length,
    runtime_goal_sessions: sessions,
    runtime_goal_debug_summaries: sessions.map((session) => {
      const debugExport = helixRuntimeGoalSessionStore.buildGoalDebugExport(session.goal_id);
      return debugExport ? buildRuntimeGoalDebugSummary(session, debugExport) : null;
    }).filter(Boolean),
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  });
});

agentProvidersRouter.get("/goal/runtime-session/:goalId/debug-export", (req: Request, res: Response) => {
  const debugExport = helixRuntimeGoalSessionStore.buildGoalDebugExport(req.params.goalId);
  if (!debugExport) {
    return res.status(404).json({
      schema: "helix.runtime_goal.debug_export_response.v1",
      ok: false,
      error: "goal_session_not_found",
      goal_id: req.params.goalId,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const session = helixRuntimeGoalSessionStore.getGoalRuntimeSession(req.params.goalId);
  const runtimeGoalDebugSummary = session
    ? buildRuntimeGoalDebugSummary(session, debugExport)
    : null;
  return res.json({
    ...debugExport,
    schema: "helix.runtime_goal.debug_export_response.v1",
    ok: true,
    debug_export: debugExport,
    runtime_goal_debug_summary: runtimeGoalDebugSummary,
  });
});

agentProvidersRouter.post("/goal/runtime-session", async (req: Request, res: Response) => {
  const body = readBodyRecord(req.body);
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const runtimeAgentProvider = readRuntimeId(body.runtime_agent_provider ?? body.agent_runtime ?? body.agentRuntime);
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, runtimeAgentProvider);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.runtime_goal.session_start_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      blocked_reason: "permission_revoked",
      locked_reason: providerAccess.reason,
      runtime_agent_provider: runtimeAgentProvider,
      account_policy: accountPolicy,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const result = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
    objective: readString(body.objective ?? body.goal ?? body.prompt),
    runtimeAgentProvider,
    goalId: readString(body.goal_id ?? body.goalId) || null,
    runtimeSessionId: readString(body.runtime_session_id ?? body.runtimeSessionId) || null,
    allowedLanes: readStringArray(body.allowed_lanes ?? body.allowedLanes),
    allowedWorkstationTools: readStringArray(body.allowed_workstation_tools ?? body.allowedWorkstationTools),
    stopPolicy: readGoalStopPolicy(body.stop_policy ?? body.stopPolicy),
    reportPolicy: readGoalReportPolicy(body.report_policy ?? body.reportPolicy),
  });
  res.status(result.ok ? 200 : 409).json({
    schema: "helix.runtime_goal.session_start_response.v1",
    ...result,
    runtime_goal_debug_summary: runtimeGoalDebugSummaryFor(result),
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  });
});

agentProvidersRouter.post("/goal/runtime-session/:goalId/resume", async (req: Request, res: Response) => {
  const body = readBodyRecord(req.body);
  try {
    const session = helixRuntimeGoalSessionStore.getGoalRuntimeSession(req.params.goalId);
    if (!session) throw new Error(`Goal session not found: ${req.params.goalId}`);
    const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
    const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, session.runtime_agent_provider);
    if (providerAccess.state !== "available") {
      const blocked = helixRuntimeGoalSessionStore.blockGoalRuntimeSession({
        goalId: req.params.goalId,
        reason: "permission_revoked",
      });
      return res.status(403).json({
        schema: "helix.runtime_goal.session_resume_response.v1",
        ...blocked,
        runtime_goal_debug_summary: runtimeGoalDebugSummaryFor(blocked),
        error: "runtime_agent_locked_by_account_policy",
        locked_reason: providerAccess.reason,
        account_policy: accountPolicy,
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
    const result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
      goalId: req.params.goalId,
      wakeEventKind: readGoalWakeEventKind(body.wake_event_kind ?? body.wakeEventKind),
      turnId: readString(body.turn_id ?? body.turnId) || null,
      body,
    });
    return res.status(result.ok ? 200 : 409).json({
      schema: "helix.runtime_goal.session_resume_response.v1",
      ...result,
      runtime_goal_debug_summary: runtimeGoalDebugSummaryFor(result),
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  } catch (error) {
    return res.status(404).json({
      schema: "helix.runtime_goal.session_resume_response.v1",
      ok: false,
      error: error instanceof Error ? error.message : "goal_session_not_found",
      goal_id: req.params.goalId,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
});

agentProvidersRouter.post("/goal/runtime-session/:goalId/stop", (req: Request, res: Response) => {
  const body = readBodyRecord(req.body);
  try {
    const result = helixRuntimeGoalSessionStore.stopGoalRuntimeSession({
      goalId: req.params.goalId,
      status: readGoalStopStatus(body.status),
      reason: readString(body.reason) || null,
    });
    return res.json({
      schema: "helix.runtime_goal.session_stop_response.v1",
      ...result,
      runtime_goal_debug_summary: runtimeGoalDebugSummaryFor(result),
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  } catch (error) {
    return res.status(404).json({
      schema: "helix.runtime_goal.session_stop_response.v1",
      ok: false,
      error: error instanceof Error ? error.message : "goal_session_not_found",
      goal_id: req.params.goalId,
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
});

agentProvidersRouter.get("/capability-lanes/session", (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const laneSessionId = readQueryString(req.query.lane_session_id ?? req.query.laneSessionId);
  const laneId = readQueryString(req.query.lane_id ?? req.query.laneId);
  const agentRuntime = readQueryString(req.query.agent_runtime ?? req.query.agentRuntime);
  const sourceId = readQueryString(req.query.source_id ?? req.query.sourceId);
  const sourceHash = readQueryString(req.query.source_hash ?? req.query.sourceHash);
  const sourceBindingKey = readQueryString(req.query.source_binding_key ?? req.query.sourceBindingKey);
  const sourceIdentityKey = readQueryString(req.query.source_identity_key ?? req.query.sourceIdentityKey);
  const latestSourceIdentityKey = readQueryString(
    req.query.latest_source_identity_key ?? req.query.latestSourceIdentityKey,
  );
  const projectionTarget = readQueryString(req.query.projection_target ?? req.query.projectionTarget);
  const accountLocale = readQueryString(req.query.account_locale ?? req.query.accountLocale);
  const targetLanguage = readQueryString(req.query.target_language ?? req.query.targetLanguage);
  const sessions = helixCapabilityLaneSessionStore.list()
    .filter((session) => {
      if (laneSessionId && session.lane_session_id !== laneSessionId) return false;
      if (laneId && session.lane_id !== laneId) return false;
      if (agentRuntime && session.selected_runtime_agent_provider !== agentRuntime) return false;
      if (sourceId && session.source_binding.source_id !== sourceId) return false;
      if (sourceHash && session.source_binding.source_hash !== sourceHash) return false;
      if (sourceBindingKey && session.source_binding.source_binding_key !== sourceBindingKey) return false;
      if (sourceIdentityKey && session.source_binding.source_identity_key !== sourceIdentityKey) return false;
      if (
        latestSourceIdentityKey &&
        (session.source_binding.latest_source_identity_key ?? session.source_binding.source_identity_key) !==
          latestSourceIdentityKey
      ) {
        return false;
      }
      if (projectionTarget && session.source_binding.projection_target !== projectionTarget) return false;
      if (
        accountLocale &&
        session.source_binding.account_locale?.toLowerCase() !== accountLocale.toLowerCase()
      ) {
        return false;
      }
      if (
        targetLanguage &&
        session.source_binding.target_language?.toLowerCase() !== targetLanguage.toLowerCase()
      ) {
        return false;
      }
      return resolveHelixRuntimeAgentAccess(
        accountPolicy,
        session.selected_runtime_agent_provider,
      ).state === "available";
    });
  const summaries = buildHelixCapabilityLaneSessionDebugSummaries(sessions);
  const timeline = buildHelixCapabilityLaneSessionListTimeline(summaries);
  const sessionRuntimeProviderIds = Array.from(new Set(
    sessions.map((session) => session.selected_runtime_agent_provider),
  ));
  const providerDescriptors = listHelixAgentProviders();
  const sessionRuntimeProviders = sessionRuntimeProviderIds.map((providerId) => {
    const descriptor = providerDescriptors.find((provider) => provider.id === providerId);
    return {
      id: providerId,
      label: descriptor?.label ?? providerId,
      supports: descriptor?.supports ?? null,
    };
  });

  res.json({
    schema: "helix.capability_lane.session_list_response.v1",
    ok: true,
    session_count: sessions.length,
    adapter_boundary: "helix_agent_provider_edge",
    selected_runtime_agent_providers: sessionRuntimeProviderIds,
    selected_agent_providers: sessionRuntimeProviders,
    filters: {
      lane_session_id: laneSessionId || null,
      lane_id: laneId || null,
      agent_runtime: agentRuntime || null,
      source_id: sourceId || null,
      source_hash: sourceHash || null,
      source_binding_key: sourceBindingKey || null,
      source_identity_key: sourceIdentityKey || null,
      latest_source_identity_key: latestSourceIdentityKey || null,
      projection_target: projectionTarget || null,
      account_locale: accountLocale || null,
      target_language: targetLanguage || null,
    },
    capability_lane_sessions: sessions,
    capability_lane_session_debug_summaries: summaries,
    capability_lane_turn_timeline: timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(timeline),
    context_role: "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/one-shot", async (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, provider.id);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.capability_lane.one_shot_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      locked_reason: providerAccess.reason,
      agent_runtime: provider.id,
      selected_agent_provider: {
        id: provider.id,
        label: provider.label,
        supports: provider.supports,
      },
      account_policy: accountPolicy,
      capability_lane_call_results: [],
      capability_lane_observation_packets: [],
      capability_lane_resolve_traces: [],
      capability_lane_backend_selections: [],
      capability_lane_debug_events: [],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const capabilityLaneCall = body.capability_lane_call ?? body.capabilityLaneCall;
  const context = await buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: body.turn_id ?? body.turnId,
      capability_lane_call: capabilityLaneCall,
    },
    env: process.env,
  });
  const result = context.one_shot;
  const publicCapabilityLaneCallResults = result.call_results.filter((entry) => entry.ok === true);
  const publicCapabilityLaneObservationPackets = result.observation_packets.filter((packet) =>
    packet.status === "succeeded",
  );
  const publicOneShotObservationReentryRequired =
    publicCapabilityLaneObservationPackets.length > 0 &&
    publicCapabilityLaneCallResults.length > 0;
  const publicCapabilityLaneReentryStatus = publicOneShotObservationReentryRequired
    ? result.debug_projection.capability_lane_reentry_status
    : "not_requested";
  const publicCapabilityLaneTurnTimeline = publicOneShotObservationReentryRequired
    ? context.capability_lane_turn_timeline
    : context.capability_lane_turn_timeline.filter((entry) => readString(entry.stage) === "lane_visible");
  const publicCapabilityLaneProjectionReceipts = publicOneShotObservationReentryRequired
    ? context.projection_receipts
    : [];

  res.json({
    ...result,
    schema: "helix.capability_lane.one_shot_response.v1",
    ok:
      result.requested === true &&
      publicCapabilityLaneCallResults.length > 0 &&
      publicCapabilityLaneCallResults.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_call_results: publicCapabilityLaneCallResults,
    capability_lane_observation_packets: publicCapabilityLaneObservationPackets,
    capability_lane_resolve_traces: result.resolve_traces,
    capability_lane_backend_selections: result.backend_selections,
    capability_lane_debug_events: result.debug_events,
    capability_lane_projection_receipts: publicCapabilityLaneProjectionReceipts,
    capability_lane_turn_timeline: publicCapabilityLaneTurnTimeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(publicCapabilityLaneTurnTimeline),
    capability_lane_reentry_status: publicCapabilityLaneReentryStatus,
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/session", async (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, provider.id);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.capability_lane.session_control_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      locked_reason: providerAccess.reason,
      agent_runtime: provider.id,
      selected_agent_provider: {
        id: provider.id,
        label: provider.label,
        supports: provider.supports,
      },
      account_policy: accountPolicy,
      capability_lane_session_results: [],
      capability_lane_session_debug_summaries: [],
      context_role: "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const capabilityLaneSessionCall =
    body.capability_lane_session_call ?? body.capabilityLaneSessionCall;
  const context = await buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: body.turn_id ?? body.turnId,
      capability_lane_session_call: capabilityLaneSessionCall,
    },
    env: process.env,
  });
  const result = context.sessions;

  res.json({
    ...result,
    schema: "helix.capability_lane.session_control_response.v1",
    ok:
      result.requested === true &&
      result.session_results.length > 0 &&
      result.session_results.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_session_results: result.session_results,
    capability_lane_session_debug_summaries: result.session_debug_summaries,
    capability_lane_turn_timeline: context.capability_lane_turn_timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(context.capability_lane_turn_timeline),
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    context_role: "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.get("/capability-lanes/goal-binding", async (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const body = {
    agent_runtime: req.query.agent_runtime ?? req.query.agentRuntime,
  };
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, provider.id);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.capability_lane.goal_binding_list_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      locked_reason: providerAccess.reason,
      agent_runtime: provider.id,
      selected_agent_provider: {
        id: provider.id,
        label: provider.label,
        supports: provider.supports,
      },
      account_policy: accountPolicy,
      capability_lane_goal_bindings: [],
      capability_lane_goal_binding_results: [],
      capability_lane_goal_binding_debug_summaries: [],
      capability_lane_mail_loop_debug_summaries: [],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }

  const goalBindingId = readQueryString(req.query.goal_binding_id ?? req.query.goalBindingId);
  const goalId = readQueryString(req.query.goal_id ?? req.query.goalId);
  const laneSessionId = readQueryString(req.query.lane_session_id ?? req.query.laneSessionId);
  const context = await buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: req.query.turn_id ?? req.query.turnId,
      capability_lane_goal_binding_call: {
        action: "list",
        goal_binding_id: goalBindingId || null,
        goal_id: goalId || null,
        lane_session_id: laneSessionId || null,
      },
    },
    env: process.env,
  });
  const result = context.goal_bindings;
  const goalBindings = result.goal_binding_results
    .map((entry) => entry.goal_binding)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  res.json({
    ...result,
    schema: "helix.capability_lane.goal_binding_list_response.v1",
    ok: true,
    goal_binding_count: goalBindings.length,
    adapter_boundary: "helix_agent_provider_edge",
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    filters: {
      goal_binding_id: goalBindingId || null,
      goal_id: goalId || null,
      lane_session_id: laneSessionId || null,
      agent_runtime: provider.id,
    },
    capability_lane_goal_bindings: goalBindings,
    capability_lane_goal_binding_results: result.goal_binding_results,
    capability_lane_goal_binding_debug_summaries: result.goal_binding_debug_summaries,
    capability_lane_mail_loop_debug_summaries:
      context.debug_projection.capability_lane_mail_loop_debug_summaries,
    capability_lane_turn_timeline: context.capability_lane_turn_timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(context.capability_lane_turn_timeline),
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    context_role: "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/goal-binding", async (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, provider.id);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.capability_lane.goal_binding_control_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      locked_reason: providerAccess.reason,
      agent_runtime: provider.id,
      selected_agent_provider: {
        id: provider.id,
        label: provider.label,
        supports: provider.supports,
      },
      account_policy: accountPolicy,
      capability_lane_goal_binding_results: [],
      capability_lane_goal_binding_debug_summaries: [],
      capability_lane_mail_loop_debug_summaries: [],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const capabilityLaneGoalBindingCall =
    body.capability_lane_goal_binding_call ?? body.capabilityLaneGoalBindingCall;
  const context = await buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: body.turn_id ?? body.turnId,
      capability_lane_goal_binding_call: capabilityLaneGoalBindingCall,
    },
    env: process.env,
  });
  const result = context.goal_bindings;

  res.json({
    ...result,
    schema: "helix.capability_lane.goal_binding_control_response.v1",
    ok:
      result.requested === true &&
      result.goal_binding_results.length > 0 &&
      result.goal_binding_results.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_goal_binding_results: result.goal_binding_results,
    capability_lane_goal_binding_debug_summaries: result.goal_binding_debug_summaries,
    capability_lane_mail_loop_debug_summaries:
      context.debug_projection.capability_lane_mail_loop_debug_summaries,
    capability_lane_turn_timeline: context.capability_lane_turn_timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(context.capability_lane_turn_timeline),
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/mail-loop", async (req: Request, res: Response) => {
  const accountPolicy = getAccountCapabilityPolicy(readHelixSessionCookie(req.headers.cookie));
  const body = req.body && typeof req.body === "object"
    ? (req.body as Record<string, unknown>)
    : {};
  const provider = resolveHelixAgentProvider({
    body,
    headers: req.headers,
  });
  const providerAccess = resolveHelixRuntimeAgentAccess(accountPolicy, provider.id);
  if (providerAccess.state !== "available") {
    return res.status(403).json({
      schema: "helix.capability_lane.mail_loop_response.v1",
      ok: false,
      error: "runtime_agent_locked_by_account_policy",
      locked_reason: providerAccess.reason,
      agent_runtime: provider.id,
      selected_agent_provider: {
        id: provider.id,
        label: provider.label,
        supports: provider.supports,
      },
      account_policy: accountPolicy,
      capability_lane_mail_loop_results: [],
      capability_lane_mail_loop_debug_summaries: [],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }

  const capabilityLaneCall = body.capability_lane_call ?? body.capabilityLaneCall;
  const turnId = body.turn_id ?? body.turnId;
  const context = await buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: turnId,
      capability_lane_call: capabilityLaneCall,
    },
    env: process.env,
  });
  const threadId =
    readString(body.thread_id ?? body.threadId) ||
    readString(turnId) ||
    "capability-lane-mail-loop";
  const roomId = readString(body.room_id ?? body.roomId) || null;
  const environmentId = readString(body.environment_id ?? body.environmentId) || null;
  const objectiveText = readString(body.objective_text ?? body.objectiveText) || null;
  const laneSessionIdFallback = readString(body.lane_session_id ?? body.laneSessionId);
  const results = context.one_shot.call_results
    .filter((entry) => readString(entry.capability) === "live_translation.translate_text")
    .map((entry) => {
      const translationResult = entry as HelixLiveTranslationOneShotResult;
      const laneSessionId =
        laneSessionIdFallback ||
        readString(translationResult.observation?.lane_session_id) ||
        readString(translationResult.observation_packet?.state_delta?.live_translation_chunk?.lane_session_id);
      if (!laneSessionId) {
        return null;
      }
      return routeLiveTranslationObservationToMailLoop({
        sessionStore: helixCapabilityLaneSessionStore,
        laneSessionId,
        translationResult,
        threadId,
        roomId,
        environmentId,
        objectiveText,
      });
    });
  const mailLoopResults = results.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const mailLoopDebugSummaries = mailLoopResults.map((entry) => entry.debug_summary);
  const timeline = buildCapabilityLaneProviderTimeline({
    provider,
    manifest: context.model_visible_capability_lane_manifest,
    oneShot: context.one_shot,
    projectionReceipts: context.projection_receipts,
    sessions: context.sessions,
    mailLoopDebugSummaries,
    goalBindings: context.goal_bindings,
    goalDispatchPlans: context.debug_projection.capability_lane_goal_dispatch_plans,
    goalDispatchAdmissions: context.debug_projection.capability_lane_goal_dispatch_admissions,
    goalDispatchReadiness: context.debug_projection.capability_lane_goal_dispatch_readiness,
  });

  res.json({
    schema: "helix.capability_lane.mail_loop_response.v1",
    ok:
      context.one_shot.requested === true &&
      mailLoopResults.length > 0 &&
      mailLoopResults.every((entry) => entry.ok === true),
    requested: context.one_shot.requested,
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_call_results: context.one_shot.call_results,
    capability_lane_observation_packets: context.one_shot.observation_packets,
    capability_lane_projection_receipts: context.projection_receipts,
    capability_lane_mail_loop_results: mailLoopResults,
    capability_lane_mail_loop_debug_summaries: mailLoopDebugSummaries,
    capability_lane_turn_timeline: timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(timeline),
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});
