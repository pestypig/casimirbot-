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

export const buildTileLocalSourceElementsFromCavityContract = (args: {
  generatedAt?: string;
  runId?: string;
  selectedProfileId?: string;
  expectedProfileId?: string;
  contract?: NeedleHullMark2CavityContract;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
} = {}): Nhm2TileLocalSourceElementsArtifactV1 => {
  const contract = args.contract ?? NHM2_CAVITY_CONTRACT;
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

  const elements: Nhm2TileLocalSourceElementV1[] = representativeRegionIds.map(
    (regionId, index) => {
      const localTensor = { T00: cycleAveragedT00 };
      const tensorAuthorityMode =
        inferNhm2TileLocalSourceTensorAuthorityMode(localTensor);
      const missingComponentIds =
        missingNhm2TileLocalSourceTensorComponents(localTensor);
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
          materialReceiptRef: receiptRef,
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
        componentStatus: { T00: "computed" },
        tensorAuthorityMode,
        missingComponentIds,
        regionWeights: {
          global: 1,
          [regionId]: 1,
        },
        provenance: {
          producerModule: "tools/nhm2/build-tile-local-source-elements.ts",
          producerFunction: "buildTileLocalSourceElementsFromCavityContract",
          sourceModelId: "nhm2_casimir_tile_local_source_placeholder",
          sourceModelVersion: "v1",
          sourceSideOnly: true,
          notDerivedFromMetricRequiredTensor: true,
          inputRefs: [
            "configs/needle-hull-mark2-cavity-contract.v1.json",
            ...(receiptRef == null ? [] : [receiptRef]),
          ],
          approximationMode: "representative_sector_bin",
        },
        blockers: [
          "tile_lattice_positions_not_enumerated",
          "ideal_scalar_only_not_material_receipted",
        ],
        warnings: [
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
      sourceModelId: "nhm2_casimir_tile_local_source_placeholder",
      sourceModelVersion: "v1",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: ["configs/needle-hull-mark2-cavity-contract.v1.json"],
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
  auditOnly?: boolean;
}): Nhm2TileLocalSourceElementsArtifactV1 => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.casimirMaterialReceiptPath))
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
  const reference = isNhm2ReferenceRunArtifact(referenceRun) ? referenceRun : null;
  const artifact = buildTileLocalSourceElementsFromCavityContract({
    runId: reference?.runId,
    selectedProfileId: reference?.selectedFamily.selectedProfileId,
    expectedProfileId: reference?.selectedFamily.expectedProfileId,
    materialReceipt: isCasimirMaterialReceipt(materialReceipt) ? materialReceipt : null,
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
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
