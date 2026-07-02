import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionV1,
} from "../contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionRecommendedActionV1,
  IdeologyContextReflectionV1,
} from "../ideology-context-reflection";
import type { IdeologyGraph } from "./ideology-graph-types";
import { reflectIdeologyContext } from "./reflect-ideology-context";

export type RepoEvidenceMoralGraphInput = {
  repoRef: string;
  commitRef?: string;
  fileRefs?: string[];
  summaryOfDiffOrEvidence: string;
};

export type RepoEvidenceMoralGraphResult = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

const REPO_ALLOWED_ACTION_TYPES = new Set([
  "show_integrity_lens",
  "show_capture_resistance_warning",
  "ask_for_test_evidence",
  "suggest_review_gate",
  "link_policy_node",
]);

const REPO_MUTATION_ACTION_TYPES = new Set([
  "edit_document",
  "commit_code",
  "open_terminal",
  "run_command",
  "call_external_tool",
  "mutate_repo",
  "apply_patch",
]);

function repoSource(reflection: IdeologyContextReflectionV1) {
  return {
    workstation: "repo-evidence",
    panel: "repo-evidence",
    tool: "moral-graph-reflection",
    artifact_type: "ideology_context_reflection",
    artifact_id: reflection.reflectionId,
  };
}

