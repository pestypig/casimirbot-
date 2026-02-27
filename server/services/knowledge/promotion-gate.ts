export type KnowledgePromotionTier = "diagnostic" | "reduced-order" | "certified";

export type KnowledgePromotionRejectCode =
  | "KNOWLEDGE_PROMOTION_CERTIFIED_ONLY_REQUIRED"
  | "KNOWLEDGE_PROMOTION_MISSING_CASIMIR_VERIFICATION"
  | "KNOWLEDGE_PROMOTION_CERTIFICATE_INTEGRITY_REQUIRED";

export type KnowledgePromotionDecision =
  | {
      ok: true;
      enforcement: "report-only" | "enforce";
    }
  | {
      ok: false;
      enforcement: "report-only" | "enforce";
      code: KnowledgePromotionRejectCode;
      message: string;
    };

export type KnowledgePromotionGateInput = {
  enforceCertifiedOnly: boolean;
  claimTier: KnowledgePromotionTier;
  casimirVerdict?: "PASS" | "FAIL";
  certificateHash?: string | null;
  certificateIntegrityOk?: boolean;
};

export function evaluateKnowledgePromotionGate(
  input: KnowledgePromotionGateInput,
): KnowledgePromotionDecision {
  const enforcement = input.enforceCertifiedOnly ? "enforce" : "report-only";

  if (input.claimTier !== "certified") {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_CERTIFIED_ONLY_REQUIRED",
      message: "Production promotion requires claimTier=certified.",
    };
  }

  if (input.casimirVerdict !== "PASS") {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_MISSING_CASIMIR_VERIFICATION",
      message: "Production promotion requires Casimir verdict PASS.",
    };
  }

  if (!input.certificateHash || input.certificateIntegrityOk !== true) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_CERTIFICATE_INTEGRITY_REQUIRED",
      message: "Production promotion requires certificate hash with integrityOk=true.",
    };
  }

  return {
    ok: true,
    enforcement,
  };
}
