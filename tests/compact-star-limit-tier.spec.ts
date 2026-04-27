import { describe, expect, it } from "vitest";

import {
  classifyLongPeriodPulsarBridgeStatus,
  compactStarObservableContractSchema,
} from "../shared/compact-star-limit-observable";

function makeTierFixture() {
  return {
    schema_version: "shared_observable_contract/v1",
    observable_id: "psr_j0311_limit_fixture",
    lane_id: "compact_star_radio",
    modality: "channel_series",
    axes: [{ name: "channel", unit: "index" }],
    value_unit: "dimensionless",
    provenance_ref: {
      source_id: "askap_psr_j0311+1402",
      citation_refs: ["https://arxiv.org/abs/2503.07936"],
    },
    claim_tier: "diagnostic",
    provenance_class: "observed",
    object_class: "neutron_star",
    observable_kind: "limit_envelope",
    source_name: "PSR J0311+1402",
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
        supporting_observable_refs: ["psr_j0311_limit_fixture"],
      },
    ],
  };
}

describe("compact-star limit-tier guardrails", () => {
  it("forbids phase-1 certified claims for strangeon-star candidates", () => {
    const invalid = {
      ...makeTierFixture(),
      object_class: "strangeon_star_candidate",
      claim_tier: "certified",
      matter_hypotheses: [
        {
          hypothesis_id: "strangeon_h1",
          matter_model: "solid_strangeon_matter",
          status: "candidate",
          supporting_observable_refs: ["psr_j0311_limit_fixture"],
        },
      ],
    };

    const result = compactStarObservableContractSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("keeps zebra-band observables in spectrogram/channel-series modalities", () => {
    const invalid = {
      ...makeTierFixture(),
      observable_kind: "dynamic_spectrum",
      modality: "time_series",
      dynamic_spectrum_features: [
        {
          feature_kind: "zebra_band",
          frequency_min_hz: 8e9,
          frequency_max_hz: 12e9,
        },
      ],
    };
    const result = compactStarObservableContractSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("classifies PSR J0311+1402 as a bridge-case status in helper logic", () => {
    const status = classifyLongPeriodPulsarBridgeStatus({
      source_name: "PSR J0311+1402",
      period_s: 41,
    });
    expect(status).toBe("bridge_case");
  });
});
