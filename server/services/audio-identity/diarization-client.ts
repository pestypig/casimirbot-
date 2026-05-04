import { z } from "zod";
import {
  HELIX_DIARIZATION_RESPONSE_SCHEMA,
  type HelixDiarizationConfig,
  type HelixDiarizationRequest,
  type HelixDiarizationShadowResult,
} from "./diarization-types";

const SpeakerSchema = z.object({
  speaker_id: z.string().trim().min(1).max(160),
  confidence: z.number().min(0).max(1),
  embedding_ref: z.string().trim().max(500).nullable().optional(),
});

const SegmentSchema = z.object({
  segment_id: z.string().trim().min(1).max(240),
  speaker_id: z.string().trim().min(1).max(160),
  start_ms: z.number().min(0),
  end_ms: z.number().min(0),
  confidence: z.number().min(0).max(1),
  overlap: z.boolean().optional(),
}).refine((segment) => segment.end_ms >= segment.start_ms, {
  message: "segment end_ms must be >= start_ms",
});

const DiarizationResponseSchema = z.object({
  schema: z.literal(HELIX_DIARIZATION_RESPONSE_SCHEMA),
  ok: z.boolean(),
  provider: z.enum(["local_sidecar", "mock"]),
  speakers: z.array(SpeakerSchema).max(64),
  segments: z.array(SegmentSchema).max(256),
  audio_quality: z
    .object({
      speech_probability: z.number().min(0).max(1).nullable().optional(),
      snr_db: z.number().min(-80).max(80).nullable().optional(),
      spectral_noise_score: z.number().min(0).max(1).nullable().optional(),
      spectral_centroid_hz: z.number().min(0).nullable().optional(),
    })
    .nullable()
    .optional(),
  error: z.string().max(1000).nullable().optional(),
});

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

export async function callDiarizationSidecar(
  request: HelixDiarizationRequest,
  config: HelixDiarizationConfig,
): Promise<HelixDiarizationShadowResult> {
  const startedAt = Date.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: abortController.signal,
    });
    const durationMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        enabled: true,
        shadow: config.shadow,
        status: "provider_error",
        provider: null,
        duration_ms: durationMs,
        speakers: [],
        segments: [],
        audio_quality: null,
        error: `diarization_provider_http_${response.status}`,
      };
    }
    const payload = await response.json();
    const parsed = DiarizationResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        enabled: true,
        shadow: config.shadow,
        status: "parse_error",
        provider: null,
        duration_ms: durationMs,
        speakers: [],
        segments: [],
        audio_quality: null,
        error: "diarization_provider_parse_error",
      };
    }
    if (!parsed.data.ok) {
      return {
        enabled: true,
        shadow: config.shadow,
        status: "provider_error",
        provider: parsed.data.provider,
        duration_ms: durationMs,
        speakers: [],
        segments: [],
        audio_quality: parsed.data.audio_quality ?? null,
        error: parsed.data.error ?? "diarization_provider_error",
      };
    }
    const filteredSpeakers = parsed.data.speakers.filter(
      (speaker) => speaker.confidence >= config.minConfidence,
    );
    const allowedSpeakerIds = new Set(filteredSpeakers.map((speaker) => speaker.speaker_id));
    const filteredSegments = parsed.data.segments.filter(
      (segment) =>
        segment.confidence >= config.minConfidence && allowedSpeakerIds.has(segment.speaker_id),
    );
    return {
      enabled: true,
      shadow: config.shadow,
      status: "success",
      provider: parsed.data.provider,
      duration_ms: durationMs,
      speakers: filteredSpeakers,
      segments: filteredSegments,
      audio_quality: parsed.data.audio_quality ?? null,
      error: parsed.data.error ?? null,
    };
  } catch (error) {
    return {
      enabled: true,
      shadow: config.shadow,
      status: isAbortError(error) ? "timeout" : "provider_error",
      provider: null,
      duration_ms: Date.now() - startedAt,
      speakers: [],
      segments: [],
      audio_quality: null,
      error: isAbortError(error) ? "diarization_provider_timeout" : "diarization_provider_error",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
