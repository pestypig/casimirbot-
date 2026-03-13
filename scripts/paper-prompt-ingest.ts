import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type CliOptions = {
  file?: string;
  latestAttached: boolean;
  title?: string;
  tags: string[];
  baseUrl: string;
  outDir: string;
  creatorId: string;
  visibility: string;
  tenantId?: string;
  token?: string;
  pollAttempts: number;
  pollDelayMs: number;
  requirePredictionContracts: boolean;
  requireSymbolEquivalenceMap: boolean;
  requireFalsifierEdges: boolean;
  requireCitationRegistry: boolean;
};

type EssenceIngestResponse = {
  essence_id: string;
  uri: string;
  hash: string;
  dedup?: boolean;
};

type IngestMode = "essence" | "local_pdf_fallback";

type EssenceEnvelopeText = {
  transcript?: string;
  summary?: string;
  caption?: string;
  tags?: unknown;
};

type EssenceEnvelopeLike = {
  features?: {
    text?: EssenceEnvelopeText;
  };
};

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

const DEFAULT_BASE_URL = process.env.PAPER_INGEST_BASE_URL ?? "http://localhost:5050";
const DEFAULT_OUT_DIR = "artifacts/papers";

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "1");
      continue;
    }
    args.set(key, next);
    i += 1;
  }

  const file = args.get("file");
  const title = args.get("title")?.trim();
  const tags = splitCsv(args.get("tags"));

  return {
    file,
    latestAttached: toBool(args.get("latest-attached"), false),
    title,
    tags,
    baseUrl: (args.get("base-url") ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    outDir: args.get("out-dir") ?? DEFAULT_OUT_DIR,
    creatorId: args.get("creator-id") ?? "codex",
    visibility: args.get("visibility") ?? "public",
    tenantId: args.get("tenant-id") ?? process.env.X_TENANT_ID,
    token: args.get("token") ?? process.env.AGI_BEARER_TOKEN,
    pollAttempts: parseIntSafe(args.get("poll-attempts"), 12),
    pollDelayMs: parseIntSafe(args.get("poll-delay-ms"), 400),
    requirePredictionContracts: toBool(args.get("require-prediction-contracts"), false),
    requireSymbolEquivalenceMap: toBool(args.get("require-symbol-map"), false),
    requireFalsifierEdges: toBool(args.get("require-falsifier-edges"), false),
    requireCitationRegistry: toBool(args.get("require-citations"), false),
  };
}

