import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2MetricMomentumRemediationTargets } from "../../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import {
  isNhm2MomentumFrameProjectionEvidence,
  type Nhm2MomentumFrameProjectionEvidenceComponentV1,
  type Nhm2MomentumFrameProjectionEvidenceV1,
} from "../../shared/contracts/nhm2-momentum-frame-projection-receipt.v1";
import { isNhm2RegionalSupportFunctionAtlas } from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  NHM2_MOMENTUM_DENSITY_COMPONENTS,
  isNhm2SourceMomentumDensityAudit,
} from "../../shared/contracts/nhm2-source-momentum-density-audit.v1";
import { NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS } from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT = 1;

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

const finiteOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const publishCandidateMomentumFrameProjectionEvidence = (args: {
  repoRoot: string;
  metricMomentumRemediationTargetsPath: string;
  sourceMomentumDensityAuditPath: string;
  regionalSupportAtlasPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MomentumFrameProjectionEvidenceV1 => {
  if (
    !args.auditOnly &&
    [
      args.metricMomentumRemediationTargetsPath,
      args.sourceMomentumDensityAuditPath,
      args.regionalSupportAtlasPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const remediationTargets = readJson(
    resolvePath(args.repoRoot, args.metricMomentumRemediationTargetsPath),
  );
  if (!isNhm2MetricMomentumRemediationTargets(remediationTargets)) {
    throw new Error(
      "metric momentum remediation targets must be nhm2_metric_momentum_remediation_targets/v1",
    );
  }

  const sourceAudit = readJson(resolvePath(args.repoRoot, args.sourceMomentumDensityAuditPath));
  if (!isNhm2SourceMomentumDensityAudit(sourceAudit)) {
    throw new Error("source momentum-density audit must be nhm2_source_momentum_density_audit/v1");
  }

  const atlas = readJson(resolvePath(args.repoRoot, args.regionalSupportAtlasPath));
  if (!isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("regional support atlas must be nhm2_regional_support_function_atlas/v1");
  }

  const blockers: string[] = [];
  if (remediationTargets.laneId !== sourceAudit.laneId) {
    blockers.push("projection_evidence_lane_mismatch");
  }
  if (remediationTargets.selectedProfileId !== sourceAudit.selectedProfileId) {
    blockers.push("projection_evidence_profile_mismatch");
  }
  if (atlas.runIdentity.profileId !== remediationTargets.selectedProfileId) {
    blockers.push("projection_evidence_atlas_profile_mismatch");
  }
  if (remediationTargets.summary.remediationRequired) {
    blockers.push("metric_momentum_remediation_still_required");
  }

  const components: Nhm2MomentumFrameProjectionEvidenceComponentV1[] = [];
  let usedSameChartAuditFallback = false;
  for (const regionId of NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS) {
    const sourceRegion = sourceAudit.regions.find((region) => region.regionId === regionId);
    for (const componentId of NHM2_MOMENTUM_DENSITY_COMPONENTS) {
      const targetComponent =
        remediationTargets.components.find(
          (component) =>
            component.regionId === regionId && component.componentId === componentId,
        ) ?? null;
      const sourceComponent =
        sourceRegion?.components.find((component) => component.componentId === componentId) ??
        null;
      if (targetComponent == null) {
        blockers.push(`${regionId}:${componentId}:metric_momentum_projection_target_missing`);
      }
      if (sourceComponent == null) {
        blockers.push(`${regionId}:${componentId}:source_momentum_audit_component_missing`);
      }
      const targetProjectedMetricRequiredMomentumToEnergyRatio = finiteOrNull(
        targetComponent?.projectedMetricRequiredMomentumToEnergyRatio,
      );
      const auditSameChartMetricRequiredMomentumToEnergyRatio = finiteOrNull(
        sourceComponent?.metricRequiredFractionOfAbsT00,
      );
      const projectedMetricRequiredMomentumToEnergyRatio =
        targetProjectedMetricRequiredMomentumToEnergyRatio ??
        auditSameChartMetricRequiredMomentumToEnergyRatio;
      if (
        targetProjectedMetricRequiredMomentumToEnergyRatio == null &&
        auditSameChartMetricRequiredMomentumToEnergyRatio != null
      ) {
        usedSameChartAuditFallback = true;
      }
      const projectedSourceMomentumToEnergyRatio = finiteOrNull(
        sourceComponent?.sourceFractionOfAbsT00,
      );
      if (projectedMetricRequiredMomentumToEnergyRatio == null) {
        blockers.push(`${regionId}:${componentId}:projected_metric_momentum_ratio_missing`);
      } else if (
        projectedMetricRequiredMomentumToEnergyRatio > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT
      ) {
        blockers.push(`${regionId}:${componentId}:projected_metric_momentum_ratio_exceeds_bound`);
      }
      if (projectedSourceMomentumToEnergyRatio == null) {
        blockers.push(`${regionId}:${componentId}:projected_source_momentum_ratio_missing`);
      } else if (projectedSourceMomentumToEnergyRatio > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT) {
        blockers.push(`${regionId}:${componentId}:projected_source_momentum_ratio_exceeds_bound`);
      }
      components.push({
        regionId,
        componentId,
        projectedMetricRequiredMomentumToEnergyRatio,
        projectedSourceMomentumToEnergyRatio,
      });
    }
  }

  const uniqueBlockers = Array.from(new Set(blockers));
  const ratioPolicy = usedSameChartAuditFallback
    ? "use_audit_same_chart_ratios_as_local_frame_reduced_order"
    : "explicit_projected_ratios";
  const artifact: Nhm2MomentumFrameProjectionEvidenceV1 = {
    contractVersion: "nhm2_momentum_frame_projection_evidence/v1",
    generatedAt: new Date().toISOString(),
    laneId: remediationTargets.laneId,
    selectedProfileId: remediationTargets.selectedProfileId,
    runId: `${remediationTargets.runId}:candidate_projection_evidence`,
    regionalSupportFunctionAtlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    frame: {
      frameId: "declared-reduced-order-campaign-local-orthonormal-frame",
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "local_orthonormal_to_chart",
      tetradRef: "declared://nhm2/reduced-order/campaign-profile-local-orthonormal-frame",
      projectionMethod: "declared_reduced_order_local_orthonormal",
      ratioPolicy,
      projectionStatus: uniqueBlockers.length === 0 ? "pass" : "blocked",
      assumptions: [
        "candidate metric momentum remediation targets provide projected metric momentum-to-energy ratios",
        "when remediation targets lack a projected metric ratio, the source momentum-density audit same-chart metric ratio is used as a declared reduced-order local-frame proxy",
        "source momentum ratios are read from the source momentum-density audit",
        "reduced-order frame evidence does not replace a full ADM tetrad projection",
      ],
      blockers: uniqueBlockers,
    },
    components,
    claimBoundary: {
      diagnosticOnly: true,
      projectionEvidenceDoesNotValidatePhysicalSource: true,
      reducedOrderFrameDoesNotReplaceFullAdmTetrad: true,
      causalBoundConclusionRequiresProjectionStatusPass: true,
    },
  };
  if (!isNhm2MomentumFrameProjectionEvidence(artifact)) {
    throw new Error(
      "internal error: produced invalid momentum frame projection evidence",
    );
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
  const sourceMomentumDensityAuditPath = asString(args["source-momentum-density-audit"]);
  const regionalSupportAtlasPath = asString(args["regional-support-atlas"]);
  const outPath = asString(args.out);
  if (
    metricMomentumRemediationTargetsPath == null ||
    sourceMomentumDensityAuditPath == null ||
    regionalSupportAtlasPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--metric-momentum-remediation-targets, --source-momentum-density-audit, --regional-support-atlas, and --out are required",
    );
  }
  const artifact = publishCandidateMomentumFrameProjectionEvidence({
    repoRoot: process.cwd(),
    metricMomentumRemediationTargetsPath,
    sourceMomentumDensityAuditPath,
    regionalSupportAtlasPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
