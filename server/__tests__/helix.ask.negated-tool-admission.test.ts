import { describe, expect, it } from "vitest";

import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildAskTurnSolverTrace, evaluateAskTurnSolverHardGate } from "../services/helix-ask/ask-turn-solver";
import { buildCapabilityLifecycleLedger } from "../services/helix-ask/capability-lifecycle-ledger";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildSolverContinuationObservation } from "../services/helix-ask/solver-continuation";
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

const availableCapabilities = (keys: string[]) => ({
  schema: "helix.available_capabilities.v1",
  turn_id: turnId,
  manifest_role: "model_visible_tool_menu",
  tool_manifest_version: "helix.ask.capability_manifest.v1",
  user_goal_summary: "test",
  canonical_goal_kind: "scholarly_research_lookup",
  model_visible_capability_keys: keys,
  recommended_capability_key: keys[0] ?? null,
  classifier_hints: [],
  capabilities: keys.map((key) => ({
    capability_key: key,
    label: key,
    lane: "retrieval",
    requires_action: true,
    expected_artifacts: [],
    goal_fit: "primary",
    reason: "test",
    model_visible_name: key,
    model_visible_description: key,
    availability: "available",
  })),
  assistant_answer: false,
  raw_content_included: false,
});

describe("Helix Ask negated/contextual tool admission", () => {
  it("suppresses contextual docs-viewer references before tool admission", () => {
    const prompts = [
      "Do not open the docs viewer; just explain what the docs viewer is for.",
      "Explain what would happen if I opened the docs viewer.",
      '"Open the docs viewer" is the command I typed; explain what it means.',
      "I opened the docs viewer earlier; what is it for?",
      "Earlier I saw the docs-viewer.search_docs tool mentioned in debug. Do not run it; just explain whether mentioning a tool name should execute it.",
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

  it("allows terminal direct answers after compliant contextual tool suppression", () => {
    const promptText =
      "Earlier I saw docs-viewer.search_docs in debug. Do not run it; just explain whether mentioning a tool name should execute it.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });
    const plan = buildCapabilityPlan({
      turnId,
      promptText,
      sourceTargetIntent,
      toolCallAdmissionDecision: admission,
      canonicalGoalFrame: canonicalGoal,
    });
    const payload = {
      active_prompt: promptText,
      selected_final_answer: "Mentioning a tool name should not execute it unless the prompt is an affirmative operator command.",
      final_answer_source: "model_synthesis",
      terminal_artifact_kind: "direct_answer_text",
      canonical_goal_frame: canonicalGoal,
      source_target_intent: sourceTargetIntent,
      tool_call_admission_decision: admission,
      capability_plan: plan,
      route_authority_audit: {
        schema: "helix.route_authority_audit.v1",
        route_authority_ok: true,
      },
      poison_audit: {
        schema: "helix.turn_poison_audit.v1",
        ok: true,
        violations: [],
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: turnId,
        route: "conversation:simple",
        terminal_artifact_kind: "direct_answer_text",
        final_answer_source: "model_synthesis",
        server_authoritative: true,
      },
      loop_parity_trace: {
        schema: "helix.loop_parity_trace.v1",
        actual_tool_calls: [],
        unexpected_tool_calls: [],
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    };

    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText,
      selectedRoute: "conversation:simple",
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_synthesis",
      payload,
    });

    expect(trace.contextual_tool_audit.blocked_contextual_tool_executed).toBe(false);
    expect(trace.completed_solver_path).toBe(true);
    expect(trace.solver_risk_flags).not.toContain("terminal_authority_before_solver_completion");
  });

  it("does not convert satisfied suppressed contextual tool answers into route-authority typed failures", () => {
    const promptText =
      "Earlier I saw docs-viewer.search_docs in debug. Do not run it; just explain whether mentioning a tool name should execute it.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });
    const plan = buildCapabilityPlan({
      turnId,
      promptText,
      sourceTargetIntent,
      toolCallAdmissionDecision: admission,
      canonicalGoalFrame: canonicalGoal,
    });
    const payload = {
      active_prompt: promptText,
      selected_final_answer: "Mentioning a tool name should not execute it unless the prompt is an affirmative operator command.",
      final_answer_source: "model_synthesis",
      terminal_artifact_kind: "direct_answer_text",
      canonical_goal_frame: canonicalGoal,
      source_target_intent: sourceTargetIntent,
      tool_call_admission_decision: admission,
      capability_plan: plan,
      route_authority_audit: {
        schema: "helix.route_authority_audit.v1",
        route_authority_ok: false,
        violation_codes: ["poison_clean_but_authority_failed"],
        primary_violation_code: "poison_clean_but_authority_failed",
      },
      poison_audit: {
        schema: "helix.turn_poison_audit.v1",
        ok: true,
        violations: [],
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: turnId,
        route: "conversation:simple",
        terminal_artifact_kind: "direct_answer_text",
        final_answer_source: "model_synthesis",
        server_authoritative: true,
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        turn_id: turnId,
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        required_evidence: [
          {
            kind: "direct_answer_text",
            satisfied: true,
            evidence_ref: "direct_answer_text:test",
          },
        ],
        terminal_contract: {
          goal_kind: "model_only_concept",
          required_terminal_kinds: ["direct_answer_text"],
        },
        assistant_answer: false,
        raw_content_included: false,
      },
      loop_parity_trace: {
        schema: "helix.loop_parity_trace.v1",
        actual_tool_calls: [],
        unexpected_tool_calls: [],
        route_authority_ok: false,
        poison_audit_ok: true,
        terminal_authority_ok: true,
        short_circuit_risk_flags: ["poison_clean_but_authority_failed"],
      },
      current_turn_artifact_ledger: [],
    };

    payload.ask_turn_solver_trace = buildAskTurnSolverTrace({
      turnId,
      promptText,
      selectedRoute: "conversation:simple",
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_synthesis",
      payload,
    });

    expect(
      buildSolverContinuationObservation({
        turnId,
        payload,
        hardGateCode: "poison_clean_but_authority_failed",
        finalRoute: "conversation:simple",
        terminalKind: "direct_answer_text",
        artifactLedger: [],
      }),
    ).toBeNull();

    const hardGate = evaluateAskTurnSolverHardGate({
      turnId,
      payload,
      trace: payload.ask_turn_solver_trace,
      loopParityTrace: payload.loop_parity_trace,
    });

    expect(hardGate.failed).toBe(false);
    expect(hardGate.failure_codes).not.toContain("poison_clean_but_authority_failed");
    expect(payload.ask_turn_solver_trace.contextual_tool_audit).toMatchObject({
      contextual_tool_family_blocked: true,
      blocked_contextual_tool_executed: false,
    });
  });

  it("does not flag intentionally suppressed contextual references as dispatched without admission", () => {
    const promptText =
      "Earlier I saw docs-viewer.search_docs in debug. Do not run it; just explain whether mentioning a tool name should execute it.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });
    const plan = buildCapabilityPlan({
      turnId,
      promptText,
      sourceTargetIntent,
      toolCallAdmissionDecision: admission,
      canonicalGoalFrame: canonicalGoal,
    });
    const ledger = buildCapabilityLifecycleLedger({
      turnId,
      terminalArtifactKind: "direct_answer_text",
      payload: {
        terminal_artifact_kind: "direct_answer_text",
        canonical_goal_frame: canonicalGoal,
        capability_plan: plan,
        loop_parity_trace: {
          actual_tool_calls: [{ tool_id: "model.direct_answer", tool_name: "model.direct_answer" }],
        },
      },
    });

    expect(ledger.failure_codes).not.toContain("capability_dispatched_without_admission");
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

  it("suppresses quoted and negated calculator mentions before tool admission", () => {
    const prompts = [
      'Earlier I said "open calculator"; do not do that now. Explain why no tool should run.',
      "Do not open the calculator; just explain what the calculator is for.",
      "What tool would you use to open calculator? Explain without opening it.",
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
      expect(plan.capability_family).not.toBe("calculator");
      expect(plan.capability_family).not.toBe("workstation_action");
    }
  });

  it("scopes 'do not write files' to mutation while admitting research plus locator observations", () => {
    const promptText =
      "Do not write files. Use scholarly papers and citations to research microtubule coherence, then place it on the theory badge graph with scale bands and uncertainty mode.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, sourceTargetIntent, promptText });
    const itinerary = buildHelixCapabilityItinerary({
      turnId,
      promptText,
      sourceTargetIntent,
      toolCallAdmissionDecision: admission,
      availableCapabilities: availableCapabilities([
        HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        "helix_ask.reflect_theory_context",
      ]),
    });

    expect(sourceTargetIntent.target_source).toBe("scholarly_research");
    expect(sourceTargetIntent.allow_no_tool_direct).toBe(false);
    expect(admission).toMatchObject({
      source_target: "scholarly_research",
      required: true,
      admitted_tool_families: expect.arrayContaining(["scholarly_research", "theory_locator"]),
    });
    expect(admission.tool_admission_suppressed).toBeUndefined();
    expect(admission.forbidden_tool_families ?? []).toEqual(
      expect.arrayContaining(["workstation_action", "notes"]),
    );
    expect(admission.forbidden_tool_families ?? []).not.toEqual(
      expect.arrayContaining(["scholarly_research"]),
    );
    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.relevant_tool_families).toEqual(["scholarly_research", "theory_locator"]);
    expect(itinerary.terminal_success_criteria.required_observation_families).toEqual([
      "scholarly_research",
      "theory_locator",
    ]);
  });

  it("does not suppress read-only theory locator when file writes are negated", () => {
    const promptText =
      "Do not write files. Place this claim on the theory badge graph with scale bands and uncertainty mode.";
    const admission = buildToolCallAdmissionDecision({
      turnId,
      promptText,
      sourceTargetIntent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: threadId,
        target_source: "workstation_panel",
        target_kind: "workstation_panel",
        strength: "hard",
        explicit_cues: ["theory_context_reflection"],
        reasons: ["workstation_tool_plan:theory_context_reflection"],
        requested_outputs: ["helix_theory_context_reflection_tool_receipt", "workstation_tool_evaluation"],
        suppressed_routes: ["no_tool_direct", "model_only_concept", "panel_generated_answer"],
        precedence_reason: "theory_context_reflection_tool_plan",
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
        confidence: 0.9,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    expect(admission).toMatchObject({
      source_target: "workstation_panel",
      required: true,
      admitted_tool_families: ["theory_locator"],
      reason: "theory_locator_requires_readonly_locator_path",
    });
    expect(admission.tool_admission_suppressed).toBeUndefined();
    expect(admission.forbidden_tool_families ?? []).toEqual(
      expect.arrayContaining(["workstation_action", "notes"]),
    );
    expect(admission.forbidden_tool_families ?? []).not.toEqual(
      expect.arrayContaining(["theory_locator"]),
    );
  });
});
