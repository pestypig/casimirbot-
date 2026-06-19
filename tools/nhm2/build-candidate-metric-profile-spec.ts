import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CandidateMetricProfileSpec,
  isNhm2CandidateMetricProfileSpec,
  type Nhm2CandidateMetricProfileSpecV1,
} from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import { isNhm2CampaignProfileSearch } from "../../shared/contracts/nhm2-campaign-profile-search.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

export const publishNhm2CandidateMetricProfileSpec = (args: {
  repoRoot: string;
  profileSearchPath: string;
  candidateProfileId: string;
  outPath: string;
  coordinateTimeSeconds?: number | null;
  runtimeProfileId?: string | null;
  runtimeProfileRef?: string | null;
  transitionKernelAdapterRef?: string | null;
  shiftFieldEvaluatorRef?: string | null;
  regionalSupportAtlasRef?: string | null;
  gridRef?: string | null;
  auditOnly?: boolean;
}): Nhm2CandidateMetricProfileSpecV1 => {
  if (
    !args.auditOnly &&
    [
      args.profileSearchPath,
      args.outPath,
      args.runtimeProfileRef,
      args.transitionKernelAdapterRef,
      args.shiftFieldEvaluatorRef,
      args.regionalSupportAtlasRef,
      args.gridRef,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const profileSearch = readJson(resolvePath(args.repoRoot, args.profileSearchPath));
  if (!isNhm2CampaignProfileSearch(profileSearch)) {
    throw new Error("profile search must be nhm2_campaign_profile_search/v1");
  }

  const artifact = buildNhm2CandidateMetricProfileSpec({
    profileSearch,
    profileSearchRef: args.profileSearchPath,
    candidateProfileId: args.candidateProfileId,
    coordinateTimeSeconds: args.coordinateTimeSeconds ?? null,
    runtimeProfileId: args.runtimeProfileId ?? null,
    runtimeProfileRef: args.runtimeProfileRef ?? null,
    transitionKernelAdapterRef: args.transitionKernelAdapterRef ?? null,
    shiftFieldEvaluatorRef: args.shiftFieldEvaluatorRef ?? null,
    regionalSupportAtlasRef: args.regionalSupportAtlasRef ?? null,
    gridRef: args.gridRef ?? null,
  });
  if (!isNhm2CandidateMetricProfileSpec(artifact)) {
    throw new Error("internal error: produced invalid candidate metric profile spec");
  }

  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const profileSearchPath = asString(args["profile-search"]);
  const candidateProfileId = asString(args["candidate-profile-id"]);
  const outPath = asString(args.out);
  if (profileSearchPath == null || candidateProfileId == null || outPath == null) {
    throw new Error("--profile-search, --candidate-profile-id, and --out are required");
  }
  const artifact = publishNhm2CandidateMetricProfileSpec({
    repoRoot: process.cwd(),
    profileSearchPath,
    candidateProfileId,
    outPath,
    coordinateTimeSeconds: asNumber(args["coordinate-time-seconds"]),
    runtimeProfileId: asString(args["runtime-profile-id"]),
    runtimeProfileRef: asString(args["runtime-profile-ref"]),
    transitionKernelAdapterRef: asString(args["transition-kernel-adapter-ref"]),
    shiftFieldEvaluatorRef: asString(args["shift-field-evaluator-ref"]),
    regionalSupportAtlasRef: asString(args["regional-support-atlas-ref"]),
    gridRef: asString(args["grid-ref"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
