import type {
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";
import type {
  HelixScholarlyCapabilityChainPlan,
  HelixScholarlyIntent,
  HelixScholarlyRequestedWorkflow,
  HelixScholarlyResearchIntentMode,
  HelixScholarlySourceTarget,
  HelixScholarlyTerminalEvidenceRequirement,
} from "@shared/helix-scholarly-research-observation";
import { deriveScholarlyEvidenceDemand } from "./scholarly-evidence-demand";

export type HelixScholarlyResearchIntent = {
  researchRequested: boolean;
  mode: HelixScholarlyResearchIntentMode;
  strength: HelixAskSourceTargetStrength;
  explicitCues: string[];
  reasons: string[];
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  doi: string | null;
  arxivId: string | null;
  pmid: string | null;
  pmcid: string | null;
  sourceUrls: string[];
  sourceTargets: HelixScholarlySourceTarget[];
  supportingSourceOnly: boolean;
  fullTextRequested: boolean;
  normalizedQuery: string;
  scholarlyIntent: HelixScholarlyIntent;
  plannedScholarlyCapabilityChain: HelixScholarlyCapabilityChainPlan;
};

export const deriveDirectScholarlyPortfolioQueries = (
  query: string,
  requestedFullTextCount: number,
): string[] => {
  const normalized = query.replace(/\s+/g, " ").trim();
  if (requestedFullTextCount <= 1) return [normalized];
  const threeTopicList = normalized.match(
    /^(.{3,180}?\b(?:about|for|involving|on)\s+)([^,]{3,120}),\s*([^,]{3,120}),\s*(?:and|or)\s+([^,]{3,120})[.?!]?$/i,
  );
  if (!threeTopicList) return [normalized];
  const prefix = threeTopicList[1].trim();
  const topics = threeTopicList.slice(2, 5)
    .map((topic) => topic.replace(/[.?!]+$/g, "").trim())
    .filter(Boolean);
  if (topics.length !== 3) return [normalized];
  return Array.from(new Set(topics.map((topic) => `${prefix} ${topic}`))).slice(0, 3);
};

const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const ARXIV_PATTERN = /\b(?:arxiv(?:\s*:\s*|\s+)|arxiv\.org\/(?:abs|pdf)\/)([A-Za-z-]+\/\d{7}(?:v\d+)?|\d{4}\.\d{4,5}(?:v\d+)?)\b/i;
const BARE_ARXIV_PATTERN = /\b\d{4}\.\d{4,5}(?:v\d+)?\b/i;
const BARE_LEGACY_ARXIV_PATTERN = /\b(?:astro-ph|cond-mat|gr-qc|hep-(?:ex|lat|ph|th)|math-ph|nlin|nucl-(?:ex|th)|physics|quant-ph|q-bio|cs|math|stat)\/\d{7}(?:v\d+)?\b/i;
const SCHOLARLY_SOURCE_URL_PATTERN = /https?:\/\/[^\s"'`<>]+/gi;

const trimIdentifier = (value: string): string =>
  value.trim().replace(/[)\].,;:!?]+$/g, "");

// Tool names and examples are frequently quoted in prompts that explicitly say not to run them.
// Intent cues must be read from the operator text, not from those literal examples.
const stripQuotedPromptSegments = (promptText: string): string =>
  promptText.replace(/"[^"\n]*"|'[^'\n]*'|“[^”\n]*”|‘[^’\n]*’|`[^`\n]*`/g, " ");

const stripNonCurrentScholarlyActionClauses = (promptText: string): string =>
  stripQuotedPromptSegments(promptText)
    .replace(/\b(?:earlier|previously|historically|last\s+(?:time|turn))\b[^.!?;\n]*/gi, " ")
    .replace(/\b(?:later|in\s+the\s+future|eventually|next\s+time)\b[^.!?;\n]*/gi, " ")
    .replace(/\b(?:the\s+(?:screen|ui)\s+(?:says|said|showed)|screen-visible)\b[^.!?;\n]*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const extractScholarlyDoi = (promptText: string): string | null => {
  const match = promptText.match(DOI_PATTERN)?.[0];
  return match ? trimIdentifier(match).toLowerCase() : null;
};

export const extractScholarlyArxivId = (promptText: string): string | null => {
  const explicit = promptText.match(ARXIV_PATTERN)?.[1];
  if (explicit) return trimIdentifier(explicit);
  const hasArxivCue = /\barxiv\b/i.test(promptText);
  const bare = hasArxivCue ? promptText.match(BARE_ARXIV_PATTERN)?.[0] : null;
  if (bare) return trimIdentifier(bare);
  const hasPaperIdentityCue = /\b(?:paper|preprint|article|pdf|full[-\s]?text|scholarly|extract|fetch|retrieve|materialize|import)\b/i.test(promptText);
  const legacyBare = hasPaperIdentityCue ? promptText.match(BARE_LEGACY_ARXIV_PATTERN)?.[0] : null;
  return legacyBare ? trimIdentifier(legacyBare) : null;
};

export const extractScholarlyPmid = (promptText: string): string | null => {
  const explicit = promptText.match(/\bPMID\s*:?\s*(\d{5,10})\b/i)?.[1];
  if (explicit) return explicit;
  return promptText.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pubmed)\/(\d{5,10})\b/i)?.[1] ?? null;
};

export const extractScholarlyPmcid = (promptText: string): string | null => {
  const explicit = promptText.match(/\bPMC\s*:?\s*(\d{4,10})\b/i)?.[1];
  if (explicit) return `PMC${explicit}`;
  const fromUrl = promptText.match(/(?:pmc\.ncbi\.nlm\.nih\.gov\/articles|ncbi\.nlm\.nih\.gov\/pmc\/articles)\/(PMC\d{4,10})\b/i)?.[1];
  return fromUrl?.toUpperCase() ?? null;
};

