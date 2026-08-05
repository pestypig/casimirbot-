import { createHash } from "node:crypto";

const QUERY_STOP_WORDS = new Set([
  "about", "according", "answer", "article", "can", "could", "describe",
  "document", "explain", "find", "from", "give", "idea", "main", "paper",
  "please", "research", "say", "show", "source", "study", "summarize", "summary",
  "tell", "that", "the", "their", "this", "using", "what", "where", "which",
  "with", "would",
]);

export type EvidenceTextUnit = {
  text: string;
  section?: string;
  page?: number;
  line_start?: number;
  line_end?: number;
  char_start: number;
  char_end: number;
};

export type SelectedEvidencePassage = EvidenceTextUnit & {
  passage_id: string;
  relevance_score: number;
  matched_terms: string[];
  citation_ref: string;
  citation_label: string;
};

const compactWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const shortHash = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

const queryTerms = (query: string): string[] => Array.from(new Set(
  (query.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [])
    .filter((token) => !QUERY_STOP_WORDS.has(token)),
)).slice(0, 48);

const quotedPhrases = (query: string): string[] => Array.from(new Set(
  Array.from(query.matchAll(/["']([^"'\n]{8,260})["']/g))
    .map((match) => compactWhitespace(match[1]).toLowerCase())
    .filter(Boolean),
)).slice(0, 8);

const sectionPrior = (section: string | undefined): number => {
  if (!section) return 0;
  if (/\babstract\b/i.test(section)) return 0.18;
  if (/\bconclusions?\b/i.test(section)) return 0.16;
  if (/\bdiscussion\b/i.test(section)) return 0.1;
  if (/\bresults?\b/i.test(section)) return 0.08;
  if (/\bintroduction\b/i.test(section)) return 0.06;
  if (/\breferences\b/i.test(section)) return -0.35;
  return 0;
};

const scoreUnit = (unit: EvidenceTextUnit, terms: string[], phrases: string[], summaryIntent: boolean): {
  score: number;
  matchedTerms: string[];
} => {
  const haystack = compactWhitespace(`${unit.section ?? ""} ${unit.text}`).toLowerCase();
  const matchedTerms = terms.filter((term) => haystack.includes(term));
  const phraseHits = phrases.filter((phrase) => haystack.includes(phrase)).length;
  const termCoverage = terms.length > 0 ? matchedTerms.length / Math.sqrt(terms.length) : 0;
  const exactBoost = phraseHits > 0 ? 0.75 + Math.min(0.2, (phraseHits - 1) * 0.1) : 0;
  const summaryBoost = summaryIntent && /\babstract\b/i.test(unit.section ?? "")
    ? 0.65
    : summaryIntent && /\bconclusions?\b/i.test(unit.section ?? "")
      ? 0.3
      : 0;
  const score = Math.max(0, Math.min(1, termCoverage / 2 + exactBoost + sectionPrior(unit.section) + summaryBoost));
  return { score: Number(score.toFixed(3)), matchedTerms };
};

const sentenceSegments = (text: string): Array<{ text: string; start: number; end: number }> => {
  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  return Array.from(segmenter.segment(text))
    .map((segment) => ({
      text: compactWhitespace(segment.segment),
      start: segment.index,
      end: segment.index + segment.segment.length,
    }))
    .filter((segment) => segment.text.length > 0);
};

const headingFromLine = (line: string): string | null => {
  const markdown = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
  if (markdown) return compactWhitespace(markdown[1]);
  const normalized = compactWhitespace(line);
  if (
    normalized.length >= 3 &&
    normalized.length <= 90 &&
    /^(?:abstract|introduction|background|methods?|materials(?: and methods)?|results?|discussion|conclusions?|references|\d+(?:\.\d+)*\s+[A-Z])/i.test(normalized)
  ) return normalized;
  return null;
};

export const buildEvidenceUnitsFromText = (input: {
  text: string;
  page?: number;
}): EvidenceTextUnit[] => {
  const text = input.text.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const units: EvidenceTextUnit[] = [];
  let section: string | undefined;
  let offset = 0;
  let paragraphLines: Array<{ text: string; line: number; start: number; end: number }> = [];

  const flush = () => {
    if (paragraphLines.length === 0) return;
    const paragraph = compactWhitespace(paragraphLines.map((entry) => entry.text).join(" "));
    if (paragraph) {
      const baseStart = paragraphLines[0].start;
      const sentences = sentenceSegments(paragraph);
      if (sentences.length === 0) {
        units.push({
          text: paragraph,
          ...(section ? { section } : {}),
          ...(input.page ? { page: input.page } : {}),
          line_start: paragraphLines[0].line,
          line_end: paragraphLines.at(-1)?.line ?? paragraphLines[0].line,
          char_start: baseStart,
          char_end: paragraphLines.at(-1)?.end ?? baseStart + paragraph.length,
        });
      } else {
        for (const sentence of sentences) {
          units.push({
            text: sentence.text,
            ...(section ? { section } : {}),
            ...(input.page ? { page: input.page } : {}),
            line_start: paragraphLines[0].line,
            line_end: paragraphLines.at(-1)?.line ?? paragraphLines[0].line,
            char_start: baseStart + sentence.start,
            char_end: baseStart + sentence.end,
          });
        }
      }
    }
    paragraphLines = [];
  };

  lines.forEach((line, index) => {
    const lineStart = offset;
    const lineEnd = lineStart + line.length;
    offset = lineEnd + 1;
    const heading = headingFromLine(line);
    if (heading) {
      flush();
      section = heading;
      return;
    }
    const inlineHeading = line.match(/^\s*(Abstract|Introduction|Background|Methods?|Results?|Discussion|Conclusions?)\.?\s+(.+)$/i);
    const content = inlineHeading?.[2] ?? line;
    if (inlineHeading) {
      flush();
      section = inlineHeading[1];
    }
    if (!content.trim()) {
      flush();
      return;
    }
    paragraphLines.push({ text: content, line: index + 1, start: lineStart, end: lineEnd });
  });
  flush();
  return units;
};

