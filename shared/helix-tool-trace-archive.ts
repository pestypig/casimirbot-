export const HELIX_TOOL_TRACE_ARCHIVE_SCHEMA =
  "helix.tool_trace_archive.v1" as const;

export type HelixToolTraceArchive = {
  schema: typeof HELIX_TOOL_TRACE_ARCHIVE_SCHEMA;
  archive_id: string;
  profile_id: string;
  thread_id: string;
  trace_ids: string[];
  summaries: Array<{
    trace_id: string;
    user_goal: string;
    final_answer_snapshot: string;
    key_evidence_refs: string[];
    tool_receipt_ids: string[];
    proof_status?: string;
    scope_match?: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
