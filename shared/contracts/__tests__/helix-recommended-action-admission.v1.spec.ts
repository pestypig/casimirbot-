import { describe, expect, it } from "vitest";
import {
  buildHelixRecommendedActionAdmissionV1,
  isHelixRecommendedActionAdmissionV1,
  validateHelixRecommendedActionAdmissionV1,
} from "../helix-recommended-action-admission.v1";

const validAdmission = () =>
  buildHelixRecommendedActionAdmissionV1({
    prompt: "Map source residual and QEI margin.",
    sourceReceiptId: "receipt:test",
    actions: [
      {
        actionId: "theory-badge-graph.build_compound_theory_run",
        panelId: "theory-badge-graph",
        label: "Build compound theory run",
        mutatesCalculator: false,
        solves: false,
        objectiveFit: "high",
        risk: "read_only",
        admission: "auto",
        requiresConfirmation: false,
        reason: "Read-only preview.",
      },
      {
        actionId: "scientific-calculator.solve_expression",
        panelId: "scientific-calculator",
        label: "Solve expression",
        mutatesCalculator: false,
        solves: true,
        objectiveFit: "high",
        risk: "expensive",
        admission: "ask_user",
        requiresConfirmation: true,
        reason: "Solving requires explicit admission.",
      },
    ],
  });

describe("helix recommended action admission v1", () => {
  it("builds a valid evidence-only admission artifact", () => {
    const artifact = validAdmission();

    expect(artifact.artifactId).toBe("helix_recommended_action_admission");
    expect(artifact.schemaVersion).toBe("helix_recommended_action_admission/v1");
    expect(artifact.summary).toMatchObject({
      actionCount: 2,
      autoCount: 1,
      askUserCount: 1,
      blockedCount: 0,
    });
    expect(artifact.authority.assistant_answer).toBe(false);
    expect(artifact.authority.terminal_eligible).toBe(false);
    expect(isHelixRecommendedActionAdmissionV1(artifact)).toBe(true);
  });

  it("rejects invalid artifact id", () => {
    expect(validateHelixRecommendedActionAdmissionV1({
      ...validAdmission(),
      artifactId: "wrong",
    })).toContain("artifactId must be helix_recommended_action_admission");
  });

  it("rejects invalid risk and admission values", () => {
    const artifact = validAdmission() as unknown as Record<string, unknown>;
    const actions = [...(artifact.actions as Record<string, unknown>[])];
    actions[0] = { ...actions[0], risk: "danger", admission: "go" };

    const issues = validateHelixRecommendedActionAdmissionV1({ ...artifact, actions });

    expect(issues).toContain("actions[0].risk is invalid");
    expect(issues).toContain("actions[0].admission is invalid");
  });

  it("validates summary counts", () => {
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...validAdmission(),
      summary: {
        actionCount: 99,
        autoCount: 0,
        askUserCount: 0,
        blockedCount: 0,
      },
    });

    expect(issues).toContain("summary.actionCount must be 2");
    expect(issues).toContain("summary.autoCount must be 1");
  });

  it("rejects terminal authority flags", () => {
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...validAdmission(),
      authority: {
        assistant_answer: true,
        raw_content_included: false,
        terminal_eligible: true,
        context_role: "tool_policy",
        ask_context_policy: "evidence_only",
      },
    });

    expect(issues).toContain("authority.assistant_answer must be false");
    expect(issues).toContain("authority.terminal_eligible must be false");
  });

  it("rejects forbidden overclaiming phrases", () => {
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...validAdmission(),
      actions: [
        {
          ...validAdmission().actions[0],
          reason: "validated propulsion",
        },
      ],
    });

    expect(issues.some((issue) => issue.includes("forbidden overclaiming text"))).toBe(true);
  });
});
