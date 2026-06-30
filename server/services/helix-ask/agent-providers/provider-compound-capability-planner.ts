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
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say" as const;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

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
  /\b(?:docs\.search|repo\.search|scientific-calculator\.solve_expression|theory-badge-graph\.reflect_discussion_context|civilization-bounds\.reflect_system_bounds|internet-search\.search_web|scholarly-research\.lookup_papers)\b/i.test(
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
  const direct =
    unquoted.match(/\b(?:calculate|compute|evaluate|solve)\s+([0-9][0-9\s+*/().^%-]{1,120}[0-9)]?)/i)?.[1] ??
    unquoted.match(/\b(?:expression|scalar|sanity\s+check)\s+([0-9][0-9\s+*/().^%-]{1,120}[0-9)]?)/i)?.[1] ??
    unquoted.match(/\b([0-9]+(?:\s*[+*/^%-]\s*[0-9]+)+)\b/)?.[1] ??
    null;
  const cleaned = direct?.replace(/\s+/g, "").replace(/[^0-9+*/().^%-]/g, "") ?? "";
  return cleaned && /[+*/^%-]/.test(cleaned) ? cleaned : null;
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
    activePanel: readString(
      workspaceSnapshot?.activePanel ??
        workspaceSnapshot?.active_panel ??
        workspaceSnapshot?.focusedPanel ??
        workspaceSnapshot?.focused_panel,
    ),
    activeDocPath: normalizeDocPath(
      workspaceSnapshot?.activeDocPath ??
        workspaceSnapshot?.active_doc_path ??
        workspaceSnapshot?.docContextPath ??
        workspaceSnapshot?.doc_context_path,
    ),
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
  const wantsResearch = /\b(?:research\s+papers?|papers?|arxiv|scholarly|internet|web|sources?|corroborat(?:e|ion)|retrieve\s+evidence|look\s+up)\b/i.test(unquoted);
  const wantsQuantify = /\b(?:calculate|compute|estimate|quantif(?:y|ication)|scalar|equation|plug\s+into)\b/i.test(unquoted);
  const wantsReflection = /\b(?:reflect|theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|claim\s+boundary|conditions\s+of\s+the\s+civilization|social|energy|material)\b/i.test(unquoted);
  return wantsResearch && wantsQuantify && wantsReflection;
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
  const outcome = RESEARCH_QUANTIFY_REFLECT_OUTCOME;
  const { activePanel, activeDocPath } = readActivePanelAndDoc(body);
  const edges = [
    { from: `${outcome}:research_evidence`, to: `${outcome}:calculator_estimate`, binding: "research_result_to_numeric_estimate" },
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
  return requests.length >= 3 ? requests : [];
};

const buildReadAloudSurfaceRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readString(
    workspaceSnapshot?.activePanel ??
      workspaceSnapshot?.active_panel ??
      workspaceSnapshot?.focusedPanel ??
      workspaceSnapshot?.focused_panel,
  );
  const activeDocPath = normalizeDocPath(
    workspaceSnapshot?.activeDocPath ??
      workspaceSnapshot?.active_doc_path ??
      workspaceSnapshot?.docContextPath ??
      workspaceSnapshot?.doc_context_path,
  );
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
  const activePanel = readString(
    workspaceSnapshot?.activePanel ??
      workspaceSnapshot?.active_panel ??
      workspaceSnapshot?.focusedPanel ??
      workspaceSnapshot?.focused_panel,
  );
  const activeDocPath = normalizeDocPath(
    workspaceSnapshot?.activeDocPath ??
      workspaceSnapshot?.active_doc_path ??
      workspaceSnapshot?.docContextPath ??
      workspaceSnapshot?.doc_context_path,
  );
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
  turnId: string;
}): Record<string, unknown> | null => {
  const outcome = readString(input.request.compound_outcome);
  const dependentCapability =
    readString(input.request.dependent_capability_id) ?? readString(input.request.dependentCapabilityId);
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
    return {
      schema: "helix.compound_capability_dependency_plan.v1",
      source: "helix_compound_capability_dependency_planner",
      compound_outcome: outcome,
      subgoals: [{
        subgoal_id: subgoalId,
        ordinal,
        requested_capability: capability,
        executed_capability: input.result.capability_id === capability ? capability : null,
        required_observation_kind: requiredObservationKind,
        satisfied,
        rail_status: satisfied ? "satisfied" : "missing_observation",
        assistant_answer: false,
        raw_content_included: false,
      }],
      dependency_edges: Array.isArray(sourceTargetIntent?.dependency_edges)
        ? sourceTargetIntent.dependency_edges
        : [],
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
