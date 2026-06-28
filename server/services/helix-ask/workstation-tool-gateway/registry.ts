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
import { buildWorkstationGatewayObservationPacket } from "./observation-packet";
import {
  HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
  HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
} from "@shared/helix-tool-lifecycle";
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
const WORKSTATION_GATEWAY_MANIFEST_VERSION = "read-observe.v1" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_SOLVE_OBSERVATION_SCHEMA = "helix.calculator_solve_observation.v1" as const;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const REPO_SEARCH_OBSERVATION_SCHEMA = "helix.repo_search_observation.v1" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_SEARCH_OBSERVATION_SCHEMA = "helix.docs_search_observation.v1" as const;
const REPO_SEARCH_DEFAULT_PATHS = ["server", "shared", "client/src", "docs"] as const;
const DOCS_SEARCH_DEFAULT_PATHS = ["docs"] as const;
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

const normalizeMode = (value: unknown): HelixWorkstationGatewayMode => {
  const mode = cleanString(value, DEFAULT_MODE).toLowerCase();
  if (mode === "read" || mode === "observe" || mode === "act" || mode === "verify") return mode;
  return DEFAULT_MODE;
};

const readArguments = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

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
  mode: "observe_only",
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
  observation_schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "diagnostic_only", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorSolveExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator solve expression",
  description:
    "Evaluates a simple arithmetic expression as read-only calculator evidence. It does not run shell code, mutate files, or become a final answer.",
  mode: "read_only",
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
  observation_schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const repoSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: REPO_SEARCH_CAPABILITY,
  label: "Repo search",
  description:
    "Searches bounded repository paths for current code or documentation evidence. It returns non-terminal evidence observations and cannot write files or run shell commands for the agent.",
  mode: "read_only",
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
  mode: "read_only",
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
  observation_schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "docs_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const capabilities = new Map<string, HelixWorkstationCapabilityManifest>([
  [workspaceOsStatusManifest.capability_id, workspaceOsStatusManifest],
  [calculatorSolveExpressionManifest.capability_id, calculatorSolveExpressionManifest],
  [repoSearchManifest.capability_id, repoSearchManifest],
  [docsSearchManifest.capability_id, docsSearchManifest],
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
  const capabilityId = cleanString(input.capabilityId);
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

    const result = await runRepoSearch({
      rawQuestion: query,
      terms: [query],
      paths,
      explicit: true,
      reason: "workstation_gateway_docs_search",
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
      schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
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
        : `Docs search returned ${hits.length} evidence hit(s) for ${query}.`,
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

  throw new Error(`unhandled_workstation_gateway_capability:${manifest.capability_id}`);
};
