export const HELIX_WORKSTATION_PANEL_TOOL_AUTHORITY_SCHEMA =
  "helix.workstation_panel_tool_authority.v1" as const;

export type HelixWorkstationPanelToolRole =
  | "context_locator"
  | "context_route_builder"
  | "source_lookup"
  | "scalar_solver"
  | "runtime_observer"
  | "state_mutation"
  | "ui_navigation"
  | "panel_state";

export type HelixWorkstationPanelToolAuthority =
  | "evidence_only"
  | "source_evidence"
  | "numeric_observation"
  | "runtime_observation"
  | "mutation_receipt"
  | "ui_state";

export type HelixWorkstationPanelToolAuthorityEntry = {
  schema: typeof HELIX_WORKSTATION_PANEL_TOOL_AUTHORITY_SCHEMA;
  tool: string;
  panelId: string;
  actionId: string;
  role: HelixWorkstationPanelToolRole;
  authority: HelixWorkstationPanelToolAuthority;
  summary: string;
};

const entry = (
  panelId: string,
  actionId: string,
  role: HelixWorkstationPanelToolRole,
  authority: HelixWorkstationPanelToolAuthority,
  summary: string,
): HelixWorkstationPanelToolAuthorityEntry => ({
  schema: HELIX_WORKSTATION_PANEL_TOOL_AUTHORITY_SCHEMA,
  tool: `${panelId}.${actionId}`,
  panelId,
  actionId,
  role,
  authority,
  summary,
});

const EXACT_AUTHORITY_ENTRIES: HelixWorkstationPanelToolAuthorityEntry[] = [
  entry(
    "theory-badge-graph",
    "current_context",
    "context_locator",
    "evidence_only",
    "Observed the user's current theory badge selection and its graph possibilities.",
  ),
  entry(
    "theory-badge-graph",
    "reflect_discussion_context",
    "context_locator",
    "evidence_only",
    "Located the prompt in theory graph space.",
  ),
  entry(
    "theory-badge-graph",
    "explain_reflected_context",
    "context_route_builder",
    "evidence_only",
    "Built a first-principles context route from the reflection.",
  ),
  entry(
    "theory-badge-graph",
    "locate_context",
    "context_locator",
    "evidence_only",
    "Located matching theory badges and claim boundaries.",
  ),
  entry(
    "theory-badge-graph",
    "plan_calculation_context",
    "context_route_builder",
    "evidence_only",
    "Planned a physics calculation route without solving it.",
  ),
  entry(
    "theory-badge-graph",
    "build_compound_theory_run",
    "context_route_builder",
    "evidence_only",
    "Built a compound theory run plan without executing it.",
  ),
  entry(
    "theory-badge-graph",
    "load_compound_theory_run",
    "panel_state",
    "ui_state",
    "Loaded the compound theory run into workstation state.",
  ),
  entry(
    "theory-badge-graph",
    "solve_compound_theory_run",
    "runtime_observer",
    "runtime_observation",
    "Returned available compound theory run observations.",
  ),
  entry(
    "theory-badge-graph",
    "get_runtime_math_trace",
    "runtime_observer",
    "runtime_observation",
    "Returned runtime or tensor/reference observation evidence.",
  ),
  entry(
    "theory-badge-graph",
    "load_scalar_cut_to_calculator",
    "panel_state",
    "ui_state",
    "Loaded a scalar cut into the Scientific Calculator.",
  ),
  entry(
    "scientific-calculator",
    "solve_expression",
    "scalar_solver",
    "numeric_observation",
    "Computed the scalar result in the Scientific Calculator.",
  ),
  entry(
    "scientific-calculator",
    "solve_with_steps",
    "scalar_solver",
    "numeric_observation",
    "Computed a scalar step trace in the Scientific Calculator.",
  ),
  entry(
    "scientific-calculator",
    "ingest_latex",
    "panel_state",
    "ui_state",
    "Loaded expression text into the Scientific Calculator.",
  ),
  entry(
    "scientific-calculator",
    "load_payloads_to_calculator",
    "panel_state",
    "ui_state",
    "Loaded theory calculator payloads into the Scientific Calculator.",
  ),
  entry(
    "situation-room-pipelines",
    "create_live_answer_environment",
    "state_mutation",
    "mutation_receipt",
    "Created or updated a Live Answer environment.",
  ),
  entry(
    "situation-room-pipelines",
    "create_live_workstation_pipeline",
    "state_mutation",
    "mutation_receipt",
    "Created or updated a Live Answer workstation pipeline.",
  ),
  entry(
    "situation-room-pipelines",
    "create_job",
    "state_mutation",
    "mutation_receipt",
    "Created a Situation Room pipeline job.",
  ),
  entry(
    "situation-room-pipelines",
    "request_agentic_review",
    "runtime_observer",
    "runtime_observation",
    "Requested an agentic Situation Room review observation.",
  ),
  entry(
    "situation-room-pipelines",
    "setup_from_prompt",
    "state_mutation",
    "mutation_receipt",
    "Set up a Situation Room pipeline from the prompt.",
  ),
  entry(
    "situation-room",
    "live-source.set_rate",
    "state_mutation",
    "mutation_receipt",
    "Changed the live source cadence policy.",
  ),
  entry(
    "situation-room",
    "pipeline.compose",
    "context_route_builder",
    "evidence_only",
    "Composed a Live Answer pipeline route.",
  ),
  entry(
    "situation-room",
    "pipeline.execute",
    "state_mutation",
    "mutation_receipt",
    "Executed a Live Answer pipeline setup.",
  ),
  entry(
    "situation-room",
    "pipeline.inspect",
    "runtime_observer",
    "runtime_observation",
    "Inspected Live Answer pipeline runtime state.",
  ),
  entry(
    "situation-room",
    "pipeline.repair",
    "state_mutation",
    "mutation_receipt",
    "Repaired Live Answer pipeline runtime state.",
  ),
];

