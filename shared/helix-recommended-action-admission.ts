import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionSourceV1,
  type HelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionObjectiveFitV1,
  type HelixRecommendedActionReasonCodeV1,
  type HelixRecommendedActionRiskV1,
  validateHelixRecommendedActionAdmissionV1,
} from "./contracts/helix-recommended-action-admission.v1";

export type HelixRecommendedActionLike = {
  actionId?: string;
  action_id?: string;
  panelId?: string;
  panel_id?: string;
  label?: string;
  args?: Record<string, unknown>;
  mutatesCalculator?: boolean;
  mutates_calculator?: boolean;
  solves?: boolean;
  source?: HelixRecommendedActionAdmissionSourceV1;
  evidenceRefs?: string[];
  evidenceRequirements?: HelixRecommendedActionAdmissionV1["evidenceRequirements"];
};

export type ClassifyRecommendedActionAdmissionInput = {
  prompt: string;
  sourceReceiptId?: string | null;
  source?: HelixRecommendedActionAdmissionSourceV1;
  evidenceRefs?: string[];
  evidenceRequirements?: HelixRecommendedActionAdmissionV1["evidenceRequirements"];
  reasonCodes?: string[];
  actions: HelixRecommendedActionLike[];
};

export type HelixRecommendedActionAutomationDecision = {
  actionId: string;
  canRoute: boolean;
  canShowInUi: boolean;
  canExecute: boolean;
  reasons: string[];
  source?: HelixRecommendedActionAdmissionSourceV1;
  evidenceRefs: string[];
  evidenceRequirements?: HelixRecommendedActionAdmissionV1["evidenceRequirements"];
  reasonCodes: string[];
};

const AUTO_READ_ONLY_ACTIONS = new Set([
  "theory-badge-graph.reflect_discussion_context",
  "theory-badge-graph.explain_reflected_context",
  "theory-badge-graph.build_compound_theory_run",
  "theory-badge-graph.get_runtime_math_trace",
  "theory-badge-graph.locate_context",
  "theory-badge-graph.focus_atlas_block",
  "scientific-calculator.parse_expression",
  "scientific-calculator.preview_expression",
  "scientific-calculator.check_dimensions",
  "workstation-notes.preview_note",
  "workstation-notes.lookup_note",
  "repo-evidence.search",
  "repo-evidence.lookup_symbol",
  "repo-evidence.open_file",
  "repo-evidence.trace_reference",
  "situation-room.prepare_summary",
  "voice.prepare_callout",
]);

const ASK_USER_ACTIONS = new Set([
  "theory-badge-graph.load_compound_theory_run",
  "theory-badge-graph.load_payloads_to_calculator",
  "theory-badge-graph.load_scalar_cut_to_calculator",
  "theory-badge-graph.solve_compound_theory_run",
  "theory-badge-graph.solve_calculator_loadout",
  "scientific-calculator.ingest_latex",
  "scientific-calculator.solve_expression",
  "scientific-calculator.solve_with_steps",
  "scientific-calculator.start_equation_live_source",
  "workstation-notes.create_note",
  "workstation-notes.append_note",
  "workstation-notes.update_note",
  "workstation-notes.delete_note",
  "repo-evidence.run_test",
  "repo-evidence.run_command",
  "situation-room.attach_observer",
  "voice.speak",
  "voice.broadcast",
]);

const CLAIM_SENSITIVE_PATTERN =
  /\b(?:claim|promot|certif|validat|propulsion|working\s+warp|physical\s+mechanism|QEI\s+passed|proven\s+warp)\b/i;

const LONG_OR_LIVE_RUNTIME_PATTERN = /\b(?:long|manifest|live|runtime|sweep|campaign|full[_-]?solve|execute|run_)/i;

const normalizeActionId = (action: HelixRecommendedActionLike): string => {
  const explicit = action.actionId ?? action.action_id ?? "";
  if (explicit.includes(".")) return explicit;
  const panelId = action.panelId ?? action.panel_id ?? "";
  return panelId && explicit ? `${panelId}.${explicit}` : explicit;
};

const normalizePanelId = (action: HelixRecommendedActionLike, actionId: string): string => {
  const panelId = action.panelId ?? action.panel_id;
  if (panelId) return panelId;
  const [prefix] = actionId.split(".");
  return prefix || "unknown";
};

const actionText = (action: HelixRecommendedActionLike, actionId: string): string =>
  `${actionId} ${action.label ?? ""} ${JSON.stringify(action.args ?? {})}`;

const isWorkspaceMutationAction = (actionId: string): boolean =>
  /(?:create|append|update|delete|write|save|attach|broadcast|speak|ingest|load)/i.test(actionId);

