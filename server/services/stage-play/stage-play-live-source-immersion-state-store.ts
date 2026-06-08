import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_IMMERSION_STATE_SCHEMA,
  type LiveSourceCausalTraceV1,
  type StagePlayLiveSourceImmersionStateV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const immersionStatesById = new Map<string, StagePlayLiveSourceImmersionStateV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const lowerSet = (values: string[]): Set<string> =>
  new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean));

const previewText = (text: string, limit = 360): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const scopeMatches = (state: StagePlayLiveSourceImmersionStateV1, input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  sourceId?: string | null;
}): boolean => {
  if (input.threadId && state.threadId !== input.threadId) return false;
  if (input.roomId && state.roomId !== input.roomId) return false;
  if (input.environmentId && state.environmentId !== input.environmentId) return false;
  if (input.jobId && state.jobId !== input.jobId) return false;
  if (input.policyId && state.policyId !== input.policyId) return false;
  if (input.profileId && state.profileId !== input.profileId) return false;
  if (input.sourceId && !state.sourceIds.includes(input.sourceId)) return false;
  return true;
};

const mergeStableFacts = (input: {
  prior?: StagePlayLiveSourceImmersionStateV1 | null;
  stableFacts?: string[];
  contradictedStableFacts?: string[];
}): string[] => {
  const contradicted = lowerSet(input.contradictedStableFacts ?? []);
  return uniqueStrings([
    ...(input.prior?.stableFacts ?? []),
    ...(input.stableFacts ?? []),
  ]).filter((fact) => !contradicted.has(fact.toLowerCase()));
};

export function getStagePlayLiveSourceImmersionState(
  immersionStateId: string,
): StagePlayLiveSourceImmersionStateV1 | null {
  return immersionStatesById.get(immersionStateId) ?? null;
}

export function getLatestStagePlayLiveSourceImmersionState(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  sourceId?: string | null;
  stalenessState?: StagePlayLiveSourceImmersionStateV1["staleness"]["state"] | null;
  before?: string | null;
} = {}): StagePlayLiveSourceImmersionStateV1 | null {
  return Array.from(immersionStatesById.values())
    .filter((state) => scopeMatches(state, input))
    .filter((state) => !input.stalenessState || state.staleness.state === input.stalenessState)
    .filter((state) => !input.before || state.createdAt < input.before)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1) ?? null;
}

