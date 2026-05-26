import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StarSimStellarEvolutionStageId } from "@shared/theory/starsim-stellar-evolution-map";

const THEORY_BADGE_GRAPH_PANEL_MEMORY_KEY = "theory-badge-graph-panel:v1";

type TheoryBadgeGraphViewport = {
  scrollLeft: number;
  scrollTop: number;
};

export type TheoryBadgeGraphAtlasLensId = "starsim-stellar-evolution";

type TheoryBadgeGraphPanelState = {
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  viewport: TheoryBadgeGraphViewport;
  activeAtlasLensId: TheoryBadgeGraphAtlasLensId | null;
  selectedStarSimStageId: StarSimStellarEvolutionStageId | null;
  selectedStarSimObjectBindingId: string | null;
  setSelectedBadgeId: (badgeId: string | null) => void;
  setSelectedBadgeIds: (badgeIds: string[]) => void;
  toggleSelectedBadgeId: (badgeId: string) => void;
  rememberViewport: (viewport: TheoryBadgeGraphViewport) => void;
  setActiveAtlasLensId: (lensId: TheoryBadgeGraphAtlasLensId | null) => void;
  setSelectedStarSimStageId: (stageId: StarSimStellarEvolutionStageId | null) => void;
  setSelectedStarSimObjectBindingId: (bindingId: string | null) => void;
  clearStarSimObjectBinding: () => void;
  resetPanelMemory: () => void;
};

const fallbackSessionStorage = (() => {
  const memory: Record<string, string> = {};
  return {
    getItem: (name: string) => memory[name] ?? null,
    setItem: (name: string, value: string) => {
      memory[name] = value;
    },
    removeItem: (name: string) => {
      delete memory[name];
    },
  };
})();

function resolveSessionStorage() {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    return fallbackSessionStorage;
  }
  return fallbackSessionStorage;
}

function normalizeScroll(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

const initialState = {
  selectedBadgeId: null,
  selectedBadgeIds: [] as string[],
  viewport: {
    scrollLeft: 0,
    scrollTop: 0,
  },
  activeAtlasLensId: "starsim-stellar-evolution" as TheoryBadgeGraphAtlasLensId | null,
  selectedStarSimStageId: null as StarSimStellarEvolutionStageId | null,
  selectedStarSimObjectBindingId: null as string | null,
};

export const useTheoryBadgeGraphPanelStore = create<TheoryBadgeGraphPanelState>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedBadgeId: (badgeId) => set({ selectedBadgeId: badgeId }),
      setSelectedBadgeIds: (badgeIds) =>
        set({
          selectedBadgeIds: Array.from(new Set(badgeIds)),
        }),
      toggleSelectedBadgeId: (badgeId) =>
        set((state) => {
          const selectedBadgeIds = state.selectedBadgeIds.includes(badgeId)
            ? state.selectedBadgeIds.filter((id: string) => id !== badgeId)
            : [...state.selectedBadgeIds, badgeId];
          return {
            selectedBadgeId: badgeId,
            selectedBadgeIds,
          };
        }),
      rememberViewport: (viewport) =>
        set({
          viewport: {
            scrollLeft: normalizeScroll(viewport.scrollLeft),
            scrollTop: normalizeScroll(viewport.scrollTop),
          },
        }),
      setActiveAtlasLensId: (lensId) => set({ activeAtlasLensId: lensId }),
      setSelectedStarSimStageId: (stageId) => set({ selectedStarSimStageId: stageId }),
      setSelectedStarSimObjectBindingId: (bindingId) => set({ selectedStarSimObjectBindingId: bindingId }),
      clearStarSimObjectBinding: () =>
        set({
          selectedStarSimObjectBindingId: null,
        }),
      resetPanelMemory: () => set(initialState),
    }),
    {
      name: THEORY_BADGE_GRAPH_PANEL_MEMORY_KEY,
      storage: createJSONStorage(resolveSessionStorage),
      partialize: (state) => ({
        selectedBadgeId: state.selectedBadgeId,
        selectedBadgeIds: state.selectedBadgeIds,
        viewport: state.viewport,
        activeAtlasLensId: state.activeAtlasLensId,
        selectedStarSimStageId: state.selectedStarSimStageId,
        selectedStarSimObjectBindingId: state.selectedStarSimObjectBindingId,
      }),
    },
  ),
);
