import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { allErEprTinySykClaimIds } from "../shared/er-epr-tiny-syk-claims";

describe("tiny SYK claims", () => {
  it("has a registry entry for every code claim ID", () => {
    const registry = JSON.parse(readFileSync("docs/knowledge/math-claims/er-epr-tiny-syk.claims.json", "utf8"));
    const ids = new Set(registry.claims.map((claim: { claimId: string }) => claim.claimId));
    for (const claimId of allErEprTinySykClaimIds()) {
      expect(ids.has(claimId)).toBe(true);
    }
  });
});
