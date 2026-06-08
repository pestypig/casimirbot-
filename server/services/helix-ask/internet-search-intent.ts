import type {
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";

export type HelixInternetSearchIntent = {
  searchRequested: boolean;
  strength: HelixAskSourceTargetStrength;
  explicitCues: string[];
  reasons: string[];
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  normalizedQuery: string;
  domains: string[];
  recencyDays: number | null;
};

const hasLocalWorkspaceScopeCue = (promptText: string): boolean =>
  /\b(?:docs?\s+viewer|documents?\s+viewer|current\s+(?:doc|document)|active\s+(?:doc|document)|repo|repository|codebase|working\s+tree|workspace|local\s+files?|our\s+docs?|from\s+(?:our|local|the)\s+docs?)\b/i.test(promptText);

const hasScholarlyScopeCue = (promptText: string): boolean =>
  /\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|journal|peer[-\s]?reviewed|citations?|references?|bibliograph(?:y|ies)|research\s+papers?|scholarly\s+(?:papers?|articles?|sources?))\b/i.test(promptText);

const hasSearchActionCue = (promptText: string): boolean =>
  /\b(?:search|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|search\s+online|verify|source|sources)\b/i.test(promptText);

const hasCurrentWebCue = (promptText: string): boolean =>
  /\b(?:latest|current|today|yesterday|recent|newest|news|breaking|updated|right\s+now|this\s+week|this\s+month|online|internet|web\s+(?:results?|sources?|pages?)|google(?:\s+custom\s+search)?|search\s+engine)\b/i.test(promptText);

const hasExplicitWebProviderCue = (promptText: string): boolean =>
  /\b(?:google\s+(?:custom\s+search|cse|search)|tavily|exa|web\s+api|internet\s+api)\b/i.test(promptText);

const domainPattern = /\b(?:site:)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)\b/gi;

const extractDomains = (promptText: string): string[] => {
  const domains: string[] = [];
  for (const match of promptText.matchAll(domainPattern)) {
    const domain = match[1]?.toLowerCase();
    if (!domain) continue;
    if (/^(?:doi\.org|arxiv\.org|openalex\.org|semanticscholar\.org|crossref\.org)$/i.test(domain)) continue;
    domains.push(domain);
  }
  return Array.from(new Set(domains)).slice(0, 8);
};

const extractRecencyDays = (promptText: string): number | null => {
  if (/\btoday|right\s+now|breaking\b/i.test(promptText)) return 1;
  if (/\byesterday|last\s+24\s+hours?\b/i.test(promptText)) return 2;
  if (/\bthis\s+week|last\s+week|past\s+week|last\s+7\s+days?\b/i.test(promptText)) return 7;
  if (/\bthis\s+month|last\s+month|past\s+month|last\s+30\s+days?\b/i.test(promptText)) return 30;
  if (/\brecent|latest|newest|updated\b/i.test(promptText)) return 30;
  return null;
};

const isExplanatoryOnlyPrompt = (promptText: string): boolean =>
  /\b(?:what\s+is|what\s+are|explain|describe|tell\s+me)\b[\s\S]{0,120}\b(?:google|search\s+engine|internet\s+search|web\s+search)\b/i.test(promptText) &&
  !hasExplicitWebProviderCue(promptText) &&
  !/\b(?:use|call|run|try|search|find|look\s*up|google)\b/i.test(promptText);

export const detectInternetSearchIntent = (promptText: string): HelixInternetSearchIntent => {
  const prompt = promptText.trim();
  const explicitProviderCue = hasExplicitWebProviderCue(prompt);
  const searchAction = hasSearchActionCue(prompt);
  const currentWebCue = hasCurrentWebCue(prompt);
  const localScope = hasLocalWorkspaceScopeCue(prompt);
  const scholarlyScope = hasScholarlyScopeCue(prompt);
  const domains = extractDomains(prompt);
  const recencyDays = extractRecencyDays(prompt);
  const searchRequested =
    !isExplanatoryOnlyPrompt(prompt) &&
    !scholarlyScope &&
    (
      explicitProviderCue ||
      (searchAction && currentWebCue) ||
      /\b(?:search\s+(?:the\s+)?(?:web|internet)|look\s+up\s+online|check\s+online|google\s+it|google\s+search)\b/i.test(prompt) ||
      (domains.length > 0 && searchAction)
    ) &&
    (!localScope || explicitProviderCue || /\b(?:web|internet|online|google)\b/i.test(prompt));
  const explicitCues = [
    explicitProviderCue ? "internet_search_provider" : "",
    searchAction ? "search_action" : "",
    currentWebCue ? "current_or_web_source" : "",
    domains.length > 0 ? "domain_filter" : "",
  ].filter(Boolean);
  return {
    searchRequested,
    strength: explicitProviderCue || /\b(?:search\s+(?:the\s+)?(?:web|internet)|google\s+search|check\s+online)\b/i.test(prompt)
      ? "hard"
      : "soft",
    explicitCues,
    reasons: searchRequested
      ? ["external_internet_search_source_target", ...explicitCues]
      : [],
    requestedOutputs: [
      "web_search_results",
      "web_page_snippets",
      "source_links",
      "typed_failure",
    ],
    normalizedQuery: prompt,
    domains,
    recencyDays,
  };
};
