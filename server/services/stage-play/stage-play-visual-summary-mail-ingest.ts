import crypto from "node:crypto";
import type { HelixVisualFrameEvidence } from "@shared/helix-visual-frame-evidence";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA,
  type AskTurnTranscriptRowDraftV1,
  type StagePlayLiveSourceJobStateV1,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourceMailReadResultV1,
  type StagePlayLiveSourceWatchJobPolicyV1,
  type StagePlayLiveSourceVoicePolicyV1,
  type StagePlayMailDecisionV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { listVisualFrameEvidence } from "../situation-room/visual-snapshot-store";
import { getActiveLiveAnswerEnvironmentForThread, getLiveAnswerEnvironment } from "../situation-room/live-answer-environment-store";
import {
  isStagePlayLiveSourceVoiceRequestedTool,
} from "./stage-play-live-source-mail-voice-bridge";
import {
  enqueueStagePlayLiveSourceMailItem,
  getStagePlayLiveSourceWatchJobPolicy,
  getStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceJobStates,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceWatchJobPolicies,
  listUnreadStagePlayLiveSourceMailItems,
  markStagePlayMailDeliveredToAsk,
  markStagePlayMailRead,
  recordStagePlayMailDecision,
  upsertStagePlayLiveSourceJobState,
} from "./stage-play-live-source-mailbox-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const previewText = (text: string | null | undefined, limit = 220): string => {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const defaultVoicePolicy = (input?: Partial<StagePlayLiveSourceVoicePolicyV1> | null): StagePlayLiveSourceVoicePolicyV1 => {
  const voiceEnabled = input?.voiceEnabled === true;
  const requiresConfirmation = input?.requiresConfirmation === true;
  const allowedNow = voiceEnabled && !requiresConfirmation && input?.allowedNow === true;
  return {
    voiceEnabled,
    requiresConfirmation,
    allowedNow,
    reason: input?.reason ?? (
      !voiceEnabled
        ? "voice_disabled"
        : requiresConfirmation
          ? "voice_requires_confirmation"
          : allowedNow
            ? null
            : "voice_not_allowed_now"
    ),
  };
};

const isVoiceRequestedTool = (tool: StagePlayLiveSourceMailDecisionV1["requestedTool"] | null | undefined): boolean =>
  isStagePlayLiveSourceVoiceRequestedTool(tool);

const mailItemCanBeDeliveredToAsk = (
  item: StagePlayLiveSourceMailItemV1,
  input?: { includeDelivered?: boolean },
): boolean =>
  item.status === "unread" || (input?.includeDelivered === true && item.status === "delivered_to_ask");

const sourceScopeMatches = (
  scopedSourceIds: string[] | null | undefined,
  sourceIds: Set<string>,
): boolean =>
  sourceIds.size === 0 ||
  !scopedSourceIds ||
  scopedSourceIds.length === 0 ||
  scopedSourceIds.some((sourceId) => sourceIds.has(sourceId));

const resolveActiveWatchPolicyForMailRead = (input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  items: StagePlayLiveSourceMailItemV1[];
}): {
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  jobState: StagePlayLiveSourceJobStateV1 | null;
} => {
  const sourceIds = new Set([
    input.sourceId,
    ...input.items.map((item) => item.sourceId),
  ].filter((entry): entry is string => Boolean(entry)));
  const jobState = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 50,
  })
    .filter((state) => state.status === "armed" || state.status === "checking")
    .filter((state) => sourceScopeMatches(state.sourceIds, sourceIds))
    .filter((state) => Boolean(state.watchJobPolicyRef))
    .at(-1) ?? null;
  const policyFromJob = jobState?.watchJobPolicyRef
    ? getStagePlayLiveSourceWatchJobPolicy(jobState.watchJobPolicyRef)
    : null;
  if (policyFromJob && policyFromJob.status === "armed") {
    return { policy: policyFromJob, jobState };
  }
  const policy = listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    status: "armed",
    limit: 50,
  })
    .filter((candidate) => sourceScopeMatches(candidate.sourceIds, sourceIds))
    .at(-1) ?? null;
  return { policy, jobState };
};

const watchPolicyWantsDraftForEveryMailBatch = (
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): boolean => {
  if (!policy) return false;
  const policyText = [
    policy.objectiveText,
    policy.decisionPolicyPrompt,
    ...policy.importanceCriteria,
  ].join("\n");
  return (
    /\beach\s+(?:new\s+)?(?:visual-summary\s+)?mail\s+batch\b/i.test(policyText) ||
    /\bany\s+new\s+visual-summary\s+mail\s+batch\b/i.test(policyText) ||
    /\brecord\s+draft_text_answer\b/i.test(policyText)
  );
};

