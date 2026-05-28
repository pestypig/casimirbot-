import {
  HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  type HelixWorkstationToolPlan,
} from "../helix-workstation-tool-plan";

export const HELIX_PHYSICS_CALCULATION_CONTEXT_PLAN_SCHEMA =
  "helix.physics_calculation_context_plan/v1" as const;

export const HELIX_PHYSICS_CALCULATION_INTENTS = [
  "locate_only",
  "load_calculator",
  "solve_scalar",
  "solve_scalar_and_runtime",
] as const;

export type HelixPhysicsCalculationIntent =
  (typeof HELIX_PHYSICS_CALCULATION_INTENTS)[number];

export type HelixPhysicsCalculationContextPlanV1 = {
  schemaVersion: typeof HELIX_PHYSICS_CALCULATION_CONTEXT_PLAN_SCHEMA;
  kind: "helix_physics_calculation_context_plan";
  generatedAt: string;
  planId: string;
  query: string;
  intent: HelixPhysicsCalculationIntent;
  graphId: string;
  locatedBadges: Array<{
    badgeId: string;
    title: string;
    score: number;
    reasons: string[];
    calculatorPayloadCount: number;
    runtimeContext: boolean;
    claimBoundaryNotes: string[];
  }>;
  selectedBadgeIds: string[];
  atlasLenses: Array<{
    blockId: string;
    title: string;
    highlightedBadgeIds: string[];
    highlightedEdgeIds: string[];
    claimBoundaryNotes: string[];
  }>;
  calculatorPlan: {
    canBuildLoadout: boolean;
    mode: "selected_badges" | "dependency_path" | "connection_trace" | "locator_matches";
    scalarRowCount: number;
    runtimeRowCount: number;
    contextRowCount: number;
    claimBoundaryCount: number;
    previewRows: Array<{
      badgeId: string;
      badgeTitle: string;
      kind: string;
      expression: string | null;
      solveExpression: string | null;
      unitSignatures: string[];
    }>;
  };
  workstationToolPlan: HelixWorkstationToolPlan;
  nextActions: Array<{
    actionId: string;
    label: string;
    panelId: "theory-badge-graph" | "scientific-calculator";
    args: Record<string, unknown>;
    mutatesCalculator: boolean;
    solves: boolean;
    expectedArtifactKind: string;
  }>;
  commentaryEventsPreview: Array<{
    timing: "turn_start" | "before_step" | "after_step" | "final_ready" | "fail_closed";
    status: "thinking" | "checking" | "using_tool" | "repairing" | "done";
    text: string;
    expectedArtifact?: string;
  }>;
  claimBoundaryNotes: string[];
  warnings: string[];
  assistantAnswer: false;
  rawReasoningIncluded: false;
};

type BuildInput = Omit<
  HelixPhysicsCalculationContextPlanV1,
  "schemaVersion" | "kind" | "generatedAt" | "planId" | "assistantAnswer" | "rawReasoningIncluded"
> & {
  generatedAt?: string;
  planId?: string;
};

