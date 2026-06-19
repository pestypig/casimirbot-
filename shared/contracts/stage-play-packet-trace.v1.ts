import {
  validateAgentGoalSessionV1,
  type AgentGoalSessionV1,
} from "./workstation-goal-context.v1";

export const STAGE_PLAY_PACKET_TRACE_SCHEMA = "helix.stage_play.packet_trace.v1" as const;
export const STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA = "stage_play_packet_trace_query_result/v1" as const;

export type StagePlayPacketTraceTerminalAuthorityV1 = {
  status: "not_terminal";
  finalAnswerEligible: false;
  completedSolverPathRequired: true;
  terminalAuthoritySingleWriterRequired: true;
};

export type StagePlayPacketTraceV1 = {
  schema: typeof STAGE_PLAY_PACKET_TRACE_SCHEMA;
  packetId: string;
  sourceId: string;
  jobId: string;
  mailIds: string[];
  microReasonerRunRefs: string[];
  recommendedNext: string;
  resolutionState: string;
  salienceLevel: string;
  causalTrace: unknown;
  decisionRefs: string[];
  wakeRequestRefs: string[];
  wakeResultRefs: string[];
  goalContextUpdateRefs: string[];
  evidenceRefs: string[];
  terminalAuthority: StagePlayPacketTraceTerminalAuthorityV1;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type StagePlayPacketTraceQueryResultV1 = {
  schema: typeof STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA;
  resultId: string;
  mailboxThreadId: string;
  sourceRef?: string | null;
  goalId?: string | null;
  packetId?: string | null;
  status: "read" | "blocked";
  missingRequirements: string[];
  policyEvidenceRefs: string[];
  goalSessionFound: boolean | null;
  feedAllowed: boolean;
  requiredFeed: "packet_traces";
  requiredActuator: "query_packet_traces";
  actuatorAllowed: boolean;
  agentGoalSession: unknown | null;
  packetTraces: StagePlayPacketTraceV1[];
  goalContextUpdates: unknown[];
  authoritySummary: unknown;
  traceCount: number;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const stringArrayIssues = (value: unknown, field: string, requireNonEmpty = false): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  if (requireNonEmpty && value.length === 0) issues.push(`${field} must include at least one reference`);
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) issues.push(`${field}[${index}] must be a non-empty string`);
  });
  return issues;
};

const validateTerminalAuthority = (
  value: unknown,
  prefix = "terminalAuthority",
): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return [`${prefix} must be an object`];
  if (value.status !== "not_terminal") issues.push(`${prefix}.status must be not_terminal`);
  if (value.finalAnswerEligible !== false) issues.push(`${prefix}.finalAnswerEligible must be false`);
  if (value.completedSolverPathRequired !== true) issues.push(`${prefix}.completedSolverPathRequired must be true`);
  if (value.terminalAuthoritySingleWriterRequired !== true) {
    issues.push(`${prefix}.terminalAuthoritySingleWriterRequired must be true`);
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

export function validateStagePlayPacketTraceV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["packet trace must be an object"];
  if (value.schema !== STAGE_PLAY_PACKET_TRACE_SCHEMA) issues.push(`schema must be ${STAGE_PLAY_PACKET_TRACE_SCHEMA}`);
  if (!isNonEmptyString(value.packetId)) issues.push("packetId must be a non-empty string");
  if (!isNonEmptyString(value.sourceId)) issues.push("sourceId must be a non-empty string");
  if (!isNonEmptyString(value.jobId)) issues.push("jobId must be a non-empty string");
  issues.push(...stringArrayIssues(value.mailIds, "mailIds", true));
  issues.push(...stringArrayIssues(value.microReasonerRunRefs, "microReasonerRunRefs"));
  if (!isNonEmptyString(value.recommendedNext)) issues.push("recommendedNext must be a non-empty string");
  if (!isNonEmptyString(value.resolutionState)) issues.push("resolutionState must be a non-empty string");
  if (!isNonEmptyString(value.salienceLevel)) issues.push("salienceLevel must be a non-empty string");
  if (!isRecord(value.causalTrace)) issues.push("causalTrace must be an object");
  issues.push(...stringArrayIssues(value.decisionRefs, "decisionRefs"));
  issues.push(...stringArrayIssues(value.wakeRequestRefs, "wakeRequestRefs"));
  issues.push(...stringArrayIssues(value.wakeResultRefs, "wakeResultRefs"));
  issues.push(...stringArrayIssues(value.goalContextUpdateRefs, "goalContextUpdateRefs"));
  issues.push(...stringArrayIssues(value.evidenceRefs, "evidenceRefs", true));
  issues.push(...validateTerminalAuthority(value.terminalAuthority));
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  return issues;
}

export function validateStagePlayPacketTraceQueryResultV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["packet trace query result must be an object"];
  if (value.schema !== STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA) {
    issues.push(`schema must be ${STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.resultId)) issues.push("resultId must be a non-empty string");
  if (!isNonEmptyString(value.mailboxThreadId)) issues.push("mailboxThreadId must be a non-empty string");
  if (value.sourceRef != null && !isNonEmptyString(value.sourceRef)) issues.push("sourceRef must be a non-empty string or null");
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.packetId != null && !isNonEmptyString(value.packetId)) issues.push("packetId must be a non-empty string or null");
  if (value.status !== "read" && value.status !== "blocked") issues.push("status must be read or blocked");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", true));
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("context_feed:packet_traces")) {
    issues.push("policyEvidenceRefs must include packet trace context feed policy ref");
  }
  if (Array.isArray(value.policyEvidenceRefs) && !value.policyEvidenceRefs.includes("allowed_actuator:query_packet_traces")) {
    issues.push("policyEvidenceRefs must include packet trace actuator policy ref");
  }
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (typeof value.feedAllowed !== "boolean") issues.push("feedAllowed must be boolean");
  if (value.status === "read" && value.feedAllowed !== true) {
    issues.push("read packet trace query results must have feedAllowed=true");
  }
  if (value.requiredFeed !== "packet_traces") issues.push("requiredFeed must be packet_traces");
  if (value.requiredActuator !== "query_packet_traces") issues.push("requiredActuator must be query_packet_traces");
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  if (value.status === "read" && value.actuatorAllowed !== true) {
    issues.push("read packet trace query results must have actuatorAllowed=true");
  }
  if (value.goalSessionFound === true) {
    issues.push(...goalSessionIssues(value.agentGoalSession, "agentGoalSession", value.goalId as string | null | undefined));
  }
  if (!Array.isArray(value.packetTraces)) {
    issues.push("packetTraces must be an array");
  } else {
    value.packetTraces.forEach((trace, index) => {
      for (const issue of validateStagePlayPacketTraceV1(trace)) {
        issues.push(`packetTraces[${index}].${issue}`);
      }
    });
  }
  if (!Array.isArray(value.goalContextUpdates)) issues.push("goalContextUpdates must be an array");
  if (!Number.isFinite(value.traceCount) || value.traceCount !== (Array.isArray(value.packetTraces) ? value.packetTraces.length : -1)) {
    issues.push("traceCount must match packetTraces length");
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
