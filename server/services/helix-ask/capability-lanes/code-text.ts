import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const codeTextLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "code_text",
  family: "code_inference",
  label: "Code text",
  description: "Code-oriented reasoning or review as text; no filesystem mutation authority.",
  backend_family: "openai_compatible",
  model_or_service_ref: "code_text_default",
  safety_tags: ["shadow_only", "no_code_mutation", "observation_only"],
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
      capability_id: "code_text.review",
      label: "Code text review",
      one_shot_status: "shadow_only",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["code_or_diff"],
        optional_input_fields: [
          "review_goal",
          "language",
          "source_ref",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use for governed code or diff review when the runtime needs text-only code analysis as evidence.",
        when_not_to_use:
          "Do not use for shell execution, repository mutation, file edits, or terminal authority. Code-text output is evidence only and must re-enter Helix before any answer.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "code_text.review",
            code_or_diff: "<code, diff, or source excerpt to review>",
            review_goal: "<optional review focus>",
            source_ref: "<optional source artifact ref>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
