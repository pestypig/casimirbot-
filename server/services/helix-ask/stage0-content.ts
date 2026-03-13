import crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { filterSignalTokens, tokenizeAskQuery } from "./query";

export type Stage05CardKind = "code" | "doc" | "config" | "data" | "binary";

export type Stage05SlotId =
  | "definition"
  | "mechanism"
  | "equation"
  | "code_path"
  | "example"
  | "verification"
  | "failure_path";

export type Stage05SlotPlan = {
  mode: "dynamic" | "static";
  slots: Stage05SlotId[];
  required: Stage05SlotId[];
};

export type Stage05SlotCoverage = {
  required: Stage05SlotId[];
  present: Stage05SlotId[];
  missing: Stage05SlotId[];
  ratio: number;
};

export type Stage05Snippet = {
  start: number;
  end: number;
  text: string;
};

export type Stage05EvidenceCard = {
  path: string;
  kind: Stage05CardKind;
  summary: string;
  symbolsOrKeys: string[];
  snippets: Stage05Snippet[];
  confidence: number;
  slotHits?: Stage05SlotId[];
};

export type Stage05Telemetry = {
  used: boolean;
  file_count: number;
  card_count: number;
  kind_counts: Record<Stage05CardKind, number>;
  llm_used: boolean;
  fallback_reason: string | null;
  extract_ms: number;
  total_ms: number;
  budget_capped: boolean;
  summary_required: boolean;
  summary_hard_fail: boolean;
  summary_fail_reason: string | null;
  slot_plan: Stage05SlotPlan | null;
  slot_coverage: Stage05SlotCoverage | null;
  fullfile_mode: boolean;
  two_pass_used: boolean;
  two_pass_batches: number;
  overflow_policy: "single_pass" | "two_pass";
};

export type Stage05LlmSummaryInput = {
  query: string;
  slotPlan: Stage05SlotPlan;
  pass: 1 | 2;
  batchIndex?: number;
  batchCount?: number;
  cards: Array<{
    path: string;
    kind: Stage05CardKind;
    summary: string;
    symbolsOrKeys: string[];
    snippets: Stage05Snippet[];
    fullText?: string;
  }>;
  timeoutMs: number;
};

export type Stage05LlmSummaryOutput = {
  summaries: Record<
    string,
    {
      summary?: string;
      symbolsOrKeys?: string[];
      confidence?: number;
      slotHits?: Stage05SlotId[];
    }
  >;
};

export type Stage05BuildOptions = {
  enabled: boolean;
  llmFirst: boolean;
  query: string;
  filePaths: string[];
  commit?: string | null;
  maxFiles: number;
  maxCards: number;
  maxExtractChars: number;
  maxSnippetChars: number;
  timeoutMs: number;
  binaryMetadataOnly: boolean;
  summaryRequired?: boolean;
  hardFailOnSummaryError?: boolean;
  fullFileMode?: boolean;
  overflowPolicy?: "single_pass" | "two_pass";
  slotPlannerMode?: "dynamic" | "static";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  summarizeWithLlm?: (input: Stage05LlmSummaryInput) => Promise<Stage05LlmSummaryOutput | null>;
};

type Stage05ExtractedCard = Stage05EvidenceCard & {
  fingerprint: string;
  relevance: number;
  extractedChars: number;
  payloadChars: number;
  fullText?: string;
};

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".rb",
  ".php",
  ".swift",
]);

const DOC_EXTENSIONS = new Set([".md", ".txt", ".rst", ".adoc"]);
const CONFIG_EXTENSIONS = new Set([".json", ".yaml", ".yml", ".toml", ".ini", ".env"]);
const DATA_EXTENSIONS = new Set([".csv", ".tsv", ".sql"]);
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".7z",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".wav",
  ".glb",
  ".bin",
]);

