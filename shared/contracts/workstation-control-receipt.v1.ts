import {
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  validateAgentGoalSessionV1,
  type AgentGoalActuatorV1,
  type AgentGoalSessionV1,
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
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  producedRefs: string[];
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
  receipt: WorkstationControlReceiptV1,
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
    if (receipt.status === "blocked") {
      if (action.kind === receipt.controlKind) blockedMutationFound = true;
      if (receipt.controlKind === "set_loop_state" && (action.kind === "set_loop_state" || action.kind === "repair_loop")) {
        blockedMutationFound = true;
      }
      if (receipt.controlKind === "repair_source" && (action.kind === "set_loop_state" || action.kind === "repair_loop")) {
        blockedMutationFound = true;
      }
    }
  });
  if (!logReceiptFound) issues.push(`${field} must include a log_receipt action with receiptRef`);
  if (blockedMutationFound) issues.push(`${field} must not include mutating control dispatch while blocked`);
  if (receipt.status === "prepared" && !preparedControlDispatchFound(receipt, value)) {
    issues.push(`${field} must include prepared ${receipt.controlKind} dispatch`);
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
  const issues = validateAgentGoalSessionV1(value as AgentGoalSessionV1)
    .map((issue) => `${field}.${issue}`);
  if (isNonEmptyString(expectedGoalId) && value.goalId !== expectedGoalId) {
    issues.push(`${field}.goalId must match goalId`);
  }
  return issues;
};

const preparedControlFieldIssues = (value: WorkstationControlReceiptV1): string[] => {
  if (value.status !== "prepared") return [];
  switch (value.controlKind) {
    case "change_preset":
      return [
        ...(isNonEmptyString(value.targetRef) ? [] : ["prepared change_preset receipts must include targetRef"]),
        ...(isNonEmptyString(value.presetId) ? [] : ["prepared change_preset receipts must include presetId"]),
      ];
    case "bind_source":
      return [
        ...(isNonEmptyString(value.sourceRef) ? [] : ["prepared bind_source receipts must include sourceRef"]),
        ...(isNonEmptyString(value.targetRef) ? [] : ["prepared bind_source receipts must include targetRef"]),
      ];
    case "unbind_source":
      return isNonEmptyString(value.sourceRef) ? [] : ["prepared unbind_source receipts must include sourceRef"];
    case "set_loop_state":
      return [
        ...(isNonEmptyString(value.loopRef) ? [] : ["prepared set_loop_state receipts must include loopRef"]),
        ...(value.loopState === "paused" || value.loopState === "running" || value.loopState === "repaired"
          ? []
          : ["prepared set_loop_state receipts must include loopState"]),
      ];
    case "repair_source":
      return isNonEmptyString(value.loopRef) ? [] : ["prepared repair_source receipts must include loopRef"];
    case "update_live_answer":
      return isNonEmptyString(value.lineKey) ? [] : ["prepared update_live_answer receipts must include lineKey"];
    case "focus_process_graph":
      return isNonEmptyString(value.nodeRef) ? [] : ["prepared focus_process_graph receipts must include nodeRef"];
    default:
      return [];
  }
};

const fieldEquals = (left: unknown, right: unknown): boolean =>
  isNonEmptyString(left) && isNonEmptyString(right) && left === right;

