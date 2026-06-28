import { describe, expect, it } from "vitest";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../registry";

const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";

describe("Helix workstation tool gateway", () => {
  it("lists read-only non-terminal workstation capabilities", () => {
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });

    expect(manifest).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
      manifest_version: "read-observe.v1",
      agent_runtime: "codex",
      mode: "observe",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_SEARCH_CAPABILITY,
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
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
      manifest_version: "read-observe.v1",
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
        query: "Helix Ask",
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
        query: "Helix Ask",
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
