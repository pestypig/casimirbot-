import { describe, expect, it } from "vitest";

import {
  buildNhm2RegionalSourceTensorTargets,
  isNhm2RegionalSourceTensorTargetsArtifact,
} from "../shared/contracts/nhm2-regional-source-tensor-targets.v1";
import type {
  Nhm2RegionalSourceClosureEvidenceArtifact,
  Nhm2RegionalSourceClosureEvidenceRegion,
  Nhm2RegionalSourceClosureRegionId,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const region = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: Nhm2RegionalSourceClosureEvidenceRegion["status"];
  requiredT00: number | null;
  sourceT00: number | null;
  relLInf: number | null;
  pass: boolean | null;
  blockers: string[];
}): Nhm2RegionalSourceClosureEvidenceRegion => ({
  regionId: args.regionId,
  status: args.status,
  comparisonBasisStatus: "same_basis",
  metricRequired: {
    tensorRef: `metric:${args.regionId}`,
    tensorAuthorityMode: "diagonal_reduced_order",
    tensor: { T00: args.requiredT00 },
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "volume",
    sampleCount: 8,
  },
  tileEffectiveCounterpart: {
    tensorRef: `source:${args.regionId}`,
    tensorAuthorityMode: "diagonal_reduced_order",
    tensor: { T00: args.sourceT00 },
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "volume",
    sampleCount: 8,
    comparisonRole: "gr_matter_channel_observation",
  },
  residuals: {
    componentResiduals: {
      T00: {
        metricRequired: args.requiredT00,
        tileEffectiveCounterpart: args.sourceT00,
        absResidual:
          args.requiredT00 == null || args.sourceT00 == null
            ? null
            : Math.abs(args.requiredT00 - args.sourceT00),
        relResidual: args.relLInf,
      },
    },
    relLInf: args.relLInf,
    absLInf:
      args.requiredT00 == null || args.sourceT00 == null
        ? null
        : Math.abs(args.requiredT00 - args.sourceT00),
    toleranceRelLInf: 0.1,
    pass: args.pass,
  },
  blockers: args.blockers,
});

const evidence = (
  overrides: Partial<
    Record<Nhm2RegionalSourceClosureRegionId, Partial<Nhm2RegionalSourceClosureEvidenceRegion>>
  > = {},
): Nhm2RegionalSourceClosureEvidenceArtifact => {
  const regions: Nhm2RegionalSourceClosureEvidenceRegion[] = [
    region({
      regionId: "global",
      status: "review",
      requiredT00: -58267450.98955891,
      sourceT00: -58267450.96267209,
      relLInf: 4.6143808140791624e-10,
      pass: true,
      blockers: [
        "full_tensor_authority_missing",
        "same_basis_metadata_missing",
        "diagonal_reduced_order_tensor_authority",
      ],
    }),
    region({
      regionId: "hull",
      status: "fail",
      requiredT00: -733553902.6786809,
      sourceT00: -16732756.921958108,
      relLInf: 0.9771894650674532,
      pass: false,
      blockers: [
        "counterpart_missing",
        "tile_effective_counterpart_missing",
        "full_tensor_authority_missing",
        "diagonal_reduced_order_tensor_authority",
        "residual_exceeded",
      ],
    }),
    region({
      regionId: "wall",
      status: "fail",
      requiredT00: -1699539201.2526472,
      sourceT00: -27108804644.765415,
      relLInf: 14.950679233985802,
      pass: false,
      blockers: [
        "counterpart_missing",
        "tile_effective_counterpart_missing",
        "full_tensor_authority_missing",
        "diagonal_reduced_order_tensor_authority",
        "residual_exceeded",
      ],
    }),
    region({
      regionId: "exterior_shell",
      status: "fail",
      requiredT00: -1699157799.1011546,
      sourceT00: -5133810475.7006645,
      relLInf: 2.0213853465619396,
      pass: false,
      blockers: [
        "counterpart_missing",
        "tile_effective_counterpart_missing",
        "full_tensor_authority_missing",
        "diagonal_reduced_order_tensor_authority",
        "residual_exceeded",
      ],
    }),
  ].map((entry) => ({ ...entry, ...(overrides[entry.regionId] ?? {}) }));
  return {
    artifactId: "nhm2_regional_source_closure_evidence",
    schemaVersion: "nhm2_regional_source_closure_evidence/v1",
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "nhm2-reference-ledger-2026-05-05-v1",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    expectedProfileId: "stage1_centerline_alpha_0p995_v1",
    profileMatch: true,
    laneId: "nhm2_shift_lapse",
    overallState: "fail",
    claimEffect: "blocked",
    regions,
    requiredRegions: ["global", "hull", "wall", "exterior_shell"],
    missingRequiredRegions: [],
    fullTensorRequiredForPromotion: true,
    diagonalProxyAllowedForPromotion: false,
    literatureRefs: [],
    reasonCodes: [],
  };
};

