import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import {
  detectScholarlyResearchIntent,
} from "../scholarly-research-intent";
import { isExistingTranslationSurfaceReadPrompt } from "./active-context-tool-requests";

export const READ_ALOUD_SURFACE_OUTCOME = "read_aloud_surface" as const;
export const READ_ALOUD_DOC_EXCERPT_OUTCOME = READ_ALOUD_SURFACE_OUTCOME;
export const INSPECT_REPO_AND_DOC_OUTCOME = "inspect_repo_and_doc" as const;
export const SUMMARIZE_AND_CALCULATE_OUTCOME = "summarize_and_calculate" as const;
export const RESEARCH_QUANTIFY_REFLECT_OUTCOME = "research_quantify_reflect" as const;
export const SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME = "scholarly_research_workflow" as const;

const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const READABLE_SURFACE_OBSERVE_CAPABILITY = "workstation.readable_surface.observe" as const;
const DOCS_READ_VISIBLE_SURFACE_CAPABILITY = "docs-viewer.read_visible_surface" as const;
const DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY = "docs-viewer.read_active_translation" as const;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY = "scientific-calculator.read_visible_result" as const;
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context" as const;
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds" as const;
const INTERNET_SEARCH_CAPABILITY = "internet-search.search_web" as const;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = "scholarly-research.lookup_papers" as const;
const SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY = "scholarly-research.fetch_full_text" as const;
const SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY = "scholarly-research.extract_numeric_parameters" as const;
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say" as const;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const unquotePrompt = (prompt: string): string => prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

const scholarlyFullTextFetchabilityScore = (paper: Record<string, unknown>): number => {
  const identifiers = readRecord(paper.identifiers);
  const provider = readString(paper.provider);
  const pdfUrl = readString(identifiers?.pdf_url);
  const fullTextUrl = readString(identifiers?.full_text_url);
  const url = readString(identifiers?.url);
  const arxivId = readString(identifiers?.arxiv_id);
  const doi = readString(identifiers?.doi);
  let score = 0;
  if (arxivId) score += 100;
  if (pdfUrl) score += /arxiv\.org\/pdf\//i.test(pdfUrl) ? 100 : 80;
  if (url && /arxiv\.org\/abs\//i.test(url)) score += 90;
  if (fullTextUrl) score += /\.pdf(?:[?#].*)?$/i.test(fullTextUrl) ? 70 : 35;
  if (url && /\.pdf(?:[?#].*)?$/i.test(url)) score += 65;
  if (readString(paper.is_open_access) === "true" || paper.is_open_access === true) score += 20;
  if (provider === "arxiv") score += 40;
  if (provider === "unpaywall" || provider === "core") score += 30;
  if (provider === "openalex") score += 5;
  if (doi) score += 2;
  return score;
};

const selectScholarlyPaperForFullTextFetch = (
  papers: Record<string, unknown>[],
  fallbackPaper: Record<string, unknown> | undefined,
): Record<string, unknown> | null => {
  const ranked = papers
    .map((paper, index) => ({
      paper,
      index,
      score: scholarlyFullTextFetchabilityScore(paper),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked.find((entry) => entry.score > 0)?.paper ?? fallbackPaper ?? null;
};

const hasNegatedToolInstruction = (prompt: string, toolPattern: RegExp): boolean => {
  const unquoted = unquotePrompt(prompt);
  const negated = /\b(?:do\s+not|don't|dont|without|no\s+need\s+to|not\s+asking\s+to|avoid)\b[\s\S]{0,100}/gi;
  for (const match of unquoted.matchAll(negated)) {
    if (toolPattern.test(match[0] ?? "")) return true;
  }
  return false;
};

const cleanArgumentText = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value
    .replace(/\b(?:before|then|and\s+then)\b[\s\S]*$/i, "")
    .replace(/\.\s+(?:answer|give|explain|summari[sz]e|tell)\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+/g, "")
    .replace(/(?:,?\s+and|,?\s+or)$/i, "")
    .replace(/[.,;:!?)]*$/g, "")
    .trim();
  return cleaned && cleaned.length <= 240 ? cleaned : null;
};

const normalizeDocPath = (value: unknown): string | null => {
  const raw = readString(value);
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..") || /^[a-z]:\//i.test(normalized)) return null;
  return normalized.startsWith("docs/") ? normalized : null;
};

const readPrompt = (body: Record<string, unknown>): string | null =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt);

const readWorkspaceSnapshot = (body: Record<string, unknown>): Record<string, unknown> | null =>
  readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot);

const readWorkspaceActivePanel = (workspaceSnapshot: Record<string, unknown> | null | undefined): string | null =>
  readString(
    workspaceSnapshot?.activePanel ??
      workspaceSnapshot?.activePanelId ??
      workspaceSnapshot?.active_panel ??
      workspaceSnapshot?.active_panel_id ??
      workspaceSnapshot?.focusedPanel ??
      workspaceSnapshot?.focusedPanelId ??
      workspaceSnapshot?.focused_panel ??
      workspaceSnapshot?.focused_panel_id,
  );

const readWorkspaceActiveDocPath = (workspaceSnapshot: Record<string, unknown> | null | undefined): string | null =>
  normalizeDocPath(
    workspaceSnapshot?.activeDocPath ??
      workspaceSnapshot?.activeDocumentPath ??
      workspaceSnapshot?.active_doc_path ??
      workspaceSnapshot?.active_document_path ??
      workspaceSnapshot?.docContextPath ??
      workspaceSnapshot?.doc_context_path,
  );

const hasNegatedOrContextualReadAloudDocOutcome = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (
    hasNegatedToolInstruction(
      prompt,
      /\b(?:read\s+aloud|speak|speak\s+out\s+loud|narrator|voice|voice\s+lane|audio|playback|doc|document|paper|white\s*paper|whitepaper)\b/i,
    )
  ) {
    return true;
  }
  return (
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,140}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,140}\b(?:read\s+aloud|speak|narrator|voice)\b/i.test(unquoted) ||
    /\b(?:explain|describe|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,120}\b(?:read\s+aloud|speak|narrator|voice)\b[\s\S]{0,120}\b(?:mean|means|do|does|is|are|would)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|would|could|might)\b[\s\S]{0,140}\b(?:read\s+aloud|speak|narrator|voice)\b/i.test(unquoted)
  );
};

const extractReadAloudNamedDocQuery = (prompt: string): string | null => {
  const unquoted = unquotePrompt(prompt);
  const named =
    unquoted.match(/\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice)\b[\s\S]{0,120}\bparts?\s+of\s+(?:the\s+)?([^.;\n]{3,120}?\b(?:doc|document|paper|white\s*paper|whitepaper))\b/i)?.[1] ??
    unquoted.match(/\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice)\b[\s\S]{0,120}\b(?:the\s+)?([^.;\n]{3,120}?\b(?:doc|document|paper|white\s*paper|whitepaper))\b/i)?.[1] ??
    null;
  if (!named) return null;
  const cleaned = cleanArgumentText(named.replace(/\b(?:this|current|open|active|visible)\b/gi, " "));
  if (!cleaned || /^(?:doc|document|paper|white\s*paper|whitepaper)$/i.test(cleaned)) return null;
  return cleaned;
};

const isReadAloudDocOutcomePrompt = (prompt: string): boolean => {
  if (hasNegatedOrContextualReadAloudDocOutcome(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  const wantsVoiceRead =
    /\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice\s+(?:read|say|speak)|say\s+out\s+loud)\b/i.test(unquoted);
  const mentionsDoc =
    /\b(?:this|current|open|active|visible|named)\b[\s\S]{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquoted) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquoted) ||
    Boolean(extractReadAloudNamedDocQuery(prompt));
  return wantsVoiceRead && mentionsDoc;
};

const isReadAloudCalculatorSurfacePrompt = (prompt: string): boolean => {
  if (hasNegatedOrContextualReadAloudDocOutcome(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  const wantsVoiceRead =
    /\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice\s+(?:read|say|speak)|say\s+out\s+loud)\b/i.test(unquoted);
  const mentionsCalculator =
    /\b(?:current|visible|active|latest|last)\b[\s\S]{0,80}\b(?:calculator|calculation|result|answer)\b/i.test(unquoted) ||
    /\b(?:calculator|scientific\s+calculator)\b[\s\S]{0,80}\b(?:result|answer)\b/i.test(unquoted);
  return wantsVoiceRead && mentionsCalculator;
};

const isTranslationSurfacePrompt = (prompt: string): boolean =>
  isExistingTranslationSurfaceReadPrompt(prompt);

const hasExplicitDocsOrRepoCapabilityMention = (prompt: string): boolean =>
  /\b(?:docs\.search|repo\.search|docs-viewer\.(?:search_docs|locate_in_doc|summarize_doc)|repo-code\.search_concept)\b/i.test(
    unquotePrompt(prompt),
  );

const hasExplicitCompoundPlannerCapabilityMention = (prompt: string): boolean =>
  /\b(?:docs\.search|repo\.search|scientific-calculator\.solve_expression|theory-badge-graph\.reflect_discussion_context|civilization-bounds\.reflect_system_bounds|internet-search\.search_web|scholarly-research\.(?:lookup_papers|fetch_full_text|extract_numeric_parameters))\b/i.test(
    unquotePrompt(prompt),
  );

const hasNegatedOrContextualRepoDocOutcome = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (hasNegatedToolInstruction(prompt, /\b(?:repo|repository|code|source|implementation|docs?|document|paper|search)\b/i)) {
    return true;
  }
  return (
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,140}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,140}\b(?:repo|docs?|document|search)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|would|could|might)\b[\s\S]{0,140}\b(?:repo|docs?|document|search)\b/i.test(unquoted)
  );
};

const isInspectRepoAndDocOutcomePrompt = (prompt: string): boolean => {
  if (hasExplicitDocsOrRepoCapabilityMention(prompt)) return false;
  if (hasNegatedOrContextualRepoDocOutcome(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  if (/\b(?:calculator|calculate|compute|evaluate|solve|expression)\b/i.test(unquoted)) return false;
  const wantsComparison =
    /\b(?:compare|distinguish|cross[-\s]?check|correlate|line\s+up|contrast|inspect|use|combine)\b/i.test(unquoted);
  const mentionsRepo =
    /\b(?:repo|repository|codebase|source\s+code|implementation|where\s+(?:is|are).+\b(?:implemented|defined|handled))\b/i.test(unquoted);
  const mentionsDocs =
    /\b(?:this|current|open|active|visible)\b[\s\S]{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquoted) ||
    /\b(?:docs?|document|paper|white\s*paper|whitepaper|document\s+evidence)\b/i.test(unquoted);
  return wantsComparison && mentionsRepo && mentionsDocs;
};

const extractRepoSearchQuery = (prompt: string): string => {
  const unquoted = unquotePrompt(prompt);
  const exact =
    unquoted.match(/\b(?:repo|repository|codebase|source\s+code|implementation)\b[\s\S]{0,100}\b(?:for|about|on)\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    unquoted.match(/\b(?:where\s+(?:is|are)|implementation\s+(?:for|of))\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    null;
  return cleanArgumentText(exact) ?? cleanArgumentText(prompt) ?? prompt.slice(0, 160);
};

const extractCalculatorExpression = (prompt: string): string | null => {
  if (hasNegatedToolInstruction(prompt, /\b(?:calculator|calculate|compute|evaluate|solve|expression)\b/i)) return null;
  const unquoted = unquotePrompt(prompt);
  const percentOf = unquoted.match(/\b(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)\b/i);
  if (percentOf?.[1] && percentOf?.[2]) {
    return `${percentOf[1]}% of ${percentOf[2]}`;
  }
  const explicitCalculatorCue = /\b(?:calculator|calculate|compute|evaluate|solve|expression|scalar|sanity\s+check)\b/i.test(unquoted);
  const direct =
    unquoted.match(/\b(?:calculate|compute|evaluate|solve)\s+([0-9][0-9\s+*/().^%-]{1,120}[0-9)]?)/i)?.[1] ??
    unquoted.match(/\b(?:expression|scalar|sanity\s+check)\s+([0-9][0-9\s+*/().^%-]{1,120}[0-9)]?)/i)?.[1] ??
    unquoted.match(/\b([0-9]+(?:\s*[+*/^%-]\s*[0-9]+)+)\b/)?.[1] ??
    null;
  const cleaned = direct?.replace(/\s+/g, "").replace(/[^0-9+*/().^%-]/g, "").replace(/[.]+$/g, "") ?? "";
  if (!cleaned || !/[+*/^%-]/.test(cleaned)) return null;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleaned)) return null;
  if (!explicitCalculatorCue && !/[+*/^%]/.test(cleaned)) return null;
  return cleaned;
};

const hasDocumentEvidenceIntent = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:this|current|open|active|visible)\b[\s\S]{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquoted) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper|document\s+evidence)\b/i.test(unquoted)
  );
};

const hasScholarlyFullTextNumericChainIntent = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\bscholarly-research\.(?:fetch_full_text|extract_numeric_parameters)\b/i.test(unquoted) ||
    /\b(?:fetch\s+full\s+text|full[-\s]?text|extract\s+numeric\s+parameters?|numeric\s+parameter\s+extraction|cited\s+(?:numeric|numerical)\s+values?|paper[-\s]+backed\s+(?:numeric|numerical|formula|variable|calculator)|research[-\s]+paper\s+(?:numeric|numerical|formula|variable)\s+evidence|source[-\s]?bound\s+(?:numeric|numerical|values?|expression|calculator)|source[-\s]?backed\s+(?:numeric|numerical|values?|expression|calculator)|unit[-\s]?bearing\s+(?:numeric|numerical)\s+values?|formula\s+(?:variable\s+)?binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|calculator\s+binding)\b/i.test(unquoted)
  );
};

const buildCompoundSourceTargetIntent = (input: {
  outcome: string;
  subgoalId: string;
  targetSource: string;
  targetKind: string;
  requiredObservationKind: string;
  activePanel?: string | null;
  activeDocPath?: string | null;
  ordinal: number;
  dependencyEdges?: Record<string, unknown>[];
}): Record<string, unknown> => ({
  source: "helix_compound_capability_dependency_planner",
  compound_outcome: input.outcome,
  subgoal_id: input.subgoalId,
  subgoal_ordinal: input.ordinal,
  target_source: input.targetSource,
  target_kind: input.targetKind,
  required_observation_kind: input.requiredObservationKind,
  dependency_edges: input.dependencyEdges ?? [],
  first_broken_rail: null,
  focused_panel: input.activePanel ?? null,
  active_doc_path: input.activeDocPath ?? null,
  terminal_eligible: false,
  assistant_answer: false,
  raw_content_included: false,
});

const readActivePanelAndDoc = (body: Record<string, unknown>): {
  activePanel: string | null;
  activeDocPath: string | null;
} => {
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  return {
    activePanel: readWorkspaceActivePanel(workspaceSnapshot),
    activeDocPath: readWorkspaceActiveDocPath(workspaceSnapshot),
  };
};

const buildSummarizeAndCalculateRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || hasExplicitCompoundPlannerCapabilityMention(prompt)) return [];
  if (hasNegatedToolInstruction(prompt, /\b(?:doc|document|calculator|calculate|compute|evaluate|solve)\b/i)) return [];
  if (!hasDocumentEvidenceIntent(prompt)) return [];
  const unquoted = unquotePrompt(prompt);
  if (
    /\b(?:repo|repository|workspace\s+os|workspace\s+status|research\s+papers?|papers?|arxiv|scholarly|internet|web|reflect|theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|civilization)\b/i.test(unquoted)
  ) {
    return [];
  }
  const expression = extractCalculatorExpression(prompt);
  if (!expression) return [];
  const { activePanel, activeDocPath } = readActivePanelAndDoc(body);
  const fileName = activeDocPath?.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const docsQuery = fileName ?? cleanArgumentText(prompt) ?? prompt.slice(0, 160);
  const outcome = SUMMARIZE_AND_CALCULATE_OUTCOME;
  const edges = [{
    from: `${outcome}:docs_evidence`,
    to: `${outcome}:calculator_scalar`,
    binding: "document_context_to_scalar_sanity_check",
  }];
  return [
    {
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:docs_evidence`,
      capability_id: DOCS_SEARCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: docsQuery,
        ...(activeDocPath ? { paths: [activeDocPath] } : {}),
        max_hits: 3,
        source_target_intent: buildCompoundSourceTargetIntent({
          outcome,
          subgoalId: `${outcome}:docs_evidence`,
          targetSource: "docs",
          targetKind: "docs_search",
          requiredObservationKind: "helix.docs_search_observation.v1",
          activePanel,
          activeDocPath,
          ordinal: 1,
          dependencyEdges: edges,
        }),
      },
    },
    {
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:calculator_scalar`,
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      mode: "read",
      arguments: {
        expression,
        source_target_intent: buildCompoundSourceTargetIntent({
          outcome,
          subgoalId: `${outcome}:calculator_scalar`,
          targetSource: "scientific_calculator",
          targetKind: "calculator_solve",
          requiredObservationKind: "helix.calculator_solve_observation.v1",
          activePanel,
          activeDocPath,
          ordinal: 2,
          dependencyEdges: edges,
        }),
      },
    },
  ];
};

type PriorTheoryReflectionFormulaContext = {
  formulas: string[];
  variables: string[];
  query_terms: string[];
  source_ref: string;
};

const extractVariablesFromFormulaExpression = (expression: string): string[] => {
  const rhs = expression.includes("=") ? expression.split("=").slice(1).join("=") : expression;
  return uniqueStrings(
    Array.from(rhs.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
      .map((match) => match[0])
      .filter((symbol) => !["sqrt", "ln", "log", "sin", "cos", "tan", "exp", "abs", "min", "max"].includes(symbol.toLowerCase()))
      .filter((symbol) => !/^(?:pi|e|c|g|mu0|e_charge)$/i.test(symbol)),
  );
};

const readStringArrayField = (value: unknown): string[] =>
  readArray(value).map(readString).filter((entry): entry is string => Boolean(entry));

const readPriorTheoryReflectionFormulaContext = (body: Record<string, unknown>): PriorTheoryReflectionFormulaContext | null => {
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const context =
    readRecord(workspaceSnapshot?.latest_theory_reflection_equation_context) ??
    readRecord(workspaceSnapshot?.latestTheoryReflectionEquationContext) ??
    readRecord(workspaceSnapshot?.latest_theory_reflection_context) ??
    readRecord(workspaceSnapshot?.latestTheoryReflectionContext);
  if (!context) return null;
  const payloads = readArray(context.calculator_payloads ?? context.calculatorPayloads)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const formulas = uniqueStrings(payloads.map((entry) => readString(entry.expression)).filter((entry): entry is string => Boolean(entry)));
  if (formulas.length === 0) return null;
  const matchedBadges = readArray(context.matched_badges ?? context.matchedBadges)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const badgeTerms = uniqueStrings([
    ...payloads.flatMap((entry) => [
      readString(entry.badge_title ?? entry.badgeTitle),
      readString(entry.badge_id ?? entry.badgeId),
      ...readStringArrayField(entry.claim_boundary_notes ?? entry.claimBoundaryNotes),
    ]),
    ...matchedBadges.flatMap((entry) => [
      readString(entry.title),
      readString(entry.badge_id ?? entry.badgeId),
      ...readStringArrayField(entry.matched_equation_families ?? entry.matchedEquationFamilies),
      ...readStringArrayField(entry.matched_symbols ?? entry.matchedSymbols),
    ]),
    readString(context.summary),
    readString(context.input_prompt ?? context.inputPrompt),
  ].filter((entry): entry is string => Boolean(entry)));
  return {
    formulas,
    variables: uniqueStrings(formulas.flatMap(extractVariablesFromFormulaExpression)),
    query_terms: badgeTerms,
    source_ref: readString(context.reflection_id ?? context.reflectionId) ?? "latest_theory_reflection_equation_context",
  };
};

const hasPriorTheoryEquationAnaphora = (prompt: string, body: Record<string, unknown>): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (!/\b(?:these|this|that|the|those|above|previous)\s+(?:equations?|expressions?|formulas?|templates?)\b/i.test(unquoted)) {
    return false;
  }
  return Boolean(readPriorTheoryReflectionFormulaContext(body));
};

const isScientificImageEvidenceRefRevisionPrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:revise|update|convert|draft|postulate\s+board|postulate|candidate\s+postulate|evidence\s+refs?|cite)\b/i.test(unquoted) &&
    /\b(?:promoted|page[-\s]?grounded|exact\s+row|equation\s+row|crop\s+ref|image\s+lens|source(?:\/hash|\s+hash)?|evidence\s+depth)\b/i.test(unquoted)
  );
};

const isScientificImageExactRowRetryPrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:current|prior|previous|latest|page\s*\d+|crop\s+ref|image\s+lens|sidecar|equation\s+candidate|page[-\s]?level\s+candidate)\b/i.test(unquoted) &&
    /\b(?:re-?crop|crop|retry|promote|exact\s+row|equation\s+row|exact\s+equation\s+admissibility)\b/i.test(unquoted) &&
    /\b(?:single[-\s]?line|non[-\s]?truncated|latex|supports\s+exact\s+equation|equation\s*\(?\d{1,3}\)?|bbox|source\s+id)\b/i.test(unquoted)
  );
};