const MAX_STAGE05_FILE_BYTES = 2 * 1024 * 1024;
const MAX_STAGE05_READ_BYTES = 256 * 1024;
const MAX_STAGE05_LLM_CARDS_PER_ATTEMPT = 4;
const SYMBOL_RE = /^[ \t]*(?:export[ \t]+)?(?:async[ \t]+)?(?:function|class|interface|type|enum)[ \t]+([A-Za-z_][A-Za-z0-9_]*)/;
const CONST_SYMBOL_RE =
  /^[ \t]*(?:export[ \t]+)?(?:const|let|var)[ \t]+([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*(?:async[ \t]+)?(?:\([^)]*\)[ \t]*=>|function\b)/;
const HEADING_RE = /^[ \t]*#{1,6}[ \t]+(.+?)$/;
const CONFIG_KEY_RE = /^[ \t]*["']?([A-Za-z0-9_.-]+)["']?[ \t]*(?::|=)/;
const SQL_KEYWORD_RE = /\b(select|insert|update|delete|create|alter|drop|with)\b/i;
const PATH_TOKEN_RE = /[a-z0-9]+/gi;
const EQUATION_LINE_RE =
  /\b(congruence|metric|tensor|riemann|ricci|curvature|einstein|geodesic|lagrangian|hamiltonian|jacobian|hessian|derivation|equation)\b|[=∂∇∫Σ]|ds\^2|g_\{|R_\{|T_\{/i;
const SLOT_ID_ORDER: Stage05SlotId[] = [
  "definition",
  "mechanism",
  "equation",
  "code_path",
  "example",
  "verification",
  "failure_path",
];
const SLOT_SIGNAL_MAP: Record<Stage05SlotId, string[]> = {
  definition: ["what", "define", "definition", "meaning", "overview", "concept"],
  mechanism: ["how", "mechanism", "solve", "flow", "works", "pipeline", "algorithm", "compute"],
  equation: [
    "equation",
    "equations",
    "math",
    "mathematical",
    "congruence",
    "metric",
    "tensor",
    "riemann",
    "ricci",
    "curvature",
    "einstein",
    "geodesic",
    "derive",
    "derivation",
    "proof",
    "solver",
    "solve for",
  ],
  code_path: ["code", "file", "path", "module", "function", "class", "symbol", "where"],
  example: ["example", "sample", "instance", "demo", "walkthrough", "show"],
  verification: ["verify", "proof", "test", "validate", "assert", "gate", "certificate"],
  failure_path: ["fail", "fallback", "error", "edge", "missing", "limit", "break", "retry"],
};
const WARP_MATH_FOCUS_RE =
  /(?:\b(?:warp|alcubierre|natario|bubble)\b[\s\S]{0,120}\b(?:math|equation|equations|formula|metric|tensor|congruence|derive|derivation|proof|solver|solve|general relativity|gr)\b)|(?:\b(?:math|equation|equations|formula|metric|tensor|congruence|derive|derivation|proof|solver|solve|general relativity|gr)\b[\s\S]{0,120}\b(?:warp|alcubierre|natario|bubble)\b)/i;
const EQUATION_QUOTE_RE =
  /(?:\b(?:quote|exact|verbatim|show|return)\b[\s\S]{0,100}\b(?:equation|formula|metric|congruence)\b)|(?:\b(?:equation|formula|metric|congruence)\b[\s\S]{0,100}\b(?:quote|exact|verbatim|show|return)\b)|(?:\b(?:define|definition|what is|what's)\b[\s\S]{0,80}\b(?:equation|formula|metric)\b)/i;

const extractionCache = new Map<string, Stage05ExtractedCard>();
const summaryCache = new Map<string, Stage05LlmSummaryOutput>();

const clampNumber = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const clipText = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) return value;
  if (maxChars <= 3) return value.slice(0, maxChars);
  return `${value.slice(0, maxChars - 3)}...`;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mapStage05SummaryErrorReason = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("llm_backend_unavailable")) return "stage05_llm_backend_unavailable";
  if (lower.includes("llm_http_base not set")) return "stage05_llm_http_base_missing";
  if (lower.includes("llm_http_")) return "stage05_llm_http_error";
  if (lower.includes("aborterror") || lower.includes("timeout")) return "stage05_llm_timeout";
  if (lower.includes("invalid_output")) return "stage05_llm_invalid_output";
  return "stage05_llm_failed";
};

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeRepoPath = (value: string): string =>
  value
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .trim();

const normalizeSummaryPathForLookup = (value: string): string =>
  normalizeRepoPath(
    String(value ?? "")
      .trim()
      .replace(/^[`"'[\](){}<>]+/, "")
      .replace(/[`"'[\](){}<>:;,]+$/, ""),
  );

const isSafeRepoPath = (value: string): boolean => {
  if (!value) return false;
  if (path.isAbsolute(value)) return false;
  if (value === ".." || value.startsWith("../")) return false;
  if (value.includes("/../") || value.includes("..\\")) return false;
  return true;
};

const stableUnique = (values: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

const tokenizeSignal = (value: string): string[] =>
  stableUnique(
    filterSignalTokens(tokenizeAskQuery(value))
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length >= 2),
  );

const tokenizePath = (value: string): string[] => {
  const out: string[] = [];
  for (const match of value.toLowerCase().matchAll(PATH_TOKEN_RE)) {
    const token = String(match[0] ?? "").trim();
    if (!token) continue;
    out.push(token);
  }
  return stableUnique(out);
};

const classifyKind = (
  normalizedPath: string,
  binaryMetadataOnly: boolean,
  buffer: Buffer | null,
): Stage05CardKind => {
  const ext = path.posix.extname(normalizedPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return "binary";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (DOC_EXTENSIONS.has(ext)) return "doc";
  if (CONFIG_EXTENSIONS.has(ext)) return "config";
  if (DATA_EXTENSIONS.has(ext)) return "data";
  if (!buffer || binaryMetadataOnly) return "binary";
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  if (sample.includes(0)) return "binary";
  return "code";
};

const buildSnippetFromLines = (
  lines: string[],
  centerIndex: number,
  radius: number,
  maxChars: number,
): Stage05Snippet | null => {
  if (centerIndex < 0 || centerIndex >= lines.length) return null;
  const start = Math.max(0, centerIndex - radius);
  const end = Math.min(lines.length - 1, centerIndex + radius);
  const text = lines
    .slice(start, end + 1)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
  if (!text) return null;
  return {
    start: start + 1,
    end: end + 1,
    text: clipText(text, maxChars),
  };
};

const extractCodeCard = (
  normalizedPath: string,
  content: string,
  queryTokens: string[],
  maxSnippetChars: number,
): Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence"> => {
  const lines = content.split(/\r?\n/);
  const symbolNames: string[] = [];
  const symbolLineIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const symbolMatch = line.match(SYMBOL_RE) ?? line.match(CONST_SYMBOL_RE);
    if (!symbolMatch?.[1]) continue;
    symbolNames.push(symbolMatch[1]);
    symbolLineIndexes.push(i);
    if (symbolNames.length >= 12) break;
  }
  const queryLineIndexes: number[] = [];
  if (queryTokens.length > 0) {
    for (let i = 0; i < lines.length; i += 1) {
      const lower = lines[i].toLowerCase();
      if (queryTokens.some((token) => lower.includes(token))) {
        queryLineIndexes.push(i);
      }
      if (queryLineIndexes.length >= 8) break;
    }
  }
  const anchorIndexes = stableUnique(
    [...symbolLineIndexes, ...queryLineIndexes].map((value) => String(value)),
  )
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .slice(0, 4);
  const snippets: Stage05Snippet[] = [];
  for (const anchor of anchorIndexes) {
    const snippet = buildSnippetFromLines(lines, anchor, 2, maxSnippetChars);
    if (snippet) snippets.push(snippet);
  }
  if (snippets.length === 0 && lines.length > 0) {
    const fallbackSnippet = buildSnippetFromLines(lines, 0, 2, maxSnippetChars);
    if (fallbackSnippet) snippets.push(fallbackSnippet);
  }
  const symbolSet = stableUnique(symbolNames).slice(0, 8);
  const summary = symbolSet.length
    ? `Code path with ${symbolSet.length} symbol anchors and ${snippets.length} extracted spans.`
    : `Code path with ${snippets.length} extracted spans.`;
  const confidence = clampNumber(0.45 + symbolSet.length * 0.05 + snippets.length * 0.05, 0.2, 0.95);
  return {
    kind: "code",
    summary,
    symbolsOrKeys: symbolSet,
    snippets,
    confidence,
  };
};

const extractDocCard = (
  content: string,
  queryTokens: string[],
  maxSnippetChars: number,
): Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence"> => {
  const lines = content.split(/\r?\n/);
  const headings: string[] = [];
  const headingIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const headingMatch = lines[i].match(HEADING_RE);
    if (!headingMatch?.[1]) continue;
    headings.push(normalizeWhitespace(headingMatch[1]));
    headingIndexes.push(i);
    if (headings.length >= 8) break;
  }
  const queryIndexes: number[] = [];
  if (queryTokens.length > 0) {
    for (let i = 0; i < lines.length; i += 1) {
      const lower = lines[i].toLowerCase();
      if (queryTokens.some((token) => lower.includes(token))) {
        queryIndexes.push(i);
      }
      if (queryIndexes.length >= 8) break;
    }
  }
  const anchorIndexes = stableUnique(
    [...headingIndexes, ...queryIndexes].map((value) => String(value)),
  )
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .slice(0, 4);
  const snippets: Stage05Snippet[] = [];
  for (const anchor of anchorIndexes) {
    const snippet = buildSnippetFromLines(lines, anchor, 2, maxSnippetChars);
    if (snippet) snippets.push(snippet);
  }
  if (snippets.length === 0 && lines.length > 0) {
    const fallback = buildSnippetFromLines(lines, 0, 3, maxSnippetChars);
    if (fallback) snippets.push(fallback);
  }
  const symbolsOrKeys = stableUnique(headings).slice(0, 6);
  const summary = symbolsOrKeys.length
    ? `Doc path with ${symbolsOrKeys.length} heading anchors and ${snippets.length} extracted sections.`
    : `Doc path with ${snippets.length} extracted sections.`;
  const confidence = clampNumber(0.5 + symbolsOrKeys.length * 0.04 + snippets.length * 0.04, 0.25, 0.96);
  return {
    kind: "doc",
    summary,
    symbolsOrKeys,
    snippets,
    confidence,
  };
};

const extractConfigCard = (
  content: string,
  maxSnippetChars: number,
): Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence"> => {
  const lines = content.split(/\r?\n/);
  const keys: string[] = [];
  const keyIndexes: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(CONFIG_KEY_RE);
    if (!match?.[1]) continue;
    keys.push(match[1]);
    keyIndexes.push(i);
    if (keys.length >= 16) break;
  }
  const snippets: Stage05Snippet[] = [];
  for (const index of keyIndexes.slice(0, 4)) {
    const snippet = buildSnippetFromLines(lines, index, 1, maxSnippetChars);
    if (snippet) snippets.push(snippet);
  }
  if (snippets.length === 0 && lines.length > 0) {
    const fallback = buildSnippetFromLines(lines, 0, 2, maxSnippetChars);
    if (fallback) snippets.push(fallback);
  }
  const symbolsOrKeys = stableUnique(keys).slice(0, 10);
  const summary = symbolsOrKeys.length
    ? `Config path with ${symbolsOrKeys.length} key anchors and ${snippets.length} extracted spans.`
    : `Config path with ${snippets.length} extracted spans.`;
  return {
    kind: "config",
    summary,
    symbolsOrKeys,
    snippets,
    confidence: clampNumber(0.48 + symbolsOrKeys.length * 0.035, 0.2, 0.93),
  };
};

const extractDataCard = (
  content: string,
  normalizedPath: string,
  maxSnippetChars: number,
): Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence"> => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const ext = path.posix.extname(normalizedPath).toLowerCase();
  const symbolsOrKeys: string[] = [];
  const snippets: Stage05Snippet[] = [];
  if ((ext === ".csv" || ext === ".tsv") && lines.length > 0) {
    const delimiter = ext === ".tsv" ? "\t" : ",";
    const headers = lines[0]
      .split(delimiter)
      .map((entry) => normalizeWhitespace(entry.replace(/^["']|["']$/g, "")))
      .filter(Boolean)
      .slice(0, 16);
    symbolsOrKeys.push(...headers);
    snippets.push({
      start: 1,
      end: Math.min(lines.length, 3),
      text: clipText(lines.slice(0, 3).join("\n"), maxSnippetChars),
    });
  } else {
    for (let i = 0; i < lines.length; i += 1) {
      if (!SQL_KEYWORD_RE.test(lines[i])) continue;
      const snippet = {
        start: i + 1,
        end: Math.min(lines.length, i + 3),
        text: clipText(lines.slice(i, Math.min(lines.length, i + 3)).join("\n"), maxSnippetChars),
      };
      snippets.push(snippet);
      if (snippets.length >= 3) break;
    }
  }
  if (snippets.length === 0 && lines.length > 0) {
    snippets.push({
      start: 1,
      end: Math.min(lines.length, 3),
      text: clipText(lines.slice(0, 3).join("\n"), maxSnippetChars),
    });
  }
  const uniqueKeys = stableUnique(symbolsOrKeys).slice(0, 10);
  const summary = uniqueKeys.length
    ? `Data path with ${uniqueKeys.length} schema/header fields and ${snippets.length} extracted spans.`
    : `Data path with ${snippets.length} extracted spans.`;
  return {
    kind: "data",
    summary,
    symbolsOrKeys: uniqueKeys,
    snippets,
    confidence: clampNumber(0.42 + uniqueKeys.length * 0.03, 0.2, 0.9),
  };
};

const extractBinaryCard = (
  normalizedPath: string,
  stat: fs.Stats,
  fingerprint: string,
): Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence"> => ({
  kind: "binary",
  summary: `Binary/opaque path (metadata-only): size=${stat.size} bytes, fingerprint=${fingerprint.slice(0, 12)}.`,
  symbolsOrKeys: [path.posix.extname(normalizedPath).toLowerCase()].filter(Boolean),
  snippets: [],
  confidence: 0.35,
});

const hashText = (value: string): string =>
  crypto.createHash("sha1").update(value).digest("hex");

const scorePathRelevance = (normalizedPath: string, queryTokens: string[], queryLower: string): number => {
  const lowerPath = normalizedPath.toLowerCase();
  const basename = path.posix.basename(lowerPath);
  const basenameNoExt = basename.replace(/\.[^.]+$/, "");
  const pathTokens = tokenizePath(lowerPath);
  const overlap = queryTokens.reduce((count, token) => count + (pathTokens.includes(token) ? 1 : 0), 0);
  let score = overlap * 2;
  if (basenameNoExt && queryLower.includes(basenameNoExt)) score += 3;
  if (queryTokens.some((token) => lowerPath.includes(token))) score += 1;
  if (/(^|\/)(server|client|modules|shared|scripts|cli)\//i.test(normalizedPath)) score += 0.35;
  if (/^docs\//i.test(normalizedPath)) score += 0.25;
  const equationQuery = hasAnySignal(queryLower, SLOT_SIGNAL_MAP.equation);
  if (equationQuery) {
    if (/(^|\/)(server|client|modules|shared|scripts|cli)\//i.test(normalizedPath)) score += 0.75;
    if (/^docs\//i.test(normalizedPath)) score -= 0.2;
    if (/\b(math|metric|tensor|solver|equation|congruence|warp)\b/i.test(lowerPath)) score += 0.5;
  }
  return Number(score.toFixed(4));
};

const hasAnySignal = (value: string, signals: string[]): boolean => {
  if (!value) return false;
  const lowerValue = value.toLowerCase();
  return signals.some((signal) => {
    const normalizedSignal = signal.trim().toLowerCase();
    if (!normalizedSignal) return false;
    if (normalizedSignal.includes(" ")) {
      return lowerValue.includes(normalizedSignal);
    }
    const pattern = new RegExp(`\\b${escapeRegExp(normalizedSignal)}\\b`, "i");
    return pattern.test(value);
  });
};

const hasEquationEvidenceText = (value: string): boolean => {
  if (!value) return false;
  return EQUATION_LINE_RE.test(value);
};

const hasEquationEvidenceInCard = (
  card: Pick<Stage05EvidenceCard, "summary" | "symbolsOrKeys" | "snippets">,
): boolean => {
  const equationText = [card.summary, card.symbolsOrKeys.join(" "), ...card.snippets.map((snippet) => snippet.text)]
    .filter(Boolean)
    .join("\n");
  return hasEquationEvidenceText(equationText);
};

const deriveDynamicSlotPlan = (
  query: string,
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable",
  mode: "dynamic" | "static" = "dynamic",
): Stage05SlotPlan => {
  if (mode === "static") {
    return {
      mode,
      slots: ["definition", "mechanism", "code_path", "verification"],
      required: ["definition", "mechanism"],
    };
  }
  const queryLower = query.toLowerCase();
  const warpMathFocused = WARP_MATH_FOCUS_RE.test(queryLower);
  const equationQuoteRequested = EQUATION_QUOTE_RE.test(queryLower);
  const slots = new Set<Stage05SlotId>();
  const required = new Set<Stage05SlotId>();
  slots.add("definition");
  required.add("definition");

  if (hasAnySignal(queryLower, SLOT_SIGNAL_MAP.mechanism)) {
    slots.add("mechanism");
    required.add("mechanism");
  }
  const equationSignal =
    hasAnySignal(queryLower, SLOT_SIGNAL_MAP.equation) ||
    /\b(congruence|equation|equations|metric|tensor|riemann|ricci|curvature|einstein|geodesic|derive|derivation|proof)\b/i.test(
      queryLower,
    );
  if (equationSignal) {
    slots.add("equation");
  }
  if (warpMathFocused || equationQuoteRequested) {
    slots.add("equation");
    slots.add("code_path");
    required.add("equation");
    required.add("code_path");
  }
  if (hasAnySignal(queryLower, SLOT_SIGNAL_MAP.code_path) || intentDomain === "repo" || intentDomain === "hybrid") {
    slots.add("code_path");
  }
  if (hasAnySignal(queryLower, SLOT_SIGNAL_MAP.example)) {
    slots.add("example");
  }
  if (hasAnySignal(queryLower, SLOT_SIGNAL_MAP.verification) || intentDomain === "falsifiable") {
    slots.add("verification");
  }
  if (hasAnySignal(queryLower, SLOT_SIGNAL_MAP.failure_path)) {
    slots.add("failure_path");
  }
  if (slots.has("code_path") && (intentDomain === "repo" || intentDomain === "hybrid")) {
    required.add("code_path");
  }
  if (slots.has("verification") && intentDomain === "falsifiable") {
    required.add("verification");
  }
  if (
    slots.has("equation") &&
    (intentDomain === "repo" || intentDomain === "hybrid" || intentDomain === "falsifiable")
  ) {
    required.add("equation");
  }
  return {
    mode: "dynamic",
    slots: SLOT_ID_ORDER.filter((slot) => slots.has(slot)),
    required: SLOT_ID_ORDER.filter((slot) => required.has(slot)),
  };
};

const inferSlotHitsFromCard = (card: {
  path: string;
  kind: Stage05CardKind;
  summary: string;
  symbolsOrKeys: string[];
  snippets: Stage05Snippet[];
}): Stage05SlotId[] => {
  const contentHaystack = [
    card.summary,
    card.symbolsOrKeys.join(" "),
    ...card.snippets.map((snippet) => snippet.text),
  ]
    .join("\n")
    .toLowerCase();
  const signalHaystack = [card.path, contentHaystack].join("\n").toLowerCase();
  const hits = new Set<Stage05SlotId>();
  if (card.kind === "doc") hits.add("definition");
  if (card.kind === "code") hits.add("code_path");
  if (hasEquationEvidenceText(contentHaystack)) hits.add("equation");
  for (const slot of SLOT_ID_ORDER) {
    if (slot === "equation") continue;
    if (hasAnySignal(signalHaystack, SLOT_SIGNAL_MAP[slot])) {
      hits.add(slot);
    }
  }
  return SLOT_ID_ORDER.filter((slot) => hits.has(slot));
};

const buildSlotCoverage = (
  required: Stage05SlotId[],
  cards: Array<Pick<Stage05EvidenceCard, "summary" | "symbolsOrKeys" | "snippets" | "path" | "kind" | "slotHits">>,
): Stage05SlotCoverage => {
  const present = new Set<Stage05SlotId>();
  for (const card of cards) {
    const cardHits =
      Array.isArray(card.slotHits) && card.slotHits.length > 0
        ? card.slotHits
        : inferSlotHitsFromCard({
            path: card.path,
            kind: card.kind,
            summary: card.summary,
            symbolsOrKeys: card.symbolsOrKeys,
            snippets: card.snippets,
          });
    for (const slot of cardHits) present.add(slot);
  }
  const requiredUnique = SLOT_ID_ORDER.filter((slot) => required.includes(slot));
  const presentRequired = requiredUnique.filter((slot) => present.has(slot));
  const missing = requiredUnique.filter((slot) => !present.has(slot));
  const ratio = requiredUnique.length === 0 ? 1 : presentRequired.length / requiredUnique.length;
  return {
    required: requiredUnique,
    present: presentRequired,
    missing,
    ratio: Number(ratio.toFixed(4)),
  };
};

const estimateCardPayloadChars = (card: Stage05ExtractedCard): number => {
  const snippetChars = card.snippets.reduce((count, snippet) => count + snippet.text.length, 0);
  return card.summary.length + snippetChars + (card.fullText?.length ?? 0);
};

const compressFullTextForPrompt = (value: string, maxChars: number): string => {
  const safeMax = Math.max(256, maxChars);
  if (value.length <= safeMax) return value;
  if (safeMax < 1200) return clipText(value, safeMax);
  const headChars = Math.floor(safeMax * 0.45);
  const midChars = Math.floor(safeMax * 0.2);
  const tailChars = safeMax - headChars - midChars;
  const head = value.slice(0, headChars);
  const midStart = Math.max(0, Math.floor(value.length / 2) - Math.floor(midChars / 2));
  const mid = value.slice(midStart, midStart + midChars);
  const tail = value.slice(Math.max(0, value.length - tailChars));
  return `${head}\n\n... [omitted middle content for budget] ...\n\n${mid}\n\n... [omitted middle content for budget] ...\n\n${tail}`;
};

const buildStage05FocusTerms = (
  queryTokens: string[],
  slotPlan: Stage05SlotPlan,
  symbolsOrKeys: string[],
): string[] => {
  const slotTerms = slotPlan.slots.flatMap((slot) => SLOT_SIGNAL_MAP[slot] ?? []);
  return stableUnique(
    [...queryTokens, ...slotTerms, ...symbolsOrKeys.map((value) => value.toLowerCase())]
      .map((value) => value.trim())
      .filter((value) => value.length >= 3),
  ).slice(0, 48);
};

const collectStage05InfluenceSnippets = (args: {
  lines: string[];
  kind: Stage05CardKind;
  queryTokens: string[];
  slotPlan: Stage05SlotPlan;
  symbolsOrKeys: string[];
  baseSnippets: Stage05Snippet[];
  maxSnippetChars: number;
}): Stage05Snippet[] => {
  const {
    lines,
    kind,
    queryTokens,
    slotPlan,
    symbolsOrKeys,
    baseSnippets,
    maxSnippetChars,
  } = args;
  if (lines.length === 0) return baseSnippets;

  const focusTerms = buildStage05FocusTerms(queryTokens, slotPlan, symbolsOrKeys);
  const anchorScores = new Map<number, number>();
  const addScore = (index: number, score: number): void => {
    if (!Number.isFinite(index) || index < 0 || index >= lines.length || score <= 0) return;
    anchorScores.set(index, (anchorScores.get(index) ?? 0) + score);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();
    let score = 0;
    for (const token of focusTerms) {
      if (!lower.includes(token)) continue;
      score += token.length >= 6 ? 2 : 1;
    }
    if (kind === "code" && (SYMBOL_RE.test(line) || CONST_SYMBOL_RE.test(line))) score += 3;
    if (kind === "doc" && HEADING_RE.test(line)) score += 2;
    if (kind === "config" && CONFIG_KEY_RE.test(line)) score += 2;
    if (kind === "data" && SQL_KEYWORD_RE.test(line)) score += 2;
    if (slotPlan.slots.includes("equation") && EQUATION_LINE_RE.test(line)) score += 4;
    if (score > 0) addScore(i, score);
  }

  for (const snippet of baseSnippets) {
    const center = Math.max(0, Math.min(lines.length - 1, Math.floor((snippet.start + snippet.end) / 2) - 1));
    addScore(center, 6);
  }

  const rankedAnchors = Array.from(anchorScores.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 10)
    .map(([index]) => index);
  if (rankedAnchors.length === 0) {
    if (!slotPlan.slots.includes("equation")) return baseSnippets;
    const equationAnchors: number[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      if (hasEquationEvidenceText(lines[i] ?? "")) equationAnchors.push(i);
      if (equationAnchors.length >= 3) break;
    }
    if (equationAnchors.length === 0) return baseSnippets;
    const equationSnippets: Stage05Snippet[] = [];
    const equationRadius = kind === "doc" ? 5 : 3;
    for (const anchor of equationAnchors) {
      const snippet = buildSnippetFromLines(lines, anchor, equationRadius, maxSnippetChars);
      if (!snippet) continue;
      equationSnippets.push(snippet);
      if (equationSnippets.length >= 3) break;
    }
    return equationSnippets.length > 0 ? equationSnippets : baseSnippets;
  }

  const radius = kind === "doc" ? 4 : 3;
  const collected: Stage05Snippet[] = [];
  const seen = new Set<string>();
  for (const anchor of rankedAnchors) {
    const snippet = buildSnippetFromLines(lines, anchor, radius, maxSnippetChars);
    if (!snippet) continue;
    const key = `${snippet.start}:${snippet.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    collected.push(snippet);
    if (collected.length >= 6) break;
  }
  const mergedSnippets = collected.length > 0 ? collected : baseSnippets;
  if (!slotPlan.slots.includes("equation")) return mergedSnippets;
  if (mergedSnippets.some((snippet) => hasEquationEvidenceText(snippet.text))) return mergedSnippets;
  const equationAnchors: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (hasEquationEvidenceText(lines[i] ?? "")) equationAnchors.push(i);
    if (equationAnchors.length >= 3) break;
  }
  if (equationAnchors.length === 0) return mergedSnippets;
  const mergedSeen = new Set(mergedSnippets.map((snippet) => `${snippet.start}:${snippet.end}`));
  const equationRadius = kind === "doc" ? 5 : 3;
  const injected: Stage05Snippet[] = [];
  for (const anchor of equationAnchors) {
    const snippet = buildSnippetFromLines(lines, anchor, equationRadius, maxSnippetChars);
    if (!snippet) continue;
    const key = `${snippet.start}:${snippet.end}`;
    if (mergedSeen.has(key)) continue;
    mergedSeen.add(key);
    injected.push(snippet);
    if (injected.length >= 2) break;
  }
  if (injected.length === 0) return mergedSnippets;
  return [...injected, ...mergedSnippets].slice(0, 6);
};

const buildStage05FocusedFullText = (
  lines: string[],
  snippets: Stage05Snippet[],
  maxChars: number,
): string => {
  if (!snippets.length || !lines.length) return "";
  const sections: string[] = [];
  for (const snippet of snippets) {
    const start = Math.max(1, snippet.start);
    const end = Math.max(start, snippet.end);
    const body = lines.slice(start - 1, end).join("\n").trim();
    if (!body) continue;
    sections.push(`[L${start}-L${end}]\n${body}`);
  }
  if (!sections.length) return "";
  return clipText(sections.join("\n\n"), Math.max(800, maxChars));
};

const buildPromptCards = (
  cards: Stage05ExtractedCard[],
  options: Stage05BuildOptions,
  fullTextBudgetPerCard: number,
): Stage05LlmSummaryInput["cards"] =>
  cards.map((card) => ({
    path: card.path,
    kind: card.kind,
    summary: card.summary,
    symbolsOrKeys: card.symbolsOrKeys,
    snippets: card.snippets,
    fullText:
      options.fullFileMode && card.kind !== "binary"
        ? compressFullTextForPrompt(card.fullText ?? "", fullTextBudgetPerCard)
        : undefined,
  }));

const estimatePromptChars = (cards: Stage05LlmSummaryInput["cards"]): number =>
  cards.reduce((count, card) => {
    const snippetChars = card.snippets.reduce((sum, snippet) => sum + snippet.text.length, 0);
    return count + card.path.length + card.summary.length + snippetChars + (card.fullText?.length ?? 0);
  }, 0);

const mergeSummaryOutputs = (
  base: Stage05LlmSummaryOutput | null,
  patch: Stage05LlmSummaryOutput | null,
): Stage05LlmSummaryOutput | null => {
  if (!base?.summaries && !patch?.summaries) return null;
  return {
    summaries: {
      ...(base?.summaries ?? {}),
      ...(patch?.summaries ?? {}),
    },
  };
};

const collectMissingSummaryCards = (
  cards: Stage05ExtractedCard[],
  output: Stage05LlmSummaryOutput | null,
): Stage05ExtractedCard[] =>
  cards.filter((card) => {
    const patch = output?.summaries?.[card.path];
    return !(patch && typeof patch.summary === "string" && patch.summary.trim().length > 0);
  });

const partitionCardsByBudget = (
  cards: Stage05ExtractedCard[],
  maxChars: number,
): Stage05ExtractedCard[][] => {
  if (cards.length <= 1) return cards.length ? [cards] : [];
  const safeMax = Math.max(1_200, maxChars);
  const batches: Stage05ExtractedCard[][] = [];
  let batch: Stage05ExtractedCard[] = [];
  let batchChars = 0;
  for (const card of cards) {
    const cardChars = Math.max(1, card.payloadChars);
    if (batch.length > 0 && batchChars + cardChars > safeMax) {
      batches.push(batch);
      batch = [];
      batchChars = 0;
    }
    batch.push(card);
    batchChars += cardChars;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
};

const parseSlotHits = (slotHits: unknown): Stage05SlotId[] => {
  if (!Array.isArray(slotHits)) return [];
  const hits = new Set<Stage05SlotId>();
  for (const entry of slotHits) {
    const value = String(entry ?? "").trim().toLowerCase() as Stage05SlotId;
    if (!SLOT_ID_ORDER.includes(value)) continue;
    hits.add(value);
  }
  return SLOT_ID_ORDER.filter((slot) => hits.has(slot));
};

const mergeSlotHits = (...values: Array<Stage05SlotId[] | undefined>): Stage05SlotId[] => {
  const merged = new Set<Stage05SlotId>();
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const slot of value) {
      if (!SLOT_ID_ORDER.includes(slot)) continue;
      merged.add(slot);
    }
  }
  return SLOT_ID_ORDER.filter((slot) => merged.has(slot));
};

const buildKindCounts = (): Record<Stage05CardKind, number> => ({
  code: 0,
  doc: 0,
  config: 0,
  data: 0,
  binary: 0,
});

const resolveSummaryPathToCard = (rawPath: string, cards: Stage05ExtractedCard[]): string | null => {
  const normalized = normalizeSummaryPathForLookup(rawPath);
  if (!normalized) return null;
  const normalizedLower = normalized.toLowerCase();
  for (const card of cards) {
    if (normalizeRepoPath(card.path).toLowerCase() === normalizedLower) return card.path;
  }
  const suffixMatches = cards.filter((card) =>
    normalizedLower.endsWith(normalizeRepoPath(card.path).toLowerCase()),
  );
  if (suffixMatches.length === 1) return suffixMatches[0]?.path ?? null;
  const baseName = path.posix.basename(normalizedLower);
  const basenameMatches = cards.filter(
    (card) => path.posix.basename(normalizeRepoPath(card.path).toLowerCase()) === baseName,
  );
  if (basenameMatches.length === 1) return basenameMatches[0]?.path ?? null;
  return null;
};

const alignSummaryOutputToCards = (
  output: Stage05LlmSummaryOutput,
  cards: Stage05ExtractedCard[],
): Stage05LlmSummaryOutput => {
  const aligned: Stage05LlmSummaryOutput["summaries"] = {};
  const unresolvedPatches: Array<Stage05LlmSummaryOutput["summaries"][string]> = [];
  for (const [rawPath, patch] of Object.entries(output.summaries ?? {})) {
    const cardPath = resolveSummaryPathToCard(rawPath, cards);
    if (!cardPath) {
      unresolvedPatches.push(patch);
      continue;
    }
    aligned[cardPath] = patch;
  }
  if (unresolvedPatches.length > 0) {
    const unresolvedCards = cards.filter((card) => !aligned[card.path]);
    const assignCount = Math.min(unresolvedCards.length, unresolvedPatches.length);
    for (let i = 0; i < assignCount; i += 1) {
      const targetCard = unresolvedCards[i];
      const patch = unresolvedPatches[i];
      if (!targetCard || !patch) continue;
      aligned[targetCard.path] = patch;
    }
  }
  if (Object.keys(aligned).length === 0) return output;
  return { summaries: aligned };
};

const buildEmptyTelemetry = (
  fallbackReason: string | null,
  extractMs: number,
  totalMs: number,
  options?: {
    summaryRequired?: boolean;
    fullFileMode?: boolean;
    overflowPolicy?: "single_pass" | "two_pass";
    slotPlan?: Stage05SlotPlan | null;
    slotCoverage?: Stage05SlotCoverage | null;
  },
): Stage05Telemetry => ({
  used: false,
  file_count: 0,
  card_count: 0,
  kind_counts: buildKindCounts(),
  llm_used: false,
  fallback_reason: fallbackReason,
  extract_ms: extractMs,
  total_ms: totalMs,
  budget_capped: false,
  summary_required: Boolean(options?.summaryRequired),
  summary_hard_fail: false,
  summary_fail_reason: null,
  slot_plan: options?.slotPlan ?? null,
  slot_coverage: options?.slotCoverage ?? null,
  fullfile_mode: Boolean(options?.fullFileMode),
  two_pass_used: false,
  two_pass_batches: 0,
  overflow_policy: options?.overflowPolicy ?? "single_pass",
});

const buildHardFailTelemetry = (args: {
  fallbackReason: string;
  extractMs: number;
  totalMs: number;
  fileCount: number;
  budgetCapped: boolean;
  slotPlan: Stage05SlotPlan;
  slotCoverage: Stage05SlotCoverage | null;
  fullFileMode: boolean;
  overflowPolicy: "single_pass" | "two_pass";
  twoPassUsed: boolean;
  twoPassBatches: number;
  llmUsed: boolean;
}): Stage05Telemetry => ({
  used: true,
  file_count: Math.max(0, args.fileCount),
  card_count: 0,
  kind_counts: buildKindCounts(),
  llm_used: args.llmUsed,
  fallback_reason: args.fallbackReason,
  extract_ms: args.extractMs,
  total_ms: args.totalMs,
  budget_capped: args.budgetCapped,
  summary_required: true,
  summary_hard_fail: true,
  summary_fail_reason: args.fallbackReason,
  slot_plan: args.slotPlan,
  slot_coverage: args.slotCoverage,
  fullfile_mode: args.fullFileMode,
  two_pass_used: args.twoPassUsed,
  two_pass_batches: Math.max(0, args.twoPassBatches),
  overflow_policy: args.overflowPolicy,
});

const applyLlmSummaries = (
  cards: Stage05ExtractedCard[],
  output: Stage05LlmSummaryOutput | null,
): { cards: Stage05ExtractedCard[]; applied: boolean } => {
  if (!output?.summaries) return { cards, applied: false };
  let applied = false;
  const next = cards.map((card) => {
    const patch = output.summaries[card.path];
    if (!patch) return card;
    const summary =
      typeof patch.summary === "string" && patch.summary.trim().length > 0
        ? clipText(normalizeWhitespace(patch.summary), 280)
        : card.summary;
    const symbolsOrKeys = Array.isArray(patch.symbolsOrKeys)
      ? stableUnique(
          patch.symbolsOrKeys
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean),
        ).slice(0, 10)
      : card.symbolsOrKeys;
    const confidence =
      typeof patch.confidence === "number" && Number.isFinite(patch.confidence)
        ? clampNumber(patch.confidence, 0, 1)
        : card.confidence;
    const patchSlotHits = patch.slotHits && patch.slotHits.length > 0 ? parseSlotHits(patch.slotHits) : [];
    const inferredSlotHits = inferSlotHitsFromCard({
      path: card.path,
      kind: card.kind,
      summary,
      symbolsOrKeys,
      snippets: card.snippets,
    });
    let slotHits = mergeSlotHits(card.slotHits, patchSlotHits, inferredSlotHits);
    if (
      !hasEquationEvidenceInCard({
        summary,
        symbolsOrKeys,
        snippets: card.snippets,
      })
    ) {
      slotHits = slotHits.filter((slot) => slot !== "equation");
    }
    const symbolsChanged =
      symbolsOrKeys.length !== card.symbolsOrKeys.length ||
      symbolsOrKeys.some((entry, index) => entry !== card.symbolsOrKeys[index]);
    const slotChanged =
      (slotHits?.length ?? 0) !== (card.slotHits?.length ?? 0) ||
      (slotHits ?? []).some((entry, index) => entry !== card.slotHits?.[index]);
    applied = applied || summary !== card.summary || symbolsChanged || slotChanged;
    return {
      ...card,
      summary,
      symbolsOrKeys,
      confidence,
      slotHits,
    };
  });
  return { cards: next, applied };
};

const extractCardForPath = (
  normalizedPath: string,
  queryTokens: string[],
  queryLower: string,
  slotPlan: Stage05SlotPlan,
  options: Stage05BuildOptions,
): Stage05ExtractedCard | null => {
  if (!isSafeRepoPath(normalizedPath)) return null;
  const absPath = path.resolve(process.cwd(), normalizedPath);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(absPath);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;
  if (stat.size > MAX_STAGE05_FILE_BYTES) {
    const fingerprint = hashText(`${normalizedPath}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
    const metadata = extractBinaryCard(normalizedPath, stat, fingerprint);
    return {
      path: normalizedPath,
      ...metadata,
      fingerprint,
      relevance: scorePathRelevance(normalizedPath, queryTokens, queryLower),
      extractedChars: metadata.summary.length,
      payloadChars: metadata.summary.length,
    };
  }

  let rawBuffer: Buffer;
  try {
    rawBuffer = fs.readFileSync(absPath);
  } catch {
    return null;
  }
  const sampleBuffer = rawBuffer.length > MAX_STAGE05_READ_BYTES
    ? rawBuffer.subarray(0, MAX_STAGE05_READ_BYTES)
    : rawBuffer;
  const contentBuffer =
    options.fullFileMode && rawBuffer.length <= MAX_STAGE05_FILE_BYTES ? rawBuffer : sampleBuffer;
  const fingerprint = hashText(
    `${normalizedPath}:${stat.size}:${Math.floor(stat.mtimeMs)}:${sampleBuffer.toString("base64")}`,
  );
  const cacheKey = `${options.commit ?? "noc"}:${normalizedPath}:${fingerprint}`;
  const cached = extractionCache.get(cacheKey);
  if (cached) return cached;

  const kind = classifyKind(normalizedPath, options.binaryMetadataOnly, sampleBuffer);
  const textContent = contentBuffer.toString("utf8");
  let extracted: Pick<Stage05EvidenceCard, "kind" | "summary" | "symbolsOrKeys" | "snippets" | "confidence">;
  if (kind === "binary") {
    extracted = extractBinaryCard(normalizedPath, stat, fingerprint);
  } else if (kind === "doc") {
    extracted = extractDocCard(textContent, queryTokens, options.maxSnippetChars);
  } else if (kind === "config") {
    extracted = extractConfigCard(textContent, options.maxSnippetChars);
  } else if (kind === "data") {
    extracted = extractDataCard(textContent, normalizedPath, options.maxSnippetChars);
  } else {
    extracted = extractCodeCard(normalizedPath, textContent, queryTokens, options.maxSnippetChars);
  }

  const rawSnippets = extracted.snippets.slice(0, 4).map((snippet) => ({
    start: snippet.start,
    end: snippet.end,
    text: clipText(snippet.text, options.maxSnippetChars),
  }));
  const contentLines = textContent.split(/\r?\n/);
  const influenceSnippets =
    kind === "binary"
      ? rawSnippets
      : collectStage05InfluenceSnippets({
          lines: contentLines,
          kind,
          queryTokens,
          slotPlan,
          symbolsOrKeys: extracted.symbolsOrKeys,
          baseSnippets: rawSnippets,
          maxSnippetChars: options.maxSnippetChars,
        });
  const snippets = influenceSnippets.length > 0 ? influenceSnippets : rawSnippets;
  const extractedChars =
    extracted.summary.length +
    snippets.reduce((count, snippet) => count + snippet.text.length, 0);
  const fullTextBudget = clampNumber(
    Math.floor(options.maxExtractChars / Math.max(1, options.maxCards)),
    1000,
    3600,
  );
  const fullText =
    kind === "binary"
      ? undefined
      : buildStage05FocusedFullText(contentLines, snippets.slice(0, 6), fullTextBudget);
  const relevance = scorePathRelevance(normalizedPath, queryTokens, queryLower);
  const card: Stage05ExtractedCard = {
    path: normalizedPath,
    kind: extracted.kind,
    summary: clipText(normalizeWhitespace(extracted.summary), 280),
    symbolsOrKeys: stableUnique(extracted.symbolsOrKeys).slice(0, 10),
    snippets,
    confidence: clampNumber(extracted.confidence, 0, 1),
    slotHits: inferSlotHitsFromCard({
      path: normalizedPath,
      kind: extracted.kind,
      summary: extracted.summary,
      symbolsOrKeys: extracted.symbolsOrKeys,
      snippets,
    }),
    fingerprint,
    relevance,
    extractedChars,
    payloadChars: extractedChars + (fullText?.length ?? 0),
    fullText,
  };
  extractionCache.set(cacheKey, card);
  return card;
};

const countSummaryOutputsForCards = (
  cards: Stage05ExtractedCard[],
  output: Stage05LlmSummaryOutput | null,
): number => {
  if (!output?.summaries) return 0;
  let count = 0;
  for (const card of cards) {
    const patch = output.summaries[card.path];
    if (!patch) continue;
    if (typeof patch.summary === "string" && patch.summary.trim().length > 0) {
      count += 1;
    }
  }
  return count;
};

const hasSummaryOutputForAnyCards = (
  cards: Stage05ExtractedCard[],
  output: Stage05LlmSummaryOutput | null,
): boolean => countSummaryOutputsForCards(cards, output) > 0;

export async function buildStage05EvidenceCards(
  options: Stage05BuildOptions,
): Promise<{ cards: Stage05EvidenceCard[]; telemetry: Stage05Telemetry }> {
  const startMs = Date.now();
  const query = String(options.query ?? "").trim();
  const slotPlannerMode = options.slotPlannerMode ?? "dynamic";
  const slotPlan = deriveDynamicSlotPlan(query, options.intentDomain, slotPlannerMode);
  const summaryRequired = options.summaryRequired ?? true;
  const hardFailOnSummaryError = options.hardFailOnSummaryError ?? summaryRequired;
  const fullFileMode = options.fullFileMode ?? true;
  const overflowPolicy = options.overflowPolicy ?? "two_pass";

  if (!options.enabled) {
    return {
      cards: [],
      telemetry: buildEmptyTelemetry("stage05_disabled", 0, 0, {
        summaryRequired,
        fullFileMode,
        overflowPolicy,
        slotPlan,
      }),
    };
  }
  const normalizedPaths = stableUnique(
    (options.filePaths ?? [])
      .map((entry) => normalizeRepoPath(entry))
      .filter(Boolean)
      .filter((entry) => isSafeRepoPath(entry)),
  );
  if (normalizedPaths.length === 0) {
    return {
      cards: [],
      telemetry: buildEmptyTelemetry("stage05_no_candidates", 0, 0, {
        summaryRequired,
        fullFileMode,
        overflowPolicy,
        slotPlan,
      }),
    };
  }
  const queryTokens = tokenizeSignal(query);
  const queryLower = query.toLowerCase();
  const rankedPaths = normalizedPaths
    .map((candidatePath) => ({
      path: candidatePath,
      score: scorePathRelevance(candidatePath, queryTokens, queryLower),
    }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, Math.max(1, options.maxFiles));

  const extractedCards: Stage05ExtractedCard[] = [];
  for (const entry of rankedPaths) {
    const card = extractCardForPath(entry.path, queryTokens, queryLower, slotPlan, options);
    if (!card) continue;
    extractedCards.push(card);
  }

  const extractMs = Date.now() - startMs;
  if (extractedCards.length === 0) {
    return {
      cards: [],
      telemetry: {
        ...buildEmptyTelemetry("stage05_extract_empty", extractMs, Date.now() - startMs, {
          summaryRequired,
          fullFileMode,
          overflowPolicy,
          slotPlan,
        }),
        file_count: rankedPaths.length,
      },
    };
  }

  const equationRequired = slotPlan.required.includes("equation");
  let workingCards = extractedCards
    .sort((a, b) => {
      if (equationRequired) {
        const aEquation = hasEquationEvidenceInCard(a) ? 1 : 0;
        const bEquation = hasEquationEvidenceInCard(b) ? 1 : 0;
        if (bEquation !== aEquation) return bEquation - aEquation;
      }
      return b.relevance - a.relevance || b.confidence - a.confidence || a.path.localeCompare(b.path);
    })
    .slice(0, Math.max(1, options.maxCards));
  let llmUsed = false;
  let llmSummarySucceeded = false;
  let fallbackReason: string | null = null;

  const totalPayloadChars = workingCards.reduce((count, card) => count + estimateCardPayloadChars(card), 0);
  const budgetCapped = totalPayloadChars > options.maxExtractChars;
  const promptProbeBudgetPerCard = fullFileMode
    ? clampNumber(Math.floor(options.maxExtractChars / Math.max(1, workingCards.length)), 900, 4200)
    : 0;
  const promptCharsProbe = estimatePromptChars(
    buildPromptCards(workingCards, options, promptProbeBudgetPerCard),
  );
  const timeoutRisk =
    options.llmFirst &&
    fullFileMode &&
    (workingCards.length >= 6 || promptCharsProbe > Math.floor(options.maxExtractChars * 0.8));
  let twoPassUsed = overflowPolicy === "two_pass" && (budgetCapped || timeoutRisk);
  let twoPassBatches = 0;
  if (budgetCapped) {
    fallbackReason = "stage05_budget_capped";
  }

  const buildSummaryHardFail = (
    reason: string,
    coverage: Stage05SlotCoverage | null = null,
  ): { cards: Stage05EvidenceCard[]; telemetry: Stage05Telemetry } => {
    const resolvedCoverage = coverage ?? buildSlotCoverage(slotPlan.required, []);
    return {
      cards: [],
      telemetry: buildHardFailTelemetry({
        fallbackReason: reason,
        extractMs,
        totalMs: Date.now() - startMs,
        fileCount: rankedPaths.length,
        budgetCapped,
        slotPlan,
        slotCoverage: resolvedCoverage,
        fullFileMode,
        overflowPolicy,
        twoPassUsed,
        twoPassBatches,
        llmUsed,
      }),
    };
  };

  if (summaryRequired && hardFailOnSummaryError && (!options.llmFirst || !options.summarizeWithLlm)) {
    return buildSummaryHardFail("stage05_llm_unavailable");
  }

  const summarizeBatch = async (
    cards: Stage05ExtractedCard[],
    pass: 1 | 2,
    batchIndex: number,
    batchCount: number,
  ): Promise<{ output: Stage05LlmSummaryOutput | null; reason: string | null }> => {
    if (!options.summarizeWithLlm || !options.llmFirst || cards.length === 0) {
      return { output: null, reason: "stage05_llm_unavailable" };
    }
    const summaryFingerprint = hashText(
      [
        hashText(queryLower),
        `slots=${slotPlan.slots.join(",")}`,
        `required=${slotPlan.required.join(",")}`,
        `pass=${pass}`,
        `batch=${batchIndex}/${batchCount}`,
        cards.map((card) => `${card.path}:${card.fingerprint}`).join("|"),
      ].join(":"),
    );
    const cachedSummary = summaryCache.get(summaryFingerprint);
    if (cachedSummary) {
      return { output: cachedSummary, reason: null };
    }
    const summarizeAttempt = async (
      targetCards: Stage05ExtractedCard[],
      fullTextBudgetPerCard: number,
      timeoutFloorMs: number,
    ): Promise<{ output: Stage05LlmSummaryOutput | null; reason: string | null }> => {
      const llmTargetCards =
        targetCards.length > MAX_STAGE05_LLM_CARDS_PER_ATTEMPT
          ? targetCards.slice(0, MAX_STAGE05_LLM_CARDS_PER_ATTEMPT)
          : targetCards;
      const promptCards = buildPromptCards(llmTargetCards, options, fullTextBudgetPerCard);
      const promptChars = estimatePromptChars(promptCards);
      const adaptiveTimeoutMs = clampNumber(
        Math.ceil(timeoutFloorMs + promptChars / 20),
        timeoutFloorMs,
        Math.max(timeoutFloorMs, 35_000),
      );
      const timeoutSentinel = Symbol("stage05_timeout");
      try {
        const summaryOutput = await Promise.race([
          options.summarizeWithLlm({
            query,
            slotPlan,
            pass,
            batchIndex,
            batchCount,
            cards: promptCards,
            timeoutMs: adaptiveTimeoutMs,
          }),
          new Promise<typeof timeoutSentinel>((resolve) => {
            setTimeout(() => resolve(timeoutSentinel), Math.max(100, adaptiveTimeoutMs));
          }),
        ]);
        if (summaryOutput === timeoutSentinel) return { output: null, reason: "stage05_llm_timeout" };
        if (!summaryOutput) return { output: null, reason: "stage05_llm_empty_output" };
        if (!summaryOutput.summaries) return { output: null, reason: "stage05_llm_invalid_output" };
        return { output: alignSummaryOutputToCards(summaryOutput, targetCards), reason: null };
      } catch (error) {
        return { output: null, reason: mapStage05SummaryErrorReason(error) };
      }
    };

    const summarizeBatchDegraded = async (
      targetCards: Stage05ExtractedCard[],
      reasonHint: string,
      initialBudgetPerCard: number,
      timeoutFloorMs: number,
    ): Promise<{ output: Stage05LlmSummaryOutput | null; reason: string | null }> => {
      const timeoutRelated = /timeout/i.test(reasonHint);
      const fallbackBatches = partitionCardsByBudget(
        targetCards,
        Math.max(1_800, Math.floor(options.maxExtractChars * 0.45)),
      );
      if (fallbackBatches.length <= 1 && targetCards.length > 1) {
        const midpoint = Math.ceil(targetCards.length / 2);
        fallbackBatches.splice(
          0,
          fallbackBatches.length,
          targetCards.slice(0, midpoint),
          targetCards.slice(midpoint),
        );
      }
      if (fallbackBatches.length <= 1) {
        return { output: null, reason: reasonHint };
      }
      let merged: Stage05LlmSummaryOutput | null = null;
      for (let i = 0; i < fallbackBatches.length; i += 1) {
        const fallbackCards = fallbackBatches[i];
        const fallbackFullTextBudget =
          fullFileMode && !timeoutRelated
            ? clampNumber(Math.floor(initialBudgetPerCard * 0.45), 600, 2200)
            : 0;
        const fallbackAttempt = await summarizeAttempt(
          fallbackCards,
          fallbackFullTextBudget,
          Math.max(timeoutFloorMs, timeoutRelated ? 10_000 : 6_000),
        );
        if (!fallbackAttempt.output) {
          return { output: null, reason: fallbackAttempt.reason ?? reasonHint };
        }
        merged = mergeSummaryOutputs(merged, fallbackAttempt.output);
      }
      if (!merged) return { output: null, reason: reasonHint };
      const missingAfterFallback = collectMissingSummaryCards(targetCards, merged);
      if (missingAfterFallback.length > 0) {
        return { output: null, reason: "stage05_llm_incomplete" };
      }
      return { output: merged, reason: null };
    };

    const initialFullTextBudgetPerCard = fullFileMode
      ? clampNumber(Math.floor(options.maxExtractChars / Math.max(1, cards.length)), 1200, 6000)
      : 0;
    const timeoutFloorMs =
      overflowPolicy === "two_pass" && fullFileMode
        ? Math.max(options.timeoutMs, 8_000)
        : options.timeoutMs;

    const first = await summarizeAttempt(cards, initialFullTextBudgetPerCard, timeoutFloorMs);
    if (!first.output) {
      if (fullFileMode && first.reason === "stage05_llm_timeout") {
        const snippetOnlyAttempt = await summarizeAttempt(cards, 0, Math.max(timeoutFloorMs, 10_000));
        if (snippetOnlyAttempt.output) {
          return { output: snippetOnlyAttempt.output, reason: null };
        }
      }
      const degraded = await summarizeBatchDegraded(
        cards,
        first.reason ?? "stage05_llm_failed",
        initialFullTextBudgetPerCard,
        timeoutFloorMs,
      );
      if (degraded.output) {
        return { output: degraded.output, reason: null };
      }
      return { output: null, reason: first.reason ?? "stage05_llm_failed" };
    }
    let mergedOutput = first.output;
    let missingCards = collectMissingSummaryCards(cards, mergedOutput);
    if (missingCards.length > 0) {
      const retryBudget = fullFileMode
        ? clampNumber(Math.floor(initialFullTextBudgetPerCard * 0.6), 800, 3600)
        : 0;
      const retry = await summarizeAttempt(
        missingCards,
        retryBudget,
        Math.max(timeoutFloorMs, 7_500),
      );
      if (retry.output) {
        mergedOutput = mergeSummaryOutputs(mergedOutput, retry.output) ?? mergedOutput;
      } else {
        if (fullFileMode && retry.reason === "stage05_llm_timeout") {
          const retrySnippetOnly = await summarizeAttempt(missingCards, 0, Math.max(timeoutFloorMs, 10_000));
          if (retrySnippetOnly.output) {
            mergedOutput = mergeSummaryOutputs(mergedOutput, retrySnippetOnly.output) ?? mergedOutput;
            missingCards = collectMissingSummaryCards(cards, mergedOutput);
            if (missingCards.length === 0) {
              summaryCache.set(summaryFingerprint, mergedOutput);
              return { output: mergedOutput, reason: null };
            }
          }
        }
        const degraded = await summarizeBatchDegraded(
          missingCards,
          retry.reason ?? "stage05_llm_failed",
          retryBudget,
          Math.max(timeoutFloorMs, 5_000),
        );
        if (degraded.output) {
          mergedOutput = mergeSummaryOutputs(mergedOutput, degraded.output) ?? mergedOutput;
        } else {
          return { output: null, reason: retry.reason ?? "stage05_llm_failed" };
        }
      }
      missingCards = collectMissingSummaryCards(cards, mergedOutput);
      if (missingCards.length > 0) {
        if (hasSummaryOutputForAnyCards(cards, mergedOutput)) {
          return { output: mergedOutput, reason: null };
        }
        return { output: null, reason: "stage05_llm_incomplete" };
      }
    }
    summaryCache.set(summaryFingerprint, mergedOutput);
    return { output: mergedOutput, reason: null };
  };

  if (options.llmFirst && workingCards.length > 0) {
    if (twoPassUsed) {
      const batches = partitionCardsByBudget(workingCards, options.maxExtractChars);
      twoPassBatches = batches.length;
      let pass1AllBatchesSucceeded = true;
      for (let i = 0; i < batches.length; i += 1) {
        const batch = batches[i];
        const summary = await summarizeBatch(batch, 1, i + 1, batches.length);
        if (!summary.output || !hasSummaryOutputForAnyCards(batch, summary.output)) {
          pass1AllBatchesSucceeded = false;
          fallbackReason = summary.reason ?? "stage05_llm_failed";
          if (summaryRequired && hardFailOnSummaryError) {
            return buildSummaryHardFail(fallbackReason);
          }
          continue;
        }
        const patch = applyLlmSummaries(workingCards, summary.output);
        workingCards = patch.cards;
        llmUsed = true;
        llmSummarySucceeded = true;
      }
      if (batches.length > 1) {
        const pass2 = await summarizeBatch(workingCards, 2, 1, 1);
        if (!pass2.output || !hasSummaryOutputForAnyCards(workingCards, pass2.output)) {
          // Pass-2 is refinement over already summarized cards.
          // If pass-1 fully succeeded, keep pass-1 summaries and continue.
          if (pass1AllBatchesSucceeded) {
            fallbackReason = null;
          } else {
            fallbackReason = pass2.reason ?? "stage05_llm_failed";
            if (summaryRequired && hardFailOnSummaryError) {
              return buildSummaryHardFail(fallbackReason);
            }
          }
        } else {
          const patch = applyLlmSummaries(workingCards, pass2.output);
          workingCards = patch.cards;
          llmUsed = true;
          llmSummarySucceeded = true;
        }
      }
    } else {
      twoPassUsed = false;
      twoPassBatches = 1;
      const summary = await summarizeBatch(workingCards, 1, 1, 1);
      if (!summary.output || !hasSummaryOutputForAnyCards(workingCards, summary.output)) {
        fallbackReason = summary.reason ?? "stage05_llm_failed";
        if (summaryRequired && hardFailOnSummaryError) {
          return buildSummaryHardFail(fallbackReason);
        }
      } else {
        const patch = applyLlmSummaries(workingCards, summary.output);
        workingCards = patch.cards;
        llmUsed = true;
        llmSummarySucceeded = true;
      }
    }
  }

  if (summaryRequired && hardFailOnSummaryError && !llmSummarySucceeded) {
    return buildSummaryHardFail(fallbackReason ?? "stage05_llm_unavailable");
  }

  if (equationRequired) {
    workingCards = workingCards.map((card) => {
      if (!hasEquationEvidenceInCard(card)) return card;
      const slotHits = mergeSlotHits(card.slotHits, ["equation"] as Stage05SlotId[]);
      const changed =
        (slotHits?.length ?? 0) !== (card.slotHits?.length ?? 0) ||
        (slotHits ?? []).some((entry, index) => entry !== card.slotHits?.[index]);
      if (!changed) return card;
      return {
        ...card,
        slotHits,
      };
    });
  }

  const slotCoverage = buildSlotCoverage(
    slotPlan.required,
    workingCards.map((card) => ({
      path: card.path,
      kind: card.kind,
      summary: card.summary,
      symbolsOrKeys: card.symbolsOrKeys,
      snippets: card.snippets,
      slotHits: card.slotHits,
    })),
  );
  if (summaryRequired && hardFailOnSummaryError && slotCoverage.missing.length > 0) {
    const reason = `stage05_slot_coverage_missing:${slotCoverage.missing.join(",")}`;
    return buildSummaryHardFail(reason, slotCoverage);
  }

  const kindCounts = buildKindCounts();
  for (const card of workingCards) {
    kindCounts[card.kind] += 1;
  }

  const totalMs = Date.now() - startMs;
  const telemetry: Stage05Telemetry = {
    used: workingCards.length > 0,
    file_count: rankedPaths.length,
    card_count: workingCards.length,
    kind_counts: kindCounts,
    llm_used: llmUsed,
    fallback_reason: fallbackReason,
    extract_ms: extractMs,
    total_ms: totalMs,
    budget_capped: budgetCapped,
    summary_required: summaryRequired,
    summary_hard_fail: false,
    summary_fail_reason: null,
    slot_plan: slotPlan,
    slot_coverage: slotCoverage,
    fullfile_mode: fullFileMode,
    two_pass_used: twoPassUsed,
    two_pass_batches: twoPassBatches,
    overflow_policy: overflowPolicy,
  };
  const cards: Stage05EvidenceCard[] = workingCards.map((card) => ({
    path: card.path,
    kind: card.kind,
    summary: card.summary,
    symbolsOrKeys: card.symbolsOrKeys,
    snippets: card.snippets,
    confidence: Number(card.confidence.toFixed(4)),
    slotHits: card.slotHits,
  }));
  return { cards, telemetry };
}
