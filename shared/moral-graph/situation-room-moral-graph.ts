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

export type SituationRoomMoralGraphInput = {
  situationId: string;
  actionId: string;
  missionActionSummary: string;
};

export type SituationRoomMoralGraphResult = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

const SITUATION_ROOM_ALLOWED_ACTION_TYPES = new Set([
  "show_action_gate_warning",
  "require_two_key_review",
  "ask_for_missing_authority",
  "show_lawful_interface_check",
  "show_non_harm_check",
  "block_policy_sensitive_action",
]);

function situationRoomSource(reflection: IdeologyContextReflectionV1) {
  return {
    workstation: "situation-room",
    panel: "situation-room",
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

function isHighImpactOrOperational(text: string): boolean {
  return /\b(execute|dispatch|deploy|escalate|intervene|override|external|customer|production|incident|operator|mission)\b/i.test(text);
}

function isAuthorityUnclear(text: string, reflection: IdeologyContextReflectionV1): boolean {
  return /\b(no approval|without approval|unclear authority|missing authority|not authorized|unknown authority)\b/i.test(text) ||
    (reflection.claim_boundaries.missing_evidence ?? []).length > 0;
}

function buildSituationRoomRecommendations(
  reflection: IdeologyContextReflectionV1,
): IdeologyContextReflectionRecommendedActionV1[] {
  const recommendations: IdeologyContextReflectionRecommendedActionV1[] = [];
  const summary = reflection.input.summary;
  const highImpact = isHighImpactOrOperational(summary);
  const missingAuthority = isAuthorityUnclear(summary, reflection);

  if ((reflection.action_gate_warnings ?? []).length > 0 || hasLens(reflection, /gate|approval|covered.?action/i)) {
    recommendations.push({
      id: "moral-graph.show_action_gate_warning",
      type: "show_action_gate_warning",
      label: "Show action gate warning",
      description: "Show action gate warnings before treating this mission action as action-ready.",
      reasonCodes: ["situation_room_event", "action_gate_warning"],
    });
  }

  if (hasLens(reflection, /two.?key|approval|review/i) || highImpact) {
    recommendations.push({
      id: "moral-graph.require_two_key_review",
      type: "require_two_key_review",
      label: "Require two-key review",
      description: "Require explicit review before high-impact mission action.",
      reasonCodes: ["situation_room_event", "two_key_review_required"],
    });
  }

  if (missingAuthority || highImpact) {
    recommendations.push({
      id: "moral-graph.ask_for_missing_authority",
      type: "ask_for_missing_authority",
      label: "Ask for missing authority",
      description: "Ask for operator authority and evidence before any mission action proceeds.",
      reasonCodes: reflection.claim_boundaries.missing_evidence ?? ["missing_authority_check"],
    });
  }

  if (hasLens(reflection, /lawful|jurisdiction|interface/i) || highImpact) {
    recommendations.push({
      id: "moral-graph.show_lawful_interface_check",
      type: "show_lawful_interface_check",
      label: "Show lawful interface check",
      description: "Show lawful-interface and jurisdiction checks for this mission action.",
      reasonCodes: ["situation_room_event", "lawful_interface_check"],
    });
  }

  if (hasLens(reflection, /non.?harm|harm|safety|restraint/i) || highImpact) {
    recommendations.push({
      id: "moral-graph.show_non_harm_check",
      type: "show_non_harm_check",
      label: "Show non-harm check",
      description: "Show non-harm and restraint checks for this mission action.",
      reasonCodes: ["situation_room_event", "non_harm_check"],
    });
  }

  if (highImpact || missingAuthority) {
    recommendations.push({
      id: "moral-graph.block_policy_sensitive_action",
      type: "block_policy_sensitive_action",
      label: "Block policy-sensitive action",
      description: "Block unclear or high-impact operational action from being approved by MoralGraph alone.",
      reasonCodes: ["situation_room_event", "policy_sensitive_action_blocked"],
    });
  }

  return uniqueRecommendations(recommendations).filter((action) => SITUATION_ROOM_ALLOWED_ACTION_TYPES.has(action.type));
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
    panelId: "situation-room",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: situationRoomSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapSituationRoomRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const base = baseEntry(reflection, recommendation);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];

  if (recommendation.type === "block_policy_sensitive_action") {
    return {
      ...base,
      objectiveFit: "low",
      risk: "unknown",
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Situation Room MoralGraph cannot approve, execute, or unlock high-impact mission actions.",
      reasonCode: "unknown_action_not_allowlisted",
      display_policy: "hidden",
      reasonCodes: ["moral_graph_reflection", "policy_sensitive_action_blocked", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "require_two_key_review" || recommendation.type === "ask_for_missing_authority") {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Situation Room MoralGraph review and authority requirements need operator confirmation.",
      reasonCode: "claim_sensitive_language",
      display_policy: "actionable",
      ...(recommendation.type === "ask_for_missing_authority"
        ? { evidenceRequirements: { missing: missing.length > 0 ? missing : ["operator authority"] } }
        : {}),
      reasonCodes: ["moral_graph_reflection", "situation_room_review_required", "evidence_only_authority"],
    };
  }

  if (
    recommendation.type === "show_action_gate_warning" ||
    recommendation.type === "show_lawful_interface_check" ||
    recommendation.type === "show_non_harm_check"
  ) {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Situation Room MoralGraph warning is diagnostic-only and cannot execute mission actions.",
      reasonCode: "diagnostic_only_not_executable",
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
    reason: "Situation Room MoralGraph recommendation type is not allowlisted.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_situation_room_moral_graph_action", "evidence_only_authority"],
  };
}

function buildSituationRoomAdmission(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionV1 {
  const recommendations = buildSituationRoomRecommendations(reflection);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source: situationRoomSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
    ...(missing.length > 0 ? { evidenceRequirements: { missing } } : {}),
    reasonCodes: ["moral_graph_reflection", "situation_room_adapter", "evidence_only_authority"],
    actions: recommendations.map((recommendation) => mapSituationRoomRecommendation(reflection, recommendation)),
  });
}

export function reflectSituationRoomEventWithMoralGraph(
  graph: IdeologyGraph,
  input: SituationRoomMoralGraphInput,
): SituationRoomMoralGraphResult {
  const reflection = reflectIdeologyContext(graph, {
    kind: "situation_room_event",
    text: input.missionActionSummary,
    refs: [input.situationId, input.actionId],
  });

  return {
    reflection,
    admissions: [buildSituationRoomAdmission(reflection)],
  };
}