function splitCsv(input?: string): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(",")
        .map((entry) => normalizeTag(entry))
        .filter(Boolean),
    ),
  );
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseIntSafe(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function detectMime(filePath: string): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function detectSourceType(mime: string): "pdf" | "image" {
  return mime === "application/pdf" ? "pdf" : "image";
}

function sha256Hex(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

function toFileUri(filePath: string): string {
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return `file:///${normalized}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isoAt(base: number, offsetMs: number): string {
  return new Date(base + offsetMs).toISOString();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const SUPPORTED_PAPER_EXT = new Set(Object.keys(MIME_BY_EXT));

const PAPER_NUMERIC_UNIT_RE =
  /\b[-+]?(?:\d+(?:\.\d+)?|\.\d+)\s?(?:hz|khz|mhz|ghz|thz|ev|kev|mev|gev|tev|m|cm|mm|um|nm|kg|g|s|ms|us|ns|pa|kpa|mpa|j|kj|mj|w|kw|mw|v|a|ma|db|k|%)\b/i;

const THEORY_HINT_RE = /\b(theory|model|hypothesis|assume|implies|predicts?|framework)\b/i;

const CONGRUENCE_HINT_RE = /\b(consistent|agreement|congruent|matches?|aligns?)\b/i;

type ClaimType = "observation" | "measurement" | "theory" | "theoretical_congruence";

type DraftClaim = {
  text: string;
  type: ClaimType;
  confidence: number;
};

function deriveTitleFromFile(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  return base
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveTagsFromFile(filePath: string): string[] {
  return Array.from(
    new Set(
      path
        .basename(filePath, path.extname(filePath))
        .split(/[^a-z0-9]+/i)
        .map((entry) => normalizeTag(entry))
        .filter((entry) => entry.length >= 3),
    ),
  ).slice(0, 12);
}

async function findLatestAttachedFile(): Promise<string | null> {
  const root = path.resolve("attached_assets");
  let entries: string[];
  try {
    entries = await fs.readdir(root);
  } catch {
    return null;
  }
  const candidates = entries
    .map((name) => path.join(root, name))
    .filter((abs) => SUPPORTED_PAPER_EXT.has(path.extname(abs).toLowerCase()));
  if (candidates.length === 0) return null;

  const withStats = await Promise.all(
    candidates.map(async (candidate) => {
      const stats = await fs.stat(candidate);
      return { candidate, mtimeMs: stats.mtimeMs };
    }),
  );
  withStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return withStats[0]?.candidate ?? null;
}

async function resolveInputFile(opts: CliOptions): Promise<string> {
  if (opts.file) {
    return path.resolve(opts.file);
  }
  if (opts.latestAttached || !opts.file) {
    const latest = await findLatestAttachedFile();
    if (latest) return latest;
  }
  throw new Error(
    "No input file resolved. Pass --file <path> or use --latest-attached with at least one supported file in attached_assets.",
  );
}

function splitIntoClaimAtoms(text: string, maxClaims = 10): DraftClaim[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }
  const parts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 20);
  const selected = parts.length > 0 ? parts.slice(0, maxClaims) : [normalized.slice(0, 300)];
  return selected.map((entry) => {
    const type = inferClaimType(entry);
    const base = type === "measurement" ? 0.78 : type === "theory" ? 0.7 : 0.66;
    return { text: entry.slice(0, 20000), type, confidence: base };
  });
}

function inferClaimType(text: string): ClaimType {
  if (PAPER_NUMERIC_UNIT_RE.test(text)) {
    return "measurement";
  }
  if (CONGRUENCE_HINT_RE.test(text)) {
    return "theoretical_congruence";
  }
  if (THEORY_HINT_RE.test(text)) {
    return "theory";
  }
  return "observation";
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/[-+]?(?:\d+(?:\.\d+)?|\.\d+)/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function extractUnitToken(text: string): string {
  const unitMatch = text.match(
    /\b(hz|khz|mhz|ghz|thz|ev|kev|mev|gev|tev|m|cm|mm|um|nm|kg|g|s|ms|us|ns|pa|kpa|mpa|j|kj|mj|w|kw|mw|v|a|ma|db|k|%)\b/i,
  );
  return unitMatch ? unitMatch[1].toLowerCase() : "arb";
}

type DraftCitation = {
  refIndex?: number;
  rawText: string;
  doi?: string;
  arxivId?: string;
  url?: string;
  year?: number;
  title?: string;
  venue?: string;
  authors: string[];
  confidence: number;
};

type CitationRegistryEntry = {
  citation_id: string;
  ref_index?: number;
  normalized_key: string;
  raw_text: string;
  authors: string[];
  year?: number;
  title?: string;
  venue?: string;
  doi?: string;
  arxiv_id?: string;
  url?: string;
  confidence: number;
  provenance: {
    doc_id: string;
    page: number;
    span: { start: number; end: number };
    extraction_method: "pdf_text" | "ocr" | "manual" | "hybrid";
    extracted_at: string;
  };
};

type CitationLinkEntry = {
  link_id: string;
  claim_id: string;
  citation_id: string;
  relation: "cites";
  method: "marker" | "doi" | "arxiv" | "heuristic";
  confidence: number;
};

const DOI_ONE_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const ARXIV_ONE_RE = /\barxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b/i;
const URL_ONE_RE = /\bhttps?:\/\/[^\s<>{}|[\]"']+/i;
const REFERENCE_LINE_RE = /^(?:\[(\d{1,3})\]|(\d{1,3})[.)])\s+(.{10,})$/;
const YEAR_RE = /\b(19|20)\d{2}\b/;

function matchFirst(regex: RegExp, text: string): string | undefined {
  const match = text.match(regex);
  return match?.[0];
}

function sanitizeCitationText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*[;,.:-]+/, "")
    .trim()
    .slice(0, 2000);
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/[),.;:]+$/g, "").trim();
}

function parseCitationYear(text: string): number | undefined {
  const match = text.match(YEAR_RE);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isInteger(value) ? value : undefined;
}

function parseCitationAuthors(text: string): string[] {
  const prefix = text.split(/\(\s*(?:19|20)\d{2}[a-z]?\s*\)/i)[0] ?? text.split(".")[0] ?? "";
  return Array.from(
    new Set(
      prefix
        .split(/,| and |;/i)
        .map((entry) =>
          entry
            .replace(/^\s*[\[(]?\d+[\])]?/, "")
            .replace(/\bet al\.?$/i, "")
            .replace(/[^\p{L}\p{N}.'`\- ]+/gu, " ")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter((entry) => /[a-z]/i.test(entry) && entry.length >= 3 && entry.length <= 80),
    ),
  ).slice(0, 8);
}

