import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2LayeredWallSourceCandidateArtifact,
  isNhm2LayeredWallSourceCandidateArtifact,
  mapCasimirReceiptStatusToLayeredWallMaterialStatus,
  type Nhm2LayeredWallSourceCandidateV1,
  type Nhm2LayeredWallSourceScalarStatus,
  type Nhm2LayeredWallSourceTensorStatus,
  type Nhm2LayeredWallSourceVolumeMode,
} from "../../shared/contracts/nhm2-layered-wall-source-candidate.v1";
import {
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
  type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
} from "../../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import {
  isNhm2WallSourceLayeringSweepArtifact,
  type Nhm2WallSourceLayeringSweepRowV1,
  type Nhm2WallSourceLayeringSweepV1,
} from "../../shared/contracts/nhm2-wall-source-layering-sweep.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

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

const normalizeVolumeMode = (value: unknown): Nhm2LayeredWallSourceVolumeMode => {
  const text = asString(value);
  return text === "expanded_wall_volume" ? "expanded_wall_volume" : "fixed_control_volume";
};

const artifactPasses = (artifact: unknown, kind: "conservation" | "qei" | "observer"): boolean => {
  const record = asRecord(artifact);
  if (record == null) return false;
  const summary = asRecord(record.summary);
  if (kind === "qei") {
    if (summary?.dossierComplete === true) return true;
    if (record.status === "pass" && record.qeiApplicabilityStatus === "PASS") {
      return true;
    }
    return false;
  }
  if (kind === "observer") {
    if (
      summary?.robustCheckComplete === true &&
      summary?.anyViolation === false &&
      summary?.eulerianOnly !== true
    ) {
      return true;
    }
    return record.status === "pass" || record.overallState === "pass";
  }
  return record.status === "pass" || record.overallState === "pass";
};

const scalarStatusFor = (
  row: Nhm2WallSourceLayeringSweepRowV1,
  selectedVolumeMode: Nhm2LayeredWallSourceVolumeMode,
): Nhm2LayeredWallSourceScalarStatus => {
  if (selectedVolumeMode === "expanded_wall_volume") {
    if (row.expandedScalarT00Pass1pct) return "pass_1pct";
    if (row.expandedScalarT00Pass10pct) return "pass_10pct";
    return "fail";
  }
  if (row.scalarT00Pass1pct) return "pass_1pct";
  if (row.scalarT00Pass10pct) return "pass_10pct";
  return "fail";
};

const tensorStatusFor = (
  row: Nhm2WallSourceLayeringSweepRowV1,
): Nhm2LayeredWallSourceTensorStatus => {
  if (
    row.tensorAuthority === "scalar_t00_only" ||
    row.tensorAuthority === "diagonal_proxy" ||
    row.tensorAuthority === "full_tensor_candidate"
  ) {
    return row.tensorAuthority;
  }
  return "missing";
};

const selectRow = (
  sweep: Nhm2WallSourceLayeringSweepV1,
  rowId: string | null,
): Nhm2WallSourceLayeringSweepRowV1 => {
  const selectedRowId =
    rowId ??
    sweep.bestRows.firstOnePercentFixedVolumeRowId ??
    sweep.bestRows.firstTenPercentFixedVolumeRowId ??
    sweep.bestRows.closestFixedVolumeRowId;
  if (selectedRowId == null) {
    throw new Error("layering sweep has no selectable row");
  }
  const row = sweep.sweepRows.find((entry) => entry.rowId === selectedRowId);
  if (row == null) throw new Error(`layering sweep row not found: ${selectedRowId}`);
  return row;
};

export type BuildLayeredWallSourceCandidateArgs = {
  generatedAt?: string;
  sourceSweep: Nhm2WallSourceLayeringSweepV1;
  sourceSweepRef: string;
  rowId?: string | null;
  selectedVolumeMode?: Nhm2LayeredWallSourceVolumeMode;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
  materialReceiptRef?: string | null;
  sameBasisAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  sameBasisAuthorityRef?: string | null;
  conservationArtifact?: unknown;
  conservationRef?: string | null;
  qeiDossierArtifact?: unknown;
  qeiDossierRef?: string | null;
  observerRobustEnergyConditionsArtifact?: unknown;
  observerRobustEnergyConditionsRef?: string | null;
};

