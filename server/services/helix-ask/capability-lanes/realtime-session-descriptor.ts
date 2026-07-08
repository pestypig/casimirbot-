import { hasAnyConfiguredEnvVar } from "./backend-provider-config";
import type { HelixCapabilityLaneTemplate } from "./lane-template";

const REALTIME_ENV_VARS = ["OPENAI_REALTIME_API_KEY", "OPENAI_API_KEY"] as const;

const realtimeConfigured = (env: NodeJS.ProcessEnv): boolean =>
  hasAnyConfiguredEnvVar(env, [...REALTIME_ENV_VARS]);

export const realtimeSessionLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "realtime_session",
  family: "live_runtime_agent",
  label: "Realtime runtime session",
  description: "Disabled placeholder for governed GPT Realtime live runtime sessions.",
  backend_family: "openai_realtime",
  model_or_service_ref: "gpt_realtime_session_placeholder",
  safety_tags: [
    "disabled_by_default",
    "live_runtime_agent",
    "observation_only",
    "no_network_phase1",
    "requires_visible_consent",
  ],
  configured: realtimeConfigured,
  cost_class: "premium",
  latency_class: "realtime",
  privacy_class: "account_provider",
  one_shot_supported: false,
  session_supported: true,
  goal_binding_supported: false,
  default_backend_provider: "realtime_session.openai_realtime",
  backend_provider_templates: [
    {
      provider_id: "realtime_session.openai_realtime",
      backend_family: "openai_realtime",
      label: "OpenAI Realtime session",
      model_or_service_ref: "gpt_realtime_session_placeholder",
      required_env_vars: [...REALTIME_ENV_VARS],
      configured: realtimeConfigured,
      cost_class: "premium",
      latency_class: "realtime",
      privacy_class: "account_provider",
      fallback_backend_provider: null,
    },
  ],
  capabilities: [
    {
      capability_id: "realtime_session.start",
      label: "Start Realtime session",
      one_shot_status: "not_supported",
      session_status: "supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["source_binding", "visible_user_consent_receipt"],
        optional_input_fields: ["requested_backend_provider", "runtime_agent_mode"],
        when_to_use:
          "Use only as a governed session proposal for an explicitly requested live runtime session with visible user consent.",
        when_not_to_use:
          "Do not use as a text language model, hidden listener, final answer source, or direct workstation action authority.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "realtime_session.start",
            source_binding: "<microphone, tab, or workstation source binding>",
            visible_user_consent_receipt: "<client consent receipt ref>",
            runtime_agent_mode: "<optional live runtime mode>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
    {
      capability_id: "realtime_session.record_tool_request",
      label: "Record Realtime tool request",
      one_shot_status: "not_supported",
      session_status: "supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["lane_session_id", "tool_request_ref"],
        optional_input_fields: ["requested_backend_provider", "client_receipt_ref"],
        when_to_use:
          "Use only to record an observation that a live runtime session requested a tool through the governed gateway.",
        when_not_to_use:
          "Do not treat the request as executed. A tool request is not a workstation action receipt or final answer.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "realtime_session.record_tool_request",
            lane_session_id: "<active realtime lane session id>",
            tool_request_ref: "<non-secret tool request receipt ref>",
            client_receipt_ref: "<optional client observation receipt ref>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
    {
      capability_id: "realtime_session.record_client_receipt",
      label: "Record Realtime client receipt",
      one_shot_status: "not_supported",
      session_status: "supported",
      backend_provider_required: true,
      model_visible_hint: {
        required_input_fields: ["lane_session_id", "client_receipt_ref"],
        optional_input_fields: ["requested_backend_provider", "receipt_kind"],
        when_to_use:
          "Use only to record visible client receipts for live runtime session lifecycle, audio, or tool-observation events.",
        when_not_to_use:
          "Do not include raw audio or raw provider stream content. Receipts must re-enter Helix before terminal authority.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "realtime_session.record_client_receipt",
            lane_session_id: "<active realtime lane session id>",
            client_receipt_ref: "<client receipt ref>",
            receipt_kind: "<optional lifecycle | audio | tool | error>",
            requested_backend_provider: "<optional backend preference; Helix selects the backend>",
          },
        },
      },
    },
  ],
};
