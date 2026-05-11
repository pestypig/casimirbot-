import { describe, expect, it } from "vitest";
import {
  allStarSimGalacticDynamicsClaimIds,
  citationsForStarSimGalacticDynamicsClaims,
  sourceRolesForStarSimGalacticDynamicsClaims,
  uncertaintyNotesForStarSimGalacticDynamicsClaims,
} from "../shared/starsim-galactic-dynamics-claims";

describe("StarSim galactic dynamics claims", () => {
  it("provides citations, source roles, and uncertainty notes for every claim", () => {
    const claimIds = allStarSimGalacticDynamicsClaimIds();
    expect(claimIds.length).toBeGreaterThanOrEqual(10);
    expect(citationsForStarSimGalacticDynamicsClaims(claimIds).length).toBeGreaterThan(0);
    const roles = sourceRolesForStarSimGalacticDynamicsClaims(claimIds);
    for (const claimId of claimIds) {
      expect(roles[claimId]).toBeTruthy();
    }
    expect(uncertaintyNotesForStarSimGalacticDynamicsClaims(claimIds)).toHaveLength(claimIds.length);
  });
});
