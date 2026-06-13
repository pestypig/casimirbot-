import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

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

const dominantResidual = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
): { component: Nhm2TensorComponent | "unknown"; absResidual: number | null } => {
  let component: Nhm2TensorComponent | "unknown" = "unknown";
  let absResidual: number | null = null;
  for (const [candidate, residual] of Object.entries(
    region.residuals.componentResiduals,
  ) as Array<[Nhm2TensorComponent, { absResidual: number | null } | undefined]>) {
    if (residual?.absResidual == null) continue;
    if (absResidual == null || residual.absResidual > absResidual) {
      component = candidate;
      absResidual = residual.absResidual;
    }
  }
  return { component, absResidual };
};

export const classifySourceToGeometryDivergence = (
  region: Nhm2RegionalSourceClosureEvidenceRegion,
):
  | "counterpart_missing"
  | "metric_echo"
  | "basis_mismatch"
  | "profile_mismatch"
  | "tensor_authority_insufficient"
  | "qei_or_provenance_missing"
  | "conservation_missing_or_fail"
  | "residual_exceeded"
  | "none" => {
  const blockers = new Set(region.blockers);
  if (
    blockers.has("counterpart_missing") ||
    region.comparisonBasisStatus === "counterpart_missing" ||
    region.tileEffectiveCounterpart.comparisonRole === "gr_matter_channel_observation" ||
    region.tileEffectiveCounterpart.comparisonRole === "unknown"
  ) {
    return "counterpart_missing";
  }
  if (
    blockers.has("metric_echo_not_source_closure") ||
    region.tileEffectiveCounterpart.comparisonRole === "metric_echo_diagnostic_only"
  ) {
    return "metric_echo";
  }
  if (blockers.has("profile_mismatch") || region.comparisonBasisStatus === "profile_mismatch") {
    return "profile_mismatch";
  }
  if (
    region.comparisonBasisStatus === "chart_mismatch" ||
    region.comparisonBasisStatus === "unit_mismatch" ||
    region.comparisonBasisStatus === "aggregation_mismatch" ||
    blockers.has("chart_mismatch") ||
    blockers.has("unit_mismatch") ||
    blockers.has("aggregation_mismatch")
  ) {
    return "basis_mismatch";
  }
  if (
    region.metricRequired.tensorAuthorityMode === "diagonal_reduced_order" ||
    region.metricRequired.tensorAuthorityMode === "proxy" ||
    region.tileEffectiveCounterpart.tensorAuthorityMode === "diagonal_reduced_order" ||
    region.tileEffectiveCounterpart.tensorAuthorityMode === "proxy"
  ) {
    return "tensor_authority_insufficient";
  }
  if (
    blockers.has("qei_not_promotion_safe") ||
    blockers.has("qei_dossier_not_pass") ||
    blockers.has("provenance_missing")
  ) {
    return "qei_or_provenance_missing";
  }
  if (
    blockers.has("conservation_missing") ||
    blockers.has("conservation_failed") ||
    blockers.has("conservation_unknown") ||
    blockers.has("conservation_not_pass")
  ) {
    return "conservation_missing_or_fail";
  }
  if (region.residuals.pass === false) return "residual_exceeded";
  return "none";
};

const nextRequiredEvidence = (
  divergence: ReturnType<typeof classifySourceToGeometryDivergence>,
): string => {
  switch (divergence) {
    case "counterpart_missing":
      return "publish a regional tile_effective_counterpart tensor on the same basis";
    case "metric_echo":
      return "replace metric echo with source-model-derived tile tensor provenance";
    case "basis_mismatch":
      return "regenerate both sides with matching chart, units, aggregation, and normalization";
    case "profile_mismatch":
      return "regenerate artifacts from the frozen selected profile";
    case "tensor_authority_insufficient":
      return "emit full tensor evidence or an explicit symmetry authority";
    case "qei_or_provenance_missing":
      return "attach QEI dossier and non-metric-derived source model provenance";
    case "conservation_missing_or_fail":
      return "emit or repair conservation diagnostics";
    case "residual_exceeded":
      return "inspect the dominant residual component and source model boundary";
    case "none":
      return "none for this gate";
  }
};

const physicalMechanismAllowed = (
  _artifact: Nhm2RegionalSourceClosureEvidenceArtifact,
): boolean => false;

