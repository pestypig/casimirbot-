import type { HelixCapabilityFamily } from "@shared/helix-capability-plan";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import type { HelixToolCallAdmissionFamily } from "@shared/helix-tool-call-admission";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";

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

const explicitCapabilityContracts: ExplicitCapabilityContract[] = [
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
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return null;
  const contract = explicitCapabilityContracts.find((entry: ExplicitCapabilityContract) =>
    commandMentionsContract(prompt, entry)
  );
  if (!contract) return null;
  return familySuppressed(prompt, contract) ? null : contract;
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
