export type KnowledgePromotionTier = "diagnostic" | "reduced-order" | "certified";

export type KnowledgePromotionRejectCode =
  | "KNOWLEDGE_PROMOTION_MISSING_EVIDENCE_REF"
  | "KNOWLEDGE_PROMOTION_UNRESOLVED_EVIDENCE_REF"
  | "KNOWLEDGE_PROMOTION_EVIDENCE_TENANT_FORBIDDEN"
  | "KNOWLEDGE_PROMOTION_UNTRUSTED_EVIDENCE_PROVENANCE"
  | "KNOWLEDGE_PROMOTION_POLICY_DISABLED"
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
  evidenceRef?: string;
  evidenceResolved: boolean;
  evidenceTenantAllowed?: boolean;
  evidenceTrustedProvenance?: boolean;
  promotionPolicyEnabled?: boolean;
  casimirVerdict?: "PASS" | "FAIL";
  certificateHash?: string | null;
  certificateIntegrityOk?: boolean;
};

export function evaluateKnowledgePromotionGate(
  input: KnowledgePromotionGateInput,
): KnowledgePromotionDecision {
  const enforcement = input.enforceCertifiedOnly ? "enforce" : "report-only";

  if (input.promotionPolicyEnabled === false) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_POLICY_DISABLED",
      message: "Knowledge promotion is disabled by server policy.",
    };
  }

  if (input.claimTier !== "certified") {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_CERTIFIED_ONLY_REQUIRED",
      message: "Production promotion requires claimTier=certified.",
    };
  }

  if (!input.evidenceRef) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_MISSING_EVIDENCE_REF",
      message: "Production promotion requires a server-verifiable evidenceRef.",
    };
  }

  if (input.evidenceTenantAllowed === false) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_EVIDENCE_TENANT_FORBIDDEN",
      message: "Promotion evidenceRef is not accessible for the active tenant context.",
    };
  }

  if (!input.evidenceResolved) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_UNRESOLVED_EVIDENCE_REF",
      message: "Promotion evidenceRef could not be resolved to a server trace record.",
    };
  }

  if (input.evidenceTrustedProvenance === false) {
    return {
      ok: false,
      enforcement,
      code: "KNOWLEDGE_PROMOTION_UNTRUSTED_EVIDENCE_PROVENANCE",
      message: "Promotion evidenceRef must be verifier-issued server evidence.",
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
