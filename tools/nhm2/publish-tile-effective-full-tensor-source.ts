import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  isNhm2RegionalMaterialSourceTensorModelArtifact,
  type Nhm2RegionalMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-regional-material-source-tensor-model.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2TileEffectiveFullTensorSourceArtifact,
  fullTensorSourceHasFullAuthority,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceAuthorityMode,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import { isNhm2TileCounterpartConservationArtifact } from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import { isNhm2QeiDossierArtifact } from "../../shared/contracts/nhm2-qei-dossier.v1";
import { isNhm2QeiWorldlineDossier } from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";

const SOURCE_LITERATURE_REFS = [
  "natario_2001_zero_expansion",
  "pfenning_ford_1997_warp_drive_qi_restrictions",
  "ford_roman_1996_negative_energy_restrictions",
  "fewster_thompson_2023_stationary_worldline_qei",
  "maldacena_2025_real_observers_v3",
];

type SourceInputRegion = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  tensor: Nhm2RegionalTensor;
  symmetry?: "symmetric" | "none" | "unknown";
  chartRef?: string;
  unitsRef?: string;
  regionMaskRef?: string | null;
  aggregationMode?: "mean" | "integral" | "unknown";
  normalizationBasis?: "sample_count" | "volume" | "unknown";
  sampleCount?: number | null;
  inputRefs?: string[];
  preAggregationValueRefs?: string[];
  supportKernelId?: string | null;
  cycleAverageStatus?: "pass" | "review" | "fail" | "unknown";
  dutyCycleStatus?: "pass" | "review" | "fail" | "unknown";
  lightCrossingConsistencyStatus?: "pass" | "review" | "fail" | "unknown";
  producerModule?: string | null;
  producerFunction?: string | null;
  derivationMode?:
    | "source_model_direct_full_tensor"
    | "source_model_reconstituted_full_tensor"
    | "diagonal_proxy"
    | "metric_echo"
    | "unknown";
  blockers?: string[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    : [];

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

const normalizeTensor = (value: unknown): Nhm2RegionalTensor => {
  const record = asRecord(value);
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (component in record) tensor[component] = asNumber(record[component]);
  }
  return tensor;
};

const qeiDossierPasses = (value: unknown): boolean => {
  if (isNhm2QeiDossierArtifact(value)) {
    return value.qeiApplicabilityStatus === "PASS";
  }
  if (isNhm2QeiWorldlineDossier(value)) {
    return (
      value.summary.dossierComplete &&
      value.summary.hasWallWorldline &&
      value.summary.allMarginsPass === true &&
      !value.summary.anyProxy
    );
  }
  return false;
};

const componentSet = (tensor: Nhm2RegionalTensor): Set<Nhm2TensorComponent> =>
  new Set(NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null));

