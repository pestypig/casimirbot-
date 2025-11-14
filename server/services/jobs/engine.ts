import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import crypto from "node:crypto";
import type { Job } from "@shared/jobs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const jobCreatedListeners = new Set<(job: Job) => void>();

const notifyJobCreated = (job: Job): void => {
  if (!jobCreatedListeners.size) {
    return;
  }
  for (const listener of jobCreatedListeners) {
    try {
      listener(job);
    } catch (err) {
      console.error("[jobs] job listener failed", err);
    }
  }
};

export const onJobCreated = (listener: (job: Job) => void): (() => void) => {
  jobCreatedListeners.add(listener);
  return () => jobCreatedListeners.delete(listener);
};

const safeRead = (p: string): string => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
};

const makeId = (seed: string) => crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16);

function rewardFor(priority: "low" | "medium" | "high"): number {
  switch (priority) {
    case "high":
      return 400;
    case "medium":
      return 200;
    default:
      return 100;
  }
}

function parseEssenceGapReport(): Job[] {
  const doc = path.join(repoRoot, "docs", "ESSENCE-CONSOLE_GAP-REPORT.md");
  const text = safeRead(doc);
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const jobs: Job[] = [];
  // crude table parse: rows like `| 1 | Capability | Status | Evidence | Why | Patch |`
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cols = line.split("|").map((c) => c.trim());
    if (cols.length < 7) continue;
    const idx = cols[1];
    const capability = cols[2];
    const status = cols[3]?.toLowerCase();
    const evidence = cols[4] ?? "";
    const why = cols[5] ?? "";
    const patch = cols[6] ?? "";
    if (!capability || capability.toLowerCase() === "capability") continue;
    const isMissing = status.includes("missing");
    const isPartial = status.includes("partial");
    const priority: "low" | "medium" | "high" = isMissing ? "high" : isPartial ? "medium" : "low";
    const paths = Array.from(evidence.matchAll(/`([^`]+)`/g)).map((m) => m[1]).filter(Boolean);
    const id = makeId(`gap:${idx}:${capability}`);
    jobs.push({
      id,
      title: `Essence: ${capability}`,
      description: [why, patch].filter(Boolean).join("\n\n"),
      kind: "code",
      priority,
      source: "docs:essence-gap-report",
      rewardTokens: rewardFor(priority) + 50,
      paths,
      tags: ["essence", "console"],
      status: "open",
      createdAt: Date.now(),
    });
  }
  return jobs;
}

function parseEssencePatchPlan(): Job[] {
  const doc = path.join(repoRoot, "docs", "ESSENCE-CONSOLE_PATCH-PLAN.md");
  const text = safeRead(doc);
  if (!text) return [];
  const jobs: Job[] = [];
  const prBlocks = Array.from(text.matchAll(/##\s+(PR-[A-Z]+\d+)\s+�?\s+([^\n]+)/g));
  for (const match of prBlocks) {
    const code = match[1];
    const title = match[2];
    const sectionStart = match.index ?? 0;
    const section = text.slice(sectionStart, text.indexOf("\n## ", sectionStart + 1) === -1 ? text.length : text.indexOf("\n## ", sectionStart + 1));
    const files = Array.from(section.matchAll(/`([^`]+\.(?:ts|tsx|md))`/g)).map((m) => m[1]);
    const priority: "low" | "medium" | "high" = title.toLowerCase().includes("trace") || title.toLowerCase().includes("policy") ? "high" : "medium";
    jobs.push({
      id: makeId(`plan:${code}`),
      title: `${code}: ${title.trim()}`,
      description: section.split("\n\n").slice(0, 3).join("\n\n").trim(),
      kind: "code",
      priority,
      source: "docs:essence-patch-plan",
      rewardTokens: rewardFor(priority) + 100,
      paths: files,
      tags: ["patch-plan", code],
      status: "open",
      createdAt: Date.now(),
    });
  }
  return jobs;
}

