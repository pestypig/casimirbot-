import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HELIX_LANG_SCHEMA_VERSION = "helix.lang.v1" as const;
export type HelixLangSchemaVersion = typeof HELIX_LANG_SCHEMA_VERSION;

export type HelixAskQueryLane = "pivot" | "source";
export type HelixAskTermCategory = "eponym" | "framework";
export type HelixAskTermMatchType = "exact" | "romanized" | "fuzzy";
export type HelixAskTermMatchedIn = "source" | "pivot" | "both";
export type HelixAskTermPriorSuppressedReason =
  | "term_prior_disabled"
  | "term_hits_missing"
  | "term_hit_confidence_low"
  | "pivot_confidence_low"
  | "explicit_repo_cue"
  | "non_conceptual_prompt"
  | "polysemy_ambiguous"
  | "term_repo_blocker";

export type HelixAskLanguageDirectoryEntry = {
  term_id: string;
  category: HelixAskTermCategory;
  canonical: string;
  aliases_by_locale: Record<string, string[]>;
  romanized_aliases: string[];
  concept_expansions: string[];
  conceptual_patterns: string[];
  explicit_repo_blockers: string[];
  polysemy_group?: string;
  enabled?: boolean;
};

export type HelixAskLanguageDirectory = {
  schema_version: string;
  denylist_term_ids: string[];
  overrides_by_term_id?: Record<string, Partial<HelixAskLanguageDirectoryEntry> & { enabled?: boolean }>;
  entries: HelixAskLanguageDirectoryEntry[];
};

type HelixAskCompiledDirectoryEntry = HelixAskLanguageDirectoryEntry & {
  alias_index: string[];
  romanized_index: string[];
  conceptual_patterns_re: RegExp[];
  explicit_repo_blockers_re: RegExp[];
};

export type HelixAskLanguageDirectoryRuntime = {
  schemaVersion: string;
  directoryPath: string;
  loadedAtMs: number;
  mtimeMs: number;
  denylistTermIds: string[];
  disabledTermIds: string[];
  entries: HelixAskCompiledDirectoryEntry[];
};

type HelixAskLanguageDirectoryCache = {
  lastCheckMs: number;
  reloadMs: number;
  runtime: HelixAskLanguageDirectoryRuntime;
};

export type HelixAskTermHit = {
  term_id: string;
  category: HelixAskTermCategory;
  canonical: string;
  matched_in: HelixAskTermMatchedIn;
  match_type: HelixAskTermMatchType;
  term_hit_confidence: number;
  concept_expansions: string[];
  polysemy_group?: string;
  repo_blocker_hit: boolean;
};

export type HelixAskTermDetection = {
  schema_version: string;
  directory_path: string;
  directory_loaded_at_ms: number;
  denylisted_term_ids: string[];
  disabled_term_ids: string[];
  term_hits: HelixAskTermHit[];
};

export type HelixAskTermPriorDecision = {
  evaluated: boolean;
  applied: boolean;
  hard_force_general: boolean;
  weighted_prior: {
    general_boost: number;
    repo_penalty: number;
    hybrid_penalty: number;
  };
  prior_suppressed_reason: HelixAskTermPriorSuppressedReason | null;
  conceptual_prompt: boolean;
  physics_relation_prompt: boolean;
  explicit_repo_cue: boolean;
  term_hit_confidence: number;
  pivot_confidence: number | null;
  polysemy_ambiguous: boolean;
  polysemy_group: string | null;
  term_hits: HelixAskTermHit[];
  denylisted_term_ids: string[];
  disabled_term_ids: string[];
};

export type HelixAskTermPriorInput = {
  sourceText: string;
  pivotText: string;
  sourceLanguage?: string | null;
  pivotConfidence?: number | null;
  explicitRepoCue: boolean;
  enabled: boolean;
  termHitConfidenceMin?: number;
  pivotConfidenceMin?: number;
  hardForceConfidenceMin?: number;
  directoryPath?: string;
  directoryReloadMs?: number;
};

type HelixAskMatchProbe = {
  matchType: HelixAskTermMatchType;
  confidence: number;
} | null;

