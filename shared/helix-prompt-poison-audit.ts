export type HelixPromptPoisonAuditViolationKind =
  | "evidence_summary_in_user_text"
  | "raw_image_in_user_text"
  | "tool_receipt_in_user_text"
  | "live_projection_in_user_text"
  | "archive_summary_in_user_text";

export type HelixPromptPoisonAudit = {
  schema: "helix.prompt_poison_audit.v1";
  ok: boolean;
  violations: Array<{
    kind: HelixPromptPoisonAuditViolationKind;
    summary: string;
  }>;
  user_text_hash: string;
  evidence_ref_count: number;
  image_input_count: number;
};

