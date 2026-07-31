import { describe, expect, it } from "vitest";

import { validateCasimirSpecScientificClaimIrV1 } from "../casimir-spec-scientific-claim-ir.v1";
import {
  ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID,
  buildAdvectionDiffusionNumericalSpecV1,
} from "../../scientific-evidence/advection-diffusion-numerical-spec";

describe("advection-diffusion numerical Casimir Spec", () => {
  it("seals the bounded case without granting execution authority", async () => {
    const spec = await buildAdvectionDiffusionNumericalSpecV1();
    expect(await validateCasimirSpecScientificClaimIrV1(spec)).toEqual([]);
    expect(spec.claims.map((claim) => claim.claimId)).toContain(
      ADVECTION_DIFFUSION_NUMERICAL_CLAIM_ID,
    );
    expect(spec.claimBoundary.executesTools).toBe(false);
    expect(spec.claimBoundary.terminalEligible).toBe(false);
  });
});
