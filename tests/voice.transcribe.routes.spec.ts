import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sttHttpHandlerMock, sttWhisperHandlerMock } = vi.hoisted(() => ({
  sttHttpHandlerMock: vi.fn(),
  sttWhisperHandlerMock: vi.fn(),
}));
const { recoverSttInvalidFormatToPcmWavMock } = vi.hoisted(() => ({
  recoverSttInvalidFormatToPcmWavMock: vi.fn(),
}));

vi.mock("../server/skills/stt.whisper.http", () => ({
  sttHttpHandler: sttHttpHandlerMock,
}));

vi.mock("../server/skills/stt.whisper", () => ({
  sttWhisperHandler: sttWhisperHandlerMock,
}));

vi.mock("../server/services/audio/stt-format-recovery", () => ({
  isSttInvalidFormatMessage: (message: string) => message.toLowerCase().includes("invalid file format"),
  recoverSttInvalidFormatToPcmWav: recoverSttInvalidFormatToPcmWavMock,
}));

import { resetVoiceRouteState, voiceRouter } from "../server/routes/voice";

const ORIGINAL_ENV = {
  ENABLE_VOICE_TRANSCRIBE: process.env.ENABLE_VOICE_TRANSCRIBE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  LLM_HTTP_API_KEY: process.env.LLM_HTTP_API_KEY,
  WHISPER_HTTP_API_KEY: process.env.WHISPER_HTTP_API_KEY,
  WHISPER_HTTP_MODEL: process.env.WHISPER_HTTP_MODEL,
  STT_POLICY_MODE: process.env.STT_POLICY_MODE,
  STT_OUTPUT_MODE: process.env.STT_OUTPUT_MODE,
  STT_LOCAL_URL: process.env.STT_LOCAL_URL,
  STT_LOCAL_MODE: process.env.STT_LOCAL_MODE,
  STT_LOCAL_API_KEY: process.env.STT_LOCAL_API_KEY,
  STT_LOCAL_MODEL: process.env.STT_LOCAL_MODEL,
  STT_LOCAL_EMBEDDED_ENABLED: process.env.STT_LOCAL_EMBEDDED_ENABLED,
  WHISPER_HTTP_URL: process.env.WHISPER_HTTP_URL,
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/voice", voiceRouter);
  return app;
};

