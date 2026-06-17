import crypto from "node:crypto";
import type {
  StagePlayLiveSourceMailDecisionV1,
  StagePlayLiveSourceMailItemV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import {
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  validateAgentGoalSessionV1,
  validateWorkstationGoalContextUpdateV1,
  type AgentGoalSessionV1,
  type GoalContextProducerKindV1,
  type GoalContextUpdateKindV1,
  type WorkstationDispatchActionV1,
  type WorkstationGoalContextUpdateV1,
} from "@shared/contracts/workstation-goal-context.v1";

const updatesById = new Map<string, WorkstationGoalContextUpdateV1>();
const sessionsById = new Map<string, AgentGoalSessionV1>();
const MAX_UPDATES_PER_THREAD = 240;
const MAX_SESSIONS_PER_THREAD = 80;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalize = (value?: string | null): string | null => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const previewText = (value: string, limit = 240): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const readTimeMs = (value: string | null | undefined, fallbackMs: number): number => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallbackMs;
};

const lookupMail = (
  packet: StagePlayProcessedMailPacketV1,
  mailById: Map<string, StagePlayLiveSourceMailItemV1>,
): StagePlayLiveSourceMailItemV1 | null =>
  packet.mailIds.map((mailId) => mailById.get(mailId)).find((mail): mail is StagePlayLiveSourceMailItemV1 => Boolean(mail)) ??
  null;

const sourceKindToProducer = (sourceKind?: string | null): GoalContextProducerKindV1 => {
  if (sourceKind === "visual_frame" || sourceKind === "screen_summary") return "visual_capture";
  if (sourceKind === "audio_transcript") return "transcription_loop";
  if (sourceKind === "document_markdown") return "microdeck";
  return "microdeck";
};

const sourceKindToUpdateKind = (
  sourceKind: string | null | undefined,
  packet: StagePlayProcessedMailPacketV1,
): GoalContextUpdateKindV1 => {
  if (packet.resolutionState === "ask_decision_needed" || packet.arbiter?.wakeAsk) return "suggested_action";
  if (packet.uncertainties.length > 0 && packet.observedFacts.length === 0) return "error";
  if (sourceKind === "visual_frame" || sourceKind === "screen_summary") return "visual_observation";
  if (sourceKind === "audio_transcript") return "transcript_window";
  if (sourceKind === "document_markdown") return "translated_transcript";
  return packet.objectTags.length > 0 ? "classification" : "summary";
};

const buildDispatchActions = (input: {
  packet: StagePlayProcessedMailPacketV1;
  primaryMail: StagePlayLiveSourceMailItemV1 | null;
  wakeRequests: StagePlayLiveSourceMailWakeRequestV1[];
  wakeResults: StagePlayLiveSourceMailWakeResultV1[];
  decisions: StagePlayLiveSourceMailDecisionV1[];
}): WorkstationDispatchActionV1[] => {
  const dispatch: WorkstationDispatchActionV1[] = [
    { kind: "log_receipt", receiptRef: input.packet.packetId },
    {
      kind: "append_goal_context",
      goalId: input.primaryMail?.objective?.objectiveId ?? `stage_play_goal:${hashShort([input.packet.jobId, input.packet.sourceId], 12)}`,
    },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
  ];
  const shouldSpeak =
    input.packet.salience.voiceCandidate ||
    input.packet.arbiter?.voiceCandidate ||
    input.packet.voiceCalloutMatches.length > 0 ||
    input.decisions.some((decision) => decision.voiceCalloutDraft?.voiceEligible);
  if (shouldSpeak) dispatch.push({ kind: "speak_narrator", mode: "confirm" });
  const hasWakeReceipt =
    input.packet.arbiter?.wakeAsk ||
    input.wakeRequests.some((wake) => wake.packetIds?.includes(input.packet.packetId)) ||
    input.wakeResults.some((result) => result.packetIds?.includes(input.packet.packetId));
  if (hasWakeReceipt) {
    dispatch.push({
      kind: "wake_agent",
      reason: input.packet.arbiter?.reason ?? "packet references an interrupt-capable wake receipt",
    });
  }
  return dispatch;
};

