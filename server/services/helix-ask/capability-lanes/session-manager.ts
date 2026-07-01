import crypto from "node:crypto";
import type {
  HelixCapabilityLaneSession,
  HelixCapabilityLaneSessionAction,
  HelixCapabilityLaneSessionEvent,
  HelixCapabilityLaneSessionPermissions,
  HelixCapabilityLaneSessionResult,
  HelixCapabilityLaneSessionSourceBinding,
} from "@shared/helix-capability-lane-session";
import {
  HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA,
  HELIX_CAPABILITY_LANE_SESSION_SCHEMA,
} from "@shared/helix-capability-lane-session";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { listHelixCapabilityLanes, resolveHelixCapabilityLaneRequest } from "./registry";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sessionPermissionsFor = (provider: HelixAgentProvider): HelixCapabilityLaneSessionPermissions => ({
  read: provider.permissionProfile?.allows.read ?? true,
  observe: provider.permissionProfile?.allows.observe ?? true,
  act: provider.permissionProfile?.allows.act ?? false,
  write: false,
  shell: false,
  code_mutation: false,
});

const eventFor = (input: {
  laneSessionId: string;
  laneId: HelixCapabilityLaneId;
  selectedRuntimeAgentProvider: HelixAgentProvider["id"];
  selectedBackendProvider: string | null;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  action: HelixCapabilityLaneSessionAction;
  status: HelixCapabilityLaneSession["status"];
  reason: string;
  atMs: number;
  sourceId?: string | null;
  observationRef?: string | null;
}): HelixCapabilityLaneSessionEvent => ({
  schema: HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA,
  event_id: `${input.laneSessionId}:${input.action}:${input.atMs}`,
  lane_session_id: input.laneSessionId,
  lane_id: input.laneId,
  selected_runtime_agent_provider: input.selectedRuntimeAgentProvider,
  selected_backend_provider: input.selectedBackendProvider,
  backend_selection_decision: input.backendSelectionDecision,
  action: input.action,
  status: input.status,
  at_ms: input.atMs,
  reason: input.reason,
  source_id: normalizeText(input.sourceId) || null,
  observation_ref: normalizeText(input.observationRef) || null,
  terminal_authority_status: input.observationRef
    ? "pending_helix_terminal_authority"
    : "not_terminal_authority",
  reentry_required: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const blocked = (
  action: HelixCapabilityLaneSessionAction,
  blockedReason: string,
): HelixCapabilityLaneSessionResult => ({
  ok: false,
  action,
  lane_session: null,
  blocked_reason: blockedReason,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export type HelixCapabilityLaneSessionStore = ReturnType<typeof createHelixCapabilityLaneSessionStore>;

export const createHelixCapabilityLaneSessionStore = () => {
  const sessions = new Map<string, HelixCapabilityLaneSession>();

  const start = (input: {
    provider: HelixAgentProvider;
    laneId: HelixCapabilityLaneId;
    sourceBinding: HelixCapabilityLaneSessionSourceBinding;
    env?: NodeJS.ProcessEnv;
    nowMs?: number;
    laneSessionId?: string | null;
    requestedBackendProvider?: string | null;
  }): HelixCapabilityLaneSessionResult => {
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: input.laneId,
      requestedBackendProvider: input.requestedBackendProvider,
      env: input.env,
    });
    const manifest = listHelixCapabilityLanes({
      provider: input.provider,
      env: input.env,
    });
    const lane = manifest.lanes.find((candidate) => candidate.lane_id === input.laneId);
    if (!lane) return blocked("start", "unknown_capability_lane");
    if (!lane.requestable_by_runtime_provider) return blocked("start", lane.status_reason);
    if (!lane.session_contract.supported) return blocked("start", "capability_lane_session_not_supported");
    if (!normalizeText(input.sourceBinding.source_id)) return blocked("start", "missing_source_binding");

    const nowMs = input.nowMs ?? Date.now();
    const laneSessionId =
      normalizeText(input.laneSessionId) ||
      `lane_session:${input.laneId}:${crypto.randomUUID()}`;
    const event = eventFor({
      laneSessionId,
      laneId: input.laneId,
      selectedRuntimeAgentProvider: input.provider.id,
      selectedBackendProvider: trace.selected_backend_provider,
      backendSelectionDecision: trace.backend_selection_decision,
      action: "start",
      status: "running",
      reason: "lane_session_started",
      atMs: nowMs,
      sourceId: input.sourceBinding.source_id,
    });
    const session: HelixCapabilityLaneSession = {
      schema: HELIX_CAPABILITY_LANE_SESSION_SCHEMA,
      lane_session_id: laneSessionId,
      lane_id: input.laneId,
      selected_runtime_agent_provider: input.provider.id,
      selected_backend_provider: trace.selected_backend_provider,
      backend_selection_decision: trace.backend_selection_decision,
      status: "running",
      health: "healthy",
      source_binding: {
        ...input.sourceBinding,
        source_id: normalizeText(input.sourceBinding.source_id),
      },
      permissions: sessionPermissionsFor(input.provider),
      created_at_ms: nowMs,
      updated_at_ms: nowMs,
      last_observation_ref: null,
      debug_history: [event],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    sessions.set(laneSessionId, session);
    return {
      ok: true,
      action: "start",
      lane_session: session,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const transition = (input: {
    laneSessionId: string;
    action: Exclude<HelixCapabilityLaneSessionAction, "start">;
    nowMs?: number;
    reason?: string | null;
  }): HelixCapabilityLaneSessionResult => {
    const session = sessions.get(input.laneSessionId);
    if (!session) return blocked(input.action, "unknown_lane_session");
    if (session.status === "stopped") return blocked(input.action, "lane_session_already_stopped");

    const nowMs = input.nowMs ?? Date.now();
    const status = input.action === "pause"
      ? "paused"
      : input.action === "resume"
        ? "running"
        : "stopped";
    const health = status === "running"
      ? "healthy"
      : status === "paused"
        ? "degraded"
        : "stopped";
    const event = eventFor({
      laneSessionId: input.laneSessionId,
      laneId: session.lane_id,
      selectedRuntimeAgentProvider: session.selected_runtime_agent_provider,
      selectedBackendProvider: session.selected_backend_provider,
      backendSelectionDecision: session.backend_selection_decision,
      action: input.action,
      status,
      reason: normalizeText(input.reason) || `lane_session_${input.action}`,
      atMs: nowMs,
      sourceId: session.source_binding.source_id,
    });
    const updated: HelixCapabilityLaneSession = {
      ...session,
      status,
      health,
      updated_at_ms: nowMs,
      debug_history: [...session.debug_history, event],
    };
    sessions.set(input.laneSessionId, updated);
    return {
      ok: true,
      action: input.action,
      lane_session: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const recordObservation = (input: {
    laneSessionId: string;
    observationRef: string;
    nowMs?: number;
  }): HelixCapabilityLaneSessionResult => {
    const session = sessions.get(input.laneSessionId);
    if (!session) return blocked("resume", "unknown_lane_session");
    const observationRef = normalizeText(input.observationRef);
    if (!observationRef) return blocked("resume", "missing_observation_ref");
    const nowMs = input.nowMs ?? Date.now();
    const event = eventFor({
      laneSessionId: input.laneSessionId,
      laneId: session.lane_id,
      selectedRuntimeAgentProvider: session.selected_runtime_agent_provider,
      selectedBackendProvider: session.selected_backend_provider,
      backendSelectionDecision: session.backend_selection_decision,
      action: "resume",
      status: session.status,
      reason: "lane_session_observation_recorded",
      atMs: nowMs,
      sourceId: session.source_binding.source_id,
      observationRef,
    });
    const updated: HelixCapabilityLaneSession = {
      ...session,
      health: session.status === "running" ? "healthy" : session.health,
      updated_at_ms: nowMs,
      last_observation_ref: observationRef,
      debug_history: [...session.debug_history, event],
    };
    sessions.set(input.laneSessionId, updated);
    return {
      ok: true,
      action: "resume",
      lane_session: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  return {
    start,
    pause: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "pause" }),
    resume: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "resume" }),
    stop: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "stop" }),
    recordObservation,
    get: (laneSessionId: string) => sessions.get(laneSessionId) ?? null,
    list: () => Array.from(sessions.values()),
    clear: () => sessions.clear(),
  };
};

export const helixCapabilityLaneSessionStore = createHelixCapabilityLaneSessionStore();
