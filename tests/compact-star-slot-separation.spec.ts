import { describe, expect, it } from "vitest";

import { compactStarLaneBundleSchema } from "../shared/compact-star-limit-observable";

function makeBundle() {
  return {
    schema_version: "compact_star_lane_contract/v1",
    G_geometry: {
      compactness_ref: "artifacts/compact-star/state/compactness.json",
      surface_topography_ref: "artifacts/compact-star/state/surface-topography.json",
      line_of_sight_ref: "artifacts/compact-star/state/los.json",
    },
    F_forcing: {
      gap_electric_field_ref: "artifacts/compact-star/forcing/gap-e-field.json",
      particle_injection_ref: "artifacts/compact-star/forcing/particle-injection.json",
      spin_down_driver_ref: "artifacts/compact-star/forcing/spin-down-driver.json",
    },
    S_state: {
      period_s: 41,
      period_dot: 2.8e-15,
      magnetic_field_ref: "artifacts/compact-star/state/b-field.json",
      plasma_density_profile_ref: "artifacts/compact-star/state/plasma-density.json",
      eos_hypothesis_refs: ["eos_hypothesis_001"],
    },
    C_closure: {
      death_line_model_ref: "closure://death-line/v1",
      vacuum_gap_model_ref: "closure://vacuum-gap/v1",
      pair_cascade_model_ref: "closure://pair-cascade/v1",
      diffraction_screen_model_ref: "closure://diffraction/v1",
      eos_model_refs: ["closure://eos/baseline-v1"],
    },
    O_observables: [
      {
        schema_version: "shared_observable_contract/v1",
        observable_id: "psr_j0311_bridge_limit",
        lane_id: "compact_star_radio",
        modality: "channel_series",
        axes: [
          { name: "channel", unit: "index" },
          { name: "time", unit: "s" },
        ],
        value_unit: "dimensionless",
        provenance_ref: {
          source_id: "askap_psr_j0311+1402",
          citation_refs: ["https://arxiv.org/abs/2503.07936"],
        },
        claim_tier: "diagnostic",
        provenance_class: "observed",
        object_class: "neutron_star",
        observable_kind: "limit_envelope",
        period_s: 41,
        period_dot: 2.8e-15,
        limit_probes: [
          {
            limit_kind: "pulsar_death_line",
            quantity_ref: "artifacts/compact-star/limits/death-line-j0311.json",
            observed_status: "bridge_case",
            evidence_refs: ["https://arxiv.org/abs/2503.07936"],
          },
        ],
        matter_hypotheses: [
          {
            hypothesis_id: "matter_baseline",
            matter_model: "normal_neutron_star_crust",
            status: "candidate",
            supporting_observable_refs: ["psr_j0311_bridge_limit"],
          },
        ],
      },
    ],
  };
}

describe("compact-star slot separation", () => {
  it("accepts lane bundles with geometry and forcing fields in their dedicated slots", () => {
    const parsed = compactStarLaneBundleSchema.parse(makeBundle());
    expect(parsed.G_geometry.surface_topography_ref).toBeTruthy();
    expect(parsed.F_forcing.gap_electric_field_ref).toBeTruthy();
  });

  it("rejects forcing fields in geometry slot and geometry fields in forcing slot", () => {
    const geometryPolluted = {
      ...makeBundle(),
      G_geometry: {
        ...makeBundle().G_geometry,
        gap_electric_field_ref: "artifacts/compact-star/forcing/gap-e-field.json",
      },
    };
    expect(compactStarLaneBundleSchema.safeParse(geometryPolluted).success).toBe(false);

    const forcingPolluted = {
      ...makeBundle(),
      F_forcing: {
        ...makeBundle().F_forcing,
        surface_topography_ref: "artifacts/compact-star/state/surface-topography.json",
      },
    };
    expect(compactStarLaneBundleSchema.safeParse(forcingPolluted).success).toBe(false);
  });
});
