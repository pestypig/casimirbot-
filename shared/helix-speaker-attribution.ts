import type {
  HelixAudioIdentityResult,
  HelixSpeakerLabel,
  HelixSpeakerSegment,
} from "./helix-audio-identity";

export type HelixSpeakerAttributedTranscriptLine = {
  id: string;
  speaker: HelixSpeakerLabel;
  segment: HelixSpeakerSegment;
  text: string;
};

export type HelixSpeakerAttributionEnvelope = {
  schema: "helix.speaker_attribution.v1";
  audio_identity: HelixAudioIdentityResult;
  lines: HelixSpeakerAttributedTranscriptLine[];
};

export type {
  HelixAudioIdentityResult,
  HelixSpeakerLabel,
  HelixSpeakerSegment,
};
