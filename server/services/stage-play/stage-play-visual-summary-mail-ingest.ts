import crypto from "node:crypto";
import type { HelixVisualFrameEvidence } from "@shared/helix-visual-frame-evidence";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA,
  type AskTurnTranscriptRowDraftV1,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourceMailReadResultV1,
  type StagePlayLiveSourceVoicePolicyV1,
  type StagePlayMailDecisionV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { listVisualFrameEvidence } from "../situation-room/visual-snapshot-store";
import { getActiveLiveAnswerEnvironmentForThread, getLiveAnswerEnvironment } from "../situation-room/live-answer-environment-store";
import {
  enqueueStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceJobStates,
  listStagePlayMailDecisions,
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
  return {
    voiceEnabled,
    requiresConfirmation,
    allowedNow: input?.allowedNow ?? (voiceEnabled && !requiresConfirmation),
    reason: input?.reason ?? (voiceEnabled ? null : "voice_disabled"),
  };
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
      body: "live_env.check_live_source_mail",
      source: {
        toolName: "live_env.check_live_source_mail",
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
        : "No unread visual summary mail yet. Waiting for the next summary.",
      source: {
        toolName: "live_env.check_live_source_mail",
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
    if (input.decision.voiceCalloutDraft) {
      rows.push({
        rowId: `ask_turn_mail_voice:${hashShort(input.decision.decisionId)}`,
        rowKind: "voice_callout_request",
        title: "Voice callout draft",
        body: input.decision.voiceCalloutDraft.text,
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
        ? "Armed for next visual summary."
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
  let items = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    sourceId: input.sourceId ?? null,
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
    if (latest) items = [latest];
  }
  const now = input.now ?? new Date().toISOString();
  const delivered = markStagePlayMailDeliveredToAsk(items.map((item) => item.mailId), now);
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
    objective,
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
  ]);
  return {
    artifactId: "stage_play_live_source_mail_read_result",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA,
    readId,
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? environment?.environment_id ?? null,
    items: delivered,
    activeObjective: objective,
    priorDecisionRefs: priorDecisions.map((decision) => decision.decisionId),
    priorAnswerObservationRefs: [],
    voicePolicy: defaultVoicePolicy(input.voicePolicy),
    suggestedDecisionOptions: [
      "wait_for_next_summary",
      "record_interpretation",
      "draft_text_answer",
      "request_voice_callout",
      "request_more_evidence",
      "request_stage_play_checkpoint",
      "fail_closed",
    ],
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
  nextLoopState?: StagePlayLiveSourceMailDecisionV1["nextLoopState"] | null;
  evidenceRefs?: string[];
  modelReviewed?: boolean;
  now?: string;
}): StagePlayLiveSourceMailDecisionV1 {
  markStagePlayMailRead(input.mailIds, input.now);
  const voiceEligible = readBoolean(input.voiceEnabled, false) && !readBoolean(input.voiceRequiresConfirmation, false);
  const decision = recordStagePlayMailDecision({
    mailIds: input.mailIds,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    decision: input.decision,
    rationalePreview: input.rationalePreview,
    textAnswerDraft: input.textAnswerDraft ?? null,
    textAnswerTerminalEligible: input.textAnswerTerminalEligible === true,
    voiceCalloutDraft: input.voiceCalloutDraft ?? null,
    voiceEligible,
    voiceRequiresConfirmation: input.voiceRequiresConfirmation === true,
    nextLoopState: input.nextLoopState ?? (input.decision === "fail_closed" ? "blocked_tool_error" : "armed_for_next_summary"),
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
