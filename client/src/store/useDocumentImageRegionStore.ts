import { create } from "zustand";
import type { StateCreator } from "zustand";
import type {
  DocumentImageBboxPxV1,
  DocumentImageExtractionStatusV1,
  DocumentImageRegionReceiptV1,
  DocumentImageSourceKindV1,
} from "@shared/contracts/document-image-region-receipt.v1";

const MAX_DOCUMENT_IMAGE_RECEIPTS = 40;

export type DocumentImageSourceState = {
  sourceImageUrl: string;
  sourceAttachmentId: string;
  sourceKind: DocumentImageSourceKindV1;
  pageNumber: number | null;
};

export type DocumentImageRegionState = {
  source: DocumentImageSourceState | null;
  naturalSize: { width: number; height: number } | null;
  cropDraft: DocumentImageBboxPxV1;
  receipts: DocumentImageRegionReceiptV1[];
  lastReceipt: DocumentImageRegionReceiptV1 | null;
  setSourceImage: (source: DocumentImageSourceState) => void;
  setNaturalSize: (naturalSize: { width: number; height: number }) => void;
  setCropDraft: (cropDraft: Partial<DocumentImageBboxPxV1>) => void;
  addReceipt: (receipt: DocumentImageRegionReceiptV1) => void;
  updateReceiptStatus: (regionId: string, status: DocumentImageExtractionStatusV1) => void;
  clearReceipts: () => void;
};

const DEFAULT_CROP: DocumentImageBboxPxV1 = {
  x: 0,
  y: 0,
  width: 640,
  height: 360,
};

const creator: StateCreator<DocumentImageRegionState> = (set) => ({
  source: null,
  naturalSize: null,
  cropDraft: DEFAULT_CROP,
  receipts: [],
  lastReceipt: null,
  setSourceImage: (source: DocumentImageSourceState) =>
    set({
      source,
      naturalSize: null,
      cropDraft: DEFAULT_CROP,
    }),
  setNaturalSize: (naturalSize: { width: number; height: number }) =>
    set((state: DocumentImageRegionState) => ({
      naturalSize,
      cropDraft: {
        x: Math.max(0, Math.min(state.cropDraft.x, Math.max(0, naturalSize.width - 1))),
        y: Math.max(0, Math.min(state.cropDraft.y, Math.max(0, naturalSize.height - 1))),
        width: Math.max(1, Math.min(state.cropDraft.width, naturalSize.width)),
        height: Math.max(1, Math.min(state.cropDraft.height, naturalSize.height)),
      },
    })),
  setCropDraft: (cropDraft: Partial<DocumentImageBboxPxV1>) =>
    set((state: DocumentImageRegionState) => ({
      cropDraft: {
        ...state.cropDraft,
        ...cropDraft,
      },
    })),
  addReceipt: (receipt: DocumentImageRegionReceiptV1) =>
    set((state: DocumentImageRegionState) => ({
      lastReceipt: receipt,
      receipts: [
        receipt,
        ...state.receipts.filter((entry: DocumentImageRegionReceiptV1) => entry.crop.regionId !== receipt.crop.regionId),
      ].slice(0, MAX_DOCUMENT_IMAGE_RECEIPTS),
    })),
  updateReceiptStatus: (regionId: string, status: DocumentImageExtractionStatusV1) =>
    set((state: DocumentImageRegionState) => {
      const update = (receipt: DocumentImageRegionReceiptV1): DocumentImageRegionReceiptV1 =>
        receipt.crop.regionId === regionId
          ? { ...receipt, extraction: { ...receipt.extraction, status } }
          : receipt;
      return {
        receipts: state.receipts.map(update),
        lastReceipt: state.lastReceipt ? update(state.lastReceipt) : null,
      };
    }),
  clearReceipts: () => set({ receipts: [], lastReceipt: null }),
});

export const useDocumentImageRegionStore = create<DocumentImageRegionState>(creator);
