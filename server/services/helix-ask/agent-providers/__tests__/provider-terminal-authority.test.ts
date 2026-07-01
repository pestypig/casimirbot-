import { describe, expect, it } from "vitest";
import { HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA } from "@shared/helix-agent-step-observation-packet";
import { buildHelixProviderReasoningReentry } from "../provider-terminal-authority";

const buildLanePacket = () => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: "turn-lane-authority",
  iteration: 0,
  call_id: "turn-lane-authority:capability_lane:utility_text.normalize_text:call",
  decision_id: "turn-lane-authority:capability_lane:utility_text.normalize_text:decision",
  capability_key: "utility_text.normalize_text",
  panel_id: "capability_lane",
  action: "normalize_text",
  status: "succeeded" as const,
  produced_artifact_refs: ["ask:lane:utility:authority-obs"],
  observation_summary: "Utility text normalization ready: lowercase.",
  receipts: [],
  missing_requirements: [],
  state_delta: {
    utility_text_observation: {
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
  },
  suggested_next_steps: [],
  produced_affordances: [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: "utility_text.normalize_text",
    consumer_capability: null,
    required_affordance_kinds: [],
    produced_affordance_kinds: [],
    missing_affordance_kinds: [],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

describe("provider terminal authority for capability lanes", () => {
  it("allows a provider terminal candidate only after lane observations are accounted as re-entered evidence", () => {
    const packet = buildLanePacket();
    const result = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "turn-lane-authority",
      threadId: "thread-lane-authority",
      route: "/ask/turn",
      gatewayCallResults: [],
      capabilityLaneObservationPackets: [packet],
      normalizedObservationPackets: [packet],
      providerText: "Normalized text is ready.",
      ok: true,
      solverCompleted: true,
      goalSatisfied: true,
    });

    expect(result.providerReasoningReentry).toMatchObject({
      status: "completed",
      input_observation_refs: ["ask:lane:utility:authority-obs"],
      normalized_observation_refs: ["ask:lane:utility:authority-obs"],
      capability_lane_observation_packet_count: 1,
      evidence_reentered: true,
      post_tool_model_step_required: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.terminalAuthorityCandidateReview).toMatchObject({
      terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
      terminal_authority_granted: true,
      final_visible_answer_authorized: true,
      selected_observation_refs: ["ask:lane:utility:authority-obs"],
      capability_lane_observation_refs: ["ask:lane:utility:authority-obs"],
      blockers: [],
    });
    expect(result.providerTerminalAuthorityBridge).toMatchObject({
      all_gateway_calls_succeeded: true,
      all_capability_lane_observations_succeeded: true,
      all_observations_succeeded: true,
      capability_lane_observation_refs: ["ask:lane:utility:authority-obs"],
      successful_capability_lane_observation_refs: ["ask:lane:utility:authority-obs"],
      normalized_observation_packet_count: 1,
      capability_lane_observation_packet_count: 1,
      terminal_authority_granted: true,
    });
    expect(result.terminalAnswerAuthority).toMatchObject({
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      server_authoritative: true,
      terminal_eligible: true,
      assistant_answer: false,
    });
  });
});