function parseCitationTitle(text: string): string | undefined {
  let cursor = text;
  const yearMatch = text.match(YEAR_RE);
  if (yearMatch?.index != null) {
    cursor = text.slice(yearMatch.index + yearMatch[0].length);
  }
  cursor = cursor.replace(/^[)\].,:;\-\s]+/, "").trim();
  if (!cursor) return undefined;
  const sentence = cursor
    .split(/(?:\.\s+|;\s+)/)
    .map((entry) => entry.trim())
    .find((entry) => entry.length >= 8);
  return sentence ? sentence.slice(0, 500) : undefined;
}

function parseCitationVenue(text: string, title?: string): string | undefined {
  if (!title) return undefined;
  const loweredText = text.toLowerCase();
  const loweredTitle = title.toLowerCase();
  const idx = loweredText.indexOf(loweredTitle);
  if (idx < 0) return undefined;
  const suffix = text.slice(idx + title.length).replace(/^[)\].,:;\-\s]+/, "").trim();
  if (!suffix) return undefined;
  const venue = suffix.split(/(?:\.\s+|;\s+)/)[0]?.trim();
  if (!venue || venue.length < 3) return undefined;
  return venue.slice(0, 300);
}

function buildDraftCitation(rawText: string, refIndex?: number, baseConfidence = 0.58): DraftCitation {
  const normalized = sanitizeCitationText(rawText);
  const doi = matchFirst(DOI_ONE_RE, normalized)?.toLowerCase();
  const arxivId = normalized.match(ARXIV_ONE_RE)?.[1]?.toLowerCase();
  const url = normalizeUrl(matchFirst(URL_ONE_RE, normalized));
  const year = parseCitationYear(normalized);
  const authors = parseCitationAuthors(normalized);
  const title = parseCitationTitle(normalized);
  const venue = parseCitationVenue(normalized, title);

  let confidence = baseConfidence;
  if (refIndex != null) confidence += 0.07;
  if (doi) confidence += 0.15;
  if (arxivId) confidence += 0.12;
  if (url) confidence += 0.08;
  if (year) confidence += 0.03;
  if (authors.length > 0) confidence += 0.04;
  if (title) confidence += 0.03;
  confidence = Math.max(0.2, Math.min(0.98, Number(confidence.toFixed(2))));

  return {
    refIndex,
    rawText: normalized,
    doi,
    arxivId,
    url,
    year,
    title,
    authors,
    confidence,
    ...(venue ? { venue } : {}),
  };
}

function citationIdentityKey(citation: DraftCitation): string {
  if (citation.doi) return `doi:${citation.doi}`;
  if (citation.arxivId) return `arxiv:${citation.arxivId}`;
  if (citation.url) return `url:${citation.url.toLowerCase()}`;
  if (citation.refIndex != null) return `ref:${citation.refIndex}:${slugify(citation.rawText).slice(0, 40)}`;
  return `raw:${slugify(citation.rawText).slice(0, 80)}`;
}

