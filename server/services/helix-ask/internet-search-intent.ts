import type {
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";
import type { ToolFamily } from "./tool-family-contract";
import { detectContextualToolAdmissionSuppression } from "./contextual-tool-admission";

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

export type ToolUseRestatementV1 = {
  artifactId: "tool_use_restatement";
  schemaVersion: "helix.tool_use_restatement.v1";
  userGoal: string;
  freshnessRequired: boolean;
  currentAffairsRequired: boolean;
  requiredToolFamilies: ToolFamily[];
  minimumEvidencePlan?: {
    minSearches: number;
    minIndependentSources: number;
    recencyWindow?: string;
    citationRequired: boolean;
  };
  negativeConstraints: string[];
  quotedOrContextualMentions: string[];
  notTerminal: true;
  assistant_answer: false;
  raw_content_included: false;
};

const hasLocalWorkspaceScopeCue = (promptText: string): boolean =>
  /\b(?:docs?\s+viewer|documents?\s+viewer|current\s+(?:doc|document)|active\s+(?:doc|document)|repo|repository|codebase|working\s+tree|workspace|local\s+files?|our\s+docs?|from\s+(?:our|local|the)\s+docs?)\b/i.test(promptText);

const hasLocalObservationScopeCue = (promptText: string): boolean =>
  /\b(?:screen\s+capture|screenshot|screen|visual|frame|capture|camera|live\s+(?:source|environment|answer|card|pipeline)|current\s+(?:screen|visual|frame|capture|live\s+source|live\s+environment)|what\s+is\s+happening\s+right\s+now\s+in\s+the\s+screen)\b/i.test(promptText);

const hasScholarlyScopeCue = (promptText: string): boolean =>
  /\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|journal|peer[-\s]?reviewed|citations?|references?|bibliograph(?:y|ies)|research\s+papers?|scholarly\s+(?:papers?|articles?|sources?))\b/i.test(promptText);

const hasSearchActionCue = (promptText: string): boolean =>
  /\b(?:search|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|search\s+online|verify|source|sources)\b/i.test(promptText);

const hasCurrentWebCue = (promptText: string): boolean =>
  /\b(?:latest|current|today|yesterday|recent|newest|news|breaking|updated|right\s+now|this\s+week|this\s+month|online|internet|web\s+(?:results?|sources?|pages?)|google(?:\s+custom\s+search)?|search\s+engine)\b/i.test(promptText);

const hasTimeSensitiveFactCue = (promptText: string): boolean =>
  /\b(?:latest|current|today|yesterday|recent|newest|news|breaking|updated|right\s+now|this\s+week|this\s+month|ongoing|election|elections|law|laws|regulation|regulations|court\s+ruling|public\s+figure|ceo|president|prime\s+minister|minister|company\s+status|product\s+status|prices?|schedules?|release\s+date|earnings|stock|exchange\s+rate|inflation|sanctions?)\b/i.test(promptText);

const hasCurrentAffairsDomainCue = (promptText: string): boolean =>
  /\b(?:ongoing\s+(?:border\s+)?(?:conflict|war|crisis)|ceasefire|reconstruction|battlefield|infrastructure\s+stability|resource[-\s]?capacity|decision\s+makers?|countries?\s+can\s+see|economic\s+(?:max\s+)?capacity|possible\s+reserves?|current\s+affairs?|geopolitics?|sanctions?|trade\s+bloc|supply\s+chain\s+shock|public\s+policy|election|elections|new\s+law|recent\s+law|current\s+law)\b/i.test(promptText);

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

const recencyWindowFor = (days: number | null): string | undefined => {
  if (days === null) return undefined;
  if (days <= 1) return "24h";
  if (days <= 2) return "48h";
  if (days <= 7) return "7d";
  return "30d";
};

const isExplanatoryOnlyPrompt = (promptText: string): boolean =>
  /\b(?:what\s+is|what\s+are|explain|describe|tell\s+me)\b[\s\S]{0,120}\b(?:google|search\s+engine|internet\s+search|web\s+search)\b/i.test(promptText) &&
  !hasExplicitWebProviderCue(promptText) &&
  !/\b(?:use|call|run|try|search|find|look\s*up|google)\b/i.test(promptText);

const isSuppliedTextOnlyTask = (promptText: string): boolean =>
  /\b(?:just\s+)?(?:rewrite|reword|copyedit|summari[sz]e|quote|format|polish)\b[\s\S]{0,180}\b(?:this|the)\s+(?:paragraph|passage|prompt|text|quote)\b/i.test(promptText) &&
  !/\b(?:is\s+this\s+true|evaluate|assess|fact[-\s]?check|verify|source|sources|cite|citations?|what\s+changed|what\s+happened|latest|current\s+status)\b/i.test(promptText);

