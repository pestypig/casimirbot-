import { textBackendConfigured } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const visualAnalysisLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "visual_analysis",
  family: "visual_analysis",
  label: "Visual analysis",
  description: "Image, screen, and Image Lens crop analysis lane for governed visual observations.",
  backend_family: "openai_compatible",
  model_or_service_ref: "visual_analysis_default",
  safety_tags: ["visual", "observation_only", "requires_reentry"],
  required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
  configured: textBackendConfigured,
  cost_class: "standard",
  latency_class: "interactive",
  privacy_class: "external_provider",
  one_shot_supported: true,
  session_supported: false,
  goal_binding_supported: false,
  capabilities: [
    {
      capability_id: "visual_analysis.inspect_image_region",
      label: "Inspect Image Lens region",
      one_shot_status: "executable",
      session_status: "not_supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: [
          "source_id",
          "bbox_px",
        ],
        optional_input_fields: [
          "frame_id",
          "source_attachment_id",
          "source_kind",
          "source_image_ref",
          "page_number",
          "page_image_ref",
          "crop_image_ref",
          "question",
          "reason_for_crop",
          "parent_region_id",
          "detail",
          "region_kind",
          "summary",
          "text_candidate",
          "latex_candidate",
          "extraction_status",
          "table_candidate_ref",
          "uncertainty",
          "requested_backend_provider",
        ],
        when_to_use:
          "Use when an admitted image, attachment, PDF page render, or Image Lens source needs a focused crop inspection with visible bbox provenance.",
        when_not_to_use:
          "Do not use for text-only prompts, do not execute from contextual or negated crop/inspect wording, and do not treat crop output as a final answer before Helix evidence re-entry and terminal authority.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            source_id: "<admitted image, attachment, frame, PDF page render, or Image Lens source id>",
            frame_id: "<optional visual frame id>",
            source_attachment_id: "<optional attachment id>",
            page_number: "<optional PDF page number>",
            bbox_px: { x: 0, y: 0, width: 320, height: 240 },
            question: "<optional crop-specific visual question>",
            reason_for_crop: "<short observable reason for focusing this region>",
            parent_region_id: "<optional prior crop region id>",
            detail: "auto",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
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
