import {
  extractExplicitCapabilityContracts,
  type ExplicitCapabilityContract,
  type ExtractedExplicitCapabilityContract,
} from "./explicit-capability-contract";

type RecordLike = Record<string, unknown>;

export const HELIX_COMPOUND_CAPABILITY_CONTRACT_SCHEMA =
  "helix.compound_capability_contract.v1" as const;

export type HelixCompoundCapabilitySubgoal = {
  subgoal_id: string;
  order: number;
  requested_capability: string;
  runtime_capability: string;
  capability_family: string;
  plan_family: string;
  source_target: string;
  admission_families: string[];
  required_args: string[];
  optional_args: string[];
  args_hint: RecordLike;
  required_observation_kinds: string[];
  required_terminal_kind: string;
  contribution_role: string;
  terminal_contribution_kind: string;
  allowed_substitutions: string[];
  depends_on_subgoal_ids: string[];
  input_bindings: Array<{
    binding_id: string;
    arg_name: "source_ref" | "source_refs" | "target_ref" | "support_refs";
    binding_kind: "source_ref" | "target_ref" | "support_ref";
    from_subgoal_id: string;
    from_capability: string;
    required_observation_kinds: string[];
    required: boolean;
    status: "pending";
  }>;
  status: "pending";
  mandatory: true;
};

export type HelixCompoundCapabilityContract = {
  schema: typeof HELIX_COMPOUND_CAPABILITY_CONTRACT_SCHEMA;
  turn_id: string;
  prompt_shape: "single_capability" | "compound_capability";
  subgoals: HelixCompoundCapabilitySubgoal[];
  required_capabilities: string[];
  requires_all_subgoals: boolean;
  terminal_policy: "synthesize_from_satisfied_subgoal_observations";
  assistant_answer: false;
  raw_content_included: false;
};

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const stableTextHash = (input: string): string => {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

const normalizeSpace = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripBoundaryPunctuation = (value: string): string =>
  value
    .replace(/^[\s:;,.=\-]+/, "")
    .replace(/[\s:;,.]+$/, "")
    .trim();

const findNextCapabilityIndex = (
  prompt: string,
  current: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): number => {
  const later = ordered.find((entry: ExtractedExplicitCapabilityContract) => entry.match_index > current.match_index);
  return later?.match_index ?? prompt.length;
};

const mathCandidateScore = (candidate: string): number => {
  const normalized = normalizeSpace(stripBoundaryPunctuation(candidate));
  if (!/\d/.test(normalized)) return 0;
  if (!/[+\-*/^=()]|sqrt|ln|log|sin|cos|tan|pi|\\frac|\\sqrt/i.test(normalized)) return 0;
  const prosePenalty = /\b(?:then|and|please|wait|receipt|answer|tool|call|use|run|with|this|exact|expression)\b/i.test(normalized)
    ? 20
    : 0;
  return normalized.length - prosePenalty;
};

export const extractCalculatorSubgoalExpression = (
  promptText: string,
  match: Pick<ExtractedExplicitCapabilityContract, "match_end_index" | "match_index">,
  nextCapabilityIndex?: number | null,
): string | null => {
  const prompt = String(promptText ?? "");
  if (!prompt.trim()) return null;
  const segmentEnd = typeof nextCapabilityIndex === "number" && nextCapabilityIndex > match.match_index
    ? nextCapabilityIndex
    : prompt.length;
  const segment = prompt.slice(match.match_end_index, segmentEnd);
  const markerTail =
    segment.match(/\b(?:with\s+this\s+exact\s+expression|exact\s+expression|expression|equation|latex|evaluate|calculate|compute|solve|for)\b\s*[:=]?\s*([\s\S]+)$/i)?.[1] ??
    segment;
  const boundedTail = markerTail.split(/\b(?:then|followed\s+by|next)\b|(?:\s;\s)|(?:\n{2,})/i)[0] ?? markerTail;
  const candidates: string[] = Array.from(boundedTail.matchAll(/(?:\\frac|\\sqrt|sqrt|ln|log|sin|cos|tan|pi|e|\d|[+\-*/^=().,\s]){2,}/gi))
    .map((entry: RegExpMatchArray) => stripBoundaryPunctuation(entry[0]))
    .filter(Boolean)
    .filter((entry: string) => mathCandidateScore(entry) > 0)
    .sort((left: string, right: string) => mathCandidateScore(right) - mathCandidateScore(left));
  const best = candidates[0] ? normalizeSpace(candidates[0]) : "";
  return best || null;
};

const docsLocateArgs = (promptText: string): RecordLike => {
  const query =
    promptText.match(/\b(?:locate|find|cite|where)\b[\s\S]{0,80}?\b(?:claim|text|phrase|where)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i)?.[1] ??
    promptText;
  return {
    query: normalizeSpace(stripBoundaryPunctuation(query)),
    target_transcript: normalizeSpace(stripBoundaryPunctuation(query)),
  };
};

const segmentForMatch = (
  promptText: string,
  match: Pick<ExtractedExplicitCapabilityContract, "match_end_index" | "match_index">,
  ordered: ExtractedExplicitCapabilityContract[],
): string => {
  const nextCapabilityIndex = findNextCapabilityIndex(promptText, match, ordered);
  const segmentEnd = nextCapabilityIndex > match.match_index ? nextCapabilityIndex : promptText.length;
  return promptText.slice(match.match_end_index, segmentEnd);
};

const scholarlyLookupArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = segmentForMatch(promptText, match, ordered);
  const query =
    segment.match(/\b(?:for|about|on|query|search(?:\s+for)?)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i)?.[1] ??
    (segment || promptText);
  const boundedQuery = query.split(/\s*,?\s*\b(?:then|next|followed\s+by)\b\s+(?:call|use|run)\b/i)[0] ?? query;
  return {
    query: normalizeSpace(stripBoundaryPunctuation(boundedQuery)),
    limit: 5,
  };
};

const scholarlyFullTextArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = segmentForMatch(promptText, match, ordered);
  const source = `${segment} ${promptText}`;
  const paperResultId =
    source.match(/\b(?:paper_result_id|paper_id|result_id)\s*[:=]\s*["']?([^"'\s,.;]+)["']?/i)?.[1] ??
    source.match(/\b(?:arxiv|openalex|semantic_scholar|crossref|doi):[^\s,.;]+/i)?.[0];
  const sourceUrl = source.match(/\b(?:source_url|pdf_url|full_text_url|url)\s*[:=]\s*["']?(https?:\/\/[^"'\s,.;]+)["']?/i)?.[1] ??
    source.match(/https?:\/\/[^\s"']+/i)?.[0];
  return {
    ...(paperResultId ? { paper_result_id: stripBoundaryPunctuation(paperResultId) } : {}),
    ...(sourceUrl ? { source_url: stripBoundaryPunctuation(sourceUrl) } : {}),
  };
};

const argsHintForSubgoal = (input: {
  promptText: string;
  match: ExtractedExplicitCapabilityContract;
  ordered: ExtractedExplicitCapabilityContract[];
}): RecordLike => {
  const capability = input.match.contract.capability;
  if (capability === "scientific-calculator.solve_expression") {
    const expression = extractCalculatorSubgoalExpression(
      input.promptText,
      input.match,
      findNextCapabilityIndex(input.promptText, input.match, input.ordered),
    );
    return expression
      ? { latex: expression, expression }
      : {};
  }
  if (capability === "workspace_os.status") return {};
  if (capability === "helix_ask.inspect_capability_catalog") return {};
  if (capability === "scholarly-research.lookup_papers") {
    return scholarlyLookupArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "scholarly-research.fetch_full_text") {
    return scholarlyFullTextArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "helix_ask.reflect_theory_context") {
    return {
      prompt: normalizeSpace(input.promptText),
      build_explanation_plan: true,
      sync_panel: true,
      panel_overlay_mode: "live_answer_context",
      open_panel: false,
    };
  }
  if (capability === "helix.theory.frontierVectorFieldTrace") {
    return {
      query: normalizeSpace(input.promptText),
      searchSeed: `ask:${stableTextHash(input.turnId)}:theory-frontier-vector-field`,
    };
  }
  if (capability === "helix_ask.reflect_ideology_context") {
    return {
      inputKind: "user_prompt",
      text: normalizeSpace(input.promptText),
      refs: ["helix-ask:current-turn"],
      options: {
        includeOverlay: true,
        includeRecommendedActions: true,
        includeAdmissionArtifacts: true,
        includeLocator: true,
        includeFruition: true,
        includeProceduralClassification: true,
      },
    };
  }
  if (capability === "helix_ask.bridge_theory_ideology_context") {
    return {
      prompt: normalizeSpace(input.promptText),
      refs: ["helix-ask:current-turn"],
      theory_reflection_ref: "step:reflect_theory_context",
      ideology_reflection_ref: "step:reflect_zen_graph_context",
    };
  }
  if (capability === "helix_ask.build_civilization_scenario_frame") {
    return {
      prompt: normalizeSpace(input.promptText),
      refs: ["helix-ask:current-turn"],
      options: {
        allowFictional: true,
        allowHistorical: true,
        includeNeedleScenarioFallback: true,
      },
    };
  }
  if (capability === "helix_ask.reflect_civilization_bounds") {
    return {
      prompt: normalizeSpace(input.promptText),
      scenarioFrameRef: "step:build_civilization_scenario_frame",
      refs: ["helix-ask:current-turn"],
      options: {
        includeBridgeContext: true,
        includeCollaborationBounds: true,
        includeFalsificationHooks: true,
      },
    };
  }
  if (input.match.contract.capability_family === "context_reflection") {
    return {
      prompt: normalizeSpace(input.promptText),
      refs: ["helix-ask:current-turn"],
    };
  }
  if (capability === "docs-viewer.locate_in_doc") return docsLocateArgs(input.promptText);
  if (capability === "repo-code.search_concept") {
    return {
      query: normalizeSpace(input.promptText),
      concept: normalizeSpace(input.promptText),
      limit: 5,
    };
  }
  if (capability === "workspace-directory.resolve") {
    return {
      query: normalizeSpace(input.promptText),
      limit: 8,
      target_kinds: ["doc", "panel", "path"],
    };
  }
  if (capability === "image_lens.inspect") return {};
  return {};
};

const runtimeCapabilityForContract = (contract: ExplicitCapabilityContract): string =>
  contract.runtime_capability && contract.runtime_capability !== contract.capability
    ? contract.runtime_capability
    : contract.capability;

const contributionRoleForContract = (contract: ExplicitCapabilityContract): string => {
  if (contract.capability_family === "docs_viewer") return "document_evidence";
  if (contract.capability_family === "calculator") return "numeric_result";
  if (contract.capability_family === "internet_search" || contract.capability_family === "scholarly_research") {
    return "retrieved_evidence";
  }
  if (contract.capability_family === "context_reflection" || contract.capability_family === "theory_locator") {
    return "reflection";
  }
  if (contract.capability_family === "workspace_diagnostic") return "workspace_status";
  if (contract.capability_family === "capability_catalog") return "capability_catalog";
  if (contract.capability_family === "repo_code") return "repo_evidence";
  if (contract.capability_family === "visual_capture") return "visual_evidence";
  return contract.capability_family || "tool_observation";
};

const requiredObservationKindsForCompoundSubgoal = (
  contract: ExplicitCapabilityContract,
  subgoalCount: number,
): string[] => {
  if (subgoalCount > 1 && contract.capability === "helix_ask.inspect_capability_catalog") {
    return ["capability_registry"];
  }
  return [...contract.required_observation_kinds];
};

const subgoalIdFor = (turnId: string, order: number, capability: string): string =>
  `${turnId}:compound_capability_subgoal:${order}:${capability.replace(/[^A-Za-z0-9_-]+/g, "_")}`;

const SUBGOAL_BINDING_SOURCE_FAMILIES = new Set([
  "internet_search",
  "scholarly_research",
  "docs_viewer",
  "repo_code",
  "visual_capture",
  "workspace_directory",
  "capability_catalog",
  "context_reflection",
  "theory_locator",
  "zen_graph_reflection",
  "civilization_bounds",
]);

const SUBGOAL_BINDING_CONSUMER_FAMILIES = new Set([
  "context_reflection",
  "theory_locator",
  "zen_graph_reflection",
  "civilization_bounds",
]);

const inputBindingsForSubgoal = (input: {
  turnId: string;
  match: ExtractedExplicitCapabilityContract;
  ordered: ExtractedExplicitCapabilityContract[];
  index: number;
}) => {
  const contract = input.match.contract;
  if (!SUBGOAL_BINDING_CONSUMER_FAMILIES.has(contract.capability_family)) return [];
  const priorEvidenceSubgoals = input.ordered.slice(0, input.index)
    .map((entry: ExtractedExplicitCapabilityContract, priorIndex: number) => ({ entry, priorIndex }))
    .filter(({ entry }) => SUBGOAL_BINDING_SOURCE_FAMILIES.has(entry.contract.capability_family));
  return priorEvidenceSubgoals.map(({ entry, priorIndex }, bindingIndex: number) => ({
    binding_id: `${subgoalIdFor(input.turnId, input.index + 1, contract.capability)}:input_binding:${bindingIndex + 1}`,
    arg_name: priorEvidenceSubgoals.length === 1 ? "source_ref" as const : "source_refs" as const,
    binding_kind: "source_ref" as const,
    from_subgoal_id: subgoalIdFor(input.turnId, priorIndex + 1, entry.contract.capability),
    from_capability: entry.contract.capability,
    required_observation_kinds: requiredObservationKindsForCompoundSubgoal(entry.contract, input.ordered.length),
    required: true,
    status: "pending" as const,
  }));
};

export const buildHelixCompoundCapabilityContract = (input: {
  turnId: string;
  promptText: string;
}): HelixCompoundCapabilityContract | null => {
  const ordered = extractExplicitCapabilityContracts(input.promptText);
  if (ordered.length === 0) return null;
  const subgoals = ordered.map((match: ExtractedExplicitCapabilityContract, index: number): HelixCompoundCapabilitySubgoal => {
    const contract = match.contract;
    const requestedCapability = contract.capability;
    const subgoalId = subgoalIdFor(input.turnId, index + 1, requestedCapability);
    const inputBindings = inputBindingsForSubgoal({
      turnId: input.turnId,
      match,
      ordered,
      index,
    });
    return {
      subgoal_id: subgoalId,
      order: index + 1,
      requested_capability: requestedCapability,
      runtime_capability: runtimeCapabilityForContract(contract),
      capability_family: contract.capability_family,
      plan_family: contract.plan_family,
      source_target: contract.source_target,
      admission_families: [...contract.admission_families],
      required_args: [...contract.required_args],
      optional_args: [...contract.optional_args],
      args_hint: argsHintForSubgoal({
        promptText: input.promptText,
        match,
        ordered,
      }),
      required_observation_kinds: requiredObservationKindsForCompoundSubgoal(contract, ordered.length),
      required_terminal_kind: contract.required_terminal_kind,
      contribution_role: contributionRoleForContract(contract),
      terminal_contribution_kind: contract.required_terminal_kind,
      allowed_substitutions: [...contract.allowed_substitutions],
      depends_on_subgoal_ids: inputBindings.map((binding) => binding.from_subgoal_id),
      input_bindings: inputBindings,
      status: "pending",
      mandatory: true,
    };
  });
  return {
    schema: HELIX_COMPOUND_CAPABILITY_CONTRACT_SCHEMA,
    turn_id: input.turnId,
    prompt_shape: subgoals.length > 1 ? "compound_capability" : "single_capability",
    subgoals,
    required_capabilities: unique(subgoals.map((subgoal: HelixCompoundCapabilitySubgoal) => subgoal.requested_capability)),
    requires_all_subgoals: subgoals.length > 1,
    terminal_policy: "synthesize_from_satisfied_subgoal_observations",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const firstPendingCompoundCapabilitySubgoal = (
  contract: HelixCompoundCapabilityContract | null | undefined,
  ledger: Array<RecordLike> | null | undefined,
): HelixCompoundCapabilitySubgoal | null => {
  if (!contract?.subgoals?.length) return null;
  const satisfied = new Set(
    (Array.isArray(ledger) ? ledger : [])
      .filter((entry: RecordLike) => readString(entry.satisfaction) === "satisfied")
      .map((entry: RecordLike) => readString(entry.subgoal_id))
      .filter(Boolean),
  );
  return contract.subgoals.find((subgoal: HelixCompoundCapabilitySubgoal) => !satisfied.has(subgoal.subgoal_id)) ?? null;
};