const buildPacketPreview = (
  packet: StagePlayProcessedMailPacketV1,
  primaryRun: StagePlayMicroReasonerRunV1 | null,
  primaryMail: StagePlayLiveSourceMailItemV1 | null,
): string =>
  previewText(
    packet.arbiter?.reason ||
      packet.salience.calloutDraft ||
      packet.observedFacts[0] ||
      packet.inferredFacts[0] ||
      primaryRun?.outputPreview ||
      primaryMail?.summary.preview ||
      primaryMail?.summary.text ||
      "Stage Play packet produced goal-context evidence.",
  );

const trimThreadUpdates = (threadId: string): void => {
  const entries = listStagePlayGoalContextUpdates({ threadId, limit: Number.MAX_SAFE_INTEGER }).reverse();
  if (entries.length <= MAX_UPDATES_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_UPDATES_PER_THREAD)) {
    updatesById.delete(entry.updateId);
  }
};

const trimThreadSessions = (threadId: string): void => {
  const entries = listStagePlayAgentGoalSessions({ threadId, limit: Number.MAX_SAFE_INTEGER }).reverse();
  if (entries.length <= MAX_SESSIONS_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_SESSIONS_PER_THREAD)) {
    sessionsById.delete(entry.goalId);
  }
};

export function recordStagePlayGoalContextUpdate(
  update: WorkstationGoalContextUpdateV1,
): WorkstationGoalContextUpdateV1 {
  const issues = validateWorkstationGoalContextUpdateV1(update);
  if (issues.length > 0) {
    throw new Error(`Invalid Stage Play goal-context update: ${issues.join("; ")}`);
  }
  updatesById.set(update.updateId, update);
  trimThreadUpdates(update.loopRefs.find((ref) => ref.startsWith("thread:"))?.slice("thread:".length) ?? "");
  return update;
}

export function listStagePlayGoalContextUpdates(input: {
  threadId?: string | null;
  sourceRef?: string | null;
  loopRef?: string | null;
  contentRef?: string | null;
  goalId?: string | null;
  producerKind?: GoalContextProducerKindV1 | string | null;
  updateKind?: GoalContextUpdateKindV1 | string | null;
  limit?: number;
} = {}): WorkstationGoalContextUpdateV1[] {
  const sourceRef = normalize(input.sourceRef);
  const loopRef = normalize(input.loopRef);
  const contentRef = normalize(input.contentRef);
  const goalId = normalize(input.goalId);
  const threadLoopRef = normalize(input.threadId) ? `thread:${normalize(input.threadId)}` : null;
  return Array.from(updatesById.values())
    .filter((update) => !threadLoopRef || update.loopRefs.includes(threadLoopRef))
    .filter((update) => !sourceRef || update.sourceRefs.includes(sourceRef))
    .filter((update) => !loopRef || update.loopRefs.includes(loopRef))
    .filter((update) => !contentRef || update.contentRef === contentRef)
    .filter((update) => !goalId || update.goalRelevance?.goalId === goalId)
    .filter((update) => !input.producerKind || update.producerKind === input.producerKind)
    .filter((update) => !input.updateKind || update.updateKind === input.updateKind)
    .sort((left, right) => right.createdAtMs - left.createdAtMs || left.updateId.localeCompare(right.updateId))
    .slice(0, input.limit ?? 80);
}

export function upsertStagePlayAgentGoalSession(session: AgentGoalSessionV1): AgentGoalSessionV1 {
  const issues = validateAgentGoalSessionV1(session);
  if (issues.length > 0) {
    throw new Error(`Invalid Stage Play agent-goal session: ${issues.join("; ")}`);
  }
  sessionsById.set(session.goalId, session);
  trimThreadSessions(session.threadId);
  return session;
}

