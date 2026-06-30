import type {
  VoiceCaptureDiagnosticsSnapshot,
  VoiceCaptureSegmentSnapshot,
} from "@/lib/helix/voice-capture-diagnostics";

export function summarizeVoiceSegments(segments: VoiceCaptureSegmentSnapshot[] | undefined): {
  total: number;
  dispatchCompleted: number;
  dispatchQueued: number;
  dispatchSuppressed: number;
  sttErrors: number;
} {
  if (!Array.isArray(segments) || segments.length === 0) {
    return {
      total: 0,
      dispatchCompleted: 0,
      dispatchQueued: 0,
      dispatchSuppressed: 0,
      sttErrors: 0,
    };
  }
  let dispatchCompleted = 0;
  let dispatchQueued = 0;
  let dispatchSuppressed = 0;
  let sttErrors = 0;
  segments.forEach((segment) => {
    if (segment.dispatch === "completed") dispatchCompleted += 1;
    if (segment.dispatch === "queued") dispatchQueued += 1;
    if (segment.dispatch === "suppressed") dispatchSuppressed += 1;
    if (segment.status === "stt_error") sttErrors += 1;
  });
  return {
    total: segments.length,
    dispatchCompleted,
    dispatchQueued,
    dispatchSuppressed,
    sttErrors,
  };
}

export function sanitizeVoiceDiagnosticsForExport(
  snapshot: VoiceCaptureDiagnosticsSnapshot | null,
): Record<string, unknown> | null {
  if (!snapshot) return null;
  const timeline = Array.isArray(snapshot.timelineEvents) ? snapshot.timelineEvents.slice(-160) : [];
  return {
    updatedAtMs: snapshot.updatedAtMs,
    micArmState: snapshot.micArmState,
    voiceInputState: snapshot.voiceInputState,
    voiceSignalState: snapshot.voiceSignalState,
    warnings: [...snapshot.warnings],
    monitor: {
      level: Number(snapshot.voiceMonitorLevel.toFixed(6)),
      threshold: Number(snapshot.voiceMonitorThreshold.toFixed(6)),
      rmsDb: Number(snapshot.rmsDb.toFixed(3)),
      chunksPerSecond: Number(snapshot.chunksPerSecond.toFixed(3)),
      lastRoundtripMs: snapshot.lastRoundtripMs ?? null,
    },
    segments: summarizeVoiceSegments(snapshot.segments),
    playback: snapshot.playback
      ? {
          utteranceId: snapshot.playback.utteranceId,
          turnKey: snapshot.playback.turnKey,
          kind: snapshot.playback.kind,
          authority: snapshot.playback.authority ?? null,
          source: snapshot.playback.source ?? null,
          replyId: snapshot.playback.replyId ?? null,
          chunkCount: snapshot.playback.chunkCount,
          enqueueToFirstAudioMs: snapshot.playback.enqueueToFirstAudioMs ?? null,
          totalPlaybackMs: snapshot.playback.totalPlaybackMs ?? null,
          cancelReason: snapshot.playback.cancelReason ?? null,
          cacheHitCount: snapshot.playback.cacheHitCount,
          cacheMissCount: snapshot.playback.cacheMissCount,
          providerHeader: snapshot.playback.providerHeader ?? null,
          profileHeader: snapshot.playback.profileHeader ?? null,
        }
      : null,
    playbackOutput: snapshot.playbackOutput
      ? {
          expectedPath: snapshot.playbackOutput.expectedPath,
          currentUtterancePath: snapshot.playbackOutput.currentUtterancePath ?? null,
          currentUtteranceDirectFallback: snapshot.playbackOutput.currentUtteranceDirectFallback ?? null,
          graphBypassActive: snapshot.playbackOutput.graphBypassActive ?? null,
          graphFailureStreak: snapshot.playbackOutput.graphFailureStreak ?? null,
          fallbackCount: snapshot.playbackOutput.fallbackCount ?? null,
          lastFallbackReason: snapshot.playbackOutput.lastFallbackReason ?? null,
          audioUnlocked: snapshot.playbackOutput.audioUnlocked,
          audioGraphAttached: snapshot.playbackOutput.audioGraphAttached,
        }
      : null,
    playbackReceipts: Array.isArray(snapshot.playbackReceipts)
      ? snapshot.playbackReceipts.slice(-80).map((receipt) => ({
          schema: receipt.schema,
          receiptId: receipt.receiptId,
          sourceReceiptId: receipt.sourceReceiptId,
          sourceReceiptKey: receipt.sourceReceiptKey,
          requestId: receipt.requestId,
          calloutKind: receipt.calloutKind,
          utteranceId: receipt.utteranceId,
          turnKey: receipt.turnKey,
          kind: receipt.kind,
          status: receipt.status,
          atMs: receipt.atMs,
          providerHeader: receipt.providerHeader,
          profileHeader: receipt.profileHeader,
          cacheHitCount: receipt.cacheHitCount,
          cacheMissCount: receipt.cacheMissCount,
          totalPlaybackMs: receipt.totalPlaybackMs,
          cancelReason: receipt.cancelReason,
          error: receipt.error,
          audioUnlocked: receipt.audioUnlocked,
          playbackPath: receipt.playbackPath,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          output_authority: "playback_observation",
        }))
      : [],
    voiceCalls: Array.isArray(snapshot.voiceCalls)
      ? snapshot.voiceCalls.slice(-80).map((call) => ({
          id: call.id,
          kind: call.kind,
          endpoint: call.endpoint,
          startedAtMs: call.startedAtMs,
          endedAtMs: call.endedAtMs,
          durationMs: call.durationMs,
          ok: call.ok,
          status: call.status,
          responseKind: call.responseKind,
          contentType: call.contentType,
          traceId: call.traceId,
          missionId: call.missionId,
          eventId: call.eventId ?? null,
          utteranceId: call.utteranceId ?? null,
          turnKey: call.turnKey ?? null,
          mode: call.mode ?? null,
          priority: call.priority ?? null,
          providerHeader: call.providerHeader ?? null,
          profileHeader: call.profileHeader ?? null,
          cacheHeader: call.cacheHeader ?? null,
          textLength: call.textLength ?? null,
          textHash: call.textHash ?? null,
          audioBytes: call.audioBytes ?? null,
          audioMimeType: call.audioMimeType ?? null,
          audioDurationMs: call.audioDurationMs ?? null,
          error: call.error ?? null,
        }))
      : [],
    timelineEvents: timeline.map((event) => ({
      id: event.id,
      atMs: event.atMs,
      source: event.source,
      kind: event.kind,
      status: event.status ?? null,
      traceId: event.traceId ?? null,
      turnKey: event.turnKey ?? null,
      attemptId: event.attemptId ?? null,
      utteranceId: event.utteranceId ?? null,
      utteranceAuthority: event.utteranceAuthority ?? null,
      utteranceSource: event.utteranceSource ?? null,
      replyId: event.replyId ?? null,
      detail: event.detail ?? null,
      text: event.text ?? null,
      debugContext: event.debugContext ?? null,
    })),
  };
}
