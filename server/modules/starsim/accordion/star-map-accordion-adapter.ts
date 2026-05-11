import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  starSimAccordionStarNodeSchema,
  type StarSimAccordionStarNode,
} from "../../../../shared/starsim-accordion-galactic-null-model";

export const accordionStarMapImportSchema = z.object({
  schemaVersion: z.literal("starsim-accordion-star-map-import.v1"),
  nodes: z.array(starSimAccordionStarNodeSchema.omit({ qstAnnotation: true })),
});

export function loadAccordionStarMap(path: string): Omit<StarSimAccordionStarNode, "qstAnnotation">[] {
  const payload = accordionStarMapImportSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  return payload.nodes;
}

export function attachAccordionRenderHints(nodes: Omit<StarSimAccordionStarNode, "qstAnnotation">[]) {
  return nodes.map((node) => ({
    ...node,
    renderHints: {
      accordionLayer: "starsim_population_prior",
      caveat: "render_radius_is_not_physical_expansion_claim",
    },
  }));
}
