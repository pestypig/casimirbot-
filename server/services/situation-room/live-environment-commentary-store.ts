import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_COMMENTARY_SCHEMA,
  type HelixLiveEnvironmentCommentary,
  type HelixLiveEnvironmentCommentaryKind,
  type HelixLiveEnvironmentCommentaryStatus,
  type HelixLiveEnvironmentCommentarySubject,
} from "@shared/helix-live-environment-commentary";
import type { HelixInterpretedEventKind } from "@shared/helix-interpreted-event-log";
import { appendInterpretedEvent } from "./interpreted-event-log-store";

const commentaryByThread = new Map<string, HelixLiveEnvironmentCommentary[]>();
const commentaryById = new Map<string, HelixLiveEnvironmentCommentary>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry): entry is string => Boolean(entry))))
    : [];

const clampConfidence = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0.5;

const normalizeSubject = (value: unknown): HelixLiveEnvironmentCommentarySubject => {
  const subject = normalizeString(value);
  if (
    subject === "dottie_observer" ||
    subject === "minecraft_route" ||
    subject === "source_health" ||
    subject === "visual_source" ||
    subject === "workstation_pipeline" ||
    subject === "translation" ||
    subject === "browser_audio" ||
    subject === "terminal_authority"
  ) {
    return subject;
  }
  return "unknown";
};

const normalizeKind = (value: unknown): HelixLiveEnvironmentCommentaryKind => {
  const kind = normalizeString(value);
  if (
    kind === "observation" ||
    kind === "prediction" ||
    kind === "missing_evidence" ||
    kind === "salience_candidate" ||
    kind === "tool_trace" ||
    kind === "field_evaluation" ||
    kind === "terminal_ready" ||
    kind === "terminal_blocked"
  ) {
    return kind;
  }
  return "observation";
};

const normalizeStatus = (value: unknown): HelixLiveEnvironmentCommentaryStatus => {
  const status = normalizeString(value);
  if (
    status === "candidate" ||
    status === "observed" ||
    status === "blocked" ||
    status === "satisfied" ||
    status === "needs_more_evidence" ||
    status === "policy_pending" ||
    status === "policy_approved"
  ) {
    return status;
  }
  return "observed";
};

const interpretedKindForCommentary = (kind: HelixLiveEnvironmentCommentaryKind): HelixInterpretedEventKind => {
  if (kind === "prediction" || kind === "salience_candidate") return "utility_hypothesis";
  if (kind === "missing_evidence") return "clarification_need";
  if (kind === "field_evaluation") return "line_tool_evaluation";
  if (kind === "terminal_ready" || kind === "terminal_blocked") return "final_answer_snapshot";
  return "tool_trace";
};

export function makeLiveEnvironmentCommentaryId(input: {
  threadId: string;
  subject: HelixLiveEnvironmentCommentarySubject;
  kind: HelixLiveEnvironmentCommentaryKind;
  summary: string;
  createdAt: string;
}): string {
  return `live_commentary:${hashShort([
    input.threadId,
    input.subject,
    input.kind,
    input.summary,
    input.createdAt,
  ])}`;
}

export function recordLiveEnvironmentCommentary(input: {
  commentary_id?: string | null;
  thread_id: string;
  room_id?: string | null;
  environment_id?: string | null;
  subject?: HelixLiveEnvironmentCommentarySubject | string | null;
  kind?: HelixLiveEnvironmentCommentaryKind | string | null;
  status?: HelixLiveEnvironmentCommentaryStatus | string | null;
  compact_summary: string;
  evidence_refs?: string[] | null;
  related_artifact_ids?: string[] | null;
  related_worker_ids?: string[] | null;
  related_perturbation_ids?: string[] | null;
  missing_evidence?: string[] | null;
  confidence?: number | null;
  model_invoked?: boolean | null;
  derived_by_deterministic_reducer?: boolean | null;
  created_at?: string | null;
}): HelixLiveEnvironmentCommentary {
  const threadId = normalizeString(input.thread_id);
  if (!threadId) throw new Error("Live environment commentary requires thread_id.");
  const summary = normalizeString(input.compact_summary);
  if (!summary) throw new Error("Live environment commentary requires compact_summary.");

  const createdAt = normalizeString(input.created_at) ?? new Date().toISOString();
  const subject = normalizeSubject(input.subject);
  const kind = normalizeKind(input.kind);
  const commentaryId = normalizeString(input.commentary_id) ?? makeLiveEnvironmentCommentaryId({
    threadId,
    subject,
    kind,
    summary,
    createdAt,
  });

  const commentary: HelixLiveEnvironmentCommentary = {
    schema: HELIX_LIVE_ENVIRONMENT_COMMENTARY_SCHEMA,
    commentary_id: commentaryId,
    thread_id: threadId,
    room_id: normalizeString(input.room_id),
    environment_id: normalizeString(input.environment_id),
    subject,
    kind,
    status: normalizeStatus(input.status),
    compact_summary: summary,
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
    related_artifact_ids: uniqueStrings(input.related_artifact_ids ?? []),
    related_worker_ids: uniqueStrings(input.related_worker_ids ?? []),
    related_perturbation_ids: uniqueStrings(input.related_perturbation_ids ?? []),
    missing_evidence: uniqueStrings(input.missing_evidence ?? []),
    confidence: clampConfidence(input.confidence),
    model_invoked: input.model_invoked === true,
    derived_by_deterministic_reducer: input.derived_by_deterministic_reducer !== false,
    assistant_answer: false,
    raw_content_included: false,
    raw_user_text_included: false,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    created_at: createdAt,
  };

  const existing = commentaryById.get(commentary.commentary_id);
  if (existing) return existing;

  commentaryById.set(commentary.commentary_id, commentary);
  const current = commentaryByThread.get(commentary.thread_id) ?? [];
  commentaryByThread.set(commentary.thread_id, [...current, commentary].slice(-500));

  appendInterpretedEvent({
    thread_id: commentary.thread_id,
    room_id: commentary.room_id,
    source_family: "live_environment",
    kind: interpretedKindForCommentary(commentary.kind),
    title: `${commentary.subject.replace(/_/g, " ")} ${commentary.kind.replace(/_/g, " ")}`,
    summary: commentary.compact_summary,
    confidence: commentary.confidence,
    evidence_refs: [commentary.commentary_id, ...commentary.evidence_refs],
    related_artifact_ids: commentary.related_artifact_ids,
    model_invoked: commentary.model_invoked,
    deterministic: commentary.derived_by_deterministic_reducer,
    created_at: commentary.created_at,
  });

  return commentary;
}

export function listLiveEnvironmentCommentary(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  subject?: HelixLiveEnvironmentCommentarySubject | string | null;
  kind?: HelixLiveEnvironmentCommentaryKind | string | null;
  limit?: number;
}): HelixLiveEnvironmentCommentary[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  const subject = normalizeString(input.subject);
  const kind = normalizeString(input.kind);
  return [...(commentaryByThread.get(input.threadId) ?? [])]
    .filter((entry) => !input.roomId || entry.room_id === input.roomId)
    .filter((entry) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry) => !subject || entry.subject === subject)
    .filter((entry) => !kind || entry.kind === kind)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function getLiveEnvironmentCommentary(commentaryId: string): HelixLiveEnvironmentCommentary | null {
  return commentaryById.get(commentaryId) ?? null;
}

export function resetLiveEnvironmentCommentaryForTest(): void {
  commentaryByThread.clear();
  commentaryById.clear();
}
