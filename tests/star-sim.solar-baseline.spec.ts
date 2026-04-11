import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION,
  buildSolarObservedFixture,
  normalizeSolarObservedBaselinePatch,
  resolveSolarObservedSource,
} from "../server/modules/starsim/sources/adapters/solar-observed";
import {
  __resetSolarProductRegistryForTest,
  __setSolarProductRegistryForTest,
  getSolarProductRegistry,
  loadSolarProductRegistryFromPath,
} from "../server/modules/starsim/solar-product-registry";
import {
  __resetSolarReferencePackForTest,
  __setSolarReferencePackForTest,
  getSolarReferencePack,
  loadSolarReferencePackFromPath,
} from "../server/modules/starsim/solar-reference-pack";
import {
  evaluateSolarCycleObservedDiagnostics,
  evaluateSolarEruptiveCatalogDiagnostics,
  evaluateSolarInteriorClosureDiagnostics,
  evaluateSolarProvenanceDiagnostics,
} from "../server/modules/starsim/solar-diagnostics";
import { buildSolarConsistencyDiagnostics } from "../server/modules/starsim/solar-repeatability";

afterEach(() => {
  __resetSolarReferencePackForTest();
  __resetSolarProductRegistryForTest();
});

describe("star-sim solar observed adapter scaffold", () => {
  it("normalizes solar observed metadata onto baseline sections", () => {
    const result = normalizeSolarObservedBaselinePatch({
      request: {
        target: {
          object_id: "sun",
          name: "Sun",
        },
      },
      source_id: "fixture:hmi-cycle",
      instrument: "SDO/HMI",
      observed_mode: "observed",
      coordinate_frame: "Carrington",
      cadence: {
        value: 12,
        unit: "s",
      },
      payload: {
        solar_cycle_indices: {
          sunspot_number: 83,
        },
      },
    });

    expect(result.adapter_version).toBe(STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION);
    expect(result.reason).toBeNull();
    expect(result.baseline_patch?.solar_cycle_indices?.metadata?.instrument).toBe("SDO/HMI");
    expect(result.baseline_patch?.solar_cycle_indices?.metadata?.coordinate_frame).toBe("Carrington");
  });

  it("provides a minimal fixture scaffold for the Sun only", () => {
    const result = buildSolarObservedFixture({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    expect(result.reason).toBeNull();
    expect(result.baseline_patch?.solar_cycle_indices?.cycle_label).toBe("Cycle 25");
    expect(result.baseline_patch?.solar_irradiance_series?.tsi_ref).toBe("fixture:solar/tsi");
  });

  it("loads the solar interior closure fixture when resolving the Sun baseline", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    expect(result.adapter_version).toBe(STAR_SIM_SOLAR_OBSERVED_ADAPTER_VERSION);
    expect(result.reason).toBeNull();
    expect(result.baseline_patch?.solar_interior_profile?.summary?.convection_zone_base_rsun).toBe(0.713);
    expect(result.baseline_patch?.solar_neutrino_constraints?.cno_flux).toBe(7.0);
    expect(result.baseline_patch?.solar_cycle_indices?.cycle_label).toBe("Cycle 25");
    expect(result.baseline_patch?.solar_magnetogram?.synoptic_radial_map_ref).toBe("fixture:solar/magnetograms/synoptic-radial");
    expect(result.baseline_patch?.solar_active_regions?.region_count).toBe(2);
    expect(result.baseline_patch?.solar_flare_catalog?.strongest_goes_class).toBe("M3.4");
    expect(result.baseline_patch?.solar_cme_catalog?.cme_count).toBe(1);
    expect(result.baseline_patch?.solar_irradiance_series?.euv_ref).toBe("fixture:solar/irradiance/eve-euv");
    expect(result.metadata.instrument).toBe("SDO/HMI+Borexino+solar-assimilation");
    expect(result.metadata.observed_mode).toBe("assimilated");
    expect(result.baseline_patch?.solar_interior_profile?.metadata?.source_product_id).toBe("solar_assimilation_interior_profile_v1");
    expect(result.baseline_patch?.solar_global_modes?.metadata?.source_product_family).toBe("global_helioseismology_products");
    expect(result.baseline_patch?.solar_flare_catalog?.metadata?.source_doc_ids).toEqual(["goes_xray"]);
  });

  it("evaluates the merged Sun fixture as product-provenance consistent", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = evaluateSolarProvenanceDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics?.overall_status).toBe("pass");
    expect(diagnostics?.product_registry_id).toBe("solar_product_registry");
    expect(diagnostics?.checks.solar_interior_profile?.status).toBe("pass");
    expect(diagnostics?.checks.solar_interior_profile?.source_product_id).toBe("solar_assimilation_interior_profile_v1");
    expect(diagnostics?.checks.solar_magnetogram?.source_product_family).toBe("magnetogram_products");
    expect(diagnostics?.checks.solar_flare_catalog?.source_doc_ids).toEqual(["goes_xray"]);
  });

  it("fails product provenance when a section declares the wrong family for an otherwise plausible product", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = evaluateSolarProvenanceDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: {
        ...(result.baseline_patch ?? { schema_version: "star-sim-solar-baseline/1" }),
        solar_magnetogram: {
          ...result.baseline_patch?.solar_magnetogram,
          metadata: {
            ...result.baseline_patch?.solar_magnetogram?.metadata,
            source_product_family: "cycle_index_products",
          },
        },
      },
    });

    expect(diagnostics?.overall_status).toBe("fail");
    expect(diagnostics?.checks.solar_magnetogram?.status).toBe("fail");
    expect(diagnostics?.checks.solar_magnetogram?.reason_code).toBe("section_product_family_mismatch");
  });

  it("evaluates the current Sun fixture as a passing Phase 0 interior closure baseline", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = evaluateSolarInteriorClosureDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics.overall_status).toBe("pass");
    expect(diagnostics.reference_pack_id).toBe("solar_reference_pack");
    expect(diagnostics.checks.convection_zone_depth.status).toBe("pass");
    expect(diagnostics.checks.convection_zone_depth.reference_anchor_id).toBe("solar.interior.convection_zone_depth.v1");
    expect(diagnostics.checks.convection_zone_depth.reference_doc_ids).toEqual(["basu_antia_2004"]);
    expect(diagnostics.checks.envelope_helium_fraction.status).toBe("pass");
    expect(diagnostics.checks.envelope_helium_fraction.reference_anchor_id).toBe("solar.interior.envelope_helium_fraction.v1");
    expect(diagnostics.checks.low_degree_mode_support.status).toBe("pass");
    expect(diagnostics.checks.low_degree_mode_support.reference_anchor_id).toBe("solar.interior.low_degree_mode_support.v1");
    expect(diagnostics.checks.neutrino_constraint_vector.status).toBe("pass");
    expect(diagnostics.checks.neutrino_constraint_vector.reference_anchor_id).toBe("solar.interior.neutrino_constraint_vector.v1");
  });

  it("evaluates the merged Sun fixture as a passing solar cycle observed baseline", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = evaluateSolarCycleObservedDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics.overall_status).toBe("pass");
    expect(diagnostics.reference_pack_id).toBe("solar_reference_pack");
    expect(diagnostics.checks.cycle_indices.status).toBe("pass");
    expect(diagnostics.checks.cycle_indices.reference_anchor_id).toBe("solar.cycle.cycle_indices.v1");
    expect(diagnostics.checks.cycle_indices.reference_doc_ids).toEqual(["goes_xray"]);
    expect(diagnostics.checks.magnetogram_context.status).toBe("pass");
    expect(diagnostics.checks.magnetogram_context.reference_anchor_id).toBe("solar.cycle.magnetogram_context.v1");
    expect(diagnostics.checks.active_region_context.status).toBe("pass");
    expect(diagnostics.checks.active_region_context.reference_anchor_id).toBe("solar.cycle.active_region_context.v1");
    expect(diagnostics.checks.irradiance_continuity.status).toBe("pass");
    expect(diagnostics.checks.irradiance_continuity.reference_anchor_id).toBe("solar.cycle.irradiance_continuity.v1");
  });

  it("evaluates the merged Sun fixture as a passing solar eruptive observed baseline", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = evaluateSolarEruptiveCatalogDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics.overall_status).toBe("pass");
    expect(diagnostics.reference_pack_id).toBe("solar_reference_pack");
    expect(diagnostics.checks.flare_catalog.status).toBe("pass");
    expect(diagnostics.checks.flare_catalog.reference_anchor_id).toBe("solar.eruptive.flare_catalog.v1");
    expect(diagnostics.checks.flare_catalog.reference_doc_ids).toEqual(["goes_xray"]);
    expect(diagnostics.checks.cme_catalog.status).toBe("pass");
    expect(diagnostics.checks.cme_catalog.reference_anchor_id).toBe("solar.eruptive.cme_catalog.v1");
    expect(diagnostics.checks.irradiance_continuity.status).toBe("pass");
    expect(diagnostics.checks.irradiance_continuity.reference_anchor_id).toBe("solar.eruptive.irradiance_continuity.v1");
    expect(diagnostics.checks.source_region_linkage.status).toBe("pass");
    expect(diagnostics.checks.source_region_linkage.reference_anchor_id).toBe("solar.eruptive.source_region_linkage.v1");
  });

  it("evaluates the merged Sun fixture as cross-phase consistent", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });

    const diagnostics = buildSolarConsistencyDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics?.overall_status).toBe("pass");
    expect(diagnostics?.reference_pack_id).toBe("solar_reference_pack");
    expect(diagnostics?.checks.source_region_overlap.status).toBe("pass");
    expect(diagnostics?.checks.source_region_overlap.reference_anchor_id).toBe("solar.consistency.source_region_overlap.v1");
    expect(diagnostics?.checks.source_region_overlap.reference_doc_ids).toEqual(["hmi_products", "goes_xray", "lasco_docs"]);
    expect(diagnostics?.checks.magnetogram_active_region_linkage.status).toBe("pass");
    expect(diagnostics?.checks.magnetogram_active_region_linkage.reference_anchor_id).toBe("solar.consistency.magnetogram_active_region_linkage.v1");
    expect(diagnostics?.checks.irradiance_context_consistency.status).toBe("pass");
    expect(diagnostics?.checks.irradiance_context_consistency.reference_anchor_id).toBe("solar.consistency.irradiance_context.v1");
    expect(diagnostics?.checks.phase_metadata_coherence.status).toBe("pass");
    expect(diagnostics?.checks.phase_metadata_coherence.reference_anchor_id).toBe("solar.consistency.phase_metadata_coherence.v1");
  });

  it("flags mismatched source-region refs in the solar consistency diagnostics", () => {
    const diagnostics = buildSolarConsistencyDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: {
        schema_version: "star-sim-solar-baseline/1",
        solar_active_regions: {
          region_refs: ["artifact:solar/active-regions/noaa-13000"],
          region_count: 1,
        },
        solar_magnetogram: {
          active_region_patch_refs: ["artifact:solar/magnetograms/patch-1"],
          metadata: {
            instrument: "SDO/HMI",
            coordinate_frame: "Carrington",
            observed_mode: "observed",
          },
        },
        solar_flare_catalog: {
          event_refs: ["artifact:solar/flares/goes-event-1"],
          source_region_refs: ["artifact:solar/active-regions/noaa-99999"],
          flare_count: 1,
          strongest_goes_class: "M1.2",
        },
        solar_cme_catalog: {
          event_refs: ["artifact:solar/cmes/lasco-event-1"],
          source_region_refs: ["artifact:solar/active-regions/noaa-99999"],
          cme_count: 1,
        },
        solar_irradiance_series: {
          tsi_ref: "artifact:solar/irradiance/tsi",
          euv_ref: "artifact:solar/irradiance/euv",
        },
      },
    });

    expect(diagnostics?.checks.source_region_overlap.status).toBe("fail");
    expect(diagnostics?.checks.source_region_overlap.reason_code).toBe("source_region_overlap_mismatch");
    expect(diagnostics?.checks.source_region_overlap.reference_pack_id).toBe("solar_reference_pack");
  });

  it("drives solar diagnostics from the loaded reference-pack content", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });
    const updatedPack = getSolarReferencePack();
    updatedPack.anchors.interior.convection_zone_depth.expected_summary = {
      ...(updatedPack.anchors.interior.convection_zone_depth.expected_summary ?? {}),
      pass_range: {
        min: 0.714,
        max: 0.718,
      },
      warn_range: {
        min: 0.714,
        max: 0.718,
      },
    };
    __setSolarReferencePackForTest(updatedPack);

    const diagnostics = evaluateSolarInteriorClosureDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics.overall_status).toBe("fail");
    expect(diagnostics.checks.convection_zone_depth.status).toBe("fail");
    expect(diagnostics.checks.convection_zone_depth.reference_pack_version).toBe(updatedPack.version);
  });

  it("fails clearly when the solar reference-pack JSON is malformed", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-solar-pack-"));
    const packPath = path.join(tempRoot, "solar-reference-pack.bad.json");
    fs.writeFileSync(packPath, "{\n  \"id\": \"broken\",\n", "utf8");

    expect(() => loadSolarReferencePackFromPath(packPath)).toThrow(/Failed to parse solar reference pack JSON/);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("fails clearly when the solar product-registry JSON is malformed", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-solar-products-"));
    const registryPath = path.join(tempRoot, "solar-product-registry.bad.json");
    fs.writeFileSync(registryPath, "{\n  \"id\": \"broken\",\n", "utf8");

    expect(() => loadSolarProductRegistryFromPath(registryPath)).toThrow(/Failed to parse solar product registry JSON/);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("drives solar provenance diagnostics from the loaded product-registry content", async () => {
    const result = await resolveSolarObservedSource({
      target: {
        object_id: "sun",
        name: "Sun",
      },
    });
    const updatedRegistry = getSolarProductRegistry();
    updatedRegistry.products.hmi_full_disk_magnetogram_v1.instrument = "HMI/ALT";
    __setSolarProductRegistryForTest(updatedRegistry);

    const diagnostics = evaluateSolarProvenanceDiagnostics({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: result.baseline_patch ?? undefined,
    });

    expect(diagnostics?.overall_status).toBe("fail");
    expect(diagnostics?.checks.solar_magnetogram?.status).toBe("fail");
    expect(diagnostics?.checks.solar_magnetogram?.reason_code).toBe("section_product_instrument_mismatch");
  });
});
