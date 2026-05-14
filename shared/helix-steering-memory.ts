export const HELIX_STEERING_MEMORY_SCHEMA =
  "helix.steering_memory.v1" as const;

export type HelixSteeringMemory = {
  schema: typeof HELIX_STEERING_MEMORY_SCHEMA;
  steering_id: string;
  thread_id: string;
  profile_id?: string | null;
  user_claim: string;
  normalized_claim: string;
  target_hypothesis_ids: string[];
  evidence_refs: string[];
  confidence_effect: "raise" | "lower" | "confirm" | "contradict" | "clarify";
  next_checks: string[];
  raw_content_included: false;
  assistant_answer: false;
  created_at: string;
};

export type HelixSteeringMemoryArchive = {
  schema: "helix.steering_memory_archive.v1";
  archive_id: string;
  thread_id: string;
  profile_id?: string | null;
  memories: HelixSteeringMemory[];
  raw_logs_included: false;
  assistant_answer: false;
  created_at: string;
};
