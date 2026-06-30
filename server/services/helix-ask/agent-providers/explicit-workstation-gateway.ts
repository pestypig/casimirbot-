import crypto from "node:crypto";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import {
  callWorkstationGatewayCapability,
} from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { planWorkstationToolUse } from "../workstation-tool-planner";
import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  isWorkspaceOsStatusPrompt,
  workspaceOsStatusReasonCodes,
} from "../workspace-os-status-intent";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import { detectInternetSearchIntent } from "../internet-search-intent";
import { detectScholarlyResearchIntent } from "../scholarly-research-intent";
import { WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES } from "../workstation-context-feed-query-tool-contracts";
import {
  buildCompoundCapabilityDependencyGatewayCallRequests,
  buildCompoundDependencyRailStatus,
  buildDependentCompoundCapabilityGatewayCallRequest,
  buildTurnCompoundDependencyPlan,
} from "./provider-compound-capability-planner";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_SOLVE_ALIAS_CAPABILITIES = [
  "scientific-calculator.solve",
  "scientific-calculator.solve_with_steps",
] as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const WORKSPACE_OS_STATUS_CAPABILITY = HELIX_WORKSPACE_OS_STATUS_CAPABILITY;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const REPO_SEARCH_ALIAS_CAPABILITIES = [
  "repo-code.search_concept",
] as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_READ_VISIBLE_SURFACE_CAPABILITY = "docs-viewer.read_visible_surface" as const;
const DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY = "docs-viewer.read_active_translation" as const;
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;
const CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY = "scientific-calculator.read_visible_result" as const;
const DOCS_SEARCH_ALIAS_CAPABILITIES = [
  "docs-viewer.search_docs",
  "docs-viewer.locate_in_doc",
  "docs-viewer.summarize_doc",
  "docs-viewer.doc_equation_context",
] as const;
const DOCS_OPEN_DOC_ALIAS_CAPABILITIES = [
  "docs-viewer.open",
  "docs-viewer.open_doc_by_path",
] as const;
const INTERNET_SEARCH_CAPABILITY = HELIX_INTERNET_SEARCH_CAPABILITY;
const INTERNET_SEARCH_ALIAS_CAPABILITIES = [
  "internet_search.web_research",
] as const;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context" as const;
const THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES = [
  "helix_ask.reflect_theory_context",
] as const;
const THEORY_FRONTIER_CONJECTURE_CAPABILITY = "theory-badge-graph.propose_frontier_conjectures" as const;
const THEORY_FRONTIER_CONJECTURE_ALIAS_CAPABILITIES = [
  "propose_frontier_conjectures",
  "frontier_conjecture_workbench",
  "theory_frontier_conjectures",
] as const;
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds" as const;
const CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES = [
  "helix_ask.reflect_civilization_bounds",
] as const;
const VOICE_INTERIM_CALLOUT_CAPABILITY = "live_env.request_interim_voice_callout" as const;
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say" as const;
const LIVE_SOURCE_STATE_READ_CAPABILITIES = [
  "live_env.query_live_source_quality",
  "live_env.query_workstation_goal_context",
  "live_env.summarize_live_source_current_state",
] as const;
const SITUATION_STAGE_STATE_READ_CAPABILITIES = [
  "live_env.query_event_log",
  "live_env.query_world_events",
  "live_env.query_navigation_state",
  "live_env.query_stage_sources",
  "live_env.query_constructs",
  "live_env.query_job_evidence",
] as const;
const LIVE_SOURCE_MAILBOX_READ_CAPABILITIES = [
  "live_env.check_live_source_mail",
  "live_env.read_live_source_mail",
  "live_env.read_processed_live_source_mail",
  "live_env.reflect_live_source_mail_loop",
] as const;
const LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES = [
  "live_env.compare_mail_to_interpreter_profile",
  "live_env.validate_live_source_prediction",
  "live_env.predict_live_source_immediate",
  "live_env.compare_live_source_prediction",
] as const;
const STAGE_PLAY_BUILDER_READ_CAPABILITIES = [
  "live_env.describe_stage_builder",
  "live_env.validate_stage_play_graph",
  "live_env.plan_stage_play_job",
] as const;
const VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY = "live_env.query_visual_observer_profiles" as const;
const VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY = "live_env.test_visual_observer_profile" as const;
const VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY = "live_env.compare_visual_observer_profiles" as const;
const PROMPT_NAMED_CAPABILITIES = [
  WORKSPACE_OS_STATUS_CAPABILITY,
  DOCS_SEARCH_CAPABILITY,
  DOCS_OPEN_DOC_CAPABILITY,
  ...DOCS_SEARCH_ALIAS_CAPABILITIES,
  ...DOCS_OPEN_DOC_ALIAS_CAPABILITIES,
  REPO_SEARCH_CAPABILITY,
  ...REPO_SEARCH_ALIAS_CAPABILITIES,
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  ...CALCULATOR_SOLVE_ALIAS_CAPABILITIES,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  THEORY_FRONTIER_CONJECTURE_CAPABILITY,
  CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  INTERNET_SEARCH_CAPABILITY,
  ...INTERNET_SEARCH_ALIAS_CAPABILITIES,
  ...THEORY_CONTEXT_REFLECTION_ALIAS_CAPABILITIES,
  ...THEORY_FRONTIER_CONJECTURE_ALIAS_CAPABILITIES,
  ...CIVILIZATION_BOUNDS_REFLECTION_ALIAS_CAPABILITIES,
  VOICE_INTERIM_CALLOUT_CAPABILITY,
  VOICE_NARRATOR_SAY_CAPABILITY,
  ...WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES,
  ...LIVE_SOURCE_STATE_READ_CAPABILITIES,
  ...SITUATION_STAGE_STATE_READ_CAPABILITIES,
  ...LIVE_SOURCE_MAILBOX_READ_CAPABILITIES,
  ...LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES,
  ...STAGE_PLAY_BUILDER_READ_CAPABILITIES,
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
] as const;
const MAX_PROMPT_NAMED_CAPABILITY_REQUESTS = 24;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const readHelixAgentTurnId = (body: Record<string, unknown>): string =>
  readString(body.turn_id) ?? readString(body.turnId) ?? `ask:agent-provider:${crypto.randomUUID()}`;

