import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  buildNhm2TileLocalSourceElementsArtifact,
  inferNhm2TileLocalSourceTensorAuthorityMode,
  missingNhm2TileLocalSourceTensorComponents,
  isNhm2TileLocalSourceElementsArtifact,
  type Nhm2TileLocalSourceElementV1,
  type Nhm2TileLocalSourceElementsArtifactV1,
} from "../../shared/contracts/nhm2-tile-local-source-element.v1";
import {
  NHM2_CAVITY_CONTRACT,
  type NeedleHullMark2CavityContract,
} from "../../shared/needle-hull-mark2-cavity-contract";
import {
  isNhm2WallMaterialSourceTensorModelArtifact,
  type Nhm2WallMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-wall-material-source-tensor-model.v1";
import type {
  Nhm2RegionalTensor,
  Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const HBAR_J_S = 1.054_571_817e-34;
const SPEED_OF_LIGHT_M_S = 299_792_458;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const idealCasimirEnergyPerArea = (gapMeters: number): number =>
  -(Math.PI ** 2 * HBAR_J_S * SPEED_OF_LIGHT_M_S) /
  (720 * gapMeters ** 3);

const representativeRegionIds = ["hull", "wall", "exterior_shell"] as const;

const tensorComponentMap = {
  T00: "T00",
  T0x: "T01",
  T0y: "T02",
  T0z: "T03",
  Txx: "T11",
  Txy: "T12",
  Txz: "T13",
  Tyy: "T22",
  Tyz: "T23",
  Tzz: "T33",
} as const satisfies Record<string, Nhm2TensorComponent>;

const localTensorFromWallModel = (
  model: Nhm2WallMaterialSourceTensorModelV1,
): Nhm2RegionalTensor => {
  const tensor: Nhm2RegionalTensor = {};
  for (const component of model.components) {
    const target = tensorComponentMap[component.componentId];
    if (
      component.valueSI != null &&
      (component.status === "computed" ||
        component.status === "material_receipted")
    ) {
      tensor[target] = component.valueSI;
    }
  }
  return tensor;
};

const componentStatusFromTensor = (
  tensor: Nhm2RegionalTensor,
): Nhm2TileLocalSourceElementV1["componentStatus"] =>
  Object.fromEntries(
    Object.keys(tensor).map((component) => [component, "computed"]),
  ) as Nhm2TileLocalSourceElementV1["componentStatus"];

export const buildTileLocalSourceElementsFromCavityContract = (args: {
  generatedAt?: string;
  runId?: string;
  selectedProfileId?: string;
  expectedProfileId?: string;
  contract?: NeedleHullMark2CavityContract;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
  wallMaterialSourceTensorModel?: Nhm2WallMaterialSourceTensorModelV1 | null;
  wallMaterialSourceTensorModelRef?: string | null;
} = {}): Nhm2TileLocalSourceElementsArtifactV1 => {
  const contract = args.contract ?? NHM2_CAVITY_CONTRACT;
  const wallTensorModel = isNhm2WallMaterialSourceTensorModelArtifact(
    args.wallMaterialSourceTensorModel,
  )
    ? args.wallMaterialSourceTensorModel
    : null;
  const gapMeters = contract.geometry.gap_nm * 1e-9;
  const tileWidthMeters = contract.geometry.tileWidth_mm * 1e-3;
  const tileHeightMeters = contract.geometry.tileHeight_mm * 1e-3;
  const areaMeters2 = tileWidthMeters * tileHeightMeters;
  const concurrentSectorFraction =
    contract.geometry.concurrentSectors / contract.geometry.sectorCount;
  const effectiveDuty =
    contract.loss.dutyCycle * contract.loss.dutyShip * concurrentSectorFraction;
  const energyPerArea = idealCasimirEnergyPerArea(gapMeters);
  const energyPerTile = energyPerArea * areaMeters2;
  const gapEnergyDensity = energyPerArea / gapMeters;
  const cycleAveragedT00 = gapEnergyDensity * contract.loss.qCavity * effectiveDuty;
  const receiptStatus = args.materialReceipt?.status ?? "ideal_scalar_only";
  const receiptRef =
    args.materialReceipt == null
      ? null
      : `casimir_material_receipt:${args.materialReceipt.tileBatchId}`;
  const sourceTensorInputRefs = [
    "configs/needle-hull-mark2-cavity-contract.v1.json",
    ...(receiptRef == null ? [] : [receiptRef]),
    ...(args.wallMaterialSourceTensorModelRef == null
      ? []
      : [args.wallMaterialSourceTensorModelRef]),
  ];

  const elements: Nhm2TileLocalSourceElementV1[] = representativeRegionIds.map(
    (regionId, index) => {
      const localTensor =
        regionId === "wall" && wallTensorModel != null
          ? localTensorFromWallModel(wallTensorModel)
          : { T00: cycleAveragedT00 };
      const tensorAuthorityMode =
        inferNhm2TileLocalSourceTensorAuthorityMode(localTensor);
      const missingComponentIds =
        missingNhm2TileLocalSourceTensorComponents(localTensor);
      const usingWallModel = regionId === "wall" && wallTensorModel != null;
      const blockers = usingWallModel
        ? [
            ...(wallTensorModel.projection.sameChartProjectionStatus === "pass"
              ? []
              : ["same_chart_projection_missing_or_failed"]),
            ...(wallTensorModel.basis === "local_wall_orthonormal" &&
            wallTensorModel.projection.wallNormalRef == null
              ? ["wall_normal_tangent_basis_missing"]
              : []),
          ]
        : [
            "tile_lattice_positions_not_enumerated",
            "ideal_scalar_only_not_material_receipted",
          ];
      return {
        tileElementId: `nhm2_tile_local_source:${regionId}:representative_sector_bin`,
        tileBatchId: "nhm2_cavity_geometry_freeze_v1",
        sectorId: `representative_sector_${index}`,
        chartId: "comoving_cartesian",
        positionChartMeters: null,
        normalChart: null,
        areaMeters2,
        gapMeters,
        duty: {
          burstDuty: contract.loss.dutyCycle,
          shipDuty: contract.loss.dutyShip,
          concurrentSectorFraction,
          effectiveDuty,
        },
        qFactor: contract.loss.qCavity,
        material: {
          materialStack: contract.boundary.material,
          materialReceiptRef: receiptRef ?? wallTensorModel?.materialReceiptRef ?? null,
          materialReceiptStatus: receiptStatus,
        },
        scalarBudget: {
          idealCasimirEnergyPerAreaSI: energyPerArea,
          idealCasimirEnergyPerTileSI: energyPerTile,
          idealGapEnergyDensitySI: gapEnergyDensity,
          cycleAveragedT00SI: cycleAveragedT00,
          status: "computed",
        },
        localTensor,
        componentStatus: componentStatusFromTensor(localTensor),
        tensorAuthorityMode,
        missingComponentIds,
        regionWeights: {
          global: 1,
          [regionId]: 1,
        },
        provenance: {
          producerModule: "tools/nhm2/build-tile-local-source-elements.ts",
          producerFunction: "buildTileLocalSourceElementsFromCavityContract",
          sourceModelId: usingWallModel
            ? "nhm2_wall_material_source_tensor_model"
            : "nhm2_casimir_tile_local_source_placeholder",
          sourceModelVersion: "v1",
          sourceSideOnly: true,
          notDerivedFromMetricRequiredTensor: true,
          inputRefs: sourceTensorInputRefs,
          approximationMode: "representative_sector_bin",
        },
        blockers,
        warnings: usingWallModel
          ? ["local_tensor_from_wall_material_source_tensor_model"]
          : [
              "representative_sector_bin_not_full_tile_lattice",
              "local_tensor_contains_scalar_t00_only",
            ],
      };
    },
  );

  return buildNhm2TileLocalSourceElementsArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    runId: args.runId ?? "unknown-run",
    selectedProfileId: args.selectedProfileId ?? "unknown",
    expectedProfileId: args.expectedProfileId ?? args.selectedProfileId ?? "unknown",
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId:
        wallTensorModel == null
          ? "nhm2_casimir_tile_local_source_placeholder"
          : "nhm2_wall_material_source_tensor_model",
      sourceModelVersion: "v1",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: sourceTensorInputRefs,
      approximationMode: "representative_sector_bin",
    },
    tileUnit: {
      areaMeters2,
      gapMeters,
      tileWidthMeters,
      tileHeightMeters,
      sectorCount: contract.geometry.sectorCount,
      concurrentSectors: contract.geometry.concurrentSectors,
      qFactor: contract.loss.qCavity,
      dutyCycle: contract.loss.dutyCycle,
      dutyShip: contract.loss.dutyShip,
      modulationFrequencyHz: contract.drive.modulationFreq_GHz * 1e9,
      materialStack: contract.boundary.material,
      idealCasimirEnergyPerAreaSI: energyPerArea,
      idealCasimirEnergyPerTileSI: energyPerTile,
      idealGapEnergyDensitySI: gapEnergyDensity,
    },
    elements,
  });
};

