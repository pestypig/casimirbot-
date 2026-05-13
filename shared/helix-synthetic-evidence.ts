export const HELIX_SYNTHETIC_EVIDENCE_SCHEMA = "helix.synthetic_evidence.v1" as const;

export type HelixSyntheticEvidenceProducer =
  | "deterministic_reducer"
  | "calculator"
  | "live_environment"
  | "workstation_note"
  | "ideology"
  | "minecraft_spatial_reducer"
  | "model_review";

export type HelixSyntheticEvidenceSupportStatus =
  | "supports"
  | "contradicts"
  | "partial"
  | "unknown";

export type HelixSyntheticEvidence = {
  schema: typeof HELIX_SYNTHETIC_EVIDENCE_SCHEMA;
  evidence_id: string;
  thread_id: string;
  produced_by: HelixSyntheticEvidenceProducer;
  claim: string;
  support_status: HelixSyntheticEvidenceSupportStatus;
  source_refs: string[];
  reusable_context_ref?: string | null;
  raw_content_included: false;
  assistant_answer: false;
  deterministic: boolean;
  model_invoked: boolean;
  created_at: string;
};
