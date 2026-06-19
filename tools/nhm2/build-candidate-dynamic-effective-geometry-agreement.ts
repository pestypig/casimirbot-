import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import {
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";
import { runNhm2AveragedSourceTensorReceipt } from "./build-averaged-source-tensor-receipt.ts";
import { runNhm2BackreactionResidualReceipt } from "./build-backreaction-residual-receipt.ts";
import { runNhm2DynamicEffectiveGeometryEvidence } from "./build-dynamic-effective-geometry-evidence.ts";
import { runNhm2GrEvolveDynamicGeometryCapture } from "./capture-gr-evolve-dynamic-geometry-samples.ts";
import { runNhm2GrEvolveEffectiveGeometryReferenceCapture } from "./capture-gr-evolve-effective-geometry-reference.ts";

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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDims = (value: unknown): [number, number, number] => {
  const text = asString(value);
  if (text == null) return [8, 8, 8];
  const parts = text.split(",").map((entry) => Number(entry.trim()));
  if (
    parts.length !== 3 ||
    parts.some((entry) => !Number.isFinite(entry) || entry < 2)
  ) {
    throw new Error("--dims must be three comma-separated integers >= 2");
  }
  return parts.map((entry) => Math.floor(entry)) as [number, number, number];
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const refJoin = (...parts: string[]): string => join(...parts).replace(/\\/g, "/");

const readJson = (repoRoot: string, path: string): unknown => {
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) throw new Error(`artifact missing: ${path}`);
  return JSON.parse(readFileSync(resolved, "utf8").replace(/^\uFEFF/, ""));
};

const readSourceTensor = (
  repoRoot: string,
  path: string,
): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const artifact = readJson(repoRoot, path);
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(artifact)) {
    throw new Error("source tensor must be nhm2_tile_effective_full_tensor_source/v1");
  }
  return artifact;
};

const readAtlas = (
  repoRoot: string,
  path: string | null,
): Nhm2RegionalSupportFunctionAtlasV1 | null => {
  if (path == null) return null;
  const artifact = readJson(repoRoot, path);
  if (!isNhm2RegionalSupportFunctionAtlas(artifact)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }
  return artifact;
};

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

