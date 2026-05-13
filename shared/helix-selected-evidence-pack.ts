export const HELIX_SELECTED_EVIDENCE_PACK_SCHEMA = "helix.selected_evidence_pack.v1" as const;

export type HelixSelectedEvidencePack = {
  schema: typeof HELIX_SELECTED_EVIDENCE_PACK_SCHEMA;
  thread_id: string;
  turn_id: string;
  prompt: string;
  selected_evidence_ids: string[];
  selected_subgoal_ids: string[];
  selected_note_refs: Array<{ note_id: string; section_ref?: string | null }>;
  selected_tool_receipts: string[];
  selected_live_environment_ids: string[];
  selection_reason: string;
  budget: {
    max_items: number;
    estimated_tokens: number;
  };
  raw_content_included: false;
  deterministic_content_role: "evidence_not_assistant_answer";
};
