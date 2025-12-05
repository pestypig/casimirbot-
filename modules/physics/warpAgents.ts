import fs from "node:fs/promises";
import path from "node:path";

export interface WarpAgentsConstraint {
  id: string;
  severity: "HARD" | "SOFT";
  description: string;
  type: "inequality" | "threshold" | "band" | string;
  expression: string;
}

export interface WarpAgentsConfig {
  version: number;
  constraints: WarpAgentsConstraint[];
  requiredTests: string[];
  viabilityPolicy: {
    admissibleStatus: "ADMISSIBLE";
    allowMarginalAsViable: boolean;
    treatMissingCertificateAsNotCertified: boolean;
  };
  searchDefaults: {
    maxSamples: number;
    concurrency: number;
    topK: number;
  };
}

const DEFAULT_LOCATIONS = ["WARP_AGENTS.md", path.join("docs", "physics", "WARP_AGENTS.md")];

let cached: WarpAgentsConfig | null = null;

const extractJsonBlock = (text: string): any => {
  const match = text.match(/```json\s+warp-agents\s*([\s\S]*?)```/i);
  if (!match) {
    throw new Error("No warp-agents JSON block found in WARP_AGENTS.md");
  }
  return JSON.parse(match[1]);
};

export async function loadWarpAgentsConfig(rootDir = process.cwd()): Promise<WarpAgentsConfig> {
  if (cached) return cached;

  const errors: string[] = [];
  for (const relPath of DEFAULT_LOCATIONS) {
    const filePath = path.resolve(rootDir, relPath);
    try {
      const text = await fs.readFile(filePath, "utf8");
      const json = extractJsonBlock(text);
      cached = json as WarpAgentsConfig;
      return cached;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${relPath}: ${message}`);
    }
  }

  throw new Error(
    `No warp agents config found. Tried: ${DEFAULT_LOCATIONS.join(", ")}${
      errors.length ? ` (${errors.join(" | ")})` : ""
    }`,
  );
}

export function resolveConstraintSeverity(
  config: WarpAgentsConfig,
  id: string,
  fallback: WarpAgentsConstraint["severity"],
): WarpAgentsConstraint["severity"] {
  const found = config.constraints.find((c) => c.id === id);
  return found?.severity ?? fallback;
}

export function findWarpConstraint(config: WarpAgentsConfig, id: string): WarpAgentsConstraint | undefined {
  return config.constraints.find((c) => c.id === id);
}

export function clearWarpAgentsCache(): void {
  cached = null;
}
