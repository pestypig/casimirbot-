import { isWorkspaceOsStatusPrompt, workspaceOsStatusReasonCodes } from "../workspace-os-status-intent";
import { detectInternetSearchIntent } from "../internet-search-intent";
import {
  detectScholarlyResearchIntent,
  extractScholarlyArxivId,
  extractScholarlyDoi,
  extractScholarlySourceUrl,
  hasDirectScholarlyFullTextSourceIntent,
} from "../scholarly-research-intent";
import { moralGraphPolicyAllowsProceduralBadgeReflection } from "../../../../shared/moral-graph/moral-graph-agent-invocation-policy";
import {
  SHARED_INTERFACE_LANGUAGE_CODES,
  type SharedInterfaceLanguageCode,
} from "@shared/interface-language-codes";
import {
  ACCOUNT_SESSION_SET_INTERFACE_LANGUAGE_CAPABILITY,
  CALCULATOR_SOLVE_ALIAS_CAPABILITIES,
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES,
  CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  DOCS_OPEN_DOC_ALIAS_CAPABILITIES,
  DOCS_OPEN_DOC_CAPABILITY,
  DOCS_SEARCH_ALIAS_CAPABILITIES,
  DOCS_SEARCH_CAPABILITY,
  INTERNET_SEARCH_ALIAS_CAPABILITIES,
  INTERNET_SEARCH_CAPABILITY,
  LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES,
  LIVE_SOURCE_MAILBOX_READ_CAPABILITIES,
  LIVE_SOURCE_STATE_READ_CAPABILITIES,
  MORAL_GRAPH_REFLECTION_ALIAS_CAPABILITIES,
  MORAL_GRAPH_REFLECTION_CAPABILITY,
  MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
  MAX_PROMPT_NAMED_CAPABILITY_REQUESTS,
  PROMPT_NAMED_CAPABILITIES,
  REPO_SEARCH_ALIAS_CAPABILITIES,
  REPO_SEARCH_CAPABILITY,
  SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  SITUATION_STAGE_STATE_READ_CAPABILITIES,
  STAGE_PLAY_BUILDER_READ_CAPABILITIES,
  TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  THEORY_FRONTIER_CONJECTURE_ALIAS_CAPABILITIES,
  THEORY_FRONTIER_CONJECTURE_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  VOICE_INTERIM_CALLOUT_CAPABILITY,
  VOICE_NARRATOR_SAY_CAPABILITY,
  WORKSPACE_OS_STATUS_CAPABILITY,
  WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES,
  hasNegatedCalculatorExecutionInstruction,
  hasNegatedScholarlyResearchInstruction,
  hasNegatedToolInstruction,
  normalizeDocPath,
  readPrompt,
  readRecord,
  readString,
  unquotePrompt,
} from "./explicit-tool-requests";
import { appendDedupe } from "./gateway-request-dedupe";
import {
  HELIX_RESEARCH_LIBRARY_READ_CAPABILITY,
  isSavedResearchLibraryEvidencePrompt,
} from "@shared/helix-research-library";

export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const promptNamedCapabilityPattern = (capabilityId: string): RegExp =>
  new RegExp(`(?:^|[^A-Za-z0-9_.-])${escapeRegExp(capabilityId)}(?=$|[\\s,;:!?)]|\\.(?:\\s|$))`, "i");

export const isContextualPromptNamedCapabilityMention = (prompt: string, capabilityId: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  const capability = escapeRegExp(capabilityId);
  const capabilityTokenMention = unquoted.toLowerCase().split(/[^a-z0-9_.-]+/i).includes(capabilityId.toLowerCase());
  const affirmativeOperatorMention =
    capabilityTokenMention && /^\s*(?:please\s+)?(?:use|run|call|execute|query|read|check)\b/i.test(unquoted);
  const contextualMarker =
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui|future|later|eventually|hypothetically|would|could|might|do\s+not|don't|dont|without|not\s+asking\s+to)\b/i.test(
      unquoted,
    );
  if (affirmativeOperatorMention && !contextualMarker) return false;
  const contextualPatterns = [
    new RegExp(`\\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\\b[\\s\\S]{0,120}\\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\\b[\\s\\S]{0,120}${capability}`, "i"),
    new RegExp(`${capability}[\\s\\S]{0,120}\\b(?:as\\s+text|text\\s+only|phrase\\s+only|do\\s+not\\s+run|don't\\s+run|without\\s+running)\\b`, "i"),
    new RegExp(`\\b(?:explain|describe|what\\s+does|what\\s+is|what\\s+are)\\b[\\s\\S]{0,120}${capability}[\\s\\S]{0,120}\\b(?:mean|means|do|does|is|are|would)\\b`, "i"),
    new RegExp(`\\b(?:future|later|eventually|hypothetically|if|when|would|could|might)\\b[\\s\\S]{0,140}${capability}`, "i"),
  ];
  return contextualPatterns.some((pattern) => pattern.test(unquoted));
};

export const hasPromptNamedCapability = (prompt: string, capabilityId: string): boolean =>
  (
    promptNamedCapabilityPattern(capabilityId).test(unquotePrompt(prompt)) ||
    unquotePrompt(prompt).toLowerCase().split(/[^a-z0-9_.-]+/i).includes(capabilityId.toLowerCase())
  ) &&
  !isContextualPromptNamedCapabilityMention(prompt, capabilityId);

export const isWorkspaceOsStatusSelection = (capabilityId: string): boolean =>
  capabilityId === WORKSPACE_OS_STATUS_CAPABILITY ||
  capabilityId === "workspace_diagnostic" ||
  capabilityId === "workspace_status" ||
  capabilityId === "workspace_os_status";

export const readPromptNamedCapabilitySegment = (prompt: string, capabilityId: string): string | null => {
  const unquoted = unquotePrompt(prompt);
  const pattern = promptNamedCapabilityPattern(capabilityId);
  const match = pattern.exec(unquoted);
  if (!match) return null;
  const matchText = match[0] ?? "";
  const capabilityOffset = matchText.toLowerCase().indexOf(capabilityId.toLowerCase());
  const start = match.index + Math.max(0, capabilityOffset);
  const afterCapability = start + capabilityId.length;
  const after = unquoted.slice(afterCapability);
  let end = after.length;
  const semicolonIndex = after.search(/[;\n]/);
  if (semicolonIndex >= 0) end = Math.min(end, semicolonIndex);
  for (const nextCapability of PROMPT_NAMED_CAPABILITIES) {
    if (nextCapability === capabilityId) continue;
    const nextMatch = promptNamedCapabilityPattern(nextCapability).exec(after);
    if (nextMatch && nextMatch.index >= 0) end = Math.min(end, nextMatch.index);
  }
  return after.slice(0, end).trim();
};

export const cleanNamedCapabilityArgumentText = (value: string | null | undefined): string | null => {
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

const interfaceLanguageAliases: Record<SharedInterfaceLanguageCode, readonly string[]> = {
  en: ["en", "english"],
  haw: ["haw", "hawaiian", "olelo hawaii", "ʻōlelo hawaiʻi", "olelo hawaiian"],
  es: ["es", "spanish", "espanol", "español"],
  fr: ["fr", "french", "francais", "français"],
  de: ["de", "german", "deutsch"],
  pt: ["pt", "portuguese", "portugues", "português", "brazilian portuguese"],
  ja: ["ja", "japanese", "nihongo"],
  ko: ["ko", "korean", "hanguk"],
  zh: ["zh", "chinese", "simplified chinese", "mandarin"],
  ar: ["ar", "arabic"],
  wo: ["wo", "wolof"],
};

const normalizeInterfaceLanguageText = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻ'`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const readInterfaceLanguageCodeFromText = (value: string): SharedInterfaceLanguageCode | null => {
  const normalized = normalizeInterfaceLanguageText(value);
  const tokens = new Set(normalized.split(/\s+/).filter(Boolean));
  for (const code of SHARED_INTERFACE_LANGUAGE_CODES) {
    if (tokens.has(code)) return code;
  }
  for (const code of SHARED_INTERFACE_LANGUAGE_CODES) {
    for (const alias of interfaceLanguageAliases[code]) {
      const normalizedAlias = normalizeInterfaceLanguageText(alias);
      if (normalized === normalizedAlias || normalized.includes(normalizedAlias)) return code;
    }
  }
  return null;
};

