import crypto from "node:crypto";
import type {
  StagePlayLiveSourceMailDecisionV1,
  StagePlayLiveSourceMailItemV1,
  StagePlayLiveSourceVoiceDeliveryReceiptV1,
  StagePlayLiveSourceVoicePolicyV1,
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import {
  getStagePlayLiveSourceMailItem,
  getStagePlayLiveSourceWatchJobPolicy,
  getStagePlayMailDecision,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceWatchJobPolicies,
  listUnreadStagePlayLiveSourceMailItems,
} from "./stage-play-live-source-mailbox-store";
import { recordStagePlayLiveSourceMailTranscriptEntries } from "./stage-play-live-source-mail-transcript-store";
import {
  maybeRunStagePlayLiveSourceVoiceDelivery,
  type StagePlayLiveSourceVoiceDeliveryRunner,
} from "./stage-play-live-source-mail-voice-bridge";
import {
  MAX_MAIL_IDS_PER_WAKE_BATCH,
  listRunnableStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeRequests,
  markStagePlayMailWakeCompleted,
  markStagePlayMailWakeRetryable,
  markStagePlayMailWakeRunning,
  markStagePlayMailWakeTerminalFailed,
  queueStagePlayLiveSourceMailWakeRequest,
  recordStagePlayMailWakeResult,
} from "./stage-play-live-source-mail-wake-store";

type AskWakeTurnResponse = Record<string, unknown>;

export type AskWakeTurnRunner = (input: {
  prompt: string;
  threadId: string;
  evidenceRefs: string[];
  wakeRequest: StagePlayLiveSourceMailWakeRequestV1;
}) => Promise<AskWakeTurnResponse>;

export type StagePlayMailWakePressureCheckResult = {
  deferred: boolean;
  reason?: string | null;
  release?: (outcome?: "completed" | "failed" | "rejected" | "aborted") => void;
};

export type StagePlayMailWakePressureCheck = (input: {
  wakeRequest: StagePlayLiveSourceMailWakeRequestV1;
  now: string;
}) => StagePlayMailWakePressureCheckResult;

type DurableWakeTranscriptRow = import("@shared/contracts/stage-play-live-source-mail.v1").AskTurnTranscriptRowDraftV1;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const STALE_RUNNING_WAKE_MS = 90_000;
const PRIOR_DECISION_LIMIT = 6;

const defaultAskBaseUrl = (): string =>
  process.env.HELIX_ASK_BASE_URL ??
  `http://127.0.0.1:${process.env.PORT || process.env.SERVER_PORT || "5050"}`;

const clipPromptText = (value: string | null | undefined, max = 420): string => {
  const trimmed = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, Math.max(0, max - 1)).trim()}...`;
};

const formatCriteria = (values: string[]): string =>
  values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- none recorded";

const formatVoicePolicy = (policy: StagePlayLiveSourceVoicePolicyV1): string =>
  [
    `voiceEnabled: ${policy.voiceEnabled}`,
    `requiresConfirmation: ${policy.requiresConfirmation}`,
    `allowedNow: ${policy.allowedNow}`,
    `reason: ${policy.reason ?? "none"}`,
  ].join("\n");

const voicePolicyFromWatchPolicy = (
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): StagePlayLiveSourceVoicePolicyV1 => {
  const voiceEnabled = policy?.outputPolicy.allowVoiceCallout === true;
  const requiresConfirmation = policy?.outputPolicy.confirmationRequired === true;
  const allowedNow = voiceEnabled && !requiresConfirmation;
  return {
    voiceEnabled,
    requiresConfirmation,
    allowedNow,
    reason: !voiceEnabled
      ? "watch_policy_disallows_voice"
      : requiresConfirmation
        ? "watch_policy_requires_confirmation"
        : policy?.outputPolicy.voiceRequiresUrgency
          ? "watch_policy_allows_urgent_voice_callout"
          : "watch_policy_allows_voice_callout",
  };
};

const resolveActiveWatchPolicy = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
}): StagePlayLiveSourceWatchJobPolicyV1 | null => {
  if (input.wake.jobId) {
    const direct = listStagePlayLiveSourceWatchJobPolicies({
      threadId: input.wake.threadId,
      roomId: input.wake.roomId ?? null,
      environmentId: input.wake.environmentId ?? null,
      jobId: input.wake.jobId,
      status: "armed",
      limit: 1,
    }).at(-1) ?? null;
    if (direct) return direct;
  }
  const jobState = listStagePlayLiveSourceJobStates({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    limit: 10,
  })
    .filter((state) => !input.wake.jobId || state.jobId === input.wake.jobId)
    .filter((state) => state.watchJobPolicyRef)
    .at(-1) ?? null;
  const fromJobState = jobState?.watchJobPolicyRef
    ? getStagePlayLiveSourceWatchJobPolicy(jobState.watchJobPolicyRef)
    : null;
  if (fromJobState) return fromJobState;
  const mailSourceIds = new Set(input.mailBatch.map((item) => item.sourceId));
  return listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    status: "armed",
    limit: 20,
  })
    .filter((policy) =>
      policy.sourceIds.length === 0 ||
      policy.sourceIds.some((sourceId) => mailSourceIds.has(sourceId) || input.wake.sourceIds.includes(sourceId))
    )
    .at(-1) ?? null;
};

const mailBatchForWake = (wake: StagePlayLiveSourceMailWakeRequestV1): StagePlayLiveSourceMailItemV1[] =>
  wake.mailIds
    .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
    .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const priorDecisionsForWake = (
  wake: StagePlayLiveSourceMailWakeRequestV1,
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): StagePlayLiveSourceMailDecisionV1[] => {
  const wakeMailIds = new Set(wake.mailIds);
  const decisions = listStagePlayMailDecisions({
    threadId: wake.threadId,
    roomId: wake.roomId ?? null,
    environmentId: wake.environmentId ?? null,
    limit: 50,
  }).filter((decision) => !decision.mailIds.some((mailId) => wakeMailIds.has(mailId)));
  const policyDecisionRefs = new Set(policy?.priorDecisionRefs ?? []);
  return decisions
    .filter((decision) =>
      policyDecisionRefs.size === 0 ||
      policyDecisionRefs.has(decision.decisionId) ||
      decision.activeJobId === policy?.jobId
    )
    .slice(-PRIOR_DECISION_LIMIT);
};

const formatMailBatch = (items: StagePlayLiveSourceMailItemV1[], wake: StagePlayLiveSourceMailWakeRequestV1): string => {
  if (items.length === 0) {
    return wake.mailIds.map((mailId, index) => `${index + 1}. ${mailId} - compact summary unavailable in local store`).join("\n");
  }
  return items.map((item, index) => [
    `${index + 1}. ${item.mailId}`,
    `   created: ${item.createdAt}`,
    `   source: ${item.sourceId} (${item.sourceKind})`,
    `   refs: ${uniqueStrings([
      item.sourceRefs.frameRef,
      item.sourceRefs.evidenceRef,
      item.sourceRefs.observationRef,
    ]).join(", ") || "none"}`,
    `   summary: ${clipPromptText(item.summary.text || item.summary.preview, 620)}`,
    `   change_hint: ${item.hints.deterministicChangeHint ?? "unknown"}`,
  ].join("\n")).join("\n");
};

const formatPriorDecisions = (
  decisions: StagePlayLiveSourceMailDecisionV1[],
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): string => {
  const priorAnswerRefs = policy?.priorAnswerRefs ?? [];
  const decisionLines = decisions.length > 0
    ? decisions.map((decision) => [
        `- ${decision.decisionId}`,
        `  decision: ${decision.decision}`,
        `  mail: ${decision.mailIds.join(", ") || "none"}`,
        `  rationale: ${clipPromptText(decision.rationalePreview, 240)}`,
        decision.textAnswerDraft ? `  text_answer: ${clipPromptText(decision.textAnswerDraft.text, 180)}` : null,
        decision.voiceCalloutDraft ? `  voice_callout: ${clipPromptText(decision.voiceCalloutDraft.text, 180)}` : null,
      ].filter(Boolean).join("\n")).join("\n")
    : "- none recorded";
  return [
    decisionLines,
    "",
    "Prior answer/callout refs:",
    priorAnswerRefs.length > 0 ? priorAnswerRefs.map((ref) => `- ${ref}`).join("\n") : "- none recorded",
  ].join("\n");
};

const makeWakeTranscriptRow = (input: {
  rowId: string;
  rowKind: DurableWakeTranscriptRow["rowKind"];
  title: string;
  body: string;
  toolName?: string | null;
  artifactId?: string | null;
  artifactKind?: string | null;
  evidenceRefs?: string[];
  authority?: DurableWakeTranscriptRow["authority"];
  terminalEligible?: boolean;
  createdAt: string;
}): DurableWakeTranscriptRow => ({
  rowId: input.rowId,
  rowKind: input.rowKind,
  title: input.title,
  body: input.body,
  source: {
    toolName: input.toolName ?? null,
    artifactId: input.artifactId ?? null,
    artifactKind: input.artifactKind ?? null,
  },
  evidenceRefs: uniqueStrings(input.evidenceRefs ?? []),
  authority: input.authority ?? "tool_evidence",
  assistantAnswer: false,
  terminalEligible: input.terminalEligible === true,
  createdAt: input.createdAt,
});

const buildDurableWakeTranscriptRows = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  decisionIds: string[];
  voiceReceipts?: StagePlayLiveSourceVoiceDeliveryReceiptV1[];
  evidenceRefs: string[];
  createdAt: string;
}): DurableWakeTranscriptRow[] => {
  const rows: DurableWakeTranscriptRow[] = [];
  for (const item of input.mailBatch) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_mail_received:${hashShort([input.wake.wakeRequestId, item.mailId])}`,
      rowKind: "mail_received",
      title: "Observation mail",
      body: `Visual summary received. Preview: ${item.summary.preview}`,
      artifactId: item.mailId,
      artifactKind: item.artifactId,
      evidenceRefs: item.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_mail_read_tool_call:${hashShort(input.wake.wakeRequestId)}`,
    rowKind: "mail_read_tool_call",
    title: "Tool call",
    body: "live_env.read_live_source_mail",
    toolName: "live_env.read_live_source_mail",
    artifactId: input.wake.wakeRequestId,
    artifactKind: input.wake.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_mail_read_receipt:${hashShort(input.wake.wakeRequestId)}`,
    rowKind: "mail_read_receipt",
    title: "Tool receipt",
    body: `${input.mailBatch.length || input.wake.mailIds.length} unread live-source mail item(s).`,
    toolName: "live_env.read_live_source_mail",
    artifactId: input.wake.wakeRequestId,
    artifactKind: input.wake.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  const decisions = input.decisionIds
    .map((decisionId) => getStagePlayMailDecision(decisionId))
    .filter((decision): decision is StagePlayLiveSourceMailDecisionV1 => Boolean(decision));
  const voiceReceiptByDecisionId = new Map(
    (input.voiceReceipts ?? []).map((receipt) => [receipt.decisionId, receipt]),
  );
  if (decisions.length > 0) {
    for (const decision of decisions) {
      const voiceReceipt = voiceReceiptByDecisionId.get(decision.decisionId) ?? null;
      rows.push(makeWakeTranscriptRow({
        rowId: `wake_agent_decision:${hashShort(decision.decisionId)}`,
        rowKind: "agent_decision",
        title: "Agent decision",
        body: `${decision.decision}: ${decision.rationalePreview}`,
        toolName: "live_env.record_live_source_mail_decision",
        artifactId: decision.decisionId,
        artifactKind: decision.artifactId,
        evidenceRefs: decision.evidenceRefs,
        authority: "model_decision_receipt",
        createdAt: input.createdAt,
      }));
      if (decision.textAnswerDraft) {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_text_answer:${hashShort(decision.decisionId)}`,
          rowKind: "text_answer",
          title: "Text draft",
          body: decision.textAnswerDraft.text,
          artifactId: decision.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: decision.evidenceRefs,
          authority: "model_decision_receipt",
          terminalEligible: decision.textAnswerDraft.terminalEligible,
          createdAt: input.createdAt,
        }));
      }
      if (decision.voiceCalloutDraft) {
        const requiresConfirmation =
          decision.voicePolicy?.requiresConfirmation === true ||
          decision.voiceCalloutDraft.requiresConfirmation === true;
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_callout:${hashShort(decision.decisionId)}`,
          rowKind: "voice_callout_request",
          title: "Voice callout draft",
          body: requiresConfirmation
            ? `${decision.voiceCalloutDraft.text}\nAwaiting confirmation before voice delivery.`
            : decision.voiceCalloutDraft.text,
          artifactId: decision.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: decision.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
      }
      if (voiceReceipt?.requestedTool && voiceReceipt.status !== "confirmation_required") {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_tool_call:${hashShort(voiceReceipt.receiptId)}`,
          rowKind: "voice_tool_call",
          title: "Voice tool call",
          body: `${voiceReceipt.requestedTool.toolName}: ${voiceReceipt.voiceCalloutDraft?.text ?? ""}`.trim(),
          toolName: voiceReceipt.requestedTool.toolName,
          artifactId: voiceReceipt.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: voiceReceipt.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
      }
      if (voiceReceipt) {
        const receiptBody = [
          voiceReceipt.status,
          voiceReceipt.delivery?.message,
          voiceReceipt.delivery?.artifactRef ? `artifact: ${voiceReceipt.delivery.artifactRef}` : null,
        ].filter(Boolean).join(" - ");
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_receipt:${hashShort(voiceReceipt.receiptId)}`,
          rowKind: voiceReceipt.status === "confirmation_required" ? "voice_callout_request" : "voice_receipt",
          title: voiceReceipt.status === "confirmation_required" ? "Voice confirmation required" : "Voice receipt",
          body: receiptBody || voiceReceipt.status,
          toolName: voiceReceipt.requestedTool?.toolName ?? null,
          artifactId: voiceReceipt.receiptId,
          artifactKind: voiceReceipt.artifactId,
          evidenceRefs: voiceReceipt.evidenceRefs,
          authority: voiceReceipt.status === "failed" ? "blocked" : "tool_evidence",
          createdAt: input.createdAt,
        }));
      }
      rows.push(makeWakeTranscriptRow({
        rowId: `wake_loop_state:${hashShort(decision.decisionId)}`,
        rowKind: "loop_state",
        title: "Loop state",
        body: decision.nextLoopState === "armed_for_next_summary"
          ? "Armed for the next live-source update."
          : decision.nextLoopState,
        artifactId: decision.decisionId,
        artifactKind: decision.artifactId,
        evidenceRefs: decision.evidenceRefs,
        createdAt: input.createdAt,
      }));
    }
    return rows;
  }
  for (const decisionId of input.decisionIds) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_agent_decision:${hashShort(decisionId)}`,
      rowKind: "agent_decision",
      title: "Agent decision",
      body: `Decision recorded: ${decisionId}`,
      toolName: "live_env.record_live_source_mail_decision",
      artifactId: decisionId,
      artifactKind: "stage_play_live_source_mail_decision",
      evidenceRefs: uniqueStrings([decisionId, ...input.evidenceRefs]),
      authority: "model_decision_receipt",
      createdAt: input.createdAt,
    }));
  }
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_loop_state:${hashShort(input.wakeResult.wakeResultId)}`,
    rowKind: "loop_state",
    title: "Loop state",
    body: "Wake result completed.",
    artifactId: input.wakeResult.wakeResultId,
    artifactKind: input.wakeResult.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  return rows;
};

