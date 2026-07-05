import crypto from "node:crypto";
import type {
  HelixRuntimeGoalSession,
  HelixRuntimeGoalSourceBinding,
  HelixRuntimeGoalWakeAdmissionReason,
  HelixRuntimeGoalWakeAdmissionResult,
  HelixRuntimeGoalWakeCandidate,
  HelixRuntimeGoalWakeCandidateEventKind,
} from "@shared/helix-runtime-goal-session";
import { helixRuntimeGoalSessionStore } from "../agent-providers/goal-runtime-session";

type RecordLike = Record<string, unknown>;

const terminalStatuses = new Set(["completed", "cancelled", "failed"]);
const admittedDedupeKeys = new Map<string, Set<string>>();

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readFiniteNumber = (value: unknown): number | null => {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeEventKind = (value: unknown): HelixRuntimeGoalWakeCandidateEventKind => {
  const raw = readString(value);
  return raw === "visible_source_changed" ||
    raw === "visible_surface_changed" ||
    raw === "timer" ||
    raw === "lane_session_observation" ||
    raw === "live_source_packet" ||
    raw === "manual_resume"
    ? raw
    : "visible_source_changed";
};

const normalizeFreshnessStatus = (value: unknown): HelixRuntimeGoalWakeCandidate["freshness_status"] => {
  const raw = readString(value);
  return raw === "fresh" || raw === "stale" || raw === "unknown" ? raw : "unknown";
};

export const activeRuntimeGoalSessions = (): HelixRuntimeGoalSession[] =>
  helixRuntimeGoalSessionStore
    .listGoalRuntimeSessions()
    .filter((session) => !terminalStatuses.has(session.status))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

export const latestActiveRuntimeGoalSession = (): HelixRuntimeGoalSession | null =>
  activeRuntimeGoalSessions()[0] ?? null;

export const buildRuntimeGoalWakeCandidate = (body: RecordLike): HelixRuntimeGoalWakeCandidate => {
  const snapshot = readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot) ?? {};
  const eventKind = normalizeEventKind(body.event_kind ?? body.eventKind ?? body.kind);
  const docPath =
    readString(body.doc_path ?? body.docPath) ||
    readString(snapshot.active_doc_path ?? snapshot.activeDocPath) ||
    null;
  const activePanelId =
    readString(body.active_panel_id ?? body.activePanelId) ||
    readString(snapshot.active_panel_id ?? snapshot.activePanelId ?? snapshot.activePanel) ||
    null;
  const sourceId = readString(body.source_id ?? body.sourceId) || null;
  const sourceHash = readString(body.source_hash ?? body.sourceHash) || null;
  const sourceLabel =
    readString(body.source_label ?? body.sourceLabel) ||
    docPath ||
    activePanelId ||
    sourceId ||
    null;
  const sourceKind =
    readString(body.source_kind ?? body.sourceKind) ||
    (docPath ? "docs_viewer_visible_surface" : activePanelId ? "workstation_panel" : "unknown");
  const dedupeKey =
    readString(body.dedupe_key ?? body.dedupeKey) ||
    [eventKind, sourceKind, docPath, activePanelId, sourceId, sourceHash].filter(Boolean).join(":") ||
    `wake-candidate:${crypto.randomUUID()}`;
  const observedAtMs = readFiniteNumber(body.observed_at_ms ?? body.observedAtMs) ?? Date.now();
  return {
    schema: "helix.runtime_goal.wake_candidate.v1",
    wake_candidate_id: readString(body.wake_candidate_id ?? body.wakeCandidateId) || `goal-wake-candidate:${crypto.randomUUID()}`,
    goal_id: readString(body.goal_id ?? body.goalId) || null,
    source_kind: sourceKind,
    source_id: sourceId,
    source_label: sourceLabel,
    doc_path: docPath,
    active_panel_id: activePanelId,
    reason: readString(body.reason) || `${eventKind}_candidate`,
    event_kind: eventKind,
    observed_at_ms: observedAtMs,
    dedupe_key: dedupeKey,
    freshness_status: normalizeFreshnessStatus(body.freshness_status ?? body.freshnessStatus),
    source_freshness_ms: readFiniteNumber(body.source_freshness_ms ?? body.sourceFreshnessMs),
    source_hash: sourceHash,
    proposed_tool: readString(body.proposed_tool ?? body.proposedTool) || null,
    requires_user_visible_turn: body.requires_user_visible_turn === false || body.requiresUserVisibleTurn === false ? false : true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const sourceBindingFromWakeCandidate = (
  candidate: HelixRuntimeGoalWakeCandidate,
): HelixRuntimeGoalSourceBinding | null => {
  if (!candidate.doc_path && !candidate.source_id && !candidate.active_panel_id) return null;
  return {
    schema: "helix.runtime_goal.source_binding.v1",
    source_kind: candidate.source_kind,
    active_panel_id: candidate.active_panel_id,
    doc_path: candidate.doc_path,
    source_id: candidate.source_id,
    source_hash: candidate.source_hash,
    source_freshness_ms: candidate.source_freshness_ms,
    source_label: candidate.source_label ?? candidate.doc_path ?? candidate.active_panel_id ?? candidate.source_id,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const admission = (input: {
  status: HelixRuntimeGoalWakeAdmissionResult["status"];
  reason: HelixRuntimeGoalWakeAdmissionReason;
  candidate: HelixRuntimeGoalWakeCandidate;
  goalId: string | null;
  sourceBinding: HelixRuntimeGoalSourceBinding | null;
}): HelixRuntimeGoalWakeAdmissionResult => ({
  schema: "helix.runtime_goal.wake_admission.v1",
  status: input.status,
  reason: input.reason,
  goal_id: input.goalId,
  wake_candidate_id: input.candidate.wake_candidate_id,
  dedupe_key: input.candidate.dedupe_key,
  source_binding: input.sourceBinding,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sessionAllowsCandidate = (
  session: HelixRuntimeGoalSession,
  candidate: HelixRuntimeGoalWakeCandidate,
): HelixRuntimeGoalWakeAdmissionReason | null => {
  if (candidate.event_kind === "manual_resume") {
    return session.wake_policy.manual_resume ? "manual_wake_admitted" : "wake_policy_denied";
  }
  if (candidate.event_kind === "visible_source_changed") {
    return session.wake_policy.document_changed || session.wake_policy.visible_context_changed
      ? "visible_source_changed"
      : "wake_policy_denied";
  }
  if (candidate.event_kind === "visible_surface_changed") {
    return session.wake_policy.visible_context_changed ? "visible_surface_changed" : "wake_policy_denied";
  }
  if (candidate.event_kind === "timer") {
    return session.wake_policy.timer_ms !== null ? "timer_wake_admitted" : "wake_policy_denied";
  }
  if (candidate.event_kind === "lane_session_observation") {
    return session.wake_policy.lane_session_observation ? "visible_surface_changed" : "wake_policy_denied";
  }
  return "wake_policy_denied";
};

export const admitRuntimeGoalWakeCandidate = (
  candidate: HelixRuntimeGoalWakeCandidate,
): { session: HelixRuntimeGoalSession | null; admission: HelixRuntimeGoalWakeAdmissionResult } => {
  const session = candidate.goal_id
    ? helixRuntimeGoalSessionStore.getGoalRuntimeSession(candidate.goal_id)
    : latestActiveRuntimeGoalSession();
  const sourceBinding = sourceBindingFromWakeCandidate(candidate);
  if (!session) {
    return {
      session: null,
      admission: admission({
        status: "rejected",
        reason: "goal_session_not_found",
        candidate,
        goalId: candidate.goal_id,
        sourceBinding,
      }),
    };
  }
  if (terminalStatuses.has(session.status)) {
    return {
      session,
      admission: admission({
        status: "rejected",
        reason: "goal_not_resumable",
        candidate,
        goalId: session.goal_id,
        sourceBinding,
      }),
    };
  }
  if (!sourceBinding && candidate.event_kind !== "manual_resume" && candidate.event_kind !== "timer") {
    return {
      session,
      admission: admission({
        status: "rejected",
        reason: "candidate_missing_source",
        candidate,
        goalId: session.goal_id,
        sourceBinding,
      }),
    };
  }
  const reason = sessionAllowsCandidate(session, candidate);
  if (!reason || reason === "wake_policy_denied") {
    return {
      session,
      admission: admission({
        status: "rejected",
        reason: "wake_policy_denied",
        candidate,
        goalId: session.goal_id,
        sourceBinding,
      }),
    };
  }
  const admittedKeys = admittedDedupeKeys.get(session.goal_id) ?? new Set<string>();
  if (admittedKeys.has(candidate.dedupe_key)) {
    return {
      session,
      admission: admission({
        status: "rejected",
        reason: "duplicate_wake_candidate",
        candidate,
        goalId: session.goal_id,
        sourceBinding,
      }),
    };
  }
  admittedKeys.add(candidate.dedupe_key);
  admittedDedupeKeys.set(session.goal_id, admittedKeys);
  return {
    session,
    admission: admission({
      status: "admitted",
      reason,
      candidate,
      goalId: session.goal_id,
      sourceBinding,
    }),
  };
};

export const clearRuntimeGoalWakeAdmissionDedupe = (): void => {
  admittedDedupeKeys.clear();
};
