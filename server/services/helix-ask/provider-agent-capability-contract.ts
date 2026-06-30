import { buildWorkstationToolName, type WorkstationDynamicToolActionDefinition } from "@shared/workstation-dynamic-tools";

import { listWorkstationGatewayCapabilities } from "./workstation-tool-gateway/registry";

export type ProviderAgentCapabilityAvailability =
  | "shared_gateway_now"
  | "safe_to_graduate_next"
  | "requires_confirmation_contract"
  | "helix_native_only"
  | "legacy_dynamic_panel_only"
  | "blocked_pending_contract"
  | "client_projection_only";

export type ProviderAgentPermissionClass =
  | "read_observe"
  | "ui_projection"
  | "user_confirmed_side_effect"
  | "mutating_control";

export type ProviderAgentCapabilityClassification = {
  capability_id: string;
  surface:
    | "workstation_gateway"
    | "live_environment"
    | "live_environment_alias"
    | "dynamic_panel"
    | "client_projection";
  availability: ProviderAgentCapabilityAvailability;
  permission_class: ProviderAgentPermissionClass;
  provider_availability: {
    helix_native: boolean;
    codex_workstation: boolean;
    future_provider: boolean;
  };
  required_contract_before_gateway: string[];
  notes: string;
};

const providerAvailability = (input: {
  helixNative: boolean;
  codexWorkstation: boolean;
  futureProvider: boolean;
}): ProviderAgentCapabilityClassification["provider_availability"] => ({
  helix_native: input.helixNative,
  codex_workstation: input.codexWorkstation,
  future_provider: input.futureProvider,
});

const sharedProviderAvailability = providerAvailability({
  helixNative: true,
  codexWorkstation: true,
  futureProvider: true,
});

const helixOnlyProviderAvailability = providerAvailability({
  helixNative: true,
  codexWorkstation: false,
  futureProvider: false,
});

const readOnlyContextFeedGraduationChecklist = [
  "bounded observation builder",
  "same-turn observation packet",
  "negative quoted/negated admission tests",
  "latest-turn debug/projection row",
];

const sideEffectGraduationChecklist = [
  "explicit affirmative command admission",
  "confirmation or playback permission policy",
  "structured request/receipt observation",
  "negative quoted/negated admission tests",
  "host-side projection without final-prose scraping",
];

const mutatingControlChecklist = [
  "explicit permission profile",
  "confirmation policy",
  "structured action receipt",
  "negative contextual/quoted/negated tests",
  "rollback or no-op blocked receipt behavior",
];

const live = (
  capabilityId: string,
  input: {
    availability: ProviderAgentCapabilityAvailability;
    permissionClass: ProviderAgentPermissionClass;
    requiredContractBeforeGateway: string[];
    notes: string;
    surface?: ProviderAgentCapabilityClassification["surface"];
  },
): ProviderAgentCapabilityClassification => ({
  capability_id: capabilityId,
  surface: input.surface ?? "live_environment",
  availability: input.availability,
  permission_class: input.permissionClass,
  provider_availability: helixOnlyProviderAvailability,
  required_contract_before_gateway: input.requiredContractBeforeGateway,
  notes: input.notes,
});

