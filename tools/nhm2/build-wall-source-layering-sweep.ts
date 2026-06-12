import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2WallSourceLayeringSweepArtifact,
  isNhm2WallSourceLayeringSweepArtifact,
  type Nhm2WallSourceLayeringSweepV1,
  type Nhm2WallSourceLayeringTensorAuthority,
} from "../../shared/contracts/nhm2-wall-source-layering-sweep.v1";
import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2TileLocalSourceElementsArtifact,
  type Nhm2TileLocalSourceElementsArtifactV1,
} from "../../shared/contracts/nhm2-tile-local-source-element.v1";
import { NHM2_CAVITY_CONTRACT } from "../../shared/needle-hull-mark2-cavity-contract";
import { buildTileLocalSourceElementsFromCavityContract } from "./build-tile-local-source-elements";

const DEFAULT_SELECTED_PROFILE_ID = "stage1_centerline_alpha_0p995_v1";
const DEFAULT_REQUIRED_WALL_T00_ABS_SI = 1.6995e9;
const ELLIPSOID_AREA_P = 1.6075;

const DEFAULT_LAYER_COUNTS = [1, 2, 5, 10, 20, 50, 100, 250, 447, 500];
const DEFAULT_PACKING_FRACTIONS = [1, 0.75, 0.5, 0.25];
const DEFAULT_ORIENTATION_PROJECTIONS = [1, 0.75, 0.5];
const DEFAULT_MATERIAL_CORRECTIONS = [1, 0.75, 0.5, 0.25, 0.1];
const DEFAULT_Q_MULTIPLIERS = [1];
const DEFAULT_DUTY_MULTIPLIERS = [1];
const DEFAULT_METRIC_RELIEF_FACTORS = [1, 5, 10, 21.1, 50, 100];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

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

const parseNumberList = (
  value: string | boolean | undefined,
  fallback: number[],
): number[] => {
  const text = asString(value);
  if (text == null) return fallback;
  const parsed = text
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
  if (parsed.length === 0) {
    throw new Error(`expected comma-separated numbers, received: ${text}`);
  }
  return parsed;
};

const boxArea = (lengthMeters: number, widthMeters: number, heightMeters: number): number =>
  2 *
  (lengthMeters * widthMeters +
    lengthMeters * heightMeters +
    widthMeters * heightMeters);

const ellipsoidArea = (
  lengthMeters: number,
  widthMeters: number,
  heightMeters: number,
): number => {
  const a = lengthMeters / 2;
  const b = widthMeters / 2;
  const c = heightMeters / 2;
  const mean =
    (a * b) ** ELLIPSOID_AREA_P +
    (a * c) ** ELLIPSOID_AREA_P +
    (b * c) ** ELLIPSOID_AREA_P;
  return 4 * Math.PI * (mean / 3) ** (1 / ELLIPSOID_AREA_P);
};

const firstFinite = (...values: Array<number | null | undefined>): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
};

