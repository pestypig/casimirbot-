import type {
  HelixAskSourceTargetRequestedOutput,
  HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";
import type {
  HelixScholarlyCapabilityChainPlan,
  HelixScholarlyIntent,
  HelixScholarlyRequestedWorkflow,
  HelixScholarlyResearchIntentMode,
  HelixScholarlyTerminalEvidenceRequirement,
} from "@shared/helix-scholarly-research-observation";

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
  scholarlyIntent: HelixScholarlyIntent;
  plannedScholarlyCapabilityChain: HelixScholarlyCapabilityChainPlan;
};

const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const ARXIV_PATTERN = /\b(?:arxiv:\s*|arxiv\.org\/(?:abs|pdf)\/)([A-Za-z-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?\b/i;
const BARE_ARXIV_PATTERN = /\b\d{4}\.\d{4,5}(?:v\d+)?\b/i;

const trimIdentifier = (value: string): string =>
  value.trim().replace(/[)\].,;:!?]+$/g, "");

// Tool names and examples are frequently quoted in prompts that explicitly say not to run them.
// Intent cues must be read from the operator text, not from those literal examples.
const stripQuotedPromptSegments = (promptText: string): string =>
  promptText.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g, " ");

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
  /\b(?:docs?\s+viewer|documents?\s+viewer|(?:current(?:ly)?|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)|document\s+path\s*:|locate\s+query\s*:|from\s+(?:our|local|the)\s+docs?)\b/i.test(promptText) ||
  /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+(?:\.mdx?|\.txt)?\b/i.test(promptText);

const hasLocalRepoScopeCue = (promptText: string): boolean =>
  /\b(?:repo[-_. ]code\.(?:search_concept|search)|repo\.search|repo\/code\s+evidence|repository\s+evidence|cite\s+file\s+paths?)\b/i.test(promptText);

const hasLookupActionCue = (promptText: string): boolean =>
  /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|check|cross-?check)\b/i.test(promptText);

const hasScholarlyProviderCue = (promptText: string): boolean =>
  /\b(?:arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|core\s+api)\b/i.test(promptText);

const hasCitationCue = (promptText: string): boolean =>
  /\b(?:cite|cites|cited|citing|cited\s+by|citations?|references?|bibliograph(?:y|ies)|bibtex|journal\s+references?|reference\s+list|corroborat(?:e|es|ed|ing|ion)|source[-\s]?bound)\b/i.test(promptText);

const hasPaperCorpusCue = (promptText: string): boolean =>
  /\b(?:scholarly\s+research|research[-\s]+papers?|research[-\s]+paper\s+evidence|paper[-\s]+backed|paper\s+metadata|journal\s+(?:article|articles|paper|papers)|peer[-\s]?reviewed|literature|preprints?|scholarly\s+(?:papers?|articles?|sources?))\b/i.test(promptText);

export const hasScholarlyFullTextCue = (promptText: string): boolean =>
  /\b(?:pdfs?|full[-\s]?text|paper\s+text|article\s+text|paper[-\s]+backed\s+(?:numeric|numerical|formula|variable|calculator)|research[-\s]+paper\s+(?:numeric|numerical|formula|variable)\s+evidence|source[-\s]backed\s+(?:numeric|numerical|expression|calculator)|formula\s+(?:variable\s+)?binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|calculator\s+binding|extract\s+(?:text|sections?|passages?|chunks?|science|scientific\s+content)|show\s+(?:me\s+)?(?:the\s+)?science|scientific\s+content|scientific\s+evidence(?:\s+packet)?|main\s+equations?|show\s+(?:me\s+)?(?:the\s+)?equations?|read\s+(?:the\s+)?(?:paper|pdf|article)|pages?|page\s+images?|figures?|tables?|equations?|(?:paper|article)\s+(?:methods?|results?|discussion|conclusion)|(?:methods?|results?|discussion|conclusion)\s+(?:section|of\s+(?:the\s+)?(?:paper|article)))\b/i.test(promptText);

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
  for (const pattern of [/"([^"\n]{3,180})"/g, /'([^'\n]{3,180})'/g, /`([^`\n]{3,180})`/g]) {
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
  let query = promptText.replace(/\s+/g, " ").trim();
  const quotedTopic = firstQuotedTopic(query);
  if (quotedTopic) {
    return { query: quotedTopic, reasons: ["quoted_topic_selected"] };
  }
  const explicitTopic = explicitLookupTopic(query);
  if (explicitTopic) {
    return { query: explicitTopic, reasons: ["explicit_lookup_topic_selected"] };
  }
  const historicalTopic = historicalOriginalPaperTopic(query);
  if (historicalTopic) {
    return { query: historicalTopic.query, reasons: [historicalTopic.reason] };
  }
  const replacements: Array<[RegExp, string]> = [
    [/\bscholarly-research\.(?:lookup_papers|fetch_full_text|extract_numeric_parameters)\b/gi, " "],
    [/\b(?:search|find|look\s*up|lookup|retrieve|collect|get)\s+(?:a\s+)?(?:scholarly\s+)?(?:research\s+)?(?:papers?|articles?|sources?)\s+(?:for|on|about|with)?\b/gi, " "],
    [/\b(?:search|find|look\s*up|lookup|retrieve|collect|get)\s+(?:a\s+)?(?:scholarly\s+)?(?:paper|article)\s+(?:for|on|about|with)?\b/gi, " "],
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
  if (!query || query.length < 3) query = promptText.trim().slice(0, 180);
  return { query, reasons: uniqueStrings(reasons.length ? reasons : ["prompt_used_as_query"]) };
};

