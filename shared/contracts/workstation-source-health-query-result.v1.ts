import {
  HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA,
  type HelixSituationSourceCapability,
} from "../helix-situation-source-capability";
import {
  validateAgentGoalSessionV1,
  type AgentGoalSessionV1,
} from "./workstation-goal-context.v1";

export const WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA =
  "helix.situation_source_capability_read.v1" as const;

export type WorkstationSourceHealthTerminalAuthorityV1 = {
  status: "not_terminal";
  finalAnswerEligible: false;
  completedSolverPathRequired: true;
  terminalAuthoritySingleWriterRequired: true;
};

export type WorkstationSourceHealthQueryResultV1 = {
  schema: typeof WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA;
  resultId: string;
  thread_id: string;
  room_id?: string | null;
  capabilities: HelixSituationSourceCapability[];
  capabilityCount: number;
  goalId?: string | null;
  status: "read" | "blocked";
  missingRequirements: string[];
  policyEvidenceRefs: string[];
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  freshnessStatus: "fresh" | "stale" | "blocked" | "unknown";
  goalSessionFound: boolean | null;
  feedAllowed: boolean;
  requiredActuator: "query_source_health";
  actuatorAllowed: boolean;
  agentGoalSession: unknown | null;
  goalContextUpdateId: string;
  terminalAuthority: WorkstationSourceHealthTerminalAuthorityV1;
  post_tool_model_step_required: true;
  terminal_eligible: false;
  raw_content_included: false;
  assistant_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  context_policy: "compact_context_pack_only";
};

const modalities = new Set([
  "world_event",
  "environment_state",
  "environment_affordance",
  "visual_frame",
  "audio_transcript",
  "voice_identity",
  "text_chat",
  "calculator_stream",
  "simulation_stream",
  "procedure_graph",
  "document_context",
  "note_context",
]);

const statuses = new Set([
  "active",
  "waiting_for_client",
  "permission_required",
  "configured_missing",
  "stale",
  "error",
  "paused",
  "stopped",
]);

const contributions = new Set([
  "place",
  "activity",
  "risk",
  "dialogue",
  "visual_scene",
  "identity",
  "calculation",
  "reference",
  "memory",
  "actor_state",
  "inventory",
  "object_state",
  "affordance",
  "procedure",
  "simulation",
  "recommendation",
]);

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

const capabilityIssues = (value: unknown, field: string): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return [`${field} must be an object`];
  if (value.schema !== HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA) {
    issues.push(`${field}.schema must be ${HELIX_SITUATION_SOURCE_CAPABILITY_SCHEMA}`);
  }
  if (!isNonEmptyString(value.source_id)) issues.push(`${field}.source_id must be a non-empty string`);
  if (!isNonEmptyString(value.thread_id)) issues.push(`${field}.thread_id must be a non-empty string`);
  if (value.room_id != null && !isNonEmptyString(value.room_id)) issues.push(`${field}.room_id must be a non-empty string or null`);
  if (value.participant_id != null && !isNonEmptyString(value.participant_id)) {
    issues.push(`${field}.participant_id must be a non-empty string or null`);
  }
  if (!modalities.has(String(value.modality))) issues.push(`${field}.modality is invalid`);
  if (!statuses.has(String(value.status))) issues.push(`${field}.status is invalid`);
  if (!contributions.has(String(value.contribution))) issues.push(`${field}.contribution is invalid`);
  if (!Number.isFinite(value.fidelity_score) || Number(value.fidelity_score) < 0 || Number(value.fidelity_score) > 1) {
    issues.push(`${field}.fidelity_score must be between 0 and 1`);
  }
  if (value.last_event_ts != null && !isNonEmptyString(value.last_event_ts)) {
    issues.push(`${field}.last_event_ts must be a non-empty string or null`);
  }
  if (value.missing_reason != null && !isNonEmptyString(value.missing_reason)) {
    issues.push(`${field}.missing_reason must be a non-empty string or null`);
  }
  if (value.next_required_action != null && !isNonEmptyString(value.next_required_action)) {
    issues.push(`${field}.next_required_action must be a non-empty string or null`);
  }
  if (value.raw_content_included !== false) issues.push(`${field}.raw_content_included must be false`);
  if (value.assistant_answer !== false) issues.push(`${field}.assistant_answer must be false`);
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
  const issues = validateAgentGoalSessionV1(value as AgentGoalSessionV1)
    .map((issue) => `${field}.${issue}`);
  if (isNonEmptyString(expectedGoalId) && value.goalId !== expectedGoalId) {
    issues.push(`${field}.goalId must match goalId`);
  }
  return issues;
};

