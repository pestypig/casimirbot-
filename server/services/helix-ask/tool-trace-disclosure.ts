import type { HelixWorkstationToolPlan, HelixWorkstationToolPlanStep } from "../../../shared/helix-workstation-tool-plan";
import {
  buildWorkstationToolKey,
  getWorkstationPanelToolAuthority,
  type HelixWorkstationPanelToolAuthority,
  type HelixWorkstationPanelToolRole,
} from "./workstation-panel-tool-authority";

export const HELIX_ASK_TOOL_TRACE_DISCLOSURE_SCHEMA = "helix.ask_tool_trace_disclosure.v1" as const;

export type HelixAskToolTraceDisclosureItemRole = HelixWorkstationPanelToolRole;

export type HelixAskToolTraceDisclosureAuthority = HelixWorkstationPanelToolAuthority;

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
  actionKeys: string[];
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

const readStepPanelAction = (step: ToolTraceDisclosureStep): { panelId: string; actionId: string } | null => {
  const panelId = step.panel_id ?? step.action?.panel_id ?? null;
  const actionId = step.action_id ?? step.action?.action_id ?? null;
  const tool = buildWorkstationToolKey(panelId, actionId);
  if (!tool || !panelId || !actionId) return null;
  return { panelId, actionId };
};

const itemForStep = (step: ToolTraceDisclosureStep): HelixAskToolTraceDisclosureItem | null => {
  const panelAction = readStepPanelAction(step);
  if (!panelAction) return null;
  const authority = getWorkstationPanelToolAuthority(panelAction.panelId, panelAction.actionId);
  return {
    tool: authority.tool,
    role: authority.role,
    authority: authority.authority,
    summary: authority.summary,
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
  const hasSourceLookup = items.some((item) => item.role === "source_lookup");
  const hasStateMutation = items.some((item) => item.role === "state_mutation");
  const hasLivePipeline = items.some((item) => item.tool.startsWith("situation-room.pipeline.") || item.tool.startsWith("situation-room.live-source."));
  if (hasLivePipeline) {
    return "Evidence note: Live Answer pipeline receipts supplied workstation state and runtime observations; they are not raw logs or a standalone answer.";
  }
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
  if (hasSourceLookup && hasScalarSolver) {
    return "Evidence note: source lookup supplied evidence; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasSourceLookup) {
    return "Evidence note: workstation source lookup supplied evidence only; it is not a solve.";
  }
  if (hasStateMutation) {
    return "Evidence note: workstation mutation receipts confirm panel state changes; they are not factual support by themselves.";
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
    actionKeys: items.map((item) => item.tool),
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
