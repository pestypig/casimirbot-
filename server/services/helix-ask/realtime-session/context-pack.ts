import crypto from "node:crypto";
import {
  HELIX_REALTIME_STAGE_PLAY_CONTEXT_PACK_SCHEMA,
  type HelixRealtimeStagePlayContextItemV1,
  type HelixRealtimeStagePlayContextPackV1,
  type HelixRealtimeStagePlayRejectedRefV1,
  type HelixRealtimeStagePlaySourceIdentityV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import { buildStagePlayLiveSourceConversationContextPack } from "../../stage-play/stage-play-live-source-conversation-store";
import {
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
} from "../../stage-play/stage-play-goal-context-store";
import { buildSituationContextPack } from "../../situation-room/situation-context-pack";
import { helixRuntimeGoalSessionStore } from "../agent-providers/goal-runtime-session";
import type { HelixRuntimeGoalAccountScope } from "../runtime-goals/runtime-goal-account-binding";

const CONTEXT_FRESHNESS_MS = 30_000;
const CONVERSATION_MAX_AGE_MS = 30 * 60_000;
const CONSTRAINT_MAX_AGE_MS = 24 * 60 * 60_000;
const SOURCE_STATUS_MAX_AGE_MS = 5 * 60_000;
const MAX_SUMMARY_CHARS = 280;
const MAX_CONSTRAINTS = 6;
const MAX_QUESTIONS = 6;
const MAX_ANSWERS = 4;
const MAX_GOAL_SUMMARIES = 4;
const MAX_SOURCES = 8;
const MAX_EVIDENCE_REFS = 32;

const hash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const clip = (value: unknown, limit = MAX_SUMMARY_CHARS): string => {
  const normalized = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return normalized.length > limit
    ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`
    : normalized;
};

const safeRef = (value: unknown, limit = 260): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > limit) return null;
  if (/\b(?:api[_-]?key|authorization|bearer|secret|password|token|cookie)\b/i.test(normalized)) {
    return null;
  }
  if (/\b(?:sk|sess|key)-[A-Za-z0-9_-]{16,}\b/.test(normalized)) return null;
  return /^[A-Za-z0-9._:/@#%+?=&(), -]+$/.test(normalized) ? normalized : null;
};

const unique = (values: Array<string | null | undefined>, limit = Number.MAX_SAFE_INTEGER): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).slice(0, limit);

const readPrefixedRef = (refs: string[], prefix: string): string | null =>
  refs.map((ref) => safeRef(ref)).find((ref): ref is string => Boolean(ref?.startsWith(prefix))) ?? null;

const toMs = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const boundedItem = (input: {
  ref: string;
  summary: unknown;
  observedAtMs?: number | null;
  evidenceRefs?: string[];
}): HelixRealtimeStagePlayContextItemV1 => ({
  ref: input.ref,
  summary: clip(input.summary),
  observed_at_ms: input.observedAtMs ?? null,
  evidence_refs: unique(input.evidenceRefs ?? [], 8),
});

const readSafeSourceBinding = (
  sourceBinding: Record<string, unknown> | null | undefined,
): HelixRealtimeStagePlaySourceIdentityV1[] => {
  if (!sourceBinding) return [];
  const candidates = [
    { key: "source_id", kind: safeRef(sourceBinding.source_kind) ?? "realtime_source" },
    { key: "panel_id", kind: "workstation_panel" },
    { key: "focus_panel_id", kind: "focused_workstation_panel" },
    { key: "document_ref", kind: "workstation_document" },
    { key: "document_path", kind: "workstation_document" },
  ];
  const seen = new Set<string>();
  const sources: HelixRealtimeStagePlaySourceIdentityV1[] = [];
  for (const candidate of candidates) {
    const value = safeRef(sourceBinding[candidate.key]);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    sources.push({
      source_ref: value,
      source_kind: candidate.kind,
      status: "observed_binding",
      observed_at_ms: null,
      evidence_refs: [value],
    });
  }
  return sources.slice(0, MAX_SOURCES);
};

const reject = (
  target: HelixRealtimeStagePlayRejectedRefV1[],
  ref: string,
  reason: HelixRealtimeStagePlayRejectedRefV1["reason"],
): void => {
  if (target.some((entry) => entry.ref === ref && entry.reason === reason)) return;
  target.push({ ref, reason });
};

export const buildHelixRealtimeStagePlayContextPack = (input: {
  realtimeSessionId: string;
  threadId: string;
  sourceBinding?: Record<string, unknown> | null;
  runtimeGoalAccountScope?: HelixRuntimeGoalAccountScope | null;
  nowMs?: number;
}): HelixRealtimeStagePlayContextPackV1 => {
  const nowMs = input.nowMs ?? Date.now();
  const conversation = buildStagePlayLiveSourceConversationContextPack({
    threadId: input.threadId,
    limit: 40,
    now: new Date(nowMs).toISOString(),
  });
  const goalSessions = listStagePlayAgentGoalSessions({ threadId: input.threadId, limit: 12 })
    .filter((session) =>
      !session.constructRefs.includes("runtime-goal-stage-play-projection") ||
      helixRuntimeGoalSessionStore.isGoalRuntimeSessionVisibleToAccountScope({
        goalId: session.goalId,
        accountScope: input.runtimeGoalAccountScope,
      }));
  const goalUpdates = listStagePlayGoalContextUpdates({ threadId: input.threadId, limit: 48 });
  const rejectedRefs: HelixRealtimeStagePlayRejectedRefV1[] = [];
  const freshGoalUpdates = goalUpdates.filter((update) => {
    const ref = safeRef(update.updateId) ?? `goal-context:${hash(update.updateId).slice(0, 16)}`;
    if (update.freshness.status !== "fresh") {
      reject(
        rejectedRefs,
        ref,
        update.freshness.status === "stale"
          ? "stale"
          : update.freshness.status === "blocked"
            ? "blocked"
            : "unknown_freshness",
      );
      return false;
    }
    const staleAfterMs = update.freshness.staleAfterMs;
    if (
      typeof staleAfterMs === "number" &&
      staleAfterMs >= 0 &&
      nowMs > update.freshness.observedAtMs + staleAfterMs
    ) {
      reject(rejectedRefs, ref, "stale");
      return false;
    }
    return true;
  });

  let situation: ReturnType<typeof buildSituationContextPack> | null = null;
  try {
    situation = buildSituationContextPack({ threadId: input.threadId, limit: 40 });
  } catch {
    situation = null;
  }

  const eventIsFresh = (createdAt: string, maxAgeMs: number): boolean => {
    const observedAtMs = toMs(createdAt);
    return observedAtMs === null || observedAtMs >= nowMs - maxAgeMs;
  };
  for (const event of conversation.events) {
    const maxAgeMs = event.intent === "constrain_policy" || event.intent === "voice_preference_update"
      ? CONSTRAINT_MAX_AGE_MS
      : CONVERSATION_MAX_AGE_MS;
    if (!eventIsFresh(event.createdAt, maxAgeMs)) reject(rejectedRefs, event.eventId, "stale");
  }

  const recentQuestions = conversation.events
    .filter((event) => event.source === "user_text" || event.source === "user_voice")
    .filter((event) => eventIsFresh(event.createdAt, CONVERSATION_MAX_AGE_MS))
    .slice(-MAX_QUESTIONS)
    .map((event) =>
      boundedItem({
        ref: event.eventId,
        summary: event.textPreview,
        observedAtMs: toMs(event.createdAt),
        evidenceRefs: event.evidenceRefs,
      })
    );
  const groundedAnswers = conversation.recentAssistantAnswers
    .filter((event) => eventIsFresh(event.createdAt, CONVERSATION_MAX_AGE_MS))
    .slice(-MAX_ANSWERS)
    .map((event) =>
      boundedItem({
        ref: event.eventId,
        summary: event.textPreview,
        observedAtMs: toMs(event.createdAt),
        evidenceRefs: event.evidenceRefs,
      })
    );
  const activeConstraints = conversation.activeConstraints
    .filter((event) => eventIsFresh(event.createdAt, CONSTRAINT_MAX_AGE_MS))
    .slice(-MAX_CONSTRAINTS)
    .map((event) =>
      boundedItem({
        ref: event.eventId,
        summary: event.textPreview,
        observedAtMs: toMs(event.createdAt),
        evidenceRefs: event.evidenceRefs,
      })
    );

  const activeGoalSessions = goalSessions
    .filter((session) =>
      session.status === "active" ||
      session.status === "paused" ||
      session.status === "draft" ||
      session.status === "blocked")
    .slice(0, MAX_GOAL_SUMMARIES);
  const activeRuntimeGoalSession = activeGoalSessions.find((session) =>
    session.constructRefs.includes("runtime-goal-stage-play-projection")) ?? null;
  const activeGoalSession = activeRuntimeGoalSession ??
    activeGoalSessions[0] ??
    null;
  const workstationGoalSummaries = activeGoalSessions.map((session) => {
    const checkpoint = session.checkpoints.at(-1);
    return boundedItem({
      ref: session.goalId,
      summary: checkpoint?.summary || session.userVisibleSummary || session.objective,
      observedAtMs: checkpoint?.createdAtMs ?? null,
      evidenceRefs: unique([...(checkpoint?.evidenceRefs ?? []), ...session.sourceRefs], 8),
    });
  });

  const workstationSources = readSafeSourceBinding(input.sourceBinding);
  const sourceStatus = situation?.live_answer_environment?.source_status ?? [];
  for (const source of sourceStatus) {
    const sourceRef = safeRef(source.source_id);
    if (!sourceRef) {
      reject(rejectedRefs, `source:${hash(source).slice(0, 16)}`, "unsafe_identity");
      continue;
    }
    const observedAtMs = toMs(source.last_event_ts);
    if (observedAtMs !== null && observedAtMs < nowMs - SOURCE_STATUS_MAX_AGE_MS) {
      reject(rejectedRefs, sourceRef, "stale");
      continue;
    }
    if (workstationSources.some((entry) => entry.source_ref === sourceRef)) continue;
    workstationSources.push({
      source_ref: sourceRef,
      source_kind: safeRef(source.kind) ?? "workstation_live_source",
      status: safeRef(source.status) ?? "unknown",
      observed_at_ms: observedAtMs,
      evidence_refs: [sourceRef],
    });
  }

  const sourceHealth = freshGoalUpdates
    .filter((update) => update.updateKind === "source_status" || update.updateKind === "error")
    .slice(0, MAX_SOURCES)
    .map((update) => boundedItem({
      ref: update.updateId,
      summary: update.preview,
      observedAtMs: update.freshness.observedAtMs,
      evidenceRefs: update.evidenceRefs,
    }));

  const goalUpdateSummaries = freshGoalUpdates
    .filter((update) => update.updateKind !== "transcript_window" && update.updateKind !== "translated_transcript")
    .slice(0, Math.max(0, MAX_GOAL_SUMMARIES - workstationGoalSummaries.length))
    .map((update) => boundedItem({
      ref: update.updateId,
      summary: update.preview,
      observedAtMs: update.freshness.observedAtMs,
      evidenceRefs: update.evidenceRefs,
    }));
  workstationGoalSummaries.push(...goalUpdateSummaries);

  const activeGoalCheckpoint = activeGoalSession?.checkpoints.at(-1) ?? null;
  const runtimeSessionRef = activeGoalSession
    ? readPrefixedRef(activeGoalSession.constructRefs, "runtime-session:")
    : null;
  const runtimeProviderRef = activeGoalSession
    ? readPrefixedRef(activeGoalSession.constructRefs, "runtime-provider:")
    : null;
  const activeGoalBinding = activeGoalSession
    ? {
        goal_id: activeGoalSession.goalId,
        status: activeGoalSession.status,
        runtime_session_ref: runtimeSessionRef,
        runtime_agent_provider: runtimeProviderRef?.slice("runtime-provider:".length) || null,
        source_refs: unique(activeGoalSession.sourceRefs.map((ref) => safeRef(ref)), 12),
        evidence_refs: unique([
          ...(activeGoalCheckpoint?.evidenceRefs ?? []),
          ...activeGoalSession.sourceRefs,
        ].map((ref) => safeRef(ref)), 16),
        answer_authority: false as const,
        terminal_eligible: false as const,
      }
    : null;

  const selectedRefs = unique([
    ...recentQuestions.map((entry) => entry.ref),
    ...groundedAnswers.map((entry) => entry.ref),
    ...activeConstraints.map((entry) => entry.ref),
    ...workstationGoalSummaries.map((entry) => entry.ref),
    ...workstationSources.slice(0, MAX_SOURCES).map((entry) => entry.source_ref),
    ...sourceHealth.map((entry) => entry.ref),
  ], 48);

  for (const source of workstationSources.slice(MAX_SOURCES)) {
    reject(rejectedRefs, source.source_ref, "limit_exceeded");
  }
  for (const update of freshGoalUpdates.slice(MAX_GOAL_SUMMARIES + MAX_SOURCES)) {
    if (!selectedRefs.includes(update.updateId)) reject(rejectedRefs, update.updateId, "limit_exceeded");
  }

  const evidenceRefs = unique([
    ...conversation.evidenceRefs,
    ...(situation?.evidence_refs ?? []),
    ...recentQuestions.flatMap((entry) => entry.evidence_refs),
    ...groundedAnswers.flatMap((entry) => entry.evidence_refs),
    ...activeConstraints.flatMap((entry) => entry.evidence_refs),
    ...workstationGoalSummaries.flatMap((entry) => entry.evidence_refs),
    ...sourceHealth.flatMap((entry) => entry.evidence_refs),
  ].map((entry) => safeRef(entry)), MAX_EVIDENCE_REFS);

  const objective = clip(
    activeGoalSession?.objective ??
      situation?.objective ??
      conversation.lastAgreedObjective?.textPreview ??
      "",
  ) || null;
  const currentGoal = clip(
    activeRuntimeGoalSession?.userVisibleSummary ??
      situation?.current_goal ??
      activeGoalSession?.userVisibleSummary ??
      "",
  ) || null;
  const semanticContent = {
    thread_id: input.threadId,
    active_goal_binding: activeGoalBinding,
    objective,
    current_goal: currentGoal,
    active_constraints: activeConstraints,
    recent_questions: recentQuestions,
    grounded_answers: groundedAnswers,
    workstation_goal_summaries: workstationGoalSummaries.slice(0, MAX_GOAL_SUMMARIES),
    workstation_sources: workstationSources.slice(0, MAX_SOURCES),
    source_health: sourceHealth,
    known_risks: (situation?.known_risks ?? []).map((entry) => clip(entry, 180)).filter(Boolean).slice(0, 6),
    known_unknowns: (situation?.known_unknowns ?? []).map((entry) => clip(entry, 180)).filter(Boolean).slice(0, 6),
    confidence_notes: (situation?.semantic_confidence_ladder ?? []).map((entry) => clip(entry, 180)).filter(Boolean).slice(0, 4),
    evidence_refs: evidenceRefs,
    selected_refs: selectedRefs,
    rejected_refs: rejectedRefs.slice(0, 24),
  };
  const contextHash = `sha256:${hash(semanticContent)}`;
  const hasContent = Boolean(
    objective ||
    currentGoal ||
    activeGoalBinding ||
    selectedRefs.length > 0 ||
    semanticContent.known_risks.length > 0 ||
    semanticContent.known_unknowns.length > 0,
  );

  return {
    schema: HELIX_REALTIME_STAGE_PLAY_CONTEXT_PACK_SCHEMA,
    context_pack_id: `realtime-stage-play-context:${contextHash.slice("sha256:".length, "sha256:".length + 20)}`,
    context_hash: contextHash,
    realtime_session_id: input.realtimeSessionId,
    generated_at_ms: nowMs,
    fresh_until_ms: nowMs + CONTEXT_FRESHNESS_MS,
    freshness_status: hasContent ? "fresh" : "empty",
    ...semanticContent,
    limits: {
      max_constraints: MAX_CONSTRAINTS,
      max_questions: MAX_QUESTIONS,
      max_answers: MAX_ANSWERS,
      max_goal_summaries: MAX_GOAL_SUMMARIES,
      max_sources: MAX_SOURCES,
      max_evidence_refs: MAX_EVIDENCE_REFS,
      max_summary_chars: MAX_SUMMARY_CHARS,
    },
    context_policy: "bounded_stage_play_projection",
    workstation_text_trusted: false,
    raw_audio_included: false,
    raw_logs_included: false,
    raw_transcript_included: false,
    secrets_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
};
