import { create } from "zustand";
import type {
  TheoryBadgeLocatorArtifactV1,
  TheoryBadgeLocatorSource,
} from "@shared/contracts/theory-badge-locator.v1";
import type { TheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";

type TheoryMapOverlaySource =
  | TheoryBadgeLocatorSource
  | "discussion_reflection"
  | "manual_click"
  | "multi_select"
  | "none";

type TheoryMapSoftRegion = {
  id: string;
  label: string;
  badgeIds: string[];
  confidence: number;
  tone: "green";
  meaning: "discussion_context_not_proof";
};

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
  exactBadgeIds: string[];
  likelyBadgeIds: string[];
  softRegions: TheoryMapSoftRegion[];
  claimBoundaryNotes: string[];
  recommendedActions: TheoryBadgeLocatorArtifactV1["recommendedActions"];
  updatedAt: string | null;
  lastLocatorArtifact: TheoryBadgeLocatorArtifactV1 | null;
  lastReflectionArtifact: TheoryContextReflectionV1 | null;
  setLocatorOverlay: (artifact: TheoryBadgeLocatorArtifactV1) => void;
  setReflectionOverlay: (artifact: TheoryContextReflectionV1) => void;
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
  exactBadgeIds: [] as string[],
  likelyBadgeIds: [] as string[],
  softRegions: [] as TheoryMapSoftRegion[],
  claimBoundaryNotes: [] as string[],
  recommendedActions: [] as TheoryBadgeLocatorArtifactV1["recommendedActions"],
  updatedAt: null,
  lastLocatorArtifact: null,
  lastReflectionArtifact: null,
};

function adaptReflectionActions(
  artifact: TheoryContextReflectionV1,
): TheoryBadgeLocatorArtifactV1["recommendedActions"] {
  return artifact.evidenceForAsk.recommendedNextActions.map((action) => ({
    actionId: action.actionId,
    label: action.label,
  }));
}

export const useTheoryMapOverlayStore = create<TheoryMapOverlayState>()((set) => ({
  ...emptyOverlay,
  setLocatorOverlay: (artifact) =>
    set((state) => ({
      source: artifact.input.source,
      query: artifact.input.query ?? artifact.input.expression,
      centerBadgeIds: artifact.overlay.centerBadgeIds,
      highlightedBadgeIds: artifact.overlay.highlightedBadgeIds,
      highlightedEdgeIds: artifact.overlay.highlightedEdgeIds,
      rippleBadgeIds: artifact.overlay.rippleBadgeIds,
      heatByBadgeId: artifact.overlay.heatByBadgeId,
      selectedBadgeIds: artifact.overlay.centerBadgeIds,
      exactBadgeIds: [],
      likelyBadgeIds: [],
      softRegions: [],
      claimBoundaryNotes: artifact.claimBoundaryNotes,
      recommendedActions: artifact.recommendedActions,
      updatedAt: new Date().toISOString(),
      lastLocatorArtifact: artifact,
      lastReflectionArtifact: state.lastReflectionArtifact,
    })),
  setReflectionOverlay: (artifact) =>
    set({
      source: "discussion_reflection",
      query: artifact.input.prompt,
      centerBadgeIds: artifact.overlay.centerBadgeIds,
      highlightedBadgeIds: artifact.overlay.highlightedBadgeIds,
      highlightedEdgeIds: artifact.overlay.highlightedEdgeIds,
      rippleBadgeIds: [],
      heatByBadgeId: artifact.overlay.heatByBadgeId,
      selectedBadgeIds: artifact.overlay.centerBadgeIds,
      exactBadgeIds: artifact.overlay.exactBadgeIds,
      likelyBadgeIds: artifact.overlay.likelyBadgeIds,
      softRegions: artifact.overlay.softRegion ? [artifact.overlay.softRegion] : [],
      claimBoundaryNotes: artifact.evidenceForAsk.claimBoundaries,
      recommendedActions: adaptReflectionActions(artifact),
      updatedAt: new Date().toISOString(),
      lastLocatorArtifact: null,
      lastReflectionArtifact: artifact,
    }),
  setSelectionOverlay: (args) =>
    set((state) => ({
      source: "multi_select",
      query: null,
      selectedBadgeIds: args.selectedBadgeIds,
      highlightedBadgeIds: args.highlightedBadgeIds,
      highlightedEdgeIds: args.highlightedEdgeIds,
      rippleBadgeIds: args.selectedBadgeIds,
      heatByBadgeId: {},
      exactBadgeIds: [],
      likelyBadgeIds: [],
      softRegions: [],
      claimBoundaryNotes: args.claimBoundaryNotes ?? [],
      recommendedActions: [],
      updatedAt: new Date().toISOString(),
      lastLocatorArtifact: null,
      lastReflectionArtifact: state.lastReflectionArtifact,
    })),
  clearOverlay: () => set(emptyOverlay),
}));
