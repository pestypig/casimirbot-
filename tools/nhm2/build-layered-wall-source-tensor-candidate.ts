import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2LayeredWallSourceCandidateArtifact,
  type Nhm2LayeredWallSourceCandidateV1,
} from "../../shared/contracts/nhm2-layered-wall-source-candidate.v1";
import {
  isNhm2LayeredWallFullTensorSourceAuditArtifact,
  type Nhm2LayeredWallFullTensorComponentV1,
  type Nhm2LayeredWallFullTensorSourceAuditV1,
} from "../../shared/contracts/nhm2-layered-wall-full-tensor-source-audit.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2TileEffectiveFullTensorSourceArtifact,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

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

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  candidateRef: string,
): Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] => ({
  regionId,
  status: "missing",
  tensorAuthorityMode: "unknown",
  tensor: {},
  symmetry: {
    declared: false,
    kind: "unknown",
    lowerComponentsDerivedBySymmetry: false,
  },
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
  sourceSupport: {
    supportKernelId: null,
    cycleAverageStatus: "unknown",
    dutyCycleStatus: "unknown",
    lightCrossingConsistencyStatus: "unknown",
  },
  provenance: {
    producerModule: "tools/nhm2/build-layered-wall-source-tensor-candidate.ts",
    producerFunction: "buildLayeredWallSourceTensorCandidate",
    derivationMode: "unknown",
    inputRefs: [candidateRef],
    preAggregationValueRefs: [],
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: ["layered_wall_source_candidate_region_not_derived"],
});

const auditComponentValue = (
  audit: Nhm2LayeredWallFullTensorSourceAuditV1,
  componentId: Nhm2LayeredWallFullTensorComponentV1["componentId"],
): number | null => {
  const value = audit.components.find((component) => component.componentId === componentId)?.valueSI;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const tensorFromAudit = (
  audit: Nhm2LayeredWallFullTensorSourceAuditV1,
): Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["tensor"] => {
  const tensor: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]["tensor"] = {};
  const t00 = auditComponentValue(audit, "T00");
  if (t00 != null) tensor.T00 = t00;
  const t0x = auditComponentValue(audit, "T0x");
  const t0y = auditComponentValue(audit, "T0y");
  const t0z = auditComponentValue(audit, "T0z");
  if (t0x != null) tensor.T01 = t0x;
  if (t0y != null) tensor.T02 = t0y;
  if (t0z != null) tensor.T03 = t0z;
  const txx = auditComponentValue(audit, "Txx");
  const txy = auditComponentValue(audit, "Txy");
  const txz = auditComponentValue(audit, "Txz");
  const tyy = auditComponentValue(audit, "Tyy");
  const tyz = auditComponentValue(audit, "Tyz");
  const tzz = auditComponentValue(audit, "Tzz");
  if (txx != null) tensor.T11 = txx;
  if (txy != null) tensor.T12 = txy;
  if (txz != null) tensor.T13 = txz;
  if (tyy != null) tensor.T22 = tyy;
  if (tyz != null) tensor.T23 = tyz;
  if (tzz != null) tensor.T33 = tzz;
  return tensor;
};

const wallRegionFromAudit = (args: {
  candidate: Nhm2LayeredWallSourceCandidateV1;
  candidateRef: string;
  audit: Nhm2LayeredWallFullTensorSourceAuditV1;
  auditRef: string;
}): Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] => {
  const fullTensorCandidate = args.audit.authority.fullTensorCandidate;
  const tensor = tensorFromAudit(args.audit);
  if (tensor.T00 == null) {
    tensor.T00 = -Math.abs(args.candidate.candidateWallT00AbsSI);
  }
  return {
    regionId: "wall",
    status: fullTensorCandidate ? "pass" : "review",
    tensorAuthorityMode: fullTensorCandidate ? "symmetric_full_tensor" : "proxy",
    tensor,
    symmetry: {
      declared: fullTensorCandidate,
      kind: fullTensorCandidate ? "symmetric" : "unknown",
      lowerComponentsDerivedBySymmetry: fullTensorCandidate,
    },
    chartRef: args.audit.chartId,
    unitsRef: "J/m^3",
    regionMaskRef: "nhm2.layered_wall_source_candidate.wall",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 1,
    sourceSupport: {
      supportKernelId: args.candidate.selectedRowId,
      cycleAverageStatus: "review",
      dutyCycleStatus: "review",
      lightCrossingConsistencyStatus: "unknown",
    },
    provenance: {
      producerModule: "tools/nhm2/build-layered-wall-source-tensor-candidate.ts",
      producerFunction: "buildLayeredWallSourceTensorCandidate",
      derivationMode: fullTensorCandidate
        ? "source_model_reconstituted_full_tensor"
        : "diagonal_proxy",
      inputRefs: [args.candidateRef, args.auditRef],
      preAggregationValueRefs: [
        `${args.auditRef}#components`,
        `${args.candidateRef}#selectedRowId=${args.candidate.selectedRowId}`,
      ],
      notDerivedFromMetricRequiredTensor: true,
    },
    blockers: fullTensorCandidate
      ? []
      : [
          ...args.audit.blockers,
          "layered_wall_full_tensor_audit_incomplete",
          "scalar_layering_does_not_close_source",
        ],
  };
};

