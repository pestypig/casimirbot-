import {
  HELIX_WORKSTATION_REASONING_TRACE_SCHEMA,
  type HelixWorkstationReasoningTrace,
} from "../helix-workstation-reasoning-trace";
import {
  validateAgentGoalSessionV1,
  type AgentGoalSessionV1,
} from "./workstation-goal-context.v1";

export const WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA =
  "helix.workstation_reasoning_trace_query_result.v1" as const;

export type WorkstationTraceMemoryTerminalAuthorityV1 = {
  status: "not_terminal";
  finalAnswerEligible: false;
  completedSolverPathRequired: true;
  terminalAuthoritySingleWriterRequired: true;
};

export type WorkstationTraceMemoryQueryResultV1 = {
  schema: typeof WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA;
  resultId: string;
  thread_id: string;
  trace_id: string | null;
  turn_id: string | null;
  traces: HelixWorkstationReasoningTrace[];
  selectedTrace: HelixWorkstationReasoningTrace | null;
  trace_count: number;
  goalId?: string | null;
  status: "read" | "blocked";
  missingRequirements: string[];
  policyEvidenceRefs: string[];
  goalSessionFound: boolean | null;
  feedAllowed: boolean;
  requiredActuator: "query_trace_memory";
  actuatorAllowed: boolean;
  agentGoalSession: unknown | null;
  goalContextUpdateId: string;
  terminalAuthority: WorkstationTraceMemoryTerminalAuthorityV1;
  post_tool_model_step_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const stringArrayIssues = (value: unknown, field: string, options: { requireNonEmpty?: boolean } = {}): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  if (options.requireNonEmpty && value.length === 0) issues.push(`${field} must include at least one reference`);
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) issues.push(`${field}[${index}] must be a non-empty string`);
  });
  return issues;
};

const traceIssues = (value: unknown, field: string): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return [`${field} must be an object`];
  if (value.schema !== HELIX_WORKSTATION_REASONING_TRACE_SCHEMA) {
    issues.push(`${field}.schema must be ${HELIX_WORKSTATION_REASONING_TRACE_SCHEMA}`);
  }
  if (!isNonEmptyString(value.trace_id)) issues.push(`${field}.trace_id must be a non-empty string`);
  if (!isNonEmptyString(value.thread_id)) issues.push(`${field}.thread_id must be a non-empty string`);
  if (!isNonEmptyString(value.turn_id)) issues.push(`${field}.turn_id must be a non-empty string`);
  issues.push(...stringArrayIssues(value.evidence_refs, `${field}.evidence_refs`));
  issues.push(...stringArrayIssues(value.tool_receipt_ids, `${field}.tool_receipt_ids`));
  issues.push(...stringArrayIssues(value.lifecycle_event_refs, `${field}.lifecycle_event_refs`));
  if (!Array.isArray(value.compact_steps)) issues.push(`${field}.compact_steps must be an array`);
  if (!Array.isArray(value.caveats)) issues.push(`${field}.caveats must be an array`);
  if (value.assistant_answer !== false) issues.push(`${field}.assistant_answer must be false`);
  if (value.raw_content_included !== false) issues.push(`${field}.raw_content_included must be false`);
  if (value.context_policy !== "compact_context_pack_only") {
    issues.push(`${field}.context_policy must be compact_context_pack_only`);
  }
  return issues;
};

const terminalAuthorityIssues = (value: unknown): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return ["terminalAuthority must be an object"];
  if (value.status !== "not_terminal") issues.push("terminalAuthority.status must be not_terminal");
  if (value.finalAnswerEligible !== false) issues.push("terminalAuthority.finalAnswerEligible must be false");
  if (value.completedSolverPathRequired !== true) {
    issues.push("terminalAuthority.completedSolverPathRequired must be true");
  }
  if (value.terminalAuthoritySingleWriterRequired !== true) {
    issues.push("terminalAuthority.terminalAuthoritySingleWriterRequired must be true");
  }
  return issues;
};

const goalSessionIssues = (
  value: unknown,
  field: string,
  expectedGoalId: string | null | undefined,
): string[] => {
  if (!isRecord(value)) return [`${field} must be an object`];
  const issues = validateAgentGoalSessionV1(value as AgentGoalSessionV1).map((issue) => `${field}.${issue}`);
  if (isNonEmptyString(expectedGoalId) && value.goalId !== expectedGoalId) {
    issues.push(`${field}.goalId must match goalId`);
  }
  return issues;
};

export function validateWorkstationTraceMemoryQueryResultV1(
  value: WorkstationTraceMemoryQueryResultV1,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["workstation trace memory query result must be an object"];
  if (value.schema !== WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA) {
    issues.push(`schema must be ${WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.resultId)) issues.push("resultId must be a non-empty string");
  if (!isNonEmptyString(value.thread_id)) issues.push("thread_id must be a non-empty string");
  if (value.trace_id != null && !isNonEmptyString(value.trace_id)) issues.push("trace_id must be a non-empty string or null");
  if (value.turn_id != null && !isNonEmptyString(value.turn_id)) issues.push("turn_id must be a non-empty string or null");
  if (!Array.isArray(value.traces)) {
    issues.push("traces must be an array");
  } else {
    value.traces.forEach((trace, index) => {
      for (const issue of traceIssues(trace, `traces[${index}]`)) issues.push(issue);
    });
  }
  if (value.selectedTrace != null) {
    issues.push(...traceIssues(value.selectedTrace, "selectedTrace"));
    if (Array.isArray(value.traces) && !value.traces.some((trace) => trace.trace_id === value.selectedTrace?.trace_id)) {
      issues.push("selectedTrace must be included in traces");
    }
  }
  if (!Number.isFinite(value.trace_count) || value.trace_count !== (Array.isArray(value.traces) ? value.traces.length : -1)) {
    issues.push("trace_count must match traces length");
  }
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.status !== "read" && value.status !== "blocked") issues.push("status must be read or blocked");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  if (value.status === "blocked" && Array.isArray(value.missingRequirements) && value.missingRequirements.length === 0) {
    issues.push("blocked trace memory query results must include missingRequirements");
  }
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("context_feed:trace_memory")) {
    issues.push("policyEvidenceRefs must include context feed policy ref");
  }
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("allowed_actuator:query_trace_memory")) {
    issues.push("policyEvidenceRefs must include actuator policy ref");
  }
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (typeof value.feedAllowed !== "boolean") issues.push("feedAllowed must be boolean");
  if (value.status === "read" && value.feedAllowed !== true) {
    issues.push("read trace memory query results must have feedAllowed=true");
  }
  if (value.requiredActuator !== "query_trace_memory") issues.push("requiredActuator must be query_trace_memory");
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  if (value.status === "read" && value.actuatorAllowed !== true) {
    issues.push("read trace memory query results must have actuatorAllowed=true");
  }
  if (value.goalSessionFound === true) {
    issues.push(...goalSessionIssues(value.agentGoalSession, "agentGoalSession", value.goalId));
  }
  if (!isNonEmptyString(value.goalContextUpdateId)) issues.push("goalContextUpdateId must be a non-empty string");
  issues.push(...terminalAuthorityIssues(value.terminalAuthority));
  if (value.post_tool_model_step_required !== true) issues.push("post_tool_model_step_required must be true");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  return issues;
}
