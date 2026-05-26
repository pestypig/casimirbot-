import { describe, expect, it } from "vitest";
import {
  buildStarSimRuntimeReceiptV1,
  isStarSimRuntimeReceiptV1,
  validateStarSimRuntimeReceiptV1,
} from "../starsim-runtime-receipt.v1";

describe("starsim_runtime_receipt/v1", () => {
  it("validates a compact StarSim runtime receipt", () => {
    const receipt = buildStarSimRuntimeReceiptV1({
      badgeId: "starsim.runtime.evaluate_fusion_microphysics",
      action: "evaluate_fusion_microphysics",
      inputSummary: {
        objectId: "sun-like",
        objectClass: "main_sequence",
        spectralType: "G2V",
        modelMode: "surface_observable_proxy",
        mass_Msun: 1,
        radius_Rsun: 1,
        luminosity_Lsun: 1,
        effectiveTemperature_K: null,
        metallicity_feh: null,
        logg_cgs: null,
        parallax_mas: null,
        radialVelocity_kms: null,
      },
      outputSummary: {
        dominantFusionChannel: "pp_chain",
        secondaryFusionChannels: [],
        fusionActive: true,
        effectiveTemperature_K: 5772,
        estimatedCoreTemperature_K: 15000000,
        estimatedCoreDensity_g_cm3: 150,
        fusionZoneMode: "core_fusion",
        r10_Rstar: 0.05,
        r50_Rstar: 0.12,
        r90_Rstar: 0.25,
        activeVolumeFraction: 0.015625,
        tunnelingRequired: true,
        quantumMicrophysicsRole: "microphysical_rate_law",
        quantumProcessIndex: 0.65,
        qstRole: "stellar_quantum_microphysics_prior",
        spacetimeCL: "proxy_only",
        mayPromoteToCL4: false,
        blockedClaims: [],
        claimIds: ["claim"],
        citations: ["source"],
      },
      claimBoundaryNotes: ["proxy_only"],
      caveats: ["Stage 1 prior only."],
      sourceRefs: [{ kind: "repo_module", path: "shared/starsim-fusion-microphysics.ts" }],
    });

    expect(validateStarSimRuntimeReceiptV1(receipt)).toEqual([]);
    expect(isStarSimRuntimeReceiptV1(receipt)).toBe(true);
    expect(receipt.outputSummary.mayPromoteToCL4).toBe(false);
  });
});
