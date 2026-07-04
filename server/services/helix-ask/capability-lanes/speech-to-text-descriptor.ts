import { hasAnyConfiguredEnvVar } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const speechToTextLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "speech_to_text",
  family: "speech_to_text",
  label: "Speech to text",
  description: "Audio transcription lane that normalizes microphone transcripts into non-terminal live-answer mail observations.",
  backend_family: "openai_compatible",
  model_or_service_ref: "speech_to_text_default",
  safety_tags: ["audio", "observation_only", "live_answer_mail", "no_raw_audio"],
  required_env_vars: ["OPENAI_API_KEY", "STT_API_KEY", "WHISPER_HTTP_API_KEY", "STT_LOCAL_URL"],
  configured: (env) => hasAnyConfiguredEnvVar(env, ["OPENAI_API_KEY", "STT_API_KEY", "WHISPER_HTTP_API_KEY", "STT_LOCAL_URL"]),
  cost_class: "standard",
  latency_class: "realtime",
  privacy_class: "external_provider",
  one_shot_supported: true,
  session_supported: true,
  goal_binding_supported: true,
  default_backend_provider: "speech_to_text.openai_compatible",
  backend_provider_templates: [
    {
      provider_id: "speech_to_text.openai_compatible",
      backend_family: "openai_compatible",
      label: "OpenAI-compatible speech transcription",
      model_or_service_ref: "speech_to_text_default",
      required_env_vars: ["OPENAI_API_KEY", "STT_API_KEY", "WHISPER_HTTP_API_KEY", "STT_LOCAL_URL"],
      configured: (env) => hasAnyConfiguredEnvVar(env, ["OPENAI_API_KEY", "STT_API_KEY", "WHISPER_HTTP_API_KEY", "STT_LOCAL_URL"]),
      cost_class: "standard",
      latency_class: "realtime",
      privacy_class: "external_provider",
      fallback_backend_provider: null,
    },
  ],
  capabilities: [
    {
      capability_id: "speech_to_text.transcribe_audio",
      label: "Transcribe speech",
      one_shot_status: "executable",
      session_status: "supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["audio_ref"],
        optional_input_fields: [
          "transcript_text",
          "language",
          "source_id",
          "thread_id",
          "capture_session_id",
          "chunk_index",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use when an admitted microphone or audio capture has produced audio to transcribe or a transcript that must be packetized as speech evidence.",
        when_not_to_use:
          "Do not use this to answer directly, translate directly, or treat a transcript as the user's submitted prompt. STT output is an observation and should re-enter through live-answer mail before goal-bound follow-up.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "speech_to_text.transcribe_audio",
            audio_ref: "<audio artifact/ref from admitted capture>",
            transcript_text: "<optional transcript already produced by the STT backend>",
            source_id: "<optional audio_transcript source id>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
