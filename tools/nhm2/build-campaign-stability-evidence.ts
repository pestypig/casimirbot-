import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2CandidateMetricProfileSpec,
  type Nhm2CandidateMetricProfileSpecV1,
} from "../../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  isNhm2DynamicEffectiveGeometryEvidence,
  isNhm2SwitchingConservationEvidence,
  isNhm2CampaignStabilityEvidence,
  type Nhm2CampaignStabilityEvidenceV1,
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
  type Nhm2SwitchingConservationEvidenceV1,
  type Nhm2TimeDependentSourceCampaignStatus,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

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

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

const readRequired = <T>(
  repoRoot: string,
  path: string,
  validator: (value: unknown) => value is T,
  label: string,
): T => {
  const value = readJson(resolvePath(repoRoot, path));
  if (!validator(value)) throw new Error(`${label} has invalid contract: ${path}`);
  return value;
};

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const statusFromBlockers = (blockers: string[]): Nhm2TimeDependentSourceCampaignStatus =>
  blockers.length === 0 ? "pass" : "review";

const allSwitchingTermsPass = (evidence: Nhm2SwitchingConservationEvidenceV1): boolean =>
  evidence.conservationStatus === "pass" &&
  evidence.includesRegionalSupportDerivatives &&
  evidence.includesSectorBoundaryTerms &&
  evidence.includesTimeDerivativeTerms &&
  evidence.includesTransitionKernelTerms &&
  evidence.terms.every((term) => term.pass === true);

const smoothTransitionKernelsAvailable = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
): boolean =>
  atlas.transitionKernels.length > 0 &&
  atlas.transitionKernels.every(
    (kernel) =>
      kernel.smoothnessClass === "C1" ||
      kernel.smoothnessClass === "C2" ||
      kernel.smoothnessClass === "Cinf",
  );

export const publishNhm2CampaignStabilityEvidence = (args: {
  repoRoot: string;
  candidateProfileSpecPath: string;
  dynamicEffectiveGeometryPath: string;
  switchingConservationPath: string;
  regionalSupportAtlasPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2CampaignStabilityEvidenceV1 => {
  if (
    !args.auditOnly &&
    [
      args.candidateProfileSpecPath,
      args.dynamicEffectiveGeometryPath,
      args.switchingConservationPath,
      args.regionalSupportAtlasPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const spec = readRequired<Nhm2CandidateMetricProfileSpecV1>(
    args.repoRoot,
    args.candidateProfileSpecPath,
    isNhm2CandidateMetricProfileSpec,
    "candidate metric profile spec",
  );
  const dynamic = readRequired<Nhm2DynamicEffectiveGeometryEvidenceV1>(
    args.repoRoot,
    args.dynamicEffectiveGeometryPath,
    isNhm2DynamicEffectiveGeometryEvidence,
    "dynamic effective-geometry evidence",
  );
  const switching = readRequired<Nhm2SwitchingConservationEvidenceV1>(
    args.repoRoot,
    args.switchingConservationPath,
    isNhm2SwitchingConservationEvidence,
    "switching conservation evidence",
  );
  const atlas = readRequired<Nhm2RegionalSupportFunctionAtlasV1>(
    args.repoRoot,
    args.regionalSupportAtlasPath,
    isNhm2RegionalSupportFunctionAtlas,
    "regional support-function atlas",
  );

  const horizonBlockers = [
    spec.alphaCenterline > 0 ? null : "centerline_lapse_nonpositive_horizon_proxy",
    spec.executableGeometry.admRouteReady ? null : "adm_route_not_ready_for_horizon_screen",
    spec.profileDefinition.shiftAmplitudeScale <= 1
      ? null
      : "shift_amplitude_scale_exceeds_reduced_order_horizon_screen",
  ].filter((entry): entry is string => entry != null);

  const blueshiftBlockers = [
    dynamic.bounded === true ? null : "dynamic_backreaction_not_bounded_for_blueshift_screen",
    dynamic.agreementStatus === "pass" ? null : "dynamic_geometry_agreement_not_pass",
    spec.alphaCenterline > 0 ? null : "centerline_lapse_nonpositive_blueshift_proxy",
  ].filter((entry): entry is string => entry != null);

  const particleBlockers = [
    allSwitchingTermsPass(switching) ? null : "switching_conservation_terms_not_all_pass",
    switching.includesSectorBoundaryTerms ? null : "sector_boundary_terms_missing",
    switching.includesTimeDerivativeTerms ? null : "time_derivative_terms_missing",
  ].filter((entry): entry is string => entry != null);

  const perturbativeBlockers = [
    dynamic.bounded === true ? null : "dynamic_backreaction_not_bounded_for_stability_screen",
    atlas.partitionOfUnity.status === "pass" ? null : "atlas_partition_not_pass",
    smoothTransitionKernelsAvailable(atlas)
      ? null
      : "smooth_transition_kernels_missing_for_stability_screen",
    spec.profileDefinition.wallThicknessScale > 0 ? null : "wall_thickness_nonpositive",
    spec.profileDefinition.smoothingWidthScale > 0 ? null : "smoothing_width_nonpositive",
  ].filter((entry): entry is string => entry != null);

  const artifact: Nhm2CampaignStabilityEvidenceV1 = {
    contractVersion: "nhm2_campaign_stability_evidence/v1",
    generatedAt: new Date().toISOString(),
    horizonStatus: statusFromBlockers(horizonBlockers),
    blueshiftStatus: statusFromBlockers(blueshiftBlockers),
    particleAccumulationStatus: statusFromBlockers(particleBlockers),
    perturbativeStabilityStatus: statusFromBlockers(perturbativeBlockers),
    blockers: Array.from(
      new Set([
        ...horizonBlockers.map((blocker) => `horizon:${blocker}`),
        ...blueshiftBlockers.map((blocker) => `blueshift:${blocker}`),
        ...particleBlockers.map((blocker) => `particle_accumulation:${blocker}`),
        ...perturbativeBlockers.map((blocker) => `perturbative_stability:${blocker}`),
      ]),
    ),
  };

  if (!isNhm2CampaignStabilityEvidence(artifact)) {
    throw new Error("internal error: produced invalid campaign stability evidence");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const candidateProfileSpecPath = asString(args["candidate-profile-spec"]);
  const dynamicEffectiveGeometryPath = asString(args["dynamic-effective-geometry"]);
  const switchingConservationPath = asString(args["switching-conservation"]);
  const regionalSupportAtlasPath = asString(args["regional-support-atlas"]);
  const outPath = asString(args.out);
  if (
    candidateProfileSpecPath == null ||
    dynamicEffectiveGeometryPath == null ||
    switchingConservationPath == null ||
    regionalSupportAtlasPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--candidate-profile-spec, --dynamic-effective-geometry, --switching-conservation, --regional-support-atlas, and --out are required",
    );
  }
  const artifact = publishNhm2CampaignStabilityEvidence({
    repoRoot: process.cwd(),
    candidateProfileSpecPath,
    dynamicEffectiveGeometryPath,
    switchingConservationPath,
    regionalSupportAtlasPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
