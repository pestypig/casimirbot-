import { buildWorkstationToolName, type WorkstationDynamicToolActionDefinition } from "@shared/workstation-dynamic-tools";

import { listWorkstationGatewayCapabilities } from "./workstation-tool-gateway/registry";

export type ProviderAgentCapabilityAvailability =
  | "shared_gateway_now"
  | "shared_capability_lane_now"
  | "safe_to_graduate_next"
  | "requires_confirmation_contract"
  | "candidate_host_receipt_bridge"
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
    | "explicit_contract"
    | "capability_lane"
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
  provider_gateway_alias_target?: string;
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

const explicit = (
  capabilityId: string,
  input: {
    availability: ProviderAgentCapabilityAvailability;
    permissionClass: ProviderAgentPermissionClass;
    requiredContractBeforeGateway: string[];
    notes: string;
  },
): ProviderAgentCapabilityClassification => ({
  capability_id: capabilityId,
  surface: "explicit_contract",
  availability: input.availability,
  permission_class: input.permissionClass,
  provider_availability: helixOnlyProviderAvailability,
  required_contract_before_gateway: input.requiredContractBeforeGateway,
  notes: input.notes,
});

const codexHostReceiptBridgeExplicit = (
  capabilityId: string,
  input: {
    permissionClass: ProviderAgentPermissionClass;
    requiredContractBeforeGateway: string[];
    notes: string;
  },
): ProviderAgentCapabilityClassification => ({
  capability_id: capabilityId,
  surface: "explicit_contract",
  availability: "candidate_host_receipt_bridge",
  permission_class: input.permissionClass,
  provider_availability: providerAvailability({
    helixNative: true,
    codexWorkstation: true,
    futureProvider: false,
  }),
  required_contract_before_gateway: input.requiredContractBeforeGateway,
  notes: input.notes,
});

const sharedExplicitAlias = (
  capabilityId: string,
  input: {
    permissionClass: ProviderAgentPermissionClass;
    gatewayAliasTarget: string;
    notes: string;
  },
): ProviderAgentCapabilityClassification => ({
  capability_id: capabilityId,
  surface: "explicit_contract",
  availability: "shared_gateway_now",
  permission_class: input.permissionClass,
  provider_availability: sharedProviderAvailability,
  provider_gateway_alias_target: input.gatewayAliasTarget,
  required_contract_before_gateway: [],
  notes: input.notes,
});

const sharedCapabilityLane = (
  capabilityId: string,
  input: {
    permissionClass: ProviderAgentPermissionClass;
    notes: string;
  },
): ProviderAgentCapabilityClassification => ({
  capability_id: capabilityId,
  surface: "capability_lane",
  availability: "shared_capability_lane_now",
  permission_class: input.permissionClass,
  provider_availability: sharedProviderAvailability,
  required_contract_before_gateway: [],
  notes: input.notes,
});