const HELIX_LANE_PREFIX_RE = /^\s*\[(pivot|source)\]\s*/i;
const DEFAULT_TERM_DIRECTORY_RELATIVE_PATH = path.join(
  "configs",
  "helix-ask-language-directory.v1.json",
);
const DEFAULT_TERM_DIRECTORY_PATH = path.resolve(
  process.cwd(),
  DEFAULT_TERM_DIRECTORY_RELATIVE_PATH,
);
const HELIX_MULTILANG_MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TERM_DIRECTORY_RELOAD_MS = 60_000;
const DEFAULT_TERM_HIT_CONFIDENCE_MIN = 0.75;
const DEFAULT_PIVOT_CONFIDENCE_MIN = 0.82;
const DEFAULT_HARD_FORCE_CONFIDENCE_MIN = 0.92;
const MAX_DIRECTORY_RELOAD_MS = 300_000;
const MIN_DIRECTORY_RELOAD_MS = 5_000;
const CJK_RE = /[\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const CONCEPTUAL_PROMPT_RE =
  /\b(?:what\s+is|what'?s|define|definition|meaning|explain|concept|theory|in\s+plain\s+language|in\s+simple\s+terms|how\s+(?:is|does|do|can|could|would))\b|\u4ec0\u4e48\u662f|\u89e3\u91ca|\u610f\u5473\u7740/u;
const RELATION_PROMPT_RE =
  /\b(?:relation|related|relationship|how\s+is|difference|versus|vs\.?|between|link(?:ed|age)?)\b|\u5173\u7cfb|\u8054\u7cfb|\u533a\u522b/u;

export const HELIX_CANONICAL_PROTECTED_TERMS = [
  "warp bubble",
  "Alcubierre",
  "Casimir",
  "Helix Ask",
  "code lattice",
] as const;

type CanonicalTermEntry = {
  canonical: string;
  patterns: RegExp[];
};

const buildWordPattern = (value: string): RegExp => {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
};

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const normalizeForTermMatching = (value: string): string =>
  normalizeSpaces(
    value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/[_-]+/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " "),
  );

const normalizeTermId = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_");

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const compilePattern = (value: string): RegExp => {
  const trimmed = value.trim();
  if (!trimmed) return /^$/i;
  try {
    return new RegExp(trimmed, "i");
  } catch {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, "i");
  }
};

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const clampReloadMs = (value: number | undefined | null): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_TERM_DIRECTORY_RELOAD_MS;
  return Math.max(MIN_DIRECTORY_RELOAD_MS, Math.min(MAX_DIRECTORY_RELOAD_MS, Math.floor(value)));
};

const phraseMatch = (normalizedText: string, normalizedPhrase: string): boolean => {
  if (!normalizedText || !normalizedPhrase) return false;
  if (CJK_RE.test(normalizedPhrase)) {
    return normalizedText.includes(normalizedPhrase);
  }
  const paddedText = ` ${normalizedText} `;
  const paddedPhrase = ` ${normalizedPhrase} `;
  return paddedText.includes(paddedPhrase);
};

const fuzzyMatch = (normalizedText: string, normalizedPhrase: string): boolean => {
  const tokens = normalizedPhrase
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
  if (tokens.length < 2) return false;
  return tokens.every((token) => normalizedText.includes(token));
};

const probeEntryMatch = (
  normalizedText: string,
  aliases: string[],
  romanizedAliases: string[],
): HelixAskMatchProbe => {
  for (const alias of aliases) {
    if (!alias) continue;
    if (phraseMatch(normalizedText, alias)) {
      return { matchType: "exact", confidence: 0.96 };
    }
  }
  for (const alias of romanizedAliases) {
    if (!alias) continue;
    if (phraseMatch(normalizedText, alias)) {
      return { matchType: "romanized", confidence: 0.88 };
    }
  }
  for (const alias of aliases) {
    if (!alias) continue;
    if (fuzzyMatch(normalizedText, alias)) {
      return { matchType: "fuzzy", confidence: 0.76 };
    }
  }
  return null;
};