export const runNhm2CandidateDynamicEffectiveGeometryAgreement = (args: {
  repoRoot: string;
  runRoot: string;
  sourceTensorPath?: string | null;
  frequencyConvergencePath?: string | null;
  switchingConservationPath?: string | null;
  atlasPath?: string | null;
  averagingWindowSeconds?: number | null;
  toleranceLInf?: number | null;
  dims?: [number, number, number] | null;
  steps?: number | null;
  dtSeconds?: number | null;
  auditOnly?: boolean;
}): Nhm2DynamicEffectiveGeometryEvidenceV1 => {
  const sourceTensorPath =
    args.sourceTensorPath ??
    refJoin(args.runRoot, "nhm2-candidate-tile-effective-full-tensor-source.json");
  const frequencyConvergencePath =
    args.frequencyConvergencePath ??
    refJoin(args.runRoot, "nhm2-frequency-convergence-evidence.json");
  const switchingConservationPath =
    args.switchingConservationPath ??
    refJoin(args.runRoot, "nhm2-switching-covariant-conservation-evidence.json");
  const atlasPath =
    args.atlasPath ?? refJoin(args.runRoot, "nhm2-regional-support-function-atlas.json");

  if (
    !args.auditOnly &&
    [
      args.runRoot,
      sourceTensorPath,
      frequencyConvergencePath,
      switchingConservationPath,
      atlasPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  mkdirSync(resolvePath(args.repoRoot, args.runRoot), { recursive: true });

  const sourceTensor = readSourceTensor(args.repoRoot, sourceTensorPath);
  const atlas = readAtlas(args.repoRoot, atlasPath);
  const laneId = sourceTensor.laneId;
  const selectedProfileId = sourceTensor.selectedProfileId;
  const runId = sourceTensor.runId;
  const chartId = atlas?.runIdentity.chartId ?? "comoving_cartesian";
  const atlasHash = atlas?.provenance.atlasHash ?? null;
  const averagingWindowSeconds = args.averagingWindowSeconds ?? 1;
  const dims = args.dims ?? [8, 8, 8];

  const averagedSourcePath = refJoin(args.runRoot, "nhm2-averaged-source-tensor-receipt.json");
  const effectiveBrickPath = refJoin(args.runRoot, "nhm2-effective-geometry-reference.brick.json");
  const effectiveReferencePath = refJoin(args.runRoot, "nhm2-effective-geometry-reference.json");
  const dynamicBrickPath = refJoin(args.runRoot, "nhm2-dynamic-geometry-sample.brick.json");
  const dynamicSamplesPath = refJoin(args.runRoot, "nhm2-dynamic-geometry-samples.json");
  const backreactionPath = refJoin(args.runRoot, "nhm2-backreaction-residual-receipt.json");
  const dynamicAgreementPath = refJoin(args.runRoot, "nhm2-dynamic-effective-geometry-evidence.json");

  runNhm2AveragedSourceTensorReceipt({
    repoRoot: args.repoRoot,
    outPath: averagedSourcePath,
    laneId,
    selectedProfileId,
    runId,
    chartId,
    atlasRef: atlasPath,
    atlasHash,
    sourceTensorPath,
    frequencyConvergencePath,
    switchingConservationPath,
    averagingWindowSeconds,
    cycleAverageSourceFixed: true,
  });

  runNhm2GrEvolveEffectiveGeometryReferenceCapture({
    repoRoot: args.repoRoot,
    outPath: effectiveReferencePath,
    brickOutPath: effectiveBrickPath,
    laneId,
    selectedProfileId,
    runId,
    chartId,
    atlasRef: atlasPath,
    atlasHash,
    dims,
    timeSeconds: 0,
  });

  runNhm2GrEvolveDynamicGeometryCapture({
    repoRoot: args.repoRoot,
    outPath: dynamicSamplesPath,
    brickOutPath: dynamicBrickPath,
    laneId,
    selectedProfileId,
    runId,
    chartId,
    atlasRef: atlasPath,
    atlasHash,
    sourceTensorRef: sourceTensorPath,
    switchingConservationRef: switchingConservationPath,
    frequencyConvergenceRef: frequencyConvergencePath,
    cycleCount: 1,
    averagingWindowSeconds,
    fixedCycleAverageSource: true,
    dims,
    steps: Math.max(0, Math.floor(args.steps ?? 0)),
    dtSeconds: Math.max(0, args.dtSeconds ?? 0),
    timeSeconds: 0,
  });

  runNhm2BackreactionResidualReceipt({
    repoRoot: args.repoRoot,
    outPath: backreactionPath,
    dynamicGeometrySamplesPath: dynamicSamplesPath,
    effectiveGeometryReferencePath: effectiveReferencePath,
    averagedSourceTensorReceiptPath: averagedSourcePath,
    toleranceLInf: args.toleranceLInf ?? 0.1,
  });

  return runNhm2DynamicEffectiveGeometryEvidence({
    repoRoot: args.repoRoot,
    outPath: dynamicAgreementPath,
    dynamicGeometrySamplesPath: dynamicSamplesPath,
    effectiveGeometryReferencePath: effectiveReferencePath,
    averagedSourceTensorReceiptPath: averagedSourcePath,
    backreactionResidualReceiptPath: backreactionPath,
    averagingWindowSeconds,
    cycleAverageSourceFixed: true,
    toleranceLInf: args.toleranceLInf ?? 0.1,
  });
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const runRoot = asString(args["run-root"]);
  if (runRoot == null) throw new Error("missing required --run-root");
  const artifact = runNhm2CandidateDynamicEffectiveGeometryAgreement({
    repoRoot: process.cwd(),
    runRoot,
    sourceTensorPath: asString(args["source-tensor"]),
    frequencyConvergencePath: asString(args["frequency-convergence"]),
    switchingConservationPath: asString(args["switching-conservation"]),
    atlasPath: asString(args.atlas),
    averagingWindowSeconds: asNumber(args["averaging-window-seconds"]),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    dims: parseDims(args.dims),
    steps: asNumber(args.steps),
    dtSeconds: asNumber(args["dt-s"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
  process.exit(0);
}
