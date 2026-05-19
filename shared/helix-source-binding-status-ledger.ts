import type { HelixEvidenceSourceKind } from "./helix-evidence-source-kind";
import type { HelixSourceBindingState } from "./helix-source-binding-status";

export const HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA =
  "helix.source_binding_status_ledger.v1" as const;

export type HelixSourceBindingLedgerEventKind =
  | "source_observed_unbound"
  | "binding_created"
  | "binding_attached_to_run"
  | "binding_detached_from_run"
  | "binding_marked_stale"
  | "repair_candidate_created"
  | "repair_accepted"
  | "repair_applied"
  | "repair_replay_window_created"
  | "repair_replay_completed"
  | "terminal_selection_allowed"
  | "terminal_selection_rejected";

export type HelixSourceBindingStatusLedgerEntry = {
  schema: typeof HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA;
  ledger_id: string;
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
  evidence_refs: string[];
  repair_candidate_id?: string | null;
  repair_id?: string | null;
  replayed_from_refs?: string[];
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixSourceBindingStatusLedgerState = HelixSourceBindingState | "repair_candidate_created" | "repair_accepted";

export type HelixSourceBindingStatusLedgerTransition = HelixSourceBindingStatusLedgerEntry & {
  transition_id: string;
  modality?: string;
  from: HelixSourceBindingStatusLedgerState;
  to: HelixSourceBindingStatusLedgerState;
};
