import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import type { EssenceProposal, ProposalPromptPreset } from "@shared/proposals";
import { smallLlmPatchPromptPresets } from "../small-llm";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

export const KEYWORDS = ["physics", "warp", "alcubierre", "bubble", "pipeline", "md"];
export const GLOB_PATTERNS = [
  "**/*physics*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}",
  "**/*warp*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}",
  "**/*alcubierre*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}",
  "**/*bubble*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}",
  "**/*pipeline*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}",
];

export const IGNORE = ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/.cal/**", "**/.local/**"];

export const PATCH_PROMPT_FRAMEWORK = `
You are designing a Needle Hull Warp Bubble with a live energy pipeline that must feed a stable, adaptive field around a spacecraft.
Brainstorm detailed approaches to:
1. sourcing and buffering energy (fusion/antimatter staging, capacitors, superfluid reservoirs),
2. shaping and stabilizing the warp field geometry (needle vs. hybrid shapes, resonance dampening, self-healing meshes),
3. control and fault management (model-predictive control, disturbance rejection, graceful degradation paths),
4. thermal and structural stress mitigation during rapid maneuvers,
5. safety, redundancy, and watchdog interlocks, and
6. instrumentation, telemetry, and diagnostics (multi-sensor arrays, synchronized probes).
For each area, propose specific mechanisms, algorithms, and test/validation methods (simulation plus hardware-in-the-loop).
Include pros/cons, key risks, and how to measure stability, efficiency, and safety in real time.
Suggest concrete experiments, synthetic workloads, and metrics to validate the pipeline under edge cases.
`.trim();

type Callpoint = {
  path: string;
  updatedAt: string;
  snippet: string;
};

const collectTargetPaths = (proposal: EssenceProposal): string[] => {
  if (proposal.target.type === "backend-file") {
    return [proposal.target.path];
  }
  if (proposal.target.type === "backend-multi") {
    return proposal.target.paths;
  }
  return [];
};

const extractSnippet = (absPath: string): string => {
  try {
    const text = fs.readFileSync(absPath, "utf8");
    const lines = text.split(/\r?\n/);
    const hits = lines.filter((line) => KEYWORDS.some((kw) => line.toLowerCase().includes(kw))).slice(0, 3);
    const source = hits.length ? hits : lines.slice(0, 3);
    return source.join(" ").replace(/\s+/g, " ").trim().slice(0, 220);
  } catch {
    return "";
  }
};

const collectCallpoints = (proposal: EssenceProposal, limit = 8): Callpoint[] => {
  const targetPaths = collectTargetPaths(proposal)
    .map((p) => path.resolve(repoRoot, p))
    .filter((p) => p.startsWith(repoRoot));

  const focusGlobs = targetPaths
    .map((p) => path.dirname(p))
    .map((dir) => path.relative(repoRoot, dir))
    .filter(Boolean)
    .map((rel) => `${rel.replace(/\\/g, "/")}/**/*.{ts,tsx,js,jsx,md,mdx,py,cpp,c,hpp}`);

  const patterns = [...new Set([...focusGlobs, ...GLOB_PATTERNS])];
  const files = fg.sync(patterns, { cwd: repoRoot, absolute: true, ignore: IGNORE });
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
      snippet: extractSnippet(record.abs),
    });
    if (callpoints.length >= limit) break;
  }
  return callpoints;
};

export async function buildPatchPromptPresets(
  proposal: EssenceProposal,
  limit = 3,
): Promise<ProposalPromptPreset[]> {
  if (proposal.patchKind !== "code-diff") {
    return [];
  }
  const callpoints = collectCallpoints(proposal, Math.max(limit * 3, 8));
  const repoContext = callpoints.length
    ? callpoints.map((cp) => `- ${cp.path} (${cp.updatedAt}): ${cp.snippet}`).join("\n")
    : "No recent physics/warp call points detected; focus on telemetry, pipeline stability, and repo experiments.";
  const targetPaths = collectTargetPaths(proposal);
  const { presets } = await smallLlmPatchPromptPresets({
    basePrompt: PATCH_PROMPT_FRAMEWORK,
    proposalTitle: proposal.title,
    repoContext,
    targetPaths,
    limit,
  });
  return presets;
}
