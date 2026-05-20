import assert from "node:assert/strict";
import { test } from "vitest";
import {
  buildBrowserClaimReviewReferral,
  buildMinecraftRouteAssistReferral,
  buildResearchVerificationReferral,
  buildSupportEscalationReferral,
  buildTranslationAmbiguityReferral,
  buildWorkstationOperatorReviewReferral,
  type HelixOperatorReferral,
  type OperatorReferralType,
} from "../shared/helix-operator-referral.ts";

const builders: Record<OperatorReferralType, () => HelixOperatorReferral> = {
  minecraft_route_assist: () =>
    buildMinecraftRouteAssistReferral({
      referral_id: "ref:minecraft",
      reason_code: "wrong_direction_from_end_return_route",
      thread_id: "thread",
      related_objective_id: "objective",
      evidence_refs: ["evidence"],
    }),
  browser_claim_review: () =>
    buildBrowserClaimReviewReferral({
      referral_id: "ref:browser",
      reason_code: "claim_contradiction",
      thread_id: "thread",
      evidence_refs: ["evidence"],
    }),
  translation_ambiguity: () =>
    buildTranslationAmbiguityReferral({
      referral_id: "ref:translation",
      reason_code: "ambiguous_idiom",
      thread_id: "thread",
      evidence_refs: ["evidence"],
    }),
  workstation_operator_review: () =>
    buildWorkstationOperatorReviewReferral({
      referral_id: "ref:workstation",
      reason_code: "repeated_test_failure",
      thread_id: "thread",
      evidence_refs: ["evidence"],
    }),
  research_verification: () =>
    buildResearchVerificationReferral({
      referral_id: "ref:research",
      reason_code: "source_verification_needed",
      thread_id: "thread",
      evidence_refs: ["evidence"],
    }),
  support_escalation: () =>
    buildSupportEscalationReferral({
      referral_id: "ref:support",
      reason_code: "stuck_loop_detected",
      thread_id: "thread",
      evidence_refs: ["evidence"],
    }),
};

for (const referralType of Object.keys(builders) as OperatorReferralType[]) {
  test(`creates ${referralType} referral without Ask authority`, () => {
    const referral = builders[referralType]();

    assert.equal(referral.referral_type, referralType);
    assert.equal(referral.instruction_authority, "none");
    assert.equal(referral.ask_instruction_authority, "none");
    assert.equal(referral.creates_ask_turn, false);
    assert.equal(referral.turn_triggered, false);
    assert.equal(referral.context_role, "operator_referral");
    assert.notEqual(referral.ask_context_policy, "evidence_only");
    assert.equal(referral.model_invoked, false);
  });
}
