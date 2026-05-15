import { create } from "zustand";

export type VisualSourceCaptureState = {
  source_id: string;
  thread_id: string;
  stream_active: boolean;
  track_ready_state: "live" | "ended";
  capture_mode: "manual" | "interval" | "salience_triggered";
  cadence_ms: number | null;
  last_frame_at?: string | null;
  last_heartbeat_at?: string | null;
};

type VisualSourceCaptureStore = {
  producers: Record<string, VisualSourceCaptureState>;
  upsertProducer: (state: VisualSourceCaptureState) => void;
  patchProducer: (sourceId: string, patch: Partial<VisualSourceCaptureState>) => void;
  removeProducer: (sourceId: string) => void;
};

export const useVisualSourceCaptureStore = create<VisualSourceCaptureStore>((set) => ({
  producers: {},
  upsertProducer: (state) =>
    set((current) => ({
      producers: {
        ...current.producers,
        [state.source_id]: state,
      },
    })),
  patchProducer: (sourceId, patch) =>
    set((current) => {
      const existing = current.producers[sourceId];
      if (!existing) return current;
      return {
        producers: {
          ...current.producers,
          [sourceId]: {
            ...existing,
            ...patch,
          },
        },
      };
    }),
  removeProducer: (sourceId) =>
    set((current) => {
      const next = { ...current.producers };
      delete next[sourceId];
      return { producers: next };
    }),
}));
