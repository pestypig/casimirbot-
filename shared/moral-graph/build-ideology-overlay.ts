import type { IdeologyContextReflectionOverlayV1, IdeologyNodeMatchV1 } from "../ideology-context-reflection";

export function buildIdeologyOverlay(matches: {
  exact: IdeologyNodeMatchV1[];
  likely: IdeologyNodeMatchV1[];
  inferred_lenses: IdeologyNodeMatchV1[];
}): IdeologyContextReflectionOverlayV1 {
  const highlightedNodeIds = Array.from(
    new Set([...matches.exact, ...matches.likely, ...matches.inferred_lenses].map((match) => match.nodeId)),
  );
  const primary = matches.exact[0] ?? matches.likely[0] ?? matches.inferred_lenses[0];

  return {
    title: "MoralGraph reflection",
    summary: primary
      ? `Activated lens: ${primary.label}.`
      : "No deterministic ideology lens matched the supplied context.",
    highlightedNodeIds,
  };
}