const EXACT_AUTHORITY_BY_TOOL = new Map(EXACT_AUTHORITY_ENTRIES.map((item) => [item.tool, item]));

export const buildWorkstationToolKey = (panelId: string | null | undefined, actionId: string | null | undefined): string | null => {
  const panel = typeof panelId === "string" ? panelId.trim() : "";
  const action = typeof actionId === "string" ? actionId.trim() : "";
  if (!panel || !action) return null;
  return `${panel}.${action}`;
};

const hasToken = (value: string, tokens: string[]): boolean => tokens.some((token) => value.includes(token));

const fallbackAuthorityEntry = (panelId: string, actionId: string): HelixWorkstationPanelToolAuthorityEntry => {
  const panel = panelId.toLowerCase();
  const action = actionId.toLowerCase();
  if (action === "open" || action === "focus" || action === "show" || action === "switch_to") {
    return entry(panelId, actionId, "ui_navigation", "ui_state", "Opened or focused a workstation panel.");
  }
  if (
    hasToken(panel, ["doc", "paper", "source", "library", "reference"]) ||
    hasToken(action, ["search", "lookup", "read", "open_doc", "source", "retrieve", "fetch"])
  ) {
    return entry(panelId, actionId, "source_lookup", "source_evidence", "Retrieved source or reference evidence.");
  }
  if (hasToken(action, ["solve", "calculate", "compute"]) && hasToken(panel, ["calculator"])) {
    return entry(panelId, actionId, "scalar_solver", "numeric_observation", "Computed a scalar numeric observation.");
  }
  if (hasToken(action, ["runtime", "trace", "receipt", "adapter"]) || hasToken(panel, ["runtime"])) {
    return entry(panelId, actionId, "runtime_observer", "runtime_observation", "Returned runtime or trace observation evidence.");
  }
  if (hasToken(action, ["create", "update", "delete", "append", "save", "write", "load", "clear", "set_"])) {
    return entry(panelId, actionId, "state_mutation", "mutation_receipt", "Changed workstation panel state.");
  }
  return entry(panelId, actionId, "panel_state", "ui_state", "Updated workstation panel state.");
};

export function getWorkstationPanelToolAuthority(
  panelId: string,
  actionId: string,
): HelixWorkstationPanelToolAuthorityEntry {
  const tool = buildWorkstationToolKey(panelId, actionId);
  if (!tool) return fallbackAuthorityEntry(panelId, actionId);
  return EXACT_AUTHORITY_BY_TOOL.get(tool) ?? fallbackAuthorityEntry(panelId, actionId);
}

export function listWorkstationPanelToolAuthorityEntries(): HelixWorkstationPanelToolAuthorityEntry[] {
  return [...EXACT_AUTHORITY_ENTRIES];
}
