import type {
  IdeologyContextReflectionActionGateWarningV1,
  IdeologyContextReflectionRecommendedActionV1,
  IdeologyNodeMatchV1,
} from "../ideology-context-reflection";
import type { IdeologyGraph } from "./ideology-graph-types";
import { findIdeologyActionGates, getNeighboringSafeguards } from "./traverse-ideology-graph";

export function buildIdeologyActionGateWarnings(
  graph: IdeologyGraph,
  matches: {
    exact: IdeologyNodeMatchV1[];
    likely: IdeologyNodeMatchV1[];
    inferred_lenses: IdeologyNodeMatchV1[];
  },
): IdeologyContextReflectionActionGateWarningV1[] {
  const activeIds = new Set([...matches.exact, ...matches.likely, ...matches.inferred_lenses].map((match) => match.nodeId));
  const actionGateIds = new Set(findIdeologyActionGates(graph).map((node) => node.id));
  const coveredTags = new Set((graph.actionGatePolicy?.covered_action_tags ?? []).map((tag) => tag.toLowerCase()));
  const warnings = new Map<string, IdeologyContextReflectionActionGateWarningV1>();

  for (const activeId of [...activeIds]) {
    for (const safeguard of getNeighboringSafeguards(graph, activeId)) {
      if (actionGateIds.has(safeguard.id)) activeIds.add(safeguard.id);
    }
  }

  for (const nodeId of activeIds) {
    const node = graph.nodeById.get(nodeId);
    if (!node || !actionGateIds.has(node.id)) continue;
    const tags = (node.tags ?? []).map((tag) => tag.toLowerCase());
    const isCoveredActionGate = tags.some((tag) => coveredTags.has(tag));
    warnings.set(node.id, {
      gateId: node.id,
      label: node.title,
      warning: isCoveredActionGate
        ? "Covered action lens requires legal and ethos checks before execution."
        : "Action gate lens requires a missing-check review before execution.",
      requiredCheck: isCoveredActionGate ? "legal_key_and_ethos_key" : "missing_check_review",
    });
  }

  return [...warnings.values()].sort((a, b) => a.gateId.localeCompare(b.gateId));
}

export function buildIdeologyRecommendedActions(params: {
  matches: {
    exact: IdeologyNodeMatchV1[];
    likely: IdeologyNodeMatchV1[];
    inferred_lenses: IdeologyNodeMatchV1[];
  };
  actionGateWarnings: IdeologyContextReflectionActionGateWarningV1[];
  missingEvidence: string[];
}): IdeologyContextReflectionRecommendedActionV1[] {
  const actions: IdeologyContextReflectionRecommendedActionV1[] = [];
  const hasMatches =
    params.matches.exact.length > 0 || params.matches.likely.length > 0 || params.matches.inferred_lenses.length > 0;

  if (hasMatches) {
    actions.push({
      id: "moral-graph.highlight_ideology_lens",
      type: "highlight_ideology_lens",
      label: "Highlight ideology lens",
      description: "Inspect matched ideology lenses, paths to root, and nearby safeguards.",
      reasonCodes: ["activated_lens"],
    });
    actions.push({
      id: "moral-graph.show_path_to_root",
      type: "show_path_to_root",
      label: "Show path to root",
      description: "Show how the activated lens connects back to the root ethos node.",
      reasonCodes: ["path_to_root"],
    });
  }

  if (params.actionGateWarnings.length > 0) {
    actions.push({
      id: "moral-graph.show_nearby_safeguard",
      type: "show_nearby_safeguard",
      label: "Show nearby safeguard",
      description: "Show legal, ethos, and jurisdiction safeguards before treating this as action-ready.",
      reasonCodes: ["action_gate_warning"],
    });
  }

  if (params.missingEvidence.length > 0) {
    actions.push({
      id: "moral-graph.ask_for_missing_evidence",
      type: "ask_for_missing_evidence",
      label: "Ask for missing evidence",
      description: "Add supporting context before increasing confidence.",
      reasonCodes: params.missingEvidence,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "moral-graph.suggest_review",
      type: "suggest_review",
      label: "Suggest review",
      description: "No deterministic ideology lens was activated.",
      reasonCodes: ["no_match"],
    });
  }

  return actions;
}
