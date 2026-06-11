import { create } from "zustand";

export type VisualSourceCaptureFrameHistoryItem = {
  history_id: string;
  source_id: string;
  frame_id: string | null;
  evidence_id: string | null;
  captured_at: string;
  preview_data_url: string;
  preview_hash: string | null;
  summary: string;
  visual_observer_profile_id?: string | null;
  visual_observer_profile_title?: string | null;
  visual_prompt_hash?: string | null;
  expires_at: string;
};

export type VisualSourceCaptureState = {
  source_id: string;
  thread_id: string;
  producer_id?: string | null;
  environment_id?: string | null;
  pipeline_id?: string | null;
  stream_active: boolean;
  interval_active?: boolean;
  track_ready_state: "live" | "ended";
  capture_mode: "manual" | "interval" | "salience_triggered";
  cadence_ms: number | null;
  last_frame_at?: string | null;
  last_heartbeat_at?: string | null;
  next_capture_due_at?: string | null;
  pending_analysis_job_id?: string | null;
  scheduler_adoption_id?: string | null;
  scheduler_adoption_status?: "adopted" | "waiting_for_stream" | "waiting_for_environment" | "paused" | "stopped" | "error" | null;
  capture_count?: number;
  post_count?: number;
  last_frame_hash?: string | null;
  last_frame_preview_data_url?: string | null;
  frame_history?: VisualSourceCaptureFrameHistoryItem[];
  last_chunk_id?: string | null;
  last_error?: string | null;
};

type VisualSourceCaptureStore = {
  producers: Record<string, VisualSourceCaptureState>;
  upsertProducer: (state: VisualSourceCaptureState) => void;
  patchProducer: (sourceId: string, patch: Partial<VisualSourceCaptureState>) => void;
  removeProducer: (sourceId: string) => void;
};

export const useVisualSourceCaptureStore = create<VisualSourceCaptureStore>((set: (updater: (current: VisualSourceCaptureStore) => Partial<VisualSourceCaptureStore>) => void) => ({
  producers: {},
  upsertProducer: (state: VisualSourceCaptureState) =>
    set((current: VisualSourceCaptureStore) => {
      const existing = current.producers[state.source_id];
      const hasLastFrameHash = Object.prototype.hasOwnProperty.call(state, "last_frame_hash");
      const hasLastFramePreview = Object.prototype.hasOwnProperty.call(state, "last_frame_preview_data_url");
      const hasFrameHistory = Object.prototype.hasOwnProperty.call(state, "frame_history");
      return {
        producers: {
          ...current.producers,
          [state.source_id]: {
            ...existing,
            ...state,
            last_frame_hash: hasLastFrameHash ? state.last_frame_hash ?? null : existing?.last_frame_hash ?? null,
            last_frame_preview_data_url: hasLastFramePreview
              ? state.last_frame_preview_data_url ?? null
              : existing?.last_frame_preview_data_url ?? null,
            frame_history: hasFrameHistory ? state.frame_history : existing?.frame_history,
          },
        },
      };
    }),
  patchProducer: (sourceId: string, patch: Partial<VisualSourceCaptureState>) =>
    set((current: VisualSourceCaptureStore) => {
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
  removeProducer: (sourceId: string) =>
    set((current: VisualSourceCaptureStore) => {
      const next = { ...current.producers };
      delete next[sourceId];
      return { producers: next };
    }),
}));
