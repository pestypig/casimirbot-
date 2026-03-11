import path from "node:path";
import { spawn } from "node:child_process";

export type SttInvalidFormatRecoverySuccess = {
  ok: true;
  buffer: Buffer;
  mimeType: "audio/wav";
  fileName: string;
  ffmpegPath: string;
};

export type SttInvalidFormatRecoveryFailure = {
  ok: false;
  reason: "ffmpeg_unavailable" | "ffmpeg_failed";
  ffmpegPath: string;
};

export type SttInvalidFormatRecoveryResult =
  | SttInvalidFormatRecoverySuccess
  | SttInvalidFormatRecoveryFailure;

const normalizeRecoveredFileName = (originalName?: string | null): string => {
  const base = (originalName ?? "").trim();
  if (!base) return "voice-recovered.wav";
  const parsed = path.parse(base);
  const stem = parsed.name?.trim() || "voice-recovered";
  return `${stem}.wav`;
};

export const isSttInvalidFormatMessage = (message: string): boolean => {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes("invalid file format") ||
    normalized.includes("unsupported format") ||
    normalized.includes("supported formats")
  );
};

export async function recoverSttInvalidFormatToPcmWav(params: {
  buffer: Buffer;
  originalName?: string | null;
  ffmpegPath?: string | null;
  sampleRateHz?: number;
}): Promise<SttInvalidFormatRecoveryResult> {
  const ffmpegPath = (params.ffmpegPath ?? "ffmpeg").trim() || "ffmpeg";
  const sampleRateHz =
    typeof params.sampleRateHz === "number" && Number.isFinite(params.sampleRateHz)
      ? Math.max(8000, Math.round(params.sampleRateHz))
      : 16_000;
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    "pipe:0",
    "-ac",
    "1",
    "-ar",
    String(sampleRateHz),
    "-f",
    "wav",
    "-acodec",
    "pcm_s16le",
    "pipe:1",
  ];

  return await new Promise<SttInvalidFormatRecoveryResult>((resolve) => {
    let settled = false;
    const stdoutChunks: Buffer[] = [];

    const child = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] });

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      resolve({
        ok: false,
        reason: error.code === "ENOENT" ? "ffmpeg_unavailable" : "ffmpeg_failed",
        ffmpegPath,
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        const output = Buffer.concat(stdoutChunks);
        if (output.byteLength > 0) {
          resolve({
            ok: true,
            buffer: output,
            mimeType: "audio/wav",
            fileName: normalizeRecoveredFileName(params.originalName),
            ffmpegPath,
          });
          return;
        }
      }
      resolve({
        ok: false,
        reason: "ffmpeg_failed",
        ffmpegPath,
      });
    });

    child.stdin.on("error", () => {
      // close/error handler resolves deterministically.
    });
    child.stdin.end(params.buffer);
  });
}
