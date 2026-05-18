import type { HelixSourceBindingStatusValue } from "./helix-source-binding-status";

export const HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA =
  "helix.source_binding_status_ledger.v1" as const;

export type HelixSourceBindingStatusLedgerState =
  | HelixSourceBindingStatusValue
  | "repair_candidate_created"
  | "repair_accepted";

export type HelixSourceBindingStatusLedgerTransition = {
  schema: typeof HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA;
  transition_id: string;
  source_id: string;
  thread_id?: string | null;
  environment_id?: string | null;
  situation_run_id?: string | null;
  modality: string;
  from: HelixSourceBindingStatusLedgerState;
  to: HelixSourceBindingStatusLedgerState;
  reason: string;
  evidence_refs: string[];
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
