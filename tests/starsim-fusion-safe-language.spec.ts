import { describe, expect, it } from "vitest";

import {
  STARSIM_FUSION_FORBIDDEN_LANGUAGE,
  renderStarSimFusionClaim,
  validateStarSimFusionSafeLanguage,
} from "../shared/starsim-fusion-safe-language";
import {
  buildStarMapFusionGraph,
  evaluateStarSimFusionMicrophysics,
  type StarSimFusionMicrophysicsInput,
} from "../shared/starsim-fusion-microphysics";

function baseInput(
  overrides: Partial<StarSimFusionMicrophysicsInput> = {},
): StarSimFusionMicrophysicsInput {
  return {
    objectId: "safe-star",
    objectClass: "main_sequence",
    observables: {
      spectralType: "G2V",
      luminosity_Lsun: 1,
      radius_Rsun: 1,
      mass_Msun: 1,
    },
    modelMode: "polytrope_hydrostatic_proxy",
    qstUse: {
      role: "stellar_quantum_microphysics_prior",
      spacetimeCL: "proxy_only",
      quantumCL: "QCL1_entropy_stretch_proxy",
      mayPromoteToCL4: false,
    },
    ...overrides,
  };
}

describe("StarSim fusion safe language", () => {
  it("rejects forbidden predictive overclaim phrases", () => {
    for (const phrase of STARSIM_FUSION_FORBIDDEN_LANGUAGE) {
      expect(validateStarSimFusionSafeLanguage(`This says ${phrase}.`).ok).toBe(false);
    }
    expect(validateStarSimFusionSafeLanguage("This is not direct ER=EPR evidence.").ok).toBe(
      true,
    );
  });

  it("renders claim IDs, citations, source roles, uncertainty notes, and caveats", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(baseInput());
    const text = renderStarSimFusionClaim(evaluation);

    expect(validateStarSimFusionSafeLanguage(text).ok).toBe(true);
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("Citations:");
    expect(text).toContain("Source roles:");
    expect(text).toContain("Uncertainty notes:");
    expect(text).toContain("Validity domains:");
    expect(text).toContain("Caveats:");
    expect(text).toContain("proxy_only");
    expect(text).toContain("mayPromoteToCL4=false");
  });

  it("renders hSpectralFit as calibration status and never as a derived constant", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        hSpectralFit: {
          mode: "blackbody_only",
          fittedH_Js: 6.6260701e-34,
        },
      }),
    );
    const text = renderStarSimFusionClaim(evaluation);

    expect(text).toContain("hSpectralFit status: calibration_only");
    expect(text.toLowerCase()).not.toContain("derived planck constant");
    expect(validateStarSimFusionSafeLanguage(text).ok).toBe(true);
  });

  it("renders StarMap graph language as astrometric population prior only", () => {
    const graph = buildStarMapFusionGraph([
      {
        objectId: "a",
        position_pc: [0, 0, 0],
        dominantFusionChannel: "pp_chain",
        quantumProcessIndex: 0.65,
      },
      {
        objectId: "b",
        position_pc: [1, 0, 0],
        dominantFusionChannel: "cno_cycle",
        quantumProcessIndex: 0.8,
      },
    ]);
    const text = renderStarSimFusionClaim(graph);

    expect(text).toContain("astrometric and population-structure prior only");
    expect(text).toContain("not direct ER=EPR evidence");
    expect(validateStarSimFusionSafeLanguage(text).ok).toBe(true);
  });

  it("renders neutron-star context as compact-object quantum-fluid proxy, not pp-chain fusion", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectClass: "neutron_star",
        modelMode: "compact_object_glitch_proxy",
        observables: { mass_Msun: 1.4, radius_Rsun: 0.00002 },
      }),
    );
    const text = renderStarSimFusionClaim(evaluation);

    expect(text).toContain("compact_object_not_fusing");
    expect(text).toContain("degenerate_compact_object_quantum_fluid");
    expect(text).not.toContain("pp_chain_fusion_rate_microphysics.v1");
  });

  it("renders direct ER=EPR and CL4 requests as blocked proxy-only claims", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        qstUse: {
          role: "direct_er_epr_evidence",
          spacetimeCL: "CL4",
          quantumCL: "QCL1_entropy_stretch_proxy",
          mayPromoteToCL4: false,
        },
      }),
    );
    const text = renderStarSimFusionClaim(evaluation);

    expect(text).toContain("Blocked claims: direct_er_epr_evidence, requested_spacetimeCL_CL4");
    expect(text).toContain("Proxy status: proxy_only; mayPromoteToCL4=false");
    expect(validateStarSimFusionSafeLanguage(text).ok).toBe(true);
  });
});
