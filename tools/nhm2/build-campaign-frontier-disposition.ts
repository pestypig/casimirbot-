import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CampaignFrontierDisposition,
  isNhm2CampaignFrontierDisposition,
  type Nhm2CampaignFrontierDispositionV1,
} from "../../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import { isNhm2MetricMomentumRemediationTargets } from "../../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import { isNhm2TimeDependentSourceCampaignArtifact } from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";

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

export const publishNhm2CampaignFrontierDisposition = (args: {
  repoRoot: string;
  metricMomentumRemediationTargetsPath: string;
  campaignPath?: string | null;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2CampaignFrontierDispositionV1 => {
  if (
    !args.auditOnly &&
    [
      args.metricMomentumRemediationTargetsPath,
      args.campaignPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const targets = readJson(
    resolvePath(args.repoRoot, args.metricMomentumRemediationTargetsPath),
  );
  if (!isNhm2MetricMomentumRemediationTargets(targets)) {
    throw new Error(
      "metric momentum remediation targets must be nhm2_metric_momentum_remediation_targets/v1",
    );
  }
  const campaign =
    args.campaignPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.campaignPath));
  if (campaign != null && !isNhm2TimeDependentSourceCampaignArtifact(campaign)) {
    throw new Error("campaign must be nhm2_time_dependent_source_campaign/v1");
  }
  const artifact = buildNhm2CampaignFrontierDisposition({
    campaign,
    campaignRef: args.campaignPath ?? null,
    metricMomentumRemediationTargets: targets,
    metricMomentumRemediationTargetsRef: args.metricMomentumRemediationTargetsPath,
  });
  if (!isNhm2CampaignFrontierDisposition(artifact)) {
    throw new Error("internal error: produced invalid campaign frontier disposition");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const metricMomentumRemediationTargetsPath = asString(
    args["metric-momentum-remediation-targets"],
  );
  const campaignPath = asString(args.campaign);
  const outPath = asString(args.out);
  if (metricMomentumRemediationTargetsPath == null || outPath == null) {
    throw new Error("--metric-momentum-remediation-targets and --out are required");
  }
  const artifact = publishNhm2CampaignFrontierDisposition({
    repoRoot: process.cwd(),
    metricMomentumRemediationTargetsPath,
    campaignPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
