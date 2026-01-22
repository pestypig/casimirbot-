import type { AgiEvidence, AgiIntent, AgiTrajectory } from "@shared/agi-refinery";
import { normalizeEvidenceRef } from "./refinery-identity";

const normalizeText = (value?: string): string =>
  (value ?? "").trim().toLowerCase();

const normalizePath = (value?: string): string =>
  normalizeEvidenceRef(value) ?? "";

const estimateTokens = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

const surfaceFromPath = (path: string): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("client/")) return "client";
  if (path.startsWith("server/")) return "server";
  if (path.startsWith("shared/")) return "shared";
  if (path.startsWith("docs/") || path.endsWith(".md")) return "docs";
  if (path.startsWith("scripts/")) return "scripts";
  if (path.startsWith("modules/")) return "modules";
  if (
    path.includes("/__tests__/") ||
    path.includes(".spec.") ||
    path.includes(".test.")
  ) {
    return "tests";
  }
  return undefined;
};

const collectPaths = (
  evidence: AgiEvidence[],
  retrievalSelected?: AgiEvidence[],
  resourceHints?: string[],
): string[] => {
  const paths: string[] = [];
  for (const item of evidence) {
    if (item.path) paths.push(normalizePath(item.path));
  }
  for (const item of retrievalSelected ?? []) {
    if (item.path) paths.push(normalizePath(item.path));
  }
  for (const hint of resourceHints ?? []) {
    if (hint) paths.push(normalizePath(hint));
  }
  return paths.filter(Boolean);
};

const pickSurface = (paths: string[]): string | undefined => {
  if (paths.length === 0) return undefined;
  const counts: Record<string, number> = {};
  for (const path of paths) {
    const surface = surfaceFromPath(path) ?? "other";
    counts[surface] = (counts[surface] ?? 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0];
};

export const intentKey = (intent?: AgiIntent): string => {
  if (!intent) return "unknown";
  if ((intent as any).wantsWarp) return "warp";
  if ((intent as any).wantsPhysics) return "physics";
  if ((intent as any).wantsImplementation) return "implementation";
  return "general";
};

export const strategyKey = (trajectory: AgiTrajectory): string => {
  const strategy = trajectory.s?.trim();
  return strategy && strategy.length > 0 ? strategy : "unknown";
};

export const difficultyKey = (trajectory: AgiTrajectory): string => {
  const goal = normalizeText(trajectory.x);
  if (
    /\b(debug|bug|error|fail|fails|failing|exception|stack trace|not working|broken)\b/.test(
      goal,
    )
  ) {
    return "debugging";
  }
  if (/\b(refactor|cleanup|rewrite|migrate|restructure|rename)\b/.test(goal)) {
    return "refactor";
  }
  if (trajectory.meta?.testsRun) {
    return "refactor";
  }
  const evidenceCount =
    (trajectory.E?.length ?? 0) +
    (trajectory.meta?.retrievalSelected?.length ?? 0);
  const tokenEstimate =
    estimateTokens(trajectory.x ?? "") +
    estimateTokens(trajectory.y?.summary ?? trajectory.y?.text ?? "");
  if (evidenceCount >= 12 || tokenEstimate >= 800) return "multi_step";
  if (evidenceCount >= 4 || tokenEstimate >= 300) return "medium";
  return "short";
};

export const surfaceKey = (trajectory: AgiTrajectory): string => {
  const resourcePaths = collectPaths([], [], trajectory.meta?.resourceHints);
  const resourceSurface = pickSurface(resourcePaths);
  if (resourceSurface && resourceSurface !== "other") {
    return resourceSurface;
  }
  const evidencePaths = collectPaths(
    trajectory.E ?? [],
    trajectory.meta?.retrievalSelected,
  );
  const evidenceSurface = pickSurface(evidencePaths);
  if (evidenceSurface && evidenceSurface !== "other") {
    return evidenceSurface;
  }
  return "unknown";
};
