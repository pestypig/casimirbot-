import { describe, expect, it } from "vitest";

import {
  buildVisibleAnswerPolicyTerminalRetryMarker,
  readVisibleAnswerPolicyTerminalRetryRequest,
  theoryExecutionClosureViolationIsTerminallyRepairable,
} from "../visible-answer-policy-terminal-retry";

const repairablePayload = (): Record<string, unknown> => ({
  visible_answer_policy_faithfulness_rejection: {
    schema: "helix.visible_answer_policy_faithfulness_rejection.v1",
    rejected_terminal_artifact_kind: "model_synthesized_answer",
    rejected_final_answer_source: "final_answer_draft",
    violation: "theory_execution_closure_physical_truth_overclaim",
    repairable: true,
    retry_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
});

describe("visible answer policy terminal retry", () => {
  it("admits exactly one explicit repairable closure-policy retry", () => {
    const payload = repairablePayload();

    expect(readVisibleAnswerPolicyTerminalRetryRequest(payload)).toEqual({
      violation: "theory_execution_closure_physical_truth_overclaim",
      rejectedTerminalArtifactKind: "model_synthesized_answer",
      rejectedFinalAnswerSource: "final_answer_draft",
    });

    payload.visible_answer_policy_terminal_retry =
      buildVisibleAnswerPolicyTerminalRetryMarker({
        turnId: "ask:test:visible-policy-retry",
        violation: "theory_execution_closure_physical_truth_overclaim",
        status: "attempting",
        outcome: "provider_terminal_recovery_started",
      });

    expect(readVisibleAnswerPolicyTerminalRetryRequest(payload)).toBeNull();
    expect(payload.visible_answer_policy_terminal_retry).toMatchObject({
      schema: "helix.visible_answer_policy_terminal_retry.v1",
      attempt_count: 1,
      attempt_limit: 1,
      status: "attempting",
    });
  });

  it.each([
    "theory_execution_closure_artifact_invalid",
    "theory_execution_closure_synthesis_blocked",
    "route_contract_forbidden",
  ])("fails closed for non-repairable violation %s", (violation) => {
    const payload = repairablePayload();
    payload.visible_answer_policy_faithfulness_rejection = {
      schema: "helix.visible_answer_policy_faithfulness_rejection.v1",
      violation,
      repairable: false,
      retry_required: false,
    };

    expect(
      theoryExecutionClosureViolationIsTerminallyRepairable(violation),
    ).toBe(false);
    expect(readVisibleAnswerPolicyTerminalRetryRequest(payload)).toBeNull();
  });
});
