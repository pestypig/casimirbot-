import { spawn } from "node:child_process";

type WavFormat = {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
};

type PcmStats = {
  peak: number;
  rms: number;
  sampleCount: number;
};

const WAVE_FORMAT_EXTENSIBLE = 0xfffe;
const WAVE_FORMAT_PCM = 1;
const WAVE_FORMAT_IEEE_FLOAT = 3;

const DEFAULT_OPTIONS = {
  enabled: true,
  targetPeakDbfs: -2,
  targetRmsDbfs: -19,
  maxGainDb: 12,
  minGainDb: -12,
  minDeltaDb: 0.6,
} as const;

export type VoiceWavNormalizationReason =
  | "applied"
  | "disabled"
  | "unsupported_format"
  | "unsupported_codec"
  | "no_audio_data"
  | "silent"
  | "delta_below_threshold";

export type VoiceWavNormalizationOptions = {
  enabled?: boolean;
  targetPeakDbfs?: number;
  targetRmsDbfs?: number;
  maxGainDb?: number;
  minGainDb?: number;
  minDeltaDb?: number;
};

type ResolvedVoiceWavNormalizationOptions = {
  enabled: boolean;
  targetPeakDbfs: number;
  targetRmsDbfs: number;
  maxGainDb: number;
  minGainDb: number;
  minDeltaDb: number;
};

export type VoiceWavNormalizationResult = {
  buffer: Buffer;
  applied: boolean;
  reason: VoiceWavNormalizationReason;
  gainLinear: number;
  gainDb: number;
  peakBefore: number;
  rmsBefore: number;
  peakAfter: number;
  rmsAfter: number;
};

export type VoiceMp3NormalizationReason =
  | VoiceWavNormalizationReason
  | "ffmpeg_unavailable"
  | "ffmpeg_decode_failed"
  | "ffmpeg_encode_failed";

export type VoiceMp3NormalizationOptions = {
  enabled?: boolean;
  ffmpegPath?: string;
  bitrateKbps?: number;
};

export type VoiceMp3NormalizationResult = {
  buffer: Buffer;
  applied: boolean;
  reason: VoiceMp3NormalizationReason;
  gainLinear: number;
  gainDb: number;
  peakBefore: number;
  rmsBefore: number;
  peakAfter: number;
  rmsAfter: number;
};

