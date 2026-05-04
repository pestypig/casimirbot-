import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const WORKSTATION_SESSION_MEMORY_KEY = "workstation-session-memory:v1";

export type WorkstationScrollMemory = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  updatedAtMs: number;
};

export type WorkstationDraftMemory = {
  text: string;
  updatedAtMs: number;
};

type WorkstationSessionMemoryState = {
  panelScroll: Record<string, WorkstationScrollMemory>;
  drafts: Record<string, WorkstationDraftMemory>;
  rememberPanelScroll: (
    key: string,
    scroll: Omit<WorkstationScrollMemory, "updatedAtMs">,
  ) => void;
  readPanelScroll: (key: string) => WorkstationScrollMemory | null;
  rememberDraft: (key: string, text: string) => void;
  readDraft: (key: string) => string;
  clearDraft: (key: string) => void;
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

function normalizeKey(key: string): string {
  return key.trim();
}

export const useWorkstationSessionMemoryStore = create<WorkstationSessionMemoryState>()(
  persist(
    (set, get) => ({
      panelScroll: {},
      drafts: {},
      rememberPanelScroll: (key, scroll) => {
        const normalizedKey = normalizeKey(key);
        if (!normalizedKey) return;
        set((state) => ({
          panelScroll: {
            ...state.panelScroll,
            [normalizedKey]: {
              scrollTop: Math.max(0, Math.round(scroll.scrollTop)),
              scrollHeight: Math.max(0, Math.round(scroll.scrollHeight)),
              clientHeight: Math.max(0, Math.round(scroll.clientHeight)),
              updatedAtMs: Date.now(),
            },
          },
        }));
      },
      readPanelScroll: (key) => {
        const normalizedKey = normalizeKey(key);
        if (!normalizedKey) return null;
        return get().panelScroll[normalizedKey] ?? null;
      },
      rememberDraft: (key, text) => {
        const normalizedKey = normalizeKey(key);
        if (!normalizedKey) return;
        set((state) => ({
          drafts: {
            ...state.drafts,
            [normalizedKey]: {
              text,
              updatedAtMs: Date.now(),
            },
          },
        }));
      },
      readDraft: (key) => {
        const normalizedKey = normalizeKey(key);
        if (!normalizedKey) return "";
        return get().drafts[normalizedKey]?.text ?? "";
      },
      clearDraft: (key) => {
        const normalizedKey = normalizeKey(key);
        if (!normalizedKey) return;
        set((state) => {
          if (!state.drafts[normalizedKey]) return state;
          const drafts = { ...state.drafts };
          delete drafts[normalizedKey];
          return { drafts };
        });
      },
    }),
    {
      name: WORKSTATION_SESSION_MEMORY_KEY,
      storage: createJSONStorage(resolveSessionStorage),
      partialize: (state) => ({
        panelScroll: state.panelScroll,
        drafts: state.drafts,
      }),
    },
  ),
);
