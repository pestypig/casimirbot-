import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const deliberateTextLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "deliberate_text",
  family: "text_inference",
  label: "Deliberate text",
  description: "Higher-effort synthesis, planning, and final consistency review.",
  backend_family: "openai_compatible",
  model_or_service_ref: "deliberate_text_default",
  safety_tags: ["shadow_only", "no_raw_model_id", "observation_only"],
  required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
  configured: textBackendConfigured,
  cost_class: "premium",
  latency_class: "batch",
  privacy_class: "account_provider",
  one_shot_supported: false,
  session_supported: false,
  goal_binding_supported: false,
  capabilities: [
    {
      capability_id: "deliberate_text.review",
      label: "Deliberate text review",
      one_shot_status: "shadow_only",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["input_text"],
        optional_input_fields: [
          "review_goal",
          "evidence_refs",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use for future governed higher-effort synthesis or consistency review after Helix admits the lane.",
        when_not_to_use:
          "Do not use as terminal authority, a hidden second answer path, or a shortcut around evidence re-entry. Deliberate text output is evidence only.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "deliberate_text.review",
            input_text: "<text or candidate answer to review>",
            review_goal: "<optional review goal>",
            evidence_refs: ["<optional evidence or observation refs>"],
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
