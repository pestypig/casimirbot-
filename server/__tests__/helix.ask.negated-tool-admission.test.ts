import { describe, expect, it } from "vitest";

import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";

const turnId = "ask:test:negated-tool-admission";
const threadId = "helix-ask:test";

const canonicalGoal = {
  turn_id: turnId,
  goal_kind: "model_only_concept",
  answer_scope: "model_only",
  required_terminal_kind: "direct_answer_text",
  allows_workspace_context: false,
  allows_prior_artifacts: false,
  corpus_anchors: [],
  numeric_tokens: [],
  concept_tokens: [],
  confidence: "high",
  classifier_reasons: ["test"],
};

describe("Helix Ask negated/contextual tool admission", () => {
  it("suppresses contextual docs-viewer references before tool admission", () => {
    const prompts = [
      "Do not open the docs viewer; just explain what the docs viewer is for.",
      "Explain what would happen if I opened the docs viewer.",
      '"Open the docs viewer" is the command I typed; explain what it means.',
      "I opened the docs viewer earlier; what is it for?",
    ];

    for (const promptText of prompts) {
      const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
      const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });
      const plan = buildCapabilityPlan({
        turnId,
        promptText,
        sourceTargetIntent,
        toolCallAdmissionDecision: admission,
        canonicalGoalFrame: canonicalGoal,
      });

      expect(sourceTargetIntent).toMatchObject({
        target_source: "model_only",
        target_kind: "general_background",
        allow_no_tool_direct: true,
      });
      expect(admission).toMatchObject({
        source_target: "model_only",
        required: false,
        admitted_tool_families: ["model_only"],
        tool_admission_suppressed: true,
      });
      expect(plan).toMatchObject({
        source_target: "model_only",
        requested_action: "suppressed_contextual_tool_reference",
        tool_admission_suppressed: true,
      });
      expect(plan.capability_family).not.toBe("docs");
      expect(plan.capability_family).not.toBe("repo_evidence");
    }
  });

  it("keeps affirmative docs-viewer open commands admissible", () => {
    const promptText = "Open the docs viewer.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      target_kind: "docs_viewer",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      source_target: "docs_viewer",
      required: true,
      admitted_tool_families: ["docs_viewer"],
    });
    expect(admission.tool_admission_suppressed).toBeUndefined();
  });
});
