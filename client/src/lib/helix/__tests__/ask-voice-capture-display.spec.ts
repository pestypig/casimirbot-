import { describe, expect, it } from "vitest";
import {
  isFlatVoiceSignal,
  isLikelyLoopbackDeviceLabel,
  isRecorderStalled,
  shouldPrimeSegmentWithContainerHeader,
  smoothVoiceLevel,
} from "../ask-voice-capture-display";

describe("ask voice capture display helpers", () => {
  it("smooths level meter values with deterministic attack and release behavior", () => {
    const attacked = smoothVoiceLevel(0.1, 0.9);
    const released = smoothVoiceLevel(0.9, 0.1);

    expect(attacked).toBeGreaterThan(0.5);
    expect(released).toBeLessThan(0.8);
    expect(released).toBeGreaterThan(0.1);
    expect(smoothVoiceLevel(-1, 2, 2, -1)).toBe(1);
  });

  it("detects flat signals and recorder stalls from explicit measurements", () => {
    expect(isFlatVoiceSignal(0.001, 3050)).toBe(true);
    expect(isFlatVoiceSignal(0.003, 3050)).toBe(false);
    expect(isFlatVoiceSignal(0.001, 1200)).toBe(false);
    expect(
      isRecorderStalled({
        recorderActive: true,
        nowMs: 4200,
        recorderStartedAtMs: 0,
        lastChunkAtMs: 2500,
      }),
    ).toBe(true);
    expect(
      isRecorderStalled({
        recorderActive: false,
        nowMs: 4200,
        recorderStartedAtMs: 0,
        lastChunkAtMs: 2500,
      }),
    ).toBe(false);
    expect(
      isRecorderStalled({
        recorderActive: true,
        nowMs: 4200,
        recorderStartedAtMs: null,
        lastChunkAtMs: null,
      }),
    ).toBe(false);
  });

  it("classifies loopback labels and container-header priming without browser APIs", () => {
    expect(isLikelyLoopbackDeviceLabel("VoiceMeeter Output (VB-Audio VoiceMeeter VAIO)")).toBe(true);
    expect(isLikelyLoopbackDeviceLabel("Stereo Mix (Realtek)")).toBe(true);
    expect(isLikelyLoopbackDeviceLabel("USB Microphone")).toBe(false);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/webm;codecs=opus",
        hasHeaderChunk: true,
      }),
    ).toBe(true);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/ogg",
        hasHeaderChunk: true,
      }),
    ).toBe(true);
    expect(
      shouldPrimeSegmentWithContainerHeader({
        segmentStartIndex: 4,
        mimeType: "audio/mp4",
        hasHeaderChunk: true,
      }),
    ).toBe(false);
  });
});
