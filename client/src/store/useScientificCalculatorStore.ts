import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScientificSolveResult } from "@/lib/scientific-calculator/solver";

const SCIENTIFIC_CALCULATOR_STORAGE_KEY = "scientific-calculator:v1";

export type ScientificCalculatorHistoryEntry = {
  id: string;
  latex: string;
  sourcePath: string | null;
  anchor: string | null;
  ts: string;
};

type ScientificCalculatorState = {
  currentLatex: string;
  history: ScientificCalculatorHistoryEntry[];
  lastSolve: ScientificSolveResult | null;
  steps: ScientificSolveResult["steps"];
  ingestLatex: (latex: string, meta?: { sourcePath?: string | null; anchor?: string | null }) => ScientificCalculatorHistoryEntry;
  setSolveResult: (result: ScientificSolveResult) => void;
  clear: () => void;
};

const MAX_HISTORY = 80;

export const useScientificCalculatorStore = create<ScientificCalculatorState>()(
  persist(
    (set) => ({
      currentLatex: "",
      history: [],
      lastSolve: null,
      steps: [],
      ingestLatex: (latex, meta) => {
        const trimmed = latex.trim();
        const entry: ScientificCalculatorHistoryEntry = {
          id: `scicalc:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
          latex: trimmed,
          sourcePath: meta?.sourcePath ?? null,
          anchor: meta?.anchor ?? null,
          ts: new Date().toISOString(),
        };
        set((state) => ({
          currentLatex: trimmed,
          history: [entry, ...state.history].slice(0, MAX_HISTORY),
        }));
        return entry;
      },
      setSolveResult: (result) =>
        set({
          lastSolve: result,
          steps: result.steps,
        }),
      clear: () =>
        set({
          currentLatex: "",
          lastSolve: null,
          steps: [],
        }),
    }),
    {
      name: SCIENTIFIC_CALCULATOR_STORAGE_KEY,
      partialize: (state) => ({
        currentLatex: state.currentLatex,
        history: state.history,
        lastSolve: state.lastSolve,
        steps: state.steps,
      }),
    },
  ),
);
