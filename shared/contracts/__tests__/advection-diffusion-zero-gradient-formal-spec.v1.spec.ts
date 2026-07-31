import { describe, expect, it } from "vitest";

import {
  validateCasimirSpecScientificClaimIrIntegrityV1,
  validateCasimirSpecScientificClaimIrV1,
} from "../casimir-spec-scientific-claim-ir.v1";
import {
  ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
  buildAdvectionDiffusionZeroGradientFormalSpecV1,
} from "../../scientific-evidence/advection-diffusion-zero-gradient-formal-spec";

describe("advection-diffusion zero-gradient formal semantic contract", () => {
  it("builds an exact hash-bound subclaim without self-promoting proof", async () => {
    const spec = await buildAdvectionDiffusionZeroGradientFormalSpecV1(
      "2026-07-30T12:00:00.000Z",
    );
    expect(validateCasimirSpecScientificClaimIrV1(spec)).toEqual([]);
    expect(
      await validateCasimirSpecScientificClaimIrIntegrityV1(spec),
    ).toEqual([]);
    expect(spec.claims[0].claimId).toBe(
      ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
    );
    expect(spec.claims[0].axes.logical.resolution).toBe("unassessed");
    expect(spec.claimBoundary.proofAuthority).toBe(false);
    expect(spec.claimBoundary.terminalEligible).toBe(false);
  });
});
