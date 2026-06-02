import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildZenGraphCurrentAnswerBlockFromDebugExport,
  type ZenGraphCurrentAnswerBlock,
} from "@/lib/zen-graph/currentAnswerBlock";

const STORAGE_KEY = "zen-graph-current-answer:v1";

type ZenGraphCurrentAnswerState = {
  currentAnswerBlock: ZenGraphCurrentAnswerBlock | null;
  publishCurrentAnswerBlock: (block: ZenGraphCurrentAnswerBlock) => void;
  publishFromDebugExport: (debugExport: unknown) => ZenGraphCurrentAnswerBlock | null;
  clearCurrentAnswerBlock: () => void;
};

export const useZenGraphCurrentAnswerStore = create<ZenGraphCurrentAnswerState>()(
  persist(
    (set) => ({
      currentAnswerBlock: null,
      publishCurrentAnswerBlock: (block) => set({ currentAnswerBlock: block }),
      publishFromDebugExport: (debugExport) => {
        const block = buildZenGraphCurrentAnswerBlockFromDebugExport(debugExport);
        if (block) set({ currentAnswerBlock: block });
        return block;
      },
      clearCurrentAnswerBlock: () => set({ currentAnswerBlock: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentAnswerBlock: state.currentAnswerBlock,
      }),
    },
  ),
);

export function publishZenGraphCurrentAnswerFromDebugExport(debugExport: unknown): ZenGraphCurrentAnswerBlock | null {
  return useZenGraphCurrentAnswerStore.getState().publishFromDebugExport(debugExport);
}