function riskForAction(action: HelixRecommendedActionLike, actionId: string): HelixRecommendedActionRiskV1 {
  const text = actionText(action, actionId);
  if (CLAIM_SENSITIVE_PATTERN.test(text)) return "claim_sensitive";
  if (!AUTO_READ_ONLY_ACTIONS.has(actionId) && !ASK_USER_ACTIONS.has(actionId)) return "unknown";
  if (LONG_OR_LIVE_RUNTIME_PATTERN.test(text) && actionId !== "theory-badge-graph.get_runtime_math_trace") {
    return "expensive";
  }
  if (action.solves === true || ASK_USER_ACTIONS.has(actionId) && /solve/i.test(actionId)) return "expensive";
  if (
    action.mutatesCalculator === true ||
    action.mutates_calculator === true ||
    /load_/.test(actionId) ||
    (ASK_USER_ACTIONS.has(actionId) && isWorkspaceMutationAction(actionId))
  ) {
    return "mutating";
  }
  return "read_only";
}

function objectiveFitForAction(actionId: string): HelixRecommendedActionObjectiveFitV1 {
  if (AUTO_READ_ONLY_ACTIONS.has(actionId) || ASK_USER_ACTIONS.has(actionId)) return "high";
  return "low";
}

function reasonCodeForAction(
  action: HelixRecommendedActionLike,
  actionId: string,
  risk: HelixRecommendedActionRiskV1,
): HelixRecommendedActionReasonCodeV1 {
  if (risk === "unknown") return "unknown_action_not_allowlisted";
  if (risk === "claim_sensitive") return "claim_sensitive_language";
  if (risk === "read_only") return "read_only_allowlisted";
  if (action.solves === true || /solve/i.test(actionId)) return "solve_requires_confirmation";
  if (/runtime|execute|run_command/i.test(actionId)) return "runtime_execution_requires_confirmation";
  if (/long|manifest|campaign|full[_-]?solve|sweep/i.test(actionText(action, actionId))) {
    return "long_job_requires_confirmation";
  }
  if (action.mutatesCalculator === true || action.mutates_calculator === true || /calculator|ingest|load_scalar/i.test(actionId)) {
    return "calculator_mutation_requires_confirmation";
  }
  return "workspace_mutation_requires_confirmation";
}

function classifyAction(action: HelixRecommendedActionLike): HelixRecommendedActionAdmissionEntryV1 {
  const actionId = normalizeActionId(action);
  const panelId = normalizePanelId(action, actionId);
  const risk = riskForAction(action, actionId);
  const objectiveFit = objectiveFitForAction(actionId);
  const label = action.label ?? actionId;
  const mutatesCalculator =
    action.mutatesCalculator ?? action.mutates_calculator ?? (/calculator/.test(actionId) && /load/.test(actionId));
  const solves = action.solves ?? /solve/.test(actionId);
  const reasonCode = reasonCodeForAction(action, actionId, risk);
  const source = action.source ?? { panel: panelId, panelId };

  if (risk === "unknown") {
    return {
      actionId,
      panelId,
      label,
      mutatesCalculator,
      solves,
      objectiveFit,
      risk,
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Unknown recommended action is blocked until an explicit policy is added.",
      reasonCode,
      source,
      display_policy: "diagnostic_only",
      evidenceRefs: action.evidenceRefs ?? [],
      ...(action.evidenceRequirements ? { evidenceRequirements: action.evidenceRequirements } : {}),
      reasonCodes: ["blocked_by_policy", reasonCode],
    };
  }

  if (risk === "claim_sensitive") {
    return {
      actionId,
      panelId,
      label,
      mutatesCalculator,
      solves,
      objectiveFit,
      risk,
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Claim-sensitive or promotion-like action is blocked by fail-closed policy.",
      reasonCode,
      source,
      display_policy: "diagnostic_only",
      evidenceRefs: action.evidenceRefs ?? [],
      ...(action.evidenceRequirements ? { evidenceRequirements: action.evidenceRequirements } : {}),
      reasonCodes: ["blocked_by_policy", reasonCode],
    };
  }

  if (risk === "read_only" && AUTO_READ_ONLY_ACTIONS.has(actionId) && !solves && !mutatesCalculator) {
    return {
      actionId,
      panelId,
      label,
      mutatesCalculator,
      solves,
      objectiveFit,
      risk,
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: true,
      reason: "Read-only orientation or preview action is safe to auto-admit.",
      reasonCode,
      source,
      display_policy: "actionable",
      evidenceRefs: action.evidenceRefs ?? [],
      ...(action.evidenceRequirements ? { evidenceRequirements: action.evidenceRequirements } : {}),
      reasonCodes: ["evidence_only_authority", reasonCode],
    };
  }

  return {
    actionId,
    panelId,
    label,
    mutatesCalculator,
    solves,
    objectiveFit,
    risk,
    admission: "ask_user",
    requiresConfirmation: true,
    agentExecutable: false,
    reason: "Action may mutate visible state, solve, or spend runtime budget; ask the user first.",
    reasonCode,
    source,
    display_policy: "actionable",
    evidenceRefs: action.evidenceRefs ?? [],
    ...(action.evidenceRequirements ? { evidenceRequirements: action.evidenceRequirements } : {}),
    reasonCodes: ["evidence_only_authority", reasonCode],
  };
}

