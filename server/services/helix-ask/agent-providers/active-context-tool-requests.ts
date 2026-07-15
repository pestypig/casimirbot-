import { planWorkstationToolUse } from "../workstation-tool-planner";
import {
  CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
  CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
  CALCULATOR_SOLVE_ALIAS_CAPABILITIES,
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES,
  CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  DOCS_OPEN_DOC_ALIAS_CAPABILITIES,
  DOCS_OPEN_DOC_CAPABILITY,
  DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
  DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
  DOCS_SEARCH_CAPABILITY,
  INTERNET_SEARCH_ALIAS_CAPABILITIES,
  INTERNET_SEARCH_CAPABILITY,
  MAX_PROMPT_NAMED_CAPABILITY_REQUESTS,
  MORAL_GRAPH_REFLECTION_ALIAS_CAPABILITIES,
  MORAL_GRAPH_REFLECTION_CAPABILITY,
  MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
  REPO_SEARCH_ALIAS_CAPABILITIES,
  REPO_SEARCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  THEORY_FRONTIER_CONJECTURE_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  WORKSPACE_OS_STATUS_CAPABILITY,
  WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
  hasNegatedCalculatorExecutionInstruction,
  hasNegatedToolInstruction,
  normalizeDocPath,
  readArray,
  readPrompt,
  readRecord,
  readString,
  unquotePrompt,
} from "./explicit-tool-requests";
import { appendDedupe } from "./gateway-request-dedupe";
import {
  extractCalculatorMathTokenSequence,
  isWorkspaceOsStatusSelection,
} from "./prompt-named-tool-requests";
import {
  extractExplicitDocsSectionRequest,
  extractExplicitDocsLocateTerms,
  extractUnquotedDocsMarkdownPaths,
  isExplicitDocsPathLocatePrompt,
  isExplicitDocsPathSummaryPrompt,
} from "../docs-viewer-intent";

const HELIX_ASK_CAPABILITY_CATALOG_CAPABILITY = "helix_ask.inspect_capability_catalog" as const;
const SCIENTIFIC_CALCULATOR_THEORY_RUN_CONTEXT_CAPABILITY =
  "scientific-calculator.read_visible_theory_run_result" as const;

const isCapabilityCatalogSelection = (selectedCapability: string): boolean =>
  /^(?:helix_ask\.inspect_capability_catalog|helix\.ask\.inspect_capability_catalog|inspect_capability_catalog|capability_catalog|runtime_capability_catalog|capability_catalog_runtime)$/i.test(
    selectedCapability,
  );

export const readWorkspaceSnapshot = (body: Record<string, unknown>): Record<string, unknown> | null =>
  readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot);

export const readWorkspaceActivePanel = (workspaceSnapshot: Record<string, unknown> | null | undefined): string | null =>
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

export const readWorkspaceActiveDocPath = (workspaceSnapshot: Record<string, unknown> | null | undefined): string | null =>
  normalizeDocPath(
    workspaceSnapshot?.activeDocPath ??
      workspaceSnapshot?.activeDocumentPath ??
      workspaceSnapshot?.active_doc_path ??
      workspaceSnapshot?.active_document_path ??
      workspaceSnapshot?.docContextPath ??
      workspaceSnapshot?.doc_context_path,
  );

export const isActiveDocsViewerDeicticPrompt = (prompt: string): boolean => {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquotedPrompt = unquotePrompt(prompt).replace(
    /(?:^|[\s"'(])\/?docs\/[A-Za-z0-9_./-]+\.(?:md|mdx|txt)\b/gi,
    " ",
  );
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|interpret|summari[sz]e)\b.{0,100}\b(?:this|current|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:open|focus|use|show|read|summari[sz]e)\b.{0,50}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedPrompt)) return false;
  const mentionsCurrentDoc =
    /\b(?:this|current|open|active|visible)\b[\s\S]{0,80}\b(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedPrompt) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper)\s+(?:on\s+screen|in\s+(?:the\s+)?docs?\s+viewer|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotedPrompt) ||
    /\b(?:use|consult|check|read|inspect|apply|ground|base)\b[\s\S]{0,100}\b(?:NHM[-\s]?2\b[\s\S]{0,40})?(?:white\s*paper|whitepaper|document)\b[\s\S]{0,100}\b(?:document\s+)?evidence\b/i.test(unquotedPrompt);
  const asksForContent = /\b(?:summari[sz]e|synthesi[sz]e|explain|what\s+is|what'?s|about|key\s+(?:points|findings)|main\s+claim|claim\s+boundary|caveats?|read|use|include|observation)\b/i.test(unquotedPrompt);
  return mentionsCurrentDoc && asksForContent;
};

const DOCS_CONTENT_OPERATION_PATTERN =
  /\b(?:open|read|summari[sz]e|summary|explain|describe|docs?|document|paper|white\s*paper|whitepaper)\b/i;

