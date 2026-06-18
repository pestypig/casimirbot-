import {
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  type AgentGoalActuatorV1,
  type WorkstationDispatchActionV1,
} from "./workstation-goal-context.v1";

export const WORKSTATION_CONTROL_RECEIPT_SCHEMA = "stage_play_workstation_control_receipt/v1" as const;

export type WorkstationControlReceiptKindV1 =
  | "change_preset"
  | "bind_source"
  | "unbind_source"
  | "set_loop_state"
  | "repair_source"
  | "update_live_answer"
  | "focus_process_graph";

export type WorkstationControlReceiptTerminalAuthorityV1 = {
  status: "not_terminal";
  finalAnswerEligible: false;
  completedSolverPathRequired: true;
  terminalAuthoritySingleWriterRequired: true;
};

export type WorkstationControlReceiptV1 = {
  schema: typeof WORKSTATION_CONTROL_RECEIPT_SCHEMA;
  receiptId: string;
  controlKind: WorkstationControlReceiptKindV1;
  label: string;
  ok: boolean;
  status: "prepared" | "blocked";
  missingRequirements: string[];
  goalId?: string | null;
  goalSessionFound: boolean | null;
  requiredActuator: AgentGoalActuatorV1;
  actuatorAllowed: boolean;
  policyEvidenceRefs: string[];
  agentGoalSession: unknown | null;
  targetRef?: string | null;
  sourceRef?: string | null;
  presetId?: string | null;
  loopRef?: string | null;
  lineKey?: string | null;
  panelId: string;
  nodeRef?: string | null;
  loopState?: "paused" | "running" | "repaired" | null;
  reason?: string | null;
  mailboxThreadId: string;
  mailboxThreadResolution: unknown;
  dispatch: WorkstationDispatchActionV1[];
  suggestedDispatch: WorkstationDispatchActionV1[];
  goalContextUpdateId: string;
  terminalAuthority: WorkstationControlReceiptTerminalAuthorityV1;
  post_tool_model_step_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

export const WORKSTATION_CONTROL_RECEIPT_KINDS: readonly WorkstationControlReceiptKindV1[] = [
  "change_preset",
  "bind_source",
  "unbind_source",
  "set_loop_state",
  "repair_source",
  "update_live_answer",
  "focus_process_graph",
];

const controlKinds = new Set<string>(WORKSTATION_CONTROL_RECEIPT_KINDS);
const agentGoalActuators = new Set<string>(WORKSTATION_AGENT_GOAL_ACTUATORS);

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

const dispatchIssues = (
  value: unknown,
  field: string,
  controlKind: unknown,
  status: unknown,
): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  let logReceiptFound = false;
  let blockedMutationFound = false;
  value.forEach((action, index) => {
    if (!isRecord(action)) {
      issues.push(`${field}[${index}] must be an object`);
      return;
    }
    if (!isNonEmptyString(action.kind)) {
      issues.push(`${field}[${index}].kind must be a non-empty string`);
      return;
    }
    if (action.kind === "log_receipt" && isNonEmptyString(action.receiptRef)) {
      logReceiptFound = true;
    }
    if (status === "blocked") {
      if (action.kind === controlKind) blockedMutationFound = true;
      if (controlKind === "set_loop_state" && (action.kind === "set_loop_state" || action.kind === "repair_loop")) {
        blockedMutationFound = true;
      }
      if (controlKind === "repair_source" && (action.kind === "set_loop_state" || action.kind === "repair_loop")) {
        blockedMutationFound = true;
      }
    }
  });
  if (!logReceiptFound) issues.push(`${field} must include a log_receipt action with receiptRef`);
  if (blockedMutationFound) issues.push(`${field} must not include mutating control dispatch while blocked`);
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

export function validateWorkstationControlReceiptV1(value: WorkstationControlReceiptV1): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["workstation control receipt must be an object"];
  if (value.schema !== WORKSTATION_CONTROL_RECEIPT_SCHEMA) {
    issues.push(`schema must be ${WORKSTATION_CONTROL_RECEIPT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.receiptId)) issues.push("receiptId must be a non-empty string");
  if (!controlKinds.has(value.controlKind)) issues.push("controlKind is invalid");
  if (!isNonEmptyString(value.label)) issues.push("label must be a non-empty string");
  if (typeof value.ok !== "boolean") issues.push("ok must be boolean");
  if (value.status !== "prepared" && value.status !== "blocked") issues.push("status must be prepared or blocked");
  if (value.status === "prepared" && value.ok !== true) issues.push("prepared receipts must have ok=true");
  if (value.status === "blocked" && value.ok !== false) issues.push("blocked receipts must have ok=false");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  if (value.status === "blocked" && Array.isArray(value.missingRequirements) && value.missingRequirements.length === 0) {
    issues.push("blocked receipts must include missingRequirements");
  }
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (!agentGoalActuators.has(value.requiredActuator)) issues.push("requiredActuator is invalid");
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (!isNonEmptyString(value.panelId)) issues.push("panelId must be a non-empty string");
  if (value.loopState != null && value.loopState !== "paused" && value.loopState !== "running" && value.loopState !== "repaired") {
    issues.push("loopState is invalid");
  }
  if (!isNonEmptyString(value.mailboxThreadId)) issues.push("mailboxThreadId must be a non-empty string");
  if (!isRecord(value.mailboxThreadResolution)) issues.push("mailboxThreadResolution must be an object");
  issues.push(...dispatchIssues(value.dispatch, "dispatch", value.controlKind, value.status));
  issues.push(...dispatchIssues(value.suggestedDispatch, "suggestedDispatch", value.controlKind, value.status));
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
