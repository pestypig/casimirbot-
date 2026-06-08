import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_NARRATIVE_STATE_SCHEMA,
  type LiveSourceCausalTraceV1,
  type StagePlayLiveSourceNarrativeStateV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const narrativeStatesById = new Map<string, StagePlayLiveSourceNarrativeStateV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const previewText = (text: string, limit = 220): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const scopeMatches = (state: StagePlayLiveSourceNarrativeStateV1, input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceId?: string | null;
}): boolean => {
  if (input.threadId && state.threadId !== input.threadId) return false;
  if (input.roomId && state.roomId !== input.roomId) return false;
  if (input.environmentId && state.environmentId !== input.environmentId) return false;
  if (input.jobId && state.jobId !== input.jobId) return false;
  if (input.policyId && state.policyId !== input.policyId) return false;
  if (input.sourceId && !state.sourceIds.includes(input.sourceId)) return false;
  return true;
};

export function getLatestStagePlayLiveSourceNarrativeState(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceId?: string | null;
  stalenessState?: StagePlayLiveSourceNarrativeStateV1["staleness"]["state"] | null;
  before?: string | null;
} = {}): StagePlayLiveSourceNarrativeStateV1 | null {
  return Array.from(narrativeStatesById.values())
    .filter((state) => scopeMatches(state, input))
    .filter((state) => !input.stalenessState || state.staleness.state === input.stalenessState)
    .filter((state) => !input.before || state.createdAt < input.before)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1) ?? null;
}

export function recordStagePlayLiveSourceNarrativeState(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId: string;
  policyId?: string | null;
  sourceIds: string[];
  mailBatchRefs: string[];
  sourceEvidenceRefs?: string[];
  currentSceneSummary: string;
  runningStorySummary?: string | null;
  interpretedSituation?: Partial<StagePlayLiveSourceNarrativeStateV1["interpretedSituation"]> | null;
  meaningfulChanges?: string[];
  uncertainties?: string[];
  watchNext?: Partial<StagePlayLiveSourceNarrativeStateV1["watchNext"]> | null;
  prediction?: StagePlayLiveSourceNarrativeStateV1["prediction"];
  lastDecisionRef?: string | null;
  evidenceRefs?: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt?: string;
}): StagePlayLiveSourceNarrativeStateV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const prior = getLatestStagePlayLiveSourceNarrativeState({
    threadId: input.threadId,
    jobId: input.jobId,
    before: createdAt,
  });
  const currentSceneSummary = previewText(input.currentSceneSummary, 520);
  const runningStorySummary = previewText(
    input.runningStorySummary ??
      (prior?.runningStorySummary
        ? `${prior.runningStorySummary} Latest update: ${currentSceneSummary}`
        : currentSceneSummary),
    900,
  );
  const sourceEvidenceRefs = uniqueStrings(input.sourceEvidenceRefs ?? []);
  const evidenceRefs = uniqueStrings([
    ...input.mailBatchRefs,
    ...sourceEvidenceRefs,
    input.policyId,
    input.jobId,
    input.lastDecisionRef,
    prior?.narrativeStateId,
    ...(input.evidenceRefs ?? []),
  ]);
  const narrativeStateId = `stage_play_live_source_narrative_state:${hashShort([
    input.threadId,
    input.jobId,
    input.mailBatchRefs,
    currentSceneSummary,
    createdAt,
  ])}`;
  const narrative: StagePlayLiveSourceNarrativeStateV1 = {
    artifactId: "stage_play_live_source_narrative_state",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_NARRATIVE_STATE_SCHEMA,
    narrativeStateId,
    jobId: input.jobId,
    policyId: input.policyId ?? null,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds: uniqueStrings(input.sourceIds),
    priorNarrativeStateRef: prior?.narrativeStateId ?? null,
    mailBatchRefs: uniqueStrings(input.mailBatchRefs),
    sourceEvidenceRefs,
    currentSceneSummary,
    runningStorySummary,
    interpretedSituation: {
      setting: input.interpretedSituation?.setting ?? prior?.interpretedSituation.setting ?? null,
      activeWindowOrScene:
        input.interpretedSituation?.activeWindowOrScene ??
        prior?.interpretedSituation.activeWindowOrScene ??
        null,
      entities: uniqueStrings(input.interpretedSituation?.entities ?? prior?.interpretedSituation.entities ?? []),
      objects: uniqueStrings(input.interpretedSituation?.objects ?? prior?.interpretedSituation.objects ?? []),
      activities: uniqueStrings(input.interpretedSituation?.activities ?? prior?.interpretedSituation.activities ?? []),
      userRelevantMeaning: previewText(
        input.interpretedSituation?.userRelevantMeaning ??
          `The latest live-source mail should be treated as an interpretation update: ${currentSceneSummary}`,
        520,
      ),
    },
    meaningfulChanges: uniqueStrings(input.meaningfulChanges ?? [
      prior ? `Latest mail updates the prior story with: ${currentSceneSummary}` : "First compact live-source summary for this watch job.",
    ]),
    uncertainties: uniqueStrings(input.uncertainties ?? ["Raw visual/audio evidence is not included; interpretation is based on compact source mail."]),
    watchNext: {
      targets: uniqueStrings(input.watchNext?.targets ?? ["next compact source summary"]),
      reason: previewText(input.watchNext?.reason ?? "Watch the next mail batch to validate whether the interpreted situation changes.", 320),
    },
    prediction: input.prediction ?? null,
    staleness: {
      state: "current",
      staleAfterMailId: null,
      supersededByStateId: null,
    },
    lastDecisionRef: input.lastDecisionRef ?? null,
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces([input.causalTrace, prior?.causalTrace], {
      parentRefs: uniqueStrings([input.lastDecisionRef, prior?.narrativeStateId, ...input.mailBatchRefs]),
      causedBy: uniqueStrings([input.lastDecisionRef, ...input.mailBatchRefs]),
      producedRefs: [narrativeStateId],
      sourceIds: input.sourceIds,
      jobId: input.jobId,
      policyId: input.policyId ?? null,
      evidenceRefs,
    }),
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  if (prior && prior.staleness.supersededByStateId !== narrative.narrativeStateId) {
    markNarrativeStateSuperseded({
      narrativeStateId: prior.narrativeStateId,
      supersededByStateId: narrative.narrativeStateId,
      staleAfterMailId: narrative.mailBatchRefs[0] ?? null,
    });
  }
  narrativeStatesById.set(narrative.narrativeStateId, narrative);
  return narrative;
}

