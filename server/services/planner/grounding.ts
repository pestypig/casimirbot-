import path from "node:path";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { ResonanceBundle, ResonanceCollapse, ResonancePatch } from "@shared/code-lattice";
import type { GroundingReport, GroundingSource } from "@shared/grounding";
import type { LocalResourceHint } from "@shared/local-call-spec";

type GroundingHolder = { groundingReport?: GroundingReport };

const normalizePath = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value.replace(/\\/g, "/");
};

const keyForSource = (source: GroundingSource): string => {
  const kind = source.kind ?? "unknown";
  const id = source.id ?? "";
  const p = normalizePath(source.path) ?? "";
  return `${kind}:${id}:${p}`;
};

export const ensureGroundingReport = (holder: GroundingHolder): GroundingReport => {
  if (!holder.groundingReport) {
    holder.groundingReport = { sources: [] };
  }
  return holder.groundingReport;
};

export const pushGroundingSource = (holder: GroundingHolder, source?: GroundingSource | null): GroundingReport | undefined => {
  if (!source) return holder.groundingReport;
  const report = ensureGroundingReport(holder);
  const normalizedPath = normalizePath(source.path);
  const normalizedSource: GroundingSource = { ...source, path: normalizedPath };
  const key = keyForSource(normalizedSource);
  const exists = report.sources.some((entry) => keyForSource(entry) === key);
  if (!exists) {
    report.sources.push(normalizedSource);
  }
  return report;
};

export const seedWarpPaths = (hints?: LocalResourceHint[]): string[] => {
  const seeds = new Set<string>();
  const defaultWarpPaths = [
    "server/energy-pipeline.ts",
    "modules/warp",
    "modules/dynamic/natario-metric.ts",
    "server/services/target-validation.ts",
    "docs/alcubierre-alignment.md",
    "docs/papers/vanden-broeck-1999.md",
    "docs/casimir-tile-mechanism.md",
    "docs/qi-homogenization-addendum.md",
    "docs/theta-semantics.md",
    "docs/warp-pulsed-power.md",
  ];
  defaultWarpPaths.forEach((p) => seeds.add(p));
  if (hints) {
    for (const hint of hints) {
      if (hint.path) seeds.add(hint.path);
      if (hint.id) seeds.add(hint.id);
      if (hint.url) seeds.add(hint.url);
    }
  }
  return Array.from(seeds);
};

export const pushGroundingSources = (holder: GroundingHolder, sources: GroundingSource[]): GroundingReport | undefined => {
  let report: GroundingReport | undefined;
  for (const source of sources) {
    report = pushGroundingSource(holder, source);
  }
  return report;
};

const pickPatchFromBundle = ({
  bundle,
  selection,
}: {
  bundle?: ResonanceBundle | null;
  selection?: ResonanceCollapse | null;
}): ResonancePatch | null => {
  if (!bundle || !bundle.candidates || bundle.candidates.length === 0) {
    return null;
  }
  if (selection?.primaryPatchId) {
    const preferred = bundle.candidates.find((candidate) => candidate.id === selection.primaryPatchId);
    if (preferred) {
      return preferred;
    }
  }
  return bundle.candidates[0] ?? null;
};

export const recordResonancePatchSources = (
  holder: GroundingHolder,
  args: { bundle?: ResonanceBundle | null; selection?: ResonanceCollapse | null; filterNode?: (node: ResonancePatch["nodes"][number]) => boolean },
): GroundingReport | undefined => {
  const patch = pickPatchFromBundle({ bundle: args.bundle, selection: args.selection });
  if (!patch) {
    return holder.groundingReport;
  }
  const nodes = args.filterNode ? patch.nodes.filter(args.filterNode) : patch.nodes;
  if (!nodes || nodes.length === 0) {
    return holder.groundingReport;
  }
  const entries: GroundingSource[] = nodes.map((node) => ({
    kind: "resonance_patch",
    id: node.id ?? node.symbol,
    path: normalizePath(node.filePath),
    extra: { score: node.score, symbol: node.symbol, kind: node.kind },
  }));
  return pushGroundingSources(holder, entries);
};

const isDocPath = (value?: string): boolean => {
  if (!value) return false;
  const ext = path.extname(value).toLowerCase();
  return [".md", ".mdx", ".txt"].includes(ext);
};

export const recordKnowledgeSources = (
  holder: GroundingHolder,
  knowledgeContext?: KnowledgeProjectExport[],
): GroundingReport | undefined => {
  if (!knowledgeContext || knowledgeContext.length === 0) {
    return holder.groundingReport;
  }
  const entries: GroundingSource[] = [];
  for (const project of knowledgeContext) {
    for (const file of project.files ?? []) {
      const normalizedPath = normalizePath(file.path || file.name);
      const isDoc = isDocPath(normalizedPath) || file.mime?.toLowerCase().includes("markdown");
      entries.push({
        kind: isDoc ? "doc" : "repo_file",
        id: file.id,
        path: normalizedPath,
        extra: { projectId: project.project.id, kind: file.kind, mime: file.mime },
      });
    }
  }
  return pushGroundingSources(holder, entries);
};
