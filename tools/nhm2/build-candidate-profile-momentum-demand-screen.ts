import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { buildNhm2CandidateProfileMomentumDemandScreen } from "../../shared/contracts/nhm2-candidate-profile-momentum-demand-screen.v1";
import { isNhm2CampaignProfileSearch } from "../../shared/contracts/nhm2-campaign-profile-search.v1";
import {
  isNhm2MetricRequiredMomentumDemandAudit,
  type Nhm2MetricRequiredMomentumDemandAuditV1,
} from "../../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

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

export const publishCandidateProfileMomentumDemandScreen = (args: {
  repoRoot: string;
  sourceMetricRequiredMomentumDemandAuditPath: string;
  profileSearchPath: string;
  candidateProfileId: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricRequiredMomentumDemandAuditV1 => {
  if (
    !args.auditOnly &&
    [
      args.sourceMetricRequiredMomentumDemandAuditPath,
      args.profileSearchPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const sourceAudit = readJson(
    resolvePath(args.repoRoot, args.sourceMetricRequiredMomentumDemandAuditPath),
  );
  if (!isNhm2MetricRequiredMomentumDemandAudit(sourceAudit)) {
    throw new Error(
      "source metric-required momentum demand audit must be nhm2_metric_required_momentum_demand_audit/v1",
    );
  }
  const profileSearch = readJson(resolvePath(args.repoRoot, args.profileSearchPath));
  if (!isNhm2CampaignProfileSearch(profileSearch)) {
    throw new Error("profile search must be nhm2_campaign_profile_search/v1");
  }
  const artifact = buildNhm2CandidateProfileMomentumDemandScreen({
    sourceMetricRequiredMomentumDemandAudit: sourceAudit,
    sourceMetricRequiredMomentumDemandAuditRef:
      args.sourceMetricRequiredMomentumDemandAuditPath,
    profileSearch,
    profileSearchRef: args.profileSearchPath,
    candidateProfileId: args.candidateProfileId,
  });
  if (!isNhm2MetricRequiredMomentumDemandAudit(artifact)) {
    throw new Error(
      "internal error: produced invalid candidate metric-required momentum demand audit",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const sourceMetricRequiredMomentumDemandAuditPath = asString(
    args["source-metric-required-momentum-demand-audit"],
  );
  const profileSearchPath = asString(args["profile-search"]);
  const candidateProfileId = asString(args["candidate-profile-id"]);
  const outPath = asString(args.out);
  if (
    sourceMetricRequiredMomentumDemandAuditPath == null ||
    profileSearchPath == null ||
    candidateProfileId == null ||
    outPath == null
  ) {
    throw new Error(
      "--source-metric-required-momentum-demand-audit, --profile-search, --candidate-profile-id, and --out are required",
    );
  }
  const artifact = publishCandidateProfileMomentumDemandScreen({
    repoRoot: process.cwd(),
    sourceMetricRequiredMomentumDemandAuditPath,
    profileSearchPath,
    candidateProfileId,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
