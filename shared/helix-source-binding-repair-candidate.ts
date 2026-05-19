import type { HelixEvidenceSourceKind } from "./helix-evidence-source-kind";

export const HELIX_SOURCE_BINDING_REPAIR_CANDIDATE_SCHEMA =
  "helix.source_binding_repair_candidate.v1" as const;

export type HelixSourceBindingRepairCandidate = {
  schema: typeof HELIX_SOURCE_BINDING_REPAIR_CANDIDATE_SCHEMA;
  repair_candidate_id: string;
  thread_id: string;
  source_id: string;
  source_kind: HelixEvidenceSourceKind;
  target_situation_run_id?: string | null;
  target_environment_id?: string | null;
  proposed_binding_policy: "explicit_user" | "repair_acceptance";
  proposed_replay_policy: "future_only" | "explicit_replay_window";
  old_unbound_observation_refs: string[];
  old_unbound_chunk_refs: string[];
  requires_explicit_acceptance: true;
  acceptance_prompt: string;
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
