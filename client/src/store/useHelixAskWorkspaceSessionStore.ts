import { createWithEqualityFn } from "zustand/traditional";
import { persist } from "zustand/middleware";
import type { WorkstationLayoutSnapshot } from "@/store/useWorkstationLayoutStore";

type HelixAskWorkspaceSessionState = {
  layoutSnapshots: Record<string, WorkstationLayoutSnapshot>;
  saveLayoutSnapshot: (sessionId: string, snapshot: WorkstationLayoutSnapshot) => void;
  readLayoutSnapshot: (sessionId: string) => WorkstationLayoutSnapshot | null;
};

const STORAGE_KEY = "helix-ask-workspace-sessions-v1";

export const useHelixAskWorkspaceSessionStore = createWithEqualityFn<HelixAskWorkspaceSessionState>()(
  persist(
    (set, get) => ({
      layoutSnapshots: {},
      saveLayoutSnapshot: (sessionId, snapshot) => {
        const key = sessionId.trim();
        if (!key) return;
        set((state) => ({
          layoutSnapshots: {
            ...state.layoutSnapshots,
            [key]: snapshot,
          },
        }));
      },
      readLayoutSnapshot: (sessionId) => {
        const key = sessionId.trim();
        if (!key) return null;
        return get().layoutSnapshots[key] ?? null;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        layoutSnapshots: state.layoutSnapshots,
      }),
    },
  ),
);
