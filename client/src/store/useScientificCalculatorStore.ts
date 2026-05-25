import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScientificSolveResult } from "@/lib/scientific-calculator/solver";
import type { HelixCalculatorSetupContext } from "@shared/helix-calculator-setup-context";

const SCIENTIFIC_CALCULATOR_STORAGE_KEY = "scientific-calculator:v1";

export type ScientificCalculatorHistoryEntry = {
  id: string;
  latex: string;
  sourcePath: string | null;
  anchor: string | null;
  calculatorSetup?: HelixCalculatorSetupContext | null;
  compound_run_id?: string | null;
  compound_subgoal_id?: string | null;
  ts: string;
};

export type ScientificCalculatorDebugAction =
  | "ingest_latex"
  | "live_workbench_update"
  | "live_solve_step"
  | "solve_expression"
  | "solve_with_steps"
  | "copy_result"
  | "copy_debug_log"
  | "clear_workspace";

export type ScientificCalculatorDebugEvent = {
  id: string;
  ts: string;
  panel_id: "scientific-calculator";
  action_id: ScientificCalculatorDebugAction;
  source: "panel" | "workstation_action" | "doc_viewer" | "clipboard" | "unknown";
  ok: boolean;
  input_latex?: string;
  source_path?: string | null;
  anchor?: string | null;
  result_text?: string;
  normalized_expression?: string;
  trace_id?: string | null;
  route?: string | null;
  engine?: string | null;
  message?: string;
  calculator_setup?: HelixCalculatorSetupContext | null;
  compound_run_id?: string | null;
  compound_subgoal_id?: string | null;
};

type ScientificCalculatorState = {
  currentLatex: string;
  history: ScientificCalculatorHistoryEntry[];
  lastSolve: ScientificSolveResult | null;
  lastSetup: HelixCalculatorSetupContext | null;
  steps: ScientificSolveResult["steps"];
  debugEvents: ScientificCalculatorDebugEvent[];
  ingestLatex: (
    latex: string,
    meta?: {
      sourcePath?: string | null;
      anchor?: string | null;
      source?: ScientificCalculatorDebugEvent["source"];
      calculatorSetup?: HelixCalculatorSetupContext | null;
      compoundRunId?: string | null;
      compoundSubgoalId?: string | null;
    },
  ) => ScientificCalculatorHistoryEntry;
  setSolveResult: (
    result: ScientificSolveResult,
    meta?: {
      actionId?: Extract<ScientificCalculatorDebugAction, "solve_expression" | "solve_with_steps">;
      source?: ScientificCalculatorDebugEvent["source"];
      calculatorSetup?: HelixCalculatorSetupContext | null;
      compoundRunId?: string | null;
      compoundSubgoalId?: string | null;
    },
  ) => void;
  recordDebugEvent: (
    event: Omit<ScientificCalculatorDebugEvent, "id" | "ts" | "panel_id">,
  ) => ScientificCalculatorDebugEvent;
  setLiveWorkbenchExpression: (
    latex: string,
    meta?: {
      traceId?: string | null;
      message?: string;
      source?: ScientificCalculatorDebugEvent["source"];
      calculatorSetup?: HelixCalculatorSetupContext | null;
    },
  ) => void;
  clear: (meta?: { source?: ScientificCalculatorDebugEvent["source"] }) => void;
};

const MAX_HISTORY = 80;
const MAX_DEBUG_EVENTS = 160;

