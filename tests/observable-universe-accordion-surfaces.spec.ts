import { describe, expect, it } from "vitest";
import {
  OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES,
  OBSERVABLE_UNIVERSE_ACCORDION_DAG_NODES,
  OBSERVABLE_UNIVERSE_CATALOG_SURFACE,
  OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE,
  OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE,
} from "../shared/observable-universe-accordion-surfaces";

describe("observable universe accordion surfaces", () => {
  it("keeps the physical containment tree limited to Sol, Milky Way, and Local Group", () => {
    expect(OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE.id).toBe("sol");
    expect(OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE.children.map((entry) => entry.id)).toEqual([
      "milky-way",
    ]);
    expect(
      OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE.children[0]?.children.map((entry) => entry.id),
    ).toEqual(["local-group"]);
    expect(
      OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE.children[0]?.children[0]?.children ?? [],
    ).toHaveLength(0);
  });

  it("stores catalog and flow atlas as separate evidence-bearing surfaces with explicit chart metadata", () => {
    expect(OBSERVABLE_UNIVERSE_CATALOG_SURFACE.surfaceId).toBe(
      "observable_universe_catalog_surface/v1",
    );
    expect(OBSERVABLE_UNIVERSE_CATALOG_SURFACE.chart.frame).toBe("heliocentric-icrs");
    expect(OBSERVABLE_UNIVERSE_CATALOG_SURFACE.entries.length).toBeGreaterThan(0);
    expect(OBSERVABLE_UNIVERSE_CATALOG_SURFACE.inputs.length).toBeGreaterThan(0);
    expect(OBSERVABLE_UNIVERSE_CATALOG_SURFACE.outputs.length).toBeGreaterThan(0);

    expect(OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.surfaceId).toBe(
      "observable_universe_flow_atlas_surface/v1",
    );
    expect(OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.chart.frame).toBe("heliocentric-icrs");
    expect(OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.nodes.length).toBeGreaterThan(0);
    expect(OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.dependencies).toContain(
      "observable_universe_catalog_surface/v1",
    );
  });

  it("keeps the flow atlas and accordion panel in DAG-only nodes rather than physical children", () => {
    const nodeIds = OBSERVABLE_UNIVERSE_ACCORDION_DAG_NODES.map((entry) => entry.id);
    expect(nodeIds).toContain("local-flow-atlas");
    expect(nodeIds).toContain("observable-universe-accordion-panel");

    const containmentIds = JSON.stringify(OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE);
    expect(containmentIds).not.toContain("local-flow-atlas");
    expect(containmentIds).not.toContain("observable-universe-accordion-panel");
  });

  it("declares the required chart and basin relations on the DAG", () => {
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "depends-on"),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "chart_transform"),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "belongs_to_boa"),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "flows_toward"),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "repelled_from"),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some(
        (entry) => entry.rel === "context_only_outer_shell",
      ),
    ).toBe(true);
    expect(
      OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES.some((entry) => entry.rel === "see-also"),
    ).toBe(true);
  });
});
