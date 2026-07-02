import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionSourceV1,
  type HelixRecommendedActionAdmissionV1,
} from "../contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionRecommendedActionV1,
  IdeologyContextReflectionV1,
} from "../ideology-context-reflection";

const DISPLAY_ONLY_ACTION_TYPES = new Set([
  "highlight_ideology_lens",
  "show_activated_lens",
  "show_path_to_root",
  "show_nearby_safeguard",
  "show_action_gate_warning",
  "compare_character_perspectives",
  "suggest_review",
  "link_ethos_node",
]);

const MUTATING_ACTION_TYPES = new Set(["suggest_note_tag"]);

const CLAIM_SENSITIVE_CONFIRMATION_ACTION_TYPES = new Set([
  "ask_for_missing_evidence",
  "suggest_wise_next_question",
]);

const BLOCKED_ACTION_TYPES = new Set([
  "execute_action",
  "send_message",
  "edit_document",
  "edit_document_without_confirmation",
  "commit_code",
  "open_terminal",
  "run_command",
  "call_external_tool",
  "make_legal_medical_financial_claim",
  "label_real_person_character",
  "make_terminal_moral_verdict",
]);

function sourceForReflection(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionSourceV1 {
  return {
    workstation: "moral-graph",
    tool: "moral-graph-reflection",
    artifact_type: "ideology_context_reflection",
    artifact_id: reflection.reflectionId,
  };
}

function actionIdForRecommendation(recommendation: IdeologyContextReflectionRecommendedActionV1): string {
  return recommendation.id.startsWith("moral-graph.") ? recommendation.id : `moral-graph.${recommendation.type}`;
}

function baseEntry(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): Pick<
  HelixRecommendedActionAdmissionEntryV1,
  "actionId" | "panelId" | "label" | "mutatesCalculator" | "solves" | "objectiveFit" | "source" | "evidenceRefs"
> {
  return {
    actionId: actionIdForRecommendation(recommendation),
    panelId: "moral-graph",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: sourceForReflection(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const missingEvidence = reflection.claim_boundaries.missing_evidence ?? [];
  const base = baseEntry(reflection, recommendation);

  if (BLOCKED_ACTION_TYPES.has(recommendation.type)) {
    return {
      ...base,
      objectiveFit: "low",
      risk: "unknown",
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "MoralGraph recommendations cannot admit operational actions in this phase.",
      reasonCode: "unknown_action_not_allowlisted",
      display_policy: "hidden",
      reasonCodes: ["moral_graph_reflection", "blocked_operational_action", "evidence_only_authority"],
    };
  }

  if (MUTATING_ACTION_TYPES.has(recommendation.type)) {
    return {
      ...base,
      risk: "mutating",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "MoralGraph recommendation may mutate workstation state and requires user confirmation.",
      reasonCode: "workspace_mutation_requires_confirmation",
      display_policy: "actionable",
      reasonCodes: ["moral_graph_reflection", "mutating_requires_confirmation", "evidence_only_authority"],
    };
  }

  if (CLAIM_SENSITIVE_CONFIRMATION_ACTION_TYPES.has(recommendation.type) || missingEvidence.length > 0) {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: CLAIM_SENSITIVE_CONFIRMATION_ACTION_TYPES.has(recommendation.type)
        ? "MoralGraph claim-sensitive recommendation requires user confirmation and remains evidence-only."
        : "MoralGraph reflection is missing evidence and requires user confirmation.",
      reasonCode: missingEvidence.length > 0 ? "missing_evidence" : "claim_sensitive_language",
      display_policy: "actionable",
      evidenceRequirements: { missing: missingEvidence.length > 0 ? missingEvidence : ["missing_evidence"] },
      reasonCodes: [
        "moral_graph_reflection",
        missingEvidence.length > 0 ? "missing_evidence" : "claim_sensitive_confirmation",
        "evidence_only_authority",
      ],
    };
  }

  if (DISPLAY_ONLY_ACTION_TYPES.has(recommendation.type)) {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "MoralGraph display-only recommendation is auto-admitted to diagnostic evidence stream only.",
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
    reason: "MoralGraph recommendation type is not allowlisted for admission.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_moral_graph_action", "evidence_only_authority"],
  };
}

export function mapIdeologyReflectionToRecommendedActionAdmission(
  reflection: IdeologyContextReflectionV1,
): HelixRecommendedActionAdmissionV1 {
  const source = sourceForReflection(reflection);
  const missingEvidence = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source,
    evidenceRefs: reflection.input.refs ?? [],
    ...(missingEvidence.length > 0 ? { evidenceRequirements: { missing: missingEvidence } } : {}),
    reasonCodes: ["moral_graph_reflection", "diagnostic_overlay_only", "evidence_only_authority"],
    actions: reflection.recommended_actions.map((recommendation) => mapRecommendation(reflection, recommendation)),
  });
}
