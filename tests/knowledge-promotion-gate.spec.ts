import { describe, expect, it } from "vitest";
import { evaluateKnowledgePromotionGate } from "../server/services/knowledge/promotion-gate";

describe("evaluateKnowledgePromotionGate", () => {
  it("rejects non-certified claim tiers", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "diagnostic",
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_CERTIFIED_ONLY_REQUIRED");
    }
  });

  it("rejects missing casimir pass", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      casimirVerdict: "FAIL",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_MISSING_CASIMIR_VERIFICATION");
    }
  });

  it("rejects missing certificate integrity", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      casimirVerdict: "PASS",
      certificateHash: null,
      certificateIntegrityOk: false,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_CERTIFICATE_INTEGRITY_REQUIRED");
    }
  });

  it("allows certified promotion when all checks pass", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision).toEqual({ ok: true, enforcement: "enforce" });
  });
});