const isImmediateExplicitDocsPathSummaryPrompt = (prompt: string): boolean => {
  if (!isExplicitDocsPathSummaryPrompt(prompt) && !isExplicitDocsPathLocatePrompt(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  const locatePrompt = isExplicitDocsPathLocatePrompt(prompt);
  const negatedLocateOperation = hasNegatedToolInstruction(
    prompt,
    /\b(?:find|locate|search|inspect|read)\b/i,
  );
  const negationIndex = unquoted.search(/\b(?:do\s+not|don't|dont|without|no\s+need\s+to|not\s+asking\s+to|avoid)\b/i);
  const hasAffirmativeLocateBeforeNegation =
    negationIndex > 0 && /\b(?:find|locate|search|inspect|read)\b/i.test(unquoted.slice(0, negationIndex));
  const hasBoundedSectionScopeConstraint =
    Boolean(extractExplicitDocsSectionRequest(prompt)) &&
    /\b(?:do\s+not|don't|dont|avoid)\b[\s\S]{0,140}\b(?:substitute|outside|another\s+section|other\s+sections?|elsewhere)\b/i.test(unquoted);
  const locateOperationIsActuallyNegated =
    negatedLocateOperation && !(hasAffirmativeLocateBeforeNegation && hasBoundedSectionScopeConstraint);
  if (locatePrompt ? locateOperationIsActuallyNegated : hasNegatedToolInstruction(prompt, DOCS_CONTENT_OPERATION_PATTERN)) {
    return false;
  }
  if (
    /\b(?:future|later|eventually|hypothetically|not\s+now)\b[\s\S]{0,180}\b(?:open|read|find|locate|search|summari[sz]e|summary|explain|describe)\b/i.test(unquoted) ||
    /\b(?:before|after|if|when)\b[\s\S]{0,140}\b(?:open|read|find|locate|search|summari[sz]e|summary|explain|describe)\b/i.test(unquoted) ||
    /\b(?:previously|earlier|historically|last\s+time)\b[\s\S]{0,180}\b(?:open|read|find|locate|search|summari[sz]e|summary|explain|describe)\b/i.test(unquoted) ||
    /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions|is\s+labeled)\b/i.test(unquoted)
  ) return false;
  return true;
};

export const buildActiveDocsContextWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const deicticPrompt = isActiveDocsViewerDeicticPrompt(prompt);
  const explicitPathSummaryPrompt = isImmediateExplicitDocsPathSummaryPrompt(prompt);
  if (!deicticPrompt && !explicitPathSummaryPrompt) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readWorkspaceActivePanel(workspaceSnapshot);
  const explicitDocPath = explicitPathSummaryPrompt
    ? normalizeDocPath(extractUnquotedDocsMarkdownPaths(prompt)[0])
    : null;
  const activeDocPath = explicitDocPath ?? readWorkspaceActiveDocPath(workspaceSnapshot);
  if (!activeDocPath) return [];
  const fileName = activeDocPath.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const exactLocateTerms = explicitDocPath ? extractExplicitDocsLocateTerms(prompt) : [];
  const sectionRequest = explicitDocPath ? extractExplicitDocsSectionRequest(prompt) : null;
  const query = sectionRequest?.headings.join(" ") ??
    (exactLocateTerms.length > 0 ? exactLocateTerms.join(" ") : fileName || activeDocPath);
  const derivationSource =
    explicitDocPath
      ? "helix_explicit_doc_path_context"
      : activePanel === "docs-viewer"
      ? "helix_active_docs_viewer_context"
      : "helix_retained_active_doc_context";
  return [{
    schema: "helix.workstation_gateway.active_docs_context_call_request.v1",
    derivation_source: derivationSource,
    capability_id: DOCS_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      query,
      paths: [activeDocPath],
      ...(exactLocateTerms.length > 0 ? { exact_terms: exactLocateTerms, max_hits: 40 } : {}),
      ...(sectionRequest
        ? {
            section_heading: sectionRequest.heading,
            section_headings: sectionRequest.headings,
            section_contains_terms: sectionRequest.contains_terms,
            section_match_unit: sectionRequest.match_unit,
            max_hits: 40,
          }
        : {}),
      source_target_intent: {
        source: derivationSource,
        target_source: "active_doc",
        target_kind: "active_doc",
        focused_panel: activePanel,
        active_panel: activePanel,
        active_doc_path: activeDocPath,
        retained_source_context: !explicitDocPath && activePanel !== "docs-viewer",
        deictic_prompt: deicticPrompt,
        explicit_doc_path: explicitDocPath,
      },
    },
  }];
};

export const isActiveCalculatorDeicticPrompt = (prompt: string): boolean => {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquotedPrompt = prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|interpret|summari[sz]e)\b.{0,80}\b(?:this|current|open|active|visible)\s+(?:calculation|calculator|expression|equation|result|answer)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:open|focus|use|show)\b.{0,40}\b(?:calculator|calculation|expression|equation|result)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:calculator|calculation|expression|equation|result|answer)\b/i.test(unquotedPrompt)) return false;
  const mentionsCurrentCalculator =
    /\b(?:this|current|open|active|visible)\s+(?:calculation|calculator|expression|equation|result|answer)\b/i.test(unquotedPrompt) ||
    /\b(?:calculation|calculator|expression|equation|result|answer)\s+(?:on\s+screen|in\s+(?:the\s+)?calculator|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotedPrompt);
  const asksForContent = /\b(?:what\s+is|what'?s|explain|summari[sz]e|interpret|use|read|tell\s+me|mean|means|result|answer)\b/i.test(unquotedPrompt);
  return mentionsCurrentCalculator && asksForContent;
};

export const hasNegatedSurfaceReadInstruction = (prompt: string): boolean =>
  hasNegatedToolInstruction(
    prompt,
    /\b(?:read|translate|summari[sz]e|narrat(?:e|or)|speak|surface|selected|hovered|visible|current|panel|doc|document|calculator|result)\b/i,
  );

export const isContextualSurfaceReadMention = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,140}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,140}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b/i.test(unquoted) ||
    /\b(?:explain|describe|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,140}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b[\s\S]{0,140}\b(?:mean|means|do|does|is|are|would)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|would|could|might)\b[\s\S]{0,160}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b/i.test(unquoted)
  );
};

export const isImageLensVisualRegionPrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (
    /\b(?:do\s+not|don'?t|dont|without|no\s+need\s+to|not\s+asking\s+to|avoid)\b[\s\S]{0,120}\b(?:image\s+lens|image-lens|attached\s+image|visible\s+image|crop|bbox|visual_analysis\.inspect_image_region)\b/i.test(unquoted)
  ) {
    return false;
  }
  const namesImageLensOrAttachment =
    /\b(?:image\s+lens|image-lens|attached\s+image|image\s+attachment|visible\s+image|current\s+image|open\s+image|visual_analysis\.inspect_image_region)\b/i.test(unquoted);
  const asksForFocusedVisualRegion =
    /\b(?:crop|bbox|bounding\s+box|region|area|look\s+closely|inspect|read|ocr|latex|equation|figure)\b/i.test(unquoted);
  return namesImageLensOrAttachment && asksForFocusedVisualRegion;
};

export const isExistingTranslationSurfaceReadPrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (
    /\b(?:future|later|eventually|hypothetically|would|could|might|before|after|if|when)\b[\s\S]{0,160}\b(?:translate|translated|translation)\b/i.test(unquoted) ||
    /\b(?:translate|translating)\b[\s\S]{0,100}\b(?:to|into|as|from)\b/i.test(unquoted) ||
    /\b(?:use|start|enable|turn\s+on|run|call)\b[\s\S]{0,100}\b(?:translation\s+lane|live_translation|translate(?:\s+text)?)\b/i.test(unquoted)
  ) {
    return false;
  }

  const asksToRead =
    /\b(?:read(?:\s+aloud)?|inspect|observe|check|show|describe|summari[sz]e|translate)\b/i.test(unquoted) ||
    /\bwhat(?:'s|\s+is|\s+does|\s+are)?\b[\s\S]{0,80}\b(?:translated\s+text|translation\s+surface|active\s+translation)\b/i.test(unquoted) ||
    /\bwhat\s+translated\s+text\b/i.test(unquoted);
  if (!asksToRead) return false;

  const existingTranslationSurface =
    /\b(?:active|current|visible|existing|rendered|shown|displayed)\b[\s\S]{0,80}\b(?:translation\s+surface|translated\s+(?:surface|text|section|block|paragraph|content)|active\s+translation(?:\s+(?:surface|text|section|block|paragraph|content))?)\b/i.test(unquoted) ||
    /\b(?:translation\s+surface|translated\s+(?:surface|text|section|block|paragraph|content)|active\s+translation(?:\s+(?:surface|text|section|block|paragraph|content))?)\b[\s\S]{0,80}\b(?:active|current|visible|existing|rendered|shown|displayed)\b/i.test(unquoted) ||
    /\b(?:translation\s+surface|translated\s+(?:surface|text|section|block|paragraph|content)|active\s+translation(?:\s+(?:surface|text|section|block|paragraph|content))?)\b/i.test(unquoted) ||
    /\balready[-\s]+translated\b[\s\S]{0,80}\b(?:surface|text|section|block|paragraph|content)\b/i.test(unquoted) ||
    /\b(?:surface|text|section|block|paragraph|content)\b[\s\S]{0,80}\balready[-\s]+translated\b/i.test(unquoted);

  return existingTranslationSurface;
};

export const buildPromptDerivedReadableSurfaceGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (isImageLensVisualRegionPrompt(prompt)) return [];
  if (hasNegatedSurfaceReadInstruction(prompt) || isContextualSurfaceReadMention(prompt)) return [];
  if (/\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice\s+(?:read|say|speak)|say\s+out\s+loud)\b/i.test(unquotePrompt(prompt))) {
    return [];
  }
  const unquoted = unquotePrompt(prompt);
  const asksTranslate = isExistingTranslationSurfaceReadPrompt(prompt);
  const asksSummarize = /\b(?:summari[sz]e|overview|brief)\b[\s\S]{0,120}\b(?:visible|selected|hovered|surface|section|block|calculator\s+result)\b/i.test(unquoted);
  const asksRead =
    /\b(?:read|inspect|observe)\b[\s\S]{0,120}\b(?:selected|hovered|visible|active)\b[\s\S]{0,80}\b(?:paragraph|section|block|surface|calculator\s+result|result)\b/i.test(unquoted) ||
    /\b(?:selected|hovered|visible|active)\b[\s\S]{0,80}\b(?:paragraph|section|block|surface|calculator\s+result|result)\b[\s\S]{0,80}\b(?:read|inspect|observe|say)\b/i.test(unquoted);
  if (!asksTranslate && !asksSummarize && !asksRead) return [];

  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readWorkspaceActivePanel(workspaceSnapshot);
  const activeDocPath = readWorkspaceActiveDocPath(workspaceSnapshot);
  const selectedText = readString(
    workspaceSnapshot?.selectedText ??
      workspaceSnapshot?.selected_text ??
      workspaceSnapshot?.selectedDocText ??
      workspaceSnapshot?.selected_doc_text,
  );
  const hoveredText = readString(
    workspaceSnapshot?.hoveredText ??
      workspaceSnapshot?.hovered_text ??
      workspaceSnapshot?.hoveredDocText ??
      workspaceSnapshot?.hovered_doc_text,
  );
  const selectionRef = readString(
    workspaceSnapshot?.selectionRef ??
      workspaceSnapshot?.selection_ref ??
      workspaceSnapshot?.narratorSourceId ??
      workspaceSnapshot?.narrator_source_id ??
      workspaceSnapshot?.selectedNarratorSourceId ??
      workspaceSnapshot?.selected_narrator_source_id,
  );
  const translationBlocks =
    Array.isArray(workspaceSnapshot?.active_translation_blocks)
      ? workspaceSnapshot.active_translation_blocks
      : Array.isArray(workspaceSnapshot?.activeTranslationBlocks)
        ? workspaceSnapshot.activeTranslationBlocks
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
  const calculatorContext =
    readRecord(workspaceSnapshot?.calculator_active_context) ??
    readRecord(workspaceSnapshot?.calculatorActiveContext) ??
    readRecord(workspaceSnapshot?.scientific_calculator) ??
    readRecord(workspaceSnapshot?.scientificCalculator);
  const mentionsCalculator = /\b(?:calculator|calculation|result)\b/i.test(unquoted) && activePanel === "scientific-calculator";
  const capabilityId = mentionsCalculator
    ? CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY
    : asksTranslate
      ? DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
      : DOCS_READ_VISIBLE_SURFACE_CAPABILITY;
  const selectionKind = /\bhovered\b/i.test(unquoted) ? "hovered" : /\bselected|highlighted\b/i.test(unquoted) ? "selected" : undefined;
  const surfaceOutcome = asksTranslate ? "translate_visible_surface" : asksSummarize ? "summarize_visible_surface" : "read_visible_surface";
  return [{
    schema: "helix.workstation_gateway.prompt_derived_readable_surface_call_request.v1",
    derivation_source: "helix_prompt_derived_readable_surface",
    surface_outcome: surfaceOutcome,
    capability_id: capabilityId,
    mode: "read",
    arguments: {
      label: mentionsCalculator
        ? "current calculator result"
        : asksTranslate
          ? "visible translated document surface"
          : selectionKind
            ? `${selectionKind} document paragraph`
            : "visible document surface",
      surface: selectionKind ?? (asksTranslate ? "active_translation" : mentionsCalculator ? "calculator_visible_result" : "visible_document"),
      source_doc_path: activeDocPath ?? undefined,
      selected_text: selectedText ?? undefined,
      hovered_text: hoveredText ?? undefined,
      selection_ref: selectionRef ?? undefined,
      selection_kind: selectionKind,
      text: asksTranslate ? translatedText : undefined,
      translation_blocks: translationBlocks,
      account_locale: asksTranslate ? accountLocale ?? undefined : undefined,
      target_language: asksTranslate ? targetLanguage ?? undefined : undefined,
      active_context: calculatorContext ?? undefined,
      source_target_intent: {
        source: "helix_prompt_derived_readable_surface",
        target_source: mentionsCalculator ? "scientific_calculator" : "docs_viewer",
        target_kind: mentionsCalculator
          ? "calculator_visible_result"
          : asksTranslate
            ? "docs_active_translation_surface"
            : selectionKind
              ? "docs_selected_or_hovered_surface"
              : "docs_visible_surface",
        surface_outcome: surfaceOutcome,
        required_observation_kind: "helix.workstation_readable_surface_observation.v1",
        focused_panel: activePanel,
        active_doc_path: activeDocPath,
        account_locale: asksTranslate ? accountLocale ?? null : null,
        target_language: asksTranslate ? targetLanguage ?? null : null,
        selection_required: Boolean(selectionKind),
        narrator_requested: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
  }];
};

export const buildActiveCalculatorContextWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isActiveCalculatorDeicticPrompt(prompt)) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readWorkspaceActivePanel(workspaceSnapshot);
  const activeCalculatorContext = readRecord(
    workspaceSnapshot?.activeCalculatorContext ?? workspaceSnapshot?.active_calculator_context,
  );
  if (activePanel !== "scientific-calculator" || !activeCalculatorContext) return [];
  return [{
    schema: "helix.workstation_gateway.active_calculator_context_call_request.v1",
    derivation_source: "helix_active_scientific_calculator_context",
    capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
    mode: "read",
    arguments: {
      active_context: activeCalculatorContext,
      source_target_intent: {
        source: "helix_active_scientific_calculator_context",
        target_source: "active_calculator",
        target_kind: "active_calculator",
        active_panel: activePanel,
        deictic_prompt: true,
      },
    },
  }];
};

export const buildActiveTheoryRuntimeContextWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const unquoted = unquotePrompt(prompt);
  if (
    /\b(?:do\s+not|don'?t|without|not\s+asking\s+to)\b[\s\S]{0,100}\b(?:explain|interpret|use|read)\b[\s\S]{0,80}\b(?:runtime|result|receipt)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|before|after|if|when)\b[\s\S]{0,140}\b(?:explain|interpret|use|read)\b[\s\S]{0,80}\b(?:runtime|result|receipt)\b/i.test(unquoted) ||
    /\b(?:previously|earlier|historically|last\s+time)\b[\s\S]{0,120}\b(?:runtime|result|receipt)\b/i.test(unquoted) ||
    /\b(?:screen|button|label|text|phrase)\b[\s\S]{0,100}\b(?:says|shows|reads|mentions)\b[\s\S]{0,100}\b(?:runtime|result|receipt)\b/i.test(unquoted)
  ) return [];
  if (!/\b(?:explain|interpret|summari[sz]e|what\s+does|what\s+is)\b[\s\S]{0,180}\b(?:selected|current|visible|this)\b[\s\S]{0,100}\b(?:runtime\s+)?(?:result|receipt|report)\b/i.test(unquoted)) {
    return [];
  }
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const context = readRecord(
    workspaceSnapshot?.activeTheoryRuntimeContext ?? workspaceSnapshot?.active_theory_runtime_context,
  );
  const requestId = readString(context?.requestId ?? context?.request_id);
  const receiptId = readString(context?.receiptId ?? context?.receipt_id);
  if (!context || !requestId || !receiptId) return [];
  return [{
    schema: "helix.workstation_gateway.active_theory_runtime_context_call_request.v1",
    derivation_source: "helix_explicit_theory_runtime_result_context",
    capability_id: SCIENTIFIC_CALCULATOR_THEORY_RUN_CONTEXT_CAPABILITY,
    mode: "read",
    arguments: {
      request_id: requestId,
      receipt_id: receiptId,
      theory_runtime_context: context,
      source_target_intent: {
        source: "helix_explicit_theory_runtime_result_context",
        target_source: "scientific_calculator_theory_runtime_result",
        target_kind: "theory_runtime_receipt",
        request_id: requestId,
        receipt_id: receiptId,
        output_role: "evidence_for_synthesis",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
  }];
};

export const isActiveWorkstationContextPrompt = (prompt: string): boolean => {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquotedPrompt = prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (
    /\b(?:do\s+not|don'?t|no)\b.{0,80}\b(?:run|call|use|execute)\s+(?:any\s+)?(?:tools?|workstation\s+tools?|gateway\s+calls?)\b/i.test(unquotedPrompt)
  ) {
    return false;
  }
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|inspect)\b.{0,80}\b(?:current|active|open|visible)\s+(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:open|focus|switch|show)\b.{0,40}\b(?:panel|workspace|workstation)\b/i.test(unquotedPrompt)) return false;
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedPrompt)) return false;
  const mentionsPanelContext =
    /\b(?:current|active|open|visible)\s+(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedPrompt) ||
    /\b(?:panel|panels)\s+(?:open|active|visible|on\s+screen|in\s+(?:the\s+)?workspace)\b/i.test(unquotedPrompt) ||
    /\bwhat\s+(?:panel|panels)\s+(?:is|are)\s+(?:open|active|visible)\b/i.test(unquotedPrompt);
  const asksForContext = /\b(?:what|which|where|list|show|tell\s+me|identify|inspect|read)\b/i.test(unquotedPrompt);
  return mentionsPanelContext && asksForContext;
};

export const buildActiveWorkstationContextGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isActiveWorkstationContextPrompt(prompt)) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  if (!workspaceSnapshot) return [];
  return [{
    schema: "helix.workstation_gateway.active_workstation_context_call_request.v1",
    derivation_source: "helix_active_workstation_context",
    capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
    mode: "read",
    arguments: {
      workspace_context: workspaceSnapshot,
      source_target_intent: {
        source: "helix_active_workstation_context",
        target_source: "active_workstation",
        target_kind: "active_workstation",
        deictic_prompt: true,
      },
    },
  }];
};

export const readCapabilitySelection = (record: Record<string, unknown> | null): string | null => {
  if (!record) return null;
  const mandatoryNextTool = readRecord(record.mandatory_next_tool ?? record.mandatoryNextTool);
  return (
    readString(record.selected_capability) ??
    readString(record.selectedCapability) ??
    readString(record.requested_capability) ??
    readString(record.requestedCapability) ??
    readString(record.capability_id) ??
    readString(record.capabilityId) ??
    readString(record.tool_name) ??
    readString(record.toolName) ??
    readString(mandatoryNextTool?.selected_capability) ??
    readString(mandatoryNextTool?.selectedCapability) ??
    readString(mandatoryNextTool?.required_capability) ??
    readString(mandatoryNextTool?.requiredCapability) ??
    readString(mandatoryNextTool?.tool_name) ??
    readString(mandatoryNextTool?.toolName)
  );
};

export const collectStructuredAdmissionRecords = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const routeMetadata = readRecord(body.route_metadata ?? body.routeMetadata);
  return [
    readRecord(body.source_target_intent ?? body.sourceTargetIntent),
    readRecord(body.capability_selection_result ?? body.capabilitySelectionResult),
    routeMetadata,
    readRecord(routeMetadata?.source_target_intent ?? routeMetadata?.sourceTargetIntent),
    readRecord(routeMetadata?.capability_selection_result ?? routeMetadata?.capabilitySelectionResult),
  ].filter((record): record is Record<string, unknown> => Boolean(record));
};

export const readGatewayQuery = (body: Record<string, unknown>, admission: Record<string, unknown>): string | null => {
  const args = readRecord(admission.args);
  const mandatoryNextTool = readRecord(admission.mandatory_next_tool ?? admission.mandatoryNextTool);
  const mandatoryArgs = readRecord(mandatoryNextTool?.args ?? mandatoryNextTool?.arguments);
  return (
    readString(args?.query) ??
    readString(args?.search_query) ??
    readString(args?.searchQuery) ??
    readString(args?.topic) ??
    readString(mandatoryArgs?.query) ??
    readString(mandatoryArgs?.search_query) ??
    readString(mandatoryArgs?.searchQuery) ??
    readString(mandatoryArgs?.topic) ??
    readPrompt(body)
  );
};

export const readGatewayCalculatorExpression = (
  body: Record<string, unknown>,
  admission: Record<string, unknown>,
): string | null => {
  const args = readRecord(admission.args);
  const mandatoryNextTool = readRecord(admission.mandatory_next_tool ?? admission.mandatoryNextTool);
  const mandatoryArgs = readRecord(mandatoryNextTool?.args ?? mandatoryNextTool?.arguments);
  const rawExpression =
    readString(args?.expression) ??
    readString(args?.latex) ??
    readString(args?.query) ??
    readString(mandatoryArgs?.expression) ??
    readString(mandatoryArgs?.latex) ??
    readString(mandatoryArgs?.query) ??
    readPrompt(body);
  return extractCalculatorMathTokenSequence(rawExpression);
};

export const readGatewayPaths = (admission: Record<string, unknown>): string[] => {
  const args = readRecord(admission.args);
  const mandatoryNextTool = readRecord(admission.mandatory_next_tool ?? admission.mandatoryNextTool);
  const mandatoryArgs = readRecord(mandatoryNextTool?.args ?? mandatoryNextTool?.arguments);
  const paths = args?.paths ?? args?.path ?? mandatoryArgs?.paths ?? mandatoryArgs?.path;
  if (Array.isArray(paths)) return paths.map(readString).filter((entry): entry is string => Boolean(entry));
  const path = readString(paths);
  return path ? [path] : [];
};

