import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import type { EssencePromptProfile, EssencePromptVariant } from "@shared/essence-prompts";
import { PATCH_PROMPT_FRAMEWORK, KEYWORDS, GLOB_PATTERNS, IGNORE } from "../proposals/prompt-presets";

type Callpoint = { path: string; updatedAt: string; snippet: string };

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const DEFAULT_PROFILE_ID = "essence-default";

const DEFAULT_PROFILE: EssencePromptProfile = {
  id: DEFAULT_PROFILE_ID,
  name: "Needle Hull Warp Bubble",
  baseTemplate: PATCH_PROMPT_FRAMEWORK,
  baseScript: "Conduct research and cite your sources inline; prefer grounded, testable steps and explicit safety checks.",
  isActive: true,
  keywords: KEYWORDS,
  globs: GLOB_PATTERNS,
  ignore: IGNORE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let profileState: EssencePromptProfile = { ...DEFAULT_PROFILE };
let variantsState: EssencePromptVariant[] = [];

const extractSnippet = (absPath: string, keywords: string[]): string => {
  try {
    const text = fs.readFileSync(absPath, "utf8");
    const lines = text.split(/\r?\n/);
    const hits = lines.filter((line) => keywords.some((kw) => line.toLowerCase().includes(kw))).slice(0, 3);
    const source = hits.length ? hits : lines.slice(0, 3);
    return source.join(" ").replace(/\s+/g, " ").trim().slice(0, 220);
  } catch {
    return "";
  }
};

export const collectPromptCallpoints = (targetPaths: string[] = [], limit = 10): Callpoint[] => {
  const keywords = profileState.keywords && profileState.keywords.length ? profileState.keywords : KEYWORDS;
  const globs = profileState.globs && profileState.globs.length ? profileState.globs : GLOB_PATTERNS;
  const ignore = profileState.ignore && profileState.ignore.length ? profileState.ignore : IGNORE;

  const focusGlobs = targetPaths
    .map((p) => path.resolve(repoRoot, p))
    .filter((p) => p.startsWith(repoRoot))
    .map((abs) => path.dirname(abs))
    .map((dir) => path.relative(repoRoot, dir))
    .filter(Boolean)
    .map((rel) => `${rel.replace(/\\/g, "/")}/**/*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}`);

  const patterns = [...new Set([...focusGlobs, ...globs])];
  const files = fg.sync(patterns, { cwd: repoRoot, absolute: true, ignore });

  const records = files
    .map((abs) => {
      try {
        const stat = fs.statSync(abs);
        return { abs, mtimeMs: stat.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is { abs: string; mtimeMs: number } => !!entry)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit * 2);

  const seen = new Set<string>();
  const callpoints: Callpoint[] = [];
  for (const record of records) {
    const relPath = path.relative(repoRoot, record.abs).replace(/\\/g, "/");
    if (seen.has(relPath)) continue;
    seen.add(relPath);
    callpoints.push({
      path: relPath,
      updatedAt: new Date(record.mtimeMs).toISOString(),
      snippet: extractSnippet(record.abs, keywords),
    });
    if (callpoints.length >= limit) break;
  }
  return callpoints;
};

const deriveDirections = (callpoints: Callpoint[]): string[] => {
  const fallback = [
    "Harden control/fault surfaces with telemetry-backed tests",
    "Probe thermal and stress edges during rapid maneuvers",
    "Tighten self-healing warp mesh guidance with diagnostics hooks",
  ];
  if (!callpoints.length) return fallback;
  const hints = callpoints.slice(0, 5).map((cp) => cp.path.split("/").slice(-2).join("/"));
  const unique = Array.from(new Set(hints)).filter(Boolean);
  return unique.slice(0, 3).map((hint, idx) => `Interrogate ${hint} for gaps (${fallback[idx % fallback.length]})`);
};

const buildPromptFromCallpoints = (
  profile: EssencePromptProfile,
  callpoints: Callpoint[],
  directions: string[],
): string => {
  const repoContext = callpoints.length
    ? callpoints.map((cp) => `- ${cp.path} (${cp.updatedAt}): ${cp.snippet || "…"}`).join("\n")
    : "- No recent warp/physics callpoints detected; stay telemetry-grounded.";
  return [
    profile.baseTemplate.trim(),
    "",
    "Nightly variation focus:",
    ...directions.map((d) => `- ${d}`),
    "",
    "Repo callpoints:",
    repoContext,
    "",
    "Base script (append verbatim):",
    profile.baseScript.trim(),
  ]
    .filter(Boolean)
    .join("\n");
};

const nowIso = () => new Date().toISOString();

export function listPromptProfiles(): EssencePromptProfile[] {
  return [profileState];
}

export function updatePromptProfile(
  id: string,
  patch: Partial<
    Pick<EssencePromptProfile, "name" | "baseTemplate" | "baseScript" | "isActive" | "keywords" | "globs" | "ignore">
  >,
): EssencePromptProfile | null {
  if (id !== profileState.id) return null;
  profileState = {
    ...profileState,
    ...patch,
    updatedAt: nowIso(),
  };
  return profileState;
}

export function listPromptVariants(profileId?: string): EssencePromptVariant[] {
  const targetId = profileId || profileState.id;
  return variantsState.filter((v) => v.profileId === targetId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function synthesizePromptVariant(
  profileId?: string,
  options?: { targetPaths?: string[] },
): Promise<EssencePromptVariant> {
  const profile = profileState;
  if (profileId && profileId !== profile.id) {
    throw new Error("prompt_profile_not_found");
  }
  try {
    const callpoints = collectPromptCallpoints(options?.targetPaths ?? [], 10);
    const directions = deriveDirections(callpoints);
    const strengths = callpoints.slice(0, 4).map((cp) => `Grounded in ${cp.path} (${cp.updatedAt})`);
    const weaknesses =
      callpoints.length >= 6
        ? callpoints.slice(4, 7).map((cp) => `Need coverage around ${cp.path}`)
        : ["Add more diagnostics for warp field stability", "Broaden TSN/telemetry fault injection coverage"];

    const finalPrompt = buildPromptFromCallpoints(profile, callpoints, directions);

    const variant: EssencePromptVariant = {
      id: `variant-${Date.now()}`,
      profileId: profile.id,
      finalPrompt,
      strengths,
      weaknesses,
      directions,
      createdAt: nowIso(),
      analysisSummary: `Callpoints: ${callpoints.length}; directions: ${directions.join(" | ")}`,
    };
    variantsState = [variant, ...variantsState].slice(0, 20);
    profileState = { ...profileState, lastRunAt: variant.createdAt, lastError: undefined };
    return variant;
  } catch (err) {
    profileState = { ...profileState, lastError: err instanceof Error ? err.message : String(err) };
    throw err;
  }
}
