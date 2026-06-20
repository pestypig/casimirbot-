import { describe, expect, it } from "vitest";
import { resolveCompoundCapabilitySynthesisReadiness } from "../services/helix-ask/compound-capability-synthesis";
import { buildHelixCompoundCapabilityContract } from "../services/helix-ask/compound-capability-contract";
import { resolveAskCapabilityContractArbitration } from "../services/helix-ask/capability-contract-arbitration";

describe("compound capability synthesis readiness", () => {
  it("requires synthesis when all compound subgoals are satisfied but no final draft exists", () => {
    const turnId = "ask:test:compound-synthesis";
    const docsSubgoalId = `${turnId}:compound_capability_subgoal:1:docs-viewer_locate_in_doc`;
    const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
          compound_subgoal_ledger: [
            {
              subgoal_id: docsSubgoalId,
              requested_capability: "docs-viewer.locate_in_doc",
              executed_capability: "docs-viewer.locate_in_doc",
              observation_kind: "doc_location_matches",
              observation_ref: "obs:doc-location",
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              subgoal_id: calculatorSubgoalId,
              requested_capability: "scientific-calculator.solve_expression",
              executed_capability: "scientific-calculator.solve_expression",
              observation_kind: "calculator_receipt",
              observation_ref: "obs:calculator",
              satisfaction: "satisfied",
              rail_status: "complete",
            },
          ],
        },
      },
      artifacts: [],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      synthesis_required: true,
      has_docs_subgoal: true,
      goal_kind: "doc_evidence_synthesis",
      required_terminal_kind: "doc_evidence_synthesis_answer",
    });
    expect(readiness.support_refs).toEqual(["obs:doc-location", "obs:calculator"]);
  });

  it("does not require synthesis for failed compound subgoals", () => {
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: false,
          compound_subgoal_ledger: [
            {
              requested_capability: "docs-viewer.locate_in_doc",
              observation_ref: "obs:doc-location",
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              requested_capability: "scientific-calculator.solve_expression",
              observation_ref: null,
              satisfaction: "failed",
              rail_status: "fail_closed",
              rail_failure_code: "invalid_arg:latex_is_prose",
            },
          ],
        },
      },
      artifacts: [],
    });

    expect(readiness.has_failed_subgoal).toBe(true);
    expect(readiness.synthesis_required).toBe(false);
  });

  it("requires synthesis for complete family-based compound itineraries without a draft", () => {
    const turnId = "ask:test:family-compound-synthesis";
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary: {
          schema: "helix.capability_itinerary.v1",
          turn_id: turnId,
          terminal_success_criteria: {
            requires_post_observation_synthesis: true,
            required_observation_families: ["scholarly_research", "theory_locator"],
          },
        },
      },
      artifacts: [
        {
          artifact_id: "obs:scholarly",
          kind: "scholarly_research_observation",
          payload: { schema: "helix.scholarly_research_observation.v1" },
        },
        {
          artifact_id: "obs:theory",
          kind: "helix_theory_context_reflection_tool_receipt",
          payload: { schema: "helix.theory_context_reflection_tool_receipt.v1" },
        },
      ],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      synthesis_required: true,
      has_final_answer_draft: false,
    });
    expect(readiness.support_refs).toEqual(["obs:scholarly", "obs:theory"]);
  });

  it("requires model synthesis for non-doc heterogeneous compound observations", () => {
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
          compound_subgoal_ledger: [
            {
              requested_capability: "internet_search.web_research",
              executed_capability: "internet_search.web_research",
              observation_kind: "internet_search_observation",
              observation_ref: "obs:web",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "model_synthesized_answer",
            },
            {
              requested_capability: "helix_ask.reflect_theory_context",
              executed_capability: "helix_ask.reflect_theory_context",
              observation_kind: "helix_theory_context_reflection_tool_receipt",
              observation_ref: "obs:reflection",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "model_synthesized_answer",
            },
            {
              requested_capability: "scientific-calculator.solve_expression",
              executed_capability: "scientific-calculator.solve_expression",
              observation_kind: "calculator_receipt",
              observation_ref: "obs:calculator",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "workstation_tool_evaluation",
            },
          ],
        },
      },
      artifacts: [],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      synthesis_required: true,
      has_docs_subgoal: false,
      goal_kind: "compound_evidence_synthesis",
      required_terminal_kind: "model_synthesized_answer",
      synthesis_terminal_kind: "model_synthesized_answer",
    });
    expect(readiness.support_refs).toEqual(["obs:web", "obs:reflection", "obs:calculator"]);
    expect(readiness.terminal_contribution_kinds).toEqual([
      "model_synthesized_answer",
      "workstation_tool_evaluation",
    ]);
  });

  it("uses the runtime itinerary argument when the payload mirror is absent", () => {
    const turnId = "ask:test:runtime-itinerary-argument";
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {},
      capabilityItinerary: {
        schema: "helix.capability_itinerary.v1",
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["docs_viewer", "calculator"],
        },
        planned_steps: [
          { requested_capability: "docs-viewer.locate_in_doc" },
          { requested_capability: "scientific-calculator.solve_expression" },
        ],
        execution_state: {
          complete: true,
          required_observation_families: ["docs_viewer", "calculator"],
          compound_subgoal_ledger: [
            {
              requested_capability: "docs-viewer.locate_in_doc",
              observation_ref: `${turnId}:doc_location`,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              requested_capability: "scientific-calculator.solve_expression",
              observation_ref: `${turnId}:calculator_receipt`,
              satisfaction: "satisfied",
              rail_status: "complete",
            },
          ],
        },
      },
      artifacts: [],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      synthesis_required: true,
      goal_kind: "doc_evidence_synthesis",
      required_terminal_kind: "doc_evidence_synthesis_answer",
    });
  });

  it("requires docs compound synthesis even when an earlier subgoal draft exists", () => {
    const turnId = "ask:test:docs-compound-stale-draft";
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary: {
          schema: "helix.capability_itinerary.v1",
          terminal_success_criteria: {
            requires_post_observation_synthesis: true,
            required_observation_families: ["docs_viewer", "calculator"],
          },
          planned_steps: [
            { requested_capability: "docs-viewer.locate_in_doc" },
            { requested_capability: "scientific-calculator.solve_expression" },
          ],
          execution_state: {
            complete: true,
            required_observation_families: ["docs_viewer", "calculator"],
            compound_subgoal_ledger: [
              {
                requested_capability: "docs-viewer.locate_in_doc",
                observation_ref: "obs:doc-location",
                satisfaction: "satisfied",
                rail_status: "complete",
              },
              {
                requested_capability: "scientific-calculator.solve_expression",
                observation_ref: "obs:calculator",
                satisfaction: "satisfied",
                rail_status: "complete",
              },
            ],
          },
        },
        final_answer_draft: {
          text: "The doc location subgoal was drafted before calculator synthesis.",
          required_terminal_kind: "doc_location_matches",
        },
      },
      artifacts: [],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      has_final_answer_draft: true,
      synthesis_required: true,
      has_docs_subgoal: true,
      goal_kind: "doc_evidence_synthesis",
      required_terminal_kind: "doc_evidence_synthesis_answer",
    });
  });

  it("uses capability_registry as the catalog observation inside compound contracts", () => {
    const contract = buildHelixCompoundCapabilityContract({
      turnId: "ask:test:catalog-workspace",
      promptText: "Call helix_ask.inspect_capability_catalog, then use workspace_os.status to inspect workstation status.",
    });

    expect(contract?.subgoals.map((subgoal) => subgoal.requested_capability)).toEqual([
      "helix_ask.inspect_capability_catalog",
      "workspace_os.status",
    ]);
    expect(contract?.subgoals[0]?.required_observation_kinds).toEqual(["capability_registry"]);
    expect(contract?.subgoals[0]?.required_terminal_kind).toBe("capability_help_summary");
    expect(contract?.subgoals[0]?.contribution_role).toBe("capability_catalog");
    expect(contract?.subgoals[0]?.terminal_contribution_kind).toBe("capability_help_summary");
  });

  it("makes explicit catalog prompts dominate repo fallback contracts", () => {
    const arbitration = resolveAskCapabilityContractArbitration({
      turnId: "ask:test:catalog-dominance",
      promptText: "Call helix_ask.inspect_capability_catalog to list the tools available to Helix Ask.",
      fallbackSourceTarget: "repo_code",
      fallbackPlanFamily: "repo_code",
      fallbackGoalKind: "repo_code_evidence_question",
      fallbackRequiredTerminalKind: "repo_code_evidence_answer",
    });

    expect(arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "helix_ask.inspect_capability_catalog",
      selected_source_target: "runtime_evidence",
      selected_plan_family: "capability_catalog",
      canonical_goal_kind: "capability_help",
      required_terminal_kind: "capability_help_summary",
      route_metadata_demoted: false,
    });
  });
});
