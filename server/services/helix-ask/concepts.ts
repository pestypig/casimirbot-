import * as fs from "node:fs";
import * as path from "node:path";

export type HelixAskConceptCard = {
  id: string;
  label?: string;
  aliases: string[];
  scope?: string;
  intentHints?: string[];
  topicTags?: string[];
  mustIncludeFiles?: string[];
  definition: string;
  keyQuestions?: string;
  notes?: string;
  sourcePath: string;
};

export type HelixAskConceptMatch = {
  card: HelixAskConceptCard;
  matchedTerm: string;
  matchedField: "id" | "alias";
  score?: number;
};

export type HelixAskConceptCandidate = HelixAskConceptMatch & {
  score: number;
};

export type HelixAskConceptLookupOptions = {
  intentId?: string;
};

const CONCEPT_DIR = path.resolve(process.cwd(), "docs", "knowledge");
let conceptCache: HelixAskConceptCard[] | null = null;
let conceptLoadFailed = false;
const CONCEPT_HOT_RELOAD =
  process.env.HELIX_ASK_CONCEPTS_HOT_RELOAD === "1" || process.env.NODE_ENV !== "production";
let conceptCacheStamp: { fileCount: number; maxMtimeMs: number } | null = null;

const normalizeValue = (value: string): string => value.trim();
const unquoteValue = (value: string): string =>
  value.trim().replace(/^["']/, "").replace(/["']$/, "").trim();

const parseAliases = (value?: string): string[] => {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1);
    return inner
      .split(",")
      .map((part) => part.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
      .filter(Boolean);
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  }
  return [trimmed];
};

const parseFrontmatter = (content: string): { frontmatter: Record<string, string>; body: string } => {
  const lines = content.split(/\r?\n/);
  if (!lines.length || lines[0].trim() !== "---") {
    return { frontmatter: {}, body: content.trim() };
  }
  const frontmatter: Record<string, string> = {};
  let index = 1;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "---") {
      index += 1;
      break;
    }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    frontmatter[match[1]] = match[2].trim();
  }
  const body = lines.slice(index).join("\n").trim();
  return { frontmatter, body };
};

const stripBullet = (value: string): string => value.replace(/^\s*[-*]\s+/, "");

const parseConceptBody = (body: string): { definition: string; keyQuestions?: string; notes?: string } => {
  const lines = body.split(/\r?\n/);
  let definition = "";
  let keyQuestions = "";
  let notes = "";
  const takeFirstParagraph = () => {
    const paragraphs = body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    return stripBullet(paragraphs[0] ?? "");
  };

  for (const line of lines) {
    const trimmed = stripBullet(line.trim());
    if (!trimmed) continue;
    if (!definition) {
      const defMatch = trimmed.match(/^definition\s*:\s*(.+)$/i);
      if (defMatch) {
        definition = defMatch[1].trim();
        continue;
      }
    }
    if (!keyQuestions) {
      const keyMatch = trimmed.match(/^(key questions|key points)\s*:\s*(.+)$/i);
      if (keyMatch) {
        keyQuestions = keyMatch[2].trim();
        continue;
      }
    }
    if (!notes) {
      const noteMatch = trimmed.match(/^notes?\s*:\s*(.+)$/i);
      if (noteMatch) {
        notes = noteMatch[1].trim();
      }
    }
  }

  if (!definition) {
    definition = takeFirstParagraph();
  }
  return { definition: definition.trim(), keyQuestions: keyQuestions || undefined, notes: notes || undefined };
};

const collectConceptFiles = (root: string): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const nextPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        walk(nextPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.toLowerCase().endsWith(".md")) continue;
      files.push(nextPath);
    }
  };
  if (fs.existsSync(root)) {
    walk(root);
  }
  return files.sort();
};

