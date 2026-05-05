import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { evaluateLiteratureClaimMap } from "../tools/nhm2/validate-reference-run";

describe("nhm2 literature claim map", () => {
  it("bounds every external support claim with non-support entries", () => {
    const map = JSON.parse(
      readFileSync("docs/research/nhm2-literature-claim-map.v1.json", "utf8"),
    ) as {
      sources: Array<{ sourceId: string; claimSupport: string[]; nonSupport: string[] }>;
    };

    for (const source of map.sources) {
      if (source.claimSupport.length > 0) {
        expect(source.nonSupport.length, source.sourceId).toBeGreaterThan(0);
      }
    }
    expect(evaluateLiteratureClaimMap(map).state).toBe("pass");
  });
});