export function enqueueVisualSummaryMailFromEvidence(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId: string;
  visualFrameRef: string;
  visualEvidenceRef: string;
  summary: string;
  confidence?: number | null;
  analysisState?: "analysis_ready" | "pending" | "failed" | "unknown" | string | null;
  objective?: string | null;
  now?: string;
}): StagePlayLiveSourceMailItemV1 {
  return enqueueStagePlayLiveSourceMailItem({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId,
    sourceKind: "visual_frame",
    frameRef: input.visualFrameRef,
    evidenceRef: input.visualEvidenceRef,
    summaryText: input.summary,
    summaryPreview: previewText(input.summary),
    confidence: input.confidence ?? null,
    analysisState:
      input.analysisState === "pending" || input.analysisState === "failed" || input.analysisState === "unknown"
        ? input.analysisState
        : "analysis_ready",
    objectiveText: input.objective ?? null,
    evidenceRefs: [input.sourceId, input.visualFrameRef, input.visualEvidenceRef],
    createdAt: input.now,
  });
}

export function enqueueLatestVisualSummaryMailIfNeeded(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  objective?: string | null;
  now?: string;
}): StagePlayLiveSourceMailItemV1 | null {
  const evidence = listVisualFrameEvidence({ threadId: input.threadId, limit: 25 })
    .filter((entry) => !input.sourceId || entry.source_id === input.sourceId)
    .at(-1) ?? null;
  if (!evidence) return null;
  return enqueueVisualSummaryMailFromEvidence({
    threadId: evidence.thread_id,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: evidence.source_id,
    visualFrameRef: evidence.frame_id,
    visualEvidenceRef: evidence.evidence_id,
    summary: evidence.summary,
    confidence: evidence.supports_claims[0]?.confidence ?? null,
    analysisState: "analysis_ready",
    objective: input.objective ?? null,
    now: input.now ?? evidence.ts,
  });
}

