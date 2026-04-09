import { describe, expect, it } from "vitest";
import { canonicalizeStarSimRequest } from "../server/modules/starsim/canonicalize";
import { evaluateStarSimSupportedDomain } from "../server/modules/starsim/domain";

describe("star-sim supported domain", () => {
  it("passes the solar-like main-sequence structure domain for supported observable sets", () => {
    const star = canonicalizeStarSimRequest({
      target: {
        object_id: "alpha-centauri-a",
        name: "Alpha Centauri A",
        spectral_type: "G2",
        luminosity_class: "V",
      },
      spectroscopy: {
        teff_K: 5790,
        logg_cgs: 4.31,
        metallicity_feh: 0.22,
      },
      structure: {
        radius_Rsun: 1.22,
      },
      requested_lanes: ["structure_mesa"],
    });

    const domain = evaluateStarSimSupportedDomain(star, "structure_mesa");
    expect(domain.passed).toBe(true);
    expect(domain.fit_profile_id).toBe("solar_like_observable_fit_v1");
    expect(domain.benchmark_pack_id).toBe("solar_like_structure_fit_pack_v1");
  });

  it("requires seismology for the oscillation domain", () => {
    const star = canonicalizeStarSimRequest({
      target: {
        object_id: "alpha-centauri-a",
        name: "Alpha Centauri A",
        spectral_type: "G2",
        luminosity_class: "V",
      },
      spectroscopy: {
        teff_K: 5790,
        logg_cgs: 4.31,
        metallicity_feh: 0.22,
      },
      structure: {
        radius_Rsun: 1.22,
      },
      requested_lanes: ["oscillation_gyre"],
    });

    const domain = evaluateStarSimSupportedDomain(star, "oscillation_gyre");
    expect(domain.passed).toBe(false);
    expect(domain.reasons).toContain("seismology_required");
  });
});
