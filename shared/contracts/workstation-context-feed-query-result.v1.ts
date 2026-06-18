import {
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS,
  validateWorkstationGoalContextUpdateV1,
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
  type WorkstationGoalContextUpdateV1,
} from "./workstation-goal-context.v1";

export const WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA =
  "stage_play_workstation_context_feed_query_result/v1" as const;

export type WorkstationContextFeedQueryResultV1 = {
  schema: typeof WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA;
  resultId: string;
  feedKind: AgentGoalContextFeedKindV1;
  label: string;
  mailboxThreadId: string;
  mailboxThreadResolution: unknown;
  sourceRef?: string | null;
  goalId?: string | null;
  status: "read" | "blocked";
  missingRequirements: string[];
  policyEvidenceRefs: string[];
  goalSessionFound: boolean | null;
  feedAllowed: boolean;
  requiredActuator: AgentGoalActuatorV1;
  actuatorAllowed: boolean;
  agentGoalSession: unknown | null;
  agentGoalSessions: unknown[];
  goalContextUpdates: WorkstationGoalContextUpdateV1[];
  authoritySummary: unknown;
  updateCount: number;
  syncedWindow: {
    mailItemCount: number;
    processedPacketCount: number;
    microReasonerRunCount: number;
  };
  goalContextUpdateId: string;
  post_tool_model_step_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

const feedKinds = new Set<string>(WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS);
const actuators = new Set<string>(WORKSTATION_AGENT_GOAL_ACTUATORS);

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

const authoritySummaryIssues = (value: unknown): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return ["authoritySummary must be an object"];
  if (value.assistant_answer !== false) issues.push("authoritySummary.assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("authoritySummary.terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("authoritySummary.raw_content_included must be false");
  if (value.post_tool_model_step_required !== true) {
    issues.push("authoritySummary.post_tool_model_step_required must be true");
  }
  if (value.answerAuthority !== "completed_solver_path_required") {
    issues.push("authoritySummary.answerAuthority must require completed solver path");
  }
  return issues;
};

export function validateWorkstationContextFeedQueryResultV1(
  value: WorkstationContextFeedQueryResultV1,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["workstation context feed query result must be an object"];
  if (value.schema !== WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA) {
    issues.push(`schema must be ${WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.resultId)) issues.push("resultId must be a non-empty string");
  if (!feedKinds.has(value.feedKind)) issues.push("feedKind is invalid");
  if (!isNonEmptyString(value.label)) issues.push("label must be a non-empty string");
  if (!isNonEmptyString(value.mailboxThreadId)) issues.push("mailboxThreadId must be a non-empty string");
  if (!isRecord(value.mailboxThreadResolution)) issues.push("mailboxThreadResolution must be an object");
  if (value.sourceRef != null && !isNonEmptyString(value.sourceRef)) issues.push("sourceRef must be a non-empty string or null");
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.status !== "read" && value.status !== "blocked") issues.push("status must be read or blocked");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  if (value.status === "blocked" && Array.isArray(value.missingRequirements) && value.missingRequirements.length === 0) {
    issues.push("blocked feed query results must include missingRequirements");
  }
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (typeof value.feedAllowed !== "boolean") issues.push("feedAllowed must be boolean");
  if (!actuators.has(value.requiredActuator)) issues.push("requiredActuator is invalid");
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  if (!Array.isArray(value.agentGoalSessions)) issues.push("agentGoalSessions must be an array");
  if (!Array.isArray(value.goalContextUpdates)) {
    issues.push("goalContextUpdates must be an array");
  } else {
    value.goalContextUpdates.forEach((update, index) => {
      for (const issue of validateWorkstationGoalContextUpdateV1(update)) {
        issues.push(`goalContextUpdates[${index}].${issue}`);
      }
    });
  }
  issues.push(...authoritySummaryIssues(value.authoritySummary));
  if (!Number.isFinite(value.updateCount) || value.updateCount !== (Array.isArray(value.goalContextUpdates) ? value.goalContextUpdates.length : -1)) {
    issues.push("updateCount must match goalContextUpdates length");
  }
  if (!isRecord(value.syncedWindow)) {
    issues.push("syncedWindow must be an object");
  } else {
    for (const field of ["mailItemCount", "processedPacketCount", "microReasonerRunCount"] as const) {
      if (!Number.isFinite(value.syncedWindow[field])) issues.push(`syncedWindow.${field} must be numeric`);
    }
  }
  if (!isNonEmptyString(value.goalContextUpdateId)) issues.push("goalContextUpdateId must be a non-empty string");
  if (value.post_tool_model_step_required !== true) issues.push("post_tool_model_step_required must be true");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  return issues;
}
