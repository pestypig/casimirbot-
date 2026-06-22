import { describe, expect, it } from "vitest";

import {
  buildNhm2SourceClosureArtifact,
  NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
  NHM2_SOURCE_CLOSURE_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-source-closure.v1";
import {
  buildNhm2SourceClosureArtifactV2,
  computeNhm2PressureSignificanceFloor,
  isNhm2SourceClosureV2Artifact,
  NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-source-closure.v2";
import {
  buildNhm2SourceSideSameBasisTensorAuthorityArtifact,
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
} from "../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import type { Nhm2TileSourceAuthorityHandoffV1 } from "../shared/contracts/nhm2-tile-source-authority-handoff.v1";
import { buildNhm2SameChartFullTensorArtifact } from "../shared/contracts/nhm2-same-chart-full-tensor.v1";
import {
  buildNhm2WallSourceClosureArtifact,
  isNhm2WallSourceClosureArtifact,
} from "../shared/contracts/nhm2-wall-source-closure.v1";
import { buildCasimirMaterialReceipt } from "../shared/contracts/casimir-material-receipt.v1";

const makeMaterialReceiptedCasimirReceipt = () =>
  buildCasimirMaterialReceipt({
    generatedAt: "2026-06-09T00:00:00.000Z",
    tileBatchId: "tile_batch:wall-receipted",
    geometry: {
      gapMeters: 1e-9,
      gapMetrologyStatus: "measured",
      roughnessRmsMeters: 1e-10,
      beyondPfaValidity: "pass",
    },
    material: {
      modelKind: "lifshitz",
      dielectricResponseRef: "artifact://dielectric/au",
      finiteConductivityIncluded: true,
      finiteTemperatureIncluded: true,
      roughnessCorrectionIncluded: true,
    },
    environment: {
      vacuumSealEvidence: "present",
      temperatureK: 300,
    },
    correctionFactors: {
      conductivity: 0.82,
      temperature: 0.98,
      roughness: 0.94,
      geometry: 0.91,
    },
  });

const makeTileSourceAuthorityHandoff = (args: {
  ready: boolean;
  fullApparatusComponentDetailRefsReady?: boolean;
  firstBlocker?: string;
}): Nhm2TileSourceAuthorityHandoffV1 => {
  const fullApparatusComponentDetailRefsReady =
    args.fullApparatusComponentDetailRefsReady ?? args.ready;
  const firstBlocker = args.ready ? "none" : args.firstBlocker ?? "material_coupon_receipt_missing";
  const gateStatus = args.ready ? "pass" : "missing";
  const firstRequiredCorrections = args.ready ? {} : { missingReceiptSurface: firstBlocker };
  return {
    contractVersion: "nhm2_tile_source_authority_handoff/v1",
    generatedAt: "2026-06-11T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      materialEvidenceReceiptsRef: "artifact://tile-source/material-evidence",
      physicalValidationPlanRef: "artifact://tile-source/validation-plan",
      falsificationReportRef: "artifact://tile-source/falsification-report",
      operatingBudgetReadinessRef: "artifact://tile-source/operating-budget-readiness",
      fullApparatusTensorOperatingBudgetRef:
        "artifact://tile-source/full-apparatus-tensor-operating-budget",
      targetAuthorityContractRef: "nhm2_source_side_same_basis_tensor_authority/v1",
    },
    handoffTarget: {
      targetContractVersion: "nhm2_source_side_same_basis_tensor_authority/v1",
      requiresSameChart: true,
      requiresSameBasis: true,
      requiresSameUnits: true,
      requiresFullComponents: ["T00", "T0i", "diagonalTij", "offDiagonalTij"],
      requiresTensorComponents: [
        "T00",
        "T01",
        "T02",
        "T03",
        "T11",
        "T12",
        "T13",
        "T22",
        "T23",
        "T33",
      ],
      requiresRegions: ["wall", "hull", "exterior_shell"],
      metricTargetEchoForbidden: true,
    },
    gates: [
      "material_receipts",
      "full_apparatus_tensor",
      "source_authority_metadata",
      "component_coverage",
      "component_detail_refs",
      "regional_coverage",
      "no_metric_target_echo",
      "operating_budget_readiness",
      "falsification_report",
    ].map((gateId) => ({
      gateId: gateId as Nhm2TileSourceAuthorityHandoffV1["gates"][number]["gateId"],
      status:
        gateId === "component_detail_refs" && !fullApparatusComponentDetailRefsReady
          ? "missing"
          : gateStatus,
      blockers:
        gateId === "component_detail_refs" && !fullApparatusComponentDetailRefsReady
          ? ["full_apparatus_T01_ref_missing_for_operating_budget"]
          : args.ready
            ? []
            : [firstBlocker],
      requiredChange: "Supply material-source evidence before same-basis authority.",
      requiredCorrections:
        args.ready
          ? {}
          : gateId === "component_detail_refs" && !fullApparatusComponentDetailRefsReady
            ? {
                tensorComponentRefMissingCount: 1,
                missingTensorComponentIds: ["T01"],
              }
            : firstRequiredCorrections,
    })),
    summary: {
      handoffStatus: args.ready ? "handoff_ready" : "blocked",
      handoffReadyForSameBasisAuthority: args.ready,
      materialEvidenceReady: args.ready,
      fullApparatusTensorReady: args.ready,
      fullApparatusComponentDetailRefsReady,
      sourceAuthorityEvidenceReady: args.ready,
      allReceiptsPresent: args.ready,
      operatingBudgetsReady: args.ready,
      operatingBudgetsFalsifyCurrentCandidate: false,
      physicalValidationStillRequired: true,
      firstBlocker,
      firstRequiredCorrections,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      handoffOnly: true,
      handoffDoesNotRunSameBasisAuthority: true,
      handoffDoesNotRunDownstreamGates: true,
      operatingBudgetReadinessDoesNotValidateMaterialSource: true,
      handoffReadyIsNotPhysicalCredibility: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

describe("nhm2 source closure artifact", () => {
  it("represents matched tensors honestly", () => {
    const artifact = buildNhm2SourceClosureArtifact({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.artifactId).toBe(NHM2_SOURCE_CLOSURE_ARTIFACT_ID);
    expect(artifact.schemaVersion).toBe(NHM2_SOURCE_CLOSURE_SCHEMA_VERSION);
    expect(artifact.status).toBe("pass");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual([]);
    expect(artifact.residualNorms.relLInf).toBe(0);
    expect(artifact.scalarProjections.metricVsTileT00Rel).toBe(0);
    expect(artifact.sampledSummaries.status).toBe("available");
    expect(artifact.sampledSummaries.regions[0]?.regionId).toBe("global");
  });

  it("blocks tensor-complete closure when no tolerance is declared", () => {
    const artifact = buildNhm2SourceClosureArtifact({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toContain("tolerance_missing");
    expect(artifact.residualNorms.pass).toBeNull();
    expect(artifact.residualNorms.toleranceRelLInf).toBeNull();
  });

  it("fails when tensor closure diverges even if scalar T00 agrees", () => {
    const artifact = buildNhm2SourceClosureArtifact({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 60,
        T22: 55,
        T33: 50,
      },
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toContain("tensor_residual_exceeded");
    expect((artifact.residualNorms.relLInf ?? 0) > 0.1).toBe(true);
    expect(artifact.scalarProjections.metricVsTileT00Rel).toBe(0);
  });

  it("keeps same-basis global closure in review when comparison assumptions drift", () => {
    const artifact = buildNhm2SourceClosureArtifact({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef:
        "gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      toleranceRelLInf: 0.1,
      assumptionsDrifted: true,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual(["assumption_drift"]);
    expect(artifact.residualNorms.relLInf).toBe(0);
  });

  it("marks missing tensor inputs as unavailable instead of synthetic success", () => {
    const artifact = buildNhm2SourceClosureArtifact({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
      },
      tileEffectiveTensor: null,
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0.02,
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining(["metric_tensor_incomplete", "tile_tensor_missing"]),
    );
    expect(artifact.residualNorms.relLInf).toBeNull();
    expect(artifact.sampledSummaries.status).toBe("unavailable");
  });
});

describe("nhm2 source-side same-basis tensor authority receipt", () => {
  it("marks wall authority incomplete when source closure only has a diagonal projection", () => {
    const receipt = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-11T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      requiredRegionIds: ["wall"],
      sourceClosureRegions: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          comparisonBasisAuthorityStatus: "authoritative_same_basis",
          regionalComparisonContractStatus: "same_basis_counterpart_available",
          resolvedTileCounterpartRef: "artifact://tile-wall/direct-t00",
          tileTensorRef: "artifact://tile-wall/diagonal",
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileT00Diagnostics: {
            sourceRef: "artifact://tile-wall/direct-t00",
            trace: {
              valueRef: "artifact://tile-wall/direct-t00",
              pathFacts: {
                comparisonRole: "tile_effective_counterpart",
                expectedCounterpartRole: "metric_required_reference",
                semanticEquivalenceExpected: true,
              },
            },
          },
        },
      ],
    });

    expect(isNhm2SourceSideSameBasisTensorAuthorityArtifact(receipt)).toBe(true);
    expect(receipt.summary.hasWallAuthority).toBe(false);
    expect(receipt.summary.allRequiredRegionsAuthoritative).toBe(false);
    expect(receipt.regions[0]).toMatchObject({
      regionId: "wall",
      status: "proxy_limited",
      sourceTensorRef: "artifact://tile-wall/direct-t00",
      comparisonRole: "tile_effective_counterpart",
      tensorAuthorityMode: "diagonal_reduced_order",
    });
    expect(receipt.regions[0]?.missingComponentIds).toEqual(
      expect.arrayContaining(["T01", "T02", "T03", "T12", "T13", "T23"]),
    );
    expect(receipt.regions[0]?.blockers).toContain(
      "source_side_full_tensor_components_missing",
    );
    expect(receipt.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      doesNotValidatePhysicalSource: true,
      metricEchoForbidden: true,
      wallT00ClosureRequiresWallAuthority: true,
    });
  });

  it("can represent an explicit full source-side tensor authority receipt without calculator promotion", () => {
    const receipt = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-11T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      requiredRegionIds: ["wall"],
      sourceClosureRegions: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          comparisonBasisAuthorityStatus: "authoritative_same_basis",
          regionalComparisonContractStatus: "same_basis_counterpart_available",
          resolvedTileCounterpartRef: "artifact://tile-wall/full-tensor",
          tileTensorRef: "artifact://tile-wall/full-tensor",
          sourceSideSameBasisAuthorityStatus: "authoritative_same_basis",
          sourceSideAuthorityRef: "artifact://tile-wall/full-tensor",
          sourceSideFullTensorMissingComponentIds: [],
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileT00Diagnostics: {
            sourceRef: "artifact://tile-wall/full-tensor",
            trace: {
              valueRef: "artifact://tile-wall/full-tensor",
              pathFacts: {
                comparisonRole: "tile_effective_counterpart",
                expectedCounterpartRole: "metric_required_reference",
                semanticEquivalenceExpected: true,
              },
            },
          },
        },
      ],
    });

    expect(receipt.summary.hasWallAuthority).toBe(true);
    expect(receipt.summary.allRequiredRegionsAuthoritative).toBe(true);
    expect(receipt.regions[0]?.status).toBe("authoritative_same_basis");
    expect(receipt.regions[0]?.blockers).toEqual([]);
    expect(receipt.claimBoundary.diagnosticOnly).toBe(true);
    expect(receipt.claimBoundary.doesNotValidatePhysicalSource).toBe(true);
  });

  it("blocks otherwise authoritative tensor regions when supplied tile-source handoff is not ready", () => {
    const receipt = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-11T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      requiredRegionIds: ["wall"],
      tileSourceAuthorityHandoffRef: "artifact://tile-source/handoff-blocked",
      tileSourceAuthorityHandoff: makeTileSourceAuthorityHandoff({
        ready: false,
        firstBlocker: "thermal_cycle_drift_above_0p01_operating_budget",
      }),
      sourceClosureRegions: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          comparisonBasisAuthorityStatus: "authoritative_same_basis",
          regionalComparisonContractStatus: "same_basis_counterpart_available",
          resolvedTileCounterpartRef: "artifact://tile-wall/full-tensor",
          tileTensorRef: "artifact://tile-wall/full-tensor",
          sourceSideSameBasisAuthorityStatus: "authoritative_same_basis",
          sourceSideAuthorityRef: "artifact://tile-wall/full-tensor",
          sourceSideFullTensorMissingComponentIds: [],
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileT00Diagnostics: {
            sourceRef: "artifact://tile-wall/full-tensor",
            trace: {
              valueRef: "artifact://tile-wall/full-tensor",
              pathFacts: {
                comparisonRole: "tile_effective_counterpart",
                expectedCounterpartRole: "metric_required_reference",
                semanticEquivalenceExpected: true,
              },
            },
          },
        },
      ],
    });

    expect(isNhm2SourceSideSameBasisTensorAuthorityArtifact(receipt)).toBe(true);
    expect(receipt.tileSourceAuthorityHandoffStatus).toBe("blocked");
    expect(receipt.summary.tileSourceHandoffReady).toBe(false);
    expect(receipt.summary.tileSourceHandoffRequiredCorrections).toMatchObject({
      missingReceiptSurface: "thermal_cycle_drift_above_0p01_operating_budget",
      "material_receipts.missingReceiptSurface":
        "thermal_cycle_drift_above_0p01_operating_budget",
    });
    expect(receipt.summary.hasWallAuthority).toBe(false);
    expect(receipt.summary.allRequiredRegionsAuthoritative).toBe(false);
    expect(receipt.regions[0]).toMatchObject({
      regionId: "wall",
      status: "blocked",
      sourceTensorRef: "artifact://tile-wall/full-tensor",
      hasFullTensorComponents: true,
      notDerivedFromMetricRequiredTensor: true,
    });
    expect(receipt.regions[0]?.handoffRequiredCorrections).toMatchObject({
      missingReceiptSurface: "thermal_cycle_drift_above_0p01_operating_budget",
    });
    expect(receipt.regions[0]?.blockers).toEqual(
      expect.arrayContaining([
        "tile_source_authority_handoff_not_ready",
        "thermal_cycle_drift_above_0p01_operating_budget",
      ]),
    );
    expect(receipt.regions[0]?.warnings).toContain(
      "tile_source_handoff_admission_gate_blocks_source_authority",
    );
  });

  it("uses a ready tile-source handoff only as blocked evidence intake when tensor values are absent", () => {
    const receipt = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-11T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      requiredRegionIds: ["wall"],
      tileSourceAuthorityHandoffRef: "artifact://tile-source/handoff-ready",
      tileSourceAuthorityHandoff: makeTileSourceAuthorityHandoff({ ready: true }),
    });

    expect(isNhm2SourceSideSameBasisTensorAuthorityArtifact(receipt)).toBe(true);
    expect(receipt.tileSourceAuthorityHandoffRef).toBe("artifact://tile-source/handoff-ready");
    expect(receipt.tileSourceAuthorityHandoffStatus).toBe("handoff_ready");
    expect(receipt.summary.tileSourceHandoffReady).toBe(true);
    expect(receipt.summary.hasWallAuthority).toBe(false);
    expect(receipt.summary.allRequiredRegionsAuthoritative).toBe(false);
    expect(receipt.regions[0]).toMatchObject({
      regionId: "wall",
      status: "blocked",
      sourceTensorRef: null,
      comparisonRole: "tile_source_material_evidence_handoff",
      derivationMode: "tile_source_material_evidence_handoff",
      notDerivedFromMetricRequiredTensor: true,
      hasFullTensorComponents: false,
    });
    expect(receipt.regions[0]?.missingComponentIds).toEqual(
      expect.arrayContaining(["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"]),
    );
    expect(receipt.regions[0]?.blockers).toContain(
      "tile_source_handoff_does_not_supply_tensor_values",
    );
    expect(receipt.regions[0]?.warnings).toContain(
      "tile_source_handoff_is_evidence_intake_not_tensor_authority",
    );
  });

  it("propagates not-ready tile-source handoff blockers into same-basis authority without promotion", () => {
    const receipt = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-11T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      requiredRegionIds: ["wall"],
      tileSourceAuthorityHandoffRef: "artifact://tile-source/handoff-blocked",
      tileSourceAuthorityHandoff: makeTileSourceAuthorityHandoff({
        ready: false,
        fullApparatusComponentDetailRefsReady: false,
        firstBlocker: "full_apparatus_T01_ref_missing_for_operating_budget",
      }),
    });

    expect(receipt.tileSourceAuthorityHandoffStatus).toBe("blocked");
    expect(receipt.summary.tileSourceHandoffReady).toBe(false);
    expect(receipt.summary.tileSourceHandoffRequiredCorrections).toMatchObject({
      missingReceiptSurface: "full_apparatus_T01_ref_missing_for_operating_budget",
      "component_detail_refs.tensorComponentRefMissingCount": 1,
      "component_detail_refs.missingTensorComponentIds": ["T01"],
    });
    expect(receipt.summary.hasWallAuthority).toBe(false);
    expect(receipt.regions[0]?.status).toBe("blocked");
    expect(receipt.regions[0]?.notDerivedFromMetricRequiredTensor).toBeNull();
    expect(receipt.regions[0]?.handoffRequiredCorrections).toMatchObject({
      missingReceiptSurface: "full_apparatus_T01_ref_missing_for_operating_budget",
      "component_detail_refs.tensorComponentRefMissingCount": 1,
    });
    expect(receipt.regions[0]?.blockers).toEqual(
      expect.arrayContaining([
        "tile_source_authority_handoff_not_ready",
        "tile_source_handoff_does_not_supply_tensor_values",
        "full_apparatus_component_detail_refs_incomplete",
        "full_apparatus_T01_ref_missing_for_operating_budget",
      ]),
    );
  });
});

