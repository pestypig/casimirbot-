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
import type { HelixLiveTranslationOneShotResult } from "@shared/helix-live-translation-lane";

export const agentProvidersRouter = Router();

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

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

agentProvidersRouter.post("/capability-lanes/one-shot", (req: Request, res: Response) => {
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
  const context = buildHelixCapabilityLaneProviderAdapterContext({
    provider,
    body: {
      turn_id: body.turn_id ?? body.turnId,
      capability_lane_call: capabilityLaneCall,
    },
    env: process.env,
  });
  const result = context.one_shot;

  res.json({
    ...result,
    schema: "helix.capability_lane.one_shot_response.v1",
    ok:
      result.requested === true &&
      result.call_results.length > 0 &&
      result.call_results.every((entry) => entry.ok === true),
    agent_runtime: provider.id,
    selected_agent_provider: {
      id: provider.id,
      label: provider.label,
      supports: provider.supports,
    },
    capability_lane_call_results: result.call_results,
    capability_lane_observation_packets: result.observation_packets,
    capability_lane_resolve_traces: result.resolve_traces,
    capability_lane_backend_selections: result.backend_selections,
    capability_lane_debug_events: result.debug_events,
    capability_lane_projection_receipts: context.projection_receipts,
    capability_lane_turn_timeline: context.capability_lane_turn_timeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(context.capability_lane_turn_timeline),
    capability_lane_reentry_status: result.debug_projection.capability_lane_reentry_status,
    model_visible_capability_lane_manifest: context.model_visible_capability_lane_manifest,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/session", (req: Request, res: Response) => {
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
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const capabilityLaneSessionCall =
    body.capability_lane_session_call ?? body.capabilityLaneSessionCall;
  const context = buildHelixCapabilityLaneProviderAdapterContext({
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
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    account_policy: accountPolicy,
  });
});

agentProvidersRouter.post("/capability-lanes/goal-binding", (req: Request, res: Response) => {
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
  const context = buildHelixCapabilityLaneProviderAdapterContext({
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

agentProvidersRouter.post("/capability-lanes/mail-loop", (req: Request, res: Response) => {
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
  const context = buildHelixCapabilityLaneProviderAdapterContext({
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