export const readExplicitWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const calls = body.workstation_gateway_calls ?? body.workstationGatewayCalls;
  const call = body.workstation_gateway_call ?? body.workstationGatewayCall;
  return [
    ...(Array.isArray(calls) ? calls : []),
    ...(call ? [call] : []),
  ]
    .map(readRecord)
    .filter((record): record is Record<string, unknown> => Boolean(record))
    .slice(0, 10);
};

export const hasExplicitWorkstationGatewayCalls = (body: Record<string, unknown>): boolean =>
  readExplicitWorkstationGatewayCallRequests(body).length > 0;

export const hasSelectedHelixAgentRuntime = (body: Record<string, unknown>): boolean =>
  Boolean(readString(body.agent_runtime) ?? readString(body.agentRuntime));

const readPrompt = (body: Record<string, unknown>): string | null =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt);

const unquotePrompt = (prompt: string): string => prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

const hasNegatedToolInstruction = (prompt: string, toolPattern: RegExp): boolean => {
  const unquoted = unquotePrompt(prompt);
  const negated = /\b(?:do\s+not|don't|dont|without|no\s+need\s+to|not\s+asking\s+to|avoid)\b[\s\S]{0,100}/gi;
  for (const match of unquoted.matchAll(negated)) {
    if (toolPattern.test(match[0] ?? "")) return true;
  }
  return false;
};

const requestKey = (request: Record<string, unknown>): string => {
  const args = readRecord(request.arguments ?? request.args) ?? {};
  const capability = readString(request.capability_id) ?? readString(request.capabilityId) ?? "";
  if (
    capability === THEORY_CONTEXT_REFLECTION_CAPABILITY ||
    capability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY ||
    capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY ||
    capability === INTERNET_SEARCH_CAPABILITY ||
    capability === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY ||
    capability === VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY ||
    capability === VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY
  ) {
    return capability;
  }
  const expression = readString(args.expression) ?? readString(args.latex);
  const query = readString(args.query) ?? readString(args.prompt) ?? readString(args.text);
  const pathList = Array.isArray(args.paths)
    ? args.paths.map(readString).filter(Boolean).join(",")
    : readString(args.path) ?? "";
  return [capability, expression, query, pathList].filter(Boolean).join(":");
};

const appendDedupe = (
  requests: Record<string, unknown>[],
  seen: Set<string>,
  next: Record<string, unknown>[],
): void => {
  for (const request of next) {
    const key = requestKey(request);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    requests.push(request);
  }
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const promptNamedCapabilityPattern = (capabilityId: string): RegExp =>
  new RegExp(`(?:^|[^A-Za-z0-9_.-])${escapeRegExp(capabilityId)}(?=$|[\\s,;:!?)]|\\.(?:\\s|$))`, "i");

const isContextualPromptNamedCapabilityMention = (prompt: string, capabilityId: string): boolean => {
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

const hasPromptNamedCapability = (prompt: string, capabilityId: string): boolean =>
  (
    promptNamedCapabilityPattern(capabilityId).test(unquotePrompt(prompt)) ||
    unquotePrompt(prompt).toLowerCase().split(/[^a-z0-9_.-]+/i).includes(capabilityId.toLowerCase())
  ) &&
  !isContextualPromptNamedCapabilityMention(prompt, capabilityId);

const isWorkspaceOsStatusSelection = (capabilityId: string): boolean =>
  capabilityId === WORKSPACE_OS_STATUS_CAPABILITY ||
  capabilityId === "workspace_diagnostic" ||
  capabilityId === "workspace_status" ||
  capabilityId === "workspace_os_status";

const readPromptNamedCapabilitySegment = (prompt: string, capabilityId: string): string | null => {
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

const cleanNamedCapabilityArgumentText = (value: string | null | undefined): string | null => {
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

const extractVoiceUtteranceTextFromPrompt = (prompt: string): string | null => {
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

const extractNamedDocsPath = (segment: string): string | null => {
  const rawPath = segment.match(/\bdocs[\\/][^\s;,)]+/i)?.[0];
  return normalizeDocPath(rawPath?.replace(/[.,;:!?)]*$/g, ""));
};

const extractNamedCapabilityQuery = (segment: string | null, fallback: string): string => {
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

const normalizeDocPath = (value: unknown): string | null => {
  const raw = readString(value);
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..") || /^[a-z]:\//i.test(normalized)) return null;
  return normalized.startsWith("docs/") ? normalized : null;
};

const readWorkspaceSnapshot = (body: Record<string, unknown>): Record<string, unknown> | null =>
  readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot);

const isActiveDocsViewerDeicticPrompt = (prompt: string): boolean => {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquotedPrompt = unquotePrompt(prompt);
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

export const buildActiveDocsContextWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isActiveDocsViewerDeicticPrompt(prompt)) return [];
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
  if (!activeDocPath) return [];
  const fileName = activeDocPath.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const query = fileName || activeDocPath;
  const derivationSource =
    activePanel === "docs-viewer"
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
      source_target_intent: {
        source: derivationSource,
        target_source: "active_doc",
        target_kind: "active_doc",
        focused_panel: activePanel,
        active_panel: activePanel,
        active_doc_path: activeDocPath,
        retained_source_context: activePanel !== "docs-viewer",
        deictic_prompt: true,
      },
    },
  }];
};

