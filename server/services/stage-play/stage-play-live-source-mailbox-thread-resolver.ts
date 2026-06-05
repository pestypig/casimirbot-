import {
  getStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  listStagePlayLiveSourceWatchJobPolicies,
  listStagePlayMailDecisions,
} from "./stage-play-live-source-mailbox-store";
import { listStagePlayLiveSourceMailWakeRequests } from "./stage-play-live-source-mail-wake-store";

export const DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID = "helix-ask:desktop";

export type StagePlayLiveSourceMailboxThreadResolution = {
  schema: "stage_play_live_source_mailbox_thread_resolution/v1";
  askThreadId: string | null;
  requestedThreadId: string | null;
  mailboxThreadId: string;
  reason:
    | "explicit_mailbox_thread_id"
    | "mail_id_owner_thread"
    | "stored_alias"
    | "requested_thread_has_mailbox_state"
    | "candidate_thread_has_mailbox_state"
    | "desktop_stage_play_mailbox_has_state"
    | "fallback_requested_thread"
    | "fallback_desktop_mailbox";
  candidateThreadIds: string[];
  stateCounts: Record<string, {
    mail: number;
    unread: number;
    jobs: number;
    policies: number;
    decisions: number;
    wakes: number;
    score: number;
  }>;
  aliasRecorded: boolean;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

const mailboxAliasByAskThread = new Map<string, string>();

const normalize = (value: string | null | undefined): string | null => {
  const text = String(value ?? "").trim();
  return text || null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map(normalize).filter((entry): entry is string => Boolean(entry))));

const countThreadState = (threadId: string) => {
  const mail = listStagePlayLiveSourceMailItems({ threadId, limit: 250 });
  const jobs = listStagePlayLiveSourceJobStates({ threadId, limit: 100 });
  const policies = listStagePlayLiveSourceWatchJobPolicies({ threadId, limit: 100 });
  const decisions = listStagePlayMailDecisions({ threadId, limit: 100 });
  const wakes = listStagePlayLiveSourceMailWakeRequests({ threadId, limit: 250 });
  const unread = mail.filter((item) => item.status === "unread" || item.status === "delivered_to_ask").length;
  const score =
    unread * 20 +
    mail.length * 8 +
    jobs.length * 6 +
    policies.length * 6 +
    wakes.length * 4 +
    decisions.length * 2;
  return {
    mail: mail.length,
    unread,
    jobs: jobs.length,
    policies: policies.length,
    decisions: decisions.length,
    wakes: wakes.length,
    score,
  };
};

export function bindStagePlayLiveSourceMailboxThreadAlias(input: {
  askThreadId?: string | null;
  mailboxThreadId?: string | null;
}): boolean {
  const askThreadId = normalize(input.askThreadId);
  const mailboxThreadId = normalize(input.mailboxThreadId);
  if (!askThreadId || !mailboxThreadId || askThreadId === mailboxThreadId) return false;
  mailboxAliasByAskThread.set(askThreadId, mailboxThreadId);
  return true;
}

export function resolveStagePlayLiveSourceMailboxThreadId(input: {
  askThreadId?: string | null;
  requestedThreadId?: string | null;
  uiThreadId?: string | null;
  environmentThreadId?: string | null;
  explicitMailboxThreadId?: string | null;
  mailIds?: string[];
} = {}): StagePlayLiveSourceMailboxThreadResolution {
  const askThreadId = normalize(input.askThreadId);
  const requestedThreadId = normalize(input.requestedThreadId) ?? askThreadId ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
  const explicitMailboxThreadId = normalize(input.explicitMailboxThreadId);
  const mailOwnerThreadId = uniqueStrings(input.mailIds ?? [])
    .map((mailId) => getStagePlayLiveSourceMailItem(mailId)?.threadId ?? null)
    .find(Boolean) ?? null;
  const aliasThreadId = askThreadId ? normalize(mailboxAliasByAskThread.get(askThreadId)) : null;
  const candidateThreadIds = uniqueStrings([
    explicitMailboxThreadId,
    mailOwnerThreadId,
    aliasThreadId,
    input.uiThreadId,
    input.environmentThreadId,
    requestedThreadId,
    askThreadId,
    DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID,
  ]);
  const stateCounts = Object.fromEntries(
    candidateThreadIds.map((threadId) => [threadId, countThreadState(threadId)]),
  );

  let mailboxThreadId = requestedThreadId;
  let reason: StagePlayLiveSourceMailboxThreadResolution["reason"] = "fallback_requested_thread";

  if (explicitMailboxThreadId) {
    mailboxThreadId = explicitMailboxThreadId;
    reason = "explicit_mailbox_thread_id";
  } else if (mailOwnerThreadId) {
    mailboxThreadId = mailOwnerThreadId;
    reason = "mail_id_owner_thread";
  } else if (aliasThreadId) {
    mailboxThreadId = aliasThreadId;
    reason = "stored_alias";
  } else {
    const requestedScore = requestedThreadId ? stateCounts[requestedThreadId]?.score ?? 0 : 0;
    if (requestedThreadId && requestedScore > 0) {
      mailboxThreadId = requestedThreadId;
      reason = "requested_thread_has_mailbox_state";
    } else {
      const best = candidateThreadIds
        .map((threadId) => ({ threadId, score: stateCounts[threadId]?.score ?? 0 }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score || left.threadId.localeCompare(right.threadId))
        .at(0) ?? null;
      if (best) {
        mailboxThreadId = best.threadId;
        reason = best.threadId === DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID
          ? "desktop_stage_play_mailbox_has_state"
          : "candidate_thread_has_mailbox_state";
      } else if (!requestedThreadId) {
        mailboxThreadId = DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
        reason = "fallback_desktop_mailbox";
      }
    }
  }

  const aliasRecorded = bindStagePlayLiveSourceMailboxThreadAlias({
    askThreadId,
    mailboxThreadId,
  });

  return {
    schema: "stage_play_live_source_mailbox_thread_resolution/v1",
    askThreadId,
    requestedThreadId,
    mailboxThreadId,
    reason,
    candidateThreadIds,
    stateCounts,
    aliasRecorded,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function resetStagePlayLiveSourceMailboxThreadResolverForTest(): void {
  mailboxAliasByAskThread.clear();
}
