import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import {
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  type HelixScholarlyEvidenceRef,
  type HelixScholarlyNextAffordance,
  type HelixScholarlyPaperAuthor,
  type HelixScholarlyPaperResult,
  type HelixScholarlyResearchIntentMode,
  type HelixScholarlyResearchObservation,
  type HelixScholarlyResearchProvider,
} from "@shared/helix-scholarly-research-observation";
import {
  detectScholarlyResearchIntent,
  extractScholarlyArxivId,
  extractScholarlyDoi,
} from "../scholarly-research-intent";

type RecordLike = Record<string, unknown>;

export type ScholarlyFetchResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export type ScholarlyFetch = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<ScholarlyFetchResponse>;

export type RunScholarlyResearchLookupInput = {
  turnId: string;
  callId?: string | null;
  query: string;
  mode?: HelixScholarlyResearchIntentMode | null;
  providers?: HelixScholarlyResearchProvider[] | null;
  limit?: number | null;
  fetchImpl?: ScholarlyFetch;
};

const DEFAULT_PROVIDERS: HelixScholarlyResearchProvider[] = [
  "arxiv",
  "openalex",
  "crossref",
  "semantic_scholar",
  "unpaywall",
  "core",
];

const XML = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  trimValues: true,
});

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeDoi = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  return value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .replace(/[)\].,;:!?]+$/g, "")
    .toLowerCase() || undefined;
};

const normalizeArxivId = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//i, "")
    .replace(/^arxiv:\s*/i, "")
    .replace(/\.pdf$/i, "")
    .replace(/[)\].,;:!?]+$/g, "");
  return normalized || undefined;
};

const arxivComparisonKey = (value: string | null | undefined): string | undefined =>
  normalizeArxivId(value)?.replace(/v\d+$/i, "").toLowerCase();

const defaultFetch: ScholarlyFetch = async (url, init) => {
  const response = await fetch(url, init as RequestInit);
  return response;
};

const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
  Accept: "application/json",
  "User-Agent": "CasimirBot-ScholarlyResearch/1.0",
  ...extra,
});

const evidenceRef = (
  provider: HelixScholarlyResearchProvider,
  ref: string,
  url?: string | null,
): HelixScholarlyEvidenceRef => ({
  ref: `${provider}:${ref}`,
  provider,
  ...(url ? { url } : {}),
  retrieved_at_ms: Date.now(),
});

const authorsFromCrossref = (authors: unknown): HelixScholarlyPaperAuthor[] =>
  readArray(authors)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      name: [readString(entry.given), readString(entry.family)].filter(Boolean).join(" ") ||
        readString(entry.name) ||
        "Unknown author",
      ...(readString(entry.ORCID) ? { orcid: readString(entry.ORCID) ?? undefined } : {}),
    }))
    .filter((entry) => entry.name !== "Unknown author");

const authorsFromNamedRecords = (authors: unknown): HelixScholarlyPaperAuthor[] =>
  readArray(authors)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({ name: readString(entry.name) ?? readString(entry.display_name) ?? "" }))
    .filter((entry) => entry.name.length > 0);

const openAlexAbstract = (invertedIndex: unknown): string | undefined => {
  const index = readRecord(invertedIndex);
  if (!index) return undefined;
  const words: Array<{ word: string; position: number }> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of readArray(positions)) {
      if (typeof position === "number") words.push({ word, position });
    }
  }
  return words
    .sort((left, right) => left.position - right.position)
    .map((entry) => entry.word)
    .join(" ")
    .trim() || undefined;
};

const paperKey = (paper: HelixScholarlyPaperResult): string =>
  paper.identifiers.doi ??
  arxivComparisonKey(paper.identifiers.arxiv_id) ??
  paper.identifiers.openalex_id ??
  paper.identifiers.semantic_scholar_id ??
  paper.title.toLowerCase();

