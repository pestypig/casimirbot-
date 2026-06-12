import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
  type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
  type Nhm2SourceSideSameBasisTensorAuthorityStatus,
} from "../../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import { classifySourceToGeometryDivergence } from "./report-source-to-geometry-divergence";

export const NHM2_SOURCE_CLOSURE_PASS_READINESS_SCHEMA_VERSION =
  "nhm2_source_closure_pass_readiness/v1";

export type Nhm2SourceClosurePassReadinessRegion = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  regionalEvidenceStatus: Nhm2RegionalSourceClosureEvidenceRegion["status"];
  firstDivergenceBoundary: ReturnType<typeof classifySourceToGeometryDivergence>;
  sourceAuthorityStatus: Nhm2SourceSideSameBasisTensorAuthorityStatus | "artifact_missing";
  relLInf: number | null;
  toleranceRelLInf: number | null;
  sourceClosurePassReady: boolean;
  blockers: string[];
  nextRequiredEvidence: string;
};

export type Nhm2SourceClosurePassReadinessArtifact = {
  schemaVersion: typeof NHM2_SOURCE_CLOSURE_PASS_READINESS_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  laneId: string;
  selectedProfileId: string;
  artifactRefs: {
    regionalSourceClosureEvidence: string;
    sourceSideSameBasisTensorAuthority: string | null;
  };
  sourceClosurePassSignalAllowed: boolean;
  fullSolvePassSignalAllowed: false;
  firstRetirableBlocker: string;
  preflightBlockers: string[];
  regions: Nhm2SourceClosurePassReadinessRegion[];
  claimBoundary: {
    diagnosticOnly: true;
    doesNotRecomputePhysics: true;
    doesNotPromoteViability: true;
    fullSolvePassRequiresSeparateClosureStack: true;
  };
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

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
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8")) as unknown;

const regionAuthorityStatus = (
  authority: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null,
  regionId: string,
): Nhm2SourceSideSameBasisTensorAuthorityStatus | "artifact_missing" =>
  authority?.regions.find((region) => region.regionId === regionId)?.status ?? "artifact_missing";

const evidenceForRegion = (
  evidence: Nhm2RegionalSourceClosureEvidenceArtifact,
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2RegionalSourceClosureEvidenceRegion | null =>
  evidence.regions.find((region) => region.regionId === regionId) ?? null;

const nextRequiredEvidence = (
  region: Nhm2RegionalSourceClosurePassReadinessRegion,
): string => {
  if (region.sourceAuthorityStatus === "artifact_missing") {
    return "emit nhm2_source_side_same_basis_tensor_authority/v1 for this frozen run";
  }
  if (region.sourceAuthorityStatus !== "authoritative_same_basis") {
    return "retire source-side authority blockers before interpreting residuals as closure";
  }
  switch (region.firstDivergenceBoundary) {
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
      return "attach QEI dossier and non-metric-derived source provenance";
    case "conservation_missing_or_fail":
      return "emit pass-level conservation diagnostics";
    case "residual_exceeded":
      return "inspect the dominant regional residual after authority gates are clean";
    case "none":
      return "none for this source-closure preflight";
  }
};

const priority = [
  "source_side_authority_artifact_missing",
  "wall_source_side_authority_incomplete",
  "counterpart_missing",
  "basis_mismatch",
  "tensor_authority_insufficient",
  "qei_or_provenance_missing",
  "conservation_missing_or_fail",
  "residual_exceeded",
] as const;

const firstRetirableBlocker = (blockers: string[]): string =>
  priority.find((blocker) => blockers.includes(blocker)) ?? blockers[0] ?? "none";

const buildRegionReadiness = (
  evidence: Nhm2RegionalSourceClosureEvidenceArtifact,
  authority: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null,
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2SourceClosurePassReadinessRegion => {
  const region = evidenceForRegion(evidence, regionId);
  const status = regionAuthorityStatus(authority, regionId);
  const divergence = region == null ? "counterpart_missing" : classifySourceToGeometryDivergence(region);
  const blockers = new Set<string>();
  if (region == null) blockers.add("regional_evidence_missing");
  if (status === "artifact_missing") blockers.add("source_side_authority_artifact_missing");
  if (status !== "artifact_missing" && status !== "authoritative_same_basis") {
    blockers.add(`${regionId}_source_side_authority_incomplete`);
    if (regionId === "wall") blockers.add("wall_source_side_authority_incomplete");
  }
  if (divergence !== "none") blockers.add(divergence);
  if (region?.status !== "pass") blockers.add(`${regionId}_regional_evidence_not_pass`);

  const relLInf = region?.residuals.relLInf ?? null;
  const toleranceRelLInf = region?.residuals.toleranceRelLInf ?? null;
  const sourceClosurePassReady =
    region?.status === "pass" &&
    divergence === "none" &&
    status === "authoritative_same_basis" &&
    region.residuals.pass === true;
  const result: Nhm2SourceClosurePassReadinessRegion = {
    regionId,
    regionalEvidenceStatus: region?.status ?? "missing",
    firstDivergenceBoundary: divergence,
    sourceAuthorityStatus: status,
    relLInf,
    toleranceRelLInf,
    sourceClosurePassReady,
    blockers: Array.from(blockers),
    nextRequiredEvidence: "pending",
  };
  return { ...result, nextRequiredEvidence: nextRequiredEvidence(result) };
};

export const assessNhm2SourceClosurePassReadiness = (args: {
  generatedAt?: string;
  regionalEvidenceRef: string;
  regionalEvidence: Nhm2RegionalSourceClosureEvidenceArtifact;
  sourceAuthorityRef?: string | null;
  sourceAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
}): Nhm2SourceClosurePassReadinessArtifact => {
  const authority = args.sourceAuthority ?? null;
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    buildRegionReadiness(args.regionalEvidence, authority, regionId),
  );
  const preflightBlockers = Array.from(
    new Set(regions.flatMap((region) => region.blockers)),
  );
  const sourceClosurePassSignalAllowed =
    regions.every((region) => region.sourceClosurePassReady) &&
    args.regionalEvidence.overallState === "pass" &&
    authority?.summary.allRequiredRegionsAuthoritative === true &&
    authority?.summary.hasWallAuthority === true;
  return {
    schemaVersion: NHM2_SOURCE_CLOSURE_PASS_READINESS_SCHEMA_VERSION,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    runId: args.regionalEvidence.runId,
    laneId: args.regionalEvidence.laneId,
    selectedProfileId: args.regionalEvidence.selectedProfileId,
    artifactRefs: {
      regionalSourceClosureEvidence: args.regionalEvidenceRef,
      sourceSideSameBasisTensorAuthority: args.sourceAuthorityRef ?? null,
    },
    sourceClosurePassSignalAllowed,
    fullSolvePassSignalAllowed: false,
    firstRetirableBlocker: firstRetirableBlocker(preflightBlockers),
    preflightBlockers,
    regions,
    claimBoundary: {
      diagnosticOnly: true,
      doesNotRecomputePhysics: true,
      doesNotPromoteViability: true,
      fullSolvePassRequiresSeparateClosureStack: true,
    },
  };
};

export const renderNhm2SourceClosurePassReadiness = (
  artifact: Nhm2SourceClosurePassReadinessArtifact,
): string => {
  const lines = [
    "# NHM2 Source-Closure Pass Readiness",
    "",
    `Run ID: \`${artifact.runId}\``,
    `Profile: \`${artifact.selectedProfileId}\``,
    `Source-closure pass signal allowed: \`${artifact.sourceClosurePassSignalAllowed}\``,
    `Full-solve pass signal allowed: \`${artifact.fullSolvePassSignalAllowed}\``,
    `First retirable blocker: \`${artifact.firstRetirableBlocker}\``,
    "",
    "This preflight does not recompute physics and does not promote NHM2 viability. It only checks whether source-closure evidence is ready for a meaningful pass attempt.",
    "",
    "| Region | Evidence status | Source authority | First divergence | relLInf | tolerance | Pass-ready | Next required evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const region of artifact.regions) {
    lines.push(
      [
        region.regionId,
        region.regionalEvidenceStatus,
        region.sourceAuthorityStatus,
        region.firstDivergenceBoundary,
        region.relLInf == null ? "null" : String(region.relLInf),
        region.toleranceRelLInf == null ? "null" : String(region.toleranceRelLInf),
        String(region.sourceClosurePassReady),
        region.nextRequiredEvidence,
      ]
        .map((entry) => ` ${entry} `)
        .join("|")
        .replace(/^/, "|")
        .replace(/$/, "|"),
    );
  }
  lines.push(
    "",
    "## Preflight Blockers",
    "",
    ...(artifact.preflightBlockers.length > 0
      ? artifact.preflightBlockers.map((blocker) => `- \`${blocker}\``)
      : ["- none"]),
    "",
  );
  return `${lines.join("\n")}\n`;
};

export const isNhm2SourceClosurePassReadinessArtifact = (
  value: unknown,
): value is Nhm2SourceClosurePassReadinessArtifact => {
  const record = asRecord(value);
  const refs = asRecord(record?.artifactRefs);
  const claimBoundary = asRecord(record?.claimBoundary);
  return (
    record != null &&
    record.schemaVersion === NHM2_SOURCE_CLOSURE_PASS_READINESS_SCHEMA_VERSION &&
    asString(record.generatedAt) != null &&
    asString(record.runId) != null &&
    asString(record.laneId) != null &&
    asString(record.selectedProfileId) != null &&
    refs != null &&
    asString(refs.regionalSourceClosureEvidence) != null &&
    (refs.sourceSideSameBasisTensorAuthority === null ||
      asString(refs.sourceSideSameBasisTensorAuthority) != null) &&
    typeof record.sourceClosurePassSignalAllowed === "boolean" &&
    record.fullSolvePassSignalAllowed === false &&
    asString(record.firstRetirableBlocker) != null &&
    Array.isArray(record.preflightBlockers) &&
    record.preflightBlockers.every((entry) => asString(entry) != null) &&
    Array.isArray(record.regions) &&
    record.regions.every((entry) => {
      const region = asRecord(entry);
      return (
        region != null &&
        NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
          region.regionId as Nhm2RegionalSourceClosureRegionId,
        ) &&
        asString(region.regionalEvidenceStatus) != null &&
        asString(region.firstDivergenceBoundary) != null &&
        asString(region.sourceAuthorityStatus) != null &&
        (region.relLInf === null || typeof region.relLInf === "number") &&
        (region.toleranceRelLInf === null ||
          typeof region.toleranceRelLInf === "number") &&
        typeof region.sourceClosurePassReady === "boolean" &&
        Array.isArray(region.blockers) &&
        region.blockers.every((blocker) => asString(blocker) != null) &&
        asString(region.nextRequiredEvidence) != null
      );
    }) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.doesNotRecomputePhysics === true &&
    claimBoundary?.doesNotPromoteViability === true &&
    claimBoundary?.fullSolvePassRequiresSeparateClosureStack === true
  );
};

export const runNhm2SourceClosurePassReadiness = (args: {
  repoRoot: string;
  regionalEvidencePath: string;
  sourceAuthorityPath?: string | null;
  outJsonPath?: string | null;
  outMdPath?: string | null;
}): Nhm2SourceClosurePassReadinessArtifact => {
  const regionalEvidence = readJson(args.repoRoot, args.regionalEvidencePath);
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(regionalEvidence)) {
    throw new Error("regional evidence must be nhm2_regional_source_closure_evidence/v1");
  }
  const sourceAuthority =
    args.sourceAuthorityPath == null
      ? null
      : readJson(args.repoRoot, args.sourceAuthorityPath);
  if (
    sourceAuthority != null &&
    !isNhm2SourceSideSameBasisTensorAuthorityArtifact(sourceAuthority)
  ) {
    throw new Error(
      "source authority must be nhm2_source_side_same_basis_tensor_authority/v1",
    );
  }
  const artifact = assessNhm2SourceClosurePassReadiness({
    regionalEvidenceRef: args.regionalEvidencePath,
    regionalEvidence,
    sourceAuthorityRef: args.sourceAuthorityPath ?? null,
    sourceAuthority,
  });
  if (args.outJsonPath != null) {
    const outJson = resolvePath(args.repoRoot, args.outJsonPath);
    mkdirSync(dirname(outJson), { recursive: true });
    writeFileSync(outJson, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  }
  if (args.outMdPath != null) {
    const outMd = resolvePath(args.repoRoot, args.outMdPath);
    mkdirSync(dirname(outMd), { recursive: true });
    writeFileSync(outMd, renderNhm2SourceClosurePassReadiness(artifact), "utf8");
  }
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const regionalEvidencePath = asString(args["regional-evidence"]);
  if (regionalEvidencePath == null) {
    throw new Error("missing required --regional-evidence");
  }
  const artifact = runNhm2SourceClosurePassReadiness({
    repoRoot: process.cwd(),
    regionalEvidencePath,
    sourceAuthorityPath: asString(args["source-authority"]),
    outJsonPath: asString(args["out-json"]),
    outMdPath: asString(args["out-md"]),
  });
  process.stdout.write(renderNhm2SourceClosurePassReadiness(artifact));
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