const overlapRatio = (left: SelectedEvidencePassage, right: EvidenceTextUnit): number => {
  if (left.page !== right.page || left.line_start !== right.line_start) return 0;
  const overlap = Math.max(0, Math.min(left.char_end, right.char_end) - Math.max(left.char_start, right.char_start));
  const smaller = Math.max(1, Math.min(left.char_end - left.char_start, right.char_end - right.char_start));
  return overlap / smaller;
};

const locator = (unit: EvidenceTextUnit): string => {
  if (typeof unit.page === "number") return `page=${unit.page}&char=${unit.char_start}-${unit.char_end}`;
  if (typeof unit.line_start === "number") return `line=${unit.line_start}-${unit.line_end ?? unit.line_start}`;
  return `char=${unit.char_start}-${unit.char_end}`;
};

const citationLabel = (input: { title: string; unit: EvidenceTextUnit }): string => {
  const parts = [input.title];
  if (typeof input.unit.page === "number") parts.push(`p. ${input.unit.page}`);
  else if (typeof input.unit.line_start === "number") {
    const end = input.unit.line_end ?? input.unit.line_start;
    parts.push(end === input.unit.line_start ? `line ${end}` : `lines ${input.unit.line_start}-${end}`);
  }
  if (input.unit.section) parts.push(input.unit.section);
  return parts.join(", ");
};

export const selectEvidencePassages = (input: {
  units: EvidenceTextUnit[];
  query: string;
  source_ref: string;
  title: string;
  max_passages?: number;
  max_chars?: number;
}): SelectedEvidencePassage[] => {
  const maxPassages = Math.max(1, Math.min(16, input.max_passages ?? 8));
  const maxChars = Math.max(240, Math.min(2400, input.max_chars ?? 1200));
  const terms = queryTerms(input.query);
  const phrases = quotedPhrases(input.query);
  const summaryIntent = /\b(?:about|explain|main idea|overview|summar(?:y|ize))\b/i.test(input.query);
  const scored = input.units.map((unit, index) => ({ unit, index, ...scoreUnit(unit, terms, phrases, summaryIntent) }));
  const ranked = scored.sort((left, right) =>
    right.score - left.score ||
    (left.unit.page ?? 0) - (right.unit.page ?? 0) ||
    left.unit.char_start - right.unit.char_start,
  );
  const selected: SelectedEvidencePassage[] = [];

  for (const candidate of ranked) {
    if (selected.length >= maxPassages) break;
    if (selected.some((entry) => overlapRatio(entry, candidate.unit) > 0.65)) continue;
    const neighbors = scored
      .filter((entry) =>
        entry.unit.page === candidate.unit.page &&
        entry.unit.section === candidate.unit.section &&
        Math.abs(entry.index - candidate.index) <= 2,
      )
      .sort((left, right) => left.index - right.index);
    const bounded: typeof neighbors = [];
    let charCount = 0;
    for (const neighbor of neighbors) {
      const nextLength = neighbor.unit.text.length + (bounded.length ? 1 : 0);
      if (bounded.length > 0 && charCount + nextLength > maxChars) continue;
      bounded.push(neighbor);
      charCount += nextLength;
    }
    const included = bounded.length ? bounded : [candidate];
    const unit: EvidenceTextUnit = {
      text: included.map((entry) => entry.unit.text).join(" "),
      ...(candidate.unit.section ? { section: candidate.unit.section } : {}),
      ...(candidate.unit.page ? { page: candidate.unit.page } : {}),
      line_start: Math.min(...included.map((entry) => entry.unit.line_start ?? Number.MAX_SAFE_INTEGER)),
      line_end: Math.max(...included.map((entry) => entry.unit.line_end ?? 0)),
      char_start: Math.min(...included.map((entry) => entry.unit.char_start)),
      char_end: Math.max(...included.map((entry) => entry.unit.char_end)),
    };
    if (unit.line_start === Number.MAX_SAFE_INTEGER) delete unit.line_start;
    if (unit.line_end === 0) delete unit.line_end;
    const ref = `${input.source_ref}${input.source_ref.includes("#") ? "&" : "#"}${locator(unit)}`;
    selected.push({
      ...unit,
      passage_id: `evidence-passage:${shortHash(`${ref}:${unit.text}`)}`,
      relevance_score: candidate.score,
      matched_terms: candidate.matchedTerms,
      citation_ref: ref,
      citation_label: citationLabel({ title: input.title, unit }),
    });
  }
  return selected;
};