const preparedControlDispatchFound = (
  receipt: WorkstationControlReceiptV1,
  actions: WorkstationDispatchActionV1[],
): boolean => {
  switch (receipt.controlKind) {
    case "change_preset":
      return actions.some((action) =>
        action.kind === "change_preset" &&
        fieldEquals(action.targetRef, receipt.targetRef) &&
        fieldEquals(action.presetId, receipt.presetId)
      );
    case "bind_source":
      return actions.some((action) =>
        action.kind === "bind_source" &&
        fieldEquals(action.sourceRef, receipt.sourceRef) &&
        fieldEquals(action.targetRef, receipt.targetRef)
      );
    case "unbind_source":
      return actions.some((action) =>
        action.kind === "unbind_source" &&
        fieldEquals(action.sourceRef, receipt.sourceRef)
      );
    case "set_loop_state":
      return actions.some((action) =>
        action.kind === "set_loop_state" &&
        fieldEquals(action.loopRef, receipt.loopRef) &&
        action.state === receipt.loopState
      );
    case "repair_source":
      return actions.some((action) =>
        action.kind === "set_loop_state" &&
        fieldEquals(action.loopRef, receipt.loopRef) &&
        action.state === "repaired"
      ) && actions.some((action) =>
        action.kind === "repair_loop" &&
        fieldEquals(action.loopRef, receipt.loopRef)
      );
    case "update_live_answer":
      return actions.some((action) =>
        action.kind === "update_live_answer" &&
        fieldEquals(action.lineKey, receipt.lineKey)
      );
    case "focus_process_graph":
      return actions.some((action) =>
        action.kind === "focus_process_graph" &&
        fieldEquals(action.nodeRef, receipt.nodeRef)
      );
    default:
      return false;
  }
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
  if (value.status === "prepared" && value.actuatorAllowed !== true) {
    issues.push("prepared receipts must have actuatorAllowed=true");
  }
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (
    Array.isArray(value.policyEvidenceRefs) &&
    agentGoalActuators.has(value.requiredActuator) &&
    !value.policyEvidenceRefs.includes(`allowed_actuator:${value.requiredActuator}`)
  ) {
    issues.push("policyEvidenceRefs must include required actuator policy ref");
  }
  if (value.goalSessionFound === true) {
    issues.push(...goalSessionIssues(value.agentGoalSession, "agentGoalSession", value.goalId));
  }
  issues.push(...stringArrayIssues(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.loopRefs, "loopRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.producedRefs, "producedRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes(`workstation_control:${value.controlKind}`)) {
    issues.push("loopRefs must include workstation control loop ref");
  }
  if (
    Array.isArray(value.loopRefs) &&
    agentGoalActuators.has(value.requiredActuator) &&
    !value.loopRefs.includes(`workstation_actuator:${value.requiredActuator}`)
  ) {
    issues.push("loopRefs must include required actuator loop ref");
  }
  if (Array.isArray(value.evidenceRefs)) {
    if (Array.isArray(value.policyEvidenceRefs)) {
      for (const ref of value.policyEvidenceRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every policyEvidenceRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.sourceRefs)) {
      for (const ref of value.sourceRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every sourceRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.loopRefs)) {
      for (const ref of value.loopRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every loopRefs entry");
          break;
        }
      }
    }
  }
  if (!isNonEmptyString(value.panelId)) issues.push("panelId must be a non-empty string");
  if (value.loopState != null && value.loopState !== "paused" && value.loopState !== "running" && value.loopState !== "repaired") {
    issues.push("loopState is invalid");
  }
  issues.push(...preparedControlFieldIssues(value));
  if (!isNonEmptyString(value.mailboxThreadId)) issues.push("mailboxThreadId must be a non-empty string");
  if (!isRecord(value.mailboxThreadResolution)) issues.push("mailboxThreadResolution must be an object");
  issues.push(...dispatchIssues(value.dispatch, "dispatch", value));
  issues.push(...dispatchIssues(value.suggestedDispatch, "suggestedDispatch", value));
  if (!isNonEmptyString(value.goalContextUpdateId)) issues.push("goalContextUpdateId must be a non-empty string");
  if (Array.isArray(value.evidenceRefs) && isNonEmptyString(value.receiptId) && !value.evidenceRefs.includes(value.receiptId)) {
    issues.push("evidenceRefs must include receiptId");
  }
  if (Array.isArray(value.producedRefs) && isNonEmptyString(value.receiptId) && !value.producedRefs.includes(value.receiptId)) {
    issues.push("producedRefs must include receiptId");
  }
  if (
    Array.isArray(value.producedRefs) &&
    isNonEmptyString(value.goalContextUpdateId) &&
    !value.producedRefs.includes(value.goalContextUpdateId)
  ) {
    issues.push("producedRefs must include goalContextUpdateId");
  }
  issues.push(...terminalAuthorityIssues(value.terminalAuthority));
  if (value.post_tool_model_step_required !== true) issues.push("post_tool_model_step_required must be true");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  return issues;
}