export type VoiceBufferNormalizationResult = {
  buffer: Buffer;
  applied: boolean;
  reason: VoiceMp3NormalizationReason | "unsupported_content_type";
  codec: "pcm16_wav" | "mp3_ffmpeg" | "none";
  gainLinear: number;
  gainDb: number;
  peakBefore: number;
  rmsBefore: number;
  peakAfter: number;
  rmsAfter: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const dbToLinear = (db: number): number => Math.pow(10, db / 20);

const linearToDb = (linear: number): number => 20 * Math.log10(Math.max(linear, 1e-12));

const resolveOptions = (
  options?: VoiceWavNormalizationOptions,
): ResolvedVoiceWavNormalizationOptions => {
  const targetPeakDbfs = clamp(
    Number.isFinite(options?.targetPeakDbfs as number)
      ? Number(options?.targetPeakDbfs)
      : DEFAULT_OPTIONS.targetPeakDbfs,
    -12,
    -0.1,
  );
  const targetRmsDbfs = clamp(
    Number.isFinite(options?.targetRmsDbfs as number)
      ? Number(options?.targetRmsDbfs)
      : DEFAULT_OPTIONS.targetRmsDbfs,
    -30,
    -8,
  );
  const maxGainDb = clamp(
    Number.isFinite(options?.maxGainDb as number)
      ? Number(options?.maxGainDb)
      : DEFAULT_OPTIONS.maxGainDb,
    0,
    24,
  );
  let minGainDb = clamp(
    Number.isFinite(options?.minGainDb as number)
      ? Number(options?.minGainDb)
      : DEFAULT_OPTIONS.minGainDb,
    -24,
    0,
  );
  if (minGainDb > maxGainDb) {
    minGainDb = maxGainDb;
  }
  const minDeltaDb = clamp(
    Number.isFinite(options?.minDeltaDb as number)
      ? Number(options?.minDeltaDb)
      : DEFAULT_OPTIONS.minDeltaDb,
    0,
    6,
  );
  return {
    enabled: options?.enabled ?? DEFAULT_OPTIONS.enabled,
    targetPeakDbfs,
    targetRmsDbfs,
    maxGainDb,
    minGainDb,
    minDeltaDb,
  };
};

const parseWavFormat = (buffer: Buffer): WavFormat | null => {
  if (buffer.byteLength < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.byteLength) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (chunkDataOffset > buffer.byteLength) break;

    if (chunkId === "fmt " && chunkSize >= 16) {
      if (chunkDataOffset + chunkSize > buffer.byteLength) return null;
      audioFormat = buffer.readUInt16LE(chunkDataOffset);
      channels = buffer.readUInt16LE(chunkDataOffset + 2);
      sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);
      bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14);
      if (audioFormat === WAVE_FORMAT_EXTENSIBLE && chunkSize >= 40) {
        const subFormat = buffer.readUInt32LE(chunkDataOffset + 24);
        if (subFormat === WAVE_FORMAT_PCM || subFormat === WAVE_FORMAT_IEEE_FLOAT) {
          audioFormat = subFormat;
        }
      }
    } else if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    const nextOffset = chunkDataOffset + chunkSize + (chunkSize % 2);
    if (nextOffset <= offset) break;
    offset = nextOffset;
  }

  if (
    !audioFormat ||
    !channels ||
    !sampleRate ||
    !bitsPerSample ||
    !dataOffset ||
    !dataSize
  ) {
    return null;
  }

  if (dataOffset >= buffer.byteLength) return null;

  return {
    audioFormat,
    channels,
    sampleRate,
    bitsPerSample,
    dataOffset,
    dataSize,
  };
};

const usablePcmBytes = (buffer: Buffer, format: WavFormat): number => {
  const available = Math.min(format.dataSize, Math.max(0, buffer.byteLength - format.dataOffset));
  return available - (available % 2);
};

const computePcm16Stats = (buffer: Buffer, format: WavFormat): PcmStats => {
  const bytes = usablePcmBytes(buffer, format);
  if (bytes <= 0) {
    return { peak: 0, rms: 0, sampleCount: 0 };
  }

  let peakInt = 0;
  let sumSquares = 0;
  const sampleCount = bytes / 2;

  for (let offset = format.dataOffset; offset < format.dataOffset + bytes; offset += 2) {
    const sample = buffer.readInt16LE(offset);
    const absSample = sample === -32768 ? 32768 : Math.abs(sample);
    if (absSample > peakInt) {
      peakInt = absSample;
    }
    sumSquares += sample * sample;
  }

  const peak = peakInt / 32768;
  const rms = Math.sqrt(sumSquares / sampleCount) / 32768;
  return { peak, rms, sampleCount };
};

const applyPcm16Gain = (buffer: Buffer, format: WavFormat, gainLinear: number): void => {
  const bytes = usablePcmBytes(buffer, format);
  for (let offset = format.dataOffset; offset < format.dataOffset + bytes; offset += 2) {
    const sample = buffer.readInt16LE(offset);
    const scaled = Math.round(sample * gainLinear);
    const clamped = scaled < -32768 ? -32768 : scaled > 32767 ? 32767 : scaled;
    buffer.writeInt16LE(clamped, offset);
  }
};

const skippedResult = (
  reason: VoiceWavNormalizationReason,
  buffer: Buffer,
  peakBefore: number,
  rmsBefore: number,
): VoiceWavNormalizationResult => ({
  buffer,
  applied: false,
  reason,
  gainLinear: 1,
  gainDb: 0,
  peakBefore,
  rmsBefore,
  peakAfter: peakBefore,
  rmsAfter: rmsBefore,
});