const dedupePapers = (papers: HelixScholarlyPaperResult[]): HelixScholarlyPaperResult[] => {
  const byKey = new Map<string, HelixScholarlyPaperResult>();
  for (const paper of papers) {
    const key = paperKey(paper);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, paper);
      continue;
    }
    byKey.set(key, {
      ...existing,
      authors: existing.authors.length ? existing.authors : paper.authors,
      abstract: existing.abstract ?? paper.abstract,
      venue: existing.venue ?? paper.venue,
      citation_count: existing.citation_count ?? paper.citation_count,
      reference_count: existing.reference_count ?? paper.reference_count,
      is_open_access: existing.is_open_access ?? paper.is_open_access,
      identifiers: { ...paper.identifiers, ...existing.identifiers },
      evidence_refs: unique([...existing.evidence_refs, ...paper.evidence_refs]),
      source_providers: unique([...existing.source_providers, ...paper.source_providers]),
      confidence: existing.confidence === "high" || paper.confidence === "high" ? "high" : "medium",
    });
  }
  return Array.from(byKey.values());
};

const makePaper = (input: {
  provider: HelixScholarlyResearchProvider;
  ref: HelixScholarlyEvidenceRef;
  title?: string | null;
  authors?: HelixScholarlyPaperAuthor[];
  year?: number;
  venue?: string | null;
  abstract?: string | null;
  doi?: string | null;
  arxivId?: string | null;
  openalexId?: string | null;
  semanticScholarId?: string | null;
  url?: string | null;
  pdfUrl?: string | null;
  fullTextUrl?: string | null;
  citationCount?: number;
  referenceCount?: number;
  isOpenAccess?: boolean;
  confidence?: "high" | "medium" | "low";
}): HelixScholarlyPaperResult | null => {
  const title = input.title?.trim();
  if (!title) return null;
  const arxivId = normalizeArxivId(input.arxivId);
  return {
    result_id: `${input.provider}:${hashShort([title, input.doi, arxivId, input.openalexId, input.semanticScholarId])}`,
    title,
    authors: input.authors ?? [],
    ...(input.year ? { year: input.year } : {}),
    ...(input.venue ? { venue: input.venue } : {}),
    ...(input.abstract ? { abstract: input.abstract } : {}),
    identifiers: {
      ...(normalizeDoi(input.doi) ? { doi: normalizeDoi(input.doi) } : {}),
      ...(arxivId ? { arxiv_id: arxivId } : {}),
      ...(input.openalexId ? { openalex_id: input.openalexId } : {}),
      ...(input.semanticScholarId ? { semantic_scholar_id: input.semanticScholarId } : {}),
      ...(input.url ? { url: input.url } : {}),
      ...(input.pdfUrl ? { pdf_url: input.pdfUrl } : {}),
      ...(input.fullTextUrl ? { full_text_url: input.fullTextUrl } : {}),
    },
    ...(typeof input.citationCount === "number" ? { citation_count: input.citationCount } : {}),
    ...(typeof input.referenceCount === "number" ? { reference_count: input.referenceCount } : {}),
    ...(typeof input.isOpenAccess === "boolean" ? { is_open_access: input.isOpenAccess } : {}),
    evidence_refs: [input.ref.ref],
    source_providers: [input.provider],
    confidence: input.confidence ?? "medium",
  };
};

const SCHOLARLY_LOOKUP_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "paper",
  "papers",
  "research",
  "scholarly",
  "search",
  "study",
  "the",
  "to",
  "with",
]);

const SCHOLARLY_LOOKUP_OFF_TARGET = /\b(?:scholarly\s+(?:document|writing|communication|process)|citation\s+count|peer\s+review|large\s+language\s+models?|llm|bert|text\s+classification|document\s+quality|writing\s+and\s+peer\s+review)\b/i;

const scholarlyLookupTokens = (value: string): string[] =>
  unique(value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !SCHOLARLY_LOOKUP_STOP_WORDS.has(token)));

const paperSearchText = (paper: HelixScholarlyPaperResult): string =>
  [
    paper.title,
    paper.abstract,
    paper.venue,
    paper.year,
    ...paper.authors.map((author) => author.name),
    paper.identifiers.doi,
    paper.identifiers.arxiv_id,
  ].filter(Boolean).join(" ").toLowerCase();

