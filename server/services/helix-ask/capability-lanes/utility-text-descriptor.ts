import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const utilityTextLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "utility_text",
  family: "text_inference",
  label: "Utility text",
  description: "Small classification, extraction, normalization, and compact summary calls.",
  backend_family: "local_runtime",
  model_or_service_ref: "utility_text_deterministic_v1",
  safety_tags: ["shadow_only", "local_deterministic", "observation_only"],
  configured: () => true,
  cost_class: "free_local",
  latency_class: "interactive",
  privacy_class: "local_only",
  one_shot_supported: true,
  session_supported: false,
  goal_binding_supported: false,
  default_backend_provider: "utility_text.local_runtime",
  backend_provider_templates: [
    {
      provider_id: "utility_text.local_runtime",
      backend_family: "local_runtime",
      label: "Deterministic local utility text",
      model_or_service_ref: "utility_text_deterministic_v1",
      required_env_vars: [],
      configured: () => true,
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
    },
    {
      provider_id: "utility_text.openai_compatible",
      backend_family: "openai_compatible",
      label: "OpenAI-compatible utility text",
      model_or_service_ref: "utility_text_openai_compatible_default",
      required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
      configured: textBackendConfigured,
      cost_class: "standard",
      latency_class: "interactive",
      privacy_class: "account_provider",
      fallback_backend_provider: "utility_text.local_runtime",
    },
  ],
  capabilities: [
    {
      capability_id: "utility_text.normalize_text",
      label: "Normalize text",
      one_shot_status: "executable",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["text"],
        optional_input_fields: ["normalization_mode", "requested_backend_provider"],
        when_to_use: "Use for compact text normalization or deterministic utility text processing.",
        when_not_to_use:
          "Do not use as a final answer path, hidden text model, or shortcut around Helix evidence re-entry. Utility text output is observation-only.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "utility_text.normalize_text",
            text: "<text to normalize>",
            normalization_mode: "<optional mode>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
