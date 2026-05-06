import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { captionNeedsScientificLiterature } from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";
import { loadScientificAtlasManifest, resolveRepoPath } from "./scientific-figure-atlas.test-utils.js";

const REQUIRED_IDS = [
  "alcubierre_1994_warp_metric",
  "natario_2002_zero_expansion",
  "pfenning_ford_1997_quantum_inequality_warp",
  "fewster_2005_energy_inequalities",
  "lamoreaux_1997_casimir_measurement",
  "klimchitskaya_2009_real_materials_casimir",
  "bobrick_martire_2021_physical_warp_drives",
  "santiago_schuster_visser_2022_nec",
];

describe("NHM2 scientific figure atlas citations", () => {
  it("keeps required literature IDs context-only", () => {
    const boundary = JSON.parse(fs.readFileSync("docs/research/nhm2-scientific-figure-citation-boundary.v1.json", "utf8"));
    const ids = new Set(boundary.requiredRefs.map((ref: any) => ref.id));
    for (const id of REQUIRED_IDS) expect(ids.has(id)).toBe(true);
    for (const ref of boundary.requiredRefs) {
      expect(ref.doesValidateNHM2).toBe(false);
      expect(JSON.stringify(ref.allowedUse)).not.toMatch(/validates NHM2|proves NHM2|confirms propulsion|demonstrates physical mechanism/i);
    }
  });

  it("requires literature refs for physics-boundary captions", () => {
    const manifest = loadScientificAtlasManifest();
    const boundary = JSON.parse(fs.readFileSync(resolveRepoPath("docs/research/nhm2-scientific-figure-citation-boundary.v1.json"), "utf8"));
    const ids = new Set(boundary.requiredRefs.map((ref: any) => ref.id));
    for (const figure of manifest.figures) {
      if (captionNeedsScientificLiterature(figure.caption)) expect(figure.literatureRefs.length).toBeGreaterThan(0);
      for (const ref of figure.literatureRefs) expect(ids.has(ref)).toBe(true);
    }
  });

  it("does not use external literature as validation evidence", () => {
    const manifest = loadScientificAtlasManifest();
    for (const figure of manifest.figures) {
      expect(figure.caption).not.toMatch(/validates NHM2|proves NHM2|confirms propulsion|demonstrates physical mechanism/i);
    }
  });
});
