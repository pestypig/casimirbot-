import { describe, expect, it } from "vitest";

import { buildAskTurnSolverTrace } from "../services/helix-ask/ask-turn-solver";
import { providerPostObservationCompletionMaterialized } from "../services/helix-ask/provider-terminal-completion";
import { evaluateTerminalBoundaryEligibility } from "../services/helix-ask/runtime-authority-contract";
import { createHelixTurnLifecycleRecorder } from "../services/helix-ask/runtime/turn-lifecycle";
import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";

const buildProviderLifecycle = (
  turnId: string,
  observationRef: string,
  capabilityId = "docs.search",
) => {
  const recorder = createHelixTurnLifecycleRecorder({
    turnId,
    scope: "codex_native_provider_cycle",
    now: () => 100,
  });
  const started = recorder.append({
    kind: "turn.started",
    producer: "helix_adapter",
    status: "started",
  });
  const route = recorder.append({
    kind: "route.committed",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: started.event_id,
    route_commit_id: `${turnId}:route:1`,
    capability_ids: [capabilityId],
  });
  recorder.append({
    kind: "capability.admitted",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: route.event_id,
    route_commit_id: route.route_commit_id,
    capability_id: capabilityId,
  });
  const call = recorder.append({
    kind: "tool.call.started",
    producer: "codex_runtime",
    status: "started",
    route_commit_id: route.route_commit_id,
    call_id: `${turnId}:call:1`,
    capability_id: capabilityId,
  });
  const completed = recorder.append({
    kind: "tool.call.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: call.event_id,
    route_commit_id: route.route_commit_id,
    call_id: call.call_id,
    capability_id: capabilityId,
    observation_refs: [observationRef],
  });
  const reentered = recorder.append({
    kind: "observation.reentered",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: completed.event_id,
    route_commit_id: route.route_commit_id,
    call_id: call.call_id,
    capability_id: capabilityId,
    observation_refs: [observationRef],
  });
  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: reentered.event_id,
    native_item_id: `${turnId}:message:1`,
    message_sha256: "sha256:test",
  });
  const runtime = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
    native_turn_id: `${turnId}:native`,
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: runtime.event_id,
    terminal_kind: "agent_provider_terminal_candidate",
    terminal_eligible: true,
  });
  recorder.append({
    kind: "turn.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: eligibility.event_id,
    terminal_kind: "agent_provider_terminal_candidate",
    terminal_eligible: true,
  });
  return recorder.snapshot();
};