export const normalizeVoicePcm16WavBuffer = (params: {
  buffer: Buffer;
  options?: VoiceWavNormalizationOptions;
}): VoiceWavNormalizationResult => {
  const options = resolveOptions(params.options);
  if (!options.enabled) {
    return skippedResult("disabled", params.buffer, 0, 0);
  }

  const format = parseWavFormat(params.buffer);
  if (!format) {
    return skippedResult("unsupported_format", params.buffer, 0, 0);
  }

  if (format.audioFormat !== WAVE_FORMAT_PCM || format.bitsPerSample !== 16) {
    return skippedResult("unsupported_codec", params.buffer, 0, 0);
  }

  const before = computePcm16Stats(params.buffer, format);
  if (before.sampleCount === 0) {
    return skippedResult("no_audio_data", params.buffer, 0, 0);
  }
  if (before.peak <= 0) {
    return skippedResult("silent", params.buffer, before.peak, before.rms);
  }

  const targetPeak = dbToLinear(options.targetPeakDbfs);
  const targetRms = dbToLinear(options.targetRmsDbfs);
  const gainByPeak = targetPeak / before.peak;
  const gainByRms = before.rms > 0 ? targetRms / before.rms : gainByPeak;
  let gainLinear = Math.min(gainByPeak, gainByRms);
  gainLinear = clamp(gainLinear, dbToLinear(options.minGainDb), dbToLinear(options.maxGainDb));
  const gainDb = linearToDb(gainLinear);

  if (Math.abs(gainDb) < options.minDeltaDb) {
    return skippedResult("delta_below_threshold", params.buffer, before.peak, before.rms);
  }

  const normalized = Buffer.from(params.buffer);
  applyPcm16Gain(normalized, format, gainLinear);
  const after = computePcm16Stats(normalized, format);

  return {
    buffer: normalized,
    applied: true,
    reason: "applied",
    gainLinear,
    gainDb,
    peakBefore: before.peak,
    rmsBefore: before.rms,
    peakAfter: after.peak,
    rmsAfter: after.rms,
  };
};

const MP3_DEFAULT_OPTIONS = {
  enabled: true,
  bitrateKbps: 128,
} as const;

const runFfmpeg = async (params: {
  args: string[];
  input: Buffer;
  ffmpegPath: string;
}): Promise<{ ok: true; output: Buffer } | { ok: false; reason: "unavailable" | "failed" }> =>
  await new Promise((resolve) => {
    let childExited = false;
    let unavailable = false;
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const child = spawn(params.ffmpegPath, params.args, { stdio: ["pipe", "pipe", "pipe"] });

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (childExited) return;
      childExited = true;
      if (error.code === "ENOENT") {
        unavailable = true;
      }
      resolve({ ok: false, reason: unavailable ? "unavailable" : "failed" });
    });

    child.on("close", (code) => {
      if (childExited) return;
      childExited = true;
      if (code === 0) {
        const output = Buffer.concat(stdoutChunks);
        if (output.byteLength > 0) {
          resolve({ ok: true, output });
          return;
        }
      }
      // Preserve stderr capture for local diagnostics via debugger, but expose deterministic reason.
      const _stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      void _stderr;
      resolve({ ok: false, reason: "failed" });
    });

    child.stdin.on("error", () => {
      // no-op: close handler emits deterministic failure
    });
    child.stdin.end(params.input);
  });

const resolveMp3Options = (options?: VoiceMp3NormalizationOptions): Required<VoiceMp3NormalizationOptions> => {
  const bitrateRaw = Number.parseInt(String(options?.bitrateKbps ?? ""), 10);
  const bitrateKbps = clamp(
    Number.isFinite(bitrateRaw) ? bitrateRaw : MP3_DEFAULT_OPTIONS.bitrateKbps,
    48,
    320,
  );
  return {
    enabled: options?.enabled ?? MP3_DEFAULT_OPTIONS.enabled,
    ffmpegPath: (options?.ffmpegPath ?? "ffmpeg").trim() || "ffmpeg",
    bitrateKbps,
  };
};

const skippedMp3Result = (
  reason: VoiceMp3NormalizationReason,
  buffer: Buffer,
  peakBefore = 0,
  rmsBefore = 0,
): VoiceMp3NormalizationResult => ({
  buffer,
  applied: false,
  reason,
  gainLinear: 1,
  gainDb: 0,
  peakBefore,
  rmsBefore,
  peakAfter: peakBefore,
  rmsAfter: rmsBefore,
});