const inferAuthority = (
  tensor: Nhm2RegionalTensor,
  symmetry: SourceInputRegion["symmetry"],
  derivationMode: SourceInputRegion["derivationMode"],
  sourceModelClass: string | null,
): Nhm2TileEffectiveFullTensorSourceAuthorityMode => {
  if (derivationMode === "metric_echo" || sourceModelClass === "metric_echo_forbidden") {
    return "metric_echo_forbidden";
  }
  if (derivationMode === "diagonal_proxy" || sourceModelClass === "diagonal_proxy") {
    return "diagonal_reduced_order";
  }
  const components = componentSet(tensor);
  if (NHM2_TENSOR_COMPONENTS.every((component) => components.has(component))) {
    return "full_tensor";
  }
  const symmetricComponents: Nhm2TensorComponent[] = [
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
  if (symmetry === "symmetric" && symmetricComponents.every((component) => components.has(component))) {
    return "symmetric_full_tensor";
  }
  const diagonalComponents: Nhm2TensorComponent[] = ["T00", "T11", "T22", "T33"];
  if (diagonalComponents.every((component) => components.has(component))) {
    return "diagonal_reduced_order";
  }
  return "unknown";
};

const normalizeRegion = (entry: unknown): SourceInputRegion | null => {
  const record = asRecord(entry);
  const regionId = asString(record?.regionId);
  if (
    !NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
      regionId as Nhm2RegionalSourceClosureRegionId,
    )
  ) {
    return null;
  }
  const inputRefs = Array.isArray(record?.inputRefs)
    ? record.inputRefs.filter((value): value is string => typeof value === "string")
    : [];
  const preAggregationValueRefs = Array.isArray(record?.preAggregationValueRefs)
    ? record.preAggregationValueRefs.filter((value): value is string => typeof value === "string")
    : [];
  return {
    regionId: regionId as Nhm2RegionalSourceClosureRegionId,
    tensor: normalizeTensor(record?.tensor),
    symmetry:
      record?.symmetry === "symmetric" || record?.symmetry === "none"
        ? record.symmetry
        : "unknown",
    chartRef: asString(record?.chartRef) ?? "comoving_cartesian",
    unitsRef: asString(record?.unitsRef) ?? "J/m^3",
    regionMaskRef: asString(record?.regionMaskRef),
    aggregationMode:
      record?.aggregationMode === "mean" || record?.aggregationMode === "integral"
        ? record.aggregationMode
        : "unknown",
    normalizationBasis:
      record?.normalizationBasis === "sample_count" || record?.normalizationBasis === "volume"
        ? record.normalizationBasis
        : "unknown",
    sampleCount: asNumber(record?.sampleCount),
    inputRefs,
    preAggregationValueRefs,
    supportKernelId: asString(record?.supportKernelId),
    cycleAverageStatus:
      record?.cycleAverageStatus === "pass" ||
      record?.cycleAverageStatus === "review" ||
      record?.cycleAverageStatus === "fail"
        ? record.cycleAverageStatus
        : "unknown",
    dutyCycleStatus:
      record?.dutyCycleStatus === "pass" ||
      record?.dutyCycleStatus === "review" ||
      record?.dutyCycleStatus === "fail"
        ? record.dutyCycleStatus
        : "unknown",
    lightCrossingConsistencyStatus:
      record?.lightCrossingConsistencyStatus === "pass" ||
      record?.lightCrossingConsistencyStatus === "review" ||
      record?.lightCrossingConsistencyStatus === "fail"
        ? record.lightCrossingConsistencyStatus
        : "unknown",
    producerModule: asString(record?.producerModule),
    producerFunction: asString(record?.producerFunction),
    derivationMode:
      record?.derivationMode === "source_model_direct_full_tensor" ||
      record?.derivationMode === "source_model_reconstituted_full_tensor" ||
      record?.derivationMode === "diagonal_proxy" ||
      record?.derivationMode === "metric_echo"
        ? record.derivationMode
        : "unknown",
    blockers: stringList(record?.blockers),
  };
};

const aggregationFromRegionalModel = (
  value: Nhm2RegionalMaterialSourceTensorModelV1["regions"][number]["aggregationMode"],
): "mean" | "integral" | "unknown" =>
  value === "direct_region_model" ||
  value === "aggregate_from_regions" ||
  value === "representative_sector_bin"
    ? "mean"
    : "unknown";

const normalizationFromRegionalModel = (
  value: Nhm2RegionalMaterialSourceTensorModelV1["regions"][number]["normalizationBasis"],
): "sample_count" | "volume" | "unknown" =>
  value === "sample_count" || value === "volume" ? value : "unknown";

const sourceModelClassFromRegionalModel = (
  model: Nhm2RegionalMaterialSourceTensorModelV1,
): "cycle_averaged_tile_model" | "renormalized_qft_declared" | "unknown" => {
  if (
    model.modelKind === "lifshitz_regional_tensor" ||
    model.modelKind === "measured_material_tensor"
  ) {
    return "renormalized_qft_declared";
  }
  if (model.modelKind === "declared_research_tensor") return "cycle_averaged_tile_model";
  return "unknown";
};

const supportStatusFromRegionalModel = (
  region: Nhm2RegionalMaterialSourceTensorModelV1["regions"][number],
): "pass" | "review" | "fail" | "unknown" => {
  if (region.status === "blocked" || region.status === "missing") return "fail";
  if (region.status === "proxy") return "review";
  return region.blockers.length === 0 ? "pass" : "review";
};

const sourceInputFromRegionalMaterialModel = (
  model: Nhm2RegionalMaterialSourceTensorModelV1,
  sourceInputPath: string,
): Record<string, unknown> => ({
  schemaVersion: "nhm2_tile_source_input/v1",
  sourceModelId: "nhm2_regional_material_source_tensor_model",
  sourceModelVersion: model.contractVersion,
  sourceModelClass: sourceModelClassFromRegionalModel(model),
  notDerivedFromMetricRequiredTensor: model.notDerivedFromMetricRequiredTensor,
  metricRequiredInputRefs: model.metricRequiredInputRefs,
  sourceChannels: {
    regions: model.regions.map((region) => {
      const supportStatus = supportStatusFromRegionalModel(region);
      return {
        regionId: region.regionId,
        tensor: region.tensor,
        symmetry:
          region.tensorAuthorityMode === "symmetric_full_tensor" ? "symmetric" : "none",
        chartRef: region.chartId,
        unitsRef: region.units,
        regionMaskRef: region.regionMaskRef,
        aggregationMode: aggregationFromRegionalModel(region.aggregationMode),
        normalizationBasis: normalizationFromRegionalModel(region.normalizationBasis),
        sampleCount: region.sampleCount,
        inputRefs: [
          sourceInputPath,
          model.sourceModelRef,
          model.materialReceiptRef,
          region.materialReceiptRef,
          region.provenanceRef,
        ].filter(
          (entry): entry is string => typeof entry === "string" && entry.length > 0,
        ),
        preAggregationValueRefs: [region.provenanceRef],
        supportKernelId: `regional_material_source_tensor_model.${region.regionId}`,
        cycleAverageStatus: supportStatus,
        dutyCycleStatus: supportStatus,
        lightCrossingConsistencyStatus: "review",
        producerModule: "tools/nhm2/build-regional-material-source-tensor-model.ts",
        producerFunction: "buildRegionalMaterialSourceTensorModel",
        derivationMode: "source_model_direct_full_tensor",
        blockers: region.blockers,
      };
    }),
  },
});

const missingRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
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
    producerModule: null,
    producerFunction: null,
    derivationMode: "unknown",
    inputRefs: [],
    preAggregationValueRefs: [],
    notDerivedFromMetricRequiredTensor: false,
  },
  blockers: ["tile_source_region_missing"],
});

export const publishTileEffectiveFullTensorSource = (args: {
  repoRoot: string;
  referenceRunPath: string;
  sourceInputPath: string;
  outPath: string;
  qeiDossierPath?: string | null;
  conservationPath?: string | null;
  auditOnly?: boolean;
}): Nhm2TileEffectiveFullTensorSourceArtifact => {
  const paths = [
    args.referenceRunPath,
    args.sourceInputPath,
    args.qeiDossierPath,
    args.conservationPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const rawSourceInput = readJson(resolvePath(args.repoRoot, args.sourceInputPath));
  const regionalMaterialModel = isNhm2RegionalMaterialSourceTensorModelArtifact(rawSourceInput)
    ? rawSourceInput
    : null;
  const sourceInput =
    regionalMaterialModel == null
      ? asRecord(rawSourceInput)
      : sourceInputFromRegionalMaterialModel(regionalMaterialModel, args.sourceInputPath);
  if (sourceInput == null || sourceInput.schemaVersion !== "nhm2_tile_source_input/v1") {
    throw new Error(
      "source input must be nhm2_tile_source_input/v1 or nhm2_regional_material_source_tensor_model/v1",
    );
  }

  const qei =
    args.qeiDossierPath != null && existsSync(resolvePath(args.repoRoot, args.qeiDossierPath))
      ? readJson(resolvePath(args.repoRoot, args.qeiDossierPath))
      : null;
  const conservation =
    args.conservationPath != null && existsSync(resolvePath(args.repoRoot, args.conservationPath))
      ? readJson(resolvePath(args.repoRoot, args.conservationPath))
      : null;
  const qeiPass = qeiDossierPasses(qei);
  const conservationArtifact = isNhm2TileCounterpartConservationArtifact(conservation)
    ? conservation
    : null;
  const conservationRegionMap = new Map(
    conservationArtifact?.regions.map((region) => [region.regionId, region]) ?? [],
  );
  const conservationBlockerForRegion = (
    regionId: Nhm2RegionalSourceClosureRegionId,
  ): string | null => {
    if (args.conservationPath == null || conservationArtifact == null) {
      return "conservation_unknown";
    }
    const region = conservationRegionMap.get(regionId);
    if (region == null || region.status === "missing") return "conservation_unknown";
    return region.status === "pass" ? null : "conservation_not_pass";
  };

  const sourceChannels = asRecord(sourceInput.sourceChannels);
  const sourceRegions = Array.isArray(sourceChannels?.regions)
    ? sourceChannels.regions.map(normalizeRegion).filter((region): region is SourceInputRegion => region != null)
    : [];
  const sourceRegionMap = new Map(sourceRegions.map((region) => [region.regionId, region]));
  const sourceModelClass = asString(sourceInput.sourceModelClass);
  const notDerivedFromMetricRequiredTensor =
    asBoolean(sourceInput.notDerivedFromMetricRequiredTensor) === true;
  const metricRequiredInputRefs = Array.isArray(sourceInput.metricRequiredInputRefs)
    ? sourceInput.metricRequiredInputRefs.filter((value): value is string => typeof value === "string")
    : [];
  const sourceSideOnly =
    notDerivedFromMetricRequiredTensor && metricRequiredInputRefs.length === 0;

  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const sourceRegion = sourceRegionMap.get(regionId);
    if (sourceRegion == null) return missingRegion(regionId);
    const authority = inferAuthority(
      sourceRegion.tensor,
      sourceRegion.symmetry,
      sourceRegion.derivationMode,
      sourceModelClass,
    );
    const blockers: string[] = [...(sourceRegion.blockers ?? [])];
    if (!sourceSideOnly) blockers.push("source_model_not_source_side_only");
    if (!notDerivedFromMetricRequiredTensor) blockers.push("metric_required_derivation_not_allowed");
    if (metricRequiredInputRefs.length > 0) blockers.push("metric_required_input_refs_present");
    if (args.qeiDossierPath == null || !qeiPass) {
      blockers.push("qei_dossier_not_pass");
    }
    const conservationBlocker = conservationBlockerForRegion(regionId);
    if (conservationBlocker != null) blockers.push(conservationBlocker);
    if (!fullTensorSourceHasFullAuthority(sourceRegion.tensor, authority)) {
      blockers.push("full_tensor_components_missing");
    }
    return {
      regionId,
      status: blockers.some((blocker) =>
        blocker === "metric_required_derivation_not_allowed" ||
        blocker === "metric_required_input_refs_present"
      )
        ? "fail"
        : blockers.length > 0
          ? "review"
          : "pass",
      tensorAuthorityMode: authority,
      tensor: sourceRegion.tensor,
      symmetry: {
        declared: sourceRegion.symmetry === "symmetric",
        kind: sourceRegion.symmetry ?? "unknown",
        lowerComponentsDerivedBySymmetry:
          authority === "symmetric_full_tensor" && sourceRegion.symmetry === "symmetric",
      },
      chartRef: sourceRegion.chartRef ?? "comoving_cartesian",
      unitsRef: sourceRegion.unitsRef ?? "J/m^3",
      regionMaskRef: sourceRegion.regionMaskRef ?? null,
      aggregationMode: sourceRegion.aggregationMode ?? "unknown",
      normalizationBasis: sourceRegion.normalizationBasis ?? "unknown",
      sampleCount: sourceRegion.sampleCount ?? null,
      sourceSupport: {
        supportKernelId: sourceRegion.supportKernelId ?? null,
        cycleAverageStatus: sourceRegion.cycleAverageStatus ?? "unknown",
        dutyCycleStatus: sourceRegion.dutyCycleStatus ?? "unknown",
        lightCrossingConsistencyStatus:
          sourceRegion.lightCrossingConsistencyStatus ?? "unknown",
      },
      provenance: {
        producerModule: sourceRegion.producerModule ?? "tools/nhm2/publish-tile-effective-full-tensor-source.ts",
        producerFunction: sourceRegion.producerFunction ?? "publishTileEffectiveFullTensorSource",
        derivationMode:
          sourceRegion.derivationMode === "unknown"
            ? authority === "diagonal_reduced_order"
              ? "diagonal_proxy"
              : "source_model_reconstituted_full_tensor"
            : sourceRegion.derivationMode,
        inputRefs: sourceRegion.inputRefs ?? [],
        preAggregationValueRefs: sourceRegion.preAggregationValueRefs ?? [],
        notDerivedFromMetricRequiredTensor,
      },
      blockers,
    } satisfies Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number];
  });

  const artifact = buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: new Date().toISOString(),
    runId: referenceRun.runId,
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    expectedProfileId: referenceRun.selectedFamily.expectedProfileId,
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: asString(sourceInput.sourceModelId) ?? "unknown_tile_source_model",
      sourceModelVersion: asString(sourceInput.sourceModelVersion) ?? "unknown",
      sourceModelClass:
        sourceModelClass === "cycle_averaged_tile_model" ||
        sourceModelClass === "renormalized_qft_declared" ||
        sourceModelClass === "reconstituted_from_source_channels" ||
        sourceModelClass === "diagonal_proxy" ||
        sourceModelClass === "metric_echo_forbidden"
          ? sourceModelClass
          : "unknown",
      sourceSideOnly,
      notDerivedFromMetricRequiredTensor,
      metricRequiredInputRefs,
      sourceInputRefs: [args.sourceInputPath],
      qeiDossierRef: args.qeiDossierPath ?? null,
      conservationRef: args.conservationPath ?? null,
    },
    regions,
    literatureRefs: SOURCE_LITERATURE_REFS,
  });

  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const sourceInputPath = asString(args["source-input"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || sourceInputPath == null || outPath == null) {
    throw new Error("--reference-run, --source-input, and --out are required");
  }
  const artifact = publishTileEffectiveFullTensorSource({
    repoRoot: process.cwd(),
    referenceRunPath,
    sourceInputPath,
    qeiDossierPath: asString(args["qei-dossier"]),
    conservationPath: asString(args.conservation),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
