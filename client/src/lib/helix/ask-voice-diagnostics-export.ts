import type {
  VoiceCaptureDiagnosticsSnapshot,
  VoiceCaptureSegmentSnapshot,
} from "@/lib/helix/voice-capture-diagnostics";

function readVoiceDiagnosticsRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function coerceVoiceDiagnosticsText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function resolveVoiceTimelineClientBuildStamp(input: {
  stampedBuild?: string | null;
  isDev: boolean;
  hasWindow: boolean;
}): string {
  if (!input.hasWindow) return "unknown";
  const stamped = typeof input.stampedBuild === "string" ? input.stampedBuild.trim() : "";
  if (stamped) return stamped;
  return input.isDev ? "dev" : "prod";
}

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

export function buildVoicePlaybackReconciliationDebug(input: {
  activeTurnId: string | null;
  selectedFinalAnswer: string | null;
  source: Record<string, unknown>;
}): Record<string, unknown> {
  const clientProjection = readVoiceDiagnosticsRecord(input.source.client_debug_projection);
  const clientVoice = readVoiceDiagnosticsRecord(input.source.client_voice_debug ?? clientProjection?.voice);
  const receiptSources = [
    input.source.client_voice_playback_receipts,
    clientProjection?.voice_playback_receipts,
    clientVoice?.playbackReceipts,
  ];
  const receipts = receiptSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map((receipt) => readVoiceDiagnosticsRecord(receipt))
    .filter((receipt): receipt is Record<string, unknown> => Boolean(receipt));
  const receiptKeyForReconciliation = (receipt: Record<string, unknown>): string => {
    const candidates = [
      receipt.receiptId,
      receipt.sourceReceiptId,
      receipt.sourceReceiptKey,
      receipt.utteranceId,
      receipt.requestId,
    ].map((value) => coerceVoiceDiagnosticsText(value).trim()).filter(Boolean);
    return candidates.join("|") || JSON.stringify(receipt).slice(0, 120);
  };
  const receiptsByKey = new Map<string, Record<string, unknown>>();
  for (const receipt of receipts) {
    const key = receiptKeyForReconciliation(receipt);
    const existing = receiptsByKey.get(key);
    if (!existing || coerceVoiceDiagnosticsText(existing.status).trim() !== "delivered") {
      receiptsByKey.set(key, receipt);
    }
  }
  const uniqueReceipts = Array.from(receiptsByKey.values());
  const voiceCallSources = [input.source.client_voice_calls, clientProjection?.voice_calls, clientVoice?.voiceCalls];
  const voiceCalls = voiceCallSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map((call) => readVoiceDiagnosticsRecord(call))
    .filter((call): call is Record<string, unknown> => Boolean(call));
  const voiceCallKeyForReconciliation = (call: Record<string, unknown>): string => {
    const candidates = [
      call.id,
      call.utteranceId,
      call.eventId,
      call.traceId,
      call.textHash,
    ].map((value) => coerceVoiceDiagnosticsText(value).trim()).filter(Boolean);
    return candidates.join("|") || JSON.stringify(call).slice(0, 120);
  };
  const voiceCallsByKey = new Map<string, Record<string, unknown>>();
  for (const call of voiceCalls) {
    voiceCallsByKey.set(voiceCallKeyForReconciliation(call), call);
  }
  const uniqueVoiceCalls = Array.from(voiceCallsByKey.values());
  const activeTurnId = input.activeTurnId?.trim() ?? "";
  const isActiveTurnReceipt = (receipt: Record<string, unknown>): boolean => {
    if (!activeTurnId) return true;
    return [
      receipt.turnKey,
      receipt.utteranceId,
      receipt.sourceReceiptId,
      receipt.sourceReceiptKey,
      receipt.requestId,
    ].some((value) => coerceVoiceDiagnosticsText(value).includes(activeTurnId));
  };
  const deliveredReceipts = uniqueReceipts.filter(
    (receipt) => coerceVoiceDiagnosticsText(receipt.status).trim() === "delivered" && isActiveTurnReceipt(receipt),
  );
  const deliveredUtteranceIds = Array.from(
    new Set(deliveredReceipts.map((receipt) => coerceVoiceDiagnosticsText(receipt.utteranceId).trim()).filter(Boolean)),
  );
  const audioBytesObserved = uniqueVoiceCalls
    .filter((call) => {
      const utteranceId = coerceVoiceDiagnosticsText(call.utteranceId).trim();
      return deliveredUtteranceIds.length === 0 || deliveredUtteranceIds.includes(utteranceId);
    })
    .reduce((total, call) => {
      const bytes = typeof call.audioBytes === "number" && Number.isFinite(call.audioBytes) ? call.audioBytes : 0;
      return total + Math.max(0, bytes);
    }, 0);
  const selectedText = input.selectedFinalAnswer ?? "";
  const selectedFinalAnswerClaim = /browser playback confirmation is still pending|playback confirmation is still pending/i.test(selectedText)
    ? "pending_client_playback"
    : "none";
  const playbackConfirmation = deliveredReceipts.length > 0 ? "delivered" : "not_observed";
  const correctedStatusText =
    selectedFinalAnswerClaim === "pending_client_playback" && playbackConfirmation === "delivered"
      ? "Client playback receipt confirms delivered audio after the final answer was composed."
      : null;
  return {
    schema: "helix.voice_playback_reconciliation.v1",
    source: "client_playback_receipts",
    active_turn_id: activeTurnId || null,
    selected_final_answer_claim: selectedFinalAnswerClaim,
    playback_confirmation: playbackConfirmation,
    delivered_receipt_count: deliveredReceipts.length,
    delivered_utterance_ids: deliveredUtteranceIds,
    audio_bytes_observed: audioBytesObserved,
    corrected_status_text: correctedStatusText,
    terminal_answer_mutated: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    output_authority: "client_playback_observation",
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