function parseAlcubierreAlignment(): Job[] {
  const doc = path.join(repoRoot, "docs", "alcubierre-alignment.md");
  const text = safeRead(doc);
  if (!text) return [];
  const goals = [
    {
      title: "Define warp bubble metrics in live bus data",
      detail: "Add measurement/export of theta and T^{00} into live telemetry and HUD panels.",
      tags: ["warp", "metrics", "hud"],
    },
    {
      title: "Align York time and toroidal T^{00} visuals to canonical targets",
      detail: "Ensure fore/aft sign test on theta and toroidal node on axis for T^{00}; document parameters (R, sigma).",
      tags: ["warp", "alignment", "visuals"],
    },
    {
      title: "Add Nat�rio zero-expansion control",
      detail: "Implement divergence-free shift as control; confirm theta ~ 0 across grid.",
      tags: ["warp", "natario"],
    },
  ];
  return goals.map((g, i) => ({
    id: makeId(`alc:${i}:${g.title}`),
    title: g.title,
    description: g.detail + "\n\nSource: docs/alcubierre-alignment.md",
    kind: "research",
    priority: i === 0 ? "high" : "medium",
    source: "docs:alcubierre-alignment",
    rewardTokens: rewardFor(i === 0 ? "high" : "medium") + 50,
    paths: ["docs/alcubierre-alignment.md"],
    tags: g.tags,
    status: "open",
    createdAt: Date.now(),
  }));
}

function scanRepoTodos(): Job[] {
  const patterns = ["client/src/**/*.ts", "client/src/**/*.tsx", "server/**/*.ts", "shared/**/*.ts", "docs/**/*.md"];
  const files = fg.sync(patterns, { cwd: repoRoot, absolute: true, ignore: ["**/node_modules/**", "**/dist/**"] });
  const jobs: Job[] = [];
  for (const file of files.slice(0, 500)) { // cap for performance
    const rel = path.relative(repoRoot, file).replaceAll("\\", "/");
    const text = safeRead(file);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes("TODO") || line.includes("FIXME")) {
        const kind = line.includes("FIXME") ? "code" : "code" as const;
        const priority: "low" | "medium" | "high" = line.toLowerCase().includes("fixme") ? "high" : "low";
        jobs.push({
          id: makeId(`todo:${rel}:${idx}`),
          title: `${line.includes("FIXME") ? "FIXME" : "TODO"} in ${rel}:${idx + 1}`,
          description: line.trim().slice(0, 240),
          kind,
          priority,
          source: line.includes("FIXME") ? "repo:fixme" : "repo:todo",
          rewardTokens: rewardFor(priority),
          paths: [rel],
          tags: ["repo"],
          status: "open",
          createdAt: Date.now(),
        });
      }
    });
  }
  return jobs;
}

let lastGen = 0;
let cachedJobs: Job[] = [];
const userJobs: Job[] = [];

export function discoverJobs(): { jobs: Job[]; generatedAt: number } {
  const ts = Date.now();
  // regenerate at most once per 15 minutes
  if (ts - lastGen < 15 * 60 * 1000 && cachedJobs.length) {
    return { jobs: cachedJobs, generatedAt: lastGen };
  }
  const jobs = [
    ...parseEssenceGapReport(),
    ...parseEssencePatchPlan(),
    ...parseAlcubierreAlignment(),
    ...scanRepoTodos(),
    ...userJobs,
  ];
  // de-dup by id
  const uniq = new Map<string, Job>();
  for (const j of jobs) uniq.set(j.id, j);
  cachedJobs = Array.from(uniq.values());
  lastGen = ts;
  return { jobs: cachedJobs, generatedAt: lastGen };
}

export function addUserJob(job: Job): void {
  // de-dup by id
  const idx = userJobs.findIndex((j) => j.id === job.id);
  const exists = idx >= 0;
  if (exists) {
    userJobs[idx] = job;
  } else {
    userJobs.push(job);
    notifyJobCreated(job);
  }
  // bust cache so discoverJobs will include it immediately
  lastGen = 0;
}
