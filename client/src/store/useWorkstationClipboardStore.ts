import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recordWorkstationTimelineEntry } from "@/store/useWorkstationWorkflowTimelineStore";

const WORKSTATION_CLIPBOARD_STORAGE_KEY = "workstation-clipboard-history:v1";
const WORKSTATION_CLIPBOARD_MAX_ENTRIES = 120;

export type WorkstationClipboardDirection = "copy" | "paste" | "read" | "write";

export type WorkstationClipboardReceipt = {
  id: string;
  ts: string;
  direction: WorkstationClipboardDirection;
  text: string;
  preview: string;
  source: string;
  trace_id?: string;
  meta?: Record<string, unknown>;
};

type WorkstationClipboardState = {
  receipts: WorkstationClipboardReceipt[];
  addReceipt: (receipt: Omit<WorkstationClipboardReceipt, "id" | "ts" | "preview"> & { id?: string; ts?: string }) => void;
  clearReceipts: () => void;
};

function previewText(value: string): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  if (flat.length <= 180) return flat;
  return `${flat.slice(0, 179)}...`;
}

export const useWorkstationClipboardStore = create<WorkstationClipboardState>()(
  persist(
    (set) => ({
      receipts: [],
      addReceipt: (receipt) =>
        set((state) => {
          const normalizedText = receipt.text ?? "";
          const normalizedSource = receipt.source.trim() || "unknown";
          const complete: WorkstationClipboardReceipt = {
            id: receipt.id?.trim() || `clip:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            ts: receipt.ts?.trim() || new Date().toISOString(),
            direction: receipt.direction,
            text: normalizedText,
            preview: previewText(normalizedText),
            source: normalizedSource,
            trace_id: receipt.trace_id,
            meta: receipt.meta,
          };
          recordWorkstationTimelineEntry({
            lane: "clipboard",
            label: `${complete.direction.toUpperCase()} ${complete.preview ? `"${complete.preview}"` : "(empty)"}`,
            detail: `source=${complete.source}`,
            traceId: complete.trace_id,
            panelId: "workstation-clipboard-history",
          });
          return {
            receipts: [complete, ...state.receipts].slice(0, WORKSTATION_CLIPBOARD_MAX_ENTRIES),
          };
        }),
      clearReceipts: () => set({ receipts: [] }),
    }),
    {
      name: WORKSTATION_CLIPBOARD_STORAGE_KEY,
      partialize: (state) => ({ receipts: state.receipts }),
    },
  ),
);
