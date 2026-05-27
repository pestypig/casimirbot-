import { describe, expect, it } from "vitest";

import { evaluateCalculatorToolAnswerSupport } from "../services/helix-ask/calculator-tool-answer-support";
import { applyPostToolAuthorityBridgeRepair, buildPostToolAuthorityBridge } from "../services/helix-ask/post-tool-authority-bridge";
import { evaluateVisibleAnswerPolicyFaithfulnessGate } from "../services/helix-ask/visible-answer-policy-faithfulness-gate";
import { getHelixCausalTurnTimeline } from "../services/helix-ask/causal-turn-timeline";

const turnId = "ask:test-post-tool-authority";

describe("Helix Ask post-tool authority bridge", () => {
  it("lets calculator result plus final draft support a synthesized terminal answer", () => {
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Open the scientific calculator, solve 2*(3+4), and explain the steps.",
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_error_code: "terminal_boundary_ineligible",
      canonical_goal_frame: { goal_kind: "calculator_solve" },
      agent_step_decision: { chosen_capability: "scientific-calculator.solve_expression" },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        satisfaction: "unsatisfied",
        next_decision: "fail_closed",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: `${turnId}:calculator_result`,
          kind: "calculator_receipt",
          source_scope: "current_turn",
          payload: {
            schema: "helix.calculator_receipt.v1",
            expression: "2*(3+4)",
            result: "14",
          },
        },
        {
          artifact_id: `${turnId}:final_answer_draft`,
          kind: "final_answer_draft",
          source_scope: "current_turn",
          payload: {
            schema: "helix.final_answer_draft.v1",
            text: "First add 3+4 to get 7, then multiply 2*7 to get the result 14.",
          },
        },
      ],
    };

    const support = evaluateCalculatorToolAnswerSupport({ turnId, payload });
    expect(support.supports_goal).toBe(true);

    const bridge = applyPostToolAuthorityBridgeRepair({ turnId, payload });
    expect(bridge.observation_support_status).toBe("supports_answer");
    expect(payload.terminal_error_code).toBeUndefined();
    expect(payload.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect((payload.goal_satisfaction_evaluation as Record<string, unknown>).satisfaction).toBe("satisfied");
  });

  it("materializes voice confirmation as request_user_input instead of generic failure", () => {
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Have Dottie read that out loud.",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "terminal_boundary_ineligible",
      canonical_goal_frame: { goal_kind: "situation_context_question" },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        satisfaction: "unsatisfied",
        next_decision: "fail_closed",
      },
      current_turn_artifact_ledger: [],
    };

    const bridge = applyPostToolAuthorityBridgeRepair({ turnId, payload });
    expect(bridge.route_family).toBe("voice_delivery");
    expect(payload.terminal_artifact_kind).toBe("request_user_input");
    expect(String(payload.text)).toMatch(/confirmation before speaking/i);
    expect(payload.terminal_error_code).toBeUndefined();
  });

  it("catches visible policy inversion about receipts and final answers", () => {
    const gate = evaluateVisibleAnswerPolicyFaithfulnessGate({
      turnId,
      text: "Receipts are observations. Final answers must be derived from the observations.",
      payload: { terminal_artifact_kind: "repo_code_evidence_answer" },
    });
    expect(gate.ok).toBe(false);
    expect(gate.violations).toContain("receipt_promoted_to_authority");
  });

  it("orders tool observations before post-tool answer artifacts in the causal timeline", () => {
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: "Open the docs viewer.",
      terminal_artifact_kind: "model_synthesized_answer",
      selected_final_answer: "The docs viewer has been successfully opened.",
      canonical_goal_frame: { goal_kind: "docs_panel_open" },
      source_target_intent: { target_source: "workstation_panel" },
      agent_step_decision: { chosen_capability: "docs-viewer.open", next_step: "use_capability" },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: `${turnId}:obs`,
          kind: "agent_step_observation_packet",
          source_scope: "current_turn",
          payload: { schema: "helix.agent_step_observation_packet.v1" },
        },
        {
          artifact_id: `${turnId}:draft`,
          kind: "final_answer_draft",
          source_scope: "current_turn",
          payload: { schema: "helix.final_answer_draft.v1", text: "The docs viewer has been successfully opened." },
        },
      ],
    };
    const timeline = getHelixCausalTurnTimeline(payload);
    const observationIndex = timeline.events.findIndex((event) => event.stage === "tool_observation_created");
    const answerIndex = timeline.events.findIndex((event) => event.stage === "model_answer_artifact_created");
    expect(observationIndex).toBeGreaterThanOrEqual(0);
    expect(answerIndex).toBeGreaterThan(observationIndex);
  });
});