export const PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS: readonly ProviderAgentCapabilityClassification[] = [
  ...[
    "live_env.query_trace_memory",
    "live_env.query_narrator_events",
    "live_env.query_audio_transcripts",
    "live_env.query_live_answer_state",
    "live_env.query_route_evidence",
    "live_env.query_visual_summaries",
    "live_env.query_translation_segments",
    "live_env.query_microdeck_outputs",
    "live_env.query_packet_traces",
    "live_env.query_automation_policies",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "safe_to_graduate_next",
      permissionClass: "read_observe",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Read-only context feed query; candidate for provider gateway after bounded observation and projection tests.",
    }),
  ),
  ...[
    "live_env.query_source_health",
    "live_env.query_live_source_loop_health",
    "live_env.query_live_source_quality",
    "live_env.summarize_live_source_current_state",
    "live_env.query_constructs",
    "live_env.query_job_evidence",
    "live_env.query_event_log",
    "live_env.query_world_events",
    "live_env.query_navigation_state",
    "live_env.query_stage_sources",
    "live_env.query_workstation_goal_context",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "safe_to_graduate_next",
      permissionClass: "read_observe",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Read-only live-environment query; not in Codex gateway until observation identity and projection tests exist.",
    }),
  ),
  ...[
    "live_env.read_card",
    "live_env.describe_stage_builder",
    "live_env.reflect_stage_play_context",
    "live_env.check_live_source_mail",
    "live_env.read_live_source_mail",
    "live_env.read_processed_live_source_mail",
    "live_env.reflect_live_source_mail_loop",
    "live_env.query_micro_reasoner_prompts",
    "live_env.query_micro_reasoner_presets",
    "live_env.query_visual_observer_profiles",
    "live_env.test_micro_reasoner_prompt",
    "live_env.test_visual_observer_profile",
    "live_env.compare_visual_observer_profiles",
    "live_env.compare_mail_to_interpreter_profile",
    "live_env.compare_live_source_prediction",
    "live_env.validate_live_source_prediction",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "helix_native_only",
      permissionClass: "read_observe",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Helix-native read/evaluation capability; provider gateway graduation requires a bounded observation contract.",
    }),
  ),
  ...[
    "live_env.request_interim_voice_callout",
    "live_env.narrator_say",
    "live_env.record_voice_steering",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "requires_confirmation_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Voice output is a side-effecting output channel; provider access must be receipt/projection based and fail closed for quoted or negated mentions.",
    }),
  ),
  ...[
    "narrator.say",
    "narrator_say",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "requires_confirmation_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Alias for narrator speech; aliases must not become separate provider gateway tools without the canonical voice receipt contract.",
      surface: "live_environment_alias",
    }),
  ),
  ...[
    "live_env.narrator_bind_stream",
    "narrator.bind_stream",
    "narrator_bind_stream",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "blocked_pending_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Stream binding needs a stronger permission and lifecycle contract than one-shot voice callout.",
      surface: capabilityId.startsWith("live_env.") ? "live_environment" : "live_environment_alias",
    }),
  ),
  ...[
    "live_env.process_live_source_mail",
    "live_env.draft_stage_play_graph",
    "live_env.validate_stage_play_graph",
    "live_env.plan_stage_play_job",
    "live_env.request_stage_play_checkpoint",
    "live_env.draft_micro_reasoner_preset",
    "live_env.route_micro_reasoner_prompt",
    "live_env.apply_micro_reasoner_preset",
    "live_env.create_micro_reasoner_preset",
    "live_env.update_micro_reasoner_prompt",
    "live_env.configure_visual_observer_profile",
    "live_env.apply_visual_observer_profile",
    "live_env.request_visual_action_replay",
    "live_env.predict_live_source_immediate",
    "live_env.project_live_source_narrative",
    "live_env.update_live_source_immersion_state",
    "live_env.record_live_source_mail_decision",
    "live_env.request_probe",
    "live_env.record_commentary",
    "live_env.evaluate_goal_satisfaction",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "helix_native_only",
      permissionClass: "ui_projection",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Helix procedure/evidence capability; keep Helix-owned until provider gateway receipt and terminal-authority tests exist.",
    }),
  ),
  ...[
    "live_env.start_agent_goal_session",
    "live_env.change_workstation_preset",
    "live_env.set_visual_preset",
    "live_env.set_audio_preset",
    "live_env.bind_workstation_source",
    "live_env.unbind_workstation_source",
    "live_env.pause_workstation_loop",
    "live_env.resume_workstation_loop",
    "live_env.set_workstation_loop_state",
    "live_env.repair_loop",
    "live_env.repair_workstation_source",
    "live_env.update_live_answer_projection",
    "live_env.focus_process_graph",
    "live_env.configure_route_watch",
    "live_env.configure_live_source_watch_job",
    "live_env.configure_interpreter_profile",
    "live_env.spawn_field_worker",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "blocked_pending_contract",
      permissionClass: "mutating_control",
      requiredContractBeforeGateway: mutatingControlChecklist,
      notes: "Mutating/control capability; do not expose to provider gateway without explicit permission, receipt, and negative-admission tests.",
    }),
  ),
  {
    capability_id: "client.read_aloud",
    surface: "client_projection",
    availability: "client_projection_only",
    permission_class: "user_confirmed_side_effect",
    provider_availability: providerAvailability({
      helixNative: false,
      codexWorkstation: false,
      futureProvider: false,
    }),
    required_contract_before_gateway: sideEffectGraduationChecklist,
    notes: "Client read-aloud playback is not an agent capability and must not be counted as a provider voice tool.",
  },
];

