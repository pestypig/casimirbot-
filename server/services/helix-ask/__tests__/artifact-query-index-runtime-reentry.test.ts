import { describe, expect, it } from "vitest";

import { buildArtifactQueryIndex } from "../artifact-query-index";
import { createHelixTurnLifecycleRecorder } from "../runtime/turn-lifecycle";

const buildVerifiedLifecycle = (
  turnId: string,
  observationRef: string,
  capability: string,
) => {
  const routeCommitId = `route:${capability}`;
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
    route_commit_id: routeCommitId,
    capability_ids: [capability],
  });
  const admitted = recorder.append({
    kind: "capability.admitted",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: route.event_id,
    route_commit_id: routeCommitId,
    capability_id: capability,
  });
  const call = recorder.append({
    kind: "tool.call.started",
    producer: "codex_runtime",
    status: "started",
    causation_id: admitted.event_id,
    route_commit_id: routeCommitId,
    call_id: `call:${capability}`,
    capability_id: capability,
  });
  const completed = recorder.append({
    kind: "tool.call.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: call.event_id,
    route_commit_id: routeCommitId,
    call_id: `call:${capability}`,
    capability_id: capability,
    observation_refs: [observationRef],
  });
  const reentered = recorder.append({
    kind: "observation.reentered",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: completed.event_id,
    route_commit_id: routeCommitId,
    call_id: `call:${capability}`,
    capability_id: capability,
    observation_refs: [observationRef],
  });
  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: reentered.event_id,
    native_item_id: "agent-message:docs",
    message_sha256: "hash:docs",
  });
  const runtime = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
    native_turn_id: "native-turn:docs",
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: runtime.event_id,
    terminal_kind: "model_synthesized_answer",
    terminal_eligible: true,
  });
  recorder.append({
    kind: "turn.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: eligibility.event_id,
    terminal_kind: "model_synthesized_answer",
    terminal_eligible: true,
  });
  return recorder.snapshot();
};

