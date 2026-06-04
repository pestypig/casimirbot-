export type HelixContextualToolAdmissionSuppressionReason =
  | "negated_tool_instruction"
  | "quoted_tool_command"
  | "hypothetical_tool_reference"
  | "historical_tool_reference"
  | "explanatory_only";

export type HelixContextualToolAdmissionSuppression = {
  tool_admission_suppressed: true;
  suppression_reason: HelixContextualToolAdmissionSuppressionReason;
  verb_or_cue: string;
  text: string;
};

const DOCS_VIEWER_CUE_RE = /\bdocs?\s+viewer\b|\bdocuments?\s+viewer\b|\bdocs?\s+panel\b|\bdocuments?\s+panel\b/i;
const DOCS_VIEWER_ACTION_RE = /\b(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load)\b[\s\S]{0,100}(?:the\s+|a\s+)?(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i;
const DOCS_VIEWER_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does)\b[\s\S]{0,120}\b(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel)\b[\s\S]{0,80}\b(?:for|mean|do|does|is|are|used\s+for|purpose)\b/i;
const SCHOLARLY_CUE_RE = /\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b|\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const SCHOLARLY_ACTION_RE = /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b/i;
const SCHOLARLY_ACTION_WITH_CUE_RE = /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b[\s\S]{0,140}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b|\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b[\s\S]{0,140}\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b/i;
const SCHOLARLY_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does)\b[\s\S]{0,120}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citation|reference|journal)\b[\s\S]{0,80}\b(?:for|mean|do|does|is|are|used\s+for|purpose)\b/i;

const scholarlyVerbOrCue = (text: string): string =>
  /\b(?:pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b/i.test(text)
    ? "scholarly-research.fetch_full_text"
    : "scholarly-research.lookup_papers";

export function detectContextualToolAdmissionSuppression(promptText: string): HelixContextualToolAdmissionSuppression | null {
  const prompt = promptText.trim();
  if (!prompt || (!DOCS_VIEWER_CUE_RE.test(prompt) && !SCHOLARLY_CUE_RE.test(prompt))) return null;

  const quoted = prompt.match(/["'`][^"'`]*(?:open|show|view|pull\s+up|bring\s+up)[^"'`]*(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)[^"'`]*["'`]/i)?.[0];
  if (quoted) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "docs_viewer.open",
      text: quoted,
    };
  }
  const quotedScholarly = prompt.match(/["'`][^"'`]*(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|query|cite|read)[^"'`]*(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)[^"'`]*["'`]/i)?.[0];
  if (quotedScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: scholarlyVerbOrCue(quotedScholarly),
      text: quotedScholarly,
    };
  }

  const negated = prompt.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to)\b[\s\S]{0,80}(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (negated) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "docs_viewer.open",
      text: negated,
    };
  }
  const negatedScholarly = prompt.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to)\b[\s\S]{0,120}(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|query|get|resolve|collect|cite|read)\b[\s\S]{0,160}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?|10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i)?.[0];
  if (negatedScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: scholarlyVerbOrCue(negatedScholarly),
      text: negatedScholarly,
    };
  }

  const hypothetical = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,100}(?:I|we|you)?\s*(?:opened?|open|show|view|pull\s+up|bring\s+up)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (hypothetical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: hypothetical,
    };
  }
  const hypotheticalScholarly = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,120}(?:do\s+research|research|find|search|searched|look\s*up|looked\s+up|lookup|retrieve|retrieved|fetch|fetched|query|queried|get|resolve|collect|cite|read)\b[\s\S]{0,160}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b/i)?.[0];
  if (hypotheticalScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: scholarlyVerbOrCue(hypotheticalScholarly),
      text: hypotheticalScholarly,
    };
  }

  const historical = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?opened?\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,100}(?:opened?|showed|viewed)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (historical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: historical,
    };
  }
  const historicalScholarly = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?(?:looked\s+up|searched|researched|queried|retrieved|fetched|read)\b[\s\S]{0,140}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,120}(?:looked\s+up|searched|researched|queried|retrieved|fetched|read)\b[\s\S]{0,140}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b/i)?.[0];
  if (historicalScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: scholarlyVerbOrCue(historicalScholarly),
      text: historicalScholarly,
    };
  }

  if (DOCS_VIEWER_EXPLANATION_RE.test(prompt) && !DOCS_VIEWER_ACTION_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "docs_viewer.open",
      text: prompt.match(DOCS_VIEWER_EXPLANATION_RE)?.[0] ?? "docs viewer explanation request",
    };
  }
  if (SCHOLARLY_EXPLANATION_RE.test(prompt) && !SCHOLARLY_ACTION_WITH_CUE_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "scholarly-research.lookup_papers",
      text: prompt.match(SCHOLARLY_EXPLANATION_RE)?.[0] ?? "scholarly research explanation request",
    };
  }

  return null;
}
