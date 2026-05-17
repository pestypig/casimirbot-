export const HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA =
  "helix.observation_journal_entry.v1" as const;

export type HelixObservationJournalRole =
  | "raw_source_event"
  | "model_perception_observation"
  | "tool_observation"
  | "client_capability_observation"
  | "transcript_observation"
  | "reference_observation";

export type HelixObservationJournalEntry = {
  schema: typeof HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA;
  observation_id: string;
  thread_id: string;
  room_id?: string | null;
  source_id?: string | null;
  role: HelixObservationJournalRole;
  modality?: string | null;
  text: string;
  evidence_refs: string[];
  model_invoked: boolean;
  confidence?: number | null;
  raw_image_ref?: string | null;
  raw_content_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