const isResearchQuantifyReflectPrompt = (prompt: string, body: Record<string, unknown>): boolean => {
  if (isScientificImageEvidenceRefRevisionPrompt(prompt)) return false;
  if (isScientificImageExactRowRetryPrompt(prompt)) return false;
  if (hasDocumentEvidenceIntent(prompt) && !hasScholarlyFullTextNumericChainIntent(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  if (
    hasNegatedToolInstruction(
      prompt,
      /\b(?:research|paper|arxiv|scholarly|internet|web|calculate|compute|estimate|reflect|theory|civilization|claim\s+boundary)\b/i,
    )
  ) {
    return false;
  }
  if (
    /\b(?:later|future|eventually|hypothetically|not\s+now)\b[\s\S]{0,180}\b(?:research|papers?|arxiv|scholarly|internet|web|calculate|compute|estimate|reflect|theory\s+badge\s+graph|theory\s+graph)\b/i.test(unquoted) ||
    /\b(?:research|papers?|arxiv|scholarly|internet|web|calculate|compute|estimate|reflect|theory\s+badge\s+graph|theory\s+graph)\b[\s\S]{0,180}\b(?:later|future|eventually|hypothetically|not\s+now)\b/i.test(unquoted)
  ) {
    return false;
  }
  const wantsResearch = /\b(?:research[-\s]+papers?|research[-\s]+paper\s+evidence|paper[-\s]+backed|papers?|arxiv|scholarly|internet|web|sources?|corroborat(?:e|ion)|retrieve\s+evidence|look\s+up|cite|cited|source[-\s]?bound|source[-\s]?backed)\b/i.test(unquoted);
  const wantsQuantify = /\b(?:calculate|compute|estimate|solve|solve_expression|calculator|quantif(?:y|ication)|numeric\s+parameters?|numeric\s+values?|numerical\s+values?|numeric\s+binding|formula\s+binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|scalar|equation|expression|plug\s+into)\b/i.test(unquoted);
  const wantsReflection = /\b(?:reflect|theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|claim\s+boundary|conditions\s+of\s+the\s+civilization|social|energy|material)\b/i.test(unquoted);
  const wantsFullTextNumericChain = hasScholarlyFullTextNumericChainIntent(prompt);
  if (wantsFullTextNumericChain && !wantsReflection && !hasPriorTheoryEquationAnaphora(prompt, body)) return false;
  return wantsResearch && wantsQuantify && (wantsReflection || wantsFullTextNumericChain || hasPriorTheoryEquationAnaphora(prompt, body));
};

const requestedFormulaVariablesFromPrompt = (prompt: string): string[] => {
  const unquoted = unquotePrompt(prompt);
  const variables = ["n_m3", "T_eV", "B_T"].filter((variable) =>
    new RegExp(`\\b${variable.replace(/_/g, "[_\\s-]?")}\\b`, "i").test(prompt)
  );
  if (/\bn[_\s-]?1\b|\bn1\b/i.test(unquoted)) variables.push("n1_m3");
  if (/\bn[_\s-]?2\b|\bn2\b/i.test(unquoted)) variables.push("n2_m3");
  if (/<\s*sigma\s*v\s*>|\bsigma\s*v\b|\breactivit(?:y|ies)\b/i.test(unquoted)) variables.push("sigma_v_m3_s");
  if (/\b(?:cross[-\s]?section|sigma[_\s-]?m2|sigma\s*\()/i.test(unquoted)) variables.push("sigma_m2");
  if (/\bE[_\s-]?f\b|\benergy\s+released\s+per\s+(?:fusion\s+)?reaction\b|\bfusion\s+energy\s+release\b/i.test(unquoted)) variables.push("E_f_J");
  return Array.from(new Set(variables));
};

type VariableSourcePlanEntry = {
  variable: string;
  canonical_quantity: string;
  expected_unit: string | null;
  role:
    | "formula_input"
    | "constant"
    | "derived_quantity"
    | "control_parameter"
    | "geometry"
    | "metric_requirement"
    | "source_model";
  source_classes: string[];
  search_terms: string[];
  extraction_aliases: string[];
};

type VariableSourcePlan = {
  schema: "helix.variable_source_plan.v1";
  source: "helix_compound_capability_dependency_planner";
  formula_variables: string[];
  prior_theory_formula_context?: {
    schema: "helix.prior_theory_formula_context.v1";
    source_ref: string;
    formulas: string[];
    variables: string[];
    query_terms: string[];
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
  };
  entries: VariableSourcePlanEntry[];
  query_terms: string[];
  retrieval_intent: string;
  assistant_answer: false;
  raw_content_included: false;
};

type SourceRequirementPlan = {
  schema: "helix.source_requirement_plan.v1";
  source: "helix_compound_capability_dependency_planner";
  compound_outcome: typeof RESEARCH_QUANTIFY_REFLECT_OUTCOME;
  source_target: "scholarly_research" | "internet" | "mixed_research";
  reasoning_order: string[];
  claim_or_task: string;
  evidence_requirements: Array<{
    requirement_id: string;
    kind: string;
    source_classes: string[];
    required_observation_kind: string;
    required_affordance_kinds: string[];
    terminal_eligible: false;
  }>;
  retrieval_strategy: {
    schema: "helix.retrieval_strategy.v1";
    query_terms: string[];
    avoid_literal_placeholders_only: boolean;
    prefer_sources_with: string[];
    fallback_behavior: "explain_missing_evidence_or_requery";
    assistant_answer: false;
    raw_content_included: false;
  };
  reentry_requirements: {
    observation_reentry_required: true;
    model_followup_required_before_terminal: true;
    calculator_requires_bound_expression: true;
    fail_closed_before_claim_without_required_evidence: true;
  };
  hard_gates: string[];
  variable_source_plan?: VariableSourcePlan;
  assistant_answer: false;
  raw_content_included: false;
};

const variableSourcePlanEntry = (variable: string): VariableSourcePlanEntry => {
  const normalized = normalizeVariableLabel(variable);
  if (normalized === "nm3") {
    return {
      variable,
      canonical_quantity: "electron_or_plasma_number_density",
      expected_unit: "m^-3",
      role: "formula_input",
      source_classes: [
        "tokamak operating parameters",
        "plasma parameter table",
        "transport experiment table",
        "density profile diagnostics",
      ],
      search_terms: [
        "electron density",
        "plasma density",
        "number density",
        "line averaged density",
        "m^-3",
        "10^19 m^-3",
        "10^20 m^-3",
      ],
      extraction_aliases: ["n_e", "ne", "density", "electron density", "plasma density", "number density"],
    };
  }
  if (/^n\d*m3$/.test(normalized)) {
    return {
      variable,
      canonical_quantity: "reactant_or_species_number_density",
      expected_unit: "m^-3",
      role: "formula_input",
      source_classes: [
        "fusion plasma parameter table",
        "reactant density diagnostic",
        "thermonuclear reaction rate model",
        "nuclear reaction experiment setup",
      ],
      search_terms: [
        "reactant number density",
        "ion density",
        "plasma density",
        "fuel density",
        "m^-3",
        "fusion plasma parameters",
      ],
      extraction_aliases: [variable, "n1", "n2", "reactant density", "ion density", "plasma density", "number density"],
    };
  }
  if (normalized === "tev") {
    return {
      variable,
      canonical_quantity: "electron_temperature_energy",
      expected_unit: "eV",
      role: "formula_input",
      source_classes: [
        "tokamak operating parameters",
        "temperature profile diagnostics",
        "transport experiment table",
        "plasma parameter table",
      ],
      search_terms: ["electron temperature", "ion temperature", "temperature profile", "eV", "keV"],
      extraction_aliases: ["T_e", "Te", "electron temperature", "temperature", "ion temperature"],
    };
  }
  if (normalized === "bt") {
    return {
      variable,
      canonical_quantity: "toroidal_or_background_magnetic_field",
      expected_unit: "T",
      role: "formula_input",
      source_classes: [
        "tokamak operating parameters",
        "machine parameter table",
        "magnetic confinement parameters",
      ],
      search_terms: ["toroidal magnetic field", "magnetic field", "B_t", "B0", "tesla", "T"],
      extraction_aliases: ["B_T", "Bt", "B_t", "magnetic field", "toroidal magnetic field"],
    };
  }
  if (normalized === "sigmam2") {
    return {
      variable,
      canonical_quantity: "nuclear_reaction_cross_section",
      expected_unit: "m^2",
      role: "formula_input",
      source_classes: [
        "fusion cross-section data",
        "nuclear reaction rate paper",
        "Maxwellian-averaged reactivity table",
        "reaction cross-section measurement",
      ],
      search_terms: [
        "fusion cross section",
        "reaction cross section",
        "thermonuclear reaction rate",
        "Maxwellian averaged reactivity",
        "sigma v",
        "m^2",
      ],
      extraction_aliases: [variable, "sigma", "cross section", "reaction cross section", "fusion cross section"],
    };
  }
  if (normalized === "vms") {
    return {
      variable,
      canonical_quantity: "reactant_relative_velocity",
      expected_unit: "m/s",
      role: "formula_input",
      source_classes: [
        "thermal velocity model",
        "fusion reactivity model",
        "reaction-rate calculation",
        "plasma kinetic parameter table",
      ],
      search_terms: [
        "relative velocity",
        "thermal velocity",
        "reactant velocity",
        "fusion reactivity",
        "sigma v",
        "m/s",
      ],
      extraction_aliases: [variable, "v", "relative velocity", "thermal velocity", "reactant velocity"],
    };
  }
  if (normalized === "sigmavm3s") {
    return {
      variable,
      canonical_quantity: "maxwellian_averaged_fusion_reactivity",
      expected_unit: "m^3/s",
      role: "formula_input",
      source_classes: [
        "Maxwellian-averaged reactivity table",
        "fusion reaction rate coefficient paper",
        "D-T fusion reactivity fit",
        "nuclear reaction rate model",
      ],
      search_terms: [
        "Maxwellian averaged reactivity",
        "fusion reactivity",
        "reaction rate coefficient",
        "sigma v",
        "D T fusion",
        "m^3/s",
      ],
      extraction_aliases: [variable, "<sigma v>", "sigma v", "reactivity", "reaction rate coefficient"],
    };
  }
  if (normalized === "efj") {
    return {
      variable,
      canonical_quantity: "fusion_energy_released_per_reaction",
      expected_unit: "J",
      role: "formula_input",
      source_classes: [
        "fusion reaction energy table",
        "nuclear reaction data",
        "D-T fusion reaction reference",
      ],
      search_terms: [
        "fusion energy released per reaction",
        "D T fusion energy",
        "17.6 MeV",
        "reaction energy",
        "MeV",
        "J",
      ],
      extraction_aliases: [variable, "E_f", "fusion energy", "reaction energy", "energy released per reaction"],
    };
  }
  if (normalized === "t00wallrequired") {
    return {
      variable,
      canonical_quantity: "required_wall_stress_energy_density",
      expected_unit: "J/m^3",
      role: "metric_requirement",
      source_classes: [
        "metric ansatz",
        "Einstein field equation calculation",
        "NHM2 solve output",
        "adapter trace reporting required wall energy density",
      ],
      search_terms: ["stress energy density", "wall energy density", "metric ansatz", "Einstein field equation"],
      extraction_aliases: ["T00_wall_required", "T00", "stress energy density", "wall energy density"],
    };
  }
  if (normalized === "t00wallavailable") {
    return {
      variable,
      canonical_quantity: "available_wall_or_source_energy_density",
      expected_unit: "J/m^3",
      role: "source_model",
      source_classes: [
        "physical source model",
        "achievable field energy density",
        "plasma pressure estimate",
        "magnetic confinement parameters",
        "Casimir cavity geometry",
        "pulse duty cycle",
      ],
      search_terms: ["field energy density", "plasma pressure", "magnetic pressure", "Casimir cavity", "duty cycle"],
      extraction_aliases: ["T00_wall_available", "available energy density", "field energy density", "plasma pressure"],
    };
  }
  if (["dburst", "dcycle", "nconcurrent", "nsector"].includes(normalized)) {
    return {
      variable,
      canonical_quantity: "control_or_scheduling_parameter",
      expected_unit: null,
      role: "control_parameter",
      source_classes: ["actuator timing plan", "tile sector layout", "pulse train design", "hardware concurrency limit"],
      search_terms: ["pulse duration", "duty cycle", "concurrent sectors", "sector layout"],
      extraction_aliases: [variable, variable.replace(/_/g, " ")],
    };
  }
  if (["l", "r"].includes(normalized)) {
    return {
      variable,
      canonical_quantity: "geometry_or_observation_scale",
      expected_unit: "m",
      role: "geometry",
      source_classes: ["device geometry", "cavity dimension", "observation distance", "experimental setup"],
      search_terms: ["cavity length", "device geometry", "observation distance", "m"],
      extraction_aliases: [variable, "length", "radius", "distance"],
    };
  }
  if (["echarge", "mu0", "g", "c", "pi", "e"].includes(normalized)) {
    return {
      variable,
      canonical_quantity: "standard_physical_constant",
      expected_unit: null,
      role: "constant",
      source_classes: ["standard physical constant"],
      search_terms: [variable],
      extraction_aliases: [variable],
    };
  }
  return {
    variable,
    canonical_quantity: variable,
    expected_unit: null,
    role: "formula_input",
    source_classes: ["paper parameter table", "experiment setup", "simulation input table"],
    search_terms: [variable.replace(/_/g, " "), variable],
    extraction_aliases: [variable, variable.replace(/_/g, " ")],
  };
};

const defaultFormulaVariablesForPrompt = (prompt: string, requestedVariables: string[], wantsFullTextNumericChain: boolean): string[] => {
  if (requestedVariables.length > 0) return requestedVariables;
  const unquoted = unquotePrompt(prompt);
  const mentionsTokamakPlasmaFormula =
    /\b(?:tokamak|plasma\s+beta|thermal\s+pressure|magnetic\s+pressure|transport|magnetic\s+confinement)\b/i.test(unquoted);
  if (wantsFullTextNumericChain && mentionsTokamakPlasmaFormula) return ["n_m3", "T_eV", "B_T"];
  const mentionsFusionPowerDensity =
    /\b(?:fusion\s+power\s+density|P[_\s-]?f|reactant\s+densit|sigma\s*v|reactivit(?:y|ies)|D[-\s]?T|deuterium\s+tritium)\b/i.test(unquoted);
  if (wantsFullTextNumericChain && mentionsFusionPowerDensity) return ["n1_m3", "n2_m3", "sigma_v_m3_s", "E_f_J"];
  return [];
};

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));

const buildVariableSourcePlan = (
  prompt: string,
  requestedVariables: string[],
  wantsFullTextNumericChain: boolean,
  priorTheoryFormulaContext?: PriorTheoryReflectionFormulaContext | null,
): VariableSourcePlan | null => {
  const variables = defaultFormulaVariablesForPrompt(prompt, requestedVariables, wantsFullTextNumericChain);
  if (variables.length === 0) return null;
  const entries = variables.map(variableSourcePlanEntry);
  const promptTerms: string[] = [];
  const unquoted = unquotePrompt(prompt);
  if (/\btokamak\b/i.test(unquoted)) promptTerms.push("tokamak");
  if (/\bplasma\s+beta\b/i.test(unquoted)) promptTerms.push("plasma beta");
  if (/\bfusion|thermonuclear|nuclear\s+reaction\b/i.test([unquoted, ...(priorTheoryFormulaContext?.query_terms ?? [])].join(" "))) {
    promptTerms.push("fusion", "thermonuclear reaction rate");
  }
  if (/\btransport\b/i.test(unquoted)) promptTerms.push("transport");
  if (/\b(?:parameter|operating)\s+table\b/i.test(unquoted)) promptTerms.push("parameter table");
  const sourceClassTerms = entries.flatMap((entry) => entry.source_classes);
  const primaryQuantityTerms = entries.flatMap((entry) => entry.search_terms.slice(0, 1));
  const quantityTerms = entries.flatMap((entry) => entry.search_terms);
  const queryTerms = uniqueStrings([
    ...promptTerms,
    "parameter table",
    "operating point",
    ...(priorTheoryFormulaContext?.query_terms.slice(0, 10) ?? []),
    ...primaryQuantityTerms,
    ...sourceClassTerms,
    ...quantityTerms,
  ]).slice(0, 28);
  return {
    schema: "helix.variable_source_plan.v1",
    source: "helix_compound_capability_dependency_planner",
    formula_variables: variables,
    ...(priorTheoryFormulaContext ? {
      prior_theory_formula_context: {
        schema: "helix.prior_theory_formula_context.v1",
        source_ref: priorTheoryFormulaContext.source_ref,
        formulas: priorTheoryFormulaContext.formulas,
        variables: priorTheoryFormulaContext.variables,
        query_terms: priorTheoryFormulaContext.query_terms,
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
      },
    } : {}),
    entries,
    query_terms: queryTerms,
    retrieval_intent:
      "Find papers that report unit-bearing physical quantities needed to bind the formula variables, not papers that literally mention the variable placeholders.",
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildScholarlyVariableSourceQuery = (prompt: string, plan: VariableSourcePlan | null): string => {
  if (!plan) return cleanArgumentText(prompt) ?? prompt.slice(0, 160);
  return plan.query_terms.join(" ").slice(0, 240);
};

const sourceRequirementClaimOrTask = (prompt: string): string =>
  cleanArgumentText(prompt)?.slice(0, 180) ?? prompt.replace(/\s+/g, " ").trim().slice(0, 180);

const buildSourceRequirementPlan = (input: {
  prompt: string;
  outcome: typeof RESEARCH_QUANTIFY_REFLECT_OUTCOME;
  wantsScholarly: boolean;
  wantsInternet: boolean;
  variableSourcePlan: VariableSourcePlan | null;
}): SourceRequirementPlan | null => {
  const queryTerms = input.variableSourcePlan?.query_terms ?? uniqueStrings([
    ...(cleanArgumentText(input.prompt)?.split(/\s+/).slice(0, 18) ?? []),
    input.wantsScholarly ? "scholarly evidence" : "",
    input.wantsInternet ? "web source" : "",
  ]);
  if (queryTerms.length === 0) return null;
  const variableSourceClasses = input.variableSourcePlan
    ? uniqueStrings(input.variableSourcePlan.entries.flatMap((entry) => entry.source_classes))
    : [];
  const sourceClasses = variableSourceClasses.length
    ? variableSourceClasses
    : input.wantsScholarly
      ? ["scholarly paper", "accessible full text", "citation evidence"]
      : ["web source", "online source", "citation evidence"];
  const sourceTarget = input.wantsScholarly && input.wantsInternet
    ? "mixed_research"
    : input.wantsInternet
      ? "internet"
      : "scholarly_research";
  return {
    schema: "helix.source_requirement_plan.v1",
    source: "helix_compound_capability_dependency_planner",
    compound_outcome: input.outcome,
    source_target: sourceTarget,
    reasoning_order: [
      "interpret_user_goal",
      "identify_claim_or_calculation",
      "derive_evidence_requirements",
      "build_retrieval_strategy",
      "model_selects_next_admitted_tool_step",
      "normalize_observations",
      "reenter_model_with_evidence",
      "answer_or_fail_closed_after_terminal_authority",
    ],
    claim_or_task: sourceRequirementClaimOrTask(input.prompt),
    evidence_requirements: [
      {
        requirement_id: "retrieved_source_evidence",
        kind: input.wantsScholarly ? "scholarly_source_ref" : "source_ref",
        source_classes: sourceClasses,
        required_observation_kind: input.wantsScholarly
          ? "helix.scholarly_research_observation.v1"
          : "helix.internet_search_observation.v1",
        required_affordance_kinds: input.wantsScholarly
          ? ["source_ref", "citation_evidence"]
          : ["source_ref", "citation_evidence"],
        terminal_eligible: false,
      },
      ...(input.variableSourcePlan ? [{
        requirement_id: "formula_variable_numeric_evidence",
        kind: "numeric_value_evidence",
        source_classes: sourceClasses,
        required_observation_kind: "helix.scholarly_numeric_parameter_observation.v1",
        required_affordance_kinds: ["text_evidence", "citation_evidence", "numeric_value_evidence"],
        terminal_eligible: false as const,
      }] : []),
    ],
    retrieval_strategy: {
      schema: "helix.retrieval_strategy.v1",
      query_terms: queryTerms,
      avoid_literal_placeholders_only: Boolean(input.variableSourcePlan),
      prefer_sources_with: uniqueStrings([
        ...(input.variableSourcePlan ? ["unit-bearing values", "parameter table", "operating point"] : []),
        ...sourceClasses.slice(0, 8),
      ]),
      fallback_behavior: "explain_missing_evidence_or_requery",
      assistant_answer: false,
      raw_content_included: false,
    },
    reentry_requirements: {
      observation_reentry_required: true,
      model_followup_required_before_terminal: true,
      calculator_requires_bound_expression: true,
      fail_closed_before_claim_without_required_evidence: true,
    },
    hard_gates: [
      "tools_produce_observations_not_answers",
      "retrieval_mismatch_is_not_calculator_evidence",
      "calculator_requires_fully_bound_source_backed_expression",
      "terminal_answer_requires_post_observation_reasoning",
    ],
    ...(input.variableSourcePlan ? { variable_source_plan: input.variableSourcePlan } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
};

const compoundRequestNextAffordance = (
  request: Record<string, unknown>,
  priority: number,
): Record<string, unknown> | null => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  if (!capability) return null;
  const args = readRecord(request.arguments) ?? {};
  const sourceTargetIntent = readRecord(args.source_target_intent);
  return {
    schema: "helix.provider_next_affordance.v1",
    source: "helix_compound_capability_dependency_planner",
    capability,
    mode: readString(request.mode) ?? "read",
    priority,
    purpose:
      readString(sourceTargetIntent?.dependency_binding) ??
      readString(sourceTargetIntent?.target_kind) ??
      "codex_selected_followup_tool",
    reason: "available_after_observation_reentry",
    subgoal_id: readString(request.subgoal_id) ?? readString(sourceTargetIntent?.subgoal_id),
    required_observation_kind: readString(sourceTargetIntent?.required_observation_kind),
    required_affordance_kinds: readArray(sourceTargetIntent?.required_affordance_kinds),
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
  };
};

const attachNextAffordancesToRequest = (
  request: Record<string, unknown>,
  nextRequests: Record<string, unknown>[],
): Record<string, unknown> => {
  const nextAffordances = nextRequests
    .map((entry, index) => compoundRequestNextAffordance(entry, index + 1))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (nextAffordances.length === 0) return request;
  const args = readRecord(request.arguments) ?? {};
  const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
  return {
    ...request,
    arguments: {
      ...args,
      next_affordances: [
        ...readArray(args.next_affordances),
        ...nextAffordances,
      ],
      source_target_intent: {
        ...sourceTargetIntent,
        next_affordances: [
          ...readArray(sourceTargetIntent.next_affordances),
          ...nextAffordances,
        ],
      },
    },
  };
};

const selectPrimaryResearchQuantifyRequest = (
  requests: Record<string, unknown>[],
): Record<string, unknown>[] => {
  if (requests.length <= 1) return requests;
  const priority = [
    SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
    INTERNET_SEARCH_CAPABILITY,
    THEORY_CONTEXT_REFLECTION_CAPABILITY,
    CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  ];
  const primary =
    priority
      .map((capability) => requests.find((request) => readString(request.capability_id) === capability))
      .find((request): request is Record<string, unknown> => Boolean(request)) ??
    requests[0];
  const deferred = requests.filter((request) => request !== primary);
  return [attachNextAffordancesToRequest(primary, deferred)];
};

const buildResearchQuantifyReflectRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isResearchQuantifyReflectPrompt(prompt, body)) return [];
  const expression = extractCalculatorExpression(prompt);
  const unquoted = unquotePrompt(prompt);
  const wantsScholarly = /\b(?:research\s+papers?|research[-\s]+paper\s+evidence|paper[-\s]+backed|papers?|arxiv|scholarly|doi)\b/i.test(unquoted);
  const wantsInternet = /\b(?:internet|web|current\s+sources?|online|search\s+the\s+web)\b/i.test(unquoted);
  const wantsTheory = /\b(?:reflect|theory\s+badge\s+graph|theory\s+graph|claim\s+boundary)\b/i.test(unquoted);
  const wantsCivilization = /\b(?:civilization\s+bounds?|civilization|social|energy|material|country|countries|transportation)\b/i.test(unquoted);
  const wantsFullTextNumericChain = hasScholarlyFullTextNumericChainIntent(prompt);
  const priorTheoryFormulaContext = readPriorTheoryReflectionFormulaContext(body);
  const wantsPriorTheoryEquationContext = hasPriorTheoryEquationAnaphora(prompt, body);
  const allowScholarlyDependentChain = wantsFullTextNumericChain || wantsPriorTheoryEquationContext;
  const requestedFormulaVariables = uniqueStrings([
    ...requestedFormulaVariablesFromPrompt(prompt),
    ...(wantsPriorTheoryEquationContext ? priorTheoryFormulaContext?.variables ?? [] : []),
  ]);
  const variableSourcePlan = buildVariableSourcePlan(
    prompt,
    requestedFormulaVariables,
    allowScholarlyDependentChain,
    priorTheoryFormulaContext,
  );
  const sourceRequirementPlan = buildSourceRequirementPlan({
    prompt,
    outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
    wantsScholarly,
    wantsInternet,
    variableSourcePlan,
  });
  const plannedFormulaVariables = variableSourcePlan?.formula_variables ?? requestedFormulaVariables;
  const outcome = RESEARCH_QUANTIFY_REFLECT_OUTCOME;
  const { activePanel, activeDocPath } = readActivePanelAndDoc(body);
  const edges = [
    { from: `${outcome}:scholarly_evidence`, to: `${outcome}:scholarly_full_text`, binding: "source_ref_to_full_text" },
    { from: `${outcome}:scholarly_full_text`, to: `${outcome}:numeric_parameters`, binding: "text_evidence_to_numeric_value_evidence" },
    { from: `${outcome}:numeric_parameters`, to: `${outcome}:calculator_bound_expression`, binding: "numeric_value_evidence_to_bound_calculator_expression" },
    { from: `${outcome}:calculator_estimate`, to: `${outcome}:claim_boundary_reflection`, binding: "estimate_to_claim_boundary_reflection" },
  ];
  const requests: Record<string, unknown>[] = [];
  if (wantsScholarly || !wantsInternet) {
    requests.push({
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:scholarly_evidence`,
      capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: buildScholarlyVariableSourceQuery(prompt, variableSourcePlan),
        mode: "paper_search",
        ...(plannedFormulaVariables.length ? { requested_variables: plannedFormulaVariables } : {}),
        ...(variableSourcePlan ? {
          variable_source_plan: variableSourcePlan,
          variable_source_query_terms: variableSourcePlan.query_terms,
        } : {}),
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        allow_scholarly_dependent_chain: allowScholarlyDependentChain,
        source_target_intent: {
          ...buildCompoundSourceTargetIntent({
            outcome,
            subgoalId: `${outcome}:scholarly_evidence`,
            targetSource: "scholarly_research",
            targetKind: "research_paper_search",
            requiredObservationKind: "helix.scholarly_research_observation.v1",
            activePanel,
            activeDocPath,
            ordinal: requests.length + 1,
            dependencyEdges: edges,
          }),
          ...(variableSourcePlan ? {
            variable_source_plan: variableSourcePlan,
            query_plan: {
              schema: "helix.scholarly_variable_source_query_plan.v1",
              source: "helix_compound_capability_dependency_planner",
              formula_variables: variableSourcePlan.formula_variables,
              prior_theory_formula_context: variableSourcePlan.prior_theory_formula_context ?? null,
              query_terms: variableSourcePlan.query_terms,
              source_classes: uniqueStrings(variableSourcePlan.entries.flatMap((entry) => entry.source_classes)),
              assistant_answer: false,
              raw_content_included: false,
            },
          } : {}),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
          allow_scholarly_dependent_chain: allowScholarlyDependentChain,
        },
      },
    });
  }
  if (wantsInternet) {
    requests.push({
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:internet_evidence`,
      capability_id: INTERNET_SEARCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: cleanArgumentText(prompt) ?? prompt.slice(0, 160),
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source_target_intent: {
          ...buildCompoundSourceTargetIntent({
            outcome,
            subgoalId: `${outcome}:internet_evidence`,
            targetSource: "internet",
            targetKind: "internet_search",
            requiredObservationKind: "helix.internet_search_observation.v1",
            activePanel,
            activeDocPath,
            ordinal: requests.length + 1,
            dependencyEdges: edges,
          }),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        },
      },
    });
  }
  if (expression) {
    requests.push({
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:calculator_estimate`,
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      mode: "read",
      arguments: {
        expression,
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source_target_intent: {
          ...buildCompoundSourceTargetIntent({
            outcome,
            subgoalId: `${outcome}:calculator_estimate`,
            targetSource: "scientific_calculator",
            targetKind: "calculator_solve",
            requiredObservationKind: "helix.calculator_solve_observation.v1",
            activePanel,
            activeDocPath,
            ordinal: requests.length + 1,
            dependencyEdges: edges,
          }),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        },
      },
    });
  }
  if (wantsTheory) {
    requests.push({
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:theory_reflection`,
      capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      mode: "read",
      arguments: {
        prompt,
        conversation_context: prompt,
        build_explanation_plan: true,
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source_target_intent: {
          ...buildCompoundSourceTargetIntent({
            outcome,
            subgoalId: `${outcome}:theory_reflection`,
            targetSource: "theory_badge_graph",
            targetKind: "theory_context_reflection",
            requiredObservationKind: "helix.theory_context_reflection_observation.v1",
            activePanel,
            activeDocPath,
            ordinal: requests.length + 1,
            dependencyEdges: edges,
          }),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        },
      },
    });
  }
  if (wantsCivilization) {
    requests.push({
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:civilization_bounds`,
      capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      mode: "read",
      arguments: {
        prompt,
        include_bridge_context: true,
        include_collaboration_bounds: true,
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source_target_intent: {
          ...buildCompoundSourceTargetIntent({
            outcome,
            subgoalId: `${outcome}:civilization_bounds`,
            targetSource: "civilization_bounds",
            targetKind: "civilization_bounds_reflection",
            requiredObservationKind: "helix.civilization_bounds_reflection_observation.v1",
            activePanel,
            activeDocPath,
            ordinal: requests.length + 1,
            dependencyEdges: edges,
          }),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        },
      },
    });
  }
  const eligible = requests.length >= 2 || ((wantsScholarly || !wantsInternet) && allowScholarlyDependentChain);
  return eligible ? selectPrimaryResearchQuantifyRequest(requests) : [];
};

const buildScholarlyResearchWorkflowRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (isScientificImageEvidenceRefRevisionPrompt(prompt)) return [];
  if (isResearchQuantifyReflectPrompt(prompt, body)) return [];
  const unquoted = unquotePrompt(prompt);
  if (
    /\b(?:do\s+not|don't|dont|without|avoid|not\s+asking\s+to)\b[^.!?;\n]{0,100}\b(?:retrieve|search|find|fetch|open|parse|extract|use)\b[^.!?;\n]{0,80}\b(?:research|papers?|scholarly|arxiv|doi|full[-\s]?text)\b/i.test(unquoted)
  ) {
    return [];
  }
  const intent = detectScholarlyResearchIntent(prompt);
  if (!intent.researchRequested) return [];
  if (intent.scholarlyIntent.requested_workflow === "metadata_search" || intent.scholarlyIntent.requested_workflow === "doi_lookup") {
    return [];
  }
  const { activePanel, activeDocPath } = readActivePanelAndDoc(body);
  const chainPlan = intent.plannedScholarlyCapabilityChain;
  const requestedVariables = requestedFormulaVariablesFromPrompt(prompt);
  const edges = [
    { from: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_evidence`, to: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_full_text`, binding: "selected_paper_to_full_text" },
    { from: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_full_text`, to: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:numeric_parameters`, binding: "full_text_to_numeric_values" },
    { from: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:numeric_parameters`, to: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:calculator`, binding: "numeric_values_to_calculation" },
  ];
  return [{
    schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
    derivation_source: "helix_scholarly_workflow_planner",
    compound_outcome: SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME,
    subgoal_id: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_evidence`,
    capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
    dependent_capability_id: intent.scholarlyIntent.requires_full_text ? SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY : undefined,
    mode: "read",
    arguments: {
      query: intent.normalizedQuery,
      mode: intent.mode,
      scholarly_intent: intent.scholarlyIntent,
      planned_scholarly_capability_chain: chainPlan,
      ...(requestedVariables.length > 0 ? { requested_variables: requestedVariables } : {}),
      allow_scholarly_dependent_chain: intent.scholarlyIntent.requires_full_text,
      source_target_intent: {
        ...buildCompoundSourceTargetIntent({
          outcome: SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME,
          subgoalId: `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_evidence`,
          targetSource: "scholarly_research",
          targetKind: "research_paper_search",
          requiredObservationKind: "helix.scholarly_research_observation.v1",
          activePanel,
          activeDocPath,
          ordinal: 1,
          dependencyEdges: edges,
        }),
        scholarly_intent: intent.scholarlyIntent,
        planned_scholarly_capability_chain: chainPlan,
        terminal_evidence_requirement: intent.scholarlyIntent.terminal_evidence_requirement,
      },
    },
  }];
};

const buildReadAloudSurfaceRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readWorkspaceActivePanel(workspaceSnapshot);
  const activeDocPath = readWorkspaceActiveDocPath(workspaceSnapshot);
  if (isReadAloudCalculatorSurfacePrompt(prompt)) {
    const calculatorContext =
      readRecord(workspaceSnapshot?.calculator_active_context) ??
      readRecord(workspaceSnapshot?.calculatorActiveContext) ??
      readRecord(workspaceSnapshot?.scientific_calculator) ??
      readRecord(workspaceSnapshot?.scientificCalculator) ??
      {};
    return [{
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
      subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
      capability_id: CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
      mode: "read",
      dependent_capability_id: VOICE_NARRATOR_SAY_CAPABILITY,
      arguments: {
        label: "current calculator result",
        panel_id: "scientific-calculator",
        action_id: "read_visible_result",
        active_context: calculatorContext,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scientific_calculator",
          target_kind: "calculator_visible_result",
          compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
          subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
          dependent_subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
          dependency_edges: [{
            from: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
            to: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
            binding: "surface_observation_to_voice_text",
          }],
          first_broken_rail: null,
          required_observation_kind: "helix.workstation_readable_surface_observation.v1",
          required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
          focused_panel: activePanel,
        },
      },
    }];
  }
  if (!isReadAloudDocOutcomePrompt(prompt)) return [];
  const namedDocQuery = extractReadAloudNamedDocQuery(prompt);
  const usesCurrentDoc =
    /\b(?:this|current|open|active|visible)\b[\s\S]{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotePrompt(prompt)) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper)\s+(?:on\s+screen|in\s+(?:the\s+)?docs?\s+viewer|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotePrompt(prompt));
  const pathQuery = activeDocPath?.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const query = namedDocQuery ?? (usesCurrentDoc ? pathQuery ?? activeDocPath : null);
  if (!query) return [];
  const translationBlocks =
    Array.isArray(workspaceSnapshot?.active_translation_blocks)
      ? workspaceSnapshot?.active_translation_blocks
      : Array.isArray(workspaceSnapshot?.activeTranslationBlocks)
        ? workspaceSnapshot?.activeTranslationBlocks
        : undefined;
  const translatedText = readString(workspaceSnapshot?.active_translation_text ?? workspaceSnapshot?.activeTranslationText);
  const firstTranslationBlock = Array.isArray(translationBlocks) ? readRecord(translationBlocks[0]) : null;
  const accountLocale = readString(
    workspaceSnapshot?.active_translation_account_locale ??
      workspaceSnapshot?.activeTranslationAccountLocale ??
      workspaceSnapshot?.account_locale ??
      workspaceSnapshot?.accountLocale ??
      firstTranslationBlock?.account_locale ??
      firstTranslationBlock?.accountLocale ??
      firstTranslationBlock?.locale,
  );
  const targetLanguage = readString(
    workspaceSnapshot?.active_translation_target_language ??
      workspaceSnapshot?.activeTranslationTargetLanguage ??
      workspaceSnapshot?.target_language ??
      workspaceSnapshot?.targetLanguage ??
      firstTranslationBlock?.target_language ??
      firstTranslationBlock?.targetLanguage ??
      firstTranslationBlock?.locale,
  );
  const capabilityId = isTranslationSurfacePrompt(prompt)
    ? DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
    : DOCS_READ_VISIBLE_SURFACE_CAPABILITY;
  return [{
    schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
    derivation_source: "helix_compound_capability_dependency_planner",
    compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
    subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
    capability_id: capabilityId,
    mode: "read",
    dependent_capability_id: VOICE_NARRATOR_SAY_CAPABILITY,
    arguments: {
      label: isTranslationSurfacePrompt(prompt) ? "visible translated document section" : "visible document section",
      surface: isTranslationSurfacePrompt(prompt) ? "active_translation" : "visible_document",
      source_doc_path: activeDocPath ?? undefined,
      text: isTranslationSurfacePrompt(prompt) ? translatedText : undefined,
      translation_blocks: translationBlocks,
      account_locale: isTranslationSurfacePrompt(prompt) ? accountLocale ?? undefined : undefined,
      target_language: isTranslationSurfacePrompt(prompt) ? targetLanguage ?? undefined : undefined,
      source_target_intent: {
        source: "helix_compound_capability_dependency_planner",
        target_source: "docs_viewer",
        target_kind: isTranslationSurfacePrompt(prompt) ? "docs_active_translation_surface" : "docs_visible_surface",
        compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
        subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
        dependent_subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
        dependency_edges: [{
          from: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
          to: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
          binding: "surface_observation_to_voice_text",
        }],
        first_broken_rail: null,
        required_observation_kind: "helix.workstation_readable_surface_observation.v1",
        required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
        focused_panel: activePanel,
        active_doc_path: activeDocPath ?? null,
        account_locale: isTranslationSurfacePrompt(prompt) ? accountLocale ?? null : null,
        target_language: isTranslationSurfacePrompt(prompt) ? targetLanguage ?? null : null,
        named_doc_query: namedDocQuery,
        surface_query: query,
      },
    },
  }];
};

const buildInspectRepoAndDocRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isInspectRepoAndDocOutcomePrompt(prompt)) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readWorkspaceActivePanel(workspaceSnapshot);
  const activeDocPath = readWorkspaceActiveDocPath(workspaceSnapshot);
  const fileName = activeDocPath?.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const docsQuery = fileName ?? cleanArgumentText(prompt) ?? prompt.slice(0, 160);
  const repoQuery = extractRepoSearchQuery(prompt);
  const sourceTargetIntent = {
    source: "helix_compound_capability_dependency_planner",
    compound_outcome: INSPECT_REPO_AND_DOC_OUTCOME,
    dependency_edges: [],
    first_broken_rail: null,
    focused_panel: activePanel,
    active_doc_path: activeDocPath,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  return [
    {
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: INSPECT_REPO_AND_DOC_OUTCOME,
      subgoal_id: `${INSPECT_REPO_AND_DOC_OUTCOME}:docs_evidence`,
      capability_id: DOCS_SEARCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: docsQuery,
        ...(activeDocPath ? { paths: [activeDocPath] } : {}),
        max_hits: 3,
        source_target_intent: {
          ...sourceTargetIntent,
          target_source: "docs",
          target_kind: "docs_search",
          subgoal_id: `${INSPECT_REPO_AND_DOC_OUTCOME}:docs_evidence`,
          required_observation_kind: "helix.docs_search_observation.v1",
        },
      },
    },
    {
      schema: "helix.workstation_gateway.compound_dependency_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: INSPECT_REPO_AND_DOC_OUTCOME,
      subgoal_id: `${INSPECT_REPO_AND_DOC_OUTCOME}:repo_evidence`,
      capability_id: REPO_SEARCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: repoQuery,
        source_target_intent: {
          ...sourceTargetIntent,
          target_source: "repo_code",
          target_kind: "repo_search",
          subgoal_id: `${INSPECT_REPO_AND_DOC_OUTCOME}:repo_evidence`,
          required_observation_kind: "helix.repo_search_observation.v1",
        },
      },
    },
  ];
};

export const buildCompoundCapabilityDependencyGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => [
  ...buildReadAloudSurfaceRequests(body),
  ...buildInspectRepoAndDocRequests(body),
  ...buildSummarizeAndCalculateRequests(body),
  ...buildScholarlyResearchWorkflowRequests(body),
  ...buildResearchQuantifyReflectRequests(body),
];

const READABLE_SURFACE_CAPABILITIES = new Set<string>([
  READABLE_SURFACE_OBSERVE_CAPABILITY,
  DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
  DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
  CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
]);

const CALCULATOR_TEMPLATE_CONSTANTS: Record<string, string> = {
  e_charge: "1.602176634e-19",
  mu0: "1.25663706212e-6",
  pi: "3.141592653589793",
  e: "2.718281828459045",
};

const CALCULATOR_FUNCTIONS = new Set(["sqrt", "ln", "log", "sin", "cos", "tan"]);

const calculatorTemplateVariables = (expression: string): string[] => {
  const rightHandSide = expression.includes("=") ? expression.split("=").slice(1).join("=") : expression;
  return Array.from(new Set(
    Array.from(rightHandSide.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
      .map((match) => match[0])
      .filter((symbol) => !CALCULATOR_TEMPLATE_CONSTANTS[symbol])
      .filter((symbol) => !CALCULATOR_FUNCTIONS.has(symbol)),
  ));
};

const calculatorExpressionRhs = (expression: string): string =>
  (expression.includes("=") ? expression.split("=").slice(1).join("=") : expression).trim();

const normalizeVariableLabel = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const aliasesForCalculatorVariable = (variable: string): string[] => {
  const normalized = normalizeVariableLabel(variable);
  const aliases = new Set<string>([
    variable,
    variable.replace(/_/g, " "),
    variable.replace(/_/g, ""),
  ]);
  if (normalized === "nm3") {
    aliases.add("n_m3");
    aliases.add("electron density");
    aliases.add("number density");
    aliases.add("density");
  }
  if (normalized === "tev") {
    aliases.add("T_eV");
    aliases.add("electron temperature");
    aliases.add("temperature");
  }
  if (normalized === "ploss") {
    aliases.add("P_loss");
    aliases.add("power loss");
    aliases.add("loss power");
  }
  if (normalized === "taue") {
    aliases.add("tau_E");
    aliases.add("energy confinement time");
    aliases.add("confinement time");
  }
  return Array.from(aliases).filter((entry) => entry.trim().length > 0);
};

const inferredUnitForCalculatorVariable = (variable: string): string | null => {
  const normalized = normalizeVariableLabel(variable);
  if (normalized === "nm3") return "m^-3";
  if (normalized === "tev") return "eV";
  if (normalized === "ploss") return "W";
  if (normalized === "taue") return "s";
  return null;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const NUMERIC_TEXT_PATTERN = "[-+]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[-+]?\\d+)?";

type CalculatorNumericBinding = {
  variable: string;
  value: string;
  unit: string;
  source_ref: string;
  evidence_text: string;
};

type CalculatorExpressionTemplate = {
  expression: string;
  source_refs: string[];
  required_inputs: string[];
};

type CalculatorBindingResult = {
  schema: "helix.compound_typed_affordance_binding.v1";
  status: "bound" | "blocked";
  template: CalculatorExpressionTemplate | null;
  bound_expression: string | null;
  normalized_expression: string | null;
  variable_bindings: CalculatorNumericBinding[];
  missing_variables: string[];
  selected_affordances: Record<string, unknown>[];
  rejected_expression: string | null;
  reason: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

const readProducedAffordanceRecords = (result: HelixWorkstationGatewayCallResult): Record<string, unknown>[] => [
  ...readArray(result.produced_affordances).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry)),
  ...readArray(result.observation_packet.produced_affordances).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry)),
];

const calculatorTemplatesFromResult = (result: HelixWorkstationGatewayCallResult): CalculatorExpressionTemplate[] => {
  const affordanceTemplates = readProducedAffordanceRecords(result)
    .filter((affordance) => readString(affordance.kind) === "calculator_expression_template")
    .map((affordance): CalculatorExpressionTemplate | null => {
      const expression = readString(affordance.expression);
      if (!expression) return null;
      const requiredInputs = readArray(affordance.required_inputs)
        .map(readString)
        .filter((entry): entry is string => Boolean(entry));
      return {
        expression,
        source_refs: readArray(affordance.source_refs)
          .map(readString)
          .filter((entry): entry is string => Boolean(entry)),
        required_inputs: requiredInputs.length ? requiredInputs : calculatorTemplateVariables(expression),
      };
    })
    .filter((entry): entry is CalculatorExpressionTemplate => Boolean(entry));
  const observation = readRecord(result.observation);
  const payloadTemplates = readArray(observation?.calculator_payloads)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((payload): CalculatorExpressionTemplate | null => {
      const expression = readString(payload.expression);
      if (!expression) return null;
      return {
        expression,
        source_refs: [
          readString(payload.badge_id),
          readString(payload.payload_id),
        ].filter((entry): entry is string => Boolean(entry)),
        required_inputs: calculatorTemplateVariables(expression),
      };
    })
    .filter((entry): entry is CalculatorExpressionTemplate => Boolean(entry));
  const all = [...affordanceTemplates, ...payloadTemplates];
  const seen = new Set<string>();
  return all.filter((template) => {
    const key = template.expression;
    if (seen.has(key)) return false;
    seen.add(key);
    return template.required_inputs.length > 0;
  });
};

const evidenceSourceRefForRecord = (
  result: HelixWorkstationGatewayCallResult,
  record: Record<string, unknown>,
): string =>
  readString(record.url) ??
  readString(record.source_ref) ??
  readString(record.ref) ??
  readString(record.paper_id) ??
  readString(record.id) ??
  result.observation_packet.produced_artifact_refs[0] ??
  `${result.capability_id}:observation`;

const textEvidenceRowsFromResult = (result: HelixWorkstationGatewayCallResult): Array<{
  text: string;
  source_ref: string;
}> => {
  const observation = readRecord(result.observation);
  if (!observation) return [];
  const rows: Array<{ text: string; source_ref: string }> = [];
  const pushRecord = (record: Record<string, unknown> | null): void => {
    if (!record) return;
    const parts = [
      readString(record.title),
      readString(record.content),
      readString(record.abstract),
      readString(record.summary),
      readString(record.text),
      readString(record.excerpt),
      readString(record.snippet),
    ].filter((entry): entry is string => Boolean(entry));
    const text = parts.join(" ").replace(/\s+/g, " ").trim();
    if (!text) return;
    rows.push({
      text,
      source_ref: evidenceSourceRefForRecord(result, record),
    });
  };
  pushRecord(observation);
  pushRecord(readRecord(observation.active_document_observation));
  for (const key of ["results", "papers", "hits", "evidence_observations", "document_candidates"]) {
    for (const entry of readArray(observation[key]).map(readRecord)) {
      pushRecord(entry);
      for (const nestedKey of ["best_snippets", "snippets", "matches"]) {
        for (const nested of readArray(entry?.[nestedKey]).map(readRecord)) pushRecord(nested);
      }
    }
  }
  return rows.slice(0, 80);
};

const numericBindingsFromResult = (result: HelixWorkstationGatewayCallResult): CalculatorNumericBinding[] => {
  const observation = readRecord(result.observation);
  if (!observation) return [];
  return readArray(observation.parameters)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((parameter): CalculatorNumericBinding | null => {
      const variable = readString(parameter.variable);
      const value = typeof parameter.normalized_value === "number"
        ? String(parameter.normalized_value)
        : readString(parameter.normalized_value) ?? readString(parameter.value);
      const unit = readString(parameter.normalized_unit) ?? readString(parameter.unit);
      const sourceRef = readString(parameter.evidence_ref) ??
        readString(parameter.source_ref) ??
        result.observation_packet.produced_artifact_refs[0] ??
        result.capability_id;
      if (!variable || !value || !unit) return null;
      return {
        variable,
        value,
        unit,
        source_ref: sourceRef,
        evidence_text: readString(parameter.source_snippet) ?? "",
      };
    })
    .filter((entry): entry is CalculatorNumericBinding => Boolean(entry));
};

const parseNumericBindingFromText = (
  variable: string,
  evidence: { text: string; source_ref: string },
): CalculatorNumericBinding | null => {
  const inferredUnit = inferredUnitForCalculatorVariable(variable);
  for (const alias of aliasesForCalculatorVariable(variable)) {
    const aliasPattern = escapeRegExp(alias).replace(/\\ /g, "\\s+");
    const pattern = new RegExp(
      `(?:\\b${aliasPattern}\\b)\\s*(?:=|:|is|of|was|were|~|≈|about|around)?\\s*(${NUMERIC_TEXT_PATTERN})\\s*([A-Za-zµμ][A-Za-z0-9µμ_./^+-]*)?`,
      "i",
    );
    const match = evidence.text.match(pattern);
    if (!match?.[1]) continue;
    const unit = readString(match[2]) ?? inferredUnit;
    if (!unit) continue;
    return {
      variable,
      value: match[1],
      unit,
      source_ref: evidence.source_ref,
      evidence_text: evidence.text.slice(Math.max(0, match.index ?? 0), Math.min(evidence.text.length, (match.index ?? 0) + 180)),
    };
  }
  return null;
};