const combineMatchType = (
  sourceMatch: HelixAskMatchProbe,
  pivotMatch: HelixAskMatchProbe,
): HelixAskTermMatchType => {
  const candidates = [sourceMatch?.matchType, pivotMatch?.matchType].filter(Boolean) as HelixAskTermMatchType[];
  if (candidates.includes("exact")) return "exact";
  if (candidates.includes("romanized")) return "romanized";
  return "fuzzy";
};

const combineMatchConfidence = (sourceMatch: HelixAskMatchProbe, pivotMatch: HelixAskMatchProbe): number => {
  const source = sourceMatch?.confidence ?? 0;
  const pivot = pivotMatch?.confidence ?? 0;
  let score = Math.max(source, pivot);
  if (source > 0 && pivot > 0) score += 0.05;
  if (sourceMatch?.matchType === pivotMatch?.matchType && source > 0 && pivot > 0) score += 0.03;
  return clamp01(score);
};

const buildCanonicalTermIndex = (): CanonicalTermEntry[] =>
  HELIX_CANONICAL_PROTECTED_TERMS.map((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const permissiveSpacing = escaped.replace(/\s+/g, "[\\s_-]*");
    return {
      canonical: term,
      patterns: [buildWordPattern(term), new RegExp(permissiveSpacing, "i")],
    };
  });

const CANONICAL_TERM_INDEX: CanonicalTermEntry[] = buildCanonicalTermIndex();

let languageDirectoryCache: HelixAskLanguageDirectoryCache | null = null;

const walkAncestorCandidates = (start: string, relativePath: string): string[] => {
  const out: string[] = [];
  let current = path.resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    out.push(path.resolve(current, relativePath));
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return out;
};

const resolveTermDirectoryPath = (directoryPath?: string): string => {
  const trimmed = (directoryPath ?? "").trim();
  const candidates: string[] = [];
  const seen = new Set<string>();
  const pushCandidate = (candidate: string): void => {
    const resolved = path.resolve(candidate);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    candidates.push(resolved);
  };

  if (trimmed) {
    if (path.isAbsolute(trimmed)) {
      pushCandidate(trimmed);
    } else {
      pushCandidate(path.resolve(process.cwd(), trimmed));
      for (const candidate of walkAncestorCandidates(process.cwd(), trimmed)) {
        pushCandidate(candidate);
      }
      for (const candidate of walkAncestorCandidates(HELIX_MULTILANG_MODULE_DIR, trimmed)) {
        pushCandidate(candidate);
      }
    }
  }

  for (const candidate of walkAncestorCandidates(process.cwd(), DEFAULT_TERM_DIRECTORY_RELATIVE_PATH)) {
    pushCandidate(candidate);
  }
  for (const candidate of walkAncestorCandidates(HELIX_MULTILANG_MODULE_DIR, DEFAULT_TERM_DIRECTORY_RELATIVE_PATH)) {
    pushCandidate(candidate);
  }
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return existing ?? candidates[0] ?? DEFAULT_TERM_DIRECTORY_PATH;
};

const buildEmptyDirectoryRuntime = (directoryPath: string): HelixAskLanguageDirectoryRuntime => ({
  schemaVersion: HELIX_LANG_SCHEMA_VERSION,
  directoryPath,
  loadedAtMs: Date.now(),
  mtimeMs: 0,
  denylistTermIds: [],
  disabledTermIds: [],
  entries: [],
});

const applyEntryOverride = (
  base: HelixAskLanguageDirectoryEntry,
  override: (Partial<HelixAskLanguageDirectoryEntry> & { enabled?: boolean }) | undefined,
): HelixAskLanguageDirectoryEntry => {
  if (!override) return { ...base };
  const mergedAliases = {
    ...(base.aliases_by_locale ?? {}),
    ...(override.aliases_by_locale ?? {}),
  };
  return {
    ...base,
    ...override,
    aliases_by_locale: mergedAliases,
    romanized_aliases: override.romanized_aliases ?? base.romanized_aliases ?? [],
    concept_expansions: override.concept_expansions ?? base.concept_expansions ?? [],
    conceptual_patterns: override.conceptual_patterns ?? base.conceptual_patterns ?? [],
    explicit_repo_blockers: override.explicit_repo_blockers ?? base.explicit_repo_blockers ?? [],
  };
};