export function buildMailLoopTranscriptRows(input: {
  mailItems?: StagePlayLiveSourceMailItemV1[];
  readResult?: StagePlayLiveSourceMailReadResultV1 | null;
  decision?: StagePlayLiveSourceMailDecisionV1 | null;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const rows: AskTurnTranscriptRowDraftV1[] = [];
  for (const item of input.mailItems ?? []) {
    rows.push({
      rowId: `ask_turn_mail_received:${hashShort(item.mailId)}`,
      rowKind: "mail_received",
      title: "Observation mail",
      body: `Visual summary received. Preview: ${item.summary.preview}`,
      source: {
        artifactId: item.mailId,
        artifactKind: item.artifactId,
      },
      evidenceRefs: item.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
  }
  if (input.readResult) {
    rows.push({
      rowId: `ask_turn_mail_read_tool_call:${hashShort(input.readResult.readId)}`,
      rowKind: "mail_read_tool_call",
      title: "Tool call",
      body: "live_env.read_live_source_mail",
      source: {
        toolName: "live_env.read_live_source_mail",
        artifactId: input.readResult.readId,
        artifactKind: input.readResult.artifactId,
      },
      evidenceRefs: input.readResult.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
    rows.push({
      rowId: `ask_turn_mail_read_receipt:${hashShort(input.readResult.readId)}`,
      rowKind: input.readResult.items.length > 0 ? "mail_read_receipt" : "wait_for_next_summary",
      title: "Tool receipt",
      body: input.readResult.items.length > 0
        ? `${input.readResult.items.length} unread live-source mail item(s).`
        : "No unread live-source updates. Standing by for the next source update.",
      source: {
        toolName: "live_env.read_live_source_mail",
        artifactId: input.readResult.readId,
        artifactKind: input.readResult.artifactId,
      },
      evidenceRefs: input.readResult.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
  }
  if (input.decision) {
    rows.push({
      rowId: `ask_turn_mail_decision:${hashShort(input.decision.decisionId)}`,
      rowKind: "agent_decision",
      title: "Agent decision",
      body: `${input.decision.decision}: ${input.decision.rationalePreview}`,
      source: {
        toolName: "live_env.record_live_source_mail_decision",
        artifactId: input.decision.decisionId,
        artifactKind: input.decision.artifactId,
      },
      evidenceRefs: input.decision.evidenceRefs,
      authority: "model_decision_receipt",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
    if (input.decision.requestedTool) {
      const voiceTool = isVoiceRequestedTool(input.decision.requestedTool);
      rows.push({
        rowId: `ask_turn_mail_${voiceTool ? "voice_tool" : "requested_tool"}:${hashShort(input.decision.decisionId)}`,
        rowKind: voiceTool ? "voice_tool_call" : "requested_tool",
        title: voiceTool ? "Voice tool call" : "Requested tool",
        body: `${input.decision.requestedTool.toolName}: ${previewText(JSON.stringify(input.decision.requestedTool.args), 180)}`,
        source: {
          toolName: "live_env.record_live_source_mail_decision",
          artifactId: input.decision.decisionId,
          artifactKind: input.decision.artifactId,
        },
        evidenceRefs: input.decision.evidenceRefs,
        authority: "model_decision_receipt",
        assistantAnswer: false,
        terminalEligible: false,
        createdAt,
      });
    }
    if (input.decision.voiceCalloutDraft) {
      const requiresConfirmation =
        input.decision.voicePolicy?.requiresConfirmation === true ||
        input.decision.voiceCalloutDraft.requiresConfirmation === true;
      rows.push({
        rowId: `ask_turn_mail_voice:${hashShort(input.decision.decisionId)}`,
        rowKind: "voice_callout_request",
        title: "Voice callout draft",
        body: requiresConfirmation
          ? `${input.decision.voiceCalloutDraft.text}\nAwaiting confirmation before voice delivery.`
          : input.decision.voiceCalloutDraft.text,
        source: {
          artifactId: input.decision.decisionId,
          artifactKind: input.decision.artifactId,
        },
        evidenceRefs: input.decision.evidenceRefs,
        authority: "model_decision_receipt",
        assistantAnswer: false,
        terminalEligible: false,
        createdAt,
      });
    }
    if (input.decision.textAnswerDraft) {
      rows.push({
        rowId: `ask_turn_mail_text:${hashShort(input.decision.decisionId)}`,
        rowKind: "text_answer",
        title: "Text draft",
        body: input.decision.textAnswerDraft.text,
        source: {
          artifactId: input.decision.decisionId,
          artifactKind: input.decision.artifactId,
        },
        evidenceRefs: input.decision.evidenceRefs,
        authority: "model_decision_receipt",
        assistantAnswer: false,
        terminalEligible: input.decision.textAnswerDraft.terminalEligible,
        createdAt,
      });
    }
    rows.push({
      rowId: `ask_turn_mail_loop_state:${hashShort(input.decision.decisionId)}`,
      rowKind: "loop_state",
      title: "Loop state",
      body: input.decision.nextLoopState === "armed_for_next_summary"
        ? "Armed for the next live-source update."
        : input.decision.nextLoopState,
      source: {
        artifactId: input.decision.decisionId,
        artifactKind: input.decision.artifactId,
      },
      evidenceRefs: input.decision.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
  }
  return rows;
}

export function readLiveSourceMailForAsk(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  mailIds?: string[];
  limit?: number;
  includeRead?: boolean;
  voicePolicy?: Partial<StagePlayLiveSourceVoicePolicyV1> | null;
  now?: string;
}): StagePlayLiveSourceMailReadResultV1 {
  const environment =
    (input.environmentId ? getLiveAnswerEnvironment(input.environmentId) : null) ??
    getActiveLiveAnswerEnvironmentForThread(input.threadId);
  const roomId = input.roomId ?? environment?.room_id ?? null;
  const objective = environment?.objective ?? null;
  const limit = Math.max(1, Math.min(input.limit ?? 3, 10));
  const requestedMailIds = uniqueStrings(input.mailIds ?? []).slice(0, limit);
  let items = requestedMailIds.length > 0
    ? requestedMailIds
        .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
        .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item))
        .filter((item) =>
          item.threadId === input.threadId &&
          (!roomId || item.roomId === roomId) &&
          (!(input.environmentId ?? environment?.environment_id ?? null) || item.environmentId === (input.environmentId ?? environment?.environment_id ?? null)) &&
          (!input.sourceId || item.sourceId === input.sourceId) &&
          (!input.sourceKind || item.sourceKind === input.sourceKind) &&
          mailItemCanBeDeliveredToAsk(item, { includeDelivered: true })
        )
        .sort((left, right) => {
          const leftIndex = requestedMailIds.indexOf(left.mailId);
          const rightIndex = requestedMailIds.indexOf(right.mailId);
          return leftIndex - rightIndex || left.createdAt.localeCompare(right.createdAt);
        })
    : listUnreadStagePlayLiveSourceMailItems({
        threadId: input.threadId,
        roomId,
        environmentId: input.environmentId ?? environment?.environment_id ?? null,
        sourceId: input.sourceId ?? null,
        sourceKind: input.sourceKind ?? null,
        includeDelivered: input.includeRead === true,
        limit,
      });
  if (items.length === 0) {
    const latest = enqueueLatestVisualSummaryMailIfNeeded({
      threadId: input.threadId,
      roomId,
      environmentId: input.environmentId ?? environment?.environment_id ?? null,
      sourceId: input.sourceId ?? null,
      objective,
      now: input.now,
    });
    if (requestedMailIds.length === 0 && latest && mailItemCanBeDeliveredToAsk(latest, { includeDelivered: input.includeRead === true })) {
      items = [latest];
    }
  }
  const now = input.now ?? new Date().toISOString();
  const delivered = markStagePlayMailDeliveredToAsk(items.map((item) => item.mailId), now);
  const activeWatch = resolveActiveWatchPolicyForMailRead({
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    sourceId: input.sourceId ?? null,
    items: delivered,
  });
  const activeObjective =
    activeWatch.policy?.objectiveText ??
    activeWatch.jobState?.objective ??
    objective;
  const readId = `stage_play_live_source_mail_read:${hashShort([
    input.threadId,
    roomId ?? null,
    input.environmentId ?? environment?.environment_id ?? null,
    delivered.map((item) => item.mailId),
    now,
  ])}`;
  upsertStagePlayLiveSourceJobState({
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    sourceIds: delivered.map((item) => item.sourceId),
    objective: activeObjective,
    watchJobPolicyRef: activeWatch.policy?.policyId ?? activeWatch.jobState?.watchJobPolicyRef ?? null,
    status: "checking",
    mailboxCursor: delivered.at(-1)?.mailId ?? null,
    lastMailId: delivered.at(-1)?.mailId ?? null,
    nextLoopState: delivered.length > 0 ? "continue_with_unread_mail" : "armed_for_next_summary",
    updatedAt: now,
  });
  const priorDecisions = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    limit: 8,
  });
  const evidenceRefs = uniqueStrings([
    ...delivered.map((item) => item.mailId),
    ...delivered.flatMap((item) => item.evidenceRefs),
    ...priorDecisions.slice(-3).map((decision) => decision.decisionId),
    activeWatch.policy?.policyId,
    activeWatch.policy?.jobId,
    ...(activeWatch.policy?.evidenceRefs ?? []),
    activeWatch.jobState?.jobId,
  ]);
  const suggestedDecisionOptions: StagePlayMailDecisionV1[] = watchPolicyWantsDraftForEveryMailBatch(activeWatch.policy) && delivered.length > 0
    ? [
        "draft_text_answer",
        "wait_for_next_summary",
        "record_interpretation",
        ...(defaultVoicePolicy(input.voicePolicy).voiceEnabled ? ["request_voice_callout" as const] : []),
        "request_more_evidence",
        "request_stage_play_checkpoint",
        "fail_closed",
      ]
    : [
        "wait_for_next_summary",
        "record_interpretation",
        "draft_text_answer",
        ...(defaultVoicePolicy(input.voicePolicy).voiceEnabled ? ["request_voice_callout" as const] : []),
        "request_more_evidence",
        "request_stage_play_checkpoint",
        "fail_closed",
      ];
  return {
    artifactId: "stage_play_live_source_mail_read_result",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA,
    readId,
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    items: delivered,
    activeObjective,
    priorDecisionRefs: uniqueStrings([
      ...(activeWatch.policy?.priorDecisionRefs ?? []),
      ...priorDecisions.map((decision) => decision.decisionId),
    ]),
    priorAnswerObservationRefs: activeWatch.policy?.priorAnswerRefs ?? [],
    voicePolicy: defaultVoicePolicy(input.voicePolicy),
    suggestedDecisionOptions,
    evidenceRefs,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function recordLiveSourceMailDecisionForAsk(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  mailIds: string[];
  decision: StagePlayMailDecisionV1;
  rationalePreview: string;
  textAnswerDraft?: string | null;
  textAnswerTerminalEligible?: boolean | null;
  voiceCalloutDraft?: string | null;
  voiceEnabled?: boolean | null;
  voiceRequiresConfirmation?: boolean | null;
  voiceAllowedNow?: boolean | null;
  voicePolicyReason?: string | null;
  voicePolicy?: Partial<StagePlayLiveSourceVoicePolicyV1> | null;
  requestedTool?: StagePlayLiveSourceMailDecisionV1["requestedTool"] | null;
  nextLoopState?: StagePlayLiveSourceMailDecisionV1["nextLoopState"] | null;
  evidenceRefs?: string[];
  modelReviewed?: boolean;
  now?: string;
}): StagePlayLiveSourceMailDecisionV1 {
  markStagePlayMailRead(input.mailIds, input.now);
  const voicePolicy = defaultVoicePolicy(input.voicePolicy ?? {
    voiceEnabled: readBoolean(input.voiceEnabled, false),
    requiresConfirmation: readBoolean(input.voiceRequiresConfirmation, false),
    allowedNow: readBoolean(input.voiceAllowedNow, false),
    reason: input.voicePolicyReason ?? null,
  });
  const rawVoiceDraft = previewText(input.voiceCalloutDraft, 420);
  let normalizedDecision = input.decision;
  let rationalePreview = input.rationalePreview;
  let requestedTool = input.requestedTool ?? null;
  let voiceCalloutDraft = voicePolicy.voiceEnabled ? rawVoiceDraft || null : null;
  let textAnswerDraft = input.textAnswerDraft ?? null;

  if (normalizedDecision === "request_voice_callout") {
    if (!rawVoiceDraft) {
      normalizedDecision = "request_more_evidence";
      rationalePreview = `${rationalePreview} Voice callout was not requested because voiceCalloutDraft.text was missing.`;
      requestedTool = null;
      voiceCalloutDraft = null;
    } else if (!voicePolicy.voiceEnabled) {
      normalizedDecision = "draft_text_answer";
      rationalePreview = `${rationalePreview} Voice is disabled, so the callout draft was retained as text only.`;
      requestedTool = null;
      voiceCalloutDraft = null;
      textAnswerDraft = textAnswerDraft ?? rawVoiceDraft;
    } else if (voicePolicy.requiresConfirmation) {
      requestedTool = null;
      voiceCalloutDraft = rawVoiceDraft;
    } else if (!voicePolicy.allowedNow) {
      requestedTool = null;
      voiceCalloutDraft = rawVoiceDraft;
    }
  }
  if (isVoiceRequestedTool(requestedTool) && !voicePolicy.allowedNow) {
    requestedTool = null;
  }
  textAnswerDraft =
    textAnswerDraft ??
    (!voicePolicy.voiceEnabled && rawVoiceDraft ? rawVoiceDraft : null);
  const decision = recordStagePlayMailDecision({
    mailIds: input.mailIds,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    decision: normalizedDecision,
    rationalePreview,
    textAnswerDraft,
    textAnswerTerminalEligible: input.textAnswerTerminalEligible === true,
    voiceCalloutDraft,
    voiceEligible: voicePolicy.allowedNow,
    voiceRequiresConfirmation: voicePolicy.requiresConfirmation,
    voicePolicy,
    requestedTool,
    nextLoopState: input.nextLoopState ?? (normalizedDecision === "fail_closed" ? "blocked_tool_error" : "armed_for_next_summary"),
    evidenceRefs: input.evidenceRefs ?? [],
    modelReviewed: input.modelReviewed !== false,
    createdAt: input.now,
  });
  return decision;
}

export function listLiveSourceMailboxDebug(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  limit?: number;
}) {
  return {
    schema: "stage_play_live_source_mailbox_debug/v1",
    jobs: listStagePlayLiveSourceJobStates(input),
    decisions: listStagePlayMailDecisions(input),
    assistant_answer: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
}

export const visualEvidenceToMailInput = (
  evidence: HelixVisualFrameEvidence,
  input?: {
    roomId?: string | null;
    environmentId?: string | null;
    objective?: string | null;
  },
) => ({
  threadId: evidence.thread_id,
  roomId: input?.roomId ?? null,
  environmentId: input?.environmentId ?? null,
  sourceId: evidence.source_id,
  visualFrameRef: evidence.frame_id,
  visualEvidenceRef: evidence.evidence_id,
  summary: evidence.summary,
  confidence: evidence.supports_claims[0]?.confidence ?? null,
  analysisState: "analysis_ready",
  objective: input?.objective ?? null,
  now: evidence.ts,
});
