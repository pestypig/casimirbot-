import { describe, expect, it } from "vitest";
import {
  STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
  starSimArtifactRefSchema,
  starSimRequestSchema,
} from "../server/modules/starsim/contract";

describe("star-sim solar baseline contract", () => {
  it("accepts additive solar baseline sections on requests", () => {
    const parsed = starSimRequestSchema.parse({
      target: {
        object_id: "sun",
        name: "Sun",
      },
      solar_baseline: {
        schema_version: STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION,
        solar_interior_profile: {
          profile_ref: "artifacts/research/starsim/solar/interior/profile.json",
          summary: {
            convection_zone_base_rsun: 0.713,
            envelope_helium_fraction: 0.248,
          },
          metadata: {
            instrument: "MESA+helioseismic-assimilation",
            observed_mode: "assimilated",
          },
        },
        solar_global_modes: {
          mode_table_ref: "artifacts/research/starsim/solar/modes/low-degree.json",
          low_degree_mode_count: 40,
        },
        solar_neutrino_constraints: {
          constraints_ref: "artifacts/research/starsim/solar/neutrinos/closure.json",
          cno_flux: 7.0,
        },
      },
    });

    expect(parsed.solar_baseline?.schema_version).toBe(STAR_SIM_SOLAR_OBSERVED_BASELINE_SCHEMA_VERSION);
    expect(parsed.solar_baseline?.solar_interior_profile?.summary?.convection_zone_base_rsun).toBe(0.713);
    expect(parsed.solar_baseline?.solar_neutrino_constraints?.cno_flux).toBe(7.0);
  });

  it("preserves solar artifact metadata fields on artifact refs", () => {
    const artifactRef = starSimArtifactRefSchema.parse({
      kind: "solar_interior_profile",
      path: "artifacts/research/starsim/solar/interior/profile.json",
      hash: "abc123",
      integrity_status: "verified",
      metadata: {
        time_range: {
          start_iso: "2026-01-01T00:00:00.000Z",
          end_iso: "2026-01-02T00:00:00.000Z",
        },
        cadence: {
          value: 12,
          unit: "s",
        },
        coordinate_frame: "Carrington",
        carrington_rotation: 2290,
        instrument: "SDO/HMI",
        observed_mode: "observed",
        uncertainty_summary: {
          kind: "summary",
          note: "1 sigma aggregate uncertainty",
        },
      },
    });

    expect(artifactRef.metadata?.instrument).toBe("SDO/HMI");
    expect(artifactRef.metadata?.coordinate_frame).toBe("Carrington");
    expect(artifactRef.metadata?.cadence?.value).toBe(12);
    expect(artifactRef.metadata?.observed_mode).toBe("observed");
  });
});
