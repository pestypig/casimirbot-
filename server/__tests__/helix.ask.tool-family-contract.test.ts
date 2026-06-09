import { describe, expect, it } from "vitest";

import {
  TOOL_FAMILY_DEFAULT_CONTRACTS,
  resolveToolFamilyContract,
  type ToolFamily,
} from "../services/helix-ask/tool-family-contract";
import { evaluateToolFamilyTerminalPolicy } from "../services/helix-ask/tool-family-terminal-policy";

const routeContract = (allowed: string[], forbidden: string[] = []) => ({
  schema: "helix.route_product_contract.v1",
  turn_id: "ask:tool-family",
  thread_id: "thread:tool-family",
  source_target: "workstation_panel",
  allowed_terminal_artifact_kinds: allowed,
  forbidden_terminal_artifact_kinds: forbidden,
  required_artifact_refs: [],
  precedence_reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

describe("Helix Ask tool-family contract registry", () => {
  it("has a concrete default contract for every shared tool family", () => {
    const families: ToolFamily[] = [
      "calculator",
      "internet_search",
      "repo_code",
      "docs_viewer",
      "workstation",
      "live_source_mail",
      "live_source_decision",
      "voice_delivery",
      "civilization_bounds",
    ];

    for (const family of families) {
      expect(TOOL_FAMILY_DEFAULT_CONTRACTS[family]).toMatchObject({
        toolFamily: family,
        defaultAssistantAnswer: false,
        defaultTerminalEligible: false,
        defaultRawContentIncluded: false,
      });
    }
  });

  it("registers the required named tools and civilization receipts", () => {
    const required = [
      ["live_env.read_processed_live_source_mail", "live_source_mail", "evidence_only"],
      ["live_env.process_live_source_mail", "live_source_mail", "evidence_only"],
      ["live_env.record_live_source_mail_decision", "live_source_decision", "control_receipt"],
      ["live_env.request_interim_voice_callout", "voice_delivery", "control_receipt"],
      ["scientific-calculator.solve_expression", "calculator", "evidence_only"],
      ["repo-code.search_concept", "repo_code", "evidence_only"],
      ["docs-viewer.open", "docs_viewer", "control_receipt"],
      ["docs-viewer.locate_in_doc", "docs_viewer", "evidence_only"],
      ["workstation-notes.append_to_note", "workstation", "control_receipt"],
      ["internet_search.web_research", "internet_search", "evidence_only"],
      ["helix_ask.build_civilization_scenario_frame", "civilization_bounds", "evidence_only"],
      ["helix_ask.reflect_civilization_bounds", "civilization_bounds", "evidence_only"],
      ["helix_civilization_bounds_tool_result", "civilization_bounds", "evidence_only"],
    ];

    for (const [toolName, toolFamily, authority] of required) {
      expect(resolveToolFamilyContract({ toolName })).toMatchObject({
        toolFamily,
        authority,
        defaultAssistantAnswer: false,
        defaultTerminalEligible: false,
        defaultRawContentIncluded: false,
      });
    }
  });

  it("blocks evidence-only tool receipts from becoming terminal answers", () => {
    const decision = evaluateToolFamilyTerminalPolicy({
      toolName: "scientific-calculator.solve_expression",
      toolFamily: "calculator",
      terminalArtifactKind: "calculator_receipt",
      routeProductContract: routeContract(["calculator_receipt", "model_synthesized_answer"]),
      canonicalGoalFrame: {
        goal_kind: "calculator_solve",
        required_terminal_kind: "calculator_receipt",
      },
      admitted: true,
      goalSatisfied: true,
      operatorCommandPresent: true,
      mutating: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("evidence_only_tool_cannot_terminalize_receipt");
    expect(decision.assistant_answer).toBe(false);
    expect(decision.terminal_eligible).toBe(false);
  });

  it("allows admitted control receipts only when route and goal contract match", () => {
    const allowed = evaluateToolFamilyTerminalPolicy({
      toolName: "click_or_activate_control",
      toolFamily: "workstation_action",
      terminalArtifactKind: "workspace_action_receipt",
      routeProductContract: routeContract(["workspace_action_receipt", "typed_failure"]),
      canonicalGoalFrame: {
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      admitted: true,
      goalSatisfied: true,
      operatorCommandPresent: true,
      mutating: true,
    });

    const blockedByRoute = evaluateToolFamilyTerminalPolicy({
      toolName: "click_or_activate_control",
      toolFamily: "workstation_action",
      terminalArtifactKind: "workspace_action_receipt",
      routeProductContract: routeContract(["model_synthesized_answer"], ["workspace_action_receipt"]),
      canonicalGoalFrame: {
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      admitted: true,
      goalSatisfied: true,
      operatorCommandPresent: true,
      mutating: true,
    });

    const blockedByGoal = evaluateToolFamilyTerminalPolicy({
      toolName: "docs-viewer.open",
      toolFamily: "docs_viewer",
      terminalArtifactKind: "doc_open_receipt",
      routeProductContract: routeContract(["doc_open_receipt", "doc_summary"]),
      canonicalGoalFrame: {
        goal_kind: "doc_summary",
        required_terminal_kind: "doc_summary",
      },
      admitted: true,
      goalSatisfied: true,
      operatorCommandPresent: true,
      mutating: true,
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.reason).toBe("terminal_kind_allowed_by_control_receipt_contract");
    expect(blockedByRoute).toMatchObject({
      allowed: false,
      reason: "terminal_kind_forbidden_by_route_product_contract",
    });
    expect(blockedByGoal).toMatchObject({
      allowed: false,
      reason: "control_receipt_requires_matching_goal_terminal",
    });
  });

  it("requires an operator command before a mutating control receipt can terminalize", () => {
    const decision = evaluateToolFamilyTerminalPolicy({
      toolName: "workstation-notes.append_to_note",
      terminalArtifactKind: "workspace_action_receipt",
      routeProductContract: routeContract(["workspace_action_receipt"]),
      canonicalGoalFrame: {
        goal_kind: "note_mutation",
        required_terminal_kind: "workspace_action_receipt",
      },
      admitted: true,
      goalSatisfied: true,
      operatorCommandPresent: false,
      mutating: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("mutating_control_receipt_requires_operator_command");
  });
});
