import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const interactiveTextLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "interactive_text",
  family: "text_inference",
  label: "Interactive text",
  description: "Low-latency conversational and tool-backed text inference.",
  backend_family: "openai_compatible",
  model_or_service_ref: "interactive_text_default",
  safety_tags: ["shadow_only", "no_raw_model_id", "observation_only"],
  required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
  configured: textBackendConfigured,
  cost_class: "standard",
  latency_class: "interactive",
  privacy_class: "account_provider",
  one_shot_supported: false,
  session_supported: false,
  goal_binding_supported: false,
  capabilities: [
    {
      capability_id: "interactive_text.respond",
      label: "Interactive text response",
      one_shot_status: "shadow_only",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["input_text"],
        optional_input_fields: [
          "response_goal",
          "context_refs",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use for future governed low-latency text inference after Helix explicitly admits the lane.",
        when_not_to_use:
          "Do not use as a private replacement runtime, final answer path, or shortcut around evidence re-entry and terminal authority.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "interactive_text.respond",
            input_text: "<text input for interactive inference>",
            response_goal: "<optional response goal>",
            context_refs: ["<optional evidence or observation refs>"],
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