const requestedWorkflowForPrompt = (prompt: string, doi: string | null): HelixScholarlyRequestedWorkflow => {
  if (/\b(?:calculate|compute|solve|calculator)\b/i.test(prompt) && /\b(?:numeric|numerical|values?|parameters?|invariants?|units?)\b/i.test(prompt)) {
    return "numeric_calculation";
  }
  if (hasScholarlyNumericEvidenceCue(prompt) && !hasScholarlyEquationRowExtractionCue(prompt)) {
    return "numeric_extraction";
  }
  const fullTextActionNegated = hasNegatedScholarlyFullTextAction(prompt);
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
  const planned = ["scholarly-research.lookup_papers"];
  if (
    intent.requested_workflow === "full_text_summary" ||
    intent.requested_workflow === "numeric_extraction" ||
    intent.requested_workflow === "numeric_calculation"
  ) {
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

export const extractScholarlyIntent = (promptText: string): HelixScholarlyIntent => {
  const originalPrompt = promptText.trim();
  const doi = extractScholarlyDoi(originalPrompt);
  const workflow = requestedWorkflowForPrompt(originalPrompt, doi);
  const quotedTopic = firstQuotedTopic(originalPrompt) ?? undefined;
  const normalized = stripInstructionText(originalPrompt);
  const requiresFullText =
    workflow === "full_text_summary" ||
    workflow === "numeric_extraction" ||
    workflow === "numeric_calculation";
  const requiresNumericExtraction =
    workflow === "numeric_extraction" || workflow === "numeric_calculation";
  const requiresCalculation = workflow === "numeric_calculation";
  const requestedOutputs = uniqueStrings([
    workflow === "doi_lookup" ? "doi_metadata" : "paper_metadata",
    requiresFullText ? "full_text" : "",
    requiresNumericExtraction ? "numeric_parameters" : "",
    requiresCalculation ? "calculation" : "",
    workflow === "bibliography_repair" ? "bibliography" : "",
  ]);
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
    terminal_evidence_requirement: terminalRequirementForWorkflow(workflow),
    query_normalization_reasons: normalized.reasons,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const detectScholarlyResearchIntent = (promptText: string): HelixScholarlyResearchIntent => {
  const prompt = promptText.trim();
  const admissionPrompt = stripQuotedPromptSegments(prompt);
  const scholarlyIntent = extractScholarlyIntent(prompt);
  const chainPlan = buildScholarlyCapabilityChainPlan(scholarlyIntent);
  const doi = extractScholarlyDoi(prompt);
  const arxivId = extractScholarlyArxivId(prompt);
  const providerCue = hasScholarlyProviderCue(admissionPrompt);
  const citationCue = hasCitationCue(admissionPrompt);
  const corpusCue = hasPaperCorpusCue(admissionPrompt);
  const fullTextCue =
    hasScholarlyFullTextCue(admissionPrompt) &&
    !hasNegatedScholarlyFullTextAction(admissionPrompt);
  const lookupAction = hasLookupActionCue(admissionPrompt);
  const localDocsScope = hasLocalDocsScopeCue(admissionPrompt);
  const localRepoScope = hasLocalRepoScopeCue(admissionPrompt);
  const externalIdentifier = Boolean(doi || arxivId);
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
    !localEvidenceOnly &&
    !isExplanatoryOnlyPrompt(admissionPrompt) &&
    (
      externalIdentifier ||
      (lookupAction && (providerCue || citationCue || corpusCue || fullTextCue)) ||
      (providerCue && (citationCue || corpusCue)) ||
      (citationCue && corpusCue) ||
      (fullTextCue && (providerCue || corpusCue || citationCue || externalIdentifier))
    ) &&
    (!(localDocsScope || localRepoScope) || externalIdentifier || providerCue || corpusCue);
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
    strength: externalIdentifier || citationCue ? "hard" : "soft",
    explicitCues,
    reasons: researchRequested
      ? ["external_scholarly_research_source_target", ...explicitCues]
      : [],
    requestedOutputs,
    doi,
    arxivId,
    fullTextRequested: fullTextCue,
    normalizedQuery: scholarlyIntent.scholarly_query,
    scholarlyIntent,
    plannedScholarlyCapabilityChain: chainPlan,
  };
};
