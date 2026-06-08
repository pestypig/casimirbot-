import crypto from "node:crypto";
import {
  STAGE_PLAY_HELD_CALLOUT_RECHECK_SCHEMA,
  STAGE_PLAY_HELD_CALLOUT_SCHEMA,
  type StagePlayHeldCalloutRecheckResultV1,
  type StagePlayHeldCalloutRecheckV1,
  type StagePlayHeldCalloutStatusV1,
  type StagePlayHeldCalloutUrgencyV1,
  type StagePlayHeldCalloutV1,
} from "@shared/contracts/stage-play-held-callout.v1";

const heldCalloutsById = new Map<string, StagePlayHeldCalloutV1>();
const heldRechecksById = new Map<string, StagePlayHeldCalloutRecheckV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 420): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const wordSet = (value: string): Set<string> =>
  new Set((value.toLowerCase().match(/\b[a-z0-9][a-z0-9-]{2,}\b/g) ?? [])
    .filter((word) => !new Set(["the", "and", "for", "with", "that", "this", "should", "would", "could", "callout"]).has(word)));

export function urgencyFromHeldCalloutText(text: string): StagePlayHeldCalloutUrgencyV1 {
  if (/\b(?:critical|life|death|immediate|emergency|attack|hostile|danger|fire)\b/i.test(text)) return "critical";
  if (/\b(?:urgent|risk|warning|blocked|failed|danger)\b/i.test(text)) return "high";
  if (/\b(?:changed|change|new|approaching|important|salient)\b/i.test(text)) return "medium";
  return "low";
}

