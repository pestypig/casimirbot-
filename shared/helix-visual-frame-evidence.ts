export const HELIX_VISUAL_FRAME_RECORD_SCHEMA =
  "helix.visual_frame_record.v1" as const;
export const HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA =
  "helix.visual_frame_evidence.v1" as const;

export type HelixVisualPlayerPosition = {
  world_id: string;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  pitch?: number;
};

export type HelixVisualFrameRecord = {
  schema: typeof HELIX_VISUAL_FRAME_RECORD_SCHEMA;
  frame_id: string;
  source_id: string;
  thread_id: string;
  room_id?: string | null;
  ts: string;
  player_position?: HelixVisualPlayerPosition | null;
  related_event_refs: string[];
  image_ref?: string | null;
  image_sha256?: string | null;
  mime_type?: string | null;
  raw_image_storage_policy: "ephemeral" | "debug_retained" | "profile_opt_in";
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};

export type HelixVisualFrameSupportClaim = {
  claim: string;
  support_status: "supports" | "contradicts" | "partial" | "unknown";
  confidence: number;
};

export type HelixVisualFrameEvidence = {
  schema: typeof HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA;
  frame_id: string;
  evidence_id: string;
  source_id: string;
  thread_id: string;
  ts: string;
  player_position?: HelixVisualPlayerPosition | null;
  related_event_refs: string[];
  image_model: string;
  model_invoked: true;
  summary: string;
  detected_objects: string[];
  detected_scene_relations: string[];
  uncertainty: string[];
  supports_claims: HelixVisualFrameSupportClaim[];
  visual_observer_profile_id?: string | null;
  visual_observer_profile_title?: string | null;
  visual_prompt_hash?: string | null;
  visual_output_mode?: string | null;
  visual_observer_structured_output?: Record<string, unknown> | null;
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};
