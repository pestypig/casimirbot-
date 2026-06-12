import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2RegionalMaterialSourceTensorModelArtifact,
  isNhm2RegionalMaterialSourceTensorModelArtifact,
  inferNhm2RegionalMaterialSourceTensorAuthorityMode,
  missingNhm2RegionalMaterialSourceTensorComponents,
  type Nhm2RegionalMaterialSourceTensorModelKind,
  type Nhm2RegionalMaterialSourceTensorModelV1,
  type Nhm2RegionalMaterialSourceTensorRegionV1,
} from "../../shared/contracts/nhm2-regional-material-source-tensor-model.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));

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

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isTensorComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const containsMetricRequiredRef = (value: unknown): boolean => {
  if (typeof value === "string") {
    return /metric[-_ ]?required|metricrequired|copied_from_metric|derived_from_metric|einstein_tensor/i.test(
      value,
    );
  }
  if (Array.isArray(value)) return value.some(containsMetricRequiredRef);
  const record = asRecord(value);
  return record == null ? false : Object.values(record).some(containsMetricRequiredRef);
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asString(entry))
        .filter((entry): entry is string => entry != null)
    : [];

const tensorFrom = (value: unknown): Nhm2RegionalTensor => {
  const record = asRecord(value);
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const [key, entry] of Object.entries(record)) {
    if (!isTensorComponent(key)) continue;
    const valueSI =
      typeof entry === "number"
        ? asNumber(entry)
        : asNumber(asRecord(entry)?.valueSI);
    if (valueSI != null) tensor[key] = valueSI;
  }
  return tensor;
};

const normalizeModelKind = (
  value: unknown,
  receipt: CasimirMaterialReceiptV1 | null,
): Nhm2RegionalMaterialSourceTensorModelKind => {
  const text = asString(value);
  if (
    text === "lifshitz_regional_tensor" ||
    text === "measured_material_tensor" ||
    text === "declared_research_tensor" ||
    text === "missing"
  ) {
    return text;
  }
  if (receipt?.status === "material_receipted") {
    if (receipt.material.modelKind === "measured_dielectric") {
      return "measured_material_tensor";
    }
    if (receipt.material.modelKind === "lifshitz") {
      return "lifshitz_regional_tensor";
    }
  }
  return "missing";
};

const regionEntries = (
  value: unknown,
): Map<Nhm2RegionalSourceClosureRegionId, unknown> => {
  const entries = new Map<Nhm2RegionalSourceClosureRegionId, unknown>();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const record = asRecord(entry);
      if (isRegionId(record?.regionId)) entries.set(record.regionId, entry);
    }
    return entries;
  }
  const record = asRecord(value);
  if (record == null) return entries;
  for (const [key, entry] of Object.entries(record)) {
    if (isRegionId(key)) entries.set(key, entry);
  }
  return entries;
};

const componentStatusFromTensor = (
  tensor: Nhm2RegionalTensor,
  status: Nhm2RegionalMaterialSourceTensorRegionV1["status"],
): Nhm2RegionalMaterialSourceTensorRegionV1["componentStatus"] =>
  Object.fromEntries(
    Object.keys(tensor).map((component) => [
      component,
      status === "material_receipted" ? "material_receipted" : "computed",
    ]),
  ) as Nhm2RegionalMaterialSourceTensorRegionV1["componentStatus"];

const normalizeRegion = (args: {
  regionId: Nhm2RegionalSourceClosureRegionId;
  value: unknown;
  defaultChartId: string;
  defaultMaterialReceiptRef: string | null;
  defaultMaterialReceiptStatus: Nhm2RegionalMaterialSourceTensorRegionV1["materialReceiptStatus"];
}): Nhm2RegionalMaterialSourceTensorRegionV1 => {
  const record = asRecord(args.value);
  const tensor = tensorFrom(record?.tensor ?? record?.components ?? args.value);
  const tensorAuthorityMode = inferNhm2RegionalMaterialSourceTensorAuthorityMode(tensor);
  const missingComponentIds = missingNhm2RegionalMaterialSourceTensorComponents(tensor);
  const requestedStatus = asString(record?.status);
  const status: Nhm2RegionalMaterialSourceTensorRegionV1["status"] =
    requestedStatus === "material_receipted" ||
    requestedStatus === "computed" ||
    requestedStatus === "proxy" ||
    requestedStatus === "missing" ||
    requestedStatus === "blocked"
      ? requestedStatus
      : args.defaultMaterialReceiptStatus === "material_receipted"
        ? "material_receipted"
        : tensorAuthorityMode === "unknown"
          ? "missing"
          : "computed";
  const blockers = stringList(record?.blockers);
  if (args.regionId === "global" && record?.aggregationMode === "copied_from_wall") {
    blockers.push("global_region_cannot_be_copied_from_wall");
  }
  if (status === "computed" && Object.keys(tensor).length === 0) {
    blockers.push("computed_region_tensor_value_missing");
  }

  return {
    regionId: args.regionId,
    status:
      blockers.includes("computed_region_tensor_value_missing") ||
      blockers.includes("global_region_cannot_be_copied_from_wall")
        ? "blocked"
        : status,
    tensor,
    componentStatus: componentStatusFromTensor(tensor, status),
    tensorAuthorityMode,
    missingComponentIds,
    chartId: asString(record?.chartId) ?? args.defaultChartId,
    basisRef: asString(record?.basisRef) ?? "same_basis",
    units: asString(record?.units) ?? "J/m^3",
    regionMaskRef:
      asString(record?.regionMaskRef) ??
      (args.regionId === "global"
        ? "regional_material_source_tensor.aggregate.global"
        : `regional_material_source_tensor.region.${args.regionId}`),
    aggregationMode:
      record?.aggregationMode === "direct_region_model" ||
      record?.aggregationMode === "aggregate_from_regions" ||
      record?.aggregationMode === "representative_sector_bin" ||
      record?.aggregationMode === "unknown"
        ? record.aggregationMode
        : "representative_sector_bin",
    normalizationBasis:
      record?.normalizationBasis === "sample_count" ||
      record?.normalizationBasis === "volume" ||
      record?.normalizationBasis === "area" ||
      record?.normalizationBasis === "unknown"
        ? record.normalizationBasis
        : "sample_count",
    sampleCount: asNumber(record?.sampleCount) ?? 1,
    materialReceiptRef:
      asString(record?.materialReceiptRef) ?? args.defaultMaterialReceiptRef,
    materialReceiptStatus:
      record?.materialReceiptStatus === "material_receipted" ||
      record?.materialReceiptStatus === "ideal_scalar_only" ||
      record?.materialReceiptStatus === "blocked" ||
      record?.materialReceiptStatus === "missing"
        ? record.materialReceiptStatus
        : args.defaultMaterialReceiptStatus,
    provenanceRef:
      asString(record?.provenanceRef) ?? `component-model:${args.regionId}`,
    notDerivedFromMetricRequiredTensor: true,
    blockers,
    warnings: stringList(record?.warnings),
  };
};

