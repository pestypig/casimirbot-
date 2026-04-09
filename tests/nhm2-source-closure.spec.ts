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
    traceStage:
      | "region_mean_from_shift_field"
      | "region_mean_from_gr_matter_brick"
      | "tensor_snapshot_fallback";
  }) => ({
    regionMaskRef: "gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask",
    sampleCount: args.sampleCount,
    normalizationBasis: "sample_count",
    aggregationMode: "mean" as const,
    valueRef: args.valueRef,
    tensorRef: args.tensorRef,
    maskNote: "shared wall brick mask",
    supportInclusionNote: "shared wall support set",
    traceStage: args.traceStage,
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
    expect(artifact.status).toBe("pass");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual([]);
    expect(artifact.assumptionsDrifted).toBe(false);
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
      expect(region.mismatchDiagnostics).toBeTruthy();
      expect(region.mismatchDiagnostics?.components.T00.ratioTileToMetric).not.toBeNull();
      expect(region.mismatchDiagnostics?.components.T00.signedRatioTileToMetric).not.toBeNull();
      expect(region.mismatchDiagnostics?.components.T00.signMatch).toBe(true);
      expect(region.mismatchDiagnostics?.diagonalSignStatus).toBe("match");
    }
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
    expect(artifact.assumptionsDrifted).toBe(false);
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
              traceStage: "region_mean_from_shift_field",
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
              traceStage: "region_mean_from_gr_matter_brick",
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
    expect(region.tileT00Diagnostics?.trace?.traceStage).toBe(
      "region_mean_from_gr_matter_brick",
    );
    expect(region.tileT00Diagnostics?.trace?.tensorRef).toBe("artifact://tile-wall");
    expect(region.mismatchDiagnostics?.t00MechanismCategory).toBe("t00_mismatch_present");
    expect(region.mismatchDiagnostics?.t00MechanismNextStep).toBe(
      "direct_t00_source_model_mapping",
    );
    expect(region.mismatchDiagnostics?.t00TraceDivergenceStage).toBe("source_path_mismatch");
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