export function validateWorkstationSourceHealthQueryResultV1(
  value: WorkstationSourceHealthQueryResultV1,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["workstation source health query result must be an object"];
  if (value.schema !== WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA) {
    issues.push(`schema must be ${WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.resultId)) issues.push("resultId must be a non-empty string");
  if (!isNonEmptyString(value.thread_id)) issues.push("thread_id must be a non-empty string");
  if (value.room_id != null && !isNonEmptyString(value.room_id)) issues.push("room_id must be a non-empty string or null");
  if (!Array.isArray(value.capabilities)) {
    issues.push("capabilities must be an array");
  } else {
    value.capabilities.forEach((capability, index) => {
      for (const issue of capabilityIssues(capability, `capabilities[${index}]`)) issues.push(issue);
    });
  }
  if (!Number.isFinite(value.capabilityCount) || value.capabilityCount !== (Array.isArray(value.capabilities) ? value.capabilities.length : -1)) {
    issues.push("capabilityCount must match capabilities length");
  }
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.status !== "read" && value.status !== "blocked") issues.push("status must be read or blocked");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  if (value.status === "blocked" && Array.isArray(value.missingRequirements) && value.missingRequirements.length === 0) {
    issues.push("blocked source health query results must include missingRequirements");
  }
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("context_feed:source_health")) {
    issues.push("policyEvidenceRefs must include context feed policy ref");
  }
  issues.push(...stringArrayIssues(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.loopRefs, "loopRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("workstation_context_feed:source_health")) {
    issues.push("loopRefs must include source-health context feed loop ref");
  }
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("workstation_actuator:query_source_health")) {
    issues.push("loopRefs must include source-health actuator loop ref");
  }
  if (Array.isArray(value.evidenceRefs)) {
    if (!value.evidenceRefs.includes(value.resultId)) issues.push("evidenceRefs must include resultId");
    if (Array.isArray(value.policyEvidenceRefs)) {
      for (const ref of value.policyEvidenceRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every policyEvidenceRefs entry");
          break;
        }
      }
    }
  }
  if (!["fresh", "stale", "blocked", "unknown"].includes(String(value.freshnessStatus))) {
    issues.push("freshnessStatus is invalid");
  }
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (typeof value.feedAllowed !== "boolean") issues.push("feedAllowed must be boolean");
  if (value.requiredActuator !== "query_source_health") issues.push("requiredActuator must be query_source_health");
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("allowed_actuator:query_source_health")) {
    issues.push("policyEvidenceRefs must include actuator policy ref");
  }
  if (value.status === "read" && value.feedAllowed !== true) {
    issues.push("read source health query results must have feedAllowed=true");
  }
  if (value.status === "read" && value.actuatorAllowed !== true) {
    issues.push("read source health query results must have actuatorAllowed=true");
  }
  if (value.goalSessionFound === true) {
    issues.push(...goalSessionIssues(value.agentGoalSession, "agentGoalSession", value.goalId));
  }
  if (!isNonEmptyString(value.goalContextUpdateId)) issues.push("goalContextUpdateId must be a non-empty string");
  issues.push(...terminalAuthorityIssues(value.terminalAuthority));
  if (value.post_tool_model_step_required !== true) issues.push("post_tool_model_step_required must be true");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  if (value.context_policy !== "compact_context_pack_only") issues.push("context_policy must be compact_context_pack_only");
  return issues;
}
