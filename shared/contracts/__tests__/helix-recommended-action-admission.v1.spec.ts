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
        agentExecutable: true,
        reason: "Read-only preview.",
        reasonCode: "read_only_allowlisted",
        display_policy: "actionable",
        evidenceRefs: ["badge:source-residual"],
        reasonCodes: ["evidence_only_authority", "read_only_allowlisted"],
        source: { panel: "theory-badge-graph", panelId: "theory-badge-graph" },
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
        agentExecutable: false,
        reason: "Solving requires explicit admission.",
        reasonCode: "solve_requires_confirmation",
        display_policy: "actionable",
        reasonCodes: ["solve_requires_confirmation"],
        source: { panel: "scientific-calculator", panelId: "scientific-calculator" },
      },
    ],
    source: {
      workstation: "ask",
      panel: "theory-badge-graph",
      route: "theory_context_reflection",
      tool: "helix_ask.reflect_theory_context",
      artifact_type: "theory_context_reflection",
      artifact_id: "reflection:test",
    },
    evidenceRefs: ["receipt:test"],
    reasonCodes: ["auto_admission_is_not_agent_execution"],
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
    expect(artifact.authority.agent_executable).toBe(false);
    expect(artifact.actions[0]?.display_policy).toBe("actionable");
    expect(artifact.actions[0]?.agentExecutable).toBe(true);
    expect(artifact.actions[0]?.reasonCode).toBe("read_only_allowlisted");
    expect(artifact.source?.artifact_type).toBe("theory_context_reflection");
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
        agent_executable: false,
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

  it("accepts optional source metadata and evidence refs", () => {
    const artifact = validAdmission();

    expect(validateHelixRecommendedActionAdmissionV1(artifact)).toEqual([]);
    expect(artifact.evidenceRefs).toEqual(["receipt:test"]);
    expect(artifact.actions[0]?.evidenceRefs).toEqual(["badge:source-residual"]);
  });

  it("rejects blocked executable admissions", () => {
    const artifact = validAdmission();
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...artifact,
      authority: {
        ...artifact.authority,
        terminal_eligible: true,
        agent_executable: true,
      },
      actions: [
        {
          ...artifact.actions[0],
          admission: "blocked",
          requiresConfirmation: true,
          agentExecutable: true,
        },
      ],
    });

    expect(issues).toContain("authority.terminal_eligible must be false");
    expect(issues).toContain("authority.agent_executable must be false");
    expect(issues).toContain("blocked actions cannot be agent executable");
  });

  it("rejects diagnostic-only executable admissions", () => {
    const artifact = validAdmission();
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...artifact,
      authority: {
        ...artifact.authority,
        terminal_eligible: true,
        agent_executable: true,
      },
      actions: [
        {
          ...artifact.actions[0],
          display_policy: "diagnostic_only",
          agentExecutable: true,
        },
        artifact.actions[1],
      ],
    });

    expect(issues).toContain("authority.agent_executable must be false");
    expect(issues).toContain("diagnostic_only actions cannot be agent executable");
  });

  it("rejects executable admissions with missing evidence", () => {
    const artifact = validAdmission();
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...artifact,
      authority: {
        ...artifact.authority,
        terminal_eligible: true,
        agent_executable: true,
      },
      actions: [
        {
          ...artifact.actions[0],
          display_policy: "actionable",
          agentExecutable: true,
          evidenceRequirements: {
            required: ["runtime_trace"],
            missing: ["runtime_trace"],
          },
        },
        artifact.actions[1],
      ],
    });

    expect(issues).toContain("authority.agent_executable must be false");
    expect(issues).toContain("missing required evidence cannot produce an executable action");
  });

  it("rejects auto admissions that solve", () => {
    const artifact = validAdmission();
    const issues = validateHelixRecommendedActionAdmissionV1({
      ...artifact,
      actions: [
        {
          ...artifact.actions[0],
          solves: true,
        },
        artifact.actions[1],
      ],
    });

    expect(issues).toContain("actions[0] auto actions cannot solve");
  });
});
