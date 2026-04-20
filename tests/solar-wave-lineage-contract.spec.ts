import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ingestSolarWaveObservable,
  solarEventLineageSchema,
  solarSpectralCubeSchema,
  spectralOriginHypothesisSchema,
} from "../shared/solar-wave-lineage";

const makeCryoSpectralCube = () => ({
  schema_version: "shared_observable_contract/v1",
  observable_id: "cryo_fe13_1074_off_limb_ar13354",
  lane_id: "stellar_radiation",
  kind: "spectral_cube",
  modality: "spectrogram",
  axes: [
    { name: "helioprojective_longitude", unit: "arcsec", physical_type: "pos.helioprojective.lon" },
    { name: "wavelength", unit: "nm", physical_type: "em.wavelength" },
    { name: "helioprojective_latitude", unit: "arcsec", physical_type: "pos.helioprojective.lat" },
    { name: "time", unit: "s", physical_type: "time", monotonic: true },
  ],
  data_ref: "artifacts/solar/cryo/ar13354-fe13-cube.asdf",
  value_unit: "arb_intensity_units",
  valid_mask: [true, true, true, true, false, true],
  raw_mask_semantics: "native",
  min_valid_fraction: 0.7,
  wcs_ref: "artifacts/solar/cryo/ar13354-fe13-cube-gwcs.json",
  geometry_ref: "artifacts/solar/cryo/ar13354-off-limb-geometry.json",
  measurement_region: "off_limb_corona",
  off_limb: true,
  line_ids: ["Fe_XIII_1074nm", "Fe_XIII_1079nm"],
  instrument: "DKIST_CRYO_NIRSP",
  provenance_ref: {
    source_id: "dkist_cryo_2023-07-06_ar13354",
    source_family: "DKIST",
    citation_refs: ["https://arxiv.org/html/2511.10880v1"],
  },
  claim_tier: "diagnostic",
  provenance_class: "observed",
  response_model_ref: {
    id: "cryo_instrument_response_v1",
    kind: "instrument_response",
  },
});

describe("solar wave lineage contract", () => {
  it("keeps formation region and driver origin as distinct hypothesis fields", () => {
    const parsed = spectralOriginHypothesisSchema.parse({
      transition_id: "Fe_XIII_1074nm",
      formation_region: "corona",
      driver_origin: "p_mode",
      measurement_region: "off_limb_corona",
      evidence_refs: ["artifacts/solar/cryo/ar13354-fe13-wave-psd.json"],
      confidence: 0.58,
      status: "supported",
    });

    expect(parsed.formation_region).toBe("corona");
    expect(parsed.driver_origin).toBe("p_mode");
    expect(parsed.formation_region).not.toBe(parsed.driver_origin as unknown as "corona");
  });

  it("preserves DKIST WCS-like axes through ingestion", () => {
    const ingested = ingestSolarWaveObservable(makeCryoSpectralCube());
    expect(ingested.kind).toBe("spectral_cube");
    const axisNames = ingested.axes.map((axis) => axis.name);
    expect(axisNames).toEqual([
      "helioprojective_longitude",
      "wavelength",
      "helioprojective_latitude",
      "time",
    ]);
  });

  it("requires Cryo-NIRSP observables to include geometry and provenance", () => {
    const missingGeometry = {
      ...makeCryoSpectralCube(),
      geometry_ref: undefined,
    };
    const result = solarSpectralCubeSchema.safeParse(missingGeometry);
    expect(result.success).toBe(false);

    const missingProvenance = {
      ...makeCryoSpectralCube(),
      provenance_ref: undefined,
    };
    const missingProvenanceResult = solarSpectralCubeSchema.safeParse(
      missingProvenance,
    );
    expect(missingProvenanceResult.success).toBe(false);
  });

  it("requires frequency-band evidence and heliocentric geometry for remote-to-in-situ linkage", () => {
    const missingEvidence = {
      event_id: "candidate_2025_06_19_psp_link",
      remote_observable_refs: ["cryo_fe13_1074_off_limb_ar13354"],
      in_situ_observable_refs: ["psp_rtn_5min_wave_train_2025-06-19"],
      evidence_status: "candidate",
      hard_identity_asserted: false,
    };
    const result = solarEventLineageSchema.safeParse(missingEvidence);
    expect(result.success).toBe(false);
  });

  it("forbids hard identity assertions in remote-to-in-situ lineage records", () => {
    const identityAsserted = {
      event_id: "candidate_2024_12_24_psp_link",
      remote_observable_refs: ["cryo_fe13_1074_off_limb_ar13354"],
      in_situ_observable_refs: ["psp_rtn_5min_wave_train_2024-12-24"],
      frequency_band_mhz: [3.1, 3.2],
      heliocentric_geometry_ref: "artifacts/solar/psp/geometry-9p9-rsun.json",
      carrington_window_ref: "artifacts/solar/lineage/carrington-window-2024-12-24.json",
      evidence_status: "candidate",
      hard_identity_asserted: true,
    };
    const result = solarEventLineageSchema.safeParse(identityAsserted);
    expect(result.success).toBe(false);
  });

  it("ships wave-lineage docs and tree with cited basis", () => {
    const repoRoot = process.cwd();
    const requiredPaths = [
      "docs/knowledge/physics/physics-solar-wave-lineage-tree.json",
      "docs/knowledge/physics/solar-spectral-origin-hypothesis.md",
      "docs/knowledge/physics/solar-cryonirsp-fe13-observable.md",
      "docs/knowledge/physics/solar-psp-5min-wave-observable.md",
      "docs/knowledge/physics/solar-remote-to-insitu-linkage.md",
    ];
    for (const filePath of requiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, filePath))).toBe(true);
    }

    const linkageDoc = fs.readFileSync(
      path.join(repoRoot, "docs/knowledge/physics/solar-remote-to-insitu-linkage.md"),
      "utf8",
    );
    expect(linkageDoc).toContain("https://arxiv.org/html/2511.10880v1");
    expect(linkageDoc).toContain("https://arxiv.org/html/2511.10906v1");
  });
});
