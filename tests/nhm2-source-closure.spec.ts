import { describe, expect, it } from "vitest";

import {
  buildNhm2SourceClosureArtifact,
  NHM2_SOURCE_CLOSURE_ARTIFACT_ID,
  NHM2_SOURCE_CLOSURE_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-source-closure.v1";
import {
  buildNhm2SourceClosureArtifactV2,
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
