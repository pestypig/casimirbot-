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
  forbidden_nearby_capabilities: string[];
  depends_on_subgoal_ids: string[];
  input_bindings: Array<{
    binding_id: string;
    arg_name:
      | "paper_result_or_source"
      | "source_ref"
      | "source_refs"
      | "target_ref"
      | "evidence_refs"
      | "support_refs"
      | "scenarioFrameRef"
      | "theory_reflection_ref"
      | "ideology_reflection_ref";
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
  const boundedTail = markerTail.split(
    /\b(?:then|followed\s+by|next)\b|(?:\s;\s)|(?:\n{2,})|(?:,\s+(?:and\s+)?(?:explain|summarize|cite|connect|answer|return|report|show)\b)/i,
  )[0] ?? markerTail;
  const candidates: string[] = Array.from(boundedTail.matchAll(/(?:\\frac|\\sqrt|sqrt|ln|log|sin|cos|tan|pi|e|\d|[+\-*/^=().,\s]){2,}/gi))
    .map((entry: RegExpMatchArray) => stripBoundaryPunctuation(entry[0]))
    .filter(Boolean)
    .filter((entry: string) => mathCandidateScore(entry) > 0)
    .sort((left: string, right: string) => mathCandidateScore(right) - mathCandidateScore(left));
  const best = candidates[0] ? normalizeSpace(candidates[0]) : "";
  return best || null;
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

const boundedSegmentForMatch = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): string => {
  const segment = segmentForMatch(promptText, match, ordered);
  return normalizeSpace(
    stripBoundaryPunctuation(
      (segment.split(/\s*,?\s*\b(?:then|next|followed\s+by|and\s+then|plus)\b\s+(?:call|use|run|invoke|execute)?\b/i)[0] ?? segment)
        .replace(/\b(?:then|next|plus|and)\s*$/i, ""),
    ),
  );
};

const firstWorkspacePath = (value: string): string | null => {
  const path = value.match(/\b((?:docs|server|client|shared|scripts|external)\/[^\s,;)]+)/i)?.[1] ?? null;
  return path ? stripBoundaryPunctuation(path) : null;
};

const stripLeadingArgLabel = (value: string): string =>
  normalizeSpace(
    stripBoundaryPunctuation(value)
      .replace(/^(?:query|concept|claim|text|phrase|term|where|path|target|for|about|on)\s*[:=]\s*/i, ""),
  );

const queryAfterMarker = (value: string, markerPattern: RegExp): string => {
  const markerMatch = value.match(markerPattern)?.[1] ?? value;
  return stripLeadingArgLabel(markerMatch);
};

const docsLocateArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const path = firstWorkspacePath(segment);
  const quoted = segment.match(/["']([^"'\n]+)["']/)?.[1];
  const explicitQuery = segment.match(/\b(?:query|claim|text|phrase|term|where)\b\s*[:=]\s*["']?([^"'\n.;]+)["']?/i)?.[1];
  const locateQuery =
    quoted ??
    explicitQuery ??
    segment.match(/\b(?:locate|find|cite|where)\b\s+(?:the\s+)?([\s\S]+?)(?:\s+in\s+(?:docs|server|client|shared|scripts|external)\/|$)/i)?.[1] ??
    queryAfterMarker(segment, /\b(?:query|claim|text|phrase|term|where)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i);
  const query = normalizeSpace(stripBoundaryPunctuation(locateQuery));
  return {
    query,
    target_transcript: query,
    ...(path ? { path } : {}),
  };
};

const docsSearchArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const query = queryAfterMarker(
    segment,
    /\b(?:query|topic|title|for|about|on|search(?:\s+for)?)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i,
  );
  return {
    query,
    limit: 8,
  };
};

const docsOpenDocByPathArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const path = firstWorkspacePath(segment) ??
    stripLeadingArgLabel(queryAfterMarker(segment, /\b(?:path|target|for|open)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i));
  return path ? { path } : {};
};

const repoSearchArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const commandWindow = promptText.slice(
    match.match_index,
    findNextCapabilityIndex(promptText, match, ordered),
  );
  const fallbackSegment = normalizeSpace(
    stripBoundaryPunctuation(
      commandWindow
        .replace(
          /\b(?:use|call|run|invoke|execute)?\s*(?:repo-code\.search_concept|repo_code\.search_concept|repo\s+code\s+search\s+concept|repo[_\s]+code|repo[_\s]+evidence|repository\s+code)\b(?:\s+to)?/i,
          "",
        ),
    ),
  );
  const querySource = segment || fallbackSegment || promptText;
  const rawQuery = queryAfterMarker(
    querySource,
    /\b(?:query|concept|for|about|on|find|search(?:\s+for)?|where)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i,
  );
  const query = normalizeSpace(rawQuery.replace(/^where\s+/i, ""));
  return {
    query,
    concept: query,
    limit: 5,
  };
};

const workspaceResolveArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const path = firstWorkspacePath(segment);
  const query = path ??
    queryAfterMarker(segment, /\b(?:query|for|resolve|path|target)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i);
  return {
    query,
    ...(path ? { path } : {}),
    limit: 8,
    target_kinds: ["doc", "panel", "path"],
  };
};

const internetSearchArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const query = queryAfterMarker(
    segment,
    /\b(?:query|for|about|on|search(?:\s+for)?|find)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i,
  );
  return { query };
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
    query: stripLeadingArgLabel(boundedQuery),
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

const workstationNoteArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const text =
    segment.match(/\b(?:with\s+text|text|body|content)\b\s*[:=]?\s*["']?([^"'\n]+)["']?/i)?.[1] ??
    segment;
  const normalized = normalizeSpace(stripBoundaryPunctuation(text));
  return normalized ? { text: normalized } : {};
};

const workstationNoteCreateArgs = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): RecordLike => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  const title =
    segment.match(/\b(?:with\s+title|title|name)\b\s*[:=]?\s*["']?([^"'\n.;]+)["']?/i)?.[1] ??
    stripLeadingArgLabel(segment);
  const normalized = normalizeSpace(stripBoundaryPunctuation(title));
  return normalized ? { title: normalized } : {};
};

const boundedPromptArgForSubgoal = (
  promptText: string,
  match: ExtractedExplicitCapabilityContract,
  ordered: ExtractedExplicitCapabilityContract[],
): string => {
  const segment = boundedSegmentForMatch(promptText, match, ordered);
  return stripLeadingArgLabel(segment) || normalizeSpace(promptText);
};