export function classifyRecommendedActionAdmission(
  input: ClassifyRecommendedActionAdmissionInput,
): HelixRecommendedActionAdmissionV1 {
  return buildHelixRecommendedActionAdmissionV1({
    prompt: input.prompt,
    sourceReceiptId: input.sourceReceiptId ?? null,
    ...(input.source ? { source: input.source } : {}),
    ...(input.evidenceRefs ? { evidenceRefs: input.evidenceRefs } : {}),
    ...(input.evidenceRequirements ? { evidenceRequirements: input.evidenceRequirements } : {}),
    reasonCodes: input.reasonCodes ?? ["auto_admission_is_not_agent_execution"],
    actions: input.actions.map(classifyAction),
  });
}

export function normalizeHelixRecommendedActionAdmission(
  input: ClassifyRecommendedActionAdmissionInput | HelixRecommendedActionAdmissionV1,
): HelixRecommendedActionAdmissionV1 {
  if ("artifactId" in input && input.artifactId === "helix_recommended_action_admission") {
    return input;
  }
  return classifyRecommendedActionAdmission(input);
}

export function isBlockedAdmission(action: HelixRecommendedActionAdmissionEntryV1): boolean {
  return action.admission === "blocked";
}

export function isDiagnosticOnlyAdmission(action: HelixRecommendedActionAdmissionEntryV1): boolean {
  return action.display_policy === "diagnostic_only";
}

function missingEvidence(value: { evidenceRequirements?: HelixRecommendedActionAdmissionV1["evidenceRequirements"] }): string[] {
  return (value.evidenceRequirements?.missing ?? []).filter((entry) => typeof entry === "string" && entry.trim().length > 0);
}

export function evaluateRecommendedActionAutomation(
  admission: HelixRecommendedActionAdmissionV1,
  action: HelixRecommendedActionAdmissionEntryV1,
): HelixRecommendedActionAutomationDecision {
  const validationIssues = validateHelixRecommendedActionAdmissionV1(admission);
  const authority = admission.authority as { agent_executable?: boolean; terminal_eligible?: boolean };
  const reasons = new Set<string>();
  const topLevelMissingEvidence = missingEvidence(admission);
  const actionMissingEvidence = missingEvidence(action);
  const reasonCodes = Array.from(new Set([...(admission.reasonCodes ?? []), ...(action.reasonCodes ?? [])]));

  for (const issue of validationIssues) reasons.add(`invalid_admission:${issue}`);
  if (action.admission === "blocked") reasons.add("admission_blocked");
  if (action.display_policy === "diagnostic_only") reasons.add("diagnostic_only_display_policy");
  if (authority.agent_executable !== true) reasons.add("authority_agent_executable_not_true");
  if (authority.terminal_eligible !== true) reasons.add("authority_terminal_eligible_not_true");
  if (action.agentExecutable !== true) reasons.add("action_agent_executable_not_true");
  if (topLevelMissingEvidence.length > 0 || actionMissingEvidence.length > 0) reasons.add("missing_evidence_not_empty");

  return {
    actionId: action.actionId,
    canRoute: validationIssues.length === 0,
    canShowInUi: validationIssues.length === 0 && action.display_policy !== "hidden",
    canExecute: reasons.size === 0,
    reasons: [...reasons],
    source: action.source ?? admission.source,
    evidenceRefs: Array.from(new Set([...(admission.evidenceRefs ?? []), ...(action.evidenceRefs ?? [])])),
    ...(action.evidenceRequirements ?? admission.evidenceRequirements
      ? { evidenceRequirements: action.evidenceRequirements ?? admission.evidenceRequirements }
      : {}),
    reasonCodes,
  };
}

export function canAgentAutomateAdmissionAction(
  admission: HelixRecommendedActionAdmissionV1,
  action: HelixRecommendedActionAdmissionEntryV1,
): boolean {
  return evaluateRecommendedActionAutomation(admission, action).canExecute;
}

export function canAgentExecuteAdmission(admission: HelixRecommendedActionAdmissionV1): boolean {
  return admission.actions.some((action) => canAgentAutomateAdmissionAction(admission, action));
}

export function assertValidHelixRecommendedActionAdmission(
  admission: HelixRecommendedActionAdmissionV1,
): HelixRecommendedActionAdmissionV1 {
  const issues = validateHelixRecommendedActionAdmissionV1(admission);
  if (issues.length > 0) {
    throw new Error(`Invalid helix recommended action admission: ${issues.join("; ")}`);
  }
  return admission;
}
