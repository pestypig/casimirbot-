import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MomentumFrameProjectionReceipt,
  isNhm2MomentumFrameProjectionEvidence,
  isNhm2MomentumFrameProjectionReceipt,
  type Nhm2MomentumFrameProjectionEvidenceV1,
  type Nhm2MomentumFrameProjectionReceiptV1,
} from "../../shared/contracts/nhm2-momentum-frame-projection-receipt.v1";
import { isNhm2RegionalSupportFunctionAtlas } from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import { isNhm2SourceMomentumDensityAudit } from "../../shared/contracts/nhm2-source-momentum-density-audit.v1";

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

export const publishMomentumFrameProjectionReceipt = (args: {
  repoRoot: string;
  sourceMomentumDensityAuditPath: string;
  regionalSupportAtlasPath: string;
  projectionEvidencePath?: string | null;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MomentumFrameProjectionReceiptV1 => {
  if (
    !args.auditOnly &&
    [
      args.sourceMomentumDensityAuditPath,
      args.regionalSupportAtlasPath,
      args.projectionEvidencePath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const audit = readJson(resolvePath(args.repoRoot, args.sourceMomentumDensityAuditPath));
  if (!isNhm2SourceMomentumDensityAudit(audit)) {
    throw new Error("source momentum-density audit must be nhm2_source_momentum_density_audit/v1");
  }
  const atlas = readJson(resolvePath(args.repoRoot, args.regionalSupportAtlasPath));
  if (!isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }
  const projectionEvidence =
    args.projectionEvidencePath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.projectionEvidencePath));
  if (
    projectionEvidence != null &&
    !isNhm2MomentumFrameProjectionEvidence(projectionEvidence)
  ) {
    throw new Error(
      "projection evidence must be nhm2_momentum_frame_projection_evidence/v1",
    );
  }
  const artifact = buildNhm2MomentumFrameProjectionReceipt({
    sourceMomentumDensityAudit: audit,
    regionalSupportFunctionAtlas: atlas,
    sourceMomentumDensityAuditRef: args.sourceMomentumDensityAuditPath,
    regionalSupportFunctionAtlasRef: args.regionalSupportAtlasPath,
    momentumFrameProjectionEvidence:
      projectionEvidence as Nhm2MomentumFrameProjectionEvidenceV1 | null,
    momentumFrameProjectionEvidenceRef: args.projectionEvidencePath ?? null,
  });
  if (!isNhm2MomentumFrameProjectionReceipt(artifact)) {
    throw new Error("internal error: produced invalid momentum frame projection receipt");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const sourceMomentumDensityAuditPath = asString(args["source-momentum-density-audit"]);
  const regionalSupportAtlasPath = asString(args["regional-support-atlas"]);
  const projectionEvidencePath = asString(args["projection-evidence"]);
  const outPath = asString(args.out);
  if (
    sourceMomentumDensityAuditPath == null ||
    regionalSupportAtlasPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--source-momentum-density-audit, --regional-support-atlas, and --out are required",
    );
  }
  const artifact = publishMomentumFrameProjectionReceipt({
    repoRoot: process.cwd(),
    sourceMomentumDensityAuditPath,
    regionalSupportAtlasPath,
    projectionEvidencePath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
