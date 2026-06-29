import crypto from "node:crypto";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import {
  callWorkstationGatewayCapability,
} from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { planWorkstationToolUse } from "../workstation-tool-planner";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;

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
    .slice(0, 3);
};

export const hasExplicitWorkstationGatewayCalls = (body: Record<string, unknown>): boolean =>
  readExplicitWorkstationGatewayCallRequests(body).length > 0;

export const hasSelectedHelixAgentRuntime = (body: Record<string, unknown>): boolean =>
  Boolean(readString(body.agent_runtime) ?? readString(body.agentRuntime));

const readPrompt = (body: Record<string, unknown>): string | null =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt);

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
  const mentionsCurrentDoc =
    /\b(?:this|current|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(prompt) ||
    /\b(?:doc|document|paper|white\s*paper|whitepaper)\s+(?:on\s+screen|in\s+(?:the\s+)?docs?\s+viewer|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(prompt);
  const asksForContent = /\b(?:summari[sz]e|explain|what\s+is|what'?s|about|key\s+(?:points|findings)|caveats?|read)\b/i.test(prompt);
  return mentionsCurrentDoc && asksForContent;
};

export const buildActiveDocsContextWorkstationGatewayCallRequests = (
  body: Record<string, unknown>,
): Record<string, unknown>[] => {
  const prompt = readPrompt(body);
  if (!prompt || !isActiveDocsViewerDeicticPrompt(prompt)) return [];
  const workspaceSnapshot = readWorkspaceSnapshot(body);
  const activePanel = readString(workspaceSnapshot?.activePanel ?? workspaceSnapshot?.active_panel);
  const activeDocPath = normalizeDocPath(
    workspaceSnapshot?.activeDocPath ??
      workspaceSnapshot?.active_doc_path ??
      workspaceSnapshot?.docContextPath ??
      workspaceSnapshot?.doc_context_path,
  );
  if (activePanel !== "docs-viewer" || !activeDocPath) return [];
  const fileName = activeDocPath.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
  const query = fileName || activeDocPath;
  return [{
    schema: "helix.workstation_gateway.active_docs_context_call_request.v1",
    derivation_source: "helix_active_docs_viewer_context",
    capability_id: DOCS_SEARCH_CAPABILITY,
    mode: "read",
    arguments: {
      query,
      paths: [activeDocPath],
      source_target_intent: {
        source: "helix_active_docs_viewer_context",
        target_source: "active_doc",
        target_kind: "active_doc",
        active_panel: activePanel,
        active_doc_path: activeDocPath,
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
    if (selectedCapability === "repo-code.search_concept") {
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
    if (selectedCapability === "docs-viewer.locate_in_doc" || selectedCapability === "docs-viewer.search_docs") {
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
  }
  return requests.slice(0, 3);
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
  if (planned.intent !== "calculator_solve" && planned.intent !== "calculator_verify") return [];
  const action = planned.action;
  if (!action || action.panel_id !== "scientific-calculator") return [];
  if (action.action_id !== "solve_expression" && action.action_id !== "solve_with_steps") return [];
  const expression = readString(action.args.latex) ?? readString(action.args.expression);
  if (!expression) return [];
  return [{
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
        panel_id: action.panel_id,
        action_id: action.action_id,
        tool_plan_id: planned.tool_plan?.plan_id ?? null,
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
  const structured = buildStructuredAdmissionWorkstationGatewayCallRequests(input.body);
  if (structured.length > 0) return structured;
  const activeDocsContext = buildActiveDocsContextWorkstationGatewayCallRequests(input.body);
  if (activeDocsContext.length > 0) return activeDocsContext;
  const activeCalculatorContext = buildActiveCalculatorContextWorkstationGatewayCallRequests(input.body);
  if (activeCalculatorContext.length > 0) return activeCalculatorContext;
  const activeWorkstationContext = buildActiveWorkstationContextGatewayCallRequests(input.body);
  if (activeWorkstationContext.length > 0) return activeWorkstationContext;
  return buildPlannerDerivedWorkstationGatewayCallRequests(input.body);
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
