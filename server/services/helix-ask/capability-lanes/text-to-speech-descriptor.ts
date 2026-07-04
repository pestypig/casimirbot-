import { hasAnyConfiguredEnvVar } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const textToSpeechLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "text_to_speech",
  family: "text_to_speech",
  label: "Text to speech",
  description: "Narration and callout audio generation as non-terminal receipts/artifacts.",
  backend_family: "local_runtime",
  model_or_service_ref: "existing_voice_service",
  safety_tags: ["audio", "receipt_only", "observation_only", "client_playback_confirmation_required"],
  required_env_vars: [],
  configured: () => true,
  cost_class: "free_local",
  latency_class: "interactive",
  privacy_class: "local_only",
  one_shot_supported: true,
  session_supported: true,
  goal_binding_supported: true,
  default_backend_provider: "text_to_speech.existing_voice_service",
  backend_provider_templates: [
    {
      provider_id: "text_to_speech.existing_voice_service",
      backend_family: "local_runtime",
      label: "Existing Helix voice service",
      model_or_service_ref: "existing_voice_service",
      required_env_vars: [],
      configured: () => true,
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
    },
    {
      provider_id: "text_to_speech.elevenlabs",
      backend_family: "elevenlabs",
      label: "ElevenLabs text to speech",
      model_or_service_ref: "elevenlabs_default",
      required_env_vars: ["ELEVENLABS_API_KEY"],
      configured: (env) => hasAnyConfiguredEnvVar(env, ["ELEVENLABS_API_KEY"]),
      cost_class: "standard",
      latency_class: "interactive",
      privacy_class: "external_provider",
      fallback_backend_provider: "text_to_speech.existing_voice_service",
    },
  ],
  capabilities: [
    {
      capability_id: "text_to_speech.speak_text",
      label: "Speak text",
      one_shot_status: "executable",
      session_status: "supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["text"],
        optional_input_fields: [
          "voice",
          "profile",
          "locale",
          "source_observation_ref",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use when the user explicitly asks to speak or read provided text aloud through the governed voice lane.",
        when_not_to_use:
          "Do not use for quoted, negated, future, historical, or screen-visible mentions of voice/read-aloud controls. Do not claim audio completed unless the receipt says completed.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "text_to_speech.speak_text",
            text: "<text to speak>",
            voice: "<optional voice/profile>",
            locale: "<optional locale>",
            source_observation_ref: "<optional source observation ref>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
