import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { spawnSync } from "node:child_process";

const parseBinary = (
  res: NodeJS.ReadableStream & { setEncoding(encoding: BufferEncoding): void },
  callback: (error: Error | null, body?: Buffer) => void,
): void => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  res.on("end", () => callback(null, Buffer.concat(chunks)));
  res.on("error", (error: Error) => callback(error));
};

const buildSineWav = (amplitude: number): Buffer => {
  const sampleRate = 16000;
  const durationSeconds = 0.5;
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
    const sample = Math.sin(2 * Math.PI * 440 * t) * amplitude;
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2);
  }
  return buffer;
};

const buildApp = async () => {
  await vi.resetModules();
  const { voiceRouter, resetVoiceRouteState } = await import("../routes/voice");
  resetVoiceRouteState();
  const app = express();
  app.use(express.json());
  app.use("/api/voice", voiceRouter);
  return app;
};

describe("voice routes normalization", () => {
  const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
  const itIfFfmpeg = hasFfmpeg ? it : it.skip;

  beforeEach(() => {
    process.env.TTS_BASE_URL = "http://voice.local";
    process.env.VOICE_PROXY_DRY_RUN = "0";
    process.env.VOICE_SPEAK_NORMALIZE_ENABLED = "1";
    process.env.VOICE_SPEAK_TARGET_PEAK_DBFS = "-2";
    process.env.VOICE_SPEAK_TARGET_RMS_DBFS = "-16";
    process.env.VOICE_SPEAK_MAX_GAIN_DB = "18";
    process.env.VOICE_SPEAK_MIN_DELTA_DB = "0.1";
    process.env.VOICE_SPEAK_MP3_NORMALIZE_ENABLED = "1";
    process.env.VOICE_SPEAK_MP3_BITRATE_KBPS = "128";
  });

  afterEach(() => {
    delete process.env.TTS_BASE_URL;
    delete process.env.VOICE_PROXY_DRY_RUN;
    delete process.env.VOICE_SPEAK_NORMALIZE_ENABLED;
    delete process.env.VOICE_SPEAK_TARGET_PEAK_DBFS;
    delete process.env.VOICE_SPEAK_TARGET_RMS_DBFS;
    delete process.env.VOICE_SPEAK_MAX_GAIN_DB;
    delete process.env.VOICE_SPEAK_MIN_DELTA_DB;
    delete process.env.VOICE_SPEAK_MP3_NORMALIZE_ENABLED;
    delete process.env.VOICE_SPEAK_MP3_BITRATE_KBPS;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes quiet wav responses before returning speech audio", async () => {
    const source = buildSineWav(0.08);
    const fetchMock = vi.fn(async () => {
      return new Response(source, {
        status: 200,
        headers: { "content-type": "audio/wav" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const app = await buildApp();
    const response = await request(app)
      .post("/api/voice/speak")
      .send({
        text: "test output",
        mode: "briefing",
        priority: "info",
        format: "wav",
      })
      .buffer(true)
      .parse(parseBinary)
      .expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers["x-voice-normalization"]).toBe("pcm16_wav_applied");
    expect(Number(response.headers["x-voice-normalization-gain-db"])).toBeGreaterThan(0);
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(Buffer.compare(response.body as Buffer, source)).not.toBe(0);
  });

  itIfFfmpeg("normalizes mpeg responses through ffmpeg path before returning audio", async () => {
    const sourceWav = buildSineWav(0.08);
    const encoded = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "wav",
        "-i",
        "pipe:0",
        "-f",
        "mp3",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "128k",
        "pipe:1",
      ],
      { input: sourceWav },
    );
    expect(encoded.status).toBe(0);
    const sourceMp3 = Buffer.from(encoded.stdout);
    expect(sourceMp3.byteLength).toBeGreaterThan(0);

    const fetchMock = vi.fn(async () => {
      return new Response(sourceMp3, {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const app = await buildApp();
    const response = await request(app)
      .post("/api/voice/speak")
      .send({
        text: "test output",
        mode: "briefing",
        priority: "info",
        format: "mp3",
      })
      .buffer(true)
      .parse(parseBinary)
      .expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers["x-voice-normalization"]).toBe("mp3_ffmpeg_applied");
    expect(Number(response.headers["x-voice-normalization-gain-db"])).toBeGreaterThan(0);
    expect(response.headers["content-type"]).toContain("audio/mpeg");
    expect(Buffer.compare(response.body as Buffer, sourceMp3)).not.toBe(0);
  });
});