const isHistoricalOriginalPaperQuery = (query: string, queryTokens: string[]): boolean =>
  /\b(?:first|original|earliest|foundational|classic|1948)\b/i.test(query) ||
  /\bH\.?\s*B\.?\s*G\.?\s*Casimir\b/i.test(query) ||
  /\bHendrik\s+Casimir\b/i.test(query) ||
  /\bOn\s+the\s+Attraction\s+Between\s+Two\s+Perfectly\s+Conducting\s+Plates\b/i.test(query) ||
  (
    queryTokens.includes("casimir") &&
    queryTokens.includes("conducting") &&
    queryTokens.includes("plates") &&
    queryTokens.includes("1948")
  );

const paperSupportsHistoricalOriginalQuery = (
  paper: HelixScholarlyPaperResult,
  query: string,
  queryTokens: string[],
): boolean => {
  if (!isHistoricalOriginalPaperQuery(query, queryTokens)) return true;
  const haystack = paperSearchText(paper);
  if (/\bon\s+the\s+attraction\s+between\s+two\s+perfectly\s+conducting\s+plates\b/i.test(paper.title)) {
    return true;
  }
  const hasOriginalYear = /\b1948\b/.test(haystack) || paper.year === 1948;
  const hasCasimirAuthor = paper.authors.some((author) =>
    /\b(?:H\.?\s*B\.?\s*G\.?\s*)?Casimir\b/i.test(author.name) ||
    /\bHendrik\s+Casimir\b/i.test(author.name)
  );
  const hasPlateIdentity = /\bconducting\s+plates\b/i.test(haystack) &&
    /\b(?:attraction|force|effect)\b/i.test(haystack);
  return hasOriginalYear && hasCasimirAuthor && hasPlateIdentity;
};

const paperSupportsQuery = (paper: HelixScholarlyPaperResult, query: string, queryTokens: string[]): boolean => {
  if (queryTokens.length === 0) return true;
  if (!paperSupportsHistoricalOriginalQuery(paper, query, queryTokens)) return false;
  const haystack = paperSearchText(paper);
  const hits = queryTokens.filter((token) => haystack.includes(token));
  if (SCHOLARLY_LOOKUP_OFF_TARGET.test(haystack) && hits.length < queryTokens.length) return false;
  if (queryTokens.length <= 2) return hits.length === queryTokens.length;
  return hits.length >= Math.max(2, Math.ceil(queryTokens.length * 0.6));
};

const buildLookupRecoveryQueries = (query: string, tokens: string[]): string[] => {
  const normalized = query.trim();
  const tokenText = tokens.join(" ");
  const base = normalized || tokenText || "scholarly paper";
  const queries = [base];
  if (tokens.includes("weyl") || /\bweyl\b/i.test(base)) {
    queries.push(
      "Weyl tensor conformal curvature general relativity",
      "Weyl curvature tensor differential geometry",
      "Weyl tensor spacetime curvature",
      "Weyl tensor curvature invariants spacetime",
    );
  } else if (tokens.includes("casimir") && isHistoricalOriginalPaperQuery(base, tokens)) {
    queries.push(
      "H. B. G. Casimir 1948 On the Attraction Between Two Perfectly Conducting Plates",
      "Hendrik Casimir original Casimir effect paper",
      "\"On the Attraction Between Two Perfectly Conducting Plates\" Casimir",
      "Casimir Proc. Kon. Ned. Akad. Wet. 1948 conducting plates",
    );
  } else {
    queries.push(
      `${base} review`,
      `${base} arxiv`,
    );
  }
  return unique(queries).slice(0, 5);
};

const buildRecoveryQueryBasis = (query: string, tokens: string[]): Record<string, unknown> => ({
  schema: "helix.scholarly_recovery_query_basis.v1",
  scholarly_query: query,
  query_tokens: tokens,
  strategy: tokens.includes("weyl") || /\bweyl\b/i.test(query)
    ? "topic_domain_expansion"
    : tokens.includes("casimir") && isHistoricalOriginalPaperQuery(query, tokens)
      ? "historical_paper_identity_expansion"
    : "clean_query_refinement",
  assistant_answer: false,
  raw_content_included: false,
});

