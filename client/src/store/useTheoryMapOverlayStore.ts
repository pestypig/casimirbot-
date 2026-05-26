import { create } from "zustand";
import type {
  TheoryBadgeLocatorArtifactV1,
  TheoryBadgeLocatorSource,
} from "@shared/contracts/theory-badge-locator.v1";

type TheoryMapOverlaySource =
  | TheoryBadgeLocatorSource
  | "manual_click"
  | "multi_select"
  | "none";

type TheoryMapOverlayState = {
  source: TheoryMapOverlaySource;
  query: string | null;
  centerBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  selectedBadgeIds: string[];
  heatByBadgeId: Record<string, number>;
  rippleBadgeIds: string[];
  playbackBadgeIds: string[];
  solvedBadgeIds: string[];
  skippedBadgeIds: string[];
  failedBadgeIds: string[];
  claimBoundaryNotes: string[];
  recommendedActions: TheoryBadgeLocatorArtifactV1["recommendedActions"];
  updatedAt: string | null;
  lastLocatorArtifact: TheoryBadgeLocatorArtifactV1 | null;
  setLocatorOverlay: (artifact: TheoryBadgeLocatorArtifactV1) => void;
  setSelectionOverlay: (args: {
    selectedBadgeIds: string[];
    highlightedBadgeIds: string[];
    highlightedEdgeIds: string[];
    claimBoundaryNotes?: string[];
  }) => void;
  clearOverlay: () => void;
};

const emptyOverlay = {
  source: "none" as const,
  query: null,
  centerBadgeIds: [] as string[],
  highlightedBadgeIds: [] as string[],
  highlightedEdgeIds: [] as string[],
  selectedBadgeIds: [] as string[],
  heatByBadgeId: {} as Record<string, number>,
  rippleBadgeIds: [] as string[],
  playbackBadgeIds: [] as string[],
  solvedBadgeIds: [] as string[],
  skippedBadgeIds: [] as string[],
  failedBadgeIds: [] as string[],
  claimBoundaryNotes: [] as string[],
  recommendedActions: [] as TheoryBadgeLocatorArtifactV1["recommendedActions"],
  updatedAt: null,
  lastLocatorArtifact: null,
};

export const useTheoryMapOverlayStore = create<TheoryMapOverlayState>()((set) => ({
  ...emptyOverlay,
  setLocatorOverlay: (artifact) =>
    set({
      source: artifact.input.source,
      query: artifact.input.query ?? artifact.input.expression,
      centerBadgeIds: artifact.overlay.centerBadgeIds,
      highlightedBadgeIds: artifact.overlay.highlightedBadgeIds,
      highlightedEdgeIds: artifact.overlay.highlightedEdgeIds,
      rippleBadgeIds: artifact.overlay.rippleBadgeIds,
      heatByBadgeId: artifact.overlay.heatByBadgeId,
      selectedBadgeIds: artifact.overlay.centerBadgeIds,
      claimBoundaryNotes: artifact.claimBoundaryNotes,
      recommendedActions: artifact.recommendedActions,
      updatedAt: new Date().toISOString(),
      lastLocatorArtifact: artifact,
    }),
  setSelectionOverlay: (args) =>
    set({
      source: "multi_select",
      query: null,
      selectedBadgeIds: args.selectedBadgeIds,
      highlightedBadgeIds: args.highlightedBadgeIds,
      highlightedEdgeIds: args.highlightedEdgeIds,
      rippleBadgeIds: args.selectedBadgeIds,
      heatByBadgeId: {},
      claimBoundaryNotes: args.claimBoundaryNotes ?? [],
      recommendedActions: [],
      updatedAt: new Date().toISOString(),
    }),
  clearOverlay: () => set(emptyOverlay),
}));
