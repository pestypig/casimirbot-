import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CampaignProfileSearch,
  isNhm2CampaignProfileSearch,
  type Nhm2CampaignProfileSearchArtifactV1,
} from "../../shared/contracts/nhm2-campaign-profile-search.v1";
import { isNhm2CampaignFrontierDisposition } from "../../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import { isNhm2MetricMomentumRemediationTargets } from "../../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";

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

export const publishNhm2CampaignProfileSearch = (args: {
  repoRoot: string;
  metricMomentumRemediationTargetsPath: string;
  campaignFrontierDispositionPath?: string | null;
  sourceCampaignRef?: string | null;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2CampaignProfileSearchArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.metricMomentumRemediationTargetsPath,
      args.campaignFrontierDispositionPath,
      args.sourceCampaignRef,
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

  const disposition =
    args.campaignFrontierDispositionPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.campaignFrontierDispositionPath));
  if (disposition != null && !isNhm2CampaignFrontierDisposition(disposition)) {
    throw new Error(
      "campaign frontier disposition must be nhm2_campaign_frontier_disposition/v1",
    );
  }

  const artifact = buildNhm2CampaignProfileSearch({
    sourceCampaignRef: args.sourceCampaignRef ?? null,
    campaignFrontierDisposition: disposition,
    campaignFrontierDispositionRef: args.campaignFrontierDispositionPath ?? null,
    metricMomentumRemediationTargets: targets,
    metricMomentumRemediationTargetsRef: args.metricMomentumRemediationTargetsPath,
  });
  if (!isNhm2CampaignProfileSearch(artifact)) {
    throw new Error("internal error: produced invalid campaign profile search");
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
  const campaignFrontierDispositionPath = asString(
    args["campaign-frontier-disposition"],
  );
  const sourceCampaignRef = asString(args["source-campaign-ref"]);
  const outPath = asString(args.out);
  if (metricMomentumRemediationTargetsPath == null || outPath == null) {
    throw new Error("--metric-momentum-remediation-targets and --out are required");
  }
  const artifact = publishNhm2CampaignProfileSearch({
    repoRoot: process.cwd(),
    metricMomentumRemediationTargetsPath,
    campaignFrontierDispositionPath,
    sourceCampaignRef,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
