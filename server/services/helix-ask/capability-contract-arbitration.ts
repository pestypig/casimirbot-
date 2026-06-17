import type { HelixCapabilityFamily } from "@shared/helix-capability-plan";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
  type HelixContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import {
  explicitCapabilityContractForCapability,
  extractExplicitCapabilityContract,
  type ExplicitCapabilityContract,
} from "./explicit-capability-contract";

type RecordLike = Record<string, unknown>;

export type AskCapabilityContractState =
  | "suppressed_contextual_reference"
  | "explicit_capability_command"
  | "hard_live_source_phase"
  | "classifier_hypothesis"
  | "model_only";

export type AskCapabilityContractArbitration = {
  schema: "helix.ask_capability_contract_arbitration.v1";
  turn_id: string;
  contract_state: AskCapabilityContractState;
  requested_capability: string | null;
  selected_source_target: string;
  selected_plan_family: HelixCapabilityFamily;
  canonical_goal_kind: string;
  required_observation_kinds: string[];
  required_terminal_kind: string | null;
  allow_phase_repair: boolean;
  route_metadata_demoted: boolean;
  demotion_reason?: string;
  failure_code_if_incompatible?: string;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

export const canonicalGoalKindForExplicitCapability = (capability: string | null | undefined): string | null => {
  switch (capability) {
    case "scientific-calculator.solve_expression":
      return "calculator_solve";
    case "workspace_os.status":
      return "workspace_status_diagnostic";
    case "docs-viewer.locate_in_doc":
      return "locate_in_doc";
    case "repo-code.search_concept":
      return "repo_code_evidence_question";
    case "workspace-directory.resolve":
      return "workspace_directory_resolution";
    case "internet_search.web_research":
      return "internet_search_lookup";
    default:
      return null;
  }
};

export const answerScopeForExplicitCapability = (capability: string | null | undefined): string => {
  switch (capability) {
    case "scientific-calculator.solve_expression":
      return "current_turn_action";
    case "workspace_os.status":
      return "workspace_state";
    case "docs-viewer.locate_in_doc":
    case "repo-code.search_concept":
      return "current_turn_doc";
    case "internet_search.web_research":
      return "external_internet_search";
    default:
      return "workspace_state";
  }
};

const explicitContractFromInput = (input: {
  promptText: string;
  toolCallAdmissionDecision?: RecordLike | null;
  requestedCapabilityContract?: ExplicitCapabilityContract | null;
}): ExplicitCapabilityContract | null =>
  input.requestedCapabilityContract ??
  explicitCapabilityContractForCapability(readString(input.toolCallAdmissionDecision?.requested_capability)) ??
  extractExplicitCapabilityContract(input.promptText);

const suppressionBlocksContract = (
  suppression: HelixContextualToolAdmissionSuppression | null,
  contract: ExplicitCapabilityContract | null,
): boolean => {
  if (!suppression) return false;
  if (!contract) return false;
  return contract.admission_families.some((family: ExplicitCapabilityContract["admission_families"][number]) =>
    contextualToolSuppressionBlocksFamily(suppression, family)
  );
};

const suppressionBlocksFallback = (
  suppression: HelixContextualToolAdmissionSuppression | null,
  fallbackSourceTarget: string,
  fallbackPlanFamily: HelixCapabilityFamily,
): boolean => {
  if (!suppression) return false;
  const sourceFamilies =
    fallbackSourceTarget === "calculator_stream" || fallbackSourceTarget === "calculator" || fallbackSourceTarget === "calculator_solve"
      ? ["calculator", "workstation_action"]
      : fallbackSourceTarget === "live_source_mailbox"
        ? ["live_environment"]
      : fallbackSourceTarget === "docs_viewer" || fallbackSourceTarget === "active_doc"
        ? ["docs_viewer"]
      : fallbackSourceTarget === "repo_code" || fallbackSourceTarget === "runtime_evidence"
        ? ["repo_code"]
      : fallbackSourceTarget
        ? [fallbackSourceTarget]
        : [];
  return [...sourceFamilies, fallbackPlanFamily].some((family) =>
    contextualToolSuppressionBlocksFamily(suppression, family),
  );
};

export const resolveAskCapabilityContractArbitration = (input: {
  turnId: string;
  promptText: string;
  sourceTargetIntent?: RecordLike | null;
  routeProductContract?: RecordLike | null;
  toolCallAdmissionDecision?: RecordLike | null;
  canonicalGoalFrame?: RecordLike | null;
  routeMetadata?: RecordLike | null;
  hardLiveSourceMailboxRoute?: boolean;
  requestedCapabilityContract?: ExplicitCapabilityContract | null;
  contextualSuppression?: HelixContextualToolAdmissionSuppression | null;
  fallbackSourceTarget: string;
  fallbackPlanFamily: HelixCapabilityFamily;
  fallbackGoalKind: string;
  fallbackRequiredTerminalKind?: string | null;
}): AskCapabilityContractArbitration => {
  const sourceTargetIntent = readRecord(input.sourceTargetIntent);
  const routeProductContract = readRecord(input.routeProductContract);
  const toolCallAdmissionDecision = readRecord(input.toolCallAdmissionDecision);
  const canonicalGoalFrame = readRecord(input.canonicalGoalFrame);
  const routeMetadata = readRecord(input.routeMetadata);
  const contextualSuppression =
    input.contextualSuppression === undefined
      ? detectContextualToolAdmissionSuppression(input.promptText)
      : input.contextualSuppression;
  const requestedCapabilityContract = explicitContractFromInput({
    promptText: input.promptText,
    toolCallAdmissionDecision,
    requestedCapabilityContract: input.requestedCapabilityContract,
  });
  const metadataSourceTarget = firstString(routeMetadata?.sourceTarget, routeMetadata?.source_target);
  const routeMetadataPresent = Boolean(metadataSourceTarget) || input.hardLiveSourceMailboxRoute === true;
  const hardLiveSourceMailboxRoute =
    input.hardLiveSourceMailboxRoute === true ||
    metadataSourceTarget === "live_source_mailbox" ||
    readString(toolCallAdmissionDecision?.source_target) === "live_source_mailbox";
  const fallbackRequiredTerminalKind =
    input.fallbackRequiredTerminalKind ??
    firstString(
      canonicalGoalFrame?.required_terminal_kind,
      routeProductContract?.required_terminal_artifact_kind,
      routeProductContract?.required_terminal_kind,
    );

  if (
    suppressionBlocksContract(contextualSuppression, requestedCapabilityContract) ||
    (!requestedCapabilityContract && suppressionBlocksFallback(contextualSuppression, input.fallbackSourceTarget, input.fallbackPlanFamily))
  ) {
    return {
      schema: "helix.ask_capability_contract_arbitration.v1",
      turn_id: input.turnId,
      contract_state: "suppressed_contextual_reference",
      requested_capability: null,
      selected_source_target: "model_only",
      selected_plan_family: "debug_export",
      canonical_goal_kind: "model_only_concept",
      required_observation_kinds: [],
      required_terminal_kind: "direct_answer_text",
      allow_phase_repair: false,
      route_metadata_demoted: routeMetadataPresent,
      demotion_reason: routeMetadataPresent ? "contextual_tool_reference_demoted_route_metadata" : undefined,
      failure_code_if_incompatible: "contextual_tool_reference_demoted_route_metadata",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (requestedCapabilityContract) {
    return {
      schema: "helix.ask_capability_contract_arbitration.v1",
      turn_id: input.turnId,
      contract_state: "explicit_capability_command",
      requested_capability: requestedCapabilityContract.capability,
      selected_source_target: requestedCapabilityContract.source_target,
      selected_plan_family: requestedCapabilityContract.plan_family,
      canonical_goal_kind:
        canonicalGoalKindForExplicitCapability(requestedCapabilityContract.capability) ??
        input.fallbackGoalKind,
      required_observation_kinds: requestedCapabilityContract.required_observation_kinds,
      required_terminal_kind: requestedCapabilityContract.required_terminal_kind,
      allow_phase_repair: false,
      route_metadata_demoted:
        routeMetadataPresent &&
        metadataSourceTarget !== requestedCapabilityContract.source_target &&
        metadataSourceTarget !== "",
      demotion_reason:
        routeMetadataPresent &&
        metadataSourceTarget !== requestedCapabilityContract.source_target &&
        metadataSourceTarget !== ""
          ? "explicit_capability_contract_demoted_route_metadata"
          : undefined,
      failure_code_if_incompatible: "explicit_capability_goal_contract_mismatch",
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (hardLiveSourceMailboxRoute) {
    return {
      schema: "helix.ask_capability_contract_arbitration.v1",
      turn_id: input.turnId,
      contract_state: "hard_live_source_phase",
      requested_capability: null,
      selected_source_target: "live_source_mailbox",
      selected_plan_family: "live_environment",
      canonical_goal_kind: input.fallbackGoalKind,
      required_observation_kinds: readStringArray(routeMetadata?.requiredEvidence),
      required_terminal_kind: fallbackRequiredTerminalKind,
      allow_phase_repair: true,
      route_metadata_demoted: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const modelOnly =
    input.fallbackSourceTarget === "model_only" ||
    input.fallbackGoalKind === "model_only_concept";
  return {
    schema: "helix.ask_capability_contract_arbitration.v1",
    turn_id: input.turnId,
    contract_state: modelOnly ? "model_only" : "classifier_hypothesis",
    requested_capability: null,
    selected_source_target: input.fallbackSourceTarget,
    selected_plan_family: input.fallbackPlanFamily,
    canonical_goal_kind: input.fallbackGoalKind,
    required_observation_kinds: [],
    required_terminal_kind: fallbackRequiredTerminalKind,
    allow_phase_repair: input.fallbackPlanFamily === "live_environment" || input.fallbackSourceTarget === "live_source_mailbox",
    route_metadata_demoted: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
