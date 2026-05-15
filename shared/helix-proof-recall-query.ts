export const HELIX_PROOF_RECALL_QUERY_SCHEMA =
  "helix.proof_recall_query.v1" as const;

export type HelixProofRecallQuery = {
  schema: typeof HELIX_PROOF_RECALL_QUERY_SCHEMA;
  thread_id: string;
  turn_id?: string | null;
  question: string;
  target_answer_ref?: string | null;
  target_trace_id?: string | null;
  include_raw_debug?: false;
};

export type HelixProofRecallContext = {
  schema: "helix.proof_recall_context.v1";
  thread_id: string;
  query: HelixProofRecallQuery;
  selected_trace_id?: string | null;
  compact_answer: string;
  evidence_refs: string[];
  tool_receipt_ids: string[];
  terminal_authority_hash?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