const canonicalizeScholarlySourceUrl = (sourceUrl: string): string => {
  const trimmed = trimIdentifier(sourceUrl);
  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/;jsessionid=[^/?#]*/gi, "");
    for (const parameter of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_|ref$|source$|campaign$|fbclid$|gclid$)/i.test(parameter)) {
        parsed.searchParams.delete(parameter);
      }
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pmid = extractScholarlyPmid(parsed.toString());
    if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
    const pmcid = extractScholarlyPmcid(parsed.toString());
    if (pmcid) return `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`;
    const doi = host === "doi.org" ? extractScholarlyDoi(parsed.toString()) : null;
    if (doi) return `https://doi.org/${doi}`;
    const arxivId = extractScholarlyArxivId(parsed.toString());
    if (arxivId) {
      return /\/pdf\//i.test(parsed.pathname) || /\.pdf$/i.test(parsed.pathname)
        ? `https://arxiv.org/pdf/${arxivId}.pdf`
        : `https://arxiv.org/abs/${arxivId}`;
    }
    parsed.hostname = host;
    return parsed.toString();
  } catch {
    return trimmed;
  }
};

export const extractScholarlySourceUrls = (promptText: string): string[] =>
  Array.from(new Set(
    Array.from(promptText.matchAll(SCHOLARLY_SOURCE_URL_PATTERN))
      .map((match: RegExpMatchArray) => canonicalizeScholarlySourceUrl(match[0])),
  ));

export const extractScholarlySourceUrl = (promptText: string): string | null => {
  return extractScholarlySourceUrls(promptText)[0] ?? null;
};

export const stripScholarlySourceUrls = (promptText: string): string =>
  promptText.replace(SCHOLARLY_SOURCE_URL_PATTERN, " ").replace(/\s+/g, " ").trim();

const SCHOLARLY_SOURCE_HOST_PATTERN = /(?:^|\.)(?:arxiv\.org|doi\.org|pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov|ingentaconnect\.com|semanticscholar\.org|openalex\.org|crossref\.org|biorxiv\.org|medrxiv\.org|nature\.com|springer\.com|sciencedirect\.com|wiley\.com|tandfonline\.com|frontiersin\.org|mdpi\.com|plos\.org)$/i;