const parseDirectoryEntry = (
  raw: unknown,
  overrideByTermId: Record<string, Partial<HelixAskLanguageDirectoryEntry> & { enabled?: boolean }>,
  denylist: Set<string>,
  disabledTermIds: Set<string>,
): HelixAskCompiledDirectoryEntry | null => {
  const record = asRecord(raw);
  const termIdRaw = typeof record.term_id === "string" ? record.term_id : "";
  const normalizedTermId = normalizeTermId(termIdRaw);
  if (!normalizedTermId) return null;
  const baseEntry: HelixAskLanguageDirectoryEntry = {
    term_id: normalizedTermId,
    category: record.category === "eponym" ? "eponym" : "framework",
    canonical: typeof record.canonical === "string" ? record.canonical.trim() : "",
    aliases_by_locale: Object.fromEntries(
      Object.entries(asRecord(record.aliases_by_locale)).map(([locale, aliases]) => [locale, asStringArray(aliases)]),
    ),
    romanized_aliases: asStringArray(record.romanized_aliases),
    concept_expansions: asStringArray(record.concept_expansions),
    conceptual_patterns: asStringArray(record.conceptual_patterns),
    explicit_repo_blockers: asStringArray(record.explicit_repo_blockers),
    polysemy_group:
      typeof record.polysemy_group === "string" && record.polysemy_group.trim()
        ? record.polysemy_group.trim()
        : undefined,
    enabled: record.enabled !== false,
  };
  if (!baseEntry.canonical) return null;
  const mergedEntry = applyEntryOverride(baseEntry, overrideByTermId[normalizedTermId]);
  const denylisted = denylist.has(normalizedTermId);
  const enabled = mergedEntry.enabled !== false && !denylisted;
  if (!enabled) {
    disabledTermIds.add(normalizedTermId);
    return null;
  }
  const aliases = uniqueStrings([
    mergedEntry.canonical,
    ...Object.values(mergedEntry.aliases_by_locale ?? {}).flatMap((entries) => entries ?? []),
  ]);
  const aliasIndex = uniqueStrings(aliases.map((alias) => normalizeForTermMatching(alias)).filter(Boolean));
  const romanizedIndex = uniqueStrings(
    (mergedEntry.romanized_aliases ?? []).map((alias) => normalizeForTermMatching(alias)).filter(Boolean),
  );
  return {
    ...mergedEntry,
    alias_index: aliasIndex,
    romanized_index: romanizedIndex,
    conceptual_patterns_re: (mergedEntry.conceptual_patterns ?? []).map((pattern) => compilePattern(pattern)),
    explicit_repo_blockers_re: (mergedEntry.explicit_repo_blockers ?? []).map((pattern) => compilePattern(pattern)),
  };
};

const loadLanguageDirectoryFromDisk = (directoryPath: string): HelixAskLanguageDirectoryRuntime => {
  if (!fs.existsSync(directoryPath)) {
    return buildEmptyDirectoryRuntime(directoryPath);
  }
  const raw = fs.readFileSync(directoryPath, "utf8");
  const parsed = asRecord(JSON.parse(raw));
  const schemaVersion =
    typeof parsed.schema_version === "string" && parsed.schema_version.trim()
      ? parsed.schema_version.trim()
      : HELIX_LANG_SCHEMA_VERSION;
  const denylist = new Set(asStringArray(parsed.denylist_term_ids).map((entry) => normalizeTermId(entry)));
  const overrideByTermId = Object.fromEntries(
    Object.entries(asRecord(parsed.overrides_by_term_id)).map(([termId, override]) => [
      normalizeTermId(termId),
      asRecord(override) as Partial<HelixAskLanguageDirectoryEntry> & { enabled?: boolean },
    ]),
  );
  const disabledTermIds = new Set<string>();
  const entriesRaw = Array.isArray(parsed.entries) ? parsed.entries : [];
  const entries: HelixAskCompiledDirectoryEntry[] = [];
  for (const entry of entriesRaw) {
    const parsedEntry = parseDirectoryEntry(entry, overrideByTermId, denylist, disabledTermIds);
    if (parsedEntry) entries.push(parsedEntry);
  }
  const stat = fs.statSync(directoryPath);
  return {
    schemaVersion,
    directoryPath,
    loadedAtMs: Date.now(),
    mtimeMs: stat.mtimeMs,
    denylistTermIds: Array.from(denylist.values()),
    disabledTermIds: Array.from(disabledTermIds.values()),
    entries,
  };
};

