import fs from "node:fs";
import path from "node:path";

import {
  buildWorkstationToolName,
  RETIRED_WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
} from "@shared/workstation-dynamic-tools";
import { describe, expect, it } from "vitest";

import { explicitCapabilityContractsForTests } from "../../explicit-capability-contract";
import {
  classifyDynamicWorkstationActionForProviderGateway,
  classifyProviderAgentCapability,
  PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS,
} from "../../provider-agent-capability-contract";
import { listWorkstationGatewayCapabilities } from "../registry";

const repoRoot = process.cwd();
const liveAgentStepPath = path.join(repoRoot, "shared", "helix-live-agent-step.ts");

const readLiveEnvironmentToolNames = (): string[] => {
  const source = fs.readFileSync(liveAgentStepPath, "utf8");
  const typeBlock = source.match(/export type HelixLiveEnvironmentToolName\s*=([\s\S]*?);/)?.[1] ?? "";
  const names = [...typeBlock.matchAll(/\|\s*"([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
  return [...new Set(names)].sort();
};

describe("provider-agent capability contract catalog", () => {
  it("classifies every Helix live-environment tool name for provider gateway graduation", () => {
    const missing = readLiveEnvironmentToolNames()
      .filter((toolName) => !classifyProviderAgentCapability(toolName));

    expect(missing).toEqual([]);
  });

  it("classifies every explicit live-environment capability contract", () => {
    const missing = explicitCapabilityContractsForTests
      .map((contract) => contract.capability)
      .filter((capability) => (
        capability.startsWith("live_env.") ||
        capability.startsWith("narrator.") ||
        capability.startsWith("narrator_")
      ))
      .filter((capability) => !classifyProviderAgentCapability(capability));

    expect(missing).toEqual([]);
  });

  it("keeps current workstation gateway capabilities shared across provider runtimes", () => {
    const gatewayCapabilities = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    }).capabilities;

    expect(gatewayCapabilities.length).toBeGreaterThan(0);
    for (const capability of gatewayCapabilities) {
      expect(classifyProviderAgentCapability(capability.capability_id)).toMatchObject({
        capability_id: capability.capability_id,
        surface: "workstation_gateway",
        availability: "shared_gateway_now",
        provider_availability: {
          helix_native: true,
          codex_workstation: true,
          future_provider: true,
        },
      });
    }
  });

  it("does not silently expose voice as a Codex gateway tool before receipt/confirmation contract graduation", () => {
    const gatewayIds = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "act",
    }).capabilities.map((capability) => capability.capability_id);

    expect(gatewayIds).not.toContain("live_env.request_interim_voice_callout");
    expect(gatewayIds).not.toContain("live_env.narrator_say");
    expect(classifyProviderAgentCapability("live_env.request_interim_voice_callout")).toMatchObject({
      availability: "requires_confirmation_contract",
      permission_class: "user_confirmed_side_effect",
      provider_availability: {
        helix_native: true,
        codex_workstation: false,
        future_provider: false,
      },
    });
    expect(classifyProviderAgentCapability("live_env.narrator_say")).toMatchObject({
      availability: "requires_confirmation_contract",
      permission_class: "user_confirmed_side_effect",
    });
  });

  it("classifies dynamic panel actions without treating them as provider gateway tools", () => {
    const gatewayIds = new Set(
      listWorkstationGatewayCapabilities({
        agentRuntime: "codex",
        mode: "act",
      }).capabilities.map((capability) => capability.capability_id),
    );

    for (const action of WORKSTATION_DYNAMIC_TOOL_ACTIONS) {
      const classification = classifyDynamicWorkstationActionForProviderGateway(action);
      expect(classification.capability_id).toBe(buildWorkstationToolName(action.panel_id, action.action_id));
      expect(classification.provider_availability.codex_workstation).toBe(false);
      expect(gatewayIds.has(classification.capability_id)).toBe(false);
      expect(classification.required_contract_before_gateway.length).toBeGreaterThan(0);
    }
    for (const action of RETIRED_WORKSTATION_DYNAMIC_TOOL_ACTIONS) {
      const classification = classifyDynamicWorkstationActionForProviderGateway(action, { retired: true });
      expect(classification.availability).toBe("legacy_dynamic_panel_only");
      expect(classification.provider_availability.codex_workstation).toBe(false);
    }
  });

  it("keeps classification records unique and non-terminal", () => {
    const ids = new Set<string>();
    for (const classification of PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS) {
      expect(ids.has(classification.capability_id)).toBe(false);
      ids.add(classification.capability_id);
      expect(classification.provider_availability.codex_workstation).toBe(false);
      expect(classification.required_contract_before_gateway.length).toBeGreaterThan(0);
    }
  });
});
