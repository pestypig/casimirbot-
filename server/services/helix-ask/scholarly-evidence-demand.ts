import type {
  HelixScholarlyEvidenceAlternative,
  HelixScholarlyEvidenceDemand,
  HelixScholarlyEvidenceDepth,
  HelixScholarlyRequestedWorkflow,
} from "@shared/helix-scholarly-research-observation";

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));

const normalizeDottedIdentifiersForClauseParsing = (text: string): string =>
  text.replace(
    /\b[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+\b/g,
    (identifier) => identifier.replace(/\./g, "_"),
  );

const affirmativeScholarlyEvidenceText = (promptText: string): string =>
  normalizeDottedIdentifiersForClauseParsing(promptText)
    .replace(
      /\b(?:do\s+not|don't|dont|without|exclude|avoid|not\s+asking\s+to)\b(?:(?!\b(?:but|however|instead|now)\b)[^.!?;\n]){0,240}/gi,
      " ",
    )
    .replace(
      /\b(?:previously|earlier|historically|in\s+the\s+last\s+turn)\b[^.!?;\n]{0,220}\b(?:equations?|formulae?|formulas?|image\s+lens|page\s+images?)\b/gi,
      " ",
    )
    .replace(
      /\b(?:later|in\s+(?:a\s+)?future\s+turn)\b[^.!?;\n]{0,220}\b(?:equations?|formulae?|formulas?|image\s+lens|page\s+images?)\b/gi,
      " ",
    )
    .replace(
      /\bif\b[^.!?;\n]{0,100}\b(?:use|render|inspect|extract|transcribe)\b[^.!?;\n]{0,120}\b(?:equations?|formulae?|formulas?|image\s+lens|page\s+images?)\b[^.!?;\n]{0,80}/gi,
      " ",
    )
    .replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const removeOptionalScholarlyEquationAlternatives = (text: string): string =>
  text
    .replace(
      /\b((?:(?:page[-\s]?numbered|page[-\s]?grounded)\s+)?(?:passage|excerpt|quotation|quote|text(?:ual)?\s+(?:passage|evidence)))\s+or\s+(?:an?\s+)?(?:equations?|formulae?|formulas?)\b/gi,
      "$1",
    )
    .replace(
      /\b(?:an?\s+)?(?:equations?|formulae?|formulas?)\s+or\s+((?:(?:page[-\s]?numbered|page[-\s]?grounded)\s+)?(?:passage|excerpt|quotation|quote|text(?:ual)?\s+(?:passage|evidence)))\b/gi,
      "$1",
    );

const hasOptionalPassageOrEquation = (text: string): boolean =>
  removeOptionalScholarlyEquationAlternatives(text) !== text;

const fullTextRequested = (text: string, workflow?: HelixScholarlyRequestedWorkflow): boolean =>
  workflow
    ? workflow === "full_text_summary" ||
      workflow === "numeric_extraction" ||
      workflow === "numeric_calculation"
    : /\b(?:full[-\s]?text|fetched\s+text|read\s+(?:the\s+)?(?:paper|pdf|article)|paper\s+content|parsed\s+page\s+count|page[-\s]?grounded|page[-\s]?numbered\s+(?:passage|excerpt))\b/i.test(text);

const fullTextRequestedOnlyWhenAvailable = (text: string): boolean =>
  /\b(?:fetch|retrieve|get|read|open|parse|use)\b[^.!?;\n]{0,160}\b(?:accessible\s+|available\s+|open[-\s]?access\s+)?(?:full[-\s]?text|pdf|paper\s+text|article\s+text)\b[^.!?;\n]{0,80}\b(?:if|when)\s+(?:it\s+is\s+)?(?:available|accessible|obtainable)\b/i.test(text) ||
  /\b(?:if|when)\s+(?:it\s+is\s+)?(?:available|accessible|obtainable)\b[^.!?;\n]{0,120}\b(?:fetch|retrieve|get|read|open|parse|use)\b[^.!?;\n]{0,120}\b(?:full[-\s]?text|pdf|paper\s+text|article\s+text)\b/i.test(text);

const explicitEquationRequested = (text: string): boolean =>
  /\b(?:equations?|formulae?|formulas?|derive|derivation|variables?|parameter\s+binding)\b/i.test(text) ||
  /\b(?:show\s+(?:me\s+)?(?:the\s+)?science|scientific\s+content|main\s+equations?|show\s+(?:me\s+)?(?:the\s+)?equations?)\b/i.test(text);

const pageImageRequested = (text: string): boolean =>
  /\b(?:page\s+images?|screenshots?|render(?:ed)?\s+pages?|pdf\s+pages?|image\s+lens|ocr|figures?|tables?|plots?)\b/i.test(text) ||
  /\b(?:render|inspect|ocr|crop|load|mount|open)\b[^.!?;\n]{0,160}\b(?:page\s*(?:number\s*)?\d{1,3}|next\s+pages?|following\s+pages?|subsequent\s+pages?)\b/i.test(text);

const minimumDepth = (
  alternatives: HelixScholarlyEvidenceAlternative[],
  satisfaction: HelixScholarlyEvidenceDemand["satisfaction"],
): HelixScholarlyEvidenceDepth => {
  const order: HelixScholarlyEvidenceDepth[] = [
    "metadata_lookup",
    "abstract_or_snippet",
    "full_text",
    "page_image_parse",
    "scientific_evidence_packet",
    "numeric_values",
    "calculation_from_numeric_values",
  ];
  const indexes = alternatives.map((entry) => Math.max(0, order.indexOf(entry.minimum_depth)));
  const selected = satisfaction === "any_of" ? Math.min(...indexes) : Math.max(...indexes);
  return order[selected] ?? "metadata_lookup";
};

export const deriveScholarlyEvidenceDemand = (input: {
  promptText: string;
  workflow?: HelixScholarlyRequestedWorkflow;
}): HelixScholarlyEvidenceDemand => {
  const affirmativeText = affirmativeScholarlyEvidenceText(input.promptText);
  const optionalPassageOrEquation = hasOptionalPassageOrEquation(affirmativeText);
  const equationRequiredText = removeOptionalScholarlyEquationAlternatives(affirmativeText);
  const needsEquation = explicitEquationRequested(equationRequiredText);
  const needsPageImage = pageImageRequested(equationRequiredText);
  const needsFullText = fullTextRequested(affirmativeText, input.workflow);
  const optionalFullText =
    input.workflow === "full_text_summary" &&
    needsFullText &&
    fullTextRequestedOnlyWhenAvailable(affirmativeText);
  const alternatives: HelixScholarlyEvidenceAlternative[] = [];
  const requiredModes: string[] = [];
  const optionalModes: string[] = [];
  const reasons: string[] = [];

  if (input.workflow === "numeric_calculation") {
    alternatives.push({
      product: "calculation",
      minimum_depth: "calculation_from_numeric_values",
      exactness: "bounded",
    });
    requiredModes.push("numeric_extraction", "full_text");
    reasons.push("numeric_calculation_requires_cited_values");
  } else if (input.workflow === "numeric_extraction") {
    alternatives.push({
      product: "numeric_parameters",
      minimum_depth: "numeric_values",
      exactness: "bounded",
    });
    requiredModes.push("numeric_extraction", "full_text");
    reasons.push("numeric_extraction_requires_full_text_values");
  } else if (optionalPassageOrEquation) {
    alternatives.push(
      {
        product: "page_grounded_passage",
        minimum_depth: "full_text",
        exactness: "bounded",
      },
      {
        product: "exact_equation",
        minimum_depth: "page_image_parse",
        exactness: "exact",
      },
    );
    requiredModes.push("full_text");
    optionalModes.push("equation_extraction", "page_image_parse");
    reasons.push("passage_or_equation_is_disjunctive");
  } else if (needsEquation) {
    alternatives.push({
      product: "exact_equation",
      minimum_depth: "page_image_parse",
      exactness: "exact",
    });
    requiredModes.push("equation_extraction", "page_image_parse");
    if (needsFullText) requiredModes.push("full_text");
    reasons.push("equation_output_requires_page_grounded_extraction");
  } else if (needsPageImage) {
    alternatives.push({
      product: "page_grounded_passage",
      minimum_depth: "page_image_parse",
      exactness: "bounded",
    });
    requiredModes.push("page_image_parse");
    if (needsFullText) requiredModes.push("full_text");
    reasons.push("page_image_output_explicitly_requested");
  } else if (optionalFullText) {
    alternatives.push({
      product: "paper_metadata",
      minimum_depth: "metadata_lookup",
      exactness: "bounded",
    });
    optionalModes.push("full_text");
    reasons.push("conditional_full_text_allows_metadata_fallback");
  } else if (needsFullText) {
    alternatives.push({
      product: /\b(?:passage|excerpt|quotation|quote)\b/i.test(affirmativeText)
        ? "page_grounded_passage"
        : "full_text_summary",
      minimum_depth: "full_text",
      exactness: "bounded",
    });
    requiredModes.push("full_text");
    reasons.push("full_text_output_requested");
  } else {
    alternatives.push({
      product: "paper_metadata",
      minimum_depth: "metadata_lookup",
      exactness: "bounded",
    });
    reasons.push("metadata_evidence_satisfies_requested_workflow");
  }

  const satisfaction: HelixScholarlyEvidenceDemand["satisfaction"] =
    optionalPassageOrEquation ? "any_of" : "all_of";

  return {
    schema: "helix.scholarly_evidence_demand.v1",
    satisfaction,
    alternatives,
    required_modes: uniqueStrings(requiredModes),
    optional_modes: uniqueStrings(optionalModes),
    minimum_satisfying_depth: minimumDepth(alternatives, satisfaction),
    derivation_reasons: uniqueStrings(reasons),
    assistant_answer: false,
    raw_content_included: false,
  };
};