export const PROVIDER_AGENT_CAPABILITY_CLASSIFICATIONS: readonly ProviderAgentCapabilityClassification[] = [
  sharedCapabilityLane("live_translation.translate_text", {
    permissionClass: "read_observe",
    notes: "Provider-shared capability lane one-shot. It emits non-terminal translation observations and projection receipts; Helix retains backend selection, evidence re-entry, and terminal authority.",
  }),
  sharedCapabilityLane("visual_analysis.inspect_image_region", {
    permissionClass: "read_observe",
    notes: "Provider-shared capability lane one-shot for admitted Image Lens crops. It emits non-terminal region receipts and visual evidence; Helix retains source admission, evidence re-entry, and terminal authority.",
  }),
  sharedCapabilityLane("visual_analysis.inspect_frame", {
    permissionClass: "read_observe",
    notes: "Provider-shared capability lane one-shot for admitted visual frames. It emits non-terminal visual observations; Helix retains source admission, evidence re-entry, and terminal authority.",
  }),
  ...[
    "repo-code.search_concept",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "repo.search",
      notes: "Provider-shared explicit route alias admitted onto the canonical repo.search gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "internet_search.web_research",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "internet-search.search_web",
      notes: "Provider-shared explicit route alias admitted onto the canonical internet-search.search_web gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "helix_ask.reflect_theory_context",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "theory-badge-graph.reflect_discussion_context",
      notes: "Provider-shared explicit route alias admitted onto the canonical theory-badge-graph.reflect_discussion_context gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "helix_ask.reflect_civilization_bounds",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "civilization-bounds.reflect_system_bounds",
      notes: "Provider-shared explicit route alias admitted onto the canonical civilization-bounds.reflect_system_bounds gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "scientific-calculator.solve_with_steps",
    "scientific-calculator.solve",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "scientific-calculator.solve_expression",
      notes: "Provider-shared explicit route alias admitted onto the canonical scientific-calculator.solve_expression gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "docs-viewer.search_docs",
    "docs-viewer.locate_in_doc",
    "docs-viewer.summarize_doc",
    "docs-viewer.doc_equation_context",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "read_observe",
      gatewayAliasTarget: "docs.search",
      notes: "Provider-shared explicit route alias admitted onto the canonical docs.search gateway; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "docs-viewer.open",
    "docs-viewer.open_doc_by_path",
  ].map((capabilityId) =>
    sharedExplicitAlias(capabilityId, {
      permissionClass: "ui_projection",
      gatewayAliasTarget: "docs-viewer.open_doc",
      notes: "Provider-shared explicit route alias admitted onto the canonical docs-viewer.open_doc gateway receipt; alias is preserved in source_target_intent.alias_capability.",
    }),
  ),
  ...[
    "runtime_evidence",
    "debug.inspect_current_turn",
    "helix_ask.inspect_capability_catalog",
    "helix_ask.reflect_workstation_tool_alignment",
    "workspace-directory.resolve",
    "helix.theory.frontierVectorFieldTrace",
    "helix_ask.reflect_live_synthetic_data",
    "helix_ask.reflect_context_attachments",
    "helix_ask.reflect_ideology_context",
    "helix_ask.bridge_theory_ideology_context",
    "helix_ask.build_civilization_scenario_frame",
    "image_lens.inspect",
    "situation-room.describe_visual_capture",
    "docs-viewer.identify_current_doc",
    "docs-viewer.validate_doc_candidates",
  ].map((capabilityId) =>
    explicit(capabilityId, {
      availability: "safe_to_graduate_next",
      permissionClass: "read_observe",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Explicit route contract exists, but this exact capability id is not a provider gateway manifest id; graduate only with an explicit gateway alias/observation contract.",
    }),
  ),
  explicit("live_pipeline", {
    availability: "blocked_pending_contract",
    permissionClass: "mutating_control",
    requiredContractBeforeGateway: mutatingControlChecklist,
    notes: "Abstract live-pipeline control surface; provider execution remains blocked until an affirmative-command, permission, structured receipt, and negative-admission contract is complete.",
  }),
  ...[
    "scientific-calculator.open",
    "scientific-calculator.start_equation_live_source",
    "workstation-notes.append_to_note",
    "workstation-notes.create",
    "workstation-notes.open",
  ].map((capabilityId) =>
    explicit(capabilityId, {
      availability: "blocked_pending_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Explicit side-effecting workstation route contract exists; keep out of provider gateway until confirmation, receipt, and projection tests exist.",
    }),
  ),
  codexHostReceiptBridgeExplicit("workstation-notes.create_note", {
    permissionClass: "user_confirmed_side_effect",
    requiredContractBeforeGateway: sideEffectGraduationChecklist,
    notes: "Explicit affirmative note-create route may be projected to Codex Workstation Mode as a host-dispatched action envelope with a client persistence receipt; it remains absent from the shared provider gateway manifest.",
  }),
  ...[
    "live_env.read_card",
    "live_env.reflect_stage_play_context",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "requires_confirmation_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Helix-native evidence/projection capability that can write goal-context or Live Answer projection receipts; provider gateway graduation requires an explicit side-effect receipt contract.",
    }),
  ),
  ...[
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
    "live_env.request_stage_play_checkpoint",
    "live_env.draft_micro_reasoner_preset",
    "live_env.route_micro_reasoner_prompt",
    "live_env.apply_micro_reasoner_preset",
    "live_env.create_micro_reasoner_preset",
    "live_env.update_micro_reasoner_prompt",
    "live_env.configure_visual_observer_profile",
    "live_env.apply_visual_observer_profile",
    "live_env.request_visual_action_replay",
    "live_env.project_live_source_narrative",
    "live_env.update_live_source_immersion_state",
    "live_env.record_live_source_mail_decision",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "helix_native_only",
      permissionClass: "ui_projection",
      requiredContractBeforeGateway: readOnlyContextFeedGraduationChecklist,
      notes: "Helix procedure/evidence capability; keep Helix-owned until provider gateway receipt and terminal-authority tests exist.",
    }),
  ),
  ...[
    "live_env.request_probe",
    "live_env.record_commentary",
    "live_env.evaluate_goal_satisfaction",
  ].map((capabilityId) =>
    live(capabilityId, {
      availability: "requires_confirmation_contract",
      permissionClass: "user_confirmed_side_effect",
      requiredContractBeforeGateway: sideEffectGraduationChecklist,
      notes: "Helix-native evidence writer; provider gateway graduation requires an explicit affirmative command, structured write receipt, and terminal-authority tests.",
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

export const resolveProviderGatewayCapabilityId = (
  capabilityId: string | null | undefined,
): string | null => {
  const normalized = String(capabilityId ?? "").trim();
  if (!normalized) return null;
  return explicitClassificationByCapability.get(normalized)?.provider_gateway_alias_target ?? normalized;
};

const currentGatewayCapabilities = listWorkstationGatewayCapabilities({
  agentRuntime: "codex",
  mode: "observe",
}).capabilities;

const currentGatewayCapabilityById = new Map(
  currentGatewayCapabilities.map((capability) => [
    capability.capability_id,
    capability,
  ]),
);

const permissionClassForSharedGatewayCapability = (
  capability: (typeof currentGatewayCapabilities)[number],
): ProviderAgentPermissionClass => {
  if (capability.mutating) return "mutating_control";
  if (capability.requires_confirmation) return "user_confirmed_side_effect";
  if (capability.mode === "act") return "ui_projection";
  return "read_observe";
};

export const classifyProviderAgentCapability = (
  capabilityId: string | null | undefined,
): ProviderAgentCapabilityClassification | null => {
  const normalized = String(capabilityId ?? "").trim();
  if (!normalized) return null;
  const currentGatewayCapability = currentGatewayCapabilityById.get(normalized);
  if (currentGatewayCapability) {
    return {
      capability_id: normalized,
      surface: "workstation_gateway",
      availability: "shared_gateway_now",
      permission_class: permissionClassForSharedGatewayCapability(currentGatewayCapability),
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
  const currentGatewayCapability = currentGatewayCapabilityById.get(capabilityId);
  if (currentGatewayCapability && input.retired !== true) {
    return {
      capability_id: capabilityId,
      surface: "dynamic_panel",
      availability: "shared_gateway_now",
      permission_class: permissionClassForSharedGatewayCapability(currentGatewayCapability),
      provider_availability: sharedProviderAvailability,
      required_contract_before_gateway: [],
      notes: "Dynamic panel action has graduated through the shared workstation gateway manifest; panel visibility alone still does not grant provider access.",
    };
  }
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
