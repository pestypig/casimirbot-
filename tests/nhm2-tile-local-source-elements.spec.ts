import { describe, expect, it } from "vitest";

import { buildNhm2ReferenceRunArtifact } from "../shared/contracts/nhm2-reference-run.v1";
import {
  buildNhm2TileLocalSourceElementsArtifact,
  isNhm2TileLocalSourceElementsArtifact,
  type Nhm2TileLocalSourceElementV1,
} from "../shared/contracts/nhm2-tile-local-source-element.v1";
import type { Nhm2RegionalTensor } from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildNhm2SourceSideSameBasisTensorAuthorityArtifact } from "../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import { aggregateTileLocalSourceToRegionalCounterpart } from "../tools/nhm2/aggregate-tile-local-source-to-regional-counterpart";
import { buildTileLocalSourceElementsFromCavityContract } from "../tools/nhm2/build-tile-local-source-elements";

const profile = "stage1_centerline_alpha_0p995_v1";

const referenceRun = () =>
  buildNhm2ReferenceRunArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "tile-local-run",
    repo: {
      repositoryFullName: "local/casimirbot",
      branch: "main",
      commitSha: "abc",
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

const fullTensor = (value: number): Nhm2RegionalTensor => ({
  T00: -value,
  T01: 0,
  T02: 0,
  T03: 0,
  T10: 0,
  T11: value,
  T12: 0,
  T13: 0,
  T20: 0,
  T21: 0,
  T22: value,
  T23: 0,
  T30: 0,
  T31: 0,
  T32: 0,
  T33: value,
});

const element = (
  id: string,
  tensor: Nhm2RegionalTensor,
  regionWeights: Nhm2TileLocalSourceElementV1["regionWeights"],
  materialReceiptStatus: Nhm2TileLocalSourceElementV1["material"]["materialReceiptStatus"] = "material_receipted",
): Nhm2TileLocalSourceElementV1 => ({
  tileElementId: id,
  tileBatchId: "batch-1",
  sectorId: "sector-1",
  chartId: "comoving_cartesian",
  positionChartMeters: null,
  normalChart: null,
  areaMeters2: 1e-4,
  gapMeters: 8e-9,
  duty: {
    burstDuty: 0.12,
    shipDuty: 0.12,
    concurrentSectorFraction: 0.025,
    effectiveDuty: 0.00036,
  },
  qFactor: 100000,
  material: {
    materialStack: "fixture",
    materialReceiptRef: "receipt",
    materialReceiptStatus,
  },
  scalarBudget: {
    idealCasimirEnergyPerAreaSI: -0.0008464360497706726,
    idealCasimirEnergyPerTileSI: -8.464360497706727e-8,
    idealGapEnergyDensitySI: -105804.50622133407,
    cycleAveragedT00SI: tensor.T00 ?? null,
    status: "computed",
  },
  localTensor: tensor,
  componentStatus: Object.fromEntries(
    Object.keys(tensor).map((component) => [component, "computed"]),
  ),
  tensorAuthorityMode: "unknown",
  missingComponentIds: [],
  regionWeights,
  provenance: {
    producerModule: "fixture",
    producerFunction: "element",
    sourceModelId: "fixture",
    sourceModelVersion: "v1",
    sourceSideOnly: true,
    notDerivedFromMetricRequiredTensor: true,
    inputRefs: ["fixture"],
    approximationMode: "representative_sector_bin",
  },
  blockers: [],
  warnings: [],
});

const artifactWith = (elements: Nhm2TileLocalSourceElementV1[]) =>
  buildNhm2TileLocalSourceElementsArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "tile-local-run",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "fixture",
      sourceModelVersion: "v1",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: ["fixture"],
      approximationMode: "representative_sector_bin",
    },
    tileUnit: {
      areaMeters2: 1e-4,
      gapMeters: 8e-9,
      tileWidthMeters: 0.01,
      tileHeightMeters: 0.01,
      sectorCount: 80,
      concurrentSectors: 2,
      qFactor: 100000,
      dutyCycle: 0.12,
      dutyShip: 0.12,
      modulationFrequencyHz: 15e9,
      materialStack: "fixture",
      idealCasimirEnergyPerAreaSI: -0.0008464360497706726,
      idealCasimirEnergyPerTileSI: -8.464360497706727e-8,
      idealGapEnergyDensitySI: -105804.50622133407,
    },
    elements,
  });