export function listStagePlayAgentGoalSessions(input: {
  threadId?: string | null;
  goalId?: string | null;
  status?: AgentGoalSessionV1["status"] | string | null;
  sourceRef?: string | null;
  limit?: number;
} = {}): AgentGoalSessionV1[] {
  const sourceRef = normalize(input.sourceRef);
  return Array.from(sessionsById.values())
    .filter((session) => !input.threadId || session.threadId === input.threadId)
    .filter((session) => !input.goalId || session.goalId === input.goalId)
    .filter((session) => !input.status || session.status === input.status)
    .filter((session) => !sourceRef || session.sourceRefs.includes(sourceRef))
    .sort((left, right) => {
      const leftTime = left.checkpoints.at(-1)?.createdAtMs ?? 0;
      const rightTime = right.checkpoints.at(-1)?.createdAtMs ?? 0;
      return rightTime - leftTime || left.goalId.localeCompare(right.goalId);
    })
    .slice(0, input.limit ?? 40);
}

export function ensureStagePlayAgentGoalSession(input: {
  threadId: string;
  roomId?: string | null;
  objectiveId?: string | null;
  objectiveText?: string | null;
  sourceRefs?: string[];
  loopRefs?: string[];
  nowMs?: number;
}): AgentGoalSessionV1 | null {
  const objectiveText = normalize(input.objectiveText);
  if (!objectiveText) return null;
  const goalId = normalize(input.objectiveId) ?? `stage_play_goal:${hashShort([input.threadId, objectiveText], 14)}`;
  const existing = sessionsById.get(goalId);
  const sourceRefs = uniqueStrings([...(existing?.sourceRefs ?? []), ...(input.sourceRefs ?? [])]);
  const loopRefs = uniqueStrings([...(existing?.loopRefs ?? []), ...(input.loopRefs ?? [])]);
  const nowMs = input.nowMs ?? Date.now();
  return upsertStagePlayAgentGoalSession({
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId,
    threadId: input.threadId,
    roomId: input.roomId ?? existing?.roomId ?? null,
    objective: objectiveText,
    userVisibleSummary: previewText(objectiveText, 120),
    status: existing?.status ?? "active",
    sourceRefs,
    loopRefs,
    constructRefs: existing?.constructRefs ?? [],
    contextFeeds: existing?.contextFeeds ?? [
      {
        feedId: `stage_play_goal_feed:${hashShort([goalId, "microdeck_outputs"], 12)}`,
        sourceKind: "microdeck_outputs",
        freshnessMs: 30_000,
        relevancePolicy: "same-source-or-goal-id",
      },
      {
        feedId: `stage_play_goal_feed:${hashShort([goalId, "source_health"], 12)}`,
        sourceKind: "source_health",
        freshnessMs: 60_000,
        relevancePolicy: "same-source",
      },
    ],
    allowedActuators: existing?.allowedActuators ?? [
      "set_audio_preset",
      "set_visual_preset",
      "bind_narrator",
      "narrator_say",
      "update_live_answer",
      "query_trace_memory",
      "pause_loop",
      "repair_source",
      "ask_user",
    ],
    cadence: existing?.cadence ?? { kind: "user_turn_only" },
    stopConditions: existing?.stopConditions ?? [
      "User stops monitoring",
      "Source feed ends or becomes unavailable",
      "Terminal authority produces a final report",
    ],
    checkpoints: [
      ...(existing?.checkpoints ?? []),
      {
        checkpointId: `stage_play_goal_checkpoint:${hashShort([goalId, nowMs], 12)}`,
        createdAtMs: nowMs,
        summary: "Goal session observed Stage Play mailbox context.",
        evidenceRefs: sourceRefs.slice(0, 12),
        actionsTaken: ["append_goal_context"],
        nextStep: "continue",
      },
    ].slice(-20),
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
    },
  });
}

