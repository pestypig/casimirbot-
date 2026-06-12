import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  isNhm2LayeredWallSourceCandidateArtifact,
  type Nhm2LayeredWallSourceCandidateV1,
} from "../../shared/contracts/nhm2-layered-wall-source-candidate.v1";
import {
  buildNhm2WallMaterialSourceTensorModelArtifact,
  isNhm2WallMaterialSourceTensorComponentId,
  isNhm2WallMaterialSourceTensorModelArtifact,
  NHM2_WALL_MATERIAL_SOURCE_TENSOR_COMPONENT_IDS,
  type Nhm2WallMaterialSourceTensorBasis,
  type Nhm2WallMaterialSourceTensorComponentId,
  type Nhm2WallMaterialSourceTensorComponentStatus,
  type Nhm2WallMaterialSourceTensorComponentV1,
  type Nhm2WallMaterialSourceTensorModelKind,
  type Nhm2WallMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-wall-material-source-tensor-model.v1";

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

const unitFor = (
  componentId: Nhm2WallMaterialSourceTensorComponentId,
): Nhm2WallMaterialSourceTensorComponentV1["unit"] =>
  componentId.startsWith("T0") ? "J/m^3" : "Pa";

const normalizeStatus = (
  value: unknown,
  hasValue: boolean,
): Nhm2WallMaterialSourceTensorComponentStatus => {
  if (
    value === "computed" ||
    value === "material_receipted" ||
    value === "missing" ||
    value === "blocked"
  ) {
    return value;
  }
  return hasValue ? "computed" : "missing";
};

const normalizeModelKind = (
  value: unknown,
  receipt: CasimirMaterialReceiptV1 | null,
): Nhm2WallMaterialSourceTensorModelKind => {
  const text = asString(value);
  if (
    text === "lifshitz_wall_tensor" ||
    text === "measured_material_tensor" ||
    text === "declared_research_tensor" ||
    text === "missing"
  ) {
    return text;
  }
  if (receipt?.status === "material_receipted") {
    if (receipt.material.modelKind === "lifshitz") return "lifshitz_wall_tensor";
    if (receipt.material.modelKind === "measured_dielectric") {
      return "measured_material_tensor";
    }
  }
  return "missing";
};

const normalizeBasis = (value: unknown): Nhm2WallMaterialSourceTensorBasis => {
  const text = asString(value);
  return text === "coordinate" ? "coordinate" : "local_wall_orthonormal";
};

const componentEntries = (
  value: unknown,
): Map<Nhm2WallMaterialSourceTensorComponentId, unknown> => {
  const entries = new Map<Nhm2WallMaterialSourceTensorComponentId, unknown>();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const record = asRecord(entry);
      const componentId = record?.componentId;
      if (isNhm2WallMaterialSourceTensorComponentId(componentId)) {
        entries.set(componentId, entry);
      }
    }
    return entries;
  }
  const record = asRecord(value);
  if (record == null) return entries;
  for (const [key, entry] of Object.entries(record)) {
    if (isNhm2WallMaterialSourceTensorComponentId(key)) {
      entries.set(key, entry);
    }
  }
  return entries;
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => asString(entry))
        .filter((entry): entry is string => entry != null)
    : [];

const missingComponent = (
  componentId: Nhm2WallMaterialSourceTensorComponentId,
): Nhm2WallMaterialSourceTensorComponentV1 => ({
  componentId,
  valueSI: null,
  unit: unitFor(componentId),
  status: "missing",
  provenanceRef: `component-model:${componentId}`,
  assumptions: [],
  blockers: [`${componentId}_source_value_missing`],
});

const normalizeComponent = (
  componentId: Nhm2WallMaterialSourceTensorComponentId,
  value: unknown,
): Nhm2WallMaterialSourceTensorComponentV1 => {
  if (value == null) return missingComponent(componentId);
  if (typeof value === "number" && Number.isFinite(value)) {
    return {
      componentId,
      valueSI: value,
      unit: unitFor(componentId),
      status: "computed",
      provenanceRef: `component-model:${componentId}`,
      assumptions: [],
      blockers: [],
    };
  }
  const record = asRecord(value);
  if (record == null) return missingComponent(componentId);
  const valueSI = asNumber(record.valueSI);
  const status = normalizeStatus(record.status, valueSI != null);
  const blockers = stringList(record.blockers);
  if (
    valueSI == null &&
    (status === "computed" || status === "material_receipted")
  ) {
    blockers.push("component_value_missing_for_computed_status");
  }
  return {
    componentId,
    valueSI,
    unit:
      record.unit === "J/m^3" || record.unit === "Pa" || record.unit === null
        ? record.unit
        : unitFor(componentId),
    status:
      valueSI == null &&
      (status === "computed" || status === "material_receipted")
        ? "blocked"
        : status,
    provenanceRef: asString(record.provenanceRef) ?? `component-model:${componentId}`,
    assumptions: stringList(record.assumptions),
    blockers,
  };
};

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

