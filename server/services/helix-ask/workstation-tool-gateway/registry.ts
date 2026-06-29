import { readFileSync } from "node:fs";
import path from "node:path";

import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
} from "../workspace-os-status-intent";
import {
  HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  executeWorkspaceOsStatusTool,
} from "../workspace-os-status-tool";
import {
  formatRepoSearchEvidence,
  runRepoSearch,
  type RepoSearchHit,
} from "../repo-search";
import {
  buildDocsSearchDocumentCandidates,
  buildDocsSearchTerms,
  mergeDocsSearchPathCandidates,
  rankDocsSearchHits,
} from "../docs-search";
import {
  HELIX_INTERNET_SEARCH_CAPABILITY,
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
  type HelixInternetSearchProvider,
} from "@shared/helix-internet-search-observation";
import {
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  type HelixScholarlyResearchIntentMode,
  type HelixScholarlyResearchProvider,
} from "@shared/helix-scholarly-research-observation";
import { runInternetSearch } from "../retrieval/internet-search";
import { runScholarlyResearchLookup } from "../retrieval/scholarly-research-lookup";
import { buildWorkstationGatewayObservationPacket } from "./observation-packet";
import {
  HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
  HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
} from "@shared/helix-tool-lifecycle";
import {
  CIVILIZATION_LAYER_MODES,
  type CivilizationLayerModeV1,
} from "@shared/civilization-bounds-roadmap";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { runHelixTheoryContextReflectionTool } from "@shared/theory/theory-context-reflection-tool";
import { runHelixAskCivilizationBoundsTool } from "../../../skills/helix-ask.civilization-bounds-roadmap";
import type {
  HelixWorkstationGatewayAdmissionRecord,
  HelixWorkstationCapabilityManifest,
  HelixWorkstationGatewayCallInput,
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayListInput,
  HelixWorkstationGatewayListResult,
  HelixWorkstationGatewayMode,
} from "./types";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixToolFollowupDecision,
  HelixToolLifecycleTrace,
} from "@shared/helix-tool-lifecycle";

const DEFAULT_MODE: HelixWorkstationGatewayMode = "observe";
const WORKSTATION_GATEWAY_SCHEMA = "helix.workstation_tool_gateway.v1" as const;
const WORKSTATION_GATEWAY_MANIFEST_VERSION = "read-observe-act.v1" as const;
const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA = "helix.workstation_active_context_observation.v1" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_SOLVE_OBSERVATION_SCHEMA = "helix.calculator_solve_observation.v1" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA = "helix.calculator_active_context_observation.v1" as const;
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel" as const;
const CALCULATOR_FOCUS_PANEL_CAPABILITY = "scientific-calculator.focus_panel" as const;
const CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY = "scientific-calculator.show_gateway_solve" as const;
const WORKSTATION_OPEN_PANEL_CAPABILITY = "workstation.open_panel" as const;
const WORKSTATION_FOCUS_PANEL_CAPABILITY = "workstation.focus_panel" as const;
const WORKSTATION_UI_ACTION_RECEIPT_SCHEMA = "helix.workstation_ui_action_receipt.v1" as const;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const REPO_SEARCH_OBSERVATION_SCHEMA = "helix.repo_search_observation.v1" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_SEARCH_OBSERVATION_SCHEMA = "helix.docs_search_observation.v1" as const;
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;
const INTERNET_SEARCH_CAPABILITY = HELIX_INTERNET_SEARCH_CAPABILITY;
const INTERNET_SEARCH_OBSERVATION_SCHEMA = HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
const SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA = HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA;
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds" as const;
const CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA =
  "helix.civilization_bounds_reflection_observation.v1" as const;
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context" as const;
const THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA = "helix.theory_context_reflection_observation.v1" as const;
const REPO_SEARCH_DEFAULT_PATHS = ["server", "shared", "client/src", "docs"] as const;
const DOCS_SEARCH_DEFAULT_PATHS = ["docs"] as const;
const INTERNET_SEARCH_PROVIDERS = ["tavily", "exa", "google_custom_search"] as const;
const SCHOLARLY_RESEARCH_PROVIDERS = [
  "arxiv",
  "openalex",
  "crossref",
  "semantic_scholar",
  "unpaywall",
  "core",
] as const;
const SCHOLARLY_RESEARCH_MODES = [
  "paper_search",
  "doi_lookup",
  "citation_lookup",
  "reference_lookup",
] as const;
const SAFE_WORKSTATION_PANEL_ACTION_IDS = [
  "docs-viewer",
  "scientific-calculator",
  "image-lens",
  "document-image-lens",
  "workstation-process-graph",
  "workstation-task-manager",
  "workstation-storage-map",
  "workstation-workflow-timeline",
] as const;
const REPO_SEARCH_ALLOWED_PATH_PREFIXES = [
  "server",
  "shared",
  "client",
  "docs",
  "modules",
  "scripts",
  "tools",
  "packages",
] as const;
const DOCS_SEARCH_ALLOWED_PATH_PREFIXES = ["docs"] as const;

const cleanString = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const optionalString = (value: unknown): string | null => {
  const cleaned = cleanString(value);
  return cleaned || null;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => cleanString(entry)).filter(Boolean).slice(0, 32)
    : [];

const readCivilizationLayerMode = (value: unknown): CivilizationLayerModeV1 | undefined => {
  const cleaned = cleanString(value);
  return (CIVILIZATION_LAYER_MODES as readonly string[]).includes(cleaned)
    ? (cleaned as CivilizationLayerModeV1)
    : undefined;
};

const normalizeMode = (value: unknown): HelixWorkstationGatewayMode => {
  const mode = cleanString(value, DEFAULT_MODE).toLowerCase();
  if (mode === "read" || mode === "observe" || mode === "act" || mode === "verify") return mode;
  return DEFAULT_MODE;
};

const gatewayModeRank: Record<HelixWorkstationGatewayMode, number> = {
  observe: 2,
  read: 2,
  verify: 2,
  act: 3,
};

const permissionProfileRank: Record<HelixWorkstationCapabilityManifest["permission_profile_required"], number> = {
  observe: 1,
  read: 2,
  act: 3,
  write: 4,
  danger: 5,
};

const modeAllowsManifest = (
  mode: HelixWorkstationGatewayMode,
  manifest: HelixWorkstationCapabilityManifest,
): boolean => gatewayModeRank[mode] >= permissionProfileRank[manifest.permission_profile_required];

const normalizeGatewayCapabilityId = (value: string): string => {
  if (value === "internet.search" || value === "web.search" || value === "internet_search.web_research") {
    return INTERNET_SEARCH_CAPABILITY;
  }
  if (
    value === "scholarly.search" ||
    value === "research-papers.search" ||
    value === "research_papers.search"
  ) {
    return SCHOLARLY_RESEARCH_SEARCH_CAPABILITY;
  }
  return value;
};

const readArguments = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readSafeWorkstationPanelId = (value: unknown): string | null => {
  const panelId = cleanString(value).replace(/[^a-z0-9_-]/gi, "").trim();
  return SAFE_WORKSTATION_PANEL_ACTION_IDS.some((allowed) => allowed === panelId) ? panelId : null;
};

const readBoundedPanelIdArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => cleanString(entry).replace(/[^a-z0-9_-]/gi, "").trim())
        .filter(Boolean)
        .slice(0, 24)
    : [];

const readBoundedWorkspaceActiveContext = (value: unknown): {
  active_panel: string | null;
  active_group_id: string | null;
  group_count: number | null;
  open_panels: string[];
} => {
  const record = readRecord(value) ?? {};
  const groupCount = Number(record.groupCount ?? record.group_count);
  return {
    active_panel: cleanString(record.activePanel ?? record.active_panel) || null,
    active_group_id: cleanString(record.activeGroupId ?? record.active_group_id) || null,
    group_count: Number.isFinite(groupCount) ? Math.max(0, Math.min(Math.floor(groupCount), 32)) : null,
    open_panels: readBoundedPanelIdArray(record.openPanels ?? record.open_panels),
  };
};

const normalizeNumberText = (value: number): string => {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
};

const solveSafeArithmeticExpression = (expression: string): {
  ok: boolean;
  result?: string;
  blocked_reason?: string;
} => {
  const normalized = expression.replace(/\s+/g, "");
  if (!normalized) return { ok: false, blocked_reason: "missing_expression" };
  if (normalized.length > 240) return { ok: false, blocked_reason: "expression_too_long" };
  if (!/^[\deE.+\-*/^()%]+$/.test(normalized)) {
    return { ok: false, blocked_reason: "unsupported_expression_syntax" };
  }
  if (!/[+\-*/^%]/.test(normalized)) {
    return { ok: false, blocked_reason: "expression_has_no_operator" };
  }
  try {
    const value = Function(`"use strict"; return (${normalized.replace(/\^/g, "**")});`)();
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, blocked_reason: "expression_result_not_finite" };
    }
    return { ok: true, result: normalizeNumberText(value) };
  } catch {
    return { ok: false, blocked_reason: "expression_evaluation_failed" };
  }
};

const normalizeRepoSearchQuery = (value: unknown): string => {
  const query = cleanString(value).replace(/\s+/g, " ");
  return query.length > 180 ? query.slice(0, 180).trim() : query;
};

const normalizeExternalSearchQuery = (value: unknown): string => {
  const query = cleanString(value).replace(/\s+/g, " ");
  return query.length > 260 ? query.slice(0, 260).trim() : query;
};

const readInternetSearchProviders = (value: unknown): HelixInternetSearchProvider[] =>
  readStringArray(value)
    .filter((entry): entry is HelixInternetSearchProvider =>
      (INTERNET_SEARCH_PROVIDERS as readonly string[]).includes(entry),
    )
    .slice(0, 3);

const readScholarlyResearchProviders = (value: unknown): HelixScholarlyResearchProvider[] =>
  readStringArray(value)
    .filter((entry): entry is HelixScholarlyResearchProvider =>
      (SCHOLARLY_RESEARCH_PROVIDERS as readonly string[]).includes(entry),
    )
    .slice(0, 6);

const readScholarlyResearchMode = (value: unknown): HelixScholarlyResearchIntentMode | undefined => {
  const mode = cleanString(value);
  return (SCHOLARLY_RESEARCH_MODES as readonly string[]).includes(mode)
    ? (mode as HelixScholarlyResearchIntentMode)
    : undefined;
};

const readExternalSearchLimit = (value: unknown): number => {
  const limit = Number(value);
  return Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 10)) : 5;
};

const readInternetSearchRecencyDays = (value: unknown): number | null => {
  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? Math.max(1, Math.min(Math.floor(days), 365)) : null;
};

const readInternetSearchDomains = (value: unknown): string[] =>
  readStringArray(value)
    .map((entry) => entry.toLowerCase().replace(/^site:/i, "").trim())
    .filter((entry) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(entry))
    .slice(0, 8);

const isSafeRelativeRepoPath = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  if (/^[a-z]:\//i.test(normalized)) return false;
  return REPO_SEARCH_ALLOWED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
};

const readRepoSearchPaths = (value: unknown): string[] => {
  const requested = readStringArray(value)
    .map((entry) => entry.replace(/\\/g, "/").replace(/^\/+/, "").trim())
    .filter(isSafeRelativeRepoPath)
    .slice(0, 8);
  return requested.length > 0 ? requested : [...REPO_SEARCH_DEFAULT_PATHS];
};

const readRepoSearchMaxHits = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 20)) : 8;
};

const isSafeRelativeDocsPath = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  if (/^[a-z]:\//i.test(normalized)) return false;
  return DOCS_SEARCH_ALLOWED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
};

const readDocsSearchPaths = (value: unknown): string[] => {
  const requested = readStringArray(value)
    .map((entry) => entry.replace(/\\/g, "/").replace(/^\/+/, "").trim())
    .filter(isSafeRelativeDocsPath)
    .slice(0, 8);
  return requested.length > 0 ? requested : [...DOCS_SEARCH_DEFAULT_PATHS];
};

const readDocsActionPath = (value: unknown): string | null => {
  const path = cleanString(value).replace(/\\/g, "/").replace(/^\/+/, "").trim();
  return isSafeRelativeDocsPath(path) ? path : null;
};

const readDocsActionAnchor = (value: unknown): string | null => {
  const anchor = cleanString(value).replace(/[\r\n]/g, " ").trim();
  return anchor ? anchor.slice(0, 180) : null;
};

const clipObservationText = (value: unknown, maxChars = 800): string | null => {
  const text = cleanString(value).replace(/\s+/g, " ");
  return text ? text.slice(0, maxChars).trim() : null;
};

const readBoundedCalculatorActiveContext = (value: unknown): {
  current_latex: string | null;
  last_result_text: string | null;
  last_normalized_expression: string | null;
  last_trace_id: string | null;
  last_ok: boolean | null;
  step_count: number | null;
  recent_debug_events: Record<string, unknown>[];
} => {
  const record = readRecord(value) ?? {};
  const stepCount = Number(record.step_count ?? record.stepCount);
  const recentDebugEventsValue = record.recent_debug_events ?? record.recentDebugEvents;
  const recentDebugEvents = Array.isArray(recentDebugEventsValue)
    ? recentDebugEventsValue
        .map(readRecord)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .slice(0, 5)
        .map((entry) => ({
          action_id: clipObservationText(entry.action_id, 120),
          ok: typeof entry.ok === "boolean" ? entry.ok : null,
          input_latex: clipObservationText(entry.input_latex, 400),
          result_text: clipObservationText(entry.result_text, 400),
          normalized_expression: clipObservationText(entry.normalized_expression, 400),
          message: clipObservationText(entry.message, 240),
          ts: clipObservationText(entry.ts, 120),
        }))
    : [];
  return {
    current_latex: clipObservationText(record.current_latex ?? record.currentLatex),
    last_result_text: clipObservationText(record.last_result_text ?? record.lastResultText),
    last_normalized_expression: clipObservationText(record.last_normalized_expression ?? record.lastNormalizedExpression),
    last_trace_id: clipObservationText(record.last_trace_id ?? record.lastTraceId, 240),
    last_ok: typeof record.last_ok === "boolean" ? record.last_ok : typeof record.lastOk === "boolean" ? record.lastOk : null,
    step_count: Number.isFinite(stepCount) ? Math.max(0, Math.min(Math.floor(stepCount), 200)) : null,
    recent_debug_events: recentDebugEvents,
  };
};

