import {
  HELIX_AUDIO_IDENTITY_SCHEMA,
  resolveHelixSpeakerColorToken,
  type HelixAudioIdentityResult,
  type HelixCaptureSource,
  type HelixSpeakerAuthority,
  type HelixSpeakerLabel,
  type HelixSpeakerPolicyMode,
  type HelixSpeakerRole,
  type HelixUnknownSpeakerBehavior,
} from "../../../shared/helix-audio-identity";
import { resolveSpeakerAuthorityPolicy } from "./speaker-policy";

const DEFAULT_SPEAKER_CONFIDENCE = 0.5;
const NOISY_ENVIRONMENT_SNR_DB = 12;
const LOW_SPEECH_PROBABILITY = 0.62;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const isDeviceAudioSource = (source: HelixCaptureSource): boolean => source !== "mic";

const displayNameForRole = (role: HelixSpeakerRole, speakerId: string): string => {
  if (role === "owner") return "You";
  if (role === "trusted_guest") return "Trusted guest";
  if (role === "device_audio") return "Device audio";
  if (role === "unknown") return "Unknown speaker";
  const suffix = speakerId.replace(/^spk[_-]?/i, "").slice(0, 8);
  return suffix ? `Guest ${suffix}` : "Guest";
};

const resolveRole = (args: {
  captureSource: HelixCaptureSource;
  speakerId: string;
  speakerRole?: HelixSpeakerRole | null;
  knownSpeakerIds: string[];
  activeListenerSpeakerIds: string[];
}): HelixSpeakerRole => {
  if (args.speakerRole) return args.speakerRole;
  if (isDeviceAudioSource(args.captureSource)) return "device_audio";
  if (args.activeListenerSpeakerIds.includes(args.speakerId)) return "owner";
  if (args.knownSpeakerIds.includes(args.speakerId)) return "trusted_guest";
  return args.speakerId === "spk_session_unknown" ? "unknown" : "guest";
};

export const buildHelixAudioIdentityResult = (args: {
  speakerIdentityEnabled?: boolean | null;
  captureSessionId?: string | null;
  roomId?: string | null;
  threadId?: string | null;
  chunkIndex?: number | null;
  captureSource: HelixCaptureSource;
  text?: string | null;
  language?: string | null;
  durationMs?: number | null;
  speakerId?: string | null;
  speakerConfidence?: number | null;
  speechProbability?: number | null;
  snrDb?: number | null;
  overlappingSpeech?: boolean | null;
  speakerRole?: HelixSpeakerRole | null;
  speakerAuthority?: HelixSpeakerAuthority | null;
  policyMode?: HelixSpeakerPolicyMode | null;
  unknownSpeakerBehavior?: HelixUnknownSpeakerBehavior | null;
  knownSpeakerIds?: string[] | null;
  activeListenerSpeakerIds?: string[] | null;
}): HelixAudioIdentityResult | null => {
  const speakerId = args.speakerId?.trim() || (args.speakerIdentityEnabled ? "spk_session_unknown" : "");
  const hasIdentityInput =
    args.speakerIdentityEnabled === true ||
    Boolean(speakerId) ||
    typeof args.speakerConfidence === "number" ||
    Boolean(args.speakerRole) ||
    Boolean(args.speakerAuthority);
  if (!hasIdentityInput) return null;

  const resolvedSpeakerId = speakerId || "spk_session_unknown";
  const policyMode = args.policyMode ?? "profile_only";
  const unknownSpeakerBehavior = args.unknownSpeakerBehavior ?? "transcribe_only";
  const knownSpeakerIds = args.knownSpeakerIds ?? [];
  const activeListenerSpeakerIds = args.activeListenerSpeakerIds ?? [];
  const role = resolveRole({
    captureSource: args.captureSource,
    speakerId: resolvedSpeakerId,
    speakerRole: args.speakerRole,
    knownSpeakerIds,
    activeListenerSpeakerIds,
  });
  const policy = resolveSpeakerAuthorityPolicy({
    captureSource: args.captureSource,
    rawRole: role,
    rawAuthority: args.speakerAuthority ?? null,
    policyMode,
    unknownSpeakerBehavior,
  });
  const confidence =
    typeof args.speakerConfidence === "number" && Number.isFinite(args.speakerConfidence)
      ? clamp01(args.speakerConfidence)
      : DEFAULT_SPEAKER_CONFIDENCE;
  const speaker: HelixSpeakerLabel = {
    speaker_id: resolvedSpeakerId,
    display_name: displayNameForRole(policy.role, resolvedSpeakerId),
    color_token: resolveHelixSpeakerColorToken(args.roomId, resolvedSpeakerId),
    role: policy.role,
    authority: policy.authority,
    authority_source: policy.authority_source,
    authority_reason: policy.authority_reason,
    confidence,
    enrollment_state: "none",
  };
  const durationMs =
    typeof args.durationMs === "number" && Number.isFinite(args.durationMs)
      ? Math.max(0, Math.round(args.durationMs))
      : 0;
  const chunkIndex =
    typeof args.chunkIndex === "number" && Number.isFinite(args.chunkIndex)
      ? Math.max(0, Math.round(args.chunkIndex))
      : 0;
  const captureSessionId = args.captureSessionId?.trim() || "capture_session_unknown";
  const segment = {
    segment_id: `${captureSessionId}:seg:${chunkIndex}`,
    speaker_id: resolvedSpeakerId,
    speaker_confidence: confidence,
    start_ms: 0,
    end_ms: durationMs,
    text: args.text?.trim() || undefined,
    language: args.language?.trim() || undefined,
    speech_probability:
      typeof args.speechProbability === "number" && Number.isFinite(args.speechProbability)
        ? clamp01(args.speechProbability)
        : undefined,
    snr_db:
      typeof args.snrDb === "number" && Number.isFinite(args.snrDb)
        ? args.snrDb
        : undefined,
    overlap: args.overlappingSpeech === true ? true : undefined,
    capture_source: args.captureSource,
  };

  const noisyBySnr = typeof args.snrDb === "number" && args.snrDb < NOISY_ENVIRONMENT_SNR_DB;
  const noisyBySpeechProbability =
    typeof args.speechProbability === "number" && args.speechProbability < LOW_SPEECH_PROBABILITY;

  return {
    schema: HELIX_AUDIO_IDENTITY_SCHEMA,
    capture_session_id: captureSessionId,
    room_id: args.roomId ?? null,
    thread_id: args.threadId ?? null,
    primary_speaker_id: resolvedSpeakerId,
    speakers: [speaker],
    segments: [segment],
    ambient_noise: {
      snr_db: typeof args.snrDb === "number" && Number.isFinite(args.snrDb) ? args.snrDb : null,
      speech_probability:
        typeof args.speechProbability === "number" && Number.isFinite(args.speechProbability)
          ? clamp01(args.speechProbability)
          : null,
      noisy_environment: noisyBySnr || noisyBySpeechProbability,
    },
    policy: {
      command_authority: policyMode,
      unknown_speaker_behavior: unknownSpeakerBehavior,
    },
  };
};