const build = (fixture = evidence()) =>
  buildNhm2RegionalSourceTensorTargets({
    sourceEvidenceRef: "artifacts/research/full-solve/current/regional.json",
    regionalSourceClosureEvidence: fixture,
    generatedAt: "2026-06-12T00:00:00.000Z",
  });

describe("nhm2_regional_source_tensor_targets/v1", () => {
  it("reports current per-region T00 multipliers and directions", () => {
    const artifact = build();
    const byRegion = new Map(artifact.regions.map((entry) => [entry.regionId, entry]));

    expect(byRegion.get("hull")?.requiredOverCurrentSource).toBeCloseTo(
      43.8393927611565,
      10,
    );
    expect(byRegion.get("hull")?.tuningDirection).toBe("increase_magnitude");
    expect(byRegion.get("wall")?.requiredOverCurrentSource).toBeCloseTo(
      0.0626932549599091,
      12,
    );
    expect(byRegion.get("wall")?.tuningDirection).toBe("decrease_magnitude");
    expect(byRegion.get("exterior_shell")?.requiredOverCurrentSource).toBeCloseTo(
      0.330974002087456,
      12,
    );
    expect(byRegion.get("exterior_shell")?.tuningDirection).toBe("decrease_magnitude");
  });

  it("keeps globally aligned scalar T00 blocked when tensor authority is incomplete", () => {
    const artifact = build();
    const global = artifact.regions.find((entry) => entry.regionId === "global");

    expect(global?.scalarT00WithinTolerance).toBe(true);
    expect(global?.tuningDirection).toBe("hold");
    expect(global?.blockers).not.toContain("scalar_T00_outside_tolerance");
    expect(global?.blockers).toContain("regional_tensor_authority_incomplete");
    expect(global?.blockers).toContain("same_basis_metadata_or_aggregation_incomplete");
    expect(artifact.summary.allScalarT00WithinTolerance).toBe(false);
  });

  it("does not turn scalar targets into physical or transport claims", () => {
    const artifact = build();

    expect(artifact.claimBoundary.diagnosticOnly).toBe(true);
    expect(artifact.claimBoundary.scalarTargetsDoNotValidateSource).toBe(true);
    expect(artifact.claimBoundary.physicalClaimAllowed).toBe(false);
    expect(artifact.claimBoundary.transportClaimAllowed).toBe(false);
    expect(isNhm2RegionalSourceTensorTargetsArtifact(artifact)).toBe(true);
  });

  it("marks zero source T00 as unavailable instead of producing an infinite multiplier", () => {
    const fixture = evidence({
      hull: {
        tileEffectiveCounterpart: {
          ...evidence().regions.find((entry) => entry.regionId === "hull")
            ?.tileEffectiveCounterpart,
          tensor: { T00: 0 },
        } as Nhm2RegionalSourceClosureEvidenceRegion["tileEffectiveCounterpart"],
        residuals: {
          ...evidence().regions.find((entry) => entry.regionId === "hull")!.residuals,
          pass: null,
          relLInf: null,
        },
      },
    });
    const artifact = build(fixture);
    const hull = artifact.regions.find((entry) => entry.regionId === "hull");

    expect(hull?.requiredOverCurrentSource).toBeNull();
    expect(hull?.tuningDirection).toBe("missing");
    expect(hull?.blockers).toContain("current_source_T00_zero");
    expect(hull?.blockers).toContain("regional_T00_multiplier_unavailable");
  });
});
