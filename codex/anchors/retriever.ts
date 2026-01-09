import * as fs from "node:fs";
import * as path from "node:path";
import { AnchorConfig, RetrieveCandidate } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function firstMatch(text: string, phrases: string[]): string | null {
  const normalized = normalize(text);
  for (const phrase of phrases) {
    if (normalized.includes(normalize(phrase))) return phrase;
  }
  return null;
}

function normalizeRelativePath(relPath: string): string {
  return relPath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isWithinAllowedRoots(relPath: string, allowedRoots: string[]): boolean {
  const p = normalizeRelativePath(relPath);
  return allowedRoots.some((root) => {
    const r = normalizeRelativePath(root);
    if (r.endsWith("/")) return p.startsWith(r);
    return p === r || p.startsWith(`${r}/`);
  });
}

function exists(repoRoot: string, relPath: string): boolean {
  const fullPath = path.resolve(repoRoot, relPath);
  return fs.existsSync(fullPath);
}

function uniqByPath(items: RetrieveCandidate[]): RetrieveCandidate[] {
  const seen = new Set<string>();
  const out: RetrieveCandidate[] = [];
  for (const item of items) {
    const key = normalizeRelativePath(item.path);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function retrieveCandidates(args: {
  userText: string;
  cfg: AnchorConfig;
  repoRoot: string;
  max?: number;
}): RetrieveCandidate[] {
  const { userText, cfg, repoRoot, max } = args;
  const candidates: RetrieveCandidate[] = [];

  for (const item of cfg.architecture.defaultBundle) {
    candidates.push({
      path: item.path,
      reason: item.why,
      source: "defaultBundle",
    });
  }

  for (const subsystem of cfg.architecture.subsystemRoots) {
    const match = firstMatch(userText, subsystem.keywords);
    if (!match) continue;
    for (const p of subsystem.paths) {
      candidates.push({
        path: p,
        reason: `Matched subsystem "${subsystem.name}" via keyword "${match}".`,
        source: "subsystemRoot",
      });
    }
  }

  for (const topic of cfg.architecture.topicBundles) {
    const match = firstMatch(userText, topic.keywords);
    if (!match) continue;
    for (const p of topic.paths) {
      candidates.push({
        path: p,
        reason: `Matched topic "${topic.name}" via keyword "${match}".`,
        source: "topicBundle",
      });
    }
  }

  const allowed = candidates.filter((item) =>
    isWithinAllowedRoots(item.path, cfg.security.allowedAnchorRoots)
  );
  const existing = allowed.filter((item) => exists(repoRoot, item.path));
  const unique = uniqByPath(existing);

  if (typeof max === "number" && max > 0) {
    return unique.slice(0, max);
  }

  return unique;
}
