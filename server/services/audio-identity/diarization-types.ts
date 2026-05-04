export type {
  HelixAudioFeatureSummary,
  HelixDiarizationAudioQuality,
  HelixDiarizationProvider,
  HelixDiarizationRequest,
  HelixDiarizationResponse,
  HelixDiarizationSegment,
  HelixDiarizationShadowResult,
  HelixDiarizationShadowStatus,
  HelixDiarizationSpeaker,
} from "../../../shared/helix-diarization";

export {
  HELIX_DIARIZATION_REQUEST_SCHEMA,
  HELIX_DIARIZATION_RESPONSE_SCHEMA,
} from "../../../shared/helix-diarization";

export type HelixDiarizationConfig = {
  enabled: boolean;
  shadow: boolean;
  url: string;
  timeoutMs: number;
  minConfidence: number;
  applySegments: boolean;
  maxAudioBytes: number;
};
