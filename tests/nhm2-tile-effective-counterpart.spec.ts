import { describe, expect, it } from "vitest";

import {
  buildNhm2TileEffectiveCounterpartArtifact,
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartRegion,
} from "../shared/contracts/nhm2-tile-effective-counterpart.v1";
import type { Nhm2RegionalSourceClosureRegionId, Nhm2RegionalTensor } from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const profile = "stage1_centerline_alpha_0p995_v1";

const fullTensor = (value: number): Nhm2RegionalTensor => ({
  T00: -value, T01: 0, T02: 0, T03: 0,
  T10: 0, T11: value, T12: 0, T13: 0,
  T20: 0, T21: 0, T22: value, T23: 0,
  T30: 0, T31: 0, T32: 0, T33: value,
});

const region = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  overrides: Partial<Nhm2TileEffectiveCounterpartRegion> = {},
): Nhm2TileEffectiveCounterpartRegion => ({
  regionId,
  status: "pass",
  comparisonRole: "tile_effective_counterpart",
  tensorAuthorityMode: "full_tensor",
  tensor: fullTensor(10),
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: `mask.${regionId}`,
  aggregationMode: "mean",
  normalizationBasis: "sample_count",
  sampleCount: 10,
  provenance: {
    producerModule: "server/stress-energy-brick.ts",
    producerFunction: "buildTileCounterpart",
    inputRefs: [`tile.${regionId}`],
    sourceModelId: "tile-model",
    sourceModelVersion: "v1",
    derivationMode: "tile_model_direct_full_tensor",
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: [],
  ...overrides,
});

const artifact = (
  regions = [region("global"), region("hull"), region("wall"), region("exterior_shell")],
  selectedProfile = profile,
) =>
  buildNhm2TileEffectiveCounterpartArtifact({
    generatedAt: "2026-05-04T00:00:00.000Z",
    runId: "run-1",
    selectedProfileId: selectedProfile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    sourceAuthorityMode: "unknown",
    qeiDossierRef: "qei.json",
    qeiApplicabilityStatus: "PASS",
    quantumStateAssumptions: ["declared state"],
    renormalizationConvention: "declared",
    cavityBoundaryModel: "declared",
    cycleAverageClosureStatus: "pass",
    dutyCycleStatus: "pass",
    lightCrossingConsistencyStatus: "pass",
    conservationDiagnostics: {
      divTStatus: "pass",
      divTResidualLInf: 0,
      continuityResidualLInf: 0,
      momentumResidualLInf: 0,
    },
    regions,
    literatureRefs: ["pfenning_ford_1997_warp_drive_qi_restrictions"],
  });

describe("nhm2 tile-effective counterpart contract", () => {
  it("rejects metric echo as source closure", () => {
    const value = artifact([
      region("global"),
      region("hull", {
        comparisonRole: "metric_echo_diagnostic_only",
        provenance: { ...region("hull").provenance, derivationMode: "metric_echo", notDerivedFromMetricRequiredTensor: false },
      }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(value.overallState).toBe("fail");
    expect(value.reasonCodes).toContain("hull:metric_echo_not_source_closure");
  });

  it("rejects proxy tensor authority for pass", () => {
    const value = artifact([
      region("global"),
      region("hull", { tensorAuthorityMode: "proxy" }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(value.overallState).toBe("fail");
    expect(value.reasonCodes).toContain("hull:proxy_tensor_authority");
  });

  it("rejects diagonal-only tensor authority for promotion", () => {
    const value = artifact([
      region("global"),
      region("hull", { tensorAuthorityMode: "diagonal_reduced_order" }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(value.overallState).toBe("review");
    expect(value.reasonCodes).toContain("hull:full_tensor_authority_missing");
  });

  it("rejects missing controlled regions", () => {
    const value = artifact([region("global"), region("hull"), region("exterior_shell")]);

    expect(value.overallState).toBe("fail");
    expect(value.reasonCodes).toContain("missing_required_region:wall");
  });

  it("rejects mismatched profile", () => {
    const value = artifact(undefined, "stage1_centerline_alpha_0p7000_v1");

    expect(value.profileMatch).toBe(false);
    expect(isNhm2TileEffectiveCounterpartArtifact(value)).toBe(false);
  });

  it("rejects missing QEI linkage for physical-mechanism language", () => {
    const value = buildNhm2TileEffectiveCounterpartArtifact({
      generatedAt: "2026-05-04T00:00:00.000Z",
      runId: "run-1",
      selectedProfileId: profile,
      expectedProfileId: profile,
      laneId: "nhm2_shift_lapse",
      sourceAuthorityMode: "unknown",
      qeiDossierRef: null,
      qeiApplicabilityStatus: "UNKNOWN",
      quantumStateAssumptions: [],
      renormalizationConvention: null,
      cavityBoundaryModel: null,
      cycleAverageClosureStatus: "unknown",
      dutyCycleStatus: "unknown",
      lightCrossingConsistencyStatus: "unknown",
      conservationDiagnostics: {
        divTStatus: "unknown",
        divTResidualLInf: null,
        continuityResidualLInf: null,
        momentumResidualLInf: null,
      },
      regions: [region("global"), region("hull"), region("wall"), region("exterior_shell")],
      literatureRefs: ["fewster_thompson_2023_stationary_worldline_qei"],
    });

    expect(value.physicalMechanismClaimAllowed).toBe(false);
    expect(value.reasonCodes).toContain("qei_not_promotion_safe");
  });

  it("accepts a structurally valid diagnostic fail artifact that identifies blockers", () => {
    const value = artifact([
      region("global"),
      region("hull", { comparisonRole: "gr_matter_channel_observation" }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(value.overallState).toBe("review");
    expect(isNhm2TileEffectiveCounterpartArtifact(value)).toBe(true);
  });

  it("accepts pass-level counterpart candidate only with full tensor and non-metric provenance", () => {
    const value = artifact();

    expect(value.overallState).toBe("pass");
    expect(value.claimEffect).toBe("source_counterpart_candidate");
    expect(value.promotionAllowed).toBe(false);
    expect(value.physicalMechanismClaimAllowed).toBe(false);
    expect(isNhm2TileEffectiveCounterpartArtifact(value)).toBe(true);
  });

  it("accepts explicit global source row provenance without promoting physical claims", () => {
    const value = artifact([
      region("global", {
        provenance: {
          ...region("global").provenance,
          derivationMode: "explicit_global_source_row",
        },
      }),
      region("hull"),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(value.regions.find((entry) => entry.regionId === "global")?.provenance.derivationMode).toBe(
      "explicit_global_source_row",
    );
    expect(value.sourceAuthorityMode).toBe("cycle_averaged_tile_model");
    expect(value.physicalMechanismClaimAllowed).toBe(false);
    expect(isNhm2TileEffectiveCounterpartArtifact(value)).toBe(true);
  });
});
