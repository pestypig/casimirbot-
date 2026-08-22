import crypto from "node:crypto";
import type { HelixWorkstationCapabilityManifest } from "../../workstation-tool-gateway/types";

export const HELIX_CODEX_ROUTE_PROPOSAL_TOOL = "helix_propose_workstation_route";

export type CodexNativeDynamicToolSpec = {
  type: "function";
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  deferLoading: false;
};

export type CodexNativeDynamicToolCatalog = {
  specs: CodexNativeDynamicToolSpec[];
  capabilityIdByToolName: Map<string, string>;
  toolNameByCapabilityId: Map<string, string>;
};

const dynamicToolNameForCapability = (capabilityId: string): string => {
  const slug = capabilityId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 38);
  const hash = crypto.createHash("sha256").update(capabilityId).digest("hex").slice(0, 10);
  return `helix_${slug || "capability"}_${hash}`;
};

export const buildCodexNativeDynamicToolCatalog = (
  capabilities: HelixWorkstationCapabilityManifest[],
): CodexNativeDynamicToolCatalog => {
  const capabilityIdByToolName = new Map<string, string>();
  const toolNameByCapabilityId = new Map<string, string>();
  const specs: CodexNativeDynamicToolSpec[] = [];

  for (const capability of capabilities) {
    const toolName = dynamicToolNameForCapability(capability.capability_id);
    if (capabilityIdByToolName.has(toolName)) {
      throw new Error(`Codex native dynamic tool name collision for ${capability.capability_id}.`);
    }
    capabilityIdByToolName.set(toolName, capability.capability_id);
    toolNameByCapabilityId.set(capability.capability_id, toolName);
    specs.push({
      type: "function",
      name: toolName,
      description: [
        capability.description,
        `Helix capability: ${capability.capability_id}.`,
        "Selecting this tool is the Runtime Codex route proposal; Helix atomically validates admission before execution.",
        "The result is a non-terminal observation and must be used in a later model reasoning step.",
      ].join(" "),
      inputSchema: capability.input_schema,
      deferLoading: false,
    });
  }

  return { specs, capabilityIdByToolName, toolNameByCapabilityId };
};
