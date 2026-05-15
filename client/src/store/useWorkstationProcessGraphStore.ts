import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyWorkstationProcessGraphEvent,
  buildWorkstationProcessGraphSnapshot,
  createInitialWorkstationProcessGraphState,
} from "@/lib/workstation/processGraph/processGraphReducer";
import type {
  WorkstationProcessEdge,
  WorkstationProcessGraphEvent,
  WorkstationProcessGraphSnapshotArtifact,
  WorkstationProcessGraphState,
  WorkstationProcessNode,
} from "@/lib/workstation/processGraph/processGraphTypes";

const STORAGE_KEY = "workstation-process-graph:v1";

type WorkstationProcessGraphStore = {
  graph: WorkstationProcessGraphState;
  dispatch: (event: WorkstationProcessGraphEvent) => void;
  focusNode: (nodeId?: string) => void;
  filterView: (filter?: string) => void;
  clearHistorical: () => void;
  reset: () => void;
  getSnapshotArtifact: (options?: {
    maxNodes?: number;
    includeTimeline?: boolean;
    includeArtifacts?: boolean;
  }) => WorkstationProcessGraphSnapshotArtifact;
};

export const useWorkstationProcessGraphStore = create<WorkstationProcessGraphStore>()(
  persist(
    (set, get) => ({
      graph: createInitialWorkstationProcessGraphState(),
      dispatch: (event) =>
        set((state) => ({
          graph: applyWorkstationProcessGraphEvent(state.graph, event),
        })),
      focusNode: (nodeId) =>
        set((state) => ({
          graph: {
            ...state.graph,
            revision: state.graph.revision + 1,
            view: {
              ...state.graph.view,
              focusedNodeId: nodeId,
            },
          },
        })),
      filterView: (filter) =>
        set((state) => ({
          graph: {
            ...state.graph,
            revision: state.graph.revision + 1,
            view: {
              ...state.graph.view,
              filter: filter?.trim() || undefined,
            },
          },
        })),
      clearHistorical: () =>
        set((state) => {
          const cutoffMs = Date.now() - 5 * 60 * 1000;
          const keepNodes: Record<string, WorkstationProcessNode> = Object.fromEntries(
            Object.entries(state.graph.nodes).filter(([, node]) => {
              if (node.kind === "workspace" || node.kind === "helix_ask") return true;
              if (node.status === "active" || node.status === "running" || node.status === "pending") return true;
              return Date.parse(node.updatedAt) >= cutoffMs;
            }),
          );
          const keepEdges: Record<string, WorkstationProcessEdge> = Object.fromEntries(
            Object.entries(state.graph.edges).filter(([, edge]) => keepNodes[edge.from] && keepNodes[edge.to]),
          );
          return {
            graph: {
              ...state.graph,
              revision: state.graph.revision + 1,
              updatedAt: new Date().toISOString(),
              nodes: keepNodes,
              edges: keepEdges,
            },
          };
        }),
      reset: () => set({ graph: createInitialWorkstationProcessGraphState() }),
      getSnapshotArtifact: (options) => buildWorkstationProcessGraphSnapshot(get().graph, options),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ graph: state.graph }),
    },
  ),
);

export function recordWorkstationProcessGraphEvent(event: WorkstationProcessGraphEvent): void {
  useWorkstationProcessGraphStore.getState().dispatch(event);
}
