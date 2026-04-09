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
        },
        {
          regionId: "wall",
          comparisonBasisStatus: "same_basis",
          metricTensorRef: "artifact://metric-wall",
          tileTensorRef: "artifact://tile-wall",
          metricRequiredTensor: { T00: -40, T11: 40, T22: 40, T33: 40 },
          tileEffectiveTensor: { T00: -40.5, T11: 40.5, T22: 40.5, T33: 40.5 },
          sampleCount: 8,
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
});
