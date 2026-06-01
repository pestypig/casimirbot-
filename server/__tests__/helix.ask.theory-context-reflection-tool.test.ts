import { describe, expect, it } from "vitest";

import { isHelixTheoryContextReflectionToolReceiptV1 } from "../../shared/contracts/helix-theory-context-reflection-tool-receipt.v1";
import { runAskLevelTheoryContextReflectionTool } from "../services/helix-ask/theory-context-reflection-tool";

describe("Ask-level theory context reflection tool adapter", () => {
  it("wraps shared reflection as an Ask evidence receipt with requested panel sync", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection",
      threadId: "thread:ask-reflection",
      prompt: "Where do source residual and QEI margin fit in the theory graph?",
      syncPanel: true,
      openPanel: false,
      panelOverlayMode: "live_answer_context",
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.authority.ask_context_policy).toBe("evidence_only");
    expect(receipt.reflectionV1.input.source).toBe("helix_ask");
    expect(receipt.explanationPlanV1?.terminal_eligible).toBe(false);
    expect(receipt.panelSync).toMatchObject({
      requested: true,
      applied: false,
      panelId: "theory-badge-graph",
      selectedLiveContextBlock: true,
      openPanel: false,
      overlayMode: "live_answer_context",
    });
  });

  it("builds reflection receipt without solving", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection:no-solve",
      threadId: "thread:ask-reflection",
      prompt: "Map source residual and QEI margin in the theory graph.",
      buildExplanationPlan: false,
    });
    const serialized = JSON.stringify(receipt);

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.explanationPlanV1).toBeNull();
    expect(serialized).not.toContain("calculatorArtifactV1");
    expect(serialized).not.toContain("runtimeReceiptV1");
  });

  it("optionally builds explanation plan", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection:plan",
      threadId: "thread:ask-reflection",
      prompt: "Map source residual and QEI margin in the theory graph.",
      buildExplanationPlan: true,
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.explanationPlanV1).not.toBeNull();
    expect(receipt.explanationPlanV1?.terminal_eligible).toBe(false);
  });

  it("sets panelSync requested but not applied on the server", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection:sync",
      threadId: "thread:ask-reflection",
      prompt: "Where does E=hf fit in the theory graph?",
      syncPanel: true,
    });

    expect(receipt.panelSync.requested).toBe(true);
    expect(receipt.panelSync.applied).toBe(false);
    expect(receipt.panelSync.overlayMode).toBe("live_answer_context");
  });

  it("does not return calculator/runtime receipts", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection:no-runtime",
      threadId: "thread:ask-reflection",
      prompt: "Map Einstein tensor and source residual in the theory graph.",
      buildExplanationPlan: true,
    });
    const serialized = JSON.stringify(receipt);

    expect(serialized).not.toContain("scientific_calculator_step_trace");
    expect(serialized).not.toContain("theory_runtime_receipt");
    expect(serialized).not.toContain("starsim_runtime_receipt");
  });

  it("preserves authority false across receipt, reflection, and explanation plan", () => {
    const receipt = runAskLevelTheoryContextReflectionTool({
      turnId: "turn:ask-reflection:authority",
      threadId: "thread:ask-reflection",
      prompt: "Map source residual and QEI margin in the theory graph.",
      buildExplanationPlan: true,
    });

    expect(receipt.authority.assistant_answer).toBe(false);
    expect(receipt.authority.raw_content_included).toBe(false);
    expect(receipt.authority.terminal_eligible).toBe(false);
    expect(receipt.reflectionV1.assistant_answer).toBe(false);
    expect(receipt.reflectionV1.raw_content_included).toBe(false);
    expect(receipt.reflectionV1.terminal_eligible).toBe(false);
    expect(receipt.explanationPlanV1?.assistant_answer).toBe(false);
    expect(receipt.explanationPlanV1?.raw_content_included).toBe(false);
    expect(receipt.explanationPlanV1?.terminal_eligible).toBe(false);
  });
});