const isLikelyScholarlySourceUrl = (sourceUrl: string): boolean => {
  try {
    const parsed = new URL(sourceUrl);
    return SCHOLARLY_SOURCE_HOST_PATTERN.test(parsed.hostname) ||
      /\.pdf(?:$|[?#])/i.test(sourceUrl) ||
      /\/(?:article|articles|content|paper|papers|publication|publications|journal|journals|doi)\//i.test(parsed.pathname);
  } catch {
    return false;
  }
};

export const extractScholarlySourceTargets = (promptText: string): HelixScholarlySourceTarget[] => {
  const targets: HelixScholarlySourceTarget[] = [];
  const addTarget = (target: HelixScholarlySourceTarget): void => {
    if (!targets.some((entry: HelixScholarlySourceTarget) => entry.canonical_url === target.canonical_url)) targets.push(target);
  };
  for (const sourceUrl of extractScholarlySourceUrls(promptText)) {
    if (!isLikelyScholarlySourceUrl(sourceUrl)) continue;
    const pmid = extractScholarlyPmid(sourceUrl);
    const pmcid = extractScholarlyPmcid(sourceUrl);
    const doi = extractScholarlyDoi(sourceUrl);
    const arxivId = extractScholarlyArxivId(sourceUrl);
    const directPdf = /\.pdf(?:$|[?#])/i.test(sourceUrl);
    const kind: HelixScholarlySourceTarget["kind"] = pmid
      ? "pubmed"
      : pmcid
        ? "pmc"
        : doi && /^https?:\/\/(?:www\.)?doi\.org\//i.test(sourceUrl)
          ? "doi"
          : arxivId
            ? "arxiv"
            : directPdf
              ? "pdf"
              : "publisher";
    addTarget({
      schema: "helix.scholarly_source_target.v1",
      source_url: sourceUrl,
      canonical_url: sourceUrl,
      kind,
      retrieval_strategy: kind === "pubmed" || kind === "doi" || kind === "arxiv"
        ? "metadata_lookup"
        : "direct_full_text",
      ...(doi ? { doi } : {}),
      ...(arxivId ? { arxiv_id: arxivId } : {}),
      ...(pmid ? { pmid } : {}),
      ...(pmcid ? { pmcid } : {}),
    });
  }
  const doi = extractScholarlyDoi(promptText);
  if (doi && !targets.some((entry: HelixScholarlySourceTarget) => entry.doi === doi)) {
    addTarget({
      schema: "helix.scholarly_source_target.v1",
      source_url: `https://doi.org/${doi}`,
      canonical_url: `https://doi.org/${doi}`,
      kind: "doi",
      retrieval_strategy: "metadata_lookup",
      doi,
    });
  }
  const arxivId = extractScholarlyArxivId(promptText);
  if (arxivId && !targets.some((entry: HelixScholarlySourceTarget) => entry.arxiv_id === arxivId)) {
    addTarget({
      schema: "helix.scholarly_source_target.v1",
      source_url: `https://arxiv.org/abs/${arxivId}`,
      canonical_url: `https://arxiv.org/abs/${arxivId}`,
      kind: "arxiv",
      retrieval_strategy: "metadata_lookup",
      arxiv_id: arxivId,
    });
  }
  const pmid = extractScholarlyPmid(promptText);
  if (pmid && !targets.some((entry: HelixScholarlySourceTarget) => entry.pmid === pmid)) {
    addTarget({
      schema: "helix.scholarly_source_target.v1",
      source_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      canonical_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      kind: "pubmed",
      retrieval_strategy: "metadata_lookup",
      pmid,
    });
  }
  const pmcid = extractScholarlyPmcid(promptText);
  if (pmcid && !targets.some((entry: HelixScholarlySourceTarget) => entry.pmcid === pmcid)) {
    addTarget({
      schema: "helix.scholarly_source_target.v1",
      source_url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
      canonical_url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
      kind: "pmc",
      retrieval_strategy: "direct_full_text",
      pmcid,
    });
  }
  return targets.slice(0, 6);
};

export const normalizeScholarlyFullTextSourceUrl = (
  sourceUrl: string | null | undefined,
): string | null => {
  const normalized = sourceUrl ? canonicalizeScholarlySourceUrl(sourceUrl) : null;
  if (!normalized) return null;
  const arxivMatch = normalized.match(
    /^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/([^?#]+?)(?:[?#].*)?$/i,
  );
  if (!arxivMatch) return normalized;
  const arxivId = arxivMatch[1].replace(/\.pdf$/i, "");
  return `https://arxiv.org/pdf/${arxivId}.pdf`;
};

export const hasDirectScholarlyFullTextSourceIntent = (promptText: string): boolean => {
  const sourceUrl = extractScholarlySourceUrl(promptText);
  const hasIdentifier = Boolean(sourceUrl || extractScholarlyDoi(promptText) || extractScholarlyArxivId(promptText));
  const operatorText = stripNonCurrentScholarlyActionClauses(promptText);
  const fullTextActionNegated =
    /\b(?:do\s+not|don't|dont|without|avoid|not\s+asking\s+to)\b[\s\S]{0,100}\b(?:fetch|retrieve|read|open|parse|extract)\b[\s\S]{0,80}\b(?:pdf|full[-\s]?text|paper\s+text|article\s+text|paper|article)\b/i.test(operatorText);
  if (!hasIdentifier || fullTextActionNegated) return false;
  const directFetch =
    /\bscholarly-research\.fetch_full_text\b[^.!?;\n]{0,120}\b(?:directly|from|on)\b/i.test(operatorText) ||
    /\b(?:fetch|retrieve|get|pull|read|parse|extract|materialize|import|save)\b[\s\S]{0,120}\b(?:pdf|full[-\s]?text|paper(?:\s+text)?|article(?:\s+text)?|document)\b/i.test(operatorText) ||
    /\b(?:pdf|full[-\s]?text|paper(?:\s+text)?|article(?:\s+text)?|document)\b[\s\S]{0,120}\b(?:fetch|retrieve|get|pull|read|parse|extract|materialize|import|save)\b/i.test(operatorText) ||
    /\b(?:fetch|retrieve|get|pull|read|parse|extract|materialize|import|save)\s+(?:this|that|it)\b/i.test(operatorText);
  const lookupNegated = /\b(?:do\s+not|don't|dont|without|avoid)\b[^.!?;\n]{0,120}\bscholarly-research\.lookup_papers\b/i.test(operatorText);
  const lookupAbsent = !/\bscholarly-research\.lookup_papers\b/i.test(operatorText);
  return directFetch && (lookupNegated || lookupAbsent);
};

const hasLocalDocsScopeCue = (promptText: string): boolean =>
  /\b(?:docs?\s+viewer|documents?\s+viewer|(?:current(?:ly)?|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)|document\s+path\s*:|locate\s+query\s*:|from\s+(?:our|local|the)\s+docs?)\b/i.test(promptText) ||
  /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+(?:\.mdx?|\.txt)?\b/i.test(promptText);

const hasLocalRepoScopeCue = (promptText: string): boolean =>
  /\b(?:repo[-_. ]code\.(?:search_concept|search)|repo\.search|repo\/code\s+evidence|repository\s+evidence|cite\s+file\s+paths?)\b/i.test(promptText);

const hasLookupActionCue = (promptText: string): boolean =>
  /\b(?:do\s+research|research|find|search|look\s+for|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect)\b/i.test(promptText) ||
  /\b(?:check|cross-?check)\b[^.!?;\n]{0,100}\b(?:scholarly|academic|peer[-\s]?reviewed|literature|citations?|references?|bibliograph(?:y|ies)|research\s+papers?|journal\s+articles?)\b/i.test(promptText);

const SCHOLARLY_PAPER_LOOKUP_ACTION_RE =
  /\b(?:find|search|look\s+for|look\s*up|lookup|locate|retrieve|collect|get|give|show|recommend|suggest|identify)\b/i;

const hasAffirmativeScholarlyPaperLookupCue = (promptText: string): boolean => {
  const unquoted = stripQuotedPromptSegments(promptText);
  return unquoted.split(/[.!?;\n]+/).some((rawClause) => {
    const clause = rawClause.trim();
    if (!clause) return false;
    const topicBoundPaperLookup =
      /\b(?:find|search|look\s+for|look\s*up|lookup|locate|retrieve|collect|get|give|show|recommend|suggest|identify)\b[^.!?;\n]{0,140}\b(?:papers?|articles?|studies|reviews?|literature)\b[^.!?;\n]{0,60}\b(?:about|on|for|supporting|that\s+support|related\s+to|concerning)\b/i.test(clause);
    const qualifiedPaperLookup =
      /\b(?:find|search|look\s+for|look\s*up|lookup|locate|retrieve|collect|get|give|show|recommend|suggest|identify)\b[^.!?;\n]{0,140}\b(?:primary|research|scholarly|academic|scientific|peer[-\s]?reviewed|journal)\b[^.!?;\n]{0,50}\b(?:papers?|articles?|studies|reviews?)\b/i.test(clause);
    if (!topicBoundPaperLookup && !qualifiedPaperLookup) return false;

    const actionIndex = clause.search(SCHOLARLY_PAPER_LOOKUP_ACTION_RE);
    const rawPrefix = actionIndex >= 0 ? clause.slice(0, actionIndex) : clause;
    const operatorPrefix = rawPrefix
      .replace(/^\s*(?:(?:ok|okay|please)\s*[,.]?\s*)+/i, "")
      .replace(/^\s*(?:can|could|would|will)\s+you\s+/i, "");
    if (/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b/i.test(operatorPrefix)) {
      return false;
    }
    if (/\b(?:if|when|before|after|would|could|might|hypothetically)\b/i.test(operatorPrefix)) {
      return false;
    }
    if (/\b(?:earlier|previously|last\s+turn|historically|already)\b/i.test(operatorPrefix)) {
      return false;
    }
    if (/\b(?:screen|visible|label|button|phrase|text|debug)\b[^.!?;\n]{0,80}\b(?:says|said|shows|showed|reads|contains|mentions)\b/i.test(operatorPrefix)) {
      return false;
    }
    return !/\b(?:later|tomorrow|next\s+time|in\s+the\s+future|eventually|not\s+now|not\s+yet)\b/i.test(clause);
  });
};

const hasExplicitInternetSearchScopeCue = (promptText: string): boolean =>
  /\b(?:search|browse|look\s*up|lookup|check|verify)\s+(?:(?:the|on)\s+)?(?:web|internet|online)\b|\b(?:google\s+(?:it|search)|web\s+search|internet\s+search)\b/i.test(promptText);

const hasScholarlyExecutionActionAndTarget = (promptText: string): boolean =>
  /\b(?:find|search|look\s+for|look\s*up|lookup|fetch|retrieve|read|open|inspect|query|resolve|collect|recommend|suggest|identify|use)\b[^.!?;\n]{0,120}\b(?:scholarly|research\s+papers?|papers?|articles?|sources?|arxiv|doi|pubmed|pmc|citations?|references?|bibliograph(?:y|ies)|full[-\s]?text|pdfs?|abstracts?|metadata)\b/i.test(promptText) ||
  /\b(?:scholarly|research\s+papers?|papers?|articles?|sources?|arxiv|doi|pubmed|pmc|citations?|references?|bibliograph(?:y|ies)|full[-\s]?text|pdfs?|abstracts?|metadata)\b[^.!?;\n]{0,120}\b(?:find|search|look\s+for|look\s*up|lookup|fetch|retrieve|read|open|inspect|query|resolve|collect|recommend|suggest|identify|use)\b/i.test(promptText);

export const hasFullyNegatedScholarlyResearchInstruction = (promptText: string): boolean => {
  const unquoted = stripQuotedPromptSegments(promptText);
  const negatedClausePattern =
    /\b(?:do\s+not|don't|dont|no\s+need\s+to|not\s+asking\s+to|avoid)\b[^.!?;\n]{0,180}/gi;
  const withoutExecutionPattern =
    /\bwithout\s+(?:finding|fetching|retrieving|reading|opening|inspecting|searching|looking\s+up|querying|resolving|collecting|using)\b[^.!?;\n]{0,140}/gi;
  const negatedClauses = [
    ...Array.from(unquoted.matchAll(negatedClausePattern), (match) => match[0] ?? ""),
    ...Array.from(unquoted.matchAll(withoutExecutionPattern), (match) => match[0] ?? ""),
  ];
  const anaphoricNegatedClause = unquoted.match(
    /\b(?:do\s+not|don't|dont|no\s+need\s+to|not\s+asking\s+to|avoid)\b[^.!?;\n]{0,120}\b(?:look\s+(?:it|that|this|them|those)\s+up|fetch\s+(?:it|that|this|them|those)|retrieve\s+(?:it|that|this|them|those)|open\s+(?:it|that|this|them|those)|search\s+for\s+(?:it|that|this|them|those))\b/i,
  )?.[0] ?? null;
  const hasNegatedTargetedExecution = negatedClauses.some(hasScholarlyExecutionActionAndTarget);
  const hasNegatedAnaphoricExecution = Boolean(
    anaphoricNegatedClause && extractScholarlySourceTargets(unquoted).length > 0,
  );
  if (!hasNegatedTargetedExecution && !hasNegatedAnaphoricExecution) return false;

  const affirmativeRemainder = unquoted
    .replace(negatedClausePattern, " ")
    .replace(withoutExecutionPattern, " ")
    .replace(anaphoricNegatedClause ?? /$^/, " ");
  return !hasScholarlyExecutionActionAndTarget(affirmativeRemainder);
};

const hasScholarlyProviderCue = (promptText: string): boolean =>
  /\b(?:arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|core\s+api)\b/i.test(promptText);

const hasCitationCue = (promptText: string): boolean =>
  /\b(?:cite|cites|cited|citing|cited\s+by|citations?|references?|bibliograph(?:y|ies)|bibtex|journal\s+references?|reference\s+list|corroborat(?:e|es|ed|ing|ion)|source[-\s]?bound)\b/i.test(promptText);

const hasPaperCorpusCue = (promptText: string): boolean =>
  /\b(?:scholarly\s+research|research[-\s]+papers?|research[-\s]+paper\s+evidence|paper[-\s]+backed|paper\s+metadata|journal\s+(?:article|articles|paper|papers)|peer[-\s]?reviewed|literature|preprints?|scholarly\s+(?:papers?|articles?|sources?))\b/i.test(promptText);

export const hasScholarlyFullTextCue = (promptText: string): boolean =>
  /\b(?:pdfs?|full[-\s]?text|paper\s+text|article\s+text|paper[-\s]+backed\s+(?:numeric|numerical|formula|variable|calculator)|research[-\s]+paper\s+(?:numeric|numerical|formula|variable)\s+evidence|source[-\s]backed\s+(?:numeric|numerical|expression|calculator)|formula\s+(?:variable\s+)?binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|calculator\s+binding|extract\s+(?:text|sections?|passages?|chunks?|science|scientific\s+content)|show\s+(?:me\s+)?(?:the\s+)?science|scientific\s+content|scientific\s+evidence(?:\s+packet)?|main\s+equations?|show\s+(?:me\s+)?(?:the\s+)?equations?|read\s+(?:the\s+)?(?:paper|pdf|article)|pages?|page\s+images?|figures?|tables?|equations?|(?:paper|article)\s+(?:methods?|results?|discussion|conclusion)|(?:methods?|results?|discussion|conclusion)\s+(?:section|of\s+(?:the\s+)?(?:paper|article)))\b/i.test(stripScholarlySourceUrls(promptText));

const hasNegatedScholarlyFullTextAction = (promptText: string): boolean =>
  /\b(?:do\s+not|don't|dont|without|avoid|not\s+asking\s+to)\b[\s\S]{0,100}\b(?:fetch|retrieve|read|open|parse|extract)\b[\s\S]{0,80}\b(?:pdf|full[-\s]?text|paper\s+text|article\s+text|paper|article)\b/i.test(promptText);

export const hasScholarlyPageImageCue = (promptText: string): boolean =>
  /\b(?:render|inspect|ocr|parse|crop|page\s+images?|pdf\s+pages?|image\s+lens|displayed\s+equations?|equation[-\s]+like\s+rows?|exact\s+equation\s+rows?)\b/i.test(promptText);

const hasScholarlyEquationRowExtractionCue = (promptText: string): boolean =>
  /\b(?:displayed\s+equations?|equation[-\s]+like\s+rows?|exact\s+equation\s+rows?|main\s+equations?|show\s+(?:me\s+)?(?:the\s+)?equations?)\b/i.test(promptText);

const hasScholarlyNumericEvidenceCue = (promptText: string): boolean =>
  /\b(?:extract|report|return|find|fetch|bind)\b[\s\S]{0,80}\b(?:reported\s+)?(?:numeric|numerical|unit[-\s]?bearing|parameters?|values?|invariants?|measurements?|variables?\s+with\s+units?)\b/i.test(promptText) ||
  /\b(?:numeric|numerical|unit[-\s]?bearing)\s+(?:parameters?|values?|ranges?|evidence|binding)\b/i.test(promptText) ||
  /\b(?:paper[-\s]+backed|source[-\s]?backed|research[-\s]+paper)\s+(?:numeric|numerical|formula\s+variable|variable|calculator)\b/i.test(promptText) ||
  /\b(?:formula\s+(?:variable\s+)?binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|calculator\s+binding)\b/i.test(promptText);

const isExplanatoryOnlyPrompt = (promptText: string): boolean =>
  /\b(?:what\s+is|what\s+are|what\s+does|explain|describe|tell\s+me)\b[\s\S]{0,120}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citation|reference|journal)\b/i.test(promptText) &&
  !hasLookupActionCue(promptText) &&
  !extractScholarlyDoi(promptText) &&
  !extractScholarlyArxivId(promptText);

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));

const firstQuotedTopic = (promptText: string): string | null => {
  for (const pattern of [
    /"([^"\n]{3,180})"/g,
    /'([^'\n]{3,180})'/g,
    /“([^”\n]{3,180})”/g,
    /‘([^’\n]{3,180})’/g,
    /`([^`\n]{3,180})`/g,
  ]) {
    for (const match of promptText.matchAll(pattern)) {
      const candidate = match[1]?.replace(/\s+/g, " ").trim();
      if (!candidate) continue;
      if (!/[A-Za-z]/.test(candidate)) continue;
      if (/\b(?:search|find|fetch|summari[sz]e|extract|calculate|scholarly-research\.)\b/i.test(candidate)) continue;
      return candidate;
    }
  }
  return null;
};

const explicitLookupTopic = (promptText: string): string | null => {
  const match = promptText.match(/\bscholarly-research\.lookup_papers\s+(?:for|on|about|with)\s+([^.;\n]+?)(?:,\s*then|\bthen\b|\.|$)/i)?.[1];
  if (!match) return null;
  const cleaned = match
    .replace(/\b(?:then|use)\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.!?-]+|[\s:;,.!?-]+$/g, "")
    .trim();
  return cleaned && /[A-Za-z]/.test(cleaned) ? cleaned : null;
};

const explicitPrimaryPaperTopic = (promptText: string): string | null => {
  const match = promptText.match(
    /\b(?:find|search|look\s+for|look\s*up|lookup|locate|retrieve|collect|get|give|show|recommend|suggest|identify)\b[^.;\n]{0,120}\b(?:primary\s+)?(?:research\s+)?papers?\b\s+(?:supporting|that\s+support|about|on|for)\s+([^.;\n]{3,220})/i,
  )?.[1];
  if (!match) return null;
  const cleaned = match
    .replace(
      /(?:,\s*|\s+and\s+)(?=(?:then\s+)?(?:fetch|retrieve|get|open|read|parse|extract|summari[sz]e|show|report|return|provide|identify)\b)[\s\S]*$/i,
      " ",
    )
    .replace(
      /\s+that\s+(?:we|i)\s+(?:can|could|will|would|might|may|want\s+to|need\s+to)\s+(?:work\s+with|use|read|inspect|analy[sz]e|explore)\s*[?.!]*$/i,
      " ",
    )
    .replace(/^\s*((?:arxiv|pubmed|semantic\s+scholar|openalex|crossref))\s+for\s+/i, "$1 ")
    .replace(/^\s*(?:a|an|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.!?-]+|[\s:;,.!?-]+$/g, "")
    .trim();
  return cleaned && /[A-Za-z]/.test(cleaned) ? cleaned : null;
};

const historicalOriginalPaperTopic = (promptText: string): { query: string; reason: string } | null => {
  const normalized = promptText.replace(/\s+/g, " ").trim();
  const originalPaperCue =
    /\b(?:first|original|earliest|foundational|classic)\b[\s\S]{0,80}\b(?:research\s+)?papers?\b/i.test(normalized) ||
    /\b(?:fetch|find|retrieve|get)\b[\s\S]{0,80}\b(?:first|original|earliest|foundational|classic)\b/i.test(normalized);
  if (!originalPaperCue) return null;
  const author =
    normalized.match(/\bby\s+([A-Z][A-Za-z.\-]*(?:\s+[A-Z][A-Za-z.\-]*){0,4})\b/)?.[1] ??
    normalized.match(/\bby\s+([a-z][a-z.\-]*(?:\s+[a-z][a-z.\-]*){0,4})\b/i)?.[1] ??
    null;
  const topic =
    normalized.match(/\b(?:of|on|about)\s+(?:the\s+)?([^.;,\n]{3,120}?)(?:\s+by\b|$)/i)?.[1] ??
    normalized.match(/\b(?:paper|papers?)\s+(?:of|on|about)\s+(?:the\s+)?([^.;,\n]{3,120}?)(?:\s+by\b|$)/i)?.[1] ??
    null;
  const pieces = [
    topic?.replace(/\b(?:effect|theory|phenomenon)\b/gi, (match) => match).trim(),
    author?.trim(),
    "original paper",
  ].filter((entry): entry is string => Boolean(entry));
  if (pieces.length < 2) return null;
  return {
    query: pieces.join(" ").replace(/\s+/g, " ").trim(),
    reason: "historical_original_paper_topic_selected",
  };
};

const stripInstructionText = (promptText: string): { query: string; reasons: string[] } => {
  const reasons: string[] = [];
  let query = stripScholarlySourceUrls(promptText).replace(/\s+/g, " ").trim();
  if (query !== promptText.replace(/\s+/g, " ").trim()) reasons.push("source_urls_stripped");
  const quotedTopic = firstQuotedTopic(query);
  if (quotedTopic) {
    return { query: quotedTopic, reasons: ["quoted_topic_selected"] };
  }
  const explicitTopic = explicitLookupTopic(query);
  if (explicitTopic) {
    return { query: explicitTopic, reasons: ["explicit_lookup_topic_selected"] };
  }
  const primaryPaperTopic = explicitPrimaryPaperTopic(query);
  if (primaryPaperTopic) {
    return { query: primaryPaperTopic, reasons: ["explicit_primary_paper_topic_selected"] };
  }
  const historicalTopic = historicalOriginalPaperTopic(query);
  if (historicalTopic) {
    return { query: historicalTopic.query, reasons: [historicalTopic.reason] };
  }
  const replacements: Array<[RegExp, string]> = [
    [/\bscholarly-research\.(?:lookup_papers|fetch_full_text|extract_numeric_parameters)\b/gi, " "],
    [/\s*[.;]\s*(?:fetch|open|read|parse)\s+(?:the\s+)?(?:(?:best|top)\s+)?(?:one|two|three|1|2|3|up\s+to\s+\d+)\s+(?:accessible\s+)?(?:sources?|papers?|articles?|pdfs?|full[-\s]?texts?)\b[^.;]*/gi, " "],
    [/\s*[.;]\s*(?:return|provide|identify|report|decompose|group|map)\b[^.;]*/gi, " "],
    [/\b(?:search|find|look\s+for|look\s*up|lookup|retrieve|collect|get)\s+(?:a\s+)?(?:scholarly\s+)?(?:research\s+)?(?:papers?|articles?|sources?)\s+(?:for|on|about|with)?\b/gi, " "],
    [/\b(?:search|find|look\s+for|look\s*up|lookup|retrieve|collect|get)\s+(?:a\s+)?(?:scholarly\s+)?(?:paper|article)\s+(?:for|on|about|with)?\b/gi, " "],
    [/\b(?:scholarly\s+research\s+papers?|research\s+papers?|paper\s+evidence|scholarly\s+papers?|paper\s+records?|paper\s+record|papers?|article)\b/gi, " "],
    [/\b(?:fetch|pull|read)\s+(?:the\s+)?(?:full[-\s]?text|pdf|paper\s+text|article\s+text)(?:\s+if\s+available)?\b/gi, " "],
    [/\b(?:show\s+(?:me\s+)?(?:the\s+)?science|scientific\s+content|scientific\s+evidence(?:\s+packet)?|main\s+equations?|show\s+(?:me\s+)?(?:the\s+)?equations?)\b/gi, " "],
    [/\b(?:summari[sz]e|answer|explain|review)\s+(?:only\s+)?(?:from|using|based\s+on)?\s*(?:fetched\s+text|full[-\s]?text|paper\s+evidence|metadata|the\s+results?)?\b/gi, " "],
    [/\b(?:extract|report|return)\s+(?:reported\s+)?(?:numeric|numerical)\s+(?:parameters?|values?|invariants?)(?:\s+with\s+units?)?\b/gi, " "],
    [/\bthen\s+calculate\s+only\s+if\s+(?:those\s+)?(?:cited\s+)?values?\s+(?:are|is)\s+available\b/gi, " "],
    [/\b(?:calculate|compute|solve)\s+only\s+if\s+(?:cited\s+)?values?\s+(?:are|is)\s+available\b/gi, " "],
    [/\b(?:and|then|please|can\s+you|could\s+you|only\s+from|if\s+available|with\s+units?)\b/gi, " "],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(query)) reasons.push("instruction_text_stripped");
    query = query.replace(pattern, replacement);
  }
  query = query
    .replace(/\b(?:numeric|numerical|reported)\b/gi, " ")
    .replace(/\b(?:for|in|the)\b/gi, " ")
    .replace(/\b(?:in|for|on|about|with|from|using|based)\s+$/i, "")
    .replace(/^[\s:;,.!?-]+|[\s:;,.!?-]+$/g, "")
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!query || query.length < 3) query = stripScholarlySourceUrls(promptText).trim().slice(0, 180);
  return { query, reasons: uniqueStrings(reasons.length ? reasons : ["prompt_used_as_query"]) };
};

const requestedWorkflowForPrompt = (prompt: string, doi: string | null): HelixScholarlyRequestedWorkflow => {
  if (hasDirectScholarlyFullTextSourceIntent(prompt)) return "full_text_summary";
  if (/\b(?:calculate|compute|solve|calculator)\b/i.test(prompt) && /\b(?:numeric|numerical|values?|parameters?|invariants?|units?)\b/i.test(prompt)) {
    return "numeric_calculation";
  }
  if (hasScholarlyNumericEvidenceCue(prompt) && !hasScholarlyEquationRowExtractionCue(prompt)) {
    return "numeric_extraction";
  }
  const fullTextCapabilityNegated =
    /\b(?:do\s+not|don't|dont|without|avoid|not\s+asking\s+to)\b[^.!?;\n]{0,120}\bscholarly-research\.fetch_full_text\b/i.test(prompt);
  const fullTextActionNegated = hasNegatedScholarlyFullTextAction(prompt) || fullTextCapabilityNegated;
  if (!fullTextActionNegated && /\bscholarly-research\.fetch_full_text\b/i.test(prompt)) return "full_text_summary";
  if (!fullTextActionNegated && /\b(?:fetch|retrieve|get|pull)\b[\s\S]{0,100}\b(?:research\s+)?papers?\b/i.test(prompt)) return "full_text_summary";
  if (!fullTextActionNegated && hasScholarlyFullTextCue(prompt)) return "full_text_summary";
  if (/\b(?:references?|bibliograph(?:y|ies)|bibtex)\b/i.test(prompt)) return "bibliography_repair";
  if (doi) return "doi_lookup";
  return "metadata_search";
};

const terminalRequirementForWorkflow = (
  workflow: HelixScholarlyRequestedWorkflow,
): HelixScholarlyTerminalEvidenceRequirement => {
  if (workflow === "numeric_calculation") return "calculation_from_numeric_values";
  if (workflow === "numeric_extraction") return "numeric_values";
  if (workflow === "full_text_summary") return "full_text";
  return "metadata";
};

export const buildScholarlyCapabilityChainPlan = (
  intent: HelixScholarlyIntent,
): HelixScholarlyCapabilityChainPlan => {
  if (intent.supporting_sources_only && (intent.source_targets?.length ?? 0) > 0) {
    const planned = uniqueStrings((intent.source_targets ?? []).map((target: HelixScholarlySourceTarget) =>
      target.retrieval_strategy === "metadata_lookup"
        ? "scholarly-research.lookup_papers"
        : "scholarly-research.fetch_full_text"
    ));
    return {
      schema: "helix.scholarly_capability_chain_plan.v1",
      requested_workflow: intent.requested_workflow,
      planned_capabilities: planned,
      terminal_evidence_requirement: intent.terminal_evidence_requirement,
      calculator_requires_numeric_evidence: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const sourceTargets = intent.source_targets ?? [];
  const requiresMetadataResolution = sourceTargets.length > 0 && sourceTargets.every(
    (target: HelixScholarlySourceTarget) => target.kind === "doi" || target.kind === "pubmed",
  );
  const directFullTextSource =
    hasDirectScholarlyFullTextSourceIntent(intent.original_prompt) && !requiresMetadataResolution;
  const planned = directFullTextSource
    ? ["scholarly-research.fetch_full_text"]
    : ["scholarly-research.lookup_papers"];
  if (!directFullTextSource && (
    intent.requested_workflow === "full_text_summary" ||
    intent.requested_workflow === "numeric_extraction" ||
    intent.requested_workflow === "numeric_calculation"
  )) {
    planned.push("scholarly-research.fetch_full_text");
  }
  if (
    intent.requested_workflow === "numeric_extraction" ||
    intent.requested_workflow === "numeric_calculation"
  ) {
    planned.push("scholarly-research.extract_numeric_parameters");
  }
  if (intent.requested_workflow === "numeric_calculation") {
    planned.push("scientific-calculator.solve_expression");
  }
  return {
    schema: "helix.scholarly_capability_chain_plan.v1",
    requested_workflow: intent.requested_workflow,
    planned_capabilities: planned,
    terminal_evidence_requirement: intent.terminal_evidence_requirement,
    calculator_requires_numeric_evidence: intent.requested_workflow === "numeric_calculation",
    assistant_answer: false,
    raw_content_included: false,
  };
};

const promptUsesSourcesAsSupportingContext = (
  promptText: string,
  sourceTargets: HelixScholarlySourceTarget[],
): boolean => {
  if (sourceTargets.length === 0) return false;
  const operatorText = stripQuotedPromptSegments(stripScholarlySourceUrls(promptText));
  if (hasDirectScholarlyFullTextSourceIntent(promptText)) return false;
  if (
    /\b(?:treat|use|consider|regard)\s+(?:(?:these|those|the|supplied|provided|linked|cited)\s+)?(?:(?:links?|urls?|papers?|sources?)\s+)?as\s+(?:a\s+)?supporting(?:\s+(?:scholarly|paper|source|evidence|context|metadata|material)){0,3}\b/i.test(
      operatorText,
    )
  ) {
    return true;
  }
  return !hasLookupActionCue(operatorText) &&
    !hasCitationCue(operatorText) &&
    !hasPaperCorpusCue(operatorText) &&
    !hasScholarlyFullTextCue(operatorText);
};

export const extractScholarlyIntent = (promptText: string): HelixScholarlyIntent => {
  const originalPrompt = promptText.trim();
  const sourceTargets = extractScholarlySourceTargets(originalPrompt);
  const supportingSourcesOnly = promptUsesSourcesAsSupportingContext(originalPrompt, sourceTargets);
  const doi = extractScholarlyDoi(originalPrompt);
  const workflow = requestedWorkflowForPrompt(originalPrompt, doi);
  const quotedTopic = firstQuotedTopic(originalPrompt) ?? undefined;
  const normalized = stripInstructionText(originalPrompt);
  const requestsFullText =
    workflow === "full_text_summary" ||
    workflow === "numeric_extraction" ||
    workflow === "numeric_calculation";
  const evidenceDemand = deriveScholarlyEvidenceDemand({
    promptText: originalPrompt,
    workflow,
  });
  const requiresFullText = requestsFullText && evidenceDemand.required_modes.includes("full_text");
  const requiresNumericExtraction =
    workflow === "numeric_extraction" || workflow === "numeric_calculation";
  const requiresCalculation = workflow === "numeric_calculation";
  const requestedOutputs = uniqueStrings([
    workflow === "doi_lookup" ? "doi_metadata" : "paper_metadata",
    requestsFullText ? "full_text" : "",
    requiresNumericExtraction ? "numeric_parameters" : "",
    requiresCalculation ? "calculation" : "",
    workflow === "bibliography_repair" ? "bibliography" : "",
  ]);
  const terminalEvidenceRequirement =
    workflow === "full_text_summary" && !requiresFullText
      ? "metadata"
      : terminalRequirementForWorkflow(workflow);
  return {
    schema: "helix.scholarly_intent.v1",
    original_prompt: originalPrompt,
    scholarly_query: normalized.query,
    ...(quotedTopic ? { quoted_topic: quotedTopic } : {}),
    requested_workflow: workflow,
    requested_outputs: requestedOutputs,
    requires_full_text: requiresFullText,
    requires_numeric_extraction: requiresNumericExtraction,
    requires_calculation: requiresCalculation,
    terminal_evidence_requirement: terminalEvidenceRequirement,
    evidence_demand: evidenceDemand,
    query_normalization_reasons: normalized.reasons,
    ...(supportingSourcesOnly ? { supporting_sources_only: true } : {}),
    ...(sourceTargets.length > 0 ? { source_targets: sourceTargets } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const detectScholarlyResearchIntent = (promptText: string): HelixScholarlyResearchIntent => {
  const prompt = promptText.trim();
  const admissionPrompt = stripScholarlySourceUrls(stripQuotedPromptSegments(prompt));
  const scholarlyIntent = extractScholarlyIntent(prompt);
  const chainPlan = buildScholarlyCapabilityChainPlan(scholarlyIntent);
  const doi = extractScholarlyDoi(prompt);
  const arxivId = extractScholarlyArxivId(prompt);
  const pmid = extractScholarlyPmid(prompt);
  const pmcid = extractScholarlyPmcid(prompt);
  const sourceTargets = scholarlyIntent.source_targets ?? [];
  const sourceUrls = sourceTargets.map((target: HelixScholarlySourceTarget) => target.canonical_url);
  const supportingSourceOnly = scholarlyIntent.supporting_sources_only === true;
  const providerCue = hasScholarlyProviderCue(admissionPrompt);
  const citationCue = hasCitationCue(admissionPrompt);
  const corpusCue = hasPaperCorpusCue(admissionPrompt);
  const directFullTextSource = hasDirectScholarlyFullTextSourceIntent(prompt);
  const fullTextCue = directFullTextSource || (
    hasScholarlyFullTextCue(admissionPrompt) &&
    !hasNegatedScholarlyFullTextAction(admissionPrompt)
  );
  const lookupAction = hasLookupActionCue(admissionPrompt);
  const explicitPaperLookup = hasAffirmativeScholarlyPaperLookupCue(prompt);
  const localDocsScope = hasLocalDocsScopeCue(admissionPrompt);
  const localRepoScope = hasLocalRepoScopeCue(admissionPrompt);
  const externalIdentifier = Boolean(doi || arxivId || pmid || pmcid || sourceTargets.length > 0);
  const fullyNegatedResearch = hasFullyNegatedScholarlyResearchInstruction(prompt);
  const internetEvidenceOnly =
    hasExplicitInternetSearchScopeCue(admissionPrompt) &&
    !externalIdentifier &&
    !providerCue &&
    !corpusCue &&
    !fullTextCue;
  // A citation request can be entirely local (for example, citing headings in
  // the currently open document). Preserve that explicit source scope unless
  // the user also asks for an external scholarly provider, identifier, or
  // lookup action.
  const localEvidenceOnly =
    (localDocsScope || localRepoScope) &&
    !externalIdentifier &&
    !providerCue &&
    !corpusCue;
  const researchRequested =
    !fullyNegatedResearch &&
    !localEvidenceOnly &&
    !internetEvidenceOnly &&
    !isExplanatoryOnlyPrompt(admissionPrompt) &&
    (
      externalIdentifier ||
      sourceTargets.length > 0 ||
      explicitPaperLookup ||
      (lookupAction && (providerCue || citationCue || corpusCue || fullTextCue)) ||
      (providerCue && (citationCue || corpusCue)) ||
      (citationCue && corpusCue) ||
      (fullTextCue && (providerCue || corpusCue || citationCue || externalIdentifier))
    ) &&
    (!(localDocsScope || localRepoScope) || externalIdentifier || providerCue || corpusCue);
  const explicitCues = [
    doi ? "doi" : "",
    arxivId ? "arxiv_id" : "",
    pmid ? "pmid" : "",
    pmcid ? "pmcid" : "",
    sourceTargets.length > 0 ? "scholarly_source_url" : "",
    providerCue ? "scholarly_provider" : "",
    citationCue ? "citation_or_reference" : "",
    corpusCue ? "scholarly_paper_corpus" : "",
    fullTextCue ? "scholarly_full_text_or_pdf" : "",
    lookupAction ? "research_lookup_action" : "",
    explicitPaperLookup ? "scholarly_paper_lookup" : "",
  ].filter(Boolean);
  const mode: HelixScholarlyResearchIntentMode =
    citationCue && /\breferences?|bibliograph|bibtex/i.test(admissionPrompt)
      ? "reference_lookup"
      : citationCue
        ? "citation_lookup"
        : doi
          ? "doi_lookup"
          : "paper_search";
  const requestedOutputs: HelixAskSourceTargetRequestedOutput[] = [
    "scholarly_paper_refs",
    ...(doi ? ["doi_metadata" as const] : []),
    ...(citationCue ? ["citation_graph" as const] : []),
    ...(fullTextCue ? ["scholarly_full_text" as const, "paper_pdf_pages" as const] : []),
    "typed_failure",
  ];
  return {
    researchRequested,
    mode,
    strength: supportingSourceOnly
      ? "soft"
      : externalIdentifier || citationCue || explicitPaperLookup
        ? "hard"
        : "soft",
    explicitCues,
    reasons: researchRequested
      ? ["external_scholarly_research_source_target", ...explicitCues]
      : [],
    requestedOutputs,
    doi,
    arxivId,
    pmid,
    pmcid,
    sourceUrls,
    sourceTargets,
    supportingSourceOnly,
    fullTextRequested: fullTextCue,
    normalizedQuery: scholarlyIntent.scholarly_query,
    scholarlyIntent,
    plannedScholarlyCapabilityChain: chainPlan,
  };
};