const isActiveCalculatorDeicticPrompt = (prompt: string): boolean => {
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

const hasNegatedSurfaceReadInstruction = (prompt: string): boolean =>
  hasNegatedToolInstruction(
    prompt,
    /\b(?:read|translate|summari[sz]e|narrat(?:e|or)|speak|surface|selected|hovered|visible|current|panel|doc|document|calculator|result)\b/i,
  );

const isContextualSurfaceReadMention = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:text|sentence|phrase|quote|screen|page|button|label|ui)\b[\s\S]{0,140}\b(?:says|shows|reads|contains|mentions|labeled|labelled|called|named)\b[\s\S]{0,140}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b/i.test(unquoted) ||
    /\b(?:explain|describe|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,140}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b[\s\S]{0,140}\b(?:mean|means|do|does|is|are|would)\b/i.test(unquoted) ||
    /\b(?:future|later|eventually|hypothetically|would|could|might)\b[\s\S]{0,160}\b(?:read|translate|summari[sz]e|surface|selected|hovered|visible|current\s+panel)\b/i.test(unquoted)
  );
};

const buildPromptDerivedReadableSurfaceGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  if (hasNegatedSurfaceReadInstruction(prompt) || isContextualSurfaceReadMention(prompt)) return [];
  if (/\b(?:read\s+aloud|speak(?:\s+out\s+loud)?|narrat(?:e|or)|voice\s+(?:read|say|speak)|say\s+out\s+loud)\b/i.test(unquotePrompt(prompt))) {
    return [];
  }
  const unquoted = unquotePrompt(prompt);
  const asksTranslate = /\b(?:translate|translated|translation)\b[\s\S]{0,120}\b(?:visible|selected|hovered|surface|section|block)\b/i.test(unquoted);
  const asksSummarize = /\b(?:summari[sz]e|overview|brief)\b[\s\S]{0,120}\b(?:visible|selected|hovered|surface|section|block|calculator\s+result)\b/i.test(unquoted);
  const asksRead =
    /\b(?:read|inspect|observe)\b[\s\S]{0,120}\b(?:selected|hovered|visible|active)\b[\s\S]{0,80}\b(?:paragraph|section|block|surface|calculator\s+result|result)\b/i.test(unquoted) ||
    /\b(?:selected|hovered|visible|active)\b[\s\S]{0,80}\b(?:paragraph|section|block|surface|calculator\s+result|result)\b[\s\S]{0,80}\b(?:read|inspect|observe|say)\b/i.test(unquoted);
  if (!asksTranslate && !asksSummarize && !asksRead) return [];

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
  const activePanel = readString(workspaceSnapshot?.activePanel ?? workspaceSnapshot?.active_panel);
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

