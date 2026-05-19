import crypto from "node:crypto";
import {
  helixDefaultModalityForSourceKind,
  helixEvidenceSourceKindForModality,
  type HelixEvidenceSourceKind,
} from "@shared/helix-evidence-source-kind";
import {
  HELIX_SOURCE_BINDING_REPAIR_CANDIDATE_SCHEMA,
  type HelixSourceBindingRepairCandidate,
} from "@shared/helix-source-binding-repair-candidate";
import {
  HELIX_SOURCE_BINDING_STATUS_SCHEMA,
  type HelixSourceBindingState,
  type HelixSourceBindingStatus,
  type HelixSourceReplayPolicy,
} from "@shared/helix-source-binding-status";
import {
  HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA,
  type HelixSourceBindingLedgerEventKind,
  type HelixSourceBindingStatusLedgerEntry,
  type HelixSourceBindingStatusLedgerTransition,
} from "@shared/helix-source-binding-status-ledger";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { HelixSituationSourceBindingModality } from "@shared/helix-situation-source-binding";
import { appendObservationJournalEntry, listObservationJournalEntries } from "./observation-journal-store";
import { upsertSituationSourceBinding } from "./situation-source-binding-store";

const statuses = new Map<string, HelixSourceBindingStatus>();
const latestStatusBySource = new Map<string, string>();
const ledger: HelixSourceBindingStatusLedgerEntry[] = [];
const repairCandidates = new Map<string, HelixSourceBindingRepairCandidate>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => cleanString(value)).filter((value: string | null): value is string => Boolean(value))));

const statusIdFor = (input: { threadId: string; sourceId: string; situationRunId?: string | null }): string =>
  `source_binding_status:${hashShort([input.threadId, input.sourceId, input.situationRunId ?? "global"])}`;

const sourceKeyFor = (input: { threadId: string; sourceId: string }): string =>
  `${input.threadId}::${input.sourceId}`;

const statusRef = (status: Pick<HelixSourceBindingStatus, "status_id">): string =>
  `source_binding_status:${status.status_id.replace(/^source_binding_status:/, "")}`;

export const sourceBindingStatusRefFor = statusRef;

const transitionToCompat = (entry: HelixSourceBindingStatusLedgerEntry): HelixSourceBindingStatusLedgerTransition => ({
  ...entry,
  transition_id: entry.ledger_id,
  modality: helixDefaultModalityForSourceKind(entry.source_kind),
  from: entry.from_state ?? "missing",
  to: entry.event_kind === "repair_candidate_created"
    ? "repair_candidate_created"
    : entry.event_kind === "repair_accepted"
      ? "repair_accepted"
      : entry.to_state,
});

export function appendSourceBindingStatusLedger(input: {
  thread_id: string;
  source_id: string;
  source_kind: HelixEvidenceSourceKind;
  situation_run_id?: string | null;
  environment_id?: string | null;
  binding_id?: string | null;
  from_state?: HelixSourceBindingState | null;
  to_state: HelixSourceBindingState;
  event_kind: HelixSourceBindingLedgerEventKind;
  reason: string;
  evidence_refs?: string[];
  repair_candidate_id?: string | null;
  repair_id?: string | null;
  replayed_from_refs?: string[];
  created_at?: string;
}): HelixSourceBindingStatusLedgerEntry {
  const createdAt = input.created_at ?? new Date().toISOString();
  const entry: HelixSourceBindingStatusLedgerEntry = {
    schema: HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA,
    ledger_id: `source_binding_ledger:${hashShort([
      input.thread_id,
      input.source_id,
      input.source_kind,
      input.event_kind,
      input.from_state ?? null,
      input.to_state,
      input.reason,
      createdAt,
    ])}`,
    thread_id: input.thread_id,
    source_id: input.source_id,
    source_kind: input.source_kind,
    situation_run_id: input.situation_run_id ?? null,
    environment_id: input.environment_id ?? null,
    binding_id: input.binding_id ?? null,
    from_state: input.from_state ?? null,
    to_state: input.to_state,
    event_kind: input.event_kind,
    reason: input.reason,
    evidence_refs: unique(input.evidence_refs ?? []),
    repair_candidate_id: input.repair_candidate_id ?? null,
    repair_id: input.repair_id ?? null,
    replayed_from_refs: unique(input.replayed_from_refs ?? []),
    created_at: createdAt,
    assistant_answer: false,
    raw_content_included: false,
  };
  ledger.push(entry);
  return entry;
}

