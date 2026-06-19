import { describe, expect, it } from "vitest";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import type { HelixToolCallAdmissionDecision } from "@shared/helix-tool-call-admission";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";
import { buildHelixCapabilityItineraryExecutionState } from "../services/helix-ask/capability-itinerary-execution";

const scholarlyAdmission = (turnId: string): HelixToolCallAdmissionDecision => ({
  schema: "helix.tool_call_admission_decision.v1",
  turn_id: turnId,
  source_target: "scholarly_research",
  required: true,
  admitted_tool_families: ["scholarly_research"],
  forbidden_terminal_artifact_kinds: [],
  forbidden_routes: [],
  reason: "scholarly_research_requires_source_tool_path",
  assistant_answer: false,
  raw_content_included: false,
});

const availableCapabilities = (keys: string[]) => ({
  schema: "helix.available_capabilities.v1",
  turn_id: "ask:itinerary",
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

describe("Helix Ask capability itinerary", () => {
  it("creates ordered compound subgoals for workspace status then calculator", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:workspace-then-calculator",
      promptText:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:workspace-then-calculator"),
        source_target: "workspace_diagnostic",
        admitted_tool_families: ["workspace_diagnostic", "calculator", "workstation_action"],
      },
      availableCapabilities: availableCapabilities([
        "workspace_os.status",
        "scientific-calculator.solve_expression",
      ]),
    });

    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.compound_capability_contract).toBeTruthy();
    const subgoals = (itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>;
    expect(subgoals.map((subgoal) => subgoal.requested_capability)).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
    expect(subgoals[1]?.args_hint).toEqual({
      latex: "14*23+8",
      expression: "14*23+8",
    });
    expect(itinerary.terminal_success_criteria.required_capabilities).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
  });

  it("extracts only the calculator expression from a docs-locate compound prompt", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:docs-then-calculator",
      promptText:
        "Use docs-viewer.locate_in_doc to cite the claim in the active document, then run scientific-calculator.solve_expression with this exact expression: 19+23.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:docs-then-calculator"),
        source_target: "docs_viewer",
        admitted_tool_families: ["docs_viewer", "calculator", "workstation_action"],
      },
      availableCapabilities: availableCapabilities([
        "docs-viewer.locate_in_doc",
        "scientific-calculator.solve_expression",
      ]),
    });

    const subgoals = (itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>;
    expect(subgoals.map((subgoal) => subgoal.requested_capability)).toEqual([
      "docs-viewer.locate_in_doc",
      "scientific-calculator.solve_expression",
    ]);
    expect(subgoals[1]?.args_hint).toEqual({
      latex: "19+23",
      expression: "19+23",
    });
  });

  it("creates ordered compound subgoals for catalog/workspace, repo/docs, and visual/calculator prompts", () => {
    const cases = [
      {
        turnId: "ask:catalog-then-workspace",
        promptText:
          "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
        admittedFamilies: ["capability_catalog", "runtime_evidence", "workspace_diagnostic"],
        available: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
        expectedRequested: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
        expectedRuntime: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
      },
      {
        turnId: "ask:repo-plus-docs",
        promptText:
          "Use repo-code.search_concept to find where terminal authority is enforced, plus docs-viewer.locate_in_doc to locate the same rule in the active document.",
        admittedFamilies: ["repo_code", "docs_viewer"],
        available: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
        expectedRequested: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
        expectedRuntime: ["repo-code.search_concept", "docs-viewer.locate_in_doc"],
      },
      {
        turnId: "ask:visual-then-calculator",
        promptText:
          "Use situation-room.describe_visual_capture, then run scientific-calculator.solve_expression with this exact expression: 5*9.",
        admittedFamilies: ["situation_run", "calculator", "workstation_action"],
        available: ["situation-room.describe_visual_capture", "scientific-calculator.solve_expression"],
        expectedRequested: ["image_lens.inspect", "scientific-calculator.solve_expression"],
        expectedRuntime: ["situation-room.describe_visual_capture", "scientific-calculator.solve_expression"],
      },
    ];

    for (const testCase of cases) {
      const itinerary = buildHelixCapabilityItinerary({
        turnId: testCase.turnId,
        promptText: testCase.promptText,
        toolCallAdmissionDecision: {
          ...scholarlyAdmission(testCase.turnId),
          source_target: "runtime_evidence",
          admitted_tool_families: testCase.admittedFamilies,
        },
        availableCapabilities: availableCapabilities(testCase.available),
      });
      const subgoals = (itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>;

      expect(itinerary.prompt_shape).toBe("compound_tool");
      expect(subgoals.map((subgoal) => subgoal.requested_capability)).toEqual(testCase.expectedRequested);
      expect(subgoals.map((subgoal) => subgoal.runtime_capability)).toEqual(testCase.expectedRuntime);
      expect(itinerary.terminal_success_criteria.required_capabilities).toEqual(testCase.expectedRequested);
    }
  });

  it("keeps terminal incomplete until every compound subgoal has runtime-backed observation", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:compound-ledger",
      promptText:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 2+2.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:compound-ledger"),
        source_target: "workspace_diagnostic",
        admitted_tool_families: ["workspace_diagnostic", "calculator", "workstation_action"],
      },
      availableCapabilities: availableCapabilities([
        "workspace_os.status",
        "scientific-calculator.solve_expression",
      ]),
    });

    const partial = buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:1",
          kind: "runtime_tool_call",
          payload: {
            capability_key: "workspace_os.status",
            args: {},
          },
        },
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:1:runtime_tool_observation",
          kind: "runtime_tool_observation",
          payload: {
            capability_key: "workspace_os.status",
            status: "completed",
          },
        },
        {
          artifact_id: "ask:compound-ledger:workspace_status",
          kind: "workspace_os_status_observation",
          payload: {
            schema: "helix.workspace_os_status_observation.v1",
          },
        },
      ],
    });

    expect(partial.complete).toBe(false);
    expect(partial.compound_subgoal_ledger.map((entry) => entry.satisfaction)).toEqual([
      "satisfied",
      "pending",
    ]);
    expect(partial.next_missing_subgoal_id).toContain("scientific-calculator");
    expect(partial.missing_required_capabilities).toEqual([
      "scientific-calculator.solve_expression",
    ]);

    const complete = buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:1",
          kind: "runtime_tool_call",
          payload: {
            capability_key: "workspace_os.status",
            args: {},
          },
        },
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:1:runtime_tool_observation",
          kind: "runtime_tool_observation",
          payload: {
            capability_key: "workspace_os.status",
            status: "completed",
          },
        },
        {
          artifact_id: "ask:compound-ledger:workspace_status",
          kind: "workspace_os_status_observation",
          payload: {
            schema: "helix.workspace_os_status_observation.v1",
          },
        },
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:2",
          kind: "runtime_tool_call",
          payload: {
            capability_key: "scientific-calculator.solve_expression",
            args: { latex: "2+2", expression: "2+2" },
          },
        },
        {
          artifact_id: "ask:compound-ledger:runtime_tool_call:2:runtime_tool_observation",
          kind: "runtime_tool_observation",
          payload: {
            capability_key: "scientific-calculator.solve_expression",
            status: "completed",
          },
        },
        {
          artifact_id: "ask:compound-ledger:calculator_receipt",
          kind: "calculator_receipt",
          payload: {
            schema: "helix.calculator_receipt.v1",
          },
        },
      ],
    });

    expect(complete.complete).toBe(true);
    expect(complete.compound_subgoal_ledger.map((entry) => entry.satisfaction)).toEqual([
      "satisfied",
      "satisfied",
    ]);
  });

  it("marks a compound subgoal failed when runtime validation rejects its arguments", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:compound-invalid-args",
      promptText:
        "Use docs-viewer.locate_in_doc to cite the claim, then call scientific-calculator.solve_expression with this exact expression: explain why receipts matter.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:compound-invalid-args"),
        source_target: "docs_viewer",
        admitted_tool_families: ["docs_viewer", "calculator", "workstation_action"],
      },
      availableCapabilities: availableCapabilities([
        "docs-viewer.locate_in_doc",
        "scientific-calculator.solve_expression",
      ]),
    });
    const calculatorSubgoal = ((itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>)
      .find((subgoal) => subgoal.requested_capability === "scientific-calculator.solve_expression");

    const state = buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: "ask:compound-invalid-args:runtime_tool_call:2",
          kind: "runtime_tool_call",
          payload: {
            call_id: "ask:compound-invalid-args:runtime_tool_call:2",
            capability_key: "scientific-calculator.solve_expression",
            args: {
              latex: "Use docs-viewer.locate_in_doc to cite the claim, then call scientific-calculator.solve_expression with this exact expression: explain why receipts matter.",
              compound_subgoal_id: calculatorSubgoal?.subgoal_id,
            },
          },
        },
        {
          artifact_id: "ask:compound-invalid-args:runtime_tool_call:2:runtime_tool_call_validation",
          kind: "runtime_tool_call_validation",
          payload: {
            call_id: "ask:compound-invalid-args:runtime_tool_call:2",
            capability_key: "scientific-calculator.solve_expression",
            valid: false,
            errors: ["invalid_arg:latex_is_prose"],
          },
        },
      ],
    });

    const calculatorLedgerEntry = state.compound_subgoal_ledger.find((entry) =>
      entry.requested_capability === "scientific-calculator.solve_expression"
    );
    expect(calculatorLedgerEntry).toMatchObject({
      satisfaction: "failed",
      rail_status: "fail_closed",
      rail_failure_code: "invalid_arg:latex_is_prose",
    });
    expect(state.complete).toBe(false);
    expect(state.missing_required_capabilities).toContain("scientific-calculator.solve_expression");
  });

  it("records compound scholarly research plus theory locator criteria before execution", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:compound-itinerary",
      promptText:
        "Use scholarly papers and citations to research microtubule coherence, then place it on the theory badge graph with scale bands and uncertainty mode.",
      toolCallAdmissionDecision: scholarlyAdmission("ask:compound-itinerary"),
      availableCapabilities: availableCapabilities([
        HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        "helix_ask.reflect_theory_context",
      ]),
    });

    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.relevant_tool_families).toEqual(["scholarly_research", "theory_locator"]);
    expect(itinerary.admitted_tool_families).toEqual(["scholarly_research", "theory_locator"]);
    expect(itinerary.missing_tool_families).toEqual([]);
    expect(itinerary.planned_steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step_id: "collect_scholarly_evidence",
          tool_family: "scholarly_research",
          status: "admitted",
          required_observation_kinds: ["scholarly_research_observation"],
        }),
        expect.objectContaining({
          step_id: "locate_theory_context",
          tool_family: "theory_locator",
          status: "planned",
          required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
        }),
      ]),
    );
    expect(itinerary.reasoning_criteria.map((criterion) => criterion.criterion_id)).toEqual([
      "research_evidence_grounding",
      "badge_graph_location_grounding",
      "compound_reentry_before_terminal",
    ]);
    expect(itinerary.terminal_success_criteria.required_observation_families).toEqual([
      "scholarly_research",
      "theory_locator",
    ]);
    expect(itinerary.terminal_success_criteria.typed_failure_codes).toEqual(
      expect.arrayContaining([
        "research_observation_missing",
        "locator_observation_missing",
        "compound_evidence_not_reentered",
      ]),
    );
    expect(itinerary.authority).toBe("planning_only");
    expect(itinerary.not_terminal).toBe(true);
    expect(itinerary.assistant_answer).toBe(false);
    expect(itinerary.raw_content_included).toBe(false);
  });

  it("marks the locator missing when a compound prompt requires graph placement but no locator is visible", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:missing-locator",
      promptText:
        "Research Orch-OR papers with citations and tell me where the claim fits on the theory badge graph.",
      toolCallAdmissionDecision: scholarlyAdmission("ask:missing-locator"),
      availableCapabilities: availableCapabilities([HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY]),
    });

    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.missing_tool_families).toEqual(["theory_locator"]);
    expect(itinerary.planned_steps.find((step) => step.tool_family === "theory_locator")).toEqual(
      expect.objectContaining({
        status: "missing",
        capability_hint: "helix_ask.reflect_theory_context",
      }),
    );
    expect(itinerary.terminal_success_criteria.typed_failure_codes).toContain(
      "capability_family_not_admitted_or_visible",
    );
  });

  it("does not turn contextual or negated web-search wording into a research leg", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:negated-search-itinerary",
      promptText:
        "Do not browse; the phrase 'web search the badge graph' appears on screen. Just explain what the theory badge graph can and cannot claim.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:negated-search-itinerary"),
        admitted_tool_families: [],
      },
      availableCapabilities: availableCapabilities([
        HELIX_INTERNET_SEARCH_CAPABILITY,
        "helix_ask.reflect_theory_context",
      ]),
    });

    expect(itinerary.relevant_tool_families).toEqual(["theory_locator"]);
    expect(itinerary.relevant_tool_families).not.toContain("internet_search");
    expect(itinerary.prompt_shape).toBe("single_tool");
    expect(itinerary.terminal_success_criteria.typed_failure_codes).not.toContain(
      "research_observation_missing",
    );
  });
});