const bindCalculatorExpressionFromResults = (
  results: HelixWorkstationGatewayCallResult[],
): CalculatorBindingResult | null => {
  const templates = results.flatMap(calculatorTemplatesFromResult);
  if (templates.length === 0) return null;
  const evidenceRows = results
    .filter((result) => result.ok === true && result.capability_id !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)
    .flatMap(textEvidenceRowsFromResult);
  const typedNumericBindings = results
    .filter((result) => result.ok === true && result.capability_id !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)
    .flatMap(numericBindingsFromResult);
  let bestBlocked: CalculatorBindingResult | null = null;
  for (const template of templates) {
    const bindings = template.required_inputs
      .map((variable) => {
        const typedBinding = typedNumericBindings.find((entry) => entry.variable === variable);
        if (typedBinding) return typedBinding;
        const binding = evidenceRows
          .map((evidence) => parseNumericBindingFromText(variable, evidence))
          .find((entry): entry is CalculatorNumericBinding => Boolean(entry));
        return binding;
      })
      .filter((entry): entry is CalculatorNumericBinding => Boolean(entry));
    const missingVariables = template.required_inputs.filter((variable) =>
      !bindings.some((binding) => binding.variable === variable)
    );
    if (missingVariables.length > 0) {
      bestBlocked ??= {
        schema: "helix.compound_typed_affordance_binding.v1",
        status: "blocked",
        template,
        bound_expression: null,
        normalized_expression: null,
        variable_bindings: bindings,
        missing_variables: missingVariables,
        selected_affordances: [{
          kind: "calculator_expression_template",
          expression: template.expression,
          source_refs: template.source_refs,
          required_inputs: template.required_inputs,
        }],
        rejected_expression: template.expression,
        reason: "missing_numeric_value_evidence",
        assistant_answer: false,
        raw_content_included: false,
      };
      continue;
    }
    let boundExpression = calculatorExpressionRhs(template.expression);
    for (const binding of bindings) {
      boundExpression = boundExpression.replace(new RegExp(`\\b${escapeRegExp(binding.variable)}\\b`, "g"), binding.value);
    }
    for (const [constant, value] of Object.entries(CALCULATOR_TEMPLATE_CONSTANTS)) {
      boundExpression = boundExpression.replace(new RegExp(`\\b${escapeRegExp(constant)}\\b`, "g"), value);
    }
    const normalizedExpression = boundExpression.replace(/\s+/g, "");
    if (!/^[0-9eE.+\-*/^%()[\]]+$/.test(normalizedExpression)) {
      bestBlocked ??= {
        schema: "helix.compound_typed_affordance_binding.v1",
        status: "blocked",
        template,
        bound_expression: null,
        normalized_expression: normalizedExpression,
        variable_bindings: bindings,
        missing_variables: [],
        selected_affordances: [{
          kind: "calculator_expression_template",
          expression: template.expression,
          source_refs: template.source_refs,
          required_inputs: template.required_inputs,
        }],
        rejected_expression: template.expression,
        reason: "bound_expression_not_numeric",
        assistant_answer: false,
        raw_content_included: false,
      };
      continue;
    }
    return {
      schema: "helix.compound_typed_affordance_binding.v1",
      status: "bound",
      template,
      bound_expression: normalizedExpression,
      normalized_expression: normalizedExpression,
      variable_bindings: bindings,
      missing_variables: [],
      selected_affordances: [
        {
          kind: "calculator_expression_template",
          expression: template.expression,
          source_refs: template.source_refs,
          required_inputs: template.required_inputs,
        },
        ...bindings.map((binding) => ({
          kind: "numeric_value_evidence",
          variable: binding.variable,
          value: binding.value,
          unit: binding.unit,
          source_ref: binding.source_ref,
        })),
      ],
      rejected_expression: null,
      reason: null,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return bestBlocked;
};

const readSurfaceObservationForNarrator = (result: HelixWorkstationGatewayCallResult): {
  text: string;
  evidenceRefs: string[];
  sourcePath: string | null;
} | null => {
  if (!READABLE_SURFACE_CAPABILITIES.has(result.capability_id) || result.ok !== true) return null;
  const observation = readRecord(result.observation);
  if (!observation) return null;
  const surfaceText = readString(observation.text);
  if (!surfaceText) return null;
  const bounded = surfaceText.replace(/\s+/g, " ").trim().slice(0, 900).trim();
  if (!bounded) return null;
  return {
    text: bounded,
    evidenceRefs: result.observation_packet.produced_artifact_refs,
    sourcePath: readString(observation.source_doc_path),
  };
};

const normalizedTextForRelevance = (value: unknown): string =>
  readString(value)?.toLowerCase().replace(/[^a-z0-9+\-. ]+/g, " ").replace(/\s+/g, " ").trim() ?? "";

const scholarlyPaperRelevanceText = (paper: Record<string, unknown>): string =>
  [
    normalizedTextForRelevance(paper.title),
    normalizedTextForRelevance(paper.abstract),
    normalizedTextForRelevance(paper.summary),
    normalizedTextForRelevance(paper.venue),
  ].filter(Boolean).join(" ");

const scholarlyLookupRelevanceRequirement = (
  query: string,
  variableSourcePlan: Record<string, unknown> | null,
): {
  required_any: string[];
  supporting_any: string[];
} => {
  const queryText = query.toLowerCase();
  const planTerms = readArray(variableSourcePlan?.query_terms)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => entry.toLowerCase());
  const requiredAny = uniqueStrings([
    ...(queryText.includes("tokamak") ? ["tokamak"] : []),
    ...(queryText.includes("diii") || queryText.includes("diii-d") ? ["diii-d", "diii"] : []),
    ...(/\beast\b/i.test(query) ? ["east"] : []),
    ...(queryText.includes("fusion") || planTerms.some((term) => term.includes("fusion")) ? ["fusion", "thermonuclear"] : []),
    ...(queryText.includes("thermonuclear") ? ["thermonuclear", "fusion"] : []),
    ...(queryText.includes("nuclear reaction") || planTerms.some((term) => term.includes("nuclear reaction")) ? ["nuclear reaction", "reaction rate"] : []),
    ...(queryText.includes("magnetic confinement") ? ["magnetic confinement"] : []),
    ...(queryText.includes("plasma") || planTerms.some((term) => term.includes("plasma")) ? ["plasma"] : []),
  ]);
  const supportingAny = uniqueStrings([
    "electron density",
    "plasma density",
    "electron temperature",
    "toroidal magnetic field",
    "magnetic field",
    "operating point",
    "operating",
    "parameter",
    "transport",
    "confinement",
    "magnetic confinement",
    "plasma beta",
    "thermal pressure",
    "pressure",
    "fusion cross section",
    "reaction cross section",
    "cross section",
    "sigma v",
    "reactivity",
    "maxwellian averaged",
    "relative velocity",
    "thermal velocity",
    "reaction rate",
    "thermonuclear",
    ...planTerms.filter((term) =>
      /\b(?:density|temperature|field|tokamak|plasma|transport|parameter|operating|confinement|beta|fusion|cross\s+section|reaction|reactivity|velocity|sigma)\b/.test(term)
    ),
  ]).slice(0, 32);
  return { required_any: requiredAny, supporting_any: supportingAny };
};

const paperRelevanceRejectionReasons = (
  paper: Record<string, unknown>,
  requirement: { required_any: string[]; supporting_any: string[] },
): string[] => {
  const text = scholarlyPaperRelevanceText(paper);
  if (!text) return ["missing_title_abstract_or_summary"];
  const hasRequired = requirement.required_any.length === 0 ||
    requirement.required_any.some((term) => text.includes(term.toLowerCase()));
  const hasSupport = requirement.supporting_any.length === 0 ||
    requirement.supporting_any.some((term) => text.includes(term.toLowerCase()));
  return [
    ...(!hasRequired ? ["missing_required_topic_terms"] : []),
    ...(!hasSupport ? ["missing_formula_source_terms"] : []),
  ];
};

const buildScholarlyLookupRecoveryAffordance = (input: {
  query: string;
  variableSourcePlan: Record<string, unknown> | null;
  requirement: { required_any: string[]; supporting_any: string[] };
  rejectedResults: Array<{ result_id: string | null; title: string | null; reasons: string[] }>;
}): Record<string, unknown> => {
  const entries = readArray(input.variableSourcePlan?.entries)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const formulaVariables = readArray(input.variableSourcePlan?.formula_variables)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const sourceClasses = uniqueStrings(entries
    .flatMap((entry) => readArray(entry.source_classes).map(readString))
    .filter((entry): entry is string => Boolean(entry)));
  const queryTerms = uniqueStrings([
    ...input.requirement.required_any,
    ...input.requirement.supporting_any,
    ...entries.flatMap((entry) => readArray(entry.search_terms).map(readString))
      .filter((entry): entry is string => Boolean(entry)),
  ]);
  const hasFusionFormula = queryTerms.some((term) =>
    /\b(?:fusion|thermonuclear|cross\s+section|sigma\s*v|reactivity)\b/i.test(term)
  );
  const recoveryQueries = uniqueStrings([
    ...(hasFusionFormula ? [
      "deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table ion density plasma temperature",
      "Bosch Hale fusion reactivity coefficients D T cross section Maxwellian averaged table",
      "DT fusion plasma ion density temperature reactivity parameter table",
    ] : []),
    queryTerms.join(" "),
    input.query,
  ])
    .map((query) => query.replace(/\s+/g, " ").trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 4);
  return {
    schema: "helix.scholarly_lookup_recovery_affordance.v1",
    status: "available",
    reason: "lookup_result_irrelevant",
    failed_query: input.query,
    recommended_next_capability: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
    recovery_queries: recoveryQueries.map((query, index) => ({
      query,
      priority: index + 1,
      rationale: index === 0 && hasFusionFormula
        ? "Target sources likely to report fusion reactivity or cross-section tables for the formula variables."
        : "Reuse the variable source plan terms while avoiding literal placeholder-only retrieval.",
    })),
    expected_variables: formulaVariables,
    expected_source_classes: sourceClasses,
    rejected_results: input.rejectedResults,
    next_affordances: [
      {
        capability: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        purpose: "retry_with_refined_query",
        reason: "low_relevance_results",
        required_inputs: ["query"],
      },
      {
        capability: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        purpose: "fetch_full_text_for_relevant_source",
        reason: "blocked_until_relevant_source_ref_exists",
        required_inputs: ["source_ref", "citation_evidence"],
      },
      {
        capability: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
        purpose: "extract_cited_unit_bearing_values",
        reason: "blocked_until_text_evidence_exists",
        required_inputs: ["text_evidence", "citation_evidence"],
      },
    ],
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
  };
};

const paperSatisfiesScholarlyLookupRelevance = (
  paper: Record<string, unknown>,
  requirement: { required_any: string[]; supporting_any: string[] },
): boolean => {
  const text = scholarlyPaperRelevanceText(paper);
  if (!text) return false;
  const hasRequired = requirement.required_any.length === 0 ||
    requirement.required_any.some((term) => text.includes(term.toLowerCase()));
  const hasSupport = requirement.supporting_any.length === 0 ||
    requirement.supporting_any.some((term) => text.includes(term.toLowerCase()));
  return hasRequired && hasSupport;
};

const attachScholarlyLookupRelevanceGate = (input: {
  result: HelixWorkstationGatewayCallResult;
  papers: Record<string, unknown>[];
  query: string;
  variableSourcePlan: Record<string, unknown> | null;
}): Record<string, unknown> => {
  const requirement = scholarlyLookupRelevanceRequirement(input.query, input.variableSourcePlan);
  const relevantPapers = input.papers.filter((paper) =>
    paperSatisfiesScholarlyLookupRelevance(paper, requirement)
  );
  const rejectedResults = input.papers
    .filter((paper) => !relevantPapers.includes(paper))
    .map((paper) => ({
      result_id: readString(paper.result_id),
      title: readString(paper.title),
      reasons: paperRelevanceRejectionReasons(paper, requirement),
    }));
  const gate = {
    schema: "helix.scholarly_lookup_relevance_gate.v1",
    status: relevantPapers.length > 0 ? "satisfied" : "blocked",
    code: relevantPapers.length > 0 ? null : "lookup_result_irrelevant",
    required_any: requirement.required_any,
    supporting_any: requirement.supporting_any,
    selected_result_id: readString(relevantPapers[0]?.result_id) ?? null,
    rejected_result_ids: rejectedResults.map((entry) => entry.result_id).filter((entry): entry is string => Boolean(entry)),
    rejected_results: rejectedResults,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
  };
  const recoveryAffordance = gate.status === "blocked"
    ? buildScholarlyLookupRecoveryAffordance({
        query: input.query,
        variableSourcePlan: input.variableSourcePlan,
        requirement,
        rejectedResults,
      })
    : null;
  const observation = readRecord(input.result.observation);
  if (observation) {
    observation.lookup_relevance_gate = gate;
    if (recoveryAffordance) {
      observation.scholarly_lookup_recovery_affordance = recoveryAffordance;
      observation.recovery_affordances = [
        ...readArray(observation.recovery_affordances),
        recoveryAffordance,
      ];
    }
    if (gate.status === "blocked") {
      const missing = readArray(observation.missing_requirements)
        .map(readString)
        .filter((entry): entry is string => Boolean(entry));
      observation.missing_requirements = uniqueStrings([...missing, "lookup_result_irrelevant"]);
      observation.selected_for_answer = false;
    }
  }
  input.result.observation_packet.state_delta = {
    ...(readRecord(input.result.observation_packet.state_delta) ?? {}),
    scholarly_lookup_relevance_gate: gate,
    ...(recoveryAffordance ? { scholarly_lookup_recovery_affordance: recoveryAffordance } : {}),
  };
  if (recoveryAffordance) {
    input.result.observation_packet.suggested_next_steps = uniqueStrings([
      ...input.result.observation_packet.suggested_next_steps,
      "use_another_tool",
      "repair",
      "fail_closed",
    ]) as HelixWorkstationGatewayCallResult["observation_packet"]["suggested_next_steps"];
    input.result.observation_packet.state_delta = {
      ...(readRecord(input.result.observation_packet.state_delta) ?? {}),
      recovery_affordances: [
        ...readArray(readRecord(input.result.observation_packet.state_delta)?.recovery_affordances),
        recoveryAffordance,
      ],
      next_affordances: readArray(recoveryAffordance.next_affordances),
    };
  }
  return gate;
};

const readScholarlyLookupRelevanceGate = (result: HelixWorkstationGatewayCallResult): Record<string, unknown> | null => {
  const observation = readRecord(result.observation);
  return readRecord(observation?.lookup_relevance_gate) ??
    readRecord(readRecord(result.observation_packet.state_delta)?.scholarly_lookup_relevance_gate);
};

const resultHasRecoveryAffordance = (result: HelixWorkstationGatewayCallResult): boolean => {
  const observation = readRecord(result.observation);
  const stateDelta = readRecord(result.observation_packet.state_delta);
  const hasRecovery = (record: Record<string, unknown> | null): boolean =>
    Boolean(record &&
      (readArray(record.recovery_affordances).length > 0 ||
        readRecord(record.scholarly_lookup_recovery_affordance) ||
        readRecord(record.scholarly_full_text_recovery_affordance) ||
        readRecord(record.scholarly_numeric_recovery_affordance)));
  return hasRecovery(observation) || hasRecovery(stateDelta);
};

const evidenceQualityForCompoundResult = (
  outcome: string | null,
  capability: string,
  result: HelixWorkstationGatewayCallResult,
): {
  evidenceGathered: boolean;
  evidenceQuality: string;
  evidenceSatisfied: boolean;
  failureCode: string | null;
  nextAffordances: unknown[];
} => {
  const stateDelta = readRecord(result.observation_packet.state_delta);
  const observation = readRecord(result.observation);
  const nextAffordances = [
    ...readArray(observation?.next_affordances),
    ...readArray(stateDelta?.next_affordances),
    ...readArray(readRecord(observation?.scholarly_lookup_recovery_affordance)?.next_affordances),
    ...readArray(readRecord(stateDelta?.scholarly_lookup_recovery_affordance)?.next_affordances),
  ];
  const lookupRelevanceGate = readScholarlyLookupRelevanceGate(result);
  const lookupIrrelevant =
    outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
    capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    readString(lookupRelevanceGate?.status) === "blocked";
  if (lookupIrrelevant) {
    return {
      evidenceGathered: result.ok === true,
      evidenceQuality: "low_relevance",
      evidenceSatisfied: false,
      failureCode: readString(lookupRelevanceGate?.code) ?? "lookup_result_irrelevant",
      nextAffordances,
    };
  }
  if (resultHasRecoveryAffordance(result)) {
    return {
      evidenceGathered: result.ok === true || result.artifact_refs.length > 0,
      evidenceQuality: result.ok === true ? "partial_recovery_available" : "failed_recovery_available",
      evidenceSatisfied: false,
      failureCode: result.error ?? "recovery_affordance_available",
      nextAffordances,
    };
  }
  return {
    evidenceGathered: result.ok === true,
    evidenceQuality: result.ok === true ? "contract_satisfied" : "missing_or_failed",
    evidenceSatisfied: result.ok === true,
    failureCode: result.ok === true ? null : result.error ?? "observation_missing",
    nextAffordances,
  };
};

const readDocsExcerptForNarrator = (result: HelixWorkstationGatewayCallResult): {
  text: string;
  evidenceRefs: string[];
  sourcePath: string | null;
} | null => {
  const surfaceObservation = readSurfaceObservationForNarrator(result);
  if (surfaceObservation) return surfaceObservation;
  if (result.capability_id !== DOCS_SEARCH_CAPABILITY || result.ok !== true) return null;
  const observation = readRecord(result.observation);
  if (!observation) return null;
  const isNarratableDocsText = (entry: Record<string, unknown> | null | undefined, text: string | null): boolean => {
    if (!entry || !text) return false;
    const term = readString(entry.term);
    if (term === "document_path_title") return false;
    if (/^Document title\/path match:/i.test(text)) return false;
    return true;
  };
  const activeDocument = readRecord(observation.active_document_observation);
  const activeExcerpt = readString(activeDocument?.excerpt);
  const activePath = readString(activeDocument?.path);
  if (activeExcerpt) {
    const bounded = activeExcerpt.replace(/\s+/g, " ").trim().slice(0, 900).trim();
    if (!bounded) return null;
    return {
      text: bounded,
      evidenceRefs: result.observation_packet.produced_artifact_refs,
      sourcePath: activePath ?? null,
    };
  }
  const evidenceObservations = Array.isArray(observation.evidence_observations)
    ? observation.evidence_observations.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];
  const firstEvidence = evidenceObservations.find((entry) => {
    const text = readString(entry.text) ?? readString(entry.excerpt) ?? readString(entry.snippet);
    return isNarratableDocsText(entry, text);
  });
  const documentCandidates = Array.isArray(observation.document_candidates)
    ? observation.document_candidates.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];
  const firstCandidateSnippet = documentCandidates
    .flatMap((candidate) =>
      Array.isArray(candidate.best_snippets)
        ? candidate.best_snippets.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry)).map((snippet) => ({
            snippet,
            sourcePath: readString(candidate.path),
          }))
        : []
    )
    .find(({ snippet }) => isNarratableDocsText(snippet, readString(snippet.text)));
  const candidateText = readString(firstCandidateSnippet?.snippet.text);
  const candidatePath = firstCandidateSnippet?.sourcePath ?? null;
  const hits = Array.isArray(observation.hits)
    ? observation.hits.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];
  const firstHit = hits.find((entry) =>
    isNarratableDocsText(entry, readString(entry.text) ?? readString(entry.snippet))
  );
  const fallbackText = readString(firstEvidence?.text) ?? readString(firstEvidence?.excerpt);
  const hitText = readString(firstHit?.text) ?? readString(firstHit?.snippet);
  const fallbackPath = readString(firstEvidence?.filePath) ?? readString(firstEvidence?.file_path);
  const hitPath = readString(firstHit?.filePath) ?? readString(firstHit?.file_path);
  const text = fallbackText ?? readString(firstEvidence?.snippet) ?? candidateText ?? hitText;
  if (!text) return null;
  const bounded = text.replace(/\s+/g, " ").trim().slice(0, 900).trim();
  if (!bounded) return null;
  return {
    text: bounded,
    evidenceRefs: result.observation_packet.produced_artifact_refs,
    sourcePath: fallbackPath ?? candidatePath ?? hitPath ?? null,
  };
};

