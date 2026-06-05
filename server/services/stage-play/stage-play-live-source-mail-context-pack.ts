import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA,
  type StagePlayLiveSourceMailContextPackV1,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourceJobStateV1,
  type StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  listStagePlayLiveSourceWatchJobPolicies,
  listStagePlayMailDecisions,
} from "./stage-play-live-source-mailbox-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 260): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : text;
};

const policyMatchesJobState = (
  policy: StagePlayLiveSourceWatchJobPolicyV1,
  state: StagePlayLiveSourceJobStateV1,
): boolean =>
  policy.jobId === state.jobId ||
  policy.sourceIds.length === 0 ||
  policy.sourceIds.some((sourceId) => state.sourceIds.includes(sourceId));

const itemMatchesSourceIds = (item: StagePlayLiveSourceMailItemV1, sourceIds: Set<string>): boolean =>
  sourceIds.size === 0 || sourceIds.has(item.sourceId);

const decisionMatchesScope = (
  decision: StagePlayLiveSourceMailDecisionV1,
  scopedMailIds: Set<string>,
  scopedJobIds: Set<string>,
): boolean =>
  (decision.activeJobId ? scopedJobIds.has(decision.activeJobId) : false) ||
  decision.mailIds.some((mailId) => scopedMailIds.has(mailId));