describe("voice transcribe route", () => {
  beforeEach(() => {
    resetVoiceRouteState();
    sttHttpHandlerMock.mockReset();
    sttWhisperHandlerMock.mockReset();
    recoverSttInvalidFormatToPcmWavMock.mockReset();
    delete process.env.ENABLE_VOICE_TRANSCRIBE;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_HTTP_API_KEY;
    delete process.env.WHISPER_HTTP_API_KEY;
    delete process.env.WHISPER_HTTP_MODEL;
    delete process.env.STT_POLICY_MODE;
    delete process.env.STT_OUTPUT_MODE;
    delete process.env.STT_LOCAL_URL;
    delete process.env.STT_LOCAL_MODE;
    delete process.env.STT_LOCAL_API_KEY;
    delete process.env.STT_LOCAL_MODEL;
    process.env.STT_LOCAL_EMBEDDED_ENABLED = "0";
    delete process.env.WHISPER_HTTP_URL;
  });

  afterEach(() => {
    resetVoiceRouteState();
    if (ORIGINAL_ENV.ENABLE_VOICE_TRANSCRIBE === undefined) {
      delete process.env.ENABLE_VOICE_TRANSCRIBE;
    } else {
      process.env.ENABLE_VOICE_TRANSCRIBE = ORIGINAL_ENV.ENABLE_VOICE_TRANSCRIBE;
    }
    if (ORIGINAL_ENV.OPENAI_API_KEY === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = ORIGINAL_ENV.OPENAI_API_KEY;
    }
    if (ORIGINAL_ENV.LLM_HTTP_API_KEY === undefined) {
      delete process.env.LLM_HTTP_API_KEY;
    } else {
      process.env.LLM_HTTP_API_KEY = ORIGINAL_ENV.LLM_HTTP_API_KEY;
    }
    if (ORIGINAL_ENV.WHISPER_HTTP_API_KEY === undefined) {
      delete process.env.WHISPER_HTTP_API_KEY;
    } else {
      process.env.WHISPER_HTTP_API_KEY = ORIGINAL_ENV.WHISPER_HTTP_API_KEY;
    }
    if (ORIGINAL_ENV.WHISPER_HTTP_MODEL === undefined) {
      delete process.env.WHISPER_HTTP_MODEL;
    } else {
      process.env.WHISPER_HTTP_MODEL = ORIGINAL_ENV.WHISPER_HTTP_MODEL;
    }
    if (ORIGINAL_ENV.STT_POLICY_MODE === undefined) {
      delete process.env.STT_POLICY_MODE;
    } else {
      process.env.STT_POLICY_MODE = ORIGINAL_ENV.STT_POLICY_MODE;
    }
    if (ORIGINAL_ENV.STT_OUTPUT_MODE === undefined) {
      delete process.env.STT_OUTPUT_MODE;
    } else {
      process.env.STT_OUTPUT_MODE = ORIGINAL_ENV.STT_OUTPUT_MODE;
    }
    if (ORIGINAL_ENV.STT_LOCAL_URL === undefined) {
      delete process.env.STT_LOCAL_URL;
    } else {
      process.env.STT_LOCAL_URL = ORIGINAL_ENV.STT_LOCAL_URL;
    }
    if (ORIGINAL_ENV.STT_LOCAL_MODE === undefined) {
      delete process.env.STT_LOCAL_MODE;
    } else {
      process.env.STT_LOCAL_MODE = ORIGINAL_ENV.STT_LOCAL_MODE;
    }
    if (ORIGINAL_ENV.STT_LOCAL_API_KEY === undefined) {
      delete process.env.STT_LOCAL_API_KEY;
    } else {
      process.env.STT_LOCAL_API_KEY = ORIGINAL_ENV.STT_LOCAL_API_KEY;
    }
    if (ORIGINAL_ENV.STT_LOCAL_MODEL === undefined) {
      delete process.env.STT_LOCAL_MODEL;
    } else {
      process.env.STT_LOCAL_MODEL = ORIGINAL_ENV.STT_LOCAL_MODEL;
    }
    if (ORIGINAL_ENV.STT_LOCAL_EMBEDDED_ENABLED === undefined) {
      delete process.env.STT_LOCAL_EMBEDDED_ENABLED;
    } else {
      process.env.STT_LOCAL_EMBEDDED_ENABLED = ORIGINAL_ENV.STT_LOCAL_EMBEDDED_ENABLED;
    }
    if (ORIGINAL_ENV.WHISPER_HTTP_URL === undefined) {
      delete process.env.WHISPER_HTTP_URL;
    } else {
      process.env.WHISPER_HTTP_URL = ORIGINAL_ENV.WHISPER_HTTP_URL;
    }
  });

  it("returns deterministic transcription JSON for OpenAI-first uploads", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    sttHttpHandlerMock.mockResolvedValue({
      text: "Alpha bubble stable.",
      language: "en",
      duration_ms: 1200,
      segments: [{ text: "Alpha bubble stable.", start_ms: 0, end_ms: 1200, confidence: 0.98 }],
      essence_id: "essence-1",
    });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-1")
      .field("missionId", "mission-1")
      .field("durationMs", "1200")
      .attach("audio", Buffer.from("RIFF....WAVE"), {
        filename: "input.wav",
        contentType: "audio/wav",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      text: "Alpha bubble stable.",
      language: "en",
      duration_ms: 1200,
      segments: [{ text: "Alpha bubble stable.", start_ms: 0, end_ms: 1200, confidence: 0.98 }],
      source_text: null,
      source_language: null,
      translated: false,
      confidence: 0.98,
      confidence_reason: "segment_average",
      needs_confirmation: false,
      translation_uncertain: false,
      traceId: "trace-1",
      missionId: "mission-1",
      engine: "openai_transcribe",
      essence_id: "essence-1",
    });
    expect(sttHttpHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        audio_url: expect.stringContaining("data:audio/wav;base64,"),
        task: "transcribe",
        backend_mode: "openai",
        backend_url: "https://api.openai.com",
        api_key: "openai-key",
        model: "gpt-4o-mini-transcribe",
        duration_ms: 1200,
      }),
      { personaId: "mission-1" },
    );
    expect(sttWhisperHandlerMock).not.toHaveBeenCalled();
  });

  it("uses OPENAI_API_KEY first for OpenAI STT backend auth", async () => {
    process.env.WHISPER_HTTP_API_KEY = "stt-key";
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.LLM_HTTP_API_KEY = "llm-key";
    sttHttpHandlerMock.mockResolvedValue({
      text: "Key precedence check",
      language: "en",
      duration_ms: 500,
      segments: [],
    });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(sttHttpHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        api_key: "openai-key",
      }),
      expect.anything(),
    );
  });

  it("keeps OpenAI-first backend pinned to OpenAI base even when WHISPER_HTTP_URL is set", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.WHISPER_HTTP_URL = "http://127.0.0.1:9999";
    sttHttpHandlerMock.mockResolvedValue({
      text: "Pinned OpenAI backend",
      language: "en",
      duration_ms: 500,
      segments: [],
    });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(sttHttpHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        backend_mode: "openai",
        backend_url: "https://api.openai.com",
        api_key: "openai-key",
      }),
      expect.anything(),
    );
  });

  it("fails closed when audio is missing", async () => {
    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-missing");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("voice_invalid_request");
    expect(res.body.message).toBe("Audio upload is required.");
    expect(res.body.details).toEqual({ field: "audio" });
    expect(res.body.traceId).toBe("trace-missing");
    expect(sttHttpHandlerMock).not.toHaveBeenCalled();
  });

  it("returns voice_unavailable when transcription is disabled", async () => {
    process.env.ENABLE_VOICE_TRANSCRIBE = "0";

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-disabled")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("voice_unavailable");
    expect(res.body.traceId).toBe("trace-disabled");
    expect(res.body.details).toEqual({ transcriptionEnabled: false });
    expect(sttHttpHandlerMock).not.toHaveBeenCalled();
  });

  it("returns voice_unavailable when policy backend is unconfigured", async () => {
    process.env.STT_POLICY_MODE = "local_only";
    process.env.STT_LOCAL_EMBEDDED_ENABLED = "0";
    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-unconfigured")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("voice_unavailable");
    expect(res.body.message).toBe("Voice transcription backend is not configured.");
    expect(res.body.traceId).toBe("trace-unconfigured");
    expect(res.body.details.policyMode).toBe("local_only");
    expect(sttHttpHandlerMock).not.toHaveBeenCalled();
    expect(sttWhisperHandlerMock).not.toHaveBeenCalled();
  });

  it("translates non-English transcription to English by default", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    sttHttpHandlerMock
      .mockResolvedValueOnce({
        text: "Hola, sistema.",
        language: "es",
        duration_ms: 900,
        segments: [{ text: "Hola, sistema.", start_ms: 0, end_ms: 900, confidence: 0.94 }],
      })
      .mockResolvedValueOnce({
        text: "Hello, system.",
        language: "en",
        duration_ms: 900,
        segments: [],
      });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-translate")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Hello, system.");
    expect(res.body.language).toBe("en");
    expect(res.body.source_text).toBe("Hola, sistema.");
    expect(res.body.source_language).toBe("es");
    expect(res.body.translated).toBe(true);
    expect(sttHttpHandlerMock).toHaveBeenCalledTimes(2);
    expect(sttHttpHandlerMock.mock.calls[1][0]).toMatchObject({
      task: "translate",
      model: "whisper-1",
    });
  });

  it("falls back to local backend when OpenAI-first transcription fails", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.STT_LOCAL_URL = "http://127.0.0.1:7777";
    process.env.STT_LOCAL_MODE = "generic";
    sttHttpHandlerMock
      .mockRejectedValueOnce(new Error("STT HTTP 503"))
      .mockResolvedValueOnce({
        text: "Fallback transcript",
        language: "en",
        duration_ms: 400,
        segments: [],
      });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-fallback")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Fallback transcript");
    expect(res.body.engine).toBe("faster_whisper_local");
    expect(sttHttpHandlerMock).toHaveBeenCalledTimes(2);
    expect(sttHttpHandlerMock.mock.calls[1][0]).toMatchObject({
      backend_url: "http://127.0.0.1:7777",
      backend_mode: "generic",
      task: "transcribe",
    });
  });

  it("returns stable backend errors when all configured backends fail", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    sttHttpHandlerMock.mockRejectedValue(new Error("STT HTTP 503"));

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-backend")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("voice_backend_error");
    expect(res.body.message).toBe("Voice transcription failed.");
    expect(res.body.traceId).toBe("trace-backend");
    expect(Array.isArray(res.body.details.attempts)).toBe(true);
    expect(res.body.details.attempts[0].engine).toBe("openai_transcribe");
    expect(sttHttpHandlerMock).toHaveBeenCalledTimes(1);
  });

  it("recovers invalid-format uploads with one ffmpeg wav retry", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    sttHttpHandlerMock
      .mockRejectedValueOnce(
        new Error(
          "STT HTTP 400: invalid file format. Supported formats: ['flac','m4a','mp3','mp4','mpeg','mpga','oga','ogg','wav','webm']",
        ),
      )
      .mockResolvedValueOnce({
        text: "Recovered transcript",
        language: "en",
        duration_ms: 700,
        segments: [],
      });
    recoverSttInvalidFormatToPcmWavMock.mockResolvedValue({
      ok: true,
      buffer: Buffer.from("RIFF....WAVE"),
      mimeType: "audio/wav",
      fileName: "input.wav",
      ffmpegPath: "ffmpeg",
    });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-recover")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Recovered transcript");
    expect(res.body.engine).toBe("openai_transcribe");
    expect(sttHttpHandlerMock).toHaveBeenCalledTimes(2);
    expect(sttHttpHandlerMock.mock.calls[1][0]).toMatchObject({
      audio_url: expect.stringContaining("data:audio/wav;base64,"),
      task: "transcribe",
    });
    expect(recoverSttInvalidFormatToPcmWavMock).toHaveBeenCalledTimes(1);
  });

  it("fails deterministically when invalid-format recovery cannot run", async () => {
    process.env.OPENAI_API_KEY = "openai-key";
    sttHttpHandlerMock.mockRejectedValue(
      new Error(
        "STT HTTP 400: invalid file format. Supported formats: ['flac','m4a','mp3','mp4','mpeg','mpga','oga','ogg','wav','webm']",
      ),
    );
    recoverSttInvalidFormatToPcmWavMock.mockResolvedValue({
      ok: false,
      reason: "ffmpeg_unavailable",
      ffmpegPath: "ffmpeg",
    });

    const res = await request(buildApp())
      .post("/api/voice/transcribe")
      .field("traceId", "trace-recover-fail")
      .attach("audio", Buffer.from("voice"), {
        filename: "input.webm",
        contentType: "audio/webm",
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("voice_backend_error");
    expect(res.body.message).toBe("Voice transcription failed.");
    expect(res.body.traceId).toBe("trace-recover-fail");
    expect(Array.isArray(res.body.details.attempts)).toBe(true);
    expect(
      res.body.details.attempts.some(
        (attempt: { stage?: string; message?: string }) =>
          attempt.stage === "format_recovery" &&
          String(attempt.message ?? "").includes("ffmpeg_unavailable"),
      ),
    ).toBe(true);
    expect(res.body.details.formatRecovery).toMatchObject({
      attempted: true,
      succeeded: false,
      reason: "ffmpeg_unavailable",
    });
  });
});
