import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2LayeredWallFullTensorSourceAuditArtifact,
  isNhm2LayeredWallFullTensorSourceAuditArtifact,
  type Nhm2LayeredWallFullTensorComponentV1,
  type Nhm2LayeredWallFullTensorSourceAuditV1,
  type Nhm2LayeredWallSourceModelKind,
} from "../../shared/contracts/nhm2-layered-wall-full-tensor-source-audit.v1";
import {
  isNhm2LayeredWallSourceCandidateArtifact,
  type Nhm2LayeredWallSourceCandidateV1,
} from "../../shared/contracts/nhm2-layered-wall-source-candidate.v1";
import {
  isNhm2WallMaterialSourceTensorModelArtifact,
  type Nhm2WallMaterialSourceTensorComponentId,
  type Nhm2WallMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-wall-material-source-tensor-model.v1";

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

const sourceModelKindFor = (
  receipt: CasimirMaterialReceiptV1 | null,
): Nhm2LayeredWallSourceModelKind => {
  if (receipt?.status === "material_receipted") {
    if (receipt.material.modelKind === "measured_dielectric") {
      return "measured_material_tensor";
    }
    if (receipt.material.modelKind === "lifshitz") {
      return "lifshitz_material_tensor";
    }
  }
  return "ideal_parallel_plate_tensor_proxy";
};

const sourceModelKindForTensorModel = (
  model: Nhm2WallMaterialSourceTensorModelV1,
  receipt: CasimirMaterialReceiptV1 | null,
): Nhm2LayeredWallSourceModelKind => {
  if (model.modelKind === "declared_research_tensor") {
    return "declared_research_tensor";
  }
  if (model.modelKind === "measured_material_tensor") {
    return "measured_material_tensor";
  }
  if (model.modelKind === "lifshitz_wall_tensor") {
    return "lifshitz_material_tensor";
  }
  return sourceModelKindFor(receipt);
};

const missingComponent = (
  componentId: Exclude<Nhm2LayeredWallFullTensorComponentV1["componentId"], "T00">,
  blockers: string[],
): Nhm2LayeredWallFullTensorComponentV1 => ({
  componentId,
  valueSI: null,
  unit: componentId.startsWith("T0") ? "J/m^3" : "Pa",
  status: "missing",
  blockers,
});

const componentComputed = (
  component: Nhm2LayeredWallFullTensorComponentV1 | undefined,
): boolean =>
  component?.valueSI != null &&
  (component.status === "computed" ||
    component.status === "derived_ideal_proxy" ||
    component.status === "material_receipted");

const tensorModelComponentStatus = (
  status: Nhm2WallMaterialSourceTensorModelV1["components"][number]["status"],
): Nhm2LayeredWallFullTensorComponentV1["status"] => {
  if (status === "computed" || status === "material_receipted") return status;
  return status;
};

const auditComponentFromSourceModel = (
  componentId: Nhm2WallMaterialSourceTensorComponentId,
  model: Nhm2WallMaterialSourceTensorModelV1,
): Nhm2LayeredWallFullTensorComponentV1 => {
  const component = model.components.find((entry) => entry.componentId === componentId);
  if (component == null) {
    return {
      componentId,
      valueSI: null,
      unit: componentId.startsWith("T0") ? "J/m^3" : "Pa",
      status: "missing",
      blockers: [`${componentId}_source_value_missing`],
    };
  }
  return {
    componentId,
    valueSI: component.valueSI,
    unit: component.unit,
    status: tensorModelComponentStatus(component.status),
    blockers: component.blockers,
  };
};

const auditComponentsFromSourceModel = (
  model: Nhm2WallMaterialSourceTensorModelV1,
): Nhm2LayeredWallFullTensorComponentV1[] =>
  ([
    "T00",
    "T0x",
    "T0y",
    "T0z",
    "Txx",
    "Txy",
    "Txz",
    "Tyy",
    "Tyz",
    "Tzz",
  ] as const).map((componentId) =>
    auditComponentFromSourceModel(componentId, model),
  );

const addComponentCoverageBlockers = (
  blockers: Set<string>,
  components: Nhm2LayeredWallFullTensorComponentV1[],
): void => {
  const byId = new Map(components.map((component) => [component.componentId, component]));
  if (!componentComputed(byId.get("T00"))) blockers.add("source_t00_model_missing");
  if (!(["T0x", "T0y", "T0z"] as const).every((id) => componentComputed(byId.get(id)))) {
    blockers.add("momentum_density_model_missing");
  }
  if (!(["Txx", "Tyy", "Tzz"] as const).every((id) => componentComputed(byId.get(id)))) {
    blockers.add("spatial_stress_model_missing");
  }
  if (!(["Txy", "Txz", "Tyz"] as const).every((id) => componentComputed(byId.get(id)))) {
    blockers.add("off_diagonal_stress_model_missing");
  }
};

export const buildLayeredWallFullTensorSourceAudit = (args: {
  generatedAt?: string;
  candidate: Nhm2LayeredWallSourceCandidateV1;
  candidateRef: string;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
  materialReceiptRef?: string | null;
  sourceTensorModel?: Nhm2WallMaterialSourceTensorModelV1 | null;
  sourceTensorModelRef?: string | null;
}): Nhm2LayeredWallFullTensorSourceAuditV1 => {
  const materialReceipt = isCasimirMaterialReceipt(args.materialReceipt)
    ? args.materialReceipt
    : null;
  const sourceTensorModel = isNhm2WallMaterialSourceTensorModelArtifact(
    args.sourceTensorModel,
  )
    ? args.sourceTensorModel
    : null;
  const blockers = new Set<string>();
  if (materialReceipt?.status !== "material_receipted") {
    blockers.add("material_receipt_missing_or_not_receipted");
  } else if (sourceTensorModel == null) {
    blockers.add("material_receipt_attached_but_material_tensor_model_missing");
  }
  if (args.candidate.selectedVolumeMode === "fixed_control_volume") {
    blockers.add("fixed_control_volume_not_yet_physical_volume_audit");
  }

  const components: Nhm2LayeredWallFullTensorComponentV1[] =
    sourceTensorModel == null
      ? [
          {
            componentId: "T00",
            valueSI: -Math.abs(args.candidate.candidateWallT00AbsSI),
            unit: "J/m^3",
            status: "derived_ideal_proxy",
            blockers: [
              "t00_from_layered_scalar_candidate",
              "not_material_tensor_derivation",
            ],
          },
          missingComponent("T0x", ["momentum_density_model_missing"]),
          missingComponent("T0y", ["momentum_density_model_missing"]),
          missingComponent("T0z", ["momentum_density_model_missing"]),
          missingComponent("Txx", ["spatial_stress_model_missing"]),
          missingComponent("Txy", ["off_diagonal_stress_model_missing"]),
          missingComponent("Txz", ["off_diagonal_stress_model_missing"]),
          missingComponent("Tyy", ["spatial_stress_model_missing"]),
          missingComponent("Tyz", ["off_diagonal_stress_model_missing"]),
          missingComponent("Tzz", ["spatial_stress_model_missing"]),
        ]
      : auditComponentsFromSourceModel(sourceTensorModel);

  addComponentCoverageBlockers(blockers, components);
  if (sourceTensorModel == null) {
    blockers.add("wall_normal_tangent_basis_missing");
    blockers.add("scalar_layering_does_not_close_source");
  } else {
    if (sourceTensorModel.projection.sameChartProjectionStatus !== "pass") {
      blockers.add("same_chart_projection_missing_or_failed");
    }
    if (sourceTensorModel.basis === "local_wall_orthonormal" && sourceTensorModel.projection.wallNormalRef == null) {
      blockers.add("wall_normal_tangent_basis_missing");
    }
  }

  return buildNhm2LayeredWallFullTensorSourceAuditArtifact({
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: args.candidate.selectedProfileId,
    layeredCandidateRef: args.candidateRef,
    materialReceiptRef: args.materialReceiptRef ?? null,
    chartId: "comoving_cartesian",
    sourceModel: {
      modelKind:
        sourceTensorModel == null
          ? sourceModelKindFor(materialReceipt)
          : sourceModelKindForTensorModel(sourceTensorModel, materialReceipt),
      tensorBasis: sourceTensorModel?.basis ?? "unknown",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
    },
    components,
    blockers: Array.from(blockers),
  });
};

export const publishLayeredWallFullTensorSourceAudit = (args: {
  repoRoot: string;
  candidatePath: string;
  outPath: string;
  materialReceiptPath?: string | null;
  sourceTensorModelPath?: string | null;
}): Nhm2LayeredWallFullTensorSourceAuditV1 => {
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
  const sourceTensorModel =
    args.sourceTensorModelPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceTensorModelPath));
  if (
    sourceTensorModel != null &&
    !isNhm2WallMaterialSourceTensorModelArtifact(sourceTensorModel)
  ) {
    throw new Error(
      "source tensor model must be nhm2_wall_material_source_tensor_model/v1",
    );
  }
  const artifact = buildLayeredWallFullTensorSourceAudit({
    candidate,
    candidateRef: args.candidatePath,
    materialReceipt: materialReceipt == null ? null : materialReceipt,
    materialReceiptRef: args.materialReceiptPath ?? null,
    sourceTensorModel:
      sourceTensorModel == null ? null : sourceTensorModel,
    sourceTensorModelRef: args.sourceTensorModelPath ?? null,
  });
  if (!isNhm2LayeredWallFullTensorSourceAuditArtifact(artifact)) {
    throw new Error("internal error: produced invalid layered wall tensor audit");
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
  const artifact = publishLayeredWallFullTensorSourceAudit({
    repoRoot: process.cwd(),
    candidatePath,
    outPath,
    materialReceiptPath: asString(argv["material-receipt"]),
    sourceTensorModelPath: asString(argv["source-tensor-model"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
