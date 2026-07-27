import { describe, expect, it } from "vitest";
import {
  buildCodexNormalizedObservationArtifacts,
} from "../codex-provider";
import {
  HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
  HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
} from "../../workstation-tool-gateway/bound-room-evidence";
import type { HelixWorkstationGatewayCallResult } from "../../workstation-tool-gateway/types";

const TURN_ID = "ask:codex-bound-room:turn-1";
const REQUEST_REF =
  "room_source_request:room-source-binding:test-request";

const gatewayResult = (): HelixWorkstationGatewayCallResult =>
  ({
    schema: "helix.workstation_tool_gateway.call_result.v1",
    manifest_version: "read-observe-act.v1",
    ok: true,
    agent_runtime: "codex",
    capability_id: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
    mode: "read",
    gateway_admission: {
      schema: "helix.workstation_tool_gateway.admission.v1",
      requested_capability: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      selected_agent_provider: "codex",
      permission_profile: "read",
      admission_status: "admitted",
      admission_reason: "authenticated_bound_room_evidence_admitted",
      assistant_answer: false,
      raw_content_included: false,
    },
    observation_packet: {
      schema: "helix.agent_step_observation_packet.v1",
      turn_id: TURN_ID,
      iteration: 1,
      call_id: `${TURN_ID}:gateway-call`,
      decision_id: `${TURN_ID}:gateway-decision`,
      capability_key: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      panel_id: "workstation-gateway",
      action: "read_bound_room_evidence",
      status: "completed",
      produced_artifact_refs: [`${TURN_ID}:bound-room-observation`],
      observation_summary: "Read fresh bound-room evidence.",
      receipts: [],
      missing_requirements: [],
      state_delta: {},
      suggested_next_steps: ["answer"],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    observation: {
      schema: HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
      capability_key: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      status: "succeeded",
      current_turn_id: TURN_ID,
      current_turn_evidence: true,
      identity: {
        run_id: "run-bound-room",
        source_request_ref: REQUEST_REF,
      },
      provenance: {
        source_admission_verified: true,
        exact_request_provenance_verified: true,
        evidence_refs: [REQUEST_REF],
        current_turn_reentry_required: true,
        raw_source_payload_included: false,
        raw_world_events_included: false,
      },
      execution_enabled: false,
      may_execute_live_actions: false,
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    artifact_refs: [`${TURN_ID}:bound-room-observation`],
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  }) as HelixWorkstationGatewayCallResult;

describe("Codex bound-room evidence normalization", () => {
  it("materializes only an authentic exact-current-turn observation for solver re-entry", () => {
    const result = buildCodexNormalizedObservationArtifacts({
      turnId: TURN_ID,
      gatewayCallResults: [gatewayResult()],
    });

    expect(result.missingNormalizationFailures).toEqual([]);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      schema: "helix.current_turn_artifact.v1",
      kind: "bound_room_evidence_observation",
      observation_kind: "bound_room_evidence_observation",
      payload_schema: HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
      turn_id: TURN_ID,
      capability_key: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      payload: {
        current_turn_id: TURN_ID,
        current_turn_evidence: true,
        reentry_required: true,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
    });
  });

  it("rejects a stale-turn observation instead of normalizing it as evidence", () => {
    const forged = gatewayResult();
    (forged.observation as Record<string, unknown>).current_turn_id =
      "ask:prior-turn";

    const result = buildCodexNormalizedObservationArtifacts({
      turnId: TURN_ID,
      gatewayCallResults: [forged],
    });

    expect(result.artifacts).toEqual([]);
    expect(result.missingNormalizationFailures).toEqual([
      `provider_observation_normalization_missing:${HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY}`,
    ]);
  });
});
