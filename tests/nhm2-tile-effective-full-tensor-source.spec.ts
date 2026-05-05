import { describe, expect, it } from "vitest";

import {
  buildNhm2TileEffectiveFullTensorSourceArtifact,
  isNhm2TileEffectiveFullTensorSourceArtifact,
} from "../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const profile = "stage1_centerline_alpha_0p995_v1";
const tensor = {
  T00: -1,
  T01: 0,
  T02: 0,
  T03: 0,
  T11: 1,
  T12: 0,
  T13: 0,
  T22: 1,
  T23: 0,
  T33: 1,
};

const region = (regionId: "global" | "hull" | "wall" | "exterior_shell", overrides = {}) => ({
  regionId,
  status: "pass" as const,
  tensorAuthorityMode: "symmetric_full_tensor" as const,
  tensor,
  symmetry: { declared: true, kind: "symmetric" as const, lowerComponentsDerivedBySymmetry: true },
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: `mask.${regionId}`,
  aggregationMode: "mean" as const,
  normalizationBasis: "sample_count" as const,
  sampleCount: 12,
  sourceSupport: {
    supportKernelId: "support.v1",
    cycleAverageStatus: "pass" as const,
    dutyCycleStatus: "pass" as const,
    lightCrossingConsistencyStatus: "pass" as const,
  },
  provenance: {
    producerModule: "tile-source",
    producerFunction: "emit",
    derivationMode: "source_model_reconstituted_full_tensor" as const,
    inputRefs: [`source.${regionId}`],
    preAggregationValueRefs: [`source.pre.${regionId}`],
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: [],
  ...overrides,
});

const artifact = (overrides = {}) =>
  buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: "2026-05-05T00:00:00.000Z",
    runId: "run-1",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "tile-source.v1",
      sourceModelVersion: "v1",
      sourceModelClass: "reconstituted_from_source_channels",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: ["source-input.json"],
      qeiDossierRef: null,
      conservationRef: null,
    },
    regions: [
      region("global"),
      region("hull"),
      region("wall"),
      region("exterior_shell"),
    ],
    literatureRefs: ["fewster_thompson_2023_stationary_worldline_qei"],
    ...overrides,
  });

describe("nhm2 tile-effective full-tensor source contract", () => {
  it("accepts symmetric full tensor with explicit symmetry declaration", () => {
    const built = artifact();
    expect(built.overallState).toBe("pass");
    expect(isNhm2TileEffectiveFullTensorSourceArtifact(built)).toBe(true);
    expect(built.validationClaimAllowed).toBe(false);
    expect(built.physicalMechanismClaimAllowed).toBe(false);
    expect(built.promotionAllowed).toBe(false);
  });

  it("fails metric-required tensor refs as source inputs", () => {
    const built = artifact({
      sourceModel: {
        sourceModelId: "bad",
        sourceModelVersion: "v1",
        sourceModelClass: "metric_echo_forbidden",
        sourceSideOnly: false,
        notDerivedFromMetricRequiredTensor: false,
        metricRequiredInputRefs: ["metric.required.tensor"],
        sourceInputRefs: [],
        qeiDossierRef: null,
        conservationRef: null,
      },
    });
    expect(built.overallState).toBe("fail");
    expect(built.reasonCodes).toContain("metric_required_input_refs_present");
    expect(isNhm2TileEffectiveFullTensorSourceArtifact(built)).toBe(true);
  });

  it("rejects pass status for diagonal-only tensor authority", () => {
    const built = artifact({
      regions: [
        region("global"),
        region("hull", { tensorAuthorityMode: "diagonal_reduced_order", tensor: { T00: -1, T11: 1, T22: 1, T33: 1 } }),
        region("wall"),
        region("exterior_shell"),
      ],
    });
    expect(built.overallState).toBe("review");
    expect(built.reasonCodes).toContain("hull:full_tensor_authority_missing");
  });

  it("requires all four controlled regions", () => {
    const built = artifact({ regions: [region("global"), region("hull"), region("wall")] });
    expect(built.overallState).toBe("fail");
    expect(built.reasonCodes).toContain("missing_required_region:exterior_shell");
  });

  it("keeps unknown basis metadata as review evidence", () => {
    const built = artifact({
      regions: [
        region("global"),
        region("hull", { aggregationMode: "unknown", sampleCount: null }),
        region("wall"),
        region("exterior_shell"),
      ],
    });
    expect(built.overallState).toBe("review");
    expect(built.reasonCodes).toContain("hull:aggregation_mode_unknown");
    expect(built.reasonCodes).toContain("hull:sample_count_missing");
  });
});
