import * as fs from "node:fs";
import * as path from "node:path";
import { AnchoredAnswer, AnchorConfig, AnchorMode, VerificationResult } from "./types";
import { loadIdeologyIdSet } from "./ideologyIndex";

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

function uniqByPath<T extends { path: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = normalizeRelativePath(item.path);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function verifyAnchoredAnswer(args: {
  repoRoot: string;
  mode: AnchorMode;
  cfg: AnchorConfig;
  answer: AnchoredAnswer;
}): VerificationResult {
  const { repoRoot, mode, cfg } = args;
  const warnings: string[] = [];
  const errors: string[] = [];

  const behavior = cfg.anchors.modePolicy[mode]?.missingAnchorBehavior ?? "warn-and-drop";
  const sanitized: AnchoredAnswer = JSON.parse(JSON.stringify(args.answer));

  if (sanitized.architectureAnchors?.length) {
    sanitized.architectureAnchors = uniqByPath(sanitized.architectureAnchors).filter((anchor) => {
      const okRoot = isWithinAllowedRoots(anchor.path, cfg.security.allowedAnchorRoots);
      if (!okRoot) {
        const msg = `Architecture anchor not allowed by roots: ${anchor.path}`;
        if (behavior === "error") errors.push(msg);
        else warnings.push(msg);
        return false;
      }

      const okExists = exists(repoRoot, anchor.path);
      if (!okExists) {
        const msg = `Architecture anchor path does not exist: ${anchor.path}`;
        if (behavior === "error") errors.push(msg);
        else warnings.push(msg);
        return false;
      }
      return true;
    });
  }

  if (sanitized.ideologyAnchors?.length) {
    try {
      const idSet = loadIdeologyIdSet(repoRoot, cfg.ideology.ideologyJsonPath);
      sanitized.ideologyAnchors = sanitized.ideologyAnchors.filter((anchor) => {
        const ok = idSet.has(anchor.nodeId);
        if (!ok) {
          const msg = `Ideology nodeId not found in ideology.json: ${anchor.nodeId}`;
          if (behavior === "error") errors.push(msg);
          else warnings.push(msg);
          return false;
        }
        return true;
      });
    } catch (error) {
      const msg = `Failed to load/parse ideology.json at ${cfg.ideology.ideologyJsonPath}`;
      if (behavior === "error") errors.push(msg);
      else warnings.push(msg);

      if (behavior !== "error") sanitized.ideologyAnchors = [];
    }
  }

  const architectureCount = sanitized.architectureAnchors?.length ?? 0;
  const ideologyCount = sanitized.ideologyAnchors?.length ?? 0;
  const total = architectureCount + ideologyCount;

  if (total > cfg.anchors.maxPerAnswer) {
    warnings.push(
      `Too many anchors (${total}); trimming to maxPerAnswer=${cfg.anchors.maxPerAnswer}.`
    );

    const max = cfg.anchors.maxPerAnswer;
    const keepArchitecture = Math.min(architectureCount, max);
    const remaining = max - keepArchitecture;

    sanitized.architectureAnchors = (sanitized.architectureAnchors ?? []).slice(0, keepArchitecture);
    sanitized.ideologyAnchors = (sanitized.ideologyAnchors ?? []).slice(0, remaining);
  }

  if (mode === "chat") {
    const haveAnchors =
      (sanitized.architectureAnchors?.length ?? 0) + (sanitized.ideologyAnchors?.length ?? 0) > 0;
    if (!haveAnchors && !sanitized.clarifier) {
      sanitized.clarifier =
        "Which part of the repo is this about (server, ui, sdk, cli, warp-web, simulations)? If you name the subsystem, I can anchor to the right modules and docs.";
    }
  }

  sanitized.meta = sanitized.meta ?? {};
  sanitized.meta.warnings = [...(sanitized.meta.warnings ?? []), ...warnings];

  const ok = errors.length === 0;
  return { ok, warnings, errors, sanitized };
}
