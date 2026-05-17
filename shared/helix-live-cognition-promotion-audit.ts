export const HELIX_LIVE_COGNITION_PROMOTION_AUDIT_SCHEMA =
  "helix.live_cognition_promotion_audit.v1" as const;

export type HelixLiveCognitionPromotionAuditCheck = {
  check: string;
  passed: boolean;
  evidence: string;
};

export type HelixLiveCognitionPromotionAudit = {
  schema: typeof HELIX_LIVE_COGNITION_PROMOTION_AUDIT_SCHEMA;
  audit_id: string;
  thread_id: string;
  ok: boolean;
  checks: HelixLiveCognitionPromotionAuditCheck[];
  violations: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
