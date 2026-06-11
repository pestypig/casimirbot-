import {
  HELIX_CAPABILITY_ITINERARY_SCHEMA,
  type HelixCapabilityItinerary,
  type HelixCapabilityItineraryFamily,
  type HelixCapabilityItineraryStep,
  type HelixCapabilityItineraryStepStatus,
} from "@shared/helix-capability-itinerary";
import type { HelixToolCallAdmissionDecision } from "@shared/helix-tool-call-admission";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import { buildToolUseRestatement, detectInternetSearchIntent } from "./internet-search-intent";
import { detectScholarlyResearchIntent } from "./scholarly-research-intent";

type RecordLike = Record<string, unknown>;

const THEORY_CONTEXT_REFLECTION_CAPABILITY = "helix_ask.reflect_theory_context";

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const unique = <T extends string>(values: T[]): T[] => Array.from(new Set(values));

const capabilityRecords = (availableCapabilities?: unknown): RecordLike[] => {
  const record = readRecord(availableCapabilities);
  const rawCapabilities = Array.isArray(record?.capabilities)
    ? record.capabilities
    : Array.isArray(availableCapabilities)
      ? availableCapabilities
      : [];
  return rawCapabilities.map(readRecord).filter((entry): entry is RecordLike => Boolean(entry));
};

const capabilityAvailable = (capability: RecordLike): boolean =>
  readString(capability.availability) !== "not_available" &&
  readString(capability.availability) !== "permission_denied" &&
  readString(capability.goal_fit) !== "forbidden";

const hasCapability = (availableCapabilities: unknown, key: string): boolean =>
  capabilityRecords(availableCapabilities).some((capability) => readString(capability.capability_key) === key && capabilityAvailable(capability));

const hasAnyCapability = (availableCapabilities: unknown, keys: string[]): boolean =>
  keys.some((key) => hasCapability(availableCapabilities, key));

const theoryLocatorRequested = (promptText: string): boolean =>
  /\b(?:theory\s+badge\s+graph|badge\s+graph|physics\s+graph|theory\s+graph|theory_context_reflection|reflect_theory_context|helix_ask\.reflect_theory_context|graph\s+placement|scale\s+bands?|semantic\s+chunks?|uncertainty\s+mode|map\b[\s\S]{0,80}\b(?:theory|badge|graph)|where\s+(?:does|do)\b[\s\S]{0,100}\b(?:fit|land|map))\b/i.test(promptText);

const requestedResearchFamilies = (promptText: string): HelixCapabilityItineraryFamily[] => {
  const suppression = detectContextualToolAdmissionSuppression(promptText);
  const scholarlySuppressed = contextualToolSuppressionBlocksFamily(suppression, "scholarly_research");
  const internetSuppressed = contextualToolSuppressionBlocksFamily(suppression, "internet_search");
  const scholarlyIntent = detectScholarlyResearchIntent(promptText);
  const internetIntent = detectInternetSearchIntent(promptText);
  const restatement = buildToolUseRestatement(promptText);
  const families: HelixCapabilityItineraryFamily[] = [];
  if (!scholarlySuppressed && scholarlyIntent.researchRequested) {
    families.push("scholarly_research");
  }
  if (
    !internetSuppressed &&
    (
      internetIntent.searchRequested ||
      restatement.requiredToolFamilies.includes("internet_search")
    )
  ) {
    families.push("internet_search");
  }
  return families;
};

const observationKindsFor = (family: HelixCapabilityItineraryFamily, promptText: string): string[] => {
  if (family === "scholarly_research") {
    return detectScholarlyResearchIntent(promptText).fullTextRequested
      ? ["scholarly_research_observation", "scholarly_full_text_observation"]
      : ["scholarly_research_observation"];
  }
  if (family === "internet_search") return ["internet_search_observation"];
  if (family === "theory_locator") return ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"];
  return [`${family}_observation`];
};

const capabilityHintFor = (family: HelixCapabilityItineraryFamily, promptText: string): string | null => {
  if (family === "scholarly_research") {
    return detectScholarlyResearchIntent(promptText).fullTextRequested
      ? HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY
      : HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
  }
  if (family === "internet_search") return HELIX_INTERNET_SEARCH_CAPABILITY;
  if (family === "theory_locator") return THEORY_CONTEXT_REFLECTION_CAPABILITY;
  return null;
};

const allowedTerminalKindsFor = (families: HelixCapabilityItineraryFamily[]): string[] => {
  const kinds: string[] = ["final_answer_draft"];
  if (families.includes("scholarly_research")) kinds.push("scholarly_research_answer");
  if (families.includes("internet_search")) kinds.push("internet_search_answer");
  if (families.includes("theory_locator")) kinds.push("theory_context_reflection_answer", "workstation_tool_evaluation");
  return unique(kinds);
};

const statusForFamily = (input: {
  family: HelixCapabilityItineraryFamily;
  admittedFamilies: HelixCapabilityItineraryFamily[];
  forbiddenFamilies: string[];
  availableCapabilities?: unknown;
}): HelixCapabilityItineraryStepStatus => {
  if (input.forbiddenFamilies.includes(input.family)) return "forbidden";
  if (input.family === "theory_locator") {
    return hasCapability(input.availableCapabilities, THEORY_CONTEXT_REFLECTION_CAPABILITY) ? "planned" : "missing";
  }
  if (input.admittedFamilies.includes(input.family)) return "admitted";
  if (
    input.family === "scholarly_research" &&
    hasAnyCapability(input.availableCapabilities, [
      HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    ])
  ) {
    return "planned";
  }
  if (input.family === "internet_search" && hasCapability(input.availableCapabilities, HELIX_INTERNET_SEARCH_CAPABILITY)) {
    return "planned";
  }
  return "missing";
};