export function syncStagePlayGoalContextFromMailbox(input: {
  threadId: string;
  roomId?: string | null;
  mailItems: StagePlayLiveSourceMailItemV1[];
  processedMailPackets: StagePlayProcessedMailPacketV1[];
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
  decisions?: StagePlayLiveSourceMailDecisionV1[];
  wakeRequests?: StagePlayLiveSourceMailWakeRequestV1[];
  wakeResults?: StagePlayLiveSourceMailWakeResultV1[];
  nowMs?: number;
}): WorkstationGoalContextUpdateV1[] {
  const nowMs = input.nowMs ?? Date.now();
  const mailById = new Map(input.mailItems.map((mail) => [mail.mailId, mail]));
  const runsById = new Map(input.microReasonerRuns.map((run) => [run.runId, run]));
  const wakeRequests = input.wakeRequests ?? [];
  const wakeResults = input.wakeResults ?? [];
  const decisions = input.decisions ?? [];

  for (const mail of input.mailItems) {
    ensureStagePlayAgentGoalSession({
      threadId: input.threadId,
      roomId: input.roomId ?? mail.roomId ?? null,
      objectiveId: mail.objective?.objectiveId,
      objectiveText: mail.objective?.text,
      sourceRefs: [mail.sourceId, mail.mailId],
      loopRefs: [`thread:${input.threadId}`, `stage_play_mail_loop:${input.threadId}`, mail.mailId],
      nowMs: readTimeMs(mail.updatedAt || mail.createdAt, nowMs),
    });
  }

  for (const packet of input.processedMailPackets) {
    const primaryMail = lookupMail(packet, mailById);
    const primaryRun = packet.microReasonerRunRefs.map((runRef) => runsById.get(runRef)).find(Boolean) ?? null;
    const sourceKind = primaryMail?.sourceKind ?? null;
    const observedAtMs = readTimeMs(packet.createdAt, nowMs);
    const goalId =
      primaryMail?.objective?.objectiveId ??
      `stage_play_goal:${hashShort([input.threadId, packet.jobId, packet.sourceId], 14)}`;
    const sourceRefs = uniqueStrings([
      packet.sourceId,
      primaryMail?.sourceId,
      ...packet.mailIds,
      ...packet.visualEvidenceRefs,
      ...(primaryRun?.outputRefs ?? []),
    ]);
    const loopRefs = uniqueStrings([
      `thread:${input.threadId}`,
      `stage_play_mail_loop:${input.threadId}`,
      packet.jobId,
      packet.microReasonerDeck?.presetId,
      ...(packet.microReasonerRunRefs ?? []),
    ]);
    recordStagePlayGoalContextUpdate({
      schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
      updateId: `stage_play_goal_context_update:${hashShort([input.threadId, packet.packetId, packet.createdAt], 18)}`,
      createdAtMs: nowMs,
      sourceRefs,
      loopRefs,
      producerKind: packet.microReasonerRunRefs.length > 0 ? "microdeck" : sourceKindToProducer(sourceKind),
      updateKind: sourceKindToUpdateKind(sourceKind, packet),
      contentRef: packet.packetId,
      preview: buildPacketPreview(packet, primaryRun, primaryMail),
      evidenceRefs: uniqueStrings([
        packet.packetId,
        ...packet.evidenceRefs,
        ...packet.visualEvidenceRefs,
        ...(primaryRun?.outputRefs ?? []),
      ]).slice(0, 80),
      receiptRefs: uniqueStrings([
        ...packet.mailIds,
        ...packet.microReasonerRunRefs,
        ...decisions.filter((decision) => decision.mailIds.some((mailId) => packet.mailIds.includes(mailId))).map((decision) => decision.decisionId),
        ...wakeRequests.filter((wake) => wake.packetIds?.includes(packet.packetId)).map((wake) => wake.wakeRequestId),
        ...wakeResults.filter((result) => result.packetIds?.includes(packet.packetId)).map((result) => result.wakeResultId),
      ]).slice(0, 80),
      freshness: {
        observedAtMs,
        staleAfterMs: 30_000,
        status: primaryMail?.hints.sourceFreshness === "stale" ? "stale" : "fresh",
      },
      goalRelevance: {
        goalId,
        relevance: packet.salience.level === "urgent" ? 1 : packet.salience.level === "high" ? 0.85 : 0.65,
        reason: primaryMail?.objective?.text ?? packet.salience.reasons[0] ?? "Packet belongs to the Stage Play mailbox loop.",
      },
      suggestedDispatch: buildDispatchActions({
        packet,
        primaryMail,
        wakeRequests,
        wakeResults,
        decisions: decisions.filter((decision) => decision.mailIds.some((mailId) => packet.mailIds.includes(mailId))),
      }),
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
  }

  return listStagePlayGoalContextUpdates({ threadId: input.threadId, limit: 80 });
}

export function resetStagePlayGoalContextStoreForTest(): void {
  updatesById.clear();
  sessionsById.clear();
}
