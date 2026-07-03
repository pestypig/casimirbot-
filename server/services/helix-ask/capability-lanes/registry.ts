import type {
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneManifest,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import {
  HELIX_CAPABILITY_LANE_IDS,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  HELIX_LANE_BACKEND_SELECTION_POLICY,
  backendPermissionStatus,
  backendProvidersFor,
  buildBackendSelectionDecision,
  hasAnyConfiguredEnvVar,
  readBooleanEnv,
  textBackendConfigured,
} from "./backend-provider-config";
import { codeTextLaneTemplate } from "./code-text";
import type { HelixCapabilityLaneTemplate } from "./lane-template";
import { visualAnalysisLaneTemplate } from "./visual-analysis";

const defaultCapabilityModelVisibleHint = (
  capabilityId: string,
): HelixCapabilityLaneDescriptor["capabilities"][number]["model_visible_hint"] => ({
  required_input_fields: [],
  optional_input_fields: ["requested_backend_provider"],
  when_to_use: "Use only when this governed lane capability directly matches the user's requested task.",
  request_shape_hint: {
    capability_lane_call: {
      capability: capabilityId,
    },
  },
});

const laneTemplates: HelixCapabilityLaneTemplate[] = [
  {
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
          request_shape_hint: {
            capability_lane_call: {
              capability: "utility_text.normalize_text",
              text: "<text to normalize>",
              normalization_mode: "<optional mode>",
            },
          },
        },
      },
    ],
  },
  {
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
      },
    ],
  },
  {
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
      },
    ],
  },
  codeTextLaneTemplate,
  {
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
  },
  {
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
  },
  {
    lane_id: "live_translation",
    family: "live_translation",
    label: "Live translation",
    description: "Low-latency translation service lane for future transcript/audio observations.",
    backend_family: "local_runtime",
    model_or_service_ref: "live_translation_deterministic_v1",
    safety_tags: ["shadow_only", "audio", "translation", "observation_only"],
    configured: () => true,
    cost_class: "free_local",
    latency_class: "interactive",
    privacy_class: "local_only",
    one_shot_supported: true,
    session_supported: true,
    goal_binding_supported: true,
    default_backend_provider: "live_translation.local_runtime",
    backend_provider_templates: [
      {
        provider_id: "live_translation.local_runtime",
        backend_family: "local_runtime",
        label: "Deterministic local translation",
        model_or_service_ref: "live_translation_deterministic_v1",
        required_env_vars: [],
        configured: () => true,
        cost_class: "free_local",
        latency_class: "interactive",
        privacy_class: "local_only",
        fallback_backend_provider: null,
      },
      {
        provider_id: "live_translation.google_gemini",
        backend_family: "google_gemini",
        label: "Gemini translation",
        model_or_service_ref: "gemini_translation_default",
        required_env_vars: ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"],
        configured: (env) => hasAnyConfiguredEnvVar(env, ["GOOGLE_GEMINI_API_KEY", "GEMINI_API_KEY"]),
        cost_class: "standard",
        latency_class: "realtime",
        privacy_class: "external_provider",
        fallback_backend_provider: "live_translation.local_runtime",
      },
      {
        provider_id: "live_translation.openai_compatible",
        backend_family: "openai_compatible",
        label: "OpenAI-compatible translation",
        model_or_service_ref: "live_translation_openai_compatible_default",
        required_env_vars: ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"],
        configured: (env) => hasAnyConfiguredEnvVar(env, ["OPENAI_API_KEY", "LLM_HTTP_BASE", "LLM_HTTP_MODEL"]),
        cost_class: "standard",
        latency_class: "interactive",
        privacy_class: "account_provider",
        fallback_backend_provider: "live_translation.local_runtime",
      },
    ],
    capabilities: [
      {
        capability_id: "live_translation.translate_text",
        label: "Translate text",
        one_shot_status: "executable",
        session_status: "supported",
        backend_provider_required: true,
        model_visible_hint: {
          required_input_fields: ["text", "target_language"],
          optional_input_fields: [
            "source_language",
            "requested_backend_provider",
            "chunk_id",
            "source_id",
            "projection_target",
          ],
          when_to_use:
            "Use when the user asks to translate provided text, selected content, transcript text, or other text content.",
          when_not_to_use:
            "Do not use docs-viewer.read_active_translation for new translation work; that workstation tool only reads an already-existing translated Docs surface. If source text or target language is missing, ask for clarification.",
          request_shape_hint: {
            capability_lane_call: {
              capability: "live_translation.translate_text",
              text: "<text to translate>",
              target_language: "<target language or locale>",
              source_language: "<optional source language>",
              requested_backend_provider: "<optional backend preference; Helix selects the backend>",
            },
          },
        },
      },
    ],
  },
  visualAnalysisLaneTemplate,
  {
    lane_id: "workstation_tool_reference",
    family: "workstation_tool_reference",
    label: "Workstation tool reference",
    description: "Reference lane for the existing workstation gateway catalog; no tool migration occurs here.",
    backend_family: "helix_workstation_gateway",
    model_or_service_ref: "workstation_gateway_existing",
    safety_tags: ["existing_gateway_reference", "no_lane_reroute", "observation_or_receipt_only"],
    configured: () => true,
    cost_class: "free_local",
    latency_class: "local",
    privacy_class: "local_only",
    one_shot_supported: true,
    session_supported: false,
    goal_binding_supported: false,
    capabilities: [
      {
        capability_id: "workstation_tool_reference.list_capabilities",
        label: "List workstation gateway capabilities",
        one_shot_status: "executable",
        session_status: "not_supported",
        backend_provider_required: false,
        model_visible_hint: {
          required_input_fields: [],
          optional_input_fields: ["requested_backend_provider"],
          when_to_use:
            "Use to inspect the governed workstation gateway capability catalog as observation-only reference data.",
          request_shape_hint: {
            capability_lane_call: {
              capability: "workstation_tool_reference.list_capabilities",
            },
          },
        },
      },
    ],
  },
];