const reasonForStep = (family: HelixCapabilityItineraryFamily, status: HelixCapabilityItineraryStepStatus): string => {
  if (status === "forbidden") return "The route/tool-admission policy forbids this family for the current turn.";
  if (status === "missing") return "The prompt appears to require this family, but it is not admitted or visible as an available capability.";
  if (family === "theory_locator") return "The prompt asks for badge-graph placement, so the theory locator must produce non-terminal graph evidence before synthesis.";
  if (status === "planned") return "The capability is visible and should be selected by the agent step before observing tool output.";
  return "The family is admitted by the current tool policy and may produce evidence before terminal synthesis.";
};

const stepForFamily = (input: {
  family: HelixCapabilityItineraryFamily;
  promptText: string;
  status: HelixCapabilityItineraryStepStatus;
}): HelixCapabilityItineraryStep => ({
  step_id:
    input.family === "theory_locator"
      ? "locate_theory_context"
      : input.family === "scholarly_research"
        ? "collect_scholarly_evidence"
        : input.family === "internet_search"
          ? "collect_web_evidence"
          : `collect_${input.family}_evidence`,
  tool_family: input.family,
  capability_hint: capabilityHintFor(input.family, input.promptText),
  purpose:
    input.family === "theory_locator"
      ? "Locate the prompt on the theory badge graph and expose scale/chunk/uncertainty evidence."
      : input.family === "scholarly_research"
        ? "Collect paper/citation evidence requested by the prompt."
        : input.family === "internet_search"
          ? "Collect live web evidence requested by the prompt."
          : "Collect the route-required observation for this family.",
  execution_group: input.family === "theory_locator" ? "locator" : "evidence",
  required_observation_kinds: observationKindsFor(input.family, input.promptText),
  status: input.status,
  reason: reasonForStep(input.family, input.status),
});

export function buildHelixCapabilityItinerary(input: {
  turnId: string;
  promptText: string;
  toolCallAdmissionDecision?: HelixToolCallAdmissionDecision | RecordLike | null;
  availableCapabilities?: unknown;
}): HelixCapabilityItinerary {
  const admission = readRecord(input.toolCallAdmissionDecision);
  const admittedFamilies = (Array.isArray(admission?.admitted_tool_families)
    ? admission.admitted_tool_families
    : []) as HelixCapabilityItineraryFamily[];
  const forbiddenFamilies = (Array.isArray(admission?.forbidden_tool_families)
    ? admission.forbidden_tool_families
    : []) as string[];
  const researchFamilies = requestedResearchFamilies(input.promptText);
  const locatorFamilies: HelixCapabilityItineraryFamily[] = theoryLocatorRequested(input.promptText)
    ? ["theory_locator"]
    : [];
  const relevantFamilies = unique([...researchFamilies, ...locatorFamilies]);
  const plannedSteps = relevantFamilies.map((family) => {
    const status = statusForFamily({
      family,
      admittedFamilies,
      forbiddenFamilies,
      availableCapabilities: input.availableCapabilities,
    });
    return stepForFamily({ family, promptText: input.promptText, status });
  });
  const admittedItineraryFamilies = plannedSteps
    .filter((step) => step.status === "admitted" || step.status === "planned")
    .map((step) => step.tool_family);
  const forbiddenItineraryFamilies = plannedSteps
    .filter((step) => step.status === "forbidden")
    .map((step) => step.tool_family);
  const missingItineraryFamilies = plannedSteps
    .filter((step) => step.status === "missing")
    .map((step) => step.tool_family);
  const promptShape =
    relevantFamilies.length > 1
      ? "compound_tool"
      : relevantFamilies.length === 1
        ? "single_tool"
        : "model_only";
  const typedFailures = [
    ...(researchFamilies.length > 0 ? ["research_observation_missing"] : []),
    ...(locatorFamilies.length > 0 ? ["locator_observation_missing"] : []),
    ...(promptShape === "compound_tool" ? ["compound_evidence_not_reentered"] : []),
    ...(missingItineraryFamilies.length > 0 ? ["capability_family_not_admitted_or_visible"] : []),
  ];
  return {
    schema: HELIX_CAPABILITY_ITINERARY_SCHEMA,
    turn_id: input.turnId,
    planning_stage: "pre_execution",
    prompt_shape: promptShape,
    relevant_tool_families: relevantFamilies,
    admitted_tool_families: unique(admittedItineraryFamilies),
    forbidden_tool_families: unique(forbiddenItineraryFamilies),
    missing_tool_families: unique(missingItineraryFamilies),
    planned_steps: plannedSteps,
    reasoning_criteria: [
      ...(researchFamilies.length > 0
        ? [{
            criterion_id: "research_evidence_grounding",
            description: "Research claims must be grounded in current-turn research observations, not classifier or route hints.",
            required_observation_families: researchFamilies,
          }]
        : []),
      ...(locatorFamilies.length > 0
        ? [{
            criterion_id: "badge_graph_location_grounding",
            description: "Graph placement must be grounded in a theory context reflection receipt before synthesis.",
            required_observation_families: locatorFamilies,
          }]
        : []),
      ...(promptShape === "compound_tool"
        ? [{
            criterion_id: "compound_reentry_before_terminal",
            description: "Every required observation family must re-enter the solver before a terminal answer is eligible.",
            required_observation_families: relevantFamilies,
          }]
        : []),
    ],
    terminal_success_criteria: {
      required_observation_families: relevantFamilies,
      allowed_terminal_artifact_kinds: allowedTerminalKindsFor(relevantFamilies),
      requires_post_observation_synthesis: relevantFamilies.length > 0,
      typed_failure_codes: unique(typedFailures),
    },
    authority: "planning_only",
    not_terminal: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}