const buildWakePrompt = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  priorDecisions: StagePlayLiveSourceMailDecisionV1[];
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
}): string => {
  const objective = input.policy?.objectiveText ?? "Read the live-source mailbox and decide what to do with this unread source update batch.";
  const decisionPolicy = input.policy?.decisionPolicyPrompt ?? "If there is no user-facing change, record wait_for_next_summary. If there is a meaningful user-facing change, draft a concise text answer.";
  return [
    "Continuing live-source watch job:",
    objective,
    `Watch policy ref: ${input.policy?.policyId ?? "none"}`,
    `Watch job ref: ${input.policy?.jobId ?? input.wake.jobId ?? "none"}`,
    "",
    "Decision policy:",
    decisionPolicy,
    "",
    "The mail is perturbation evidence for this continuing job.",
    "Use live_env.read_live_source_mail first, then record the decision with live_env.record_live_source_mail_decision.",
    "Read only the mail refs listed below for this wake request; do not widen to newer mailbox items in this turn.",
    "Treat the listed mail refs as one chronological observation window from the same live source.",
    "Do not claim visual evidence is unavailable when the unread mail refs or compact summaries below exist.",
    "",
    "Importance criteria:",
    formatCriteria(input.policy?.importanceCriteria ?? []),
    "",
    "Suppress criteria:",
    formatCriteria(input.policy?.suppressCriteria ?? []),
    "",
    "Voice policy:",
    formatVoicePolicy(input.voicePolicy),
    "Voice decision rules:",
    "- request_voice_callout requires voiceCalloutDraft.text.",
    "- If voiceEnabled is false, draft text only and do not request a voice tool.",
    "- If requiresConfirmation is true, produce the callout draft and wait for confirmation; do not request a voice tool.",
    "- If allowedNow is true and speech is appropriate, record the decision first and request the separate voice delivery tool from that decision.",
    "",
    "Unread mail batch:",
    `Wake request: ${input.wake.wakeRequestId}`,
    `Batch size: ${input.wake.mailIds.length}`,
    `Mail refs: ${input.wake.mailIds.join(", ")}`,
    `Source refs: ${input.wake.sourceIds.join(", ")}`,
    formatMailBatch(input.mailBatch, input.wake),
    "",
    "Prior decisions:",
    formatPriorDecisions(input.priorDecisions, input.policy),
    "",
    "Choose one:",
    "- wait_for_next_summary",
    "- record_interpretation",
    "- draft_text_answer",
    "- request_voice_callout",
    "- request_more_evidence",
    "- request_stage_play_checkpoint",
    "- fail_closed",
  ].join("\n");
};

