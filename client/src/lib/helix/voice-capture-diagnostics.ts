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
  speakerId?: string | null;
  speakerConfidence?: number | null;
  speechProbability?: number | null;
  snrDb?: number | null;
  confirmAutoEligible?: boolean | null;
  confirmBlockReason?: string | null;
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
  normalizationBenchmarkHeader?: string;
  normalizationSkipReasonHeader?: string;
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

export type VoicePlaybackOutputDiagnosticsSnapshot = {
  userAgent: string | null;
  audioSessionType: string | null;
  expectedPath: "audio_graph" | "direct_element";
  currentUtterancePath?: "audio_graph" | "direct_element" | "direct_fallback" | null;
  currentUtteranceDirectFallback?: boolean;
  graphEligible?: boolean;
  graphBypassActive?: boolean;
  graphBypassUntilMs?: number | null;
  graphFailureStreak?: number;
  graphAttemptCount?: number;
  fallbackCount?: number;
  lastFallbackReason?: string | null;
  lastFallbackAtMs?: number | null;
  unlockLastFailureReason?: string | null;
  unlockLastFailureAtMs?: number | null;
  forcedDirectMobile: boolean;
  gainTarget: number;
  audioUnlocked: boolean;
  audioElementReady: boolean;
  audioElementMuted: boolean | null;
  audioElementVolume: number | null;
  audioGraphAttached: boolean;
  audioContextState: string | null;
  audioContextSampleRate: number | null;
  gainNodeValue: number | null;
  compressorThreshold: number | null;
  compressorKnee: number | null;
  compressorRatio: number | null;
  compressorAttack: number | null;
  compressorRelease: number | null;
};

export type VoiceLaneTimelineDebugSource =
  | "voice_capture"
  | "conversation"
  | "reasoning"
  | "chunk_playback"
  | "system";

export type VoiceLaneTimelineDebugKind =
  | "build_info"
  | "prompt_recorded"
  | "brief"
  | "reasoning_attempt"
  | "reasoning_stream"
  | "reasoning_final"
  | "action_receipt"
  | "suppressed"
  | "segment"
  | "chunk_enqueue"
  | "chunk_synth_start"
  | "chunk_synth_ok"
  | "chunk_synth_error"
  | "chunk_play_start"
  | "chunk_play_end"
  | "chunk_drop";

export type VoiceLaneTimelineDebugEvent = {
  id: string;
  atMs: number;
  source: VoiceLaneTimelineDebugSource;
  kind: VoiceLaneTimelineDebugKind;
  status?: string | null;
  traceId?: string | null;
  turnKey?: string | null;
  attemptId?: string | null;
  utteranceId?: string | null;
  chunkIndex?: number | null;
  chunkCount?: number | null;
  text?: string | null;
  detail?: string | null;
  hlcMs?: number | null;
  seq?: number | null;
  revision?: number | null;
  sealToken?: string | null;
  briefSource?: "llm" | "none" | null;
  suppressionCause?: string | null;
  authorityRejectStage?: "preflight" | "stream" | "final" | null;
  finalSource?: "normal_reasoning" | "strict_gate_override" | null;
  causalRefId?: string | null;
  debugContext?: Record<string, unknown> | null;
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
  pendingConfirmation?: {
    dispatchState: "auto" | "confirm" | "blocked" | null;
    needsConfirmation: boolean;
    pivotConfidence: number | null;
    speechProbability: number | null;
    snrDb: number | null;
    speakerId: string | null;
    speakerConfidence: number | null;
    confirmAutoEligible: boolean | null;
    confirmBlockReason: string | null;
  } | null;
  voiceFeatureFlags?: {
    confirmV2RolloutEligible: boolean;
    confirmV2Active: boolean;
    confirmV2ShadowMode: boolean;
    localAudioGateActive: boolean;
    sessionSpeakerActive: boolean;
    multiSpeakerUiActive: boolean;
    noisyEnvironmentMode: boolean;
  };
  playback?: VoicePlaybackDiagnosticsSnapshot | null;
  playbackOutput?: VoicePlaybackOutputDiagnosticsSnapshot | null;
  timelineEvents?: VoiceLaneTimelineDebugEvent[];
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
