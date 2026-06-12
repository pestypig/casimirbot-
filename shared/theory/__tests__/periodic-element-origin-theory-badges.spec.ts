import { describe, expect, it } from "vitest";

import { validateTheoryBadgeGraphV1, type TheoryBadgeEdgeV1, type TheoryBadgeV1 } from "../../contracts/theory-badge-graph.v1";
import { ELEMENT_ORIGIN_REGISTRY } from "../../periodic-table";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  NUCLEOSYNTHESIS_ORIGIN_BADGE_BY_FAMILY,
  NUCLEOSYNTHESIS_ORIGIN_THEORY_BADGES,
} from "../nucleosynthesis-origin-theory-badges";
import {
  MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES,
  PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES,
  PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES,
} from "../periodic-element-origin-theory-badges";

const elementBadgeId = (symbol: string) => `element.${symbol.toLowerCase()}.origin`;

describe("periodic element origin theory badges", () => {
  it("generates one diagnostic element-origin badge for every periodic-table element", () => {
    expect(PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES).toHaveLength(118);

    const badgesById = new Map(PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES.map((badge) => [badge.id, badge]));
    for (const entry of ELEMENT_ORIGIN_REGISTRY) {
      const badge = badgesById.get(elementBadgeId(entry.symbol));

      expect(badge).toBeTruthy();
      expect(badge?.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge?.claimBoundary.validationClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(badge?.claimBoundary.promotionAllowed).toBe(false);
      expect(badge?.tags).toContain("atomic_line_observable");
      expect(badge?.assumptions.join(" ")).toContain("origin summary");
      expect(badge?.units).toEqual(expect.arrayContaining([expect.objectContaining({ symbol: `Z_${entry.symbol}` })]));
    }
  });

  it("covers every registry origin family with a cited anchor badge", () => {
    const originFamilies = new Set(ELEMENT_ORIGIN_REGISTRY.flatMap((entry) => entry.originFamilies));
    const anchorIds = new Set(NUCLEOSYNTHESIS_ORIGIN_THEORY_BADGES.map((badge) => badge.id));

    for (const family of originFamilies) {
      const anchorId = NUCLEOSYNTHESIS_ORIGIN_BADGE_BY_FAMILY[family];
      const anchor = NUCLEOSYNTHESIS_ORIGIN_THEORY_BADGES.find((badge) => badge.id === anchorId);

      expect(anchorIds).toContain(anchorId);
      expect(anchor?.sourceRefs.some((ref) => ref.kind === "literature_ref")).toBe(true);
      expect(anchor?.claimBoundary.diagnosticOnly).toBe(true);
      expect(anchor?.claimBoundary.validationClaimAllowed).toBe(false);
      expect(anchor?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
      expect(anchor?.claimBoundary.promotionAllowed).toBe(false);
    }
  });

  it("connects every element to origin anchors and observable routes", () => {
    const incomingOriginEdges = PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.filter((edge) =>
      edge.to.startsWith("element.") && edge.relation === "derives",
    );
    const observableEdges = PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.filter((edge) =>
      edge.from.startsWith("element.") && edge.to === "stellar.spectroscopy.atomic_line_identification_context",
    );

    for (const entry of ELEMENT_ORIGIN_REGISTRY) {
      const badgeId = elementBadgeId(entry.symbol);
      expect(incomingOriginEdges.some((edge) => edge.to === badgeId)).toBe(true);
      expect(observableEdges.some((edge) => edge.from === badgeId)).toBe(true);
    }
  });

  it("documents prebiotic context without deriving life-adjacent claims", () => {
    const cnoPsEdges = PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.filter((edge) =>
      ["element.c.origin", "element.n.origin", "element.o.origin", "element.p.origin", "element.s.origin"].includes(edge.from),
    );

    expect(cnoPsEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "element.c.origin",
          to: "prebiotic.inventory.meteoritic_organics_context",
          relation: "documents",
        }),
        expect.objectContaining({
          from: "element.o.origin",
          to: "prebiotic.inventory.meteoritic_organics_context",
          relation: "documents",
        }),
      ]),
    );
    expect(
      PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.filter(
        (edge) =>
          edge.from.startsWith("element.") &&
          edge.relation === "derives" &&
          /\b(life|consciousness|objective|orch_or|prebiotic)\b/i.test(edge.to),
      ),
    ).toEqual([]);
  });

  it("adds bounded molecular cloud and water context", () => {
    const molecularBadgeIds = new Set(MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES.map((badge) => badge.id));
    const incomingWaterEdges = PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.filter(
      (edge) => edge.to === "astrochemistry.water.h_o_binding_context",
    );

    expect(molecularBadgeIds).toEqual(
      new Set([
        "astrochemistry.molecular_cloud.elemental_inheritance_context",
        "astrochemistry.dust_grain.surface_reaction_context",
        "astrochemistry.water.h_o_binding_context",
      ]),
    );
    expect(incomingWaterEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "element.h.origin", relation: "requires" }),
        expect.objectContaining({ from: "element.o.origin", relation: "requires" }),
        expect.objectContaining({ from: "astrochemistry.molecular_cloud.elemental_inheritance_context", relation: "requires" }),
        expect.objectContaining({ from: "astrochemistry.dust_grain.surface_reaction_context", relation: "documents" }),
      ]),
    );
    for (const badge of MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES) {
      expect(badge.claimBoundary.diagnosticOnly).toBe(true);
      expect(badge.assumptions.join(" ")).not.toMatch(/guarantees water|guaranteed when hydrogen and oxygen/i);
    }
  });

  it("integrates into the full Helix theory graph", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const issues = validateTheoryBadgeGraphV1(graph);
    const graphBadgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
    const graphEdgeIds = new Set(graph.edges.map((edge: TheoryBadgeEdgeV1) => edge.id));

    expect(issues).toEqual([]);
    expect(graph.badges.filter((badge) => badge.id.startsWith("element.") && badge.id.endsWith(".origin"))).toHaveLength(118);
    expect(graphBadgeIds).toContain("nucleosynthesis.helium_burning.triple_alpha_carbon");
    expect(graphBadgeIds).toContain("element.c.origin");
    expect(graphBadgeIds).toContain("element.o.origin");
    expect(graphBadgeIds).toContain("element.au.origin");
    expect(graphBadgeIds).toContain("astrochemistry.water.h_o_binding_context");
    expect(graphEdgeIds).toContain("helium_burning_triple_alpha_derives_element_c");
    expect(graphEdgeIds).toContain("alpha_capture_derives_element_o");
    expect(graphEdgeIds).toContain("r_process_derives_element_au");
    expect(graphEdgeIds).toContain("element_o_requires_water_binding_context");
  });

  it("does not emit forbidden element-origin overclaims", () => {
    const serialized = JSON.stringify({
      anchors: NUCLEOSYNTHESIS_ORIGIN_THEORY_BADGES,
      elements: PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES,
      molecular: MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES,
      edges: PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES,
    });

    expect(serialized).not.toMatch(/oxygen is produced from hydrogen during fusion/i);
    expect(serialized).not.toMatch(/water is guaranteed when hydrogen and oxygen exist/i);
    expect(serialized).not.toMatch(/stellar carbon creates life/i);
    expect(serialized).not.toMatch(/periodic table proves consciousness/i);
    expect(serialized).not.toMatch(/superheavy elements are naturally abundant/i);
  });
});
