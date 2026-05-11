import { describe, expect, it } from "vitest";
import {
  allErEprSolverClaimIds,
  citationsForErEprSolverClaims,
  sourceRolesForErEprSolverClaims,
  uncertaintyNotesForErEprSolverClaims,
} from "../shared/er-epr-solver-claims";

describe("ER=EPR solver claims", () => {
  it("has source metadata for every solver claim", () => {
    const claimIds = allErEprSolverClaimIds();
    expect(claimIds.length).toBeGreaterThanOrEqual(8);
    expect(citationsForErEprSolverClaims(claimIds).length).toBeGreaterThan(0);
    const roles = sourceRolesForErEprSolverClaims(claimIds);
    for (const claimId of claimIds) {
      expect(roles[claimId]).toBeTruthy();
    }
    expect(uncertaintyNotesForErEprSolverClaims(claimIds)).toHaveLength(claimIds.length);
  });
});
