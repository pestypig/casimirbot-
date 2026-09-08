import { z } from "zod";

export const HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA =
  "helix.visual_sequence_manifest.v1" as const;
export const HELIX_VISUAL_SEQUENCE_RECEIPT_SCHEMA =
  "helix.visual_sequence_receipt.v1" as const;
export const HELIX_VISUAL_SEQUENCE_CAPTURE_SCHEMA =
  "helix.visual_sequence_capture.v1" as const;
export const HELIX_VISUAL_SEQUENCE_EVIDENCE_PACKET_SCHEMA =
  "helix.visual_sequence_evidence_packet.v1" as const;
export const HELIX_VISUAL_SEQUENCE_REASONING_GRANT_SCHEMA =
  "helix.visual_sequence_reasoning_grant.v1" as const;

export const VISUAL_SEQUENCE_LIMITS = {
  maxUploadBytes: 64 * 1024 * 1024,
  maxDurationMs: 30_000,
  boundedCaptureDefaultDurationMs: 10_000,
  boundedCaptureMaxDurationMs: 15_000,
  maxSourceWidth: 3_840,
  maxSourceHeight: 2_160,
  maxSourceFrames: 18_000,
  maxSelectedFrames: 16,
  defaultCadenceMs: 1_000,
  maxOutputWidth: 768,
  maxOutputHeight: 432,
  retentionMs: 60 * 60 * 1_000,
  maxMcpSelectedFrames: 6,
  maxMcpImageBytes: 12 * 1024 * 1024,
  reasoningGrantDefaultDurationMs: 5 * 60 * 1_000,
  reasoningGrantMaxDurationMs: 15 * 60 * 1_000,
} as const;

const visualSequenceId = z.string().regex(/^vse_[a-f0-9]{32}$/);
const boundedId = z.string().trim().min(1).max(200);

export const VisualSequenceReasoningBindingSchema = z.object({
  reasoning_binding_id: boundedId,
  binding_epoch: z.number().int().positive(),
}).strict();

export const VisualSequenceReasoningAccessSchema = VisualSequenceReasoningBindingSchema.extend({
  reasoning_grant_id: z.string().regex(/^vseg_[a-f0-9]{32}$/),
}).strict();

export const VisualSequenceFrameSelectionSchema = z.object({
  sequence_id: visualSequenceId,
  frame_ids: z.array(boundedId).min(1).max(VISUAL_SEQUENCE_LIMITS.maxMcpSelectedFrames),
  vision_capability: z.enum(["image_input", "unavailable"]),
}).merge(VisualSequenceReasoningAccessSchema).strict();

export const VisualSequenceReasoningGrantSchema = z.object({
  schema: z.literal(HELIX_VISUAL_SEQUENCE_REASONING_GRANT_SCHEMA),
  reasoning_grant_id: z.string().regex(/^vseg_[a-f0-9]{32}$/),
  sequence_id: visualSequenceId,
  owner_profile_id: boundedId,
  permitted_operations: z.array(z.enum(["inspect_manifest", "contact_sheet", "frames"])).min(1),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  status: z.enum(["active", "revoked", "expired"]),
  content_role: z.literal("visual_sequence_reasoning_grant_not_assistant_answer"),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  environment_action: z.literal(false),
  hud_or_controller_mutated: z.literal(false),
}).strict();

export const VisualSequenceEvidenceAssetSchema = z.object({
  kind: z.enum(["contact_sheet", "frame"]),
  artifact_ref: z.string().min(1),
  mime_type: z.literal("image/webp"),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size_bytes: z.number().int().nonnegative(),
  frame_id: boundedId.nullable(),
  pts_ms: z.number().int().nonnegative().nullable(),
}).strict();

export const VisualSequenceEvidencePacketSchema = z.object({
  schema: z.literal(HELIX_VISUAL_SEQUENCE_EVIDENCE_PACKET_SCHEMA),
  packet_id: boundedId,
  sequence_id: visualSequenceId,
  owner_profile_id: boundedId,
  source_id: boundedId,
  producer_epoch: boundedId,
  manifest_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  reasoning_binding_id: boundedId,
  binding_epoch: z.number().int().positive(),
  reasoning_grant_id: z.string().regex(/^vseg_[a-f0-9]{32}$/),
  vision_capability: z.enum(["image_input", "unavailable"]),
  status: z.enum(["ready", "vision_unsupported"]),
  assets: z.array(VisualSequenceEvidenceAssetSchema).max(VISUAL_SEQUENCE_LIMITS.maxMcpSelectedFrames),
  total_image_bytes: z.number().int().nonnegative().max(VISUAL_SEQUENCE_LIMITS.maxMcpImageBytes),
  content_role: z.literal("visual_sequence_evidence_observation_not_assistant_answer"),
  reentry_required: z.literal(true),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  environment_action: z.literal(false),
  hud_or_controller_mutated: z.literal(false),
  typed_world_state_authority: z.literal(false),
}).strict();

export type VisualSequenceReasoningBinding = z.infer<typeof VisualSequenceReasoningBindingSchema>;
export type VisualSequenceReasoningAccess = z.infer<typeof VisualSequenceReasoningAccessSchema>;
export type VisualSequenceReasoningGrant = z.infer<typeof VisualSequenceReasoningGrantSchema>;
export type VisualSequenceFrameSelection = z.infer<typeof VisualSequenceFrameSelectionSchema>;
export type VisualSequenceEvidenceAsset = z.infer<typeof VisualSequenceEvidenceAssetSchema>;
export type VisualSequenceEvidencePacket = z.infer<typeof VisualSequenceEvidencePacketSchema>;

