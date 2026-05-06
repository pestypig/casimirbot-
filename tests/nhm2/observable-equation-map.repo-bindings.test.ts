import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";

const MAP_PATH = path.join("docs", "research", "nhm2-observable-equation-map.v1.json");
const MISSING_ALLOWED = new Set(["missing_counterpart", "review", "blocked"]);

function loadMap(): Nhm2ObservableEquationMap {
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) as Nhm2ObservableEquationMap;
}

describe("NHM2 observable equation map repo bindings", () => {
  it("gives every node a repo field or artifact binding with units", () => {
    const map = loadMap();
    for (const node of map.nodes) {
      expect(node.repoBindings.length).toBeGreaterThan(0);
      for (const binding of node.repoBindings) {
        expect(binding.artifactPath || binding.fieldName || binding.channel || binding.component).toBeTruthy();
        expect(binding.units).toBeTruthy();
      }
    }
  });

  it("requires artifact presence for computed nodes and allows missing only for gated statuses", () => {
    const map = loadMap();
    for (const node of map.nodes) {
      for (const binding of node.repoBindings) {
        if (!binding.artifactPath) continue;
        const exists = fs.existsSync(binding.artifactPath);
        if (!exists) {
          expect(MISSING_ALLOWED.has(node.status)).toBe(true);
        }
        if (node.status === "computed") {
          expect(exists).toBe(true);
        }
      }
    }
  });
});