function makeDebugEvent(
  event: Omit<ScientificCalculatorDebugEvent, "id" | "ts" | "panel_id">,
): ScientificCalculatorDebugEvent {
  const ts = new Date().toISOString();
  return {
    ...event,
    id: `scicalc-debug:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
    ts,
    panel_id: "scientific-calculator",
  };
}

export const useScientificCalculatorStore = create<ScientificCalculatorState>()(
  persist(
    (set) => ({
      currentLatex: "",
      history: [],
      lastSolve: null,
      lastSetup: null,
      steps: [],
      debugEvents: [],
      ingestLatex: (latex, meta) => {
        const trimmed = latex.trim();
        const entry: ScientificCalculatorHistoryEntry = {
          id: `scicalc:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
          latex: trimmed,
          sourcePath: meta?.sourcePath ?? null,
          anchor: meta?.anchor ?? null,
          calculatorSetup: meta?.calculatorSetup ?? null,
          compound_run_id: meta?.compoundRunId ?? null,
          compound_subgoal_id: meta?.compoundSubgoalId ?? null,
          ts: new Date().toISOString(),
        };
        const debugEvent = makeDebugEvent({
          action_id: "ingest_latex",
          source: meta?.source ?? (entry.sourcePath === "clipboard" ? "clipboard" : "unknown"),
          ok: Boolean(trimmed),
          input_latex: trimmed,
          source_path: entry.sourcePath,
          anchor: entry.anchor,
          calculator_setup: entry.calculatorSetup,
          compound_run_id: meta?.compoundRunId ?? null,
          compound_subgoal_id: meta?.compoundSubgoalId ?? null,
          message: trimmed ? "latex_ingested" : "empty_latex",
        });
        set((state) => ({
          currentLatex: trimmed,
          lastSetup: entry.calculatorSetup ?? null,
          history: [entry, ...state.history].slice(0, MAX_HISTORY),
          debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
        }));
        return entry;
      },
      setSolveResult: (result, meta) => {
        const debugEvent = makeDebugEvent({
          action_id: meta?.actionId ?? "solve_expression",
          source: meta?.source ?? "panel",
          ok: result.ok,
          input_latex: result.input_latex,
          result_text: result.result_text,
          normalized_expression: result.normalized_expression,
          trace_id: result.trace.traceId,
          route: result.trace.route,
          engine: result.trace.engine,
          calculator_setup: meta?.calculatorSetup ?? null,
          compound_run_id: meta?.compoundRunId ?? null,
          compound_subgoal_id: meta?.compoundSubgoalId ?? null,
          message: result.ok ? "solve_completed" : result.error ?? "solve_failed",
        });
        set((state) => ({
          lastSolve: result,
          lastSetup: meta && "calculatorSetup" in meta ? (meta.calculatorSetup ?? null) : state.lastSetup,
          steps: result.steps,
          debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
        }));
      },
      recordDebugEvent: (event) => {
        const debugEvent = makeDebugEvent(event);
        set((state) => ({
          debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
        }));
        return debugEvent;
      },
      setLiveWorkbenchExpression: (latex, meta) => {
        const trimmed = latex.trim();
        const debugEvent = makeDebugEvent({
          action_id: "live_workbench_update",
          source: meta?.source ?? "workstation_action",
          ok: Boolean(trimmed),
          input_latex: trimmed,
          source_path: "scientific-calculator:live-source",
          trace_id: meta?.traceId ?? null,
          route: "scientific-calculator/live-workbench",
          engine: "trial_division",
          calculator_setup: meta?.calculatorSetup ?? null,
          message: meta?.message ?? "live_workbench_expression_updated",
        });
        set((state) => ({
          currentLatex: trimmed,
          lastSetup: meta?.calculatorSetup ?? null,
          debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
        }));
      },
      clear: (meta) =>
        set((state) => ({
          currentLatex: "",
          lastSolve: null,
          lastSetup: null,
          steps: [],
          debugEvents: [
            makeDebugEvent({
              action_id: "clear_workspace",
              source: meta?.source ?? "panel",
              ok: true,
              message: "workspace_cleared",
            }),
            ...state.debugEvents,
          ].slice(0, MAX_DEBUG_EVENTS),
        })),
    }),
    {
      name: SCIENTIFIC_CALCULATOR_STORAGE_KEY,
      partialize: (state) => ({
        currentLatex: state.currentLatex,
        history: state.history,
        lastSolve: state.lastSolve,
        lastSetup: state.lastSetup,
        steps: state.steps,
        debugEvents: state.debugEvents,
      }),
    },
  ),
);