const hasContextualInterfaceLanguageActionMention = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:do\s+not|don't|dont|without|no\s+need\s+to|not\s+asking\s+to|avoid|should\s+not)\b[\s\S]{0,120}\b(?:interface|ui|workstation|account|session)?\s*language\b/i.test(unquoted) ||
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,140}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,140}\b(?:interface|ui|workstation|account|session)?\s*language\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|if|when|after|before|would|could|might)\b[\s\S]{0,160}\b(?:set|switch|change|update|use)\b[\s\S]{0,120}\b(?:interface|ui|workstation|account|session)?\s*language\b/i.test(unquoted)
  );
};

const extractInterfaceLanguageActionCode = (prompt: string): SharedInterfaceLanguageCode | null => {
  if (hasContextualInterfaceLanguageActionMention(prompt)) return null;
  const unquoted = unquotePrompt(prompt);
  const hasAffirmativeLanguageAction =
    /\b(?:set|switch|change|update|use)\b[\s\S]{0,120}\b(?:interface|ui|workstation|account|session)?\s*language\b/i.test(unquoted) ||
    /\b(?:set|switch|change|update|use)\b[\s\S]{0,120}\b(?:interface|ui|workstation)\b[\s\S]{0,120}\b(?:to|into)\b/i.test(unquoted) ||
    (
      hasPromptNamedCapability(prompt, ACCOUNT_SESSION_SET_INTERFACE_LANGUAGE_CAPABILITY) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(ACCOUNT_SESSION_SET_INTERFACE_LANGUAGE_CAPABILITY))
    );
  if (!hasAffirmativeLanguageAction) return null;
  return readInterfaceLanguageCodeFromText(unquoted);
};

export const hasContextualTheoryReflectionMention = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:not\s+asking\s+(?:you\s+)?to|not\s+asking\s+for|don'?t|do\s+not|never|without)\b[\s\S]{0,100}\b(?:fetch|get|read|show|use|run|call|execute)\b[\s\S]{0,80}\btheory\s+(?:context\s+)?reflection\b/i.test(unquoted) ||
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,120}\btheory\s+(?:context\s+)?reflection\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|if|when|after|before|would|could|might)\b[\s\S]{0,140}\b(?:fetch|get|read|show|use|run|call|execute)\b[\s\S]{0,80}\btheory\s+(?:context\s+)?reflection\b/i.test(unquoted) ||
    /\b(?:explain|describe|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,120}\btheory\s+(?:context\s+)?reflection\b[\s\S]{0,120}\b(?:mean|means|do|does|is|are|would)\b/i.test(unquoted)
  );
};

export const hasContextualMoralGraphReflectionMention = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:not\s+asking\s+(?:you\s+)?to|not\s+asking\s+for|don'?t|do\s+not|never|without)\b[\s\S]{0,100}\b(?:fetch|get|read|show|use|run|call|execute|reflect)\b[\s\S]{0,100}\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|moral-graph\.reflect_context|ideology\s+context)\b/i.test(unquoted) ||
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:moral\s+graph|moral\s+badge\s+graph|moral-graph\.reflect_context|ideology\s+context)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|if|when|after|before|would|could|might)\b[\s\S]{0,140}\b(?:fetch|get|read|show|use|run|call|execute|reflect)\b[\s\S]{0,100}\b(?:moral\s+graph|moral\s+badge\s+graph|moral-graph\.reflect_context|ideology\s+context)\b/i.test(unquoted) ||
    /\b(?:explain|describe|define|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,140}\b(?:moral\s+graph(?:\s+reflection)?\s+tool|moral\s+graph\s+reflection|moral-graph\.reflect_context|helix_ask\.reflect_moral_graph)\b[\s\S]{0,140}\b(?:mean|means|do|does|is|are|would|tool|conceptually|identifier|capability)\b/i.test(unquoted) ||
    /\b(?:moral\s+graph(?:\s+reflection)?\s+tool|moral\s+graph\s+reflection|moral-graph\.reflect_context|helix_ask\.reflect_moral_graph)\b[\s\S]{0,140}\b(?:explain|describe|define|conceptually|identifier|capability|do\s+not\s+(?:run|call|execute|use)|don't\s+(?:run|call|execute|use))\b/i.test(unquoted)
  );
};

export const extractVoiceUtteranceTextFromPrompt = (prompt: string): string | null => {
  if (
    hasNegatedToolInstruction(
      prompt,
      /\b(?:voice|voice\s+lane|speak|speak\s+out\s+loud|read\s+aloud|callout|call\s+out|narrator|live_env\.request_interim_voice_callout|live_env\.narrator_say)\b/i,
    )
  ) {
    return null;
  }
  const quotedSpeech = prompt.match(
    /\b(?:voice\s+lane|voice|narrator|speak(?:\s+out\s+loud)?|read\s+aloud|callout|call\s+out)\b[\s\S]{0,100}\b(?:say|speak|read|call\s+out)\s+["“]([^"”]{1,220})["”]/i,
  )?.[1];
  const quotedCapabilitySpeech =
    prompt.match(
      /\b(?:text_to_speech\.speak_text|live_env\.request_interim_voice_callout|live_env\.narrator_say)\b[\s\S]{0,160}\b(?:say|speak|read|call\s+out)(?:\s+exactly)?\s+["'`“”]([^"'`“”]{1,220})["'`“”]/i,
    )?.[1] ??
    prompt.match(
      /\b(?:voice\s+lane|voice|narrator|speak(?:\s+out\s+loud)?|read\s+aloud|callout|call\s+out)\b[\s\S]{0,160}\b(?:say|speak|read|call\s+out)(?:\s+exactly)?\s+["'`“”]([^"'`“”]{1,220})["'`“”]/i,
    )?.[1];
  if (quotedCapabilitySpeech?.trim()) return quotedCapabilitySpeech.trim();
  if (quotedSpeech?.trim()) return quotedSpeech.trim();
  const unquoted = unquotePrompt(prompt);
  const direct =
    unquoted.match(
      /\b(?:use|request|send|make|have)\b[\s\S]{0,80}\b(?:voice\s+lane|voice|narrator|voice\s+callout|speak\s+out\s+loud|read\s+aloud|callout|call\s+out)\b[\s\S]{0,80}\b(?:say|speak|read|call\s+out)\s+([^.;\n]{1,220})/i,
    )?.[1] ??
    unquoted.match(
      /\b(?:speak|say|read\s+aloud|call\s+out)\s+([^.;\n]{1,220})\s+(?:out\s+loud|on\s+the\s+voice\s+lane|through\s+the\s+voice\s+lane)\b/i,
    )?.[1] ??
    null;
  return cleanNamedCapabilityArgumentText(direct);
};

export const extractNamedDocsPath = (segment: string): string | null => {
  const rawPath = segment.match(/\bdocs[\\/][^\s;,)]+/i)?.[0];
  return normalizeDocPath(rawPath?.replace(/[.,;:!?)]*$/g, ""));
};

