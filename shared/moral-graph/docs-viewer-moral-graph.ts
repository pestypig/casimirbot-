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

export type DocsViewerMoralGraphInput = {
  documentId: string;
  selectionRange: string;
  selectedText: string;
};

export type DocsViewerMoralGraphResult = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

const DOCS_ALLOWED_ACTION_TYPES = new Set([
  "highlight_relevant_ethos_passage",
  "show_related_ethos_node",
  "ask_for_missing_context",
  "show_action_gate_warning",
  "suggest_doc_annotation",
]);

function docsSource(reflection: IdeologyContextReflectionV1) {
  return {
    workstation: "docs-viewer",
    panel: "docs-viewer",
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

function buildDocsRecommendations(reflection: IdeologyContextReflectionV1): IdeologyContextReflectionRecommendedActionV1[] {
  const recommendations: IdeologyContextReflectionRecommendedActionV1[] = [];
  const matchedNode = reflection.matches.exact[0] ?? reflection.matches.likely[0] ?? reflection.matches.inferred_lenses[0];

  if (matchedNode) {
    recommendations.push({
      id: "moral-graph.highlight_relevant_ethos_passage",
      type: "highlight_relevant_ethos_passage",
      label: "Highlight relevant ethos passage",
      description: `Highlight selected text near ${matchedNode.label}.`,
      reasonCodes: ["activated_lens", "document_selection"],
    });
    recommendations.push({
      id: "moral-graph.show_related_ethos_node",
      type: "show_related_ethos_node",
      label: "Show related ethos node",
      description: `Show related mission ethos node: ${matchedNode.label}.`,
      reasonCodes: ["related_ethos_node"],
    });
  }

  if ((reflection.action_gate_warnings ?? []).length > 0) {
    recommendations.push({
      id: "moral-graph.show_action_gate_warning",
      type: "show_action_gate_warning",
      label: "Show action gate warning",
      description: "Show nearby action gate warnings for this selected text.",
      reasonCodes: ["action_gate_warning"],
    });
  }

  if ((reflection.claim_boundaries.missing_evidence ?? []).length > 0) {
    recommendations.push({
      id: "moral-graph.ask_for_missing_context",
      type: "ask_for_missing_context",
      label: "Ask for missing context",
      description: "Ask for missing document context before increasing confidence.",
      reasonCodes: reflection.claim_boundaries.missing_evidence,
    });
  }

  if (matchedNode) {
    recommendations.push({
      id: "moral-graph.suggest_doc_annotation",
      type: "suggest_doc_annotation",
      label: "Suggest doc annotation",
      description: `Suggest an annotation linking this selection to ${matchedNode.label}.`,
      reasonCodes: ["document_annotation_suggestion"],
    });
  }

  return uniqueRecommendations(recommendations).filter((action) => DOCS_ALLOWED_ACTION_TYPES.has(action.type));
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
    panelId: "docs-viewer",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: docsSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapDocsRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const base = baseEntry(reflection, recommendation);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];

  if (recommendation.type === "suggest_doc_annotation") {
    return {
      ...base,
      risk: "mutating",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Docs Viewer MoralGraph annotation suggestion would mutate document metadata and requires user confirmation.",
      reasonCode: "workspace_mutation_requires_confirmation",
      display_policy: "actionable",
      reasonCodes: ["moral_graph_reflection", "docs_annotation_requires_confirmation", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "ask_for_missing_context") {
    return {
      ...base,
      risk: "read_only",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Missing context prompt is diagnostic-only and does not mutate the document.",
      reasonCode: "read_only_allowlisted",
      display_policy: "diagnostic_only",
      evidenceRequirements: { missing: missing.length > 0 ? missing : ["missing_context"] },
      reasonCodes: ["moral_graph_reflection", "missing_context", "diagnostic_overlay_only", "evidence_only_authority"],
    };
  }

  if (
    recommendation.type === "highlight_relevant_ethos_passage" ||
    recommendation.type === "show_related_ethos_node" ||
    recommendation.type === "show_action_gate_warning"
  ) {
    return {
      ...base,
      risk: "read_only",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Docs Viewer MoralGraph display recommendation is diagnostic-only.",
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
    reason: "Docs Viewer MoralGraph recommendation type is not allowlisted.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_docs_moral_graph_action", "evidence_only_authority"],
  };
}

function buildDocsAdmission(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionV1 {
  const recommendations = buildDocsRecommendations(reflection);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source: docsSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
    ...(missing.length > 0 ? { evidenceRequirements: { missing } } : {}),
    reasonCodes: ["moral_graph_reflection", "docs_viewer_adapter", "evidence_only_authority"],
    actions: recommendations.map((recommendation) => mapDocsRecommendation(reflection, recommendation)),
  });
}

export function reflectDocsSelectionWithMoralGraph(
  graph: IdeologyGraph,
  input: DocsViewerMoralGraphInput,
): DocsViewerMoralGraphResult {
  const reflection = reflectIdeologyContext(graph, {
    kind: "document_selection",
    text: input.selectedText,
    refs: [input.documentId, input.selectionRange],
  });

  return {
    reflection,
    admissions: [buildDocsAdmission(reflection)],
  };
}