export const resetHelixAskLanguageDirectoryCache = (): void => {
  languageDirectoryCache = null;
};

export const getHelixAskLanguageDirectory = (args?: {
  directoryPath?: string;
  reloadMs?: number;
  nowMs?: number;
}): HelixAskLanguageDirectoryRuntime => {
  const directoryPath = resolveTermDirectoryPath(args?.directoryPath);
  const reloadMs = clampReloadMs(args?.reloadMs);
  const nowMs = typeof args?.nowMs === "number" ? args.nowMs : Date.now();
  const cached = languageDirectoryCache;
  if (
    cached &&
    cached.runtime.directoryPath === directoryPath &&
    cached.reloadMs === reloadMs &&
    nowMs - cached.lastCheckMs < reloadMs
  ) {
    return cached.runtime;
  }
  try {
    const stat = fs.existsSync(directoryPath) ? fs.statSync(directoryPath) : null;
    if (
      cached &&
      cached.runtime.directoryPath === directoryPath &&
      stat &&
      stat.mtimeMs === cached.runtime.mtimeMs
    ) {
      cached.lastCheckMs = nowMs;
      return cached.runtime;
    }
    const runtime = loadLanguageDirectoryFromDisk(directoryPath);
    languageDirectoryCache = {
      lastCheckMs: nowMs,
      reloadMs,
      runtime,
    };
    return runtime;
  } catch {
    if (cached && cached.runtime.directoryPath === directoryPath) {
      cached.lastCheckMs = nowMs;
      return cached.runtime;
    }
    const fallback = buildEmptyDirectoryRuntime(directoryPath);
    languageDirectoryCache = {
      lastCheckMs: nowMs,
      reloadMs,
      runtime: fallback,
    };
    return fallback;
  }
};

const resolvePolysemyAmbiguity = (
  termHits: HelixAskTermHit[],
): { ambiguous: boolean; group: string | null } => {
  const byGroup = new Map<string, HelixAskTermHit[]>();
  for (const hit of termHits) {
    const group = hit.polysemy_group?.trim();
    if (!group) continue;
    const existing = byGroup.get(group) ?? [];
    existing.push(hit);
    byGroup.set(group, existing);
  }
  for (const [group, hits] of byGroup.entries()) {
    if (hits.length < 2) continue;
    const ranked = hits
      .slice()
      .sort((a, b) => b.term_hit_confidence - a.term_hit_confidence);
    const top = ranked[0]?.term_hit_confidence ?? 0;
    const second = ranked[1]?.term_hit_confidence ?? 0;
    if (top - second <= 0.1) {
      return { ambiguous: true, group };
    }
  }
  return { ambiguous: false, group: null };
};

const UNKNOWN_LANGUAGE_TAG_RE = /^(?:auto|unknown|und|none|null|n\/a|na)$/i;

export const normalizeLanguageTag = (value: string | undefined | null): string | undefined => {
  const trimmed = (value ?? "").trim();
  if (!trimmed || UNKNOWN_LANGUAGE_TAG_RE.test(trimmed)) return undefined;
  return trimmed.toLowerCase();
};

export const prefixHelixAskLaneQuery = (lane: HelixAskQueryLane, query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return "";
  return `[${lane}] ${trimmed}`;
};

export const parseHelixAskLaneQuery = (query: string): { lane: HelixAskQueryLane; query: string } => {
  const trimmed = query.trim();
  const match = trimmed.match(HELIX_LANE_PREFIX_RE);
  if (!match) return { lane: "pivot", query: trimmed };
  const lane = match[1].toLowerCase() === "source" ? "source" : "pivot";
  return {
    lane,
    query: trimmed.replace(HELIX_LANE_PREFIX_RE, "").trim(),
  };
};

