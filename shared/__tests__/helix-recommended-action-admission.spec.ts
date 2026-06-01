import { describe, expect, it } from "vitest";
import { isHelixRecommendedActionAdmissionV1 } from "../contracts/helix-recommended-action-admission.v1";
import { classifyRecommendedActionAdmission } from "../helix-recommended-action-admission";

describe("recommended action admission policy", () => {
  it("auto-admits read-only reflection and build preview actions", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Map source residual and QEI margin.",
      sourceReceiptId: "receipt:test",
      actions: [
        {
          actionId: "reflect_discussion_context",
          panelId: "theory-badge-graph",
          label: "Reflect discussion",
        },
        {
          actionId: "build_compound_theory_run",
          panelId: "theory-badge-graph",
          label: "Build preview",
        },
      ],
    });

    expect(isHelixRecommendedActionAdmissionV1(artifact)).toBe(true);
    expect(artifact.actions.map((action) => action.admission)).toEqual(["auto", "auto"]);
    expect(artifact.summary.autoCount).toBe(2);
  });

  it("requires confirmation for calculator load and solve actions", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Load and solve these rows.",
      actions: [
        {
          actionId: "load_scalar_cut_to_calculator",
          panelId: "theory-badge-graph",
          label: "Load scalar cut",
          mutatesCalculator: true,
        },
        {
          actionId: "solve_expression",
          panelId: "scientific-calculator",
          label: "Solve expression",
          solves: true,
        },
      ],
    });

    expect(artifact.actions.map((action) => action.admission)).toEqual(["ask_user", "ask_user"]);
    expect(artifact.actions.every((action) => action.requiresConfirmation)).toBe(true);
  });

  it("blocks unknown actions", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Try custom thing.",
      actions: [
        {
          actionId: "launch_unregistered_runtime",
          panelId: "theory-badge-graph",
          label: "Launch unregistered runtime",
        },
      ],
    });

    expect(artifact.actions[0]?.risk).toBe("unknown");
    expect(artifact.actions[0]?.admission).toBe("blocked");
  });

  it("blocks claim promotion language", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Promote this.",
      actions: [
        {
          actionId: "build_compound_theory_run",
          panelId: "theory-badge-graph",
          label: "validated propulsion promotion",
        },
      ],
    });

    expect(artifact.actions[0]?.risk).toBe("claim_sensitive");
    expect(artifact.actions[0]?.admission).toBe("blocked");
  });
});
