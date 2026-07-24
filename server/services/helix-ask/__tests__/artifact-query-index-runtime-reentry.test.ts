import { describe, expect, it } from "vitest";

import { buildArtifactQueryIndex } from "../artifact-query-index";
import { createHelixTurnLifecycleRecorder } from "../runtime/turn-lifecycle";

const buildVerifiedDocsLifecycle = (turnId: string, observationRef: string) => {
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
    route_commit_id: "route:docs",
    capability_ids: ["docs.search"],
  });
  const admitted = recorder.append({
    kind: "capability.admitted",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: route.event_id,
    route_commit_id: "route:docs",
    capability_id: "docs.search",
  });
  const call = recorder.append({
    kind: "tool.call.started",
    producer: "codex_runtime",
    status: "started",
    causation_id: admitted.event_id,
    route_commit_id: "route:docs",
    call_id: "call:docs",
    capability_id: "docs.search",
  });
  const completed = recorder.append({
    kind: "tool.call.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: call.event_id,
    route_commit_id: "route:docs",
    call_id: "call:docs",
    capability_id: "docs.search",
    observation_refs: [observationRef],
  });
  const reentered = recorder.append({
    kind: "observation.reentered",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: completed.event_id,
    route_commit_id: "route:docs",
    call_id: "call:docs",
    capability_id: "docs.search",
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
  it("does not downgrade verified native observation re-entry to a missing compatibility projection", () => {
    const turnId = "ask:test:docs-native-reentry";
    const gatewayObservationRef = `${turnId}:workstation_gateway:docs.search:1`;
    const normalizedObservationRef = `${turnId}:codex_normalized:doc_search_results:1`;
    const index = buildArtifactQueryIndex({
      turnId,
      payload: {
        active_prompt: "Can you explain what this paper is about?",
        native_provider_turn_lifecycle: buildVerifiedDocsLifecycle(turnId, gatewayObservationRef),
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
});
