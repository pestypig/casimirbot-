import type { HelixAudioFeatureSummary } from "./diarization-types";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const findWavDataChunk = (buffer: Buffer): { offset: number; size: number } | null => {
  if (buffer.byteLength < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return null;
  }
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "data") {
      return {
        offset: offset + 8,
        size: Math.min(size, buffer.byteLength - offset - 8),
      };
    }
    offset += 8 + size + (size % 2);
  }
  return null;
};

export const summarizeAudioFeatures = (
  buffer: Buffer,
  contentType: string | null | undefined,
): HelixAudioFeatureSummary => {
  const normalizedContentType = contentType?.toLowerCase() ?? "";
  const dataChunk = normalizedContentType.includes("wav") ? findWavDataChunk(buffer) : null;
  if (!dataChunk || dataChunk.size < 2) {
    return {
      rms: null,
      peak: null,
      estimated_noise_floor: null,
      spectral_centroid_hz: null,
      spectral_flatness: null,
      zero_crossing_rate: null,
      likely_voice_band_energy: null,
    };
  }

  const sampleCount = Math.floor(dataChunk.size / 2);
  let sumSquares = 0;
  let peak = 0;
  let zeroCrossings = 0;
  let prior = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = buffer.readInt16LE(dataChunk.offset + index * 2) / 32768;
    const abs = Math.abs(sample);
    peak = Math.max(peak, abs);
    sumSquares += sample * sample;
    if (index > 0 && Math.sign(sample) !== Math.sign(prior)) {
      zeroCrossings += 1;
    }
    prior = sample;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, sampleCount));

  return {
    rms: clamp01(rms),
    peak: clamp01(peak),
    estimated_noise_floor: null,
    spectral_centroid_hz: null,
    spectral_flatness: null,
    zero_crossing_rate: clamp01(zeroCrossings / Math.max(1, sampleCount - 1)),
    likely_voice_band_energy: null,
  };
};