export const buildWallMaterialSourceTensorModel = (args: {
  generatedAt?: string;
  candidate: Nhm2LayeredWallSourceCandidateV1;
  candidateRef: string;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
  materialReceiptRef?: string | null;
  componentModel?: unknown;
}): Nhm2WallMaterialSourceTensorModelV1 => {
  const componentModel = asRecord(args.componentModel);
  if (containsMetricRequiredRef(args.componentModel)) {
    throw new Error("wall source tensor model must not reference metric-required tensors");
  }
  const receipt = isCasimirMaterialReceipt(args.materialReceipt)
    ? args.materialReceipt
    : null;
  const components = componentEntries(componentModel?.components);
  const normalizedComponents =
    NHM2_WALL_MATERIAL_SOURCE_TENSOR_COMPONENT_IDS.map((componentId) =>
      normalizeComponent(componentId, components.get(componentId)),
    );
  const projection = asRecord(componentModel?.projection);
  const sameChartProjectionStatus =
    projection?.sameChartProjectionStatus === "pass" ||
    projection?.sameChartProjectionStatus === "fail" ||
    projection?.sameChartProjectionStatus === "missing"
      ? projection.sameChartProjectionStatus
      : asString(componentModel?.wallNormalRef) != null ||
          asString(projection?.wallNormalRef) != null
        ? "pass"
        : "missing";

  return buildNhm2WallMaterialSourceTensorModelArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.candidate.selectedProfileId,
    chartId: asString(componentModel?.chartId) ?? "comoving_cartesian",
    basis: normalizeBasis(componentModel?.basis),
    modelKind: normalizeModelKind(componentModel?.modelKind, receipt),
    materialReceiptRef:
      args.materialReceiptRef ??
      asString(componentModel?.materialReceiptRef) ??
      null,
    layeredCandidateRef: args.candidateRef,
    notDerivedFromMetricRequiredTensor: true,
    components: normalizedComponents,
    projection: {
      wallNormalRef:
        asString(projection?.wallNormalRef) ??
        asString(componentModel?.wallNormalRef) ??
        null,
      sameChartProjectionStatus,
    },
  });
};

export const publishWallMaterialSourceTensorModel = (args: {
  repoRoot: string;
  candidatePath: string;
  outPath: string;
  materialReceiptPath?: string | null;
  componentModelPath?: string | null;
}): Nhm2WallMaterialSourceTensorModelV1 => {
  const candidate = readJson(resolvePath(args.repoRoot, args.candidatePath));
  if (!isNhm2LayeredWallSourceCandidateArtifact(candidate)) {
    throw new Error("candidate must be nhm2_layered_wall_source_candidate/v1");
  }
  const materialReceipt =
    args.materialReceiptPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.materialReceiptPath));
  if (materialReceipt != null && !isCasimirMaterialReceipt(materialReceipt)) {
    throw new Error("material receipt must be casimir_material_receipt/v1");
  }
  const componentModel =
    args.componentModelPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.componentModelPath));
  const artifact = buildWallMaterialSourceTensorModel({
    candidate,
    candidateRef: args.candidatePath,
    materialReceipt: isCasimirMaterialReceipt(materialReceipt)
      ? materialReceipt
      : null,
    materialReceiptRef: args.materialReceiptPath ?? null,
    componentModel,
  });
  if (!isNhm2WallMaterialSourceTensorModelArtifact(artifact)) {
    throw new Error("internal error: produced invalid wall material source tensor model");
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
  const artifact = publishWallMaterialSourceTensorModel({
    repoRoot: process.cwd(),
    candidatePath,
    outPath,
    materialReceiptPath: asString(argv["material-receipt"]),
    componentModelPath: asString(argv["component-model"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
