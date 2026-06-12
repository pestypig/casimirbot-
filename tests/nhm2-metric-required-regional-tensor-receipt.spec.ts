import { describe, expect, it } from "vitest";

import {
  isNhm2MetricRequiredRegionalTensorReceipt,
} from "../shared/contracts/nhm2-metric-required-regional-tensor-receipt.v1";
import { buildNhm2ReferenceRunArtifact } from "../shared/contracts/nhm2-reference-run.v1";
import type { Nhm2RegionalTensor } from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildMetricRequiredRegionalTensorReceiptFromSourceClosure } from "../tools/nhm2/publish-metric-required-regional-tensor-receipt";

const profile = "stage1_centerline_alpha_0p995_v1";

const referenceRun = () =>
  buildNhm2ReferenceRunArtifact({
    generatedAt: "2026-05-04T00:00:00.000Z",
    runId: "metric-receipt-run",
    repo: {
      repositoryFullName: "local/casimirbot",
      branch: "main",
      commitSha: "abc123",
      dirtyTreeStatus: "dirty",
    },
    selectedFamily: {
      laneId: "nhm2_shift_lapse",
      selectedProfileId: profile,
      expectedProfileId: profile,
      profileMatch: true,
    },
    claimLock: {
      currentClaimTier: "diagnostic",
      maximumClaimTier: "reduced-order",
      validationMode: "red_team_hardening",
      validationClaimAllowed: false,
      latestAliasForbidden: true,
    },
    commands: [],
    artifactSet: [],
    hashLock: {
      inputManifestSha256: null,
      toleranceManifestSha256: null,
      artifactSetSha256: null,
      literatureClaimMapSha256: null,
    },
    blockerSummary: {
      overallState: "review",
      blockingReasons: [],
      observerConsistencyStatus: "unknown",
      sourceClosureRegionalStatus: "unknown",
      qeiDossierStatus: "missing",
      reproducibilityStatus: "missing",
    },
  });

const diagonalTensor = (value: number): Nhm2RegionalTensor => ({
  T00: -value,
  T11: value,
  T22: value,
  T33: value,
});

const regionalComparison = (regionId: "hull" | "wall" | "exterior_shell") => ({
  regionId,
  metricRequiredTensor: diagonalTensor(10),
  metricTensorRef: `metric.${regionId}`,
  metricAccounting: {
    aggregationMode: "unknown",
    normalizationBasis: null,
    sampleCount: null,
  },
  metricT00Diagnostics: {
    derivationMode: "runtime_integrated_metric_t00",
    trace: {
      tensorRef: `metric.${regionId}`,
      regionMaskRef: `metric.mask.${regionId}`,
      aggregationMode: "mean",
      normalizationBasis: "sample_count",
      sampleCount: 144,
      pathFacts: {
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
      },
    },
  },
});

const sourceClosure = () => ({
  artifactId: "nhm2_source_closure",
  schemaVersion: "nhm2_source_closure/v2",
  tensors: {
    metricRequired: diagonalTensor(1),
  },
  tensorRefs: {
    metricRequired: "metric.global",
  },
  regionComparisons: {
    regions: [
      regionalComparison("hull"),
      regionalComparison("wall"),
      regionalComparison("exterior_shell"),
    ],
  },
});

describe("NHM2 metric-required regional tensor receipt", () => {
  it("emits all required regions and keeps missing tensor components explicit", () => {
    const artifact = buildMetricRequiredRegionalTensorReceiptFromSourceClosure({
      generatedAt: "2026-05-05T00:00:00.000Z",
      referenceRun: referenceRun(),
      sourceClosure: sourceClosure(),
      sourceClosureRef: "fixture-source-closure.json",
    });

    expect(isNhm2MetricRequiredRegionalTensorReceipt(artifact)).toBe(true);
    expect(artifact.regions.map((region) => region.regionId)).toEqual([
      "global",
      "hull",
      "wall",
      "exterior_shell",
    ]);
    expect(artifact.summary.allRequiredRegionsPresent).toBe(true);
    expect(artifact.summary.allRequiredRegionsFullTensor).toBe(false);
    expect(artifact.summary.sameBasisComparisonReady).toBe(false);

    const hull = artifact.regions.find((region) => region.regionId === "hull");
    expect(hull?.aggregationMode).toBe("mean");
    expect(hull?.normalizationBasis).toBe("sample_count");
    expect(hull?.sampleCount).toBe(144);
    expect(hull?.tensorAuthorityMode).toBe("diagonal_reduced_order");
    expect(hull?.tensor.T01).toBeUndefined();
    expect(hull?.missingComponentIds).toContain("T01");
    expect(hull?.missingComponentIds).toContain("T12");
    expect(hull?.componentStatus.T01).toBe("missing");
    expect(hull?.blockers).toContain("metric_required_full_tensor_authority_missing");
    expect(hull?.blockers).toContain("metric_required_full_tensor_components_missing");

    const global = artifact.regions.find((region) => region.regionId === "global");
    expect(global?.warnings).toContain("global_metric_accounting_missing");
    expect(global?.aggregationMode).toBe("unknown");
    expect(global?.blockers).toContain("metric_required_aggregation_mode_unknown");
    expect(global?.blockers).toContain("metric_required_sample_count_missing");
  });
});
