import * as fs from "node:fs";
import * as path from "node:path";

export type HelixAskConceptCard = {
  id: string;
  label?: string;
  aliases: string[];
  scope?: string;
  definition: string;
  keyQuestions?: string;
  notes?: string;
  sourcePath: string;
};

export type HelixAskConceptMatch = {
  card: HelixAskConceptCard;
  matchedTerm: string;
  matchedField: "id" | "alias";
};

const CONCEPT_DIR = path.resolve(process.cwd(), "docs", "knowledge");
let conceptCache: HelixAskConceptCard[] | null = null;
let conceptLoadFailed = false;

const normalizeValue = (value: string): string => value.trim();

const parseAliases = (value: string): string[] => {
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
    return paragraphs[0] ?? "";
  };

  for (const line of lines) {
    const trimmed = line.trim();
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

const loadConceptCards = (): HelixAskConceptCard[] => {
  if (conceptLoadFailed) return [];
  if (conceptCache) return conceptCache;
  try {
    if (!fs.existsSync(CONCEPT_DIR)) {
      conceptCache = [];
      return conceptCache;
    }
    const files = collectConceptFiles(CONCEPT_DIR);
    const cards: HelixAskConceptCard[] = [];
    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.trim()) continue;
      const { frontmatter, body } = parseFrontmatter(raw);
      const id = normalizeValue(frontmatter.id ?? path.basename(filePath, ".md"));
      if (!id) continue;
      const label = frontmatter.label ? normalizeValue(frontmatter.label) : undefined;
      const aliases = frontmatter.aliases ? parseAliases(frontmatter.aliases) : [];
      const scope = frontmatter.scope ? normalizeValue(frontmatter.scope) : undefined;
      const parsedBody = parseConceptBody(body);
      if (!parsedBody.definition) continue;
      cards.push({
        id,
        label,
        aliases,
        scope,
        definition: parsedBody.definition,
        keyQuestions: parsedBody.keyQuestions,
        notes: parsedBody.notes,
        sourcePath: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
      });
    }
    conceptCache = cards;
    return cards;
  } catch (error) {
    conceptLoadFailed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[helix-ask] concept registry load failed: ${message}`);
    return [];
  }
};

const normalizeTerm = (value: string): string => value.toLowerCase();

const buildTermRegex = (term: string): RegExp => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
};

export function findConceptMatch(question: string): HelixAskConceptMatch | null {
  const normalized = normalizeTerm(question);
  if (!normalized) return null;
  const cards = loadConceptCards();
  let best: HelixAskConceptMatch | null = null;
  let bestScore = 0;
  for (const card of cards) {
    const idRegex = buildTermRegex(card.id);
    if (idRegex.test(normalized)) {
      const score = card.id.length + 6;
      if (score > bestScore) {
        bestScore = score;
        best = { card, matchedTerm: card.id, matchedField: "id" };
      }
    }
    for (const alias of card.aliases) {
      const aliasRegex = buildTermRegex(alias);
      if (!aliasRegex.test(normalized)) continue;
      const score = alias.length + 3;
      if (score > bestScore) {
        bestScore = score;
        best = { card, matchedTerm: alias, matchedField: "alias" };
      }
    }
  }
  return best;
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

export function renderConceptAnswer(match: HelixAskConceptMatch | null): string {
  if (!match) return "";
  const { card } = match;
  const sentences: string[] = [];
  if (card.definition) {
    sentences.push(ensureSentence(card.definition));
  }
  if (card.keyQuestions) {
    sentences.push(ensureSentence(`Key questions include: ${card.keyQuestions}`));
  }
  const paragraph1 = sentences.join(" ").trim();

  const paragraph2Parts: string[] = [];
  if (card.notes) {
    paragraph2Parts.push(ensureSentence(card.notes));
  }
  if (card.scope) {
    paragraph2Parts.push(ensureSentence(`Scope: ${card.scope}`));
  }
  const paragraph2 = paragraph2Parts.join(" ").trim();

  let inPractice = "";
  if (card.notes) {
    inPractice = ensureSentence(
      "In practice, those standards guide how evidence and justification are weighed in specific contexts.",
    );
  } else if (card.definition) {
    inPractice = ensureSentence(
      "In practice, it focuses on evaluating which beliefs are justified and reliable.",
    );
  }

  return [paragraph1, paragraph2, inPractice].filter(Boolean).join("\n\n");
}

export function listConceptCards(): HelixAskConceptCard[] {
  return loadConceptCards().slice();
}
