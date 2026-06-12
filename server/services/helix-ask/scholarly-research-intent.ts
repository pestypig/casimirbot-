import type {
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";
import type { HelixScholarlyResearchIntentMode } from "@shared/helix-scholarly-research-observation";

export type HelixScholarlyResearchIntent = {
  researchRequested: boolean;
  mode: HelixScholarlyResearchIntentMode;
  strength: HelixAskSourceTargetStrength;
  explicitCues: string[];
  reasons: string[];
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  doi: string | null;
  arxivId: string | null;
  fullTextRequested: boolean;
  normalizedQuery: string;
};

const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const ARXIV_PATTERN = /\b(?:arxiv:\s*|arxiv\.org\/(?:abs|pdf)\/)([A-Za-z-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?\b/i;
const BARE_ARXIV_PATTERN = /\b\d{4}\.\d{4,5}(?:v\d+)?\b/i;

const trimIdentifier = (value: string): string =>
  value.trim().replace(/[)\].,;:!?]+$/g, "");

export const extractScholarlyDoi = (promptText: string): string | null => {
  const match = promptText.match(DOI_PATTERN)?.[0];
  return match ? trimIdentifier(match).toLowerCase() : null;
};

export const extractScholarlyArxivId = (promptText: string): string | null => {
  const explicit = promptText.match(ARXIV_PATTERN)?.[1];
  if (explicit) return trimIdentifier(explicit);
  const hasArxivCue = /\barxiv\b/i.test(promptText);
  const bare = hasArxivCue ? promptText.match(BARE_ARXIV_PATTERN)?.[0] : null;
  return bare ? trimIdentifier(bare) : null;
};

const hasLocalDocsScopeCue = (promptText: string): boolean =>
  /\b(?:docs?\s+viewer|documents?\s+viewer|current\s+(?:doc|document|paper)|active\s+(?:doc|document|paper)|document\s+path\s*:|locate\s+query\s*:|\/docs\/|from\s+(?:our|local|the)\s+docs?)\b/i.test(promptText);

const hasLookupActionCue = (promptText: string): boolean =>
  /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b/i.test(promptText);

const hasScholarlyProviderCue = (promptText: string): boolean =>
  /\b(?:arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|core\s+api)\b/i.test(promptText);

const hasCitationCue = (promptText: string): boolean =>
  /\b(?:cited\s+by|citations?|references?|bibliograph(?:y|ies)|bibtex|journal\s+references?|reference\s+list)\b/i.test(promptText);

const hasPaperCorpusCue = (promptText: string): boolean =>
  /\b(?:scholarly\s+research|research\s+papers?|paper\s+metadata|journal\s+(?:article|articles|paper|papers)|peer[-\s]?reviewed|literature|preprints?|scholarly\s+(?:papers?|articles?|sources?))\b/i.test(promptText);

export const hasScholarlyFullTextCue = (promptText: string): boolean =>
  /\b(?:pdfs?|full[-\s]?text|paper\s+text|article\s+text|extract\s+(?:text|sections?|passages?|chunks?)|read\s+(?:the\s+)?(?:paper|pdf|article)|pages?|page\s+images?|figures?|tables?|equations?|methods?|results?|discussion|conclusion)\b/i.test(promptText);

const isExplanatoryOnlyPrompt = (promptText: string): boolean =>
  /\b(?:what\s+is|what\s+are|what\s+does|explain|describe|tell\s+me)\b[\s\S]{0,120}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citation|reference|journal)\b/i.test(promptText) &&
  !hasLookupActionCue(promptText) &&
  !extractScholarlyDoi(promptText) &&
  !extractScholarlyArxivId(promptText);

export const detectScholarlyResearchIntent = (promptText: string): HelixScholarlyResearchIntent => {
  const prompt = promptText.trim();
  const doi = extractScholarlyDoi(prompt);
  const arxivId = extractScholarlyArxivId(prompt);
  const providerCue = hasScholarlyProviderCue(prompt);
  const citationCue = hasCitationCue(prompt);
  const corpusCue = hasPaperCorpusCue(prompt);
  const fullTextCue = hasScholarlyFullTextCue(prompt);
  const lookupAction = hasLookupActionCue(prompt);
  const localDocsScope = hasLocalDocsScopeCue(prompt);
  const externalIdentifier = Boolean(doi || arxivId);
  const researchRequested =
    !isExplanatoryOnlyPrompt(prompt) &&
    (
      externalIdentifier ||
      (lookupAction && (providerCue || citationCue || corpusCue || fullTextCue)) ||
      (providerCue && (citationCue || corpusCue)) ||
      (citationCue && corpusCue) ||
      (fullTextCue && (providerCue || corpusCue || citationCue || externalIdentifier))
    ) &&
    (!localDocsScope || externalIdentifier || providerCue || citationCue);
  const explicitCues = [
    doi ? "doi" : "",
    arxivId ? "arxiv_id" : "",
    providerCue ? "scholarly_provider" : "",
    citationCue ? "citation_or_reference" : "",
    corpusCue ? "scholarly_paper_corpus" : "",
    fullTextCue ? "scholarly_full_text_or_pdf" : "",
    lookupAction ? "research_lookup_action" : "",
  ].filter(Boolean);
  const mode: HelixScholarlyResearchIntentMode =
    citationCue && /\breferences?|bibliograph|bibtex/i.test(prompt)
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
    strength: externalIdentifier || citationCue ? "hard" : "soft",
    explicitCues,
    reasons: researchRequested
      ? ["external_scholarly_research_source_target", ...explicitCues]
      : [],
    requestedOutputs,
    doi,
    arxivId,
    fullTextRequested: fullTextCue,
    normalizedQuery: prompt,
  };
};
