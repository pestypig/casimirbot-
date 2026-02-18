import { ToolProvenance, ToolRiskProfile, type Tool, type ToolManifestEntry } from "@shared/skills";

const REGISTRY = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  REGISTRY.set(tool.name, tool);
}

export function getTool(name: string): Tool | undefined {
  return REGISTRY.get(name);
}

export function unregisterTool(name: string): void {
  REGISTRY.delete(name);
}

const buildConservativeRisk = (tool: Tool) => ToolRiskProfile.parse(tool.risk ?? {});

const buildConservativeProvenance = (tool: Tool) => {
  const parsed = ToolProvenance.parse(tool.provenance ?? {});
  const hasExplicitRisk = tool.risk !== undefined;
  const hasExplicitProvenance = tool.provenance !== undefined;
  const metadataComplete = parsed.metadataComplete && hasExplicitRisk && hasExplicitProvenance;

  if (!metadataComplete) {
    return {
      ...parsed,
      maturity: "diagnostic" as const,
      certifying: false,
      metadataComplete: false,
      sourceClass: hasExplicitProvenance ? parsed.sourceClass : "inferred",
    };
  }

  return parsed;
};

export function listTools(): ToolManifestEntry[] {
  return [...REGISTRY.values()].map((tool) => ({
    name: tool.name,
    desc: tool.desc,
    deterministic: tool.deterministic,
    rateLimit: tool.rateLimit,
    health: tool.health,
    risk: buildConservativeRisk(tool),
    provenance: buildConservativeProvenance(tool),
  }));
}