export function listStagePlayLiveSourceImmersionStates(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  sourceId?: string | null;
  stalenessState?: StagePlayLiveSourceImmersionStateV1["staleness"]["state"] | null;
  limit?: number;
} = {}): StagePlayLiveSourceImmersionStateV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(immersionStatesById.values())
    .filter((state) => scopeMatches(state, input))
    .filter((state) => !input.stalenessState || state.staleness.state === input.stalenessState)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function recordStagePlayLiveSourceImmersionState(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId: string;
  policyId?: string | null;
  profileId?: string | null;
  sourceIds: string[];
  latestMailIds: string[];
  latestEvidenceRefs?: string[];
  sourceIdentity?: Partial<StagePlayLiveSourceImmersionStateV1["sourceIdentity"]> | null;
  stableFacts?: string[];
  contradictedStableFacts?: string[];
  currentSceneFacts?: string[];
  changedFacts?: string[];
  uncertainties?: string[];
  currentActivity?: StagePlayLiveSourceImmersionStateV1["currentActivity"];
  salience?: Partial<StagePlayLiveSourceImmersionStateV1["salience"]> | null;
  prediction?: StagePlayLiveSourceImmersionStateV1["prediction"];
  lastValidation?: StagePlayLiveSourceImmersionStateV1["lastValidation"] | null;
  evidenceRefs?: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt?: string;
}): StagePlayLiveSourceImmersionStateV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const sourceIds = uniqueStrings(input.sourceIds);
  const latestMailIds = uniqueStrings(input.latestMailIds);
  const latestEvidenceRefs = uniqueStrings(input.latestEvidenceRefs ?? []);
  const prior = getLatestStagePlayLiveSourceImmersionState({
    threadId: input.threadId,
    jobId: input.jobId,
    sourceId: sourceIds[0] ?? null,
    before: createdAt,
  });
  const stableFacts = mergeStableFacts({
    prior,
    stableFacts: input.stableFacts,
    contradictedStableFacts: input.contradictedStableFacts,
  });
  const currentSceneFacts = uniqueStrings(input.currentSceneFacts ?? []);
  const changedFacts = uniqueStrings(input.changedFacts ?? []);
  const uncertainties = uniqueStrings(
    input.uncertainties ??
      (prior?.uncertainties.length
        ? prior.uncertainties
        : ["Immersion state is derived from compact source mail; raw media is not included."]),
  );
  const evidenceRefs = uniqueStrings([
    input.jobId,
    input.policyId,
    input.profileId,
    prior?.immersionStateId,
    ...sourceIds,
    ...latestMailIds,
    ...latestEvidenceRefs,
    ...(input.evidenceRefs ?? []),
  ]);
  const immersionStateId = `stage_play_live_source_immersion_state:${hashShort([
    input.threadId,
    input.jobId,
    sourceIds,
    latestMailIds,
    currentSceneFacts,
    changedFacts,
    createdAt,
  ])}`;
  const sourceIdentity = {
    label: previewText(
      input.sourceIdentity?.label ??
        prior?.sourceIdentity.label ??
        "unknown live source",
      120,
    ),
    confidence: Math.max(0, Math.min(1, input.sourceIdentity?.confidence ?? prior?.sourceIdentity.confidence ?? 0)),
    stable: input.sourceIdentity?.stable ?? prior?.sourceIdentity.stable ?? false,
  };
  const state: StagePlayLiveSourceImmersionStateV1 = {
    artifactId: "stage_play_live_source_immersion_state",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_IMMERSION_STATE_SCHEMA,
    immersionStateId,
    jobId: input.jobId,
    policyId: input.policyId ?? prior?.policyId ?? null,
    profileId: input.profileId ?? prior?.profileId ?? null,
    threadId: input.threadId,
    roomId: input.roomId ?? prior?.roomId ?? null,
    environmentId: input.environmentId ?? prior?.environmentId ?? null,
    sourceIds,
    latestMailIds,
    latestEvidenceRefs,
    sourceIdentity,
    stableFacts,
    currentSceneFacts,
    changedFacts,
    uncertainties,
    currentActivity: input.currentActivity ?? prior?.currentActivity ?? "unknown",
    salience: {
      level: input.salience?.level ?? "low",
      reasons: uniqueStrings(input.salience?.reasons ?? []),
      voiceCandidate: input.salience?.voiceCandidate ?? false,
    },
    prediction: input.prediction ?? null,
    lastValidation: input.lastValidation ?? null,
    staleness: {
      state: "current",
      staleAfterMailId: null,
      supersededByStateId: null,
    },
    evidenceRefs: uniqueStrings([immersionStateId, ...evidenceRefs]),
    causalTrace: mergeLiveSourceCausalTraces([input.causalTrace, prior?.causalTrace], {
      parentRefs: uniqueStrings([prior?.immersionStateId, ...latestMailIds]),
      causedBy: latestMailIds,
      producedRefs: [immersionStateId],
      sourceIds,
      jobId: input.jobId,
      policyId: input.policyId ?? prior?.policyId ?? null,
      profileId: input.profileId ?? prior?.profileId ?? null,
      evidenceRefs,
    }),
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  if (prior && prior.staleness.supersededByStateId !== state.immersionStateId) {
    markImmersionStateSuperseded({
      immersionStateId: prior.immersionStateId,
      supersededByStateId: state.immersionStateId,
      staleAfterMailId: state.latestMailIds[0] ?? null,
    });
  }
  immersionStatesById.set(state.immersionStateId, state);
  return state;
}

export function markImmersionStateStaleAfterMail(input: {
  immersionStateId?: string | null;
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  sourceId?: string | null;
  mailId: string;
}): StagePlayLiveSourceImmersionStateV1 | null {
  const current = input.immersionStateId
    ? getStagePlayLiveSourceImmersionState(input.immersionStateId)
    : getLatestStagePlayLiveSourceImmersionState({
        threadId: input.threadId ?? null,
        roomId: input.roomId ?? null,
        environmentId: input.environmentId ?? null,
        jobId: input.jobId ?? null,
        policyId: input.policyId ?? null,
        profileId: input.profileId ?? null,
        sourceId: input.sourceId ?? null,
        stalenessState: "current",
      });
  if (!current) return null;
  const updated: StagePlayLiveSourceImmersionStateV1 = {
    ...current,
    staleness: {
      ...current.staleness,
      state: "stale_after_new_mail",
      staleAfterMailId: input.mailId,
      supersededByStateId: current.staleness.supersededByStateId ?? null,
    },
  };
  immersionStatesById.set(updated.immersionStateId, updated);
  return updated;
}

export function markImmersionStateSuperseded(input: {
  immersionStateId: string;
  supersededByStateId: string;
  staleAfterMailId?: string | null;
}): StagePlayLiveSourceImmersionStateV1 | null {
  const current = getStagePlayLiveSourceImmersionState(input.immersionStateId);
  if (!current) return null;
  const updated: StagePlayLiveSourceImmersionStateV1 = {
    ...current,
    staleness: {
      ...current.staleness,
      state: "superseded",
      staleAfterMailId: input.staleAfterMailId ?? current.staleness.staleAfterMailId ?? null,
      supersededByStateId: input.supersededByStateId,
    },
  };
  immersionStatesById.set(updated.immersionStateId, updated);
  return updated;
}

export function resetStagePlayLiveSourceImmersionStateStoreForTest(): void {
  immersionStatesById.clear();
}
