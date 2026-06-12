export type ToolAuthority =
  | "evidence_only"
  | "control_receipt"
  | "terminal_candidate";

export type ToolFamily =
  | "calculator"
  | "internet_search"
  | "repo_code"
  | "docs_viewer"
  | "workspace_directory"
  | "workstation"
  | "live_source_mail"
  | "live_source_decision"
  | "voice_delivery"
  | "zen_graph_reflection"
  | "civilization_bounds";

export interface ToolFamilyContract {
  toolName: string;
  toolFamily: ToolFamily;
  authority: ToolAuthority;
  mutating: boolean;
  requiredObservationKinds: string[];
  allowedTerminalKinds: string[];
  requiredReentry: boolean;
  requiresGoalSatisfaction: boolean;
  defaultAssistantAnswer: false;
  defaultTerminalEligible: false;
  defaultRawContentIncluded: false;
  requiredNextWhen?: Array<{
    observationKind: string;
    predicateName: string;
    nextTool: string;
    forbidTerminalUntil: string[];
  }>;
  aliases?: string[];
}

type ContractDraft = Omit<
  ToolFamilyContract,
  "defaultAssistantAnswer" | "defaultTerminalEligible" | "defaultRawContentIncluded"
>;

const evidenceOnlyTerminalKinds = ["model_synthesized_answer"];

const contract = (input: ContractDraft): ToolFamilyContract => ({
  ...input,
  defaultAssistantAnswer: false,
  defaultTerminalEligible: false,
  defaultRawContentIncluded: false,
});

