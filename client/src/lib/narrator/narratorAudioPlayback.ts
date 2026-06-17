import type { VoiceSpeakResponse } from "@/lib/agi/api";

let activeNarratorAudio: HTMLAudioElement | null = null;
let activeNarratorAudioUrl: string | null = null;

export type NarratorPlaybackStage =
  | "json_response"
  | "audio_response"
  | "play_requested"
  | "play_resolved"
  | "playing"
  | "timeupdate"
  | "ended"
  | "error"
  | "aborted";

export type NarratorPlaybackDiagnostic = {
  schema: "helix.narrator_playback_diagnostic.v1";
  stage: NarratorPlaybackStage;
  startedAtMs: number;
  updatedAtMs: number;
  provider: string | null;
  profile: string | null;
  mimeType: string | null;
  audioBytes: number | null;
  playResolved: boolean;
  playingObserved: boolean;
  endedObserved: boolean;
  timeupdateCount: number;
  maxCurrentTime: number;
  duration: number | null;
  muted: boolean | null;
  volume: number | null;
  paused: boolean | null;
  readyState: number | null;
  networkState: number | null;
  mediaErrorCode: number | null;
  errorMessage: string | null;
};

export class NarratorPlaybackError extends Error {
  diagnostic: NarratorPlaybackDiagnostic;

  constructor(message: string, diagnostic: NarratorPlaybackDiagnostic) {
    super(message);
    this.name = "NarratorPlaybackError";
    this.diagnostic = diagnostic;
  }
}

function abortError(): DOMException {
  return new DOMException("Narrator audio playback aborted.", "AbortError");
}

function createDiagnostic(
  response: VoiceSpeakResponse,
  stage: NarratorPlaybackStage,
): NarratorPlaybackDiagnostic {
  const nowMs = Date.now();
  return {
    schema: "helix.narrator_playback_diagnostic.v1",
    stage,
    startedAtMs: nowMs,
    updatedAtMs: nowMs,
    provider: response.headers.provider,
    profile: response.headers.profile,
    mimeType: response.kind === "audio" ? response.mimeType : null,
    audioBytes: response.kind === "audio" ? response.blob.size : null,
    playResolved: false,
    playingObserved: false,
    endedObserved: false,
    timeupdateCount: 0,
    maxCurrentTime: 0,
    duration: null,
    muted: null,
    volume: null,
    paused: null,
    readyState: null,
    networkState: null,
    mediaErrorCode: null,
    errorMessage: null,
  };
}

function updateFromAudio(
  diagnostic: NarratorPlaybackDiagnostic,
  audio: HTMLAudioElement,
  stage: NarratorPlaybackStage,
  errorMessage?: string | null,
): NarratorPlaybackDiagnostic {
  const currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
  return {
    ...diagnostic,
    stage,
    updatedAtMs: Date.now(),
    playResolved: diagnostic.playResolved || stage === "play_resolved",
    playingObserved: diagnostic.playingObserved || stage === "playing",
    endedObserved: diagnostic.endedObserved || stage === "ended",
    timeupdateCount: diagnostic.timeupdateCount + (stage === "timeupdate" ? 1 : 0),
    maxCurrentTime: Math.max(diagnostic.maxCurrentTime, currentTime),
    duration,
    muted: audio.muted,
    volume: Number.isFinite(audio.volume) ? audio.volume : null,
    paused: audio.paused,
    readyState: audio.readyState,
    networkState: audio.networkState,
    mediaErrorCode: audio.error?.code ?? null,
    errorMessage: errorMessage ?? diagnostic.errorMessage,
  };
}

function emitDiagnostic(
  diagnostic: NarratorPlaybackDiagnostic,
  onDiagnostic?: (diagnostic: NarratorPlaybackDiagnostic) => void,
): NarratorPlaybackDiagnostic {
  onDiagnostic?.(diagnostic);
  return diagnostic;
}

