import type { RuntimeLane } from "./frame-contract";

export type RuntimeTaskClass = "REALTIME" | "BACKGROUND" | "CRITICAL";

export type RuntimeToolMaturity = "diagnostic" | "reduced-order" | "certified";

export type RuntimeToolProvenance = {
  maturity: RuntimeToolMaturity;
  certifying: boolean;
  metadataComplete: boolean;
};

export type ToolMeta = {
  id: string;
  lane: RuntimeLane;
  defaultClass: RuntimeTaskClass;
  hardTimeoutMs: number;
  budgetWeight: number;
  canDegradeTo?: string;
  provenance?: RuntimeToolProvenance;
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



const applyConservativeProvenanceDefaults = (meta: ToolMeta): ToolMeta => {
  const provenance = meta.provenance;
  if (!provenance || !provenance.metadataComplete) {
    return {
      ...meta,
      provenance: {
        maturity: "diagnostic",
        certifying: false,
        metadataComplete: false,
      },
    };
  }

  return meta;
};

export const getToolMeta = (id: string): ToolMeta | undefined => {
  const meta = TOOL_REGISTRY[id];
  return meta ? applyConservativeProvenanceDefaults(meta) : undefined;
};

export const listToolMeta = (): ToolMeta[] =>
  Object.values(TOOL_REGISTRY).map((meta) => applyConservativeProvenanceDefaults(meta));
