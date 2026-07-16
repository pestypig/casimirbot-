import crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
  type HelixScholarlyFullTextChunk,
  type HelixScholarlyFullTextFetchAttempt,
  type HelixScholarlyFullTextObservation,
  type HelixScholarlyFullTextPage,
  type HelixScholarlyFullTextSourceKind,
  type HelixScholarlyNextAffordance,
  type HelixScholarlyPaperResult,
  type HelixScholarlyPdfVisualCandidate,
} from "@shared/helix-scholarly-research-observation";
import { runScholarlyResearchLookup } from "./scholarly-research-lookup";
import { saveResearchLibraryExtraction } from "../../helix-account/research-library-store";
import { normalizeScholarlyFullTextSourceUrl } from "../scholarly-research-intent";

type RecordLike = Record<string, unknown>;

export type ScholarlyFullTextFetchResponse = {
  ok: boolean;
  status: number;
  headers?: { get: (name: string) => string | null };
  arrayBuffer?: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
  json?: () => Promise<unknown>;
};

export type ScholarlyFullTextFetch = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<ScholarlyFullTextFetchResponse>;

export type ScholarlyPdfTextPage = {
  page: number;
  text: string;
};

export type ScholarlyPdfTextExtraction = {
  totalPages?: number;
  pages: ScholarlyPdfTextPage[];
};

export type ScholarlyPdfTextExtractor = (
  bytes: Uint8Array,
  options: { maxPages: number },
) => Promise<ScholarlyPdfTextExtraction>;

export type RunScholarlyFullTextFetchInput = {
  turnId: string;
  callId?: string | null;
  query: string;
  paper?: HelixScholarlyPaperResult | null;
  papers?: HelixScholarlyPaperResult[] | null;
  paperResultId?: string | null;
  sourceUrl?: string | null;
  maxPages?: number | null;
  maxChunks?: number | null;
  fetchImpl?: ScholarlyFullTextFetch;
  extractPdfTextImpl?: ScholarlyPdfTextExtractor;
  cachePdf?: boolean;
  cacheRoot?: string | null;
  openAccessRecoveryAttempt?: boolean;
  researchLibraryProfileId?: string | null;
};

const DEFAULT_MAX_PAGES = 40;
const DEFAULT_MAX_CHUNKS = 8;
const MAX_PAGES = 80;
const MAX_CHUNKS = 16;
const CHUNK_MAX_CHARS = 1800;
const CHUNK_OVERLAP_CHARS = 180;
const VISUAL_CANDIDATE_LIMIT = 6;

const STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "can",
  "for",
  "from",
  "get",
  "how",
  "into",
  "its",
  "journal",
  "paper",
  "papers",
  "pdf",
  "read",
  "research",
  "that",
  "the",
  "this",
  "with",
]);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const hashBuffer = (bytes: Uint8Array): string =>
  crypto.createHash("sha256").update(bytes).digest("hex");

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeWhitespace = (value: string): string =>
  value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();

