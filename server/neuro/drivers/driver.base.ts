import type { NeuroFrame, NeuroMarker } from "../schemas/neuro.schemas.js";

export type NeuroFrameListener = (frame: NeuroFrame) => void;
export type NeuroMarkerListener = (marker: NeuroMarker) => void;

export interface NeuroDriver {
  id: string;
  kind: "sim" | "hardware";
  start(): Promise<void>;
  stop(): Promise<void>;
  onFrame(cb: NeuroFrameListener): () => void;
  onMarker?(cb: NeuroMarkerListener): () => void;
}