const explicitClassificationByCapability = new Map(
  PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS.map((classification) => [
    classification.capability_id,
    classification,
  ]),
);

const currentGatewayCapabilityIds = new Set(
  listWorkstationGatewayCapabilities({ agentRuntime: "codex", mode: "observe" })
    .capabilities
    .map((capability) => capability.capability_id),
);

export const classifyProviderAgentCapability = (
  capabilityId: string | null | undefined,
): ProviderAgentCapabilityClassification | null => {
  const normalized = String(capabilityId ?? "").trim();
  if (!normalized) return null;
  if (currentGatewayCapabilityIds.has(normalized)) {
    return {
      capability_id: normalized,
      surface: "workstation_gateway",
      availability: "shared_gateway_now",
      permission_class: "read_observe",
      provider_availability: sharedProviderAvailability,
      required_contract_before_gateway: [],
      notes: "Already exposed through the shared workstation gateway manifest.",
    };
  }
  return explicitClassificationByCapability.get(normalized) ?? null;
};

export const classifyDynamicWorkstationActionForProviderGateway = (
  action: WorkstationDynamicToolActionDefinition,
  input: { retired?: boolean } = {},
): ProviderAgentCapabilityClassification => {
  const capabilityId = buildWorkstationToolName(action.panel_id, action.action_id);
  if (input.retired === true || action.panel_id.startsWith("situation-room")) {
    return {
      capability_id: capabilityId,
      surface: "dynamic_panel",
      availability: "legacy_dynamic_panel_only",
      permission_class: action.requires_confirmation || action.risk === "medium" || action.risk === "high"
        ? "user_confirmed_side_effect"
        : "ui_projection",
      provider_availability: helixOnlyProviderAvailability,
      required_contract_before_gateway: action.requires_confirmation ? sideEffectGraduationChecklist : readOnlyContextFeedGraduationChecklist,
      notes: "Dynamic panel action is not a provider gateway tool; graduate only through an explicit capability contract.",
    };
  }
  if (action.requires_confirmation || action.risk === "medium" || action.risk === "high") {
    return {
      capability_id: capabilityId,
      surface: "dynamic_panel",
      availability: "requires_confirmation_contract",
      permission_class: "user_confirmed_side_effect",
      provider_availability: helixOnlyProviderAvailability,
      required_contract_before_gateway: sideEffectGraduationChecklist,
      notes: "Dynamic action has side effects or elevated risk; provider access requires confirmation and receipt policy.",
    };
  }
  return {
    capability_id: capabilityId,
    surface: "dynamic_panel",
    availability: "blocked_pending_contract",
    permission_class: "ui_projection",
    provider_availability: helixOnlyProviderAvailability,
    required_contract_before_gateway: readOnlyContextFeedGraduationChecklist,
    notes: "Dynamic action remains panel-owned until a provider gateway observation/action contract exists.",
  };
};
