import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildFullApparatusTensorEvidenceFromTensorValues,
  buildNhm2TileSourceFullApparatusTensorValues,
  isNhm2TileSourceFullApparatusTensorValues,
  NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS,
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS,
  type Nhm2FullApparatusComponentAuthority,
  type Nhm2FullApparatusTensorValueRegionV1,
} from "../shared/contracts/nhm2-tile-source-full-apparatus-tensor-values.v1";
import { buildNhm2TileSourceFullApparatusTensorOperatingBudget } from "../shared/contracts/nhm2-tile-source-full-apparatus-tensor-operating-budget.v1";
import { buildNhm2TileSourceMaterialEvidenceReceipts } from "../shared/contracts/nhm2-tile-source-material-evidence-receipts.v1";
import { publishNhm2TileSourceMaterialEvidenceReceipts } from "../tools/nhm2/publish-tile-source-material-evidence-receipts";
import type {
  Nhm2RegionalSourceClosureRegionId,
  Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const generatedAt = "2026-06-22T00:00:00.000Z";
const selectedProfileId =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const tensor = (scale: number): Nhm2RegionalTensor => ({
  T00: -scale,
  T01: scale * 0.001,
  T02: scale * 0.002,
  T03: scale * 0.003,
  T11: scale * 0.02,
  T12: scale * 0.0004,
  T13: scale * 0.0005,
  T22: scale * 0.021,
  T23: scale * 0.0006,
  T33: scale * 0.022,
});

const completeStatus = Object.fromEntries(
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.map((componentId) => [
    componentId,
    "validated_simulation",
  ]),
) as Nhm2FullApparatusTensorValueRegionV1["componentStatus"];

const completeAuthority = Object.fromEntries(
  NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS.map((componentId) => [
    componentId,
    "constitutive_model",
  ]),
) as Partial<Record<(typeof NHM2_FULL_APPARATUS_SYMMETRIC_TENSOR_COMPONENTS)[number], Nhm2FullApparatusComponentAuthority>>;

const termContributions = (scale: number): Nhm2FullApparatusTensorValueRegionV1["termContributions"] =>
  Object.fromEntries(
    NHM2_FULL_APPARATUS_REQUIRED_TERM_IDS.map((termId, index) => [
      termId,
      tensor(scale * (index + 1) * 0.001),
    ]),
  );

const region = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  scale: number,
  overrides: Partial<Nhm2FullApparatusTensorValueRegionV1> = {},
): Nhm2FullApparatusTensorValueRegionV1 => ({
  regionId,
  status: "computed",
  tensor: tensor(scale),
  componentStatus: completeStatus,
  componentAuthority: completeAuthority,
  termContributions: termContributions(scale),
  chartRef: "comoving_cartesian",
  basisRef: "same_basis",
  unitsRef: "J/m^3",
  regionSupportRef: `receipt://atlas/support/${regionId}`,
  aggregationMode: "support_weighted",
  normalizationBasis: "volume",
  sampleCount: 64,
  valueReceiptRef: `receipt://full-apparatus-tmunu/values/${regionId}`,
  blockers: [],
  warnings: [],
  ...overrides,
});

const artifact = (
  overrides: Partial<Parameters<typeof buildNhm2TileSourceFullApparatusTensorValues>[0]> = {},
) =>
  buildNhm2TileSourceFullApparatusTensorValues({
    generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    artifactRef: "artifact://full-apparatus-tmunu/values/v1",
    sourceRefs: {
      materialEvidenceReceiptsRef: "artifact://tile-source/material-evidence",
      fullApparatusTensorEvidenceRef: "receipt://full-apparatus-tmunu/v1",
      apparatusModelRef: "model://full-apparatus-tensor/constitutive-v1",
      atlasRef: "artifact://regional-support-atlas/v1",
    },
    sourceSideOnly: true,
    notDerivedFromMetricRequiredTensor: true,
    targetEchoForbidden: true,
    targetDerivedFieldsUsed: false,
    chartId: "comoving_cartesian",
    basisRef: "same_basis",
    unitsRef: "J/m^3",
    regions: [
      region("global", 1.0e9),
      region("hull", 1.1e9),
      region("wall", 1.6995e9),
      region("exterior_shell", 9.5e8),
    ],
    ...overrides,
  });

