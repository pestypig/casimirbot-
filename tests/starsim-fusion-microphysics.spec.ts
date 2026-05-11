import { describe, expect, it } from "vitest";
import {
  buildStarMapFusionGraph,
  evaluateStarSimFusionMicrophysics,
  type StarSimFusionMicrophysicsInput,
} from "../shared/starsim-fusion-microphysics";

function baseInput(
  overrides: Partial<StarSimFusionMicrophysicsInput> = {},
): StarSimFusionMicrophysicsInput {
  return {
    objectId: "star-1",
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

describe("StarSim fusion microphysics Stage 1", () => {
  it("classifies G/K/M main-sequence stars as pp_chain by default", () => {
    for (const spectralType of ["G2V", "K5V", "M3V"]) {
      const evaluation = evaluateStarSimFusionMicrophysics(
        baseInput({ objectId: spectralType, observables: { spectralType, mass_Msun: 0.8 } }),
      );
      expect(evaluation.inferred.dominantFusionChannel).toBe("pp_chain");
      expect(evaluation.inferred.fusionActive).toBe(true);
      expect(evaluation.quantumMicrophysics.tunnelingRequired).toBe(true);
    }
  });

  it("allows higher-mass hot main-sequence stars to use the cno_cycle", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectId: "hot-star",
        observables: {
          spectralType: "A0V",
          mass_Msun: 2.1,
          radius_Rsun: 1.8,
          effectiveTemperature_K: 9500,
        },
      }),
    );
    expect(evaluation.inferred.dominantFusionChannel).toBe("cno_cycle");
    expect(evaluation.fusionZone.mode).toBe("distributed_convective_core");
  });

  it("returns shell_fusion for a red giant instead of normal core_fusion", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectId: "red-giant",
        objectClass: "red_giant",
        observables: {
          spectralType: "K1III",
          mass_Msun: 1.1,
          radius_Rsun: 12,
          luminosity_Lsun: 65,
        },
      }),
    );
    expect(evaluation.fusionZone.mode).toBe("shell_fusion");
    expect(evaluation.qstPrior.caveats.join(" ")).toContain("shell_fusion");
  });

  it("marks brown dwarfs and insufficient-mass objects as inactive fusion cases", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectId: "brown-dwarf",
        objectClass: "brown_dwarf",
        observables: {
          spectralType: "L3",
          mass_Msun: 0.05,
          radius_Rsun: 0.1,
        },
      }),
    );
    expect(evaluation.inferred.dominantFusionChannel).toBe("none");
    expect(evaluation.inferred.fusionActive).toBe(false);
    expect(evaluation.quantumMicrophysics.tunnelingRequired).toBe(false);
  });

  it("keeps neutron stars out of PP-chain fusion and exposes compact quantum-fluid context", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectId: "pulsar",
        objectClass: "neutron_star",
        modelMode: "compact_object_glitch_proxy",
        observables: {
          mass_Msun: 1.4,
          radius_Rsun: 0.00002,
        },
      }),
    );
    expect(evaluation.inferred.dominantFusionChannel).toBe("compact_object_not_fusing");
    expect(evaluation.inferred.fusionActive).toBe(false);
    expect(evaluation.quantumMicrophysics.role).toBe(
      "degenerate_compact_object_quantum_fluid",
    );
    expect(evaluation.evidence.claimIds).toContain(
      "neutron_star_glitch_compact_quantum_fluid_proxy.v1",
    );
    expect(evaluation.evidence.claimIds).not.toContain(
      "pp_chain_fusion_rate_microphysics.v1",
    );
  });

  it("treats hSpectralFit as calibration only", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        hSpectralFit: {
          mode: "blackbody_only",
          fittedH_Js: 6.6260701e-34,
        },
      }),
    );
    expect(evaluation.hSpectralFit?.status).toBe("calibration_only");
    expect(evaluation.hSpectralFit?.caveats.join(" ")).toContain("exact");
    expect(evaluation.evidence.claimIds).toContain(
      "stellar_spectral_h_fit_calibration_only.v1",
    );
  });

  it("blocks blackbody-only h fitting for molecular-band dominated cool spectra", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        objectId: "cool-dwarf",
        objectClass: "red_dwarf",
        observables: {
          spectralType: "M7V",
          mass_Msun: 0.09,
          radius_Rsun: 0.12,
        },
        hSpectralFit: {
          mode: "blackbody_only",
          fittedH_Js: 6.6e-34,
        },
      }),
    );
    expect(evaluation.hSpectralFit?.status).toBe("blocked_molecular_blackbody_only");
    expect(evaluation.evidence.claimIds).toContain(
      "stellar_atmosphere_molecular_opacity_guardrail.v1",
    );
  });

  it("returns a StarMap fusion graph as an astrometric structure prior only", () => {
    const graph = buildStarMapFusionGraph([
      {
        objectId: "a",
        position_pc: [0, 0, 0],
        velocity_km_s: [0, 0, 0],
        dominantFusionChannel: "pp_chain",
        quantumProcessIndex: 0.65,
      },
      {
        objectId: "b",
        position_pc: [3, 4, 0],
        velocity_km_s: [0, 3, 4],
        dominantFusionChannel: "cno_cycle",
        quantumProcessIndex: 0.8,
      },
    ]);
    expect(graph.qstRole).toBe("astrophysical_population_prior");
    expect(graph.caveat).toBe("star_map_structure_is_not_direct_er_epr_evidence");
    expect(graph.edges[0].distance_pc).toBe(5);
  });

  it("forces requested spacetimeCL promotion back to proxy_only", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        qstUse: {
          role: "stellar_quantum_microphysics_prior",
          spacetimeCL: "CL4",
          quantumCL: "QCL1_entropy_stretch_proxy",
          mayPromoteToCL4: false,
        },
      }),
    );
    expect(evaluation.qstPrior.spacetimeCL).toBe("proxy_only");
    expect(evaluation.qstPrior.mayPromoteToCL4).toBe(false);
    expect(evaluation.qstPrior.blockedClaims).toContain("requested_spacetimeCL_CL4");
  });

  it("blocks direct StarSim ER=EPR evidence claims", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(
      baseInput({
        qstUse: {
          role: "direct_er_epr_evidence",
          spacetimeCL: "proxy_only",
          quantumCL: "QCL1_entropy_stretch_proxy",
          mayPromoteToCL4: false,
        },
      }),
    );
    expect(evaluation.qstPrior.role).toBe("not_direct_er_epr_evidence");
    expect(evaluation.qstPrior.blockedClaims).toContain("direct_er_epr_evidence");
  });

  it("emits claim IDs and citations for every verdict", () => {
    const evaluation = evaluateStarSimFusionMicrophysics(baseInput());
    expect(evaluation.evidence.claimIds.length).toBeGreaterThan(0);
    expect(evaluation.evidence.citations.length).toBeGreaterThan(0);
  });
});
