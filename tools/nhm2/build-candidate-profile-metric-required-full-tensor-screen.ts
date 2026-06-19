import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  isNhm2MetricRequiredRegionalFullTensorSourceArtifact,
  type Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1,
  type Nhm2MetricRequiredRegionalFullTensorSourceRegionV1,
} from "../../shared/contracts/nhm2-metric-required-regional-full-tensor-source.v1";
import {
  isNhm2MetricRequiredMomentumDemandAudit,
  type Nhm2MetricRequiredMomentumDemandAuditV1,
} from "../../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";
import type { Nhm2RegionalSourceClosureRegionId } from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2SameChartFullTensorArtifactV1,
  Nhm2SameChartFullTensorComponentId,
} from "../../shared/contracts/nhm2-same-chart-full-tensor.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

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

const componentToAuditId: Partial<Record<Nhm2SameChartFullTensorComponentId, "T01" | "T02" | "T03">> = {
  T0x: "T01",
  T0y: "T02",
  T0z: "T03",
};

const projectedRatioFor = (
  audit: Nhm2MetricRequiredMomentumDemandAuditV1,
  regionId: Nhm2RegionalSourceClosureRegionId,
  componentId: "T01" | "T02" | "T03",
): number | null =>
  audit.components.find(
    (component) =>
      component.regionId === regionId && component.componentId === componentId,
  )?.projectedMetricRequiredMomentumToEnergyRatio ?? null;

const signOrPositive = (value: number | null): number =>
  value == null || Object.is(value, -0) || value === 0 ? 1 : Math.sign(value);

const buildCandidateSameChartTensor = (args: {
  parent: Nhm2SameChartFullTensorArtifactV1;
  audit: Nhm2MetricRequiredMomentumDemandAuditV1;
  candidateProfileId: string;
  regionId: Nhm2RegionalSourceClosureRegionId;
  candidateAuditRef: string;
}): Nhm2SameChartFullTensorArtifactV1 => {
  const t00 =
    args.parent.components.find((component) => component.componentId === "T00")
      ?.valueSI ?? null;
  return {
    ...args.parent,
    generatedAt: new Date().toISOString(),
    selectedProfileId: args.candidateProfileId,
    components: args.parent.components.map((component) => {
      const auditId = componentToAuditId[component.componentId];
      if (auditId == null) {
        return {
          ...component,
          provenance: {
            routeId: "candidate_profile_parent_metric_tensor_projection_v1",
            chartId: args.parent.chartId,
            source: "runtime_artifact",
            artifactRef: args.candidateAuditRef,
          },
          assumptions: [
            ...component.assumptions,
            "candidate metric-required full tensor screen row inherited non-momentum components from the parent profile",
            "this candidate tensor is not a fresh ADM/Einstein geometry solve",
          ],
        };
      }
      const ratio = projectedRatioFor(args.audit, args.regionId, auditId);
      const projectedValue =
        ratio == null || t00 == null
          ? component.valueSI
          : signOrPositive(component.valueSI) * Math.abs(t00) * ratio;
      return {
        ...component,
        valueSI: projectedValue,
        provenance: {
          routeId: "candidate_profile_momentum_screen_v1",
          chartId: args.parent.chartId,
          source: "runtime_artifact",
          artifactRef: args.candidateAuditRef,
        },
        assumptions: [
          ...component.assumptions,
          "candidate T0i value is projected from reduced-order momentum-demand screen",
          "candidate projection preserves the parent sign convention for the momentum component",
          "this candidate tensor is not a fresh ADM/Einstein geometry solve",
        ],
        blockers: [
          ...component.blockers,
          ...(ratio == null ? [`candidate_profile_${auditId}_screen_ratio_missing`] : []),
        ],
      };
    }),
  };
};

