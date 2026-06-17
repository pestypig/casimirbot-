export const DOCUMENT_TRANSLATION_SCHEMA = "casimir.document_translation.v1" as const;
export const DOCUMENT_TRANSLATION_GLOSSARY_VERSION = "casimir-docs-glossary-haw-seed-1" as const;
export const DOCUMENT_TRANSLATION_MODEL_POLICY_VERSION = "docs-markdown-preserve-v1" as const;

export type DocumentTranslationStatus =
  | "generated_draft"
  | "generated_checked"
  | "needs_review"
  | "approved"
  | "stale"
  | "failed";

export type DocumentTranslationQualityCheckName =
  | "unit_id_parity"
  | "protected_span_parity"
  | "code_fence_parity"
  | "link_target_parity"
  | "math_span_parity";

export type DocumentTranslationQualityCheck = {
  name: DocumentTranslationQualityCheckName;
  status: "pass" | "warn" | "fail";
  detail?: string;
};

export type DocumentTranslationUnitKind =
  | "heading"
  | "paragraph"
  | "list_item"
  | "table_row"
  | "protected";

export type DocumentTranslationUnit = {
  unit_id: string;
  kind: DocumentTranslationUnitKind;
  source_markdown: string;
  translatable: boolean;
  protected_spans: string[];
};

export type DocumentTranslationResult = {
  schema: typeof DOCUMENT_TRANSLATION_SCHEMA;
  doc_path: string;
  locale: string;
  source_hash: string;
  glossary_version: string;
  model_policy_version: string;
  status: DocumentTranslationStatus;
  title?: string;
  translated_markdown: string;
  units: DocumentTranslationUnit[];
  checks: DocumentTranslationQualityCheck[];
  warnings: string[];
  provider?: string;
  model?: string;
  created_at: string;
  updated_at: string;
};

export type DocumentTranslationRequestPayload = {
  doc_path: string;
  locale: string;
  source_markdown: string;
  title?: string;
};

export type DocumentTranslationApiResponse =
  | { ok: true; result: DocumentTranslationResult }
  | { ok: false; error: string; message: string };

const codeFencePattern = /```/g;
const markdownLinkTargetPattern = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const inlineCodePattern = /`[^`\n]+`/g;
const inlineMathPattern = /\\\([^]*?\\\)|\$[^$\n]+\$/g;
const displayMathPattern = /\$\$[^]*?\$\$|\\\[[^]*?\\\]/g;
const urlPattern = /\bhttps?:\/\/[^\s)]+/g;
const apiPathPattern = /\B\/api\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g;
const workspacePathPattern = /\b(?:docs|client|server|shared|scripts|artifacts|public)\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g;