const defaultAskTurnRunner = (baseUrl?: string): AskWakeTurnRunner =>
  async ({ prompt, threadId, evidenceRefs, wakeRequest }) => {
    const response = await fetch(`${baseUrl ?? defaultAskBaseUrl()}/api/agi/ask/turn`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: prompt,
        prompt,
        sessionId: threadId,
        debug: true,
        evidence_refs: evidenceRefs,
        stage_play_live_source_mail_wake_request_id: wakeRequest.wakeRequestId,
      }),
    });
    if (!response.ok) {
      throw new Error(`mail_wake_ask_turn_failed:${response.status}`);
    }
    return await response.json() as AskWakeTurnResponse;
  };

const extractAskTurnId = (response: AskWakeTurnResponse): string | null =>
  readString(response.turn_id) ??
  readString(response.trace_id) ??
  readString(response.id);

const extractDecisionIds = (response: AskWakeTurnResponse): string[] => {
  const ledger = readArray(response.current_turn_artifact_ledger);
  const ids = ledger.flatMap((artifact): string[] => {
    const record = readRecord(artifact);
    const payload = readRecord(record?.payload);
    const observation = readRecord(payload?.observation);
    const observationIsMailDecision =
      readString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    const payloadIsMailDecision =
      readString(payload?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(payload?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    if (!observationIsMailDecision && !payloadIsMailDecision) return [];
    return uniqueStrings([
      readString(observation?.decisionId),
      readString(payload?.decisionId),
      readString(payload?.decision_id),
    ]);
  });
  return uniqueStrings(ids);
};

const wakeAttemptBackoffMs = (attemptCount: number): number => {
  if (attemptCount <= 1) return 15_000;
  if (attemptCount === 2) return 30_000;
  if (attemptCount === 3) return 60_000;
  return 120_000;
};

const addMs = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

const isPressure503 = (err: unknown): boolean =>
  /\b(?:mail_wake_ask_turn_failed:503|503)\b/i.test(err instanceof Error ? err.message : String(err));

const wakeMatchesScope = (
  wake: StagePlayLiveSourceMailWakeRequestV1,
  input: {
    threadId?: string | null;
    roomId?: string | null;
    environmentId?: string | null;
    jobId?: string | null;
  },
): boolean => {
  if (input.threadId && wake.threadId !== input.threadId) return false;
  if (input.roomId && wake.roomId !== input.roomId) return false;
  if (input.environmentId && wake.environmentId !== input.environmentId) return false;
  if (input.jobId && wake.jobId !== input.jobId) return false;
  return true;
};

export function queueMailWakeForUnreadItems(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  limit?: number;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null {
  const jobs = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 10,
  });
  const activeJob = jobs.at(-1) ?? null;
  if (activeJob && (activeJob.status === "paused" || activeJob.status === "ended")) return null;
  const unread = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    limit: Math.max(MAX_MAIL_IDS_PER_WAKE_BATCH, input.limit ?? MAX_MAIL_IDS_PER_WAKE_BATCH),
  });
  const activeWakeMailIds = new Set(
    listStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: activeJob?.jobId ?? null,
      limit: 250,
    })
      .filter((wake) =>
        wake.status === "queued" ||
        wake.status === "running" ||
        wake.status === "failed_retryable" ||
        wake.status === "deferred_for_pressure"
      )
      .flatMap((wake) => wake.mailIds),
  );
  const unclaimed = unread.filter((item) => !activeWakeMailIds.has(item.mailId));
  if (unclaimed.length === 0) return null;
  const oldestSourceId = unclaimed[0].sourceId;
  const batchLimit = Math.max(1, Math.min(input.limit ?? MAX_MAIL_IDS_PER_WAKE_BATCH, MAX_MAIL_IDS_PER_WAKE_BATCH));
  const batch = unclaimed.filter((item) => item.sourceId === oldestSourceId).slice(0, batchLimit);
  if (batch.length === 0) return null;
  return queueStagePlayLiveSourceMailWakeRequest({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: activeJob?.jobId ?? null,
    mailIds: batch.map((item) => item.mailId),
    sourceIds: batch.map((item) => item.sourceId),
    reason: "unread_mail",
    evidenceRefs: batch.flatMap((item: StagePlayLiveSourceMailItemV1) => item.evidenceRefs),
    now: input.now,
  });
}