export const extractNamedCapabilityQuery = (segment: string | null, fallback: string): string => {
  const cleanFallback = cleanNamedCapabilityArgumentText(fallback) ?? fallback;
  if (!segment) return cleanFallback;
  const withQuery = cleanNamedCapabilityArgumentText(
    segment.match(/\bwith\s+query\s+([\s\S]+)/i)?.[1] ??
      segment.match(/\bquery\s*:?\s*([\s\S]+)/i)?.[1] ??
      null,
  );
  if (withQuery) return withQuery;
  const afterFor = cleanNamedCapabilityArgumentText(segment.match(/\b(?:for|about|on)\s+([\s\S]+)/i)?.[1] ?? null);
  if (afterFor) {
    const withoutPath = cleanNamedCapabilityArgumentText(afterFor.replace(/\bdocs[\\/][^\s;,)]+/gi, " "));
    if (withoutPath) return withoutPath;
  }
  return cleanNamedCapabilityArgumentText(segment.replace(/\bdocs[\\/][^\s;,)]+/gi, " ")) ?? cleanFallback;
};


export const buildPromptNamedCapabilityGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const addNamedRequest = (
    capabilityId: string,
    mode: "read" | "observe" | "act",
    args: Record<string, unknown>,
  ): void => appendDedupe(requests, seen, [{
    schema: "helix.workstation_gateway.prompt_named_capability_call_request.v1",
    derivation_source: "helix_prompt_named_capability",
    capability_id: capabilityId,
    mode,
    arguments: {
      ...args,
      source_target_intent: {
        source: "helix_prompt_named_capability",
        target_kind: capabilityId,
        selected_capability: capabilityId,
        explicit_capability: true,
        ...(readRecord(args.source_target_intent) ?? {}),
      },
    },
  }]);

  if (
    hasPromptNamedCapability(prompt, WORKSPACE_OS_STATUS_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bworkspace_os\.status\b/i)
  ) {
    addNamedRequest(WORKSPACE_OS_STATUS_CAPABILITY, "observe", {
      source_target_intent: {
        target_source: "workspace_os",
        target_kind: "workspace_status",
        reason_codes: ["prompt_named_capability"],
      },
    });
  }

  const requestedInterfaceLanguage = extractInterfaceLanguageActionCode(prompt);
  if (requestedInterfaceLanguage) {
    addNamedRequest(ACCOUNT_SESSION_SET_INTERFACE_LANGUAGE_CAPABILITY, "act", {
      language: requestedInterfaceLanguage,
      source_target_intent: {
        target_source: "account_session",
        target_kind: "interface_language_preference",
        explicit_cues: ["affirmative_interface_language_action"],
        preference_key: "interfaceLanguage",
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, DOCS_SEARCH_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bdocs\.search\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, DOCS_SEARCH_CAPABILITY);
    const path = segment ? extractNamedDocsPath(segment) : null;
    const query = extractNamedCapabilityQuery(segment, prompt);
    addNamedRequest(DOCS_SEARCH_CAPABILITY, "read", {
      query,
      ...(path ? { paths: [path] } : {}),
      source_target_intent: {
        target_source: "docs",
        target_kind: "docs_search",
        ...(path ? { requested_doc_path: path } : {}),
      },
    });
  }

  const promptNamedDocsSearchAlias = DOCS_SEARCH_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedDocsSearchAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedDocsSearchAlias);
    const path = segment ? extractNamedDocsPath(segment) : null;
    const query = extractNamedCapabilityQuery(segment, prompt);
    addNamedRequest(DOCS_SEARCH_CAPABILITY, "read", {
      query,
      ...(path ? { paths: [path] } : {}),
      source_target_intent: {
        target_source: "docs",
        target_kind: "docs_search",
        alias_capability: promptNamedDocsSearchAlias,
        ...(path ? { requested_doc_path: path } : {}),
      },
    });
  }

  const promptNamedDocsOpenAlias = [
    DOCS_OPEN_DOC_CAPABILITY,
    ...DOCS_OPEN_DOC_ALIAS_CAPABILITIES,
  ].find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedDocsOpenAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedDocsOpenAlias);
    const path = segment ? extractNamedDocsPath(segment) : null;
    if (path) {
      addNamedRequest(DOCS_OPEN_DOC_CAPABILITY, "act", {
        path,
        source_target_intent: {
          target_source: "docs",
          target_kind: "docs_open_doc",
          alias_capability: promptNamedDocsOpenAlias === DOCS_OPEN_DOC_CAPABILITY
            ? undefined
            : promptNamedDocsOpenAlias,
          requested_doc_path: path,
        },
      });
    }
  }

  if (
    hasPromptNamedCapability(prompt, REPO_SEARCH_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\brepo\.search\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, REPO_SEARCH_CAPABILITY);
    addNamedRequest(REPO_SEARCH_CAPABILITY, "read", {
      query: extractNamedCapabilityQuery(segment, prompt),
      source_target_intent: {
        target_source: "repo_code",
        target_kind: "repo_search",
      },
    });
  }

  const promptNamedRepoSearchAlias = REPO_SEARCH_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedRepoSearchAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedRepoSearchAlias);
    addNamedRequest(REPO_SEARCH_CAPABILITY, "read", {
      query: extractNamedCapabilityQuery(segment, prompt),
      source_target_intent: {
        target_source: "repo_code",
        target_kind: "repo_search",
        alias_capability: promptNamedRepoSearchAlias,
      },
    });
  }

  const promptNamedCalculatorCapability = CALCULATOR_PROMPT_NAMED_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedCalculatorCapability) {
    const expression = extractCalculatorExpressionFromPrompt(prompt);
    if (expression) {
      addNamedRequest(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY, "read", {
        expression,
        source_target_intent: {
          target_source: "scientific_calculator",
          target_kind: "calculator_solve",
          alias_capability: promptNamedCalculatorCapability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY
            ? undefined
            : promptNamedCalculatorCapability,
          expression,
        },
      });
    }
  }

  if (
    hasPromptNamedCapability(prompt, THEORY_CONTEXT_REFLECTION_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\btheory-badge-graph\.reflect_discussion_context\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, THEORY_CONTEXT_REFLECTION_CAPABILITY);
    addNamedRequest(THEORY_CONTEXT_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      build_explanation_plan: true,
      source_target_intent: {
        target_source: "theory_badge_graph",
        target_kind: "theory_context_reflection",
      },
    });
  }

  const promptNamedTheoryReflectionAlias = THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedTheoryReflectionAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedTheoryReflectionAlias);
    addNamedRequest(THEORY_CONTEXT_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      build_explanation_plan: true,
      source_target_intent: {
        target_source: "theory_badge_graph",
        target_kind: "theory_context_reflection",
        alias_capability: promptNamedTheoryReflectionAlias,
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, THEORY_FRONTIER_CONJECTURE_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\btheory-badge-graph\.propose_frontier_conjectures\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, THEORY_FRONTIER_CONJECTURE_CAPABILITY);
    addNamedRequest(THEORY_FRONTIER_CONJECTURE_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      build_explanation_plan: true,
      source_target_intent: {
        target_source: "theory_badge_graph",
        target_kind: "theory_frontier_conjecture_workbench",
      },
    });
  }

  const promptNamedTheoryFrontierAlias = THEORY_FRONTIER_CONJECTURE_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedTheoryFrontierAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedTheoryFrontierAlias);
    addNamedRequest(THEORY_FRONTIER_CONJECTURE_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      build_explanation_plan: true,
      source_target_intent: {
        target_source: "theory_badge_graph",
        target_kind: "theory_frontier_conjecture_workbench",
        alias_capability: promptNamedTheoryFrontierAlias,
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, MORAL_GRAPH_REFLECTION_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bmoral-graph\.reflect_context\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, MORAL_GRAPH_REFLECTION_CAPABILITY);
    addNamedRequest(MORAL_GRAPH_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      include_locator: true,
      include_fruition: true,
      include_procedural_classification: true,
      include_recommended_actions: true,
      include_admissions: true,
      source_target_intent: {
        target_source: "moral_graph",
        target_kind: "moral_graph_reflection",
      },
    });
  }

  const promptNamedMoralGraphReflectionAlias = MORAL_GRAPH_REFLECTION_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedMoralGraphReflectionAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedMoralGraphReflectionAlias);
    addNamedRequest(MORAL_GRAPH_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      include_locator: true,
      include_fruition: true,
      include_procedural_classification: true,
      include_recommended_actions: true,
      include_admissions: true,
      source_target_intent: {
        target_source: "moral_graph",
        target_kind: "moral_graph_reflection",
        alias_capability: promptNamedMoralGraphReflectionAlias,
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bmoral-graph\.reflect_living_substrate_context\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY);
    addNamedRequest(MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      conversation_context: prompt,
      include_theory_bridge: true,
      include_recommended_actions: true,
      source_target_intent: {
        target_source: "moral_graph",
        target_kind: "moral_living_substrate_reflection",
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bcivilization-bounds\.reflect_system_bounds\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY);
    addNamedRequest(CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      include_bridge_context: true,
      include_collaboration_bounds: true,
      include_falsification_hooks: true,
      source_target_intent: {
        target_source: "civilization_bounds",
        target_kind: "civilization_bounds_reflection",
      },
    });
  }

  const promptNamedCivilizationReflectionAlias = CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedCivilizationReflectionAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedCivilizationReflectionAlias);
    addNamedRequest(CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY, "read", {
      prompt: extractNamedCapabilityQuery(segment, prompt),
      include_bridge_context: true,
      include_collaboration_bounds: true,
      include_falsification_hooks: true,
      source_target_intent: {
        target_source: "civilization_bounds",
        target_kind: "civilization_bounds_reflection",
        alias_capability: promptNamedCivilizationReflectionAlias,
      },
    });
  }

  if (
    hasDirectScholarlyFullTextSourceIntent(prompt) &&
    !hasNegatedToolInstruction(prompt, /\bscholarly-research\.fetch_full_text\b/i)
  ) {
    const sourceUrl = extractScholarlySourceUrl(prompt);
    const arxivId = extractScholarlyArxivId(prompt);
    const doi = extractScholarlyDoi(prompt);
    const resolvedSourceUrl = sourceUrl ??
      (arxivId ? `https://arxiv.org/abs/${arxivId}` : null) ??
      (doi ? `https://doi.org/${doi}` : null);
    if (resolvedSourceUrl) {
      addNamedRequest(SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY, "read", {
        source_url: resolvedSourceUrl,
        source_target_intent: {
          target_source: "scholarly_research",
          target_kind: "research_paper_full_text",
          strength: "hard",
          explicit_cues: ["prompt_named_capability", "explicit_paper_source"],
          terminal_evidence_requirement: "full_text",
          ...(arxivId ? { arxiv_id: arxivId } : {}),
          ...(doi ? { doi } : {}),
        },
      });
    }
  }

  if (
    hasPromptNamedCapability(prompt, SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\bscholarly-research\.lookup_papers\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, SCHOLARLY_RESEARCH_SEARCH_CAPABILITY);
    addNamedRequest(SCHOLARLY_RESEARCH_SEARCH_CAPABILITY, "read", {
      query: extractNamedCapabilityQuery(segment, prompt),
      mode: "search",
      source_target_intent: {
        target_source: "scholarly_research",
        target_kind: "research_paper_search",
        strength: "hard",
        explicit_cues: ["prompt_named_capability"],
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, INTERNET_SEARCH_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\binternet-search\.search_web\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, INTERNET_SEARCH_CAPABILITY);
    addNamedRequest(INTERNET_SEARCH_CAPABILITY, "read", {
      query: extractNamedCapabilityQuery(segment, prompt),
      source_target_intent: {
        target_source: "internet",
        target_kind: "internet_search",
        strength: "hard",
        explicit_cues: ["prompt_named_capability"],
      },
    });
  }

  const promptNamedInternetSearchAlias = INTERNET_SEARCH_ALIAS_CAPABILITIES.find((capabilityId) =>
    hasPromptNamedCapability(prompt, capabilityId) &&
    !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId)),
  );
  if (promptNamedInternetSearchAlias) {
    const segment = readPromptNamedCapabilitySegment(prompt, promptNamedInternetSearchAlias);
    addNamedRequest(INTERNET_SEARCH_CAPABILITY, "read", {
      query: extractNamedCapabilityQuery(segment, prompt),
      source_target_intent: {
        target_source: "internet",
        target_kind: "internet_search",
        strength: "hard",
        explicit_cues: ["prompt_named_capability"],
        alias_capability: promptNamedInternetSearchAlias,
      },
    });
  }

  if (
    hasPromptNamedCapability(prompt, TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\btext_to_speech\.speak_text\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY);
    const text = cleanNamedCapabilityArgumentText(
      extractVoiceUtteranceTextFromPrompt(prompt) ??
        segment?.match(/\b(?:text|say|speak|read)\s*:?\s*([\s\S]+)/i)?.[1] ??
        segment ??
        "",
    );
    if (text) {
      addNamedRequest(TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY, "act", {
        text,
        kind: "tool_progress",
        source_target_intent: {
          target_source: "voice_delivery",
          target_kind: "text_to_speech",
        },
      });
    }
  }

  if (
    hasPromptNamedCapability(prompt, VOICE_INTERIM_CALLOUT_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\blive_env\.request_interim_voice_callout\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, VOICE_INTERIM_CALLOUT_CAPABILITY);
    const text = cleanNamedCapabilityArgumentText(
      segment?.match(/\b(?:text|message|say|speak)\s*:?\s*([\s\S]+)/i)?.[1] ?? segment,
    );
    if (text) {
      addNamedRequest(VOICE_INTERIM_CALLOUT_CAPABILITY, "act", {
        text,
        kind: "tool_progress",
        source_target_intent: {
          target_source: "voice_delivery",
          target_kind: "interim_voice_callout",
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  if (
    hasPromptNamedCapability(prompt, VOICE_NARRATOR_SAY_CAPABILITY) &&
    !hasNegatedToolInstruction(prompt, /\blive_env\.narrator_say\b/i)
  ) {
    const segment = readPromptNamedCapabilitySegment(prompt, VOICE_NARRATOR_SAY_CAPABILITY);
    const text = cleanNamedCapabilityArgumentText(
      segment?.match(/\b(?:text|message|say|speak)\s*:?\s*([\s\S]+)/i)?.[1] ?? segment,
    );
    if (text) {
      addNamedRequest(VOICE_NARRATOR_SAY_CAPABILITY, "act", {
        text,
        source_target_intent: {
          target_source: "voice_delivery",
          target_kind: "narrator_say",
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, new RegExp(`\\b${escapeRegExp(capabilityId)}\\b`, "i"))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "live_environment_context_feed",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of LIVE_SOURCE_STATE_READ_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "live_source_state",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of SITUATION_STAGE_STATE_READ_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "situation_stage_state",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of LIVE_SOURCE_MAILBOX_READ_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "live_source_mailbox",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "live_source_interpreter_prediction",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of STAGE_PLAY_BUILDER_READ_CAPABILITIES) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, promptNamedCapabilityPattern(capabilityId))
    ) {
      addNamedRequest(capabilityId, "read", {
        source_target_intent: {
          target_source: "stage_play_builder",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  for (const capabilityId of [
    VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
    VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
    VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
  ]) {
    if (
      hasPromptNamedCapability(prompt, capabilityId) &&
      !hasNegatedToolInstruction(prompt, new RegExp(`\\b${escapeRegExp(capabilityId)}\\b`, "i"))
    ) {
      const segment = readPromptNamedCapabilitySegment(prompt, capabilityId);
      const query = extractNamedCapabilityQuery(segment, prompt);
      addNamedRequest(capabilityId, "read", {
        summary: query,
        source_target_intent: {
          target_source: "visual_observer",
          target_kind: capabilityId,
          explicit_cues: ["prompt_named_capability"],
        },
      });
    }
  }

  return requests.slice(0, MAX_PROMPT_NAMED_CAPABILITY_REQUESTS);
};

export const cleanCalculatorExpression = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const expression = value
    .trim()
    .replace(/\b(?:then|and|wait|report|answer|give|explain|summari[sz]e|tell)\b[\s\S]*$/i, "")
    .trim()
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, "")
    .replace(/(?:[eE][+-]?|\.)+$/g, "")
    .trim();
  if (!expression || expression.length > 160) return null;
  if (!/\d/.test(expression) || !/[+\-*/^%]|\b(?:diff|differentiate|derivative|integrate|integral|sqrt|ln|log|exp|sin|cos|tan|abs)\s*\(/i.test(expression)) {
    return null;
  }
  if (!/^[0-9A-Za-z_.,+\-*/^%()[\]]+$/.test(expression)) return null;
  return expression;
};

export const CALCULATOR_PROMPT_NAMED_CAPABILITIES = [
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  ...CALCULATOR_SOLVE_ALIAS_CAPABILITIES,
] as const;

export const readPromptNamedCalculatorSegment = (prompt: string): {
  capabilityId: typeof CALCULATOR_PROMPT_NAMED_CAPABILITIES[number];
  segment: string;
} | null => {
  const promptForMath = prompt.replace(/"[^"]*"|'[^']*'/g, " ");
  for (const capabilityId of CALCULATOR_PROMPT_NAMED_CAPABILITIES) {
    const promptNamedCapability = promptNamedCapabilityPattern(capabilityId).exec(promptForMath);
    if (!promptNamedCapability) continue;
    const capabilityText = promptNamedCapability[0] ?? "";
    const capabilityOffset = capabilityText.toLowerCase().indexOf(capabilityId.toLowerCase());
    const capabilityStart = promptNamedCapability.index + Math.max(0, capabilityOffset);
    const afterCapability = promptForMath.slice(capabilityStart + capabilityId.length);
    const segmentEnd = afterCapability.search(/[;\n]/);
    return {
      capabilityId,
      segment: segmentEnd >= 0 ? afterCapability.slice(0, segmentEnd) : afterCapability,
    };
  }
  return null;
};

export const extractCalculatorMathTokenSequence = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const source = value.trim();
  let start = -1;
  for (let index = 0; index < source.length; index += 1) {
    if (/[A-Za-z0-9(]/.test(source[index] ?? "")) {
      start = index;
      break;
    }
  }
  if (start < 0) return null;
  let candidate = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (char === "." && /\s/.test(source[index + 1] ?? "")) {
      break;
    }
    if (/[0-9A-Za-z_.,+\-*/^%()[\]\s]/.test(char)) {
      candidate += char;
      continue;
    }
    break;
  }
  return cleanCalculatorExpression(candidate);
};

export const extractCalculatorPercentOfExpression = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const match = value.match(
    /(?:what\s+is\s+|calculate\s+|evaluate\s+|compute\s+|solve\s+)?(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i,
  );
  return match ? `${match[1]}% of ${match[2]}` : null;
};

export const extractCalculatorExpressionFromPrompt = (prompt: string): string | null => {
  if (hasNegatedCalculatorExecutionInstruction(prompt)) {
    return null;
  }
  const unquoted = unquotePrompt(prompt);
  const promptNamedCalculator = readPromptNamedCalculatorSegment(prompt);
  if (promptNamedCalculator) {
    const segment = promptNamedCalculator.segment;
    const explicitExpression = segment.match(
      /\b(?:with\s+this\s+exact\s+expression|with\s+expression|this\s+exact\s+expression|expression\s+is|expression|with|for|calculate|evaluate|solve|compute)\b\s*:?\s*([\s\S]{1,160})/i,
    )?.[1];
    const boundedExpression = extractCalculatorMathTokenSequence(explicitExpression ?? segment);
    if (boundedExpression) return boundedExpression;
  }
  const percentOfExpression = extractCalculatorPercentOfExpression(unquoted);
  if (percentOfExpression) return percentOfExpression;
  const explicitCapability =
    unquoted.match(/\bscientific-calculator\.(?:solve_expression|solve_with_steps|solve)\b[\s\S]{0,80}\b(?:for|with|expression|calculate|evaluate|solve|compute)?\s*:?\s*([0-9][0-9eE\s.+\-*/^%()[\]]{1,120})/i)?.[1] ??
    unquoted.match(/\b(?:scientific\s+calculator|calculator|calc)\b[\s\S]{0,100}\b(?:calculate|evaluate|solve|compute|expression)\s*:?\s*([0-9][0-9eE\s.+\-*/^%()[\]]{1,120})/i)?.[1] ??
    null;
  if (explicitCapability) return extractCalculatorMathTokenSequence(explicitCapability);
  const direct =
    unquoted.match(/\b(?:calculate|evaluate|compute|solve)\s+([0-9][0-9eE\s.+\-*/^%()[\]]{1,120})/i)?.[1] ??
    null;
  return extractCalculatorMathTokenSequence(direct);
};

export const buildPromptDerivedCalculatorSolveGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const expression = extractCalculatorExpressionFromPrompt(prompt);
  if (!expression) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_calculator_solve_call_request.v1",
    derivation_source: "helix_prompt_derived_calculator_solve",
    capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
    mode: "read",
    arguments: {
      expression,
      source_target_intent: {
        source: "helix_prompt_derived_calculator_solve",
        target_source: "scientific_calculator",
        target_kind: "calculator_solve",
        expression,
      },
    },
  }];
};

export const buildPromptDerivedTheoryReflectionGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (hasPromptNamedCapability(prompt, THEORY_CONTEXT_REFLECTION_CAPABILITY)) return [];
  if (
    hasNegatedToolInstruction(prompt, /\b(?:reflect|reflection|theory\s+badge\s+graph|theory\s+graph|badge\s+graph|theory\s+context|theory\s+reflection)\b/i) ||
    hasContextualTheoryReflectionMention(prompt)
  ) {
    return [];
  }
  const unquoted = unquotePrompt(prompt);
  const wantsTheoryReflection =
    /\breflect\b[\s\S]{0,120}\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b[\s\S]{0,120}\breflect(?:ion)?\b/i.test(unquoted) ||
    /\b(?:find|return|give|identify|select|choose|surface)\b[\s\S]{0,140}\b(?:formulas?|equations?|templates?)\b[\s\S]{0,140}\b(?:from|in|within|via|through)\s+(?:the\s+)?(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i.test(unquoted) ||
    /\b(?:from|in|within|via|through)\s+(?:the\s+)?(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b[\s\S]{0,140}\b(?:find|return|give|identify|select|choose|surface)\b[\s\S]{0,140}\b(?:formulas?|equations?|templates?)\b/i.test(unquoted) ||
    /\b(?:fetch|get|read|show|use|run|call|execute)\b[\s\S]{0,80}\b(?:the\s+)?theory\s+(?:context\s+)?reflection\b/i.test(unquoted) ||
    /\b(?:theory\s+(?:context\s+)?reflection)\b[\s\S]{0,80}\b(?:for|about|on)\b/i.test(unquoted);
  if (!wantsTheoryReflection) return [];
  const focusedPrompt =
    cleanNamedCapabilityArgumentText(
      unquoted.match(/\breflect\s+(.{3,160}?)\s+(?:against|through|via|with)\s+(?:the\s+)?(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i)?.[1] ??
        unquoted.match(/\b(?:fetch|get|read|show|use|run|call|execute)\b[\s\S]{0,80}\b(?:the\s+)?theory\s+(?:context\s+)?reflection\s+(?:for|about|on)\s+([^.;\n]+)/i)?.[1] ??
        unquoted.match(/\b(?:theory\s+(?:context\s+)?reflection)\s+(?:for|about|on)\s+([^.;\n]+)/i)?.[1] ??
        unquoted.match(/\b(?:reflect|reflection)\b[\s\S]{0,120}\b(?:for|about|on)\s+([^.;\n]+)/i)?.[1] ??
        unquoted.match(/\b(?:for|about|on)\s+([^.;\n]+)\b[\s\S]{0,80}\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i)?.[1] ??
        null,
    ) ?? prompt;
  return [{
    schema: "helix.workstation_gateway.prompt_derived_theory_reflection_call_request.v1",
    derivation_source: "helix_prompt_derived_theory_reflection",
    capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
    mode: "read",
    arguments: {
      prompt: focusedPrompt,
      conversation_context: prompt,
      build_explanation_plan: true,
      source_target_intent: {
        source: "helix_prompt_derived_theory_reflection",
        target_source: "theory_badge_graph",
        target_kind: "theory_context_reflection",
      },
    },
  }];
};

export const buildPromptDerivedCivilizationBoundsGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (hasPromptNamedCapability(prompt, CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY)) return [];
  const unquoted = unquotePrompt(prompt);
  const affirmativeClause = unquoted
    .split(/[.!?;\n]+/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .find((clause) => {
      const requestsReflection =
        /\breflect\b[\s\S]{0,120}\b(?:civilization\s+bounds?|civilization\s+roadmap|system\s+bounds?)\b/i.test(clause) ||
        /\b(?:civilization\s+bounds?|civilization\s+roadmap)\b[\s\S]{0,120}\breflect(?:ion)?\b/i.test(clause);
      if (!requestsReflection) return false;
      if (/\b(?:do\s+not|don't|dont|never|without|avoid|not\s+asking\s+to|no\s+need\s+to)\b/i.test(clause)) return false;
      return !/\b(?:if|when|would|could|might|hypothetically|later|next\s+time|in\s+the\s+future|previously|earlier|last\s+turn|historically|screen|visible|label|button|phrase|text)\b/i.test(clause);
    });
  if (!affirmativeClause) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_civilization_bounds_call_request.v1",
    derivation_source: "helix_prompt_derived_civilization_bounds_reflection",
    capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    mode: "read",
    arguments: {
      prompt,
      include_bridge_context: true,
      include_collaboration_bounds: true,
      source_target_intent: {
        source: "helix_prompt_derived_civilization_bounds_reflection",
        target_source: "civilization_bounds",
        target_kind: "civilization_bounds_reflection",
      },
    },
  }];
};

export const buildPromptDerivedMoralGraphReflectionGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (hasPromptNamedCapability(prompt, MORAL_GRAPH_REFLECTION_CAPABILITY)) return [];
  if (
    hasNegatedToolInstruction(
      prompt,
      /\b(?:reflect|reflection|moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|badge\s+locator|ideology\s+context)\b/i,
    ) ||
    hasContextualMoralGraphReflectionMention(prompt)
  ) {
    return [];
  }
  const unquoted = unquotePrompt(prompt);
  const wantsProceduralBadgeReflection = moralGraphPolicyAllowsProceduralBadgeReflection({
    inputKind: "user_prompt",
    text: prompt,
  });
  const wantsMoralGraphReflection =
    /\breflect\b[\s\S]{0,140}\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\b/i.test(unquoted) ||
    /\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\b[\s\S]{0,140}\breflect(?:ion)?\b/i.test(unquoted) ||
    /\b(?:use|run|call|query|read|apply)\b[\s\S]{0,100}\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\b/i.test(unquoted) ||
    /\b(?:locate|identify|select|surface|map)\b[\s\S]{0,140}\b(?:moral\s+badges?|badge\s+locator|moral\s+graph)\b/i.test(unquoted) ||
    wantsProceduralBadgeReflection;
  if (!wantsMoralGraphReflection) return [];
  const focusedPrompt =
    cleanNamedCapabilityArgumentText(
      unquoted.match(/\breflect\s+(.{3,180}?)\s+(?:against|through|via|with)\s+(?:the\s+)?(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\b/i)?.[1] ??
        unquoted.match(/\b(?:use|run|call|query|read|apply)\b[\s\S]{0,100}\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\s+(?:for|about|on)\s+([^.;\n]+)/i)?.[1] ??
        unquoted.match(/\b(?:moral\s+graph|moral\s+badge\s+graph|moral\s+badges?|ideology\s+context|badge\s+locator)\s+(?:reflection\s+)?(?:for|about|on)\s+([^.;\n]+)/i)?.[1] ??
        null,
    ) ?? prompt;
  return [{
    schema: "helix.workstation_gateway.prompt_derived_moral_graph_reflection_call_request.v1",
    derivation_source: "helix_prompt_derived_moral_graph_reflection",
    capability_id: MORAL_GRAPH_REFLECTION_CAPABILITY,
    mode: "read",
    arguments: {
      prompt: focusedPrompt,
      conversation_context: prompt,
      include_locator: true,
      include_fruition: true,
      include_procedural_classification: true,
      include_recommended_actions: true,
      include_admissions: true,
      source_target_intent: {
        source: "helix_prompt_derived_moral_graph_reflection",
        target_source: "moral_graph",
        target_kind: "moral_graph_reflection",
      },
    },
  }];
};

export const extractRepoSearchQueryFromPrompt = (prompt: string): string | null => {
  if (hasNegatedToolInstruction(prompt, /\b(?:repo|repository|code|source|implementation|search)\b/i)) return null;
  const unquoted = unquotePrompt(prompt);
  const cleanQuery = (value: string | null | undefined): string | null => {
    const normalized = value
      ?.replace(/\b(?:the|a|an)\b/gi, " ")
      .replace(/[.,;:!?)]*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return normalized && normalized.length >= 3 ? normalized : null;
  };
  const implementationQuestion = unquoted.match(
    /\b(?:repo|repository|codebase|source|code|implementation)\b[\s\S]{0,180}\b(?:how\s+does|how\s+is|where\s+is|what\s+does)\s+(?:the\s+)?([A-Za-z][A-Za-z0-9_. -]{2,80}?)(?:\s+(?:work|implemented|defined|handled|locate|match(?:es)?|score(?:s)?))?(?:\s+(?:for|in|on|of)\s+(?:the\s+)?([A-Za-z][A-Za-z0-9_. -]{2,80}))?(?:[?.!]|$)/i,
  );
  if (implementationQuestion) {
    const subject = cleanQuery(implementationQuestion[1]);
    const context = cleanQuery(implementationQuestion[2]);
    const query = cleanQuery([context, subject].filter(Boolean).join(" "));
    if (query) return query;
  }
  const exact =
    unquoted.match(/\b(?:search|grep|look\s+(?:in|through)|find)\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\s+(?:for|about)\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    unquoted.match(/\b(?:repo|repository|codebase|source|code)\s+(?:search|grep)\s+(?:for|about)\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    unquoted.match(/\b(?:find|locate)\s+([A-Za-z0-9_.:/\\-]{3,80})\s+in\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\b/i)?.[1] ??
    null;
  if (exact) return cleanQuery(exact);
  if (!/\b(?:repo|repository|codebase|source|implementation|where\s+(?:is|are).+\b(?:implemented|defined|handled))\b/i.test(unquoted)) {
    return null;
  }
  const fallback = unquoted.match(/\b([A-Za-z][A-Za-z0-9_.-]{2,80})\b(?=[^.!?]*\b(?:repo|repository|codebase|source|implementation)\b)/i)?.[1];
  const normalizedFallback = fallback?.trim() ?? null;
  if (
    normalizedFallback &&
    /^(?:search|grep|look|find|locate|show|tell|use|check|inspect|scan|how|what|where|why|from|code|repo|repository|source|implementation)$/i.test(normalizedFallback)
  ) {
    return null;
  }
  return normalizedFallback;
};

const buildRepoSearchPromptQueryTerms = (query: string): string[] => {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9_.:/-]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);
  const normalized = query.toLowerCase();
  if (/\btheory\b/.test(normalized) && /\bbadge\b/.test(normalized) && /\bgraph\b/.test(normalized) && /\blocator|locate|located|match|reflection\b/.test(normalized)) {
    terms.unshift(
      "Theory Badge Graph reflection produced",
      "theory-context-reflection-tool",
      "theory-badge-overlap-locator",
      "runHelixTheoryContextReflectionTool",
      "reflect_discussion_context",
      "located_badge_ids",
      "exact_badge_ids",
      "likely_badge_ids",
    );
  }
  return Array.from(new Set(terms)).slice(0, 12);
};

export const hasAffirmativeRepoSearchIntent = (prompt: string): boolean => {
  if (hasNegatedToolInstruction(prompt, /\b(?:repo|repository|code|source|implementation|search)\b/i)) return false;
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:search|grep|look\s+(?:in|through)|find|locate)\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\b/i.test(unquoted) ||
    /\b(?:repo|repository|codebase|source|code)\s+(?:search|grep|lookup|look\s*up)\b/i.test(unquoted)
  );
};

export const hasExplicitScholarlyFullTextNumericChainIntent = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\bscholarly-research\.(?:fetch_full_text|extract_numeric_parameters)\b/i.test(unquoted) ||
    /\b(?:fetch\s+full\s+text|full[-\s]?text|extract\s+numeric\s+parameters?|numeric\s+parameter\s+extraction|cited\s+(?:numeric|numerical)\s+values?|paper[-\s]+backed\s+(?:numeric|numerical|formula|variable|calculator)|research[-\s]+paper\s+(?:numeric|numerical|formula|variable)\s+evidence|source[-\s]?bound\s+(?:numeric|numerical|values?|expression|calculator)|source[-\s]?backed\s+(?:numeric|numerical|values?|expression|calculator)|unit[-\s]?bearing\s+(?:numeric|numerical)\s+values?|formula\s+(?:variable\s+)?binding|bind\s+(?:the\s+)?(?:formula\s+)?variables?|calculator\s+binding)\b/i.test(unquoted)
  );
};

export const hasAffirmativeScholarlyResearchNowIntent = (prompt: string): boolean => {
  if (hasNegatedScholarlyResearchInstruction(prompt)) return false;
  return detectScholarlyResearchIntent(prompt).researchRequested;
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

export const isTheoryFormulaDiscoveryPhasePrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  const mentionsTheoryGraph = /\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i.test(unquoted);
  const asksFormulaDiscovery =
    /\b(?:find|return|give|identify|select|choose|surface|reflect)\b[\s\S]{0,160}\b(?:formulas?|equations?|templates?)\b/i.test(unquoted) ||
    /\b(?:formulas?|equations?|templates?)\b[\s\S]{0,160}\b(?:variables?|physically\s+means?|meaning|evaluate|evaluated)\b/i.test(unquoted);
  if (!mentionsTheoryGraph || !asksFormulaDiscovery) return false;
  if (hasAffirmativeScholarlyResearchNowIntent(prompt)) return false;
  return true;
};

export const isPaperBackedNumericBindingPhasePrompt = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (hasNegatedScholarlyResearchInstruction(prompt)) return false;
  const asksPaperEvidence = /\b(?:paper[-\s]+backed|research[-\s]+papers?|scholarly|cited|citations?|sources?)\b/i.test(unquoted);
  const asksNumericBinding = /\b(?:numeric(?:al)?\s+(?:values?|ranges?|parameters?)|unit[-\s]?bearing|variables?|bind(?:ing)?|formula|equation)\b/i.test(unquoted);
  const priorFormula = /\b(?:previous|prior|above|last|the)\b[\s\S]{0,80}\b(?:answers?|formulas?|equations?|variables?)\b/i.test(unquoted);
  return asksPaperEvidence && asksNumericBinding && priorFormula;
};

export const hasAffirmativeResearchRetryIntent = (prompt: string): boolean => {
  if (hasNegatedScholarlyResearchInstruction(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:retry|rerun|run\s+again|search\s+again|look\s+again|find\s+more|fetch\s+more|expand|broaden)\b[\s\S]{0,120}\b(?:papers?|research|scholarly|sources?|citations?)\b/i.test(unquoted) ||
    /\b(?:papers?|research|scholarly|sources?|citations?)\b[\s\S]{0,120}\b(?:retry|rerun|run\s+again|search\s+again|look\s+again|find\s+more|fetch\s+more|expand|broaden)\b/i.test(unquoted)
  );
};

export const isConditionalPriorEvidenceCalculatorFollowup = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (hasAffirmativeResearchRetryIntent(prompt)) return false;
  const conditional = /\b(?:if|when|provided\s+that|only\s+if|assuming)\b/i.test(unquoted);
  const priorEvidence = /\b(?:previous|prior|above|last|earlier)\b[\s\S]{0,100}\b(?:answers?|evidence|result|retrieval|values?|variables?)\b/i.test(unquoted);
  const sufficiencyCheck = /\b(?:enough|sufficient|usable|adequate|complete|fully\s+cited|unit[-\s]?bearing|cited)\b[\s\S]{0,120}\b(?:values?|numbers?|numerics?|parameters?|evidence|citations?|units?)\b/i.test(unquoted);
  const calculatorFollowup = /\b(?:bind|calculate|compute|evaluate|solve|run)\b[\s\S]{0,140}\b(?:formula|expression|calculator|numeric(?:al)?\s+expression|result)\b/i.test(unquoted);
  return conditional && priorEvidence && sufficiencyCheck && calculatorFollowup;
};

export const buildPromptDerivedRepoSearchGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (isScientificImageEvidenceRefRevisionPrompt(prompt)) return [];
  if (hasExplicitScholarlyFullTextNumericChainIntent(prompt)) return [];
  const query = extractRepoSearchQueryFromPrompt(prompt);
  if (!query && !hasAffirmativeRepoSearchIntent(prompt)) return [];
  const queryTerms = query ? buildRepoSearchPromptQueryTerms(query) : [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_repo_search_call_request.v1",
    derivation_source: "helix_prompt_derived_repo_search",
    capability_id: REPO_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      ...(query ? { query } : {}),
      ...(queryTerms.length > 0 ? { query_terms: queryTerms } : {}),
      source_target_intent: {
        source: "helix_prompt_derived_repo_search",
        target_source: "repo_code",
        target_kind: "repo_search",
        ...(query ? {
          query,
          query_terms: queryTerms,
          query_derivation: {
            schema: "helix.repo_search_query_derivation.v1",
            source: "prompt_named_tool_request",
            prompt_snippet: prompt.slice(0, 240),
            derived_query: query,
            derived_terms: queryTerms,
            rejected_terms: ["how"],
            assistant_answer: false,
            raw_content_included: false,
          },
        } : { blocked_reason: "missing_query" }),
      },
    },
  }];
};

export const buildPromptDerivedInternetSearchGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (isScientificImageEvidenceRefRevisionPrompt(prompt)) return [];
  if (isScientificImageExactRowRetryPrompt(prompt)) return [];
  const intent = detectInternetSearchIntent(prompt);
  if (!intent.searchRequested) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_internet_search_call_request.v1",
    derivation_source: "helix_prompt_derived_internet_search",
    capability_id: INTERNET_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      query: intent.normalizedQuery,
      ...(intent.domains.length > 0 ? { domains: intent.domains } : {}),
      ...(intent.recencyDays ? { recency_days: intent.recencyDays } : {}),
      source_target_intent: {
        source: "helix_prompt_derived_internet_search",
        target_source: "internet",
        target_kind: "internet_search",
        strength: intent.strength,
        explicit_cues: intent.explicitCues,
        reasons: intent.reasons,
        requested_outputs: intent.requestedOutputs,
      },
    },
  }];
};

export const buildPromptDerivedScholarlyResearchGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (isScientificImageEvidenceRefRevisionPrompt(prompt)) return [];
  if (hasNegatedScholarlyResearchInstruction(prompt)) return [];
  const intent = detectScholarlyResearchIntent(prompt);
  if (!intent.researchRequested) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_scholarly_research_call_request.v1",
    derivation_source: "helix_prompt_derived_scholarly_research",
    capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      query: intent.normalizedQuery,
      mode: intent.mode,
      scholarly_intent: intent.scholarlyIntent,
      planned_scholarly_capability_chain: intent.plannedScholarlyCapabilityChain,
      source_target_intent: {
        source: "helix_prompt_derived_scholarly_research",
        target_source: "scholarly_research",
        target_kind: "research_paper_search",
        strength: intent.strength,
        explicit_cues: intent.explicitCues,
        reasons: intent.reasons,
        requested_outputs: intent.requestedOutputs,
        doi: intent.doi,
        arxiv_id: intent.arxivId,
        full_text_requested: intent.fullTextRequested,
        scholarly_intent: intent.scholarlyIntent,
        planned_scholarly_capability_chain: intent.plannedScholarlyCapabilityChain,
        terminal_evidence_requirement: intent.scholarlyIntent.terminal_evidence_requirement,
      },
    },
  }];
};

export const buildPromptDerivedResearchLibraryGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (!isSavedResearchLibraryEvidencePrompt(prompt)) return [];
  const sourceUrl = extractScholarlySourceUrl(prompt);
  const documentId = prompt.match(/\bresearch:[A-Za-z0-9_-]{8,}\b/)?.[0] ?? null;
  const savedPaperReferentRequested =
    /\b(?:that|this|the|same|previous|prior|recent|last)\b[\s\S]{0,50}\b(?:saved\s+)?(?:research\s+library\s+)?(?:paper|pdf|document|extraction)\b/i.test(prompt);
  if (!sourceUrl && !documentId && !savedPaperReferentRequested) return [];
  const pageSelectorPrompt = unquotePrompt(prompt)
    .replace(/\b(?:previously|earlier|historically|last\s+time)\b[^.!?;\n]{0,240}/gi, " ")
    .replace(/\b(?:if|when)\b[^.!?;\n]{0,240}/gi, " ")
    .replace(/\b(?:later|in\s+the\s+future|eventually)\b[^.!?;\n]{0,240}/gi, " ")
    .replace(/\b(?:do\s+not|don't|dont|without)\b[^.!?;\n]{0,160}/gi, " ");
  const pageRange = pageSelectorPrompt.match(/\bpages?\s+(\d+)\s*(?:-|through|to)\s*(\d+)\b/i);
  const pageList = !pageRange
    ? pageSelectorPrompt.match(/\bpages\s+(\d+(?:\s*,\s*\d+)*(?:\s*,?\s*(?:and|&)\s*\d+)?)\b/i)
    : null;
  const pageNumbers = pageList
    ? Array.from(new Set((pageList[1].match(/\d+/g) ?? []).map(Number))).filter((page) => page > 0).slice(0, 40)
    : [];
  const singlePage = pageSelectorPrompt.match(/\bpage(?:\s*-\s*|\s+)(\d+)\b/i);
  const quotedSearch = prompt.match(/\b(?:occurrences?|containing|contains?|search\s+for|find)\b[^“”"']{0,40}[“"]([^”"]+)[”"]|\b(?:occurrences?|containing|contains?|search\s+for|find)\b[^']{0,40}'([^']+)'/i);
  const requestedEquationLabel = pageSelectorPrompt.match(/\bequation\s*(\(\s*\d+\s*\))/i)?.[1]
    ?.replace(/\s+/g, "") ?? null;
  const rawSearchTerm = quotedSearch?.[1] ?? quotedSearch?.[2] ?? requestedEquationLabel;
  const exactSearchRequested = /\b(?:exact|verbatim|including\s+punctuation)\b/i.test(prompt);
  const searchTerm = rawSearchTerm
    ? (exactSearchRequested ? rawSearchTerm : rawSearchTerm.replace(/[.,;:!?]+$/g, "")).trim()
    : null;
  const caseSensitiveSearchRequested = Boolean(searchTerm) &&
    /\bfind\b[\s\S]{0,100}\bexact\s+case[-\s]?sensitive\s+occurrences?\b/i.test(prompt) &&
    !/\b(?:do\s+not|don't|not|without)\b[\s\S]{0,30}\bcase[-\s]?sensitive\b/i.test(prompt);
  const pageBoundarySentencesRequested =
    /\bfirst\s+and\s+last\s+nonblank\s+sentences?\b/i.test(prompt) &&
    /\bexactly\s+as\s+extracted\b/i.test(prompt);
  const everyMatchingPageRequested = /\b(?:every|each|all)\s+(?:matching\s+)?pages?\b/i.test(prompt);
  return [{
    schema: "helix.workstation_gateway.prompt_derived_research_library_call_request.v1",
    derivation_source: "helix_prompt_derived_research_library",
    capability_id: HELIX_RESEARCH_LIBRARY_READ_CAPABILITY,
    mode: "read",
    arguments: {
      ...(sourceUrl ? { source_url: sourceUrl } : {}),
      ...(documentId ? { document_id: documentId } : {}),
      ...(!sourceUrl && !documentId && savedPaperReferentRequested
        ? { resolve_single_profile_document: true }
        : {}),
      query: prompt,
      ...(pageRange ? { page_start: Number(pageRange[1]), page_end: Number(pageRange[2]) } : {}),
      ...(!pageRange && pageNumbers.length > 0 ? { page_numbers: pageNumbers, max_pages: pageNumbers.length } : {}),
      ...(!pageRange && pageNumbers.length === 0 && singlePage ? { page_start: Number(singlePage[1]), page_end: Number(singlePage[1]) } : {}),
      ...(searchTerm ? { search_term: searchTerm } : {}),
      ...(caseSensitiveSearchRequested ? { case_sensitive: true } : {}),
      ...(pageBoundarySentencesRequested
        ? { page_boundary_mode: "first_last_nonblank_sentence" }
        : {}),
      ...(everyMatchingPageRequested ? { max_pages: 40 } : {}),
      source_target_intent: {
        source: "helix_prompt_derived_research_library",
        target_source: "research_library",
        target_kind: "saved_scholarly_full_text",
        strength: "hard",
        requested_outputs: searchTerm
          ? ["saved_page_text", "match_count", "page_grounded_references"]
          : ["saved_page_text", "page_grounded_references"],
        exact_source_url: sourceUrl,
        exact_document_id: documentId,
        saved_document_referent: savedPaperReferentRequested,
        no_network_retrieval: true,
      },
    },
  }];
};

export const buildPromptDerivedWorkspaceStatusGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isWorkspaceOsStatusPrompt(prompt)) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_workspace_status_call_request.v1",
    derivation_source: "helix_prompt_derived_workspace_status",
    capability_id: WORKSPACE_OS_STATUS_CAPABILITY,
    mode: "observe",
    arguments: {
      source_target_intent: {
        source: "helix_prompt_derived_workspace_status",
        target_source: "workspace_os",
        target_kind: "workspace_status",
        reason_codes: workspaceOsStatusReasonCodes(prompt),
      },
    },
  }];
};

export const buildPromptDerivedVoiceGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (
    hasPromptNamedCapability(prompt, TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY) ||
    hasPromptNamedCapability(prompt, VOICE_INTERIM_CALLOUT_CAPABILITY) ||
    hasPromptNamedCapability(prompt, VOICE_NARRATOR_SAY_CAPABILITY)
  ) {
    return [];
  }
  const text = extractVoiceUtteranceTextFromPrompt(prompt);
  if (!text) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_voice_callout_request.v1",
    derivation_source: "helix_prompt_derived_voice_callout",
    capability_id: TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
    mode: "act",
    arguments: {
      text,
      kind: "tool_progress",
      source_target_intent: {
        source: "helix_prompt_derived_voice_callout",
        target_source: "voice_delivery",
        target_kind: "text_to_speech",
        explicit_cues: ["voice_lane_say"],
      },
    },
  }];
};