function uniqueRecommendations(
  recommendations: IdeologyContextReflectionRecommendedActionV1[],
): IdeologyContextReflectionRecommendedActionV1[] {
  const seen = new Set<string>();
  const unique: IdeologyContextReflectionRecommendedActionV1[] = [];
  for (const recommendation of recommendations) {
    const key = `${recommendation.id}:${recommendation.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(recommendation);
  }
  return unique;
}

function hasLens(reflection: IdeologyContextReflectionV1, pattern: RegExp): boolean {
  const matches = [
    ...reflection.matches.exact,
    ...reflection.matches.likely,
    ...reflection.matches.inferred_lenses,
    ...reflection.activated_traits,
  ];
  return matches.some((match) => {
    const tags = "tags" in match ? match.tags ?? [] : [];
    return pattern.test(match.nodeId) || pattern.test(match.label) || tags.some((tag) => pattern.test(tag));
  });
}

function buildRepoRecommendations(reflection: IdeologyContextReflectionV1): IdeologyContextReflectionRecommendedActionV1[] {
  const recommendations: IdeologyContextReflectionRecommendedActionV1[] = [];
  const matchedNode = reflection.matches.exact[0] ?? reflection.matches.likely[0] ?? reflection.matches.inferred_lenses[0];
  const asksForTestEvidence =
    /test|verify|verification|coverage|evidence/i.test(reflection.input.summary) ||
    (reflection.claim_boundaries.missing_evidence ?? []).length > 0;

  if (matchedNode) {
    recommendations.push({
      id: "moral-graph.link_policy_node",
      type: "link_policy_node",
      label: "Link policy node",
      description: `Show related governance node: ${matchedNode.label}.`,
      reasonCodes: ["repo_evidence", "related_policy_node"],
    });
  }

  if (hasLens(reflection, /integrity/i)) {
    recommendations.push({
      id: "moral-graph.show_integrity_lens",
      type: "show_integrity_lens",
      label: "Show integrity lens",
      description: "Show the integrity lens related to this repo evidence.",
      reasonCodes: ["repo_evidence", "integrity_lens"],
    });
  }

  if (hasLens(reflection, /capture|resistance/i)) {
    recommendations.push({
      id: "moral-graph.show_capture_resistance_warning",
      type: "show_capture_resistance_warning",
      label: "Show capture resistance warning",
      description: "Show capture-resistance concerns related to this repo evidence.",
      reasonCodes: ["repo_evidence", "capture_resistance_warning"],
    });
  }

  if (asksForTestEvidence) {
    recommendations.push({
      id: "moral-graph.ask_for_test_evidence",
      type: "ask_for_test_evidence",
      label: "Ask for test evidence",
      description: "Ask for missing test evidence before increasing confidence.",
      reasonCodes: reflection.claim_boundaries.missing_evidence ?? ["test_evidence"],
    });
  }

  if ((reflection.action_gate_warnings ?? []).length > 0 || hasLens(reflection, /gate|approval|review/i)) {
    recommendations.push({
      id: "moral-graph.suggest_review_gate",
      type: "suggest_review_gate",
      label: "Suggest review gate",
      description: "Suggest a review gate for this repo evidence.",
      reasonCodes: ["repo_evidence", "review_gate_suggestion"],
    });
  }

  return uniqueRecommendations(recommendations).filter((action) => REPO_ALLOWED_ACTION_TYPES.has(action.type));
}

function baseEntry(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): Pick<
  HelixRecommendedActionAdmissionEntryV1,
  "actionId" | "panelId" | "label" | "mutatesCalculator" | "solves" | "objectiveFit" | "source" | "evidenceRefs"
> {
  return {
    actionId: recommendation.id.startsWith("moral-graph.") ? recommendation.id : `moral-graph.${recommendation.type}`,
    panelId: "repo-evidence",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: repoSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapRepoRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const base = baseEntry(reflection, recommendation);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];

  if (REPO_MUTATION_ACTION_TYPES.has(recommendation.type)) {
    return {
      ...base,
      objectiveFit: "low",
      risk: "unknown",
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Repo Evidence MoralGraph cannot trigger repo mutation, command execution, commits, or code edits.",
      reasonCode: "unknown_action_not_allowlisted",
      display_policy: "hidden",
      reasonCodes: ["moral_graph_reflection", "repo_mutation_blocked", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "suggest_review_gate") {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Repo Evidence MoralGraph review gate suggestions are claim-sensitive and require user confirmation.",
      reasonCode: "claim_sensitive_language",
      display_policy: "actionable",
      reasonCodes: ["moral_graph_reflection", "review_gate_requires_confirmation", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "ask_for_test_evidence") {
    return {
      ...base,
      risk: "read_only",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Test evidence request is diagnostic-only and does not mutate repo state.",
      reasonCode: "read_only_allowlisted",
      display_policy: "diagnostic_only",
      evidenceRequirements: { missing: missing.length > 0 ? missing : ["test evidence"] },
      reasonCodes: ["moral_graph_reflection", "ask_for_test_evidence", "diagnostic_overlay_only", "evidence_only_authority"],
    };
  }

  if (
    recommendation.type === "show_integrity_lens" ||
    recommendation.type === "show_capture_resistance_warning" ||
    recommendation.type === "link_policy_node"
  ) {
    return {
      ...base,
      risk: "read_only",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Repo Evidence MoralGraph display recommendation is diagnostic-only.",
      reasonCode: "read_only_allowlisted",
      display_policy: "diagnostic_only",
      reasonCodes: ["moral_graph_reflection", "diagnostic_overlay_only", "evidence_only_authority"],
    };
  }

  return {
    ...base,
    objectiveFit: "low",
    risk: "unknown",
    admission: "blocked",
    requiresConfirmation: true,
    agentExecutable: false,
    reason: "Repo Evidence MoralGraph recommendation type is not allowlisted.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_repo_moral_graph_action", "evidence_only_authority"],
  };
}

function buildRepoAdmission(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionV1 {
  const recommendations = buildRepoRecommendations(reflection);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source: repoSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
    ...(missing.length > 0 ? { evidenceRequirements: { missing } } : {}),
    reasonCodes: ["moral_graph_reflection", "repo_evidence_adapter", "evidence_only_authority"],
    actions: recommendations.map((recommendation) => mapRepoRecommendation(reflection, recommendation)),
  });
}

export function reflectRepoEvidenceWithMoralGraph(
  graph: IdeologyGraph,
  input: RepoEvidenceMoralGraphInput,
): RepoEvidenceMoralGraphResult {
  const refs = [input.repoRef, input.commitRef, ...(input.fileRefs ?? [])].filter(
    (ref): ref is string => typeof ref === "string" && ref.length > 0,
  );
  const reflection = reflectIdeologyContext(graph, {
    kind: "repo_evidence",
    text: input.summaryOfDiffOrEvidence,
    refs,
  });

  return {
    reflection,
    admissions: [buildRepoAdmission(reflection)],
  };
}
