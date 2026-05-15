export const HELIX_NOTE_WRITE_ARTIFACT_SCHEMA = "helix.note_write_artifact.v1" as const;

export type HelixNoteWriteArtifact = {
  schema: typeof HELIX_NOTE_WRITE_ARTIFACT_SCHEMA;
  artifact_id: string;
  thread_id: string;
  turn_id: string;
  note_id?: string | null;
  note_title: string;
  note_body_summary: string;
  receipt_id?: string | null;
  source_artifact_refs: string[];
  operation: "create_note" | "append_to_note" | "copy_receipt_to_note";
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