const firstRetirableBlocker = (
  artifact: Nhm2RegionalSourceClosureEvidenceArtifact,
): string => {
  if (!artifact.profileMatch) return "profile_mismatch";
  for (const reason of artifact.reasonCodes) {
    if (reason.includes("latest_alias")) return "latest_alias";
  }
  const divergences = artifact.regions.map(classifySourceToGeometryDivergence);
  const priority = [
    "counterpart_missing",
    "metric_echo",
    "basis_mismatch",
    "tensor_authority_insufficient",
    "qei_or_provenance_missing",
    "conservation_missing_or_fail",
    "residual_exceeded",
  ] as const;
  return priority.find((entry) => divergences.includes(entry)) ?? "none";
};

export const renderSourceToGeometryDivergenceReport = (
  artifact: Nhm2RegionalSourceClosureEvidenceArtifact,
): string => {
  const lines = [
    `# NHM2 Source-to-Geometry Divergence Report`,
    "",
    `Run ID: \`${artifact.runId}\``,
    `Profile: \`${artifact.selectedProfileId}\``,
    `Overall state: \`${artifact.overallState}\``,
    `Claim effect: \`${artifact.claimEffect}\``,
    "",
    "This report is a source-closure evidence summary, not a validation claim. External theory papers remain context and guardrails only.",
    "",
    "| Region | Metric authority | Tile authority | Tile comparison role | Source authority mode | QEI status | Conservation divT status | Metric echo detected | Physical mechanism claim allowed | Basis | Dominant residual | relLInf | absLInf | Status | First divergence boundary | Next required evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const region of artifact.regions) {
    const dominant = dominantResidual(region);
    const divergence = classifySourceToGeometryDivergence(region);
    lines.push(
      [
        region.regionId,
        region.metricRequired.tensorAuthorityMode,
        region.tileEffectiveCounterpart.tensorAuthorityMode,
        region.tileEffectiveCounterpart.comparisonRole,
        region.tileEffectiveCounterpart.tensorRef?.startsWith("nhm2_tile_effective_counterpart")
          ? "tile_effective_counterpart_artifact"
          : "legacy_or_unknown",
        "unknown",
        "unknown",
        String(region.tileEffectiveCounterpart.comparisonRole === "metric_echo_diagnostic_only"),
        String(physicalMechanismAllowed(artifact)),
        region.comparisonBasisStatus,
        dominant.component,
        region.residuals.relLInf == null ? "null" : String(region.residuals.relLInf),
        region.residuals.absLInf == null ? "null" : String(region.residuals.absLInf),
        region.status,
        divergence,
        nextRequiredEvidence(divergence),
      ]
        .map((entry) => ` ${entry} `)
        .join("|")
        .replace(/^/, "|")
        .replace(/$/, "|"),
    );
  }

  lines.push(
    "",
    "## First Retirable Blocker",
    "",
    `\`${firstRetirableBlocker(artifact)}\``,
    "",
    "## Blocking Reason Codes",
    "",
    ...(
      artifact.reasonCodes.length > 0
        ? artifact.reasonCodes.map((reason) => `- \`${reason}\``)
        : ["- none"]
    ),
    "",
    artifact.overallState === "pass"
      ? "Regional source-closure evidence is pass-level for reduced-order candidate only."
      : artifact.claimEffect === "reduced_order_candidate_blocker_retired"
        ? "Regional source-closure blocker retired, but physical mechanism claim remains disallowed."
        : "No promotion-safe source-closure claim is allowed.",
    "",
  );
  return `${lines.join("\n")}\n`;
};

export const reportSourceToGeometryDivergence = (args: {
  repoRoot: string;
  regionalEvidencePath: string;
  outPath: string;
}): string => {
  const evidence = JSON.parse(
    readFileSync(resolvePath(args.repoRoot, args.regionalEvidencePath), "utf8"),
  ) as unknown;
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(evidence)) {
    throw new Error("regional evidence must be a valid nhm2_regional_source_closure_evidence/v1 artifact");
  }
  const report = renderSourceToGeometryDivergenceReport(evidence);
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, report, "utf8");
  return report;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const regionalEvidencePath = asString(args["regional-evidence"]);
  const outPath = asString(args.out);
  if (regionalEvidencePath == null || outPath == null) {
    throw new Error("--regional-evidence and --out are required");
  }
  const report = reportSourceToGeometryDivergence({
    repoRoot: process.cwd(),
    regionalEvidencePath,
    outPath,
  });
  process.stdout.write(report);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (existsSync(invokedPath) && invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
