import { create } from "zustand";
import type { HelixWorkstationBrowserPerformanceSample } from "@shared/helix-workstation-task-manager";

type WorkstationPerformanceState = {
  latest: HelixWorkstationBrowserPerformanceSample | null;
  updatedAtMs: number | null;
  setLatest: (sample: HelixWorkstationBrowserPerformanceSample) => void;
  reset: () => void;
};

export const useWorkstationPerformanceStore = create<WorkstationPerformanceState>()((set) => ({
  latest: null,
  updatedAtMs: null,
  setLatest: (sample) => set({ latest: sample, updatedAtMs: Date.now() }),
  reset: () => set({ latest: null, updatedAtMs: null }),
}));