const snapshotConceptFiles = (): { files: string[]; maxMtimeMs: number } => {
  const files = collectConceptFiles(CONCEPT_DIR);
  let maxMtimeMs = 0;
  for (const filePath of files) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > maxMtimeMs) {
        maxMtimeMs = stat.mtimeMs;
      }
    } catch {
      // Ignore transient stat failures during hot reload.
    }
  }
  return { files, maxMtimeMs };
};

const isConceptCacheStale = (snapshot: { files: string[]; maxMtimeMs: number }): boolean => {
  if (!conceptCacheStamp) return true;
  if (conceptCacheStamp.fileCount !== snapshot.files.length) return true;
  if (conceptCacheStamp.maxMtimeMs < snapshot.maxMtimeMs) return true;
  return false;
};

const updateConceptCacheStamp = (snapshot: { files: string[]; maxMtimeMs: number }) => {
  conceptCacheStamp = { fileCount: snapshot.files.length, maxMtimeMs: snapshot.maxMtimeMs };
};

const loadConceptCards = (): HelixAskConceptCard[] => {
  if (conceptLoadFailed) return [];
  let snapshot: { files: string[]; maxMtimeMs: number } | null = null;
  if (conceptCache) {
    if (!CONCEPT_HOT_RELOAD) return conceptCache;
    snapshot = snapshotConceptFiles();
    if (!isConceptCacheStale(snapshot)) {
      return conceptCache;
    }
  }
  try {
    if (!fs.existsSync(CONCEPT_DIR)) {
      conceptCache = [];
      conceptCacheStamp = { fileCount: 0, maxMtimeMs: 0 };
      return conceptCache;
    }
    if (!snapshot) {
      snapshot = snapshotConceptFiles();
    }
    const files = snapshot.files;
    const cards: HelixAskConceptCard[] = [];
    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.trim()) continue;
      const { frontmatter, body } = parseFrontmatter(raw);
      const id = normalizeValue(frontmatter.id ?? path.basename(filePath, ".md"));
      if (!id) continue;
      const label = frontmatter.label ? normalizeValue(frontmatter.label) : undefined;
      const aliases = parseAliases(frontmatter.aliases);
      const scope = frontmatter.scope ? normalizeValue(frontmatter.scope) : undefined;
      const intentHints = parseAliases(frontmatter.intentHints).map(normalizeValue).filter(Boolean);
      const topicTags = parseAliases(frontmatter.topicTags).map(normalizeValue).filter(Boolean);
      const mustIncludeFiles = parseAliases(frontmatter.mustIncludeFiles)
        .map((value) => normalizeValue(value))
        .filter(Boolean);
      const parsedBody = parseConceptBody(body);
      if (!parsedBody.definition) continue;
      cards.push({
        id,
        label: label ? unquoteValue(label) : undefined,
        aliases,
        scope,
        intentHints: intentHints.length ? intentHints : undefined,
        topicTags: topicTags.length ? topicTags : undefined,
        mustIncludeFiles: mustIncludeFiles.length ? mustIncludeFiles : undefined,
        definition: parsedBody.definition,
        keyQuestions: parsedBody.keyQuestions,
        notes: parsedBody.notes,
        sourcePath: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
      });
    }
    conceptCache = cards;
    updateConceptCacheStamp(snapshot);
    return cards;
  } catch (error) {
    conceptLoadFailed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[helix-ask] concept registry load failed: ${message}`);
    return [];
  }
};

const normalizeTerm = (value: string): string => value.toLowerCase();
const normalizeMatchString = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasTokenMatch = (value: string | undefined, token: string): boolean => {
  const normalizedToken = normalizeMatchString(token);
  if (!normalizedToken) return false;
  return normalizeMatchString(value ?? "")
    .split(" ")
    .filter(Boolean)
    .includes(normalizedToken);
};

const isIdeologyConcept = (card: HelixAskConceptCard): boolean => {
  if (hasTokenMatch(card.scope, "ideology")) return true;
  for (const entry of card.topicTags ?? []) {
    if (hasTokenMatch(entry, "ideology")) return true;
  }
  for (const entry of card.intentHints ?? []) {
    if (hasTokenMatch(entry, "ideology")) return true;
  }
  return false;
};

const filterCardsForLookup = (
  cards: HelixAskConceptCard[],
  options?: HelixAskConceptLookupOptions,
): HelixAskConceptCard[] => {
  if (!options?.intentId || options.intentId !== "repo.ideology_reference") {
    return cards;
  }
  const ideologyCards = cards.filter(isIdeologyConcept);
  return ideologyCards.length ? ideologyCards : cards;
};

const CONCEPT_MATCH_MIN_SCORE = 9;
const CONCEPT_MATCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "that",
  "the",
  "this",
  "to",
  "with",
  "without",
]);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const escapeRegexTerm = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeConceptTerm = (value: string): string =>
  normalizeMatchString(value.replace(/[\u2018\u2019'"]/g, ""));

const buildTermVariants = (value: string): string[] =>
  unique([
    normalizeConceptTerm(value),
    normalizeConceptTerm(value.replace(/-/g, " ")),
    normalizeConceptTerm(value.replace(/\s+/g, "-")),
  ]).filter(Boolean);

const tokenizeConceptQuestion = (value: string): string[] =>
  normalizeConceptTerm(value)
    .split(" ")
    .filter((value) => value.length > 2 && !CONCEPT_MATCH_STOP_WORDS.has(value));

const buildConceptMatchTokenScore = (
  questionQuestionNorm: string,
  questionTokens: Set<string>,
  term: string,
  field: "id" | "alias",
): number => {
  const variants = buildTermVariants(term);
  if (variants.length === 0) return 0;

  const termTokens = tokenizeConceptQuestion(variants[0]);
  if (termTokens.length === 0) return 0;
  if (termTokens.length === 1 && termTokens[0].length < 6) {
    return 0;
  }

  let overlap = 0;
  for (const token of termTokens) {
    if (questionTokens.has(token)) overlap += 1;
  }
  if (overlap <= 0) return 0;

  let score = overlap * 12;
  const overlapRatio = overlap / termTokens.length;
  if (overlapRatio >= 1) {
    score += 22;
  } else if (overlapRatio >= 0.6) {
    score += 12;
  } else if (overlapRatio >= 0.4) {
    score += 6;
  }

  let phraseScore = 0;
  for (const variant of variants) {
    if (!variant || variant.length < 3) continue;
    if (questionQuestionNorm.includes(variant)) {
      const boundary = new RegExp(
        `(?:^|[^a-z0-9])${escapeRegexTerm(variant)}(?:$|[^a-z0-9])`,
        "i",
      );
      phraseScore = Math.max(
        phraseScore,
        questionQuestionNorm === variant ? 48 : boundary.test(questionQuestionNorm) ? 28 : 12,
      );
    }
  }
  score += phraseScore;
  if (field === "id") {
    score += 6;
  }
  return score;
};

const buildBestConceptTermMatch = (card: HelixAskConceptCard, normalizedQuestion: string, questionTokens: Set<string>) => {
  const candidateTerms = unique([
    card.id,
    card.label ?? "",
    ...(card.aliases ?? []),
  ]).filter(Boolean);
  let best: HelixAskConceptCandidate | null = null;
  for (const rawTerm of candidateTerms) {
    const matchedField: "id" | "alias" = rawTerm === card.id ? "id" : "alias";
    const score = buildConceptMatchTokenScore(normalizedQuestion, questionTokens, rawTerm, matchedField);
    if (score < CONCEPT_MATCH_MIN_SCORE) continue;
    if (!best || score > best.score) {
      best = {
        card,
        matchedTerm: rawTerm,
        matchedField,
        score,
      };
    }
  }
  return best;
};

export function findConceptMatch(
  question: string,
  options?: HelixAskConceptLookupOptions,
): HelixAskConceptMatch | null {
  const normalized = normalizeTerm(question);
  if (!normalized) return null;
  const normalizedQuestion = normalizeMatchString(question);
  const questionTokens = new Set(tokenizeConceptQuestion(normalizedQuestion));
  const cards = filterCardsForLookup(loadConceptCards(), options);
  let best: (HelixAskConceptMatch & { score: number }) | null = null;
  let bestScore = 0;
  for (const card of cards) {
    const candidate = buildBestConceptTermMatch(card, normalizedQuestion, questionTokens);
    if (!candidate) continue;
    if (candidate.score > bestScore) {
      bestScore = candidate.score;
      best = candidate;
    }
  }
  return best ? { ...best } : null;
}

export function listConceptCandidates(
  question: string,
  limit = 3,
  options?: HelixAskConceptLookupOptions,
): HelixAskConceptCandidate[] {
  const normalized = normalizeTerm(question);
  if (!normalized) return [];
  const normalizedQuestion = normalizeMatchString(question);
  const questionTokens = new Set(tokenizeConceptQuestion(normalizedQuestion));
  const cards = filterCardsForLookup(loadConceptCards(), options);
  const candidates: HelixAskConceptCandidate[] = [];
  for (const card of cards) {
    const best = buildBestConceptTermMatch(card, normalizedQuestion, questionTokens);
    if (best) {
      candidates.push(best);
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  if (limit <= 0) return candidates;
  return candidates.slice(0, limit);
}

export function buildConceptScaffold(match: HelixAskConceptMatch | null): string {
  if (!match) return "";
  const { card, matchedTerm, matchedField } = match;
  const lines: string[] = [];
  const label = card.label ?? card.id;
  if (matchedField === "alias" && matchedTerm.toLowerCase() !== label.toLowerCase()) {
    lines.push(`- Interpretation: "${matchedTerm}" is treated as ${label}.`);
  }
  lines.push(`- Definition: ${card.definition}`);
  if (card.keyQuestions) {
    lines.push(`- Key questions: ${card.keyQuestions}`);
  }
  if (card.notes) {
    lines.push(`- Notes: ${card.notes}`);
  }
  if (card.scope) {
    lines.push(`- Scope: ${card.scope}`);
  }
  return lines.join("\n");
}

const ensureSentence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const NOTE_CLAUSE_RE = /(?:^|[.;]\s*)([A-Za-z][A-Za-z0-9\s-]*?)\s*:\s*([^.;]+)(?=(?:[.;]\s*[A-Za-z][A-Za-z0-9\s-]*\s*:|$))/g;

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(" ")
    .map((token) => (token ? token.charAt(0).toUpperCase() + token.slice(1) : token))
    .join(" ");

type HelixAskConceptNoteEntry = {
  label: string;
  value: string;
};

const parseConceptNotesEntries = (notes?: string): HelixAskConceptNoteEntry[] => {
  if (!notes) return [];
  const trimmed = notes.trim();
  if (!trimmed) return [];
  const entries: HelixAskConceptNoteEntry[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  NOTE_CLAUSE_RE.lastIndex = 0;
  while ((match = NOTE_CLAUSE_RE.exec(trimmed)) !== null) {
    const rawLabel = match[1]?.trim();
    const rawValue = match[2]?.trim();
    if (!rawLabel || !rawValue) continue;
    const label = toTitleCase(rawLabel);
    const value = rawValue.replace(/\s*[.;]\s*$/, "").trim();
    if (!value) continue;
    const key = `${label.toLowerCase()}:${value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ label, value });
  }
  if (entries.length > 0) {
    return entries;
  }
  const fallback = ensureSentence(trimmed);
  return fallback ? [{ label: "Notes", value: fallback }] : [];
};

