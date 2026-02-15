import type { RuntimeLane } from "./frame-contract";

export type RuntimeTaskClass = "REALTIME" | "BACKGROUND" | "CRITICAL";

export type ToolMeta = {
  id: string;
  lane: RuntimeLane;
  defaultClass: RuntimeTaskClass;
  hardTimeoutMs: number;
  budgetWeight: number;
  canDegradeTo?: string;
};

const TOOL_REGISTRY: Record<string, ToolMeta> = {
  "repo.search": {
    id: "repo.search",
    lane: "io",
    defaultClass: "REALTIME",
    hardTimeoutMs: 900,
    budgetWeight: 2,
  },
  "graph.resolver": {
    id: "graph.resolver",
    lane: "io",
    defaultClass: "REALTIME",
    hardTimeoutMs: 700,
    budgetWeight: 1,
  },
  "vision.http": {
    id: "vision.http",
    lane: "perception",
    defaultClass: "BACKGROUND",
    hardTimeoutMs: 1200,
    budgetWeight: 3,
  },
  "stt.whisper": {
    id: "stt.whisper",
    lane: "perception",
    defaultClass: "REALTIME",
    hardTimeoutMs: 650,
    budgetWeight: 2,
  },
  "tts.local": {
    id: "tts.local",
    lane: "media",
    defaultClass: "REALTIME",
    hardTimeoutMs: 650,
    budgetWeight: 1,
  },
  "diffusion.loop": {
    id: "diffusion.loop",
    lane: "media",
    defaultClass: "BACKGROUND",
    hardTimeoutMs: 5000,
    budgetWeight: 8,
  },
};

export const getToolMeta = (id: string): ToolMeta | undefined => TOOL_REGISTRY[id];

export const listToolMeta = (): ToolMeta[] => Object.values(TOOL_REGISTRY);
