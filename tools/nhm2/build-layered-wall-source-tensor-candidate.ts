import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2LayeredWallSourceCandidateArtifact,
  type Nhm2LayeredWallSourceCandidateV1,
} from "../../shared/contracts/nhm2-layered-wall-source-candidate.v1";
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

export const buildLayeredWallSourceTensorCandidate = (args: {
  generatedAt?: string;
  runId?: string;
  candidate: Nhm2LayeredWallSourceCandidateV1;
  candidateRef: string;
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const wallRegion: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] = {
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
  };

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
      sourceModelClass: "diagonal_proxy",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: [args.candidateRef],
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
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const candidate = readJson(resolvePath(args.repoRoot, args.candidatePath));
  if (!isNhm2LayeredWallSourceCandidateArtifact(candidate)) {
    throw new Error("candidate must be nhm2_layered_wall_source_candidate/v1");
  }
  const artifact = buildLayeredWallSourceTensorCandidate({
    candidate,
    candidateRef: args.candidatePath,
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
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
