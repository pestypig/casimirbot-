import { describe, expect, it } from "vitest";
import { resolveCompoundCapabilitySynthesisReadiness } from "../services/helix-ask/compound-capability-synthesis";
import { buildHelixCompoundCapabilityContract } from "../services/helix-ask/compound-capability-contract";
import { resolveAskCapabilityContractArbitration } from "../services/helix-ask/capability-contract-arbitration";
import { materializeFinalAnswerDraftTerminal } from "../services/helix-ask/final-answer-draft-terminal-materializer";
import { inferFinalAnswerDraftRouteFamily } from "../services/helix-ask/final-answer-draft-quality-gate";

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

  it("requires synthesis from visual capture and calculator observations together", () => {
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
          compound_subgoal_ledger: [
            {
              requested_capability: "image_lens.inspect",
              selected_capability: "situation-room.describe_visual_capture",
              executed_capability: "situation-room.describe_visual_capture",
              observation_kind: "situation_context_pack",
              observation_ref: "obs:visual-context",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "situation_context_pack",
            },
            {
              requested_capability: "scientific-calculator.solve_expression",
              selected_capability: "scientific-calculator.solve_expression",
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
    expect(readiness.support_refs).toEqual(["obs:visual-context", "obs:calculator"]);
    expect(readiness.terminal_contribution_kinds).toEqual([
      "situation_context_pack",
      "workstation_tool_evaluation",
    ]);
  });

  it("requires synthesis after catalog and workspace subgoals are both observed", () => {
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
          required_observation_families: ["capability_catalog", "workspace_diagnostic"],
          required_capabilities: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
          compound_subgoal_ledger: [
            {
              requested_capability: "helix_ask.inspect_capability_catalog",
              executed_capability: "helix_ask.inspect_capability_catalog",
              observation_kind: "capability_registry",
              observation_ref: "obs:capability-registry",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "capability_help_summary",
            },
            {
              requested_capability: "workspace_os.status",
              executed_capability: "workspace_os.status",
              observation_kind: "workspace_os_status_observation",
              observation_ref: "obs:workspace-status",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "model_synthesized_answer",
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
    expect(readiness.support_refs).toEqual(["obs:capability-registry", "obs:workspace-status"]);
    expect(readiness.terminal_contribution_kinds).toEqual([
      "capability_help_summary",
      "model_synthesized_answer",
    ]);
  });

  it("still requires synthesis when a compound final draft exists without a materialized terminal artifact", () => {
    const turnId = "ask:test:catalog-workspace-draft-no-terminal";
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
          required_observation_families: ["capability_catalog", "workspace_diagnostic"],
          required_capabilities: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
          compound_subgoal_ledger: [
            {
              requested_capability: "helix_ask.inspect_capability_catalog",
              executed_capability: "helix_ask.inspect_capability_catalog",
              observation_kind: "capability_registry",
              observation_ref: "obs:capability-registry",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "capability_help_summary",
            },
            {
              requested_capability: "workspace_os.status",
              executed_capability: "workspace_os.status",
              observation_kind: "workspace_os_status_observation",
              observation_ref: "obs:workspace-status",
              satisfaction: "satisfied",
              rail_status: "complete",
              terminal_contribution_kind: "model_synthesized_answer",
            },
          ],
        },
        final_answer_draft: {
          artifact_id: `${turnId}:final_answer_draft`,
          text: "The catalog and workspace status observations are ready for synthesis.",
          required_terminal_kind: "model_synthesized_answer",
          support_refs: ["obs:capability-registry", "obs:workspace-status"],
        },
      },
      artifacts: [
        {
          artifact_id: `${turnId}:final_answer_draft`,
          kind: "final_answer_draft",
          payload: {
            text: "The catalog and workspace status observations are ready for synthesis.",
            required_terminal_kind: "model_synthesized_answer",
            support_refs: ["obs:capability-registry", "obs:workspace-status"],
          },
        },
      ],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      has_final_answer_draft: true,
      has_materialized_terminal_artifact: false,
      synthesis_required: true,
      goal_kind: "compound_evidence_synthesis",
      required_terminal_kind: "model_synthesized_answer",
    });
  });

  it("prefers rebuilt complete state over a stale incomplete payload mirror", () => {
    const turnId = "ask:test:stale-catalog-workspace-state";
    const itinerary = {
      schema: "helix.capability_itinerary.v1",
      terminal_success_criteria: {
        requires_post_observation_synthesis: true,
        required_observation_families: ["capability_catalog", "workspace_diagnostic"],
        required_capabilities: ["helix_ask.inspect_capability_catalog", "workspace_os.status"],
      },
      compound_capability_contract: {
        schema: "helix.compound_capability_contract.v1",
        subgoals: [
          {
            subgoal_id: `${turnId}:compound_capability_subgoal:1:helix_ask_inspect_capability_catalog`,
            requested_capability: "helix_ask.inspect_capability_catalog",
            runtime_capability: "helix_ask.inspect_capability_catalog",
            required_observation_kinds: ["capability_registry"],
            terminal_contribution_kind: "capability_help_summary",
          },
          {
            subgoal_id: `${turnId}:compound_capability_subgoal:2:workspace_os_status`,
            requested_capability: "workspace_os.status",
            runtime_capability: "workspace_os.status",
            required_observation_kinds: ["workspace_os_status_observation"],
            terminal_contribution_kind: "model_synthesized_answer",
          },
        ],
      },
    };
    const readiness = resolveCompoundCapabilitySynthesisReadiness({
      payload: {
        capability_itinerary: itinerary,
        capability_itinerary_execution_state: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: false,
          required_observation_families: ["capability_catalog", "workspace_diagnostic"],
          missing_observation_families: ["workspace_diagnostic"],
          compound_subgoal_ledger: [
            {
              requested_capability: "helix_ask.inspect_capability_catalog",
              executed_capability: "helix_ask.inspect_capability_catalog",
              observation_kind: "capability_registry",
              observation_ref: "obs:capability-registry",
              satisfaction: "satisfied",
              rail_status: "complete",
            },
            {
              requested_capability: "workspace_os.status",
              executed_capability: null,
              observation_kind: null,
              observation_ref: null,
              satisfaction: "pending",
              rail_status: "pending",
            },
          ],
        },
      },
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: "obs:capability-registry",
          kind: "capability_registry",
          payload: {
            kind: "capability_registry",
            capability_key: "helix_ask.inspect_capability_catalog",
          },
        },
        {
          artifact_id: "obs:catalog-runtime",
          kind: "runtime_tool_observation",
          payload: {
            capability_key: "helix_ask.inspect_capability_catalog",
            status: "completed",
            artifact_refs: ["obs:capability-registry"],
          },
        },
        {
          artifact_id: "obs:workspace-status",
          kind: "workspace_os_status_observation",
          payload: {
            schema: "helix.workspace_os_status_observation.v1",
            capability_key: "workspace_os.status",
          },
        },
        {
          artifact_id: "obs:workspace-runtime",
          kind: "runtime_tool_observation",
          payload: {
            capability_key: "workspace_os.status",
            status: "completed",
            artifact_refs: ["obs:workspace-status"],
          },
        },
      ],
    });

    expect(readiness).toMatchObject({
      applies: true,
      complete: true,
      synthesis_required: true,
      goal_kind: "compound_evidence_synthesis",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(readiness.support_refs).toEqual(["obs:capability-registry", "obs:workspace-status"]);
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

  it("does not classify completed catalog compounds as repo evidence", () => {
    expect(inferFinalAnswerDraftRouteFamily({
      routeProductContract: {
        source_target: "runtime_evidence",
        allowed_terminal_artifact_kinds: ["capability_help_summary"],
      },
      payload: {
        canonical_goal_frame: {
          goal_kind: "capability_help",
          required_terminal_kind: "capability_help_summary",
        },
        compound_capability_synthesis_readiness: {
          applies: true,
          complete: true,
          required_terminal_kind: "model_synthesized_answer",
          synthesis_terminal_kind: "model_synthesized_answer",
        },
        compound_capability_contract: {
          subgoals: [
            { requested_capability: "helix_ask.inspect_capability_catalog" },
            { requested_capability: "workspace_os.status" },
          ],
        },
      },
      artifactLedger: [],
    })).toBe("unknown");

    expect(inferFinalAnswerDraftRouteFamily({
      routeProductContract: {
        source_target: "runtime_evidence",
        allowed_terminal_artifact_kinds: ["capability_help_summary"],
      },
      payload: {
        canonical_goal_frame: {
          goal_kind: "capability_help",
          required_terminal_kind: "capability_help_summary",
        },
      },
      artifactLedger: [],
    })).toBe("capability_catalog");
  });

  it("materializes catalog plus workspace compound synthesis from satisfied observations", () => {
    const turnId = "ask:test:catalog-workspace-materializer";
    const finalAnswerDraft = {
      artifact_id: `${turnId}:final_answer_draft`,
      kind: "final_answer_draft",
      payload: {
        schema: "helix.final_answer_draft.v1",
        text: "The capability catalog reported the active tool surface, and workspace status reported the current workstation capability counts.",
        answer_text: "The capability catalog reported the active tool surface, and workspace status reported the current workstation capability counts.",
        goal_kind: "compound_evidence_synthesis",
        required_terminal_kind: "model_synthesized_answer",
        support_refs: ["obs:capability-registry", "obs:workspace-status"],
        artifact_refs: ["obs:capability-registry", "obs:workspace-status"],
        authority: "llm_post_observation_compound_synthesis",
      },
    };
    const payload = {
      canonical_goal_frame: {
        goal_kind: "capability_help",
        required_terminal_kind: "capability_help_summary",
      },
      route_product_contract: {
        source_target: "runtime_evidence",
        allowed_terminal_artifact_kinds: ["capability_help_summary"],
      },
      compound_capability_contract: {
        subgoals: [
          { requested_capability: "helix_ask.inspect_capability_catalog" },
          { requested_capability: "workspace_os.status" },
        ],
      },
      compound_capability_synthesis_readiness: {
        applies: true,
        complete: true,
        required_terminal_kind: "model_synthesized_answer",
        synthesis_terminal_kind: "model_synthesized_answer",
      },
      capability_itinerary_execution_state: {
        applies: true,
        complete: true,
        compound_subgoal_ledger: [
          {
            requested_capability: "helix_ask.inspect_capability_catalog",
            executed_capability: "helix_ask.inspect_capability_catalog",
            observation_kind: "capability_registry",
            observation_ref: "obs:capability-registry",
            satisfaction: "satisfied",
            rail_status: "complete",
          },
          {
            requested_capability: "workspace_os.status",
            executed_capability: "workspace_os.status",
            observation_kind: "workspace_os_status_observation",
            observation_ref: "obs:workspace-status",
            satisfaction: "satisfied",
            rail_status: "complete",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "obs:capability-registry",
          kind: "capability_registry",
          payload: { schema: "helix.capability_catalog_observation.v1" },
        },
        {
          artifact_id: "obs:workspace-status",
          kind: "workspace_os_status_observation",
          payload: { schema: "helix.workspace_os_status_observation.v1" },
        },
        finalAnswerDraft,
      ],
    };

    const result = materializeFinalAnswerDraftTerminal({
      turnId,
      payload,
      artifactLedger: payload.current_turn_artifact_ledger,
      routeProductContract: {
        source_target: "runtime_evidence",
        allowed_terminal_artifact_kinds: ["capability_help_summary"],
      },
      finalAnswerDraftRef: `${turnId}:final_answer_draft`,
    });

    expect(result).toMatchObject({
      ok: true,
      materialized_terminal_artifact_kind: "model_synthesized_answer",
    });
    expect(payload.model_synthesized_answer).toMatchObject({
      support_refs: ["obs:capability-registry", "obs:workspace-status"],
      subgoal_observation_refs: ["obs:capability-registry", "obs:workspace-status"],
      model_step_capability: "model.synthesize_from_compound_subgoal_observations",
    });
  });
});