const FORBIDDEN_PHYSICS_CONTEXT_PATTERNS = [
  /\bdirect ER=EPR evidence\b/i,
  /\bCL4 support\b/i,
  /\bvalidated propulsion\b/i,
  /\bproven warp\b/i,
  /\bconfirmed physical mechanism\b/i,
  /\bStarSim proves\b/i,
  /\bSolar proves\b/i,
  /\bCasimir proves propulsion\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isIntent = (value: unknown): value is HelixPhysicsCalculationIntent =>
  typeof value === "string" &&
  HELIX_PHYSICS_CALCULATION_INTENTS.includes(value as HelixPhysicsCalculationIntent);

function newPlanId(): string {
  return `helix-physics-context:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

export function buildHelixPhysicsCalculationContextPlanV1(input: BuildInput): HelixPhysicsCalculationContextPlanV1 {
  return {
    schemaVersion: HELIX_PHYSICS_CALCULATION_CONTEXT_PLAN_SCHEMA,
    kind: "helix_physics_calculation_context_plan",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    planId: input.planId ?? newPlanId(),
    query: input.query,
    intent: input.intent,
    graphId: input.graphId,
    locatedBadges: input.locatedBadges,
    selectedBadgeIds: input.selectedBadgeIds,
    atlasLenses: input.atlasLenses,
    calculatorPlan: input.calculatorPlan,
    workstationToolPlan: input.workstationToolPlan,
    nextActions: input.nextActions,
    commentaryEventsPreview: input.commentaryEventsPreview,
    claimBoundaryNotes: input.claimBoundaryNotes,
    warnings: input.warnings,
    assistantAnswer: false,
    rawReasoningIncluded: false,
  };
}

export function validateHelixPhysicsCalculationContextPlanV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["physics calculation context plan must be an object"];
  if (value.schemaVersion !== HELIX_PHYSICS_CALCULATION_CONTEXT_PLAN_SCHEMA) {
    issues.push(`schemaVersion must be ${HELIX_PHYSICS_CALCULATION_CONTEXT_PLAN_SCHEMA}`);
  }
  if (value.kind !== "helix_physics_calculation_context_plan") {
    issues.push("kind must be helix_physics_calculation_context_plan");
  }
  for (const field of ["generatedAt", "planId", "query", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isIntent(value.intent)) issues.push("intent is invalid");
  if (!Array.isArray(value.locatedBadges)) issues.push("locatedBadges must be an array");
  if (!isStringArray(value.selectedBadgeIds)) issues.push("selectedBadgeIds must be an array of strings");
  if (!Array.isArray(value.atlasLenses)) issues.push("atlasLenses must be an array");
  if (!isRecord(value.calculatorPlan)) issues.push("calculatorPlan must be an object");
  if (!isRecord(value.workstationToolPlan)) {
    issues.push("workstationToolPlan must be an object");
  } else if (value.workstationToolPlan.schema !== HELIX_WORKSTATION_TOOL_PLAN_SCHEMA) {
    issues.push(`workstationToolPlan.schema must be ${HELIX_WORKSTATION_TOOL_PLAN_SCHEMA}`);
  }
  if (!Array.isArray(value.nextActions)) issues.push("nextActions must be an array");
  if (!Array.isArray(value.commentaryEventsPreview)) issues.push("commentaryEventsPreview must be an array");
  if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be an array of strings");
  if (!isStringArray(value.warnings)) issues.push("warnings must be an array of strings");
  if (value.assistantAnswer !== false) issues.push("assistantAnswer must be false");
  if (value.rawReasoningIncluded !== false) issues.push("rawReasoningIncluded must be false");

  const nextActions = Array.isArray(value.nextActions) ? value.nextActions : [];
  const workstationSteps =
    isRecord(value.workstationToolPlan) && Array.isArray(value.workstationToolPlan.steps)
      ? value.workstationToolPlan.steps
      : [];
  if (value.intent === "locate_only") {
    for (const action of nextActions) {
      if (!isRecord(action)) continue;
      if (action.mutatesCalculator === true) issues.push("locate_only must not include calculator mutation actions");
      if (action.solves === true) issues.push("locate_only must not include solve actions");
      if (String(action.actionId ?? "").includes("solve_calculator_loadout")) {
        issues.push("locate_only must not include solve_calculator_loadout");
      }
      if (String(action.actionId ?? "").includes("load_calculator_loadout")) {
        issues.push("locate_only must not include load_calculator_loadout");
      }
    }
    for (const step of workstationSteps) {
      if (!isRecord(step)) continue;
      const stepActionId = String(step.action_id ?? "");
      if (stepActionId.includes("solve_calculator_loadout")) issues.push("locate_only workstation plan must not solve");
      if (stepActionId.includes("load_calculator_loadout")) issues.push("locate_only workstation plan must not load calculator");
    }
  }
  if (value.intent === "solve_scalar") {
    for (const action of nextActions) {
      if (!isRecord(action)) continue;
      const rawArgs = isRecord(action.args) ? action.args : {};
      if (rawArgs.solve_scope === "all_scalar_and_runtime" || rawArgs.solveScope === "all_scalar_and_runtime") {
        issues.push("solve_scalar must not include runtime execution");
      }
      if (String(action.actionId ?? "") === "theory-badge-graph.run_runtime_badge") {
        issues.push("solve_scalar must not include runtime badge execution");
      }
    }
    for (const step of workstationSteps) {
      if (!isRecord(step)) continue;
      const rawArgs = isRecord(step.args) ? step.args : {};
      if (rawArgs.solve_scope === "all_scalar_and_runtime" || rawArgs.solveScope === "all_scalar_and_runtime") {
        issues.push("solve_scalar workstation plan must not include runtime execution");
      }
      if (String(step.action_id ?? "") === "run_runtime_badge") {
        issues.push("solve_scalar workstation plan must not include runtime badge execution");
      }
    }
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_PHYSICS_CONTEXT_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }
  return issues;
}

export function isHelixPhysicsCalculationContextPlanV1(
  value: unknown,
): value is HelixPhysicsCalculationContextPlanV1 {
  return validateHelixPhysicsCalculationContextPlanV1(value).length === 0;
}
