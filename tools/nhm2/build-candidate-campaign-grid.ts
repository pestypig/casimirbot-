import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CandidateCampaignGrid,
  isNhm2CandidateCampaignGrid,
  type Nhm2CandidateCampaignGridV1,
} from "../../shared/contracts/nhm2-candidate-campaign-grid.v1";
import { isNhm2CandidateMetricProfileSpec } from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, ""));

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

export const publishNhm2CandidateCampaignGrid = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  outPath: string;
  closureRegionSampleCount?: number | null;
  transitionRegionSampleCount?: number | null;
  auditOnly?: boolean;
}): Nhm2CandidateCampaignGridV1 => {
  if (
    !args.auditOnly &&
    [args.candidateProfileSpecPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const candidateProfileSpec = readJson(args.repoRoot, args.candidateProfileSpecPath);
  if (!isNhm2CandidateMetricProfileSpec(candidateProfileSpec)) {
    throw new Error("candidate profile spec must be nhm2_candidate_metric_profile_spec/v1");
  }
  const grid = buildNhm2CandidateCampaignGrid({
    candidateProfileSpec,
    candidateProfileSpecRef: args.candidateProfileSpecPath,
    closureRegionSampleCount: args.closureRegionSampleCount ?? null,
    transitionRegionSampleCount: args.transitionRegionSampleCount ?? null,
  });
  if (!isNhm2CandidateCampaignGrid(grid)) {
    throw new Error("internal error: produced invalid candidate campaign grid");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(grid, null, 2)}\n`, "utf8");
  return grid;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const candidateProfileSpecPath = asString(args["candidate-profile-spec"]);
  const outPath = asString(args.out);
  if (candidateProfileSpecPath == null || outPath == null) {
    throw new Error("--candidate-profile-spec and --out are required");
  }
  const artifact = publishNhm2CandidateCampaignGrid({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    outPath,
    closureRegionSampleCount: asNumber(args["closure-region-sample-count"]),
    transitionRegionSampleCount: asNumber(args["transition-region-sample-count"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
