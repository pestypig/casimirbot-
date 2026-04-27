import { describe, expect, it } from "vitest";

import { compactStarObservableContractSchema } from "../shared/compact-star-limit-observable";

function makeBaseObservable() {
  return {
    schema_version: "shared_observable_contract/v1",
    observable_id: "crab_zebra_8to12ghz",
    lane_id: "compact_star_radio",
    modality: "spectrogram",
    axes: [
      { name: "frequency", unit: "Hz", physical_type: "em.frequency", monotonic: true },
      { name: "time", unit: "s", physical_type: "time", monotonic: true },
    ],
    data_ref: "artifacts/compact-star/crab/zebra-spectrogram.json",
    value_unit: "Jy",
    provenance_ref: {
      source_id: "crab_radio_dynamic_spectrum",
      source_family: "radio_observatory",
      citation_refs: ["https://link.aps.org/doi/10.1103/PhysRevLett.133.205201"],
    },
    claim_tier: "diagnostic",
    provenance_class: "observed",
    object_class: "neutron_star",
    observable_kind: "dynamic_spectrum",
    source_name: "Crab Pulsar",
    period_s: 0.033,
    period_dot: 4.2e-13,
    dynamic_spectrum_features: [
      {
        feature_kind: "zebra_band",
        frequency_min_hz: 8e9,
        frequency_max_hz: 12e9,
        band_spacing_model: "proportional",
        fit_summary_ref: "artifacts/compact-star/crab/zebra-fit-summary.json",
      },
    ],
    limit_probes: [
      {
        limit_kind: "magnetosphere_diffraction_tomography",
        quantity_ref: "artifacts/compact-star/crab/diffraction-band-spacing.json",
        observed_status: "outside_expected_envelope",
        evidence_refs: ["artifacts/compact-star/crab/psd.json"],
      },
    ],
    matter_hypotheses: [
      {
        hypothesis_id: "matter_hypothesis_baseline",
        matter_model: "normal_neutron_star_crust",
        status: "candidate",
        supporting_observable_refs: ["crab_zebra_8to12ghz"],
      },
    ],
  };
}

describe("compact star observable contract", () => {
  it("accepts a diagnostic compact-star dynamic-spectrum observable with evidence-bounded fields", () => {
    const result = compactStarObservableContractSchema.parse(makeBaseObservable());
    expect(result.observable_kind).toBe("dynamic_spectrum");
    expect(result.dynamic_spectrum_features?.[0]?.feature_kind).toBe("zebra_band");
  });

  it("requires period/Pdot or substitute state ref for death-line probes", () => {
    const probeMissingState = {
      ...makeBaseObservable(),
      period_s: undefined,
      period_dot: undefined,
      limit_probes: [
        {
          limit_kind: "pulsar_death_line",
          quantity_ref: "artifacts/compact-star/psr-j0311/death-line-state.json",
          observed_status: "bridge_case",
          evidence_refs: ["https://arxiv.org/abs/2503.07936"],
        },
      ],
    };
    const result = compactStarObservableContractSchema.safeParse(probeMissingState);
    expect(result.success).toBe(false);

    const withSubstitute = {
      ...probeMissingState,
      limit_probes: [
        {
          limit_kind: "pulsar_death_line",
          quantity_ref: "artifacts/compact-star/psr-j0311/death-line-state.json",
          observed_status: "bridge_case",
          evidence_refs: ["https://arxiv.org/abs/2503.07936"],
          substitute_state_ref: "artifacts/compact-star/psr-j0311/substitute-state.json",
        },
      ],
    };
    expect(compactStarObservableContractSchema.safeParse(withSubstitute).success).toBe(true);
  });
});
