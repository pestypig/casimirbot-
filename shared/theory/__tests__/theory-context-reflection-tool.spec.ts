import { describe, expect, it } from "vitest";

import { isHelixTheoryContextReflectionToolReceiptV1 } from "../../contracts/helix-theory-context-reflection-tool-receipt.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { runHelixTheoryContextReflectionTool } from "../theory-context-reflection-tool";

describe("Helix theory context reflection tool runner", () => {
  it("builds a non-terminal receipt without mutating UI or solving", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner",
      threadId: "thread:shared-runner",
      prompt: "Map source residual and QEI margin in the theory graph.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      buildExplanationPlan: true,
      panelSync: {
        requested: true,
        applied: false,
        overlayMode: "live_answer_context",
        openPanel: false,
        selectedLiveContextBlock: true,
      },
    });

    expect(isHelixTheoryContextReflectionToolReceiptV1(receipt)).toBe(true);
    expect(receipt.authority.assistant_answer).toBe(false);
    expect(receipt.authority.terminal_eligible).toBe(false);
    expect(receipt.reflectionV1.terminal_eligible).toBe(false);
    expect(receipt.explanationPlanV1?.terminal_eligible).toBe(false);
    expect(receipt.panelSync).toMatchObject({
      requested: true,
      applied: false,
      panelId: "theory-badge-graph",
      selectedLiveContextBlock: true,
      openPanel: false,
      overlayMode: "live_answer_context",
    });
    expect(receipt.recommendedNextActions.every((action: { solves: boolean }) => action.solves === false)).toBe(true);
  });

  it("combines reflection and explanation recommendedNextActions", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const receipt = runHelixTheoryContextReflectionTool({
      graph,
      turnId: "turn:shared-runner:actions",
      threadId: "thread:shared-runner",
      prompt: "Map source residual and QEI margin in the theory graph.",
      mentionedSymbols: ["qei_margin", "source_residual"],
      mentionedDomains: ["warp_gr_nhm2", "qei_stress_energy"],
      buildExplanationPlan: true,
    });

    expect(receipt.explanationPlanV1).not.toBeNull();
    expect(receipt.recommendedNextActions).toEqual(
      expect.arrayContaining(receipt.reflectionV1.evidenceForAsk.recommendedNextActions),
    );
    expect(receipt.recommendedNextActions).toEqual(
      expect.arrayContaining(receipt.explanationPlanV1?.recommendedNextActions ?? []),
    );
  });
});
