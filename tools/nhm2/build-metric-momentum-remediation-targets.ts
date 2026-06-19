import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MetricMomentumRemediationTargets,
  isNhm2MetricMomentumRemediationTargets,
  type Nhm2MetricMomentumRemediationTargetsV1,
} from "../../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import { isNhm2MetricRequiredMomentumDemandAudit } from "../../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

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

export const publishMetricMomentumRemediationTargets = (args: {
  repoRoot: string;
  metricRequiredMomentumDemandAuditPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricMomentumRemediationTargetsV1 => {
  if (
    !args.auditOnly &&
    [args.metricRequiredMomentumDemandAuditPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const demandAudit = readJson(
    resolvePath(args.repoRoot, args.metricRequiredMomentumDemandAuditPath),
  );
  if (!isNhm2MetricRequiredMomentumDemandAudit(demandAudit)) {
    throw new Error(
      "metric-required momentum demand audit must be nhm2_metric_required_momentum_demand_audit/v1",
    );
  }
  const artifact = buildNhm2MetricMomentumRemediationTargets({
    metricRequiredMomentumDemandAudit: demandAudit,
    metricRequiredMomentumDemandAuditRef: args.metricRequiredMomentumDemandAuditPath,
  });
  if (!isNhm2MetricMomentumRemediationTargets(artifact)) {
    throw new Error("internal error: produced invalid metric momentum remediation targets");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const metricRequiredMomentumDemandAuditPath = asString(
    args["metric-required-momentum-demand-audit"],
  );
  const outPath = asString(args.out);
  if (metricRequiredMomentumDemandAuditPath == null || outPath == null) {
    throw new Error("--metric-required-momentum-demand-audit and --out are required");
  }
  const artifact = publishMetricMomentumRemediationTargets({
    repoRoot: process.cwd(),
    metricRequiredMomentumDemandAuditPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
