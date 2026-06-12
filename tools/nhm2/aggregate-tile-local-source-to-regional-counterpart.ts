import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2TileLocalSourceElementsArtifact,
  type Nhm2TileLocalSourceElementV1,
  type Nhm2TileLocalSourceElementsArtifactV1,
} from "../../shared/contracts/nhm2-tile-local-source-element.v1";
import {
  buildNhm2TileEffectiveCounterpartArtifact,
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartRegion,
  type Nhm2TileEffectiveCounterpartTensorAuthorityMode,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

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

const componentSet = (tensor: Nhm2RegionalTensor): Set<Nhm2TensorComponent> =>
  new Set(NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null));

const inferCounterpartTensorAuthority = (
  tensor: Nhm2RegionalTensor,
): Nhm2TileEffectiveCounterpartTensorAuthorityMode => {
  const components = componentSet(tensor);
  if (NHM2_TENSOR_COMPONENTS.every((component) => components.has(component))) {
    return "full_tensor";
  }
  const symmetric: readonly Nhm2TensorComponent[] = [
    "T00",
    "T01",
    "T02",
    "T03",
    "T11",
    "T12",
    "T13",
    "T22",
    "T23",
    "T33",
  ];
  if (symmetric.every((component) => components.has(component))) {
    return "symmetric_full_tensor";
  }
  if (["T00", "T11", "T22", "T33"].every((component) => components.has(component as Nhm2TensorComponent))) {
    return "diagonal_reduced_order";
  }
  return components.size > 0 ? "proxy" : "unknown";
};

const aggregateTensor = (
  elements: Nhm2TileLocalSourceElementV1[],
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2RegionalTensor => {
  const tensor: Nhm2RegionalTensor = {};
  for (const component of NHM2_TENSOR_COMPONENTS) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const element of elements) {
      const weight = Math.max(0, element.regionWeights[regionId] ?? 0);
      const value = element.localTensor[component];
      if (weight <= 0 || value == null) continue;
      weightedSum += value * weight;
      weightSum += weight;
    }
    if (weightSum > 0) tensor[component] = weightedSum / weightSum;
  }
  return tensor;
};

const sourceBlockersFor = (
  elements: Nhm2TileLocalSourceElementV1[],
  tensorAuthorityMode: Nhm2TileEffectiveCounterpartTensorAuthorityMode,
): string[] => {
  const blockers = new Set<string>();
  for (const element of elements) {
    for (const blocker of element.blockers) blockers.add(`tile_local:${blocker}`);
    if (element.material.materialReceiptStatus !== "material_receipted") {
      blockers.add("material_receipt_missing_or_not_receipted");
    }
  }
  if (tensorAuthorityMode !== "full_tensor" && tensorAuthorityMode !== "symmetric_full_tensor") {
    blockers.add("full_tensor_authority_missing");
    blockers.add("tile_local_full_tensor_components_missing");
  }
  return Array.from(blockers);
};

const makeMissingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2TileEffectiveCounterpartRegion => ({
  regionId,
  status: "missing",
  comparisonRole: "unknown",
  tensorAuthorityMode: "unknown",
  tensor: {},
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: null,
  aggregationMode: "unknown",
  normalizationBasis: "unknown",
  sampleCount: null,
  provenance: {
    producerModule: "tools/nhm2/aggregate-tile-local-source-to-regional-counterpart.ts",
    producerFunction: "aggregateTileLocalSourceToRegionalCounterpart",
    inputRefs: [],
    sourceModelId: "nhm2_tile_local_source_elements",
    sourceModelVersion: "v1",
    derivationMode: "unknown",
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: [
    "tile_local_source_region_weight_missing",
    "tile_effective_counterpart_missing",
  ],
});

export const aggregateTileLocalSourceToRegionalCounterpart = (args: {
  referenceRun: ReturnType<typeof readJson>;
  tileLocalSourceElements: Nhm2TileLocalSourceElementsArtifactV1;
  tileLocalSourceElementsRef: string;
}): Nhm2TileEffectiveCounterpartArtifact => {
  if (!isNhm2ReferenceRunArtifact(args.referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const contributing = args.tileLocalSourceElements.elements.filter(
      (element) => Math.max(0, element.regionWeights[regionId] ?? 0) > 0,
    );
    if (contributing.length === 0) return makeMissingRegion(regionId);
    const tensor = aggregateTensor(contributing, regionId);
    const tensorAuthorityMode = inferCounterpartTensorAuthority(tensor);
    const blockers = sourceBlockersFor(contributing, tensorAuthorityMode);
    return {
      regionId,
      status: blockers.length > 0 ? "review" : "pass",
      comparisonRole: "tile_effective_counterpart",
      tensorAuthorityMode,
      tensor,
      chartRef: "comoving_cartesian",
      unitsRef: "J/m^3",
      regionMaskRef:
        regionId === "global"
          ? "tile_local_source.region_weight.global"
          : `tile_local_source.region_weight.${regionId}`,
      aggregationMode: "mean",
      normalizationBasis: "sample_count",
      sampleCount: contributing.length,
      provenance: {
        producerModule: "tools/nhm2/aggregate-tile-local-source-to-regional-counterpart.ts",
        producerFunction: "aggregateTileLocalSourceToRegionalCounterpart",
        inputRefs: [
          args.tileLocalSourceElementsRef,
          ...contributing.map((element) => element.tileElementId),
        ],
        sourceModelId: args.tileLocalSourceElements.sourceModel.sourceModelId,
        sourceModelVersion: args.tileLocalSourceElements.sourceModel.sourceModelVersion,
        derivationMode:
          tensorAuthorityMode === "full_tensor" || tensorAuthorityMode === "symmetric_full_tensor"
            ? "tile_model_reconstituted_full_tensor"
            : tensorAuthorityMode === "diagonal_reduced_order" || tensorAuthorityMode === "proxy"
              ? "diagonal_proxy"
              : "unknown",
        notDerivedFromMetricRequiredTensor: true,
      },
      blockers,
    } satisfies Nhm2TileEffectiveCounterpartRegion;
  });

  return buildNhm2TileEffectiveCounterpartArtifact({
    generatedAt: new Date().toISOString(),
    runId: args.referenceRun.runId,
    selectedProfileId: args.referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: args.referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    sourceAuthorityMode: "cycle_averaged_tile_model",
    sourceTensorArtifactRef: args.tileLocalSourceElementsRef,
    sourceTensorAuthorityMode: args.tileLocalSourceElements.summary.allElementsHaveLocalTensorAuthority
      ? "full_tensor"
      : args.tileLocalSourceElements.summary.anyProxy
        ? "proxy"
        : "unknown",
    conservationRef: null,
    conservationStatus: "unknown",
    qeiDossierRef: null,
    qeiApplicabilityStatus: "UNKNOWN",
    quantumStateAssumptions: [],
    renormalizationConvention: null,
    cavityBoundaryModel: "ideal_parallel_plate_scalar_placeholder",
    cycleAverageClosureStatus: "review",
    dutyCycleStatus: "review",
    lightCrossingConsistencyStatus: "unknown",
    conservationDiagnostics: {
      divTStatus: "unknown",
      divTResidualLInf: null,
      continuityResidualLInf: null,
      momentumResidualLInf: null,
    },
    regions,
    literatureRefs: [
      "ford_roman_1996_negative_energy_restrictions",
      "reid_white_johnson_2010_arbitrary_geometry_casimir",
      "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
    ],
  });
};

export const publishAggregatedTileLocalSourceCounterpart = (args: {
  repoRoot: string;
  referenceRunPath: string;
  tileLocalSourceElementsPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2TileEffectiveCounterpartArtifact => {
  if (
    !args.auditOnly &&
    (pathUsesLatestAlias(args.referenceRunPath) ||
      pathUsesLatestAlias(args.tileLocalSourceElementsPath))
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const tileLocalSourceElements = readJson(
    resolvePath(args.repoRoot, args.tileLocalSourceElementsPath),
  );
  if (!isNhm2TileLocalSourceElementsArtifact(tileLocalSourceElements)) {
    throw new Error("tile local source elements must be nhm2_tile_local_source_elements/v1");
  }
  const artifact = aggregateTileLocalSourceToRegionalCounterpart({
    referenceRun,
    tileLocalSourceElements,
    tileLocalSourceElementsRef: args.tileLocalSourceElementsPath,
  });
  if (!isNhm2TileEffectiveCounterpartArtifact(artifact)) {
    throw new Error("internal error: produced invalid tile-effective counterpart artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const tileLocalSourceElementsPath = asString(args["tile-local-source-elements"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || tileLocalSourceElementsPath == null || outPath == null) {
    throw new Error("--reference-run, --tile-local-source-elements, and --out are required");
  }
  const artifact = publishAggregatedTileLocalSourceCounterpart({
    repoRoot: process.cwd(),
    referenceRunPath,
    tileLocalSourceElementsPath,
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (existsSync(normalize(process.argv[1] ?? "")) &&
  normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
