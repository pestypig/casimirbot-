import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";

type ComposeArgs = {
  goal: string;
  summary?: string;
  knowledgeContext?: KnowledgeProjectExport[];
  maxSnippets?: number;
  maxChars?: number;
  heading?: string;
};

type CandidateSnippet = {
  citation: string;
  citationId: string;
  preview: string;
  score: number;
};

const NON_WORD = /[^\p{Letter}\p{Number}]+/gu;
const DEFAULT_MAX_SNIPPETS = 4;
const DEFAULT_MAX_CHARS = 1600;
const PREVIEW_FALLBACK = "Attachment available (no preview).";
const INLINE_DECODE_LIMIT = 2000;
const PREVIEW_CLIP = 420;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";

const tokenize = (value: string): string[] =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(NON_WORD, " ")
    .split(/\s+/)
    .filter(Boolean);

const decodeBase64Snippet = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    return Buffer.from(value, "base64").toString("utf8").slice(0, INLINE_DECODE_LIMIT).trim();
  } catch {
    return undefined;
  }
};

const clipPreview = (value?: string): string => {
  if (!value) return PREVIEW_FALLBACK;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return PREVIEW_FALLBACK;
  }
  if (normalized.length <= PREVIEW_CLIP) {
    return normalized;
  }
  return `${normalized.slice(0, PREVIEW_CLIP)}…`;
};

const buildSnippet = (file: KnowledgeFileAttachment): string => {
  if (file.preview?.trim()) {
    return clipPreview(file.preview);
  }
  const inline = decodeBase64Snippet(file.contentBase64);
  if (inline) {
    return clipPreview(inline);
  }
  return PREVIEW_FALLBACK;
};

const computeScore = (queryTokens: Set<string>, snippetTokens: string[], kind?: KnowledgeFileAttachment["kind"]): number => {
  if (queryTokens.size === 0) {
    return kind === "text" ? 0.15 : 0.1;
  }
  if (snippetTokens.length === 0) {
    return 0.05;
  }
  let hits = 0;
  for (const token of snippetTokens) {
    if (queryTokens.has(token)) {
      hits += 1;
    }
  }
  const matchScore = hits > 0 ? hits / queryTokens.size : 0;
  const kindBonus = kind === "text" ? 0.1 : kind === "code" ? 0.08 : 0;
  return matchScore + kindBonus;
};

export type KnowledgeAppendix = {
  text: string;
  citations: string[];
};

export function composeKnowledgeAppendix({
  goal,
  summary,
  knowledgeContext,
  maxChars = DEFAULT_MAX_CHARS,
  maxSnippets = DEFAULT_MAX_SNIPPETS,
  heading = "Knowledge attachments",
}: ComposeArgs): KnowledgeAppendix {
  if (!knowledgeContext || knowledgeContext.length === 0) {
    return { text: "", citations: [] };
  }

  const queryTokens = new Set(tokenize([goal ?? "", summary ?? ""].join(" ").trim()));
  const candidates: CandidateSnippet[] = [];

  for (const project of knowledgeContext) {
    const slugSource = project.project.hashSlug || project.project.id || project.project.name;
    const projectSlug = slugify(slugSource || "project");
    for (const file of project.files) {
      const preview = buildSnippet(file);
      const snippetTokens = tokenize(`${file.name ?? ""} ${preview}`);
      const score = computeScore(queryTokens, snippetTokens, file.kind);
      const citationId = `${projectSlug}/${file.name}`.toLowerCase();
      candidates.push({
        citation: `[project:${projectSlug}/file:${file.name}]`,
        citationId,
        preview,
        score,
      });
    }
  }

  if (candidates.length === 0) {
    return { text: "", citations: [] };
  }

  candidates.sort((a, b) => b.score - a.score);

  const picked: CandidateSnippet[] = [];
  const seenIds = new Set<string>();
  for (const candidate of candidates) {
    if (picked.length >= maxSnippets) break;
    if (seenIds.has(candidate.citationId)) continue;
    picked.push(candidate);
    seenIds.add(candidate.citationId);
  }

  if (picked.length === 0) {
    return { text: "", citations: [] };
  }

  const lines: string[] = [`${heading}:`];
  const citations: string[] = [];
  let remaining = Math.max(maxChars, 200);

  for (let index = 0; index < picked.length; index += 1) {
    const candidate = picked[index];
    const line = `${index + 1}. ${candidate.citation} — ${candidate.preview}`;
    const projectedLength = lines.join("\n").length + line.length + 1;
    if (projectedLength > remaining) {
      break;
    }
    lines.push(line);
    citations.push(candidate.citationId);
  }

  if (lines.length <= 1) {
    return { text: "", citations: [] };
  }

  return {
    text: lines.join("\n"),
    citations,
  };
}