const argsHintForSubgoal = (input: {
  turnId: string;
  promptText: string;
  match: ExtractedExplicitCapabilityContract;
  ordered: ExtractedExplicitCapabilityContract[];
}): RecordLike => {
  const capability = input.match.contract.capability;
  const boundedPromptArg = (): string =>
    boundedPromptArgForSubgoal(input.promptText, input.match, input.ordered);
  if (input.match.contract.capability_family === "calculator") {
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
  if (capability === "live_env.query_micro_reasoner_presets") {
    return {
      include_presets: true,
      limit: 100,
      query: boundedPromptArg(),
    };
  }
  if (capability === "live_env.draft_micro_reasoner_preset") {
    return {
      scenario_text: boundedPromptArg(),
      base_preset_id: "stage_play_micro_reasoner_prompt_preset:generic-live-source:v1",
    };
  }
  if (capability === "live_env.route_micro_reasoner_prompt") {
    const prompt = boundedPromptArg();
    return {
      source_summary: prompt,
      candidate_prompts: [prompt],
    };
  }
  if (capability === "scholarly-research.lookup_papers") {
    return scholarlyLookupArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "scholarly-research.fetch_full_text") {
    return scholarlyFullTextArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "workstation-notes.create" || capability === "workstation-notes.create_note") {
    return workstationNoteCreateArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "workstation-notes.append_to_note") {
    return workstationNoteArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "helix_ask.reflect_theory_context") {
    return {
      prompt: boundedPromptArg(),
      build_explanation_plan: true,
      sync_panel: true,
      panel_overlay_mode: "live_answer_context",
      open_panel: false,
    };
  }
  if (capability === "helix.theory.frontierVectorFieldTrace") {
    return {
      query: boundedPromptArg(),
      searchSeed: `ask:${stableTextHash(input.turnId)}:theory-frontier-vector-field`,
    };
  }
  if (capability === "helix_ask.reflect_ideology_context") {
    return {
      inputKind: "user_prompt",
      text: boundedPromptArg(),
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
      prompt: boundedPromptArg(),
      refs: ["helix-ask:current-turn"],
      theory_reflection_ref: "step:reflect_theory_context",
      ideology_reflection_ref: "step:reflect_zen_graph_context",
    };
  }
  if (capability === "helix_ask.build_civilization_scenario_frame") {
    return {
      prompt: boundedPromptArg(),
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
      prompt: boundedPromptArg(),
      scenarioFrameRef: "step:build_civilization_scenario_frame",
      source_ref: "step:build_civilization_scenario_frame",
      source_refs: ["step:build_civilization_scenario_frame"],
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
      prompt: boundedPromptArg(),
      refs: ["helix-ask:current-turn"],
    };
  }
  if (capability === "docs-viewer.locate_in_doc" || capability === "docs-viewer.doc_equation_context") {
    return docsLocateArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "docs-viewer.search_docs") {
    return docsSearchArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "docs-viewer.open_doc_by_path") {
    return docsOpenDocByPathArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "repo-code.search_concept") {
    return repoSearchArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "workspace-directory.resolve") {
    return workspaceResolveArgs(input.promptText, input.match, input.ordered);
  }
  if (capability === "internet_search.web_research") {
    return internetSearchArgs(input.promptText, input.match, input.ordered);
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
  "workspace_diagnostic",
  "workspace_directory",
  "capability_catalog",
  "live_source_mail",
  "context_reflection",
  "theory_locator",
  "zen_graph_reflection",
  "civilization_bounds",
]);

const SUBGOAL_BINDING_CONSUMER_FAMILIES = new Set([
  "calculator",
  "docs_viewer",
  "context_reflection",
  "theory_locator",
  "scholarly_research",
  "live_source_mail",
  "live_source_decision",
  "voice_delivery",
  "zen_graph_reflection",
  "civilization_bounds",
]);

const bindingShapeForConsumer = (
  contract: ExplicitCapabilityContract,
  sourceCount: number,
  source?: ExplicitCapabilityContract | null,
): {
  arg_name:
    | "paper_result_or_source"
    | "source_ref"
    | "source_refs"
    | "target_ref"
    | "evidence_refs"
    | "support_refs"
    | "scenarioFrameRef"
    | "theory_reflection_ref"
    | "ideology_reflection_ref";
  binding_kind: "source_ref" | "target_ref" | "support_ref";
} => {
  if (contract.capability === "scholarly-research.fetch_full_text") {
    return {
      arg_name: "paper_result_or_source",
      binding_kind: "source_ref",
    };
  }
  if (contract.capability_family === "calculator") {
    return {
      arg_name: "support_refs",
      binding_kind: "support_ref",
    };
  }
  if (contract.capability_family === "docs_viewer") {
    return {
      arg_name: "target_ref",
      binding_kind: "target_ref",
    };
  }
  if (contract.capability === "live_env.request_interim_voice_callout") {
    return {
      arg_name: "evidence_refs",
      binding_kind: "support_ref",
    };
  }
  if (contract.capability === "live_env.record_live_source_mail_decision") {
    return {
      arg_name: "evidence_refs",
      binding_kind: "support_ref",
    };
  }
  if (
    contract.capability === "helix_ask.reflect_civilization_bounds" &&
    source?.capability === "helix_ask.build_civilization_scenario_frame"
  ) {
    return {
      arg_name: "scenarioFrameRef",
      binding_kind: "source_ref",
    };
  }
  if (contract.capability === "helix_ask.bridge_theory_ideology_context") {
    if (source?.capability === "helix_ask.reflect_theory_context") {
      return {
        arg_name: "theory_reflection_ref",
        binding_kind: "source_ref",
      };
    }
    if (source?.capability === "helix_ask.reflect_ideology_context") {
      return {
        arg_name: "ideology_reflection_ref",
        binding_kind: "source_ref",
      };
    }
  }
  return {
    arg_name: sourceCount === 1 ? "source_ref" : "source_refs",
    binding_kind: "source_ref",
  };
};

const canBindSourceToConsumer = (
  source: ExplicitCapabilityContract,
  consumer: ExplicitCapabilityContract,
): boolean => {
  if (consumer.capability === "live_env.summarize_live_source_current_state") {
    return (
      source.capability === "live_env.query_live_source_quality" ||
      source.capability === "live_env.query_workstation_goal_context"
    );
  }
  if (consumer.capability_family === "docs_viewer") {
    return source.capability_family === "workspace_directory";
  }
  if (consumer.capability === "scholarly-research.fetch_full_text") {
    return source.capability === "scholarly-research.lookup_papers";
  }
  if (consumer.capability_family === "scholarly_research") return false;
  if (consumer.capability === "live_env.request_interim_voice_callout") {
    return source.capability === "live_env.record_live_source_mail_decision";
  }
  if (consumer.capability === "live_env.record_live_source_mail_decision") {
    return source.capability_family === "live_source_mail";
  }
  return SUBGOAL_BINDING_SOURCE_FAMILIES.has(source.capability_family);
};

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
    .filter(({ entry }) => canBindSourceToConsumer(entry.contract, contract));
  return priorEvidenceSubgoals.map(({ entry, priorIndex }, bindingIndex: number) => ({
    binding_id: `${subgoalIdFor(input.turnId, input.index + 1, contract.capability)}:input_binding:${bindingIndex + 1}`,
    ...bindingShapeForConsumer(contract, priorEvidenceSubgoals.length, entry.contract),
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
        turnId: input.turnId,
        promptText: input.promptText,
        match,
        ordered,
      }),
      required_observation_kinds: requiredObservationKindsForCompoundSubgoal(contract, ordered.length),
      required_terminal_kind: contract.required_terminal_kind,
      contribution_role: contributionRoleForContract(contract),
      terminal_contribution_kind: contract.required_terminal_kind,
      allowed_substitutions: [...contract.allowed_substitutions],
      forbidden_nearby_capabilities: [...contract.forbidden_nearby_capabilities],
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