export const findCanonicalTermsInText = (text: string): string[] => {
  if (!text.trim()) return [];
  const terms: string[] = [];
  for (const entry of CANONICAL_TERM_INDEX) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      terms.push(entry.canonical);
    }
  }
  return terms;
};

export const canonicalTermPreservationRatio = (sourceText: string, targetText: string): number => {
  const sourceTerms = findCanonicalTermsInText(sourceText);
  if (sourceTerms.length === 0) return 1;
  const preserved = sourceTerms.filter((term) => buildWordPattern(term).test(targetText)).length;
  return Math.max(0, Math.min(1, preserved / sourceTerms.length));
};

export const enforceCanonicalTermPreservation = (sourceText: string, translatedText: string): string => {
  const sourceTerms = findCanonicalTermsInText(sourceText);
  if (sourceTerms.length === 0) return translatedText;
  let next = translatedText.trim();
  for (const term of sourceTerms) {
    if (buildWordPattern(term).test(next)) continue;
    next = normalizeSpaces(`${next} (${term})`);
  }
  return next;
};

export const detectHelixAskTermHits = (args: {
  sourceText: string;
  pivotText: string;
  sourceLanguage?: string | null;
  directoryPath?: string;
  directoryReloadMs?: number;
  nowMs?: number;
}): HelixAskTermDetection => {
  const runtime = getHelixAskLanguageDirectory({
    directoryPath: args.directoryPath,
    reloadMs: args.directoryReloadMs,
    nowMs: args.nowMs,
  });
  const normalizedSource = normalizeForTermMatching(args.sourceText ?? "");
  const normalizedPivot = normalizeForTermMatching(args.pivotText ?? "");
  const sourceRaw = args.sourceText ?? "";
  const pivotRaw = args.pivotText ?? "";
  const termHits: HelixAskTermHit[] = [];
  for (const entry of runtime.entries) {
    const sourceMatch = probeEntryMatch(normalizedSource, entry.alias_index, entry.romanized_index);
    const pivotMatch = probeEntryMatch(normalizedPivot, entry.alias_index, entry.romanized_index);
    if (!sourceMatch && !pivotMatch) continue;
    const matchedIn: HelixAskTermMatchedIn =
      sourceMatch && pivotMatch ? "both" : sourceMatch ? "source" : "pivot";
    const blockerHit = entry.explicit_repo_blockers_re.some(
      (re) => re.test(sourceRaw) || re.test(pivotRaw),
    );
    termHits.push({
      term_id: entry.term_id,
      category: entry.category,
      canonical: entry.canonical,
      matched_in: matchedIn,
      match_type: combineMatchType(sourceMatch, pivotMatch),
      term_hit_confidence: Number(combineMatchConfidence(sourceMatch, pivotMatch).toFixed(4)),
      concept_expansions: entry.concept_expansions.slice(),
      polysemy_group: entry.polysemy_group,
      repo_blocker_hit: blockerHit,
    });
  }
  termHits.sort((a, b) => {
    if (b.term_hit_confidence !== a.term_hit_confidence) {
      return b.term_hit_confidence - a.term_hit_confidence;
    }
    return a.term_id.localeCompare(b.term_id);
  });
  return {
    schema_version: runtime.schemaVersion,
    directory_path: runtime.directoryPath,
    directory_loaded_at_ms: runtime.loadedAtMs,
    denylisted_term_ids: runtime.denylistTermIds.slice(),
    disabled_term_ids: runtime.disabledTermIds.slice(),
    term_hits: termHits,
  };
};

