import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HelixSharedRealtimeRoomVisualFrame,
  HelixSharedRealtimeRoomVisualSourceSurface,
} from "@shared/helix-shared-realtime-room";
import {
  useVisualSourceCaptureStore,
  type VisualSourceCaptureFrameHistoryItem,
  type VisualSourceCaptureState,
} from "@/store/useVisualSourceCaptureStore";
import type { HelixSharedLiveRoomApi } from "./SharedLiveRoomApi";

const LOCAL_FRAME_MAX_AGE_MS = 30_000;
const LOCAL_FRAME_MAX_UPLOAD_ATTEMPTS = 2;
const LOCAL_FRAME_RETRY_DELAY_MS = 1_250;

export type HelixSharedLiveRoomFrameUploadState = {
  status: "idle" | "uploading" | "sent" | "error";
  sourceId: string | null;
  historyId: string | null;
  observedAt: string | null;
  error: string | null;
};

const initialFrameUploadState = (): HelixSharedLiveRoomFrameUploadState => ({
  status: "idle",
  sourceId: null,
  historyId: null,
  observedAt: null,
  error: null,
});

const safeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message.trim().slice(0, 360);
  return "Shared Live Room frame upload failed.";
};

const isRecentFrame = (frame: VisualSourceCaptureFrameHistoryItem): boolean => {
  const capturedAt = Date.parse(frame.captured_at);
  return Number.isFinite(capturedAt) && Date.now() - capturedAt <= LOCAL_FRAME_MAX_AGE_MS;
};

const isRoomFrameCandidate = (
  producer: VisualSourceCaptureState,
  frame: VisualSourceCaptureFrameHistoryItem,
): boolean => {
  const activeStream = producer.stream_active && producer.track_ready_state === "live";
  const explicitManualCarouselFrame =
    producer.capture_mode === "manual" &&
    (frame.source_kind === "image_lens_crop" || frame.source_kind === "full_frame");
  return (activeStream || explicitManualCarouselFrame) &&
    frame.preview_data_url.startsWith("data:image/") &&
    isRecentFrame(frame);
};

const latestLocalFrameCandidates = (
  producers: Record<string, VisualSourceCaptureState>,
): Array<{ producer: VisualSourceCaptureState; frame: VisualSourceCaptureFrameHistoryItem }> =>
  Object.values(producers)
    .map((producer) => ({ producer, frame: producer.frame_history?.at(-1) ?? null }))
    .filter((candidate): candidate is {
      producer: VisualSourceCaptureState;
      frame: VisualSourceCaptureFrameHistoryItem;
    } => Boolean(candidate.frame && isRoomFrameCandidate(candidate.producer, candidate.frame)))
    .sort((left, right) => Date.parse(left.frame.captured_at) - Date.parse(right.frame.captured_at));

export const mapCaptureFrameToRoomSurface = (
  frame: VisualSourceCaptureFrameHistoryItem,
  sourceId: string,
): HelixSharedRealtimeRoomVisualSourceSurface => {
  switch (frame.source_surface) {
    case "camera":
      return "device_camera";
    case "browser_tab":
      return "browser_tab";
    case "window":
      return "desktop_window";
    case "screen":
      return "screen_share_window";
    case "document":
    case "image_lens":
    case "game":
    case "app":
    case "terminal":
    case "file_manager":
    case "calculator":
    case "simulation":
    case "unknown":
      return "manual_upload";
  }
  if (frame.source_kind === "image_lens_crop" || frame.source_kind === "full_frame") {
    return "manual_upload";
  }
  return /camera/i.test(sourceId) ? "device_camera" : "screen_share_window";
};

