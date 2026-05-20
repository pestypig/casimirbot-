export const HELIX_SOURCE_BINDING_STATUS_SCHEMA =
  "helix.source_binding_status.v1" as const;

import type { HelixEvidenceSourceKind } from "./helix-evidence-source-kind";

export type HelixSourceBindingState =
  | "bound"
  | "observed_unbound"
  | "pending_repair"
  | "repair_candidate"
  | "repair_applied"
  | "stale"
  | "detached"
  | "missing"
  | "blocked";

export type HelixSourceReplayPolicy =
  | "future_only"
  | "explicit_replay_window"
  | "none";

export type HelixSourceBindingStatusValue = HelixSourceBindingState | "client_adoption_pending" | "client_adoption_failed";

export type HelixSourceBindingStatus = {
  schema: typeof HELIX_SOURCE_BINDING_STATUS_SCHEMA;
  status_id: string;
  thread_id: string;
  source_id: string;
  source_kind: HelixEvidenceSourceKind;
  modality: string;
  situation_run_id?: string | null;
  environment_id?: string | null;
  binding_id?: string | null;
  state: HelixSourceBindingState;
  status?: HelixSourceBindingState;
  replay_policy: HelixSourceReplayPolicy;
  latest_descriptor_refs: string[];
  latest_observation_refs: string[];
  latest_chunk_refs: string[];
  latest_ledger_refs: string[];
  terminal_eligible: boolean;
  terminal_ineligible_reason?: string | null;
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
