import { describe, expect, it } from "vitest";

import {
  buildCapabilityBindingMismatchObservation,
  evaluateTerminalBoundaryEligibility,
  goalSatisfactionAllowsTerminal,
  hasAgentRuntimeLoopDecisionChain,
  hasDirectAnswerDraft,
  hasPostObservationModelDecision,
  hasRuntimeToolCallForSelectedCapability,
  hasSelectedCapabilityObservation,
  isSourceCapabilityDiagnosticTurn,
} from "../services/helix-ask/runtime-authority-contract";
import { buildPostToolAuthorityBridge } from "../services/helix-ask/post-tool-authority-bridge";
import { buildRouteProductContract } from "../services/helix-ask/route-product-contract";
import { resolveToolFamilyContract } from "../services/helix-ask/tool-family-contract";

describe("helix ask runtime authority contract", () => {
  it("retains capability-catalog observation authority after the model selects the answer step", () => {
    const payload = {
      canonical_goal_frame: {
        goal_kind: "capability_help",
        required_terminal_kind: "capability_help_summary",
      },
      route_product_contract: {
        allowed_terminal_artifact_kinds: ["capability_help_summary", "typed_failure"],
      },
      terminal_artifact_kind: "capability_help_summary",
      final_answer_source: "capability_help_summary",
      capability_plan: {
        selected_capability: "helix_ask.inspect_capability_catalog",
      },
      tool_turn_chain_audit: {
        selected_capability: "helix_ask.inspect_capability_catalog",
        executed_capability: "helix_ask.inspect_capability_catalog",
      },
      agent_step_decision: {
        chosen_capability: "model.direct_answer",
        next_step: "answer",
        decision_timing: "post_observation",
        decision_authority: "llm",
      },
      agent_runtime_loop: {
        executed_tool_call_count: 0,
        iterations: [{
          chosen_capability: "model.direct_answer",
          next_step: "answer",
          decision_timing: "post_observation",
          decision_authority: "llm",
          observation_role: "model_answer_draft",
        }],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "ask:test:capability_registry",
          kind: "capability_registry",
          payload: { schema: "helix.capability_registry.v1" },
        },
        {
          artifact_id: "ask:test:capability_help_summary",
          kind: "capability_help_summary",
          payload: {
            schema: "helix.capability_help_summary.v1",
            text: "Capability help is grounded in the current runtime catalog.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);
    expect(evaluateTerminalBoundaryEligibility(payload)).toMatchObject({
      eligible: true,
      severity: "pass",
      checks: {
        selected_capability_observation: true,
        post_observation_model_decision: true,
        goal_satisfaction_allows_terminal: true,
      },
      blocking_reasons: [],
    });
  });

  it("requires model-only direct answers to include a model answer step and answer draft", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "agent_step_decision_missing",
        "direct_answer_text_missing",
        "post_observation_model_decision_missing",
      ]),
    );
  });

  it("allows model-only direct answers from a terminal-review model decision and answer artifact without a tool loop", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "model_only_concept",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        decision_timing: "terminal_review",
        sampling: { mode: "llm" },
        model_decision: {
          next_step: "answer",
          chosen_capability: "model.direct_answer",
        },
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "Electrons are negatively charged and much lighter than protons.",
          },
        },
      ],
    };

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("allows model-only direct answers after the loop records a model answer draft", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "model_only_concept",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-answer",
            decision_authority: "llm",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: ["direct-answer-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "An electron is a negatively charged elementary particle.",
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(false);
    expect(hasAgentRuntimeLoopDecisionChain(payload)).toBe(true);
    expect(hasDirectAnswerDraft(payload)).toBe(true);
    expect(hasPostObservationModelDecision(payload)).toBe(true);
    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.severity).toBe("pass");
    expect(report.blocking_reasons).toEqual([]);
  });

  it("allows capability help terminal satisfaction from registry-backed summary artifacts", () => {
    const payload = {
      canonical_goal_frame: {
        goal_kind: "capability_help",
        required_terminal_kind: "capability_help_summary",
      },
      terminal_artifact_kind: "capability_help_summary",
      final_answer_source: "capability_help_summary",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "capability_help",
        satisfaction: "pending",
        next_decision: "continue",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "obs:capability-registry",
          kind: "capability_registry",
          payload: {
            kind: "capability_registry",
          },
        },
        {
          artifact_id: "obs:capability-help-summary",
          kind: "capability_help_summary",
          payload: {
            kind: "capability_help_summary",
            text: "The runtime capability catalog is available.",
          },
        },
      ],
    };

    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);
  });

  it("blocks source/capability terminals that skip the runtime loop", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "docs_panel_open" },
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "docs_panel_open",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.severity).toBe("p0");
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "agent_runtime_loop_missing",
        "agent_step_decision_missing",
        "selected_capability_observation_missing",
        "post_observation_model_decision_missing",
      ]),
    );
  });

  it("allows source/capability terminals after model decision, observation, post-observation review, and goal satisfaction", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "docs_panel_open" },
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "docs_panel_open",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-1",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            tool_observation: {
              status: "completed",
              artifact_refs: ["receipt-1"],
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "receipt-1",
          kind: "workspace_action_receipt",
          payload: {
            kind: "workspace_action_receipt",
            panel_id: "docs-viewer",
            action_id: "open",
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasAgentRuntimeLoopDecisionChain(payload)).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);
    expect(hasPostObservationModelDecision(payload)).toBe(true);
    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.severity).toBe("pass");
    expect(report.blocking_reasons).toEqual([]);
  });

  it("treats doc_summary artifacts as docs capability observations", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "active_doc_summary", required_terminal_kind: "doc_summary" },
      terminal_artifact_kind: "doc_summary",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "active_doc_summary",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-doc-summary",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.summarize_doc",
            artifact_refs: ["doc-summary-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            path: "/docs/research/example.md",
            text: "This document summarizes the current status and caveats.",
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("treats MicroDeck preset query results as the selected live_env query observation", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-query",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.query_micro_reasoner_presets",
            executed_action_key: "live_env.query_micro_reasoner_presets",
            tool_observation: {
              schema: "helix.live_environment_tool_observation.v1",
              observation_id: "live_env_tool_observation:microdeck-query",
              tool_name: "live_env.query_micro_reasoner_presets",
              ok: true,
              summary: "Found 4 MicroDeck preset(s) and 13 prompt(s).",
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
                presets: [],
                prompts: [],
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
                context_role: "tool_evidence",
              },
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime-tool-call-microdeck-query",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            call_id: "runtime-call-microdeck-query",
            capability_key: "live_env.query_micro_reasoner_presets",
            args: {},
          },
        },
      ],
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasRuntimeToolCallForSelectedCapability(payload, "live_env.query_micro_reasoner_presets")).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.checks).toMatchObject({
      runtime_tool_call: true,
      microdeck_selected_capability: true,
      selected_capability_observation: true,
      post_observation_model_decision: true,
      goal_satisfaction_allows_terminal: true,
    });
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("treats MicroDeck preset drafts as the selected read-only setup observation", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-draft",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.draft_micro_reasoner_preset",
            executed_action_key: "live_env.draft_micro_reasoner_preset",
            tool_observation: {
              schema: "helix.live_environment_tool_observation.v1",
              observation_id: "live_env_tool_observation:microdeck-draft",
              tool_name: "live_env.draft_micro_reasoner_preset",
              ok: true,
              summary: "Drafted MicroDeck preset from Generic Live Source Deck.",
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_draft/v1",
                artifactId: "stage_play_micro_reasoner_prompt_preset_draft",
                draftId: "stage_play_micro_reasoner_prompt_preset_draft:test",
                confirmationRequired: true,
                createToolCall: {
                  toolName: "live_env.create_micro_reasoner_preset",
                  args: {},
                },
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
                context_role: "micro_reasoner_evidence",
              },
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime-tool-call-microdeck-draft",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            call_id: "runtime-call-microdeck-draft",
            capability_key: "live_env.draft_micro_reasoner_preset",
            args: {},
          },
        },
      ],
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "final_answer_draft",
      },
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasRuntimeToolCallForSelectedCapability(payload, "live_env.draft_micro_reasoner_preset")).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.checks).toMatchObject({
      runtime_tool_call: true,
      microdeck_selected_capability: true,
      selected_capability_observation: true,
      post_observation_model_decision: true,
      goal_satisfaction_allows_terminal: true,
    });
  });

  it("fails closed for MicroDeck draft summaries when the draft observation is missing", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-draft",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.draft_micro_reasoner_preset",
            executed_action_key: "live_env.draft_micro_reasoner_preset",
            observed_artifact_refs: [],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime-tool-call-microdeck-draft",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            call_id: "runtime-call-microdeck-draft",
            capability_key: "live_env.draft_micro_reasoner_preset",
            args: {},
          },
        },
      ],
    };

    expect(hasRuntimeToolCallForSelectedCapability(payload, "live_env.draft_micro_reasoner_preset")).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.checks.runtime_tool_call).toBe(true);
    expect(report.checks.microdeck_selected_capability).toBe(true);
    expect(report.checks.selected_capability_observation).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("blocks MicroDeck summaries when an observation appears without a runtime tool call", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-query",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.query_micro_reasoner_presets",
            tool_observation: {
              schema: "helix.live_environment_tool_observation.v1",
              observation_id: "live_env_tool_observation:microdeck-query",
              tool_name: "live_env.query_micro_reasoner_presets",
              ok: true,
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
              },
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
      current_turn_artifact_ledger: [],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);
    expect(hasRuntimeToolCallForSelectedCapability(payload, "live_env.query_micro_reasoner_presets")).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.checks.runtime_tool_call).toBe(false);
    expect(report.blocking_reasons).toContain("runtime_tool_call_missing");
  });

  it("fails closed for MicroDeck terminal summaries when the query observation is missing", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-query",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.query_micro_reasoner_presets",
            executed_action_key: "live_env.query_micro_reasoner_presets",
            observed_artifact_refs: [],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime-tool-call-microdeck-query",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            call_id: "runtime-call-microdeck-query",
            capability_key: "live_env.query_micro_reasoner_presets",
            args: {},
          },
        },
      ],
    };

    expect(hasRuntimeToolCallForSelectedCapability(payload, "live_env.query_micro_reasoner_presets")).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.checks.runtime_tool_call).toBe(true);
    expect(report.checks.microdeck_selected_capability).toBe(true);
    expect(report.checks.selected_capability_observation).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("blocks MicroDeck summaries until a post-observation answer decision exists", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-microdeck-query",
            decision_authority: "llm",
            decision_timing: "pre_observation",
            next_step: "next_action",
            chosen_capability: "live_env.query_micro_reasoner_presets",
            executed_action_key: "live_env.query_micro_reasoner_presets",
            tool_observation: {
              schema: "helix.live_environment_tool_observation.v1",
              observation_id: "live_env_tool_observation:microdeck-query",
              tool_name: "live_env.query_micro_reasoner_presets",
              ok: true,
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
              },
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime-tool-call-microdeck-query",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            call_id: "runtime-call-microdeck-query",
            capability_key: "live_env.query_micro_reasoner_presets",
            args: {},
          },
        },
      ],
    };

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.checks.runtime_tool_call).toBe(true);
    expect(report.checks.selected_capability_observation).toBe(true);
    expect(report.checks.post_observation_model_decision).toBe(false);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("post_observation_model_decision_missing");
  });

  it("contracts MicroDeck query prompts as observation-backed model summaries", () => {
    const contract = buildRouteProductContract({
      turnId: "turn-microdeck-contract",
      promptText: "Inspect the active MicroDeck prompts for the visual live source.",
      sourceTargetIntent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
    });
    const toolContract = resolveToolFamilyContract({
      toolName: "live_env.query_micro_reasoner_presets",
    });

    expect(contract).toMatchObject({
      schema: "helix.route_product_contract.v1",
      source_target: "live_source_mailbox",
      precedence_reason: "microdeck_query_requires_tool_observation_then_model_synthesis",
    });
    expect(contract.allowed_terminal_artifact_kinds).toContain("model_synthesized_answer");
    expect(contract.allowed_terminal_artifact_kinds).not.toContain("live_environment_tool_observation");
    expect(contract.allowed_terminal_artifact_kinds).not.toContain("direct_answer_text");
    expect(contract.side_artifact_kinds_allowed).toContain("stage_play_micro_reasoner_prompt_preset_query_result");
    expect(toolContract).toMatchObject({
      toolName: "live_env.query_micro_reasoner_presets",
      authority: "evidence_only",
      mutating: false,
      requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_query_result"],
      allowedTerminalKinds: ["model_synthesized_answer"],
      requiredReentry: true,
      requiresGoalSatisfaction: true,
    });
  });

  it("contracts MicroDeck draft prompts as observation-backed model summaries", () => {
    const contract = buildRouteProductContract({
      turnId: "turn-microdeck-draft-contract",
      promptText: "Draft a MicroDeck preset for a visual automation scenario using the closest base preset.",
      sourceTargetIntent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
    });
    const toolContract = resolveToolFamilyContract({
      toolName: "live_env.draft_micro_reasoner_preset",
    });

    expect(contract).toMatchObject({
      schema: "helix.route_product_contract.v1",
      source_target: "live_source_mailbox",
      precedence_reason: "microdeck_draft_requires_tool_observation_then_model_synthesis",
    });
    expect(contract.allowed_terminal_artifact_kinds).toContain("model_synthesized_answer");
    expect(contract.allowed_terminal_artifact_kinds).not.toContain("live_environment_tool_observation");
    expect(contract.side_artifact_kinds_allowed).toContain("stage_play_micro_reasoner_prompt_preset_draft");
    expect(toolContract).toMatchObject({
      toolName: "live_env.draft_micro_reasoner_preset",
      authority: "evidence_only",
      mutating: false,
      requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_draft"],
      allowedTerminalKinds: ["model_synthesized_answer"],
      requiredReentry: true,
      requiresGoalSatisfaction: true,
    });
  });

  it("does not let a MicroDeck preset query result satisfy a different live_env selected capability", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      source_target_intent: {
        target_source: "live_source_mailbox",
        target_kind: "live_source",
      },
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-mail-read",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "live_env.read_processed_live_source_mail",
            tool_observation: {
              schema: "helix.live_environment_tool_observation.v1",
              observation_id: "live_env_tool_observation:microdeck-query",
              tool_name: "live_env.query_micro_reasoner_presets",
              ok: true,
              summary: "Found 4 MicroDeck preset(s) and 13 prompt(s).",
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
                presets: [],
                prompts: [],
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
                context_role: "tool_evidence",
              },
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        ],
      },
      current_turn_artifact_ledger: [],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("accepts agent step loop capability observations recorded after the selected action step", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "doc_evidence_location", required_terminal_kind: "doc_location_result" },
      terminal_artifact_kind: "doc_location_matches",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "doc_evidence_location",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-answer",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "terminal_decision",
          },
        ],
      },
      final_answer_draft: {
        text: "Locations:\n- /docs/research/example.md:12 - Assumptions are listed here.",
      },
      agent_step_loop: {
        steps: [
          {
            step_id: "initial",
            decision_ref: "agent-step-locate",
            next_step: "next_action",
            chosen_capability: "docs-viewer.locate_in_doc",
            observation_refs: [],
            sampling_mode: "llm",
          },
          {
            step_id: "post_observation",
            decision_ref: "agent-step-answer",
            next_step: "answer",
            chosen_capability: null,
            observation_refs: ["doc-location-1"],
            sampling_mode: "llm",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-location-1",
          kind: "doc_location_matches",
          payload: {
            kind: "doc_location_matches",
            path: "/docs/research/example.md",
            matches: [{ path: "/docs/research/example.md", line_start: 12, line_end: 12, text: "Assumptions are listed here." }],
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("does not let an unrelated current-turn artifact satisfy the selected capability observation", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "calculator_solve", required_terminal_kind: "calculator_receipt" },
      terminal_artifact_kind: "calculator_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "calculator_solve",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-calculator",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "scientific-calculator.solve_expression",
            observed_artifact_refs: ["doc-summary-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            path: "/docs/research/example.md",
            text: "This is not a calculator receipt.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("does not let a completed tool observation satisfy the wrong selected capability by ref presence alone", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "calculator_solve", required_terminal_kind: "calculator_receipt" },
      terminal_artifact_kind: "calculator_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "calculator_solve",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-calculator",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "scientific-calculator.solve_expression",
            tool_observation: {
              status: "completed",
              artifact_refs: ["doc-summary-1"],
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            decision_ref: "agent-step-calculator",
            path: "/docs/research/example.md",
            text: "This artifact is linked to the decision but is still the wrong tool family.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("treats Dottie observer receipts as observations for selected Situation Room observer capabilities", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-dottie-attach",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.observer.attach",
            observed_artifact_refs: ["dottie-attach-1"],
          },
          {
            decision_id: "agent-step-dottie-voice",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.voice_delivery.propose_from_trace",
            observed_artifact_refs: ["dottie-voice-1"],
          },
          {
            decision_id: "agent-step-dottie-query",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            chosen_capability: "situation-room-pipelines.observer.query",
            observed_artifact_refs: ["dottie-query-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-dottie-attach",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
        {
          artifact_id: "dottie-voice-1",
          kind: "dottie_voice_receipt",
          decision_ref: "agent-step-dottie-voice",
          payload: {
            schema: "helix.dottie_voice_receipt.v1",
            panel_id: "situation-room-pipelines",
            action_id: "voice_delivery.propose_from_trace",
            source_event_id: "agent_commentary:orientation",
          },
        },
        {
          artifact_id: "dottie-query-1",
          kind: "dottie_observer_query_receipt",
          decision_ref: "agent-step-dottie-query",
          payload: {
            panel_id: "situation-room-pipelines",
            action_id: "observer.query",
            observer_count: 1,
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("does not let Dottie receipts satisfy a stale docs capability selection", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            observed_artifact_refs: ["dottie-attach-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-stale-docs",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("reconciles current-turn Dottie receipts for selected Dottie capability even when iteration refs are missing", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-dottie-attach",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.observer.attach",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          source_scope: "current_turn",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
        {
          artifact_id: "dottie-eval-1",
          kind: "workstation_tool_evaluation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.workstation_tool_evaluation.v1",
            tool_key: "situation-room-pipelines.observer.attach",
            supports_goal: true,
            summary: "Dottie observer attach/query/voice receipts completed.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("does not reconcile unlinked Dottie receipts for stale docs capability", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          source_scope: "current_turn",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it.each([
    ["docs-viewer.open_doc_by_path", "dottie_voice_receipt"],
    ["scientific-calculator.solve_with_steps", "dottie_observer_query_receipt"],
    ["situation-room-pipelines.open", "dottie_observer_subscription_receipt"],
  ])("does not let %s consume unrelated Dottie artifact %s", (chosenCapability, artifactKind) => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-tool",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: chosenCapability,
            observed_artifact_refs: ["dottie-artifact-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-artifact-1",
          kind: artifactKind,
          decision_ref: "agent-step-stale-tool",
          source_scope: "current_turn",
          payload: {
            schema: `helix.${artifactKind}.v1`,
            panel_id: "situation-room-pipelines",
            action_id: artifactKind === "dottie_voice_receipt" ? "voice_delivery.propose_from_trace" : "observer.query",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);
  });

  it("builds a repair observation when selected capability and observed artifact family diverge", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            observed_artifact_refs: ["dottie-attach-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-stale-docs",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
      ],
    };

    const observation = buildCapabilityBindingMismatchObservation(payload);

    expect(observation).toMatchObject({
      schema: "helix.capability_binding_mismatch_observation.v1",
      selected_capability: "docs-viewer.open",
      observed_artifact_refs: ["dottie-attach-1"],
      observed_artifact_kinds: ["dottie_observer_subscription_receipt"],
      suggested_capability: "situation-room-pipelines.observer.attach",
      suggested_repair: "rebind_selected_capability_to_observed_tool_plan",
    });
  });

  it("exposes model-direct selection as a mismatch when docs observations exist", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "doc_summary", required_terminal_kind: "doc_summary" },
      terminal_artifact_kind: "doc_summary",
      final_answer_source: "doc_summary",
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-model-direct",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "model.direct_answer",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          source_scope: "current_turn",
          payload: {
            schema: "helix.doc_summary.v1",
            path: "/docs/research/nhm2-current-status-whitepaper.md",
          },
        },
      ],
    };

    const observation = buildCapabilityBindingMismatchObservation(payload);

    expect(observation).toMatchObject({
      schema: "helix.capability_binding_mismatch_observation.v1",
      selected_capability: "model.direct_answer",
      observed_artifact_refs: ["doc-summary-1"],
      observed_artifact_kinds: ["doc_summary"],
      suggested_capability: "docs-viewer.summarize_doc",
      suggested_repair: "rebind_model_direct_answer_to_observed_tool_family",
    });
  });

  it("does not flag a clean model-direct answer draft as a tool binding mismatch", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept", required_terminal_kind: "direct_answer_text" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-model-direct",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            chosen_capability: "model.direct_answer",
            observed_artifact_refs: ["direct-answer-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          source_scope: "current_turn",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "An electron is a negatively charged elementary particle.",
          },
        },
      ],
    };

    expect(buildCapabilityBindingMismatchObservation(payload)).toBeNull();
  });

  it("matches Stage Play reflections to the Stage Play Ask capability without treating the graph as a post-tool answer", () => {
    const payload = {
      turn_id: "turn-stage-play-1",
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stage-play",
            decision_authority: "llm",
            decision_timing: "tool_selection",
            chosen_capability: "helix_ask.reflect_stage_play_context",
            observed_artifact_refs: ["stage-play-observation-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage-play-observation-1",
          kind: "live_environment_tool_observation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.live_environment_tool_observation.v1",
            tool_name: "live_env.reflect_stage_play_context",
            observation: {
              artifactId: "stage_play_badge_graph",
              schemaVersion: "stage_play_badge_graph/v1",
              badges: [],
              recommendedActions: [],
            },
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);
    expect(hasPostObservationModelDecision(payload)).toBe(false);

    const bridge = buildPostToolAuthorityBridge({ turnId: "turn-stage-play-1", payload });
    expect(bridge.tool_observation_refs).toEqual(["stage-play-observation-1"]);
    expect(bridge.answer_draft_refs).toEqual([]);
    expect(bridge.observation_support_status).toBe("not_enough_information");

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.checks.selected_capability_observation).toBe(true);
    expect(report.checks.post_observation_model_decision).toBe(false);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("post_observation_model_decision_missing");
  });

  it("allows Stage Play terminal answers only after observation re-entry and model review", () => {
    const payload = {
      turn_id: "turn-stage-play-reviewed",
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        decision_id: "agent-step-stage-play-terminal-review",
        decision_authority: "llm",
        decision_timing: "terminal_review",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
        model_decision: {
          next_step: "answer",
          chosen_capability: "model.direct_answer",
        },
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stage-play-tool",
            decision_authority: "llm",
            decision_timing: "tool_selection",
            chosen_capability: "helix_ask.reflect_stage_play_context",
            observed_artifact_refs: ["stage-play-observation-1"],
          },
          {
            decision_id: "agent-step-stage-play-answer",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: ["stage-play-observation-1", "final-answer-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage-play-observation-1",
          kind: "live_environment_tool_observation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.live_environment_tool_observation.v1",
            tool_name: "live_env.reflect_stage_play_context",
            observation: {
              schema: "stage_play_reflection_result/v1",
              graph: { artifactId: "stage_play_badge_graph", schemaVersion: "stage_play_badge_graph/v1" },
              outputLaneProjection: { artifactId: "stage_play_output_lane_projection" },
              liveAnswerProjection: {
                attempted: true,
                projected: true,
                changedLineKeys: ["risk", "possibilities", "unknowns", "next_check"],
                skippedLineKeys: [],
                reason: "projected",
              },
              assistant_answer: false,
              raw_content_included: false,
              context_role: "tool_evidence",
              ask_context_policy: "evidence_only",
            },
          },
        },
        {
          artifact_id: "final-answer-1",
          kind: "final_answer_draft",
          source_scope: "current_turn",
          payload: {
            schema: "helix.final_answer_draft.v1",
            text: "Stage Play reflected the source and projected Live Interpretation lanes; audio evidence is still missing.",
          },
        },
      ],
    };

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.checks.agent_runtime_loop).toBe(true);
    expect(report.checks.agent_step_decision).toBe(true);
    expect(report.checks.selected_capability_observation).toBe(true);
    expect(report.checks.post_observation_model_decision).toBe(true);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("blocks Stage Play graph or projection receipts from becoming final authority", () => {
    const payload = {
      turn_id: "turn-stage-play-receipt-terminal",
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "live_environment_tool_observation",
      final_answer_source: "live_environment_tool_observation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        decision_id: "agent-step-stage-play-terminal-review",
        decision_authority: "llm",
        decision_timing: "terminal_review",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stage-play-tool",
            decision_authority: "llm",
            decision_timing: "tool_selection",
            chosen_capability: "helix_ask.reflect_stage_play_context",
            observed_artifact_refs: ["stage-play-observation-1"],
          },
          {
            decision_id: "agent-step-stage-play-answer",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: ["stage-play-observation-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage-play-observation-1",
          kind: "live_environment_tool_observation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.live_environment_tool_observation.v1",
            tool_name: "live_env.reflect_stage_play_context",
            observation: {
              schema: "stage_play_reflection_result/v1",
              graph: { artifactId: "stage_play_badge_graph", schemaVersion: "stage_play_badge_graph/v1" },
              outputLaneProjection: { artifactId: "stage_play_output_lane_projection" },
              liveAnswerProjection: {
                attempted: true,
                projected: true,
                changedLineKeys: ["risk"],
                skippedLineKeys: [],
                reason: "projected",
              },
              assistant_answer: false,
              raw_content_included: false,
              context_role: "tool_evidence",
              ask_context_policy: "evidence_only",
            },
          },
        },
      ],
    };

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.checks.agent_runtime_loop).toBe(true);
    expect(report.checks.agent_step_decision).toBe(true);
    expect(report.checks.selected_capability_observation).toBe(true);
    expect(report.checks.post_observation_model_decision).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("stage_play_receipt_terminal_without_model_review");
  });

  it("blocks Stage Play checkpoint request receipts from becoming final authority", () => {
    const payload = {
      turn_id: "turn-stage-play-checkpoint-receipt-terminal",
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "live_environment_tool_observation",
      final_answer_source: "live_environment_tool_observation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "live_environment_review",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        decision_id: "agent-step-stage-play-checkpoint-terminal-review",
        decision_authority: "llm",
        decision_timing: "terminal_review",
        next_step: "answer",
        chosen_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stage-play-checkpoint-tool",
            decision_authority: "llm",
            decision_timing: "tool_selection",
            chosen_capability: "live_env.request_stage_play_checkpoint",
            observed_artifact_refs: ["stage-play-checkpoint-observation-1"],
          },
          {
            decision_id: "agent-step-stage-play-checkpoint-answer",
            decision_authority: "llm",
            decision_timing: "post_observation",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: ["stage-play-checkpoint-observation-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage-play-checkpoint-observation-1",
          kind: "live_environment_tool_observation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.live_environment_tool_observation.v1",
            tool_name: "live_env.request_stage_play_checkpoint",
            observation: {
              schema: "stage_play_checkpoint_request_result/v1",
              checkpointRequest: {
                artifactId: "stage_play_checkpoint_request",
                schemaVersion: "stage_play_checkpoint_request/v1",
                checkpointRequestId: "stage_play_checkpoint_request:test",
                jobId: "stage_play_job:test",
                graphId: "stage_play_badge_graph:test",
                status: "queued",
                assistant_answer: false,
                context_role: "tool_evidence",
              },
              queueState: {
                schema: "stage_play_checkpoint_queue/v1",
                requests: [],
                assistant_answer: false,
                context_role: "tool_evidence",
              },
              readyToRun: true,
              reason: "queued",
              assistant_answer: false,
              context_role: "tool_evidence",
            },
          },
        },
      ],
    };

    const bridge = buildPostToolAuthorityBridge({ turnId: "turn-stage-play-checkpoint-receipt-terminal", payload });
    expect(bridge.tool_observation_refs).toEqual(["stage-play-checkpoint-observation-1"]);
    expect(bridge.observation_support_status).toBe("not_enough_information");

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.checks.selected_capability_observation).toBe(true);
    expect(report.checks.post_observation_model_decision).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("stage_play_receipt_terminal_without_model_review");
  });

  it("suggests the Stage Play capability when a selected capability observes a Stage Play graph", () => {
    const observation = buildCapabilityBindingMismatchObservation({
      canonical_goal_frame: { goal_kind: "live_environment_review", required_terminal_kind: "model_synthesized_answer" },
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stage-play-mismatch",
            decision_authority: "llm",
            decision_timing: "tool_selection",
            chosen_capability: "helix_ask.reflect_ideology_context",
            observed_artifact_refs: ["stage-play-observation-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage-play-observation-1",
          kind: "live_environment_tool_observation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.live_environment_tool_observation.v1",
            tool_name: "live_env.reflect_stage_play_context",
            observation: {
              artifactId: "stage_play_badge_graph",
              schemaVersion: "stage_play_badge_graph/v1",
            },
          },
        },
      ],
    });

    expect(observation).toMatchObject({
      schema: "helix.capability_binding_mismatch_observation.v1",
      selected_capability: "helix_ask.reflect_ideology_context",
      observed_artifact_refs: ["stage-play-observation-1"],
      observed_artifact_kinds: ["live_environment_tool_observation"],
      suggested_capability: "helix_ask.reflect_stage_play_context",
      suggested_repair: "rebind_selected_capability_to_observed_tool_plan",
    });
  });

  it("allows clean typed failures for source/capability turns without minting a successful terminal", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "debug_diagnosis" },
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "debug_evidence_missing",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.checks.typed_failure_clean).toBe(true);
    expect(report.eligible).toBe(true);
  });

  it("allows live pipeline control receipts when route authority and disclosure keep them observation-only", () => {
    const payload = {
      canonical_goal_frame: {
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      source_target_intent: {
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        allow_no_tool_direct: false,
        allow_client_shortcut: false,
      },
      route_product_contract: {
        source_target: "live_pipeline",
        allowed_terminal_artifact_kinds: ["live_pipeline_receipt", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["situation_context_pack"],
      },
      terminal_artifact_selection_guard: {
        allowed: true,
        terminal_artifact_kind: "live_pipeline_receipt",
      },
      product_authority_guard: {
        allowed: true,
      },
      tool_call_admission_decision: {
        source_target: "live_pipeline",
        required: true,
        admitted_tool_families: ["live_pipeline"],
      },
      live_pipeline_turn_receipt: {
        schema: "helix.live_pipeline_turn_receipt.v1",
        actions: ["situation-room.pipeline.inspect", "situation-room.live-source.set_rate"],
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_trace_disclosure: {
        schema: "helix.ask_tool_trace_disclosure.v1",
        items: [
          {
            tool: "situation-room.live-source.set_rate",
            role: "state_mutation",
            authority: "mutation_receipt",
            summary: "Changed the live source cadence policy.",
          },
        ],
        assistant_answer: false,
        terminal_eligible: false,
      },
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "live_pipeline_receipt",
    };

    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("does not allow live pipeline receipts when the route contract forbids receipt terminals", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: {
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      source_target_intent: {
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        allow_no_tool_direct: false,
        allow_client_shortcut: false,
      },
      route_product_contract: {
        source_target: "live_pipeline",
        allowed_terminal_artifact_kinds: ["typed_failure"],
        forbidden_terminal_artifact_kinds: ["live_pipeline_receipt"],
      },
      terminal_artifact_selection_guard: {
        allowed: false,
        terminal_artifact_kind: "live_pipeline_receipt",
      },
      tool_call_admission_decision: {
        source_target: "live_pipeline",
        required: true,
        admitted_tool_families: ["live_pipeline"],
      },
      live_pipeline_turn_receipt: {
        schema: "helix.live_pipeline_turn_receipt.v1",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_trace_disclosure: {
        schema: "helix.ask_tool_trace_disclosure.v1",
        items: [{ tool: "situation-room.pipeline.inspect" }],
        assistant_answer: false,
        terminal_eligible: false,
      },
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "live_pipeline_receipt",
    });

    expect(report.requires_runtime_loop).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "goal_satisfaction_not_terminal",
        "agent_runtime_loop_missing",
        "selected_capability_observation_missing",
      ]),
    );
  });

  it("accepts a materialized compound provider product backed by the authorized Codex bridge", () => {
    const turnId = "turn-provider-compound-authority";
    const report = evaluateTerminalBoundaryEligibility({
      turn_id: turnId,
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      route_product_contract: {
        required_terminal_artifact_kind: "compound_evidence_synthesis_answer",
        allowed_terminal_artifact_kinds: [
          "compound_evidence_synthesis_answer",
          "workstation_tool_evaluation",
          "typed_failure",
        ],
      },
      terminal_artifact_kind: "compound_evidence_synthesis_answer",
      final_answer_source: "compound_evidence_synthesis_answer",
      selected_final_answer: "Theory reflection and calculator result.",
      provider_terminal_authority_bridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        turn_id: turnId,
        solver_completed: true,
        goal_satisfaction_compatible: true,
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        normalized_observations_ready: true,
        all_observations_succeeded: true,
        successful_gateway_observation_refs: [
          `${turnId}:calculator-observation`,
          `${turnId}:theory-observation`,
        ],
        successful_capability_lane_observation_refs: [`${turnId}:theory-observation`],
      },
      provider_route_product_materialization: {
        schema: "helix.provider_route_product_materialization.v1",
        turn_id: turnId,
        status: "materialized",
        materialized_terminal_artifact_kind: "compound_evidence_synthesis_answer",
        materialized_terminal_artifact_ref: `${turnId}:compound-answer`,
      },
      provider_route_product_quality_gate: {
        schema: "helix.final_answer_draft_quality_gate.v1",
        turn_id: turnId,
        ok: true,
        violations: [],
      },
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.checks).toMatchObject({
      agent_runtime_loop: true,
      agent_step_decision: true,
      selected_capability_observation: true,
      post_observation_model_decision: true,
      goal_satisfaction_allows_terminal: true,
    });
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("blocks typed failures that do not carry a failure code", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "visual_capture_describe" },
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.severity).toBe("p1");
    expect(report.blocking_reasons).toContain("goal_satisfaction_not_terminal");
    expect(report.blocking_reasons).toContain("typed_failure_missing_code");
  });
});