export const publishNhm2TileLocalSourceElements = (args: {
  repoRoot: string;
  outPath: string;
  referenceRunPath?: string | null;
  casimirMaterialReceiptPath?: string | null;
  wallMaterialSourceTensorModelPath?: string | null;
  auditOnly?: boolean;
}): Nhm2TileLocalSourceElementsArtifactV1 => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.casimirMaterialReceiptPath) ||
      pathUsesLatestAlias(args.wallMaterialSourceTensorModelPath))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const referenceRun =
    args.referenceRunPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (referenceRun != null && !isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const materialReceipt =
    args.casimirMaterialReceiptPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.casimirMaterialReceiptPath));
  if (materialReceipt != null && !isCasimirMaterialReceipt(materialReceipt)) {
    throw new Error("Casimir material receipt must be casimir_material_receipt/v1");
  }
  const wallTensorModel =
    args.wallMaterialSourceTensorModelPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.wallMaterialSourceTensorModelPath));
  if (
    wallTensorModel != null &&
    !isNhm2WallMaterialSourceTensorModelArtifact(wallTensorModel)
  ) {
    throw new Error(
      "wall material source tensor model must be nhm2_wall_material_source_tensor_model/v1",
    );
  }
  const reference = isNhm2ReferenceRunArtifact(referenceRun) ? referenceRun : null;
  const artifact = buildTileLocalSourceElementsFromCavityContract({
    runId: reference?.runId,
    selectedProfileId: reference?.selectedFamily.selectedProfileId,
    expectedProfileId: reference?.selectedFamily.expectedProfileId,
    materialReceipt: isCasimirMaterialReceipt(materialReceipt) ? materialReceipt : null,
    wallMaterialSourceTensorModel:
      wallTensorModel == null ? null : wallTensorModel,
    wallMaterialSourceTensorModelRef:
      args.wallMaterialSourceTensorModelPath ?? null,
  });
  if (!isNhm2TileLocalSourceElementsArtifact(artifact)) {
    throw new Error("internal error: produced invalid tile-local source elements artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) throw new Error("--out is required");
  const artifact = publishNhm2TileLocalSourceElements({
    repoRoot: process.cwd(),
    referenceRunPath: asString(args["reference-run"]),
    casimirMaterialReceiptPath: asString(args["casimir-material-receipt"]),
    wallMaterialSourceTensorModelPath: asString(args["wall-material-source-tensor-model"]),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