export function hashDocumentSource(markdown: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < markdown.length; i += 1) {
    hash ^= markdown.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function segmentMarkdownForTranslation(markdown: string): DocumentTranslationUnit[] {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const units: DocumentTranslationUnit[] = [];
  let paragraph: string[] = [];
  let protectedBuffer: string[] = [];
  let inCodeFence = false;
  let inFrontmatter = lines[0]?.trim() === "---";
  let frontmatterLineCount = 0;
  let inDisplayMath = false;

  const pushUnit = (kind: DocumentTranslationUnitKind, text: string, translatable: boolean) => {
    if (!text) return;
    units.push({
      unit_id: `u${String(units.length + 1).padStart(4, "0")}`,
      kind,
      source_markdown: text,
      translatable,
      protected_spans: collectProtectedSpans(text),
    });
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join("\n");
    pushUnit(classifyTranslatableBlock(text), text, true);
    paragraph = [];
  };

  const flushProtected = () => {
    if (protectedBuffer.length === 0) return;
    pushUnit("protected", protectedBuffer.join("\n"), false);
    protectedBuffer = [];
  };

  const appendProtectedLine = (line: string) => {
    flushParagraph();
    protectedBuffer.push(line);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const opensOrClosesFence = trimmed.startsWith("```");
    if (opensOrClosesFence) {
      appendProtectedLine(line);
      inCodeFence = !inCodeFence;
      if (!inCodeFence) flushProtected();
      continue;
    }
    if (inCodeFence) {
      appendProtectedLine(line);
      continue;
    }
    if (inFrontmatter) {
      appendProtectedLine(line);
      frontmatterLineCount += 1;
      if (frontmatterLineCount > 1 && trimmed === "---") {
        inFrontmatter = false;
        flushProtected();
      }
      continue;
    }
    if (trimmed === "$$" || trimmed.startsWith("\\[") || trimmed.endsWith("\\]")) {
      appendProtectedLine(line);
      if (inDisplayMath) {
        inDisplayMath = false;
        flushProtected();
      } else {
        inDisplayMath = true;
      }
      continue;
    }
    if (inDisplayMath) {
      appendProtectedLine(line);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      appendProtectedLine(line);
      flushProtected();
      continue;
    }
    flushProtected();
    if (/^\s{4,}\S/.test(line) || /^ {0,3}>/.test(line) || /^ {0,3}[-*_]{3,}\s*$/.test(line)) {
      appendProtectedLine(line);
      flushProtected();
      continue;
    }
    if (/^ {0,3}#{1,6}\s+/.test(line) || /^\s*(?:[-*+]|\d+[.)])\s+/.test(line) || /^\s*\|.+\|\s*$/.test(line)) {
      flushParagraph();
      pushUnit(classifyTranslatableBlock(line), line, true);
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushProtected();
  return units;
}

export function composeTranslatedMarkdown(
  units: DocumentTranslationUnit[],
  translationsByUnitId: Record<string, string | undefined>,
): string {
  return units
    .map((unit) => {
      if (!unit.translatable) return unit.source_markdown;
      const translated = translationsByUnitId[unit.unit_id]?.trimEnd();
      return translated || unit.source_markdown;
    })
    .join("\n");
}

export function runDocumentTranslationChecks(
  sourceMarkdown: string,
  sourceUnits: DocumentTranslationUnit[],
  translatedMarkdown: string,
  translationsByUnitId: Record<string, string | undefined>,
): DocumentTranslationQualityCheck[] {
  const missingUnitIds = sourceUnits
    .filter((unit) => unit.translatable)
    .filter((unit) => !translationsByUnitId[unit.unit_id])
    .map((unit) => unit.unit_id);
  const missingProtectedSpans = sourceUnits.flatMap((unit) => {
    if (!unit.translatable) return [];
    const translated = translationsByUnitId[unit.unit_id] ?? "";
    return unit.protected_spans.filter((span) => span && !translated.includes(span));
  });
  const sourceLinkTargets = collectMatches(sourceMarkdown, markdownLinkTargetPattern);
  const translatedLinkTargets = collectMatches(translatedMarkdown, markdownLinkTargetPattern);
  const sourceMath = collectMatches(sourceMarkdown, inlineMathPattern).concat(
    collectMatches(sourceMarkdown, displayMathPattern),
  );
  const translatedMath = collectMatches(translatedMarkdown, inlineMathPattern).concat(
    collectMatches(translatedMarkdown, displayMathPattern),
  );

  return [
    {
      name: "unit_id_parity",
      status: missingUnitIds.length === 0 ? "pass" : "fail",
      detail: missingUnitIds.length ? `Missing translated units: ${missingUnitIds.join(", ")}` : undefined,
    },
    {
      name: "protected_span_parity",
      status: missingProtectedSpans.length === 0 ? "pass" : "fail",
      detail: missingProtectedSpans.length
        ? `Missing protected spans: ${Array.from(new Set(missingProtectedSpans)).slice(0, 8).join(", ")}`
        : undefined,
    },
    {
      name: "code_fence_parity",
      status: countMatches(sourceMarkdown, codeFencePattern) === countMatches(translatedMarkdown, codeFencePattern)
        ? "pass"
        : "fail",
    },
    {
      name: "link_target_parity",
      status: sameMultiset(sourceLinkTargets, translatedLinkTargets) ? "pass" : "fail",
      detail: sameMultiset(sourceLinkTargets, translatedLinkTargets) ? undefined : "Markdown link targets changed.",
    },
    {
      name: "math_span_parity",
      status: sameMultiset(sourceMath, translatedMath) ? "pass" : "fail",
      detail: sameMultiset(sourceMath, translatedMath) ? undefined : "Inline or display math changed.",
    },
  ];
}

export function hasFailingDocumentTranslationChecks(checks: DocumentTranslationQualityCheck[]): boolean {
  return checks.some((check) => check.status === "fail");
}

function classifyTranslatableBlock(text: string): DocumentTranslationUnitKind {
  if (/^ {0,3}#{1,6}\s+/.test(text)) return "heading";
  if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(text)) return "list_item";
  if (/^\s*\|.+\|\s*$/.test(text)) return "table_row";
  return "paragraph";
}

function collectProtectedSpans(text: string): string[] {
  return Array.from(
    new Set(
      [
        ...collectMatches(text, inlineCodePattern),
        ...collectMatches(text, inlineMathPattern),
        ...collectMatches(text, displayMathPattern),
        ...collectMatches(text, markdownLinkTargetPattern),
        ...collectMatches(text, urlPattern),
        ...collectMatches(text, apiPathPattern),
        ...collectMatches(text, workspacePathPattern),
      ].filter(Boolean),
    ),
  );
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    matches.push((match[1] ?? match[0]).replace(/[.,;:!?]+$/, ""));
  }
  pattern.lastIndex = 0;
  return matches;
}

function countMatches(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  const count = Array.from(text.matchAll(pattern)).length;
  pattern.lastIndex = 0;
  return count;
}

function sameMultiset(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const counts = new Map<string, number>();
  for (const value of left) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  for (const value of right) {
    const next = (counts.get(value) ?? 0) - 1;
    if (next < 0) return false;
    if (next === 0) {
      counts.delete(value);
    } else {
      counts.set(value, next);
    }
  }
  return counts.size === 0;
}
