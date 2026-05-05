import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2TileCounterpartConservationArtifact,
  type Nhm2TileCounterpartConservationArtifact,
} from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import { isNhm2TileEffectiveFullTensorSourceArtifact } from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

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

export const publishTileCounterpartConservation = (args: {
  repoRoot: string;
  referenceRunPath: string;
  tileFullTensorSourcePath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2TileCounterpartConservationArtifact => {
  if (
    !args.auditOnly &&
    [args.referenceRunPath, args.tileFullTensorSourcePath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const source = readJson(resolvePath(args.repoRoot, args.tileFullTensorSourcePath));
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(source)) {
    throw new Error("tile full tensor source must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const sourceRegions = new Map(source.regions.map((region) => [region.regionId, region]));
  const regions: Nhm2TileCounterpartConservationArtifact["regions"] =
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const region = sourceRegions.get(regionId);
    return {
      regionId: regionId as Nhm2RegionalSourceClosureRegionId,
      status: region == null ? "missing" : "review",
      divTResidualLInf: null,
      continuityResidualLInf: null,
      momentumResidualLInf: null,
      toleranceLInf: null,
      sampleCount: region?.sampleCount ?? null,
      blockers: region == null ? ["source_region_missing"] : ["conservation_unknown"],
    };
  });

  const artifact = buildNhm2TileCounterpartConservationArtifact({
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    chartRef: "comoving_cartesian",
    derivativeStencil: "not_computed_validation_hardening_placeholder",
    unitsRef: "same_as_tile_effective_counterpart",
    regions,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const sourcePath = asString(args["tile-full-tensor-source"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || sourcePath == null || outPath == null) {
    throw new Error("--reference-run, --tile-full-tensor-source, and --out are required");
  }
  const artifact = publishTileCounterpartConservation({
    repoRoot: process.cwd(),
    referenceRunPath,
    tileFullTensorSourcePath: sourcePath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