export async function runNextMailWakeRequest(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  baseUrl?: string;
  askTurnRunner?: AskWakeTurnRunner;
  voiceDeliveryRunner?: StagePlayLiveSourceVoiceDeliveryRunner | null;
  pressureCheck?: StagePlayMailWakePressureCheck | null;
  now?: string;
} = {}): Promise<StagePlayLiveSourceMailWakeResultV1 | null> {
  const now = input.now ?? new Date().toISOString();
  const scopedWakes = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: 250,
  });
  const activeRunning = scopedWakes.filter((wake) =>
    wake.status === "running" &&
    wakeMatchesScope(wake, input)
  );
  for (const wake of activeRunning) {
    const lastAttemptMs = Date.parse(wake.lastAttemptAt ?? wake.updatedAt);
    const stale = Number.isFinite(lastAttemptMs) && Date.parse(now) - lastAttemptMs > STALE_RUNNING_WAKE_MS;
    if (stale && !wake.askTurnId) {
      markStagePlayMailWakeRetryable({
        wakeRequestId: wake.wakeRequestId,
        failureReason: "stale_running_wake",
        nextRetryAt: now,
        now,
      });
    }
  }
  const stillRunning = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    status: "running",
    limit: 250,
  }).find((wake) => wakeMatchesScope(wake, input));
  if (stillRunning) return null;
  const running = listRunnableStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    now,
    limit: 250,
  }).at(0) ?? null;
  if (!running) return null;
  const runningAttempt = markStagePlayMailWakeRunning(running.wakeRequestId, now) ?? running;
  const mailBatch = mailBatchForWake(running);
  const policy = resolveActiveWatchPolicy({ wake: running, mailBatch });
  const priorDecisions = priorDecisionsForWake(running, policy);
  const voicePolicy = voicePolicyFromWatchPolicy(policy);
  const evidenceRefs = uniqueStrings([
    ...running.evidenceRefs,
    ...running.mailIds,
    ...running.sourceIds,
    ...(policy ? [policy.policyId, policy.jobId, ...policy.evidenceRefs, ...policy.priorAnswerRefs, ...policy.priorDecisionRefs] : []),
    ...mailBatch.flatMap((item) => item.evidenceRefs),
    ...priorDecisions.flatMap((decision) => [decision.decisionId, ...decision.evidenceRefs]),
  ]);
  const pressure = input.pressureCheck?.({
    wakeRequest: runningAttempt,
    now,
  }) ?? null;
  let admissionReleased = false;
  const releaseAdmission = (outcome: "completed" | "failed" | "rejected" | "aborted") => {
    if (admissionReleased) return;
    admissionReleased = true;
    pressure?.release?.(outcome);
  };
  if (pressure?.deferred) {
    const nextRetryAt = addMs(now, wakeAttemptBackoffMs(runningAttempt.attemptCount));
    const reason = pressure.reason ?? "runtime_memory_pressure";
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      status: "deferred_for_pressure",
      failureReason: reason,
      nextRetryAt,
      now,
    });
    releaseAdmission("rejected");
    return recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "deferred_for_pressure",
      failedReason: reason,
      evidenceRefs,
      createdAt: now,
    });
  }
  try {
    const prompt = buildWakePrompt({
      wake: running,
      policy,
      mailBatch,
      priorDecisions,
      voicePolicy,
    });
    const response = await (input.askTurnRunner ?? defaultAskTurnRunner(input.baseUrl))({
      prompt,
      threadId: running.threadId,
      evidenceRefs,
      wakeRequest: running,
    });
    const askTurnId = extractAskTurnId(response);
    const decisionIds = extractDecisionIds(response);
    if (decisionIds.length === 0) {
      const failedReason = "mail_wake_decision_missing";
      markStagePlayMailWakeTerminalFailed({
        wakeRequestId: running.wakeRequestId,
        failureReason: failedReason,
        now: new Date().toISOString(),
      });
      releaseAdmission("failed");
      return recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "failed_terminal",
        askTurnId,
        failedReason,
        evidenceRefs: uniqueStrings([...evidenceRefs, ...(askTurnId ? [askTurnId] : [])]),
        createdAt: new Date().toISOString(),
      });
    }
    const completed = markStagePlayMailWakeCompleted({
      wakeRequestId: running.wakeRequestId,
      askTurnId,
      decisionIds,
      evidenceRefs,
      now: new Date().toISOString(),
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "completed",
      askTurnId: completed?.askTurnId ?? askTurnId,
      decisionIds: completed?.decisionIds ?? decisionIds,
      evidenceRefs: completed?.evidenceRefs ?? evidenceRefs,
      createdAt: new Date().toISOString(),
    });
    const storedDecisions = (completed?.decisionIds ?? decisionIds)
      .map((decisionId) => getStagePlayMailDecision(decisionId))
      .filter((decision): decision is StagePlayLiveSourceMailDecisionV1 => Boolean(decision));
    const voiceReceipts: StagePlayLiveSourceVoiceDeliveryReceiptV1[] = [];
    for (const decision of storedDecisions) {
      const receipt = await maybeRunStagePlayLiveSourceVoiceDelivery({
        decision,
        runner: input.voiceDeliveryRunner ?? null,
        now: wakeResult.createdAt,
      });
      if (receipt) voiceReceipts.push(receipt);
    }
    const transcriptRows = buildDurableWakeTranscriptRows({
      wake: completed ?? running,
      wakeResult,
      mailBatch,
      decisionIds: completed?.decisionIds ?? decisionIds,
      voiceReceipts,
      evidenceRefs: uniqueStrings([
        ...(completed?.evidenceRefs ?? evidenceRefs),
        ...voiceReceipts.flatMap((receipt) => receipt.evidenceRefs),
      ]),
      createdAt: wakeResult.createdAt,
    });
    const transcriptEntries = recordStagePlayLiveSourceMailTranscriptEntries({
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      wakeRequestId: running.wakeRequestId,
      wakeResultId: wakeResult.wakeResultId,
      askTurnId: wakeResult.askTurnId ?? askTurnId,
      decisionIds: wakeResult.decisionIds,
      mailIds: running.mailIds,
      sourceIds: running.sourceIds,
      rows: transcriptRows,
      evidenceRefs: uniqueStrings([
        ...wakeResult.evidenceRefs,
        ...voiceReceipts.flatMap((receipt) => [receipt.receiptId, ...receipt.evidenceRefs]),
      ]),
      createdAt: wakeResult.createdAt,
    });
    return {
      ...wakeResult,
      evidenceRefs: uniqueStrings([
        ...wakeResult.evidenceRefs,
        ...transcriptEntries.map((entry) => entry.entryId),
      ]),
    };
  } catch (err) {
    releaseAdmission(isPressure503(err) ? "rejected" : "failed");
    const failedAt = now;
    if (isPressure503(err)) {
      const nextRetryAt = addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount));
      markStagePlayMailWakeRetryable({
        wakeRequestId: running.wakeRequestId,
        status: "deferred_for_pressure",
        failureReason: "ask_turn_pressure_503",
        nextRetryAt,
        now: failedAt,
      });
      return recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "deferred_for_pressure",
        failedReason: "ask_turn_pressure_503",
        evidenceRefs,
        createdAt: failedAt,
      });
    }
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      failureReason: err instanceof Error ? err.message : String(err),
      nextRetryAt: addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount)),
      now: failedAt,
    });
    return recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "failed_retryable",
      failedReason: err instanceof Error ? err.message : String(err),
      evidenceRefs,
      createdAt: failedAt,
    });
  } finally {
    releaseAdmission("completed");
  }
}
