import type { HelixCapabilityFamily } from "@shared/helix-capability-plan";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import type { HelixToolCallAdmissionFamily } from "@shared/helix-tool-call-admission";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "./workstation-context-feed-query-tool-contracts";

export type ExplicitCapabilityContract = {
  schema: "helix.explicit_capability_contract.v1";
  capability: string;
  runtime_capability?: string;
  aliases?: string[];
  capability_family: string;
  plan_family: HelixCapabilityFamily;
  source_target: string;
  admission_families: HelixToolCallAdmissionFamily[];
  required_observation_kinds: string[];
  required_terminal_kind: string;
  allowed_substitutions: string[];
  forbidden_nearby_capabilities: string[];
};

export type ExtractedExplicitCapabilityContract = {
  contract: ExplicitCapabilityContract;
  capability: string;
  matched_name: string;
  match_index: number;
  match_end_index: number;
  source: "command_mention" | "compound_command_chain";
};

const liveEnvironmentControlContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKind?: string;
  requiredTerminalKind?: string;
  forbiddenNearbyCapabilities?: string[];
}): ExplicitCapabilityContract => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "live_environment",
  plan_family: "live_environment",
  source_target: "live_environment",
  admission_families: ["live_environment", "workstation_action"],
  required_observation_kinds: [
    "live_environment_tool_observation",
    input.requiredObservationKind ?? "stage_play_workstation_control_receipt",
  ],
  required_terminal_kind: input.requiredTerminalKind ?? input.requiredObservationKind ?? "stage_play_workstation_control_receipt",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: input.forbiddenNearbyCapabilities ?? [
    "live_env.read_processed_live_source_mail",
    "live_env.read_live_source_mail",
    "model.direct_answer",
  ],
});

const liveEnvironmentQueryContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKind: string;
}): ExplicitCapabilityContract => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "live_environment",
  plan_family: "live_environment",
  source_target: "live_environment",
  admission_families: ["live_environment"],
  required_observation_kinds: [
    "live_environment_tool_observation",
    input.requiredObservationKind,
    "helix.workstation_goal_context_update.v1",
  ],
  required_terminal_kind: "model_synthesized_answer",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: [
    "live_env.read_processed_live_source_mail",
    "live_env.read_live_source_mail",
    "live_env.process_live_source_mail",
    "model.direct_answer",
  ],
});

