import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MetricRequiredMomentumDemandAudit,
  isNhm2MetricRequiredMomentumDemandAudit,
  type Nhm2MetricRequiredMomentumDemandAuditV1,
} from "../../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";
import { isNhm2MomentumFrameProjectionReceipt } from "../../shared/contracts/nhm2-momentum-frame-projection-receipt.v1";

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

export const publishMetricRequiredMomentumDemandAudit = (args: {
  repoRoot: string;
  momentumFrameProjectionReceiptPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricRequiredMomentumDemandAuditV1 => {
  if (
    !args.auditOnly &&
    [args.momentumFrameProjectionReceiptPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const receipt = readJson(
    resolvePath(args.repoRoot, args.momentumFrameProjectionReceiptPath),
  );
  if (!isNhm2MomentumFrameProjectionReceipt(receipt)) {
    throw new Error(
      "momentum frame projection receipt must be nhm2_momentum_frame_projection_receipt/v1",
    );
  }
  const artifact = buildNhm2MetricRequiredMomentumDemandAudit({
    momentumFrameProjectionReceipt: receipt,
    momentumFrameProjectionReceiptRef: args.momentumFrameProjectionReceiptPath,
  });
  if (!isNhm2MetricRequiredMomentumDemandAudit(artifact)) {
    throw new Error("internal error: produced invalid metric-required momentum demand audit");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const momentumFrameProjectionReceiptPath = asString(
    args["momentum-frame-projection-receipt"],
  );
  const outPath = asString(args.out);
  if (momentumFrameProjectionReceiptPath == null || outPath == null) {
    throw new Error("--momentum-frame-projection-receipt and --out are required");
  }
  const artifact = publishMetricRequiredMomentumDemandAudit({
    repoRoot: process.cwd(),
    momentumFrameProjectionReceiptPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
