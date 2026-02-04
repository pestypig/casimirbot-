import * as fs from "node:fs";
import * as path from "node:path";

export type DocSection = {
  heading: string;
  level: number;
  headerPath: string[];
  bodyLines: string[];
  bodyStartLine: number;
};

export type DocSectionIndex = {
  title?: string;
  headings: string[];
  aliases: string[];
  firstSentence?: string;
  sections: DocSection[];
};

const DOC_CODE_FENCE = /^```/;
const DOC_HEADING_RE = /^(#{1,3})\s+(.+)$/;
const DOC_HEADING_MAX_CHARS = 140;
const DOC_HEADINGS_LIMIT = 6;
const DOC_ALIAS_LIMIT = 12;
const DOC_ALIAS_IGNORE = new Set([
  "index",
  "readme",
  "overview",
  "intro",
  "notes",
  "guide",
  "manual",
]);

type DocSectionCacheEntry = {
  mtimeMs: number;
  index: DocSectionIndex;
};

const docSectionCache = new Map<string, DocSectionCacheEntry>();

const normalizeDocText = (value: string): string => {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const deriveAliasFromFilename = (filePath: string): string => {
  const base = path.basename(filePath, path.extname(filePath));
  const trimmed = base.trim();
  if (!trimmed) return "";
  if (DOC_ALIAS_IGNORE.has(trimmed.toLowerCase())) return "";
  const spaced = trimmed.replace(/[_-]+/g, " ").trim();
  return spaced.length >= 3 ? spaced : "";
};

const parseFrontmatter = (
  lines: string[],
): { startIndex: number; title?: string } => {
  if (!lines.length || lines[0]?.trim() !== "---") {
    return { startIndex: 0 };
  }
  let title: string | undefined;
  let index = 1;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const trimmed = line.trim();
    if (trimmed === "---" || trimmed === "...") {
      index += 1;
      break;
    }
    const match = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (!title && (key === "title" || key === "label" || key === "name")) {
      const normalized = normalizeDocText(match[2]);
      if (normalized) title = normalized.slice(0, DOC_HEADING_MAX_CHARS);
    }
  }
  return { startIndex: index, title };
};

const extractFirstSentence = (lines: string[], startIndex: number): string => {
  let inFence = false;
  for (let i = startIndex; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (DOC_CODE_FENCE.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (DOC_HEADING_RE.test(trimmed)) continue;
    const normalized = normalizeDocText(trimmed);
    if (!normalized) continue;
    const sentence = normalized.split(/[.!?]/)[0]?.trim() ?? "";
    if (sentence.length >= 6) {
      return sentence.slice(0, DOC_HEADING_MAX_CHARS);
    }
  }
  return "";
};

const buildHeaderPath = (stack: Array<string | null>, depth: number): string[] =>
  stack.slice(0, depth).filter(Boolean) as string[];

const parseDocSections = (
  lines: string[],
  startIndex: number,
  title?: string,
): { sections: DocSection[]; headings: string[] } => {
  const headings: string[] = [];
  const sections: DocSection[] = [];
  const headerStack: Array<string | null> = [null, null, null];
  let inFence = false;
  let current: DocSection | null = null;

  const finalize = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (let i = startIndex; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (DOC_CODE_FENCE.test(trimmed)) {
      inFence = !inFence;
      if (current) current.bodyLines.push(rawLine);
      continue;
    }
    if (inFence) {
      if (current) current.bodyLines.push(rawLine);
      continue;
    }
    const headingMatch = trimmed.match(DOC_HEADING_RE);
    if (headingMatch) {
      finalize();
      const level = headingMatch[1].length;
      const heading = normalizeDocText(headingMatch[2]).slice(0, DOC_HEADING_MAX_CHARS);
      if (!heading) continue;
      headerStack[level - 1] = heading;
      for (let j = level; j < headerStack.length; j += 1) {
        headerStack[j] = null;
      }
      if (headings.length < DOC_HEADINGS_LIMIT) {
        headings.push(heading);
      }
      current = {
        heading,
        level,
        headerPath: buildHeaderPath(headerStack, level),
        bodyLines: [],
        bodyStartLine: i + 2,
      };
      continue;
    }
    if (!current) continue;
    current.bodyLines.push(rawLine);
  }
  finalize();

  if (sections.length === 0) {
    const bodyLines = lines.slice(startIndex).filter((line) => line.trim().length > 0);
    if (bodyLines.length > 0) {
      const fallbackHeading = title ?? "Overview";
      sections.push({
        heading: fallbackHeading,
        level: 1,
        headerPath: [fallbackHeading],
        bodyLines,
        bodyStartLine: startIndex + 1,
      });
      if (headings.length === 0) headings.push(fallbackHeading);
    }
  }

  return { sections, headings };
};

const buildAliases = (args: {
  title?: string;
  headings: string[];
  firstSentence?: string;
  filePath: string;
}): string[] => {
  const aliases = new Set<string>();
  const fileAlias = deriveAliasFromFilename(args.filePath);
  if (fileAlias) aliases.add(fileAlias);
  if (args.title) aliases.add(args.title);
  args.headings.forEach((heading) => heading && aliases.add(heading));
  if (args.firstSentence) aliases.add(args.firstSentence);
  return Array.from(aliases).slice(0, DOC_ALIAS_LIMIT);
};

export const readDocSectionIndex = (filePath: string): DocSectionIndex => {
  const normalized = filePath.replace(/\\/g, "/");
  const cacheKey = normalized.toLowerCase();
  const fullPath = path.resolve(process.cwd(), normalized);
  let stat: fs.Stats | null = null;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return { headings: [], aliases: [], sections: [] };
  }
  if (stat) {
    const cached = docSectionCache.get(cacheKey);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.index;
    }
  }
  let raw = "";
  try {
    raw = fs.readFileSync(fullPath, "utf8");
  } catch {
    return { headings: [], aliases: [], sections: [] };
  }
  const lines = raw.split(/\r?\n/);
  const { startIndex, title } = parseFrontmatter(lines);
  const { sections, headings } = parseDocSections(lines, startIndex, title);
  const firstSentence = extractFirstSentence(lines, startIndex);
  const index: DocSectionIndex = {
    title,
    headings,
    aliases: buildAliases({ title, headings, firstSentence, filePath }),
    firstSentence,
    sections,
  };
  if (stat) {
    docSectionCache.set(cacheKey, { mtimeMs: stat.mtimeMs, index });
  }
  return index;
};

export const findDocSectionByHeading = (
  index: DocSectionIndex,
  heading: string,
): DocSection | null => {
  const normalized = normalizeDocText(heading).toLowerCase();
  if (!normalized) return null;
  for (const section of index.sections) {
    if (normalizeDocText(section.heading).toLowerCase() === normalized) {
      return section;
    }
  }
  return null;
};

const scoreSectionText = (value: string, tokens: string[], phrases: string[]): number => {
  const lower = value.toLowerCase();
  let score = 0;
  for (const phrase of phrases) {
    if (phrase.length > 3 && lower.includes(phrase)) score += 6;
  }
  for (const token of tokens) {
    if (token.length > 2 && lower.includes(token)) score += 2;
  }
  return score;
};

const findMatchLineIndex = (
  lines: string[],
  tokens: string[],
  phrases: string[],
): number => {
  for (let i = 0; i < lines.length; i += 1) {
    const lower = lines[i]?.toLowerCase() ?? "";
    if (!lower) continue;
    if (phrases.some((phrase) => phrase.length > 3 && lower.includes(phrase))) return i;
    if (tokens.some((token) => token.length > 2 && lower.includes(token))) return i;
  }
  return -1;
};

export const buildDocSectionSnippet = (
  section: DocSection,
  matchLineIndex: number,
  lineWindow = 2,
): { snippet: string; spanStart: number; spanEnd: number } => {
  const lines = section.bodyLines;
  if (!lines.length) {
    const headerPath = section.headerPath.join(" > ") || section.heading;
    return {
      snippet: `Section: ${headerPath}`,
      spanStart: section.bodyStartLine,
      spanEnd: section.bodyStartLine,
    };
  }
  const clampedIndex = matchLineIndex >= 0 ? matchLineIndex : 0;
  const start = Math.max(0, clampedIndex - lineWindow);
  const end = Math.min(lines.length, clampedIndex + lineWindow + 1);
  const spanStart = section.bodyStartLine + start;
  const spanEnd = section.bodyStartLine + end - 1;
  const headerPath = section.headerPath.join(" > ") || section.heading;
  const snippetLines = lines.slice(start, end).map((line) => line.trimEnd());
  const snippet = [`Section: ${headerPath}`, `Span: L${spanStart}-L${spanEnd}`, ...snippetLines]
    .filter(Boolean)
    .join("\n");
  return { snippet, spanStart, spanEnd };
};

export const selectDocSectionMatch = (
  index: DocSectionIndex,
  tokens: string[],
  phrases: string[],
): { section: DocSection | null; score: number; snippet?: string } => {
  let best: { section: DocSection | null; score: number; snippet?: string } = {
    section: null,
    score: 0,
  };
  for (const section of index.sections) {
    const headerText = section.headerPath.join(" ").toLowerCase();
    const bodyText = section.bodyLines.join("\n").toLowerCase();
    const score = scoreSectionText(headerText, tokens, phrases) * 1.5 +
      scoreSectionText(bodyText, tokens, phrases);
    if (score <= 0) continue;
    const matchLineIndex = findMatchLineIndex(section.bodyLines, tokens, phrases);
    const { snippet } = buildDocSectionSnippet(section, matchLineIndex);
    if (score > best.score) {
      best = { section, score, snippet };
    }
  }
  return best;
};
