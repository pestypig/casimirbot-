export const HELIX_PATTERN_CANDIDATE_SCHEMA = "helix.pattern_candidate.v1" as const;

export type HelixPatternCandidateStatus =
  | "candidate"
  | "replay_tested"
  | "promoted"
  | "rejected"
  | "stale";

export type HelixPatternCandidate = {
  schema: typeof HELIX_PATTERN_CANDIDATE_SCHEMA;
  candidate_id: string;
  thread_id: string;
  room_id: string;
  source_family: "minecraft" | string;
  pattern_label: string;
  subject_ref?: string | null;
  status: HelixPatternCandidateStatus;
  confidence: number;
  support_summary: string;
  supporting_evidence_refs: string[];
  missing_evidence: string[];
  promoted_dictionary_entry_id?: string | null;
  raw_logs_included: false;
  assistant_answer: false;
  deterministic: boolean;
  model_invoked: boolean;
  created_at: string;
  updated_at: string;
};