const parseConceptNotes = (notes?: string): string[] => {
  return parseConceptNotesEntries(notes).map(
    (entry) => `- ${entry.label}: ${ensureSentence(entry.value)}`,
  );
};

const parseQuestionList = (keyQuestions?: string): string[] => {
  if (!keyQuestions) return [];
  return keyQuestions
    .split("?")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.endsWith("?") ? entry : `${entry}?`))
    .filter(Boolean);
};

const selectNoteValue = (
  notes: HelixAskConceptNoteEntry[],
  matcher: (label: string) => boolean,
): string | null => {
  const found = notes.find((entry) => matcher(entry.label.toLowerCase()));
  return found ? found.value.trim() : null;
};

const sentenceNormalize = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.;]+$/g, "");

const maybeInfinitive = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const match = trimmed.match(/^([A-Za-z]+)/);
  if (!match) return trimmed;
  const first = match[1];
  if (!first || !first.length) return trimmed;
  if (first.length <= 2 || /ing$/i.test(first)) return trimmed;
  if (!first.endsWith("s")) return trimmed;
  const infinitive = first.slice(0, -1);
  return `${infinitive}${trimmed.slice(first.length)}`;
};

const buildConversationalConceptIntro = (card: HelixAskConceptCard): string => {
  const label = card.label ? unquoteValue(card.label) : card.id;
  const definitionText = card.definition.trim();
  if (!definitionText) return "";
  const definitionStart = definitionText.toLowerCase();
  const plainStart = definitionStart.startsWith(label.toLowerCase())
    ? definitionText
    : `In plain language, ${label} means ${definitionText.charAt(0).toLowerCase() + definitionText.slice(1)}`;
  const definitionSentence = ensureSentence(plainStart);

  const questions = parseQuestionList(card.keyQuestions);
  const noteEntries = parseConceptNotesEntries(card.notes);
  const societalEffect = selectNoteValue(
    noteEntries,
    (labelValue) => labelValue.includes("societal effect"),
  );
  const practicalQuestions =
    questions.length > 0
      ? `In practice, it is easiest to test by asking:
- ${questions.join("\n- ")}`
      : "";
  const practicalImpact = societalEffect
    ? ensureSentence(
        `In civic terms, this tends to ${sentenceNormalize(maybeInfinitive(societalEffect))}`,
      )
    : "";
  const scopeLine = card.scope ? `This is in the ${unquoteValue(card.scope)} scope.` : "";

  return [definitionSentence, practicalQuestions, practicalImpact, scopeLine]
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

const buildConceptTechnicalLines = (card: HelixAskConceptCard): string[] => {
  const lines: string[] = [];
  if (card.definition) {
    lines.push(`- Definition: ${ensureSentence(card.definition)}`);
  }
  if (card.keyQuestions) {
    lines.push(`- Key questions: ${card.keyQuestions}`);
  }
  for (const noteLine of parseConceptNotes(card.notes)) {
    lines.push(noteLine);
  }
  if (card.scope) {
    lines.push(`- Scope: ${unquoteValue(card.scope)}`);
  }
  return lines;
};

export function renderConceptAnswer(match: HelixAskConceptMatch | null): string {
  if (!match) return "";
  const { card } = match;
  const intro = buildConversationalConceptIntro(card);
  const technicalLines = buildConceptTechnicalLines(card);
  const technical = technicalLines.length > 0 ? `Technical notes:\n${technicalLines.join("\n")}` : "";
  return [intro, technical].filter(Boolean).join("\n\n");
}

export function renderConceptDefinition(match: HelixAskConceptMatch | null): string {
  if (!match) return "";
  const { card } = match;
  const core: string[] = [];
  if (card.definition) {
    core.push(ensureSentence(card.definition));
  }
  if (card.keyQuestions) {
    core.push(ensureSentence(`Key questions include: ${card.keyQuestions}`));
  }
  const paragraph1 = core.join(" ").trim();

  const details: string[] = [];
  if (card.notes) {
    details.push(ensureSentence(card.notes));
  }
  if (card.scope) {
    details.push(ensureSentence(`Scope: ${card.scope}`));
  }
  const paragraph2 = details.join(" ").trim();

  return [paragraph1, paragraph2].filter(Boolean).join("\n\n");
}

export function listConceptCards(): HelixAskConceptCard[] {
  return loadConceptCards().slice();
}
