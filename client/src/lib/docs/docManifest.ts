type DocModuleLoader = () => Promise<string>;

export type DocManifestEntry = {
  id: string;
  route: string;
  relativePath: string;
  folderChain: string[];
  folderLabel: string;
  subjectLabel: string;
  catalogDate: string | null;
  catalogDateSource: "path" | "title" | null;
  isLatest: boolean;
  title: string;
  searchText: string;
  loader: DocModuleLoader;
};

const DOC_SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "about",
  "digest",
  "digests",
  "doc",
  "docs",
  "document",
  "documents",
  "for",
  "from",
  "of",
  "on",
  "paper",
  "papers",
  "the",
  "white",
  "whitepaper",
]);

const docModules = import.meta.glob("../../../../docs/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const DOC_PATH_PATTERN = /docs[\\/]/i;

const manifest: DocManifestEntry[] = Object.entries(docModules).map(([key, loader]) => {
  const relative = normalizeDocKey(key);
  const route = `/${relative}`;
  const segments = relative.split("/").filter(Boolean);
  const folderChain = segments.slice(1, -1);
  const folderLabel = folderChain.length ? folderChain.join(" / ") : "root";
  const fileName = segments.at(-1) ?? relative;
  const title = formatDocTitle(fileName);
  const catalogDate = inferDocCatalogDate(title, relative);
  const searchText = `${title} ${relative}`.toLowerCase();

  return {
    id: relative,
    route,
    relativePath: relative,
    folderChain,
    folderLabel,
    subjectLabel: inferDocSubjectLabel(title, relative, folderChain),
    catalogDate: catalogDate?.date ?? null,
    catalogDateSource: catalogDate?.source ?? null,
    isLatest: /\blatest\b/i.test(`${title} ${relative}`),
    title,
    searchText,
    loader,
  };
});

export const DOC_MANIFEST = manifest.sort(compareDocCatalogEntries);

const ROUTE_INDEX = new Map(DOC_MANIFEST.map((entry) => [entry.route, entry]));

export function findDocEntry(path?: string | null) {
  if (!path) return null;
  const normalized = ensureLeadingSlash(path);
  return ROUTE_INDEX.get(normalized) ?? null;
}

export function filterDocManifestEntries(
  query: string,
  entries: DocManifestEntry[] = DOC_MANIFEST,
): DocManifestEntry[] {
  const exactQuery = query.trim().toLowerCase();
  if (!exactQuery) return entries;
  const normalizedQuery = normalizeDocSearchText(exactQuery);
  const tokens = tokenizeDocSearchQuery(normalizedQuery);
  const scored = entries
    .map((entry) => ({
      entry,
      score: scoreDocSearchEntry(entry, exactQuery, normalizedQuery, tokens),
    }))
    .filter((candidate): candidate is { entry: DocManifestEntry; score: number } => candidate.score !== null)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return scored.map((candidate) => candidate.entry);
}

function normalizeDocKey(raw: string) {
  const normalized = raw.replace(/\\/g, "/");
  const matchIndex = normalized.search(DOC_PATH_PATTERN);
  if (matchIndex === -1) return normalized.replace(/^\/+/, "");
  return normalized.slice(matchIndex).replace(/^docs\/?/, "docs/").replace(/\/{2,}/g, "/");
}

function formatDocTitle(fileName: string) {
  const base = fileName.replace(/\.md$/i, "");
  if (!base) return "Untitled";
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function ensureLeadingSlash(path: string) {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

function buildDocSearchHaystack(entry: DocManifestEntry): string {
  const normalized = normalizeDocSearchText(`${entry.searchText} ${entry.folderLabel} ${entry.subjectLabel}`);
  const aliases: string[] = [];
  if (/\bnhm2\b/.test(normalized)) {
    aliases.push("needle hull mark2", "needle hull mark 2");
  }
  if (/\bneedle hull mark\s*2\b/.test(normalized)) {
    aliases.push("nhm2");
  }
  return normalizeDocSearchText(`${normalized} ${aliases.join(" ")}`);
}

export function compareDocCatalogEntries(a: DocManifestEntry, b: DocManifestEntry): number {
  const latestDelta = Number(b.isLatest) - Number(a.isLatest);
  if (latestDelta !== 0) return latestDelta;
  const dateDelta = docCatalogTimestamp(b) - docCatalogTimestamp(a);
  if (dateDelta !== 0) return dateDelta;
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

export function docCatalogTimestamp(entry: Pick<DocManifestEntry, "catalogDate">): number {
  if (!entry.catalogDate) return 0;
  const parsed = Date.parse(`${entry.catalogDate}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferDocCatalogDate(
  title: string,
  relativePath: string,
): { date: string; source: "path" | "title" } | null {
  const pathDate = readLastIsoDate(relativePath);
  if (pathDate) return { date: pathDate, source: "path" };
  const titleDate = readLastIsoDate(title);
  if (titleDate) return { date: titleDate, source: "title" };
  return null;
}

function readLastIsoDate(value: string): string | null {
  const matches = Array.from(value.matchAll(/\b(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])\b/g));
  const last = matches.at(-1);
  if (!last) return null;
  return `${last[1]}-${last[2]}-${last[3]}`;
}

function inferDocSubjectLabel(title: string, relativePath: string, folderChain: string[]): string {
  const text = normalizeDocSearchText(`${relativePath} ${title}`);
  if (text.includes("helix ask") || text.includes("helix-ask") || text.includes("dottie") || text.includes("voice")) {
    return "Helix Ask and Voice";
  }
  if (text.includes("warp") || text.includes("alcubierre") || text.includes("natario") || text.includes("vdb")) {
    return "Warp Mechanics";
  }
  if (text.includes("casimir") || text.includes("qi ") || text.includes("quantum inequality") || text.includes("negative energy")) {
    return "Casimir and Quantum Bounds";
  }
  if (text.includes("stellar") || text.includes("solar") || text.includes("sunquake") || text.includes("star ")) {
    return "Stellar and Solar";
  }
  if (text.includes("ethos") || text.includes("ideology") || text.includes("citizens arc") || text.includes("zen")) {
    return "Ethos and Ideology";
  }
  if (text.includes("knowledge") || text.includes("tree") || text.includes("ingestion")) {
    return "Knowledge System";
  }
  if (text.includes("audit") || text.includes("research") || text.includes("prompt") || text.includes("codex")) {
    return "Research and Development Logs";
  }
  if (text.includes("panel") || text.includes("ui") || text.includes("console") || text.includes("frontend")) {
    return "Panels and UI";
  }
  if (text.includes("physics") || folderChain.includes("physics")) {
    return "Physics Reference";
  }
  if (folderChain.length > 0) {
    return titleCaseSubject(folderChain[0]);
  }
  return "General Reference";
}

function titleCaseSubject(value: string): string {
  return value
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function scoreDocSearchEntry(
  entry: DocManifestEntry,
  exactQuery: string,
  normalizedQuery: string,
  tokens: string[],
): number | null {
  const title = entry.title.toLowerCase();
  const path = entry.relativePath.toLowerCase();
  const normalizedTitle = normalizeDocSearchText(entry.title);
  const normalizedPath = normalizeDocSearchText(entry.relativePath);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const compactTitle = normalizedTitle.replace(/\s+/g, "");
  const compactPath = normalizedPath.replace(/\s+/g, "");
  const haystack = buildDocSearchHaystack(entry);

  if (title.includes(exactQuery)) {
    return 1200 + titleDirectnessScore(title, exactQuery);
  }
  if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
    return 1100 + titleDirectnessScore(normalizedTitle, normalizedQuery);
  }
  if (compactQuery && compactTitle.includes(compactQuery)) {
    return 1000 + titleDirectnessScore(compactTitle, compactQuery);
  }
  if (path.includes(exactQuery)) {
    return 700 + pathDirectnessScore(path, exactQuery);
  }
  if (normalizedQuery && normalizedPath.includes(normalizedQuery)) {
    return 650 + pathDirectnessScore(normalizedPath, normalizedQuery);
  }
  if (compactQuery && compactPath.includes(compactQuery)) {
    return 625 + pathDirectnessScore(compactPath, compactQuery);
  }
  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    return 500;
  }
  if (tokens.length > 0 && tokens.every((token) => haystack.includes(token))) {
    const titleTokenHits = tokens.filter((token) => normalizedTitle.includes(token)).length;
    return 250 + titleTokenHits * 25;
  }
  if (tokens.length === 0 && entry.searchText.includes(exactQuery)) {
    return 100;
  }
  return null;
}

function titleDirectnessScore(value: string, query: string): number {
  const index = value.indexOf(query);
  if (index === 0) return 90;
  if (index > 0 && /\s/.test(value[index - 1] ?? "")) return 70;
  return Math.max(10, 60 - index);
}

function pathDirectnessScore(value: string, query: string): number {
  const index = value.indexOf(query);
  if (index === 0) return 50;
  if (index > 0 && /[\\/]/.test(value[index - 1] ?? "")) return 40;
  return Math.max(5, 30 - index);
}

function tokenizeDocSearchQuery(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !DOC_SEARCH_STOP_WORDS.has(token));
}

function normalizeDocSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
