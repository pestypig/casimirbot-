import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2CampaignProfileRunManifest } from "../../shared/contracts/nhm2-campaign-profile-run-manifest.v1";
import {
  buildNhm2ProfileCampaignFrontier,
  isNhm2ProfileCampaignFrontier,
  type Nhm2ProfileCampaignFrontierArtifactV1,
} from "../../shared/contracts/nhm2-profile-campaign-frontier.v1";

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

export const publishNhm2ProfileCampaignFrontier = (args: {
  repoRoot: string;
  campaignProfileRunManifestPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2ProfileCampaignFrontierArtifactV1 => {
  if (
    !args.auditOnly &&
    [args.campaignProfileRunManifestPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const manifest = readJson(
    resolvePath(args.repoRoot, args.campaignProfileRunManifestPath),
  );
  if (!isNhm2CampaignProfileRunManifest(manifest)) {
    throw new Error(
      "campaign profile run manifest must be nhm2_campaign_profile_run_manifest/v1",
    );
  }

  const artifact = buildNhm2ProfileCampaignFrontier({
    campaignProfileRunManifest: manifest,
    campaignProfileRunManifestRef: args.campaignProfileRunManifestPath,
  });
  if (!isNhm2ProfileCampaignFrontier(artifact)) {
    throw new Error("internal error: produced invalid profile campaign frontier");
  }

  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = asString(args["campaign-profile-run-manifest"]);
  const outPath = asString(args.out);
  if (manifestPath == null || outPath == null) {
    throw new Error("--campaign-profile-run-manifest and --out are required");
  }
  const artifact = publishNhm2ProfileCampaignFrontier({
    repoRoot: process.cwd(),
    campaignProfileRunManifestPath: manifestPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