export type VisualSequenceSamplingPolicy = "uniform_time";
export type VisualSequenceCaptureSurface =
  | "hud_clean_feed"
  | "hud_composed_feed"
  | "minecraft_client_window"
  | "program_window";
export type VisualSequenceStopReason = "completed" | "manual_stop";

export type VisualSequenceCaptureMetadata = {
  schema: typeof HELIX_VISUAL_SEQUENCE_CAPTURE_SCHEMA;
  capture_session_id: string;
  source_surface: VisualSequenceCaptureSurface;
  source_id: string;
  producer_epoch: string;
  profile_id: string;
  run_id: string;
  thread_id: string;
  consented_at: string;
  content_cleared_at: string;
  started_at: string;
  ended_at: string;
  requested_duration_ms: number;
  recorded_duration_ms: number;
  stop_reason: VisualSequenceStopReason;
  protected_content: false;
  sensitive_content: false;
  audio_captured: false;
  surface_receipts: Array<{
    at_ms: number;
    receipt_id: string;
    causal_hash: string;
    source_frame_hash: string | null;
    hud_scene_hash: string;
    viewport_hash: string;
    mode: "hud_only_alpha" | "hud_on_black" | "hud_over_source" | "source_only";
    status: "rendered" | "degraded" | "blanked";
  }>;
};

export type VisualSequenceFrame = {
  frame_id: string;
  decoded_index: number;
  pts_ms: number;
  duration_ms: number | null;
  width: number;
  height: number;
  sha256: string;
  image_ref: string;
  mime_type: "image/webp";
  source_classification: "owner_supplied_clip" | "consented_bounded_capture";
  retention_state: "ephemeral";
  related_event_refs: string[];
};

export type VisualSequenceManifest = {
  schema: typeof HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA;
  sequence_id: string;
  owner_profile_id: string;
  thread_id: string;
  source_id: string;
  capture_session_id: string | null;
  producer_epoch: string;
  environment_id: string | null;
  capture: VisualSequenceCaptureMetadata | null;
  created_at: string;
  expires_at: string;
  status: "complete";
  source: {
    original_name: string;
    mime_type: string;
    clip_sha256: string;
    size_bytes: number;
    duration_ms: number;
    coded_width: number;
    coded_height: number;
    display_width: number;
    display_height: number;
    codec: string;
    container: string;
    nominal_frame_rate: string;
    average_frame_rate: string;
    time_base: string;
    rotation_deg: number;
    variable_frame_rate: boolean;
    decoded_frame_count: number;
  };
  decoder: {
    name: "ffmpeg";
    version: string;
    argument_manifest: {
      probe: string[];
      frame_selection: string[];
      image_normalization: string[];
    };
  };
  sampling: {
    requested_policy: VisualSequenceSamplingPolicy;
    applied_policy: VisualSequenceSamplingPolicy;
    requested_cadence_ms: number;
    applied_cadence_ms: number;
    candidate_count: number;
    selected_count: number;
    rejected_count: number;
    rejection_reasons: string[];
  };
  frames: VisualSequenceFrame[];
  contact_sheet: {
    image_ref: string;
    mime_type: "image/webp";
    sha256: string;
    width: number;
    height: number;
  };
  alignments_ref: string;
  receipts_ref: string;
  retention: {
    policy: "ephemeral";
    source_clip_retained: false;
    redaction_policy: "none_owner_supplied_local_clip" | "selected_surface_no_audio";
  };
  authority: {
    model_invoked: false;
    assistant_answer: false;
    live_capture: boolean;
    environment_action: false;
    hud_or_controller_mutated: false;
  };
  manifest_sha256: string;
};

export type VisualSequenceReceipt = {
  schema: typeof HELIX_VISUAL_SEQUENCE_RECEIPT_SCHEMA;
  receipt_id: string;
  sequence_id: string;
  operation: "offline_decode" | "bounded_capture_decode";
  source_clip_sha256: string;
  selected_frame_hashes: string[];
  contact_sheet_sha256: string;
  manifest_sha256: string;
  completed_at: string;
  model_invoked: false;
  assistant_answer: false;
  live_capture: boolean;
  environment_action: false;
  hud_or_controller_mutated: false;
};

export type VisualSequenceIngestResponse = {
  ok: true;
  manifest: VisualSequenceManifest;
  receipt: VisualSequenceReceipt;
};

export type VisualSequenceErrorCode =
  | "developer_account_required"
  | "cross_origin_forbidden"
  | "rate_limited"
  | "video_required"
  | "upload_too_large"
  | "unsupported_media_type"
  | "decoder_unavailable"
  | "corrupt_media"
  | "protected_or_unsupported_media"
  | "duration_limit_exceeded"
  | "dimension_limit_exceeded"
  | "frame_limit_exceeded"
  | "invalid_timestamps"
  | "invalid_capture_metadata"
  | "capture_duration_limit_exceeded"
  | "capture_source_forbidden"
  | "capture_identity_mismatch"
  | "reasoning_grant_not_found"
  | "reasoning_grant_expired"
  | "reasoning_grant_operation_forbidden"
  | "sequence_not_found"
  | "artifact_not_found"
  | "decode_failed";

export type VisualSequenceErrorResponse = {
  ok: false;
  schema: typeof HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA;
  error: VisualSequenceErrorCode;
  message: string;
};
