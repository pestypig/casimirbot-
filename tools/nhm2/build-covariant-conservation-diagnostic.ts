import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CovariantConservationDiagnostic,
  isNhm2CovariantConservationDiagnostic,
  type Nhm2CovariantConservationDiagnosticArtifactV1,
} from "../../shared/contracts/nhm2-covariant-conservation-diagnostic.v1";
import { isNhm2RegionalSupportFunctionAtlas } from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import { isNhm2TileCounterpartConservationArtifact } from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : null;

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

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

export const publishCovariantConservationDiagnostic = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  reducedOrderConservationPath: string;
  outPath: string;
  tensorRef?: string | null;
  toleranceLInf?: number | null;
  auditOnly?: boolean;
}): Nhm2CovariantConservationDiagnosticArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.regionalSupportAtlasPath,
      args.reducedOrderConservationPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const atlas = readJson(resolvePath(args.repoRoot, args.regionalSupportAtlasPath));
  if (!isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }
  const reducedOrderConservation = readJson(
    resolvePath(args.repoRoot, args.reducedOrderConservationPath),
  );
  if (!isNhm2TileCounterpartConservationArtifact(reducedOrderConservation)) {
    throw new Error("reduced-order conservation must be nhm2_tile_counterpart_conservation/v1");
  }
  const artifact = buildNhm2CovariantConservationDiagnostic({
    atlas,
    atlasRef: args.regionalSupportAtlasPath,
    reducedOrderConservation,
    reducedOrderConservationRef: args.reducedOrderConservationPath,
    tensorRef: args.tensorRef ?? null,
    toleranceLInf: args.toleranceLInf ?? null,
  });
  if (!isNhm2CovariantConservationDiagnostic(artifact)) {
    throw new Error("internal error: produced invalid covariant conservation diagnostic artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const regionalSupportAtlasPath = asString(args["regional-support-atlas"]);
  const reducedOrderConservationPath = asString(args["reduced-order-conservation"]);
  const outPath = asString(args.out);
  if (
    regionalSupportAtlasPath == null ||
    reducedOrderConservationPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--regional-support-atlas, --reduced-order-conservation, and --out are required",
    );
  }
  const artifact = publishCovariantConservationDiagnostic({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    reducedOrderConservationPath,
    outPath,
    tensorRef: asString(args["tensor-ref"]),
    toleranceLInf: asNumber(args.tolerance),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
