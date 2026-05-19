import { helixEvidenceSourceKindForModality } from "@shared/helix-evidence-source-kind";
import type { HelixSourceBindingStatus } from "@shared/helix-source-binding-status";
import type { HelixSourceBindingStatusLedgerTransition } from "@shared/helix-source-binding-status-ledger";
import {
  appendSourceBindingStatusLedger,
  listSourceBindingStatusLedger as listLedger,
  resetSourceBindingStatusForTest,
} from "./source-binding-status-store";

const stateFor = (status: HelixSourceBindingStatus): HelixSourceBindingStatus["state"] =>
  status.state ?? (status as unknown as { status?: HelixSourceBindingStatus["state"] }).status ?? "missing";

const evidenceRefsFor = (status: HelixSourceBindingStatus): string[] =>
  [
    ...((status as unknown as { evidence_refs?: string[] }).evidence_refs ?? []),
    ...status.latest_descriptor_refs,
    ...status.latest_observation_refs,
    ...status.latest_chunk_refs,
  ];

const compat = (entry: ReturnType<typeof appendSourceBindingStatusLedger>): HelixSourceBindingStatusLedgerTransition => ({
  ...entry,
  transition_id: entry.ledger_id,
  modality: entry.source_kind,
  from: entry.from_state ?? "missing",
  to: entry.event_kind === "repair_candidate_created"
    ? "repair_candidate_created"
    : entry.event_kind === "repair_accepted"
      ? "repair_accepted"
      : entry.to_state,
});

export function recordSourceBindingStatusTransitions(input: {
  statuses: HelixSourceBindingStatus[];
  reason: string;
  now?: string;
}): HelixSourceBindingStatusLedgerTransition[] {
  return input.statuses.map((status: HelixSourceBindingStatus) => compat(appendSourceBindingStatusLedger({
    thread_id: status.thread_id ?? "helix-ask:desktop",
    source_id: status.source_id,
    source_kind: status.source_kind ?? helixEvidenceSourceKindForModality(status.modality),
    situation_run_id: status.situation_run_id ?? null,
    environment_id: status.environment_id ?? null,
    binding_id: status.binding_id ?? null,
    from_state: null,
    to_state: stateFor(status),
    event_kind: stateFor(status) === "observed_unbound" ? "source_observed_unbound" : "binding_attached_to_run",
    reason: input.reason,
    evidence_refs: evidenceRefsFor(status),
    created_at: input.now,
  })));
}

export function recordSourceBindingRepairCandidate(input: {
  source_id: string;
  thread_id?: string | null;
  modality: string;
  reason: string;
  evidence_refs?: string[];
  now?: string;
}): HelixSourceBindingStatusLedgerTransition {
  return compat(appendSourceBindingStatusLedger({
    thread_id: input.thread_id ?? "helix-ask:desktop",
    source_id: input.source_id,
    source_kind: helixEvidenceSourceKindForModality(input.modality),
    from_state: "observed_unbound",
    to_state: "repair_candidate",
    event_kind: "repair_candidate_created",
    reason: input.reason,
    evidence_refs: input.evidence_refs ?? [],
    created_at: input.now,
  }));
}

export function recordSourceBindingRepairAccepted(input: {
  source_id: string;
  thread_id?: string | null;
  environment_id?: string | null;
  situation_run_id?: string | null;
  modality: string;
  reason: string;
  evidence_refs?: string[];
  now?: string;
}): HelixSourceBindingStatusLedgerTransition {
  return compat(appendSourceBindingStatusLedger({
    thread_id: input.thread_id ?? "helix-ask:desktop",
    source_id: input.source_id,
    source_kind: helixEvidenceSourceKindForModality(input.modality),
    environment_id: input.environment_id ?? null,
    situation_run_id: input.situation_run_id ?? null,
    from_state: "repair_candidate",
    to_state: "pending_repair",
    event_kind: "repair_accepted",
    reason: input.reason,
    evidence_refs: input.evidence_refs ?? [],
    created_at: input.now,
  }));
}

export function listSourceBindingStatusLedger(input?: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
}): HelixSourceBindingStatusLedgerTransition[] {
  return listLedger(input);
}

export function resetSourceBindingStatusLedgerForTest(): void {
  resetSourceBindingStatusForTest();
}
