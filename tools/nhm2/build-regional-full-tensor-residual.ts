import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2RegionalFullTensorResidual,
  isNhm2RegionalFullTensorResidual,
  type Nhm2RegionalFullTensorResidualArtifactV1,
} from "../../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import { isNhm2RegionalSourceClosureEvidenceArtifact } from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

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

export const publishRegionalFullTensorResidual = (args: {
  repoRoot: string;
  regionalSourceClosureEvidencePath: string;
  outPath: string;
  expectedAtlasHash?: string | null;
  toleranceRelLInf?: number | null;
  auditOnly?: boolean;
}): Nhm2RegionalFullTensorResidualArtifactV1 => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.regionalSourceClosureEvidencePath) ||
      pathUsesLatestAlias(args.outPath))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const evidence = readJson(
    resolvePath(args.repoRoot, args.regionalSourceClosureEvidencePath),
  );
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(evidence)) {
    throw new Error("regional source closure evidence must be nhm2_regional_source_closure_evidence/v1");
  }
  const artifact = buildNhm2RegionalFullTensorResidual({
    regionalSourceClosureEvidence: evidence,
    regionalSourceClosureEvidenceRef: args.regionalSourceClosureEvidencePath,
    expectedAtlasHash: args.expectedAtlasHash ?? null,
    toleranceRelLInf: args.toleranceRelLInf ?? null,
  });
  if (!isNhm2RegionalFullTensorResidual(artifact)) {
    throw new Error("internal error: produced invalid regional full tensor residual artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const regionalSourceClosureEvidencePath = asString(args["regional-source-closure-evidence"]);
  const outPath = asString(args.out);
  if (regionalSourceClosureEvidencePath == null || outPath == null) {
    throw new Error("--regional-source-closure-evidence and --out are required");
  }
  const artifact = publishRegionalFullTensorResidual({
    repoRoot: process.cwd(),
    regionalSourceClosureEvidencePath,
    outPath,
    expectedAtlasHash: asString(args["expected-atlas-hash"]),
    toleranceRelLInf: asNumber(args.tolerance),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
