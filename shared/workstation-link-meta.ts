export const WORKSTATION_LINK_META_CONTRACT_VERSION =
  "helix.workstation_link_meta.v1" as const;

export type WorkstationEntrySurface = "ask" | "workstation";

export type WorkstationLinkMeta = {
  entry?: WorkstationEntrySurface;
};

type WorkstationLinkParseInput =
  | string
  | URL
  | {
      pathname?: string;
      search?: string;
      hash?: string;
    };

export function normalizeWorkstationEntrySurface(
  value: string | null | undefined,
): WorkstationEntrySurface | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "ask" || normalized === "workstation"
    ? normalized
    : null;
}

function toUrl(input: WorkstationLinkParseInput): URL {
  if (input instanceof URL) return input;
  if (typeof input === "string") return new URL(input, "http://localhost");
  const pathname = input.pathname?.trim() || "/open";
  const search = input.search?.trim() || "";
  const hash = input.hash?.trim() || "";
  return new URL(`${pathname}${search}${hash}`, "http://localhost");
}

export function parseWorkstationLinkMetaFromUrl(
  input: WorkstationLinkParseInput,
): WorkstationLinkMeta {
  const url = toUrl(input);
  const entry = normalizeWorkstationEntrySurface(url.searchParams.get("entry"));
  return entry ? { entry } : {};
}

export function encodeWorkstationLinkMetaSearch(
  meta: WorkstationLinkMeta,
  currentSearch = "",
): string {
  const params = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  params.delete("entry");
  const entry = normalizeWorkstationEntrySurface(meta.entry);
  if (entry) params.set("entry", entry);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildWorkstationEntryUrl({
  baseUrl = "",
  pathname = "/open",
  search = "",
  hash = "",
  entry,
}: {
  baseUrl?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  entry?: WorkstationEntrySurface;
}): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedHash = hash
    ? hash.startsWith("#")
      ? hash
      : `#${hash}`
    : "";
  const nextSearch = encodeWorkstationLinkMetaSearch({ entry }, search);
  return `${normalizedBase}${normalizedPathname}${nextSearch}${normalizedHash}`;
}
