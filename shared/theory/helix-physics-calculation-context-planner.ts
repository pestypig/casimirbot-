import {
  HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  type HelixWorkstationToolPlan,
  type HelixWorkstationToolPlanStep,
} from "../helix-workstation-tool-plan";
import type { PhysicsAtlasBlockId, PhysicsAtlasV1 } from "../contracts/physics-atlas.v1";
import {
  buildHelixPhysicsCalculationContextPlanV1,
  type HelixPhysicsCalculationContextPlanV1,
  type HelixPhysicsCalculationIntent,
} from "../contracts/helix-physics-calculation-context-plan.v1";
import type { TheoryBadgeGraphV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import type { TheoryCalculatorObjectContextV1 } from "../contracts/theory-calculator-loadout.v1";
import { locateTheoryBadges } from "./theory-badge-overlap-locator";
import { resolvePhysicsAtlasLens } from "./physics-atlas-lens";
import { buildTheoryCalculatorLoadout } from "./theory-calculator-loadout";

export type PlanHelixPhysicsCalculationContextArgs = {
  graph: TheoryBadgeGraphV1;
  atlas: PhysicsAtlasV1;
  query: string;
  intent: HelixPhysicsCalculationIntent;
  atlasBlockIds?: PhysicsAtlasBlockId[];
  subjects?: string[];
  symbols?: string[];
  unitSignatures?: string[];
  equationFamilies?: string[];
  simulationOwners?: string[];
  objectContext?: TheoryCalculatorObjectContextV1 | null;
  variableBindings?: Record<string, string | number>;
  limit?: number;
  threadId?: string | null;
  turnId?: string | null;
  now?: Date;
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

function makePlanId(intent: string): string {
  return `workstation-plan:physics-${intent}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function makeOpenStep(panelId: string): HelixWorkstationToolPlanStep {
  return {
    step_id: `open_${panelId.replace(/[^a-z0-9]+/gi, "_")}`,
    kind: "open_panel",
    panel_id: panelId,
    action_id: "open",
    args: {},
    depends_on: [],
    expected_receipt_kind: "workspace_action_receipt",
    expected_state_change: { panel_id: panelId, open: true },
    required: true,
  };
}

function claimBoundaryNotesForBadge(badge: TheoryBadgeV1): string[] {
  const notes: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) notes.push(`${badge.id}: diagnostic-only badge`);
  if (!badge.claimBoundary.validationClaimAllowed) notes.push(`${badge.id}: validation claim not allowed`);
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
    notes.push(`${badge.id}: physical mechanism claim not allowed`);
  }
  if (!badge.claimBoundary.promotionAllowed) notes.push(`${badge.id}: promotion not allowed`);
  return notes;
}

function isRuntimeBadge(badge: TheoryBadgeV1 | undefined): boolean {
  if (!badge) return false;
  return (
    badge.id.includes(".runtime.") ||
    badge.subjects.includes("runtime") ||
    badge.tags.includes("runtime_reference") ||
    badge.equations.some((equation) => equation.operatorKind === "gate_status")
  );
}

function buildToolActionArgs(args: {
  query: string;
  atlasBlockIds: PhysicsAtlasBlockId[];
  selectedBadgeIds: string[];
  mode: "selected_badges" | "dependency_path" | "locator_matches";
  objectContext: TheoryCalculatorObjectContextV1 | null;
  variableBindings: Record<string, string | number> | undefined;
}) {
  return {
    query: args.query,
    badge_ids: args.selectedBadgeIds,
    atlas_block_ids: args.atlasBlockIds,
    atlas_block_id: args.atlasBlockIds[0] ?? undefined,
    mode: args.mode,
    include_context_items: true,
    ...(args.objectContext ? { object_context: args.objectContext } : {}),
    ...(args.variableBindings && Object.keys(args.variableBindings).length > 0
      ? { variable_bindings: args.variableBindings }
      : {}),
  };
}

function makeWorkstationToolPlan(args: {
  query: string;
  intent: HelixPhysicsCalculationIntent;
  toolArgs: Record<string, unknown>;
  nextActionIds: string[];
  threadId?: string | null;
  turnId?: string | null;
  now?: Date;
}): HelixWorkstationToolPlan {
  const steps: HelixWorkstationToolPlanStep[] = [makeOpenStep("theory-badge-graph")];
  steps.push({
    step_id: "locate_theory_context",
    kind: "run_panel_action",
    panel_id: "theory-badge-graph",
    action_id: "locate_context",
    args: { ...args.toolArgs, overlay: true },
    depends_on: ["open_theory_badge_graph"],
    expected_receipt_kind: "theory_badge_locator",
    expected_state_change: { store: "theory-map-overlay", proof_key: "centerBadgeIds" },
    required: true,
  });

  if (args.nextActionIds.includes("build_calculator_loadout")) {
    steps.push({
      step_id: "build_theory_calculator_loadout",
      kind: "run_panel_action",
      panel_id: "theory-badge-graph",
      action_id: "build_calculator_loadout",
      args: args.toolArgs,
      depends_on: ["locate_theory_context"],
      expected_receipt_kind: "theory_calculator_loadout",
      required: true,
    });
  }
  if (args.nextActionIds.includes("load_calculator_loadout")) {
    steps.push({
      step_id: "load_theory_calculator_loadout",
      kind: "run_panel_action",
      panel_id: "theory-badge-graph",
      action_id: "load_calculator_loadout",
      args: args.toolArgs,
      depends_on: ["build_theory_calculator_loadout"],
      expected_receipt_kind: "theory_calculator_loadout_loaded",
      expected_state_change: { store: "scientific-calculator", proof_key: "lastTheoryLoadout" },
      required: true,
    });
  }
  if (args.nextActionIds.includes("solve_calculator_loadout")) {
    steps.push({
      step_id: "solve_theory_calculator_loadout",
      kind: "run_panel_action",
      panel_id: "theory-badge-graph",
      action_id: "solve_calculator_loadout",
      args: {
        ...args.toolArgs,
        solve_scope: args.intent === "solve_scalar_and_runtime" ? "all_scalar_and_runtime" : "all_scalar",
      },
      depends_on: ["load_theory_calculator_loadout"],
      expected_receipt_kind: "theory_calculator_loadout_solve",
      expected_state_change: { store: "scientific-calculator", proof_key: "lastTheoryLoadout.summary.solvedCount" },
      required: true,
    });
  }
  steps.push({
    step_id: "evaluate_physics_context_result",
    kind: "evaluate_result",
    depends_on: steps.filter((step) => step.kind === "run_panel_action").map((step) => step.step_id),
    expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
    required: true,
  });

  return {
    schema: HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
    plan_id: makePlanId(args.intent),
    thread_id: args.threadId?.trim() || "helix-ask:desktop",
    turn_id: args.turnId?.trim() || "turn:pending",
    goal: args.query,
    intent: "physics_calculation_context",
    steps,
    missing_requirements: [],
    created_at: (args.now ?? new Date()).toISOString(),
  };
}

function nextActionsForIntent(args: {
  intent: HelixPhysicsCalculationIntent;
  toolArgs: Record<string, unknown>;
}): HelixPhysicsCalculationContextPlanV1["nextActions"] {
  if (args.intent === "locate_only") return [];
  const actions: HelixPhysicsCalculationContextPlanV1["nextActions"] = [
    {
      actionId: "theory-badge-graph.build_calculator_loadout",
      label: "Build calculator rows",
      panelId: "theory-badge-graph",
      args: args.toolArgs,
      mutatesCalculator: false,
      solves: false,
      expectedArtifactKind: "theory_calculator_loadout",
    },
    {
      actionId: "theory-badge-graph.load_calculator_loadout",
      label: "Load calculator rows",
      panelId: "theory-badge-graph",
      args: args.toolArgs,
      mutatesCalculator: true,
      solves: false,
      expectedArtifactKind: "theory_calculator_loadout_loaded",
    },
  ];
  if (args.intent === "solve_scalar" || args.intent === "solve_scalar_and_runtime") {
    actions.push({
      actionId: "theory-badge-graph.solve_calculator_loadout",
      label: args.intent === "solve_scalar_and_runtime" ? "Solve scalar and runtime rows" : "Solve scalar rows",
      panelId: "theory-badge-graph",
      args: {
        ...args.toolArgs,
        solve_scope: args.intent === "solve_scalar_and_runtime" ? "all_scalar_and_runtime" : "all_scalar",
      },
      mutatesCalculator: true,
      solves: true,
      expectedArtifactKind: "theory_calculator_loadout_solve",
    });
  }
  return actions;
}

function commentaryForIntent(intent: HelixPhysicsCalculationIntent) {
  const events: HelixPhysicsCalculationContextPlanV1["commentaryEventsPreview"] = [
    {
      timing: "before_step",
      status: "checking",
      text: "I am locating this prompt on the physics atlas before choosing equations.",
      expectedArtifact: "theory_badge_locator",
    },
  ];
  if (intent === "load_calculator" || intent === "solve_scalar" || intent === "solve_scalar_and_runtime") {
    events.push({
      timing: "before_step",
      status: "using_tool",
      text: "I am building a theory calculator loadout from the matched badges.",
      expectedArtifact: "theory_calculator_loadout",
    });
  }
  if (intent === "solve_scalar" || intent === "solve_scalar_and_runtime") {
    events.push({
      timing: "before_step",
      status: "using_tool",
      text: "I am solving the scalar calculator rows and collecting trace artifacts.",
      expectedArtifact: "scientific_calculator_step_trace/v1",
    });
  }
  if (intent === "solve_scalar_and_runtime") {
    events.push({
      timing: "after_step",
      status: "checking",
      text: "I am keeping runtime classification receipts separate from scalar calculator solves.",
      expectedArtifact: "starsim_runtime_receipt/v1",
    });
  }
  events.push({
    timing: "final_ready",
    status: "done",
    text: "I will ground the final answer in the locator, loadout, calculator traces, runtime receipts, and claim boundaries.",
    expectedArtifact: "helix_physics_calculation_context_plan",
  });
  return events;
}

export function planHelixPhysicsCalculationContext(
  args: PlanHelixPhysicsCalculationContextArgs,
): HelixPhysicsCalculationContextPlanV1 {
  const query = args.query.trim();
  const atlasBlockIds = unique(args.atlasBlockIds ?? []).filter((blockId): blockId is PhysicsAtlasBlockId =>
    args.atlas.blocks.some((block) => block.id === blockId),
  );
  const badgesById = new Map(args.graph.badges.map((badge) => [badge.id, badge]));
  const matches = locateTheoryBadges({
    graph: args.graph,
    input: {
      query,
      subjects: args.subjects,
      symbols: args.symbols,
      unitSignatures: args.unitSignatures,
      equationFamilies: args.equationFamilies,
      simulationOwners: args.simulationOwners,
      atlasBlockIds,
      limit: args.limit ?? 8,
    },
  });
  const atlasPrimaryBadgeIds = atlasBlockIds.flatMap(
    (blockId) => args.atlas.blocks.find((block) => block.id === blockId)?.primaryBadgeIds ?? [],
  );
  const selectedBadgeIds = unique([
    ...matches.map((match) => match.badgeId),
    ...(matches.length === 0 ? atlasPrimaryBadgeIds : []),
  ]).filter((badgeId) => badgesById.has(badgeId)).slice(0, Math.max(1, Math.min(12, args.limit ?? 8)));
  const selectedBadges = selectedBadgeIds
    .map((badgeId) => badgesById.get(badgeId))
    .filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const useDependencyPath =
    args.intent === "solve_scalar_and_runtime" && selectedBadges.some((badge) => isRuntimeBadge(badge));
  const loadoutMode = useDependencyPath ? "dependency_path" : "locator_matches";
  const toolArgs = buildToolActionArgs({
    query,
    atlasBlockIds,
    selectedBadgeIds,
    mode: loadoutMode,
    objectContext: args.objectContext ?? null,
    variableBindings: args.variableBindings,
  });
  const loadout = buildTheoryCalculatorLoadout({
    graph: args.graph,
    badgeIds: selectedBadgeIds,
    mode: loadoutMode,
    source: "workstation_action",
    objectContext: args.objectContext ?? null,
    variableBindings: args.variableBindings,
    query,
    atlasBlockId: atlasBlockIds[0],
    includeContextItems: true,
  });
  const runtimeRowCount = loadout.items.filter((item) => item.kind === "runtime_context").length;
  const claimBoundaryCount = loadout.items.filter((item) => item.kind === "claim_boundary").length;
  const scalarRowCount = loadout.items.filter((item) => item.kind === "calculator_payload").length;
  const contextRowCount = loadout.items.length - scalarRowCount - runtimeRowCount - claimBoundaryCount;
  const atlasLenses = atlasBlockIds.map((blockId) => {
    const lens = resolvePhysicsAtlasLens({ graph: args.graph, atlas: args.atlas, blockId });
    return {
      blockId: lens.blockId,
      title: lens.title,
      highlightedBadgeIds: lens.highlightedBadgeIds,
      highlightedEdgeIds: lens.highlightedEdgeIds,
      claimBoundaryNotes: lens.claimBoundaryNotes,
    };
  });
  const nextActions = nextActionsForIntent({ intent: args.intent, toolArgs });
  const nextActionIds = nextActions.map((action) => action.actionId.replace("theory-badge-graph.", ""));
  const workstationToolPlan = makeWorkstationToolPlan({
    query,
    intent: args.intent,
    toolArgs,
    nextActionIds,
    threadId: args.threadId,
    turnId: args.turnId,
    now: args.now,
  });
  const claimBoundaryNotes = unique([
    ...matches.flatMap((match) => match.claimBoundaryWarnings),
    ...selectedBadges.flatMap(claimBoundaryNotesForBadge),
    ...atlasLenses.flatMap((lens) => lens.claimBoundaryNotes),
    ...loadout.claimBoundaryNotes,
  ]);

  return buildHelixPhysicsCalculationContextPlanV1({
    query,
    intent: args.intent,
    graphId: args.graph.graphId,
    locatedBadges: matches.map((match) => {
      const badge = badgesById.get(match.badgeId);
      return {
        badgeId: match.badgeId,
        title: match.badgeTitle,
        score: match.score,
        reasons: match.reasons,
        calculatorPayloadCount: badge?.calculatorPayloads.length ?? match.calculatorPayloadIds.length,
        runtimeContext: isRuntimeBadge(badge),
        claimBoundaryNotes: match.claimBoundaryWarnings,
      };
    }),
    selectedBadgeIds,
    atlasLenses,
    calculatorPlan: {
      canBuildLoadout: loadout.items.length > 0,
      mode: loadoutMode,
      scalarRowCount,
      runtimeRowCount,
      contextRowCount,
      claimBoundaryCount,
      previewRows: loadout.items.slice(0, 16).map((item) => ({
        badgeId: item.badgeId,
        badgeTitle: item.badgeTitle,
        kind: item.kind,
        expression: item.expression,
        solveExpression: item.solveExpression,
        unitSignatures: badgesById.get(item.badgeId)?.hintKeys.unitSignatures ?? [],
      })),
    },
    workstationToolPlan,
    nextActions,
    commentaryEventsPreview: commentaryForIntent(args.intent),
    claimBoundaryNotes,
    warnings: loadout.items.length === 0 ? ["No calculator loadout rows matched the located badges."] : [],
  });
}
