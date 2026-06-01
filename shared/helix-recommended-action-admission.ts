import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionObjectiveFitV1,
  type HelixRecommendedActionRiskV1,
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
};

export type ClassifyRecommendedActionAdmissionInput = {
  prompt: string;
  sourceReceiptId?: string | null;
  actions: HelixRecommendedActionLike[];
};

const AUTO_READ_ONLY_ACTIONS = new Set([
  "theory-badge-graph.reflect_discussion_context",
  "theory-badge-graph.explain_reflected_context",
  "theory-badge-graph.build_compound_theory_run",
  "theory-badge-graph.get_runtime_math_trace",
  "theory-badge-graph.locate_context",
  "theory-badge-graph.focus_atlas_block",
]);

const ASK_USER_ACTIONS = new Set([
  "theory-badge-graph.load_compound_theory_run",
  "theory-badge-graph.load_payloads_to_calculator",
  "theory-badge-graph.load_scalar_cut_to_calculator",
  "theory-badge-graph.solve_compound_theory_run",
  "theory-badge-graph.solve_calculator_loadout",
  "scientific-calculator.solve_expression",
  "scientific-calculator.solve_with_steps",
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

function riskForAction(action: HelixRecommendedActionLike, actionId: string): HelixRecommendedActionRiskV1 {
  const text = actionText(action, actionId);
  if (!AUTO_READ_ONLY_ACTIONS.has(actionId) && !ASK_USER_ACTIONS.has(actionId)) return "unknown";
  if (CLAIM_SENSITIVE_PATTERN.test(text)) return "claim_sensitive";
  if (LONG_OR_LIVE_RUNTIME_PATTERN.test(text) && actionId !== "theory-badge-graph.get_runtime_math_trace") {
    return "expensive";
  }
  if (action.solves === true || ASK_USER_ACTIONS.has(actionId) && /solve/i.test(actionId)) return "expensive";
  if (action.mutatesCalculator === true || action.mutates_calculator === true || /load_/.test(actionId)) {
    return "mutating";
  }
  return "read_only";
}

function objectiveFitForAction(actionId: string): HelixRecommendedActionObjectiveFitV1 {
  if (AUTO_READ_ONLY_ACTIONS.has(actionId) || ASK_USER_ACTIONS.has(actionId)) return "high";
  return "low";
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
      reason: "Unknown recommended action is blocked until an explicit policy is added.",
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
      reason: "Claim-sensitive or promotion-like action is blocked by fail-closed policy.",
    };
  }

  if (risk === "read_only" && AUTO_READ_ONLY_ACTIONS.has(actionId)) {
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
      reason: "Read-only orientation or preview action is safe to auto-admit.",
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
    reason: "Action may mutate visible state, solve, or spend runtime budget; ask the user first.",
  };
}

export function classifyRecommendedActionAdmission(
  input: ClassifyRecommendedActionAdmissionInput,
): HelixRecommendedActionAdmissionV1 {
  return buildHelixRecommendedActionAdmissionV1({
    prompt: input.prompt,
    sourceReceiptId: input.sourceReceiptId ?? null,
    actions: input.actions.map(classifyAction),
  });
}
