import { describe, expect, it } from "vitest";

import {
  HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
  reconcileTerminalFailureWithToolRail,
} from "../terminal-rail-failure-reconciliation";

describe("reconcileTerminalFailureWithToolRail", () => {
  it("replaces stale budget exhaustion with live-source required-observation failure", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test",
      terminal_error_code: "agent_loop_budget_exhausted",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      selected_final_answer:
        "I could not complete this turn because the agent loop exhausted its max tool calls budget before satisfying the goal.",
      resolved_turn_summary: {
        turn_id: "ask:test",
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        terminal_error_code: "agent_loop_budget_exhausted",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:test",
        terminal_artifact_kind: "typed_failure",
        terminal_error_code: "agent_loop_budget_exhausted",
      },
      codex_parity_agent_spine_rail_table: {
        schema: "helix.codex_parity_agent_spine_rail_table.v1",
        turn_id: "ask:test",
        route_family: "live_environment",
        requested_capability: "live_env.read_processed_live_source_mail",
        executed_capability: "live_env.read_processed_live_source_mail",
        observation_kind: "reasoning_context",
        required_observation_kinds_for_requested_capability: ["stage_play_processed_mail_packet"],
        first_broken_rail: "observation_artifact",
        rail_status: "fail_closed",
        rail_failure_code: "required_observation_missing",
        repair_target: "observation_materializer",
      },
      debug: {
        terminal_error_code: "agent_loop_budget_exhausted",
      },
    };

    expect(reconcileTerminalFailureWithToolRail(payload)).toBe(true);
    expect(payload.terminal_error_code).toBe("missing_required_live_source_mailbox_observation");
    expect(payload.selected_final_answer).toContain("required mailbox observation was not materialized");
    expect(payload.selected_final_answer).toContain("stage_play_processed_mail_packet");
    expect(payload.resolved_turn_summary).toMatchObject({
      terminal_error_code: "missing_required_live_source_mailbox_observation",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(payload.terminal_answer_authority).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "missing_required_live_source_mailbox_observation",
      authority_origin: "tool_rail_failure_triage",
      server_authoritative: true,
    });
    expect(payload.debug).toMatchObject({
      terminal_error_code: "missing_required_live_source_mailbox_observation",
      tool_rail_terminal_failure_reconciliation: {
        applied: true,
        replaced_terminal_error_code: "agent_loop_budget_exhausted",
      },
    });
  });

  it("does not rewrite budget failures without a fail-closed required-observation rail", () => {
    const payload: Record<string, unknown> = {
      terminal_error_code: "agent_loop_budget_exhausted",
      codex_parity_agent_spine_rail_table: {
        rail_status: "broken",
        rail_failure_code: "tool_execution_rejected",
        first_broken_rail: "capability_execution",
      },
    };

    expect(reconcileTerminalFailureWithToolRail(payload)).toBe(false);
    expect(payload.terminal_error_code).toBe("agent_loop_budget_exhausted");
    expect(payload.tool_rail_terminal_failure_reconciliation_runtime).toMatchObject({
      available: true,
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
    });
  });

  it("stamps runtime availability for non-budget terminal responses", () => {
    const payload: Record<string, unknown> = {
      terminal_error_code: null,
      terminal_artifact_kind: "capability_help_summary",
      debug: {},
    };

    expect(reconcileTerminalFailureWithToolRail(payload)).toBe(false);
    expect(payload.tool_rail_terminal_failure_reconciliation_runtime).toMatchObject({
      schema: "helix.tool_rail_terminal_failure_reconciliation.runtime.v1",
      available: true,
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(payload.debug).toMatchObject({
      tool_rail_terminal_failure_reconciliation_runtime: {
        available: true,
        version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      },
    });
  });

  it("repairs response payloads when the rail table is only present in debug mirrors", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:nested-debug",
      terminal_error_code: "agent_loop_budget_exhausted",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      selected_final_answer: "I could not complete this turn because the agent loop exhausted its budget.",
      debug: {
        terminal_error_code: "agent_loop_budget_exhausted",
        codex_parity_agent_spine_rail_table: {
          schema: "helix.codex_parity_agent_spine_rail_table.v1",
          turn_id: "ask:nested-debug",
          route_family: "live_environment",
          requested_capability: "live_env.read_processed_live_source_mail",
          executed_capability: "live_env.read_processed_live_source_mail",
          observation_kind: "reasoning_context",
          required_observation_kinds_for_requested_capability: ["stage_play_processed_mail_packet"],
          first_broken_rail: "observation_artifact",
          rail_status: "fail_closed",
          rail_failure_code: "required_observation_missing",
          repair_target: "observation_materializer",
        },
      },
    };

    expect(reconcileTerminalFailureWithToolRail(payload)).toBe(true);
    expect(payload.terminal_error_code).toBe("missing_required_live_source_mailbox_observation");
    expect(payload.debug).toMatchObject({
      terminal_error_code: "missing_required_live_source_mailbox_observation",
      selected_final_answer: expect.stringContaining("required mailbox observation"),
      terminal_answer_authority: expect.objectContaining({
        terminal_error_code: "missing_required_live_source_mailbox_observation",
        authority_origin: "tool_rail_failure_triage",
      }),
    });
  });
});
