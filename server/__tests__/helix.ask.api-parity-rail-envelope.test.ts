import { describe, expect, it } from "vitest";

import type { HelixApiParityScenario } from "../services/helix-ask/api-parity-matrix";
import { buildApiParityProbeResult } from "../services/helix-ask/api-parity-probe";
import { CODEX_PARITY_AGENT_SPINE_CLASSES } from "../services/helix-ask/codex-parity-agent-spine-contract";
import { HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION } from "../services/helix-ask/terminal-rail-failure-reconciliation";

describe("Helix Ask API parity rail envelope invariants", () => {
  it("rejects fail-closed rails that project as normal final answers", () => {
    const scenario = liveSourceFailClosedScenario();
    const askTurn = buildLiveSourceFailClosedTurn({ projectAsTypedFailure: false });

    const probe = buildApiParityProbeResult({
      scenario,
      askTurn,
      debugExport: { payload: askTurn },
      terminalEventSeen: true,
      streamClosedAfterTerminal: true,
    });

    expect(probe.procedural_ok).toBe(false);
    expect(probe.failures).toEqual(
      expect.arrayContaining([
        "fail_closed_rail_missing_terminal_error_code",
        "fail_closed_rail_not_typed_failure:model_synthesized_answer/model_synthesized_answer",
        "fail_closed_rail_non_failure_response:final_answer/final_answer",
      ]),
    );
  });

  it("accepts fail-closed rails that project as typed failures", () => {
    const scenario = liveSourceFailClosedScenario();
    const askTurn = buildLiveSourceFailClosedTurn({ projectAsTypedFailure: true });

    const probe = buildApiParityProbeResult({
      scenario,
      askTurn,
      debugExport: { payload: askTurn },
      terminalEventSeen: true,
      streamClosedAfterTerminal: true,
    });

    expect(probe.procedural_ok).toBe(true);
    expect(probe.failures).toEqual([]);
  });
});

const liveSourceFailClosedScenario = (): HelixApiParityScenario => ({
  id: "fail_closed_rail_projection_contract",
  description: "A fail-closed live-source rail must project as typed failure.",
  enabled: true,
  seed: "none",
  prompt: "Use live_env.read_processed_live_source_mail to inspect the latest processed live-source mail.",
  expected: {
    solver_completed: false,
  },
});

const buildLiveSourceFailClosedTurn = (input: { projectAsTypedFailure: boolean }): Record<string, unknown> => {
  const scenario = liveSourceFailClosedScenario();
  const turnId = "ask:test:fail-closed-rail-projection-contract";
  const terminalErrorCode = input.projectAsTypedFailure
    ? "missing_required_live_source_mailbox_observation"
    : null;
  const terminalKind = input.projectAsTypedFailure ? "typed_failure" : "model_synthesized_answer";
  const finalStatus = input.projectAsTypedFailure ? "final_failure" : "final_answer";
  const railTable = {
    schema: "helix.codex_parity_agent_spine_rail_table.v1",
    turn_id: turnId,
    prompt: scenario.prompt,
    requested_capability: "live_env.read_processed_live_source_mail",
    visible_tool_surface: ["live_env.read_processed_live_source_mail"],
    visible_tool_surface_original_count: 1,
    visible_tool_surface_truncated: false,
    selected_capability: "live_env.read_processed_live_source_mail",
    admitted_capability: "live_env.read_processed_live_source_mail",
    admission_proof_source: "tool_call_admission_decision.selected_capability",
    admission_proven: true,
    executed_capability: "live_env.read_processed_live_source_mail",
    observation_kind: "reasoning_context",
    observation_ref: "ask:test:reasoning_context:1",
    required_observation_kinds_for_requested_capability: ["stage_play_processed_mail_packet"],
    observed_artifact_supports_requested_capability: false,
    reentry_status: "reentered",
    reentry_proof_source: "tool_lifecycle_trace.lifecycle_stage",
    reentry_proven: true,
    goal_satisfaction: "not_satisfied",
    required_terminal_kind: "model_synthesized_answer",
    selected_terminal_kind: terminalKind,
    terminal_authority_proof_source: "terminal_answer_authority.terminal_artifact_kind",
    terminal_authority_proven: true,
    visible_terminal_kind: terminalKind,
    visible_projection_source: "terminal_presentation.terminal_artifact_kind",
    visible_projection_proven: true,
    first_broken_rail: "observation_artifact",
    repair_target: "observation_materializer",
    codex_parity_class: "observation_missing",
    normalized_codex_parity_classes: [...CODEX_PARITY_AGENT_SPINE_CLASSES],
    rail_status: "fail_closed",
    rail_failure_code: "required_observation_missing",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return {
    turn_id: turnId,
    final_status: finalStatus,
    response_type: finalStatus,
    ...(terminalErrorCode ? { terminal_error_code: terminalErrorCode } : {}),
    final_answer_source: terminalKind,
    terminal_artifact_kind: terminalKind,
    selected_final_answer: input.projectAsTypedFailure
      ? "I could not complete this live-source mailbox turn because the required mailbox observation was not materialized."
      : "Here is a normal-looking answer without the required mailbox observation.",
    codex_parity_agent_spine_rail_table: railTable,
    tool_rail_terminal_failure_reconciliation_runtime: {
      schema: "helix.tool_rail_terminal_failure_reconciliation.runtime.v1",
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      available: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      completed_solver_path: false,
      selected_primary_intent: "live_source_mailbox",
      solver_short_circuit_flags: [],
    },
    loop_parity_trace: {
      admitted_tool_families: ["live_environment"],
      actual_tool_calls: ["live_env.read_processed_live_source_mail"],
      unexpected_tool_calls: [],
      short_circuit_risk_flags: [],
    },
    route_authority_audit: {
      route_authority_ok: true,
      violation_codes: [],
    },
    poison_audit: {
      ok: true,
    },
    terminal_answer_authority: {
      server_authoritative: true,
      final_answer_source: terminalKind,
      terminal_artifact_kind: terminalKind,
      ...(terminalErrorCode ? { terminal_error_code: terminalErrorCode } : {}),
    },
    terminal_presentation: {
      terminal_artifact_kind: terminalKind,
      ...(terminalErrorCode ? { terminal_error_code: terminalErrorCode } : {}),
    },
  };
};
