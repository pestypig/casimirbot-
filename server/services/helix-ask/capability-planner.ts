import {
  HELIX_CAPABILITY_PLAN_SCHEMA,
  type HelixCapabilityAdmissionStatus,
  type HelixCapabilityFamily,
  type HelixCapabilityPlan,
} from "@shared/helix-capability-plan";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const commandVerbPattern = /\b(?:click|press|tap|open|close|start|stop|set|change|update|run|repair|attach|select|choose|submit)\b/i;
const contextualCommandPattern =
  /\b(?:before|after|if|when|why|did|last|previous|haven'?t|not\s+yet|without)\b[\s\S]{0,80}\b(?:click|press|tap|open|start|set|change|update|run|repair|attach)\b/i;

const hasOperatorCommand = (promptText: string): boolean => {
  const prompt = promptText.trim();
  if (!commandVerbPattern.test(prompt)) return false;
  if (contextualCommandPattern.test(prompt)) return false;
  return /^(?:please\s+)?(?:click|press|tap|open|close|start|stop|set|change|update|run|repair|attach|select|choose|submit)\b/i.test(prompt) ||
    /\b(?:and|then)\s+(?:click|press|tap|open|close|start|stop|set|change|update|run|repair|attach|select|choose|submit)\b/i.test(prompt);
};

const classifySourceFamily = (input: {
  promptText: string;
  sourceTarget: string;
  targetKind: string;
  admittedFamilies: string[];
}): HelixCapabilityFamily => {
  const prompt = normalize(input.promptText);
  if (/\b(?:why|debug|diagnos|explain)\b/.test(prompt) && /\b(?:set_rate|tool call|last turn|debug export|authority|failure|failed)\b/.test(prompt)) {
    return "debug_export";
  }
  if (input.sourceTarget === "runtime_evidence") return "debug_export";
  if (input.sourceTarget === "docs_viewer" || input.sourceTarget === "active_doc" || /\b(?:docs?|document|white paper|whitepaper|paper)\b/.test(prompt)) {
    return "docs";
  }
  if (input.sourceTarget === "visual_capture" || /\b(?:screen|visual|capture|screenshot|frame)\b/.test(prompt)) {
    return "visual_capture";
  }
  if (input.sourceTarget === "procedure_memory" || input.sourceTarget === "situation_epoch" || input.targetKind === "situation_epoch") {
    return "procedure_memory";
  }
  if (input.sourceTarget === "repo_code" || input.admittedFamilies.includes("repo_code")) return "repo_evidence";
  if (input.sourceTarget === "process_graph" || input.admittedFamilies.includes("process_graph")) return "process_graph";
  if (input.sourceTarget === "live_pipeline" || input.admittedFamilies.includes("live_pipeline")) return "live_source";
  if (input.sourceTarget === "workstation_panel" || input.sourceTarget === "workspace_action") return "workstation_action";
  if (/^(?:please\s+)?(?:click|press|tap|close|start|stop|select|choose|submit)\b/i.test(input.promptText.trim())) {
    return "workstation_action";
  }
  return "debug_export";
};

const requestedActionFor = (family: HelixCapabilityFamily, promptText: string): string => {
  const prompt = normalize(promptText);
  if (family === "docs") {
    if (/\b(?:open|pull up|bring up|show)\b/.test(prompt)) return "open_or_validate_document";
    if (/\b(?:read|locate|find)\b/.test(prompt)) return "locate_or_read_document";
    return "retrieve_document_evidence";
  }
  if (family === "workstation_action") {
    if (/\b(?:click|press|tap|start|submit)\b/.test(prompt)) return "click_or_activate_control";
    return "execute_workstation_action";
  }
  if (family === "live_source") {
    if (/\b(?:set|change|interval|rate|cadence|start|stop)\b/.test(prompt)) return "control_live_source";
    return "inspect_live_source";
  }
  if (family === "visual_capture") return "review_current_visual_state";
  if (family === "procedure_memory") return "retrieve_procedure_evidence";
  if (family === "repo_evidence") return "retrieve_repo_evidence";
  if (family === "process_graph") return "inspect_process_graph";
  if (family === "subagent_runtime_adapter") return "delegate_subagent_runtime";
  return "diagnose_debug_or_runtime_evidence";
};

const isMutatingCapability = (family: HelixCapabilityFamily, requestedAction: string, promptText: string): boolean => {
  if (family === "workstation_action" || family === "subagent_runtime_adapter") return true;
  if (family === "live_source" && requestedAction === "control_live_source") return true;
  if (family === "docs" && /\b(?:open|pull up|bring up)\b/i.test(promptText)) return true;
  return false;
};

const allowedFamilyByToolAdmission = (family: HelixCapabilityFamily, admittedFamilies: string[]): boolean => {
  if (admittedFamilies.length === 0) return true;
  if (family === "docs") return admittedFamilies.includes("docs_viewer");
  if (family === "workstation_action") return admittedFamilies.includes("workstation_action") || admittedFamilies.includes("docs_viewer");
  if (family === "visual_capture") return admittedFamilies.includes("situation_run");
  if (family === "procedure_memory") return admittedFamilies.includes("procedure_memory") || admittedFamilies.includes("situation_run");
  if (family === "repo_evidence") return admittedFamilies.includes("repo_code");
  if (family === "debug_export") return admittedFamilies.includes("runtime_evidence") || admittedFamilies.includes("repo_code");
  if (family === "process_graph") return admittedFamilies.includes("process_graph");
  if (family === "live_source") return admittedFamilies.includes("live_pipeline");
  return true;
};

const admissionFor = (input: {
  family: HelixCapabilityFamily;
  mutating: boolean;
  operatorCommandRequired: boolean;
  operatorCommandPresent: boolean;
  admittedFamilies: string[];
  sourceTarget: string;
  instructionFrame?: RecordLike | null;
}): { status: HelixCapabilityAdmissionStatus; rejectionReason?: string } => {
  const instructionFrame = readRecord(input.instructionFrame);
  const negativeConstraints = readStringArray(instructionFrame?.negative_user_constraints);
  const capabilityRules = readStringArray(instructionFrame?.capability_permission_rules);
  const negativeExecutionBlocked =
    input.mutating &&
    (
      capabilityRules.includes("negative_user_constraints_block_mutating_capabilities") ||
      negativeConstraints.some((constraint) =>
        /\b(?:run|open|click|start|stop|set|change|update|repair|refresh|execute)\s+nothing\b/i.test(constraint) ||
        /\b(?:do\s+not|don't|without|never)\b[\s\S]{0,80}\b(?:run|open|click|start|stop|set|change|update|repair|refresh|execute|call)\b/i.test(constraint),
      )
    );
  if (negativeExecutionBlocked) {
    return { status: "rejected", rejectionReason: "negative_user_constraint_blocks_mutating_capability" };
  }
  if (!allowedFamilyByToolAdmission(input.family, input.admittedFamilies)) {
    return { status: "rejected", rejectionReason: "capability_family_not_admitted_by_tool_policy" };
  }
  if (input.mutating && input.operatorCommandRequired && !input.operatorCommandPresent) {
    return { status: "needs_user_confirmation", rejectionReason: "mutating_capability_requires_operator_command" };
  }
  if (
    input.family === "visual_capture" ||
    input.family === "procedure_memory" ||
    input.family === "debug_export" ||
    input.family === "repo_evidence" ||
    input.sourceTarget === "runtime_evidence"
  ) {
    return { status: "needs_evidence" };
  }
  return { status: "admitted" };
};

export const buildCapabilityPlan = (input: {
  turnId: string;
  promptText: string;
  sourceTargetIntent?: RecordLike | null;
  routeProductContract?: RecordLike | null;
  toolCallAdmissionDecision?: RecordLike | null;
  canonicalGoalFrame?: RecordLike | null;
  instructionFrame?: RecordLike | null;
}): HelixCapabilityPlan => {
  const sourceTargetIntent = readRecord(input.sourceTargetIntent);
  const routeProductContract = readRecord(input.routeProductContract);
  const toolCallAdmissionDecision = readRecord(input.toolCallAdmissionDecision);
  const canonicalGoalFrame = readRecord(input.canonicalGoalFrame);
  const instructionFrame = readRecord(input.instructionFrame);
  const sourceTarget =
    readString(sourceTargetIntent?.target_source) ||
    readString(routeProductContract?.source_target) ||
    readString(toolCallAdmissionDecision?.source_target) ||
    "unknown";
  const targetKind = readString(sourceTargetIntent?.target_kind) || sourceTarget;
  const admittedFamilies = readStringArray(toolCallAdmissionDecision?.admitted_tool_families);
  const family = classifySourceFamily({
    promptText: input.promptText,
    sourceTarget,
    targetKind,
    admittedFamilies,
  });
  const requestedAction = requestedActionFor(family, input.promptText);
  const operatorCommandPresent = hasOperatorCommand(input.promptText);
  const mutating = isMutatingCapability(family, requestedAction, input.promptText);
  const operatorCommandRequired = mutating;
  const admission = admissionFor({
    family,
    mutating,
    operatorCommandRequired,
    operatorCommandPresent,
    admittedFamilies,
    sourceTarget,
    instructionFrame,
  });
  return {
    schema: HELIX_CAPABILITY_PLAN_SCHEMA,
    turn_id: input.turnId,
    capability_family: family,
    requested_action: requestedAction,
    mutating,
    operator_command_required: operatorCommandRequired,
    operator_command_present: operatorCommandPresent,
    source_target: sourceTarget,
    goal_kind: readString(canonicalGoalFrame?.goal_kind) || "unknown",
    required_terminal_kind: readString(canonicalGoalFrame?.required_terminal_kind) || null,
    admission_status: admission.status,
    ...(admission.rejectionReason ? { rejection_reason: admission.rejectionReason } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
};
