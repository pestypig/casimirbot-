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

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const WORKSPACE_OS_STATUS_CAPABILITY = HELIX_WORKSPACE_OS_STATUS_CAPABILITY;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;
const INTERNET_SEARCH_CAPABILITY = HELIX_INTERNET_SEARCH_CAPABILITY;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context" as const;
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds" as const;

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
    /\b(?:this|current|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedPrompt) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper)\s+(?:on\s+screen|in\s+(?:the\s+)?docs?\s+viewer|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotedPrompt);
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
    if (selectedCapability === "docs-viewer.open_doc" || selectedCapability === "docs-viewer.open_doc_by_path") {
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
          source_target_intent: sourceTargetIntent,
        },
      });
      continue;
    }
    const query = readGatewayQuery(body, admission);
    if (!query) continue;
    if (selectedCapability === "repo-code.search_concept" || selectedCapability === REPO_SEARCH_CAPABILITY) {
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
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (
      selectedCapability === "docs-viewer.locate_in_doc" ||
      selectedCapability === "docs-viewer.search_docs" ||
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
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (
      selectedCapability === INTERNET_SEARCH_CAPABILITY ||
      selectedCapability === "internet.search" ||
      selectedCapability === "internet_search.web_research" ||
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
          source_target_intent: sourceTargetIntent,
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
    if (selectedCapability === THEORY_CONTEXT_REFLECTION_CAPABILITY) {
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
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (selectedCapability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) {
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
          source_target_intent: sourceTargetIntent,
        },
      });
    }
    if (selectedCapability === WORKSPACE_OS_STATUS_CAPABILITY) {
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
  }
  return requests.slice(0, 10);
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
  const activeDocsContext = buildActiveDocsContextWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeDocsContext);
  const activeCalculatorContext = buildActiveCalculatorContextWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeCalculatorContext);
  const activeWorkstationContext = buildActiveWorkstationContextGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeWorkstationContext);
  appendDedupe(requests, seen, buildPromptDerivedWorkspaceStatusGatewayCallRequests(input.body));
  appendDedupe(requests, seen, buildPlannerDerivedWorkstationGatewayCallRequests(input.body));
  appendDedupe(requests, seen, buildPromptDerivedScholarlyResearchGatewayCallRequests(input.body));
  appendDedupe(requests, seen, buildPromptDerivedInternetSearchGatewayCallRequests(input.body));
  appendDedupe(requests, seen, buildPromptDerivedRepoSearchGatewayCallRequests(input.body));
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
    results.push(await callWorkstationGatewayCapability({
      agentRuntime: input.agentRuntime,
      mode: readString(request.mode),
      capabilityId: readString(request.capability_id) ?? readString(request.capabilityId) ?? "",
      arguments: readRecord(request.arguments ?? request.args) ?? {},
      approvalToken: readString(request.approval_token) ?? readString(request.approvalToken),
      turnId,
      iteration: typeof request.iteration === "number" ? request.iteration : index + 1,
    }));
  }
  return results;
};
