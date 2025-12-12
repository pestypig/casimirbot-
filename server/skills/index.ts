import type { Tool, ToolManifestEntry } from "@shared/skills";

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

export function listTools(): ToolManifestEntry[] {
  return [...REGISTRY.values()].map((tool) => ({
    name: tool.name,
    desc: tool.desc,
    deterministic: tool.deterministic,
    rateLimit: tool.rateLimit,
    health: tool.health,
  }));
}