const compactExcerpt = (value: string, maxChars = 1200): string => {
  const compact = normalizeWhitespace(value);
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const defaultFetch: ScholarlyFullTextFetch = async (url, init) => {
  const response = await fetch(url, init as RequestInit);
  return response;
};

const fetchHeaders = (): Record<string, string> => ({
  Accept: "application/pdf,text/html,text/plain;q=0.9,*/*;q=0.5",
  "User-Agent": "CasimirBot-ScholarlyFullText/1.0",
});

const isLikelyPdfBytes = (bytes: Uint8Array): boolean => {
  if (bytes.length < 4) return false;
  return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
};

const isLikelyPdfUrl = (url: string): boolean =>
  /\.pdf(?:[?#].*)?$/i.test(url) || /arxiv\.org\/pdf\//i.test(url);

const absolutizeUrl = (href: string, baseUrl: string): string | null => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
};

const sniffPdfUrlFromHtml = (html: string, baseUrl: string): string | null => {
  const candidates = [
    ...Array.from(html.matchAll(/href\s*=\s*["']([^"']+\.pdf(?:[?#][^"']*)?)["']/gi)).map((match) => match[1]),
    ...Array.from(html.matchAll(/(?:content|data-pdf-url|data-download-url)\s*=\s*["']([^"']+\.pdf(?:[?#][^"']*)?)["']/gi)).map((match) => match[1]),
  ];
  for (const candidate of candidates) {
    const absolute = absolutizeUrl(candidate, baseUrl);
    if (absolute && /^https?:\/\//i.test(absolute)) return absolute;
  }
  return null;
};

const stripHtml = (value: string): string =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, "\"");

const decodeTextBytes = (bytes: Uint8Array): string =>
  new TextDecoder("utf-8", { fatal: false }).decode(bytes);

const responseJson = async (response: ScholarlyFullTextFetchResponse): Promise<unknown | null> => {
  if (response.json) return await response.json();
  if (!response.text) return null;
  try {
    return JSON.parse(await response.text());
  } catch {
    return null;
  }
};

const configuredOpenAccessFallbackUrls = async (input: {
  doi: string | null;
  query: string;
  fetchImpl: ScholarlyFullTextFetch;
  missingRequirements: string[];
}): Promise<string[]> => {
  const urls: string[] = [];
  const doi = input.doi?.trim() || null;
  const unpaywallEmail = readString(process.env.UNPAYWALL_EMAIL);
  if (doi && unpaywallEmail) {
    try {
      const response = await input.fetchImpl(
        `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(unpaywallEmail)}`,
        { headers: fetchHeaders() },
      );
      if (response.ok) {
        const record = readRecord(await responseJson(response));
        const bestLocation = readRecord(record?.best_oa_location);
        urls.push(
          ...[
            readString(bestLocation?.url_for_pdf),
            readString(bestLocation?.url_for_landing_page),
            readString(bestLocation?.url),
          ].filter((entry): entry is string => Boolean(entry)),
        );
      } else {
        input.missingRequirements.push(`unpaywall_http_${response.status}`);
      }
    } catch (error) {
      input.missingRequirements.push(`unpaywall_request_failed:${error instanceof Error ? error.message : "unknown"}`);
    }
  } else if (doi) {
    input.missingRequirements.push("unpaywall_requires_doi_and_UNPAYWALL_EMAIL");
  }

  const coreApiKey = readString(process.env.CORE_API_KEY);
  if (coreApiKey) {
    try {
      const coreQuery = doi ? `doi:${doi}` : input.query;
      const response = await input.fetchImpl(
        `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(coreQuery)}&limit=3`,
        { headers: { ...fetchHeaders(), Authorization: `Bearer ${coreApiKey}` } },
      );
      if (response.ok) {
        const results = readArray(readRecord(await responseJson(response))?.results).map(readRecord);
        for (const result of results) {
          if (!result) continue;
          urls.push(
            ...[
              readString(result.downloadUrl),
              readString(result.url),
            ].filter((entry): entry is string => Boolean(entry)),
          );
        }
      } else {
        input.missingRequirements.push(`core_http_${response.status}`);
      }
    } catch (error) {
      input.missingRequirements.push(`core_request_failed:${error instanceof Error ? error.message : "unknown"}`);
    }
  } else {
    input.missingRequirements.push("core_requires_CORE_API_KEY");
  }
  return unique(urls.filter((url) => /^https?:\/\//i.test(url)));
};

const selectPaper = (input: RunScholarlyFullTextFetchInput): HelixScholarlyPaperResult | null => {
  if (input.paper) return input.paper;
  const papers: HelixScholarlyPaperResult[] = input.papers ?? [];
  const requestedId = input.paperResultId?.trim();
  if (requestedId) {
    const selected = papers.find((paper: HelixScholarlyPaperResult) =>
      paper.result_id === requestedId ||
      paper.identifiers.doi === requestedId ||
      paper.identifiers.arxiv_id === requestedId,
    );
    if (selected) return selected;
  }
  return papers.find((paper: HelixScholarlyPaperResult) => Boolean(resolveScholarlyFullTextUrl(paper))) ?? papers[0] ?? null;
};

const fullTextFetchabilityScore = (paper: HelixScholarlyPaperResult): number => {
  const identifiers = paper.identifiers;
  let score = 0;
  if (identifiers.arxiv_id) score += 100;
  if (identifiers.pdf_url) score += /arxiv\.org\/pdf\//i.test(identifiers.pdf_url) ? 100 : 80;
  if (identifiers.url && /arxiv\.org\/abs\//i.test(identifiers.url)) score += 90;
  if (identifiers.full_text_url) score += /\.pdf(?:[?#].*)?$/i.test(identifiers.full_text_url) ? 70 : 35;
  if (identifiers.url && isLikelyPdfUrl(identifiers.url)) score += 65;
  if (paper.is_open_access) score += 20;
  if (paper.source_providers.includes("arxiv")) score += 40;
  if (paper.source_providers.some((provider) => provider === "unpaywall" || provider === "core")) score += 30;
  if (paper.source_providers.includes("openalex")) score += 5;
  if (identifiers.doi) score += 2;
  return score;
};

const fullTextCandidatePapers = (input: RunScholarlyFullTextFetchInput): HelixScholarlyPaperResult[] => {
  const papers = input.papers ?? [];
  const selected = selectPaper(input);
  const byKey = new Map<string, HelixScholarlyPaperResult>();
  const add = (paper: HelixScholarlyPaperResult | null | undefined): void => {
    if (!paper) return;
    const key = paper.result_id || paper.identifiers.doi || paper.identifiers.arxiv_id || paper.title;
    if (!byKey.has(key)) byKey.set(key, paper);
  };
  add(selected);
  papers
    .filter((paper) => paper !== selected)
    .map((paper, index) => ({ paper, index, score: fullTextFetchabilityScore(paper) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .forEach((entry) => add(entry.paper));
  return Array.from(byKey.values()).filter((paper) => Boolean(resolveScholarlyFullTextUrl(paper)));
};

const fullTextFetchAttemptFor = (
  observation: HelixScholarlyFullTextObservation,
): HelixScholarlyFullTextFetchAttempt => ({
  ...(observation.paper_result_id ? { paper_result_id: observation.paper_result_id } : {}),
  ...(observation.title ? { title: observation.title } : {}),
  ...(observation.source_url ? { source_url: observation.source_url } : {}),
  evidence_state: observation.evidence_state,
  source_kind: observation.source_kind,
  missing_requirements: observation.missing_requirements,
});

const openAccessRecoveryQueries = (query: string, paper: HelixScholarlyPaperResult | null): string[] => {
  const candidates = [
    query,
    paper?.title,
    query.replace(/\bbetween\s+conducting\s+plates\b/i, "parallel conducting plates"),
    query.replace(/\bconducting\s+plates\b/i, "parallel plates"),
    query.includes("Casimir") ? "Casimir effect parallel conducting plates" : null,
  ];
  return unique(candidates
    .filter((entry): entry is string => Boolean(entry?.trim()))
    .map((entry) => entry.replace(/\s+/g, " ").trim()))
    .filter((entry) => entry.length >= 3);
};

export const resolveScholarlyFullTextUrl = (
  paper: HelixScholarlyPaperResult | null | undefined,
): string | null => {
  if (!paper) return null;
  const identifiers = paper.identifiers;
  if (identifiers.arxiv_id) return `https://arxiv.org/pdf/${identifiers.arxiv_id}.pdf`;
  if (identifiers.url && /arxiv\.org\/abs\//i.test(identifiers.url)) {
    return identifiers.url.replace(/\/abs\//i, "/pdf/").replace(/(?:\.pdf)?$/i, ".pdf");
  }
  if (identifiers.pdf_url) return identifiers.pdf_url;
  if (identifiers.full_text_url) return identifiers.full_text_url;
  if (identifiers.url && isLikelyPdfUrl(identifiers.url)) return identifiers.url;
  if (identifiers.doi) return `https://doi.org/${identifiers.doi}`;
  return null;
};

const persistPdfBytes = async (input: {
  bytes: Uint8Array;
  hash: string;
  cacheRoot?: string | null;
}): Promise<{ ref: string; path?: string }> => {
  const ref = `artifact://scholarly-pdf/${input.hash}.pdf`;
  if (input.cacheRoot === null) return { ref };
  const root = input.cacheRoot ?? path.resolve(process.cwd(), "artifacts", "helix", "scholarly-pdfs");
  await fs.mkdir(root, { recursive: true });
  const filePath = path.join(root, `${input.hash}.pdf`);
  await fs.writeFile(filePath, input.bytes);
  return { ref, path: filePath };
};

export const extractPdfTextWithPdfJs: ScholarlyPdfTextExtractor = async (bytes, options) => {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as {
    getDocument: (source: { data: Uint8Array; disableWorker: boolean }) => {
      promise: Promise<{
        numPages: number;
        getPage: (
          pageNum: number,
        ) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string; hasEOL?: boolean }> }> }>;
        cleanup: () => Promise<void> | void;
      }>;
    };
  };
  const doc = await pdfjs.getDocument({ data: bytes, disableWorker: true }).promise;
  const limit = Math.min(doc.numPages, Math.max(1, Math.floor(options.maxPages)));
  const pages: ScholarlyPdfTextPage[] = [];
  try {
    for (let pageNum = 1; pageNum <= limit; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: { str?: string; hasEOL?: boolean }) => {
          const value = typeof item.str === "string" ? item.str : "";
          return item.hasEOL ? `${value}\n` : value;
        })
        .filter(Boolean)
        .join(" ");
      pages.push({ page: pageNum, text: normalizeWhitespace(text) });
    }
  } finally {
    await doc.cleanup();
  }
  return { totalPages: doc.numPages, pages };
};

const tokenize = (value: string): string[] =>
  unique(
    value
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [],
  ).filter((token: string) => !STOPWORDS.has(token)).slice(0, 64);

const inferSectionHint = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  const entries = [
    ["Abstract", /\babstract\b/],
    ["Introduction", /\bintroduction\b/],
    ["Methods", /\b(?:methods?|methodology|experimental setup|materials)\b/],
    ["Results", /\bresults?\b/],
    ["Discussion", /\bdiscussion\b/],
    ["Conclusion", /\bconclusions?\b/],
    ["References", /\breferences\b/],
  ] as const;
  return entries.find((entry: readonly [string, RegExp]) => entry[1].test(lower))?.[0];
};

const buildPageChunks = (pages: ScholarlyPdfTextPage[]): Array<{
  page: number;
  text: string;
  charStart: number;
  charEnd: number;
}> => {
  const chunks: Array<{ page: number; text: string; charStart: number; charEnd: number }> = [];
  for (const page of pages) {
    const text = normalizeWhitespace(page.text);
    if (!text) continue;
    if (text.length <= CHUNK_MAX_CHARS) {
      chunks.push({ page: page.page, text, charStart: 0, charEnd: text.length });
      continue;
    }
    let start = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + CHUNK_MAX_CHARS);
      chunks.push({
        page: page.page,
        text: text.slice(start, end),
        charStart: start,
        charEnd: end,
      });
      if (end >= text.length) break;
      start = Math.max(end - CHUNK_OVERLAP_CHARS, start + 1);
    }
  }
  return chunks;
};

const scoreChunk = (chunkText: string, queryTokens: string[]): number => {
  if (!queryTokens.length) return 0.05;
  const lower = chunkText.toLowerCase();
  const hits = queryTokens.reduce((count: number, token: string) => count + (lower.includes(token) ? 1 : 0), 0);
  const density = hits / Math.sqrt(Math.max(1, queryTokens.length));
  const sectionBoost = /\b(?:abstract|conclusion|results?|methods?|discussion)\b/i.test(chunkText) ? 0.08 : 0;
  return Math.min(1, Number((density / 2 + sectionBoost).toFixed(3)));
};

const selectChunks = (input: {
  pages: ScholarlyPdfTextPage[];
  paper: HelixScholarlyPaperResult | null;
  query: string;
  maxChunks: number;
  sourcePdfRef?: string;
}): HelixScholarlyFullTextChunk[] => {
  const queryTokens = tokenize([input.query, input.paper?.title ?? "", input.paper?.abstract ?? ""].join(" "));
  const scored = buildPageChunks(input.pages).map((chunk: ReturnType<typeof buildPageChunks>[number], index: number) => ({
    chunk,
    index,
    score: scoreChunk(chunk.text, queryTokens),
  }));
  const ranked = scored
    .sort((left: typeof scored[number], right: typeof scored[number]) => right.score - left.score || left.chunk.page - right.chunk.page || left.index - right.index)
    .slice(0, input.maxChunks);
  return ranked.map(({ chunk, score }: typeof ranked[number], index: number) => {
    const sourceTextRef = `${input.sourcePdfRef ?? "artifact://scholarly-source"}/page/${chunk.page}#text`;
    const citationRef = `${input.paper?.result_id ?? "paper"}#page=${chunk.page}`;
    return {
      chunk_id: `scholarly-full-text-chunk:${hashShort([input.paper?.result_id, chunk.page, chunk.charStart, chunk.text])}`,
      ...(input.paper?.result_id ? { paper_result_id: input.paper.result_id } : {}),
      ...(input.paper?.title ? { title: input.paper.title } : {}),
      page_start: chunk.page,
      page_end: chunk.page,
      ...(inferSectionHint(chunk.text) ? { section_hint: inferSectionHint(chunk.text) } : {}),
      text_excerpt: compactExcerpt(chunk.text, index === 0 ? 1400 : 1100),
      relevance_score: score,
      citation_ref: citationRef,
      source_text_ref: sourceTextRef,
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
    };
  });
};

const buildVisualCandidates = (input: {
  pages: ScholarlyPdfTextPage[];
  query: string;
}): HelixScholarlyPdfVisualCandidate[] => {
  const queryNeedsVisual =
    /\b(?:figure|fig\.?|image|diagram|plot|table|equation|formula|scan|ocr|layout|page\s+image)\b/i.test(input.query);
  const candidates: HelixScholarlyPdfVisualCandidate[] = [];
  for (const page of input.pages) {
    const compact = normalizeWhitespace(page.text);
    if (compact.length < 80) {
      candidates.push({
        page: page.page,
        reason: "low_text_pdf_page_needs_visual_or_ocr_pass",
      });
    } else if (queryNeedsVisual && /\b(?:figure|fig\.?|table|equation|formula|plot)\b/i.test(compact)) {
      candidates.push({
        page: page.page,
        reason: "query_mentions_visual_or_layout_evidence_and_page_contains_visual_cue",
      });
    }
    if (candidates.length >= VISUAL_CANDIDATE_LIMIT) break;
  }
  return candidates;
};

const pageRefsFor = (input: {
  pages: ScholarlyPdfTextPage[];
  sourceRef: string;
}): HelixScholarlyFullTextPage[] =>
  input.pages.map((page: ScholarlyPdfTextPage) => {
    const text = normalizeWhitespace(page.text);
    return {
      page: page.page,
      text_char_count: text.length,
      extraction_status: text ? "text" : "empty",
      text_ref: `${input.sourceRef}/page/${page.page}#text`,
    };
  });

const buildFullTextNextAffordances = (input: {
  sourceRef?: string;
  paperResultId?: string;
  visualCandidates: HelixScholarlyPdfVisualCandidate[];
  query: string;
  reason: "page_image_parse_required" | "full_text_unavailable";
}): HelixScholarlyNextAffordance[] => {
  if (input.reason === "page_image_parse_required") {
    return input.visualCandidates.slice(0, 3).map((candidate) => ({
      capability: "visual_analysis.inspect_image_region",
      reason: candidate.reason || "page_image_parse_required",
      source_ref: input.sourceRef ? `${input.sourceRef}/page/${candidate.page}` : undefined,
      paper_result_id: input.paperResultId,
      query: input.query,
    }));
  }
  return [{
    capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    reason: "full_text_unavailable",
    paper_result_id: input.paperResultId,
    query: input.query,
  }];
};

export async function runScholarlyFullTextFetch(
  input: RunScholarlyFullTextFetchInput,
): Promise<HelixScholarlyFullTextObservation> {
  if (!input.sourceUrl && (input.papers?.length ?? 0) > 1) {
    const attempts: HelixScholarlyFullTextFetchAttempt[] = [];
    let firstObservation: HelixScholarlyFullTextObservation | null = null;
    for (const candidatePaper of fullTextCandidatePapers(input)) {
      const observation = await runScholarlyFullTextFetch({
        ...input,
        paper: candidatePaper,
        paperResultId: candidatePaper.result_id,
        papers: null,
      });
      attempts.push(fullTextFetchAttemptFor(observation));
      if (!firstObservation) firstObservation = observation;
      if (observation.evidence_state === "full_text_usable" || observation.evidence_state === "page_image_parse_required") {
        return {
          ...observation,
          full_text_fetch_attempts: attempts,
          missing_requirements: unique([
            ...attempts.flatMap((attempt) => attempt.missing_requirements),
            ...observation.missing_requirements,
          ]),
        };
      }
    }
    if (firstObservation) {
      return {
        ...firstObservation,
        full_text_fetch_attempts: attempts,
        missing_requirements: unique(attempts.flatMap((attempt) => attempt.missing_requirements)),
      };
    }
  }

  if (!input.sourceUrl && (input.papers?.length ?? 0) <= 1 && input.openAccessRecoveryAttempt !== true) {
    const selectedPaper = selectPaper(input);
    const directObservation = selectedPaper ? await runScholarlyFullTextFetch({
      ...input,
      paper: selectedPaper,
      paperResultId: selectedPaper.result_id,
      papers: null,
      sourceUrl: resolveScholarlyFullTextUrl(selectedPaper),
      openAccessRecoveryAttempt: true,
    }) : null;
    if (directObservation?.evidence_state === "full_text_usable" || directObservation?.evidence_state === "page_image_parse_required") {
      return {
        ...directObservation,
        full_text_fetch_attempts: [fullTextFetchAttemptFor(directObservation)],
      };
    }
    const attempts = directObservation ? [fullTextFetchAttemptFor(directObservation)] : [];
    const attemptedIds = new Set(attempts.map((attempt) => attempt.paper_result_id).filter(Boolean));
    const fetchImpl = input.fetchImpl ?? defaultFetch;
    const recoveryMissingRequirements: string[] = [];
    for (const recoveryQuery of openAccessRecoveryQueries(input.query, selectedPaper)) {
      const lookupObservation = await runScholarlyResearchLookup({
        turnId: input.turnId,
        callId: `${input.callId ?? input.turnId}:open_access_recovery:${hashShort(recoveryQuery)}`,
        query: recoveryQuery,
        mode: "paper_search",
        providers: ["arxiv"],
        limit: 5,
        fetchImpl,
      });
      recoveryMissingRequirements.push(...lookupObservation.missing_requirements.map((entry) => `open_access_recovery_${entry}`));
      const recoveryPapers = lookupObservation.papers.filter((paper) => !attemptedIds.has(paper.result_id));
      if (!recoveryPapers.length) continue;
      const recoveredObservation = await runScholarlyFullTextFetch({
        ...input,
        query: recoveryQuery,
        paper: null,
        paperResultId: null,
        papers: recoveryPapers,
        openAccessRecoveryAttempt: true,
      });
      attempts.push(...(recoveredObservation.full_text_fetch_attempts ?? [fullTextFetchAttemptFor(recoveredObservation)]));
      if (recoveredObservation.evidence_state === "full_text_usable" || recoveredObservation.evidence_state === "page_image_parse_required") {
        return {
          ...recoveredObservation,
          full_text_fetch_attempts: attempts,
          missing_requirements: unique([
            ...attempts.flatMap((attempt) => attempt.missing_requirements),
            ...recoveryMissingRequirements,
            ...recoveredObservation.missing_requirements,
          ]),
        };
      }
    }
    if (directObservation) {
      return {
        ...directObservation,
        full_text_fetch_attempts: attempts,
        missing_requirements: unique([
          ...attempts.flatMap((attempt) => attempt.missing_requirements),
          ...recoveryMissingRequirements,
        ]),
      };
    }
  }

  if (input.sourceUrl && input.openAccessRecoveryAttempt !== true) {
    const selectedPaper = selectPaper(input);
    const directObservation = await runScholarlyFullTextFetch({
      ...input,
      openAccessRecoveryAttempt: true,
    });
    if (directObservation.evidence_state === "full_text_usable" || directObservation.evidence_state === "page_image_parse_required") {
      return {
        ...directObservation,
        full_text_fetch_attempts: [fullTextFetchAttemptFor(directObservation)],
      };
    }
    const attempts = [fullTextFetchAttemptFor(directObservation)];
    const fetchImpl = input.fetchImpl ?? defaultFetch;
    const recoveryMissingRequirements: string[] = [];
    for (const recoveryQuery of openAccessRecoveryQueries(input.query, selectedPaper)) {
      const lookupObservation = await runScholarlyResearchLookup({
        turnId: input.turnId,
        callId: `${input.callId ?? input.turnId}:open_access_recovery:${hashShort(recoveryQuery)}`,
        query: recoveryQuery,
        mode: "paper_search",
        providers: ["arxiv"],
        limit: 5,
        fetchImpl,
      });
      recoveryMissingRequirements.push(...lookupObservation.missing_requirements.map((entry) => `open_access_recovery_${entry}`));
      if (!lookupObservation.papers.length) continue;
      const recoveredObservation = await runScholarlyFullTextFetch({
        ...input,
        query: recoveryQuery,
        paper: null,
        paperResultId: null,
        sourceUrl: null,
        papers: lookupObservation.papers,
        openAccessRecoveryAttempt: true,
      });
      attempts.push(...(recoveredObservation.full_text_fetch_attempts ?? [fullTextFetchAttemptFor(recoveredObservation)]));
      if (recoveredObservation.evidence_state === "full_text_usable" || recoveredObservation.evidence_state === "page_image_parse_required") {
        return {
          ...recoveredObservation,
          full_text_fetch_attempts: attempts,
          missing_requirements: unique([
            ...attempts.flatMap((attempt) => attempt.missing_requirements),
            ...recoveryMissingRequirements,
            ...recoveredObservation.missing_requirements,
          ]),
        };
      }
    }
    return {
      ...directObservation,
      full_text_fetch_attempts: attempts,
      missing_requirements: unique([
        ...attempts.flatMap((attempt) => attempt.missing_requirements),
        ...recoveryMissingRequirements,
      ]),
    };
  }

  const query = input.query.trim();
  const paper = selectPaper(input);
  const sourceUrl = normalizeScholarlyFullTextSourceUrl(
    input.sourceUrl?.trim() || resolveScholarlyFullTextUrl(paper),
  );
  const maxPages = Math.max(1, Math.min(Number(input.maxPages) || DEFAULT_MAX_PAGES, MAX_PAGES));
  const maxChunks = Math.max(1, Math.min(Number(input.maxChunks) || DEFAULT_MAX_CHUNKS, MAX_CHUNKS));
  const missingRequirements: string[] = [];
  const fetchImpl = input.fetchImpl ?? defaultFetch;
  const extractPdfTextImpl = input.extractPdfTextImpl ?? extractPdfTextWithPdfJs;
  let sourceKind: HelixScholarlyFullTextSourceKind = "unknown";
  let sourcePdfRef: string | undefined;
  let cachePath: string | undefined;
  let cacheIntegrityHash: string | undefined;
  let extraction: ScholarlyPdfTextExtraction = { pages: [] };

  if (!query) missingRequirements.push("query_required");
  if (!sourceUrl) missingRequirements.push("pdf_or_full_text_url_required");

  if (sourceUrl) {
    try {
      const response = await fetchImpl(sourceUrl, { headers: fetchHeaders() });
      if (!response.ok || !response.arrayBuffer) {
        missingRequirements.push(`full_text_http_${response.status}`);
      } else {
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = response.headers?.get("content-type")?.toLowerCase() ?? "";
        const looksText = contentType.includes("html") || contentType.includes("text");
        const looksPdf = isLikelyPdfBytes(bytes) || contentType.includes("pdf") || (!looksText && isLikelyPdfUrl(sourceUrl));
        if (looksPdf) {
          sourceKind = "pdf";
          cacheIntegrityHash = hashBuffer(bytes);
          const persisted = input.cachePdf === false
            ? { ref: `artifact://scholarly-pdf/${cacheIntegrityHash}.pdf` }
            : await persistPdfBytes({ bytes, hash: cacheIntegrityHash, cacheRoot: input.cacheRoot });
          sourcePdfRef = persisted.ref;
          cachePath = persisted.path;
          extraction = await extractPdfTextImpl(bytes, { maxPages });
        } else if (contentType.includes("html") || contentType.includes("text") || /<html|<!doctype html/i.test(decodeTextBytes(bytes).slice(0, 2000))) {
          const decoded = decodeTextBytes(bytes);
          const sniffedPdfUrl = sniffPdfUrlFromHtml(decoded, sourceUrl);
          const sourceIsDoiLanding = /doi\.org\//i.test(sourceUrl);
          if (sniffedPdfUrl) {
            try {
              const pdfResponse = await fetchImpl(sniffedPdfUrl, { headers: fetchHeaders() });
              if (pdfResponse.ok && pdfResponse.arrayBuffer) {
                const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
                const pdfContentType = pdfResponse.headers?.get("content-type")?.toLowerCase() ?? "";
                if (isLikelyPdfBytes(pdfBytes) || pdfContentType.includes("pdf") || isLikelyPdfUrl(sniffedPdfUrl)) {
                  sourceKind = "pdf";
                  cacheIntegrityHash = hashBuffer(pdfBytes);
                  const persisted = input.cachePdf === false
                    ? { ref: `artifact://scholarly-pdf/${cacheIntegrityHash}.pdf` }
                    : await persistPdfBytes({ bytes: pdfBytes, hash: cacheIntegrityHash, cacheRoot: input.cacheRoot });
                  sourcePdfRef = persisted.ref;
                  cachePath = persisted.path;
                  extraction = await extractPdfTextImpl(pdfBytes, { maxPages });
                } else {
                  missingRequirements.push("doi_landing_pdf_link_was_not_pdf");
                }
              } else {
                missingRequirements.push(`doi_landing_pdf_http_${pdfResponse.status}`);
              }
            } catch (error) {
              missingRequirements.push(`doi_landing_pdf_request_failed:${error instanceof Error ? error.message : "unknown"}`);
            }
          }
          if (!sourcePdfRef && sourceIsDoiLanding) {
            missingRequirements.push("doi_landing_pdf_not_found");
          }
          if (!sourcePdfRef && !sourceIsDoiLanding) {
            sourceKind = contentType.includes("html") ? "html" : "unknown";
            const text = contentType.includes("html") ? stripHtml(decoded) : decoded;
            const sourceHash = hashBuffer(bytes);
            cacheIntegrityHash = sourceHash;
            sourcePdfRef = `artifact://scholarly-full-text/${sourceHash}`;
            extraction = {
              totalPages: 1,
              pages: [{ page: 1, text: normalizeWhitespace(text) }],
            };
          }
        } else {
          missingRequirements.push("source_was_not_pdf_html_or_text");
        }
      }
    } catch (error) {
      missingRequirements.push(`full_text_request_failed:${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  if (!sourcePdfRef) {
    const doi = paper?.identifiers.doi ?? null;
    const fallbackUrls = await configuredOpenAccessFallbackUrls({
      doi,
      query,
      fetchImpl,
      missingRequirements,
    });
    for (const fallbackUrl of fallbackUrls) {
      if (sourcePdfRef) break;
      try {
        const response = await fetchImpl(fallbackUrl, { headers: fetchHeaders() });
        if (!response.ok || !response.arrayBuffer) {
          missingRequirements.push(`open_access_fallback_http_${response.status}`);
          continue;
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = response.headers?.get("content-type")?.toLowerCase() ?? "";
        const looksText = contentType.includes("html") || contentType.includes("text");
        const looksPdf = isLikelyPdfBytes(bytes) || contentType.includes("pdf") || (!looksText && isLikelyPdfUrl(fallbackUrl));
        if (looksPdf) {
          sourceKind = "pdf";
          cacheIntegrityHash = hashBuffer(bytes);
          const persisted = input.cachePdf === false
            ? { ref: `artifact://scholarly-pdf/${cacheIntegrityHash}.pdf` }
            : await persistPdfBytes({ bytes, hash: cacheIntegrityHash, cacheRoot: input.cacheRoot });
          sourcePdfRef = persisted.ref;
          cachePath = persisted.path;
          extraction = await extractPdfTextImpl(bytes, { maxPages });
          break;
        }
        if (contentType.includes("html") || contentType.includes("text") || /<html|<!doctype html/i.test(decodeTextBytes(bytes).slice(0, 2000))) {
          const decoded = decodeTextBytes(bytes);
          const sniffedPdfUrl = sniffPdfUrlFromHtml(decoded, fallbackUrl);
          if (!sniffedPdfUrl) continue;
          const pdfResponse = await fetchImpl(sniffedPdfUrl, { headers: fetchHeaders() });
          if (!pdfResponse.ok || !pdfResponse.arrayBuffer) {
            missingRequirements.push(`open_access_fallback_pdf_http_${pdfResponse.status}`);
            continue;
          }
          const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
          const pdfContentType = pdfResponse.headers?.get("content-type")?.toLowerCase() ?? "";
          if (!isLikelyPdfBytes(pdfBytes) && !pdfContentType.includes("pdf") && !isLikelyPdfUrl(sniffedPdfUrl)) {
            missingRequirements.push("open_access_fallback_pdf_link_was_not_pdf");
            continue;
          }
          sourceKind = "pdf";
          cacheIntegrityHash = hashBuffer(pdfBytes);
          const persisted = input.cachePdf === false
            ? { ref: `artifact://scholarly-pdf/${cacheIntegrityHash}.pdf` }
            : await persistPdfBytes({ bytes: pdfBytes, hash: cacheIntegrityHash, cacheRoot: input.cacheRoot });
          sourcePdfRef = persisted.ref;
          cachePath = persisted.path;
          extraction = await extractPdfTextImpl(pdfBytes, { maxPages });
          break;
        }
      } catch (error) {
        missingRequirements.push(`open_access_fallback_request_failed:${error instanceof Error ? error.message : "unknown"}`);
      }
    }
  }

  if (sourceKind === "pdf" && extraction.pages.length === 0 && !missingRequirements.some((entry: string) => entry.includes("text_extraction"))) {
    missingRequirements.push("pdf_text_extraction_returned_no_pages");
  }

  const pages = extraction.pages.slice(0, maxPages);
  const pageTextRefs = sourcePdfRef ? pageRefsFor({ pages, sourceRef: sourcePdfRef }) : [];
  const selectedChunks = selectChunks({
    pages,
    paper,
    query,
    maxChunks,
    sourcePdfRef,
  }).filter((chunk: HelixScholarlyFullTextChunk) => chunk.text_excerpt.length > 0);
  if (pages.length > 0 && selectedChunks.length === 0) {
    missingRequirements.push("no_relevant_full_text_chunks_selected");
  }
  const visualCandidates = buildVisualCandidates({ pages, query });
  const lowTextPageImageRequired =
    visualCandidates.some((candidate) => candidate.reason === "low_text_pdf_page_needs_visual_or_ocr_pass") &&
    selectedChunks.every((chunk) => chunk.text_excerpt.length < 80);
  const evidenceState = selectedChunks.length > 0 && !lowTextPageImageRequired
    ? "full_text_usable"
    : visualCandidates.length > 0
      ? "page_image_parse_required"
      : "full_text_unavailable";
  if (evidenceState === "page_image_parse_required") {
    missingRequirements.push("page_image_parse_required");
  }
  const nextAffordances = buildFullTextNextAffordances({
    sourceRef: sourcePdfRef,
    paperResultId: paper?.result_id,
    visualCandidates,
    query,
    reason: evidenceState === "page_image_parse_required" ? "page_image_parse_required" : "full_text_unavailable",
  });

  let researchLibraryDocumentRef: string | null = null;
  let researchLibraryPersistenceStatus: "saved" | "not_requested" | "failed" = "not_requested";
  let researchLibraryPersistenceReason: string | null = null;
  const researchLibraryProfileId = readString(input.researchLibraryProfileId);
  if (
    researchLibraryProfileId &&
    sourcePdfRef &&
    cacheIntegrityHash &&
    pages.length > 0 &&
    (evidenceState === "full_text_usable" || evidenceState === "page_image_parse_required")
  ) {
    try {
      const saved = await saveResearchLibraryExtraction({
        profile_id: researchLibraryProfileId,
        title: paper?.title ?? sourceUrl ?? "Extracted research paper",
        source_url: sourceUrl,
        source_kind: sourceKind,
        source_pdf_ref: sourcePdfRef,
        source_integrity_hash: cacheIntegrityHash,
        paper_result_id: paper?.result_id,
        query,
        extraction_status: evidenceState,
        pages: pages.map((page) => ({
          page: page.page,
          text: page.text,
          text_char_count: page.text.length,
          extraction_status: page.text.trim() ? "text" : "empty",
          source_text_ref: `${sourcePdfRef}#page=${page.page}&text`,
        })),
      });
      researchLibraryDocumentRef = saved.document_id;
      researchLibraryPersistenceStatus = "saved";
    } catch (error) {
      researchLibraryPersistenceStatus = "failed";
      researchLibraryPersistenceReason = error instanceof Error ? error.message : "research_library_persistence_failed";
    }
  }

  return {
    schema: HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
    artifact_id: `${input.callId ?? input.turnId}:scholarly_full_text_observation`,
    turn_id: input.turnId,
    capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    query,
    ...(paper?.result_id ? { paper_result_id: paper.result_id } : {}),
    ...(paper?.title ? { title: paper.title } : {}),
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    source_kind: sourceKind,
    ...(sourcePdfRef ? { source_pdf_ref: sourcePdfRef } : {}),
    ...(cacheIntegrityHash ? { cache_integrity_hash: cacheIntegrityHash } : {}),
    ...(cachePath ? { cache_path: cachePath } : {}),
    ...(typeof extraction.totalPages === "number" ? { total_pages: extraction.totalPages } : {}),
    pages_parsed: pages.length,
    page_text_refs: pageTextRefs,
    selected_chunks: selectedChunks,
    visual_candidates: visualCandidates,
    evidence_state: evidenceState,
    next_affordances: evidenceState === "full_text_usable" ? [] : nextAffordances,
    missing_requirements: unique(missingRequirements),
    selected_for_answer: evidenceState === "full_text_usable",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    ...(researchLibraryDocumentRef ? { research_library_document_ref: researchLibraryDocumentRef } : {}),
    research_library_persistence_status: researchLibraryPersistenceStatus,
    ...(researchLibraryPersistenceReason ? { research_library_persistence_reason: researchLibraryPersistenceReason } : {}),
  };
}
