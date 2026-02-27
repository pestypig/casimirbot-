import { describe, expect, it } from "vitest";
import { evaluateKnowledgePromotionGate } from "../server/services/knowledge/promotion-gate";

describe("evaluateKnowledgePromotionGate", () => {
  it("rejects non-certified claim tiers", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "diagnostic",
      evidenceRef: "trace-1",
      evidenceResolved: true,
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_CERTIFIED_ONLY_REQUIRED");
    }
  });

  it("rejects when server evidence reference is missing", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      evidenceRef: "",
      evidenceResolved: false,
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_MISSING_EVIDENCE_REF");
    }
  });

  it("rejects when server evidence reference does not resolve", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      evidenceRef: "trace-unknown",
      evidenceResolved: false,
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_UNRESOLVED_EVIDENCE_REF");
    }
  });

  it("rejects resolved non-PASS verdict", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      evidenceRef: "trace-1",
      evidenceResolved: true,
      casimirVerdict: "FAIL",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_MISSING_CASIMIR_VERIFICATION");
    }
  });

  it("rejects resolved missing certificate integrity", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      evidenceRef: "trace-1",
      evidenceResolved: true,
      casimirVerdict: "PASS",
      certificateHash: null,
      certificateIntegrityOk: false,
    });

    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.code).toBe("KNOWLEDGE_PROMOTION_CERTIFICATE_INTEGRITY_REQUIRED");
    }
  });

  it("allows certified promotion when resolved evidence checks pass", () => {
    const decision = evaluateKnowledgePromotionGate({
      enforceCertifiedOnly: true,
      claimTier: "certified",
      evidenceRef: "trace-1",
      evidenceResolved: true,
      casimirVerdict: "PASS",
      certificateHash: "abc123",
      certificateIntegrityOk: true,
    });

    expect(decision).toEqual({ ok: true, enforcement: "enforce" });
  });
});