const explicitCapabilityContracts: ExplicitCapabilityContract[] = [
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.inspect_capability_catalog",
    aliases: ["helix.ask.inspect_capability_catalog", "inspect_capability_catalog"],
    capability_family: "capability_catalog",
    plan_family: "capability_catalog",
    source_target: "runtime_evidence",
    admission_families: ["capability_catalog", "runtime_evidence"],
    required_observation_kinds: ["capability_registry", "capability_help_summary"],
    required_terminal_kind: "capability_help_summary",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "scientific-calculator.solve_expression",
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workspace_os.status",
    capability_family: "workspace_diagnostic",
    plan_family: "workspace_diagnostic",
    source_target: "workspace_diagnostic",
    admission_families: ["workspace_diagnostic"],
    required_observation_kinds: ["workspace_os_status_observation"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["debug.inspect_current_turn"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.locate_in_doc",
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_location_result", "doc_location_matches", "doc_evidence_location"],
    required_terminal_kind: "doc_location_matches",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.summarize_doc"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "repo-code.search_concept",
    capability_family: "repo_code",
    plan_family: "repo_evidence",
    source_target: "repo_code",
    admission_families: ["repo_code"],
    required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
    required_terminal_kind: "repo_code_evidence_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workspace-directory.resolve",
    capability_family: "workspace_directory",
    plan_family: "workspace_directory",
    source_target: "workspace_directory",
    admission_families: ["workspace_directory"],
    required_observation_kinds: ["workspace_directory_resolution"],
    required_terminal_kind: "workspace_directory_resolution",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "internet_search.web_research",
    runtime_capability: HELIX_INTERNET_SEARCH_CAPABILITY,
    aliases: [HELIX_INTERNET_SEARCH_CAPABILITY],
    capability_family: "internet_search",
    plan_family: "internet_search",
    source_target: "internet_search",
    admission_families: ["internet_search"],
    required_observation_kinds: ["internet_search_observation"],
    required_terminal_kind: "internet_search_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.read_processed_live_source_mail",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_processed_mail_packet"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.process_live_source_mail",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.reflect_live_source_mail_loop",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_loop_reflection"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.reflect_stage_play_context",
    aliases: ["reflect_stage_play_context", "stage_play_reflection"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment"],
    required_observation_kinds: ["live_environment_tool_observation", "stage_play_reflection_result"],
    required_terminal_kind: "direct_answer_text",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.configure_live_source_watch_job",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "situation-room.describe_visual_capture",
      "model.direct_answer",
    ],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.narrator_say",
    aliases: ["narrator.say", "narrator_say"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.narrator_say_request.v1"],
    required_terminal_kind: "helix.narrator_say_request.v1",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.narrator_bind_stream",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.narrator_bind_stream",
    aliases: ["narrator.bind_stream", "narrator_bind_stream"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.narrator_bind_stream_request.v1"],
    required_terminal_kind: "helix.narrator_bind_stream_request.v1",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.narrator_say",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  liveEnvironmentControlContract({
    capability: "live_env.change_workstation_preset",
    aliases: ["change_workstation_preset", "change_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_visual_preset",
    aliases: ["set_visual_preset", "visual_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_audio_preset",
    aliases: ["set_audio_preset", "audio_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.bind_workstation_source",
    aliases: ["bind_workstation_source", "bind_source"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.unbind_workstation_source",
    aliases: ["unbind_workstation_source", "unbind_source"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.pause_workstation_loop",
    aliases: ["pause_workstation_loop", "pause_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.resume_workstation_loop",
    aliases: ["resume_workstation_loop", "resume_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_workstation_loop_state",
    aliases: ["set_workstation_loop_state", "set_loop_state"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.repair_loop",
    aliases: ["repair_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.repair_workstation_source",
    aliases: ["repair_workstation_source", "repair_workstation_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.update_live_answer_projection",
    aliases: ["update_live_answer_projection", "update_live_answer"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.focus_process_graph",
    aliases: ["focus_process_graph"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.start_agent_goal_session",
    aliases: ["start_agent_goal_session"],
    requiredObservationKind: "stage_play_agent_goal_session_tool_result",
    requiredTerminalKind: "stage_play_agent_goal_session_tool_result",
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.evaluate_goal_satisfaction",
    aliases: ["evaluate_goal_satisfaction", "goal_satisfaction"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.live_environment_goal_satisfaction.v1"],
    required_terminal_kind: "helix.live_environment_goal_satisfaction.v1",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.start_agent_goal_session",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  ...WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => liveEnvironmentQueryContract({
    capability: spec.capability,
    aliases: [...spec.aliases],
    requiredObservationKind: spec.explicitRequiredObservationKind,
  })),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "image_lens.inspect",
    runtime_capability: "situation-room.describe_visual_capture",
    aliases: ["image_lens", "image-lens", "visual_capture", "situation-room.describe_visual_capture"],
    capability_family: "visual_capture",
    plan_family: "visual_capture",
    source_target: "visual_capture",
    admission_families: ["situation_run"],
    required_observation_kinds: ["visual_frame_evidence", "situation_context_pack", "visual_capture_coverage"],
    required_terminal_kind: "situation_context_pack",
    allowed_substitutions: ["situation-room.describe_visual_capture"],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc", "repo-code.search_concept", "model.direct_answer"],
  },
];

const commandVerb = String.raw`(?:call|use|run|invoke|execute|inspect\s+using|locate\s+(?:in\s+doc\s+)?using|find\s+using)`;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const commandMentionsCapability = (prompt: string, capability: string): boolean => {
  const escaped = escapeRegex(capability);
  return new RegExp(String.raw`\b${commandVerb}\b[\s\S]{0,80}\b${escaped}\b`, "i").test(prompt);
};

const capabilityMentionRegex = (capability: string): RegExp =>
  new RegExp(String.raw`\b${escapeRegex(capability)}\b`, "gi");

const commandMentionsCapabilityAt = (prompt: string, capability: string, matchIndex: number): boolean => {
  const windowStart = Math.max(0, matchIndex - 100);
  const before = prompt.slice(windowStart, matchIndex);
  return new RegExp(String.raw`\b${commandVerb}\b[\s\S]{0,100}$`, "i").test(before) ||
    commandMentionsCapability(prompt.slice(Math.max(0, matchIndex - 20), matchIndex + capability.length + 90), capability);
};

const compoundCommandChainMentionsCapabilityAt = (prompt: string, matchIndex: number): boolean => {
  const before = prompt.slice(Math.max(0, matchIndex - 120), matchIndex);
  if (!new RegExp(String.raw`\b${commandVerb}\b`, "i").test(prompt)) return false;
  return /\b(?:then|and|plus|after|before|followed\s+by|next)\b[\s\S]{0,80}$/i.test(before);
};

const commandMentionsContract = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  const names = uniqueStrings([
    contract.capability,
    contract.runtime_capability ?? "",
    ...(contract.aliases ?? []),
  ]);
  return names.some((name) => commandMentionsCapability(prompt, name));
};

const familySuppressed = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  const suppression = detectContextualToolAdmissionSuppression(prompt);
  if (!suppression) return false;
  if (suppression.suppression_reason === "explanatory_only") return false;
  return contract.admission_families.some((family: HelixToolCallAdmissionFamily) =>
    contextualToolSuppressionBlocksFamily(suppression, family)
  );
};

export const explicitCapabilityContractForCapability = (
  capability: string | null | undefined,
): ExplicitCapabilityContract | null => {
  const normalized = String(capability ?? "").trim();
  if (!normalized) return null;
  return explicitCapabilityContracts.find((contract: ExplicitCapabilityContract) =>
    contract.capability === normalized ||
    contract.runtime_capability === normalized ||
    (contract.aliases ?? []).includes(normalized)
  ) ?? null;
};

export const extractExplicitCapabilityContract = (
  promptText: string | null | undefined,
): ExplicitCapabilityContract | null => {
  return extractExplicitCapabilityContracts(promptText)[0]?.contract ?? null;
};

export const extractExplicitCapabilityContracts = (
  promptText: string | null | undefined,
): ExtractedExplicitCapabilityContract[] => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return [];
  const matches: ExtractedExplicitCapabilityContract[] = [];
  for (const contract of explicitCapabilityContracts) {
    if (familySuppressed(prompt, contract)) continue;
    const names = uniqueStrings([
      contract.capability,
      contract.runtime_capability ?? "",
      ...(contract.aliases ?? []),
    ]);
    let best: ExtractedExplicitCapabilityContract | null = null;
    for (const name of names) {
      const matcher = capabilityMentionRegex(name);
      for (const match of prompt.matchAll(matcher)) {
        const matchIndex = typeof match.index === "number" ? match.index : -1;
        if (matchIndex < 0) continue;
        const commandMention = commandMentionsCapabilityAt(prompt, name, matchIndex);
        const compoundMention = compoundCommandChainMentionsCapabilityAt(prompt, matchIndex);
        if (!commandMention && !compoundMention) continue;
        const candidate: ExtractedExplicitCapabilityContract = {
          contract,
          capability: contract.capability,
          matched_name: name,
          match_index: matchIndex,
          match_end_index: matchIndex + name.length,
          source: commandMention ? "command_mention" : "compound_command_chain",
        };
        if (!best || candidate.match_index < best.match_index) {
          best = candidate;
        }
      }
    }
    if (best) matches.push(best);
  }
  return matches
    .sort((left, right) => left.match_index - right.match_index)
    .filter((match, index, ordered) =>
      ordered.findIndex((entry) => entry.contract.capability === match.contract.capability) === index
    );
};

export const explicitCapabilityMatches = (
  requestedCapability: string | null | undefined,
  actualCapability: string | null | undefined,
): boolean => {
  const requested = String(requestedCapability ?? "").trim();
  const actual = String(actualCapability ?? "").trim();
  if (!requested || !actual) return false;
  if (requested === actual) return true;
  const contract = explicitCapabilityContractForCapability(requested);
  return Boolean(
    contract?.runtime_capability === actual ||
      contract?.allowed_substitutions.includes(actual) ||
      contract?.aliases?.includes(actual),
  );
};

export const explicitCapabilityContractsForTests = explicitCapabilityContracts;
