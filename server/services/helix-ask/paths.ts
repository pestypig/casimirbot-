import * as fs from "node:fs";
import * as path from "node:path";

const FILE_PATH_PATTERN =
  /(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+\.(?:tsx|ts|jsx|js|md|json|yml|yaml|mjs|cjs)|(?:gate|certificate):[a-z0-9_.:-]+/gi;

function normalizePathCandidate(match: string): string {
  if (!match || /^(gate|certificate):/i.test(match)) {
    return match;
  }
  const normalized = match.replace(/\\/g, "/");
  const fullPath = path.resolve(process.cwd(), normalized);
  if (fs.existsSync(fullPath)) {
    return normalized;
  }
  // Some model outputs drift from .json -> .js. If the .json exists, prefer it.
  if (normalized.endsWith(".js")) {
    const jsonVariant = `${normalized.slice(0, -3)}.json`;
    const jsonFullPath = path.resolve(process.cwd(), jsonVariant);
    if (fs.existsSync(jsonFullPath)) {
      return jsonVariant;
    }
  }
  return normalized;
}

export function extractFilePathsFromText(value: string): string[] {
  if (!value) return [];
  const matches = value.match(FILE_PATH_PATTERN) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of matches) {
    const normalized = normalizePathCandidate(match);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
