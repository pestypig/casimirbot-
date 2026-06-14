import type { HelixTurnInputItem } from "./helix-turn-input-item";

export type HelixTurnAttachmentArtifact = {
  schema: "helix.pasted_text_attachment_artifact.v1";
  artifact_id: string;
  attachment_id: string;
  attachment_kind: "text" | "json" | "code" | "pdf" | "audio" | "image" | "unknown";
  mime_type: string;
  file_name?: string | null;
  size_bytes: number;
  char_count: number;
  estimated_tokens: number;
  content_sha256: string;
  preview: string;
  tail_preview: string;
  body_ref: string;
  body_available: boolean;
  model_visible_summary: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixMultimodalTurnContext = {
  schema: "helix.multimodal_turn_context.v1";
  thread_id: string;
  turn_input_items: HelixTurnInputItem[];
  attachment_artifacts?: HelixTurnAttachmentArtifact[];
  visual_evidence_refs: string[];
  selected_evidence_refs: string[];
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
