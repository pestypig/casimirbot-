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

const isIgnorableBlocker = (blocker: string): boolean =>
  blocker.trim().toLowerCase() === "none";

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
  const disposition = asRecord(record?.disposition);
  if (
    typeof record?.contractVersion === "string" &&
    record.contractVersion.startsWith("nhm2_tile_source_") &&
    record.contractVersion.endsWith("_test_plan/v1")
  ) {
    const nextRequiredTestId = asString(summary?.nextRequiredTestId);
    if (nextRequiredTestId != null && nextRequiredTestId !== "none") {
      blockers.add(`${nextRequiredTestId}_required`);
    }
    const openTestCount =
      typeof summary?.openTestCount === "number" && Number.isFinite(summary.openTestCount)
        ? summary.openTestCount
        : null;
    if (openTestCount != null && openTestCount > 0) {
      blockers.add(`tile_source_test_plan_open_tests_${openTestCount}`);
    }
  }
  if (record?.contractVersion === "nhm2_tile_source_evidence_gap_roadmap/v1") {
    const nextBestItemId = asString(summary?.nextBestItemId);
    if (nextBestItemId != null && nextBestItemId !== "none") {
      blockers.add(`${nextBestItemId}_evidence_gap_open`);
    }
  }
  if (record?.contractVersion === "nhm2_tile_source_falsification_report/v1") {
    const reportStatus = asString(disposition?.reportStatus);
    if (reportStatus != null && reportStatus !== "candidate_evidence_complete") {
      blockers.add(`tile_source_falsification_report_${reportStatus}`);
    }
    const nextRequiredSurfaceId = asString(summary?.nextRequiredSurfaceId);
    if (nextRequiredSurfaceId != null && nextRequiredSurfaceId !== "none") {
      blockers.add(`${nextRequiredSurfaceId}_surface_required`);
    }
  }
  if (record?.contractVersion === "nhm2_tile_source_authority_handoff/v1") {
    const handoffStatus = asString(summary?.handoffStatus);
    if (handoffStatus != null && handoffStatus !== "handoff_ready") {
      blockers.add(`tile_source_authority_handoff_${handoffStatus}`);
    }
  }
  if (record?.contractVersion === "nhm2_observer_robust_energy_conditions/v1") {
    const observerCompleteWithoutViolation =
      summary?.robustCheckComplete === true && summary?.anyViolation !== true;
    if (summary?.robustCheckComplete !== true) {
      blockers.add("observer_robust_check_incomplete");
    }
    if (summary?.anyViolation === true) {
      blockers.add("observer_family_energy_condition_violation");
    }
    const families = Array.isArray(record.observerFamilies)
      ? record.observerFamilies
      : [];
    for (const entry of families) {
      const family = asRecord(entry);
      const familyId = asString(family?.familyId) ?? "observer_family";
      if (family?.status === "fail") {
        const worst = asRecord(family.worstCase);
        const condition = asString(worst?.condition) ?? "energy_condition";
        blockers.add(`${familyId}:${condition}:observer_energy_condition_violation`);
      }
      for (const blocker of stringList(family?.blockers)) {
        if (
          observerCompleteWithoutViolation &&
          familyId === "continuous_optimizer" &&
          blocker === "continuous_optimizer_not_implemented"
        ) {
          continue;
        }
        blockers.add(`${familyId}:${blocker}`);
      }
    }
  }
  if (record?.contractVersion === "nhm2_qei_worldline_dossier/v1") {
    if (summary?.dossierComplete !== true) {
      blockers.add("qei_worldline_dossier_incomplete");
    }
    if (summary?.allMarginsPass === false) {
      blockers.add("qei_margin_not_pass");
    }
    const worldlines = Array.isArray(record.worldlines)
      ? record.worldlines
      : [];
    for (const entry of worldlines) {
      const worldline = asRecord(entry);
      const worldlineId = asString(worldline?.worldlineId) ?? "worldline";
      for (const blocker of stringList(worldline?.blockers)) {
        blockers.add(`${worldlineId}:${blocker}`);
      }
    }
  }
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
  return Array.from(blockers).filter((blocker) => !isIgnorableBlocker(blocker));
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
  tile_source_material_evidence_receipts:
    "nhm2-tile-source-material-evidence-receipts.json",
  tile_source_physical_validation_plan: "nhm2-tile-source-physical-validation-plan.json",
  tile_source_evidence_gap_roadmap: "nhm2-tile-source-evidence-gap-roadmap.json",
  tile_source_falsification_report: "nhm2-tile-source-falsification-report.json",
  tile_source_authority_handoff: "nhm2-tile-source-authority-handoff.json",
  tile_source_material_coupon_test_plan:
    "nhm2-tile-source-material-coupon-test-plan.json",
  tile_source_force_gap_pull_in_test_plan:
    "nhm2-tile-source-force-gap-pull-in-test-plan.json",
  tile_source_force_gap_load_budget:
    "nhm2-tile-source-force-gap-load-budget.json",
  tile_source_roughness_patch_test_plan:
    "nhm2-tile-source-roughness-patch-test-plan.json",
  tile_source_active_control_test_plan:
    "nhm2-tile-source-active-control-test-plan.json",
  tile_source_active_control_operating_budget:
    "nhm2-tile-source-active-control-operating-budget.json",
  tile_source_fatigue_layer_scaling_test_plan:
    "nhm2-tile-source-fatigue-layer-scaling-test-plan.json",
  tile_source_full_apparatus_tensor_test_plan:
    "nhm2-tile-source-full-apparatus-tensor-test-plan.json",
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