describe("Helix Ask solver runtime lifecycle authority", () => {
  it("projects verified re-entry and post-observation reasoning without granting terminal authority", () => {
    const turnId = "turn:lifecycle-solver-authority";
    const observationRef = `${turnId}:docs:observation:1`;
    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: "Use the current document evidence and explain the result.",
      selectedRoute: "agent_provider_gateway_turn",
      terminalArtifactKind: "model_synthesized_answer",
      finalAnswerSource: "final_answer_draft",
      payload: {
        turn_lifecycle: buildProviderLifecycle(turnId, observationRef),
        source_target_intent: {
          target_source: "docs_viewer",
          target_kind: "active_document",
          strength: "hard",
        },
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "agent_provider_gateway_turn",
          required_terminal_kind: "model_synthesized_answer",
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "docs_viewer",
          required_terminal_kind: "model_synthesized_answer",
          allowed_terminal_artifact_kinds: ["model_synthesized_answer", "typed_failure"],
        },
        route_authority_audit: { route_authority_ok: true },
        poison_audit: { ok: true },
        terminal_answer_authority: {
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
          server_authoritative: true,
        },
        current_turn_artifact_ledger: [{
          artifact_id: observationRef,
          kind: "docs_viewer_observation",
          payload: { artifact_id: observationRef, selected_for_answer: true },
        }],
      },
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "docs.search",
          family: "docs_viewer",
          admitted: true,
          mutating: false,
          result_ref: observationRef,
        }],
        observations_created: [{
          observation_id: observationRef,
          source_kind: "docs_viewer",
        }],
        evidence_selected_for_answer: [observationRef],
        evidence_rejected_for_answer: [],
        route_authority_ok: true,
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.runtime_lifecycle_facts).toEqual({
      scope: "codex_native_provider_cycle",
      integrity: "verified",
      runtime_turn_completed: true,
      observation_reentry_refs: [observationRef],
      post_observation_reasoning_completed: true,
      latest_reentry_event_id: expect.any(String),
      final_agent_message_event_id: expect.any(String),
    });
    expect(trace.evidence_reentry.completed).toBe(true);
    expect(trace.followup_reasoning.completed).toBe(true);
    expect(trace.route_authority_ok).toBe(true);
    expect(trace.terminal_authority_ok).toBe(true);
  });

  it("uses runtime completion when a legacy provider solver flag is stale", () => {
    const turnId = "turn:lifecycle-provider-completion";
    const observationRef = `${turnId}:docs:observation:1`;
    const candidateRef = `${turnId}:agent_provider_terminal_candidate:codex:test`;
    const lifecycle = buildProviderLifecycle(turnId, observationRef);
    const payload = {
      turn_lifecycle: lifecycle,
      terminal_answer_authority: {
        turn_id: turnId,
        server_authoritative: true,
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_item_id: candidateRef,
      },
      terminal_presentation: {
        turn_id: turnId,
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        final_answer_source: "agent_provider_terminal_candidate",
        selected_observation_refs: [observationRef],
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        turn_id: turnId,
        selected_terminal_artifact_kind: "agent_provider_terminal_candidate",
        selected_terminal_artifact_ref: candidateRef,
        selected_terminal_support_refs: [observationRef],
        integrity: {
          single_writer_applied: true,
          post_tool_model_step_satisfied: true,
        },
      },
      provider_reasoning_reentry: {
        turn_id: turnId,
        status: "completed",
        evidence_reentered: true,
        solver_completed: false,
        goal_satisfaction_compatible: true,
        provider_terminal_candidate_ref: candidateRef,
      },
      provider_terminal_authority_bridge: {
        turn_id: turnId,
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        all_observations_succeeded: true,
        solver_completed: false,
        goal_satisfaction_compatible: true,
        provider_terminal_candidate_ref: candidateRef,
      },
      current_turn_artifact_ledger: [{
        artifact_id: observationRef,
        kind: "provider_gateway_observation_packet",
        source_scope: "current_turn",
        payload: { turn_id: turnId, artifact_id: observationRef },
      }],
    };

    expect(providerPostObservationCompletionMaterialized({
      payload,
      turnId,
      terminalArtifactKind: "agent_provider_terminal_candidate",
      finalAnswerSource: "agent_provider_terminal_candidate",
    })).toBe(true);
  });

  it("uses the committed route over a stale provider goal while retaining Helix terminal authority", () => {
    const turnId = "turn:lifecycle-provider-route-product";
    const observationRef = `${turnId}:research:observation:1`;
    const candidateRef = `${turnId}:agent_provider_terminal_candidate:codex:test`;
    const routeProductRef = `${candidateRef}:route_product:scholarly_research_answer`;
    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: "Use the selected paper evidence and explain its measurements.",
      selectedRoute: "/ask",
      terminalArtifactKind: "scholarly_research_answer",
      finalAnswerSource: "scholarly_research_answer",
      payload: {
        turn_lifecycle: buildProviderLifecycle(turnId, observationRef),
        source_target_intent: {
          target_source: "scholarly_research",
          target_kind: "saved_scholarly_full_text",
          strength: "hard",
        },
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: "agent_provider_gateway_turn",
          required_terminal_kind: "compound_evidence_synthesis_answer",
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "scholarly_research",
          required_terminal_kind: "scholarly_research_answer",
          allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
        },
        provider_route_product_materialization: {
          schema: "helix.provider_route_product_materialization.v1",
          status: "materialized",
          provider_terminal_candidate_ref: candidateRef,
          materialized_terminal_artifact_kind: "scholarly_research_answer",
          materialized_terminal_artifact_ref: routeProductRef,
          selected_observation_refs: [observationRef],
        },
        provider_reasoning_reentry: {
          status: "completed",
          provider_terminal_candidate_ref: candidateRef,
          evidence_reentered: true,
          solver_completed: false,
          goal_satisfaction_compatible: true,
        },
        provider_terminal_authority_bridge: {
          provider_terminal_candidate_ref: candidateRef,
          terminal_authority_granted: true,
          final_visible_answer_authorized: true,
        },
        terminal_authority_single_writer: {
          selected_terminal_artifact_kind: "scholarly_research_answer",
          selected_terminal_artifact_ref: routeProductRef,
        },
        terminal_answer_authority: {
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          server_authoritative: true,
        },
        terminal_presentation: {
          terminal_artifact_kind: "scholarly_research_answer",
          final_answer_source: "scholarly_research_answer",
          selected_observation_refs: [observationRef],
        },
        current_turn_artifact_ledger: [{
          artifact_id: observationRef,
          kind: "research_library_observation",
          payload: { artifact_id: observationRef, selected_for_answer: true },
        }],
      },
      loopParityTrace: {
        actual_tool_calls: [{
          tool_id: "scholarly-research.fetch_full_text",
          family: "scholarly_research",
          admitted: true,
          mutating: false,
          result_ref: observationRef,
        }],
        observations_created: [{
          observation_id: observationRef,
          source_kind: "scholarly_research",
        }],
        evidence_selected_for_answer: [],
        evidence_rejected_for_answer: [],
        poison_audit_ok: true,
        terminal_authority_ok: true,
      },
    });

    expect(trace.runtime_lifecycle_facts?.integrity).toBe("verified");
    expect(trace.completed_solver_path).toBe(true);
    expect(trace.route_authority_ok).toBe(true);
    expect(trace.terminal_authority_ok).toBe(true);
    expect(trace.solver_risk_flags).toEqual([]);
  });

  it("repairs a stale legacy continuation only after verified provider completion and scholarly authority", () => {
    const turnId = "turn:lifecycle-stale-scholarly-continuation";
    const observationRef = `${turnId}:research:observation:1`;
    const answerRef = `${turnId}:scholarly_research_answer:1`;
    const answerText = "The selected paper reports a current-turn measurement grounded in the normalized scholarly observation.";
    const artifacts = [{
      artifact_id: observationRef,
      kind: "provider_gateway_observation_packet",
      source_scope: "current_turn",
      payload: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: turnId,
        artifact_id: observationRef,
        capability_key: "scholarly-research.lookup_papers",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        observation: {
          schema: "helix.scholarly_research_observation.v1",
        },
      },
    }];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Use the selected paper evidence and explain the reported measurement.",
      turn_lifecycle: buildProviderLifecycle(
        turnId,
        observationRef,
        "scholarly-research.lookup_papers",
      ),
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model.synthesize_current_evidence",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "scholarly_research",
        required_terminal_kind: "scholarly_research_answer",
        allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      capability_itinerary: {
        schema: "helix.capability_itinerary.v1",
        prompt_shape: "source_backed",
        relevant_tool_families: ["scholarly_research"],
        terminal_success_criteria: {
          required_observation_families: ["scholarly_research"],
          requires_post_observation_synthesis: true,
        },
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: turnId,
        thread_id: "thread:test",
        route: "/ask",
        terminal_kind: "answer",
        terminal_artifact_kind: "scholarly_research_answer",
        final_answer_source: "scholarly_research_answer",
        terminal_item_id: answerRef,
        server_authoritative: true,
        terminal_eligible: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        turn_id: turnId,
        concise_text: answerText,
        terminal_artifact_kind: "scholarly_research_answer",
        final_answer_source: "scholarly_research_answer",
        terminal_authority_ref: answerRef,
        selected_observation_refs: [observationRef],
        assistant_answer: false,
        raw_content_included: false,
      },
      provider_reasoning_reentry: {
        schema: "helix.provider_reasoning_reentry.v1",
        turn_id: turnId,
        status: "completed",
        evidence_reentry_required: true,
        evidence_reentered: true,
        normalized_observation_refs: [observationRef],
        normalized_observation_packet_count: 1,
        solver_completed: false,
        goal_satisfaction_compatible: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      provider_terminal_authority_bridge: {
        schema: "helix.provider_terminal_authority_bridge.v1",
        turn_id: turnId,
        solver_completed: false,
        goal_satisfaction_compatible: true,
        normalized_observations_ready: true,
        all_observations_succeeded: true,
        terminal_authority_granted: true,
        final_visible_answer_authorized: true,
        successful_gateway_observation_refs: [observationRef],
        normalized_observation_refs: [observationRef],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      current_turn_artifact_ledger: artifacts,
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId: "thread:test",
      payload,
      artifactLedger: artifacts,
    });

    expect(result.selected_terminal_artifact_kind).toBe("scholarly_research_answer");
    expect(result.visible_text).toBe(answerText);
    expect(payload.terminal_error_code).toBeUndefined();
    expect(result.integrity).toMatchObject({
      scholarly_response_mode_terminal: {
        legacy_solver_continuation_pending: true,
        agent_continuation_decision_pending: false,
        provider_solver_completion_observed: true,
        provider_solver_completion_source: "verified_runtime_event_log",
        can_surface: true,
      },
    });
    expect(payload.terminal_boundary_eligibility).toMatchObject({
      eligible: true,
      blocking_reasons: [],
      runtime_lifecycle: {
        integrity_verified: true,
        scope: "codex_native_provider_cycle",
        provider_cycle_completed: true,
        supported_capability_ids: ["scholarly-research.lookup_papers"],
        supported_observation_refs: [observationRef],
        authority_source: "verified_runtime_event_log",
      },
    });
  });

  it("does not use provider completion as evidence for a mismatched capability observation", () => {
    const turnId = "turn:lifecycle-capability-mismatch";
    const observationRef = `${turnId}:research:observation:1`;
    const report = evaluateTerminalBoundaryEligibility({
      turn_id: turnId,
      turn_lifecycle: buildProviderLifecycle(turnId, observationRef, "docs.search"),
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
      },
      terminal_artifact_kind: "scholarly_research_answer",
      final_answer_source: "scholarly_research_answer",
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      current_turn_artifact_ledger: [{
        artifact_id: observationRef,
        kind: "provider_gateway_observation_packet",
        source_scope: "current_turn",
        payload: {
          schema: "helix.agent_step_observation_packet.v1",
          capability_key: "scholarly-research.lookup_papers",
          status: "succeeded",
          observation: {
            schema: "helix.scholarly_research_observation.v1",
          },
        },
      }],
    });

    expect(report.runtime_lifecycle).toMatchObject({
      integrity_verified: true,
      provider_cycle_completed: true,
      supported_capability_ids: [],
      supported_observation_refs: [],
    });
    expect(report.checks).toMatchObject({
      agent_runtime_loop: true,
      agent_step_decision: true,
      selected_capability_observation: false,
      post_observation_model_decision: true,
    });
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });
});
