import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";

export const READ_ALOUD_SURFACE_OUTCOME = "read_aloud_surface" as const;
export const READ_ALOUD_DOC_EXCERPT_OUTCOME = READ_ALOUD_SURFACE_OUTCOME;
export const INSPECT_REPO_AND_DOC_OUTCOME = "inspect_repo_and_doc" as const;
export const SUMMARIZE_AND_CALCULATE_OUTCOME = "summarize_and_calculate" as const;
export const RESEARCH_QUANTIFY_REFLECT_OUTCOME = "research_quantify_reflect" as const;

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
  /\b(?:translated|translation|inline\s+translation|translated\s+(?:section|block|text))\b/i.test(unquotePrompt(prompt));

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
  const cleaned = direct?.replace(/\s+/g, "").replace(/[^0-9+*/().^%-]/g, "") ?? "";
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

const isResearchQuantifyReflectPrompt = (prompt: string): boolean => {
  if (hasExplicitCompoundPlannerCapabilityMention(prompt)) return false;
  if (hasDocumentEvidenceIntent(prompt)) return false;
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
    /\b(?:later|future|eventually|hypothetically|might|could|would|not\s+now)\b[\s\S]{0,180}\b(?:research|papers?|arxiv|scholarly|internet|web|calculate|compute|estimate|reflect|theory\s+badge\s+graph|theory\s+graph)\b/i.test(unquoted) ||
    /\b(?:research|papers?|arxiv|scholarly|internet|web|calculate|compute|estimate|reflect|theory\s+badge\s+graph|theory\s+graph)\b[\s\S]{0,180}\b(?:later|future|eventually|hypothetically|might|could|would|not\s+now)\b/i.test(unquoted)
  ) {
    return false;
  }
  const wantsResearch = /\b(?:research\s+papers?|papers?|arxiv|scholarly|internet|web|sources?|corroborat(?:e|ion)|retrieve\s+evidence|look\s+up)\b/i.test(unquoted);
  const wantsQuantify = /\b(?:calculate|compute|estimate|quantif(?:y|ication)|scalar|equation|plug\s+into)\b/i.test(unquoted);
  const wantsReflection = /\b(?:reflect|theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|claim\s+boundary|conditions\s+of\s+the\s+civilization|social|energy|material)\b/i.test(unquoted);
  return wantsResearch && wantsQuantify && wantsReflection;
};

const requestedFormulaVariablesFromPrompt = (prompt: string): string[] => {
  const variables = ["n_m3", "T_eV", "B_T"].filter((variable) =>
    new RegExp(`\\b${variable.replace(/_/g, "[_\\s-]?")}\\b`, "i").test(prompt)
  );
  return Array.from(new Set(variables));
};

const buildResearchQuantifyReflectRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isResearchQuantifyReflectPrompt(prompt)) return [];
  const expression = extractCalculatorExpression(prompt);
  const unquoted = unquotePrompt(prompt);
  const wantsScholarly = /\b(?:research\s+papers?|papers?|arxiv|scholarly|doi)\b/i.test(unquoted);
  const wantsInternet = /\b(?:internet|web|current\s+sources?|online|search\s+the\s+web)\b/i.test(unquoted);
  const wantsTheory = /\b(?:reflect|theory\s+badge\s+graph|theory\s+graph|claim\s+boundary)\b/i.test(unquoted);
  const wantsCivilization = /\b(?:civilization\s+bounds?|civilization|social|energy|material|country|countries|transportation)\b/i.test(unquoted);
  const requestedFormulaVariables = requestedFormulaVariablesFromPrompt(prompt);
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
        query: cleanArgumentText(prompt) ?? prompt.slice(0, 160),
        mode: "paper_search",
        ...(requestedFormulaVariables.length ? { requested_variables: requestedFormulaVariables } : {}),
        source_target_intent: buildCompoundSourceTargetIntent({
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
        source_target_intent: buildCompoundSourceTargetIntent({
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
        source_target_intent: buildCompoundSourceTargetIntent({
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
        source_target_intent: buildCompoundSourceTargetIntent({
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
        source_target_intent: buildCompoundSourceTargetIntent({
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
      },
    });
  }
  return requests.length >= 2 ? requests : [];
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
    outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
    input.result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    input.result.ok === true
  ) {
    const observation = readRecord(input.result.observation);
    const papers = readArray(observation?.papers).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const firstPaper = papers[0];
    const paperResultId = readString(firstPaper?.result_id);
    if (!firstPaper) return null;
    return {
      schema: "helix.workstation_gateway.compound_dependency_bound_call_request.v1",
      derivation_source: "helix_compound_capability_dependency_planner",
      compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
      subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_full_text`,
      capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      mode: "read",
      arguments: {
        query: readString(observation?.query) ?? "paper full text",
        papers,
        paper: firstPaper,
        paper_result_id: paperResultId,
        requested_variables: readArray(readRecord(input.request.arguments)?.requested_variables)
          .map(readString)
          .filter((entry): entry is string => Boolean(entry)),
        source: "helix_compound_capability_dependency_planner",
        turn_id: input.turnId,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scholarly_research",
          target_kind: "scholarly_full_text",
          compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
          subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_full_text`,
          depends_on_subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_evidence`,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "source_ref_to_full_text",
          required_observation_kind: "helix.scholarly_full_text_observation.v1",
          required_affordance_kinds: ["source_ref", "citation_evidence"],
          produced_affordance_kind: "text_evidence",
          source_refs: input.result.observation_packet.produced_artifact_refs,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    };
  }
  if (
    outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
    input.result.capability_id === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY &&
    input.result.ok === true
  ) {
    const allResults = input.results?.length ? input.results : [input.result];
    const requestArgs = readRecord(input.request.arguments);
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
      compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
      subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:numeric_parameters`,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      mode: "read",
      arguments: {
        requested_variables: requestedVariables,
        full_text_observation: input.result.observation,
        source_ref: input.result.observation_packet.produced_artifact_refs[0],
        source: "helix_compound_capability_dependency_planner",
        turn_id: input.turnId,
        source_target_intent: {
          source: "helix_compound_capability_dependency_planner",
          target_source: "scholarly_research",
          target_kind: "numeric_parameter_extraction",
          compound_outcome: RESEARCH_QUANTIFY_REFLECT_OUTCOME,
          subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:numeric_parameters`,
          depends_on_subgoal_id: `${RESEARCH_QUANTIFY_REFLECT_OUTCOME}:scholarly_full_text`,
          depends_on_capability_id: input.result.capability_id,
          dependency_binding: "text_evidence_to_numeric_value_evidence",
          required_observation_kind: "helix.scholarly_numeric_parameter_observation.v1",
          required_affordance_kinds: ["text_evidence", "citation_evidence"],
          produced_affordance_kind: "numeric_value_evidence",
          requested_variables: requestedVariables,
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
    const satisfied = input.result.ok === true;
    const calculatorBinding = outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME &&
      (capability === THEORY_CONTEXT_REFLECTION_CAPABILITY || capability === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY)
        ? bindCalculatorExpressionFromResults(input.results?.length ? input.results : [input.result])
        : null;
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
    const firstBrokenRail = !satisfied
      ? {
          subgoal_id: subgoalId,
          capability_id: capability,
          reason: input.result.error ?? "observation_missing",
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
          satisfied,
          rail_status: satisfied ? "satisfied" : "missing_observation",
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
  const satisfied = result.ok === true;
  return {
    schema: "helix.compound_capability_subgoal_execution.v1",
    subgoal_id: subgoalId,
    ordinal: ordinal ?? 999,
    requested_capability: result.gateway_admission.requested_capability,
    selected_capability: result.capability_id,
    executed_capability: satisfied ? result.capability_id : null,
    required_observation_kind: requiredObservationKind,
    required_receipt_kind: requiredReceiptKind,
    observation_refs: producedRefs,
    receipt_refs: requiredReceiptKind ? producedRefs : [],
    satisfied,
    rail_status: satisfied ? "satisfied" : "missing_observation",
    error: result.error ?? null,
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