describe("NHM2 tile-local source elements", () => {
  it("derives the frozen 10 mm x 10 mm tile unit from the cavity contract", () => {
    const artifact = buildTileLocalSourceElementsFromCavityContract({
      runId: "tile-local-run",
      selectedProfileId: profile,
      expectedProfileId: profile,
    });

    expect(artifact.tileUnit.areaMeters2).toBeCloseTo(1e-4, 12);
    expect(artifact.tileUnit.gapMeters).toBeCloseTo(8e-9, 16);
    expect(artifact.tileUnit.idealCasimirEnergyPerTileSI).toBeCloseTo(
      -8.464360497706727e-8,
      16,
    );
    expect(artifact.summary.anyMissingMaterialReceipt).toBe(true);
    expect(artifact.claimBoundary.idealScalarBudgetIsNotMaterialReceipt).toBe(true);
    expect(isNhm2TileLocalSourceElementsArtifact(artifact)).toBe(true);
  });

  it("aggregates scalar tile-local elements without pretending missing components are zero", () => {
    const artifact = buildTileLocalSourceElementsFromCavityContract({
      runId: "tile-local-run",
      selectedProfileId: profile,
      expectedProfileId: profile,
    });
    const counterpart = aggregateTileLocalSourceToRegionalCounterpart({
      referenceRun: referenceRun(),
      tileLocalSourceElements: artifact,
      tileLocalSourceElementsRef: "tile-local.json",
    });
    const wall = counterpart.regions.find((region) => region.regionId === "wall");

    expect(wall?.comparisonRole).toBe("tile_effective_counterpart");
    expect(wall?.tensor.T00).toBeTypeOf("number");
    expect(wall?.tensor.T01).toBeUndefined();
    expect(wall?.tensorAuthorityMode).toBe("proxy");
    expect(wall?.blockers).toContain("full_tensor_authority_missing");
  });

  it("keeps diagonal-only local tensors non-authoritative because T0i and off-diagonal Tij are missing", () => {
    const artifact = artifactWith([
      element("wall-diagonal", { T00: -10, T11: 10, T22: 10, T33: 10 }, {
        global: 1,
        wall: 1,
      }),
      element("hull-full", fullTensor(10), { global: 1, hull: 1 }),
      element("exterior-full", fullTensor(10), { global: 1, exterior_shell: 1 }),
    ]);
    const counterpart = aggregateTileLocalSourceToRegionalCounterpart({
      referenceRun: referenceRun(),
      tileLocalSourceElements: artifact,
      tileLocalSourceElementsRef: "tile-local.json",
    });
    const authority = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt: "2026-06-12T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: profile,
      chartId: "comoving_cartesian",
      sourceModelId: "fixture",
      counterpartArtifactRef: "tile-counterpart.json",
      counterpartArtifact: counterpart,
    });

    expect(counterpart.regions.find((region) => region.regionId === "wall")?.tensorAuthorityMode).toBe(
      "diagonal_reduced_order",
    );
    expect(authority.summary.hasWallAuthority).toBe(false);
    expect(authority.regions.find((region) => region.regionId === "wall")?.status).toBe(
      "proxy_limited",
    );
  });

  it("marks missing wall region weights as missing counterpart evidence", () => {
    const artifact = artifactWith([
      element("hull-full", fullTensor(10), { global: 1, hull: 1 }),
      element("exterior-full", fullTensor(10), { global: 1, exterior_shell: 1 }),
    ]);
    const counterpart = aggregateTileLocalSourceToRegionalCounterpart({
      referenceRun: referenceRun(),
      tileLocalSourceElements: artifact,
      tileLocalSourceElementsRef: "tile-local.json",
    });
    const wall = counterpart.regions.find((region) => region.regionId === "wall");

    expect(wall?.status).toBe("missing");
    expect(wall?.blockers).toContain("tile_local_source_region_weight_missing");
  });
});
