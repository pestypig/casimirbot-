export type HelixAttachmentCommitStatus =
  | "ready"
  | "missing_payload"
  | "stale_after_restart"
  | "too_large"
  | "unsupported_type"
  | "removed";

export type HelixAttachmentCommitCheck = {
  schema: "helix.attachment_commit_check.v1";
  attachment_id: string;
  file_name?: string | null;
  mime_type?: string | null;
  status: HelixAttachmentCommitStatus;
  can_submit: boolean;
  turn_input_item_preview?: {
    type: "image" | "evidence_ref";
    has_image_base64: boolean;
    has_image_ref: boolean;
    has_evidence_ref: boolean;
    raw_image_scope?: "turn_input_only" | null;
  } | null;
  reason?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
