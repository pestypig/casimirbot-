import { describe, expect, it } from "vitest";
import { canonicalizeStarSimRequest } from "../server/modules/starsim/canonicalize";
import {
  evaluateSolarObservedBaseline,
  evaluateStarSimSupportedDomain,
} from "../server/modules/starsim/domain";
import { STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION } from "../server/modules/starsim/contract";

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

  it("evaluates the solar observed baseline separately from the solar-like live domain", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            profile_ref: "artifact:solar/interior",
            summary: {
              convection_zone_base_rsun: 0.713,
              envelope_helium_fraction: 0.248,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "artifact:solar/modes",
            detail_ref: "artifact:solar/modes/detail",
            splitting_ref: "artifact:solar/modes/splitting",
            low_degree_mode_count: 48,
          },
          solar_neutrino_constraints: {
            constraints_ref: "artifact:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
            cno_flux: 7.0,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.id).toBe("solar_observed_baseline_v1");
    expect(support.passed).toBe(true);
    expect(support.benchmark_pack_id).toBe("solar_interior_closure_v1");
    expect(support.solar_reference_pack_id).toBe("solar_reference_pack");
    expect(support.conceptual_lanes).toContain("helioseismology_solar_observed");
    expect(support.closure_diagnostics?.overall_status).toBe("pass");
    expect(support.closure_diagnostics?.reference_pack_id).toBe("solar_reference_pack");
    expect(support.closure_diagnostics?.checks.convection_zone_depth.status).toBe("pass");
    expect(support.closure_diagnostics?.checks.convection_zone_depth.reference_anchor_id).toBe("solar.interior.convection_zone_depth.v1");
    expect(support.closure_diagnostics?.checks.convection_zone_depth.reference_doc_ids).toEqual(["basu_antia_2004"]);
    expect(support.closure_diagnostics?.checks.envelope_helium_fraction.status).toBe("pass");
    expect(support.closure_diagnostics?.checks.low_degree_mode_support.status).toBe("pass");
    expect(support.closure_diagnostics?.checks.neutrino_constraint_vector.status).toBe("pass");
  });

  it("reports solar baseline readiness gaps without changing stellar live-fit gating", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_cycle_indices: {
            sunspot_number: 85,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toEqual(
      expect.arrayContaining([
        "solar_interior_profile_missing",
        "solar_layer_boundaries_missing",
        "solar_global_modes_missing",
        "solar_neutrino_constraints_missing",
      ]),
    );
  });

  it("fails solar interior closure when the neutrino vector is incomplete", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            summary: {
              convection_zone_base_rsun: 0.713,
              envelope_helium_fraction: 0.248,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "artifact:solar/modes",
            detail_ref: "artifact:solar/modes/detail",
            low_degree_mode_count: 48,
          },
          solar_neutrino_constraints: {
            constraints_ref: "artifact:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toContain("solar_neutrino_vector_incomplete");
    expect(support.closure_diagnostics?.checks.neutrino_constraint_vector.status).toBe("fail");
    expect(support.closure_diagnostics?.checks.neutrino_constraint_vector.reference_anchor_id).toBe("solar.interior.neutrino_constraint_vector.v1");
  });

  it("warns when low-degree mode coverage is present but below the preferred closure target", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            summary: {
              convection_zone_base_rsun: 0.713,
              envelope_helium_fraction: 0.248,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "artifact:solar/modes",
            low_degree_mode_count: 30,
          },
          solar_neutrino_constraints: {
            constraints_ref: "artifact:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
            cno_flux: 7.0,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.passed).toBe(true);
    expect(support.closure_diagnostics?.overall_status).toBe("warn");
    expect(support.closure_diagnostics?.checks.low_degree_mode_support.status).toBe("warn");
  });

  it("fails when convection-zone depth falls outside the closure envelope", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            summary: {
              convection_zone_base_rsun: 0.73,
              envelope_helium_fraction: 0.248,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.73,
          },
          solar_global_modes: {
            mode_table_ref: "artifact:solar/modes",
            detail_ref: "artifact:solar/modes/detail",
            low_degree_mode_count: 48,
          },
          solar_neutrino_constraints: {
            constraints_ref: "artifact:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
            cno_flux: 7.0,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toContain("solar_convection_zone_depth_invalid");
    expect(support.closure_diagnostics?.checks.convection_zone_depth.status).toBe("fail");
  });

  it("warns when envelope helium is outside the preferred band but still near the solar baseline", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            summary: {
              convection_zone_base_rsun: 0.713,
              envelope_helium_fraction: 0.257,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "artifact:solar/modes",
            detail_ref: "artifact:solar/modes/detail",
            low_degree_mode_count: 48,
          },
          solar_neutrino_constraints: {
            constraints_ref: "artifact:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
            cno_flux: 7.0,
          },
        },
      },
      "solar_interior_closure_v1",
    );

    expect(support.passed).toBe(true);
    expect(support.closure_diagnostics?.overall_status).toBe("warn");
    expect(support.closure_diagnostics?.checks.envelope_helium_fraction.status).toBe("warn");
  });

  it("passes the solar cycle observed baseline when cycle, magnetogram, and active-region context are complete", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_cycle_indices: {
            sunspot_number: 82,
            f10_7_sfu: 155,
            cycle_label: "Cycle 25",
            polarity_label: "north_negative_south_positive",
          },
          solar_magnetogram: {
            line_of_sight_ref: "artifact:solar/magnetograms/los",
            synoptic_radial_map_ref: "artifact:solar/magnetograms/synoptic",
            active_region_patch_refs: ["artifact:solar/magnetograms/patch-1"],
          },
          solar_active_regions: {
            region_refs: ["artifact:solar/active-regions/noaa-13000"],
            region_count: 1,
          },
          solar_irradiance_series: {
            tsi_ref: "artifact:solar/irradiance/tsi",
          },
        },
      },
      "solar_cycle_observed_v1",
    );

    expect(support.passed).toBe(true);
    expect(support.cycle_diagnostics?.overall_status).toBe("pass");
    expect(support.cycle_diagnostics?.checks.cycle_indices.status).toBe("pass");
    expect(support.cycle_diagnostics?.checks.magnetogram_context.status).toBe("pass");
    expect(support.cycle_diagnostics?.checks.active_region_context.status).toBe("pass");
  });

  it("fails the solar cycle observed baseline when polarity or magnetogram linkage is incomplete", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_cycle_indices: {
            sunspot_number: 82,
            f10_7_sfu: 155,
            cycle_label: "Cycle 25",
          },
          solar_magnetogram: {
            line_of_sight_ref: "artifact:solar/magnetograms/los",
          },
          solar_active_regions: {
            region_refs: ["artifact:solar/active-regions/noaa-13000"],
            region_count: 1,
          },
        },
      },
      "solar_cycle_observed_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toEqual(
      expect.arrayContaining([
        "solar_cycle_indices_incomplete",
        "solar_cycle_magnetogram_incomplete",
      ]),
    );
    expect(support.cycle_diagnostics?.checks.cycle_indices.status).toBe("fail");
    expect(support.cycle_diagnostics?.checks.cycle_indices.reference_anchor_id).toBe("solar.cycle.cycle_indices.v1");
    expect(support.cycle_diagnostics?.checks.magnetogram_context.status).toBe("fail");
    expect(support.cycle_diagnostics?.checks.magnetogram_context.reference_anchor_id).toBe("solar.cycle.magnetogram_context.v1");
  });

  it("fails the solar cycle observed baseline when active-region evidence is empty", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_cycle_indices: {
            sunspot_number: 82,
            f10_7_sfu: 155,
            cycle_label: "Cycle 25",
            polarity_label: "north_negative_south_positive",
          },
          solar_magnetogram: {
            line_of_sight_ref: "artifact:solar/magnetograms/los",
            synoptic_radial_map_ref: "artifact:solar/magnetograms/synoptic",
          },
          solar_active_regions: {
            region_count: 0,
            region_refs: [],
          },
        },
      },
      "solar_cycle_observed_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toContain("solar_active_regions_incomplete");
    expect(support.cycle_diagnostics?.checks.active_region_context.status).toBe("fail");
    expect(support.cycle_diagnostics?.checks.irradiance_continuity.status).toBe("warn");
  });

  it("passes the solar eruptive observed baseline when flare, CME, and irradiance context are complete", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_active_regions: {
            region_refs: ["artifact:solar/active-regions/noaa-13000"],
            region_count: 1,
          },
          solar_magnetogram: {
            active_region_patch_refs: ["artifact:solar/magnetograms/patch-1"],
          },
          solar_flare_catalog: {
            event_refs: ["artifact:solar/flares/goes-event-1"],
            source_region_refs: ["artifact:solar/active-regions/noaa-13000"],
            flare_count: 1,
            strongest_goes_class: "M1.2",
          },
          solar_cme_catalog: {
            event_refs: ["artifact:solar/cmes/lasco-event-1"],
            source_region_refs: ["artifact:solar/active-regions/noaa-13000"],
            cme_count: 1,
          },
          solar_irradiance_series: {
            euv_ref: "artifact:solar/irradiance/euv",
            xray_ref: "artifact:solar/irradiance/xray",
          },
        },
      },
      "solar_eruptive_catalog_v1",
    );

    expect(support.passed).toBe(true);
    expect(support.eruptive_diagnostics?.overall_status).toBe("pass");
    expect(support.eruptive_diagnostics?.checks.flare_catalog.status).toBe("pass");
    expect(support.eruptive_diagnostics?.checks.cme_catalog.status).toBe("pass");
    expect(support.eruptive_diagnostics?.checks.irradiance_continuity.status).toBe("pass");
    expect(support.eruptive_diagnostics?.checks.source_region_linkage.status).toBe("pass");
  });

  it("fails the solar eruptive observed baseline when flare or CME coverage is incomplete", () => {
    const support = evaluateSolarObservedBaseline(
      {
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_flare_catalog: {
            event_refs: ["artifact:solar/flares/goes-event-1"],
            flare_count: 1,
          },
          solar_cme_catalog: {
            cme_count: 0,
            event_refs: [],
          },
          solar_irradiance_series: {
            tsi_ref: "artifact:solar/irradiance/tsi",
          },
        },
      },
      "solar_eruptive_catalog_v1",
    );

    expect(support.passed).toBe(false);
    expect(support.reasons).toEqual(
      expect.arrayContaining([
        "solar_flare_catalog_incomplete",
        "solar_cme_catalog_incomplete",
      ]),
    );
    expect(support.eruptive_diagnostics?.checks.flare_catalog.status).toBe("fail");
    expect(support.eruptive_diagnostics?.checks.flare_catalog.reference_anchor_id).toBe("solar.eruptive.flare_catalog.v1");
    expect(support.eruptive_diagnostics?.checks.cme_catalog.status).toBe("fail");
    expect(support.eruptive_diagnostics?.checks.cme_catalog.reference_anchor_id).toBe("solar.eruptive.cme_catalog.v1");
    expect(support.eruptive_diagnostics?.checks.irradiance_continuity.status).toBe("warn");
    expect(support.eruptive_diagnostics?.checks.source_region_linkage.status).toBe("warn");
  });
});