export const buildCandidateProfileMetricRequiredFullTensorScreen = (args: {
  sourceMetricRequiredFullTensorSource: Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1;
  candidateMomentumDemandAudit: Nhm2MetricRequiredMomentumDemandAuditV1;
  sourceMetricRequiredFullTensorSourceRef: string;
  candidateMomentumDemandAuditRef: string;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  const candidateProfileId = args.candidateMomentumDemandAudit.selectedProfileId;
  const regions: Nhm2MetricRequiredRegionalFullTensorSourceRegionV1[] =
    args.sourceMetricRequiredFullTensorSource.regions.map((region) => ({
      ...region,
      status: "blocked",
      artifactRef: `${args.candidateMomentumDemandAuditRef}#candidate-metric-required-full-tensor-screen/${region.regionId}`,
      tensorRef: `${args.candidateMomentumDemandAuditRef}#candidate-metric-required-full-tensor-screen/${region.regionId}/sameChartFullTensor`,
      sameChartFullTensor: buildCandidateSameChartTensor({
        parent: region.sameChartFullTensor,
        audit: args.candidateMomentumDemandAudit,
        candidateProfileId,
        regionId: region.regionId,
        candidateAuditRef: args.candidateMomentumDemandAuditRef,
      }),
      blockers: [
        ...region.blockers,
        "candidate_metric_required_full_tensor_screen_not_full_adm_route",
        "candidate_metric_required_t00_tij_inherited_from_parent_profile_screen",
      ],
      warnings: [
        ...region.warnings,
        "candidate_t0i_projected_from_reduced_order_momentum_screen",
        "candidate_t00_and_tij_parent_profile_placeholders",
        "full_frozen_campaign_run_required_before_profile_ranking",
      ],
    }));

  return buildNhm2MetricRequiredRegionalFullTensorSourceArtifact({
    generatedAt: new Date().toISOString(),
    laneId: args.sourceMetricRequiredFullTensorSource.laneId,
    selectedProfileId: candidateProfileId,
    chartId: args.sourceMetricRequiredFullTensorSource.chartId,
    metricFamily: args.sourceMetricRequiredFullTensorSource.metricFamily,
    sourceRoute: "runtime_artifact",
    sourceArtifactRefs: [
      args.sourceMetricRequiredFullTensorSourceRef,
      args.candidateMomentumDemandAuditRef,
    ],
    regions,
  });
};

export const publishCandidateProfileMetricRequiredFullTensorScreen = (args: {
  repoRoot: string;
  sourceMetricRequiredFullTensorSourcePath: string;
  candidateMomentumDemandAuditPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2MetricRequiredRegionalFullTensorSourceArtifactV1 => {
  if (
    !args.auditOnly &&
    [
      args.sourceMetricRequiredFullTensorSourcePath,
      args.candidateMomentumDemandAuditPath,
      args.outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const sourceMetricRequiredFullTensorSource = readJson(
    resolvePath(args.repoRoot, args.sourceMetricRequiredFullTensorSourcePath),
  );
  if (
    !isNhm2MetricRequiredRegionalFullTensorSourceArtifact(
      sourceMetricRequiredFullTensorSource,
    )
  ) {
    throw new Error(
      "source metric-required full tensor source must be nhm2_metric_required_regional_full_tensor_source/v1",
    );
  }
  const candidateMomentumDemandAudit = readJson(
    resolvePath(args.repoRoot, args.candidateMomentumDemandAuditPath),
  );
  if (!isNhm2MetricRequiredMomentumDemandAudit(candidateMomentumDemandAudit)) {
    throw new Error(
      "candidate momentum demand audit must be nhm2_metric_required_momentum_demand_audit/v1",
    );
  }
  const artifact = buildCandidateProfileMetricRequiredFullTensorScreen({
    sourceMetricRequiredFullTensorSource,
    candidateMomentumDemandAudit,
    sourceMetricRequiredFullTensorSourceRef:
      args.sourceMetricRequiredFullTensorSourcePath,
    candidateMomentumDemandAuditRef: args.candidateMomentumDemandAuditPath,
  });
  if (!isNhm2MetricRequiredRegionalFullTensorSourceArtifact(artifact)) {
    throw new Error(
      "internal error: produced invalid candidate metric-required full tensor screen",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const sourceMetricRequiredFullTensorSourcePath = asString(
    args["source-metric-required-full-tensor-source"],
  );
  const candidateMomentumDemandAuditPath = asString(
    args["candidate-momentum-demand-audit"],
  );
  const outPath = asString(args.out);
  if (
    sourceMetricRequiredFullTensorSourcePath == null ||
    candidateMomentumDemandAuditPath == null ||
    outPath == null
  ) {
    throw new Error(
      "--source-metric-required-full-tensor-source, --candidate-momentum-demand-audit, and --out are required",
    );
  }
  const artifact = publishCandidateProfileMetricRequiredFullTensorScreen({
    repoRoot: process.cwd(),
    sourceMetricRequiredFullTensorSourcePath,
    candidateMomentumDemandAuditPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
