import { transcribeVoice, type VoiceTranscribeResponse } from "@/lib/agi/api";
import type { HelixSituationEvent } from "./situation-room";

export type MicAudioSituationSessionOptions = {
  roomId: string;
  missionId?: string;
  threadId?: string;
  captureSessionId?: string;
  chunkMs?: number;
  onEvent: (event: HelixSituationEvent) => void;
  onError?: (error: Error) => void;
  onStop?: (reason: "manual" | "track_ended") => void;
  transcribe?: typeof transcribeVoice;
};

export type MicAudioSituationSession = {
  captureSessionId: string;
  source: "mic";
  stream: MediaStream;
  recorder: MediaRecorder;
  stop: () => void;
};

type Timer = ReturnType<typeof setTimeout>;

const createCaptureSessionId = (): string => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `capture:${Date.now()}:${random}`;
};

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  );
};

const stopTracks = (stream: MediaStream): void => {
  for (const track of stream.getTracks()) track.stop();
};

const buildTranscriptEvent = (args: {
  roomId: string;
  missionId?: string;
  threadId?: string;
  captureSessionId: string;
  chunkIndex: number;
  result: VoiceTranscribeResponse;
}): HelixSituationEvent | null => {
  const text = args.result.text?.trim() ?? "";
  if (!text) return null;
  return {
    id: `situation:${args.captureSessionId}:${args.chunkIndex}`,
    room_id: args.roomId,
    mission_id: args.missionId,
    thread_id: args.threadId,
    source: "mic",
    event_type: "voice_transcript",
    text,
    classification: "info",
    evidence_refs: [`voice:transcribe:${args.captureSessionId}:${args.chunkIndex}`],
    capture_session_id: args.captureSessionId,
    chunk_index: args.chunkIndex,
    ts: new Date().toISOString(),
    meta: {
      confidence: typeof args.result.confidence === "number" ? args.result.confidence : null,
      language: args.result.language_detected ?? args.result.source_language ?? args.result.language ?? null,
      source_language: args.result.source_language ?? args.result.language_detected ?? null,
      source_text: args.result.source_text ?? null,
      translated: args.result.translated === true,
      engine: args.result.engine ?? null,
      capture_source: "mic",
      command_lane_enabled: false,
    },
  };
};

export async function startMicAudioSituationSession(
  options: MicAudioSituationSessionOptions,
): Promise<MicAudioSituationSession> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture unavailable.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Browser recording unsupported.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    } as MediaTrackConstraints,
  });
  const captureSessionId = options.captureSessionId?.trim() || createCaptureSessionId();
  const mimeType = pickMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const transcribe = options.transcribe ?? transcribeVoice;
  const chunkMs = Math.max(1000, Math.round(options.chunkMs ?? 5000));
  const bufferedChunks: Blob[] = [];
  let chunkIndex = 0;
  let stopped = false;
  let segmentStartedAt = Date.now();
  let flushTimer: Timer | null = null;
  let segmentTimer: Timer | null = null;

  const flushSegment = (): void => {
    if (stopped) return;
    try {
      if (recorder.state !== "inactive") recorder.requestData();
    } catch {
      // Buffered chunks are still uploaded on the timer where supported.
    }
    if (flushTimer !== null) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      if (stopped || bufferedChunks.length === 0) return;
      const chunks = bufferedChunks.splice(0, bufferedChunks.length).filter((chunk) => chunk.size > 0);
      if (chunks.length === 0) return;
      const uploadMimeType = recorder.mimeType || chunks[0]?.type || mimeType || "audio/webm";
      const audio = new Blob(chunks, { type: uploadMimeType });
      const now = Date.now();
      const durationMs = Math.max(0, now - segmentStartedAt);
      segmentStartedAt = now;
      const currentChunk = chunkIndex;
      chunkIndex += 1;
      void transcribe({
        audio,
        room_id: options.roomId,
        mission_id: options.missionId,
        missionId: options.missionId,
        thread_id: options.threadId,
        capture_session_id: captureSessionId,
        chunk_index: currentChunk,
        capture_source: "mic",
        command_lane_enabled: false,
        durationMs,
      })
        .then((result) => {
          const event = buildTranscriptEvent({
            roomId: options.roomId,
            missionId: options.missionId,
            threadId: options.threadId,
            captureSessionId,
            chunkIndex: currentChunk,
            result,
          });
          if (event) options.onEvent(event);
        })
        .catch((error: unknown) => {
          options.onError?.(error instanceof Error ? error : new Error(String(error)));
        });
    }, 90);
  };

  recorder.ondataavailable = (event: BlobEvent) => {
    if (!stopped && event.data?.size > 0) bufferedChunks.push(event.data);
  };
  recorder.onerror = (event: Event) => {
    options.onError?.((event as unknown as { error?: Error }).error ?? new Error("Microphone recorder failed."));
  };
  recorder.start(250);
  segmentTimer = setInterval(flushSegment, chunkMs);

  const stop = (reason: "manual" | "track_ended" = "manual"): void => {
    if (stopped) return;
    stopped = true;
    if (segmentTimer !== null) clearInterval(segmentTimer);
    if (flushTimer !== null) clearTimeout(flushTimer);
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      // Recorder may already be stopped by the browser.
    }
    stopTracks(stream);
    options.onStop?.(reason);
  };

  for (const track of stream.getTracks()) track.addEventListener?.("ended", () => stop("track_ended"), { once: true });
  return { captureSessionId, source: "mic", stream, recorder, stop };
}