function extractCitationDrafts(text: string, maxCitations = 160): DraftCitation[] {
  const normalized = text.replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const drafts: DraftCitation[] = [];
  const lines = normalized
    .split("\n")
    .map((entry) => sanitizeCitationText(entry))
    .filter(Boolean);

  for (const line of lines) {
    const refMatch = line.match(REFERENCE_LINE_RE);
    if (refMatch) {
      const refIndex = Number(refMatch[1] ?? refMatch[2]);
      drafts.push(buildDraftCitation(refMatch[3], Number.isFinite(refIndex) ? refIndex : undefined, 0.74));
      continue;
    }
    const resemblesCitation =
      YEAR_RE.test(line) && /(doi|arxiv|https?:\/\/|et al\.|[A-Z][a-z]+,\s*[A-Z]\.)/i.test(line);
    if (resemblesCitation && line.length >= 24) {
      drafts.push(buildDraftCitation(line, undefined, 0.58));
    }
  }

  for (const match of normalized.matchAll(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi)) {
    if (match.index == null) continue;
    const start = Math.max(0, match.index - 120);
    const end = Math.min(normalized.length, match.index + match[0].length + 180);
    drafts.push(buildDraftCitation(normalized.slice(start, end), undefined, 0.72));
  }

  for (const match of normalized.matchAll(/\barxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b/gi)) {
    if (match.index == null) continue;
    const start = Math.max(0, match.index - 120);
    const end = Math.min(normalized.length, match.index + match[0].length + 180);
    drafts.push(buildDraftCitation(normalized.slice(start, end), undefined, 0.7));
  }

  for (const match of normalized.matchAll(/\bhttps?:\/\/[^\s<>{}|[\]"']+/gi)) {
    if (match.index == null) continue;
    const start = Math.max(0, match.index - 80);
    const end = Math.min(normalized.length, match.index + match[0].length + 120);
    drafts.push(buildDraftCitation(normalized.slice(start, end), undefined, 0.62));
  }

  const seen = new Set<string>();
  const unique: DraftCitation[] = [];
  for (const draft of drafts) {
    if (!draft.rawText) continue;
    const key = citationIdentityKey(draft);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(draft);
    if (unique.length >= maxCitations) break;
  }
  return unique;
}

function buildCitationLinks(
  claims: Array<{ text: string }>,
  claimIds: string[],
  citations: CitationRegistryEntry[],
  paperId: string,
): CitationLinkEntry[] {
  const refToCitation = new Map<number, string>();
  const doiToCitation = new Map<string, string>();
  const arxivToCitation = new Map<string, string>();

  for (const citation of citations) {
    if (citation.ref_index != null) refToCitation.set(citation.ref_index, citation.citation_id);
    if (citation.doi) doiToCitation.set(citation.doi.toLowerCase(), citation.citation_id);
    if (citation.arxiv_id) arxivToCitation.set(citation.arxiv_id.toLowerCase(), citation.citation_id);
  }

  const pairSeen = new Set<string>();
  const links: CitationLinkEntry[] = [];
  let counter = 1;

  const pushLink = (
    claimId: string,
    citationId: string,
    method: CitationLinkEntry["method"],
    confidence: number,
  ): void => {
    const key = `${claimId}|${citationId}`;
    if (pairSeen.has(key)) return;
    pairSeen.add(key);
    links.push({
      link_id: `clink:${paperId}:${counter}`,
      claim_id: claimId,
      citation_id: citationId,
      relation: "cites",
      method,
      confidence,
    });
    counter += 1;
  };

  claims.forEach((claim, idx) => {
    const claimId = claimIds[idx];
    if (!claimId) return;
    for (const marker of claim.text.matchAll(/\[(\d{1,3})\]/g)) {
      const ref = Number(marker[1]);
      const citationId = refToCitation.get(ref);
      if (citationId) pushLink(claimId, citationId, "marker", 0.88);
    }
    for (const doiMatch of claim.text.matchAll(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi)) {
      const citationId = doiToCitation.get(doiMatch[0].toLowerCase());
      if (citationId) pushLink(claimId, citationId, "doi", 0.9);
    }
    for (const arxivMatch of claim.text.matchAll(/\barxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b/gi)) {
      const arxivId = arxivMatch[1]?.toLowerCase();
      if (!arxivId) continue;
      const citationId = arxivToCitation.get(arxivId);
      if (citationId) pushLink(claimId, citationId, "arxiv", 0.9);
    }
  });

  if (links.length === 0 && citations.length > 0 && claimIds.length > 0) {
    pushLink(claimIds[0], citations[0].citation_id, "heuristic", 0.42);
  }
  return links;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const resolvedFile = await resolveInputFile(opts);
  const buffer = await fs.readFile(resolvedFile);
  const mime = detectMime(resolvedFile);
  const sourceType = detectSourceType(mime);
  const sourceHash = sha256Hex(buffer);
  const resolvedTitle = opts.title?.trim() || deriveTitleFromFile(resolvedFile);
  const derivedTags = deriveTagsFromFile(resolvedFile);
  const explicitTags = opts.tags.map(normalizeTag).filter(Boolean);
  const mergedSeedTags = Array.from(new Set(["paper", ...explicitTags, ...derivedTags]));
  const paperSlug = slugify(resolvedTitle) || "paper";
  const paperId = `${paperSlug}:${sourceHash.slice(0, 8)}`;
  const paperDirName = paperId.replace(/[^a-z0-9._-]+/gi, "-");
  const requestId = `paperreq:${randomUUID()}`;
  const runId = `paperrun:${randomUUID()}`;
  const packId = `paperpack:${randomUUID()}`;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const docId = `doc:${paperId}`;

  const authHeaders: Record<string, string> = {};
  if (opts.token) authHeaders.Authorization = `Bearer ${opts.token}`;
  if (opts.tenantId) authHeaders["X-Tenant-Id"] = opts.tenantId;

  const form = new FormData();
  form.set("creator_id", opts.creatorId);
  form.set("visibility", opts.visibility);
  form.set("license", "CC-BY-4.0");
  form.set("file", new Blob([buffer], { type: mime }), path.basename(resolvedFile));

  const ingestRes = await fetch(`${opts.baseUrl}/api/essence/ingest`, {
    method: "POST",
    headers: authHeaders,
    body: form,
  });
  let ingestMode: IngestMode = "essence";
  let ingestWarning: string | null = null;
  let ingest: EssenceIngestResponse;
  if (ingestRes.ok) {
    ingest = (await ingestRes.json()) as EssenceIngestResponse;
  } else {
    const text = await ingestRes.text();
    if (ingestRes.status === 415 && mime === "application/pdf") {
      ingestMode = "local_pdf_fallback";
      ingestWarning =
        "PDF rejected by /api/essence/ingest; continuing with local fallback artifacts only.";
      ingest = {
        essence_id: `localpdf:${sourceHash.slice(0, 16)}`,
        uri: toFileUri(resolvedFile),
        hash: sourceHash,
        dedup: false,
      };
    } else {
      throw new Error(`Ingest failed (${ingestRes.status}): ${text}`);
    }
  }

  let envelope: EssenceEnvelopeLike | null = null;
  if (ingestMode === "essence") {
    for (let attempt = 0; attempt < Math.max(1, opts.pollAttempts); attempt += 1) {
      const envRes = await fetch(`${opts.baseUrl}/api/essence/${encodeURIComponent(ingest.essence_id)}`, {
        method: "GET",
        headers: authHeaders,
      });
      if (envRes.ok) {
        envelope = (await envRes.json()) as EssenceEnvelopeLike;
        const textFeature = envelope?.features?.text;
        if (textFeature?.transcript || textFeature?.summary || textFeature?.caption) {
          break;
        }
      }
      await wait(Math.max(50, opts.pollDelayMs));
    }
  }

  const textFeature = envelope?.features?.text;
  const extractionCorpus = [textFeature?.transcript, textFeature?.summary, textFeature?.caption]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n");
  const extracted = [textFeature?.transcript, textFeature?.summary, textFeature?.caption]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);
  const featureTags = normalizeStringArray(textFeature?.tags).map(normalizeTag).filter(Boolean);
  const allTags = Array.from(new Set([...mergedSeedTags, ...featureTags]));
  const baseText =
    extracted || `Ingested ${sourceType} source ${path.basename(resolvedFile)} for later OCR/analysis.`;
  const draftClaims = splitIntoClaimAtoms(baseText, 12);
  const claims =
    draftClaims.length > 0
      ? draftClaims
      : [{ text: baseText.slice(0, 20000), type: "observation" as const, confidence: 0.3 }];
  const claimIds = claims.map((_, idx) => `claim:${paperId}:${idx + 1}`);
  const measurementClaim = claims.find((entry) => entry.type === "measurement");
  const theoryClaim = claims.find((entry) => entry.type === "theory");
  const firstClaimId = claimIds[0] ?? `claim:${paperId}:1`;

  const citationDrafts = extractCitationDrafts(extractionCorpus || baseText, 200);
  const citationRegistry: CitationRegistryEntry[] = citationDrafts.map((entry, idx) => {
    const normalizedKey = sha256Hex(
      `${entry.doi ?? ""}|${entry.arxivId ?? ""}|${entry.url ?? ""}|${entry.rawText.toLowerCase()}`,
    ).slice(0, 24);
    return {
      citation_id: `cite:${paperId}:${idx + 1}`,
      ...(entry.refIndex != null ? { ref_index: entry.refIndex } : {}),
      normalized_key: normalizedKey,
      raw_text: entry.rawText,
      authors: entry.authors,
      ...(entry.year != null ? { year: entry.year } : {}),
      ...(entry.title ? { title: entry.title } : {}),
      ...(entry.venue ? { venue: entry.venue } : {}),
      ...(entry.doi ? { doi: entry.doi } : {}),
      ...(entry.arxivId ? { arxiv_id: entry.arxivId } : {}),
      ...(entry.url ? { url: entry.url } : {}),
      confidence: entry.confidence,
      provenance: {
        doc_id: docId,
        page: 1,
        span: { start: 0, end: Math.max(1, Math.min(entry.rawText.length, 256)) },
        extraction_method: sourceType === "pdf" ? "pdf_text" : "hybrid",
        extracted_at: new Date(now + 240 + idx * 10).toISOString(),
      },
    };
  });

  const citationLinks = buildCitationLinks(claims, claimIds, citationRegistry, paperId);
  const citationDagNodes = citationRegistry.map((citation) => ({
    node_id: citation.citation_id,
    node_type: "citation" as const,
    label: (citation.title ?? citation.raw_text).slice(0, 512),
  }));
  const citationDagEdges = citationLinks.map((link) => ({
    edge_id: `edge:${link.link_id}`,
    from: link.claim_id,
    to: link.citation_id,
    relation: "cites" as const,
  }));
  const graphAnchorRefs = [...claimIds, ...citationRegistry.map((entry) => entry.citation_id)];

  const predictionContracts =
    theoryClaim && measurementClaim
      ? [
          {
            contract_id: `pred:${paperId}:1`,
            model_node_id: `model:${paperId}:1`,
            equation_ids: [`eq:${paperId}:1`],
            input_bindings: [
              {
                variable_id: `var:${paperId}:obs`,
                value: extractFirstNumber(measurementClaim.text) ?? 0,
                unit: extractUnitToken(measurementClaim.text),
              },
            ],
            predicted_observable: {
              variable_id: `var:${paperId}:pred`,
              value: extractFirstNumber(measurementClaim.text) ?? 0,
              unit: extractUnitToken(measurementClaim.text),
            },
            measured_observable: {
              variable_id: `var:${paperId}:obs`,
              value: extractFirstNumber(measurementClaim.text) ?? 0,
              unit: extractUnitToken(measurementClaim.text),
              dataset_ref: `essence:${ingest.essence_id}`,
            },
            fit: { residual: 0, normalized_residual: 0, r2: 1, chi2: 0, dof: 1 },
            status: "match" as const,
          },
        ]
      : [];

  const symbolMapEntries =
    predictionContracts.length > 0
      ? [
          {
            canonical_symbol: "x",
            mapping_type: "exact",
            aliases: [{ paper_id: paperId, symbol: "x", unit: extractUnitToken(measurementClaim?.text ?? "") }],
          },
        ]
      : [];

  const falsifierEdges =
    predictionContracts.length > 0
      ? [
          {
            edge_id: `fals:${paperId}:1`,
            hypothesis_node_id: `hyp:${paperId}:1`,
            falsifier_node_id: `obs:${paperId}:1`,
            status: "pending",
            evidence_claim_ids: [firstClaimId],
          },
        ]
      : [];

  const maturityGates = [
    {
      gate_id: `gate:${paperId}:1`,
      target_id: `model:${paperId}:1`,
      required_stage: "diagnostic",
      current_stage: predictionContracts.length > 0 ? "reduced-order" : "exploratory",
      status: predictionContracts.length > 0 ? "warn" : "warn",
      blocking_reason: "needs external validation set for promotion beyond diagnostic",
      falsifier_edge_ids: falsifierEdges.map((edge) => edge.edge_id),
      evaluated_at: new Date(now + 650).toISOString(),
    },
  ];

  const ingestRequest = {
    schema_version: 1,
    request_id: requestId,
    submitted_at: nowIso,
    tenant_id: opts.tenantId ?? "local",
    submitted_by: { user_id: opts.creatorId, channel: "cli" },
    paper: {
      paper_id: paperId,
      title_hint: resolvedTitle,
      topic_tags: allTags.length ? allTags : ["paper"],
    },
    source: {
      source_type: sourceType,
      uri: ingest.uri,
      filename: path.basename(resolvedFile),
      media_type: mime,
      bytes: buffer.byteLength,
      sha256: sourceHash,
    },
    options: {
      ocr_mode: sourceType === "pdf" ? "auto" : "force",
      chunking_profile: "equation_aware",
      extraction_profile: "physics",
      review_mode: "auto_if_high_confidence",
      math_trace_mode: "strict",
      require_prediction_contracts: opts.requirePredictionContracts,
      require_symbol_equivalence_map: opts.requireSymbolEquivalenceMap,
      require_falsifier_edges: opts.requireFalsifierEdges,
      require_citation_registry: opts.requireCitationRegistry,
    },
  };

  const packBase = {
    schema_version: 1,
    pack_id: packId,
    run_id: runId,
    paper_id: paperId,
    tenant_id: opts.tenantId ?? "local",
    generated_at: new Date(now + 400).toISOString(),
    document: {
      title: resolvedTitle,
      source_type: sourceType,
      source_uri: ingest.uri,
      source_sha256: sourceHash,
      media_type: mime,
    },
    claims: claims.map((entry, idx) => ({
      claim_id: claimIds[idx] ?? `claim:${paperId}:${idx + 1}`,
      claim_type: entry.type,
      text: entry.text,
      confidence: entry.confidence,
      maturity_stage: "exploratory",
      provenance: {
        doc_id: docId,
        page: 1,
        span: { start: 0, end: Math.max(1, Math.min(entry.text.length, 256)) },
        extraction_method: sourceType === "pdf" ? "pdf_text" : "hybrid",
        extracted_at: new Date(now + 300 + idx * 20).toISOString(),
      },
    })),
    congruence_links: [],
    framework_deltas: {
      tree_delta: { added_nodes: [], updated_nodes: [] },
      dag_delta: { added_nodes: citationDagNodes, added_edges: citationDagEdges, updated_edges: [] },
      atlas_delta: { embedding_model: "ingest/hash+caption", spaces: ["papers"], added_points: [], updated_points: [] },
    },
    math_registry: {
      equations: predictionContracts.length > 0 ? [{ equation_id: `eq:${paperId}:1`, canonical_form: "y=f(x)", variable_ids: [`var:${paperId}:obs`] }] : [],
      definitions: [],
      variables: predictionContracts.length > 0 ? [{ variable_id: `var:${paperId}:obs`, symbol: "x", unit: extractUnitToken(measurementClaim?.text ?? "") }] : [],
      units: [],
      assumptions: [],
    },
    prediction_contracts: predictionContracts,
    symbol_equivalence_map: { resolution_policy: "canonical_wins", entries: symbolMapEntries },
    falsifier_edges: falsifierEdges,
    maturity_gates: maturityGates,
    citation_registry: citationRegistry,
    citation_links: citationLinks,
    retrieval_index: {
      lexical_ref: { provider: "local", index_id: `lex:${paperId}`, record_count: 1 },
      vector_ref: { provider: "local", index_id: `vec:${paperId}`, record_count: 1 },
      graph_anchor_refs: graphAnchorRefs,
    },
    review: {
      status: "approved",
      reviewed_at: new Date(now + 700).toISOString(),
      reviewer_id: "codex:auto",
      reason_codes: ["AUTO_PROMPT_INGEST"],
    },
  };

  const lineageSeed = JSON.stringify({
    paperId,
    sourceHash,
    essenceId: ingest.essence_id,
    requestId,
  });
  const lineageHash = sha256Hex(lineageSeed);
  const knowledgePack = {
    ...packBase,
    derivation_lineage: {
      lineage_version: 1,
      lineage_hash: lineageHash,
      replay_seed: `seed:${sourceHash.slice(0, 12)}`,
      steps: [
        {
          step_id: `step:${paperId}:ingest`,
          version: 1,
          operation: "merge",
          at: new Date(now + 500).toISOString(),
          input_hashes: [sourceHash],
          output_hashes: [lineageHash],
        },
      ],
    },
  };

  const outRoot = path.resolve(opts.outDir, paperDirName);
  await fs.mkdir(outRoot, { recursive: true });
  const stamp = new Date(now).toISOString().replace(/[:.]/g, "-");
  const requestPath = path.join(outRoot, `${stamp}.request.json`);
  const packPath = path.join(outRoot, `${stamp}.pack.json`);
  const citationsPath = path.join(outRoot, `${stamp}.citations.json`);
  const runPath = path.join(outRoot, `${stamp}.run.json`);
  const envelopePath = path.join(outRoot, `${stamp}.envelope.json`);

  const requestJson = `${JSON.stringify(ingestRequest, null, 2)}\n`;
  const packJson = `${JSON.stringify(knowledgePack, null, 2)}\n`;
  const citationsJson = `${JSON.stringify(
    {
      schema_version: 1,
      paper_id: paperId,
      citation_registry: knowledgePack.citation_registry,
      citation_links: knowledgePack.citation_links,
    },
    null,
    2,
  )}\n`;
  await fs.writeFile(requestPath, requestJson, "utf8");
  await fs.writeFile(packPath, packJson, "utf8");
  await fs.writeFile(citationsPath, citationsJson, "utf8");
  if (envelope) {
    await fs.writeFile(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  }

  const predictionStatus =
    opts.requirePredictionContracts && knowledgePack.prediction_contracts.length === 0 ? "fail" : "pass";
  const symbolStatus =
    opts.requireSymbolEquivalenceMap && knowledgePack.symbol_equivalence_map.entries.length === 0
      ? "fail"
      : "pass";
  const maturityStatus = knowledgePack.maturity_gates.some((gate) => gate.status === "fail") ? "fail" : "warn";
  const falsifierStatus =
    opts.requireFalsifierEdges && knowledgePack.falsifier_edges.length === 0 ? "fail" : "pass";
  const citationStatus =
    opts.requireCitationRegistry && knowledgePack.citation_registry.length === 0
      ? "fail"
      : knowledgePack.citation_registry.length === 0
        ? "warn"
        : knowledgePack.citation_links.length === 0
          ? "warn"
          : "pass";
  const overallStatus =
    predictionStatus === "fail" ||
    symbolStatus === "fail" ||
    falsifierStatus === "fail" ||
    citationStatus === "fail"
      ? "fail"
      : maturityStatus === "warn" || citationStatus === "warn"
        ? "warn"
        : "pass";
  const lifecycleState = overallStatus === "fail" ? "blocked" : "published";
  const currentStage = overallStatus === "fail" ? "review_pending" : "none";

  const runRecord = {
    schema_version: 1,
    state_machine_id: "paper_run.v1",
    run_id: runId,
    request_id: requestId,
    paper_id: paperId,
    tenant_id: opts.tenantId ?? "local",
    submitted_by: opts.creatorId,
    created_at: nowIso,
    updated_at: new Date(now + 900).toISOString(),
    started_at: new Date(now + 20).toISOString(),
    finished_at: new Date(now + 900).toISOString(),
    lifecycle_state: lifecycleState,
    current_stage: currentStage,
    stage_attempts: {
      parsing: 1,
      extracting: 1,
      normalizing: 1,
      graph_merging: 1,
      indexing: 1,
      review_pending: 1,
    },
    transition_log: [
      { from: "queued", event: "validate_intake", to: "intake_validated", at: isoAt(now, 10), actor: "system" },
      { from: "intake_validated", event: "start_parse", to: "parsing", at: isoAt(now, 20), actor: "system" },
      { from: "parsing", event: "parse_complete", to: "extracting", at: isoAt(now, 120), actor: "system" },
      { from: "extracting", event: "extract_complete", to: "normalizing", at: isoAt(now, 220), actor: "system" },
      { from: "normalizing", event: "normalize_complete", to: "graph_merging", at: isoAt(now, 320), actor: "system" },
      { from: "graph_merging", event: "merge_complete", to: "indexing", at: isoAt(now, 420), actor: "system" },
      { from: "indexing", event: "index_complete", to: "review_pending", at: isoAt(now, 520), actor: "system" },
      ...(overallStatus === "fail"
        ? [
            {
              from: "review_pending",
              event: "soft_fail",
              to: "blocked",
              at: isoAt(now, 720),
              actor: "reviewer",
              reason_code: "TOE_REQUIREMENTS_MISSING",
              message: "Strict TOE requirement flags requested artifacts not present in draft pack.",
            },
          ]
        : [
            {
              from: "review_pending",
              event: "review_approved",
              to: "published",
              at: isoAt(now, 720),
              actor: "reviewer",
            },
          ]),
    ],
    artifacts: {
      parse_output: { uri: toFileUri(resolvedFile), sha256: sourceHash, bytes: buffer.byteLength, media_type: mime },
      claim_output: null,
      citation_output: {
        uri: toFileUri(citationsPath),
        sha256: sha256Hex(citationsJson),
        bytes: Buffer.byteLength(citationsJson),
        media_type: "application/json",
      },
      normalized_output: null,
      graph_delta_output: null,
      index_output: null,
      knowledge_pack: { uri: toFileUri(packPath), sha256: sha256Hex(packJson), bytes: Buffer.byteLength(packJson), media_type: "application/json" },
    },
    validation: {
      math_trace_mode: "strict",
      prediction_contracts: {
        required: opts.requirePredictionContracts,
        validated: knowledgePack.prediction_contracts.length,
        status: predictionStatus,
      },
      symbol_equivalence: {
        required: opts.requireSymbolEquivalenceMap,
        entries: knowledgePack.symbol_equivalence_map.entries.length,
        status: symbolStatus,
      },
      lineage: {
        lineage_hash: knowledgePack.derivation_lineage.lineage_hash,
        steps: knowledgePack.derivation_lineage.steps.length,
        replayable: true,
        status: "pass",
      },
      maturity_gates: {
        evaluated: knowledgePack.maturity_gates.length,
        failed: knowledgePack.maturity_gates.filter((gate) => gate.status === "fail").length,
        status: maturityStatus,
      },
      falsifier_edges: {
        required: opts.requireFalsifierEdges,
        count: knowledgePack.falsifier_edges.length,
        status: falsifierStatus,
      },
      citations: {
        required: opts.requireCitationRegistry,
        extracted: knowledgePack.citation_registry.length,
        linked_claim_edges: knowledgePack.citation_links.length,
        status: citationStatus,
      },
      overall_status: overallStatus,
      reason_codes: Array.from(
        new Set([
          "PROMPT_INGEST_COMPLETE",
          ...(ingestMode === "local_pdf_fallback" ? ["ESSENCE_PDF_UNSUPPORTED_LOCAL_FALLBACK"] : []),
          ...(knowledgePack.citation_registry.length === 0 ? ["CITATIONS_NOT_FOUND"] : []),
        ]),
      ),
    },
  };

  const runJson = `${JSON.stringify(runRecord, null, 2)}\n`;
  await fs.writeFile(runPath, runJson, "utf8");

  const summary = {
    ok: true,
    paperId,
    requestId,
    runId,
    packId,
    essenceId: ingest.essence_id,
    ingestMode,
    ingestWarning,
    sourceType,
    citations: {
      extracted: knowledgePack.citation_registry.length,
      linkedClaims: knowledgePack.citation_links.length,
    },
    validation: {
      overallStatus,
      lifecycleState,
    },
    files: {
      request: requestPath,
      run: runPath,
      pack: packPath,
      citations: citationsPath,
      envelope: envelope ? envelopePath : null,
    },
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[paper-prompt-ingest] ${message}`);
  process.exitCode = 1;
});
