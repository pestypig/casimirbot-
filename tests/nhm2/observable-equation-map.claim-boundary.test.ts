import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateNhm2ObservableEquationMap, type Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";

const MAP_PATH = path.join("docs", "research", "nhm2-observable-equation-map.v1.json");

function loadMap(): Nhm2ObservableEquationMap {
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8")) as Nhm2ObservableEquationMap;
}

describe("NHM2 observable equation map claim boundary", () => {
  it("keeps all map and node claim locks closed", () => {
    const map = loadMap();
    expect(map.claimBoundary).toEqual({
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      literatureDoesValidateNHM2: false,
    });
    for (const node of map.nodes) {
      expect(node.claimBoundary).toEqual({
        doesValidateNHM2: false,
        maySupportContextOnly: true,
        promotionAllowed: false,
      });
    }
  });

  it("rejects forbidden promotion language", () => {
    const map = loadMap();
    const unsafe = {
      ...map,
      nodes: [
        {
          ...map.nodes[0],
          whyItMatters: "This would be validated propulsion.",
        },
        ...map.nodes.slice(1),
      ],
    };
    expect(validateNhm2ObservableEquationMap(unsafe).some((issue) => /forbidden promotion language/i.test(issue))).toBe(true);
  });
});