describe("nhm2 source closure artifact v2", () => {
  const makeAccounting = (sampleCount: number, note: string) => ({
    sampleCount,
    maskVoxelCount: sampleCount,
    weightSum: sampleCount,
    aggregationMode: "mean" as const,
    normalizationBasis: "sample_count",
    regionMaskNote: "mask",
    supportInclusionNote: note,
    evidenceStatus: "measured" as const,
  });
  const makeT00Diagnostics = (sampleCount: number, meanT00: number) => ({
    sampleCount,
    includedCount: sampleCount,
    skippedCount: 0,
    nonFiniteCount: 0,
    meanT00,
    sumT00: sampleCount * meanT00,
    normalizationBasis: "sample_count",
    aggregationMode: "mean" as const,
    evidenceStatus: "measured" as const,
  });
  const makeT00Trace = (args: {
    sampleCount: number;
    valueRef: string;
    tensorRef: string;
    boundaryRef?: string | null;
    traceStage:
      | "region_mean_from_shift_field"
      | "region_mean_from_gr_matter_brick"
      | "tensor_snapshot_fallback";
    pathFacts?: Record<string, unknown> | null;
  }) => ({
    regionMaskRef: "gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask",
    sampleCount: args.sampleCount,
    normalizationBasis: "sample_count",
    aggregationMode: "mean" as const,
    valueRef: args.valueRef,
    tensorRef: args.tensorRef,
    boundaryRef: args.boundaryRef ?? null,
    maskNote: "shared wall brick mask",
    supportInclusionNote: "shared wall support set",
    traceStage: args.traceStage,
    pathFacts: args.pathFacts ?? null,
  });

  it("passes when global and required regional comparisons are same-basis and within tolerance", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull", "wall"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 16,
          metricAccounting: makeAccounting(16, "metric"),
          tileAccounting: makeAccounting(16, "tile"),
          metricT00Diagnostics: makeT00Diagnostics(16, -50),
          tileT00Diagnostics: makeT00Diagnostics(16, -50),
        },
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -40, T11: 40, T22: 40, T33: 40 },
          tileEffectiveTensor: { T00: -40.5, T11: 40.5, T22: 40.5, T33: 40.5 },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeT00Diagnostics(8, -40),
          tileT00Diagnostics: makeT00Diagnostics(8, -40.5),
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(isNhm2SourceClosureV2Artifact(artifact)).toBe(true);
    expect(artifact.schemaVersion).toBe(NHM2_SOURCE_CLOSURE_V2_SCHEMA_VERSION);
    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining([
        "source_side_same_basis_authority_missing",
        "wall_source_side_same_basis_authority_missing",
        "assumption_drift",
      ]),
    );
    expect(artifact.assumptionsDrifted).toBe(true);
    expect(artifact.regionComparisons.regions.map((entry) => entry.status)).toEqual([
      "pass",
      "pass",
    ]);
    for (const region of artifact.regionComparisons.regions) {
      expect(region.dominantResidualComponent).toBe("T00");
      expect(region.dominantResidualRel).toBe(
        region.residualComponents.T00.relResidual,
      );
      expect(region.metricAccounting?.aggregationMode).toBe("mean");
      expect(region.tileAccounting?.aggregationMode).toBe("mean");
      expect(region.metricAccounting?.evidenceStatus).toBe("measured");
      expect(region.tileAccounting?.evidenceStatus).toBe("measured");
      expect(region.metricT00Diagnostics?.aggregationMode).toBe("mean");
      expect(region.tileT00Diagnostics?.aggregationMode).toBe("mean");
      expect(region.metricT00Diagnostics?.evidenceStatus).toBe("measured");
      expect(region.tileT00Diagnostics?.evidenceStatus).toBe("measured");
      expect(region.tileProxyDiagnostics).toBeNull();
      expect(region.sourceSideSameBasisAuthorityStatus).not.toBe(
        "authoritative_same_basis",
      );
      expect(region.mismatchDiagnostics).toBeTruthy();
      expect(region.mismatchDiagnostics?.components.T00.ratioTileToMetric).not.toBeNull();
      expect(region.mismatchDiagnostics?.components.T00.signedRatioTileToMetric).not.toBeNull();
      expect(region.mismatchDiagnostics?.components.T00.signMatch).toBe(true);
      expect(region.mismatchDiagnostics?.diagonalSignStatus).toBe("match");
    }
  });

  it("preserves regional metric-required same-chart full tensor artifacts", () => {
    const metricRequiredSameChartFullTensor =
      buildNhm2SameChartFullTensorArtifact({
        generatedAt: "2026-06-12T00:00:00.000Z",
        laneId: "nhm2_shift_lapse",
        selectedProfileId: "stage1_centerline_alpha_0p995_v1",
        chartId: "ship_comoving_cartesian",
        metricFamily: "nhm2_shift_lapse",
        routeId: "adm_quasi_stationary_recovery_v1",
        source: "adm_projection",
        artifactRef: "artifact://metric-wall.same-chart-full-tensor",
        tensor: {
          T00: -50,
          T01: 1,
          T02: 2,
          T03: 3,
          T11: 50,
          T12: 4,
          T13: 5,
          T22: 50,
          T23: 6,
          T33: 50,
        },
      });

    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
      tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          metricRequiredSameChartFullTensor,
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          metricT00Diagnostics: makeT00Diagnostics(8, -50),
          tileT00Diagnostics: makeT00Diagnostics(8, -50),
        },
      ],
      toleranceRelLInf: 0.1,
    });

    const wall = artifact.regionComparisons.regions[0];
    expect(wall.metricRequiredSameChartFullTensor).toEqual(
      metricRequiredSameChartFullTensor,
    );
    expect(
      wall.metricRequiredSameChartFullTensor?.completeness.fullTensorComplete,
    ).toBe(true);
    expect(isNhm2SourceClosureV2Artifact(artifact)).toBe(true);
  });

  it("fails when a same-basis required region exceeds tolerance", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -10, T11: 10, T22: 10, T33: 10 },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeT00Diagnostics(8, -100),
          tileT00Diagnostics: makeT00Diagnostics(8, -10),
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toContain("tensor_residual_exceeded");
    expect(artifact.reasonCodes).toContain("wall_source_side_same_basis_authority_missing");
    expect(artifact.assumptionsDrifted).toBe(true);
    expect(isNhm2WallSourceClosureArtifact(artifact.wallSourceClosure)).toBe(true);
    expect(artifact.wallSourceClosure.residual.pass).toBe(false);
    expect(artifact.wallSourceClosure.required.T00_SI).toBe(-100);
    expect(artifact.wallSourceClosure.available.T00_SI).toBe(-10);
    expect(artifact.wallSourceClosure.blockers).toContain(
      "wall_T00_source_residual_exceeds_tolerance",
    );
    expect(artifact.regionComparisons.regions[0]?.status).toBe("fail");
    expect((artifact.regionComparisons.regions[0]?.residualNorms.relLInf ?? 0) > 0.1).toBe(
      true,
    );
    expect(artifact.regionComparisons.regions[0]?.dominantResidualComponent).toBe("T00");
    expect(artifact.regionComparisons.regions[0]?.dominantResidualRel).toBe(
      artifact.regionComparisons.regions[0]?.residualComponents.T00.relResidual,
    );
  });

  it("keeps diagnostic-only regional comparisons in review", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "diagnostic_only",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 16,
          metricAccounting: makeAccounting(16, "metric"),
          tileAccounting: makeAccounting(16, "tile"),
          note: "global metric substitution remains diagnostic only",
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining(["region_basis_diagnostic_only", "assumption_drift"]),
    );
    expect(artifact.assumptionsDrifted).toBe(true);
    expect(artifact.regionComparisons.regions[0]?.status).toBe("review");
  });

  it("classifies t00 mismatch from truthful inferred evidence and blocks near-zero pressure dominance when scale-aware pressure floor exceeds fallback", () => {
    const makeInferredT00Diagnostics = (sampleCount: number, meanT00: number) => ({
      sampleCount,
      includedCount: sampleCount,
      skippedCount: null,
      nonFiniteCount: null,
      meanT00,
      sumT00: sampleCount * meanT00,
      normalizationBasis: "sample_count",
      aggregationMode: "mean" as const,
      evidenceStatus: "inferred" as const,
    });
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      requiredRegionIds: ["wall", "hull"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 10, T22: 10, T33: 10 },
          tileEffectiveTensor: { T00: -300, T11: 10, T22: 10, T33: 10 },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeInferredT00Diagnostics(8, -100),
          tileT00Diagnostics: makeInferredT00Diagnostics(8, -300),
        },
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -100, T11: 1_000_000, T22: -1e-11, T33: 1e-11 },
          tileEffectiveTensor: {
            T00: -100,
            T11: 1_000_000 + 1e-9,
            T22: -1.3e-11,
            T33: 1.3e-11,
          },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeInferredT00Diagnostics(8, -100),
          tileT00Diagnostics: makeInferredT00Diagnostics(8, -100),
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });
    const wall = artifact.regionComparisons.regions.find((region) => region.regionId === "wall");
    const hull = artifact.regionComparisons.regions.find((region) => region.regionId === "hull");
    expect(wall?.mismatchDiagnostics?.t00MechanismCategory).toBe("t00_mismatch_present");
    expect(wall?.mismatchDiagnostics?.t00MechanismEvidenceStatus).toBe("inferred");
    expect(wall?.mismatchDiagnostics?.t00MechanismNextStep).toBe(
      "direct_t00_source_model_mapping",
    );
    expect(hull?.mismatchDiagnostics?.t00MechanismCategory).toBe("unknown");
    expect(hull?.mismatchDiagnostics?.t00MechanismEvidenceStatus).toBe("inferred");
    expect(hull?.mismatchDiagnostics?.t00MechanismNextStep).toBe("insufficient_evidence");
    const hullPressureFloor = computeNhm2PressureSignificanceFloor(hull!.residualComponents);
    expect(hull!.residualComponents.T11.absResidual).toBeGreaterThan(1e-12);
    expect(Math.abs(hull!.residualComponents.T22.relResidual ?? 0)).toBeGreaterThan(0.1);
    expect(hullPressureFloor).toBeGreaterThan(1e-12);
    expect(hullPressureFloor).toBeGreaterThan(
      hull!.residualComponents.T11.absResidual ?? 0,
    );
  });

  it("emits a missing wall artifact instead of letting global closure stand alone", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      requiredRegionIds: ["wall"],
      regionComparisons: [],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("unavailable");
    expect(isNhm2WallSourceClosureArtifact(artifact.wallSourceClosure)).toBe(true);
    expect(artifact.wallSourceClosure.residual.pass).toBeNull();
    expect(artifact.wallSourceClosure.blockers).toEqual(
      expect.arrayContaining([
        "wall_region_comparison_missing",
        "wall_required_T00_missing",
        "wall_available_T00_missing",
      ]),
    );
  });

  it("builds the standalone wall source-closure contract with explicit provenance and boundary", () => {
    const artifact = buildNhm2WallSourceClosureArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
      chartId: "adm_eulerian",
      required: {
        tensorRef: "artifact://metric-wall",
        T00_SI: -100,
        componentStatus: "computed",
      },
      available: {
        sourceKind: "material_receipted",
        tensorRef: "artifact://tile-wall",
        materialReceipt: makeMaterialReceiptedCasimirReceipt(),
        T00_SI: -90,
        componentStatus: "computed",
      },
      tolerance: 0.05,
    });

    expect(isNhm2WallSourceClosureArtifact(artifact)).toBe(true);
    expect(artifact.residual.absolute).toBe(10);
    expect(artifact.residual.relative).toBe(0.1);
    expect(artifact.residual.pass).toBe(false);
    expect(artifact.available.sourceKind).toBe("material_receipted");
    expect(artifact.available.materialReceiptStatus).toBe("material_receipted");
    expect(artifact.claimBoundary.globalResidualCannotOverrideWallFailure).toBe(true);
  });

  it("does not mark wall source closure as material_receipted without a material receipt", () => {
    const artifact = buildNhm2WallSourceClosureArtifact({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
      chartId: "adm_eulerian",
      required: {
        tensorRef: "artifact://metric-wall",
        T00_SI: -100,
        componentStatus: "computed",
      },
      available: {
        sourceKind: "material_receipted",
        tensorRef: "artifact://tile-wall",
        T00_SI: -90,
        componentStatus: "computed",
      },
      tolerance: 0.05,
    });

    expect(isNhm2WallSourceClosureArtifact(artifact)).toBe(true);
    expect(artifact.available.sourceKind).toBe("tile_effective");
    expect(artifact.blockers).toContain(
      "casimir_material_receipt_required_for_material_source",
    );
  });

  it("carries ideal scalar Casimir receipts through wall source closure without promoting material evidence", () => {
    const idealReceipt = buildCasimirMaterialReceipt({
      generatedAt: "2026-06-09T00:00:00.000Z",
      tileBatchId: "tile_batch:ideal",
      geometry: {
        gapMeters: 1e-9,
        gapMetrologyStatus: "design",
        roughnessRmsMeters: null,
        beyondPfaValidity: "not_evaluated",
      },
      material: {
        modelKind: "perfect_conductor_ideal",
        finiteConductivityIncluded: false,
        finiteTemperatureIncluded: false,
        roughnessCorrectionIncluded: false,
      },
      environment: {
        vacuumSealEvidence: "missing",
        temperatureK: 20,
      },
      correctionFactors: {
        conductivity: null,
        temperature: null,
        roughness: null,
        geometry: null,
      },
    });
    const makeInferredT00Diagnostics = (sampleCount: number, meanT00: number) => ({
      sampleCount,
      includedCount: sampleCount,
      skippedCount: null,
      nonFiniteCount: null,
      meanT00,
      sumT00: sampleCount * meanT00,
      sourceRef: "gr.matter.material.wall.T00",
      normalizationBasis: "sample_count",
      aggregationMode: "mean" as const,
      evidenceStatus: "inferred" as const,
    });

    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      requiredRegionIds: ["wall"],
      casimirMaterialReceipt: idealReceipt,
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "gr.matter.material.wall.tensor",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeInferredT00Diagnostics(8, -100),
          tileT00Diagnostics: makeInferredT00Diagnostics(8, -100),
        },
      ],
      toleranceRelLInf: 0.1,
    });

    expect(artifact.casimirMaterialReceipt?.status).toBe("ideal_scalar_only");
    expect(artifact.reasonCodes).toContain("casimir_material_receipt_missing");
    expect(artifact.wallSourceClosure.available.sourceKind).toBe("tile_effective");
    expect(artifact.wallSourceClosure.available.materialReceiptStatus).toBe(
      "ideal_scalar_only",
    );
    expect(artifact.wallSourceClosure.warnings).toEqual(
      expect.arrayContaining([
        "casimir_material_receipt_ideal_scalar_only",
        "casimir_material_receipt_required_before_material_source_evidence",
      ]),
    );
  });

  it("maps pressure proxy dominance to pressure-proxy follow-up guidance", () => {
    const makeInferredT00Diagnostics = (sampleCount: number, meanT00: number) => ({
      sampleCount,
      includedCount: sampleCount,
      skippedCount: null,
      nonFiniteCount: null,
      meanT00,
      sumT00: sampleCount * meanT00,
      normalizationBasis: "sample_count",
      aggregationMode: "mean" as const,
      evidenceStatus: "inferred" as const,
    });
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
      tileEffectiveTensor: { T00: -100, T11: 130, T22: 130, T33: 130 },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -100, T11: 130, T22: 130, T33: 130 },
          sampleCount: 8,
          metricAccounting: makeAccounting(8, "metric"),
          tileAccounting: makeAccounting(8, "tile"),
          metricT00Diagnostics: makeInferredT00Diagnostics(8, -100),
          tileT00Diagnostics: makeInferredT00Diagnostics(8, -100),
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const wall = artifact.regionComparisons.regions[0];
    expect(wall?.mismatchDiagnostics?.t00MechanismCategory).toBe("pressure_proxy_dominant");
    expect(wall?.mismatchDiagnostics?.t00MechanismEvidenceStatus).toBe("inferred");
    expect(wall?.mismatchDiagnostics?.t00MechanismNextStep).toBe("pressure_proxy_mapping");
  });

  it("computes a scale-aware pressure significance floor from emitted component magnitudes", () => {
    const floor = computeNhm2PressureSignificanceFloor({
      T00: {
        metricRequired: -100,
        tileEffective: -100,
        absResidual: 0,
        relResidual: 0,
      },
      T11: {
        metricRequired: 1_000_000,
        tileEffective: 1_000_000 + 1e-9,
        absResidual: 1e-9,
        relResidual: 1e-15,
      },
      T22: {
        metricRequired: 500_000,
        tileEffective: 500_000,
        absResidual: 0,
        relResidual: 0,
      },
      T33: {
        metricRequired: 250_000,
        tileEffective: 250_000,
        absResidual: 0,
        relResidual: 0,
      },
    });

    expect(floor).toBeGreaterThan(1e-12);
    expect(floor).toBeCloseTo(1_000_000 * Number.EPSILON * 16, 20);
  });

  it("marks missing required regional tensors as unavailable instead of synthetic success", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: null,
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 16,
          metricAccounting: makeAccounting(16, "metric"),
          tileAccounting: makeAccounting(16, "tile"),
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining(["region_metric_tensor_missing"]),
    );
    expect(artifact.regionComparisons.regions[0]?.status).toBe("unavailable");
  });

  it("preserves null proxy diagnostics instead of coercing to zeros", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: null,
          metricAccounting: {
            sampleCount: null,
            maskVoxelCount: null,
            weightSum: null,
            aggregationMode: "unknown",
            normalizationBasis: null,
            regionMaskNote: null,
            supportInclusionNote: null,
            evidenceStatus: "unknown",
          },
          tileAccounting: {
            sampleCount: null,
            maskVoxelCount: null,
            weightSum: null,
            aggregationMode: "unknown",
            normalizationBasis: null,
            regionMaskNote: null,
            supportInclusionNote: null,
            evidenceStatus: "unknown",
          },
          metricT00Diagnostics: {
            sampleCount: null,
            includedCount: null,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: null,
            sumT00: null,
            sourceRef: null,
            derivationMode: "unknown",
            aggregationMode: "unknown",
            normalizationBasis: null,
            evidenceStatus: "unknown",
          },
          tileT00Diagnostics: {
            sampleCount: null,
            includedCount: null,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: null,
            sumT00: null,
            sourceRef: null,
            derivationMode: "unknown",
            aggregationMode: "unknown",
            normalizationBasis: null,
            evidenceStatus: "unknown",
          },
          tileProxyDiagnostics: {
            pressureModel: null,
            pressureFactor: null,
            pressureSource: null,
            proxyMode: "unknown",
            brickProxyMode: "unknown",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const region = artifact.regionComparisons.regions[0];
    expect(region.sampleCount).toBeNull();
    expect(region.tileProxyDiagnostics?.pressureFactor).toBeNull();
    expect(region.metricT00Diagnostics?.meanT00).toBeNull();
    expect(region.tileT00Diagnostics?.sumT00).toBeNull();
    expect(region.metricT00Diagnostics?.sourceRef).toBeNull();
    expect(region.tileT00Diagnostics?.derivationMode).toBe("unknown");
  });

  it("preserves direct T00 provenance and keeps direct mapping guidance explicit", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -140, T11: 140, T22: 140, T33: 140 },
          sampleCount: 16,
          metricAccounting: makeAccounting(16, "metric"),
          tileAccounting: makeAccounting(16, "tile"),
          metricT00Diagnostics: {
            sampleCount: 16,
            includedCount: 16,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: -100,
            sumT00: -1600,
            sourceRef: "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
            derivationMode: "runtime_integrated_metric_region_mean",
            trace: makeT00Trace({
              sampleCount: 16,
              valueRef: "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
              tensorRef: "artifact://metric-wall",
              boundaryRef:
                "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField",
              traceStage: "region_mean_from_shift_field",
              pathFacts: {
                producerModule: "modules/warp/natario-warp.ts",
                producerFunction: "calculateMetricStressEnergyTensorRegionMeansFromShiftField",
                inputFieldRef: "warp.shiftVectorField.evaluateShiftVector",
                semanticQuantityRef: "warp.metric.required_t00.shift_field_eulerian",
                semanticQuantityKind: "metric_required_t00",
                physicalMeaningRef: "warp.metric.required_t00.eulerian_energy_density",
                comparisonRole: "metric_required_reference",
                expectedCounterpartRole: "tile_effective_counterpart",
                semanticEquivalenceExpected: true,
                reconstructionLayer: "shift_field_metric_tensor_reconstruction",
                assumptionBoundaryRef:
                  "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField",
                semanticAlignmentNote:
                  "Metric direct T00 is the reference-side metric-required quantity for same-basis source-closure comparison.",
                upstreamValueType: "derived_metric_tensor_component",
                constructionDomain: "brick_grid_metric_derivative_domain",
                constructionStage: "pre_aggregation_shift_field_tensorization",
                unitsRef: "J/m^3",
                preAggregationValueRef: "warp.metric.required_t00.samples",
                upstreamAssumptionNote:
                  "Metric direct T00 is reconstructed from brick-grid shift-field derivatives before regional averaging.",
                maskClassifierRef:
                  "gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask",
                voxelAveragingMode: "unweighted_voxel_mean",
                derivativeSource: "shift_field_eulerian_t00",
                pressureProxyApplied: false,
                finiteDifferenceSource: "brick_grid_central_difference",
                samplingDomain: "brick_grid.region.wall",
                supportExclusionMode: "skip_nonfinite_derivative_cells",
                normalizationRef: "sample_count",
              },
            }),
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "inferred",
          },
          tileT00Diagnostics: {
            sampleCount: 16,
            includedCount: 16,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: -140,
            sumT00: -2240,
            sourceRef:
              "gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00",
            derivationMode: "gr_matter_brick_region_mean",
            trace: makeT00Trace({
              sampleCount: 16,
              valueRef:
                "gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00",
              tensorRef: "artifact://tile-wall",
              boundaryRef: "server/stress-energy-brick.ts::buildTensorRegionSummary",
              traceStage: "region_mean_from_gr_matter_brick",
              pathFacts: {
                producerModule: "server/stress-energy-brick.ts",
                producerFunction: "buildTensorRegionSummary",
                inputFieldRef: "gr.matter.stressEnergy.channels.t00",
                semanticQuantityRef: "gr.matter.brick.channel_t00.region_mean",
                semanticQuantityKind: "gr_matter_channel_t00",
                physicalMeaningRef: "gr.matter.channel_t00.sampled_region_mean",
                comparisonRole: "gr_matter_channel_observation",
                expectedCounterpartRole: "metric_required_reference",
                semanticEquivalenceExpected: false,
                reconstructionLayer: "gr_matter_channel_sampling",
                assumptionBoundaryRef:
                  "server/stress-energy-brick.ts::buildTensorRegionSummary",
                semanticAlignmentNote:
                  "Tile direct T00 is a sampled GR matter brick channel mean, not a tile-effective counterpart to the metric-required reference quantity.",
                upstreamValueType: "sampled_brick_channel_component",
                constructionDomain: "brick_grid_matter_channel_domain",
                constructionStage: "pre_aggregation_channel_sampling",
                unitsRef: "J/m^3",
                preAggregationValueRef: "gr.matter.stressEnergy.channels.t00",
                upstreamAssumptionNote:
                  "Tile direct T00 is the region mean of sampled GR matter brick t00 channel values before pressure proxy reconstruction.",
                maskClassifierRef:
                  "gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask",
                voxelAveragingMode: "unweighted_voxel_mean",
                derivativeSource: "direct_region_voxel_t00_mean",
                pressureProxyApplied: false,
                finiteDifferenceSource: null,
                samplingDomain: "brick_grid.region.wall",
                supportExclusionMode: "region_mask_voxel_mean",
                normalizationRef: "sample_count",
              },
            }),
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "inferred",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const region = artifact.regionComparisons.regions[0];
    expect(artifact.status).toBe("review");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining(["region_basis_diagnostic_only", "assumption_drift"]),
    );
    expect(artifact.assumptionsDrifted).toBe(true);
    expect(region.comparisonBasisStatus).toBe("diagnostic_only");
    expect(region.comparisonBasisAuthorityStatus).toBe("counterpart_missing");
    expect(region.comparisonBasisAuthorityReason).toContain(
      "metric direct T00 expects tile_effective_counterpart",
    );
    expect(region.metricExpectedCounterpartRole).toBe("tile_effective_counterpart");
    expect(region.resolvedTileCounterpartRef).toBeNull();
    expect(region.counterpartResolutionStatus).toBe("missing");
    expect(region.counterpartResolutionNote).toContain(
      "no tile-side tile_effective_counterpart surface is currently published",
    );
    expect(region.regionalComparisonContractStatus).toBe(
      "narrowed_to_observation_only",
    );
    expect(region.regionalComparisonContractNote).toContain(
      "intentionally narrowed to diagnostic observation only",
    );
    expect(region.regionalComparisonPolicyStatus).toBe(
      "not_required_for_same_basis_promotion",
    );
    expect(region.regionalComparisonPolicyNote).toContain(
      "is not treated as an authoritative same-basis promotion requirement",
    );
    expect(region.comparisonContractNote).toContain(
      "not the expected same-basis counterpart",
    );
    expect(region.status).toBe("review");
    expect(region.note).not.toContain("Same-basis regional closure compares");
    expect(region.note).toContain(
      "regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only",
    );
    expect(region.metricT00Diagnostics?.sourceRef).toBe(
      "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
    );
    expect(region.metricT00Diagnostics?.derivationMode).toBe(
      "runtime_integrated_metric_region_mean",
    );
    expect(region.tileT00Diagnostics?.sourceRef).toBe(
      "gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00",
    );
    expect(region.tileT00Diagnostics?.derivationMode).toBe("gr_matter_brick_region_mean");
    expect(region.metricT00Diagnostics?.trace?.traceStage).toBe("region_mean_from_shift_field");
    expect(region.metricT00Diagnostics?.trace?.regionMaskRef).toBe(
      "gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.producerFunction).toBe(
      "calculateMetricStressEnergyTensorRegionMeansFromShiftField",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.inputFieldRef).toBe(
      "warp.shiftVectorField.evaluateShiftVector",
    );
    expect(region.metricT00Diagnostics?.trace?.boundaryRef).toBe(
      "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.semanticQuantityKind).toBe(
      "metric_required_t00",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.physicalMeaningRef).toBe(
      "warp.metric.required_t00.eulerian_energy_density",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.comparisonRole).toBe(
      "metric_required_reference",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.expectedCounterpartRole).toBe(
      "tile_effective_counterpart",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.semanticEquivalenceExpected).toBe(
      true,
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.reconstructionLayer).toBe(
      "shift_field_metric_tensor_reconstruction",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.assumptionBoundaryRef).toBe(
      "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField",
    );
    expect(region.metricT00Diagnostics?.trace?.pathFacts?.constructionStage).toBe(
      "pre_aggregation_shift_field_tensorization",
    );
    expect(region.tileT00Diagnostics?.trace?.traceStage).toBe(
      "region_mean_from_gr_matter_brick",
    );
    expect(region.tileT00Diagnostics?.trace?.tensorRef).toBe("artifact://tile-wall");
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.producerFunction).toBe(
      "buildTensorRegionSummary",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.inputFieldRef).toBe(
      "gr.matter.stressEnergy.channels.t00",
    );
    expect(region.tileT00Diagnostics?.trace?.boundaryRef).toBe(
      "server/stress-energy-brick.ts::buildTensorRegionSummary",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.semanticQuantityKind).toBe(
      "gr_matter_channel_t00",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.physicalMeaningRef).toBe(
      "gr.matter.channel_t00.sampled_region_mean",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.comparisonRole).toBe(
      "gr_matter_channel_observation",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.expectedCounterpartRole).toBe(
      "metric_required_reference",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.semanticEquivalenceExpected).toBe(
      false,
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.reconstructionLayer).toBe(
      "gr_matter_channel_sampling",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.assumptionBoundaryRef).toBe(
      "server/stress-energy-brick.ts::buildTensorRegionSummary",
    );
    expect(region.tileT00Diagnostics?.trace?.pathFacts?.constructionStage).toBe(
      "pre_aggregation_channel_sampling",
    );
    expect(region.mismatchDiagnostics?.t00MechanismCategory).toBe("t00_mismatch_present");
    expect(region.mismatchDiagnostics?.t00MechanismNextStep).toBe(
      "direct_t00_source_model_mapping",
    );
    expect(region.mismatchDiagnostics?.t00TraceDivergenceStage).toBe("source_path_mismatch");
    expect(region.mismatchDiagnostics?.t00TraceUpstreamMismatchClass).toBe(
      "input_field_mismatch",
    );
    expect(region.mismatchDiagnostics?.t00TraceSemanticMismatchClass).toBe(
      "semantic_quantity_mismatch",
    );
    expect(region.mismatchDiagnostics?.t00TraceComparisonContractStatus).toBe(
      "semantically_misaligned",
    );
    expect(region.mismatchDiagnostics?.t00TraceContractMismatchClass).toBe(
      "comparison_contract_mismatch",
    );
    expect(region.mismatchDiagnostics?.t00TraceFirstSemanticBoundary).toBe(
      "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary",
    );
    expect(region.mismatchDiagnostics?.t00TraceNextInspectionTarget).toBe(
      "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary",
    );
    expect(artifact.leadBlocker).toMatchObject({
      regionId: "wall",
      kind: "wall_t00_source_path_mismatch",
      relLInf: 0.4,
      t00Rel: 0.4,
      metricT00Ref: "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
      tileT00Ref: "gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00",
      t00TraceDivergenceStage: "source_path_mismatch",
      t00TraceNextInspectionTarget:
        "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary",
      nextStep: "direct_t00_source_model_mapping",
    });
  });

  it("keeps T00 same-basis authority while blocking source-side full tensor authority", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          sampleCount: 16,
          metricAccounting: makeAccounting(16, "metric"),
          tileAccounting: makeAccounting(16, "tile"),
          metricT00Diagnostics: {
            sampleCount: 16,
            includedCount: 16,
            skippedCount: 0,
            nonFiniteCount: 0,
            meanT00: -100,
            sumT00: -1600,
            sourceRef: "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
            derivationMode: "runtime_integrated_metric_region_mean",
            trace: makeT00Trace({
              sampleCount: 16,
              valueRef: "runtime.metricRequired.regionMeans.wall.diagonalTensor.T00",
              tensorRef: "artifact://metric-wall",
              boundaryRef:
                "modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField",
              traceStage: "region_mean_from_shift_field",
              pathFacts: {
                comparisonRole: "metric_required_reference",
                expectedCounterpartRole: "tile_effective_counterpart",
                semanticEquivalenceExpected: true,
                semanticQuantityRef: "warp.metric.required_t00.eulerian_energy_density",
                semanticQuantityKind: "direct_t00_energy_density",
                physicalMeaningRef: "warp.metric.required_t00.eulerian_energy_density",
              },
            }),
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "measured",
          },
          tileT00Diagnostics: {
            sampleCount: 16,
            includedCount: 16,
            skippedCount: 0,
            nonFiniteCount: 0,
            meanT00: -100,
            sumT00: -1600,
            sourceRef: "warp.tileEffective.regionMeans.wall.directT00",
            derivationMode: "tile_effective_direct_t00_region_mean",
            trace: makeT00Trace({
              sampleCount: 16,
              valueRef: "warp.tileEffective.regionMeans.wall.directT00",
              tensorRef: "artifact://tile-wall",
              boundaryRef: "server/energy-pipeline.ts::buildSelectedShiftLapseRuntimeState",
              traceStage: "region_mean_from_gr_matter_brick",
              pathFacts: {
                comparisonRole: "tile_effective_counterpart",
                expectedCounterpartRole: "metric_required_reference",
                semanticEquivalenceExpected: true,
                semanticQuantityRef: "warp.metric.required_t00.eulerian_energy_density",
                semanticQuantityKind: "direct_t00_energy_density",
                physicalMeaningRef: "warp.metric.required_t00.eulerian_energy_density",
              },
            }),
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "measured",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: 0,
    });

    const region = artifact.regionComparisons.regions[0];
    expect(artifact.status).toBe("review");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining([
        "source_side_same_basis_authority_missing",
        "wall_source_side_same_basis_authority_missing",
        "assumption_drift",
      ]),
    );
    expect(artifact.assumptionsDrifted).toBe(true);
    expect(region.comparisonBasisStatus).toBe("same_basis");
    expect(region.comparisonBasisAuthorityStatus).toBe("authoritative_same_basis");
    expect(region.sourceSideSameBasisAuthorityStatus).toBe("blocked");
    expect(region.sourceSideFullTensorMissingComponentIds).toEqual(
      expect.arrayContaining(["T01", "T02", "T03", "T12", "T13", "T23"]),
    );
    expect(region.sourceSideSameBasisAuthorityReason).toContain(
      "requires full tensor components",
    );
    expect(region.comparisonBasisAuthorityReason).toContain(
      "reciprocal aligned counterpart roles",
    );
    expect(region.metricExpectedCounterpartRole).toBe("tile_effective_counterpart");
    expect(region.resolvedTileCounterpartRef).toBe(
      "warp.tileEffective.regionMeans.wall.directT00",
    );
    expect(region.counterpartResolutionStatus).toBe("resolved");
    expect(region.counterpartResolutionNote).toContain(
      "satisfies the expected same-basis counterpart role",
    );
    expect(region.regionalComparisonContractStatus).toBe(
      "same_basis_counterpart_available",
    );
    expect(region.regionalComparisonContractNote).toContain(
      "same-basis closure is backed by the resolved tile-side counterpart",
    );
    expect(region.regionalComparisonPolicyStatus).toBe(
      "same_basis_counterpart_defined",
    );
    expect(region.regionalComparisonPolicyNote).toContain(
      "participates in authoritative same-basis promotion",
    );
    expect(region.comparisonContractNote).toContain("semantically aligned");
    expect(region.status).toBe("pass");
    expect(artifact.wallSourceClosure.available.sourceAuthorityStatus).toBe("blocked");
    expect(artifact.wallSourceClosure.blockers).toContain(
      "wall_source_side_same_basis_authority_missing",
    );
    expect(artifact.leadBlocker).toMatchObject({
      regionId: null,
      kind: "none",
      relLInf: null,
      t00Rel: null,
    });
  });

  it("preserves null includedCount when reducer-native evidence is absent", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          sampleCount: 10,
          metricAccounting: makeAccounting(10, "metric"),
          tileAccounting: makeAccounting(10, "tile"),
          tileT00Diagnostics: {
            sampleCount: 10,
            includedCount: null,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: -100,
            sumT00: -1000,
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "unknown",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    expect(artifact.regionComparisons.regions[0]?.tileT00Diagnostics?.includedCount).toBeNull();
    expect(artifact.regionComparisons.regions[0]?.tileT00Diagnostics?.trace).toBeNull();
    expect(artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceDivergenceStage).toBe(
      "unknown",
    );
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceUpstreamMismatchClass,
    ).toBe("unknown");
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceSemanticMismatchClass,
    ).toBe("unknown");
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceComparisonContractStatus,
    ).toBe("unknown");
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceContractMismatchClass,
    ).toBe("unknown");
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceFirstSemanticBoundary,
    ).toBeNull();
    expect(
      artifact.regionComparisons.regions[0]?.mismatchDiagnostics?.t00TraceNextInspectionTarget,
    ).toBeNull();
  });

  it("keeps synthesized sumT00 evidence away from measured", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["wall"],
      regionComparisons: [
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          tileEffectiveTensor: { T00: -100, T11: 100, T22: 100, T33: 100 },
          sampleCount: 10,
          metricAccounting: makeAccounting(10, "metric"),
          tileAccounting: makeAccounting(10, "tile"),
          tileT00Diagnostics: {
            sampleCount: 10,
            includedCount: null,
            skippedCount: null,
            nonFiniteCount: null,
            meanT00: -100,
            sumT00: null,
            normalizationBasis: "sample_count",
            aggregationMode: "mean",
            evidenceStatus: "inferred",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    expect(artifact.regionComparisons.regions[0]?.tileT00Diagnostics?.evidenceStatus).not.toBe(
      "measured",
    );
  });

  it("preserves proxy component attribution fields without coercion", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 12,
          metricAccounting: makeAccounting(12, "metric"),
          tileAccounting: makeAccounting(12, "tile"),
          tileProxyDiagnostics: {
            pressureModel: "isotropic_pressure_proxy",
            pressureFactor: null,
            pressureSource: "proxy",
            proxyMode: "proxy",
            brickProxyMode: "metric",
            componentAttribution: {
              T00: {
                constructionMode: "direct_region_mean_t00",
                sourceComponent: null,
                proxyFactor: null,
                proxyReconstructedValue: null,
                proxyReconstructionAbsError: null,
                proxyReconstructionRelError: null,
                evidenceStatus: "measured",
              },
              T11: {
                constructionMode: "proxy_scaled_from_region_mean_t00",
                sourceComponent: "T00",
                proxyFactor: null,
                proxyReconstructedValue: null,
                proxyReconstructionAbsError: null,
                proxyReconstructionRelError: null,
                evidenceStatus: "inferred",
              },
              T22: {
                constructionMode: "proxy_scaled_from_region_mean_t00",
                sourceComponent: "T00",
                proxyFactor: null,
                proxyReconstructedValue: null,
                proxyReconstructionAbsError: null,
                proxyReconstructionRelError: null,
                evidenceStatus: "inferred",
              },
              T33: {
                constructionMode: "proxy_scaled_from_region_mean_t00",
                sourceComponent: "T00",
                proxyFactor: null,
                proxyReconstructedValue: null,
                proxyReconstructionAbsError: null,
                proxyReconstructionRelError: null,
                evidenceStatus: "inferred",
              },
            },
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const attribution =
      artifact.regionComparisons.regions[0]?.tileProxyDiagnostics?.componentAttribution;
    expect(attribution).toBeTruthy();
    expect(attribution?.T00.constructionMode).toBe("direct_region_mean_t00");
    expect(attribution?.T11.sourceComponent).toBe("T00");
    expect(attribution?.T11.proxyFactor).toBeNull();
    expect(attribution?.T11.proxyReconstructedValue).toBeNull();
  });

  it("downgrades measured accounting when required evidence is missing", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 10,
          metricAccounting: {
            sampleCount: 10,
            maskVoxelCount: 10,
            weightSum: null,
            aggregationMode: "mean",
            normalizationBasis: "sample_count",
            regionMaskNote: "mask",
            supportInclusionNote: "metric",
            evidenceStatus: "measured",
          },
          tileAccounting: {
            sampleCount: 10,
            maskVoxelCount: 10,
            weightSum: null,
            aggregationMode: "mean",
            normalizationBasis: "sample_count",
            regionMaskNote: "mask",
            supportInclusionNote: "tile",
            evidenceStatus: "measured",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const region = artifact.regionComparisons.regions[0];
    expect(region.metricAccounting?.evidenceStatus).toBe("unknown");
    expect(region.tileAccounting?.evidenceStatus).toBe("unknown");
  });

  it("downgrades measured accounting when normalization semantics are inconsistent", () => {
    const artifact = buildNhm2SourceClosureArtifactV2({
      metricTensorRef: "warp.metricStressEnergy",
      tileEffectiveTensorRef: "warp.tileEffectiveStressEnergy",
      metricRequiredTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      tileEffectiveTensor: {
        T00: -100,
        T11: 100,
        T22: 100,
        T33: 100,
      },
      requiredRegionIds: ["hull"],
      regionComparisons: [
        {
          regionId: "hull",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-hull",
          tileTensorRef: "artifact://tile-hull",
          metricRequiredTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          tileEffectiveTensor: { T00: -50, T11: 50, T22: 50, T33: 50 },
          sampleCount: 10,
          metricAccounting: {
            sampleCount: 10,
            maskVoxelCount: 10,
            weightSum: 12,
            aggregationMode: "mean",
            normalizationBasis: "sample_count",
            regionMaskNote: "mask",
            supportInclusionNote: "metric",
            evidenceStatus: "measured",
          },
          tileAccounting: {
            sampleCount: 10,
            maskVoxelCount: 10,
            weightSum: 8,
            aggregationMode: "mean",
            normalizationBasis: "sample_count",
            regionMaskNote: "mask",
            supportInclusionNote: "tile",
            evidenceStatus: "measured",
          },
        },
      ],
      toleranceRelLInf: 0.1,
      scalarCl3RhoDeltaRel: null,
    });

    const region = artifact.regionComparisons.regions[0];
    expect(region.metricAccounting?.evidenceStatus).toBe("unknown");
    expect(region.tileAccounting?.evidenceStatus).toBe("unknown");
  });
});