describe("NHM2 tile-source full-apparatus tensor values", () => {
  it("admits a complete source-side regional full tensor value artifact", () => {
    const built = artifact();

    expect(isNhm2TileSourceFullApparatusTensorValues(built)).toBe(true);
    expect(built.contractVersion).toBe("nhm2_tile_source_full_apparatus_tensor_values/v1");
    expect(built.summary.valueArtifactReadyForReceipt).toBe(true);
    expect(built.summary.firstBlocker).toBe("none");
    expect(built.summary.allRequiredRegionsPresent).toBe(true);
    expect(built.summary.allRequiredRegionsFullTensor).toBe(true);
    expect(built.summary.allRequiredRegionsTermComplete).toBe(true);
    expect(built.claimBoundary.valueArtifactDoesNotValidateMaterialMechanism).toBe(true);
    expect(built.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("blocks missing momentum and off-diagonal tensor values instead of zero-filling", () => {
    const wallTensor = tensor(1.6995e9);
    delete wallTensor.T01;
    delete wallTensor.T12;
    const built = artifact({
      regions: [
        region("global", 1.0e9),
        region("hull", 1.1e9),
        region("wall", 1.6995e9, {
          tensor: wallTensor,
          componentStatus: {
            ...completeStatus,
            T01: "missing",
            T12: "missing",
          },
        }),
        region("exterior_shell", 9.5e8),
      ],
    });

    expect(built.summary.valueArtifactReadyForReceipt).toBe(false);
    expect(built.summary.anyMissingComponent).toBe(true);
    expect(built.summary.missingComponentRefs).toEqual(
      expect.arrayContaining(["wall:T01", "wall:T12"]),
    );
    expect(built.summary.firstBlocker).toBe("wall:T01:component_value_missing");
  });

  it("blocks metric-echo and scalar-proxy component authority", () => {
    const built = artifact({
      regions: [
        region("global", 1.0e9),
        region("hull", 1.1e9),
        region("wall", 1.6995e9, {
          componentAuthority: {
            ...completeAuthority,
            T00: "metric_echo",
            T12: "scalar_proxy",
          },
        }),
        region("exterior_shell", 9.5e8),
      ],
    });

    expect(built.summary.valueArtifactReadyForReceipt).toBe(false);
    expect(built.summary.anyMetricEchoComponent).toBe(true);
    expect(built.summary.anyScalarProxyComponent).toBe(true);
    expect(built.summary.firstBlocker).toBe("wall:T00:metric_echo_forbidden");
  });

  it("feeds a ready tensor-values artifact into receipt and operating-budget gates", () => {
    const values = artifact();
    const evidence = buildFullApparatusTensorEvidenceFromTensorValues({
      artifact: values,
      evidenceTier: "validated_simulation",
    });
    const receipts = buildNhm2TileSourceMaterialEvidenceReceipts({
      generatedAt,
      fullApparatusTensor: evidence,
    });
    const budget = buildNhm2TileSourceFullApparatusTensorOperatingBudget({
      generatedAt,
      fullApparatusTensorEvidence: evidence,
    });
    const tensorSurface = receipts.receiptSurfaces.find(
      (surface) => surface.surfaceId === "full_apparatus_tensor",
    );

    expect(evidence.tensorValueArtifactContract).toBe(
      "nhm2_tile_source_full_apparatus_tensor_values/v1",
    );
    expect(tensorSurface?.status).toBe("pass");
    expect(tensorSurface?.numericalMargins.tensorValueArtifactAvailable).toBe(1);
    expect(receipts.summary.fullApparatusTensorReady).toBe(true);
    expect(budget.summary.fullApparatusTensorEvidenceReady).toBe(true);
    expect(budget.derivedOperatingBudget.tensorValueArtifactAvailable).toBe(true);
    expect(budget.summary.transportClaimAllowed).toBe(false);
  });

  it("lets the material-evidence publisher persist and consume a tensor-values artifact", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "nhm2-tensor-values-publisher-"));
    try {
      const evidencePath = join(tempRoot, "evidence.json");
      const outDir = join(tempRoot, "out");
      const values = artifact({
        artifactRef: "artifact://full-apparatus-tmunu/values/publisher-test",
      });
      writeFileSync(
        evidencePath,
        `${JSON.stringify(
          {
            generatedAt,
            selectedProfileId,
            candidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
            fullApparatusTensorValues: values,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const result = publishNhm2TileSourceMaterialEvidenceReceipts({
        repoRoot: tempRoot,
        evidencePath,
        outDir,
        generatedAt,
        selectedProfileId,
      });
      const tensorValuesPath = result.outputRefs.fullApparatusTensorValues;
      const fullTensorSurface = result.materialEvidenceReceipts.receiptSurfaces.find(
        (surface) => surface.surfaceId === "full_apparatus_tensor",
      );

      expect(tensorValuesPath).not.toBeNull();
      expect(tensorValuesPath == null ? null : JSON.parse(readFileSync(tensorValuesPath, "utf8")).contractVersion).toBe(
        "nhm2_tile_source_full_apparatus_tensor_values/v1",
      );
      expect(result.fullApparatusTensorValues?.summary.valueArtifactReadyForReceipt).toBe(true);
      expect(fullTensorSurface?.status).toBe("pass");
      expect(result.fullApparatusTensorOperatingBudget.summary.firstBlocker).toBe("none");
      expect(result.operatingBudgetReadiness.summary.physicalViabilityClaimAllowed).toBe(false);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
