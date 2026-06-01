import type { HelixWorkstationToolPlan, HelixWorkstationToolPlanStep } from "../../../shared/helix-workstation-tool-plan";

export const HELIX_ASK_TOOL_TRACE_DISCLOSURE_SCHEMA = "helix.ask_tool_trace_disclosure.v1" as const;

export type HelixAskToolTraceDisclosureItemRole =
  | "context_locator"
  | "context_route_builder"
  | "scalar_solver"
  | "runtime_observer"
  | "panel_state";

export type HelixAskToolTraceDisclosureAuthority =
  | "evidence_only"
  | "numeric_observation"
  | "runtime_observation"
  | "ui_state";

export type HelixAskToolTraceDisclosureItem = {
  tool: string;
  role: HelixAskToolTraceDisclosureItemRole;
  authority: HelixAskToolTraceDisclosureAuthority;
  summary: string;
};

export type HelixAskToolTraceDisclosure = {
  schema: typeof HELIX_ASK_TOOL_TRACE_DISCLOSURE_SCHEMA;
  disclosureId: string;
  turnId: string;
  items: HelixAskToolTraceDisclosureItem[];
  answerNote: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

type ToolTraceDisclosureStep = Partial<Pick<HelixWorkstationToolPlanStep, "panel_id" | "action_id">> & {
  action?: {
    panel_id?: string | null;
    action_id?: string | null;
  } | null;
};

const toolKey = (step: ToolTraceDisclosureStep): string | null => {
  const panelId = step.panel_id ?? step.action?.panel_id ?? null;
  const actionId = step.action_id ?? step.action?.action_id ?? null;
  if (!panelId || !actionId || actionId === "open") return null;
  return `${panelId}.${actionId}`;
};

const itemForStep = (step: ToolTraceDisclosureStep): HelixAskToolTraceDisclosureItem | null => {
  const tool = toolKey(step);
  if (!tool) return null;
  if (tool === "theory-badge-graph.reflect_discussion_context") {
    return {
      tool,
      role: "context_locator",
      authority: "evidence_only",
      summary: "Located the prompt in theory graph space.",
    };
  }
  if (tool === "theory-badge-graph.explain_reflected_context") {
    return {
      tool,
      role: "context_route_builder",
      authority: "evidence_only",
      summary: "Built a first-principles context route from the reflection.",
    };
  }
  if (tool === "scientific-calculator.solve_expression" || tool === "scientific-calculator.solve_with_steps") {
    return {
      tool,
      role: "scalar_solver",
      authority: "numeric_observation",
      summary: "Computed the scalar result in the Scientific Calculator.",
    };
  }
  if (tool.includes("runtime") || tool.includes("trace")) {
    return {
      tool,
      role: "runtime_observer",
      authority: "runtime_observation",
      summary: "Returned runtime or tensor/reference observation evidence.",
    };
  }
  return {
    tool,
    role: "panel_state",
    authority: "ui_state",
    summary: "Updated workstation panel state.",
  };
};

const uniqueDisclosureItems = (steps: ToolTraceDisclosureStep[]): HelixAskToolTraceDisclosureItem[] => {
  const seen = new Set<string>();
  const items: HelixAskToolTraceDisclosureItem[] = [];
  for (const step of steps) {
    const item = itemForStep(step);
    if (!item || seen.has(item.tool)) continue;
    seen.add(item.tool);
    items.push(item);
  }
  return items;
};

const answerNoteForItems = (items: HelixAskToolTraceDisclosureItem[]): string | null => {
  const hasTheoryReflection = items.some((item) => item.role === "context_locator" || item.role === "context_route_builder");
  const hasScalarSolver = items.some((item) => item.role === "scalar_solver");
  const hasRuntimeObserver = items.some((item) => item.role === "runtime_observer");
  if (hasTheoryReflection && hasScalarSolver) {
    return "Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasTheoryReflection && hasRuntimeObserver) {
    return "Evidence note: theory graph reflection supplied context; runtime receipts supplied system-level observations.";
  }
  if (hasTheoryReflection) {
    return "Evidence note: theory graph reflection supplied context only; it is not a solve.";
  }
  if (hasScalarSolver && hasRuntimeObserver) {
    return "Evidence note: calculator receipts supplied scalar results; runtime receipts supplied system-level observations.";
  }
  return null;
};

export function buildAskToolTraceDisclosure(args: {
  plan?: HelixWorkstationToolPlan | null;
  steps?: ToolTraceDisclosureStep[] | null;
  turnId?: string | null;
}): HelixAskToolTraceDisclosure {
  const steps = args.steps ?? args.plan?.steps ?? [];
  const turnId = args.turnId ?? args.plan?.turn_id ?? "turn:unknown";
  const items = uniqueDisclosureItems(steps);
  return {
    schema: HELIX_ASK_TOOL_TRACE_DISCLOSURE_SCHEMA,
    disclosureId: `${turnId}:tool_trace_disclosure`,
    turnId,
    items,
    answerNote: answerNoteForItems(items),
    assistant_answer: false,
    terminal_eligible: false,
  };
}

export function appendAskToolTraceDisclosureNote(text: string, disclosure: HelixAskToolTraceDisclosure): string {
  const note = disclosure.answerNote?.trim();
  if (!note) return text;
  if (text.includes(note)) return text;
  return `${text.trim()}\n\n${note}`;
}
