import { describe, expect, it } from "vitest";
import {
  getSolarObservedBenchmarkPackById,
  getSolarBenchmarkRegistryVersion,
  listSolarObservedBenchmarkPacks,
} from "../server/modules/starsim/benchmarks";

describe("star-sim solar benchmark packs", () => {
  it("registers the solar interior closure benchmark pack with the required closure sections", () => {
    const pack = getSolarObservedBenchmarkPackById("solar_interior_closure_v1");
    expect(pack).not.toBeNull();
    expect(pack?.domain_id).toBe("solar_observed_baseline_v1");
    expect(pack?.required_sections).toEqual(
      expect.arrayContaining([
        "solar_interior_profile",
        "solar_layer_boundaries",
        "solar_global_modes",
        "solar_neutrino_constraints",
      ]),
    );
    expect(pack?.quality_checks).toEqual(
      expect.arrayContaining([
        "convection_zone_depth",
        "envelope_helium_fraction",
        "low_degree_mode_support",
        "neutrino_constraint_vector",
      ]),
    );
    expect(pack?.conceptual_lanes).toContain("helioseismology_solar_observed");
  });

  it("registers observed cycle and eruptive benchmark packs separately", () => {
    const packIds = listSolarObservedBenchmarkPacks().map((entry) => entry.id);
    const cyclePack = getSolarObservedBenchmarkPackById("solar_cycle_observed_v1");
    const eruptivePack = getSolarObservedBenchmarkPackById("solar_eruptive_catalog_v1");
    expect(packIds).toEqual(
      expect.arrayContaining([
        "solar_interior_closure_v1",
        "solar_cycle_observed_v1",
        "solar_eruptive_catalog_v1",
      ]),
    );
    expect(cyclePack?.quality_checks).toEqual(
      expect.arrayContaining([
        "cycle_indices",
        "magnetogram_context",
        "active_region_context",
        "irradiance_continuity",
      ]),
    );
    expect(eruptivePack?.quality_checks).toEqual(
      expect.arrayContaining([
        "flare_catalog",
        "cme_catalog",
        "irradiance_continuity",
        "source_region_linkage",
      ]),
    );
    expect(getSolarBenchmarkRegistryVersion()).toBe("starsim-solar-benchmarks/5");
  });
});
