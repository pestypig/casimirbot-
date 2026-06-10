type DocModuleLoader = () => Promise<string>;

export type DocManifestEntry = {
  id: string;
  route: string;
  relativePath: string;
  folderChain: string[];
  folderLabel: string;
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
  const searchText = `${title} ${relative}`.toLowerCase();

  return {
    id: relative,
    route,
    relativePath: relative,
    folderChain,
    folderLabel,
    title,
    searchText,
    loader,
  };
});

export const DOC_MANIFEST = manifest.sort((a, b) => a.title.localeCompare(b.title));

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
  if (tokens.length === 0) {
    return entries.filter((entry) => entry.searchText.includes(exactQuery));
  }
  return entries.filter((entry) => {
    if (entry.searchText.includes(exactQuery)) return true;
    const haystack = buildDocSearchHaystack(entry);
    if (normalizedQuery && haystack.includes(normalizedQuery)) return true;
    return tokens.every((token) => haystack.includes(token));
  });
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
  const normalized = normalizeDocSearchText(`${entry.searchText} ${entry.folderLabel}`);
  const aliases: string[] = [];
  if (/\bnhm2\b/.test(normalized)) {
    aliases.push("needle hull mark2", "needle hull mark 2");
  }
  if (/\bneedle hull mark\s*2\b/.test(normalized)) {
    aliases.push("nhm2");
  }
  return normalizeDocSearchText(`${normalized} ${aliases.join(" ")}`);
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
