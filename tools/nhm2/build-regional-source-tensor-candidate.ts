import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2RegionalSourceTensorCandidate,
  isNhm2RegionalSourceTensorCandidateArtifact,
  type Nhm2RegionalSourceTensorCandidateArtifactV1,
  type Nhm2RegionalSourceTensorCandidateTemplateRegionV1,
  type Nhm2RegionalSourceTensorCandidateTemplateV1,
} from "../../shared/contracts/nhm2-regional-source-tensor-candidate.v1";
import {
  isNhm2RegionalSourceTensorTargetsArtifact,
  type Nhm2RegionalSourceTensorTargetsArtifactV1,
} from "../../shared/contracts/nhm2-regional-source-tensor-targets.v1";

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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8")) as unknown;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const numberOrComponent = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const record = isRecord(value) ? value : null;
  const valueSI = record?.valueSI;
  return typeof valueSI === "number" && Number.isFinite(valueSI) ? valueSI : null;
};

const tensorFrom = (value: unknown): Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  const tensor: Nhm2RegionalTensor = {};
  if (record == null) return tensor;
  for (const [key, entry] of Object.entries(record)) {
    if (!isComponent(key)) continue;
    const valueSI = numberOrComponent(entry);
    if (valueSI != null) tensor[key] = valueSI;
  }
  return tensor;
};

const templateRegions = (
  value: unknown,
): Nhm2RegionalSourceTensorCandidateTemplateRegionV1[] => {
  const record = isRecord(value) ? value : null;
  const rawRegions = record?.regions;
  if (Array.isArray(rawRegions)) {
    return rawRegions.flatMap((entry) => {
      const region = isRecord(entry) ? entry : null;
      if (!isRegionId(region?.regionId)) return [];
      return [{
        regionId: region.regionId,
        tensor: tensorFrom(region.tensor ?? region.components),
        provenanceRef: asString(region.provenanceRef),
      }];
    });
  }
  if (isRecord(rawRegions)) {
    return Object.entries(rawRegions).flatMap(([regionId, entry]) => {
      if (!isRegionId(regionId)) return [];
      const region = isRecord(entry) ? entry : null;
      return [{
        regionId,
        tensor: tensorFrom(region?.tensor ?? region?.components ?? entry),
        provenanceRef: asString(region?.provenanceRef),
      }];
    });
  }
  return [];
};

const parseTemplate = (
  value: unknown,
): Nhm2RegionalSourceTensorCandidateTemplateV1 => {
  const record = isRecord(value) ? value : null;
  return {
    templateId: asString(record?.templateId),
    chartId: asString(record?.chartId),
    regions: templateRegions(value),
  };
};

const readOptional = <T>(args: {
  repoRoot: string;
  path: string | null;
  validator: (value: unknown) => value is T;
  label: string;
}): T | null => {
  if (args.path == null) return null;
  const resolved = resolvePath(args.repoRoot, args.path);
  if (!existsSync(resolved)) throw new Error(`${args.label} missing: ${args.path}`);
  const value = readJson(args.repoRoot, args.path);
  if (!args.validator(value)) throw new Error(`${args.label} has invalid contract`);
  return value;
};

export const runNhm2RegionalSourceTensorCandidate = (args: {
  repoRoot: string;
  regionalSourceTensorTargetsPath: string;
  outPath: string;
  fullTensorTemplatePath?: string | null;
  materialReceiptPath?: string | null;
}): Nhm2RegionalSourceTensorCandidateArtifactV1 => {
  const targets = readOptional<Nhm2RegionalSourceTensorTargetsArtifactV1>({
    repoRoot: args.repoRoot,
    path: args.regionalSourceTensorTargetsPath,
    validator: isNhm2RegionalSourceTensorTargetsArtifact,
    label: "regional source tensor targets",
  });
  if (targets == null) {
    throw new Error("regional source tensor targets are required");
  }
  const template =
    args.fullTensorTemplatePath == null
      ? null
      : parseTemplate(readJson(args.repoRoot, args.fullTensorTemplatePath));
  const materialReceipt = readOptional<CasimirMaterialReceiptV1>({
    repoRoot: args.repoRoot,
    path: args.materialReceiptPath ?? null,
    validator: isCasimirMaterialReceipt,
    label: "Casimir material receipt",
  });
  const artifact = buildNhm2RegionalSourceTensorCandidate({
    artifactRefs: {
      regionalSourceTensorTargets: args.regionalSourceTensorTargetsPath,
      fullTensorTemplate: args.fullTensorTemplatePath ?? null,
      materialReceipt: args.materialReceiptPath ?? null,
    },
    targets,
    fullTensorTemplate: template,
    materialReceipt,
  });
  if (!isNhm2RegionalSourceTensorCandidateArtifact(artifact)) {
    throw new Error(
      "built artifact failed nhm2_regional_source_tensor_candidate/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const regionalSourceTensorTargetsPath = asString(
    args["regional-source-tensor-targets"],
  );
  const outPath = asString(args.out);
  if (regionalSourceTensorTargetsPath == null || outPath == null) {
    throw new Error("missing required --regional-source-tensor-targets or --out");
  }
  const artifact = runNhm2RegionalSourceTensorCandidate({
    repoRoot: process.cwd(),
    regionalSourceTensorTargetsPath,
    fullTensorTemplatePath: asString(args["full-tensor-template"]),
    materialReceiptPath: asString(args["material-receipt"]),
    outPath,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
