export const HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA =
  "helix.visual_evidence_health.v1" as const;

export type HelixVisualEvidenceHealthStatus =
  | "no_source"
  | "permission_required"
  | "waiting_for_first_frame"
  | "frame_captured"
  | "analysis_failed"
  | "analysis_ready"
  | "stale";

export type HelixVisualProviderStatus =
  | "configured"
  | "missing"
  | "failed"
  | "unknown";

export type HelixVisualEvidenceHealth = {
  schema: typeof HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA;
  source_id: string | null;
  thread_id: string;
  status: HelixVisualEvidenceHealthStatus;
  latest_frame_id?: string | null;
  latest_evidence_id?: string | null;
  latest_summary?: string | null;
  provider_status: HelixVisualProviderStatus;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_image_included: false;
};

export type HelixVisualProviderHealth = {
  schema: "helix.visual_provider_health.v1";
  configured: boolean;
  provider: "openai" | "ollama" | "none" | "unknown";
  model: string | null;
  last_error: string | null;
  can_analyze_inline_image: boolean;
  assistant_answer: false;
  raw_image_included: false;
};