export const buildRegionalMaterialSourceTensorModel = (args: {
  generatedAt?: string;
  componentModel: unknown;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
  materialReceiptRef?: string | null;
  sourceModelRef?: string | null;
}): Nhm2RegionalMaterialSourceTensorModelV1 => {
  if (containsMetricRequiredRef(args.componentModel)) {
    throw new Error("regional material source tensor model must not reference metric-required tensors");
  }
  const model = asRecord(args.componentModel);
  const receipt = isCasimirMaterialReceipt(args.materialReceipt)
    ? args.materialReceipt
    : null;
  const materialReceiptRef =
    args.materialReceiptRef ?? asString(model?.materialReceiptRef) ?? null;
  const materialReceiptStatus =
    receipt?.status ??
    (model?.materialReceiptStatus === "material_receipted" ||
    model?.materialReceiptStatus === "ideal_scalar_only" ||
    model?.materialReceiptStatus === "blocked" ||
    model?.materialReceiptStatus === "missing"
      ? model.materialReceiptStatus
      : "missing");
  const entries = regionEntries(model?.regions);
  const regions = [...entries.entries()].map(([regionId, value]) =>
    normalizeRegion({
      regionId,
      value,
      defaultChartId: asString(model?.chartId) ?? "comoving_cartesian",
      defaultMaterialReceiptRef: materialReceiptRef,
      defaultMaterialReceiptStatus: materialReceiptStatus,
    }),
  );

  return buildNhm2RegionalMaterialSourceTensorModelArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: asString(model?.selectedProfileId) ?? "stage1_centerline_alpha_0p995_v1",
    chartId: asString(model?.chartId) ?? "comoving_cartesian",
    modelKind: normalizeModelKind(model?.modelKind, receipt),
    materialReceiptRef,
    sourceModelRef: args.sourceModelRef ?? asString(model?.sourceModelRef) ?? null,
    notDerivedFromMetricRequiredTensor: true,
    regions,
  });
};

export const publishRegionalMaterialSourceTensorModel = (args: {
  repoRoot: string;
  componentModelPath: string;
  outPath: string;
  materialReceiptPath?: string | null;
}): Nhm2RegionalMaterialSourceTensorModelV1 => {
  const componentModel = readJson(resolvePath(args.repoRoot, args.componentModelPath));
  const materialReceipt =
    args.materialReceiptPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.materialReceiptPath));
  if (materialReceipt != null && !isCasimirMaterialReceipt(materialReceipt)) {
    throw new Error("material receipt must be casimir_material_receipt/v1");
  }
  const artifact = buildRegionalMaterialSourceTensorModel({
    componentModel,
    materialReceipt: isCasimirMaterialReceipt(materialReceipt) ? materialReceipt : null,
    materialReceiptRef: args.materialReceiptPath ?? null,
    sourceModelRef: args.componentModelPath,
  });
  if (!isNhm2RegionalMaterialSourceTensorModelArtifact(artifact)) {
    throw new Error("internal error: produced invalid regional source tensor model");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const argv = parseArgs(process.argv.slice(2));
  const componentModelPath = asString(argv["component-model"]);
  const outPath = asString(argv.out);
  if (componentModelPath == null || outPath == null) {
    throw new Error("--component-model and --out are required");
  }
  const artifact = publishRegionalMaterialSourceTensorModel({
    repoRoot: process.cwd(),
    componentModelPath,
    outPath,
    materialReceiptPath: asString(argv["material-receipt"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
