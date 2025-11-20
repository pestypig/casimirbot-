import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  normalizeDocPath,
  type DocViewerIntent,
} from "@/lib/docs/docViewer";

const MAX_RECENT = 8;

type DocViewerState = {
  mode: "directory" | "doc";
  currentPath?: string;
  anchor?: string;
  recent: string[];
  viewDirectory: () => void;
  viewDoc: (path: string, anchor?: string) => void;
  applyIntent: (intent: DocViewerIntent) => void;
};

export const useDocViewerStore = create<DocViewerState>()(
  persist(
    (set, get) => ({
      mode: "directory",
      currentPath: undefined,
      anchor: undefined,
      recent: [],
      viewDirectory: () =>
        set({
          mode: "directory",
          anchor: undefined,
        }),
      viewDoc: (path, anchor) => {
        const normalized = normalizeDocPath(path);
        set((state) => ({
          mode: "doc",
          currentPath: normalized,
          anchor: anchor ?? undefined,
          recent: updateRecent(state.recent, normalized),
        }));
      },
      applyIntent: (intent) => {
        if (intent.mode === "directory") {
          set({ mode: "directory", anchor: undefined });
        } else {
          get().viewDoc(intent.path, intent.anchor);
        }
      },
    }),
    {
      name: "doc-viewer:v1",
      partialize: (state) => ({
        mode: state.mode,
        currentPath: state.currentPath,
        recent: state.recent,
      }),
    },
  ),
);

function updateRecent(recent: string[], candidate: string) {
  const deduped = [candidate, ...recent.filter((entry) => entry !== candidate)];
  return deduped.slice(0, MAX_RECENT);
}