export const buildLayeredWallSourceCandidate = (
  args: BuildLayeredWallSourceCandidateArgs,
): Nhm2LayeredWallSourceCandidateV1 => {
  const selectedVolumeMode = args.selectedVolumeMode ?? "fixed_control_volume";
  const row = selectRow(args.sourceSweep, args.rowId ?? null);
  const scalarWallT00Status = scalarStatusFor(row, selectedVolumeMode);
  const tensorStatus = tensorStatusFor(row);
  const materialStatus = mapCasimirReceiptStatusToLayeredWallMaterialStatus(
    args.materialReceipt?.status,
  );
  const sameBasisTensorAuthority =
    args.sameBasisAuthority?.summary.hasWallAuthority === true &&
    args.sameBasisAuthority.summary.allRequiredRegionsAuthoritative === true;
  const conservation = artifactPasses(args.conservationArtifact, "conservation");
  const qeiDossier = artifactPasses(args.qeiDossierArtifact, "qei");
  const observerRobustEnergyConditions = artifactPasses(
    args.observerRobustEnergyConditionsArtifact,
    "observer",
  );
  const scalarWallT00Candidate =
    scalarWallT00Status === "pass_1pct" || scalarWallT00Status === "pass_10pct";
  const sourceMultiplier =
    selectedVolumeMode === "expanded_wall_volume"
      ? row.expandedVolumeSourceMultiplier
      : row.fixedVolumeSourceMultiplier;
  const effectiveClosureMultiplier =
    selectedVolumeMode === "expanded_wall_volume"
      ? row.closureProductExpandedVolume
      : row.closureProductFixedVolume;

  const blockers = new Set<string>(row.blockers);
  if (!scalarWallT00Candidate) {
    blockers.add(
      selectedVolumeMode === "expanded_wall_volume"
        ? "expanded_volume_wall_t00_residual_exceeded"
        : "fixed_volume_wall_t00_residual_exceeded",
    );
  }
  if (selectedVolumeMode === "fixed_control_volume") {
    blockers.add("fixed_control_volume_not_yet_physical_volume_audit");
  }
  if (
    selectedVolumeMode === "fixed_control_volume" &&
    row.scalarT00Pass10pct &&
    !row.expandedScalarT00Pass10pct
  ) {
    blockers.add("expanded_volume_does_not_preserve_fixed_volume_pass");
  }
  if (tensorStatus !== "full_tensor_candidate") {
    blockers.add("full_tensor_source_missing_or_proxy");
  }
  if (!sameBasisTensorAuthority) {
    blockers.add("same_basis_tensor_authority_missing_or_incomplete");
  }
  if (materialStatus !== "material_receipted") {
    blockers.add("material_receipt_missing_or_not_receipted");
  }
  if (!conservation) blockers.add("conservation_gate_missing_or_not_pass");
  if (!qeiDossier) blockers.add("qei_dossier_missing_or_not_pass");
  if (!observerRobustEnergyConditions) {
    blockers.add("observer_robust_energy_conditions_missing_or_not_pass");
  }
  blockers.add("diagnostic_claim_lock_no_physical_pass");

  return buildNhm2LayeredWallSourceCandidateArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.sourceSweep.selectedProfileId,
    sourceSweepRef: args.sourceSweepRef,
    selectedRowId: row.rowId,
    layerCount: row.layerCount,
    idealStackThicknessMeters: row.idealStackThicknessMeters,
    requiredWallT00AbsSI: args.sourceSweep.baseline.requiredWallT00AbsSI,
    baselineTileLocalWallT00AbsSI:
      args.sourceSweep.baseline.tileLocalWallT00AbsSI,
    candidateWallT00AbsSI:
      args.sourceSweep.baseline.tileLocalWallT00AbsSI * sourceMultiplier,
    effectiveClosureWallT00AbsSI:
      args.sourceSweep.baseline.tileLocalWallT00AbsSI *
      effectiveClosureMultiplier,
    sourceMultiplier,
    metricReliefFactor: row.metricReliefFactor,
    fixedVolumeResidual: row.fixedVolumeResidual,
    expandedVolumeResidual: row.expandedVolumeResidual,
    selectedVolumeMode,
    scalarWallT00Status,
    tensorStatus,
    materialStatus,
    passPath: {
      scalarWallT00Candidate,
      sameBasisTensorAuthority,
      materialReceipt: materialStatus === "material_receipted",
      conservation,
      qeiDossier,
      observerRobustEnergyConditions,
      fullSolvePassEligible: false,
    },
    evidenceRefs: {
      materialReceiptRef: args.materialReceiptRef ?? null,
      sameBasisAuthorityRef: args.sameBasisAuthorityRef ?? null,
      conservationRef: args.conservationRef ?? null,
      qeiDossierRef: args.qeiDossierRef ?? null,
      observerRobustEnergyConditionsRef:
        args.observerRobustEnergyConditionsRef ?? null,
    },
    blockers: Array.from(blockers),
  });
};

