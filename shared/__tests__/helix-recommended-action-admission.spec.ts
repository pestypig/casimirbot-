import { describe, expect, it } from "vitest";
import { buildHelixRecommendedActionAdmissionV1, isHelixRecommendedActionAdmissionV1 } from "../contracts/helix-recommended-action-admission.v1";
import {
  assertValidHelixRecommendedActionAdmission,
  canAgentAutomateAdmissionAction,
  canAgentExecuteAdmission,
  classifyRecommendedActionAdmission,
  evaluateRecommendedActionAutomation,
  isBlockedAdmission,
  isDiagnosticOnlyAdmission,
  normalizeHelixRecommendedActionAdmission,
} from "../helix-recommended-action-admission";

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
    expect(artifact.actions.every((action) => action.display_policy === "actionable")).toBe(true);
    expect(artifact.actions.every((action) => action.agentExecutable)).toBe(true);
    expect(artifact.actions.map((action) => action.reasonCode)).toEqual([
      "read_only_allowlisted",
      "read_only_allowlisted",
    ]);
    expect(artifact.authority.agent_executable).toBe(false);
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
    expect(artifact.actions.map((action) => action.reasonCode)).toEqual([
      "calculator_mutation_requires_confirmation",
      "solve_requires_confirmation",
    ]);
    expect(canAgentExecuteAdmission(artifact)).toBe(false);
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
    expect(artifact.actions[0]?.reasonCode).toBe("unknown_action_not_allowlisted");
    expect(isBlockedAdmission(artifact.actions[0]!)).toBe(true);
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
    expect(artifact.actions[0]?.reasonCode).toBe("claim_sensitive_language");
  });

  it("auto admission does not imply agent execution", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Preview graph context.",
      actions: [
        {
          actionId: "build_compound_theory_run",
          panelId: "theory-badge-graph",
          label: "Build preview",
        },
      ],
    });

    expect(artifact.actions[0]?.admission).toBe("auto");
    expect(artifact.actions[0]?.agentExecutable).toBe(true);
    expect(artifact.authority.agent_executable).toBe(false);
    expect(canAgentExecuteAdmission(artifact)).toBe(false);
    const decision = evaluateRecommendedActionAutomation(artifact, artifact.actions[0]!);
    expect(decision.canRoute).toBe(true);
    expect(decision.canShowInUi).toBe(true);
    expect(decision.canExecute).toBe(false);
    expect(decision.reasons).toEqual(
      expect.arrayContaining(["authority_agent_executable_not_true", "authority_terminal_eligible_not_true"]),
    );
  });

  it("supports calculator recommendations independent of theory graph assumptions", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Solve this calculator expression.",
      source: {
        workstation: "ask",
        tool: "scientific-calculator",
        artifact_type: "calculator_recommendation",
      },
      actions: [
        {
          actionId: "solve_with_steps",
          panelId: "scientific-calculator",
          label: "Solve with steps",
          solves: true,
        },
      ],
    });

    expect(artifact.source?.tool).toBe("scientific-calculator");
    expect(artifact.actions[0]?.panelId).toBe("scientific-calculator");
    expect(artifact.actions[0]?.admission).toBe("ask_user");
    expect(artifact.actions[0]?.reasonCode).toBe("solve_requires_confirmation");
  });

  it("auto-admits calculator previews but not calculator solves", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Preview then solve.",
      actions: [
        { actionId: "preview_expression", panelId: "scientific-calculator", label: "Preview expression" },
        { actionId: "solve_expression", panelId: "scientific-calculator", label: "Solve expression", solves: true },
      ],
    });

    expect(artifact.actions.map((action) => `${action.actionId}:${action.admission}:${action.reasonCode}`)).toEqual([
      "scientific-calculator.preview_expression:auto:read_only_allowlisted",
      "scientific-calculator.solve_expression:ask_user:solve_requires_confirmation",
    ]);
  });

  it("classifies notes, repo evidence, and voice panel recommendations", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Prepare cross-panel actions.",
      actions: [
        { actionId: "search", panelId: "repo-evidence", label: "Search repo" },
        { actionId: "run_command", panelId: "repo-evidence", label: "Run command" },
        { actionId: "create_note", panelId: "workstation-notes", label: "Create note" },
        { actionId: "prepare_callout", panelId: "voice", label: "Prepare callout" },
        { actionId: "speak", panelId: "voice", label: "Speak" },
      ],
    });

    expect(artifact.actions.map((action) => `${action.actionId}:${action.admission}:${action.reasonCode}`)).toEqual([
      "repo-evidence.search:auto:read_only_allowlisted",
      "repo-evidence.run_command:ask_user:runtime_execution_requires_confirmation",
      "workstation-notes.create_note:ask_user:workspace_mutation_requires_confirmation",
      "voice.prepare_callout:auto:read_only_allowlisted",
      "voice.speak:ask_user:workspace_mutation_requires_confirmation",
    ]);
  });

  it("normalizes, validates, and exposes diagnostic-only helpers", () => {
    const artifact = classifyRecommendedActionAdmission({
      prompt: "Map source residual.",
      evidenceRefs: ["receipt:test"],
      actions: [
        {
          actionId: "reflect_discussion_context",
          panelId: "theory-badge-graph",
          label: "Reflect discussion",
        },
      ],
    });

    expect(normalizeHelixRecommendedActionAdmission(artifact)).toBe(artifact);
    expect(isDiagnosticOnlyAdmission(artifact.actions[0]!)).toBe(false);
    expect(assertValidHelixRecommendedActionAdmission(artifact)).toBe(artifact);
    expect(artifact.evidenceRefs).toEqual(["receipt:test"]);
  });

  it("throws when asserting an invalid executable diagnostic admission", () => {
    const artifact = buildHelixRecommendedActionAdmissionV1({
      prompt: "Invalid executable diagnostic.",
      sourceReceiptId: null,
      actions: [
        {
          actionId: "theory-badge-graph.build_compound_theory_run",
          panelId: "theory-badge-graph",
          label: "Build preview",
          mutatesCalculator: false,
          solves: false,
          objectiveFit: "high",
          risk: "read_only",
          admission: "auto",
          requiresConfirmation: false,
          agentExecutable: false,
          reason: "Preview.",
          reasonCode: "read_only_allowlisted",
          display_policy: "diagnostic_only",
        },
      ],
    });

    expect(() =>
      assertValidHelixRecommendedActionAdmission({
        ...artifact,
        authority: {
          ...artifact.authority,
          terminal_eligible: true,
          agent_executable: true,
        } as unknown as typeof artifact.authority,
      }),
    ).toThrow(/Invalid helix recommended action admission/);
  });

  it("lets automation read MoralGraph-style diagnostic admissions without opening execution", () => {
    const artifact = buildHelixRecommendedActionAdmissionV1({
      prompt: "Show MoralGraph warning.",
      sourceReceiptId: "ideology-reflection:test",
      source: {
        workstation: "moral-graph",
        tool: "moral-graph-reflection",
        artifact_type: "ideology_context_reflection",
        artifact_id: "ideology-reflection:test",
      },
      evidenceRefs: ["voice:event:1"],
      reasonCodes: ["moral_graph_reflection", "evidence_only_authority"],
      actions: [
        {
          actionId: "moral-graph.show_right_speech_warning",
          panelId: "voice",
          label: "Show right speech warning",
          mutatesCalculator: false,
          solves: false,
          objectiveFit: "high",
          risk: "claim_sensitive",
          admission: "auto",
          requiresConfirmation: false,
          agentExecutable: false,
          reason: "Diagnostic warning only.",
          reasonCode: "diagnostic_only_not_executable",
          display_policy: "diagnostic_only",
          evidenceRefs: ["voice:event:1"],
          reasonCodes: ["moral_graph_reflection", "diagnostic_overlay_only"],
        },
      ],
    });
    const decision = evaluateRecommendedActionAutomation(artifact, artifact.actions[0]!);

    expect(decision.canRoute).toBe(true);
    expect(decision.canShowInUi).toBe(true);
    expect(decision.canExecute).toBe(false);
    expect(canAgentAutomateAdmissionAction(artifact, artifact.actions[0]!)).toBe(false);
    expect(decision.source?.workstation).toBe("moral-graph");
    expect(decision.evidenceRefs).toEqual(["voice:event:1"]);
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(["moral_graph_reflection", "evidence_only_authority", "diagnostic_overlay_only"]),
    );
    expect(decision.reasons).toEqual(
      expect.arrayContaining([
        "diagnostic_only_display_policy",
        "authority_agent_executable_not_true",
        "authority_terminal_eligible_not_true",
        "action_agent_executable_not_true",
      ]),
    );
  });

  it("blocks automation when missing evidence or blocked admission is present", () => {
    const artifact = buildHelixRecommendedActionAdmissionV1({
      prompt: "Missing evidence.",
      sourceReceiptId: "receipt:missing",
      evidenceRequirements: { missing: ["operator authority"] },
      actions: [
        {
          actionId: "moral-graph.block_policy_sensitive_action",
          panelId: "situation-room",
          label: "Block policy-sensitive action",
          mutatesCalculator: false,
          solves: false,
          objectiveFit: "low",
          risk: "unknown",
          admission: "blocked",
          requiresConfirmation: true,
          agentExecutable: false,
          reason: "Blocked.",
          reasonCode: "unknown_action_not_allowlisted",
          display_policy: "hidden",
          evidenceRequirements: { missing: ["operator authority"] },
        },
      ],
    });
    const decision = evaluateRecommendedActionAutomation(artifact, artifact.actions[0]!);

    expect(decision.canRoute).toBe(true);
    expect(decision.canShowInUi).toBe(false);
    expect(decision.canExecute).toBe(false);
    expect(decision.reasons).toEqual(
      expect.arrayContaining([
        "admission_blocked",
        "authority_agent_executable_not_true",
        "authority_terminal_eligible_not_true",
        "action_agent_executable_not_true",
        "missing_evidence_not_empty",
      ]),
    );
  });
});
