export type VoiceCaptureWarningCode = "loopback_source" | "flat_signal" | "recorder_stalled";

export type VoiceCaptureCheckpointStatus = "idle" | "ok" | "warn" | "error";

export type VoiceCaptureCheckpointSnapshot = {
  key: string;
  label: string;
  status: VoiceCaptureCheckpointStatus;
  message: string | null;
  lastAtMs: number | null;
};

export type VoiceCaptureSegmentSnapshot = {
  id: string;
  cutAtMs: number;
  durationMs: number;
  status: "segment_cut" | "transcribing" | "stt_ok" | "stt_error";
  sttLatencyMs: number | null;
  transcriptPreview: string | null;
  translated: boolean;
  dispatch: "none" | "queued" | "suppressed" | "completed";
  engine: string | null;
  error: string | null;
};

export type VoicePlaybackDiagnosticsSnapshot = {
  utteranceId: string;
  turnKey: string;
  kind: "brief" | "final";
  chunkCount: number;
  enqueueToFirstAudioMs: number | null;
  synthDurationsMs: number[];
  chunkGapMs: number[];
  totalPlaybackMs: number | null;
  cancelReason: string | null;
  providerHeader?: string;
  profileHeader?: string;
  cacheHitCount: number;
  cacheMissCount: number;
  divergence?: {
    activeUtteranceId: string | null;
    activeTurnKey: string | null;
    activeRevision: number | null;
    pendingPreemptPolicy: "none" | "pending_final" | "pending_regen";
    pendingTurnKey: string | null;
    pendingUtteranceId: string | null;
    pendingDeadlineMs: number | null;
    turnStates: Array<{
      turnKey: string;
      latestTranscriptRevision: number;
      latestBriefRevision: number;
      latestFinalRevision: number;
      latestRevision: number;
      activeUtteranceRevision: number | null;
      pendingPreemptPolicy: "none" | "pending_final" | "pending_regen";
      pendingSwitchReason: "none" | "pending_preempt_by_final" | "pending_preempt_by_regen";
      pendingSinceMs: number | null;
      pendingDeadlineMs: number | null;
      uiVoiceRevisionMatch: boolean | null;
      lastEventCode: string | null;
      updatedAtMs: number;
    }>;
    recentEvents: Array<{
      code:
        | "divergence_detected"
        | "stale_revision_dropped"
        | "preempt_pending"
        | "preempt_applied"
        | "preempt_timeout_forced"
        | "ui_voice_revision_match";
      turnKey: string;
      utteranceId: string | null;
      revision: number | null;
      detail: string | null;
      atMs: number;
    }>;
  };
};

export type VoiceCaptureDiagnosticsSnapshot = {
  updatedAtMs: number;
  micArmState: "off" | "on";
  voiceInputState: "listening" | "transcribing" | "cooldown" | "error";
  voiceSignalState: "waiting" | "low" | "speech";
  voiceMonitorLevel: number;
  voiceMonitorThreshold: number;
  voiceRecorderMimeType: string | null;
  voiceInputDeviceLabel: string | null;
  voiceTrackMuted: boolean;
  rmsRaw: number;
  rmsDb: number;
  peak: number;
  noiseFloor: number;
  chunksPerSecond: number;
  mediaChunkCount: number;
  mediaBytes: number;
  lastChunkAgeMs: number | null;
  lastRoundtripMs: number | null;
  warnings: VoiceCaptureWarningCode[];
  checkpoints: VoiceCaptureCheckpointSnapshot[];
  segments: VoiceCaptureSegmentSnapshot[];
  playback?: VoicePlaybackDiagnosticsSnapshot | null;
};

export const HELIX_VOICE_CAPTURE_DIAGNOSTICS_EVENT = "helix:voice-capture-diagnostics";

let lastVoiceCaptureDiagnosticsSnapshot: VoiceCaptureDiagnosticsSnapshot | null = null;

export function publishVoiceCaptureDiagnosticsSnapshot(snapshot: VoiceCaptureDiagnosticsSnapshot): void {
  lastVoiceCaptureDiagnosticsSnapshot = snapshot;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<VoiceCaptureDiagnosticsSnapshot>(HELIX_VOICE_CAPTURE_DIAGNOSTICS_EVENT, {
    detail: snapshot,
  }));
}

export function getVoiceCaptureDiagnosticsSnapshot(): VoiceCaptureDiagnosticsSnapshot | null {
  return lastVoiceCaptureDiagnosticsSnapshot;
}

export function subscribeVoiceCaptureDiagnostics(
  listener: (snapshot: VoiceCaptureDiagnosticsSnapshot) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<VoiceCaptureDiagnosticsSnapshot>).detail;
    if (!detail) return;
    listener(detail);
  };
  window.addEventListener(HELIX_VOICE_CAPTURE_DIAGNOSTICS_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(HELIX_VOICE_CAPTURE_DIAGNOSTICS_EVENT, handler as EventListener);
  };
}