export const publishLayeredWallSourceCandidate = (args: {
  repoRoot: string;
  sourceSweepPath: string;
  outPath: string;
  rowId?: string | null;
  selectedVolumeMode?: Nhm2LayeredWallSourceVolumeMode;
  materialReceiptPath?: string | null;
  sameBasisAuthorityPath?: string | null;
  conservationPath?: string | null;
  qeiDossierPath?: string | null;
  observerRobustEnergyConditionsPath?: string | null;
}): Nhm2LayeredWallSourceCandidateV1 => {
  const sweep = readJson(resolvePath(args.repoRoot, args.sourceSweepPath));
  if (!isNhm2WallSourceLayeringSweepArtifact(sweep)) {
    throw new Error("source sweep must be nhm2_wall_source_layering_sweep/v1");
  }
  const materialReceipt =
    args.materialReceiptPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.materialReceiptPath));
  if (materialReceipt != null && !isCasimirMaterialReceipt(materialReceipt)) {
    throw new Error("material receipt must be casimir_material_receipt/v1");
  }
  const sameBasisAuthority =
    args.sameBasisAuthorityPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sameBasisAuthorityPath));
  if (
    sameBasisAuthority != null &&
    !isNhm2SourceSideSameBasisTensorAuthorityArtifact(sameBasisAuthority)
  ) {
    throw new Error(
      "same-basis authority must be nhm2_source_side_same_basis_tensor_authority/v1",
    );
  }
  const conservationArtifact =
    args.conservationPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.conservationPath));
  const qeiDossierArtifact =
    args.qeiDossierPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.qeiDossierPath));
  const observerRobustEnergyConditionsArtifact =
    args.observerRobustEnergyConditionsPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.observerRobustEnergyConditionsPath));
  const artifact = buildLayeredWallSourceCandidate({
    sourceSweep: sweep,
    sourceSweepRef: args.sourceSweepPath,
    rowId: args.rowId,
    selectedVolumeMode: args.selectedVolumeMode,
    materialReceipt:
      materialReceipt == null ? null : materialReceipt,
    materialReceiptRef: args.materialReceiptPath ?? null,
    sameBasisAuthority:
      sameBasisAuthority == null ? null : sameBasisAuthority,
    sameBasisAuthorityRef: args.sameBasisAuthorityPath ?? null,
    conservationArtifact,
    conservationRef: args.conservationPath ?? null,
    qeiDossierArtifact,
    qeiDossierRef: args.qeiDossierPath ?? null,
    observerRobustEnergyConditionsArtifact,
    observerRobustEnergyConditionsRef:
      args.observerRobustEnergyConditionsPath ?? null,
  });
  if (!isNhm2LayeredWallSourceCandidateArtifact(artifact)) {
    throw new Error("internal error: produced invalid layered wall-source candidate");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const argv = parseArgs(process.argv.slice(2));
  const sourceSweepPath = asString(argv.sweep);
  const outPath = asString(argv.out);
  if (sourceSweepPath == null || outPath == null) {
    throw new Error("--sweep and --out are required");
  }
  const artifact = publishLayeredWallSourceCandidate({
    repoRoot: process.cwd(),
    sourceSweepPath,
    outPath,
    rowId: asString(argv["row-id"]),
    selectedVolumeMode: normalizeVolumeMode(argv["volume-mode"]),
    materialReceiptPath: asString(argv["material-receipt"]),
    sameBasisAuthorityPath: asString(argv["same-basis-authority"]),
    conservationPath: asString(argv.conservation),
    qeiDossierPath: asString(argv["qei-dossier"]),
    observerRobustEnergyConditionsPath: asString(
      argv["observer-robust-energy-conditions"],
    ),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
