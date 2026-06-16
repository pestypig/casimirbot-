const DOCS_MD_PATH_RE = /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+\.md\b/gi;

const EXPLICIT_REPO_SCOPE_RE =
  /\b(?:repo|repository|codebase|source\s+code|implementation|where\s+in\s+(?:the\s+)?code|file\s+paths?\s+and\s+lines?|line-backed|line\s+backed|which\s+(?:module|contract|schema|route|endpoint|symbol))\b/i;

const DOC_SUMMARY_RE =
  /\b(?:summari[sz]e|summary|overview|takeaways?|explain|describe|gist|read|document|paper|sections?)\b/i;

const DOC_COMPARE_RE =
  /\b(?:compare|comparison|differences?|different|vs\.?|versus|two-column|table|each\s+say)\b/i;

const DOC_LOCATE_RE =
  /\b(?:find|locate|where|anchors?|sections?|discuss(?:es|ed|ing)?|mention(?:s|ed|ing)?|evidence\s+snippets?)\b/i;

const DOC_SYNTHESIS_RE =
  /\b(?:runbook|playbook|steps?|checklist|testing|patch|give|answer|summari[sz]e|explain|describe)\b/i;

export const DOCS_MD_PATH_CUE_RE =
  /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+\.md\b/i;

export const QUOTED_DOCS_PATH_COMMAND_RE =
  /["'`][^"'`]*(?:open|show|view|pull\s+up|bring\s+up|load|summari[sz]e|read|find|locate)[^"'`]*\/?docs\/[A-Za-z0-9_./-]+\.md[^"'`]*["'`]/i;

export const maskQuotedSegments = (prompt: string): string =>
  prompt.replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, (segment) => " ".repeat(segment.length));

const normalizeDocsPath = (path: string): string => {
  const trimmed = path.trim().replace(/^['"(\s]+/, "").replace(/[),.;:!?'"`]+$/g, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

export function extractUnquotedDocsMarkdownPaths(prompt: string): string[] {
  const unquoted = maskQuotedSegments(prompt);
  return Array.from(unquoted.matchAll(DOCS_MD_PATH_RE))
    .map((match) => normalizeDocsPath(match[0]))
    .filter((path, index, all) => all.indexOf(path) === index);
}

export function hasExplicitRepoCodeScope(prompt: string): boolean {
  return EXPLICIT_REPO_SCOPE_RE.test(prompt);
}

export function isExplicitDocsPathSummaryPrompt(prompt: string): boolean {
  return extractUnquotedDocsMarkdownPaths(prompt).length >= 1 &&
    DOC_SUMMARY_RE.test(prompt) &&
    !hasExplicitRepoCodeScope(prompt);
}

export function isExplicitDocsPathComparePrompt(prompt: string): boolean {
  return extractUnquotedDocsMarkdownPaths(prompt).length >= 2 &&
    DOC_COMPARE_RE.test(prompt) &&
    !hasExplicitRepoCodeScope(prompt);
}

export function isExplicitDocsPathLocatePrompt(prompt: string): boolean {
  return extractUnquotedDocsMarkdownPaths(prompt).length >= 1 &&
    DOC_LOCATE_RE.test(prompt) &&
    !hasExplicitRepoCodeScope(prompt);
}

export function isExplicitDocsPathLocateSynthesisPrompt(prompt: string): boolean {
  return isExplicitDocsPathLocatePrompt(prompt) && DOC_SYNTHESIS_RE.test(prompt);
}

export function isExplicitDocsPathDocumentOperation(prompt: string): boolean {
  return isExplicitDocsPathSummaryPrompt(prompt) ||
    isExplicitDocsPathComparePrompt(prompt) ||
    isExplicitDocsPathLocatePrompt(prompt);
}