const isActiveWorkstationContextPrompt = (prompt: string): boolean => {
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

const readCapabilitySelection = (record: Record<string, unknown> | null): string | null => {
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

const collectStructuredAdmissionRecords = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const routeMetadata = readRecord(body.route_metadata ?? body.routeMetadata);
  return [
    readRecord(body.source_target_intent ?? body.sourceTargetIntent),
    readRecord(body.capability_selection_result ?? body.capabilitySelectionResult),
    routeMetadata,
    readRecord(routeMetadata?.source_target_intent ?? routeMetadata?.sourceTargetIntent),
    readRecord(routeMetadata?.capability_selection_result ?? routeMetadata?.capabilitySelectionResult),
  ].filter((record): record is Record<string, unknown> => Boolean(record));
};

const readGatewayQuery = (body: Record<string, unknown>, admission: Record<string, unknown>): string | null => {
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

const readGatewayCalculatorExpression = (
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

const readGatewayPaths = (admission: Record<string, unknown>): string[] => {
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
  const planned = planWorkstationToolUse(prompt, {
    turnId: readString(body.turn_id) ?? readString(body.turnId),
    threadId: readString(body.thread_id) ?? readString(body.threadId),
    workspaceSnapshot: readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot),
  });
  if (!planned.should_use_tool || planned.missing_required_args.length > 0) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const addPlannerRequest = (request: Record<string, unknown>): void => appendDedupe(requests, seen, [request]);
  const addCalculatorSolve = (expression: string, source: Record<string, unknown>): void => {
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
  return requests.slice(0, 10);
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

const cleanCalculatorExpression = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const expression = value
    .trim()
    .replace(/(?:then|and)\s+[\s\S]*$/i, "")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!expression || expression.length > 80) return null;
  if (!/\d/.test(expression) || !/[+\-*/^%]/.test(expression)) return null;
  if (!/^[0-9.+\-*/^%()[\]]+$/.test(expression)) return null;
  return expression;
};

const CALCULATOR_PROMPT_NAMED_CAPABILITIES = [
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  ...CALCULATOR_SOLVE_ALIAS_CAPABILITIES,
] as const;

const readPromptNamedCalculatorSegment = (prompt: string): {
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

const extractCalculatorMathTokenSequence = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const source = value.trim();
  let start = -1;
  for (let index = 0; index < source.length; index += 1) {
    if (/[\d(]/.test(source[index] ?? "")) {
      start = index;
      break;
    }
  }
  if (start < 0) return null;
  let candidate = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (/[0-9.+\-*/^%()[\]\s]/.test(char)) {
      candidate += char;
      continue;
    }
    break;
  }
  return cleanCalculatorExpression(candidate);
};

const extractCalculatorPercentOfExpression = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const match = value.match(
    /(?:what\s+is\s+|calculate\s+|evaluate\s+|compute\s+|solve\s+)?(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i,
  );
  return match ? `${match[1]}% of ${match[2]}` : null;
};

const extractCalculatorExpressionFromPrompt = (prompt: string): string | null => {
  if (hasNegatedToolInstruction(prompt, /\b(?:calculator|calculate|compute|evaluate|solve|expression)\b/i)) {
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
    unquoted.match(/\bscientific-calculator\.(?:solve_expression|solve_with_steps|solve)\b[\s\S]{0,80}\b(?:for|with|expression|calculate|evaluate|solve|compute)?\s*:?\s*([0-9][0-9\s.+\-*/^%()[\]]{1,80})/i)?.[1] ??
    unquoted.match(/\b(?:scientific\s+calculator|calculator|calc)\b[\s\S]{0,100}\b(?:calculate|evaluate|solve|compute|expression)\s*:?\s*([0-9][0-9\s.+\-*/^%()[\]]{1,80})/i)?.[1] ??
    null;
  if (explicitCapability) return extractCalculatorMathTokenSequence(explicitCapability);
  const direct =
    unquoted.match(/\b(?:calculate|evaluate|compute|solve)\s+([0-9][0-9\s.+\-*/^%()[\]]{1,80})/i)?.[1] ??
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
  if (hasNegatedToolInstruction(prompt, /\b(?:reflect|reflection|theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i)) {
    return [];
  }
  const unquoted = unquotePrompt(prompt);
  const wantsTheoryReflection =
    /\breflect\b[\s\S]{0,120}\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b[\s\S]{0,120}\breflect(?:ion)?\b/i.test(unquoted);
  if (!wantsTheoryReflection) return [];
  const focusedPrompt =
    cleanNamedCapabilityArgumentText(
      unquoted.match(/\breflect\s+(.{3,160}?)\s+(?:against|through|via|with)\s+(?:the\s+)?(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph)\b/i)?.[1] ??
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

const extractRepoSearchQueryFromPrompt = (prompt: string): string | null => {
  if (hasNegatedToolInstruction(prompt, /\b(?:repo|repository|code|source|implementation|search)\b/i)) return null;
  const unquoted = unquotePrompt(prompt);
  const exact =
    unquoted.match(/\b(?:search|grep|look\s+(?:in|through)|find)\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\s+(?:for|about)\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    unquoted.match(/\b(?:repo|repository|codebase|source|code)\s+(?:search|grep)\s+(?:for|about)\s+([A-Za-z0-9_.:/\\-]{3,80})/i)?.[1] ??
    unquoted.match(/\b(?:find|locate)\s+([A-Za-z0-9_.:/\\-]{3,80})\s+in\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\b/i)?.[1] ??
    null;
  if (exact) return exact.replace(/[.,;:!?)]*$/g, "").trim();
  if (!/\b(?:repo|repository|codebase|source|implementation|where\s+(?:is|are).+\b(?:implemented|defined|handled))\b/i.test(unquoted)) {
    return null;
  }
  const fallback = unquoted.match(/\b([A-Za-z][A-Za-z0-9_.-]{2,80})\b(?=[^.!?]*\b(?:repo|repository|codebase|source|implementation)\b)/i)?.[1];
  const normalizedFallback = fallback?.trim() ?? null;
  if (
    normalizedFallback &&
    /^(?:search|grep|look|find|locate|show|tell|use|check|inspect|scan)$/i.test(normalizedFallback)
  ) {
    return null;
  }
  return normalizedFallback;
};

const hasAffirmativeRepoSearchIntent = (prompt: string): boolean => {
  if (hasNegatedToolInstruction(prompt, /\b(?:repo|repository|code|source|implementation|search)\b/i)) return false;
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:search|grep|look\s+(?:in|through)|find|locate)\s+(?:the\s+)?(?:repo|repository|codebase|source|code)\b/i.test(unquoted) ||
    /\b(?:repo|repository|codebase|source|code)\s+(?:search|grep|lookup|look\s*up)\b/i.test(unquoted)
  );
};

export const buildPromptDerivedRepoSearchGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
  const query = extractRepoSearchQueryFromPrompt(prompt);
  if (!query && !hasAffirmativeRepoSearchIntent(prompt)) return [];
  return [{
    schema: "helix.workstation_gateway.prompt_derived_repo_search_call_request.v1",
    derivation_source: "helix_prompt_derived_repo_search",
    capability_id: REPO_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      ...(query ? { query } : {}),
      source_target_intent: {
        source: "helix_prompt_derived_repo_search",
        target_source: "repo_code",
        target_kind: "repo_search",
        ...(query ? { query } : { blocked_reason: "missing_query" }),
      },
    },
  }];
};

export const buildPromptDerivedInternetSearchGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt) return [];
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
    capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
    mode: "act",
    arguments: {
      text,
      kind: "tool_progress",
      source_target_intent: {
        source: "helix_prompt_derived_voice_callout",
        target_source: "voice_delivery",
        target_kind: "interim_voice_callout",
        explicit_cues: ["voice_lane_say"],
      },
    },
  }];
};

export const readWorkstationGatewayCallRequestsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
}): Record<string, unknown>[] => {
  const explicit = readExplicitWorkstationGatewayCallRequests(input.body);
  if (explicit.length > 0) return explicit;
  if (input.includePlannerDerived !== true) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const structured = buildStructuredAdmissionWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, structured);
  const compoundDependencyRequests = buildCompoundCapabilityDependencyGatewayCallRequests(input.body);
  appendDedupe(requests, seen, compoundDependencyRequests);
  const compoundDependencyCapabilities = new Set(
    compoundDependencyRequests
      .map((request) => readString(request.capability_id) ?? readString(request.capabilityId))
      .filter((capability): capability is string => Boolean(capability)),
  );
  const promptNamed = buildPromptNamedCapabilityGatewayCallRequests(input.body);
  const promptNamedCapabilities = new Set(
    promptNamed
      .map((request) => readString(request.capability_id) ?? readString(request.capabilityId))
      .filter((capability): capability is string => Boolean(capability)),
  );
  const hasNamedDocsSearch = promptNamed.some((request) => readString(request.capability_id) === DOCS_SEARCH_CAPABILITY);
  if (hasNamedDocsSearch) {
    appendDedupe(requests, seen, promptNamed);
  } else {
    if (
      !compoundDependencyCapabilities.has(DOCS_SEARCH_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_VISIBLE_SURFACE_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY)
    ) {
      const activeDocsContext = buildActiveDocsContextWorkstationGatewayCallRequests(input.body);
      appendDedupe(requests, seen, activeDocsContext);
    }
    appendDedupe(requests, seen, promptNamed);
  }
  const activeCalculatorContext = buildActiveCalculatorContextWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeCalculatorContext);
  const activeWorkstationContext = buildActiveWorkstationContextGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeWorkstationContext);
  appendDedupe(requests, seen, buildPromptDerivedReadableSurfaceGatewayCallRequests(input.body));
  if (!promptNamedCapabilities.has(WORKSPACE_OS_STATUS_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedWorkspaceStatusGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(VOICE_INTERIM_CALLOUT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_NARRATOR_SAY_CAPABILITY)
  ) {
    appendDedupe(requests, seen, buildPromptDerivedVoiceGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedCalculatorSolveGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(THEORY_CONTEXT_REFLECTION_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
  }
  if (promptNamedCapabilities.size === 0) {
    appendDedupe(requests, seen, buildPlannerDerivedWorkstationGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(SCHOLARLY_RESEARCH_SEARCH_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedScholarlyResearchGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(INTERNET_SEARCH_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedInternetSearchGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(REPO_SEARCH_CAPABILITY) && !compoundDependencyCapabilities.has(REPO_SEARCH_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedRepoSearchGatewayCallRequests(input.body));
  }
  return requests.slice(0, 10);
};

export const hasWorkstationGatewayCallsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
}): boolean => readWorkstationGatewayCallRequestsForTurn(input).length > 0;

export const runExplicitWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  agentRuntime: HelixAgentRuntimeId;
  turnId?: string | null;
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  const requests = readWorkstationGatewayCallRequestsForTurn({
    body: input.body,
    includePlannerDerived: hasSelectedHelixAgentRuntime(input.body),
  });
  const turnId = input.turnId ?? readHelixAgentTurnId(input.body);
  const results: HelixWorkstationGatewayCallResult[] = [];
  for (const [index, request] of requests.entries()) {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: input.agentRuntime,
      mode: readString(request.mode),
      capabilityId: readString(request.capability_id) ?? readString(request.capabilityId) ?? "",
      arguments: readRecord(request.arguments ?? request.args) ?? {},
      approvalToken: readString(request.approval_token) ?? readString(request.approvalToken),
      turnId,
      iteration: typeof request.iteration === "number" ? request.iteration : index + 1,
    });
    results.push(result);
    const dependentVoiceRequest = buildDependentCompoundCapabilityGatewayCallRequest({
      request,
      result,
      turnId,
    });
    const dependencyRailStatus = buildCompoundDependencyRailStatus({
      request,
      result,
      dependentRequest: dependentVoiceRequest,
    });
    if (dependencyRailStatus) {
      const observation = readRecord(result.observation);
      if (observation) {
        observation.compound_dependency_plan = dependencyRailStatus;
      }
      result.observation_packet.state_delta = {
        ...(readRecord(result.observation_packet.state_delta) ?? {}),
        compound_dependency_plan: dependencyRailStatus,
      };
    }
    if (dependentVoiceRequest) {
      results.push(await callWorkstationGatewayCapability({
        agentRuntime: input.agentRuntime,
        mode: readString(dependentVoiceRequest.mode),
        capabilityId: readString(dependentVoiceRequest.capability_id) ?? "",
        arguments: readRecord(dependentVoiceRequest.arguments) ?? {},
        turnId,
        iteration: results.length + 1,
      }));
    }
  }
  const turnCompoundDependencyPlan = buildTurnCompoundDependencyPlan({
    turnId,
    results,
  });
  if (turnCompoundDependencyPlan) {
    for (const result of results) {
      const sourceTargetIntent = readRecord(result.gateway_admission.source_target_intent);
      if (!readString(sourceTargetIntent?.compound_outcome)) continue;
      const observation = readRecord(result.observation);
      if (observation) {
        observation.compound_dependency_turn_plan = turnCompoundDependencyPlan;
      }
      result.observation_packet.state_delta = {
        ...(readRecord(result.observation_packet.state_delta) ?? {}),
        compound_dependency_turn_plan: turnCompoundDependencyPlan,
      };
    }
  }
  return results;
};
