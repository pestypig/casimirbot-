import { describe, expect, it } from "vitest";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../registry";

describe("Helix workstation tool gateway", () => {
  it("lists read-only non-terminal workstation capabilities", () => {
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });

    expect(manifest).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
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
      ok: true,
      agent_runtime: "codex",
      capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
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

  it("rejects unknown capabilities as non-terminal failed observations", async () => {
    const result = await callWorkstationGatewayCapability({
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:gateway",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "capability_not_registered",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.status).toBe("failed");
  });
});