export const buildDependentCompoundCapabilityGatewayCallRequest = (input: {
  request: Record<string, unknown>;
  result: HelixWorkstationGatewayCallResult;
  results?: HelixWorkstationGatewayCallResult[];
  turnId: string;
}): Record<string, unknown> | null => {
  const outcome = readString(input.request.compound_outcome);
  const dependentCapability =
    readString(input.request.dependent_capability_id) ?? readString(input.request.dependentCapabilityId);
  if (
    input.result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    input.result.ok !== true
  ) {
    const requestArgs = readRecord(input.request.arguments);
    const recoveryAttempt = Number(readString(requestArgs?.scholarly_recovery_attempt) ?? requestArgs?.scholarly_recovery_attempt ?? 0);
    if (!Number.isFinite(recoveryAttempt) || recoveryAttempt >= 2) return null;
    const observation = readRecord(input.result.observation);
    const stateDelta = readRecord(input.result.observation_packet?.state_delta);
    const evidenceState = readString(observation?.evidence_state) ?? readString(stateDelta?.evidence_state);
    if (evidenceState !== "lookup_weak_match" && evidenceState !== "lookup_blocked") return null;
    const currentQuery = readString(observation?.query) ?? readString(requestArgs?.query);
    const nextAffordances = [
      ...readArray(observation?.next_affordances),
      ...readArray(stateDelta?.next_affordances),
      ...readArray(readRecord(observation?.scholarly_lookup_recovery_affordance)?.next_affordances),
    ].map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const recoveryQueries = [
      ...nextAffordances.map((entry) => readString(entry.query)).filter((entry): entry is string => Boolean(entry)),
      ...readArray(readRecord(observation?.scholarly_lookup_recovery_affordance)?.recovery_queries)
        .map(readString)
        .filter((entry): entry is string => Boolean(entry)),
    ];
    const retryQuery = recoveryQueries.find((query) =>
      query && query.toLowerCase() !== currentQuery?.toLowerCase()
    );
    if (!retryQuery) return null;
    const scholarlyIntent = readRecord(requestArgs?.scholarly_intent) ?? readRecord(readRecord(input.result.gateway_admission?.source_target_intent)?.scholarly_intent);
    const plannedScholarlyCapabilityChain = readRecord(requestArgs?.planned_scholarly_capability_chain);
    return {
      schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
      derivation_source: "helix_scholarly_recovery_planner",
      ...(outcome ? { compound_outcome: outcome } : {}),
      subgoal_id: `scholarly_recovery:lookup_retry:${recoveryAttempt + 1}`,
      capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      dependent_capability_id: dependentCapability || readString(input.request.dependent_capability_id) || undefined,
      mode: "read",
      arguments: {
        query: retryQuery,
        mode: readString(requestArgs?.mode) ?? "paper_search",
        providers: readArray(requestArgs?.providers).length ? readArray(requestArgs?.providers) : undefined,
        limit: requestArgs?.limit ?? requestArgs?.max_results ?? requestArgs?.maxResults,
        scholarly_recovery_attempt: recoveryAttempt + 1,
        previous_scholarly_query: currentQuery ?? null,
        allow_scholarly_dependent_chain: requestArgs?.allow_scholarly_dependent_chain === true,
        ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
        ...(plannedScholarlyCapabilityChain ? { planned_scholarly_capability_chain: plannedScholarlyCapabilityChain } : {}),
        source_target_intent: {
          source: "helix_scholarly_recovery_planner",
          target_source: "scholarly_research",
          target_kind: "research_paper_search_retry",
          subgoal_id: `scholarly_recovery:lookup_retry:${recoveryAttempt + 1}`,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "weak_lookup_to_refined_query",
          previous_query: currentQuery ?? null,
          recovery_query: retryQuery,
          recovery_attempt: recoveryAttempt + 1,
          required_observation_kind: "helix.scholarly_research_observation.v1",
          ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    };
  }
  const lookupRelevanceGate = readScholarlyLookupRelevanceGate(input.result);
  if (
    input.result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    readString(lookupRelevanceGate?.status) === "blocked"
  ) {
    return null;
  }
  if (
    (outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME || outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME) &&
    input.result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    input.result.ok === true
  ) {
    const observation = readRecord(input.result.observation);
    const papers = readArray(observation?.papers).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const firstPaper = papers[0];
    const paperResultId = readString(firstPaper?.result_id);
    const requestArgs = readRecord(input.request.arguments);
    const variableSourcePlan = readRecord(requestArgs?.variable_source_plan);
    const sourceRequirementPlan = readRecord(requestArgs?.source_requirement_plan);
    const scholarlyIntent = readRecord(requestArgs?.scholarly_intent);
    const requestedWorkflow = readString(scholarlyIntent?.requested_workflow);
    if (requestArgs?.allow_scholarly_dependent_chain !== true) return null;
    const query = readString(observation?.query) ?? readString(requestArgs?.query) ?? "paper full text";
    const relevanceGate = attachScholarlyLookupRelevanceGate({
      result: input.result,
      papers,
      query,
      variableSourcePlan,
    });
    if (readString(relevanceGate.status) === "blocked") return null;
    const relevanceSelectedPaper = papers.find((paper) =>
      readString(paper.result_id) === readString(relevanceGate.selected_result_id)
    );
    const selectedPaper = outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME
      ? selectScholarlyPaperForFullTextFetch(papers, firstPaper)
      : selectScholarlyPaperForFullTextFetch(
          relevanceSelectedPaper ? [relevanceSelectedPaper, ...papers.filter((paper) => paper !== relevanceSelectedPaper)] : papers,
          relevanceSelectedPaper ?? firstPaper,
        );
    if (!selectedPaper) return null;
    if (!firstPaper) return null;
    const fullTextSubgoalId = outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME
      ? `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_full_text`
      : `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_full_text`;
    const evidenceSubgoalId = outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME
      ? `${SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME}:scholarly_evidence`
      : `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_evidence`;
    return {
      schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: fullTextSubgoalId,
      capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      mode: "read",
      arguments: {
        query,
        papers,
        paper: selectedPaper,
        paper_result_id: readString(selectedPaper.result_id) ?? paperResultId,
        ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
        ...(requestedWorkflow ? { requested_workflow: requestedWorkflow } : {}),
        requested_variables: readArray(requestArgs?.requested_variables)
          .map(readString)
          .filter((entry): entry is string => Boolean(entry)),
        ...(variableSourcePlan ? { variable_source_plan: variableSourcePlan } : {}),
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source: "helix_compound_capability_dependency_planner",
        turn_id: input.turnId,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scholarly_research",
          target_kind: "scholarly_full_text",
          compound_outcome: outcome,
          subgoal_id: fullTextSubgoalId,
          depends_on_subgoal_id: evidenceSubgoalId,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "source_ref_to_full_text",
          required_observation_kind: "helix.scholarly_full_text_observation.v1",
          required_affordance_kinds: ["source_ref", "citation_evidence"],
          produced_affordance_kind: "text_evidence",
          source_refs: input.result.observation_packet.produced_artifact_refs,
          ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
          ...(requestedWorkflow ? { requested_workflow: requestedWorkflow } : {}),
          ...(variableSourcePlan ? { variable_source_plan: variableSourcePlan } : {}),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    };
  }
  if (
    (outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME || outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME) &&
    input.result.capability_id === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY &&
    input.result.ok === true
  ) {
    const allResults = input.results?.length ? input.results : [input.result];
    const requestArgs = readRecord(input.request.arguments);
    const variableSourcePlan = readRecord(requestArgs?.variable_source_plan);
    const sourceRequirementPlan = readRecord(requestArgs?.source_requirement_plan);
    const scholarlyIntent = readRecord(requestArgs?.scholarly_intent);
    const requestedWorkflow = readString(scholarlyIntent?.requested_workflow) ?? readString(requestArgs?.requested_workflow);
    if (
      outcome === SCHOLARLY_RESEARCH_WORKFLOW_OUTCOME &&
      requestedWorkflow !== "numeric_extraction" &&
      requestedWorkflow !== "numeric_calculation"
    ) {
      return null;
    }
    const carriedVariables = readArray(requestArgs?.requested_variables)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry));
    const templateVariables = Array.from(new Set(
      allResults.flatMap(calculatorTemplatesFromResult).flatMap((template) => template.required_inputs),
    )).filter((variable) => !["e_charge", "mu0"].includes(variable));
    const requestedVariables = carriedVariables.length
      ? carriedVariables
      : templateVariables.length
        ? templateVariables
        : ["n_m3", "T_eV", "B_T"];
    return {
      schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoal_id: `${outcome}:numeric_parameters`,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      mode: "read",
      arguments: {
        requested_variables: requestedVariables,
        full_text_observation: input.result.observation,
        source_ref: input.result.observation_packet.produced_artifact_refs[0],
        ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
        ...(requestedWorkflow ? { requested_workflow: requestedWorkflow } : {}),
        ...(variableSourcePlan ? { variable_source_plan: variableSourcePlan } : {}),
        ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
        source: "helix_compound_capability_dependency_planner",
        turn_id: input.turnId,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scholarly_research",
          target_kind: "numeric_parameter_extraction",
          compound_outcome: outcome,
          subgoal_id: `${outcome}:numeric_parameters`,
          depends_on_subgoal_id: `${outcome}:scholarly_full_text`,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "text_evidence_to_numeric_value_evidence",
          required_observation_kind: "helix.scholarly_numeric_parameter_observation.v1",
          required_affordance_kinds: ["text_evidence", "citation_evidence"],
          produced_affordance_kind: "numeric_value_evidence",
          requested_variables: requestedVariables,
          ...(scholarlyIntent ? { scholarly_intent: scholarlyIntent } : {}),
          ...(requestedWorkflow ? { requested_workflow: requestedWorkflow } : {}),
          ...(variableSourcePlan ? {
            variable_source_plan: variableSourcePlan,
            source_classes: readArray(variableSourcePlan.entries)
              .map(readRecord)
              .filter((entry): entry is Record<string, unknown> => Boolean(entry))
              .flatMap((entry) => readArray(entry.source_classes).map(readString))
              .filter((entry): entry is string => Boolean(entry)),
            extraction_aliases: readArray(variableSourcePlan.entries)
              .map(readRecord)
              .filter((entry): entry is Record<string, unknown> => Boolean(entry))
              .flatMap((entry) => readArray(entry.extraction_aliases).map(readString))
              .filter((entry): entry is string => Boolean(entry)),
          } : {}),
          ...(sourceRequirementPlan ? { source_requirement_plan: sourceRequirementPlan } : {}),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    };
  }
  if (
    outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
    (input.result.capability_id === THEORY_CONTEXT_REFLECTION_CAPABILITY ||
      input.result.capability_id === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY)
  ) {
    const binding = bindCalculatorExpressionFromResults(input.results?.length ? input.results : [input.result]);
    if (!binding || binding.status !== "bound" || !binding.bound_expression) return null;
    const evidenceRefs = binding.variable_bindings.map((entry) => entry.source_ref);
    return {
      schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
      subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:calculator_bound_expression`,
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      mode: "read",
      arguments: {
        expression: binding.bound_expression,
        source: "helix_compound_capability_dependency_planner",
        turn_id: input.turnId,
        bound_calculator_expression: binding,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scientific_calculator",
          target_kind: "calculator_solve",
          compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
          subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:calculator_bound_expression`,
          depends_on_subgoal_id: input.result.capability_id === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY
            ? `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:numeric_parameters`
            : `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:theory_reflection`,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "typed_affordance_bound_calculator_expression",
          required_observation_kind: "helix.calculator_solve_observation.v1",
          required_affordance_kinds: [
            "calculator_expression_template",
            "numeric_value_evidence",
            "bound_calculator_expression",
          ],
          produced_affordance_kind: "bound_calculator_expression",
          selected_affordances: binding.selected_affordances,
          variable_bindings: binding.variable_bindings,
          evidence_refs: evidenceRefs,
          source_refs: [...(binding.template?.source_refs ?? []), ...evidenceRefs],
          normalized_expression: binding.normalized_expression,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    };
  }
  if (outcome !== READ_ALOUD_DOC_EXCERPT_OUTCOME || dependentCapability !== VOICE_NARRATOR_SAY_CAPABILITY) {
    return null;
  }
  const excerpt = readSurfaceObservationForNarrator(input.result);
  if (!excerpt) return null;
  return {
    schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
    derivation_source: "helix_compound_capability_dependency_planner",
    compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
    subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
    capability_id: VOICE_NARRATOR_SAY_CAPABILITY,
    mode: "act",
    arguments: {
      text: excerpt.sourcePath
        ? `From ${excerpt.sourcePath}: ${excerpt.text}`
        : excerpt.text,
      kind: "narrator_read",
      source: "helix_compound_capability_dependency_planner",
      turn_id: input.turnId,
      max_chars: 900,
      evidence_refs: excerpt.evidenceRefs,
      reason_codes: ["read_aloud_surface", "surface_observation_to_voice_text"],
      source_target_intent: {
        source: "helix_compound_capability_dependency_planner",
        target_source: "voice_delivery",
        target_kind: "narrator_say",
        compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
        subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
        depends_on_subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
        depends_on_capability_id: input.result.capability_id,
        dependency_binding: "surface_observation_to_voice_text",
        evidence_refs: excerpt.evidenceRefs,
        source_doc_path: excerpt.sourcePath,
        required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
  };
};

export const buildCompoundDependencyRailStatus = (input: {
  request: Record<string, unknown>;
  result: HelixWorkstationGatewayCallResult;
  results?: HelixWorkstationGatewayCallResult[];
  dependentRequest: Record<string, unknown> | null;
}): Record<string, unknown> | null => {
  const outcome = readString(input.request.compound_outcome);
  const dependentCapability =
    readString(input.request.dependent_capability_id) ?? readString(input.request.dependentCapabilityId);
  if (outcome === INSPECT_REPO_AND_DOC_OUTCOME) {
    const subgoalId = readString(input.request.subgoal_id) ?? `${INSPECT_REPO_AND_DOC_OUTCOME}:unknown`;
    const capability = readString(input.request.capability_id) ?? input.result.capability_id;
    const satisfied = input.result.ok === true;
    const requiredObservationKind =
      capability === DOCS_SEARCH_CAPABILITY
        ? "helix.docs_search_observation.v1"
        : capability === REPO_SEARCH_CAPABILITY
          ? "helix.repo_search_observation.v1"
          : "helix.workstation_gateway_observation.v1";
    return {
      schema: "helix.compound_capability_dependency_plan.v1",
      source: "helix_compound_capability_dependency_planner",
      compound_outcome: INSPECT_REPO_AND_DOC_OUTCOME,
      subgoals: [{
        subgoal_id: subgoalId,
        ordinal: capability === DOCS_SEARCH_CAPABILITY ? 1 : 2,
        requested_capability: capability,
        executed_capability: input.result.capability_id === capability ? capability : null,
        required_observation_kind: requiredObservationKind,
        satisfied,
        rail_status: satisfied ? "satisfied" : "missing_observation",
        assistant_answer: false,
        raw_content_included: false,
      }],
      dependency_edges: [],
      first_broken_rail: satisfied
        ? null
        : {
            subgoal_id: subgoalId,
            capability_id: capability,
            reason: input.result.error ?? "observation_missing",
          },
      rail_status: satisfied ? "satisfied" : "blocked",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (outcome === SUMMARIZE_AND_CALCULATE_OUTCOME || outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME) {
    const subgoalId = readString(input.request.subgoal_id) ?? `${outcome}:unknown`;
    const capability = readString(input.request.capability_id) ?? input.result.capability_id;
    const sourceTargetIntent = readRecord(readRecord(input.request.arguments)?.source_target_intent);
    const requiredObservationKind =
      readString(sourceTargetIntent?.required_observation_kind) ??
      "helix.workstation_gateway_observation.v1";
    const ordinal = typeof sourceTargetIntent?.subgoal_ordinal === "number"
      ? sourceTargetIntent.subgoal_ordinal
      : 1;
    const evidenceQuality = evidenceQualityForCompoundResult(outcome, capability, input.result);
    const calculatorBinding = outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
      (capability === THEORY_CONTEXT_REFLECTION_CAPABILITY || capability === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY)
        ? bindCalculatorExpressionFromResults(input.results?.length ? input.results : [input.result])
        : null;
    const resultObservation = readRecord(input.result.observation);
    const lookupRelevanceGate = readRecord(resultObservation?.lookup_relevance_gate);
    const lookupIrrelevant = outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
      capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
      readString(lookupRelevanceGate?.status) === "blocked";
    const boundCalculatorPlanned = Boolean(input.dependentRequest);
    const calculatorSubgoal = calculatorBinding
      ? {
          subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:calculator_bound_expression`,
          ordinal: ordinal + 1,
          requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
          executed_capability: null,
          required_observation_kind: "helix.calculator_solve_observation.v1",
          depends_on_subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:theory_reflection`,
          dependency_binding: "typed_affordance_bound_calculator_expression",
          required_affordance_kinds: [
            "calculator_expression_template",
            "numeric_value_evidence",
            "bound_calculator_expression",
          ],
          selected_affordances: calculatorBinding.selected_affordances,
          variable_bindings: calculatorBinding.variable_bindings,
          missing_variables: calculatorBinding.missing_variables,
          bound_expression: calculatorBinding.bound_expression,
          normalized_expression: calculatorBinding.normalized_expression,
          rejected_expression: calculatorBinding.rejected_expression,
          satisfied: false,
          rail_status: boundCalculatorPlanned ? "planned_after_dependency" : "blocked_by_dependency",
          assistant_answer: false,
          raw_content_included: false,
        }
      : null;
    const firstBrokenRail = lookupIrrelevant
      ? {
          subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_full_text`,
          capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
          reason: readString(lookupRelevanceGate?.code) ?? "lookup_result_irrelevant",
          lookup_relevance_gate: lookupRelevanceGate,
        }
      : !evidenceQuality.evidenceSatisfied
      ? {
          subgoal_id: subgoalId,
          capability_id: capability,
          reason: evidenceQuality.failureCode ?? "observation_missing",
        }
      : calculatorBinding?.status === "blocked"
        ? {
            subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:calculator_bound_expression`,
            capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
            reason: calculatorBinding.reason ?? "missing_numeric_value_evidence",
            missing_variables: calculatorBinding.missing_variables,
            rejected_expression: calculatorBinding.rejected_expression,
          }
        : null;
    return {
      schema: "helix.compound_capability_dependency_plan.v1",
      source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoals: [
        {
          subgoal_id: subgoalId,
          ordinal,
          requested_capability: capability,
          executed_capability: input.result.capability_id === capability ? capability : null,
          required_observation_kind: requiredObservationKind,
          evidence_gathered: evidenceQuality.evidenceGathered,
          evidence_quality: evidenceQuality.evidenceQuality,
          evidence_quality_satisfied: evidenceQuality.evidenceSatisfied,
          next_affordances: evidenceQuality.nextAffordances,
          satisfied: evidenceQuality.evidenceSatisfied,
          rail_status: evidenceQuality.evidenceSatisfied ? "satisfied" : evidenceQuality.evidenceGathered ? "evidence_gathered_not_satisfied" : "missing_observation",
          rail_failure_code: evidenceQuality.evidenceSatisfied ? null : evidenceQuality.failureCode,
          assistant_answer: false,
          raw_content_included: false,
        },
        ...(calculatorSubgoal ? [calculatorSubgoal] : []),
      ],
      dependency_edges: Array.isArray(sourceTargetIntent?.dependency_edges)
        ? sourceTargetIntent.dependency_edges
        : [],
      typed_affordance_binding: calculatorBinding,
      first_broken_rail: firstBrokenRail,
      rail_status: firstBrokenRail ? "blocked" : boundCalculatorPlanned ? "planned" : "satisfied",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (outcome !== READ_ALOUD_DOC_EXCERPT_OUTCOME || dependentCapability !== VOICE_NARRATOR_SAY_CAPABILITY) {
    return null;
  }
  const docsSatisfied = input.result.ok === true;
  const excerpt = readSurfaceObservationForNarrator(input.result);
  const narratorPlanned = Boolean(input.dependentRequest);
  const firstBrokenRail = !docsSatisfied
    ? {
        subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
        capability_id: input.result.capability_id,
        reason: input.result.error ?? "surface_observation_failed",
      }
    : !excerpt
      ? {
          subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
          capability_id: VOICE_NARRATOR_SAY_CAPABILITY,
          reason: "upstream_surface_observation_missing",
        }
      : null;
  const narratorRailStatus = narratorPlanned ? "planned_after_dependency" : "blocked_by_dependency";
  return {
    schema: "helix.compound_capability_dependency_plan.v1",
    source: "helix_compound_capability_dependency_planner",
    compound_outcome: READ_ALOUD_SURFACE_OUTCOME,
    subgoals: [
      {
        subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
        ordinal: 1,
        requested_capability: input.result.capability_id,
        executed_capability: READABLE_SURFACE_CAPABILITIES.has(input.result.capability_id) ? input.result.capability_id : null,
        required_observation_kind: "helix.workstation_readable_surface_observation.v1",
        satisfied: docsSatisfied,
        rail_status: docsSatisfied ? "satisfied" : "missing_observation",
        assistant_answer: false,
        raw_content_included: false,
      },
      {
        subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
        ordinal: 2,
        requested_capability: VOICE_NARRATOR_SAY_CAPABILITY,
        executed_capability: null,
        required_receipt_kind: "helix.interim_voice_callout_tool_result.v1",
        depends_on_subgoal_id: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
        dependency_binding: "surface_observation_to_voice_text",
        satisfied: false,
        rail_status: narratorRailStatus,
        assistant_answer: false,
        raw_content_included: false,
      },
    ],
    dependency_edges: [{
      from: `${READ_ALOUD_SURFACE_OUTCOME}:surface_observation`,
      to: `${READ_ALOUD_SURFACE_OUTCOME}:narrator_receipt`,
      binding: "surface_observation_to_voice_text",
      status: narratorPlanned ? "planned" : "blocked",
    }],
    first_broken_rail: firstBrokenRail,
    rail_status: firstBrokenRail ? "blocked" : "planned",
    assistant_answer: false,
    raw_content_included: false,
  };
};

const readCompoundOutcomeFromResult = (result: HelixWorkstationGatewayCallResult): string | null => {
  const intent = readRecord(result.gateway_admission.source_target_intent);
  return readString(intent?.compound_outcome);
};

const readCompoundSubgoalFromResult = (result: HelixWorkstationGatewayCallResult): Record<string, unknown> | null => {
  const intent = readRecord(result.gateway_admission.source_target_intent);
  const outcome = readString(intent?.compound_outcome);
  const subgoalId = readString(intent?.subgoal_id);
  if (!outcome || !subgoalId) return null;
  const ordinal =
    typeof intent?.subgoal_ordinal === "number" && Number.isFinite(intent.subgoal_ordinal)
      ? Math.trunc(intent.subgoal_ordinal)
      : null;
  const producedRefs = Array.isArray(result.observation_packet.produced_artifact_refs)
    ? result.observation_packet.produced_artifact_refs.filter((ref): ref is string => typeof ref === "string" && ref.trim().length > 0)
    : [];
  const requiredObservationKind = readString(intent?.required_observation_kind);
  const requiredReceiptKind = readString(intent?.required_receipt_kind);
  const capability = result.gateway_admission.requested_capability || result.capability_id;
  const evidenceQuality = evidenceQualityForCompoundResult(outcome, capability, result);
  return {
    schema: "helix.compound_capability_subgoal_execution.v1",
    subgoal_id: subgoalId,
    ordinal: ordinal ?? 999,
    requested_capability: result.gateway_admission.requested_capability,
    selected_capability: result.capability_id,
    executed_capability: evidenceQuality.evidenceGathered ? result.capability_id : null,
    required_observation_kind: requiredObservationKind,
    required_receipt_kind: requiredReceiptKind,
    observation_refs: producedRefs,
    receipt_refs: requiredReceiptKind ? producedRefs : [],
    evidence_gathered: evidenceQuality.evidenceGathered,
    evidence_quality: evidenceQuality.evidenceQuality,
    evidence_quality_satisfied: evidenceQuality.evidenceSatisfied,
    next_affordances: evidenceQuality.nextAffordances,
    satisfied: evidenceQuality.evidenceSatisfied,
    rail_status: evidenceQuality.evidenceSatisfied ? "satisfied" : evidenceQuality.evidenceGathered ? "evidence_gathered_not_satisfied" : "missing_observation",
    rail_failure_code: evidenceQuality.evidenceSatisfied ? null : evidenceQuality.failureCode,
    error: result.error ?? evidenceQuality.failureCode,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildTurnCompoundDependencyPlan = (input: {
  turnId: string;
  results: HelixWorkstationGatewayCallResult[];
}): Record<string, unknown> | null => {
  const compoundResults = input.results.filter((result) => readCompoundOutcomeFromResult(result));
  if (compoundResults.length === 0) return null;
  const outcomes = Array.from(new Set(compoundResults.map(readCompoundOutcomeFromResult).filter(Boolean)));
  const subgoalsById = new Map<string, Record<string, unknown>>();
  const dependencyEdges: Record<string, unknown>[] = [];
  const addDependencyEdge = (edge: unknown): void => {
    const edgeRecord = readRecord(edge);
    if (!edgeRecord) return;
    const key = [
      readString(edgeRecord.from),
      readString(edgeRecord.to),
      readString(edgeRecord.binding),
    ].join(":");
    if (!dependencyEdges.some((existing) =>
      [
        readString(existing.from),
        readString(existing.to),
        readString(existing.binding),
      ].join(":") === key
    )) {
      dependencyEdges.push(edgeRecord);
    }
  };
  for (const result of compoundResults) {
    const observation = readRecord(result.observation);
    const resultPlan = readRecord(observation?.compound_dependency_plan);
    if (Array.isArray(resultPlan?.subgoals)) {
      for (const plannedSubgoal of resultPlan.subgoals) {
        const plannedRecord = readRecord(plannedSubgoal);
        const plannedSubgoalId = readString(plannedRecord?.subgoal_id);
        if (!plannedRecord || !plannedSubgoalId) continue;
        subgoalsById.set(plannedSubgoalId, {
          schema: "helix.compound_capability_subgoal_execution.v1",
          ...plannedRecord,
          observation_refs: Array.isArray(plannedRecord.observation_refs) ? plannedRecord.observation_refs : [],
          receipt_refs: Array.isArray(plannedRecord.receipt_refs) ? plannedRecord.receipt_refs : [],
          assistant_answer: false,
          raw_content_included: false,
        });
      }
    }
    if (Array.isArray(resultPlan?.dependency_edges)) {
      for (const edge of resultPlan.dependency_edges) addDependencyEdge(edge);
    }
    const subgoal = readCompoundSubgoalFromResult(result);
    if (subgoal) {
      const existing = subgoalsById.get(String(subgoal.subgoal_id));
      const existingOrdinal = typeof existing?.ordinal === "number" ? existing.ordinal : null;
      const subgoalOrdinal = typeof subgoal.ordinal === "number" ? subgoal.ordinal : null;
      subgoalsById.set(String(subgoal.subgoal_id), {
        ...(existing ?? {}),
        ...subgoal,
        ordinal: subgoalOrdinal === 999 && existingOrdinal !== null ? existingOrdinal : subgoal.ordinal,
      });
    }
    const intent = readRecord(result.gateway_admission.source_target_intent);
    if (Array.isArray(intent?.dependency_edges)) {
      for (const edge of intent.dependency_edges) addDependencyEdge(edge);
    }
    const dependsOn = readString(intent?.depends_on_subgoal_id);
    const binding = readString(intent?.dependency_binding);
    if (dependsOn && subgoal) {
      addDependencyEdge({
        from: dependsOn,
        to: subgoal.subgoal_id,
        binding: binding ?? "compound_dependency",
      });
    }
  }
  const subgoals = Array.from(subgoalsById.values()).sort((a, b) => {
    const aOrdinal = typeof a.ordinal === "number" ? a.ordinal : 999;
    const bOrdinal = typeof b.ordinal === "number" ? b.ordinal : 999;
    return aOrdinal - bOrdinal || String(a.subgoal_id).localeCompare(String(b.subgoal_id));
  });
  if (subgoals.length === 0) return null;
  const firstBrokenRail = subgoals.find((subgoal) => subgoal.satisfied !== true) ?? null;
  return {
    schema: "helix.compound_capability_dependency_turn_plan.v1",
    turn_id: input.turnId,
    source: "helix_compound_capability_dependency_planner",
    compound_outcomes: outcomes,
    ordered_subgoals: subgoals,
    subgoal_count: subgoals.length,
    satisfied_subgoal_count: subgoals.filter((subgoal) => subgoal.satisfied === true).length,
    dependency_edges: dependencyEdges,
    first_broken_rail: firstBrokenRail,
    rail_status: firstBrokenRail ? "blocked" : "satisfied",
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