export function recordStagePlayHeldCallout(input: {
  threadId: string;
  jobId: string;
  decisionId: string;
  text: string;
  status: "held_user_speaking" | "held_manual_prompt_active";
  roomId?: string | null;
  environmentId?: string | null;
  mailIds?: string[];
  urgency?: StagePlayHeldCalloutUrgencyV1 | null;
  evidenceRefs?: string[];
  statusReason?: string | null;
  now?: string;
}): StagePlayHeldCalloutV1 {
  const now = input.now ?? new Date().toISOString();
  const evidenceRefs = uniqueStrings([
    input.decisionId,
    input.jobId,
    ...(input.mailIds ?? []),
    ...(input.evidenceRefs ?? []),
  ]);
  const held: StagePlayHeldCalloutV1 = {
    artifactId: "stage_play_held_callout",
    schemaVersion: STAGE_PLAY_HELD_CALLOUT_SCHEMA,
    calloutId: `stage_play_held_callout:${hashShort([
      input.threadId,
      input.jobId,
      input.decisionId,
      input.status,
      input.text,
      now,
    ])}`,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId,
    decisionId: input.decisionId,
    mailIds: uniqueStrings(input.mailIds ?? []),
    text: clipText(input.text),
    urgency: input.urgency ?? urgencyFromHeldCalloutText(input.text),
    status: input.status,
    statusReason: input.statusReason ?? input.status,
    mergedAnswerRef: null,
    supersededByPromptRef: null,
    staleAfterMailId: null,
    evidenceRefs,
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  heldCalloutsById.set(held.calloutId, held);
  return held;
}

export function getStagePlayHeldCallout(calloutId: string): StagePlayHeldCalloutV1 | null {
  return heldCalloutsById.get(calloutId) ?? null;
}

export function listStagePlayHeldCallouts(input: {
  threadId?: string | null;
  jobId?: string | null;
  decisionId?: string | null;
  status?: StagePlayHeldCalloutStatusV1 | null;
  limit?: number;
} = {}): StagePlayHeldCalloutV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(heldCalloutsById.values())
    .filter((callout) => {
      if (input.threadId && callout.threadId !== input.threadId) return false;
      if (input.jobId && callout.jobId !== input.jobId) return false;
      if (input.decisionId && callout.decisionId !== input.decisionId) return false;
      if (input.status && callout.status !== input.status) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function markStagePlayHeldCalloutStatus(input: {
  calloutId: string;
  status: StagePlayHeldCalloutStatusV1;
  reason?: string | null;
  mergedAnswerRef?: string | null;
  supersededByPromptRef?: string | null;
  staleAfterMailId?: string | null;
  evidenceRefs?: string[];
  now?: string;
}): StagePlayHeldCalloutV1 | null {
  const current = heldCalloutsById.get(input.calloutId);
  if (!current) return null;
  const updated: StagePlayHeldCalloutV1 = {
    ...current,
    status: input.status,
    statusReason: input.reason ?? current.statusReason ?? input.status,
    mergedAnswerRef: input.mergedAnswerRef ?? current.mergedAnswerRef ?? null,
    supersededByPromptRef: input.supersededByPromptRef ?? current.supersededByPromptRef ?? null,
    staleAfterMailId: input.staleAfterMailId ?? current.staleAfterMailId ?? null,
    evidenceRefs: uniqueStrings([...current.evidenceRefs, ...(input.evidenceRefs ?? [])]),
    updatedAt: input.now ?? new Date().toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  heldCalloutsById.set(updated.calloutId, updated);
  return updated;
}

export function recheckStagePlayHeldCallout(input: {
  calloutId: string;
  userPromptText?: string | null;
  userPromptRef?: string | null;
  newMailIds?: string[];
  answerRef?: string | null;
  now?: string;
}): StagePlayHeldCalloutRecheckV1 | null {
  const callout = heldCalloutsById.get(input.calloutId);
  if (!callout) return null;
  const newMailIds = uniqueStrings(input.newMailIds ?? []);
  const prompt = String(input.userPromptText ?? "").trim();
  const calloutWords = wordSet(callout.text);
  const promptWords = wordSet(prompt);
  const overlap = Array.from(calloutWords).filter((word) => promptWords.has(word));
  let result: StagePlayHeldCalloutRecheckResultV1 = "still_relevant";
  let nextStatus: StagePlayHeldCalloutStatusV1 = "ready_for_recheck";
  let reason = "Held callout is still relevant and ready for voice delivery recheck.";
  if (newMailIds.length > 0 && !newMailIds.some((mailId) => callout.mailIds.includes(mailId))) {
    result = "stale_after_new_mail";
    nextStatus = "stale_after_new_mail";
    reason = "New live-source mail arrived after the held callout.";
  } else if (prompt && /\b(?:stop|cancel|silent|quiet|don't talk|do not talk|ignore that|never mind|nevermind)\b/i.test(prompt)) {
    result = "drop";
    nextStatus = "dropped";
    reason = "User prompt suppresses the held callout.";
  } else if (prompt && /\b(?:should i|what should|what do you think|go back|keep|continue|instead|strategy|next)\b/i.test(prompt)) {
    result = overlap.length > 0 || callout.urgency === "critical" ? "merge_into_answer" : "superseded_by_user_prompt";
    nextStatus = result === "merge_into_answer" ? "merged_into_answer" : "dropped";
    reason = result === "merge_into_answer"
      ? "User prompt asks a related strategy question; merge the warning into the answer instead of speaking separately."
      : "User prompt supersedes the held callout.";
  }
  const evidenceRefs = uniqueStrings([
    callout.calloutId,
    callout.decisionId,
    input.userPromptRef,
    input.answerRef,
    ...newMailIds,
    ...callout.evidenceRefs,
  ]);
  const recheck: StagePlayHeldCalloutRecheckV1 = {
    artifactId: "stage_play_held_callout_recheck",
    schemaVersion: STAGE_PLAY_HELD_CALLOUT_RECHECK_SCHEMA,
    recheckId: `stage_play_held_callout_recheck:${hashShort([
      callout.calloutId,
      prompt,
      newMailIds,
      result,
      input.now ?? null,
    ])}`,
    calloutId: callout.calloutId,
    decisionId: callout.decisionId,
    threadId: callout.threadId,
    result,
    nextStatus,
    reason,
    userPromptRef: input.userPromptRef ?? null,
    newMailIds,
    evidenceRefs,
    createdAt: input.now ?? new Date().toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  heldRechecksById.set(recheck.recheckId, recheck);
  markStagePlayHeldCalloutStatus({
    calloutId: callout.calloutId,
    status: nextStatus,
    reason,
    mergedAnswerRef: nextStatus === "merged_into_answer" ? input.answerRef ?? input.userPromptRef ?? null : null,
    supersededByPromptRef: result === "superseded_by_user_prompt" || result === "drop" ? input.userPromptRef ?? null : null,
    staleAfterMailId: result === "stale_after_new_mail" ? newMailIds.at(-1) ?? null : null,
    evidenceRefs,
    now: recheck.createdAt,
  });
  return recheck;
}

export function listStagePlayHeldCalloutRechecks(input: {
  threadId?: string | null;
  calloutId?: string | null;
  limit?: number;
} = {}): StagePlayHeldCalloutRecheckV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(heldRechecksById.values())
    .filter((recheck) => {
      if (input.threadId && recheck.threadId !== input.threadId) return false;
      if (input.calloutId && recheck.calloutId !== input.calloutId) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function resetStagePlayHeldCalloutStoreForTest(): void {
  heldCalloutsById.clear();
  heldRechecksById.clear();
}