export function useSharedLiveRoomVisualIngress(input: {
  api: HelixSharedLiveRoomApi;
  roomId: string | null;
  enabled: boolean;
  onFrames(frames: HelixSharedRealtimeRoomVisualFrame[]): void;
}): {
  frameUpload: HelixSharedLiveRoomFrameUploadState;
  resetVisualIngress(): void;
} {
  const [frameUpload, setFrameUpload] = useState(initialFrameUploadState);
  const uploadedFrameKeysRef = useRef(new Set<string>());
  const inFlightFrameKeysRef = useRef(new Set<string>());
  const frameUploadAttemptsRef = useRef(new Map<string, number>());
  const frameSequenceRef = useRef(0);

  const resetVisualIngress = useCallback((): void => {
    setFrameUpload(initialFrameUploadState());
    uploadedFrameKeysRef.current.clear();
    inFlightFrameKeysRef.current.clear();
    frameUploadAttemptsRef.current.clear();
    frameSequenceRef.current = 0;
  }, []);

  useEffect(() => {
    if (!input.roomId || !input.enabled) return;
    const roomId = input.roomId;
    let disposed = false;
    const retryTimers = new Set<number>();
    const uploadCandidates = (
      state: ReturnType<typeof useVisualSourceCaptureStore.getState>,
    ): void => {
      for (const { producer, frame } of latestLocalFrameCandidates(state.producers)) {
        const frameKey = `${roomId}:${producer.source_id}:${frame.history_id}`;
        const priorAttempts = frameUploadAttemptsRef.current.get(frameKey) ?? 0;
        if (
          uploadedFrameKeysRef.current.has(frameKey) ||
          inFlightFrameKeysRef.current.has(frameKey) ||
          priorAttempts >= LOCAL_FRAME_MAX_UPLOAD_ATTEMPTS
        ) continue;

        inFlightFrameKeysRef.current.add(frameKey);
        frameUploadAttemptsRef.current.set(frameKey, priorAttempts + 1);
        frameSequenceRef.current += 1;
        const sequence = frameSequenceRef.current;
        setFrameUpload({
          status: "uploading",
          sourceId: producer.source_id,
          historyId: frame.history_id,
          observedAt: new Date().toISOString(),
          error: null,
        });
        void input.api.uploadVisualFrame(roomId, {
          source_id: producer.source_id,
          source_surface: mapCaptureFrameToRoomSurface(frame, producer.source_id),
          captured_at: frame.captured_at,
          sequence,
          image_data_url: frame.preview_data_url,
          image_hash: frame.preview_hash ?? frame.history_id,
          preview_hash: frame.preview_hash,
          preview_data_url: frame.preview_data_url,
        })
          .then(async () => input.api.listVisualFrames(roomId))
          .then((frames) => {
            if (disposed) return;
            uploadedFrameKeysRef.current.add(frameKey);
            frameUploadAttemptsRef.current.delete(frameKey);
            input.onFrames(frames);
            setFrameUpload({
              status: "sent",
              sourceId: producer.source_id,
              historyId: frame.history_id,
              observedAt: new Date().toISOString(),
              error: null,
            });
          })
          .catch((error) => {
            if (disposed) return;
            setFrameUpload({
              status: "error",
              sourceId: producer.source_id,
              historyId: frame.history_id,
              observedAt: new Date().toISOString(),
              error: safeErrorMessage(error),
            });
            if ((frameUploadAttemptsRef.current.get(frameKey) ?? 0) < LOCAL_FRAME_MAX_UPLOAD_ATTEMPTS) {
              const retryTimer = window.setTimeout(() => {
                retryTimers.delete(retryTimer);
                if (!disposed) uploadCandidates(useVisualSourceCaptureStore.getState());
              }, LOCAL_FRAME_RETRY_DELAY_MS);
              retryTimers.add(retryTimer);
            }
          })
          .finally(() => {
            inFlightFrameKeysRef.current.delete(frameKey);
            if (uploadedFrameKeysRef.current.size > 256) {
              uploadedFrameKeysRef.current = new Set(
                [...uploadedFrameKeysRef.current].slice(-128),
              );
            }
          });
      }
    };

    uploadCandidates(useVisualSourceCaptureStore.getState());
    const unsubscribe = useVisualSourceCaptureStore.subscribe(uploadCandidates);
    return () => {
      disposed = true;
      unsubscribe();
      retryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [input.api, input.enabled, input.onFrames, input.roomId]);

  return { frameUpload, resetVisualIngress };
}
