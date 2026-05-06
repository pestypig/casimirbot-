import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { observableTextNeedsLiterature, type Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";

const MAP_PATH = path.join("docs", "research", "nhm2-observable-equation-map.v1.json");
const CITATION_PATH = path.join("docs", "research", "nhm2-observable-equation-citation-boundary.v1.json");

function loadMap(): Nhm2ObservableEquationMap {
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) as Nhm2ObservableEquationMap;
}

function loadCitations(): any {
  return JSON.parse(fs.readFileSync(CITATION_PATH, "utf8"));
}

describe("NHM2 observable equation map citations", () => {
  it("defines required citation IDs as context or constraint only", () => {
    const citations = loadCitations();
    const ids = new Set(citations.requiredRefs.map((ref: any) => ref.id));
    for (const id of [
      "gourgoulhon_2007_3p1_formalism",
      "munzner_2009_nested_model",
      "cleveland_mcgill_1984_graphical_perception",
      "crameri_2020_colour",
      "alcubierre_1994_warp_metric",
      "natario_2002_zero_expansion",
      "pfenning_ford_1997_warp_qi",
      "fewster_2005_qei_review",
      "lamoreaux_1997_casimir_force",
      "klimchitskaya_2009_real_materials_casimir",
      "bobrick_martire_2021_physical_warp_drives",
      "santiago_schuster_visser_2022_nec",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
    for (const ref of citations.requiredRefs) {
      expect(ref.doesValidateNHM2).toBe(false);
      expect(JSON.stringify(ref.allowedUse)).not.toMatch(/validates NHM2|proves propulsion|physics validation/i);
    }
  });

  it("requires literature refs for nodes using external physics terms", () => {
    const map = loadMap();
    for (const node of map.nodes) {
      const text = `${node.symbol} ${node.displayEquation ?? ""} ${node.equationLatex ?? ""} ${node.plainMeaning} ${node.whyItMatters}`;
      if (observableTextNeedsLiterature(text)) {
        expect(node.literatureRefs.length).toBeGreaterThan(0);
      }
    }
  });

  it("maps every node literature ref to the citation-boundary file", () => {
    const map = loadMap();
    const citations = loadCitations();
    const ids = new Set(citations.requiredRefs.map((ref: any) => ref.id));
    for (const node of map.nodes) {
      for (const ref of node.literatureRefs) {
        expect(ids.has(ref)).toBe(true);
      }
    }
  });
});
