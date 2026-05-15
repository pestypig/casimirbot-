export const HELIX_ARTIFACT_PROMOTION_AUDIT_SCHEMA =
  "helix.artifact_promotion_audit.v1" as const;

export type HelixAskIntentFamily =
  | "live_environment_setup"
  | "visual_description"
  | "visual_question"
  | "source_diagnostic"
  | "normal_ask";

export type HelixBlockedArtifactPromotion = {
  artifact_kind: string;
  reason: string;
};

export type HelixArtifactPromotionAudit = {
  schema: typeof HELIX_ARTIFACT_PROMOTION_AUDIT_SCHEMA;
  ok: boolean;
  intent_family: HelixAskIntentFamily;
  blocked_artifact_promotions: HelixBlockedArtifactPromotion[];
  source_status_promoted_to_answer: false;
  worker_output_promoted_to_answer: false;
  deterministic_artifact_answer_blocked: boolean;
  assistant_answer: false;
  raw_content_included: false;
};
