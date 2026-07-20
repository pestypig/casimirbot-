type ScholarlyPaperRecord = Record<string, unknown>;

const readRecord = (value: unknown): ScholarlyPaperRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as ScholarlyPaperRecord
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeDoiIdentity = (value: string): string | null => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "")
    .replace(/[.,;:)\]}]+$/, "");
  return normalized.startsWith("10.") && normalized.includes("/") ? normalized : null;
};

const normalizeArxivIdentity = (value: string): string | null => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^arxiv:\s*/, "")
    .replace(/^https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf)\//, "")
    .replace(/\.pdf(?:[?#].*)?$/, "")
    .replace(/[?#].*$/, "")
    .replace(/v\d+$/, "")
    .replace(/^\/+|\/+$/g, "");
  return /^(?:[a-z-]+(?:\.[a-z-]+)?\/\d{7}|\d{4}\.\d{4,5})$/i.test(normalized)
    ? normalized
    : null;
};

const normalizePmidIdentity = (value: string): string | null => {
  const normalized = value.trim().match(/(?:^PMID\s*:?\s*|pubmed\.ncbi\.nlm\.nih\.gov\/)(\d{5,10})\b/i)?.[1] ??
    (/^\d{5,10}$/.test(value.trim()) ? value.trim() : null);
  return normalized || null;
};

const normalizePmcidIdentity = (value: string): string | null => {
  const normalized = value.trim().match(/(?:^|\/)(PMC\d{4,10})\b/i)?.[1];
  return normalized?.toUpperCase() ?? null;
};

const normalizeTitleIdentity = (value: string): string | null => {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return normalized.length >= 16 && normalized.split(" ").length >= 3 ? normalized : null;
};

const normalizeUrlIdentity = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return host && path ? `${host}${path}` : null;
  } catch {
    return null;
  }
};

export const scholarlyPaperIdentityKeys = (paper: unknown): string[] => {
  const record = readRecord(paper);
  if (!record) return [];
  const identifiers = readRecord(record.identifiers);
  const values = [
    readString(identifiers?.doi),
    readString(identifiers?.arxiv_id),
    readString(identifiers?.pmid),
    readString(identifiers?.pmcid),
    readString(identifiers?.url),
    readString(identifiers?.pdf_url),
    readString(identifiers?.full_text_url),
    readString(record.url),
    readString(record.pdf_url),
    readString(record.full_text_url),
  ].filter((value): value is string => Boolean(value));
  const keys = new Set<string>();

  for (const value of values) {
    const doi = normalizeDoiIdentity(value);
    if (doi) keys.add(`doi:${doi}`);
    const arxiv = normalizeArxivIdentity(value);
    if (arxiv) keys.add(`arxiv:${arxiv}`);
    const pmid = normalizePmidIdentity(value);
    if (pmid) keys.add(`pmid:${pmid}`);
    const pmcid = normalizePmcidIdentity(value);
    if (pmcid) keys.add(`pmcid:${pmcid}`);
    const url = normalizeUrlIdentity(value);
    if (url) keys.add(`url:${url}`);
  }

  const title = readString(record.title);
  const normalizedTitle = title ? normalizeTitleIdentity(title) : null;
  if (normalizedTitle) keys.add(`title:${normalizedTitle}`);

  const resultId = readString(record.result_id);
  if (resultId) keys.add(`result:${resultId.toLowerCase()}`);
  return Array.from(keys);
};

export const scholarlyPapersShareIdentity = (left: unknown, right: unknown): boolean => {
  const leftKeys = new Set(scholarlyPaperIdentityKeys(left));
  return scholarlyPaperIdentityKeys(right).some((key) => leftKeys.has(key));
};
