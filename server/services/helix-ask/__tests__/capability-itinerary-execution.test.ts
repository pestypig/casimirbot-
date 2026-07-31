import { describe, expect, it } from "vitest";
import {
  buildHelixCapabilityItineraryExecutionState,
  isHelixCapabilityItineraryFamilyObserved,
} from "../capability-itinerary-execution";

describe("Helix capability itinerary execution", () => {
  it("counts the canonical moral graph observation as completed family evidence", () => {
    const artifacts = [{
      artifact_id: "ask:test:moral-graph",
      kind: "moral_graph_reflection",
      payload: {
        schema: "helix.moral_graph_reflection_observation.v1",
        capability_key: "moral-graph.reflect_context",
        status: "succeeded",
      },
    }];

    expect(isHelixCapabilityItineraryFamilyObserved("moral_graph_reflection", artifacts)).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["moral_graph_reflection"],
          required_capabilities: ["moral-graph.reflect_context"],
        },
        compound_capability_contract: {
          subgoals: [{
            subgoal_id: "subgoal:moral-graph",
            requested_capability: "moral-graph.reflect_context",
            runtime_capability: "moral-graph.reflect_context",
            required_observation_kinds: [
              "moral_graph_reflection",
              "helix.moral_graph_reflection_observation.v1",
            ],
          }],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      observed_families: ["moral_graph_reflection"],
      missing_observation_families: [],
      compound_subgoal_ledger: [{
        satisfaction: "satisfied",
        rail_status: "complete",
      }],
    });
  });

  it("counts successful notes-list and text-to-speech observations for their exact families", () => {
    const notesArtifacts = [{
      artifact_id: "ask:test:notes-list",
      kind: "provider_gateway_observation_packet",
      capability_key: "workstation-notes.list_notes",
      payload: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: "workstation-notes.list_notes",
        status: "succeeded",
      },
    }];
    const voiceArtifacts = [{
      artifact_id: "ask:test:voice-delivery",
      kind: "capability_lane_observation_packet",
      payload: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: "text_to_speech.speak_text",
        status: "succeeded",
      },
    }];

    expect(isHelixCapabilityItineraryFamilyObserved("notes", notesArtifacts)).toBe(true);
    expect(isHelixCapabilityItineraryFamilyObserved("workstation", [{
      ...notesArtifacts[0],
      kind: "workstation_notes_list_observation",
    }])).toBe(true);
    expect(isHelixCapabilityItineraryFamilyObserved("voice_delivery", voiceArtifacts)).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          required_observation_families: ["workstation"],
        },
        compound_capability_contract: {
          subgoals: [{
            subgoal_id: "subgoal:notes-list",
            requested_capability: "workstation-notes.list_notes",
            runtime_capability: "workstation-notes.list_notes",
            required_observation_kinds: ["helix.agent_step_observation_packet.v1"],
          }],
        },
      },
      artifacts: notesArtifacts,
    })).toMatchObject({
      complete: true,
      compound_subgoal_ledger: [{
        satisfaction: "satisfied",
        rail_status: "complete",
      }],
    });
  });

  it("does not use a generic gateway packet to satisfy the wrong exact capability", () => {
    const artifacts = [{
      artifact_id: "ask:test:wrong-capability",
      kind: "provider_gateway_observation_packet",
      capability_key: "workspace_os.status",
      payload: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: "workspace_os.status",
        status: "succeeded",
      },
    }];

    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          required_observation_families: ["workstation"],
        },
        compound_capability_contract: {
          subgoals: [{
            subgoal_id: "subgoal:notes-list",
            requested_capability: "workstation-notes.list_notes",
            runtime_capability: "workstation-notes.list_notes",
            required_observation_kinds: ["workstation_notes_list_observation"],
          }],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: false,
      compound_subgoal_ledger: [{
        satisfaction: "pending",
        rail_failure_code: "subgoal_observation_missing",
      }],
    });
  });

  it("counts the registered frontier-conjecture observation as theory-locator evidence", () => {
    const artifacts = [{
      artifact_id: "ask:test:theory-frontier",
      kind: "theory_frontier_conjecture_observation",
      payload: {
        schema: "helix.theory_frontier_conjecture_observation.v1",
        capability_key: "theory-badge-graph.propose_frontier_conjectures",
        status: "succeeded",
      },
    }];

    expect(isHelixCapabilityItineraryFamilyObserved("theory_locator", artifacts)).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["theory_locator"],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      observed_families: ["theory_locator"],
      missing_observation_families: [],
    });
  });

  it("counts the exact theory-experiment procedure observation as theory-locator evidence", () => {
    const artifacts = [{
      artifact_id: "ask:test:theory-experiment-procedure",
      kind: "theory_experiment_procedure_observation",
      payload: {
        schema: "casimir.theory_experiment_procedure.observation.v1",
        capability_key: "theory-experiment-procedure.prepare",
        status: "succeeded",
      },
    }];

    expect(isHelixCapabilityItineraryFamilyObserved("theory_locator", artifacts)).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["theory_locator"],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      observed_families: ["theory_locator"],
      missing_observation_families: [],
    });
  });

  it("counts a formal artifact-family audit observation as theory-locator evidence", () => {
    const artifacts = [{
      artifact_id: "ask:test:theory-formal-artifact-family-audit",
      kind: "theory_formal_artifact_family_audit_observation",
      payload: {
        schema: "casimir.theory_formal_artifact_family_audit.observation.v1",
        capability_key: "theory-formal-verifier.inspect_artifact_family",
        status: "succeeded",
      },
    }];

    expect(
      isHelixCapabilityItineraryFamilyObserved("theory_locator", artifacts),
    ).toBe(true);
    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["theory_locator"],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      observed_families: ["theory_locator"],
      missing_observation_families: [],
    });
  });

  it("reconciles stale planning hints with authenticated executed observation arguments", () => {
    const capability = "theory-experiment-procedure.prepare";
    const observationKind = "theory_experiment_procedure_observation";
    const artifacts = [{
      artifact_id: "ask:test:theory-experiment-procedure:observation",
      kind: observationKind,
      executed_args: {
        selected_badge_ids: ["study.casimir_dp.evidence_map_stage3"],
      },
      payload: {
        schema: "casimir.theory_experiment_procedure.observation.v1",
        capability_key: capability,
        status: "succeeded",
      },
    }];

    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["theory_locator"],
          required_capabilities: [capability],
        },
        compound_capability_contract: {
          subgoals: [{
            subgoal_id: "subgoal:theory-procedure",
            requested_capability: capability,
            runtime_capability: capability,
            required_args: ["prompt", "selected_badge_ids"],
            args_hint: {
              prompt: "Prepare the Stage 3 theory comparison.",
              selected_badge_ids: [],
            },
            required_observation_kinds: [observationKind],
          }],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      missing_required_capabilities: [],
      compound_subgoal_ledger: [{
        satisfaction: "satisfied",
        args_source: "contract_hint_reconciled_with_observation",
        selected_args: {
          prompt: "Prepare the Stage 3 theory comparison.",
          selected_badge_ids: ["study.casimir_dp.evidence_map_stage3"],
        },
      }],
    });
  });

  it("treats an authenticated calculator receipt expression as the required calculator input", () => {
    const capability = "scientific-calculator.solve_expression";
    const receiptRef = "ask:test:calculator-receipt";
    const artifacts = [{
      artifact_id: receiptRef,
      kind: "calculator_receipt",
      payload: {
        schema: "helix.calculator_receipt.v1",
        capability_key: capability,
        expression: "17*19",
        normalized_expression: "17*19",
        result: "323",
        status: "succeeded",
      },
    }];

    expect(buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: {
        terminal_success_criteria: {
          requires_post_observation_synthesis: true,
          required_observation_families: ["calculator"],
          required_capabilities: [capability],
        },
        compound_capability_contract: {
          subgoals: [{
            subgoal_id: "subgoal:calculator",
            requested_capability: capability,
            runtime_capability: capability,
            required_args: ["latex"],
            optional_args: ["expression", "equation"],
            args_hint: {},
            required_observation_kinds: [
              "calculator_receipt",
              "workstation_tool_evaluation",
            ],
          }],
        },
      },
      artifacts,
    })).toMatchObject({
      complete: true,
      missing_required_capabilities: [],
      missing_compound_subgoal_ids: [],
      compound_subgoal_ledger: [{
        requested_capability: capability,
        executed_capability: capability,
        args_source: "contract_hint_reconciled_with_observation",
        selected_args: {
          expression: "17*19",
        },
        observation_kind: "calculator_receipt",
        observation_ref: receiptRef,
        satisfaction: "satisfied",
        rail_status: "complete",
        rail_failure_code: null,
      }],
    });
  });

  it("counts only the exact broker-revalidated prior environment evidence schema", () => {
    const artifact = {
      artifact_id: "ask:turn-2:prior-environment-evidence",
      kind: "prior_environment_probe_evidence",
      capability_key:
        "com.casimirbot.minecraft.reachability.check",
      source_scope: "prior_turn_context",
      payload: {
        schema:
          "helix.environment_connector.prior_probe_evidence.v1",
        capability_id:
          "com.casimirbot.minecraft.reachability.check",
        content_role:
          "prior_environment_probe_evidence_not_assistant_answer",
        reentry_required: true,
        answer_authority: false,
        observation: {
          schema:
            "helix.environment_connector.probe_observation.v1",
          capability_id:
            "com.casimirbot.minecraft.reachability.check",
          outcome: "succeeded",
          provenance_valid: true,
          eligible_for_current_turn_reentry: true,
          assistant_answer: false,
          terminal_eligible: false,
        },
      },
    };
    const itinerary = {
      terminal_success_criteria: {
        requires_post_observation_synthesis: true,
        required_observation_families: ["live_environment"],
      },
    };

    expect(
      isHelixCapabilityItineraryFamilyObserved("live_environment", [
        artifact,
      ]),
    ).toBe(true);
    expect(
      buildHelixCapabilityItineraryExecutionState({
        capabilityItinerary: itinerary,
        artifacts: [artifact],
      }),
    ).toMatchObject({
      complete: true,
      observed_families: ["live_environment"],
      missing_observation_families: [],
    });

    for (const invalidArtifact of [
      {
        ...artifact,
        payload: {
          ...artifact.payload,
          answer_authority: true,
        },
      },
      {
        ...artifact,
        payload: {
          ...artifact.payload,
          observation: {
            ...artifact.payload.observation,
            provenance_valid: false,
          },
        },
      },
      {
        ...artifact,
        payload: {
          ...artifact.payload,
          observation: {
            ...artifact.payload.observation,
            outcome: "target_ambiguous",
          },
        },
      },
    ]) {
      expect(
        isHelixCapabilityItineraryFamilyObserved(
          "live_environment",
          [invalidArtifact],
        ),
      ).toBe(false);
    }
  });
});