const buildLookupNextAffordances = (input: {
  query: string;
  reason: string;
  tokens: string[];
}): HelixScholarlyNextAffordance[] =>
  buildLookupRecoveryQueries(input.query, input.tokens).map((query) => ({
    capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    reason: input.reason,
    query,
  }));

const paperMatchesArxivId = (paper: HelixScholarlyPaperResult, arxivId: string | null): boolean => {
  const target = arxivComparisonKey(arxivId);
  if (!target) return false;
  const paperArxiv = arxivComparisonKey(paper.identifiers.arxiv_id);
  if (paperArxiv === target) return true;
  const urlText = [
    paper.identifiers.url,
    paper.identifiers.pdf_url,
    paper.identifiers.full_text_url,
  ].filter(Boolean).join(" ");
  return new RegExp(`arxiv\\.org\\/(?:abs|pdf)\\/${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:v\\d+)?(?:\\.pdf)?\\b`, "i").test(urlText);
};

const makeFallbackArxivPaper = (input: {
  arxivId: string;
  ref: HelixScholarlyEvidenceRef;
}): HelixScholarlyPaperResult => {
  const arxivId = normalizeArxivId(input.arxivId) ?? input.arxivId;
  return {
    result_id: `arxiv:${arxivId}`,
    title: `arXiv:${arxivId}`,
    authors: [],
    identifiers: {
      arxiv_id: arxivId,
      url: `https://arxiv.org/abs/${arxivId}`,
      pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`,
      full_text_url: `https://arxiv.org/abs/${arxivId}`,
    },
    evidence_refs: [input.ref.ref],
    source_providers: ["arxiv"],
    confidence: "high",
  };
};