export const buildStructuredAdmissionWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const admission of collectStructuredAdmissionRecords(body)) {
    const selectedCapability = readCapabilitySelection(admission);
    if (!selectedCapability) continue;
    const paths = readGatewayPaths(admission);
    const sourceTargetIntent = {
      ...admission,
      source: "helix_structured_source_target_admission",
      selected_capability: selectedCapability,
    };
    if (
      selectedCapability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ||
      CALCULATOR_SOLVE_ALIAS_CAPABILITIES.includes(selectedCapability as typeof CALCULATOR_SOLVE_ALIAS_CAPABILITIES[number])
    ) {
      const prompt = readPrompt(body);
      if (prompt && hasNegatedCalculatorExecutionInstruction(prompt)) continue;
      const expression = readGatewayCalculatorExpression(body, admission);
      if (!expression) continue;
      const key = `${CALCULATOR_SOLVE_EXPRESSION_CAPABILITY}:${expression}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        mode: "read",
        arguments: {
          expression,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "scientific_calculator",
            target_kind: "calculator_solve",
            alias_capability: selectedCapability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ? undefined : selectedCapability,
            expression,
          },
        },
      });
      continue;
    }
    if (
      selectedCapability === DOCS_OPEN_DOC_CAPABILITY ||
      DOCS_OPEN_DOC_ALIAS_CAPABILITIES.includes(selectedCapability as typeof DOCS_OPEN_DOC_ALIAS_CAPABILITIES[number])
    ) {
      const key = `${DOCS_OPEN_DOC_CAPABILITY}:${paths[0] ?? "missing_path"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: DOCS_OPEN_DOC_CAPABILITY,
        mode: "act",
        arguments: {
          ...(paths[0] ? { path: paths[0] } : {}),
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "docs",
            target_kind: "docs_open_doc",
            alias_capability: selectedCapability === DOCS_OPEN_DOC_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
      continue;
    }
    const query = readGatewayQuery(body, admission);
    if (!query) continue;
    if (isCapabilityCatalogSelection(selectedCapability)) {
      const key = `${HELIX_ASK_CAPABILITY_CATALOG_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: HELIX_ASK_CAPABILITY_CATALOG_CAPABILITY,
        mode: "observe",
        arguments: {
          query,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "capability_catalog",
            target_kind: "capability_catalog_runtime",
            alias_capability:
              selectedCapability === HELIX_ASK_CAPABILITY_CATALOG_CAPABILITY ? undefined : selectedCapability,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      });
      continue;
    }
    if (
      selectedCapability === REPO_SEARCH_CAPABILITY ||
      REPO_SEARCH_ALIAS_CAPABILITIES.includes(selectedCapability as typeof REPO_SEARCH_ALIAS_CAPABILITIES[number])
    ) {
      const key = `${REPO_SEARCH_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: REPO_SEARCH_CAPABILITY,
        mode: "read",
        arguments: {
          query,
          ...(paths.length > 0 ? { paths } : {}),
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "repo_code",
            target_kind: "repo_search",
            alias_capability: selectedCapability === REPO_SEARCH_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
    }
    if (
      selectedCapability === "docs-viewer.locate_in_doc" ||
      selectedCapability === "docs-viewer.search_docs" ||
      selectedCapability === "docs-viewer.summarize_doc" ||
      selectedCapability === "docs-viewer.doc_equation_context" ||
      selectedCapability === DOCS_SEARCH_CAPABILITY
    ) {
      const key = `${DOCS_SEARCH_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: DOCS_SEARCH_CAPABILITY,
        mode: "read",
        arguments: {
          query,
          ...(paths.length > 0 ? { paths } : {}),
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "docs",
            target_kind: "docs_search",
            alias_capability: selectedCapability === DOCS_SEARCH_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
    }
    if (
      selectedCapability === INTERNET_SEARCH_CAPABILITY ||
      INTERNET_SEARCH_ALIAS_CAPABILITIES.includes(selectedCapability as typeof INTERNET_SEARCH_ALIAS_CAPABILITIES[number]) ||
      selectedCapability === "internet.search" ||
      selectedCapability === "web.search"
    ) {
      const key = `${INTERNET_SEARCH_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: INTERNET_SEARCH_CAPABILITY,
        mode: "read",
        arguments: {
          query,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "internet",
            target_kind: "internet_search",
            alias_capability: selectedCapability === INTERNET_SEARCH_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
    }
    if (
      selectedCapability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY ||
      selectedCapability === "scholarly.search" ||
      selectedCapability === "research-papers.search" ||
      selectedCapability === "research_papers.search"
    ) {
      const key = `${SCHOLARLY_RESEARCH_SEARCH_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        mode: "read",
        arguments: {
          query,
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (
      selectedCapability === THEORY_CONTEXT_REFLECTION_CAPABILITY ||
      THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES.includes(selectedCapability as typeof THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES[number])
    ) {
      const key = `${THEORY_CONTEXT_REFLECTION_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: query,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "theory_badge_graph",
            target_kind: "theory_context_reflection",
            alias_capability: selectedCapability === THEORY_CONTEXT_REFLECTION_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
    }
    if (
      selectedCapability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY ||
      CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES.includes(selectedCapability as typeof CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES[number])
    ) {
      const key = `${CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: query,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "civilization_bounds",
            target_kind: "civilization_bounds_reflection",
            alias_capability: selectedCapability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY ? undefined : selectedCapability,
          },
        },
      });
    }
    if (selectedCapability === MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY) {
      const key = `${MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: query,
          conversation_context: readPrompt(body) ?? query,
          include_theory_bridge: true,
          include_recommended_actions: true,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "moral_graph",
            target_kind: "moral_living_substrate_reflection",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      });
    }
    if (
      selectedCapability === MORAL_GRAPH_REFLECTION_CAPABILITY ||
      MORAL_GRAPH_REFLECTION_ALIAS_CAPABILITIES.includes(selectedCapability as typeof MORAL_GRAPH_REFLECTION_ALIAS_CAPABILITIES[number])
    ) {
      const key = `${MORAL_GRAPH_REFLECTION_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: MORAL_GRAPH_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: query,
          conversation_context: readPrompt(body) ?? query,
          include_locator: true,
          include_fruition: true,
          include_procedural_classification: true,
          include_recommended_actions: true,
          include_admissions: true,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "moral_graph",
            target_kind: "moral_graph_reflection",
            alias_capability: selectedCapability === MORAL_GRAPH_REFLECTION_CAPABILITY ? undefined : selectedCapability,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      });
    }
    if (isWorkspaceOsStatusSelection(selectedCapability)) {
      const key = `${WORKSPACE_OS_STATUS_CAPABILITY}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: WORKSPACE_OS_STATUS_CAPABILITY,
        mode: "observe",
        arguments: {
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (
      selectedCapability === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY ||
      selectedCapability === VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY ||
      selectedCapability === VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY
    ) {
      const key = `${selectedCapability}:${query}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        schema: "helix.workstation_gateway.structured_admission_call_request.v1",
        derivation_source: "helix_structured_source_target_admission",
        capability_id: selectedCapability,
        mode: "read",
        arguments: {
          summary: query,
          source_target_intent: {
            ...sourceTargetIntent,
            target_source: "visual_observer",
            target_kind: selectedCapability,
          },
        },
      });
    }
  }
  return requests.slice(0, MAX_PROMPT_NAMED_CAPABILITY_REQUESTS);
};

export const buildPlannerDerivedWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const blocksCalculatorExecution = hasNegatedCalculatorExecutionInstruction(prompt);
  const planned = planWorkstationToolUse(prompt, {
    turnId: readString(body.turn_id) ?? readString(body.turnId),
    threadId: readString(body.thread_id) ?? readString(body.threadId),
    workspaceSnapshot: readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot),
  });
  if (!planned.should_use_tool || planned.missing_required_args.length > 0) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const addPlannerRequest = (request: Record<string, unknown>): void => appendDedupe(requests, seen, [request]);
  const buildPlannerNextAffordance = (request: Record<string, unknown>): Record<string, unknown> | null => {
    const capability = readString(request.capability_id) ?? readString(request.capabilityId);
    if (!capability) return null;
    const args = readRecord(request.arguments) ?? {};
    const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
    return {
      schema: "helix.provider_next_affordance.v1",
      source: "helix_workstation_tool_planner",
      capability,
      mode: readString(request.mode) ?? "read",
      purpose: "codex_selected_followup_tool",
      reason: "available_after_observation_reentry",
      planner_intent: readString(request.planner_intent) ?? planned.intent,
      planner_reason: readString(request.planner_reason) ?? planned.reason,
      expression: readString(args.expression) ?? readString(args.latex),
      source_target_intent: {
        ...sourceTargetIntent,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  };
  const attachPlannerNextAffordances = (
    request: Record<string, unknown>,
    affordances: Record<string, unknown>[],
  ): Record<string, unknown> => {
    if (affordances.length === 0) return request;
    const args = readRecord(request.arguments) ?? {};
    const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
    return {
      ...request,
      arguments: {
        ...args,
        next_affordances: [
          ...readArray(args.next_affordances),
          ...affordances,
        ],
        source_target_intent: {
          ...sourceTargetIntent,
          next_affordances: [
            ...readArray(sourceTargetIntent.next_affordances),
            ...affordances,
          ],
        },
      },
    };
  };
  const reducePlannerReasoningChainToPrimaryRequest = (
    nextRequests: Record<string, unknown>[],
  ): Record<string, unknown>[] => {
    if (planned.intent === "physics_calculation_context") {
      const reflectionRequest = nextRequests.find((request) =>
        readString(request.capability_id) === THEORY_CONTEXT_REFLECTION_CAPABILITY
      );
      const calculatorRequests = nextRequests.filter((request) =>
        readString(request.capability_id) === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY
      );
      if (!reflectionRequest || calculatorRequests.length === 0) return nextRequests;
      const affordances = calculatorRequests
        .map(buildPlannerNextAffordance)
        .filter((affordance): affordance is Record<string, unknown> => Boolean(affordance));
      return [attachPlannerNextAffordances(reflectionRequest, affordances)];
    }
    if (planned.intent === "moral_living_substrate_reflection") {
      const moralRequest = nextRequests.find((request) =>
        readString(request.capability_id) === MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY
      );
      if (!moralRequest) return nextRequests;
      const affordances = nextRequests
        .filter((request) => request !== moralRequest)
        .filter((request) =>
          [
            THEORY_CONTEXT_REFLECTION_CAPABILITY,
            CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
            SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
            INTERNET_SEARCH_CAPABILITY,
          ].includes(String(readString(request.capability_id) ?? "")),
        )
        .map(buildPlannerNextAffordance)
        .filter((affordance): affordance is Record<string, unknown> => Boolean(affordance));
      const retained = nextRequests.filter((request) => {
        if (request === moralRequest) return false;
        const capability = readString(request.capability_id);
        return ![
          THEORY_CONTEXT_REFLECTION_CAPABILITY,
          CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
          SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
          INTERNET_SEARCH_CAPABILITY,
        ].includes(String(capability ?? ""));
      });
      const moralArgs = readRecord(moralRequest.arguments) ?? {};
      const moralSourceTargetIntent = readRecord(moralArgs.source_target_intent) ?? {};
      const primaryMoralRequest = {
        ...moralRequest,
        arguments: {
          ...moralArgs,
          source_target_intent: {
            ...moralSourceTargetIntent,
            depends_on: [],
          },
        },
      };
      return [attachPlannerNextAffordances(primaryMoralRequest, affordances), ...retained];
    }
    return nextRequests;
  };
  const addCalculatorSolve = (expression: string, source: Record<string, unknown>): void => {
    if (blocksCalculatorExecution) return;
    addPlannerRequest({
      schema: "helix.workstation_gateway.planner_derived_call_request.v1",
      derivation_source: "helix_workstation_tool_planner",
      planner_intent: planned.intent,
      planner_reason: planned.reason,
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      mode: "read",
      arguments: {
        expression,
        source_target_intent: {
          source: "helix_workstation_tool_planner",
          intent: planned.intent,
          ...source,
          tool_plan_id: planned.tool_plan?.plan_id ?? null,
        },
      },
    });
  };
  const action = planned.action;
  if (
    action?.panel_id === "scientific-calculator" &&
    (action.action_id === "solve_expression" || action.action_id === "solve_with_steps")
  ) {
    const expression = readString(action.args.latex) ?? readString(action.args.expression);
    if (expression) addCalculatorSolve(expression, { panel_id: action.panel_id, action_id: action.action_id });
  }
  for (const step of planned.tool_plan?.steps ?? []) {
    if (
      step.kind === "run_panel_action" &&
      step.panel_id === "scientific-calculator" &&
      (step.action_id === "solve_expression" || step.action_id === "solve_with_steps")
    ) {
      const args = readRecord(step.args) ?? {};
      const expression = readString(args.latex) ?? readString(args.expression);
      if (expression) {
        addCalculatorSolve(expression, {
          panel_id: step.panel_id,
          action_id: step.action_id,
          step_id: step.step_id,
        });
      }
    }
    if (
      step.tool_id === "helix_ask.reflect_theory_context" ||
      (step.kind === "run_panel_action" &&
        step.panel_id === "theory-badge-graph" &&
        step.action_id === "reflect_discussion_context")
    ) {
      const args = readRecord(step.args) ?? {};
      const reflectionPrompt = readString(args.prompt) ?? prompt;
      addPlannerRequest({
        schema: "helix.workstation_gateway.planner_derived_call_request.v1",
        derivation_source: "helix_workstation_tool_planner",
        planner_intent: planned.intent,
        planner_reason: planned.reason,
        capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: reflectionPrompt,
          conversation_context: prompt,
          build_explanation_plan: args.build_explanation_plan ?? args.buildExplanationPlan ?? true,
          source_target_intent: {
            source: "helix_workstation_tool_planner",
            intent: planned.intent,
            step_id: step.step_id,
            tool_id: step.tool_id ?? null,
            panel_id: step.panel_id ?? null,
            action_id: step.action_id ?? null,
            tool_plan_id: planned.tool_plan?.plan_id ?? null,
          },
        },
      });
    }
    if (
      step.tool_id === THEORY_FRONTIER_CONJECTURE_CAPABILITY ||
      (step.kind === "run_panel_action" &&
        step.panel_id === "theory-badge-graph" &&
        step.action_id === "propose_frontier_conjectures")
    ) {
      const args = readRecord(step.args) ?? {};
      const frontierPrompt = readString(args.prompt) ?? readString(args.query) ?? prompt;
      addPlannerRequest({
        schema: "helix.workstation_gateway.planner_derived_call_request.v1",
        derivation_source: "helix_workstation_tool_planner",
        planner_intent: planned.intent,
        planner_reason: planned.reason,
        capability_id: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: frontierPrompt,
          conversation_context: prompt,
          frontier_search_seed: readString(args.frontier_search_seed ?? args.frontierSearchSeed) ?? undefined,
          source_target_intent: {
            source: "helix_workstation_tool_planner",
            intent: planned.intent,
            step_id: step.step_id,
            tool_id: step.tool_id ?? null,
            panel_id: step.panel_id ?? null,
            action_id: step.action_id ?? null,
            tool_plan_id: planned.tool_plan?.plan_id ?? null,
          },
        },
      });
    }
    if (step.tool_id === MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY) {
      const args = readRecord(step.args) ?? {};
      const reflectionPrompt = readString(args.prompt) ?? prompt;
      addPlannerRequest({
        schema: "helix.workstation_gateway.planner_derived_call_request.v1",
        derivation_source: "helix_workstation_tool_planner",
        planner_intent: planned.intent,
        planner_reason: planned.reason,
        capability_id: MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: reflectionPrompt,
          conversation_context: prompt,
          include_theory_bridge: args.include_theory_bridge ?? args.includeTheoryBridge ?? true,
          include_recommended_actions:
            args.include_recommended_actions ?? args.includeRecommendedActions ?? true,
          source_target_intent: {
            source: "helix_workstation_tool_planner",
            target_source: "moral_graph",
            target_kind: "moral_living_substrate_reflection",
            intent: planned.intent,
            step_id: step.step_id,
            tool_id: step.tool_id,
            tool_plan_id: planned.tool_plan?.plan_id ?? null,
            depends_on: step.depends_on ?? [],
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      });
    }
    if (step.tool_id === "helix_ask.reflect_civilization_bounds") {
      const args = readRecord(step.args) ?? {};
      const reflectionPrompt = readString(args.prompt) ?? prompt;
      addPlannerRequest({
        schema: "helix.workstation_gateway.planner_derived_call_request.v1",
        derivation_source: "helix_workstation_tool_planner",
        planner_intent: planned.intent,
        planner_reason: planned.reason,
        capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        mode: "read",
        arguments: {
          prompt: reflectionPrompt,
          include_bridge_context: true,
          include_collaboration_bounds: true,
          include_falsification_hooks: true,
          source_target_intent: {
            source: "helix_workstation_tool_planner",
            intent: planned.intent,
            step_id: step.step_id,
            tool_id: step.tool_id,
            tool_plan_id: planned.tool_plan?.plan_id ?? null,
          },
        },
      });
    }
  }
  return reducePlannerReasoningChainToPrimaryRequest(requests).slice(0, 10);
};