const hasExplicitNoBrowseConstraint = (promptText: string): boolean =>
  /\b(?:do\s+not|don't|dont|never|without|no)\b[\s\S]{0,120}\b(?:browse|browsing|search(?:ing)?|web|internet|look\s*up|lookup|google|bing|check\s+online|verify\s+online)\b/i.test(promptText);

const extractNegativeConstraints = (promptText: string): string[] => {
  const constraints: string[] = [];
  const noBrowse = promptText.match(/\b(?:do\s+not|don't|dont|never|without|no)\b[\s\S]{0,120}\b(?:browse|browsing|search(?:ing)?|web|internet|look\s*up|lookup|google|bing|check\s+online|verify\s+online)\b/i)?.[0];
  if (noBrowse) constraints.push(noBrowse.trim());
  const rewriteOnly = promptText.match(/\b(?:just\s+)?(?:rewrite|reword|copyedit|summari[sz]e|quote|format|polish)\b[\s\S]{0,180}\b(?:this|the)\s+(?:paragraph|passage|prompt|text|quote)\b/i)?.[0];
  if (rewriteOnly && isSuppliedTextOnlyTask(promptText)) constraints.push("supplied_text_only_task");
  const contextualSuppression = detectContextualToolAdmissionSuppression(promptText);
  if (contextualSuppression) constraints.push(contextualSuppression.suppression_reason);
  return Array.from(new Set(constraints));
};

const extractQuotedOrContextualMentions = (promptText: string): string[] => {
  const mentions: string[] = [];
  for (const match of promptText.matchAll(/["'`][^"'`]*(?:search|latest|current|recent|breaking|browse|web|internet)[^"'`]*["'`]/gi)) {
    if (match[0]) mentions.push(match[0]);
  }
  const screenVisible = promptText.match(/\b(?:phrase|text|screen|page|button|label|headline)\b[\s\S]{0,80}(?:says|shows|appears|reads|contains)\b[\s\S]{0,140}(?:latest|current|recent|breaking|search|browse|web|internet)/i)?.[0];
  if (screenVisible) mentions.push(screenVisible.trim());
  const contextualSuppression = detectContextualToolAdmissionSuppression(promptText);
  if (contextualSuppression) mentions.push(contextualSuppression.text);
  return Array.from(new Set(mentions.filter(Boolean)));
};

const isComplexCurrentAffairsAnalysis = (promptText: string): boolean =>
  hasCurrentAffairsDomainCue(promptText) &&
  (
    promptText.length > 180 ||
    /\b(?:analysis|analyze|assess|evaluate|true|prediction|decision\s+makers?|should\s+we|would\s+it\s+matter|factor|proof|capacity|resources?|infrastructure|trade[-\s]?off|margin|marginal|scenario)\b/i.test(promptText)
  );

const isCompactLiveSourceMailboxHandoff = (promptText: string): boolean =>
  ((
    /\bContinuing\s+live[-\s]?source\s+watch\s+job\s+compact\s+Ask\s+handoff\b/i.test(promptText) ||
    /\bUI\s+bridge\s+reason\b[\s\S]{0,120}\bHelix\s+Ask\s+wake\b/i.test(promptText)
  ) &&
  /\bWake\s+request:\s*stage_play_live_source_mail_wake:/i.test(promptText) &&
  /\bProcessed\s+packet:\s*stage_play_processed_mail_packet:/i.test(promptText) &&
  /\blive_env\.record_live_source_mail_decision\b/i.test(promptText)) ||
  (
    /\bReview\s+the\s+latest\s+Stage\s+Play\s+live[-\s]?source\s+mailbox\s+finding\b/i.test(promptText) &&
    /\bMicro[-\s]?reasoner\s+recommendation\s*:\s*(?:request\s+voice\s+callout|record\s+interpretation|request\s+more\s+evidence|request\s+stage\s+play\s+checkpoint)\b/i.test(promptText) &&
    /\bstructured\s+mailbox\s+route\s+metadata\b/i.test(promptText)
  );

export const buildToolUseRestatement = (promptText: string): ToolUseRestatementV1 => {
  const prompt = promptText.trim();
  const compactLiveSourceMailboxHandoff = isCompactLiveSourceMailboxHandoff(prompt);
  const explicitProviderCue = hasExplicitWebProviderCue(prompt);
  const searchAction = hasSearchActionCue(prompt);
  const currentWebCue = hasCurrentWebCue(prompt);
  const timeSensitiveCue = hasTimeSensitiveFactCue(prompt);
  const currentAffairsCue = hasCurrentAffairsDomainCue(prompt);
  const recencyDays = extractRecencyDays(prompt) ?? (currentAffairsCue ? 30 : null);
  const negativeConstraints = extractNegativeConstraints(prompt);
  const quotedOrContextualMentions = extractQuotedOrContextualMentions(prompt);
  const suppressed = compactLiveSourceMailboxHandoff || negativeConstraints.length > 0 || isSuppliedTextOnlyTask(prompt);
  const freshnessRequired = !suppressed && (explicitProviderCue || currentWebCue || timeSensitiveCue || currentAffairsCue);
  const currentAffairsRequired = !suppressed && currentAffairsCue;
  const localSourceScope = hasLocalWorkspaceScopeCue(prompt) || hasLocalObservationScopeCue(prompt);
  const requiresInternet = !suppressed && !localSourceScope && !hasScholarlyScopeCue(prompt) && (
    explicitProviderCue ||
    (searchAction && (currentWebCue || timeSensitiveCue)) ||
    currentAffairsRequired ||
    (timeSensitiveCue && /\b(?:what|why|how|is|are|should|would|does|do|compare|assess|evaluate|true|prediction|status)\b/i.test(prompt))
  );
  const complex = isComplexCurrentAffairsAnalysis(prompt);
  const minimumEvidencePlan = requiresInternet
    ? {
        minSearches: complex ? 2 : 1,
        minIndependentSources: complex || currentAffairsRequired ? 2 : 1,
        ...(recencyWindowFor(recencyDays) ? { recencyWindow: recencyWindowFor(recencyDays) } : {}),
        citationRequired: true,
      }
    : undefined;
  return {
    artifactId: "tool_use_restatement",
    schemaVersion: "helix.tool_use_restatement.v1",
    userGoal: prompt,
    freshnessRequired,
    currentAffairsRequired,
    requiredToolFamilies: requiresInternet ? ["internet_search"] : [],
    ...(minimumEvidencePlan ? { minimumEvidencePlan } : {}),
    negativeConstraints,
    quotedOrContextualMentions,
    notTerminal: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const detectInternetSearchIntent = (promptText: string): HelixInternetSearchIntent => {
  const prompt = promptText.trim();
  const restatement = buildToolUseRestatement(prompt);
  const explicitProviderCue = hasExplicitWebProviderCue(prompt);
  const searchAction = hasSearchActionCue(prompt);
  const currentWebCue = hasCurrentWebCue(prompt);
  const localScope = hasLocalWorkspaceScopeCue(prompt);
  const scholarlyScope = hasScholarlyScopeCue(prompt);
  const domains = extractDomains(prompt);
  const recencyDays = extractRecencyDays(prompt);
  const searchRequested =
    restatement.requiredToolFamilies.includes("internet_search") ||
    !isExplanatoryOnlyPrompt(prompt) &&
    !hasExplicitNoBrowseConstraint(prompt) &&
    !isSuppliedTextOnlyTask(prompt) &&
    !scholarlyScope &&
    (
      explicitProviderCue ||
      (searchAction && currentWebCue) ||
      /\b(?:search\s+(?:the\s+)?(?:web|internet)|look\s+up\s+online|check\s+online|google\s+it|google\s+search)\b/i.test(prompt) ||
      (domains.length > 0 && searchAction)
    ) &&
    (!localScope || explicitProviderCue || /\b(?:web|internet|online|google)\b/i.test(prompt)) &&
    (!hasLocalObservationScopeCue(prompt) || explicitProviderCue || /\b(?:web|internet|online|google)\b/i.test(prompt));
  const explicitCues = [
    explicitProviderCue ? "internet_search_provider" : "",
    searchAction ? "search_action" : "",
    currentWebCue ? "current_or_web_source" : "",
    restatement.freshnessRequired ? "freshness_required" : "",
    restatement.currentAffairsRequired ? "current_affairs_required" : "",
    domains.length > 0 ? "domain_filter" : "",
  ].filter(Boolean);
  return {
    searchRequested,
    strength: explicitProviderCue || restatement.currentAffairsRequired || /\b(?:search\s+(?:the\s+)?(?:web|internet)|google\s+search|check\s+online)\b/i.test(prompt)
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
