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

const CURRENT_OPEN_DOC_SUMMARY_RE =
  /\b(?:summari[sz]e|explain|describe|give\s+me\s+the\s+gist\s+of)\b[\s\S]{0,120}\b(?:(?:this|that|the)\s+)?(?:(?:currently\s+)?open|current|active)\s+(?:docs?\s+viewer\s+)?(?:doc|document|paper)\b/i;

const CURRENT_OPEN_DOC_VIEWER_RE =
  /\b(?:(?:currently\s+)?open|current|active)\s+(?:doc|document|paper)\b[\s\S]{0,120}\b(?:docs?\s+viewer|viewer)\b/i;

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

export function extractExplicitDocsLocateTerms(prompt: string): string[] {
  const unquoted = maskQuotedSegments(prompt);
  const locateClause = unquoted.match(
    /\b(?:find|locate|search\s+for)\b[\s\S]{0,40}?\b(?:every\s+)?occurrences?\s+of\s+([\s\S]*?)(?=\s*\.\s*(?:for\s+each|return|provide|do\s+not|don't)\b|\s+for\s+each\b|$)/i,
  )?.[1];
  if (!locateClause) return [];

  const terms = locateClause
    .split(/\s*(?:,|\band\b|\bor\b)\s*/i)
    .map((term) => term.trim().replace(/^[`'"“”]+|[`'"“”]+$/g, ""))
    .map((term) => term.replace(/[.;:!?]+$/g, "").trim())
    .filter((term) => term.length > 0 && term.length <= 200);
  return Array.from(new Set(terms)).slice(0, 8);
}

export type ExplicitDocsSectionRequest = {
  heading: string;
  headings: string[];
  contains_terms: string[];
  match_unit: "line" | "sentence" | "paragraph";
};

export function extractExplicitDocsSectionRequest(prompt: string): ExplicitDocsSectionRequest | null {
  const firstHeadingMatch = prompt.match(
    /\bsections?\s+(?:titled\s+)?["'`“”‘’]([^"'`“”‘’\r\n]{1,240})["'`“”‘’]/i,
  );
  const firstHeading = firstHeadingMatch?.[1]?.trim().replace(/[,:;.!?]+$/g, "").trim();
  if (!firstHeading || firstHeadingMatch?.index === undefined) return null;
  const headings = [firstHeading];
  let previousHeadingHadListComma = /,\s*$/.test(firstHeadingMatch[1] ?? "");
  let remainder = prompt.slice(firstHeadingMatch.index + firstHeadingMatch[0].length);
  while (headings.length < 4) {
    const next = remainder.match(previousHeadingHadListComma
      ? /^\s*(?:and\s+)?["'`“”‘’]([^"'`“”‘’\r\n]{1,240})["'`“”‘’]/i
      : /^\s*(?:,|and)\s*["'`“”‘’]([^"'`“”‘’\r\n]{1,240})["'`“”‘’]/i);
    const nextHeading = next?.[1]?.trim().replace(/[,:;.!?]+$/g, "").trim();
    if (!next || !nextHeading) break;
    headings.push(nextHeading);
    previousHeadingHadListComma = /,\s*$/.test(next[1] ?? "");
    remainder = remainder.slice(next[0].length);
  }

  const containsClauseMatches = Array.from(prompt.matchAll(
    /\b(?:source\s+)?(sentences?|lines?|paragraphs?)\s+(?:that\s+)?contain(?:s|ing)?\s+([\s\S]*?)(?=\s+\band\b\s+(?:source\s+)?(?:sentences?|lines?|paragraphs?)\s+(?:that\s+)?contain(?:s|ing)?\b|\s+with\s+(?:complete|full|original|verbatim|line-numbered)\b|,\s*(?:preserv(?:e|ing)|keep(?:ing)?|report(?:ing)?|group(?:ing)?|return(?:ing)?|output(?:ting)?)\b|\.\s+(?=[A-Z])|\s*\.\s*(?:exclude|preserve|return|provide|include|group|output|do\s+not|don't)\b|\s+(?:exclude|preserve|return|provide|include|group|output|do\s+not|don't)\b|$)/gi,
  ));
  const containsClauses = containsClauseMatches.map((match) => match[2] ?? "");
  const containsTerms = containsClauses
    .flatMap((clause) => {
      const quotedTerms = Array.from(clause.matchAll(
        /[`"'“”‘’]([^`"'“”‘’\r\n]{1,200})[`"'“”‘’]/g,
      )).map((match) => match[1] ?? "");
      return quotedTerms.length > 0
        ? quotedTerms
        : clause.split(/\s*(?:,|\band\b|\bor\b)\s*/i);
    })
    .map((term) => term.trim().replace(/^[`'"“”‘’]+|[`'"“”‘’]+$/g, ""))
    .map((term) => term.replace(
      /^(?:the\s+)?(?:(?:exact|literal|case[-\s]?sensitive|lowercase|uppercase)\s+)*(?:term|token)\s+/i,
      "",
    ))
    .map((term) => term.replace(/[.;:!?]+$/g, "").trim())
    .filter((term) => term.length > 0 && term.length <= 200);
  return {
    heading: headings[0],
    headings,
    contains_terms: Array.from(new Set(containsTerms)).slice(0, 8),
    match_unit: containsClauseMatches.some((match) => /^lines?$/i.test(match[1] ?? ""))
      ? "line"
      : containsClauseMatches.some((match) => /^paragraphs?$/i.test(match[1] ?? ""))
        ? "paragraph"
        : "sentence",
  };
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
  if (
    /\bDocument path:\s*\/?docs\/[A-Za-z0-9_./-]+\.md\b/i.test(prompt) &&
    /\bLocate query:\s*["'`]/i.test(prompt) &&
    /^\s*summari[sz]e\b/i.test(prompt)
  ) {
    return false;
  }
  return isExplicitDocsPathLocatePrompt(prompt) && DOC_SYNTHESIS_RE.test(prompt);
}

export function isExplicitDocsPathDocumentOperation(prompt: string): boolean {
  return isExplicitDocsPathSummaryPrompt(prompt) ||
    isExplicitDocsPathComparePrompt(prompt) ||
    isExplicitDocsPathLocatePrompt(prompt);
}

export function isCurrentOpenDocsViewerSummaryPrompt(prompt: string): boolean {
  if (extractUnquotedDocsMarkdownPaths(prompt).length > 0) return false;
  if (hasExplicitRepoCodeScope(prompt)) return false;
  return CURRENT_OPEN_DOC_SUMMARY_RE.test(prompt) || CURRENT_OPEN_DOC_VIEWER_RE.test(prompt);
}
