import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
  STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION,
} from "../server/modules/starsim/contract";

type StarSimRouteModule = typeof import("../server/routes/star-sim");

let artifactRoot = "";

const buildApp = async () => {
  vi.resetModules();
  const routeModule: StarSimRouteModule = await import("../server/routes/star-sim");
  const app = express();
  app.use(express.json());
  app.use("/api/star-sim", routeModule.starSimRouter);
  return app;
};

beforeEach(() => {
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-resolve-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_SOURCE_FETCH_MODE = "fixture";
  process.env.STAR_SIM_MESA_RUNTIME = "mock";
});

afterEach(() => {
  delete process.env.STAR_SIM_ARTIFACT_ROOT;
  delete process.env.STAR_SIM_SOURCE_FETCH_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_MODE;
  delete process.env.STAR_SIM_SDSS_ASTRA_MODE;
  delete process.env.STAR_SIM_LAMOST_DR10_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_ENDPOINT;
  delete process.env.STAR_SIM_SDSS_ASTRA_ENDPOINT;
  delete process.env.STAR_SIM_LAMOST_DR10_ENDPOINT;
  delete process.env.STAR_SIM_TESS_MAST_MODE;
  delete process.env.STAR_SIM_TASOC_MODE;
  delete process.env.STAR_SIM_TESS_MAST_ENDPOINT;
  delete process.env.STAR_SIM_TASOC_ENDPOINT;
  delete process.env.STAR_SIM_SOURCE_TIMEOUT_MS;
  delete process.env.STAR_SIM_SOURCE_USER_AGENT;
  delete process.env.STAR_SIM_MESA_RUNTIME;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim source resolution route", () => {
  it("accepts additive solar baseline scaffolding without altering the solar-like live resolve path", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_cycle_indices: {
            sunspot_number: 84,
            metadata: {
              instrument: "NOAA/SWPC",
              observed_mode: "observed",
            },
          },
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("resolved");
    expect(res.body.benchmark_target_id).toBe("demo_solar_a");
    expect(res.body.canonical_request_draft.solar_baseline.solar_cycle_indices.sunspot_number).toBe(84);
    expect(res.body.solar_reference_pack_id).toBeUndefined();
    expect(res.body.solar_reference_pack_ref).toBeUndefined();
    expect(res.body.solar_product_registry_id).toBeUndefined();
    expect(res.body.solar_product_registry_ref).toBeUndefined();
    expect(res.body.solar_provenance_diagnostics).toBeUndefined();
  });

  it("populates a Sun-only Phase 0 solar interior baseline and reports closure readiness", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          object_id: "sun",
          name: "Sun",
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("resolved");
    expect(res.body.benchmark_target_id).toBe("sun_observed_baseline");
    expect(res.body.benchmark_target_match_mode).toBe("matched_by_name");
    expect(res.body.canonical_request_draft.solar_baseline.solar_interior_profile.profile_ref).toBe("fixture:solar/interior/profile");
    expect(res.body.canonical_request_draft.solar_baseline.solar_layer_boundaries.convection_zone_base_rsun).toBe(0.713);
    expect(res.body.canonical_request_draft.solar_baseline.solar_global_modes.low_degree_mode_count).toBe(48);
    expect(res.body.canonical_request_draft.solar_baseline.solar_neutrino_constraints.cno_flux).toBe(7.0);
    expect(res.body.canonical_request_draft.solar_baseline.solar_cycle_indices.sunspot_number).toBe(82);
    expect(res.body.canonical_request_draft.solar_baseline.solar_magnetogram.synoptic_radial_map_ref).toBe("fixture:solar/magnetograms/synoptic-radial");
    expect(res.body.canonical_request_draft.solar_baseline.solar_active_regions.region_count).toBe(2);
    expect(res.body.canonical_request_draft.solar_baseline.solar_flare_catalog.strongest_goes_class).toBe("M3.4");
    expect(res.body.canonical_request_draft.solar_baseline.solar_cme_catalog.cme_count).toBe(1);
    expect(res.body.canonical_request_draft.solar_baseline.solar_irradiance_series.euv_ref).toBe("fixture:solar/irradiance/eve-euv");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.passed).toBe(true);
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.benchmark_pack_id).toBe("solar_interior_closure_v1");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.solar_reference_pack_id).toBe("solar_reference_pack");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.overall_status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.reference_pack_id).toBe("solar_reference_pack");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.convection_zone_depth.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.convection_zone_depth.reference_anchor_id).toBe("solar.interior.convection_zone_depth.v1");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.convection_zone_depth.reference_doc_ids).toEqual(["basu_antia_2004"]);
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.envelope_helium_fraction.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.low_degree_mode_support.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.neutrino_constraint_vector.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.passed).toBe(true);
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.overall_status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.cycle_indices.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.cycle_indices.reference_anchor_id).toBe("solar.cycle.cycle_indices.v1");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.magnetogram_context.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.active_region_context.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.passed).toBe(true);
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.overall_status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.flare_catalog.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.flare_catalog.reference_anchor_id).toBe("solar.eruptive.flare_catalog.v1");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.cme_catalog.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.irradiance_continuity.status).toBe("pass");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.source_region_linkage.status).toBe("pass");
    expect(res.body.solar_reference_pack_id).toBe("solar_reference_pack");
    expect(res.body.solar_reference_pack_ref).toBe("data/starsim/solar-reference-pack.v1.json");
    expect(res.body.solar_product_registry_id).toBe("solar_product_registry");
    expect(res.body.solar_product_registry_ref).toBe("data/starsim/solar-product-registry.v1.json");
    expect(res.body.source_resolution.solar_reference_pack_id).toBe("solar_reference_pack");
    expect(res.body.source_resolution.solar_reference_pack_ref).toBe("data/starsim/solar-reference-pack.v1.json");
    expect(res.body.source_resolution.solar_product_registry_id).toBe("solar_product_registry");
    expect(res.body.source_resolution.solar_product_registry_ref).toBe("data/starsim/solar-product-registry.v1.json");
    expect(res.body.solar_consistency_diagnostics.overall_status).toBe("pass");
    expect(res.body.solar_consistency_diagnostics.reference_pack_id).toBe("solar_reference_pack");
    expect(res.body.solar_consistency_diagnostics.checks.source_region_overlap.status).toBe("pass");
    expect(res.body.solar_consistency_diagnostics.checks.source_region_overlap.reference_anchor_id).toBe("solar.consistency.source_region_overlap.v1");
    expect(res.body.solar_consistency_diagnostics.checks.source_region_overlap.reference_doc_ids).toEqual(["hmi_products", "goes_xray", "lasco_docs"]);
    expect(res.body.solar_consistency_diagnostics.checks.magnetogram_active_region_linkage.status).toBe("pass");
    expect(res.body.solar_consistency_diagnostics.checks.irradiance_context_consistency.status).toBe("pass");
    expect(res.body.solar_consistency_diagnostics.checks.phase_metadata_coherence.status).toBe("pass");
    expect(res.body.solar_provenance_diagnostics.overall_status).toBe("pass");
    expect(res.body.solar_provenance_diagnostics.product_registry_id).toBe("solar_product_registry");
    expect(res.body.solar_provenance_diagnostics.checks.solar_global_modes.source_product_id).toBe("gong_hmi_global_modes_v1");
    expect(res.body.solar_provenance_diagnostics.checks.solar_magnetogram.source_product_family).toBe("magnetogram_products");
    expect(res.body.canonical_request_draft.solar_baseline.solar_magnetogram.metadata.source_product_id).toBe("hmi_full_disk_magnetogram_v1");
    expect(res.body.canonical_request_draft.solar_baseline.solar_flare_catalog.metadata.source_doc_ids).toEqual(["goes_xray"]);
    expect(res.body.solar_baseline_signature).toMatch(/^sha256:/);
    expect(res.body.previous_solar_baseline_ref).toBeNull();
    expect(res.body.solar_baseline_repeatability).toBeUndefined();
    expect(res.body.source_resolution.artifact_refs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "solar_observed_baseline",
          metadata: expect.objectContaining({
            instrument: "SDO/HMI+Borexino+solar-assimilation",
            coordinate_frame: "Carrington",
            observed_mode: "assimilated",
          }),
        }),
      ]),
    );
  });

  it("surfaces solar consistency failures when eruptive source-region refs diverge from cycle context", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
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
            metadata: {
              instrument: "NOAA/SWPC",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
          solar_magnetogram: {
            active_region_patch_refs: ["user:solar/magnetograms/patch-1"],
            synoptic_radial_map_ref: "user:solar/magnetograms/synoptic",
            metadata: {
              instrument: "SDO/HMI",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
          solar_active_regions: {
            region_refs: ["user:solar/active-regions/noaa-13000"],
            region_count: 1,
            metadata: {
              instrument: "NOAA",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
          solar_flare_catalog: {
            event_refs: ["user:solar/flares/goes-event-1"],
            source_region_refs: ["user:solar/active-regions/noaa-99999"],
            flare_count: 1,
            strongest_goes_class: "M1.2",
            metadata: {
              instrument: "GOES/SWPC",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
          solar_cme_catalog: {
            event_refs: ["user:solar/cmes/lasco-event-1"],
            source_region_refs: ["user:solar/active-regions/noaa-99999"],
            cme_count: 1,
            metadata: {
              instrument: "SOHO/LASCO",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
          solar_irradiance_series: {
            tsi_ref: "user:solar/irradiance/tsi",
            euv_ref: "user:solar/irradiance/euv",
            metadata: {
              instrument: "SDO/EVE",
              coordinate_frame: "Carrington",
              carrington_rotation: 2290,
              observed_mode: "observed",
            },
          },
        },
      })
      .expect(200);

    expect(res.body.solar_consistency_diagnostics.overall_status).toBe("fail");
    expect(res.body.solar_consistency_diagnostics.checks.source_region_overlap.status).toBe("fail");
    expect(res.body.solar_consistency_diagnostics.checks.source_region_overlap.reason_code).toBe("source_region_overlap_mismatch");
  });

  it("surfaces solar interior closure support failures when a Sun request is only partially populated", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            profile_ref: "user:solar/interior/profile",
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "user:solar/modes",
            low_degree_mode_count: 48,
            detail_ref: "user:solar/modes/detail",
          },
          solar_neutrino_constraints: {
            constraints_ref: "user:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
          },
        },
      })
      .expect(200);

    expect(res.body.canonical_request_draft.solar_baseline.solar_interior_profile.profile_ref).toBe("user:solar/interior/profile");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.passed).toBe(false);
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.reasons).toContain("solar_neutrino_vector_incomplete");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.neutrino_constraint_vector.status).toBe("fail");
  });

  it("surfaces solar interior closure warnings without blocking the Sun baseline when values remain near-band", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_interior_profile: {
            profile_ref: "user:solar/interior/profile",
            summary: {
              convection_zone_base_rsun: 0.713,
              envelope_helium_fraction: 0.257,
            },
          },
          solar_layer_boundaries: {
            convection_zone_base_rsun: 0.713,
          },
          solar_global_modes: {
            mode_table_ref: "user:solar/modes",
            low_degree_mode_count: 30,
          },
          solar_neutrino_constraints: {
            constraints_ref: "user:solar/neutrinos",
            pp_flux: 5.98,
            be7_flux: 4.82,
            pep_flux: 1.44,
            b8_flux: 5.16,
            cno_flux: 7.0,
          },
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("resolved");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.passed).toBe(true);
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.overall_status).toBe("warn");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.envelope_helium_fraction.status).toBe("warn");
    expect(res.body.solar_baseline_support.solar_interior_closure_v1.closure_diagnostics.checks.low_degree_mode_support.status).toBe("warn");
  });

  it("surfaces solar cycle observed failures when cycle context is incomplete", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
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
            line_of_sight_ref: "user:solar/magnetograms/los",
          },
          solar_active_regions: {
            region_count: 0,
            region_refs: [],
          },
        },
      })
      .expect(200);

    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.passed).toBe(false);
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.reasons).toEqual(
      expect.arrayContaining([
        "solar_cycle_indices_incomplete",
        "solar_cycle_magnetogram_incomplete",
        "solar_active_regions_incomplete",
      ]),
    );
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.cycle_indices.status).toBe("fail");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.magnetogram_context.status).toBe("fail");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.active_region_context.status).toBe("fail");
    expect(res.body.solar_baseline_support.solar_cycle_observed_v1.cycle_diagnostics.checks.irradiance_continuity.status).toBe("warn");
  });

  it("surfaces solar eruptive observed failures when flare and CME context are incomplete", async () => {
    process.env.STAR_SIM_SOURCE_FETCH_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          object_id: "sun",
          name: "Sun",
        },
        solar_baseline: {
          schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
          solar_flare_catalog: {
            event_refs: ["user:solar/flares/goes-event-1"],
            flare_count: 1,
          },
          solar_cme_catalog: {
            cme_count: 0,
            event_refs: [],
          },
          solar_irradiance_series: {
            tsi_ref: "user:solar/irradiance/tsi",
          },
        },
      })
      .expect(200);

    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.passed).toBe(false);
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.reasons).toEqual(
      expect.arrayContaining([
        "solar_flare_catalog_incomplete",
        "solar_cme_catalog_incomplete",
      ]),
    );
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.flare_catalog.status).toBe("fail");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.cme_catalog.status).toBe("fail");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.irradiance_continuity.status).toBe("warn");
    expect(res.body.solar_baseline_support.solar_eruptive_catalog_v1.eruptive_diagnostics.checks.source_region_linkage.status).toBe("warn");
  });

  it("merges Gaia DR3 identity/astrometry with SDSS Astra spectroscopy into a structure-ready draft", async () => {
    const app = await buildApp();
    const resolveResponse = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(200);

    expect(resolveResponse.body.schema_version).toBe("star-sim-source-resolve-v1");
    expect(resolveResponse.body.source_resolution.status).toBe("resolved");
    expect(resolveResponse.body.source_resolution.fetch_mode).toBe("fixture");
    expect(resolveResponse.body.source_resolution.selection_manifest.schema_version).toBe(STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION);
    expect(resolveResponse.body.structure_mesa_ready).toBe(true);
    expect(resolveResponse.body.supported_domain_preview?.passed).toBe(true);
    expect(resolveResponse.body.identifiers_resolved.gaia_dr3_source_id).toBe("123456789012345678");
    expect(resolveResponse.body.identifiers_resolved.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(resolveResponse.body.identifiers_observed.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(resolveResponse.body.identifiers_trusted.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(resolveResponse.body.benchmark_target_id).toBe("demo_solar_a");
    expect(resolveResponse.body.benchmark_target_match_mode).toBe("matched_by_identifier");
    expect(resolveResponse.body.benchmark_target_identity_basis).toBe("trusted_identifier");
    expect(resolveResponse.body.crossmatch_summary.accepted).toBeGreaterThan(0);
    expect(resolveResponse.body.crossmatch_summary.rejected).toBe(0);
    expect(
      (resolveResponse.body.crossmatch_summary.fallback_fields as Array<{ field_path: string }>).some(
        (entry) => entry.field_path === "spectroscopy.teff_K",
      ),
    ).toBe(false);
    expect(resolveResponse.body.canonical_request_draft.astrometry.parallax_mas).toBe(59.2);
    expect(resolveResponse.body.canonical_request_draft.spectroscopy.teff_K).toBe(5821);
    expect(resolveResponse.body.canonical_request_draft.spectroscopy.field_sources.teff_K).toBe("sdss_astra");

    const runResponse = await request(app)
      .post("/api/star-sim/v1/run")
      .send({
        ...resolveResponse.body.canonical_request_draft,
        requested_lanes: ["structure_mesa"],
      })
      .expect(200);

    expect(runResponse.body.lanes[0].status).toBe("unavailable");
    expect(runResponse.body.lanes[0].status_reason).toBe("async_job_required");
  });

  it("returns a partial Gaia-only resolution when fallback spectroscopy is disabled", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        source_hints: {
          preferred_catalogs: ["gaia_dr3"],
          allow_fallbacks: false,
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("partial");
    expect(res.body.structure_mesa_ready).toBe(false);
    expect(res.body.source_resolution.reasons).toContain("spectroscopy_unresolved");
    expect(res.body.canonical_request_draft.astrometry.parallax_mas).toBe(59.2);
    expect(res.body.canonical_request_draft.spectroscopy).toBeUndefined();
  });

  it("adds TASOC seismic summaries and marks oscillation readiness when requested", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("resolved");
    expect(res.body.structure_mesa_ready).toBe(true);
    expect(res.body.oscillation_gyre_ready).toBe(true);
    expect(res.body.canonical_request_draft.asteroseismology.numax_uHz).toBe(3085.2);
    expect(res.body.canonical_request_draft.asteroseismology.deltanu_uHz).toBe(134.7);
    expect(res.body.canonical_request_draft.asteroseismology.field_sources.numax_uHz).toBe("tasoc");
    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].selected_from).toBe("tasoc");
  });

  it("returns a partial oscillation preview when seismic summaries are unavailable", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar B",
        },
        identifiers: {
          gaia_dr3_source_id: "987654321098765432",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("partial");
    expect(res.body.structure_mesa_ready).toBe(true);
    expect(res.body.oscillation_gyre_ready).toBe(false);
    expect(res.body.source_resolution.reasons).toContain("seismology_unresolved");
  });


  it("records explicit crossmatch rejection reasons on identifier conflict", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
          sdss_apogee_id: "BAD-ID",
        },
      })
      .expect(200);

    expect(res.body.quality_rejections.length).toBeGreaterThan(0);
    expect(res.body.quality_rejections.some((entry: any) => entry.reason === "rejected_identifier_conflict")).toBe(true);
  });

  it("does not let rejected-source identifiers drive benchmark-target assignment", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar B",
        },
        identifiers: {
          gaia_dr3_source_id: "987654321098765432",
          sdss_apogee_id: "2M00000000+0000000",
        },
      })
      .expect(200);

    expect(res.body.quality_rejections.some((entry: any) => entry.catalog === "sdss_astra")).toBe(true);
    expect(res.body.identifiers_observed.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(res.body.identifiers_trusted.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(res.body.benchmark_target_id).toBe("demo_solar_b");
    expect(res.body.benchmark_target_id).not.toBe("demo_solar_a");
  });

  it("surfaces conflicting trusted identifiers instead of picking an arbitrary benchmark target", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
          lamost_obsid: "LAMOST-B-0002",
        },
      })
      .expect(200);

    expect(res.body.identifiers_trusted.gaia_dr3_source_id).toBe("123456789012345678");
    expect(res.body.identifiers_trusted.lamost_obsid).toBe("LAMOST-B-0002");
    expect(res.body.benchmark_target_id).toBeUndefined();
    expect(res.body.benchmark_target_match_mode).toBe("conflicted_trusted_identifiers");
    expect(res.body.benchmark_target_conflict_reason).toBe("multiple_trusted_identifier_targets");
    expect(res.body.benchmark_target_identity_basis).toBe("conflicted_trusted_identifiers");
    expect(res.body.benchmark_target_quality_ok).toBe(false);
  });

  it("does not promote name-only non-Gaia secondary records into trusted benchmark identity", async () => {
    process.env.STAR_SIM_GAIA_DR3_MODE = "disabled";
    process.env.STAR_SIM_SDSS_ASTRA_MODE = "disabled";
    process.env.STAR_SIM_TASOC_MODE = "disabled";
    process.env.STAR_SIM_TESS_MAST_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          object_id: "lamost-demo-solar-b",
        },
      })
      .expect(200);

    expect(res.body.identifiers_observed.lamost_obsid).toBe("LAMOST-B-0002");
    expect(res.body.identifiers_trusted.lamost_obsid).toBeUndefined();
    expect(res.body.benchmark_target_id).toBeUndefined();
    expect(res.body.benchmark_target_match_mode).toBe("no_match");
    expect(res.body.canonical_request_draft.spectroscopy.teff_K).toBe(5710);
  });

  it("allows an explicit non-Gaia secondary identifier to become trusted without promoting unrelated fetched identity", async () => {
    process.env.STAR_SIM_GAIA_DR3_MODE = "disabled";
    process.env.STAR_SIM_SDSS_ASTRA_MODE = "disabled";
    process.env.STAR_SIM_TASOC_MODE = "disabled";
    process.env.STAR_SIM_TESS_MAST_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        identifiers: {
          lamost_obsid: "LAMOST-B-0002",
        },
      })
      .expect(200);

    expect(res.body.identifiers_observed.lamost_obsid).toBe("LAMOST-B-0002");
    expect(res.body.identifiers_trusted.lamost_obsid).toBe("LAMOST-B-0002");
    expect(res.body.benchmark_target_id).toBe("demo_solar_b");
    expect(res.body.benchmark_target_match_mode).toBe("matched_by_identifier");
    expect(res.body.crossmatch_identity_basis.lamost_dr10).toContain("explicit_request_identifier");
  });

  it("marks fallback as used when Astra is absent and LAMOST provides selected spectroscopy", async () => {
    process.env.STAR_SIM_SDSS_ASTRA_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
      })
      .expect(200);

    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"].selected_from).toBe("lamost_dr10");
    expect(res.body.crossmatch_summary.fallback_used).toBe(true);
    expect(res.body.crossmatch_summary.fallback_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_path: "spectroscopy.teff_K",
          selected_from: "lamost_dr10",
          preferred_catalog: "sdss_astra",
          preferred_status: "absent",
        }),
      ]),
    );
  });

  it("marks fallback as used when TASOC is absent and TESS provides selected seismic summaries", async () => {
    process.env.STAR_SIM_TASOC_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].selected_from).toBe("tess_mast");
    expect(res.body.crossmatch_summary.fallback_used).toBe(true);
    expect(res.body.crossmatch_summary.fallback_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_path: "asteroseismology.numax_uHz",
          selected_from: "tess_mast",
          preferred_catalog: "tasoc",
          preferred_status: "absent",
        }),
      ]),
    );
  });

  it("fails unresolved targets honestly with explicit reasons", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Unknown Demo Star",
        },
        identifiers: {
          gaia_dr3_source_id: "000000000000000000",
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("unresolved");
    expect(res.body.canonical_request_draft).toBeNull();
    expect(res.body.source_resolution.reasons).toContain("gaia_target_not_found");
  });
});
