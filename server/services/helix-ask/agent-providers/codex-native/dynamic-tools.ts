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

const routeProposalInputSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    schema: {
      type: "string",
      enum: ["helix.runtime_semantic_route_proposal.v1"],
    },
    turn_id: { type: "string" },
    proposal_id: { type: "string" },
    prompt_hash: { type: "string" },
    proposal_source: { type: "string", enum: ["agent_runtime"] },
    proposed_route: { type: ["string", "null"] },
    proposed_tool_family: { type: ["string", "null"] },
    proposed_capability_id: { type: ["string", "null"] },
    proposed_capability_ids: {
      type: "array",
      items: { type: "string" },
      maxItems: 32,
      description:
        "Ordered set of every model-visible Helix capability needed for this turn. Include proposed_capability_id as the first entry when it is non-null.",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high", "unknown"],
    },
    uncertainty: { type: "array", items: { type: "string" } },
    reason_summary: { type: "string" },
    supporting_hint_refs: { type: "array", items: { type: "string" } },
  },
  required: [
    "schema",
    "proposal_source",
    "proposed_route",
    "proposed_tool_family",
    "proposed_capability_id",
    "proposed_capability_ids",
    "confidence",
    "uncertainty",
    "reason_summary",
    "supporting_hint_refs",
  ],
  additionalProperties: false,
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
  const specs: CodexNativeDynamicToolSpec[] = [
    {
      type: "function",
      name: HELIX_CODEX_ROUTE_PROPOSAL_TOOL,
      description:
        "Propose the semantic workstation route before using any Helix capability. This is a proposal only; Helix performs route and tool admission.",
      inputSchema: routeProposalInputSchema,
      deferLoading: false,
    },
  ];

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
        "The result is a non-terminal observation and must be used in a later model reasoning step.",
      ].join(" "),
      inputSchema: capability.input_schema,
      deferLoading: false,
    });
  }

  return { specs, capabilityIdByToolName, toolNameByCapabilityId };
};
