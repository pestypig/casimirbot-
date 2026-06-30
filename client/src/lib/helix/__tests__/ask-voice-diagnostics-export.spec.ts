import { describe, expect, it } from "vitest";

import {
  sanitizeVoiceDiagnosticsForExport,
  summarizeVoiceSegments,
} from "@/lib/helix/ask-voice-diagnostics-export";
import type { VoiceCaptureDiagnosticsSnapshot } from "@/lib/helix/voice-capture-diagnostics";

describe("ask-voice-diagnostics-export", () => {
  it("summarizes segment dispatch and STT status counts", () => {
    expect(summarizeVoiceSegments(undefined)).toEqual({
      total: 0,
      dispatchCompleted: 0,
      dispatchQueued: 0,
      dispatchSuppressed: 0,
      sttErrors: 0,
    });
    expect(summarizeVoiceSegments([
      { id: "a", cutAtMs: 1, durationMs: 10, status: "stt_ok", sttLatencyMs: 2, transcriptPreview: "ok", translated: false, dispatch: "completed", engine: "x", error: null },
      { id: "b", cutAtMs: 2, durationMs: 10, status: "stt_error", sttLatencyMs: null, transcriptPreview: null, translated: false, dispatch: "suppressed", engine: "x", error: "bad" },
      { id: "c", cutAtMs: 3, durationMs: 10, status: "transcribing", sttLatencyMs: null, transcriptPreview: null, translated: false, dispatch: "queued", engine: null, error: null },
    ])).toEqual({
      total: 3,
      dispatchCompleted: 1,
      dispatchQueued: 1,
      dispatchSuppressed: 1,
      sttErrors: 1,
    });
  });

  it("sanitizes voice diagnostics into bounded export fields", () => {
    const snapshot = {
      updatedAtMs: 123,
      micArmState: "on",
      voiceInputState: "listening",
      voiceSignalState: "speech",
      warnings: ["loopback_source"],
      voiceMonitorLevel: 0.123456789,
      voiceMonitorThreshold: 0.012345678,
      rmsDb: -42.12345,
      chunksPerSecond: 3.45678,
      lastRoundtripMs: 55,
      segments: [],
      playback: null,
      playbackOutput: {
        expectedPath: "audio_graph",
        currentUtterancePath: "direct_element",
        currentUtteranceDirectFallback: false,
        graphBypassActive: false,
        graphFailureStreak: 1,
        fallbackCount: 2,
        lastFallbackReason: "NotAllowedError",
        audioUnlocked: true,
        audioGraphAttached: false,
      },
      playbackReceipts: Array.from({ length: 82 }, (_, index) => ({
        schema: "helix.voice.playback_receipt.v1",
        receiptId: `receipt:${index}`,
        sourceReceiptId: null,
        sourceReceiptKey: null,
        requestId: `request:${index}`,
        calloutKind: null,
        utteranceId: `utt:${index}`,
        turnKey: "turn",
        kind: "final_answer",
        status: "ended",
        atMs: index,
        providerHeader: null,
        profileHeader: null,
        cacheHitCount: 0,
        cacheMissCount: 1,
        totalPlaybackMs: 10,
        cancelReason: null,
        error: null,
        audioUnlocked: true,
        playbackPath: "direct_element",
      })),
      voiceCalls: [],
      timelineEvents: Array.from({ length: 162 }, (_, index) => ({
        id: `event:${index}`,
        atMs: index,
        source: "voice",
        kind: "chunk",
        status: "ok",
        traceId: "trace",
        turnKey: "turn",
        attemptId: null,
        utteranceId: null,
        utteranceAuthority: null,
        utteranceSource: null,
        replyId: null,
        detail: null,
        text: null,
        debugContext: null,
      })),
    } as unknown as VoiceCaptureDiagnosticsSnapshot;

    const exportPayload = sanitizeVoiceDiagnosticsForExport(snapshot) as Record<string, any>;
    expect(exportPayload.monitor).toEqual({
      level: 0.123457,
      threshold: 0.012346,
      rmsDb: -42.123,
      chunksPerSecond: 3.457,
      lastRoundtripMs: 55,
    });
    expect(exportPayload.playbackReceipts).toHaveLength(80);
    expect(exportPayload.playbackReceipts[0]).toMatchObject({
      receiptId: "receipt:2",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      output_authority: "playback_observation",
    });
    expect(exportPayload.timelineEvents).toHaveLength(160);
    expect(exportPayload.timelineEvents[0].id).toBe("event:2");
  });

  it("returns null for missing diagnostics snapshots", () => {
    expect(sanitizeVoiceDiagnosticsForExport(null)).toBeNull();
  });
});
