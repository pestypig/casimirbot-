import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../registry";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context";
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context";
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel";
const WORKSTATION_OPEN_PANEL_CAPABILITY = "workstation.open_panel";
const WORKSTATION_FOCUS_PANEL_CAPABILITY = "workstation.focus_panel";
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";

describe("Helix workstation tool gateway", () => {
  const originalEnv = {
    RG_BIN: process.env.RG_BIN,
    PATH: process.env.PATH,
    Path: process.env.Path,
  };

  beforeEach(() => {
    process.env.RG_BIN = originalEnv.RG_BIN;
    process.env.PATH = originalEnv.PATH;
    process.env.Path = originalEnv.Path;
  });

  afterEach(() => {
    process.env.RG_BIN = originalEnv.RG_BIN;
    process.env.PATH = originalEnv.PATH;
    process.env.Path = originalEnv.Path;
  });

  it("lists read-only non-terminal workstation capabilities", () => {
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });

    expect(manifest).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
      manifest_version: "read-observe-act.v1",
      agent_runtime: "codex",
      mode: "observe",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        mode: "observe",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workspace_os_status_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.workstation_active_context_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.calculator_solve_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.calculator_active_context_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.repo_search_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_OPEN_DOC_CAPABILITY,
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_SEARCH_CAPABILITY,
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.docs_search_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
  });

  it("calls workspace_os.status as an observation packet, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "observe",
      capabilityId: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      arguments: {
        thread_id: "helix-ask:test",
        capability_ids: ["runtime.memory"],
      },
      turnId: "ask:test:gateway",
      iteration: 1,
    });

    expect(result).toMatchObject({
      manifest_version: "read-observe-act.v1",
      ok: true,
      agent_runtime: "codex",
      capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      gateway_admission: {
        schema: "helix.workstation_tool_gateway.admission.v1",
        requested_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "observe",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        turn_id: "ask:test:gateway",
        tool_family: "workstation_tool_gateway",
        requested_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        admitted_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        turn_id: "ask:test:gateway",
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: true,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet).toMatchObject({
      schema: "helix.agent_step_observation_packet.v1",
      turn_id: "ask:test:gateway",
      iteration: 1,
      capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      panel_id: "workspace-os",
      action: "status",
      status: "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toMatchObject({
      schema: "helix.workspace_os_status_observation.v1",
      capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls workstation.active_context as bounded open-panel observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        workspace_context: {
          activePanel: "docs-viewer",
          activeGroupId: "main",
          groupCount: 2,
          openPanels: ["docs-viewer", "scientific-calculator", "workstation-process-graph"],
        },
      },
      turnId: "ask:test:gateway-workstation-active-context",
      iteration: 2,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      gateway_admission: {
        requested_capability: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-workstation-active-context",
        iteration: 2,
        capability_key: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "workstation",
        action: "active_context",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_active_context_observation.v1",
        capability_key: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        status: "succeeded",
        active_panel: "docs-viewer",
        active_group_id: "main",
        group_count: 2,
        open_panels: ["docs-viewer", "scientific-calculator", "workstation-process-graph"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks workstation.active_context when no bounded panel state was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        workspace_context: {},
      },
      turnId: "ask:test:gateway-workstation-active-context-missing",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      error: "workstation_active_context_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "workstation_active_context_missing",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "workstation_active_context_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_active_context_observation.v1",
        status: "blocked",
        blocked_reason: "workstation_active_context_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls scientific-calculator.solve_expression as read-only non-terminal evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: {
        expression: "2 + 2 * 3",
      },
      turnId: "ask:test:gateway-calculator",
      iteration: 2,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      gateway_admission: {
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-calculator",
        iteration: 2,
        capability_key: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "solve_expression",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        expression: "2 + 2 * 3",
        result: "8",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls scientific-calculator.active_context as bounded active-panel observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        active_context: {
          current_latex: "8 * 9",
          last_result_text: "72",
          last_normalized_expression: "8*9",
          last_ok: true,
          step_count: 1,
          recent_debug_events: [{
            action_id: "solve_expression",
            ok: true,
            input_latex: "8 * 9",
            result_text: "72",
            normalized_expression: "8*9",
            message: "solve_completed",
            ts: "2026-06-28T00:00:00.000Z",
          }],
        },
      },
      turnId: "ask:test:gateway-calculator-active-context",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      gateway_admission: {
        requested_capability: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-calculator-active-context",
        iteration: 3,
        capability_key: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "active_context",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_active_context_observation.v1",
        capability_key: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "scientific-calculator",
        status: "succeeded",
        current_latex: "8 * 9",
        last_result_text: "72",
        last_normalized_expression: "8*9",
        last_ok: true,
        step_count: 1,
        recent_debug_events: [
          expect.objectContaining({
            action_id: "solve_expression",
            result_text: "72",
          }),
        ],
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks scientific-calculator.active_context when no bounded calculator state was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        active_context: {},
      },
      turnId: "ask:test:gateway-calculator-active-context-missing",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      error: "calculator_active_context_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "calculator_active_context_missing",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "calculator_active_context_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.calculator_active_context_observation.v1",
        status: "blocked",
        blocked_reason: "calculator_active_context_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks calculator panel UI actions without act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY,
      turnId: "ask:test:gateway-calculator-open-blocked",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
      mode: "read",
      gateway_admission: {
        requested_capability: CALCULATOR_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        admission_reason: "permission_profile_insufficient",
        blocked_reason: "permission_profile_read_does_not_allow_act",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      observation: {
        schema: "helix.workstation_tool_gateway.permission_blocked.v1",
        requested_mode: "read",
        required_permission_profile: "act",
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits calculator panel UI actions as non-terminal action receipts under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY,
      turnId: "ask:test:gateway-calculator-open",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: CALCULATOR_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: CALCULATOR_OPEN_PANEL_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "open_panel",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: CALCULATOR_OPEN_PANEL_CAPABILITY,
        action_kind: "open_panel",
        panel_id: "scientific-calculator",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "open_panel",
          panel_id: "scientific-calculator",
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits safe workstation panel open actions as non-terminal action receipts under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: WORKSTATION_OPEN_PANEL_CAPABILITY,
      arguments: {
        panel_id: "workstation-process-graph",
      },
      turnId: "ask:test:gateway-workstation-open-panel",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: WORKSTATION_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: WORKSTATION_OPEN_PANEL_CAPABILITY,
        panel_id: "workstation-process-graph",
        action: "open_panel",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: WORKSTATION_OPEN_PANEL_CAPABILITY,
        action_kind: "open_panel",
        panel_id: "workstation-process-graph",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "open_panel",
          panel_id: "workstation-process-graph",
        },
        allowed_panel_ids: expect.arrayContaining(["docs-viewer", "scientific-calculator", "workstation-process-graph"]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks workstation panel actions for mutation-adjacent panels outside the safe allowlist", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: WORKSTATION_FOCUS_PANEL_CAPABILITY,
      arguments: {
        panel_id: "workstation-clipboard-history",
      },
      turnId: "ask:test:gateway-workstation-focus-panel-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: WORKSTATION_FOCUS_PANEL_CAPABILITY,
      error: "workstation_panel_not_in_safe_allowlist",
      gateway_admission: {
        requested_capability: WORKSTATION_FOCUS_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        blocked_reason: "workstation_panel_not_in_safe_allowlist",
      },
      observation_packet: {
        panel_id: "workstation",
        action: "focus_panel",
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "workstation_panel_not_in_safe_allowlist",
            repair_action: "ask_user",
          }),
        ],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "focus_panel",
        panel_id: null,
        status: "blocked",
        dispatch_status: "blocked",
        workstation_action: null,
        allowed_panel_ids: expect.not.arrayContaining(["workstation-clipboard-history", "workstation-notes"]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits docs-viewer.open_doc as a non-terminal action receipt under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: DOCS_OPEN_DOC_CAPABILITY,
      arguments: {
        path: "docs/helix-ask-codex-loop-discipline.md",
        anchor: "Patch-Time Contract",
      },
      turnId: "ask:test:gateway-docs-open-doc",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: DOCS_OPEN_DOC_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: DOCS_OPEN_DOC_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: DOCS_OPEN_DOC_CAPABILITY,
        panel_id: "docs-viewer",
        action: "open_doc",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: DOCS_OPEN_DOC_CAPABILITY,
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        status: "succeeded",
        dispatch_status: "admitted",
        path: "docs/helix-ask-codex-loop-discipline.md",
        anchor: "Patch-Time Contract",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path: "docs/helix-ask-codex-loop-discipline.md",
            anchor: "Patch-Time Contract",
          },
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks docs-viewer.open_doc when no safe docs path was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: DOCS_OPEN_DOC_CAPABILITY,
      arguments: {
        path: "../server/index.ts",
      },
      turnId: "ask:test:gateway-docs-open-doc-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: DOCS_OPEN_DOC_CAPABILITY,
      error: "docs_open_doc_path_missing_or_unsafe",
      gateway_admission: {
        requested_capability: DOCS_OPEN_DOC_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        blocked_reason: "docs_open_doc_path_missing_or_unsafe",
      },
      observation_packet: {
        panel_id: "docs-viewer",
        action: "open_doc",
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "docs_open_doc_path_missing_or_unsafe",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        status: "blocked",
        dispatch_status: "blocked",
        workstation_action: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks unsupported calculator expressions as non-terminal observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: {
        expression: "process.exit()",
      },
      turnId: "ask:test:gateway-calculator-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "unsupported_expression_syntax",
      gateway_admission: {
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "unsupported_expression_syntax",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        admitted_capability: null,
        executed_capability: null,
        lifecycle_stage: "blocked",
        status: "blocked",
        failure_reason: "unsupported_expression_syntax",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        next_action: "ask_user",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: false,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls repo.search as read-only repo evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {
        query: "workspace_os.status",
        paths: ["server/services/helix-ask"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-repo-search",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: REPO_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: REPO_SEARCH_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: REPO_SEARCH_CAPABILITY,
        panel_id: "repo-evidence",
        action: "search",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("falls back to bounded Node repo search when ripgrep is unavailable", async () => {
    process.env.RG_BIN = "__helix_missing_rg_binary__";
    process.env.PATH = "";
    process.env.Path = "";

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {
        query: "workspace_os.status",
        paths: ["server/services/helix-ask"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-repo-search-node-fallback",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      error: undefined,
      observation_packet: {
        status: "succeeded",
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        status: "succeeded",
        search_backend: "node_fallback",
        search_backend_bin: null,
        search_backend_reason: "ripgrep_not_found",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("blocks missing repo.search query as a non-terminal observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-repo-search-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "missing_query",
      gateway_admission: {
        requested_capability: REPO_SEARCH_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "missing_query",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls docs.search as read-only docs evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "Helix Ask remains the grounded reasoning surface",
        paths: ["docs"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-docs-search",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: DOCS_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: DOCS_SEARCH_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: DOCS_SEARCH_CAPABILITY,
        panel_id: "docs-viewer",
        action: "search_docs",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask remains the grounded reasoning surface",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("falls back to bounded Node docs search when ripgrep is unavailable", async () => {
    process.env.RG_BIN = "__helix_missing_rg_binary__";
    process.env.PATH = "";
    process.env.Path = "";

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "Helix Ask remains the grounded reasoning surface",
        paths: ["docs"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-docs-search-node-fallback",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      error: undefined,
      observation_packet: {
        status: "succeeded",
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask remains the grounded reasoning surface",
        status: "succeeded",
        search_backend: "node_fallback",
        search_backend_bin: null,
        search_backend_reason: "ripgrep_not_found",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("blocks missing docs.search query as a non-terminal observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-docs-search-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "missing_query",
      gateway_admission: {
        requested_capability: DOCS_SEARCH_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "missing_query",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("rejects unknown capabilities as non-terminal failed observations", async () => {
    const result = await callWorkstationGatewayCapability({
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:gateway",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "capability_not_registered",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "capability_not_registered",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: "filesystem.write_file",
        admitted_capability: null,
        executed_capability: "filesystem.write_file",
        lifecycle_stage: "failed",
        status: "failed",
        failure_reason: "capability_not_registered",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        next_action: "retry",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: false,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet.status).toBe("failed");
  });
});
