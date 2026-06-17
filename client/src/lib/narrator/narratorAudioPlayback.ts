import type { VoiceSpeakResponse } from "@/lib/agi/api";
import {
  VoicePlaybackLifecycleError,
  createVoicePlaybackLifecycleDiagnostic,
  updateVoicePlaybackLifecycleDiagnosticFromAudio,
  type VoicePlaybackLifecycleDiagnostic,
  type VoicePlaybackLifecycleStage,
} from "@/lib/helix/voice-playback-diagnostics";

let activeNarratorAudio: HTMLAudioElement | null = null;
let activeNarratorAudioUrl: string | null = null;
let narratorAudioUnlocked = false;
let narratorAudioUnlockLastFailure: { reason: string; atMs: number } | null = null;

const NARRATOR_AUDIO_UNLOCK_DATA_URI =
  "data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type NarratorPlaybackStage = VoicePlaybackLifecycleStage;
export type NarratorPlaybackDiagnostic = VoicePlaybackLifecycleDiagnostic;
export { VoicePlaybackLifecycleError as NarratorPlaybackError };

function abortError(): DOMException {
  return new DOMException("Narrator audio playback aborted.", "AbortError");
}

function createDiagnostic(
  response: VoiceSpeakResponse,
  stage: NarratorPlaybackStage,
): NarratorPlaybackDiagnostic {
  return createVoicePlaybackLifecycleDiagnostic({
    stage,
    provider: response.headers.provider,
    profile: response.headers.profile,
    mimeType: response.kind === "audio" ? response.mimeType : null,
    audioBytes: response.kind === "audio" ? response.blob.size : null,
  });
}

export function createNarratorPlaybackLockedDiagnostic(
  reason = "narrator_audio_playback_locked",
): NarratorPlaybackDiagnostic {
  return {
    ...createVoicePlaybackLifecycleDiagnostic({ stage: "error" }),
    errorMessage: reason,
  };
}

function configureNarratorAudioElement(audio: HTMLAudioElement): HTMLAudioElement {
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.autoplay = true;
  audio.volume = 1;
  audio.setAttribute?.("playsinline", "true");
  audio.setAttribute?.("webkit-playsinline", "true");
  const mutableAudio = audio as HTMLAudioElement & { playsInline?: boolean };
  mutableAudio.playsInline = true;
  if (typeof document !== "undefined" && typeof Node !== "undefined" && audio instanceof Node && !audio.isConnected) {
    audio.dataset.helixNarratorPlayback = "true";
    audio.style.position = "fixed";
    audio.style.left = "-9999px";
    audio.style.top = "0";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.opacity = "0";
    audio.style.pointerEvents = "none";
    audio.setAttribute("aria-hidden", "true");
    document.body.appendChild(audio);
  }
  return audio;
}

export function isNarratorAudioPlaybackUnlocked(): boolean {
  return narratorAudioUnlocked;
}

export function getNarratorAudioUnlockLastFailure(): { reason: string; atMs: number } | null {
  return narratorAudioUnlockLastFailure;
}

export async function primeNarratorAudioPlayback(): Promise<boolean> {
  if (narratorAudioUnlocked) return true;
  if (typeof Audio === "undefined") return false;
  try {
    const primer = configureNarratorAudioElement(new Audio());
    primer.muted = false;
    primer.volume = 0.01;
    primer.src = NARRATOR_AUDIO_UNLOCK_DATA_URI;
    const playPromise = primer.play();
    if (playPromise && typeof playPromise.then === "function") {
      await playPromise;
    }
    primer.pause();
    primer.currentTime = 0;
    primer.src = "";
    primer.load();
    primer.volume = 1;
    narratorAudioUnlocked = true;
    narratorAudioUnlockLastFailure = null;
    return true;
  } catch (error) {
    narratorAudioUnlockLastFailure = {
      reason: error instanceof Error ? error.message : String(error),
      atMs: Date.now(),
    };
    return false;
  }
}

export function installNarratorAudioUnlockGestureListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const unlockOnGesture = () => {
    if (narratorAudioUnlocked) return;
    void primeNarratorAudioPlayback();
  };
  window.addEventListener("pointerdown", unlockOnGesture, { passive: true });
  window.addEventListener("touchend", unlockOnGesture, { passive: true });
  window.addEventListener("click", unlockOnGesture, { passive: true });
  return () => {
    window.removeEventListener("pointerdown", unlockOnGesture);
    window.removeEventListener("touchend", unlockOnGesture);
    window.removeEventListener("click", unlockOnGesture);
  };
}

function updateFromAudio(
  diagnostic: NarratorPlaybackDiagnostic,
  audio: HTMLAudioElement,
  stage: NarratorPlaybackStage,
  errorMessage?: string | null,
): NarratorPlaybackDiagnostic {
  return updateVoicePlaybackLifecycleDiagnosticFromAudio(diagnostic, audio, stage, errorMessage);
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
    throw new VoicePlaybackLifecycleError(reason, diagnostic);
  }
  if (response.blob.size <= 0) {
    diagnostic = emitDiagnostic(
      { ...diagnostic, stage: "error", updatedAtMs: Date.now(), errorMessage: "voice_response_empty_audio" },
      options?.onDiagnostic,
    );
    throw new VoicePlaybackLifecycleError("voice_response_empty_audio", diagnostic);
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
    const audio = configureNarratorAudioElement(new Audio(url));
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
      return new VoicePlaybackLifecycleError(message, diagnostic);
    };
    const finalize = (error?: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error instanceof VoicePlaybackLifecycleError ? error : fail(error instanceof Error ? error.message : String(error)));
      } else {
        resolve(diagnostic);
      }
    };
    const handleAbort = () => {
      audio.pause();
      diagnostic = emitDiagnostic(updateFromAudio(diagnostic, audio, "aborted", "narrator_audio_playback_aborted"), onDiagnostic);
      finalize(new VoicePlaybackLifecycleError("narrator_audio_playback_aborted", diagnostic));
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