export const TOOL_FAMILY_DEFAULT_CONTRACTS: Record<ToolFamily, ToolFamilyContract> = {
  calculator: contract({
    toolName: "family:calculator",
    toolFamily: "calculator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["calculator_receipt", "calculator_result_trace", "calculator_result_validation"],
    allowedTerminalKinds: ["calculator_stream_result", "calculation_trace", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["calculator", "calculator_stream", "scientific-calculator"],
  }),
  internet_search: contract({
    toolName: "family:internet_search",
    toolFamily: "internet_search",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["internet_search_observation", "web_research_observation"],
    allowedTerminalKinds: ["internet_search_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["internet_search", "web_research", "web.search"],
  }),
  repo_code: contract({
    toolName: "family:repo_code",
    toolFamily: "repo_code",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_code_search_result"],
    allowedTerminalKinds: ["repo_code_evidence_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["repo_code", "repo_evidence", "repo-code"],
  }),
  docs_viewer: contract({
    toolName: "family:docs_viewer",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["doc_location_result", "doc_location_matches", "doc_equation_context", "docs_viewer_receipt"],
    allowedTerminalKinds: ["doc_location_result", "doc_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["docs", "docs_viewer", "active_doc", "docs-viewer"],
  }),
  workspace_directory: contract({
    toolName: "family:workspace_directory",
    toolFamily: "workspace_directory",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_directory_resolution"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["workspace_directory", "workspace-directory", "workspace_directory_resolution"],
  }),
  workstation: contract({
    toolName: "family:workstation",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["workspace_action_receipt", "workstation_tool_evaluation"],
    allowedTerminalKinds: ["workspace_action_receipt", "workstation_tool_evaluation", "tool_evaluation", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["workstation", "workstation_action", "workspace_action", "workstation_panel", "workspace_panel"],
  }),
  live_source_mail: contract({
    toolName: "family:live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["live_source_mail", "live_source_mailbox"],
  }),
  live_source_decision: contract({
    toolName: "family:live_source_decision",
    toolFamily: "live_source_decision",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_live_source_mail_decision"],
    allowedTerminalKinds: ["stage_play_live_source_mail_decision", "live_pipeline_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["live_source_decision", "live_environment_decision"],
  }),
  voice_delivery: contract({
    toolName: "family:voice_delivery",
    toolFamily: "voice_delivery",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    allowedTerminalKinds: [
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["voice_delivery", "voice_output", "request_interim_voice_callout"],
  }),
  zen_graph_reflection: contract({
    toolName: "family:zen_graph_reflection",
    toolFamily: "zen_graph_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "ideology_context_reflection/v1",
      "procedural_zen_classification/v1",
      "helix_zen_graph_reflection_tool_result",
      "workstation_tool_evaluation",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "zen_graph_reflection",
      "zen_graph",
      "zengraph",
      "helix_ask.reflect_ideology_context",
      "procedural_zen_classification/v1",
    ],
  }),
  civilization_bounds: contract({
    toolName: "family:civilization_bounds",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "civilization_scenario_frame/v1",
      "helix_civilization_scenario_frame_tool_result",
      "civilization_bounds_roadmap/v1",
      "helix_civilization_bounds_tool_result",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["civilization_bounds", "civilization_bounds_reflection"],
  }),
};

export const TOOL_FAMILY_CONTRACTS: ToolFamilyContract[] = [
  ...Object.values(TOOL_FAMILY_DEFAULT_CONTRACTS),
  contract({
    toolName: "live_env.query_micro_reasoner_presets",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_query_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["microdeck", "micro_reasoner_presets", "stage_play_micro_reasoner_prompt_preset_query_result/v1"],
  }),
  contract({
    toolName: "live_env.read_processed_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "live_env.process_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    requiredNextWhen: [
      {
        observationKind: "stage_play_live_source_mail_read_result",
        predicateName: "processed_packet_missing",
        nextTool: "live_env.read_processed_live_source_mail",
        forbidTerminalUntil: ["stage_play_processed_mail_packet"],
      },
    ],
  }),
  contract({
    toolName: "live_env.record_live_source_mail_decision",
    toolFamily: "live_source_decision",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_processed_mail_packet", "stage_play_live_source_mail_decision"],
    allowedTerminalKinds: ["stage_play_live_source_mail_decision", "live_pipeline_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    requiredNextWhen: [
      {
        observationKind: "stage_play_live_source_mail_decision",
        predicateName: "voice_callout_requested",
        nextTool: "live_env.request_interim_voice_callout",
        forbidTerminalUntil: [
          "live_source_interim_voice_callout_receipt",
          "voice_hold_receipt",
          "voice_block_receipt",
          "voice_receipt",
        ],
      },
    ],
  }),
  contract({
    toolName: "live_env.request_interim_voice_callout",
    toolFamily: "voice_delivery",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "stage_play_live_source_mail_decision",
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    allowedTerminalKinds: [
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "scientific-calculator.solve_expression",
    toolFamily: "calculator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["calculator_receipt", "calculator_result_trace", "calculator_result_validation"],
    allowedTerminalKinds: ["calculator_stream_result", "calculation_trace", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["scientific-calculator.solve_with_steps"],
  }),
  contract({
    toolName: "repo-code.search_concept",
    toolFamily: "repo_code",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_code_search_result"],
    allowedTerminalKinds: ["repo_code_evidence_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.open",
    toolFamily: "docs_viewer",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["doc_open_receipt", "docs_viewer_receipt"],
    allowedTerminalKinds: ["doc_open_receipt", "docs_viewer_receipt", "workspace_action_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.locate_in_doc",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["doc_location_result", "doc_location_matches", "doc_evidence_location", "doc_equation_context"],
    allowedTerminalKinds: ["doc_location_result", "doc_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.doc_equation_context",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["doc_equation_context"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "workspace-directory.resolve",
    toolFamily: "workspace_directory",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_directory_resolution"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "workstation-notes.append_to_note",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt"],
    allowedTerminalKinds: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "internet_search.web_research",
    toolFamily: "internet_search",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["internet_search_observation", "web_research_observation"],
    allowedTerminalKinds: ["internet_search_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["web.search", "web.run", "internet.search"],
  }),
  contract({
    toolName: "helix_ask.build_civilization_scenario_frame",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["civilization_scenario_frame/v1", "helix_civilization_scenario_frame_tool_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "helix_ask.reflect_civilization_bounds",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["civilization_bounds_roadmap/v1", "helix_civilization_bounds_tool_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["helix_civilization_bounds_tool_result", "civilization_bounds_roadmap/v1"],
  }),
];

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/_/g, "-") : "";

const normalizeFamily = (value: unknown): ToolFamily | null => {
  const normalized = normalize(value);
  if (!normalized) return null;
  if (/(^|[-.:])calculator($|[-.:])|scientific-calculator|calculator-stream/.test(normalized)) return "calculator";
  if (/internet[-.:]?search|web[-.:]?research|web\.search/.test(normalized)) return "internet_search";
  if (/repo[-.:]?code|repo[-.:]?evidence|repo-code/.test(normalized)) return "repo_code";
  if (/workspace[-.:]?directory|workspace-directory\.resolve|workspace[-.:]?directory[-.:]?resolution/.test(normalized)) return "workspace_directory";
  if (/docs?[-.:]?viewer|active[-.:]?doc|document/.test(normalized)) return "docs_viewer";
  if (/workstation|workspace[-.:]?action|workspace[-.:]?panel|panel-control|click-or-activate-control/.test(normalized)) return "workstation";
  if (/live[-.:]?source[-.:]?mail|mailbox|read-processed-live-source-mail|process-live-source-mail/.test(normalized)) return "live_source_mail";
  if (/record-live-source-mail-decision|live[-.:]?source[-.:]?decision/.test(normalized)) return "live_source_decision";
  if (/voice[-.:]?delivery|voice[-.:]?output|request-interim-voice-callout|callout/.test(normalized)) return "voice_delivery";
  if (/zen[-.:]?graph|zengraph|reflect[-.:]?ideology[-.:]?context|procedural[-.:]?zen[-.:]?classification/.test(normalized)) return "zen_graph_reflection";
  if (/civilization[-.:]?bounds|civilization[-.:]?scenario|civilization[-.:]?roadmap|reflect-civilization-bounds/.test(normalized)) return "civilization_bounds";
  return null;
};

const exactMatches = new Map<string, ToolFamilyContract>();
for (const entry of TOOL_FAMILY_CONTRACTS) {
  exactMatches.set(normalize(entry.toolName), entry);
  for (const alias of entry.aliases ?? []) {
    exactMatches.set(normalize(alias), entry);
  }
}

export const normalizeToolFamily = (value: unknown): ToolFamily | null => normalizeFamily(value);

export const inferToolFamilyFromToolName = (toolName: unknown): ToolFamily | null =>
  normalizeFamily(toolName);

export const getToolFamilyDefaultContract = (toolFamily: ToolFamily): ToolFamilyContract =>
  TOOL_FAMILY_DEFAULT_CONTRACTS[toolFamily];

export function resolveToolFamilyContract(input: {
  toolName?: unknown;
  toolFamily?: unknown;
}): ToolFamilyContract | null {
  const toolName = normalize(input.toolName);
  if (toolName && exactMatches.has(toolName)) return exactMatches.get(toolName) ?? null;
  const inferredFromTool = normalizeFamily(input.toolName);
  if (inferredFromTool) return getToolFamilyDefaultContract(inferredFromTool);
  const family = normalizeFamily(input.toolFamily);
  return family ? getToolFamilyDefaultContract(family) : null;
}

export const contractsForToolFamily = (toolFamily: ToolFamily): ToolFamilyContract[] =>
  TOOL_FAMILY_CONTRACTS.filter((entry) => entry.toolFamily === toolFamily);
