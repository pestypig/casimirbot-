import * as fs from "node:fs";
import * as path from "node:path";

const FILE_PATH_PATTERN =
  /(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+\.(?:tsx|ts|jsx|js|md|json|yml|yaml|mjs|cjs)|(?:gate|certificate):[a-z0-9_.:-]+/gi;

const UI_COMPONENTS_PATH_PATTERNS: RegExp[] = [
  /client\/src\/components\//i,
  /client\/src\/pages\//i,
  /client\/src\/hooks\//i,
  /client\/src\/lib\//i,
  /client\/src\/assets\//i,
  /client\/src\/index\.css/i,
  /client\/src\/App\.tsx/i,
  /client\/src\/main\.tsx/i,
  /ui\//i,
];

export const UI_COMPONENTS_PATH_EVIDENCE_MISSING = "UI_COMPONENTS_PATH_EVIDENCE_MISSING" as const;

export type UiComponentsRoutingMetadata = {
  provenance_class: "inferred";
  claim_tier: "diagnostic";
  certifying: false;
};

export type UiComponentsPathEvidenceGate = {
  ok: boolean;
  fail_reason?: typeof UI_COMPONENTS_PATH_EVIDENCE_MISSING;
  routing_metadata?: UiComponentsRoutingMetadata;
};

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

function isUiComponentsPath(value: string): boolean {
  const normalized = value.replace(/\\/g, "/");
  return UI_COMPONENTS_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function evaluateUiComponentsPathEvidence(
  paths: string[],
  options?: { strict?: boolean },
): UiComponentsPathEvidenceGate {
  const hasUiEvidence = paths.some((entry) => isUiComponentsPath(entry));
  if (!hasUiEvidence) {
    if (options?.strict === true) {
      return { ok: false, fail_reason: UI_COMPONENTS_PATH_EVIDENCE_MISSING };
    }
    return { ok: true };
  }

  return {
    ok: true,
    routing_metadata: {
      provenance_class: "inferred",
      claim_tier: "diagnostic",
      certifying: false,
    },
  };
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
