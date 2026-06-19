import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2RegionalFullTensorResidual } from "../../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import { isNhm2RegionalSupportFunctionAtlas } from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  buildNhm2SourceMomentumDensityAudit,
  isNhm2SourceMomentumDensityAudit,
  type Nhm2SourceMomentumDensityAuditArtifactV1,
} from "../../shared/contracts/nhm2-source-momentum-density-audit.v1";
import { isNhm2SourceComponentAuthorityLedger } from "../../shared/contracts/nhm2-source-component-authority-ledger.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

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

export const publishSourceMomentumDensityAudit = (args: {
  repoRoot: string;
  sourceComponentAuthorityLedgerPath: string;
  regionalFullTensorResidualPath: string;
  regionalSupportAtlasPath?: string | null;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2SourceMomentumDensityAuditArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.sourceComponentAuthorityLedgerPath,
      args.regionalFullTensorResidualPath,
      args.regionalSupportAtlasPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const ledger = readJson(resolvePath(args.repoRoot, args.sourceComponentAuthorityLedgerPath));
  if (!isNhm2SourceComponentAuthorityLedger(ledger)) {
    throw new Error("source component authority ledger must be nhm2_source_component_authority_ledger/v1");
  }
  const residual = readJson(resolvePath(args.repoRoot, args.regionalFullTensorResidualPath));
  if (!isNhm2RegionalFullTensorResidual(residual)) {
    throw new Error("regional full tensor residual must be nhm2_regional_full_tensor_residual/v1");
  }
  const atlas =
    args.regionalSupportAtlasPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.regionalSupportAtlasPath));
  if (atlas != null && !isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }
  const artifact = buildNhm2SourceMomentumDensityAudit({
    sourceComponentAuthorityLedger: ledger,
    regionalFullTensorResidual: residual,
    regionalSupportFunctionAtlas: atlas,
    sourceComponentAuthorityLedgerRef: args.sourceComponentAuthorityLedgerPath,
    regionalFullTensorResidualRef: args.regionalFullTensorResidualPath,
    regionalSupportFunctionAtlasRef: args.regionalSupportAtlasPath ?? null,
  });
  if (!isNhm2SourceMomentumDensityAudit(artifact)) {
    throw new Error("internal error: produced invalid source momentum-density audit");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const sourceComponentAuthorityLedgerPath = asString(args["source-component-authority-ledger"]);
  const regionalFullTensorResidualPath = asString(args["regional-full-tensor-residual"]);
  const regionalSupportAtlasPath = asString(args["regional-support-atlas"]);
  const outPath = asString(args.out);
  if (
    sourceComponentAuthorityLedgerPath == null ||
    regionalFullTensorResidualPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--source-component-authority-ledger, --regional-full-tensor-residual, and --out are required",
    );
  }
  const artifact = publishSourceMomentumDensityAudit({
    repoRoot: process.cwd(),
    sourceComponentAuthorityLedgerPath,
    regionalFullTensorResidualPath,
    regionalSupportAtlasPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
