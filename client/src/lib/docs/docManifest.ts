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

const docModules = import.meta.glob("../../../../docs/**/*.md", {
  as: "raw",
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