const findWallTileT00Abs = (
  artifact: Nhm2TileLocalSourceElementsArtifactV1,
): number | null => {
  let weightedSum = 0;
  let weightSum = 0;
  for (const element of artifact.elements) {
    const weight = Math.max(0, element.regionWeights.wall ?? 0);
    const t00 = firstFinite(
      element.localTensor.T00,
      element.scalarBudget.cycleAveragedT00SI,
    );
    if (weight <= 0 || t00 == null) continue;
    weightedSum += Math.abs(t00) * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? weightedSum / weightSum : null;
};

const findRequiredWallT00Abs = (
  artifact: Nhm2RegionalSourceClosureEvidenceArtifact | null,
): number | null => {
  const wall = artifact?.regions.find((region) => region.regionId === "wall");
  const required = wall?.metricRequired.tensor.T00;
  return typeof required === "number" && Number.isFinite(required)
    ? Math.abs(required)
    : null;
};

const buildRowId = (row: {
  layerCount: number;
  packingFraction: number;
  orientationProjection: number;
  materialCorrectionProduct: number;
  qMultiplier: number;
  dutyMultiplier: number;
  metricReliefFactor: number;
}): string =>
  [
    `layers-${row.layerCount}`,
    `pack-${row.packingFraction}`,
    `orient-${row.orientationProjection}`,
    `mat-${row.materialCorrectionProduct}`,
    `q-${row.qMultiplier}`,
    `duty-${row.dutyMultiplier}`,
    `relief-${row.metricReliefFactor}`,
  ]
    .join("__")
    .replaceAll(".", "p");

const tensorAuthorityFor = (
  artifact: Nhm2TileLocalSourceElementsArtifactV1,
): Nhm2WallSourceLayeringTensorAuthority => {
  if (artifact.summary.allElementsHaveLocalTensorAuthority) {
    return "full_tensor_candidate";
  }
  if (
    artifact.elements.some(
      (element) => element.tensorAuthorityMode === "diagonal_reduced_order",
    )
  ) {
    return "diagonal_proxy";
  }
  return "scalar_t00_only";
};

export type BuildWallSourceLayeringSweepArgs = {
  generatedAt?: string;
  selectedProfileId?: string;
  tileLocalSourceElements?: Nhm2TileLocalSourceElementsArtifactV1 | null;
  tileLocalSourceElementsRef?: string | null;
  regionalSourceClosureEvidence?: Nhm2RegionalSourceClosureEvidenceArtifact | null;
  regionalSourceClosureEvidenceRef?: string | null;
  layerCounts?: number[];
  packingFractions?: number[];
  orientationProjections?: number[];
  materialCorrections?: number[];
  qMultipliers?: number[];
  dutyMultipliers?: number[];
  metricReliefFactors?: number[];
  referenceWallControlThicknessMeters?: number | null;
};

export const buildWallSourceLayeringSweep = (
  args: BuildWallSourceLayeringSweepArgs = {},
): Nhm2WallSourceLayeringSweepV1 => {
  const selectedProfileId =
    args.selectedProfileId ?? DEFAULT_SELECTED_PROFILE_ID;
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const tileLocalSourceElements =
    args.tileLocalSourceElements ??
    buildTileLocalSourceElementsFromCavityContract({
      generatedAt,
      runId: "wall-source-layering-sweep",
      selectedProfileId,
      expectedProfileId: selectedProfileId,
    });
  const baselineWarnings: string[] = [];
  const tileLocalWallT00AbsSI = findWallTileT00Abs(tileLocalSourceElements);
  if (tileLocalWallT00AbsSI == null || tileLocalWallT00AbsSI <= 0) {
    throw new Error("wall tile-local T00 must be present and non-zero");
  }
  const requiredWallT00AbsSI =
    findRequiredWallT00Abs(args.regionalSourceClosureEvidence ?? null) ??
    DEFAULT_REQUIRED_WALL_T00_ABS_SI;
  if (args.regionalSourceClosureEvidence == null) {
    baselineWarnings.push("required_wall_t00_fallback_from_current_whitepaper_read");
  }
  const requiredMultiplier = requiredWallT00AbsSI / tileLocalWallT00AbsSI;

  const topMirrorThicknessMeters =
    NHM2_CAVITY_CONTRACT.geometry.topMirrorThickness_um * 1e-6;
  const bottomMirrorThicknessMeters =
    NHM2_CAVITY_CONTRACT.geometry.bottomMirrorThickness_um * 1e-6;
  const gapMeters = NHM2_CAVITY_CONTRACT.geometry.gap_nm * 1e-9;
  const oneIdealLayerThicknessMeters =
    topMirrorThicknessMeters + gapMeters + bottomMirrorThicknessMeters;
  const referenceWallControlThicknessMeters =
    args.referenceWallControlThicknessMeters ?? oneIdealLayerThicknessMeters;
  const tileAreaMeters2 =
    NHM2_CAVITY_CONTRACT.geometry.tileWidth_mm *
    1e-3 *
    NHM2_CAVITY_CONTRACT.geometry.tileHeight_mm *
    1e-3;
  const hull = NHM2_CAVITY_CONTRACT.geometry.fullHull;
  const boxAreaMeters2 = boxArea(hull.Lx_m, hull.Ly_m, hull.Lz_m);
  const ellipsoidAreaMeters2 = ellipsoidArea(hull.Lx_m, hull.Ly_m, hull.Lz_m);
  const tensorAuthority = tensorAuthorityFor(tileLocalSourceElements);

  const sweepRows = (args.layerCounts ?? DEFAULT_LAYER_COUNTS).flatMap(
    (layerCount) =>
      (args.packingFractions ?? DEFAULT_PACKING_FRACTIONS).flatMap(
        (packingFraction) =>
          (args.orientationProjections ?? DEFAULT_ORIENTATION_PROJECTIONS).flatMap(
            (orientationProjection) =>
              (args.materialCorrections ?? DEFAULT_MATERIAL_CORRECTIONS).flatMap(
                (materialCorrectionProduct) =>
                  (args.qMultipliers ?? DEFAULT_Q_MULTIPLIERS).flatMap(
                    (qMultiplier) =>
                      (args.dutyMultipliers ?? DEFAULT_DUTY_MULTIPLIERS).flatMap(
                        (dutyMultiplier) =>
                          (args.metricReliefFactors ?? DEFAULT_METRIC_RELIEF_FACTORS).map(
                            (metricReliefFactor) => {
                              const denominator =
                                packingFraction *
                                orientationProjection *
                                materialCorrectionProduct *
                                qMultiplier *
                                dutyMultiplier;
                              const requiredSourceMultiplier =
                                requiredMultiplier / metricReliefFactor;
                              const idealStackThicknessMeters =
                                layerCount * oneIdealLayerThicknessMeters;
                              const volumeExpansionFactor = Math.max(
                                1,
                                (referenceWallControlThicknessMeters +
                                  idealStackThicknessMeters) /
                                  referenceWallControlThicknessMeters,
                              );
                              const fixedVolumeSourceMultiplier =
                                layerCount * denominator;
                              const expandedVolumeSourceMultiplier =
                                fixedVolumeSourceMultiplier / volumeExpansionFactor;
                              const closureProductFixedVolume =
                                fixedVolumeSourceMultiplier * metricReliefFactor;
                              const closureProductExpandedVolume =
                                expandedVolumeSourceMultiplier * metricReliefFactor;
                              const fixedVolumeResidual =
                                Math.abs(requiredMultiplier - closureProductFixedVolume) /
                                requiredMultiplier;
                              const expandedVolumeResidual =
                                Math.abs(
                                  requiredMultiplier - closureProductExpandedVolume,
                                ) / requiredMultiplier;
                              const scalarT00Pass10pct = fixedVolumeResidual <= 0.1;
                              const scalarT00Pass1pct = fixedVolumeResidual <= 0.01;
                              const expandedScalarT00Pass10pct =
                                expandedVolumeResidual <= 0.1;
                              const expandedScalarT00Pass1pct =
                                expandedVolumeResidual <= 0.01;
                              const blockers = [
                                "scalar_t00_only_not_full_tensor",
                                "material_receipt_still_required",
                                "qei_conservation_observer_gates_not_evaluated",
                              ];
                              if (
                                scalarT00Pass10pct &&
                                !expandedScalarT00Pass10pct
                              ) {
                                blockers.push(
                                  "expanded_volume_does_not_preserve_fixed_volume_pass",
                                );
                              }
                              if (metricReliefFactor !== 1) {
                                blockers.push(
                                  "metric_relief_is_parameter_not_solve_artifact",
                                );
                              }
                              if (materialCorrectionProduct !== 1) {
                                blockers.push(
                                  "material_correction_is_parameter_not_receipt",
                                );
                              }

                              return {
                                rowId: buildRowId({
                                  layerCount,
                                  packingFraction,
                                  orientationProjection,
                                  materialCorrectionProduct,
                                  qMultiplier,
                                  dutyMultiplier,
                                  metricReliefFactor,
                                }),
                                layerCount,
                                idealStackThicknessMeters,
                                packingFraction,
                                orientationProjection,
                                materialCorrectionProduct,
                                qMultiplier,
                                dutyMultiplier,
                                metricReliefFactor,
                                requiredSourceMultiplier,
                                requiredIdealLayerCountAtCurrentFactors:
                                  denominator > 0
                                    ? Math.ceil(requiredSourceMultiplier / denominator)
                                    : null,
                                fixedVolumeSourceMultiplier,
                                expandedVolumeSourceMultiplier,
                                closureProductFixedVolume,
                                closureProductExpandedVolume,
                                fixedVolumeResidual,
                                expandedVolumeResidual,
                                scalarT00Pass10pct,
                                scalarT00Pass1pct,
                                expandedScalarT00Pass10pct,
                                expandedScalarT00Pass1pct,
                                physicalPassAllowed: false as const,
                                tensorAuthority,
                                blockers,
                              };
                            },
                          ),
                      ),
                  ),
              ),
          ),
      ),
  );

  return buildNhm2WallSourceLayeringSweepArtifact({
    generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId,
    baseline: {
      requiredWallT00AbsSI,
      tileLocalWallT00AbsSI,
      requiredMultiplier,
      sourceRef:
        args.tileLocalSourceElementsRef ??
        "generated:buildTileLocalSourceElementsFromCavityContract",
      metricRef:
        args.regionalSourceClosureEvidenceRef ??
        "default:current_wall_metric_required_t00_abs",
      baselineWarnings,
    },
    layerAssumptions: {
      topMirrorThicknessMeters,
      bottomMirrorThicknessMeters,
      gapMeters,
      oneIdealLayerThicknessMeters,
      referenceWallControlThicknessMeters,
      expandedVolumeMode: "radial_stack_expands_wall_volume",
    },
    hullSurfaceEstimate: {
      tileAreaMeters2,
      boxAreaMeters2,
      ellipsoidAreaMeters2,
      boxTilesPerLayer: Math.ceil(boxAreaMeters2 / tileAreaMeters2),
      ellipsoidTilesPerLayer: Math.ceil(ellipsoidAreaMeters2 / tileAreaMeters2),
    },
    sweepRows,
  });
};

export const publishWallSourceLayeringSweep = (args: {
  repoRoot: string;
  outPath: string;
  selectedProfileId?: string | null;
  tileLocalSourceElementsPath?: string | null;
  regionalSourceClosureEvidencePath?: string | null;
  layerCounts?: number[];
  packingFractions?: number[];
  orientationProjections?: number[];
  materialCorrections?: number[];
  qMultipliers?: number[];
  dutyMultipliers?: number[];
  metricReliefFactors?: number[];
  referenceWallControlThicknessMeters?: number | null;
}): Nhm2WallSourceLayeringSweepV1 => {
  const tilePath = asString(args.tileLocalSourceElementsPath);
  const evidencePath = asString(args.regionalSourceClosureEvidencePath);
  const tileLocalSourceElements =
    tilePath == null ? null : readJson(resolvePath(args.repoRoot, tilePath));
  if (
    tileLocalSourceElements != null &&
    !isNhm2TileLocalSourceElementsArtifact(tileLocalSourceElements)
  ) {
    throw new Error("tile-local source elements must be nhm2_tile_local_source_elements/v1");
  }
  const regionalSourceClosureEvidence =
    evidencePath == null ? null : readJson(resolvePath(args.repoRoot, evidencePath));
  if (
    regionalSourceClosureEvidence != null &&
    !isNhm2RegionalSourceClosureEvidenceArtifact(regionalSourceClosureEvidence)
  ) {
    throw new Error(
      "regional source closure evidence must be nhm2_regional_source_closure_evidence/v1",
    );
  }
  const artifact = buildWallSourceLayeringSweep({
    selectedProfileId: args.selectedProfileId ?? undefined,
    tileLocalSourceElements:
      tileLocalSourceElements == null ? null : tileLocalSourceElements,
    tileLocalSourceElementsRef: tilePath,
    regionalSourceClosureEvidence:
      regionalSourceClosureEvidence == null ? null : regionalSourceClosureEvidence,
    regionalSourceClosureEvidenceRef: evidencePath,
    layerCounts: args.layerCounts,
    packingFractions: args.packingFractions,
    orientationProjections: args.orientationProjections,
    materialCorrections: args.materialCorrections,
    qMultipliers: args.qMultipliers,
    dutyMultipliers: args.dutyMultipliers,
    metricReliefFactors: args.metricReliefFactors,
    referenceWallControlThicknessMeters: args.referenceWallControlThicknessMeters,
  });
  if (!isNhm2WallSourceLayeringSweepArtifact(artifact)) {
    throw new Error("internal error: produced invalid wall source layering sweep");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const argv = parseArgs(process.argv.slice(2));
  const outPath = asString(argv.out);
  if (outPath == null) throw new Error("--out is required");

  const artifact = publishWallSourceLayeringSweep({
    repoRoot: process.cwd(),
    outPath,
    selectedProfileId: asString(argv["selected-profile-id"]),
    tileLocalSourceElementsPath: asString(argv["tile-local-source-elements"]),
    regionalSourceClosureEvidencePath: asString(
      argv["regional-source-closure-evidence"],
    ),
    layerCounts: parseNumberList(argv.layers, DEFAULT_LAYER_COUNTS),
    packingFractions: parseNumberList(argv.packing, DEFAULT_PACKING_FRACTIONS),
    orientationProjections: parseNumberList(
      argv.orientation,
      DEFAULT_ORIENTATION_PROJECTIONS,
    ),
    materialCorrections: parseNumberList(
      argv["material-correction"],
      DEFAULT_MATERIAL_CORRECTIONS,
    ),
    qMultipliers: parseNumberList(argv["q-multiplier"], DEFAULT_Q_MULTIPLIERS),
    dutyMultipliers: parseNumberList(
      argv["duty-multiplier"],
      DEFAULT_DUTY_MULTIPLIERS,
    ),
    metricReliefFactors: parseNumberList(
      argv["metric-relief"],
      DEFAULT_METRIC_RELIEF_FACTORS,
    ),
    referenceWallControlThicknessMeters: asNumber(argv["reference-wall-thickness"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
