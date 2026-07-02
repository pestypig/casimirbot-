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

const buildScholarlyNumericObservationResult = () => ({
  schema: "helix.workstation_tool_gateway.call_result.v1",
  manifest_version: "test",
  ok: false,
  agent_runtime: "codex",
  capability_id: "scholarly-research.extract_numeric_parameters",
  mode: "read",
  gateway_admission: {
    schema: "helix.workstation_tool_gateway.admission.v1",
    requested_capability: "scholarly-research.extract_numeric_parameters",
    selected_agent_provider: "codex",
    permission_profile: "read",
    admission_status: "admitted",
    admission_reason: "scholarly_numeric_extraction_requested",
    assistant_answer: false,
    raw_content_included: false,
  },
  observation_packet: {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: "turn-scholar-authority",
    iteration: 0,
    call_id: "turn-scholar-authority:gateway:extract_numeric_parameters",
    decision_id: "turn-scholar-authority:decision:extract_numeric_parameters",
    capability_key: "scholarly-research.extract_numeric_parameters",
    panel_id: "scholarly-research",
    action: "extract_numeric_parameters",
    status: "failed",
    produced_artifact_refs: ["ask:scholarly:numeric:missing-vars"],
    observation_summary: "Numeric extraction found missing requested variables.",
    receipts: [],
    missing_requirements: ["missing_requested_numeric_variables"],
    state_delta: {
      scholarly_numeric_recovery_affordance: {
        schema: "helix.scholarly_numeric_recovery_affordance.v1",
        status: "available",
        reason: "missing_requested_numeric_variables",
        recommended_next_capability: "scholarly-research.lookup_papers",
        missing_variables: ["B_T"],
        recovery_queries: ["tokamak toroidal magnetic field operating parameter table"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    suggested_next_steps: ["continue_reasoning"],
    produced_affordances: [],
    consumed_affordances: [],
    typed_handoff_contract: {
      schema: "helix.workstation_typed_handoff_contract.v1",
      producer_capability: "scholarly-research.extract_numeric_parameters",
      consumer_capability: null,
      required_affordance_kinds: [],
      produced_affordance_kinds: [],
      missing_affordance_kinds: ["numeric_parameter"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  tool_lifecycle_trace: {
    schema: "helix.tool_lifecycle_trace.v1",
    requested_capability: "scholarly-research.extract_numeric_parameters",
    admitted_capability: "scholarly-research.extract_numeric_parameters",
    executed_capability: "scholarly-research.extract_numeric_parameters",
    lifecycle_stage: "observed",
    status: "failed",
    session_ref: null,
    process_ref: null,
    observation_refs: ["ask:scholarly:numeric:missing-vars"],
    receipt_refs: [],
    evidence_refs: ["ask:scholarly:numeric:missing-vars"],
    failure_reason: "missing_requested_numeric_variables",
    retry_recommendation: "continue_reasoning",
    fallback_used: false,
    fallback_equivalent: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  tool_followup_decision: {
    schema: "helix.tool_followup_decision.v1",
    next_action: "continue_reasoning",
    reason: "missing_numeric_bindings_are_observation_for_provider_reasoning",
    external_change_required: false,
    terminal_blockers: ["missing_requested_numeric_variables"],
    required_surface_satisfied: true,
    evidence_reentered: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  observation: {
    schema: "helix.scholarly_numeric_parameter_observation.v1",
    missing_requirements: ["missing_requested_numeric_variables"],
    requested_variables: ["n_m3", "B_T"],
    missing_variables: ["B_T"],
    scholarly_numeric_recovery_affordance: {
      schema: "helix.scholarly_numeric_recovery_affordance.v1",
      status: "available",
      reason: "missing_requested_numeric_variables",
      recommended_next_capability: "scholarly-research.lookup_papers",
      missing_variables: ["B_T"],
      recovery_queries: ["tokamak toroidal magnetic field operating parameter table"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    selected_for_answer: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ["ask:scholarly:numeric:missing-vars"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "missing_requested_numeric_variables",
});

const buildScholarlyFullTextRecoveryResult = () => ({
  schema: "helix.workstation_tool_gateway.call_result.v1",
  manifest_version: "test",
  ok: false,
  agent_runtime: "codex",
  capability_id: "scholarly-research.fetch_full_text",
  mode: "read",
  gateway_admission: {
    schema: "helix.workstation_tool_gateway.admission.v1",
    requested_capability: "scholarly-research.fetch_full_text",
    selected_agent_provider: "codex",
    permission_profile: "read",
    admission_status: "blocked",
    admission_reason: "scholarly_full_text_blocked",
    blocked_reason: "fetchable_paper_identity_required",
    assistant_answer: false,
    raw_content_included: false,
  },
  observation_packet: {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: "turn-scholar-full-text-recovery",
    iteration: 0,
    call_id: "turn-scholar-full-text-recovery:gateway:fetch_full_text",
    decision_id: "turn-scholar-full-text-recovery:decision:fetch_full_text",
    capability_key: "scholarly-research.fetch_full_text",
    panel_id: "scholarly-research",
    action: "fetch_full_text",
    status: "blocked",
    produced_artifact_refs: ["ask:scholarly:full-text:recovery"],
    observation_summary: "Full-text fetch blocked because the paper identity was not fetchable.",
    receipts: [],
    missing_requirements: ["fetchable_paper_identity_required"],
    state_delta: {
      scholarly_full_text_recovery_affordance: {
        schema: "helix.scholarly_full_text_recovery_affordance.v1",
        status: "available",
        reason: "fetchable_paper_identity_required",
        recommended_next_capability: "scholarly-research.lookup_papers",
        recovery_queries: ["deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table accessible pdf"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    suggested_next_steps: ["use_another_tool", "repair"],
    produced_affordances: [],
    consumed_affordances: [],
    typed_handoff_contract: {
      schema: "helix.workstation_typed_handoff_contract.v1",
      producer_capability: "scholarly-research.fetch_full_text",
      consumer_capability: null,
      required_affordance_kinds: [],
      produced_affordance_kinds: [],
      missing_affordance_kinds: ["scholarly_full_text"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  observation: {
    schema: "helix.scholarly_full_text_observation.v1",
    status: "blocked",
    blocked_reason: "fetchable_paper_identity_required",
    scholarly_full_text_recovery_affordance: {
      schema: "helix.scholarly_full_text_recovery_affordance.v1",
      status: "available",
      reason: "fetchable_paper_identity_required",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    selected_for_answer: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ["ask:scholarly:full-text:recovery"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "fetchable_paper_identity_required",
});

const buildCalculatorUnsupportedExpressionResult = () => ({
  schema: "helix.workstation_tool_gateway.call_result.v1",
  manifest_version: "test",
  ok: false,
  agent_runtime: "codex",
  capability_id: "scientific-calculator.solve_expression",
  mode: "read",
  gateway_admission: {
    schema: "helix.workstation_tool_gateway.admission.v1",
    requested_capability: "scientific-calculator.solve_expression",
    selected_agent_provider: "codex",
    permission_profile: "read",
    admission_status: "blocked",
    admission_reason: "calculator_expression_blocked",
    blocked_reason: "unsupported_expression_syntax",
    assistant_answer: false,
    raw_content_included: false,
  },
  observation_packet: {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: "turn-calculator-blocked-authority",
    iteration: 0,
    call_id: "turn-calculator-blocked-authority:gateway:solve_expression",
    decision_id: "turn-calculator-blocked-authority:decision:solve_expression",
    capability_key: "scientific-calculator.solve_expression",
    panel_id: "scientific-calculator",
    action: "solve_expression",
    status: "blocked",
    produced_artifact_refs: ["ask:calculator:blocked-expression"],
    observation_summary: "Calculator gateway blocked expression: unsupported_expression_syntax.",
    receipts: [],
    missing_requirements: [{
      code: "unsupported_expression_syntax",
      message: "Provide a simple arithmetic expression using numbers and arithmetic operators only.",
      repair_action: "ask_user",
      rejected_expression: "explain why receipts matter",
      normalized_expression: "explain why receipts matter",
      required_affordance_kind: "bound_calculator_expression",
    }],
    state_delta: {},
    suggested_next_steps: ["repair"],
    produced_affordances: [{
      kind: "calculator_result",
      status: "blocked",
      terminal_eligible: false,
      assistant_answer: false,
    }],
    consumed_affordances: [{
      kind: "bound_calculator_expression",
      status: "missing",
      missing_inputs: ["bound_calculator_expression"],
      terminal_eligible: false,
      assistant_answer: false,
    }],
    typed_handoff_contract: {
      schema: "helix.workstation_typed_handoff_contract.v1",
      producer_capability: "scientific-calculator.solve_expression",
      consumer_capability: null,
      required_affordance_kinds: ["bound_calculator_expression"],
      produced_affordance_kinds: ["calculator_result"],
      missing_affordance_kinds: ["bound_calculator_expression"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  observation: {
    schema: "helix.calculator_solve_observation.v1",
    capability_key: "scientific-calculator.solve_expression",
    expression: "explain why receipts matter",
    normalized_expression: "explain why receipts matter",
    rejected_expression: "explain why receipts matter",
    result: null,
    status: "blocked",
    blocked_reason: "unsupported_expression_syntax",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ["ask:calculator:blocked-expression"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "unsupported_expression_syntax",
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

  it("allows Codex terminal candidates after scholarly numeric missing-variable observations re-enter reasoning", () => {
    const gatewayResult = buildScholarlyNumericObservationResult();
    const result = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "turn-scholar-authority",
      threadId: "thread-scholar-authority",
      route: "/ask/turn",
      gatewayCallResults: [gatewayResult as never],
      normalizedObservationPackets: [gatewayResult.observation_packet],
      providerText: "The paper evidence was fetched, but B_T was not available in the extracted numeric bindings.",
      ok: true,
      solverCompleted: true,
      goalSatisfied: true,
    });

    expect(gatewayResult).toMatchObject({
      ok: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
    });
    expect(result.providerReasoningReentry).toMatchObject({
      status: "completed",
      evidence_reentered: true,
      post_tool_model_step_required: false,
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(gatewayResult.observation_packet.state_delta).toMatchObject({
      scholarly_numeric_recovery_affordance: {
        schema: "helix.scholarly_numeric_recovery_affordance.v1",
        missing_variables: ["B_T"],
        recommended_next_capability: "scholarly-research.lookup_papers",
      },
    });
    expect(result.terminalAuthorityCandidateReview).toMatchObject({
      terminal_authority_granted: true,
      blockers: [],
      selected_observation_refs: ["ask:scholarly:numeric:missing-vars"],
    });
    expect(result.providerTerminalAuthorityBridge).toMatchObject({
      all_gateway_calls_succeeded: true,
      terminal_authority_granted: true,
      final_answer_source: "agent_provider_terminal_candidate",
      terminal_artifact_kind: "agent_provider_terminal_candidate",
    });
    expect(result.terminalAnswerAuthority).toMatchObject({
      terminal_artifact_kind: "agent_provider_terminal_candidate",
      server_authoritative: true,
    });
  });

  it("allows Codex terminal candidates after scholarly full-text recovery evidence re-enters reasoning", () => {
    const gatewayResult = buildScholarlyFullTextRecoveryResult();
    const result = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "turn-scholar-full-text-recovery",
      threadId: "thread-scholar-full-text-recovery",
      route: "/ask/turn",
      gatewayCallResults: [gatewayResult as never],
      normalizedObservationPackets: [gatewayResult.observation_packet],
      providerText: "The paper lookup was relevant, but the selected identity was not fetchable. Re-query for an accessible full-text source before numeric extraction.",
      ok: true,
      solverCompleted: true,
      goalSatisfied: true,
    });

    expect(result.providerReasoningReentry).toMatchObject({
      status: "completed",
      evidence_reentered: true,
      post_tool_model_step_required: false,
    });
    expect(result.terminalAuthorityCandidateReview).toMatchObject({
      terminal_authority_granted: true,
      blockers: [],
      selected_observation_refs: ["ask:scholarly:full-text:recovery"],
    });
    expect(result.providerTerminalAuthorityBridge).toMatchObject({
      all_gateway_calls_succeeded: true,
      terminal_authority_granted: true,
      final_answer_source: "agent_provider_terminal_candidate",
    });
  });

  it("allows Codex terminal candidates after calculator expression blocks re-enter reasoning", () => {
    const gatewayResult = buildCalculatorUnsupportedExpressionResult();
    const result = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: "Codex Workstation Mode",
      turnId: "turn-calculator-blocked-authority",
      threadId: "thread-calculator-blocked-authority",
      route: "/ask/turn",
      gatewayCallResults: [gatewayResult as never],
      normalizedObservationPackets: [gatewayResult.observation_packet],
      providerText: "The calculator did not produce a result because the requested expression was prose, not a bound arithmetic expression.",
      ok: true,
      solverCompleted: true,
      goalSatisfied: true,
    });

    expect(result.providerReasoningReentry).toMatchObject({
      status: "completed",
      evidence_reentered: true,
      post_tool_model_step_required: false,
    });
    expect(result.terminalAuthorityCandidateReview).toMatchObject({
      terminal_authority_granted: true,
      blockers: [],
      selected_observation_refs: ["ask:calculator:blocked-expression"],
    });
    expect(result.providerTerminalAuthorityBridge).toMatchObject({
      all_gateway_calls_succeeded: true,
      terminal_authority_granted: true,
      final_answer_source: "agent_provider_terminal_candidate",
    });
  });
});