const laneSet = new Set<string>(HELIX_CAPABILITY_LANE_IDS);

const laneEnabled = (
  laneId: HelixCapabilityLaneId,
  env: NodeJS.ProcessEnv,
): boolean =>
  readBooleanEnv(env.HELIX_CAPABILITY_LANES_ENABLED, true) &&
  readBooleanEnv(env[`HELIX_CAPABILITY_LANE_${laneId.toUpperCase()}_ENABLED`], true);

const laneStatus = (input: {
  template: HelixCapabilityLaneTemplate;
  provider: HelixAgentProvider;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor["status"] => {
  if (!laneEnabled(input.template.lane_id, input.env)) return "disabled";
  if (
    input.template.lane_id === "workstation_tool_reference" &&
    !input.provider.supports.workstationTools
  ) {
    return "permission_blocked";
  }
  if (!input.template.configured(input.env)) return "unconfigured";
  if (input.template.lane_id === "workstation_tool_reference") return "available";
  return "dry_run";
};

const statusReason = (
  status: HelixCapabilityLaneDescriptor["status"],
): string => {
  switch (status) {
    case "available":
      return "existing_governed_gateway_available_without_lane_reroute";
    case "dry_run":
      return "configured_but_shadow_catalog_only";
    case "unconfigured":
      return "backend_provider_key_or_endpoint_not_configured";
    case "permission_blocked":
      return "selected_runtime_provider_permission_does_not_allow_lane";
    case "disabled":
      return "capability_lane_disabled_by_policy";
  }
  return "capability_lane_status_unknown";
};

const terminalPolicy = {
  schema: "helix.capability_lane.terminal_policy.v1" as const,
  lane_output_can_be_final_answer: false as const,
  terminal_authority_owner: "helix" as const,
  requires_evidence_reentry: true as const,
  preserves_runtime_provider_root: true as const,
};

const laneContractsFor = (template: HelixCapabilityLaneTemplate) => ({
  backend_selection_policy: HELIX_LANE_BACKEND_SELECTION_POLICY,
  one_shot_call_contract: {
    schema: "helix.capability_lane.one_shot_call_contract.v1" as const,
    supported: template.one_shot_supported,
    request_schema_ref: `helix.${template.lane_id}.one_shot_request.v1`,
    response_schema_ref: `helix.${template.lane_id}.one_shot_response.v1`,
    output_role: "observation_or_receipt" as const,
    reentry_required: true as const,
    terminal_eligible: false as const,
    assistant_answer: false as const,
  },
  session_contract: {
    schema: "helix.capability_lane.session_contract.v1" as const,
    supported: template.session_supported,
    lifecycle: ["start", "stop", "pause", "resume"] as Array<"start" | "stop" | "pause" | "resume">,
    requires_source_binding: template.session_supported,
    emits_observations: true as const,
    terminal_eligible: false as const,
  },
  goal_binding_contract: {
    schema: "helix.capability_lane.goal_binding_contract.v1" as const,
    supported: template.goal_binding_supported,
    binding_fields: [
      "goal_id",
      "lane_session_id",
      "activation_policy",
      "attention_policy",
      "stop_condition",
      "report_policy",
      "quiet_behavior",
    ] as Array<
      | "goal_id"
      | "lane_session_id"
      | "activation_policy"
      | "attention_policy"
      | "stop_condition"
      | "report_policy"
      | "quiet_behavior"
    >,
    backend_provider_becomes_root_agent: false as const,
    final_reports_require_terminal_authority: true as const,
  },
  observation_contract: {
    schema: "helix.capability_lane.observation_contract.v1" as const,
    observation_schema_ref: `helix.${template.lane_id}.observation.v1`,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
    reentry_required: true as const,
  },
  receipt_contract: {
    schema: "helix.capability_lane.receipt_contract.v1" as const,
    receipt_schema_ref: `helix.${template.lane_id}.receipt.v1`,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
    reentry_required: true as const,
  },
  terminal_policy: terminalPolicy,
});

const laneCapabilitiesFor = (template: HelixCapabilityLaneTemplate) =>
  template.capabilities.map((capability) => ({
    schema: "helix.capability_lane.capability_descriptor.v1" as const,
    capability_id: capability.capability_id,
    label: capability.label,
    lane_id: template.lane_id,
    one_shot_status: capability.one_shot_status,
    session_status: capability.session_status,
    backend_provider_required: capability.backend_provider_required,
    model_visible_hint:
      capability.model_visible_hint ??
      defaultCapabilityModelVisibleHint(capability.capability_id),
    result_authority: "observation_or_receipt_only" as const,
    reentry_required: true as const,
    terminal_eligible: false as const,
    assistant_answer: false as const,
    raw_content_included: false as const,
  }));

const descriptorFor = (input: {
  template: HelixCapabilityLaneTemplate;
  provider: HelixAgentProvider;
  env: NodeJS.ProcessEnv;
}): HelixCapabilityLaneDescriptor => {
  const status = laneStatus(input);
  const backendProviders = backendProvidersFor({
    template: input.template,
    laneStatus: status,
    env: input.env,
  });
  const defaultBackendProvider =
    input.template.default_backend_provider ??
    backendProviders[0]?.provider_id ??
    null;
  const contracts = laneContractsFor(input.template);
  return {
    schema: "helix.capability_lane.descriptor.v1",
    lane_id: input.template.lane_id,
    family: input.template.family,
    label: input.template.label,
    description: input.template.description,
    status,
    status_reason: statusReason(status),
    shadow_only: true,
    backend_family: input.template.backend_family,
    model_or_service_ref: input.template.model_or_service_ref,
    backend_providers: backendProviders,
    default_backend_provider: defaultBackendProvider,
    ...contracts,
    capabilities: laneCapabilitiesFor(input.template),
    requestable_by_runtime_provider: status === "available" || status === "dry_run",
    result_authority: "observation_or_receipt_only",
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    safety_tags: input.template.safety_tags,
  };
};

export const listHelixCapabilityLanes = (input: {
  provider: HelixAgentProvider;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneManifest => {
  const env = input.env ?? process.env;
  const lanes = laneTemplates.map((template: HelixCapabilityLaneTemplate) => descriptorFor({
    template,
    provider: input.provider,
    env,
  }));
  return {
    schema: "helix.capability_lane_manifest.v1",
    manifest_version: "2026-06-30.shadow.v1",
    selected_runtime_agent_provider: input.provider.id,
    policy_mode: "shadow",
    lanes,
    lane_ids: lanes.map((lane: HelixCapabilityLaneDescriptor) => lane.lane_id),
    backend_selection_policy: HELIX_LANE_BACKEND_SELECTION_POLICY,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const resolveHelixCapabilityLaneRequest = (input: {
  provider: HelixAgentProvider;
  requestedLane?: string | null;
  requestedBackendProvider?: string | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneResolveTrace => {
  const requestedLane = typeof input.requestedLane === "string" && input.requestedLane.trim()
    ? input.requestedLane.trim()
    : null;
  const requestedBackendProvider =
    typeof input.requestedBackendProvider === "string" && input.requestedBackendProvider.trim()
      ? input.requestedBackendProvider.trim()
      : null;
  const manifest = listHelixCapabilityLanes({
    provider: input.provider,
    env: input.env,
  });
  const lane = requestedLane && laneSet.has(requestedLane)
    ? manifest.lanes.find((candidate: HelixCapabilityLaneDescriptor) => candidate.lane_id === requestedLane)
    : undefined;

  if (!requestedLane || !lane) {
    const decision = buildBackendSelectionDecision({
      admitted: false,
      laneStatusReason: "blocked_unknown_or_missing_capability_lane",
      requestedBackendProvider,
      requestedBackend: null,
      selectedBackend: null,
    });
    return {
      schema: "helix.capability_lane_resolve_trace.v1",
      selected_runtime_agent_provider: input.provider.id,
      requested_lane: requestedLane,
      admission_status: "blocked",
      lane_status: "unknown",
      requested_backend_provider: requestedBackendProvider,
      requested_backend_provider_known: false,
      requested_backend_configuration_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_availability_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_permission_status: requestedBackendProvider ? "unknown" : null,
      requested_backend_cost_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_latency_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_privacy_class: requestedBackendProvider ? "unknown" : null,
      requested_backend_fallback_provider: null,
      selected_backend_provider: null,
      backend_selection_decision: decision,
      selection_reason: decision.reason,
      availability_status: "unknown",
      permission_status: "unknown",
      cost_class: "unknown",
      latency_class: "unknown",
      privacy_class: "unknown",
      fallback_backend_provider: null,
      resolved_backend_provider: null,
      resolved_model_or_service: null,
      result_ref: null,
      observation_ref: null,
      receipt_ref: null,
      terminal_policy: terminalPolicy,
      reentry_required: true,
      execution_status: "not_executed_shadow_only",
      blocked_reason: requestedLane ? "unknown_capability_lane" : "missing_capability_lane",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const admitted = lane.requestable_by_runtime_provider;
  const requestedBackend = requestedBackendProvider
    ? lane.backend_providers.find((candidate) =>
      candidate.provider_id === requestedBackendProvider ||
      candidate.backend_family === requestedBackendProvider
    ) ?? null
    : null;
  const defaultBackend = lane.default_backend_provider
    ? lane.backend_providers.find((candidate) => candidate.provider_id === lane.default_backend_provider) ?? null
    : null;
  const selectedBackend = admitted ? defaultBackend ?? lane.backend_providers[0] ?? null : null;
  const backendSelectionDecision = buildBackendSelectionDecision({
    admitted,
    laneStatusReason: lane.status_reason,
    requestedBackendProvider,
    requestedBackend,
    selectedBackend,
  });
  return {
    schema: "helix.capability_lane_resolve_trace.v1",
    selected_runtime_agent_provider: input.provider.id,
    requested_lane: lane.lane_id,
    admission_status: admitted ? "admitted_shadow_only" : "blocked",
    lane_status: lane.status,
    requested_backend_provider: requestedBackendProvider,
    requested_backend_provider_known: requestedBackendProvider ? Boolean(requestedBackend) : false,
    requested_backend_configuration_status:
      requestedBackendProvider ? requestedBackend?.configuration_status ?? "unknown" : null,
    requested_backend_availability_status:
      requestedBackendProvider ? requestedBackend?.availability_status ?? "unknown" : null,
    requested_backend_permission_status:
      requestedBackendProvider ? requestedBackend?.permission_status ?? "unknown" : null,
    requested_backend_cost_class:
      requestedBackendProvider ? requestedBackend?.cost_class ?? "unknown" : null,
    requested_backend_latency_class:
      requestedBackendProvider ? requestedBackend?.latency_class ?? "unknown" : null,
    requested_backend_privacy_class:
      requestedBackendProvider ? requestedBackend?.privacy_class ?? "unknown" : null,
    requested_backend_fallback_provider: requestedBackend?.fallback_backend_provider ?? null,
    selected_backend_provider: selectedBackend?.provider_id ?? null,
    backend_selection_decision: backendSelectionDecision,
    selection_reason: backendSelectionDecision.reason,
    availability_status: selectedBackend?.availability_status ?? lane.status,
    permission_status: selectedBackend?.permission_status ?? backendPermissionStatus(lane.status),
    cost_class: selectedBackend?.cost_class ?? "unknown",
    latency_class: selectedBackend?.latency_class ?? "unknown",
    privacy_class: selectedBackend?.privacy_class ?? "unknown",
    fallback_backend_provider: selectedBackend?.fallback_backend_provider ?? null,
    resolved_backend_provider: admitted ? lane.backend_family : null,
    resolved_model_or_service: admitted ? lane.model_or_service_ref : null,
    result_ref: null,
    observation_ref: null,
    receipt_ref: null,
    terminal_policy: lane.terminal_policy,
    reentry_required: true,
    execution_status: "not_executed_shadow_only",
    blocked_reason: admitted ? null : lane.status_reason,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
