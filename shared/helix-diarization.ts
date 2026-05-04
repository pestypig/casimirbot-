import type { HelixCaptureSource } from "./helix-audio-identity";

export const HELIX_DIARIZATION_REQUEST_SCHEMA = "helix.diarization.request.v1" as const;
export const HELIX_DIARIZATION_RESPONSE_SCHEMA = "helix.diarization.response.v1" as const;

export type HelixDiarizationProvider = "local_sidecar" | "mock";

export type HelixDiarizationRequest = {
  schema: typeof HELIX_DIARIZATION_REQUEST_SCHEMA;
  capture_session_id: string;
  room_id?: string | null;
  thread_id?: string | null;
  capture_source: HelixCaptureSource;
  content_type: string;
  audio_base64: string;
  chunk_index?: number | null;
  duration_ms?: number | null;
  known_speaker_ids?: string[];
};

export type HelixDiarizationSpeaker = {
  speaker_id: string;
  confidence: number;
  embedding_ref?: string | null;
};

export type HelixDiarizationSegment = {
  segment_id: string;
  speaker_id: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  overlap?: boolean;
};

export type HelixDiarizationAudioQuality = {
  speech_probability?: number | null;
  snr_db?: number | null;
  spectral_noise_score?: number | null;
  spectral_centroid_hz?: number | null;
};

export type HelixDiarizationResponse = {
  schema: typeof HELIX_DIARIZATION_RESPONSE_SCHEMA;
  ok: boolean;
  provider: HelixDiarizationProvider;
  speakers: HelixDiarizationSpeaker[];
  segments: HelixDiarizationSegment[];
  audio_quality?: HelixDiarizationAudioQuality | null;
  error?: string | null;
};

export type HelixAudioFeatureSummary = {
  rms?: number | null;
  peak?: number | null;
  estimated_noise_floor?: number | null;
  spectral_centroid_hz?: number | null;
  spectral_flatness?: number | null;
  zero_crossing_rate?: number | null;
  likely_voice_band_energy?: number | null;
};

export type HelixDiarizationShadowStatus =
  | "disabled"
  | "success"
  | "timeout"
  | "provider_error"
  | "parse_error"
  | "skipped";

export type HelixDiarizationShadowResult = {
  enabled: boolean;
  shadow: boolean;
  status: HelixDiarizationShadowStatus;
  provider?: HelixDiarizationProvider | null;
  duration_ms?: number | null;
  speakers: HelixDiarizationSpeaker[];
  segments: HelixDiarizationSegment[];
  audio_quality?: HelixDiarizationAudioQuality | null;
  audio_features?: HelixAudioFeatureSummary | null;
  error?: string | null;
};
