import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fg from "fast-glob";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const clientSrcDir = path.join(repoRoot, "client", "src");
const manifestFiles = [
  path.join(clientSrcDir, "pages", "helix-core.panels.ts"),
  path.join(clientSrcDir, "lib", "desktop", "panelRegistry.ts"),
];

const interestingSegments = [
  "lib/",
  "hooks/",
  "store/",
  "physics/",
  "constants/",
  "services/",
  "workers/",
  "shared/",
  "modules/",
  "server/",
  "datasets/",
  "docs/",
];

const globPatterns = [
  "client/src/components/**/*Panel.tsx",
  "client/src/components/**/*HUD.tsx",
  "client/src/components/**/*Hud.tsx",
  "client/src/components/**/*View.tsx",
];

export interface PanelScanProposal {
  id: string;
  panelId: string;
  title: string;
  summary: string;
  description: string;
  componentPath: string;
  dataSources: string[];
}

const ttlMs = 10 * 60 * 1000;
let cached: PanelScanProposal[] = [];
let lastScan = 0;

export function scanForUnregisteredPanels(limit = 12): PanelScanProposal[] {
  const now = Date.now();
  if (cached.length && now - lastScan < ttlMs) {
    return cached.slice(0, limit);
  }
  const registered = gatherRegisteredComponentAliases();
  const files = fg.sync(globPatterns, {
    cwd: repoRoot,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });
  const proposals = files
    .map((filePath) => buildProposalForFile(filePath, registered))
    .filter((entry): entry is { proposal: PanelScanProposal; score: number } => !!entry)
    .sort((a, b) => (b.score === a.score ? a.proposal.title.localeCompare(b.proposal.title) : b.score - a.score))
    .map((entry) => entry.proposal);
  cached = proposals;
  lastScan = now;
  return proposals.slice(0, limit);
}

function gatherRegisteredComponentAliases(): Set<string> {
  const aliases = new Set<string>();
  for (const file of manifestFiles) {
    const text = safeRead(file);
    if (!text) continue;
    const regex = /import\((?:[^"']*)["'`](.+?)["'`]\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const alias = normalizeAlias(match[1]);
      if (alias) {
        aliases.add(alias);
      }
    }
  }
  return aliases;
}

function buildProposalForFile(filePath: string, registered: Set<string>): { proposal: PanelScanProposal; score: number } | null {
  const alias = fileToAlias(filePath);
  if (!alias || registered.has(alias)) {
    return null;
  }
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const componentName = path.basename(filePath).replace(/\.tsx$/, "");
  const panelId = toKebab(componentName);
  const dataSources = extractDataSources(filePath);
  const title = `${toHuman(componentName)} panel opportunity`;
  const summary = buildSummary(componentName, relPath, panelId, dataSources);
  const descriptionParts = [
    `Component: ${relPath}`,
    `Suggested panel id: ${panelId}`,
  ];
  if (dataSources.length) {
    descriptionParts.push(`Data sources:\n${dataSources.map((src) => `- ${src}`).join("\n")}`);
  }
  const proposal: PanelScanProposal = {
    id: makeId(relPath),
    panelId,
    title,
    summary,
    description: descriptionParts.join("\n\n"),
    componentPath: relPath,
    dataSources,
  };
  const score = computeScore(componentName, dataSources);
  return { proposal, score };
}

function extractDataSources(filePath: string): string[] {
  const text = safeRead(filePath);
  if (!text) return [];
  const regex = /from\s+["'`](.+?)["'`]/g;
  const sources = new Set<string>();
  let match: RegExpExecArray | null;
  const dir = path.dirname(filePath);
  while ((match = regex.exec(text))) {
    const normalized = normalizeImportSource(match[1], dir);
    if (!normalized) continue;
    if (interestingSegments.some((seg) => normalized.includes(seg))) {
      sources.add(normalized);
    }
  }
  return Array.from(sources).slice(0, 4);
}

function normalizeImportSource(target: string, fromDir: string): string | null {
  if (target.startsWith("@/")) {
    return target.slice(2).replace(/\\/g, "/");
  }
  if (target.startsWith("@shared/")) {
    return `shared/${target.slice("@shared/".length)}`.replace(/\\/g, "/");
  }
  if (target.startsWith("shared/") || target.startsWith("server/")) {
    return target.replace(/\\/g, "/");
  }
  if (target.startsWith(".")) {
    const abs = path.resolve(fromDir, target);
    if (!abs.startsWith(repoRoot)) return null;
    return path.relative(repoRoot, abs).replace(/\\/g, "/");
  }
  return null;
}

const safeRead = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

function normalizeAlias(target: string): string | null {
  if (target.startsWith("@/")) {
    return target.replace(/\\/g, "/").replace(/\.tsx?$/, "");
  }
  return null;
}

function fileToAlias(filePath: string): string | null {
  if (!filePath.startsWith(clientSrcDir)) return null;
  const rel = path.relative(clientSrcDir, filePath).replace(/\\/g, "/").replace(/\.tsx?$/, "");
  return `@/${rel}`;
}

const toHuman = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toKebab = (value: string): string => toHuman(value).toLowerCase().replace(/\s+/g, "-");

const makeId = (seed: string): string => crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12);

function computeScore(name: string, dataSources: string[]): number {
  let score = dataSources.length * 2;
  if (/panel|hud|view/i.test(name)) {
    score += 2;
  }
  if (name.toLowerCase().includes("helix") || name.toLowerCase().includes("essence")) {
    score += 1;
  }
  return score;
}

function buildSummary(componentName: string, relPath: string, panelId: string, dataSources: string[]): string {
  const pretty = toHuman(componentName);
  if (dataSources.length) {
    const list = dataSources.map((s) => `\`${s}\``).join(", ");
    return `Essence spotted ${pretty} (${relPath}) tapping ${list}. Promote it as \`${panelId}\` to surface those parallels.`;
  }
  return `Essence found ${pretty} at ${relPath} with no desktop window. Promote it as \`${panelId}\` to explore new data/UI parallels.`;
}
