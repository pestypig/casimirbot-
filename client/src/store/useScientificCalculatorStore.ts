import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScientificSolveResult } from "@/lib/scientific-calculator/solver";
import type { HelixCalculatorSetupContext } from "@shared/helix-calculator-setup-context";
import type { ScientificCalculatorStepTraceArtifactV1 } from "@shared/contracts/scientific-calculator-step-schema.v1";
import type {
  TheoryCalculatorLoadoutItemV1,
  TheoryCalculatorLoadoutV1,
} from "@shared/contracts/theory-calculator-loadout.v1";

const SCIENTIFIC_CALCULATOR_STORAGE_KEY = "scientific-calculator:v1";

export type ScientificCalculatorWorkbenchTarget = "scalar" | "runtime" | "theory";

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
  | "prefill_expression"
  | "classify_expression"
  | "live_workbench_update"
  | "live_solve_step"
  | "solve_expression"
  | "solve_with_steps"
  | "copy_result"
  | "copy_steps_markdown"
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
  target_workbench?: ScientificCalculatorWorkbenchTarget;
};

type ScientificCalculatorState = {
  currentLatex: string;
  history: ScientificCalculatorHistoryEntry[];
  lastSolve: ScientificSolveResult | null;
  lastArtifactV1: ScientificCalculatorStepTraceArtifactV1 | null;
  lastTheoryLoadout: TheoryCalculatorLoadoutV1 | null;
  activeTheoryLoadoutItemIndex: number | null;
  lastSetup: HelixCalculatorSetupContext | null;
  steps: ScientificSolveResult["steps"];
  debugEvents: ScientificCalculatorDebugEvent[];
  ingestLatex: (
    latex: string,
    meta?: {
      actionId?: Extract<ScientificCalculatorDebugAction, "ingest_latex" | "prefill_expression">;
      sourcePath?: string | null;
      anchor?: string | null;
      source?: ScientificCalculatorDebugEvent["source"];
      calculatorSetup?: HelixCalculatorSetupContext | null;
      compoundRunId?: string | null;
      compoundSubgoalId?: string | null;
      targetWorkbench?: ScientificCalculatorWorkbenchTarget;
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
      targetWorkbench?: ScientificCalculatorWorkbenchTarget;
    },
  ) => void;
  setTheoryLoadout: (loadout: TheoryCalculatorLoadoutV1 | null) => void;
  loadTheoryLoadoutItem: (index: number) => TheoryCalculatorLoadoutItemV1 | null;
  updateTheoryLoadout: (loadout: TheoryCalculatorLoadoutV1) => void;
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
      lastArtifactV1: null,
      lastTheoryLoadout: null,
      activeTheoryLoadoutItemIndex: null,
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
          action_id: meta?.actionId ?? "ingest_latex",
          source: meta?.source ?? (entry.sourcePath === "clipboard" ? "clipboard" : "unknown"),
          ok: Boolean(trimmed),
          input_latex: trimmed,
          source_path: entry.sourcePath,
          anchor: entry.anchor,
          calculator_setup: entry.calculatorSetup,
          compound_run_id: meta?.compoundRunId ?? null,
          compound_subgoal_id: meta?.compoundSubgoalId ?? null,
          target_workbench: meta?.targetWorkbench ?? (meta?.compoundRunId ? "theory" : "scalar"),
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
          target_workbench: meta?.targetWorkbench ?? (meta?.compoundRunId ? "theory" : "scalar"),
          message: result.ok ? "solve_completed" : result.error ?? "solve_failed",
        });
        set((state) => ({
          lastSolve: result,
          lastArtifactV1: result.artifact_v1 ?? null,
          lastSetup: meta && "calculatorSetup" in meta ? (meta.calculatorSetup ?? null) : state.lastSetup,
          steps: result.steps,
          debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
        }));
      },
      setTheoryLoadout: (loadout) =>
        set({
          lastTheoryLoadout: loadout,
          activeTheoryLoadoutItemIndex: loadout?.items.find((item) => item.kind === "calculator_payload")?.index ?? null,
        }),
      loadTheoryLoadoutItem: (index) => {
        let selectedItem: TheoryCalculatorLoadoutItemV1 | null = null;
        set((state) => {
          selectedItem = state.lastTheoryLoadout?.items.find((item) => item.index === index) ?? null;
          if (!selectedItem || selectedItem.kind !== "calculator_payload" || !selectedItem.solveExpression) {
            return {
              activeTheoryLoadoutItemIndex: index,
            };
          }
          const debugEvent = makeDebugEvent({
            action_id: "ingest_latex",
            source: "workstation_action",
            ok: true,
            input_latex: selectedItem.solveExpression,
            source_path: selectedItem.sourcePath,
            anchor: selectedItem.payloadId,
            calculator_setup: selectedItem.setupContext,
            compound_run_id: state.lastTheoryLoadout?.loadoutId ?? null,
            compound_subgoal_id: selectedItem.id,
            target_workbench: "theory",
            message: "theory_loadout_item_loaded",
          });
          const entry: ScientificCalculatorHistoryEntry = {
            id: `scicalc:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            latex: selectedItem.solveExpression,
            sourcePath: selectedItem.sourcePath,
            anchor: selectedItem.payloadId,
            calculatorSetup: selectedItem.setupContext,
            compound_run_id: state.lastTheoryLoadout?.loadoutId ?? null,
            compound_subgoal_id: selectedItem.id,
            ts: new Date().toISOString(),
          };
          return {
            activeTheoryLoadoutItemIndex: index,
            currentLatex: selectedItem.solveExpression,
            lastSetup: selectedItem.setupContext,
            history: [entry, ...state.history].slice(0, MAX_HISTORY),
            debugEvents: [debugEvent, ...state.debugEvents].slice(0, MAX_DEBUG_EVENTS),
          };
        });
        return selectedItem;
      },
      updateTheoryLoadout: (loadout) =>
        set((state) => ({
          lastTheoryLoadout: loadout,
          activeTheoryLoadoutItemIndex:
            state.activeTheoryLoadoutItemIndex ??
            loadout.items.find((item) => item.kind === "calculator_payload")?.index ??
            null,
        })),
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
          lastArtifactV1: null,
          lastTheoryLoadout: null,
          activeTheoryLoadoutItemIndex: null,
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
        lastArtifactV1: state.lastArtifactV1,
        lastTheoryLoadout: state.lastTheoryLoadout,
        activeTheoryLoadoutItemIndex: state.activeTheoryLoadoutItemIndex,
        lastSetup: state.lastSetup,
        steps: state.steps,
        debugEvents: state.debugEvents,
      }),
    },
  ),
);
