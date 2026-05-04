import type { HelixCaptureSource } from "../../../shared/helix-audio-identity";
import { HELIX_DIARIZATION_REQUEST_SCHEMA } from "../../../shared/helix-diarization";
import {
  callDiarizationSidecar,
} from "./diarization-client";
import {
  type HelixDiarizationConfig,
  type HelixDiarizationShadowResult,
} from "./diarization-types";
import { summarizeAudioFeatures } from "./audio-feature-summary";

const parseBooleanFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return fallback;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const readDiarizationConfigFromEnv = (): HelixDiarizationConfig => ({
  enabled: parseBooleanFlag(process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_ENABLED, false),
  shadow: parseBooleanFlag(process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_SHADOW, true),
  url:
    process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_URL?.trim() ||
    "http://localhost:7077",
  timeoutMs: Math.max(
    50,
    Math.min(
      10_000,
      Math.round(parseNumber(process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_TIMEOUT_MS, 800)),
    ),
  ),
  minConfidence: clamp01(
    parseNumber(process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_MIN_CONFIDENCE, 0.55),
  ),
  applySegments: parseBooleanFlag(
    process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_APPLY_SEGMENTS,
    false,
  ),
  maxAudioBytes: Math.max(
    1024,
    Math.round(parseNumber(process.env.HELIX_AUDIO_IDENTITY_DIARIZATION_MAX_AUDIO_BYTES, 8_388_608)),
  ),
});

export async function runDiarizationShadow(args: {
  audioBuffer: Buffer;
  contentType: string;
  captureSessionId: string;
  roomId?: string | null;
  threadId?: string | null;
  captureSource: HelixCaptureSource;
  chunkIndex?: number | null;
  durationMs?: number | null;
  knownSpeakerIds?: string[] | null;
  config?: HelixDiarizationConfig;
}): Promise<HelixDiarizationShadowResult | null> {
  const config = args.config ?? readDiarizationConfigFromEnv();
  if (!config.enabled) return null;

  if (args.audioBuffer.byteLength > config.maxAudioBytes) {
    return {
      enabled: true,
      shadow: config.shadow,
      status: "skipped",
      provider: null,
      duration_ms: null,
      speakers: [],
      segments: [],
      audio_quality: null,
      audio_features: null,
      error: "audio_exceeds_diarization_max_audio_bytes",
    };
  }

  const audioFeatures = summarizeAudioFeatures(args.audioBuffer, args.contentType);
  const result = await callDiarizationSidecar(
    {
      schema: HELIX_DIARIZATION_REQUEST_SCHEMA,
      capture_session_id: args.captureSessionId,
      room_id: args.roomId ?? null,
      thread_id: args.threadId ?? null,
      capture_source: args.captureSource,
      content_type: args.contentType,
      audio_base64: args.audioBuffer.toString("base64"),
      chunk_index: args.chunkIndex ?? null,
      duration_ms: args.durationMs ?? null,
      known_speaker_ids: args.knownSpeakerIds ?? [],
    },
    config,
  );
  return {
    ...result,
    audio_features: audioFeatures,
  };
}
