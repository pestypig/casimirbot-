import { describe, expect, it } from "vitest";
import { normalizeVoicePcm16WavBuffer } from "../services/audio/voice-normalization";

const buildSineWav = (params: {
  amplitude: number;
  frequencyHz?: number;
  durationSeconds?: number;
  sampleRate?: number;
}): Buffer => {
  const sampleRate = params.sampleRate ?? 16000;
  const durationSeconds = params.durationSeconds ?? 0.5;
  const frequencyHz = params.frequencyHz ?? 440;
  const channels = 1;
  const frameCount = Math.max(1, Math.round(sampleRate * durationSeconds));
  const dataSize = frameCount * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < frameCount; i += 1) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequencyHz * t) * params.amplitude;
    const sample = Math.max(-1, Math.min(1, value));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buffer;
};

describe("voice wav normalization", () => {
  it("boosts quiet PCM16 wav clips toward target loudness", () => {
    const quiet = buildSineWav({ amplitude: 0.08 });
    const result = normalizeVoicePcm16WavBuffer({
      buffer: quiet,
      options: {
        targetPeakDbfs: -2,
        targetRmsDbfs: -16,
        maxGainDb: 18,
        minDeltaDb: 0.1,
      },
    });

    expect(result.applied).toBe(true);
    expect(result.reason).toBe("applied");
    expect(result.gainLinear).toBeGreaterThan(1);
    expect(result.peakAfter).toBeGreaterThan(result.peakBefore);
    expect(result.peakAfter).toBeLessThanOrEqual(0.82);
  });

  it("attenuates hot PCM16 wav clips to avoid over-loud playback", () => {
    const hot = buildSineWav({ amplitude: 0.95 });
    const result = normalizeVoicePcm16WavBuffer({
      buffer: hot,
      options: {
        targetPeakDbfs: -3,
        targetRmsDbfs: -18,
        minDeltaDb: 0.1,
      },
    });

    expect(result.applied).toBe(true);
    expect(result.reason).toBe("applied");
    expect(result.gainLinear).toBeLessThan(1);
    expect(result.peakAfter).toBeLessThan(result.peakBefore);
    expect(result.peakAfter).toBeLessThanOrEqual(0.73);
  });

  it("skips unsupported containers", () => {
    const result = normalizeVoicePcm16WavBuffer({
      buffer: Buffer.from("not-a-wav", "utf8"),
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe("unsupported_format");
  });

  it("respects explicit disable switch", () => {
    const wav = buildSineWav({ amplitude: 0.2 });
    const result = normalizeVoicePcm16WavBuffer({
      buffer: wav,
      options: { enabled: false },
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe("disabled");
    expect(Buffer.compare(result.buffer, wav)).toBe(0);
  });

  it("skips tiny changes below minimum delta threshold", () => {
    const nearTarget = buildSineWav({ amplitude: 0.56 });
    const result = normalizeVoicePcm16WavBuffer({
      buffer: nearTarget,
      options: {
        targetPeakDbfs: -2,
        targetRmsDbfs: -8,
        minDeltaDb: 2,
      },
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe("delta_below_threshold");
  });
});