export const computeHelixAskTermPriorDecision = (
  input: HelixAskTermPriorInput,
): HelixAskTermPriorDecision => {
  const termDetection = detectHelixAskTermHits({
    sourceText: input.sourceText,
    pivotText: input.pivotText,
    sourceLanguage: input.sourceLanguage,
    directoryPath: input.directoryPath,
    directoryReloadMs: input.directoryReloadMs,
  });
  const termHits = termDetection.term_hits;
  const termHitConfidence = termHits.reduce(
    (best, hit) => Math.max(best, hit.term_hit_confidence),
    0,
  );
  const pivotConfidence =
    typeof input.pivotConfidence === "number" && Number.isFinite(input.pivotConfidence)
      ? clamp01(input.pivotConfidence)
      : null;
  const normalizedPrompt = normalizeForTermMatching(`${input.sourceText} ${input.pivotText}`);
  const conceptualPrompt = CONCEPTUAL_PROMPT_RE.test(normalizedPrompt);
  const relationPrompt = RELATION_PROMPT_RE.test(normalizedPrompt);
  const { ambiguous: polysemyAmbiguous, group: polysemyGroup } = resolvePolysemyAmbiguity(termHits);
  const blockerHit = termHits.some((hit) => hit.repo_blocker_hit);
  const termHitConfidenceMin =
    typeof input.termHitConfidenceMin === "number"
      ? clamp01(input.termHitConfidenceMin)
      : DEFAULT_TERM_HIT_CONFIDENCE_MIN;
  const pivotConfidenceMin =
    typeof input.pivotConfidenceMin === "number"
      ? clamp01(input.pivotConfidenceMin)
      : DEFAULT_PIVOT_CONFIDENCE_MIN;
  const hardForceConfidenceMin =
    typeof input.hardForceConfidenceMin === "number"
      ? clamp01(input.hardForceConfidenceMin)
      : DEFAULT_HARD_FORCE_CONFIDENCE_MIN;
  let suppressed: HelixAskTermPriorSuppressedReason | null = null;
  if (!input.enabled) {
    suppressed = "term_prior_disabled";
  } else if (!termHits.length) {
    suppressed = "term_hits_missing";
  } else if (termHitConfidence < termHitConfidenceMin) {
    suppressed = "term_hit_confidence_low";
  } else if (pivotConfidence !== null && pivotConfidence < pivotConfidenceMin) {
    suppressed = "pivot_confidence_low";
  } else if (input.explicitRepoCue) {
    suppressed = "explicit_repo_cue";
  } else if (blockerHit) {
    suppressed = "term_repo_blocker";
  } else if (polysemyAmbiguous) {
    suppressed = "polysemy_ambiguous";
  } else if (!conceptualPrompt && !relationPrompt) {
    suppressed = "non_conceptual_prompt";
  }
  const applied = suppressed === null;
  const hardForceGeneral =
    applied &&
    termHitConfidence >= hardForceConfidenceMin &&
    pivotConfidence !== null &&
    pivotConfidence >= hardForceConfidenceMin &&
    conceptualPrompt &&
    !input.explicitRepoCue;
  return {
    evaluated: true,
    applied,
    hard_force_general: hardForceGeneral,
    weighted_prior: {
      general_boost: hardForceGeneral ? 0.8 : applied ? 0.35 : 0,
      repo_penalty: hardForceGeneral ? 0.65 : applied ? 0.2 : 0,
      hybrid_penalty: hardForceGeneral ? 0.55 : applied ? 0.15 : 0,
    },
    prior_suppressed_reason: suppressed,
    conceptual_prompt: conceptualPrompt,
    physics_relation_prompt: relationPrompt,
    explicit_repo_cue: input.explicitRepoCue,
    term_hit_confidence: Number(termHitConfidence.toFixed(4)),
    pivot_confidence: pivotConfidence,
    polysemy_ambiguous: polysemyAmbiguous,
    polysemy_group: polysemyGroup,
    term_hits: termHits,
    denylisted_term_ids: termDetection.denylisted_term_ids,
    disabled_term_ids: termDetection.disabled_term_ids,
  };
};

export const buildCandidateStableKey = (filePath: string, preview: string): string => {
  const normalizedPath = filePath.replace(/\\/g, "/").trim().toLowerCase();
  const spanFingerprint = createHash("sha1")
    .update(normalizeSpaces(preview).toLowerCase())
    .digest("hex")
    .slice(0, 16);
  return `${normalizedPath}::${spanFingerprint}`;
};