describe("artifact query index runtime re-entry authority", () => {
  it("keeps an observed requested action authoritative across a later supporting inspection", () => {
    const turnId = "ask:test:minecraft-inspect-act-chain";
    const commandCapability = "com.casimirbot.minecraft.command";
    const spatialCapability =
      "com.casimirbot.minecraft.spatial_region.inspect";
    const commandRef = `${turnId}:workstation_gateway:${commandCapability}:1`;
    const failedSpatialRef = `${turnId}:workstation_gateway:${spatialCapability}:2`;
    const successfulSpatialRef = `${turnId}:workstation_gateway:${spatialCapability}:3`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt:
          "Inspect, build a wall with Minecraft commands, then inspect again.",
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: turnId,
          requested_capability: commandCapability,
          admitted_capability: commandCapability,
          requested_capability_family: "live_environment",
          requested_capability_source: "explicit_user_command",
          requested_capability_confidence: 0.99,
          required_observation_kinds_for_requested_capability: [
            "provider_gateway_observation_packet",
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: turnId,
          requested_capability: commandCapability,
          selected_capability: spatialCapability,
          capability_family: "live_environment",
          admission_status: "admitted",
        },
        tool_lifecycle_trace: {
          schema: "helix.tool_lifecycle_trace.v1",
          turn_id: turnId,
          requested_capability: spatialCapability,
          admitted_capability: spatialCapability,
          executed_capability: spatialCapability,
          lifecycle_stage: "completed",
          status: "completed",
          observation_refs: [successfulSpatialRef],
        },
        runtime_tool_call: {
          capability_key: spatialCapability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: commandRef,
            kind: "provider_gateway_observation_packet",
            payload_schema: "helix.agent_step_observation_packet.v1",
            capability_key: commandCapability,
            status: "succeeded",
          },
          {
            artifact_id: failedSpatialRef,
            kind: "provider_gateway_observation_packet",
            payload_schema: "helix.agent_step_observation_packet.v1",
            capability_key: spatialCapability,
            status: "failed",
          },
          {
            artifact_id: successfulSpatialRef,
            kind: "provider_gateway_observation_packet",
            payload_schema: "helix.agent_step_observation_packet.v1",
            capability_key: spatialCapability,
            status: "succeeded",
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: commandCapability,
      selected_capability: spatialCapability,
      executed_capability: spatialCapability,
      requested_selected_match: true,
      observed_multi_step_transition_authorized: true,
      observation_ref: successfulSpatialRef,
    });
    expect(index.tool_turn_chain_audit?.rail_failure_code).not.toBe(
      "explicit_capability_not_selected",
    );
  });

  it("does not downgrade verified native observation re-entry to a missing compatibility projection", () => {
    const turnId = "ask:test:docs-native-reentry";
    const gatewayObservationRef = `${turnId}:workstation_gateway:docs.search:1`;
    const normalizedObservationRef = `${turnId}:codex_normalized:doc_search_results:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Can you explain what this paper is about?",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          "docs.search",
        ),
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: turnId,
          capability_family: "docs_viewer",
          requested_action: "docs.search",
          selected_capability: "docs.search",
          admission_status: "admitted",
          required_terminal_kind: "model_synthesized_answer",
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: turnId,
          requested_capability: "docs.search",
          admitted_capability: "docs.search",
          required_observation_kinds_for_requested_capability: ["doc_search_results"],
          assistant_answer: false,
          raw_content_included: false,
        },
        runtime_tool_call: {
          capability_key: "docs.search",
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: normalizedObservationRef,
            kind: "doc_search_results",
            payload: {
              schema: "helix.doc_search_results.v1",
              capability_key: "docs.search",
              provider_gateway_observation_ref: gatewayObservationRef,
              document_path: "docs/research/nhm2-current-status-whitepaper.md",
              excerpt: "NHM2 is a bounded same-chart lapse-shift diagnostic framework.",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: "docs.search",
      selected_capability: "docs.search",
      executed_capability: "docs.search",
      observation_ref: normalizedObservationRef,
      reentry_executed: true,
      reentry_proven: true,
      reentry_proof_source: "runtime_event_log.observation_reentered",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      reentry_status: "reentered",
      reentry_proven: true,
    });
  });

  it("reconciles a registered docs runtime capability with its requested canonical capability", () => {
    const turnId = "ask:test:docs-runtime-alias-reentry";
    const requestedCapability = "docs-viewer.search_docs";
    const runtimeCapability = "docs.search";
    const gatewayObservationRef = `${turnId}:workstation_gateway:${runtimeCapability}:1`;
    const normalizedObservationRef = `${turnId}:codex_normalized:doc_search_results:1`;
    const retrievalContextRef = `${turnId}:codex_normalized:retrieval_context:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Use the docs viewer to search the current document set.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          runtimeCapability,
        ),
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: turnId,
          capability_family: "docs_viewer",
          requested_capability: requestedCapability,
          requested_action: requestedCapability,
          selected_capability: runtimeCapability,
          admission_status: "admitted",
          required_terminal_kind: "model_synthesized_answer",
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: turnId,
          requested_capability: requestedCapability,
          admitted_capability: runtimeCapability,
          required_observation_kinds_for_requested_capability: [
            "doc_search_results",
            "retrieval_context",
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
        runtime_tool_call: {
          capability_key: runtimeCapability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: normalizedObservationRef,
            kind: "doc_search_results",
            capability_key: runtimeCapability,
            source_capability_id: runtimeCapability,
            provider_gateway_observation_ref: gatewayObservationRef,
            payload: {
              schema: "helix.doc_search_results.v1",
              capability_key: runtimeCapability,
              source_capability_id: runtimeCapability,
              matches: [],
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
          {
            artifact_id: retrievalContextRef,
            kind: "retrieval_context",
            capability_key: runtimeCapability,
            source_capability_id: runtimeCapability,
            payload: {
              schema: "helix.retrieval_context.v1",
              capability_key: runtimeCapability,
              source_capability_id: runtimeCapability,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: requestedCapability,
      selected_capability: runtimeCapability,
      executed_capability: runtimeCapability,
      requested_selected_match: true,
      observed_artifact_supports_requested_capability: true,
      observation_ref: normalizedObservationRef,
      reentry_executed: true,
      reentry_proven: true,
      reentry_proof_source: "runtime_event_log.observation_reentered",
    });
  });

  it("treats tool-family observation catalogs as alternative evidence kinds", () => {
    const turnId = "ask:test:repo-family-observation-alternative";
    const capability = "repo.search";
    const gatewayObservationRef = `${turnId}:workstation_gateway:${capability}:1`;
    const normalizedObservationRef =
      `${turnId}:codex_normalized:repo_code_evidence_observation:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Find where the workstation status route is implemented.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          capability,
        ),
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: turnId,
          capability_family: "repo_code",
          requested_action: capability,
          selected_capability: capability,
          admission_status: "admitted",
          required_terminal_kind: "repo_code_evidence_answer",
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: turnId,
          requested_capability: capability,
          admitted_capability: capability,
          required_observation_kinds_for_requested_capability: [
            "repo_code_evidence_observation",
            "repo_code_search_result",
            "repo_evidence_relevance_gate",
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
        runtime_tool_call: {
          capability_key: capability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: normalizedObservationRef,
            kind: "repo_code_evidence_observation",
            capability_key: capability,
            source_capability_id: capability,
            provider_gateway_observation_ref: gatewayObservationRef,
            payload: {
              schema: "helix.repo_code_evidence_observation.v1",
              capability_key: capability,
              source_capability_id: capability,
              matches: [
                {
                  path: "server/routes/agi.plan.ts",
                  excerpt: "workspace_os.status",
                },
              ],
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    expect(index.required_observation_coverage_mode).toBe("any");
    expect(index.missing_required_observation_kinds).toEqual([]);
    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: capability,
      selected_capability: capability,
      executed_capability: capability,
      observed_artifact_supports_requested_capability: true,
      observation_ref: normalizedObservationRef,
      reentry_executed: true,
      reentry_proven: true,
    });
    expect(index.tool_turn_chain_audit.rail_failure_code).not.toBe(
      "required_observation_missing",
    );
  });

  it("reconciles the live-shaped theory procedure observation by exact structured identity", () => {
    const turnId = "ask:test:theory-procedure-native-reentry";
    const capability = "theory-experiment-procedure.prepare";
    const gatewayObservationRef = `${turnId}:workstation_gateway:${capability}:receipt`;
    const normalizedObservationRef =
      `${turnId}:codex_normalized:theory_experiment_procedure_observation:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt:
          "Prepare a first-principles comparison procedure for two selected theory badges.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          capability,
        ),
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: turnId,
          capability_family: "workstation",
          requested_action: capability,
          selected_capability: capability,
          admission_status: "admitted",
          required_terminal_kind: "model_synthesized_answer",
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: turnId,
          requested_capability: capability,
          admitted_capability: capability,
          required_observation_kinds_for_requested_capability: [
            "theory_experiment_procedure_observation",
          ],
          assistant_answer: false,
          raw_content_included: false,
        },
        runtime_tool_call: {
          capability_key: capability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            schema: "helix.current_turn_artifact.v1",
            artifact_id: normalizedObservationRef,
            producer_item_id: `${gatewayObservationRef}:call`,
            kind: "provider_normalized_observation",
            observation_kind: "theory_experiment_procedure_observation",
            payload_schema: "casimir.theory_experiment_procedure.observation.v1",
            turn_id: turnId,
            capability_key: capability,
            source_capability_id: capability,
            provider_gateway_observation_ref: gatewayObservationRef,
            status: "succeeded",
            payload: {
              schema: "casimir.theory_experiment_procedure.observation.v1",
              status: "succeeded",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: capability,
      selected_capability: capability,
      executed_capability: capability,
      observation_ref: normalizedObservationRef,
      required_observation_kinds_for_requested_capability:
        expect.arrayContaining([
          "theory_experiment_procedure_observation",
        ]),
      observed_artifact_supports_requested_capability: true,
      reentry_executed: true,
      reentry_proven: true,
      reentry_proof_source: "runtime_event_log.observation_reentered",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      executed_capability: capability,
      observation_ref: normalizedObservationRef,
      reentry_status: "reentered",
      reentry_proven: true,
    });
  });

  it("does not reconcile a near-name structured capability as the theory procedure observation", () => {
    const turnId = "ask:test:theory-procedure-capability-mismatch";
    const capability = "theory-experiment-procedure.prepare";
    const gatewayObservationRef = `${turnId}:workstation_gateway:${capability}:receipt`;
    const normalizedObservationRef =
      `${turnId}:codex_normalized:theory_experiment_procedure_observation:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Prepare the theory experiment procedure.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          capability,
        ),
        capability_plan: {
          requested_action: capability,
          selected_capability: capability,
          admission_status: "admitted",
        },
        tool_call_admission_decision: {
          requested_capability: capability,
          admitted_capability: capability,
          required_observation_kinds_for_requested_capability: [
            "theory_experiment_procedure_observation",
          ],
        },
        runtime_tool_call: {
          capability_key: capability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            schema: "helix.current_turn_artifact.v1",
            artifact_id: normalizedObservationRef,
            kind: "provider_normalized_observation",
            observation_kind: "theory_experiment_procedure_observation",
            payload_schema: "casimir.theory_experiment_procedure.observation.v1",
            turn_id: turnId,
            capability_key: `${capability}.preview`,
            source_capability_id: `${capability}.preview`,
            provider_gateway_observation_ref: gatewayObservationRef,
            payload: {
              schema: "casimir.theory_experiment_procedure.observation.v1",
              status: "succeeded",
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: capability,
      observation_ref: null,
      observed_artifact_supports_requested_capability: false,
      reentry_proven: false,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      observation_ref: null,
      reentry_status: "no_observation",
      reentry_proven: false,
    });
  });

  it.each([
    {
      label: "wrong payload schema",
      payloadSchema: "casimir.theory_experiment_procedure.preview.v1",
      nestedSchema: "casimir.theory_experiment_procedure.observation.v1",
    },
    {
      label: "missing payload schema",
      payloadSchema: null,
      nestedSchema: "casimir.theory_experiment_procedure.observation.v1",
    },
    {
      label: "conflicting nested payload schema",
      payloadSchema: "casimir.theory_experiment_procedure.observation.v1",
      nestedSchema: "casimir.theory_experiment_procedure.preview.v1",
    },
  ])("does not reconcile the canonical procedure kind with $label", ({
    label,
    payloadSchema,
    nestedSchema,
  }) => {
    const turnId = `ask:test:theory-procedure-schema-${label.replace(/\s+/g, "-")}`;
    const capability = "theory-experiment-procedure.prepare";
    const gatewayObservationRef = `${turnId}:workstation_gateway:${capability}:receipt`;
    const normalizedObservationRef =
      `${turnId}:codex_normalized:theory_experiment_procedure_observation:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Prepare the theory experiment procedure.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          capability,
        ),
        capability_plan: {
          requested_action: capability,
          selected_capability: capability,
          admission_status: "admitted",
        },
        tool_call_admission_decision: {
          requested_capability: capability,
          admitted_capability: capability,
          required_observation_kinds_for_requested_capability: [
            "theory_experiment_procedure_observation",
          ],
        },
        runtime_tool_call: {
          capability_key: capability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            schema: "helix.current_turn_artifact.v1",
            artifact_id: normalizedObservationRef,
            kind: "provider_normalized_observation",
            observation_kind: "theory_experiment_procedure_observation",
            ...(payloadSchema ? { payload_schema: payloadSchema } : {}),
            turn_id: turnId,
            capability_key: capability,
            source_capability_id: capability,
            provider_gateway_observation_ref: gatewayObservationRef,
            payload: {
              schema: nestedSchema,
              status: "succeeded",
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: capability,
      observation_ref: null,
      observed_artifact_supports_requested_capability: false,
      reentry_proven: false,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      observation_ref: null,
      reentry_status: "no_observation",
      reentry_proven: false,
    });
  });

  it("rejects conflicting structured identities even when one field is an exact match", () => {
    const turnId = "ask:test:theory-procedure-conflicting-identity";
    const capability = "theory-experiment-procedure.prepare";
    const conflictingCapability = `${capability}.preview`;
    const gatewayObservationRef = `${turnId}:workstation_gateway:${capability}:receipt`;
    const normalizedObservationRef =
      `${turnId}:codex_normalized:theory_experiment_procedure_observation:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Prepare the theory experiment procedure.",
        native_provider_turn_lifecycle: buildVerifiedLifecycle(
          turnId,
          gatewayObservationRef,
          capability,
        ),
        capability_plan: {
          requested_action: capability,
          selected_capability: capability,
          admission_status: "admitted",
        },
        tool_call_admission_decision: {
          requested_capability: capability,
          admitted_capability: capability,
          required_observation_kinds_for_requested_capability: [
            "theory_experiment_procedure_observation",
          ],
        },
        runtime_tool_call: {
          capability_key: capability,
          status: "completed",
        },
        current_turn_artifact_ledger: [
          {
            schema: "helix.current_turn_artifact.v1",
            artifact_id: normalizedObservationRef,
            kind: "provider_normalized_observation",
            observation_kind: "theory_experiment_procedure_observation",
            payload_schema: "casimir.theory_experiment_procedure.observation.v1",
            turn_id: turnId,
            capability_key: capability,
            source_capability_id: capability,
            provider_gateway_observation_ref: gatewayObservationRef,
            payload: {
              schema: "casimir.theory_experiment_procedure.observation.v1",
              capability_key: capability,
              source_capability_id: conflictingCapability,
              status: "succeeded",
            },
          },
        ],
      },
    });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: capability,
      observation_ref: null,
      observed_artifact_supports_requested_capability: false,
      reentry_proven: false,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      observation_ref: null,
      reentry_status: "no_observation",
      reentry_proven: false,
    });
  });
});