export const buildLayeredWallSourceTensorCandidate = (args: {
  generatedAt?: string;
  runId?: string;
  candidate: Nhm2LayeredWallSourceCandidateV1;
  candidateRef: string;
  fullTensorAudit?: Nhm2LayeredWallFullTensorSourceAuditV1 | null;
  fullTensorAuditRef?: string | null;
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const fullTensorAudit = args.fullTensorAudit ?? null;
  const wallRegion =
    fullTensorAudit == null
      ? {
          regionId: "wall",
          status: "review",
          tensorAuthorityMode: "proxy",
          tensor: {
            T00: -Math.abs(args.candidate.candidateWallT00AbsSI),
          },
          symmetry: {
            declared: false,
            kind: "unknown",
            lowerComponentsDerivedBySymmetry: false,
          },
          chartRef: "comoving_cartesian",
          unitsRef: "J/m^3",
          regionMaskRef: "nhm2.layered_wall_source_candidate.wall",
          aggregationMode: "mean",
          normalizationBasis: "sample_count",
          sampleCount: 1,
          sourceSupport: {
            supportKernelId: args.candidate.selectedRowId,
            cycleAverageStatus: "review",
            dutyCycleStatus: "review",
            lightCrossingConsistencyStatus: "unknown",
          },
          provenance: {
            producerModule: "tools/nhm2/build-layered-wall-source-tensor-candidate.ts",
            producerFunction: "buildLayeredWallSourceTensorCandidate",
            derivationMode: "diagonal_proxy",
            inputRefs: [args.candidateRef],
            preAggregationValueRefs: [
              `${args.candidateRef}#candidateWallT00AbsSI`,
              `${args.candidateRef}#selectedRowId=${args.candidate.selectedRowId}`,
            ],
            notDerivedFromMetricRequiredTensor: true,
          },
          blockers: [
            "layered_candidate_t00_only",
            "missing_t0i_components",
            "missing_off_diagonal_tij_components",
            "scalar_layering_does_not_close_source",
          ],
        } satisfies Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]
      : wallRegionFromAudit({
          candidate: args.candidate,
          candidateRef: args.candidateRef,
          audit: fullTensorAudit,
          auditRef: args.fullTensorAuditRef ?? "layered-wall-full-tensor-audit",
        });

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    regionId === "wall" ? wallRegion : missingRegion(regionId, args.candidateRef),
  );

  return buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    runId: args.runId ?? "layered-wall-source-candidate",
    selectedProfileId: args.candidate.selectedProfileId,
    expectedProfileId: args.candidate.selectedProfileId,
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "nhm2_layered_wall_source_candidate",
      sourceModelVersion: "v1",
      sourceModelClass: fullTensorAudit?.authority.fullTensorCandidate === true
        ? "reconstituted_from_source_channels"
        : "diagonal_proxy",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: [
        args.candidateRef,
        ...(args.fullTensorAuditRef == null ? [] : [args.fullTensorAuditRef]),
      ],
      qeiDossierRef: args.candidate.evidenceRefs.qeiDossierRef,
      conservationRef: args.candidate.evidenceRefs.conservationRef,
    },
    regions,
    literatureRefs: [],
  });
};

export const publishLayeredWallSourceTensorCandidate = (args: {
  repoRoot: string;
  candidatePath: string;
  outPath: string;
  fullTensorAuditPath?: string | null;
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const candidate = readJson(resolvePath(args.repoRoot, args.candidatePath));
  if (!isNhm2LayeredWallSourceCandidateArtifact(candidate)) {
    throw new Error("candidate must be nhm2_layered_wall_source_candidate/v1");
  }
  const audit =
    args.fullTensorAuditPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.fullTensorAuditPath));
  if (audit != null && !isNhm2LayeredWallFullTensorSourceAuditArtifact(audit)) {
    throw new Error(
      "full tensor audit must be nhm2_layered_wall_full_tensor_source_audit/v1",
    );
  }
  const artifact = buildLayeredWallSourceTensorCandidate({
    candidate,
    candidateRef: args.candidatePath,
    fullTensorAudit: audit == null ? null : audit,
    fullTensorAuditRef: args.fullTensorAuditPath ?? null,
  });
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(artifact)) {
    throw new Error("internal error: produced invalid tile-effective tensor source");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const argv = parseArgs(process.argv.slice(2));
  const candidatePath = asString(argv.candidate);
  const outPath = asString(argv.out);
  if (candidatePath == null || outPath == null) {
    throw new Error("--candidate and --out are required");
  }
  const artifact = publishLayeredWallSourceTensorCandidate({
    repoRoot: process.cwd(),
    candidatePath,
    outPath,
    fullTensorAuditPath: asString(argv["full-tensor-audit"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