const fetchJson = async (input: {
  fetchImpl: ScholarlyFetch;
  provider: HelixScholarlyResearchProvider;
  url: string;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  headers?: Record<string, string>;
}): Promise<unknown | null> => {
  input.providersCalled.push(input.provider);
  try {
    const response = await input.fetchImpl(input.url, { headers: headers(input.headers) });
    if (!response.ok || !response.json) {
      input.missingRequirements.push(`${input.provider}_http_${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    input.missingRequirements.push(`${input.provider}_request_failed:${error instanceof Error ? error.message : "unknown"}`);
    return null;
  }
};

const fetchText = async (input: {
  fetchImpl: ScholarlyFetch;
  provider: HelixScholarlyResearchProvider;
  url: string;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
}): Promise<string | null> => {
  input.providersCalled.push(input.provider);
  try {
    const response = await input.fetchImpl(input.url, { headers: { Accept: "application/atom+xml", "User-Agent": "CasimirBot-ScholarlyResearch/1.0" } });
    if (!response.ok || !response.text) {
      input.missingRequirements.push(`${input.provider}_http_${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    input.missingRequirements.push(`${input.provider}_request_failed:${error instanceof Error ? error.message : "unknown"}`);
    return null;
  }
};

const lookupOpenAlex = async (input: {
  query: string;
  doi: string | null;
  limit: number;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const filter = input.doi
    ? `filter=doi:${encodeURIComponent(input.doi)}`
    : `search=${encodeURIComponent(input.query)}`;
  const url = `https://api.openalex.org/works?${filter}&per-page=${input.limit}`;
  const json = await fetchJson({ ...input, provider: "openalex", url });
  const record = readRecord(json);
  const results = readArray(record?.results);
  const papers: HelixScholarlyPaperResult[] = [];
  for (const raw of results.length ? results : record ? [record] : []) {
    const work = readRecord(raw);
    if (!work) continue;
    const ids = readRecord(work.ids);
    const primaryLocation = readRecord(work.primary_location);
    const source = readRecord(primaryLocation?.source);
    const openAccess = readRecord(work.open_access);
    const ref = evidenceRef("openalex", readString(work.id) ?? hashShort(work), readString(work.id));
    input.evidenceRefs.push(ref);
    const authors = readArray(work.authorships)
      .map((entry) => readRecord(entry))
      .filter((entry): entry is RecordLike => Boolean(entry))
      .map((entry) => readRecord(entry.author))
      .filter((entry): entry is RecordLike => Boolean(entry))
      .map((entry) => ({ name: readString(entry.display_name) ?? "" }))
      .filter((entry) => entry.name.length > 0);
    const paper = makePaper({
      provider: "openalex",
      ref,
      title: firstString(work.title, work.display_name),
      authors,
      year: readNumber(work.publication_year),
      venue: readString(source?.display_name),
      abstract: openAlexAbstract(work.abstract_inverted_index),
      doi: normalizeDoi(firstString(work.doi, ids?.doi)),
      openalexId: readString(work.id) ?? readString(ids?.openalex),
      url: firstString(work.id, work.landing_page_url),
      pdfUrl: firstString(primaryLocation?.pdf_url),
      fullTextUrl: firstString(primaryLocation?.landing_page_url, openAccess?.oa_url),
      citationCount: readNumber(work.cited_by_count),
      referenceCount: readNumber(work.referenced_works_count),
      isOpenAccess: Boolean(openAccess?.is_oa),
      confidence: input.doi ? "high" : "medium",
    });
    if (paper) papers.push(paper);
  }
  return papers;
};

const lookupCrossref = async (input: {
  query: string;
  doi: string | null;
  limit: number;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const url = input.doi
    ? `https://api.crossref.org/works/${encodeURIComponent(input.doi)}`
    : `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(input.query)}&rows=${input.limit}`;
  const json = await fetchJson({ ...input, provider: "crossref", url });
  const message = readRecord(readRecord(json)?.message);
  const items = input.doi ? [message] : readArray(message?.items).map((entry) => readRecord(entry));
  const papers: HelixScholarlyPaperResult[] = [];
  for (const item of items) {
    if (!item) continue;
    const published = readArray(readArray(readRecord(item.published)?.["date-parts"])[0]);
    const year = typeof published[0] === "number" ? published[0] : undefined;
    const ref = evidenceRef("crossref", normalizeDoi(readString(item.DOI)) ?? hashShort(item), readString(item.URL));
    input.evidenceRefs.push(ref);
    const paper = makePaper({
      provider: "crossref",
      ref,
      title: readString(readArray(item.title)[0]),
      authors: authorsFromCrossref(item.author),
      year,
      venue: readString(readArray(item["container-title"])[0]),
      doi: normalizeDoi(readString(item.DOI)),
      url: readString(item.URL),
      citationCount: readNumber(item["is-referenced-by-count"]),
      referenceCount: readNumber(item["reference-count"]),
      confidence: input.doi ? "high" : "medium",
    });
    if (paper) papers.push(paper);
  }
  return papers;
};

const lookupSemanticScholar = async (input: {
  query: string;
  doi: string | null;
  arxivId: string | null;
  limit: number;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const fields = "paperId,title,authors,year,venue,abstract,citationCount,referenceCount,url,externalIds,isOpenAccess,openAccessPdf";
  const apiKey = readString(process.env.SEMANTIC_SCHOLAR_API_KEY);
  const exactArxivId = normalizeArxivId(input.arxivId);
  const url = input.doi
    ? `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(input.doi)}?fields=${fields}`
    : exactArxivId
      ? `https://api.semanticscholar.org/graph/v1/paper/ARXIV:${encodeURIComponent(exactArxivId)}?fields=${fields}`
      : `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(input.query)}&limit=${input.limit}&fields=${fields}`;
  const json = await fetchJson({
    ...input,
    provider: "semantic_scholar",
    url,
    headers: apiKey ? { "x-api-key": apiKey } : {},
  });
  const record = readRecord(json);
  const entries = readArray(record?.data).length ? readArray(record?.data) : record ? [record] : [];
  const papers: HelixScholarlyPaperResult[] = [];
  for (const raw of entries) {
    const paperRecord = readRecord(raw);
    if (!paperRecord) continue;
    const externalIds = readRecord(paperRecord.externalIds);
    const openAccessPdf = readRecord(paperRecord.openAccessPdf);
    const ref = evidenceRef("semantic_scholar", readString(paperRecord.paperId) ?? hashShort(paperRecord), readString(paperRecord.url));
    input.evidenceRefs.push(ref);
    const paper = makePaper({
      provider: "semantic_scholar",
      ref,
      title: readString(paperRecord.title),
      authors: authorsFromNamedRecords(paperRecord.authors),
      year: readNumber(paperRecord.year),
      venue: readString(paperRecord.venue),
      abstract: readString(paperRecord.abstract),
      doi: normalizeDoi(firstString(externalIds?.DOI, externalIds?.doi)),
      arxivId: firstString(externalIds?.ArXiv, externalIds?.arXiv),
      semanticScholarId: readString(paperRecord.paperId),
      url: readString(paperRecord.url),
      pdfUrl: readString(openAccessPdf?.url),
      fullTextUrl: readString(openAccessPdf?.url) ?? readString(paperRecord.url),
      citationCount: readNumber(paperRecord.citationCount),
      referenceCount: readNumber(paperRecord.referenceCount),
      isOpenAccess: typeof paperRecord.isOpenAccess === "boolean" ? paperRecord.isOpenAccess : undefined,
      confidence: input.doi || exactArxivId ? "high" : "medium",
    });
    if (paper) papers.push(paper);
  }
  return papers;
};

const lookupArxiv = async (input: {
  query: string;
  arxivId: string | null;
  limit: number;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const exactArxivId = normalizeArxivId(input.arxivId);
  const search = exactArxivId
    ? `id_list=${encodeURIComponent(exactArxivId)}`
    : `search_query=all:${encodeURIComponent(input.query)}&start=0&max_results=${input.limit}`;
  const xml = await fetchText({
    ...input,
    provider: "arxiv",
    url: `https://export.arxiv.org/api/query?${search}`,
  });
  if (!xml) return [];
  const parsed = readRecord(XML.parse(xml));
  const feed = readRecord(parsed?.feed);
  const entries = readArray(feed?.entry).length ? readArray(feed?.entry) : feed?.entry ? [feed.entry] : [];
  const papers: HelixScholarlyPaperResult[] = [];
  for (const raw of entries) {
    const entry = readRecord(raw);
    if (!entry) continue;
    const id = readString(entry.id);
    const arxivId = normalizeArxivId(id?.match(/arxiv\.org\/abs\/(.+)$/i)?.[1] ?? exactArxivId);
    const ref = evidenceRef("arxiv", arxivId ?? hashShort(entry), id);
    input.evidenceRefs.push(ref);
    const authorEntries = readArray(entry.author).length ? readArray(entry.author) : entry.author ? [entry.author] : [];
    const authors = authorEntries
      .map((author) => readString(readRecord(author)?.name))
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ name }));
    const paper = makePaper({
      provider: "arxiv",
      ref,
      title: readString(entry.title)?.replace(/\s+/g, " "),
      authors,
      year: Number(readString(entry.published)?.slice(0, 4)) || undefined,
      abstract: readString(entry.summary)?.replace(/\s+/g, " "),
      arxivId,
      url: id,
      pdfUrl: arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : undefined,
      fullTextUrl: id,
      confidence: exactArxivId ? "high" : "medium",
    });
    if (paper) papers.push(paper);
  }
  return papers;
};

const lookupUnpaywall = async (input: {
  doi: string | null;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const email = readString(process.env.UNPAYWALL_EMAIL);
  if (!input.doi || !email) {
    input.missingRequirements.push("unpaywall_requires_doi_and_UNPAYWALL_EMAIL");
    return [];
  }
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(input.doi)}?email=${encodeURIComponent(email)}`;
  const json = await fetchJson({ ...input, provider: "unpaywall", url });
  const record = readRecord(json);
  if (!record) return [];
  const bestLocation = readRecord(record.best_oa_location);
  const ref = evidenceRef("unpaywall", input.doi, readString(bestLocation?.url_for_pdf) ?? readString(bestLocation?.url) ?? readString(record.doi_url));
  input.evidenceRefs.push(ref);
  const paper = makePaper({
    provider: "unpaywall",
    ref,
    title: readString(record.title),
    doi: normalizeDoi(readString(record.doi)),
    url: readString(bestLocation?.url) ?? readString(record.doi_url),
    pdfUrl: readString(bestLocation?.url_for_pdf),
    fullTextUrl: readString(bestLocation?.url_for_landing_page) ?? readString(bestLocation?.url) ?? readString(record.doi_url),
    isOpenAccess: Boolean(record.is_oa),
    confidence: "medium",
  });
  return paper ? [paper] : [];
};

const lookupCore = async (input: {
  query: string;
  doi: string | null;
  limit: number;
  fetchImpl: ScholarlyFetch;
  providersCalled: HelixScholarlyResearchProvider[];
  missingRequirements: string[];
  evidenceRefs: HelixScholarlyEvidenceRef[];
}): Promise<HelixScholarlyPaperResult[]> => {
  const apiKey = readString(process.env.CORE_API_KEY);
  if (!apiKey) {
    input.missingRequirements.push("core_requires_CORE_API_KEY");
    return [];
  }
  const query = input.doi ? `doi:${input.doi}` : input.query;
  const url = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${input.limit}`;
  const json = await fetchJson({
    ...input,
    provider: "core",
    url,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const results = readArray(readRecord(json)?.results);
  const papers: HelixScholarlyPaperResult[] = [];
  for (const raw of results) {
    const result = readRecord(raw);
    if (!result) continue;
    const ref = evidenceRef("core", readString(result.id) ?? hashShort(result), readString(result.downloadUrl) ?? readString(result.url));
    input.evidenceRefs.push(ref);
    const paper = makePaper({
      provider: "core",
      ref,
      title: readString(result.title),
      authors: authorsFromNamedRecords(result.authors),
      year: readNumber(result.yearPublished),
      abstract: readString(result.abstract),
      doi: normalizeDoi(readString(result.doi)),
      url: readString(result.downloadUrl) ?? readString(result.url),
      pdfUrl: readString(result.downloadUrl),
      fullTextUrl: readString(result.url) ?? readString(result.downloadUrl),
      isOpenAccess: true,
      confidence: "medium",
    });
    if (paper) papers.push(paper);
  }
  return papers;
};

export async function runScholarlyResearchLookup(
  input: RunScholarlyResearchLookupInput,
): Promise<HelixScholarlyResearchObservation> {
  const query = input.query.trim();
  const intent = detectScholarlyResearchIntent(query);
  const doi = input.mode === "doi_lookup" ? extractScholarlyDoi(query) : intent.doi ?? extractScholarlyDoi(query);
  const arxivId = normalizeArxivId(intent.arxivId ?? extractScholarlyArxivId(query)) ?? null;
  const limit = Math.max(1, Math.min(Number(input.limit) || 8, 20));
  const providers = unique((input.providers?.length ? input.providers : DEFAULT_PROVIDERS)
    .filter((provider): provider is HelixScholarlyResearchProvider => DEFAULT_PROVIDERS.includes(provider)));
  const fetchImpl = input.fetchImpl ?? defaultFetch;
  const providersCalled: HelixScholarlyResearchProvider[] = [];
  const missingRequirements: string[] = [];
  const evidenceRefs: HelixScholarlyEvidenceRef[] = [];
  const papers: HelixScholarlyPaperResult[] = [];

  if (!query) {
    missingRequirements.push("query_required");
  }

  for (const provider of providers) {
    if (!query) break;
    if (arxivId && !doi && !["arxiv", "semantic_scholar"].includes(provider)) {
      continue;
    }
    if (provider === "openalex") {
      papers.push(...await lookupOpenAlex({ query, doi, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "crossref") {
      papers.push(...await lookupCrossref({ query, doi, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "semantic_scholar") {
      papers.push(...await lookupSemanticScholar({ query, doi, arxivId, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "arxiv") {
      papers.push(...await lookupArxiv({ query, arxivId, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "unpaywall") {
      papers.push(...await lookupUnpaywall({ doi, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    } else if (provider === "core") {
      papers.push(...await lookupCore({ query, doi, limit, fetchImpl, providersCalled, missingRequirements, evidenceRefs }));
    }
  }

  const exactArxivPapers = arxivId
    ? dedupePapers(papers).filter((paper) => paperMatchesArxivId(paper, arxivId))
    : [];
  if (arxivId && exactArxivPapers.length === 0) {
    const ref = evidenceRef("arxiv", arxivId, `https://arxiv.org/abs/${arxivId}`);
    evidenceRefs.push(ref);
    missingRequirements.push("arxiv_metadata_unavailable_using_direct_pdf_url");
    papers.push(makeFallbackArxivPaper({ arxivId, ref }));
  }

  const candidatePapers = arxivId
    ? dedupePapers(papers).filter((paper) => paperMatchesArxivId(paper, arxivId))
    : dedupePapers(papers);
  const queryTokens = scholarlyLookupTokens(query);
  const relevantPapers = arxivId
    ? candidatePapers
    : candidatePapers.filter((paper) => paperSupportsQuery(paper, query, queryTokens));
  const dedupedPapers = relevantPapers.slice(0, limit);
  const rejectedPapers = candidatePapers
    .filter((paper) => !dedupedPapers.some((selected) => selected.result_id === paper.result_id))
    .slice(0, limit);
  if (!dedupedPapers.length && query) {
    missingRequirements.push(candidatePapers.length > 0 ? "lookup_weak_match" : "no_scholarly_results_returned");
  }
  const evidenceState = !query
    ? "lookup_blocked"
    : dedupedPapers.length > 0
      ? "lookup_usable"
      : candidatePapers.length > 0
        ? "lookup_weak_match"
        : "lookup_blocked";
  const nextAffordances = evidenceState === "lookup_usable"
    ? []
    : buildLookupNextAffordances({
        query,
        tokens: queryTokens,
        reason: evidenceState === "lookup_weak_match" ? "lookup_weak_match" : "lookup_blocked",
      });
  const recoveryQueryBasis = buildRecoveryQueryBasis(query, queryTokens);
  const lookupRelevanceGate = {
    schema: "helix.scholarly_lookup_relevance_gate.v1",
    status: evidenceState === "lookup_usable" ? "satisfied" : "blocked",
    code: evidenceState === "lookup_usable" ? "lookup_result_relevant" : evidenceState,
    required_any: queryTokens,
    supporting_any: dedupedPapers.map((paper) => paper.result_id),
    selected_result_ids: dedupedPapers.map((paper) => paper.result_id),
    rejected_result_ids: rejectedPapers.map((paper) => paper.result_id),
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const scholarlyLookupRecoveryAffordance = evidenceState === "lookup_usable"
    ? null
    : {
        schema: "helix.scholarly_lookup_recovery_affordance.v1",
        reason: evidenceState,
        failed_query: query,
        expected_source_classes: ["scholarly paper matching the requested research topic"],
        rejected_results: rejectedPapers.map((paper) => ({
          result_id: paper.result_id,
          title: paper.title,
          reason: "query_terms_not_supported_by_title_or_abstract",
        })),
        recovery_queries: nextAffordances.map((affordance) => affordance.query).filter((entry): entry is string => Boolean(entry)),
        recovery_query_basis: recoveryQueryBasis,
        recommended_next_capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        next_affordances: nextAffordances,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };

  return {
    schema: HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
    artifact_id: `${input.callId ?? input.turnId}:scholarly_research_observation`,
    turn_id: input.turnId,
    capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    query,
    intent: input.mode ?? intent.mode,
    providers_considered: providers,
    providers_called: unique(providersCalled),
    evidence_refs: evidenceRefs,
    papers: dedupedPapers.length > 0 ? dedupedPapers : candidatePapers.slice(0, limit),
    evidence_state: evidenceState,
    next_affordances: nextAffordances,
    lookup_relevance_gate: lookupRelevanceGate,
    ...(scholarlyLookupRecoveryAffordance ? {
      scholarly_lookup_recovery_affordance: scholarlyLookupRecoveryAffordance,
      recovery_query_basis: recoveryQueryBasis,
      recovery_affordances: [scholarlyLookupRecoveryAffordance],
    } : {}),
    missing_requirements: unique(missingRequirements),
    selected_for_answer: evidenceState === "lookup_usable",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}
