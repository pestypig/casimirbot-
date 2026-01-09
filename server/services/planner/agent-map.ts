import fs from "node:fs";
import path from "node:path";
import micromatch from "micromatch";
import { z } from "zod";

const AgentSchema = z.object({
  id: z.string().min(1),
  personaId: z.string().optional(),
  toolAllowList: z.array(z.string().min(1)).optional(),
  toolDenyList: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
});

const AgentMapSchema = z.object({
  version: z.number().int().positive(),
  agents: z.array(AgentSchema).default([]),
});

export type AgentProfile = z.infer<typeof AgentSchema>;
export type AgentMap = z.infer<typeof AgentMapSchema>;

const DEFAULT_MAP: AgentMap = {
  version: 1,
  agents: [{ id: "default", personaId: "default", toolAllowList: ["*"] }],
};

let cached: { mtimeMs: number; map: AgentMap } | null = null;

const resolveAgentMapPath = (): string =>
  path.resolve(process.cwd(), "configs", "agent-map.json");

export function loadAgentMap(): AgentMap {
  const configPath = resolveAgentMapPath();
  try {
    const stats = fs.statSync(configPath);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.map;
    }
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = AgentMapSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn("[agent-map] invalid config; using defaults");
      return DEFAULT_MAP;
    }
    cached = { mtimeMs: stats.mtimeMs, map: parsed.data };
    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[agent-map] failed to load config; using defaults", error);
    }
    return DEFAULT_MAP;
  }
}

export function resolveAgent(map: AgentMap, id?: string): AgentProfile | null {
  const key = (id ?? "").trim();
  if (!key) {
    return null;
  }
  return map.agents.find((agent) => agent.id === key) ?? null;
}

export function isToolAllowedForAgent(
  agent: AgentProfile,
  toolName: string,
): boolean {
  const deny = agent.toolDenyList ?? [];
  if (deny.length > 0 && micromatch.isMatch(toolName, deny)) {
    return false;
  }
  const allow = agent.toolAllowList ?? [];
  if (allow.length === 0) {
    return true;
  }
  return micromatch.isMatch(toolName, allow);
}
