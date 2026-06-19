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
  args_hint: RecordLike;
  required_observation_kinds: string[];
  required_terminal_kind: string;
  allowed_substitutions: string[];
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

const requiredObservationKindsForCompoundSubgoal = (
  contract: ExplicitCapabilityContract,
  subgoalCount: number,
): string[] => {
  if (subgoalCount > 1 && contract.capability === "helix_ask.inspect_capability_catalog") {
    return ["capability_registry"];
  }
  return [...contract.required_observation_kinds];
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
    return {
      subgoal_id: `${input.turnId}:compound_capability_subgoal:${index + 1}:${requestedCapability.replace(/[^A-Za-z0-9_-]+/g, "_")}`,
      order: index + 1,
      requested_capability: requestedCapability,
      runtime_capability: runtimeCapabilityForContract(contract),
      capability_family: contract.capability_family,
      plan_family: contract.plan_family,
      source_target: contract.source_target,
      admission_families: [...contract.admission_families],
      args_hint: argsHintForSubgoal({
        promptText: input.promptText,
        match,
        ordered,
      }),
      required_observation_kinds: requiredObservationKindsForCompoundSubgoal(contract, ordered.length),
      required_terminal_kind: contract.required_terminal_kind,
      allowed_substitutions: [...contract.allowed_substitutions],
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
