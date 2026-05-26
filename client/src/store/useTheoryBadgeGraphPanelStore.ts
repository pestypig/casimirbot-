import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StarSimStellarEvolutionStageId } from "@shared/theory/starsim-stellar-evolution-map";
import type { CosmicDistanceLadderRungId } from "@shared/theory/cosmic-distance-ladder-map";
import type { PhysicsAtlasBlockId } from "@shared/contracts/physics-atlas.v1";

const THEORY_BADGE_GRAPH_PANEL_MEMORY_KEY = "theory-badge-graph-panel:v1";

type TheoryBadgeGraphViewport = {
  scrollLeft: number;
  scrollTop: number;
};

export type TheoryBadgeGraphAtlasLensId = PhysicsAtlasBlockId;

type TheoryBadgeGraphPanelState = {
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  viewport: TheoryBadgeGraphViewport;
  activeAtlasLensId: TheoryBadgeGraphAtlasLensId | null;
  selectedStarSimStageId: StarSimStellarEvolutionStageId | null;
  selectedStarSimObjectBindingId: string | null;
  selectedCosmicDistanceRungId: CosmicDistanceLadderRungId | null;
  selectedCosmicDistanceObjectBindingId: string | null;
  setSelectedBadgeId: (badgeId: string | null) => void;
  setSelectedBadgeIds: (badgeIds: string[]) => void;
  toggleSelectedBadgeId: (badgeId: string) => void;
  rememberViewport: (viewport: TheoryBadgeGraphViewport) => void;
  setActiveAtlasLensId: (lensId: TheoryBadgeGraphAtlasLensId | null) => void;
  setSelectedStarSimStageId: (stageId: StarSimStellarEvolutionStageId | null) => void;
  setSelectedStarSimObjectBindingId: (bindingId: string | null) => void;
  clearStarSimObjectBinding: () => void;
  setSelectedCosmicDistanceRungId: (rungId: CosmicDistanceLadderRungId | null) => void;
  setSelectedCosmicDistanceObjectBindingId: (bindingId: string | null) => void;
  clearCosmicDistanceObjectBinding: () => void;
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
  activeAtlasLensId: "stellar_evolution" as TheoryBadgeGraphAtlasLensId | null,
  selectedStarSimStageId: null as StarSimStellarEvolutionStageId | null,
  selectedStarSimObjectBindingId: null as string | null,
  selectedCosmicDistanceRungId: null as CosmicDistanceLadderRungId | null,
  selectedCosmicDistanceObjectBindingId: null as string | null,
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
      setSelectedCosmicDistanceRungId: (rungId) => set({ selectedCosmicDistanceRungId: rungId }),
      setSelectedCosmicDistanceObjectBindingId: (bindingId) =>
        set({ selectedCosmicDistanceObjectBindingId: bindingId }),
      clearCosmicDistanceObjectBinding: () =>
        set({
          selectedCosmicDistanceObjectBindingId: null,
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
        selectedCosmicDistanceRungId: state.selectedCosmicDistanceRungId,
        selectedCosmicDistanceObjectBindingId: state.selectedCosmicDistanceObjectBindingId,
      }),
    },
  ),
);
