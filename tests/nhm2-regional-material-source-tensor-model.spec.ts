import { describe, expect, it } from "vitest";

import { buildCasimirMaterialReceipt } from "../shared/contracts/casimir-material-receipt.v1";
import { buildNhm2ReferenceRunArtifact } from "../shared/contracts/nhm2-reference-run.v1";
import type { Nhm2RegionalTensor } from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildNhm2SourceSideSameBasisTensorAuthorityArtifact } from "../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import { aggregateTileLocalSourceToRegionalCounterpart } from "../tools/nhm2/aggregate-tile-local-source-to-regional-counterpart";
import { buildRegionalMaterialSourceTensorModel } from "../tools/nhm2/build-regional-material-source-tensor-model";
import { buildTileLocalSourceElementsFromCavityContract } from "../tools/nhm2/build-tile-local-source-elements";

const generatedAt = "2026-06-12T00:00:00.000Z";
const profile = "stage1_centerline_alpha_0p995_v1";

const referenceRun = () =>
  buildNhm2ReferenceRunArtifact({
    generatedAt,
    runId: "regional-source-run",
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

const materialReceipt = () =>
  buildCasimirMaterialReceipt({
    generatedAt,
    tileBatchId: "nhm2_cavity_geometry_freeze_v1",
    geometry: {
      gapMeters: 8e-9,
      gapMetrologyStatus: "measured",
      roughnessRmsMeters: 1e-12,
      beyondPfaValidity: "pass",
    },
    material: {
      modelKind: "lifshitz",
      dielectricResponseRef: "fixture:lifshitz-response",
      finiteConductivityIncluded: true,
      finiteTemperatureIncluded: true,
      roughnessCorrectionIncluded: true,
    },
    environment: {
      vacuumSealEvidence: "present",
      temperatureK: 4,
    },
    correctionFactors: {
      conductivity: 1,
      temperature: 1,
      roughness: 1,
      geometry: 1,
    },
  });

const symmetricTensor = (scale: number): Nhm2RegionalTensor => ({
  T00: -scale,
  T01: 0,
  T02: 0,
  T03: 0,
  T11: scale * 0.02,
  T12: 0,
  T13: 0,
  T22: scale * 0.02,
  T23: 0,
  T33: scale * 0.02,
});

const componentRegion = (tensor: Nhm2RegionalTensor) => ({
  tensor,
  status: "material_receipted",
  aggregationMode: "representative_sector_bin",
  normalizationBasis: "sample_count",
  sampleCount: 1,
  basisRef: "same_basis",
});

describe("NHM2 regional material source tensor model", () => {
  it("can populate all required source-authority regions through tile-local aggregation", () => {
    const receipt = materialReceipt();
    const regionalModel = buildRegionalMaterialSourceTensorModel({
      generatedAt,
      materialReceipt: receipt,
      materialReceiptRef: "receipt.json",
      componentModel: {
        modelKind: "lifshitz_regional_tensor",
        selectedProfileId: profile,
        regions: {
          hull: componentRegion(symmetricTensor(1.1e9)),
          wall: componentRegion(symmetricTensor(1.6995e9)),
          exterior_shell: componentRegion(symmetricTensor(9.5e8)),
        },
      },
    });
    const tileLocal = buildTileLocalSourceElementsFromCavityContract({
      generatedAt,
      runId: "regional-source-run",
      selectedProfileId: profile,
      expectedProfileId: profile,
      materialReceipt: receipt,
      regionalMaterialSourceTensorModel: regionalModel,
      regionalMaterialSourceTensorModelRef: "regional-source-model.json",
    });
    const counterpart = aggregateTileLocalSourceToRegionalCounterpart({
      referenceRun: referenceRun(),
      tileLocalSourceElements: tileLocal,
      tileLocalSourceElementsRef: "tile-local.json",
    });
    const authority = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt,
      laneId: "nhm2_shift_lapse",
      selectedProfileId: profile,
      chartId: "comoving_cartesian",
      sourceModelId: "nhm2_regional_material_source_tensor_model",
      counterpartArtifactRef: "counterpart.json",
      counterpartArtifact: counterpart,
      casimirMaterialReceipt: receipt,
    });

    expect(regionalModel.summary.allRequiredRegionsFullTensor).toBe(false);
    expect(regionalModel.summary.missingRegionIds).toContain("global");
    expect(tileLocal.summary.allElementsHaveLocalTensorAuthority).toBe(true);
    expect(counterpart.regions.find((region) => region.regionId === "global")?.status).toBe("pass");
    expect(authority.summary.hasWallAuthority).toBe(true);
    expect(authority.summary.allRequiredRegionsAuthoritative).toBe(true);
  });

  it("does not let a wall-only regional tensor become global source authority", () => {
    const receipt = materialReceipt();
    const regionalModel = buildRegionalMaterialSourceTensorModel({
      generatedAt,
      materialReceipt: receipt,
      materialReceiptRef: "receipt.json",
      componentModel: {
        modelKind: "lifshitz_regional_tensor",
        selectedProfileId: profile,
        regions: {
          wall: componentRegion(symmetricTensor(1.6995e9)),
        },
      },
    });
    const tileLocal = buildTileLocalSourceElementsFromCavityContract({
      generatedAt,
      runId: "regional-source-run",
      selectedProfileId: profile,
      expectedProfileId: profile,
      materialReceipt: receipt,
      regionalMaterialSourceTensorModel: regionalModel,
      regionalMaterialSourceTensorModelRef: "regional-source-model.json",
    });
    const counterpart = aggregateTileLocalSourceToRegionalCounterpart({
      referenceRun: referenceRun(),
      tileLocalSourceElements: tileLocal,
      tileLocalSourceElementsRef: "tile-local.json",
    });
    const authority = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
      generatedAt,
      laneId: "nhm2_shift_lapse",
      selectedProfileId: profile,
      chartId: "comoving_cartesian",
      sourceModelId: "nhm2_regional_material_source_tensor_model",
      counterpartArtifactRef: "counterpart.json",
      counterpartArtifact: counterpart,
      casimirMaterialReceipt: receipt,
    });
    const global = authority.regions.find((region) => region.regionId === "global");
    const wall = authority.regions.find((region) => region.regionId === "wall");

    expect(wall?.status).toBe("authoritative_same_basis");
    expect(global?.status).not.toBe("authoritative_same_basis");
    expect(authority.summary.hasWallAuthority).toBe(true);
    expect(authority.summary.allRequiredRegionsAuthoritative).toBe(false);
  });

  it("blocks copied-from-wall global rows without an aggregation receipt", () => {
    const receipt = materialReceipt();
    const regionalModel = buildRegionalMaterialSourceTensorModel({
      generatedAt,
      materialReceipt: receipt,
      materialReceiptRef: "receipt.json",
      componentModel: {
        modelKind: "lifshitz_regional_tensor",
        selectedProfileId: profile,
        regions: {
          global: {
            ...componentRegion(symmetricTensor(1.6995e9)),
            aggregationMode: "copied_from_wall",
          },
        },
      },
    });
    const global = regionalModel.regions.find((region) => region.regionId === "global");

    expect(global?.status).toBe("blocked");
    expect(global?.blockers).toContain("global_region_cannot_be_copied_from_wall");
    expect(regionalModel.claimBoundary.globalCannotBeCopiedFromWallWithoutAggregationReceipt).toBe(true);
  });

  it("rejects metric-required provenance in regional source component models", () => {
    expect(() =>
      buildRegionalMaterialSourceTensorModel({
        generatedAt,
        componentModel: {
          regions: {
            wall: {
              tensor: symmetricTensor(1),
              provenanceRef: "metric_required.wall.tensor",
            },
          },
        },
      }),
    ).toThrow(/metric-required tensors/);
  });
});