export function buildStagePlayLiveSourceMailContextPack(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  now?: string;
  mailLimit?: number;
  decisionLimit?: number;
}): StagePlayLiveSourceMailContextPackV1 {
  const createdAt = input.now ?? new Date().toISOString();
  const armedPolicies = listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    status: "armed",
    limit: 12,
  });
  const jobStates = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 20,
  }).filter((state) =>
    state.status === "armed" &&
    armedPolicies.some((policy) => policyMatchesJobState(policy, state))
  );
  const includedReason: StagePlayLiveSourceMailContextPackV1["includedReason"] =
    armedPolicies.length > 0 ? "armed_watch_job" : "none";
  if (includedReason === "none") {
    return {
      artifactId: "stage_play_live_source_mail_context_pack",
      schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA,
      contextPackId: `stage_play_live_source_mail_context_pack:${hashShort([
        input.threadId,
        input.roomId ?? null,
        input.environmentId ?? null,
        "none",
        createdAt,
      ])}`,
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      includedReason,
      activeWatchJobs: [],
      jobStates: [],
      latestMailItems: [],
      latestDecisions: [],
      latestTextAnswerDrafts: [],
      latestVoiceCalloutDrafts: [],
      currentMailboxCursor: null,
      evidenceRefs: [],
      createdAt,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
  }
  const scopedSourceIds = new Set(uniqueStrings([
    ...armedPolicies.flatMap((policy) => policy.sourceIds),
    ...jobStates.flatMap((state) => state.sourceIds),
  ]));
  const latestMailItems = listStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: input.mailLimit ?? 12,
  }).filter((item) => itemMatchesSourceIds(item, scopedSourceIds));
  const scopedMailIds = new Set(latestMailItems.map((item) => item.mailId));
  const scopedJobIds = new Set(uniqueStrings([
    ...armedPolicies.map((policy) => policy.jobId),
    ...jobStates.map((state) => state.jobId),
  ]));
  const latestDecisions = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: input.decisionLimit ?? 12,
  }).filter((decision) => decisionMatchesScope(decision, scopedMailIds, scopedJobIds));
  const currentMailboxCursor =
    jobStates.map((state) => state.mailboxCursor ?? state.lastMailId ?? null).filter(Boolean).at(-1) ?? null;
  const evidenceRefs = uniqueStrings([
    ...armedPolicies.flatMap((policy) => [policy.policyId, policy.jobId, ...policy.evidenceRefs]),
    ...jobStates.flatMap((state) => [state.jobId, state.mailboxCursor, state.lastMailId, state.lastDecisionId]),
    ...latestMailItems.flatMap((item) => [item.mailId, ...item.evidenceRefs]),
    ...latestDecisions.flatMap((decision) => [decision.decisionId, ...decision.evidenceRefs]),
  ]);
  return {
    artifactId: "stage_play_live_source_mail_context_pack",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA,
    contextPackId: `stage_play_live_source_mail_context_pack:${hashShort([
      input.threadId,
      input.roomId ?? null,
      input.environmentId ?? null,
      armedPolicies.map((policy) => policy.policyId),
      latestDecisions.map((decision) => decision.decisionId),
      currentMailboxCursor,
      createdAt,
    ])}`,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    includedReason,
    activeWatchJobs: armedPolicies.map((policy) => ({
      jobId: policy.jobId,
      policyId: policy.policyId,
      objectiveText: clipText(policy.objectiveText, 420),
      decisionPolicyPrompt: clipText(policy.decisionPolicyPrompt, 420),
      sourceIds: policy.sourceIds,
      outputPolicy: policy.outputPolicy,
      importanceCriteria: policy.importanceCriteria.map((entry) => clipText(entry, 120)).filter(Boolean),
      suppressCriteria: policy.suppressCriteria.map((entry) => clipText(entry, 120)).filter(Boolean),
      status: policy.status,
      updatedAt: policy.updatedAt,
    })),
    jobStates: jobStates.map((state) => ({
      jobId: state.jobId,
      sourceIds: state.sourceIds,
      status: state.status,
      mailboxCursor: state.mailboxCursor ?? null,
      lastMailId: state.lastMailId ?? null,
      lastDecisionId: state.lastDecisionId ?? null,
      nextLoopState: state.nextLoopState,
      updatedAt: state.updatedAt,
    })),
    latestMailItems: latestMailItems.map((item) => ({
      mailId: item.mailId,
      sourceId: item.sourceId,
      sourceKind: item.sourceKind,
      status: item.status,
      summaryPreview: clipText(item.summary.preview || item.summary.text, 320),
      confidence: item.summary.confidence ?? null,
      analysisState: item.summary.analysisState ?? "unknown",
      evidenceRefs: item.evidenceRefs,
      createdAt: item.createdAt,
    })),
    latestDecisions: latestDecisions.map((decision) => ({
      decisionId: decision.decisionId,
      mailIds: decision.mailIds,
      decision: decision.decision,
      rationalePreview: clipText(decision.rationalePreview, 320),
      textAnswerDraft: decision.textAnswerDraft?.text ? clipText(decision.textAnswerDraft.text, 420) : null,
      voiceCalloutDraft: decision.voiceCalloutDraft?.text ? clipText(decision.voiceCalloutDraft.text, 220) : null,
      activeJobId: decision.activeJobId ?? null,
      mailboxCursor: decision.mailboxCursor ?? null,
      evidenceRefs: decision.evidenceRefs,
      createdAt: decision.createdAt,
    })),
    latestTextAnswerDrafts: latestDecisions
      .filter((decision) => Boolean(decision.textAnswerDraft?.text))
      .map((decision) => ({
        decisionId: decision.decisionId,
        text: clipText(decision.textAnswerDraft?.text, 420),
        terminalEligible: decision.textAnswerDraft?.terminalEligible === true,
        createdAt: decision.createdAt,
      })),
    latestVoiceCalloutDrafts: latestDecisions
      .filter((decision) => Boolean(decision.voiceCalloutDraft?.text))
      .map((decision) => ({
        decisionId: decision.decisionId,
        text: clipText(decision.voiceCalloutDraft?.text, 220),
        voiceEligible: decision.voiceCalloutDraft?.voiceEligible === true,
        requiresConfirmation: decision.voiceCalloutDraft?.requiresConfirmation === true,
        createdAt: decision.createdAt,
      })),
    currentMailboxCursor,
    evidenceRefs,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}
