import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const visualAnalysisLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "visual_analysis",
  family: "visual_analysis",
  label: "Visual analysis",
  description: "Image or screen analysis lane for future governed visual observations.",
  backend_family: "openai_compatible",
  model_or_service_ref: "visual_analysis_default",
  safety_tags: ["shadow_only", "visual", "observation_only"],
  required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
  configured: textBackendConfigured,
  cost_class: "standard",
  latency_class: "interactive",
  privacy_class: "external_provider",
  one_shot_supported: false,
  session_supported: false,
  goal_binding_supported: false,
  capabilities: [
    {
      capability_id: "visual_analysis.inspect_frame",
      label: "Inspect visual frame",
      one_shot_status: "shadow_only",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["frame_ref"],
        optional_input_fields: [
          "question",
          "source_id",
          "source_kind",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use when an admitted image, screenshot, camera frame, or visual capture must be inspected as governed visual evidence.",
        when_not_to_use:
          "Do not use for ordinary text-only questions, do not infer from unseen UI, and do not treat visual analysis output as a final answer without Helix evidence re-entry.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "visual_analysis.inspect_frame",
            frame_ref: "<visual artifact/frame ref from admitted capture>",
            question: "<optional visual question>",
            source_id: "<optional visual source id>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
