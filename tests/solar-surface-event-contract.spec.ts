import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  downgradeHypothesisStatusForLagMismatch,
  photosphericLineTransientSchema,
  solarSurfaceEventBundleSchema,
  sunquakeImpactSourceSchema,
  surfaceEventOriginHypothesisSchema,
} from "../shared/solar-surface-event-contract";

describe("solar surface event contract", () => {
  it("keeps initial_impact and reconstructed_source as distinct source kinds", () => {
    const initial = sunquakeImpactSourceSchema.parse({
      source_id: "sq_source_initial",
      event_id: "event_2022_05_10_x1p5",
      location_ref: "artifacts/solar/hmi/source-initial.json",
      location_kind: "initial_impact",
      detection_method: "doppler_impulse",
    });
    const reconstructed = sunquakeImpactSourceSchema.parse({
      source_id: "sq_source_reconstructed",
      event_id: "event_2022_05_10_x1p5",
      location_ref: "artifacts/solar/hmi/source-reconstructed.json",
      location_kind: "reconstructed_source",
      detection_method: "acoustic_holography",
    });
    expect(initial.location_kind).toBe("initial_impact");
    expect(reconstructed.location_kind).toBe("reconstructed_source");
    expect(initial.location_kind).not.toBe(reconstructed.location_kind);
  });

  it("requires radiative plus impact/helioseismic support for origin hypotheses", () => {
    const invalid = {
      hypothesis_id: "h1",
      driver: "particle_beam_shock",
      formation_region: ["photosphere"],
      supporting_observables: [
        { observable_id: "obs_mag", role: "magnetic" },
        { observable_id: "obs_energy", role: "energetic" },
      ],
      confidence: 0.5,
      status: "descriptive",
    };
    const result = surfaceEventOriginHypothesisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("downgrades status for lag mismatch without erasing the hypothesis", () => {
    const hypothesis = surfaceEventOriginHypothesisSchema.parse({
      hypothesis_id: "h2",
      driver: "particle_beam_shock",
      formation_region: ["photosphere", "lower_chromosphere"],
      supporting_observables: [
        { observable_id: "obs_line", role: "radiative" },
        { observable_id: "obs_td", role: "helioseismic" },
      ],
      observed_lag_s: 10,
      predicted_lag_s: 180,
      confidence: 0.74,
      status: "supported",
    });
    const downgraded = downgradeHypothesisStatusForLagMismatch(hypothesis, 30);
    expect(downgraded.status).toBe("descriptive");
    expect(downgraded.hypothesis_id).toBe(hypothesis.hypothesis_id);
  });

  it("keeps anisotropy and ribbon motion out of line-transient objects", () => {
    const invalid = {
      observable_id: "line_obs_1",
      line_id: "Fe_I_6173A",
      width_ref: "artifacts/solar/line-width.json",
      anisotropy_ref: "artifacts/solar/anisotropy.json",
      ribbon_segment: "leading_edge",
    };
    const result = photosphericLineTransientSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("attaches line-profile, magnetogram, and continuum observables in one event bundle", () => {
    const bundle = solarSurfaceEventBundleSchema.parse({
      event_id: "event_2022_05_10_x1p5",
      radiative_observables: [
        {
          schema_version: "shared_observable_contract/v1",
          observable_id: "line_profile_obs",
          lane_id: "stellar_radiation",
          event_id: "event_2022_05_10_x1p5",
          instrument: "SDO_HMI",
          modality: "line_profile",
          axes: [{ name: "time", unit: "s" }],
          data_ref: "artifacts/solar/hmi/line-profile.fits",
          value_unit: "arb",
          coords_ref: "artifacts/solar/hmi/coords.json",
          provenance_ref: { source_id: "hmi_line_profile" },
          claim_tier: "diagnostic",
          provenance_class: "observed",
          observable_role: "radiative",
        },
        {
          schema_version: "shared_observable_contract/v1",
          observable_id: "continuum_obs",
          lane_id: "stellar_radiation",
          event_id: "event_2022_05_10_x1p5",
          instrument: "SDO_HMI",
          modality: "continuum_map",
          axes: [{ name: "time", unit: "s" }],
          data_ref: "artifacts/solar/hmi/continuum.fits",
          value_unit: "arb",
          coords_ref: "artifacts/solar/hmi/coords.json",
          provenance_ref: { source_id: "hmi_continuum" },
          claim_tier: "diagnostic",
          provenance_class: "observed",
          observable_role: "radiative",
        },
      ],
      magnetic_observables: [
        {
          schema_version: "shared_observable_contract/v1",
          observable_id: "magnetogram_obs",
          lane_id: "stellar_radiation",
          event_id: "event_2022_05_10_x1p5",
          instrument: "SDO_HMI",
          modality: "magnetogram",
          axes: [{ name: "time", unit: "s" }],
          data_ref: "artifacts/solar/hmi/magnetogram.fits",
          value_unit: "G",
          coords_ref: "artifacts/solar/hmi/coords.json",
          provenance_ref: { source_id: "hmi_magnetogram" },
          claim_tier: "diagnostic",
          provenance_class: "observed",
          observable_role: "magnetic",
        },
      ],
      surface_impact_observables: [],
      energetic_observables: [],
      helioseismic_observables: [],
      line_transients: [],
      impact_sources: [],
      origin_hypotheses: [],
    });
    expect(bundle.event_id).toBe("event_2022_05_10_x1p5");
    expect(bundle.radiative_observables).toHaveLength(2);
    expect(bundle.magnetic_observables).toHaveLength(1);
  });

  it("ships solar surface-event docs and tree with source links", () => {
    const repoRoot = process.cwd();
    const requiredPaths = [
      "docs/knowledge/physics/physics-solar-surface-event-tree.json",
      "docs/knowledge/physics/solar-sunquake-impact-definition.md",
      "docs/knowledge/physics/solar-photospheric-line-transient-definition.md",
      "docs/knowledge/physics/solar-helioseismic-observable-contract.md",
      "docs/knowledge/physics/solar-surface-origin-hypothesis.md",
      "docs/knowledge/physics/solar-acoustic-holography-definition.md",
    ];
    for (const filePath of requiredPaths) {
      expect(fs.existsSync(path.join(repoRoot, filePath))).toBe(true);
    }

    const sourceDoc = fs.readFileSync(
      path.join(repoRoot, "docs/knowledge/physics/solar-surface-origin-hypothesis.md"),
      "utf8",
    );
    expect(sourceDoc).toContain("https://arxiv.org/abs/1804.06565");
    expect(sourceDoc).toContain("https://arxiv.org/abs/2309.07346");
  });
});
