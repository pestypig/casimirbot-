import { describe, expect, it } from "vitest";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../registry";

const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";

describe("Helix workstation tool gateway provider parity", () => {
  it("exposes the same read/observe manifest to Helix, Codex, and Future providers", () => {
    const helixManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "helix",
      mode: "observe",
    });
    const codexManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });
    const futureManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "future",
      mode: "observe",
    });

    expect(helixManifest.manifest_version).toBe("read-observe.v1");
    expect(codexManifest.manifest_version).toBe("read-observe.v1");
    expect(futureManifest.manifest_version).toBe("read-observe.v1");
    expect(codexManifest.capabilities.map((capability) => capability.capability_id)).toEqual(
      helixManifest.capabilities.map((capability) => capability.capability_id),
    );
    expect(futureManifest.capabilities.map((capability) => capability.capability_id)).toEqual(
      helixManifest.capabilities.map((capability) => capability.capability_id),
    );
    for (const capability of codexManifest.capabilities) {
      expect(capability).toMatchObject({
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: expect.stringMatching(/^helix\..+_observation\.v1$/),
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(["observe", "read"]).toContain(capability.mode);
    }
  });

  it.each([
    [HELIX_WORKSPACE_OS_STATUS_CAPABILITY, { capability_ids: ["runtime.memory"] }],
    [CALCULATOR_SOLVE_EXPRESSION_CAPABILITY, { expression: "4 * 5" }],
    [REPO_SEARCH_CAPABILITY, { query: "workspace_os.status", paths: ["server/services/helix-ask"], max_hits: 2 }],
    [DOCS_SEARCH_CAPABILITY, { query: "Helix Ask", paths: ["docs"], max_hits: 2 }],
  ])("keeps %s non-terminal for Helix, Codex, and Future", async (capabilityId, args) => {
    const helixResult = await callWorkstationGatewayCapability({
      agentRuntime: "helix",
      mode: "read",
      capabilityId,
      arguments: args,
      turnId: `ask:test:provider-parity:helix:${capabilityId}`,
    });
    const codexResult = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId,
      arguments: args,
      turnId: `ask:test:provider-parity:codex:${capabilityId}`,
    });
    const futureResult = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "read",
      capabilityId,
      arguments: args,
      turnId: `ask:test:provider-parity:future:${capabilityId}`,
    });

    expect(codexResult.ok).toBe(helixResult.ok);
    expect(futureResult.ok).toBe(helixResult.ok);
    expect(codexResult.capability_id).toBe(helixResult.capability_id);
    expect(futureResult.capability_id).toBe(helixResult.capability_id);
    expect(codexResult.observation_packet.capability_key).toBe(helixResult.observation_packet.capability_key);
    expect(futureResult.observation_packet.capability_key).toBe(helixResult.observation_packet.capability_key);
    expect(codexResult.gateway_admission.selected_agent_provider).toBe("codex");
    expect(futureResult.gateway_admission.selected_agent_provider).toBe("future");
    expect(helixResult.gateway_admission.selected_agent_provider).toBe("helix");
    for (const result of [helixResult, codexResult, futureResult]) {
      expect(result).toMatchObject({
        manifest_version: "read-observe.v1",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        tool_lifecycle_trace: {
          schema: "helix.tool_lifecycle_trace.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_followup_decision: {
          schema: "helix.tool_followup_decision.v1",
          next_action: "continue_reasoning",
          evidence_reentered: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      });
    }
  });

  it("blocks unavailable mutating capabilities the same way for Helix, Codex, and Future", async () => {
    const helixResult = await callWorkstationGatewayCapability({
      agentRuntime: "helix",
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:provider-parity:helix:write",
    });
    const codexResult = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:provider-parity:codex:write",
    });
    const futureResult = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:provider-parity:future:write",
    });

    expect(codexResult.error).toBe("capability_not_registered");
    expect(helixResult.error).toBe("capability_not_registered");
    expect(futureResult.error).toBe("capability_not_registered");
    for (const result of [helixResult, codexResult, futureResult]) {
      expect(result).toMatchObject({
        ok: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        tool_lifecycle_trace: {
          schema: "helix.tool_lifecycle_trace.v1",
          lifecycle_stage: "failed",
          status: "failed",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        tool_followup_decision: {
          schema: "helix.tool_followup_decision.v1",
          next_action: "retry",
          evidence_reentered: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      });
    }
  });
});