export function upsertSourceBindingStatus(input: {
  thread_id: string;
  source_id: string;
  source_kind?: HelixEvidenceSourceKind | null;
  modality?: string | null;
  situation_run_id?: string | null;
  environment_id?: string | null;
  binding_id?: string | null;
  state: HelixSourceBindingState;
  replay_policy?: HelixSourceReplayPolicy;
  latest_descriptor_refs?: string[];
  latest_observation_refs?: string[];
  latest_chunk_refs?: string[];
  latest_ledger_refs?: string[];
  terminal_eligible?: boolean;
  terminal_ineligible_reason?: string | null;
  now?: string;
}): HelixSourceBindingStatus {
  const threadId = cleanString(input.thread_id) ?? "helix-ask:desktop";
  const sourceId = cleanString(input.source_id) ?? "unknown_source";
  const modality = cleanString(input.modality) ?? (input.source_kind ? helixDefaultModalityForSourceKind(input.source_kind) : "visual_frame");
  const sourceKind = input.source_kind ?? helixEvidenceSourceKindForModality(modality);
  const statusId = statusIdFor({
    threadId,
    sourceId,
    situationRunId: cleanString(input.situation_run_id),
  });
  const existing = statuses.get(statusId);
  const now = input.now ?? new Date().toISOString();
  const state = input.state;
  const terminalEligible = input.terminal_eligible ?? (state === "bound" || state === "repair_applied");
  const status: HelixSourceBindingStatus = {
    schema: HELIX_SOURCE_BINDING_STATUS_SCHEMA,
    status_id: statusId,
    thread_id: threadId,
    source_id: sourceId,
    source_kind: sourceKind,
    modality,
    situation_run_id: cleanString(input.situation_run_id),
    environment_id: cleanString(input.environment_id),
    binding_id: cleanString(input.binding_id),
    state,
    replay_policy: input.replay_policy ?? existing?.replay_policy ?? "future_only",
    latest_descriptor_refs: unique([...(existing?.latest_descriptor_refs ?? []), ...(input.latest_descriptor_refs ?? [])]).slice(-24),
    latest_observation_refs: unique([...(existing?.latest_observation_refs ?? []), ...(input.latest_observation_refs ?? [])]).slice(-48),
    latest_chunk_refs: unique([...(existing?.latest_chunk_refs ?? []), ...(input.latest_chunk_refs ?? [])]).slice(-48),
    latest_ledger_refs: unique([...(existing?.latest_ledger_refs ?? []), ...(input.latest_ledger_refs ?? [])]).slice(-48),
    terminal_eligible: terminalEligible,
    terminal_ineligible_reason: terminalEligible ? null : input.terminal_ineligible_reason ?? existing?.terminal_ineligible_reason ?? "source_not_bound_to_active_run",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  statuses.set(status.status_id, status);
  latestStatusBySource.set(sourceKeyFor({ threadId, sourceId }), status.status_id);
  return status;
}

export function getSourceBindingStatus(statusId: string): HelixSourceBindingStatus | null {
  return statuses.get(statusId) ?? statuses.get(`source_binding_status:${statusId.replace(/^source_binding_status:/, "")}`) ?? null;
}

export function listSourceBindingStatuses(input: {
  threadId?: string | null;
  sourceId?: string | null;
  situationRunId?: string | null;
  state?: HelixSourceBindingState | null;
  limit?: number;
} = {}): HelixSourceBindingStatus[] {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
  return Array.from(statuses.values())
    .filter((status: HelixSourceBindingStatus) => !input.threadId || status.thread_id === input.threadId)
    .filter((status: HelixSourceBindingStatus) => !input.sourceId || status.source_id === input.sourceId)
    .filter((status: HelixSourceBindingStatus) => !input.situationRunId || status.situation_run_id === input.situationRunId)
    .filter((status: HelixSourceBindingStatus) => !input.state || status.state === input.state)
    .sort((a: HelixSourceBindingStatus, b: HelixSourceBindingStatus) => a.updated_at.localeCompare(b.updated_at))
    .slice(-limit);
}

export function recordObservedUnboundSource(input: {
  threadId: string;
  sourceId: string;
  modality: string;
  environmentId?: string | null;
  observationRef?: string | null;
  chunkRef?: string | null;
  descriptorRef?: string | null;
  evidenceRefs?: string[];
  now?: string;
}): HelixSourceBindingStatus {
  const existingId = latestStatusBySource.get(sourceKeyFor({ threadId: input.threadId, sourceId: input.sourceId }));
  const existing = existingId ? statuses.get(existingId) ?? null : null;
  const sourceKind = helixEvidenceSourceKindForModality(input.modality);
  const status = upsertSourceBindingStatus({
    thread_id: input.threadId,
    source_id: input.sourceId,
    source_kind: sourceKind,
    modality: input.modality,
    environment_id: input.environmentId ?? null,
    state: "observed_unbound",
    replay_policy: "future_only",
    latest_observation_refs: unique([input.observationRef]),
    latest_chunk_refs: unique([input.chunkRef]),
    latest_descriptor_refs: unique([input.descriptorRef]),
    terminal_eligible: false,
    terminal_ineligible_reason: "observed_source_is_not_bound_to_active_situation_run",
    now: input.now,
  });
  const entry = appendSourceBindingStatusLedger({
    thread_id: status.thread_id,
    source_id: status.source_id,
    source_kind: status.source_kind,
    environment_id: status.environment_id,
    from_state: existing?.state ?? null,
    to_state: "observed_unbound",
    event_kind: "source_observed_unbound",
    reason: "source evidence observed without active source binding",
    evidence_refs: unique([...(input.evidenceRefs ?? []), input.observationRef, input.chunkRef, input.descriptorRef]),
    created_at: input.now,
  });
  return upsertSourceBindingStatus({
    ...status,
    thread_id: status.thread_id,
    source_id: status.source_id,
    source_kind: status.source_kind,
    state: status.state,
    latest_ledger_refs: [entry.ledger_id],
    now: input.now,
  });
}

export function observeSourceBindingState(input: {
  threadId: string;
  sourceId: string;
  modality: string;
  environmentId?: string | null;
  chunkRef?: string | null;
  observationRef?: string | null;
  descriptorRef?: string | null;
  evidenceRefs?: string[];
  now?: string;
}): HelixSourceBindingStatus {
  const bound = listSourceBindingStatuses({
    threadId: input.threadId,
    sourceId: input.sourceId,
    limit: 10,
  }).reverse().find((status) =>
    (status.state === "bound" || status.state === "repair_applied") &&
    (!input.environmentId || !status.environment_id || status.environment_id === input.environmentId)
  );
  if (bound) {
    return upsertSourceBindingStatus({
      thread_id: bound.thread_id,
      source_id: bound.source_id,
      source_kind: bound.source_kind,
      modality: bound.modality,
      situation_run_id: bound.situation_run_id,
      environment_id: bound.environment_id,
      binding_id: bound.binding_id,
      state: bound.state,
      replay_policy: bound.replay_policy,
      latest_chunk_refs: unique([input.chunkRef]),
      latest_observation_refs: unique([input.observationRef]),
      latest_descriptor_refs: unique([input.descriptorRef]),
      terminal_eligible: true,
      now: input.now,
    });
  }
  return recordObservedUnboundSource(input);
}

export function createSourceBindingRepairCandidate(input: {
  threadId: string;
  sourceId: string;
  sourceKind?: HelixEvidenceSourceKind | null;
  modality?: string | null;
  targetSituationRunId?: string | null;
  targetEnvironmentId?: string | null;
  proposedBindingPolicy?: "explicit_user" | "repair_acceptance";
  proposedReplayPolicy?: "future_only" | "explicit_replay_window";
  oldUnboundObservationRefs?: string[];
  oldUnboundChunkRefs?: string[];
  promptText?: string | null;
  now?: string;
}): HelixSourceBindingRepairCandidate {
  const modality = cleanString(input.modality) ?? (input.sourceKind ? helixDefaultModalityForSourceKind(input.sourceKind) : "visual_frame");
  const sourceKind = input.sourceKind ?? helixEvidenceSourceKindForModality(modality);
  const threadId = cleanString(input.threadId) ?? "helix-ask:desktop";
  const sourceId = cleanString(input.sourceId) ?? "unknown_source";
  const now = input.now ?? new Date().toISOString();
  const observations = input.oldUnboundObservationRefs?.length
    ? input.oldUnboundObservationRefs
    : listObservationJournalEntries({ threadId, limit: 80 })
        .filter((entry: HelixObservationJournalEntry) => entry.source_id === sourceId && !entry.source_binding_id)
        .map((entry: HelixObservationJournalEntry) => entry.observation_id);
  const status = upsertSourceBindingStatus({
    thread_id: threadId,
    source_id: sourceId,
    source_kind: sourceKind,
    modality,
    situation_run_id: input.targetSituationRunId ?? null,
    environment_id: input.targetEnvironmentId ?? null,
    state: "repair_candidate",
    replay_policy: input.proposedReplayPolicy ?? "future_only",
    latest_observation_refs: observations,
    latest_chunk_refs: input.oldUnboundChunkRefs ?? [],
    terminal_eligible: false,
    terminal_ineligible_reason: "repair_candidate_requires_explicit_acceptance",
    now,
  });
  const candidate: HelixSourceBindingRepairCandidate = {
    schema: HELIX_SOURCE_BINDING_REPAIR_CANDIDATE_SCHEMA,
    repair_candidate_id: `source_binding_repair_candidate:${hashShort([
      threadId,
      sourceId,
      sourceKind,
      input.targetSituationRunId ?? null,
      observations,
      input.oldUnboundChunkRefs ?? [],
    ])}`,
    thread_id: threadId,
    source_id: sourceId,
    source_kind: sourceKind,
    target_situation_run_id: cleanString(input.targetSituationRunId),
    target_environment_id: cleanString(input.targetEnvironmentId),
    proposed_binding_policy: input.proposedBindingPolicy ?? "repair_acceptance",
    proposed_replay_policy: input.proposedReplayPolicy ?? "future_only",
    old_unbound_observation_refs: unique(observations),
    old_unbound_chunk_refs: unique(input.oldUnboundChunkRefs ?? []),
    requires_explicit_acceptance: true,
    acceptance_prompt: input.promptText?.trim()
      ? `Attach ${sourceKind} source ${sourceId} to this SituationRun before answering from it: ${input.promptText.trim()}`
      : `Attach ${sourceKind} source ${sourceId} to this SituationRun before answering from it.`,
    created_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  repairCandidates.set(candidate.repair_candidate_id, candidate);
  const entry = appendSourceBindingStatusLedger({
    thread_id: threadId,
    source_id: sourceId,
    source_kind: sourceKind,
    situation_run_id: candidate.target_situation_run_id,
    environment_id: candidate.target_environment_id,
    from_state: status.state,
    to_state: "repair_candidate",
    event_kind: "repair_candidate_created",
    reason: "source repair candidate created; explicit acceptance required",
    evidence_refs: unique([...candidate.old_unbound_observation_refs, ...candidate.old_unbound_chunk_refs]),
    repair_candidate_id: candidate.repair_candidate_id,
    created_at: now,
  });
  upsertSourceBindingStatus({
    ...status,
    thread_id: status.thread_id,
    source_id: status.source_id,
    source_kind: status.source_kind,
    state: "repair_candidate",
    latest_ledger_refs: [entry.ledger_id],
    now,
  });
  return candidate;
}

export function attachSourceToSituationRun(input: {
  threadId: string;
  sourceId: string;
  sourceKind?: HelixEvidenceSourceKind | null;
  modality?: string | null;
  situationRunId: string;
  environmentId?: string | null;
  bindingPolicy?: "explicit_user" | "session_start" | "repair_acceptance" | "profile_default";
  replayPolicy?: HelixSourceReplayPolicy;
  observationRefs?: string[];
  chunkRefs?: string[];
  descriptorRefs?: string[];
  now?: string;
}): HelixSourceBindingStatus {
  const modality = (cleanString(input.modality) ?? (input.sourceKind ? helixDefaultModalityForSourceKind(input.sourceKind) : "visual_frame")) as HelixSituationSourceBindingModality;
  const sourceKind = input.sourceKind ?? helixEvidenceSourceKindForModality(modality);
  const binding = upsertSituationSourceBinding({
    thread_id: input.threadId,
    situation_run_id: input.situationRunId,
    environment_id: input.environmentId ?? null,
    source_id: input.sourceId,
    modality,
    binding_policy: input.bindingPolicy ?? "repair_acceptance",
    replay_policy: input.replayPolicy ?? "future_only",
    now: input.now,
  });
  const previous = listSourceBindingStatuses({ threadId: input.threadId, sourceId: input.sourceId, limit: 1 }).at(-1) ?? null;
  const created = appendSourceBindingStatusLedger({
    thread_id: input.threadId,
    source_id: input.sourceId,
    source_kind: sourceKind,
    situation_run_id: input.situationRunId,
    environment_id: input.environmentId ?? null,
    binding_id: binding.binding_id,
    from_state: previous?.state ?? null,
    to_state: "bound",
    event_kind: "binding_created",
    reason: "source binding created for active SituationRun",
    evidence_refs: unique([...(input.observationRefs ?? []), ...(input.chunkRefs ?? []), ...(input.descriptorRefs ?? [])]),
    created_at: input.now,
  });
  const attached = appendSourceBindingStatusLedger({
    thread_id: input.threadId,
    source_id: input.sourceId,
    source_kind: sourceKind,
    situation_run_id: input.situationRunId,
    environment_id: input.environmentId ?? null,
    binding_id: binding.binding_id,
    from_state: "bound",
    to_state: "bound",
    event_kind: "binding_attached_to_run",
    reason: "source binding attached to active SituationRun",
    evidence_refs: unique([created.ledger_id]),
    created_at: input.now,
  });
  return upsertSourceBindingStatus({
    thread_id: input.threadId,
    source_id: input.sourceId,
    source_kind: sourceKind,
    modality,
    situation_run_id: input.situationRunId,
    environment_id: input.environmentId ?? null,
    binding_id: binding.binding_id,
    state: "bound",
    replay_policy: input.replayPolicy ?? "future_only",
    latest_observation_refs: input.observationRefs ?? [],
    latest_chunk_refs: input.chunkRefs ?? [],
    latest_descriptor_refs: input.descriptorRefs ?? [],
    latest_ledger_refs: [created.ledger_id, attached.ledger_id],
    terminal_eligible: true,
    now: input.now,
  });
}

export function replayUnboundEvidenceThroughRepair(input: {
  repairCandidateId: string;
  bindingId: string;
  replayWindow?: { from_ts: string; to_ts: string } | null;
  now?: string;
}): string[] {
  const candidate = repairCandidates.get(input.repairCandidateId);
  if (!candidate) return [];
  const now = input.now ?? new Date().toISOString();
  const fromMs = input.replayWindow ? Date.parse(input.replayWindow.from_ts) : null;
  const toMs = input.replayWindow ? Date.parse(input.replayWindow.to_ts) : null;
  const oldObservations = listObservationJournalEntries({ threadId: candidate.thread_id, limit: 300 })
    .filter((entry: HelixObservationJournalEntry) => candidate.old_unbound_observation_refs.includes(entry.observation_id))
    .filter((entry: HelixObservationJournalEntry) => !entry.source_binding_id)
    .filter((entry: HelixObservationJournalEntry) => {
      if (!input.replayWindow) return true;
      const observed = Date.parse(entry.observed_at);
      return Number.isFinite(observed) && Number.isFinite(fromMs) && Number.isFinite(toMs) && observed >= (fromMs as number) && observed <= (toMs as number);
    });
  const replayedObservationRefs = oldObservations.map((entry: HelixObservationJournalEntry) =>
    appendObservationJournalEntry({
      thread_id: entry.thread_id,
      room_id: entry.room_id,
      source_id: entry.source_id,
      role: entry.role,
      modality: entry.modality,
      text: entry.text,
      evidence_refs: unique([...entry.evidence_refs, entry.observation_id]),
      source_identity_ref: entry.source_identity_ref,
      model_invoked: entry.model_invoked,
      confidence: entry.confidence ?? undefined,
      observed_at: entry.observed_at,
      ingested_at: now,
      available_at: now,
      source_seq: entry.source_seq ?? undefined,
      replay_status: "replayed",
      source_binding_id: input.bindingId,
      source_epoch: entry.source_epoch ?? undefined,
      raw_image_ref: entry.raw_image_ref ?? undefined,
      created_at: now,
    }).observation_id,
  );
  const shouldSynthesizeChunkObservations =
    replayedObservationRefs.length === 0 ||
    helixDefaultModalityForSourceKind(candidate.source_kind) !== "visual_frame";
  const syntheticChunkObservationRefs = shouldSynthesizeChunkObservations
    ? candidate.old_unbound_chunk_refs.map((chunkRef: string) =>
        appendObservationJournalEntry({
          thread_id: candidate.thread_id,
          source_id: candidate.source_id,
          role: candidate.source_kind === "display_audio_transcript" ? "transcript_observation" : "raw_source_event",
          modality: helixDefaultModalityForSourceKind(candidate.source_kind),
          text: `Replayed bound evidence from ${chunkRef}.`,
          evidence_refs: [chunkRef],
          model_invoked: false,
          replay_status: "replayed",
          source_binding_id: input.bindingId,
          created_at: now,
        }).observation_id,
      )
    : [];
  return unique([...replayedObservationRefs, ...syntheticChunkObservationRefs]);
}

export function acceptSourceBindingRepairCandidate(input: {
  repairCandidateId: string;
  acceptedByTurnId?: string | null;
  replayPolicy: "future_only" | "explicit_replay_window";
  replayWindow?: { from_ts: string; to_ts: string } | null;
  targetSituationRunId?: string | null;
  targetEnvironmentId?: string | null;
  now?: string;
}): {
  repair_id: string;
  status: HelixSourceBindingStatus;
  replayed_observation_refs: string[];
  ledger_refs: string[];
} | null {
  const candidate = repairCandidates.get(input.repairCandidateId);
  if (!candidate) return null;
  const now = input.now ?? new Date().toISOString();
  const situationRunId = cleanString(input.targetSituationRunId) ?? candidate.target_situation_run_id;
  if (!situationRunId) return null;
  const environmentId = cleanString(input.targetEnvironmentId) ?? candidate.target_environment_id ?? null;
  const repairId = `source_binding_repair:${hashShort([candidate.repair_candidate_id, input.acceptedByTurnId ?? null, input.replayPolicy, now])}`;
  const accepted = appendSourceBindingStatusLedger({
    thread_id: candidate.thread_id,
    source_id: candidate.source_id,
    source_kind: candidate.source_kind,
    situation_run_id: situationRunId,
    environment_id: environmentId,
    from_state: "repair_candidate",
    to_state: "pending_repair",
    event_kind: "repair_accepted",
    reason: "source repair candidate explicitly accepted",
    evidence_refs: [candidate.repair_candidate_id, input.acceptedByTurnId ?? ""],
    repair_candidate_id: candidate.repair_candidate_id,
    repair_id: repairId,
    created_at: now,
  });
  const attached = attachSourceToSituationRun({
    threadId: candidate.thread_id,
    sourceId: candidate.source_id,
    sourceKind: candidate.source_kind,
    modality: helixDefaultModalityForSourceKind(candidate.source_kind),
    situationRunId,
    environmentId,
    bindingPolicy: candidate.proposed_binding_policy,
    replayPolicy: input.replayPolicy,
    now,
  });
  let replayedObservationRefs: string[] = [];
  const replayLedgerRefs: string[] = [];
  if (input.replayPolicy === "explicit_replay_window") {
    const windowCreated = appendSourceBindingStatusLedger({
      thread_id: candidate.thread_id,
      source_id: candidate.source_id,
      source_kind: candidate.source_kind,
      situation_run_id: situationRunId,
      environment_id: environmentId,
      binding_id: attached.binding_id,
      from_state: "bound",
      to_state: "repair_applied",
      event_kind: "repair_replay_window_created",
      reason: "explicit repair replay window created",
      evidence_refs: unique([...candidate.old_unbound_observation_refs, ...candidate.old_unbound_chunk_refs]),
      repair_candidate_id: candidate.repair_candidate_id,
      repair_id: repairId,
      created_at: now,
    });
    replayedObservationRefs = replayUnboundEvidenceThroughRepair({
      repairCandidateId: candidate.repair_candidate_id,
      bindingId: attached.binding_id ?? "",
      replayWindow: input.replayWindow ?? null,
      now,
    });
    const replayCompleted = appendSourceBindingStatusLedger({
      thread_id: candidate.thread_id,
      source_id: candidate.source_id,
      source_kind: candidate.source_kind,
      situation_run_id: situationRunId,
      environment_id: environmentId,
      binding_id: attached.binding_id,
      from_state: "repair_applied",
      to_state: "repair_applied",
      event_kind: "repair_replay_completed",
      reason: "explicit repair replay completed",
      evidence_refs: replayedObservationRefs,
      repair_candidate_id: candidate.repair_candidate_id,
      repair_id: repairId,
      replayed_from_refs: unique([...candidate.old_unbound_observation_refs, ...candidate.old_unbound_chunk_refs]),
      created_at: now,
    });
    replayLedgerRefs.push(windowCreated.ledger_id, replayCompleted.ledger_id);
  }
  const applied = appendSourceBindingStatusLedger({
    thread_id: candidate.thread_id,
    source_id: candidate.source_id,
    source_kind: candidate.source_kind,
    situation_run_id: situationRunId,
    environment_id: environmentId,
    binding_id: attached.binding_id,
    from_state: attached.state,
    to_state: "repair_applied",
    event_kind: "repair_applied",
    reason: input.replayPolicy === "future_only"
      ? "repair applied with future-only replay policy"
      : "repair applied with explicit replay window",
    evidence_refs: unique([candidate.repair_candidate_id, ...replayedObservationRefs]),
    repair_candidate_id: candidate.repair_candidate_id,
    repair_id: repairId,
    created_at: now,
  });
  const status = upsertSourceBindingStatus({
    ...attached,
    thread_id: attached.thread_id,
    source_id: attached.source_id,
    source_kind: attached.source_kind,
    state: "repair_applied",
    replay_policy: input.replayPolicy,
    latest_observation_refs: replayedObservationRefs,
    latest_ledger_refs: [accepted.ledger_id, ...attached.latest_ledger_refs, ...replayLedgerRefs, applied.ledger_id],
    terminal_eligible: true,
    now,
  });
  return {
    repair_id: repairId,
    status,
    replayed_observation_refs: replayedObservationRefs,
    ledger_refs: [accepted.ledger_id, ...attached.latest_ledger_refs, ...replayLedgerRefs, applied.ledger_id],
  };
}

export function listSourceBindingStatusLedger(input: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
} = {}): HelixSourceBindingStatusLedgerTransition[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 500));
  return ledger
    .filter((entry: HelixSourceBindingStatusLedgerEntry) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixSourceBindingStatusLedgerEntry) => !input.sourceId || entry.source_id === input.sourceId)
    .slice(-limit)
    .map(transitionToCompat);
}

export function listSourceBindingRepairCandidates(input: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
} = {}): HelixSourceBindingRepairCandidate[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 500));
  return Array.from(repairCandidates.values())
    .filter((candidate: HelixSourceBindingRepairCandidate) => !input.threadId || candidate.thread_id === input.threadId)
    .filter((candidate: HelixSourceBindingRepairCandidate) => !input.sourceId || candidate.source_id === input.sourceId)
    .slice(-limit);
}

export function resetSourceBindingStatusForTest(): void {
  statuses.clear();
  latestStatusBySource.clear();
  ledger.length = 0;
  repairCandidates.clear();
}