const mapWavResultToMp3 = (result: VoiceWavNormalizationResult, encodedBuffer: Buffer): VoiceMp3NormalizationResult => ({
  buffer: encodedBuffer,
  applied: result.applied,
  reason: result.reason,
  gainLinear: result.gainLinear,
  gainDb: result.gainDb,
  peakBefore: result.peakBefore,
  rmsBefore: result.rmsBefore,
  peakAfter: result.peakAfter,
  rmsAfter: result.rmsAfter,
});

export const normalizeVoiceMp3Buffer = async (params: {
  buffer: Buffer;
  wavOptions?: VoiceWavNormalizationOptions;
  mp3Options?: VoiceMp3NormalizationOptions;
}): Promise<VoiceMp3NormalizationResult> => {
  const mp3Options = resolveMp3Options(params.mp3Options);
  if (!mp3Options.enabled) {
    return skippedMp3Result("disabled", params.buffer);
  }
  if (params.wavOptions?.enabled === false) {
    return skippedMp3Result("disabled", params.buffer);
  }

  const decoded = await runFfmpeg({
    ffmpegPath: mp3Options.ffmpegPath,
    args: ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "wav", "-acodec", "pcm_s16le", "pipe:1"],
    input: params.buffer,
  });
  if (!decoded.ok) {
    return skippedMp3Result(
      decoded.reason === "unavailable" ? "ffmpeg_unavailable" : "ffmpeg_decode_failed",
      params.buffer,
    );
  }

  const normalizedWav = normalizeVoicePcm16WavBuffer({
    buffer: decoded.output,
    options: params.wavOptions,
  });
  if (!normalizedWav.applied) {
    return skippedMp3Result(
      normalizedWav.reason,
      params.buffer,
      normalizedWav.peakBefore,
      normalizedWav.rmsBefore,
    );
  }

  const encoded = await runFfmpeg({
    ffmpegPath: mp3Options.ffmpegPath,
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-f",
      "mp3",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      `${mp3Options.bitrateKbps}k`,
      "pipe:1",
    ],
    input: normalizedWav.buffer,
  });
  if (!encoded.ok) {
    return skippedMp3Result(
      encoded.reason === "unavailable" ? "ffmpeg_unavailable" : "ffmpeg_encode_failed",
      params.buffer,
      normalizedWav.peakBefore,
      normalizedWav.rmsBefore,
    );
  }

  return mapWavResultToMp3(normalizedWav, encoded.output);
};

const isWavContentType = (contentType: string): boolean => /^audio\/(x-)?wav\b/i.test(contentType);

const isMp3ContentType = (contentType: string): boolean =>
  /^audio\/(mpeg|mp3|x-mp3)\b/i.test(contentType);

export const normalizeVoiceBuffer = async (params: {
  buffer: Buffer;
  contentType: string;
  wavOptions?: VoiceWavNormalizationOptions;
  mp3Options?: VoiceMp3NormalizationOptions;
}): Promise<VoiceBufferNormalizationResult> => {
  const contentType = params.contentType.trim().toLowerCase();
  if (isWavContentType(contentType)) {
    const wav = normalizeVoicePcm16WavBuffer({
      buffer: params.buffer,
      options: params.wavOptions,
    });
    return {
      ...wav,
      codec: wav.applied ? "pcm16_wav" : "none",
    };
  }
  if (isMp3ContentType(contentType)) {
    const mp3 = await normalizeVoiceMp3Buffer({
      buffer: params.buffer,
      wavOptions: params.wavOptions,
      mp3Options: params.mp3Options,
    });
    return {
      ...mp3,
      codec: mp3.applied ? "mp3_ffmpeg" : "none",
    };
  }
  return {
    buffer: params.buffer,
    applied: false,
    reason: "unsupported_content_type",
    codec: "none",
    gainLinear: 1,
    gainDb: 0,
    peakBefore: 0,
    rmsBefore: 0,
    peakAfter: 0,
    rmsAfter: 0,
  };
};
