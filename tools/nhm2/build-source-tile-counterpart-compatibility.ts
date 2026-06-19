import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2SourceTileCounterpartCompatibility,
  isNhm2SourceTileCounterpartCompatibility,
  type Nhm2SourceTileCounterpartCompatibilityArtifactV1,
} from "../../shared/contracts/nhm2-source-tile-counterpart-compatibility.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, ""));

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

const readOptionalJson = (
  repoRoot: string,
  path: string | null,
): unknown | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  return existsSync(resolved) ? readJson(repoRoot, path) : null;
};

export const publishNhm2SourceTileCounterpartCompatibility = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  metricRequiredFullRegionalTensorPath: string;
  outPath: string;
  sourceCounterpartPath?: string | null;
  sourceFullTensorPath?: string | null;
  auditOnly?: boolean;
}): Nhm2SourceTileCounterpartCompatibilityArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.candidateProfileSpecPath,
      args.metricRequiredFullRegionalTensorPath,
      args.sourceCounterpartPath,
      args.sourceFullTensorPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const candidateProfileSpec = readJson(args.repoRoot, args.candidateProfileSpecPath);
  const metricRequiredFullRegionalTensor = readJson(
    args.repoRoot,
    args.metricRequiredFullRegionalTensorPath,
  );
  const sourceCounterpart = readOptionalJson(
    args.repoRoot,
    args.sourceCounterpartPath ?? null,
  );
  const sourceFullTensor = readOptionalJson(
    args.repoRoot,
    args.sourceFullTensorPath ?? null,
  );
  const artifact = buildNhm2SourceTileCounterpartCompatibility({
    candidateProfileSpec,
    metricRequiredFullRegionalTensor,
    metricRequiredFullRegionalTensorRef: args.metricRequiredFullRegionalTensorPath,
    sourceCounterpartRef: args.sourceCounterpartPath ?? null,
    sourceCounterpart,
    sourceFullTensorRef: args.sourceFullTensorPath ?? null,
    sourceFullTensor,
  });
  if (!isNhm2SourceTileCounterpartCompatibility(artifact)) {
    throw new Error(
      "internal error: produced invalid source/tile counterpart compatibility artifact",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const candidateProfileSpecPath = asString(args["candidate-profile-spec"]);
  const metricRequiredFullRegionalTensorPath = asString(
    args["metric-required-full-regional-tensor"],
  );
  const outPath = asString(args.out);
  if (
    candidateProfileSpecPath == null ||
    metricRequiredFullRegionalTensorPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--candidate-profile-spec, --metric-required-full-regional-tensor, and --out are required",
    );
  }
  const artifact = publishNhm2SourceTileCounterpartCompatibility({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    metricRequiredFullRegionalTensorPath,
    sourceCounterpartPath: asString(args["source-counterpart"]),
    sourceFullTensorPath: asString(args["source-full-tensor"]),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
