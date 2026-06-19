import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2CampaignProfileRunManifest,
  isNhm2CampaignProfileRunManifest,
  type Nhm2CampaignProfileRunEvidenceId,
  type Nhm2CampaignProfileRunEvidenceInput,
  type Nhm2CampaignProfileRunManifestArtifactV1,
} from "../../shared/contracts/nhm2-campaign-profile-run-manifest.v1";
import { isNhm2CampaignProfileSearch } from "../../shared/contracts/nhm2-campaign-profile-search.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asString(entry))
        .filter((entry): entry is string => entry != null)
    : [];

const evidenceBlockersFromArtifact = (artifact: unknown): string[] => {
  const blockers = new Set<string>();
  const record = asRecord(artifact);
  if (
    record?.contractVersion === "nhm2_candidate_metric_profile_spec/v1" &&
    asRecord(record.campaignReadiness)?.canEnterFullAdmMetricTensorRoute === true
  ) {
    return [];
  }
  const summary = asRecord(record?.summary);
  const campaignReadiness = asRecord(record?.campaignReadiness);
  const executableGeometry = asRecord(record?.executableGeometry);
  const firstBlocker = asString(summary?.firstBlocker);
  if (firstBlocker != null) blockers.add(firstBlocker);
  const campaignFirstBlocker = asString(campaignReadiness?.firstBlocker);
  if (campaignFirstBlocker != null) blockers.add(campaignFirstBlocker);
  for (const blocker of stringList(record?.blockers)) blockers.add(blocker);
  for (const blocker of stringList(campaignReadiness?.blockers)) blockers.add(blocker);
  for (const blocker of stringList(executableGeometry?.blockers)) blockers.add(blocker);
  const regions = Array.isArray(record?.regions) ? record.regions : [];
  for (const entry of regions) {
    const region = asRecord(entry);
    const regionId = asString(region?.regionId) ?? "region";
    for (const blocker of stringList(region?.blockers)) {
      blockers.add(`${regionId}:${blocker}`);
    }
  }
  return Array.from(blockers);
};

const readEvidenceInput = (
  repoRoot: string,
  ref: string,
): Nhm2CampaignProfileRunEvidenceInput => {
  const artifact = readJson(resolvePath(repoRoot, ref));
  return {
    artifactRef: ref,
    blockers: evidenceBlockersFromArtifact(artifact),
  };
};

const evidenceFileNames: Record<Nhm2CampaignProfileRunEvidenceId, string> = {
  candidate_metric_profile_spec: "nhm2-candidate-metric-profile-spec.json",
  metric_required_full_regional_tensor:
    "nhm2-metric-required-full-regional-tensor.json",
  projected_momentum_demand_audit:
    "nhm2-metric-required-momentum-demand-audit.json",
  metric_momentum_remediation_targets: "nhm2-metric-momentum-remediation-targets.json",
  source_tile_counterpart_compatibility:
    "nhm2-source-tile-counterpart-compatibility.json",
  regional_full_tensor_residuals: "nhm2-regional-full-tensor-residual.json",
  switching_covariant_conservation:
    "nhm2-switching-covariant-conservation-evidence.json",
  frequency_convergence: "nhm2-frequency-convergence-evidence.json",
  dynamic_effective_geometry_agreement:
    "nhm2-dynamic-effective-geometry-evidence.json",
  qei_worldline_dossier: "nhm2-qei-worldline-dossier.json",
  observer_family_energy_conditions:
    "nhm2-observer-robust-energy-conditions.json",
  horizon_blueshift_particle_stability: "nhm2-campaign-stability-evidence.json",
  time_dependent_source_campaign: "nhm2-time-dependent-source-campaign.json",
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

export const publishNhm2CampaignProfileRunManifest = (args: {
  repoRoot: string;
  profileSearchPath: string;
  outPath: string;
  runRootBase?: string | null;
  auditOnly?: boolean;
}): Nhm2CampaignProfileRunManifestArtifactV1 => {
  if (
    !args.auditOnly &&
    [args.profileSearchPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const profileSearch = readJson(resolvePath(args.repoRoot, args.profileSearchPath));
  if (!isNhm2CampaignProfileSearch(profileSearch)) {
    throw new Error("profile search must be nhm2_campaign_profile_search/v1");
  }
  const runRootBase =
    args.runRootBase ?? "artifacts/research/full-solve/profile-campaign-runs";
  const candidateEvidenceRefs = Object.fromEntries(
    profileSearch.candidates.map((candidate) => {
      const refs = Object.fromEntries(
        Object.entries(evidenceFileNames).flatMap(([evidenceId, fileName]) => {
          const ref = join(runRootBase, candidate.candidateProfileId, fileName);
          return existsSync(resolvePath(args.repoRoot, ref))
            ? [[evidenceId, readEvidenceInput(args.repoRoot, ref)]]
            : [];
        }),
      );
      return [candidate.candidateProfileId, refs];
    }),
  );

  const artifact = buildNhm2CampaignProfileRunManifest({
    profileSearch,
    profileSearchRef: args.profileSearchPath,
    runRootBase,
    candidateEvidenceRefs,
  });
  if (!isNhm2CampaignProfileRunManifest(artifact)) {
    throw new Error("internal error: produced invalid campaign profile run manifest");
  }

  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const profileSearchPath = asString(args["profile-search"]);
  const outPath = asString(args.out);
  if (profileSearchPath == null || outPath == null) {
    throw new Error("--profile-search and --out are required");
  }
  const artifact = publishNhm2CampaignProfileRunManifest({
    repoRoot: process.cwd(),
    profileSearchPath,
    outPath,
    runRootBase: asString(args["run-root-base"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