export function stopNarratorAudioPlayback(): void {
  if (activeNarratorAudio) {
    activeNarratorAudio.pause();
    activeNarratorAudio.removeAttribute("src");
    activeNarratorAudio.load();
    activeNarratorAudio = null;
  }
  if (activeNarratorAudioUrl) {
    URL.revokeObjectURL(activeNarratorAudioUrl);
    activeNarratorAudioUrl = null;
  }
}

export async function playNarratorVoiceResponse(
  response: VoiceSpeakResponse,
  options?: {
    signal?: AbortSignal;
    onDiagnostic?: (diagnostic: NarratorPlaybackDiagnostic) => void;
  },
): Promise<NarratorPlaybackDiagnostic> {
  if (options?.signal?.aborted) throw abortError();
  let diagnostic = emitDiagnostic(
    createDiagnostic(response, response.kind === "json" ? "json_response" : "audio_response"),
    options?.onDiagnostic,
  );
  if (response.kind === "json") {
    const reason =
      response.payload.error ||
      response.payload.message ||
      response.payload.reason ||
      (response.payload.dryRun ? "voice_response_dry_run" : "voice_response_missing_audio");
    diagnostic = emitDiagnostic({ ...diagnostic, stage: "error", updatedAtMs: Date.now(), errorMessage: reason }, options?.onDiagnostic);
    throw new NarratorPlaybackError(reason, diagnostic);
  }
  if (response.blob.size <= 0) {
    diagnostic = emitDiagnostic(
      { ...diagnostic, stage: "error", updatedAtMs: Date.now(), errorMessage: "voice_response_empty_audio" },
      options?.onDiagnostic,
    );
    throw new NarratorPlaybackError("voice_response_empty_audio", diagnostic);
  }
  return playNarratorAudioBlob(response.blob, diagnostic, options);
}

function playNarratorAudioBlob(
  blob: Blob,
  initialDiagnostic: NarratorPlaybackDiagnostic,
  options?: {
    signal?: AbortSignal;
    onDiagnostic?: (diagnostic: NarratorPlaybackDiagnostic) => void;
  },
): Promise<NarratorPlaybackDiagnostic> {
  const signal = options?.signal;
  const onDiagnostic = options?.onDiagnostic;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    if (typeof Audio === "undefined") {
      reject(new Error("audio_element_unavailable"));
      return;
    }

    stopNarratorAudioPlayback();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeNarratorAudio = audio;
    activeNarratorAudioUrl = url;
    let diagnostic = emitDiagnostic(initialDiagnostic, onDiagnostic);

    let settled = false;
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      signal?.removeEventListener("abort", handleAbort);
      if (activeNarratorAudio === audio) activeNarratorAudio = null;
      if (activeNarratorAudioUrl === url) {
        URL.revokeObjectURL(url);
        activeNarratorAudioUrl = null;
      }
    };
    const fail = (message: string) => {
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "error", message), onDiagnostic);
      return new NarratorPlaybackError(message, diagnostic);
    };
    const finalize = (error?: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error instanceof NarratorPlaybackError ? error : fail(error instanceof Error ? error.message : String(error)));
      } else {
        resolve(diagnostic);
      }
    };
    const handleAbort = () => {
      audio.pause();
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "aborted", "narrator_audio_playback_aborted"), onDiagnostic);
      finalize(new NarratorPlaybackError("narrator_audio_playback_aborted", diagnostic));
    };

    audio.onended = () => {
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "ended"), onDiagnostic);
      finalize();
    };
    audio.onerror = () => finalize(fail("narrator_audio_playback_failed"));
    audio.onplaying = () => {
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "playing"), onDiagnostic);
    };
    audio.ontimeupdate = () => {
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "timeupdate"), onDiagnostic);
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
    diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "play_requested"), onDiagnostic);
    void audio.play()
      .then(() => {
        diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "play_resolved"), onDiagnostic);
      })
      .catch((error) => finalize(error));
  });
}