const normalizeDocsObservationLine = (line: string): string => {
  const normalized = line
    .normalize("NFKC")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/[ \t]+/g, " ")
    .trimEnd();
  const codeSpanMatches = [...normalized.matchAll(/`([^`\n]{1,120})`/g)];
  if (codeSpanMatches.length < 2) return normalized;

  let deduped = normalized;
  const seen = new Map<string, string>();
  for (const match of codeSpanMatches) {
    const full = match[0];
    const body = match[1] ?? "";
    const key = body.replace(/\s+/g, "").toLowerCase();
    if (!key) continue;
    const prior = seen.get(key);
    if (!prior) {
      seen.set(key, full);
      continue;
    }
    deduped = deduped.replace(full, "");
  }
  return deduped.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trimEnd();
};

export const normalizeDocsObservationExcerptText = (text: string): string => {
  const normalizedLines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(normalizeDocsObservationLine)
    .filter((line) => line.trim().length > 0);
  return normalizedLines.join("\n").trim();
};

const readBoundedDocsExcerpt = (paths: string[]): {
  path: string;
  excerpt: string;
  excerpt_char_count: number;
  truncated: boolean;
} | null => {
  const exactPath = paths.find((entry) => /^docs\/.+\.md$/i.test(entry));
  if (!exactPath) return null;
  const workspaceRoot = process.cwd();
  const absolutePath = path.resolve(workspaceRoot, exactPath);
  const docsRoot = path.resolve(workspaceRoot, "docs");
  if (absolutePath !== docsRoot && !absolutePath.startsWith(`${docsRoot}${path.sep}`)) return null;
  let text = "";
  try {
    text = readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
  const cleaned = normalizeDocsObservationExcerptText(text)
    .split("\n")
    .slice(0, 60)
    .join("\n")
    .trim();
  if (!cleaned) return null;
  const maxChars = 3200;
  const excerpt = cleaned.length > maxChars ? cleaned.slice(0, maxChars).trimEnd() : cleaned;
  return {
    path: exactPath,
    excerpt,
    excerpt_char_count: excerpt.length,
    truncated: cleaned.length > excerpt.length || text.length > cleaned.length,
  };
};

const clipRepoSearchHit = (hit: RepoSearchHit): RepoSearchHit => ({
  ...hit,
  filePath: hit.filePath.replace(/\\/g, "/"),
  text: hit.text.length > 180 ? `${hit.text.slice(0, 177)}...` : hit.text,
});

const buildAdmission = (input: {
  capabilityId: string;
  agentRuntime: string;
  permissionProfile: HelixWorkstationGatewayAdmissionRecord["permission_profile"];
  status: HelixWorkstationGatewayAdmissionRecord["admission_status"];
  reason: string;
  blockedReason?: string;
  sourceTargetIntent?: unknown;
}): HelixWorkstationGatewayAdmissionRecord => ({
  schema: "helix.workstation_tool_gateway.admission.v1",
  requested_capability: input.capabilityId,
  selected_agent_provider: input.agentRuntime,
  permission_profile: input.permissionProfile,
  source_target_intent: input.sourceTargetIntent,
  admission_status: input.status,
  admission_reason: input.reason,
  blocked_reason: input.blockedReason,
  assistant_answer: false,
  raw_content_included: false,
});

const buildGatewayTrace = (input: {
  turnId: string;
  capabilityId: string;
  agentRuntime: string;
  admission: HelixWorkstationGatewayAdmissionRecord;
  observationPacket: HelixAgentStepObservationPacket;
  error?: string;
}): {
  tool_lifecycle_trace: HelixToolLifecycleTrace;
  tool_followup_decision: HelixToolFollowupDecision;
} => {
  const status = input.observationPacket.status;
  const completed = status === "succeeded";
  const failed = status === "failed";
  const blocked = !failed && (status === "blocked" || input.admission.admission_status === "blocked");
  const traceRef = `${input.turnId}:workstation_gateway:${input.capabilityId}:tool_lifecycle_trace`;
  const observationRefs = input.observationPacket.produced_artifact_refs;
  const retryRecommendation = blocked
    ? "ask_user"
    : failed
      ? "retry_same_tool"
      : "allow_terminal";
  const nextAction = blocked
    ? "ask_user"
    : failed
      ? "retry"
      : "continue_reasoning";
  const lifecycleTrace: HelixToolLifecycleTrace = {
    schema: HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
    turn_id: input.turnId,
    tool_call_id: input.observationPacket.call_id,
    tool_family: "workstation_tool_gateway",
    requested_capability: input.admission.requested_capability,
    admitted_capability: input.admission.admission_status === "admitted" ? input.capabilityId : null,
    executed_capability: blocked ? null : input.capabilityId,
    lifecycle_stage: blocked ? "blocked" : completed ? "completed" : failed ? "failed" : "started",
    status: blocked ? "blocked" : completed ? "completed" : failed ? "failed" : "running",
    session_ref: input.agentRuntime,
    process_ref: null,
    observation_refs: observationRefs,
    receipt_refs: [],
    evidence_refs: observationRefs,
    failure_reason: input.error ?? input.admission.blocked_reason ?? null,
    retry_recommendation: retryRecommendation,
    fallback_used: false,
    fallback_equivalent: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const followupDecision: HelixToolFollowupDecision = {
    schema: HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
    turn_id: input.turnId,
    prior_tool_trace_ref: traceRef,
    observation_summary: input.observationPacket.observation_summary,
    next_action: nextAction,
    reason: blocked
      ? input.admission.blocked_reason ?? "gateway_call_blocked"
      : failed
        ? input.error ?? "gateway_call_failed"
        : "gateway_observation_requires_provider_reasoning_reentry",
    external_change_required: false,
    terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
    required_surface_satisfied: completed,
    evidence_reentered: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    tool_lifecycle_trace: lifecycleTrace,
    tool_followup_decision: followupDecision,
  };
};

const workspaceOsStatusManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  label: "Workspace OS status",
  description:
    "Reads sanitized workspace capability, binding, fallback, and runtime-memory status. It does not execute browser, clipboard, shell, filesystem, or workstation actions.",
  panel_id: "workspace-os",
  action_id: "status",
  mode: "observe",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "observe",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      thread_id: { type: "string" },
      room_id: { type: "string" },
      capability_ids: { type: "array", items: { type: "string" } },
    },
  },
  output_observation_schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  observation_schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "diagnostic_only", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const workstationActiveContextManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
  label: "Workstation active context",
  description:
    "Reads bounded active/open workstation panel identity supplied by the Ask turn context snapshot. It is observation-only and cannot mutate or answer.",
  panel_id: "workstation",
  action_id: "active_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      workspace_context: { type: "object" },
    },
  },
  output_observation_schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  observation_schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "workstation_context", "active_context", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorSolveExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator solve expression",
  description:
    "Evaluates a simple arithmetic expression as read-only calculator evidence. It does not run shell code, mutate files, or become a final answer.",
  panel_id: "scientific-calculator",
  action_id: "solve_expression",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression"],
    properties: {
      expression: { type: "string" },
    },
  },
  output_observation_schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorActiveContextManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
  label: "Scientific Calculator active context",
  description:
    "Reads bounded active Scientific Calculator panel state supplied by the workstation context snapshot. It is observation-only and cannot solve, mutate, or answer.",
  panel_id: "scientific-calculator",
  action_id: "active_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      active_context: { type: "object" },
    },
  },
  output_observation_schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "active_context", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const makeCalculatorPanelActionManifest = (
  capabilityId: typeof CALCULATOR_OPEN_PANEL_CAPABILITY | typeof CALCULATOR_FOCUS_PANEL_CAPABILITY,
  action: "open_panel" | "focus_panel",
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: capabilityId,
  label: action === "open_panel" ? "Scientific Calculator open panel" : "Scientific Calculator focus panel",
  description:
    "Requests a governed, non-mutating workstation UI action for the Scientific Calculator panel. It is a non-terminal action receipt and cannot answer the user.",
  panel_id: "scientific-calculator",
  action_id: action,
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "calculator", "panel_action", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
});

const calculatorOpenPanelManifest = makeCalculatorPanelActionManifest(
  CALCULATOR_OPEN_PANEL_CAPABILITY,
  "open_panel",
);
const calculatorFocusPanelManifest = makeCalculatorPanelActionManifest(
  CALCULATOR_FOCUS_PANEL_CAPABILITY,
  "focus_panel",
);

const calculatorShowGatewaySolveManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
  label: "Scientific Calculator show gateway solve",
  description:
    "Projects an already-observed calculator gateway solve into the Scientific Calculator panel as a governed, non-mutating UI action receipt. It cannot answer the user.",
  panel_id: "scientific-calculator",
  action_id: "show_gateway_solve",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression", "result"],
    properties: {
      expression: { type: "string" },
      normalized_expression: { type: "string" },
      result: { type: "string" },
      source_capability: { type: "string" },
      observation_ref: { type: "string" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "calculator", "gateway_projection", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const makeWorkstationPanelActionManifest = (
  capabilityId: typeof WORKSTATION_OPEN_PANEL_CAPABILITY | typeof WORKSTATION_FOCUS_PANEL_CAPABILITY,
  action: "open_panel" | "focus_panel",
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: capabilityId,
  label: action === "open_panel" ? "Workstation open panel" : "Workstation focus panel",
  description:
    "Requests a governed, non-mutating workstation UI action for a safe read/observe panel allowlist. It is a non-terminal action receipt and cannot answer the user.",
  panel_id: null,
  action_id: action,
  dynamic_panel_id_arg: "panel_id",
  allowed_panel_ids: [...SAFE_WORKSTATION_PANEL_ACTION_IDS],
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["panel_id"],
    properties: {
      panel_id: { type: "string" },
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "workstation_panel", "panel_action", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
});

const workstationOpenPanelManifest = makeWorkstationPanelActionManifest(
  WORKSTATION_OPEN_PANEL_CAPABILITY,
  "open_panel",
);
const workstationFocusPanelManifest = makeWorkstationPanelActionManifest(
  WORKSTATION_FOCUS_PANEL_CAPABILITY,
  "focus_panel",
);

const docsOpenDocManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: DOCS_OPEN_DOC_CAPABILITY,
  label: "Docs Viewer open document",
  description:
    "Requests a governed, non-mutating Docs Viewer UI action to open a safe docs/ path. It produces an action receipt only and cannot answer document content.",
  panel_id: "docs-viewer",
  action_id: "open_doc",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["path"],
    properties: {
      path: { type: "string" },
      anchor: { type: "string" },
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "docs_viewer", "open_doc", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const repoSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: REPO_SEARCH_CAPABILITY,
  label: "Repo search",
  description:
    "Searches bounded repository paths for current code or documentation evidence. It returns non-terminal evidence observations and cannot write files or run shell commands for the agent.",
  panel_id: "repo-evidence",
  action_id: "search",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      paths: { type: "array", items: { type: "string" } },
      max_hits: { type: "number" },
    },
  },
  output_observation_schema: REPO_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: REPO_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "repo_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const docsSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: DOCS_SEARCH_CAPABILITY,
  label: "Docs search",
  description:
    "Searches bounded workspace documentation paths for current document evidence. It returns non-terminal evidence observations and cannot open files, write files, or execute shell commands for the agent.",
  panel_id: "docs-viewer",
  action_id: "search_docs",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      paths: { type: "array", items: { type: "string" } },
      max_hits: { type: "number" },
    },
  },
  output_observation_schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "docs_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const internetSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: INTERNET_SEARCH_CAPABILITY,
  label: "Internet search",
  description:
    "Runs the existing Helix internet search retriever as bounded, read-only external web evidence. It returns observations only and cannot browse the UI, scrape hidden pages, mutate files, or answer by itself.",
  panel_id: "internet-search",
  action_id: "search_web",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      providers: { type: "array", items: { type: "string" } },
      domains: { type: "array", items: { type: "string" } },
      recency_days: { type: "number" },
      limit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "internet_search", "external_web_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const scholarlyResearchSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  label: "Scholarly research search",
  description:
    "Runs the existing Helix scholarly paper lookup as bounded, read-only research-paper evidence. It returns metadata/abstract observations only and cannot fetch hidden full text, mutate files, or answer by itself.",
  panel_id: "scholarly-research",
  action_id: "lookup_papers",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      mode: { type: "string" },
      providers: { type: "array", items: { type: "string" } },
      limit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  observation_schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "scholarly_research", "paper_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const civilizationBoundsReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  label: "Civilization Bounds reflect system bounds",
  description:
    "Reflects the prompt through the existing Civilization Bounds Roadmap as bounded, evidence-only situational context. It does not write files, run shell commands, authorize actions, or become a final answer.",
  panel_id: "civilization-bounds-roadmap",
  action_id: "reflect_system_bounds",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      scenario_id: { type: "string" },
      phase_id: { type: "string" },
      layer_mode: { type: "string" },
      selected_system_ids: { type: "array", items: { type: "string" } },
      selected_badge_ids: { type: "array", items: { type: "string" } },
      theory_reflection_ref: { type: "string" },
      ideology_reflection_ref: { type: "string" },
      include_bridge_context: { type: "boolean" },
      include_collaboration_bounds: { type: "boolean" },
      include_falsification_hooks: { type: "boolean" },
    },
  },
  output_observation_schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "civilization_bounds", "reflection", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const theoryContextReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
  label: "Theory Badge Graph reflect discussion context",
  description:
    "Reflects the prompt against the existing Theory Badge Graph as bounded, evidence-only context. It does not solve, mutate files, run shell commands, or become a final answer.",
  panel_id: "theory-badge-graph",
  action_id: "reflect_discussion_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      conversation_context: { type: "string" },
      mentioned_equations: { type: "array", items: { type: "string" } },
      mentioned_symbols: { type: "array", items: { type: "string" } },
      mentioned_domains: { type: "array", items: { type: "string" } },
      build_explanation_plan: { type: "boolean" },
      limit: { type: "number" },
    },
  },
  output_observation_schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "theory_badge_graph", "reflection", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const capabilities = new Map<string, HelixWorkstationCapabilityManifest>([
  [workspaceOsStatusManifest.capability_id, workspaceOsStatusManifest],
  [workstationActiveContextManifest.capability_id, workstationActiveContextManifest],
  [calculatorSolveExpressionManifest.capability_id, calculatorSolveExpressionManifest],
  [calculatorActiveContextManifest.capability_id, calculatorActiveContextManifest],
  [calculatorOpenPanelManifest.capability_id, calculatorOpenPanelManifest],
  [calculatorFocusPanelManifest.capability_id, calculatorFocusPanelManifest],
  [calculatorShowGatewaySolveManifest.capability_id, calculatorShowGatewaySolveManifest],
  [workstationOpenPanelManifest.capability_id, workstationOpenPanelManifest],
  [workstationFocusPanelManifest.capability_id, workstationFocusPanelManifest],
  [docsOpenDocManifest.capability_id, docsOpenDocManifest],
  [repoSearchManifest.capability_id, repoSearchManifest],
  [docsSearchManifest.capability_id, docsSearchManifest],
  [internetSearchManifest.capability_id, internetSearchManifest],
  [scholarlyResearchSearchManifest.capability_id, scholarlyResearchSearchManifest],
  [civilizationBoundsReflectionManifest.capability_id, civilizationBoundsReflectionManifest],
  [theoryContextReflectionManifest.capability_id, theoryContextReflectionManifest],
]);

export const listWorkstationGatewayCapabilities = (
  input: HelixWorkstationGatewayListInput = {},
): HelixWorkstationGatewayListResult => ({
  schema: WORKSTATION_GATEWAY_SCHEMA,
  manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
  agent_runtime: cleanString(input.agentRuntime, "codex"),
  mode: normalizeMode(input.mode),
  capabilities: Array.from(capabilities.values()),
  assistant_answer: false,
  raw_content_included: false,
});

export const callWorkstationGatewayCapability = async (
  input: HelixWorkstationGatewayCallInput,
): Promise<HelixWorkstationGatewayCallResult> => {
  const mode = normalizeMode(input.mode);
  const agentRuntime = cleanString(input.agentRuntime, "codex");
  const turnId = cleanString(input.turnId, `workstation-gateway:${Date.now()}`);
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.floor(input.iteration))
    : 0;
  const capabilityId = normalizeGatewayCapabilityId(cleanString(input.capabilityId));
  const manifest = capabilities.get(capabilityId);

  if (!manifest) {
    const admission = buildAdmission({
      capabilityId: capabilityId || "unknown",
      agentRuntime,
      permissionProfile: "observe",
      status: "blocked",
      reason: "capability_not_registered",
      blockedReason: "capability_not_registered",
    });
    const observation = {
      schema: "helix.workstation_tool_gateway.unknown_capability.v1",
      capability_id: capabilityId || "unknown",
      reason: "capability_not_registered",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: capabilityId || "unknown",
      panelId: "workstation-gateway",
      action: "call",
      status: "failed",
      summary: `Workstation gateway rejected unknown capability ${capabilityId || "unknown"}.`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: capabilityId || "unknown",
      agentRuntime,
      admission,
      observationPacket,
      error: "capability_not_registered",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: false,
      agent_runtime: agentRuntime,
      capability_id: capabilityId || "unknown",
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: "capability_not_registered",
    };
  }

  if (!modeAllowsManifest(mode, manifest)) {
    const blockedReason = `permission_profile_${mode}_does_not_allow_${manifest.permission_profile_required}`;
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "blocked",
      reason: "permission_profile_insufficient",
      blockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: "helix.workstation_tool_gateway.permission_blocked.v1",
      capability_key: manifest.capability_id,
      requested_mode: mode,
      required_permission_profile: manifest.permission_profile_required,
      status: "blocked",
      blocked_reason: blockedReason,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workstation-gateway",
      action: "permission_check",
      status: "blocked",
      summary: `Workstation gateway blocked ${manifest.capability_id}: ${blockedReason}.`,
      observation,
      missingRequirements: [{
        code: blockedReason,
        message: `Capability ${manifest.capability_id} requires ${manifest.permission_profile_required} permission.`,
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: blockedReason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: false,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: blockedReason,
    };
  }

  if (manifest.capability_id === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY) {
    const args = readArguments(input.arguments);
    const activeContext = readBoundedWorkspaceActiveContext(args.workspace_context ?? args.workspaceContext);
    const hasContext = Boolean(activeContext.active_panel || activeContext.open_panels.length > 0);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasContext ? "admitted" : "blocked",
      reason: hasContext ? "read_only_gateway_capability" : "workstation_active_context_missing",
      blockedReason: hasContext ? undefined : "workstation_active_context_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      status: hasContext ? "succeeded" : "blocked",
      blocked_reason: hasContext ? null : "workstation_active_context_missing",
      ...activeContext,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const summary = hasContext
      ? `Workstation active context observed active panel ${activeContext.active_panel ?? "unknown"} with ${activeContext.open_panels.length} open panel(s).`
      : "Workstation active context was requested but no bounded panel state was supplied.";
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workstation",
      action: "active_context",
      status: hasContext ? "succeeded" : "blocked",
      summary,
      observation,
      missingRequirements: hasContext ? [] : [{
        code: "workstation_active_context_missing",
        message: "Attach workspace context with active/open panel identity before asking about the current workstation layout.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasContext ? undefined : "workstation_active_context_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasContext,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasContext ? undefined : "workstation_active_context_missing",
    };
  }

  if (manifest.capability_id === HELIX_WORKSPACE_OS_STATUS_CAPABILITY) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const result = await executeWorkspaceOsStatusTool({
      thread_id: optionalString(args.thread_id),
      room_id: optionalString(args.room_id),
      capability_ids: readStringArray(args.capability_ids),
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workspace-os",
      action: "status",
      status: "succeeded",
      summary: `Workspace OS status returned ${result.observation.capability_count} capability record(s).`,
      observation: result.observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: result.observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression);
    const solved = solveSafeArithmeticExpression(expression);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: solved.ok ? "admitted" : "blocked",
      reason: solved.ok ? "read_only_gateway_capability" : "calculator_expression_blocked",
      blockedReason: solved.blocked_reason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      expression: expression || null,
      result: solved.result ?? null,
      status: solved.ok ? "succeeded" : "blocked",
      blocked_reason: solved.blocked_reason,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "solve_expression",
      status: solved.ok ? "succeeded" : "blocked",
      summary: solved.ok
        ? `Calculator evaluated ${expression} = ${solved.result}.`
        : `Calculator gateway blocked expression: ${solved.blocked_reason}.`,
      observation,
      missingRequirements: solved.ok ? [] : [{
        code: solved.blocked_reason ?? "calculator_expression_blocked",
        message: "Provide a simple arithmetic expression using numbers and arithmetic operators only.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: solved.ok ? undefined : solved.blocked_reason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: solved.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: solved.ok ? undefined : solved.blocked_reason,
    };
  }

  if (manifest.capability_id === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY) {
    const args = readArguments(input.arguments);
    const activeContext = readBoundedCalculatorActiveContext(args.active_context ?? args.activeContext);
    const hasContext = Boolean(
      activeContext.current_latex ||
      activeContext.last_result_text ||
      activeContext.last_normalized_expression ||
      activeContext.recent_debug_events.length > 0
    );
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasContext ? "admitted" : "blocked",
      reason: hasContext ? "read_only_gateway_capability" : "calculator_active_context_missing",
      blockedReason: hasContext ? undefined : "calculator_active_context_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "scientific-calculator",
      status: hasContext ? "succeeded" : "blocked",
      blocked_reason: hasContext ? null : "calculator_active_context_missing",
      ...activeContext,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const summary = hasContext
      ? `Calculator active context observed${activeContext.current_latex ? ` expression ${activeContext.current_latex}` : ""}${activeContext.last_result_text ? ` with result ${activeContext.last_result_text}` : ""}.`
      : "Calculator active context was requested but no bounded calculator state was supplied.";
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "active_context",
      status: hasContext ? "succeeded" : "blocked",
      summary,
      observation,
      missingRequirements: hasContext ? [] : [{
        code: "calculator_active_context_missing",
        message: "Focus the Scientific Calculator panel with an active expression or result before asking about the current calculation.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasContext ? undefined : "calculator_active_context_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasContext,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasContext ? undefined : "calculator_active_context_missing",
    };
  }

  if (
    manifest.capability_id === CALCULATOR_OPEN_PANEL_CAPABILITY ||
    manifest.capability_id === CALCULATOR_FOCUS_PANEL_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const action = manifest.capability_id === CALCULATOR_OPEN_PANEL_CAPABILITY ? "open_panel" : "focus_panel";
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "non_mutating_workstation_ui_action",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = {
      schema_version: "helix.workstation.action/v1",
      action,
      panel_id: "scientific-calculator",
    };
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: action,
      panel_id: "scientific-calculator",
      status: "succeeded",
      dispatch_status: "admitted",
      workstation_action: workstationAction,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action,
      status: "succeeded",
      summary: `Admitted non-mutating Scientific Calculator ${action.replace(/_/g, " ")} action.`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression);
    const resultText = cleanString(args.result);
    const normalizedExpression = cleanString(args.normalized_expression ?? args.normalizedExpression, expression);
    const hasSolveObservation = Boolean(expression && resultText);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasSolveObservation ? "admitted" : "blocked",
      reason: hasSolveObservation ? "non_mutating_workstation_ui_action" : "calculator_gateway_solve_observation_missing",
      blockedReason: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasSolveObservation
      ? {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "show_gateway_solve",
          args: {
            expression,
            normalized_expression: normalizedExpression,
            result: resultText,
            source_capability: cleanString(args.source_capability, CALCULATOR_SOLVE_EXPRESSION_CAPABILITY),
            observation_ref: cleanString(args.observation_ref, `${turnId}:${CALCULATOR_SOLVE_EXPRESSION_CAPABILITY}`),
          },
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: "show_gateway_solve",
      status: hasSolveObservation ? "succeeded" : "blocked",
      dispatch_status: hasSolveObservation ? "admitted" : "blocked",
      workstation_action: workstationAction,
      source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "show_gateway_solve",
      status: hasSolveObservation ? "succeeded" : "blocked",
      summary: hasSolveObservation
        ? `Admitted non-mutating Scientific Calculator gateway solve projection for ${expression} = ${resultText}.`
        : "Scientific Calculator gateway solve projection was blocked because no solve observation was supplied.",
      observation,
      missingRequirements: hasSolveObservation ? [] : [{
        code: "calculator_gateway_solve_observation_missing",
        message: "Provide an observed calculator expression and result from scientific-calculator.solve_expression.",
        repair_action: "run_required_tool",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasSolveObservation,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
    };
  }

  if (
    manifest.capability_id === WORKSTATION_OPEN_PANEL_CAPABILITY ||
    manifest.capability_id === WORKSTATION_FOCUS_PANEL_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const action = manifest.capability_id === WORKSTATION_OPEN_PANEL_CAPABILITY ? "open_panel" : "focus_panel";
    const panelId = readSafeWorkstationPanelId(args.panel_id ?? args.panelId ?? args.target_panel_id ?? args.targetPanelId);
    const hasPanel = Boolean(panelId);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPanel ? "admitted" : "blocked",
      reason: hasPanel ? "non_mutating_workstation_ui_action" : "workstation_panel_not_in_safe_allowlist",
      blockedReason: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasPanel
      ? {
          schema_version: "helix.workstation.action/v1",
          action,
          panel_id: panelId,
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: action,
      panel_id: panelId,
      status: hasPanel ? "succeeded" : "blocked",
      dispatch_status: hasPanel ? "admitted" : "blocked",
      workstation_action: workstationAction,
      allowed_panel_ids: [...SAFE_WORKSTATION_PANEL_ACTION_IDS],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: panelId ?? "workstation",
      action,
      status: hasPanel ? "succeeded" : "blocked",
      summary: hasPanel
        ? `Admitted non-mutating workstation ${action.replace(/_/g, " ")} action for ${panelId}.`
        : "Workstation panel action was blocked because the panel is not in the safe allowlist.",
      observation,
      missingRequirements: hasPanel ? [] : [{
        code: "workstation_panel_not_in_safe_allowlist",
        message: "Provide a safe read/observe workstation panel id.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasPanel,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
    };
  }

  if (manifest.capability_id === DOCS_OPEN_DOC_CAPABILITY) {
    const args = readArguments(input.arguments);
    const path = readDocsActionPath(args.path ?? args.doc_path ?? args.target);
    const anchor = readDocsActionAnchor(args.anchor);
    const hasPath = Boolean(path);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPath ? "admitted" : "blocked",
      reason: hasPath ? "non_mutating_workstation_ui_action" : "docs_open_doc_path_missing_or_unsafe",
      blockedReason: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasPath
      ? {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path,
            ...(anchor ? { anchor } : {}),
          },
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: "open_doc",
      panel_id: "docs-viewer",
      status: hasPath ? "succeeded" : "blocked",
      dispatch_status: hasPath ? "admitted" : "blocked",
      path,
      anchor,
      workstation_action: workstationAction,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "docs-viewer",
      action: "open_doc",
      status: hasPath ? "succeeded" : "blocked",
      summary: hasPath
        ? `Docs Viewer open document action admitted for ${path}.`
        : "Docs Viewer open document action was blocked because no safe docs path was supplied.",
      observation,
      missingRequirements: hasPath ? [] : [{
        code: "docs_open_doc_path_missing_or_unsafe",
        message: "Provide a relative docs/ path to open in the Docs Viewer.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasPath,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
    };
  }

  if (manifest.capability_id === REPO_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeRepoSearchQuery(args.query);
    const paths = readRepoSearchPaths(args.paths);
    const maxHits = readRepoSearchMaxHits(args.max_hits ?? args.maxHits);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9_./-]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "repo_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: REPO_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        query: query || null,
        paths,
        hits: [],
        hit_count: 0,
        truncated: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "repo-evidence",
        action: "search",
        status: "blocked",
        summary: `Repo search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific repo/code/documentation search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const result = await runRepoSearch({
      rawQuestion: query,
      terms: [query],
      paths,
      explicit: true,
      reason: "workstation_gateway_repo_search",
      mode: "explicit",
      intentDomain: "repo",
      topicTags: [],
    });
    const hits = result.hits.slice(0, maxHits).map(clipRepoSearchHit);
    const truncated = result.truncated || result.hits.length > hits.length;
    const evidence = formatRepoSearchEvidence(
      {
        ...result,
        hits,
        truncated,
      },
      {
        lane: "repo_search",
        query,
        sourceStage: "fallback_repo_search",
      },
    );
    const observation = {
      schema: REPO_SEARCH_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      query,
      terms: [query],
      paths,
      hits,
      hit_count: hits.length,
      file_paths: evidence.filePaths,
      evidence_observations: evidence.observations,
      truncated,
      error: result.error,
      search_backend: result.search_backend,
      search_backend_bin: result.search_backend_bin,
      search_backend_reason: result.search_backend_reason,
      status: result.error ? "failed" : "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "repo-evidence",
      action: "search",
      status: result.error ? "failed" : "succeeded",
      summary: result.error
        ? `Repo search failed with ${result.error}.`
        : `Repo search returned ${hits.length} evidence hit(s) for ${query}.`,
      observation,
      missingRequirements: result.error
        ? [{
            code: result.error,
            message: "Repo search could not complete; retry with a narrower query or available repo path.",
            repair_action: "repair",
          }]
        : [],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: result.error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: !result.error,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: result.error,
    };
  }

  if (manifest.capability_id === DOCS_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeRepoSearchQuery(args.query);
    const paths = readDocsSearchPaths(args.paths);
    const maxHits = readRepoSearchMaxHits(args.max_hits ?? args.maxHits);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9_./-]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "docs_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        query: query || null,
        paths,
        hits: [],
        hit_count: 0,
        truncated: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "docs-viewer",
        action: "search_docs",
        status: "blocked",
        summary: `Docs search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific documentation search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchTerms = buildDocsSearchTerms(query);
    const result = await runRepoSearch({
      rawQuestion: query,
      terms: searchTerms,
      paths,
      explicit: true,
      reason: "workstation_gateway_docs_search",
      mode: "explicit",
      intentDomain: "repo",
      topicTags: [],
    });
    const docsHits = mergeDocsSearchPathCandidates(result.hits, paths, query);
    const rankedHits = rankDocsSearchHits(docsHits, query);
    const hits = rankedHits.slice(0, maxHits).map(clipRepoSearchHit);
    const documentCandidates = buildDocsSearchDocumentCandidates(rankedHits, query, maxHits);
    const truncated = result.truncated || rankedHits.length > hits.length;
    const activeDocumentObservation = readBoundedDocsExcerpt(paths);
    const evidence = formatRepoSearchEvidence(
      {
        ...result,
        hits,
        truncated,
      },
      {
        lane: "repo_search",
        query,
        sourceStage: "fallback_repo_search",
      },
    );
    const observation = {
      schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      query,
      terms: searchTerms,
      paths,
      hits,
      hit_count: hits.length,
      document_candidates: documentCandidates,
      unique_document_count: documentCandidates.length,
      file_paths: evidence.filePaths,
      active_document_observation: activeDocumentObservation
        ? {
            schema: "helix.docs_active_document_observation.v1",
            path: activeDocumentObservation.path,
            excerpt: activeDocumentObservation.excerpt,
            excerpt_char_count: activeDocumentObservation.excerpt_char_count,
            truncated: activeDocumentObservation.truncated,
            observation_role: "evidence_not_assistant_answer",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }
        : null,
      evidence_observations: evidence.observations,
      truncated,
      error: result.error,
      search_backend: result.search_backend,
      search_backend_bin: result.search_backend_bin,
      search_backend_reason: result.search_backend_reason,
      status: result.error ? "failed" : "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "docs-viewer",
      action: "search_docs",
      status: result.error ? "failed" : "succeeded",
      summary: result.error
        ? `Docs search failed with ${result.error}.`
        : activeDocumentObservation
          ? `Docs search materialized a bounded active-document excerpt from ${activeDocumentObservation.path}.`
          : `Docs search returned ${documentCandidates.length} document candidate(s) and ${hits.length} evidence hit(s) for ${query}.`,
      observation,
      missingRequirements: result.error
        ? [{
            code: result.error,
            message: "Docs search could not complete; retry with a narrower query or available docs path.",
            repair_action: "repair",
          }]
        : [],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: result.error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: !result.error,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: result.error,
    };
  }

  if (manifest.capability_id === INTERNET_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeExternalSearchQuery(args.query ?? args.search_query ?? args.prompt);
    const providers = readInternetSearchProviders(args.providers);
    const domains = readInternetSearchDomains(args.domains);
    const recencyDays = readInternetSearchRecencyDays(args.recency_days ?? args.recencyDays);
    const limit = readExternalSearchLimit(args.limit ?? args.max_results ?? args.maxResults);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "internet_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        capability: manifest.capability_id,
        query: query || null,
        providers_considered: providers,
        providers_called: [],
        domains,
        recency_days: recencyDays,
        evidence_refs: [],
        results: [],
        missing_requirements: [blockedReason],
        selected_for_answer: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "internet-search",
        action: "search_web",
        status: "blocked",
        summary: `Internet search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific internet search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchObservation = await runInternetSearch({
      turnId,
      callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
      query,
      providers: providers.length ? providers : undefined,
      domains,
      recencyDays,
      limit,
    });
    const observation = {
      ...searchObservation,
      capability_key: manifest.capability_id,
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "internet-search",
      action: "search_web",
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      summary: searchObservation.selected_for_answer
        ? `Internet search returned ${searchObservation.results.length} result(s) for ${query}.`
        : `Internet search returned no usable results for ${query}.`,
      observation,
      missingRequirements: searchObservation.selected_for_answer
        ? []
        : searchObservation.missing_requirements.map((code) => ({
            code,
            message: "Internet search could not produce usable bounded evidence for this query.",
            repair_action: "repair" as const,
          })),
    });
    const error = searchObservation.selected_for_answer
      ? undefined
      : searchObservation.missing_requirements[0] ?? "no_internet_search_results_returned";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: searchObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeExternalSearchQuery(args.query ?? args.search_query ?? args.prompt ?? args.doi ?? args.arxiv_id);
    const providers = readScholarlyResearchProviders(args.providers);
    const scholarlyMode = readScholarlyResearchMode(args.mode);
    const limit = readExternalSearchLimit(args.limit ?? args.max_results ?? args.maxResults);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "scholarly_research_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        capability: manifest.capability_id,
        query: query || null,
        intent: scholarlyMode ?? "paper_search",
        providers_considered: providers,
        providers_called: [],
        evidence_refs: [],
        papers: [],
        missing_requirements: [blockedReason],
        selected_for_answer: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "scholarly-research",
        action: "lookup_papers",
        status: "blocked",
        summary: `Scholarly research gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific scholarly search query, DOI, or arXiv id.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchObservation = await runScholarlyResearchLookup({
      turnId,
      callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
      query,
      mode: scholarlyMode,
      providers: providers.length ? providers : undefined,
      limit,
    });
    const observation = {
      ...searchObservation,
      capability_key: manifest.capability_id,
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scholarly-research",
      action: "lookup_papers",
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      summary: searchObservation.selected_for_answer
        ? `Scholarly research lookup returned ${searchObservation.papers.length} paper(s) for ${query}.`
        : `Scholarly research lookup returned no usable papers for ${query}.`,
      observation,
      missingRequirements: searchObservation.selected_for_answer
        ? []
        : searchObservation.missing_requirements.map((code) => ({
            code,
            message: "Scholarly research lookup could not produce usable bounded paper evidence for this query.",
            repair_action: "repair" as const,
          })),
    });
    const error = searchObservation.selected_for_answer
      ? undefined
      : searchObservation.missing_requirements[0] ?? "no_scholarly_results_returned";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: searchObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const prompt = cleanString(args.prompt ?? args.query ?? args.text);
    const hasPrompt = Boolean(prompt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPrompt ? "admitted" : "blocked",
      reason: hasPrompt ? "read_only_gateway_capability" : "civilization_bounds_prompt_missing",
      blockedReason: hasPrompt ? undefined : "civilization_bounds_prompt_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    if (!hasPrompt) {
      const observation = {
        schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        status: "blocked",
        blocked_reason: "civilization_bounds_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "civilization-bounds-roadmap",
        action: "reflect_system_bounds",
        status: "blocked",
        summary: "Civilization Bounds reflection was blocked because no prompt was supplied.",
        observation,
        missingRequirements: [{
          code: "civilization_bounds_prompt_missing",
          message: "Provide a prompt or scenario context to reflect through Civilization Bounds.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: "civilization_bounds_prompt_missing",
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: "civilization_bounds_prompt_missing",
      };
    }

    const output = await runHelixAskCivilizationBoundsTool({
      prompt,
      scenarioId: optionalString(args.scenario_id ?? args.scenarioId) ?? undefined,
      phaseId: optionalString(args.phase_id ?? args.phaseId) ?? undefined,
      layerMode: readCivilizationLayerMode(args.layer_mode ?? args.layerMode),
      selectedSystemIds: readStringArray(args.selected_system_ids ?? args.selectedSystemIds),
      selectedBadgeIds: readStringArray(args.selected_badge_ids ?? args.selectedBadgeIds),
      theoryReflectionRef: optionalString(args.theory_reflection_ref ?? args.theoryReflectionRef) ?? undefined,
      ideologyReflectionRef: optionalString(args.ideology_reflection_ref ?? args.ideologyReflectionRef) ?? undefined,
      options: {
        includeBridgeContext: args.include_bridge_context === true || args.includeBridgeContext === true,
        includeCollaborationBounds:
          args.include_collaboration_bounds === true || args.includeCollaborationBounds === true,
        includeFalsificationHooks: args.include_falsification_hooks === true || args.includeFalsificationHooks === true,
      },
    });
    const roadmap = output.roadmap;
    const parameterScopeKinds = output.parameterScopes.map((scope) => scope.kind).slice(0, 12);
    const actionChannelKinds = output.actionChannels.map((channel) => channel.kind).slice(0, 12);
    const missingEvidence = (output.bridgeContext?.missingEvidence ?? [])
      .map((entry) => cleanString(entry))
      .filter(Boolean)
      .slice(0, 12);
    const observation = {
      schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "civilization-bounds-roadmap",
      action_id: "reflect_system_bounds",
      status: "succeeded",
      prompt,
      roadmap_id: roadmap.roadmapId,
      scenario_id: roadmap.scenarioId,
      parameter_scope_kinds: parameterScopeKinds,
      action_channel_kinds: actionChannelKinds,
      dependency_chain_count: output.dependencyChains.length,
      comparison_case_count: output.comparisonCases.length,
      hypothesis_claim_count: output.hypothesisClaims.length,
      missing_evidence: missingEvidence,
      bridge_context_included: Boolean(output.bridgeContext),
      procedural_scaffold_id: output.proceduralScaffold.scaffoldId,
      authority: roadmap.authority,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "civilization-bounds-roadmap",
      action: "reflect_system_bounds",
      status: "succeeded",
      summary: `Civilization Bounds reflection produced ${parameterScopeKinds.length} parameter scope(s), ${actionChannelKinds.length} action channel(s), and ${missingEvidence.length} missing-evidence hook(s).`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === THEORY_CONTEXT_REFLECTION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const prompt = cleanString(args.prompt ?? args.query ?? args.text);
    const conversationContext = optionalString(args.conversation_context ?? args.conversationContext);
    const limitRaw = Number(args.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 12) : undefined;
    const hasPrompt = Boolean(prompt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPrompt ? "admitted" : "blocked",
      reason: hasPrompt ? "read_only_gateway_capability" : "theory_reflection_prompt_missing",
      blockedReason: hasPrompt ? undefined : "theory_reflection_prompt_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    if (!hasPrompt) {
      const observation = {
        schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        status: "blocked",
        blocked_reason: "theory_reflection_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "theory-badge-graph",
        action: "reflect_discussion_context",
        status: "blocked",
        summary: "Theory Badge Graph reflection was blocked because no prompt was supplied.",
        observation,
        missingRequirements: [{
          code: "theory_reflection_prompt_missing",
          message: "Provide a prompt or discussion context to reflect against the Theory Badge Graph.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: "theory_reflection_prompt_missing",
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: "theory_reflection_prompt_missing",
      };
    }

    const receipt = runHelixTheoryContextReflectionTool({
      graph: buildNhm2TheoryBadgeGraphV1(),
      turnId,
      threadId: optionalString(args.thread_id ?? args.threadId),
      prompt,
      conversationContext,
      mentionedEquations: readStringArray(args.mentioned_equations ?? args.mentionedEquations),
      mentionedSymbols: readStringArray(args.mentioned_symbols ?? args.mentionedSymbols),
      mentionedDomains: readStringArray(args.mentioned_domains ?? args.mentionedDomains),
      limit,
      buildExplanationPlan: args.build_explanation_plan === true || args.buildExplanationPlan === true,
      panelSync: {
        requested: false,
        applied: false,
        openPanel: false,
        overlayMode: "none",
      },
    });
    const reflection = receipt.reflectionV1;
    const observation = {
      schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
      status: "succeeded",
      prompt,
      conversation_context_included: Boolean(conversationContext),
      reflection_id: reflection.reflectionId,
      summary: reflection.evidenceForAsk.summary,
      exact_badge_ids: reflection.overlay.exactBadgeIds.slice(0, 12),
      likely_badge_ids: reflection.overlay.likelyBadgeIds.slice(0, 12),
      highlighted_badge_ids: reflection.overlay.highlightedBadgeIds.slice(0, 12),
      claim_boundary_notes: reflection.evidenceForAsk.claimBoundaries.slice(0, 8),
      recommended_action_ids: receipt.recommendedNextActions.map((action) => action.actionId).slice(0, 12),
      recommended_actions_solve: receipt.recommendedNextActions.some((action) => action.solves === true),
      receipt_schema: receipt.schemaVersion,
      reflection_terminal_eligible: reflection.terminal_eligible,
      authority: receipt.authority,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "theory-badge-graph",
      action: "reflect_discussion_context",
      status: "succeeded",
      summary: `Theory Badge Graph reflection produced ${observation.exact_badge_ids.length} exact badge match(es), ${observation.likely_badge_ids.length} likely match(es), and ${observation.claim_boundary_notes.length} claim-boundary note(s).`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  throw new Error(`unhandled_workstation_gateway_capability:${manifest.capability_id}`);
};
