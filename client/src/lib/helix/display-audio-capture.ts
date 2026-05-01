import { transcribeVoice, type VoiceTranscribeResponse } from "@/lib/agi/api";
import type { HelixSituationEvent, HelixSituationSource } from "./situation-room";

export type DisplayAudioTranscribe = typeof transcribeVoice;

export type DisplayAudioSituationSessionOptions = {
  roomId: string;
  missionId?: string;
  threadId?: string;
  captureSessionId?: string;
  chunkMs?: number;
  onEvent: (event: HelixSituationEvent) => void;
  onError?: (error: Error) => void;
  isDottiePlaybackActive?: () => boolean;
  transcribe?: DisplayAudioTranscribe;
};

export type DisplayAudioSituationSession = {
  captureSessionId: string;
  source: HelixSituationSource;
  stream: MediaStream;
  recorder: MediaRecorder;
  stop: () => void;
};

type DisplayTrackSettings = MediaTrackSettings & {
  displaySurface?: string;
};

const createCaptureSessionId = (): string => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `capture:${Date.now()}:${random}`;
};

export const inferDisplayAudioSource = (stream: MediaStream): HelixSituationSource => {
  const settings = stream.getVideoTracks()[0]?.getSettings?.() as DisplayTrackSettings | undefined;
  const displaySurface = settings?.displaySurface?.toLowerCase();
  if (displaySurface === "browser") return "display_tab_audio";
  if (displaySurface === "window" || displaySurface === "application") return "display_window_audio";
  return "display_screen_audio";
};

const pickDisplayAudioMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
};

const stopStreamTracks = (stream: MediaStream): void => {
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

const buildTranscriptEvent = (args: {
  roomId: string;
  missionId?: string;
  threadId?: string;
  captureSessionId: string;
  chunkIndex: number;
  source: HelixSituationSource;
  result: VoiceTranscribeResponse;
  possibleTtsEcho: boolean;
}): HelixSituationEvent | null => {
  const text = args.result.text?.trim() ?? "";
  if (!text) return null;
  return {
    id: `situation:${args.captureSessionId}:${args.chunkIndex}`,
    room_id: args.roomId,
    mission_id: args.missionId,
    thread_id: args.threadId,
    source: args.source,
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
      engine: args.result.engine ?? null,
      possible_tts_echo: args.possibleTtsEcho,
    },
  };
};

export async function startDisplayAudioSituationSession(
  options: DisplayAudioSituationSessionOptions,
): Promise<DisplayAudioSituationSession> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Display audio capture unavailable.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Browser recording unsupported.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints,
  });

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stopStreamTracks(stream);
    throw new Error("Selected source did not provide an audio track.");
  }

  const captureSessionId = options.captureSessionId?.trim() || createCaptureSessionId();
  const source = inferDisplayAudioSource(stream);
  const audioOnlyStream = new MediaStream(audioTracks);
  const mimeType = pickDisplayAudioMimeType();
  const recorder = mimeType ? new MediaRecorder(audioOnlyStream, { mimeType }) : new MediaRecorder(audioOnlyStream);
  const transcribe = options.transcribe ?? transcribeVoice;
  const chunkMs = Math.max(1000, Math.round(options.chunkMs ?? 5000));

  let chunkIndex = 0;
  let lastChunkStartedAt = Date.now();
  let stopped = false;

  recorder.ondataavailable = (event) => {
    if (stopped || !event.data || event.data.size <= 0) return;
    const currentChunkIndex = chunkIndex;
    chunkIndex += 1;
    const now = Date.now();
    const durationMs = Math.max(0, now - lastChunkStartedAt);
    lastChunkStartedAt = now;

    void transcribe({
      audio: event.data,
      room_id: options.roomId,
      mission_id: options.missionId,
      missionId: options.missionId,
      thread_id: options.threadId,
      capture_session_id: captureSessionId,
      chunk_index: currentChunkIndex,
      capture_source: source as Exclude<HelixSituationSource, "minecraft_server" | "discord_browser" | "screen_share" | "helix_ask">,
      command_lane_enabled: false,
      durationMs,
    })
      .then((result) => {
        const situationEvent = buildTranscriptEvent({
          roomId: options.roomId,
          missionId: options.missionId,
          threadId: options.threadId,
          captureSessionId,
          chunkIndex: currentChunkIndex,
          source,
          result,
          possibleTtsEcho: options.isDottiePlaybackActive?.() === true,
        });
        if (situationEvent) {
          options.onEvent(situationEvent);
        }
      })
      .catch((error) => {
        options.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
  };

  recorder.onerror = (event) => {
    const error = (event as unknown as { error?: Error }).error ?? new Error("Display audio recorder failed.");
    options.onError?.(error);
  };

  recorder.start(chunkMs);

  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch {
      // Recorder may already be stopped by the browser.
    }
    stopStreamTracks(stream);
  };

  for (const track of stream.getTracks()) {
    track.addEventListener?.("ended", stop, { once: true });
  }

  return {
    captureSessionId,
    source,
    stream,
    recorder,
    stop,
  };
}

