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

export type WorkstationNoteMoralGraphInput = {
  id: string;
  content: string;
  title?: string;
};

export type WorkstationNoteMoralGraphResult = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

const NOTE_ALLOWED_ACTION_TYPES = new Set([
  "suggest_note_tag",
  "suggest_review",
  "ask_for_missing_evidence",
  "link_ethos_node",
  "show_path_to_root",
]);

function noteSource(reflection: IdeologyContextReflectionV1) {
  return {
    workstation: "workstation-notes",
    panel: "workstation-notes",
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

function buildNoteRecommendations(reflection: IdeologyContextReflectionV1): IdeologyContextReflectionRecommendedActionV1[] {
  const recommendations = reflection.recommended_actions.filter((action) => NOTE_ALLOWED_ACTION_TYPES.has(action.type));
  const matchedTags = Array.from(
    new Set([
      ...reflection.matches.exact.flatMap((match) => match.tags ?? []),
      ...reflection.matches.likely.flatMap((match) => match.tags ?? []),
      ...reflection.matches.inferred_lenses.flatMap((match) => match.tags ?? []),
      ...reflection.activated_traits.flatMap((trait) => trait.tags ?? []),
    ]),
  );
  const matchedNode = reflection.matches.exact[0] ?? reflection.matches.likely[0] ?? reflection.matches.inferred_lenses[0];

  if (matchedTags.length > 0) {
    recommendations.push({
      id: "moral-graph.suggest_note_tag",
      type: "suggest_note_tag",
      label: "Suggest note tag",
      description: `Suggest note tags from activated lenses: ${matchedTags.slice(0, 4).join(", ")}.`,
      reasonCodes: ["activated_lens", "note_tag_suggestion"],
    });
  }

  if (matchedNode) {
    recommendations.push({
      id: "moral-graph.link_ethos_node",
      type: "link_ethos_node",
      label: "Link ethos node",
      description: `Link note to related mission ethos node: ${matchedNode.label}.`,
      reasonCodes: ["related_ethos_node"],
    });
  }

  if ((reflection.claim_boundaries.missing_evidence ?? []).length > 0) {
    recommendations.push({
      id: "moral-graph.ask_for_missing_evidence",
      type: "ask_for_missing_evidence",
      label: "Ask for missing evidence",
      description: "Capture missing checks before increasing confidence.",
      reasonCodes: reflection.claim_boundaries.missing_evidence,
    });
  }

  return uniqueRecommendations(recommendations);
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
    panelId: "workstation-notes",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: noteSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapNoteRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const base = baseEntry(reflection, recommendation);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];

  if (recommendation.type === "suggest_note_tag" || recommendation.type === "link_ethos_node") {
    return {
      ...base,
      risk: "mutating",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Notes MoralGraph recommendation changes note metadata or links and requires user confirmation.",
      reasonCode: "workspace_mutation_requires_confirmation",
      display_policy: "actionable",
      reasonCodes: ["moral_graph_reflection", "notes_mutation_requires_confirmation", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "ask_for_missing_evidence") {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Missing evidence marker is diagnostic-only and does not mutate the note.",
      reasonCode: "diagnostic_only_not_executable",
      display_policy: "diagnostic_only",
      evidenceRequirements: { missing: missing.length > 0 ? missing : ["missing_evidence"] },
      reasonCodes: ["moral_graph_reflection", "missing_evidence", "diagnostic_overlay_only", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "suggest_review" || recommendation.type === "show_path_to_root") {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Notes MoralGraph display recommendation is diagnostic-only.",
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
    reason: "Notes MoralGraph recommendation type is not allowlisted.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_notes_moral_graph_action", "evidence_only_authority"],
  };
}

function buildNoteAdmission(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionV1 {
  const recommendations = buildNoteRecommendations(reflection);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source: noteSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
    ...(missing.length > 0 ? { evidenceRequirements: { missing } } : {}),
    reasonCodes: ["moral_graph_reflection", "workstation_notes_adapter", "evidence_only_authority"],
    actions: recommendations.map((recommendation) => mapNoteRecommendation(reflection, recommendation)),
  });
}

export function reflectWorkstationNoteWithMoralGraph(
  graph: IdeologyGraph,
  note: WorkstationNoteMoralGraphInput,
): WorkstationNoteMoralGraphResult {
  const reflection = reflectIdeologyContext(graph, {
    kind: "note",
    text: note.content,
    refs: [note.id],
  });

  return {
    reflection,
    admissions: [buildNoteAdmission(reflection)],
  };
}