export function getStagePlayLiveSourceNarrativeState(narrativeStateId: string): StagePlayLiveSourceNarrativeStateV1 | null {
  return narrativeStatesById.get(narrativeStateId) ?? null;
}

export function listStagePlayLiveSourceNarrativeStates(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceId?: string | null;
  stalenessState?: StagePlayLiveSourceNarrativeStateV1["staleness"]["state"] | null;
  limit?: number;
} = {}): StagePlayLiveSourceNarrativeStateV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(narrativeStatesById.values())
    .filter((state) => scopeMatches(state, input))
    .filter((state) => !input.stalenessState || state.staleness.state === input.stalenessState)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function markNarrativeStateStaleAfterMail(input: {
  narrativeStateId?: string | null;
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  sourceId?: string | null;
  mailId: string;
}): StagePlayLiveSourceNarrativeStateV1 | null {
  const current = input.narrativeStateId
    ? getStagePlayLiveSourceNarrativeState(input.narrativeStateId)
    : getLatestStagePlayLiveSourceNarrativeState({
        threadId: input.threadId ?? null,
        roomId: input.roomId ?? null,
        environmentId: input.environmentId ?? null,
        jobId: input.jobId ?? null,
        sourceId: input.sourceId ?? null,
        stalenessState: "current",
      });
  if (!current) return null;
  const updated: StagePlayLiveSourceNarrativeStateV1 = {
    ...current,
    staleness: {
      ...current.staleness,
      state: "stale_after_new_mail",
      staleAfterMailId: input.mailId,
      supersededByStateId: current.staleness.supersededByStateId ?? null,
    },
  };
  narrativeStatesById.set(updated.narrativeStateId, updated);
  return updated;
}

export function markNarrativeStateSuperseded(input: {
  narrativeStateId: string;
  supersededByStateId: string;
  staleAfterMailId?: string | null;
}): StagePlayLiveSourceNarrativeStateV1 | null {
  const current = getStagePlayLiveSourceNarrativeState(input.narrativeStateId);
  if (!current) return null;
  const updated: StagePlayLiveSourceNarrativeStateV1 = {
    ...current,
    staleness: {
      ...current.staleness,
      state: "superseded",
      staleAfterMailId: input.staleAfterMailId ?? current.staleness.staleAfterMailId ?? null,
      supersededByStateId: input.supersededByStateId,
    },
  };
  narrativeStatesById.set(updated.narrativeStateId, updated);
  return updated;
}

export function resetStagePlayLiveSourceNarrativeStoreForTest(): void {
  narrativeStatesById.clear();
}
