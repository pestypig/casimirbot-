import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  isNhm2RegionalMaterialSourceTensorModelArtifact,
  type Nhm2RegionalMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-regional-material-source-tensor-model.v1";
import {
  isNhm2RegionalSourceTensorCandidateArtifact,
  type Nhm2RegionalSourceTensorCandidateArtifactV1,
} from "../../shared/contracts/nhm2-regional-source-tensor-candidate.v1";
import {
  buildNhm2RegionalSourceTensorQualityControl,
  isNhm2RegionalSourceTensorQualityControlArtifact,
  type Nhm2RegionalSourceTensorQualityControlArtifactV1,
} from "../../shared/contracts/nhm2-regional-source-tensor-quality-control.v1";
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

const readRequired = <T>(args: {
  repoRoot: string;
  path: string;
  validator: (value: unknown) => value is T;
  label: string;
}): T => {
  const value = readJson(args.repoRoot, args.path);
  if (!args.validator(value)) throw new Error(`${args.label} has invalid contract`);
  return value;
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

export const runNhm2RegionalSourceTensorQualityControl = (args: {
  repoRoot: string;
  regionalSourceTensorTargetsPath: string;
  regionalSourceTensorCandidatePath: string;
  outPath: string;
  regionalMaterialSourceTensorModelPath?: string | null;
  materialReceiptPath?: string | null;
}): Nhm2RegionalSourceTensorQualityControlArtifactV1 => {
  const targets = readRequired<Nhm2RegionalSourceTensorTargetsArtifactV1>({
    repoRoot: args.repoRoot,
    path: args.regionalSourceTensorTargetsPath,
    validator: isNhm2RegionalSourceTensorTargetsArtifact,
    label: "regional source tensor targets",
  });
  const candidate = readRequired<Nhm2RegionalSourceTensorCandidateArtifactV1>({
    repoRoot: args.repoRoot,
    path: args.regionalSourceTensorCandidatePath,
    validator: isNhm2RegionalSourceTensorCandidateArtifact,
    label: "regional source tensor candidate",
  });
  const regionalMaterialSourceTensorModel =
    readOptional<Nhm2RegionalMaterialSourceTensorModelV1>({
      repoRoot: args.repoRoot,
      path: args.regionalMaterialSourceTensorModelPath ?? null,
      validator: isNhm2RegionalMaterialSourceTensorModelArtifact,
      label: "regional material source tensor model",
    });
  const materialReceipt = readOptional<CasimirMaterialReceiptV1>({
    repoRoot: args.repoRoot,
    path: args.materialReceiptPath ?? null,
    validator: isCasimirMaterialReceipt,
    label: "Casimir material receipt",
  });
  const artifact = buildNhm2RegionalSourceTensorQualityControl({
    artifactRefs: {
      regionalSourceTensorTargets: args.regionalSourceTensorTargetsPath,
      regionalSourceTensorCandidate: args.regionalSourceTensorCandidatePath,
      regionalMaterialSourceTensorModel:
        args.regionalMaterialSourceTensorModelPath ?? null,
      materialReceipt: args.materialReceiptPath ?? null,
    },
    targets,
    candidate,
    regionalMaterialSourceTensorModel,
    materialReceipt,
  });
  if (!isNhm2RegionalSourceTensorQualityControlArtifact(artifact)) {
    throw new Error(
      "built artifact failed nhm2_regional_source_tensor_quality_control/v1 validation",
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
  const regionalSourceTensorCandidatePath = asString(
    args["regional-source-tensor-candidate"],
  );
  const outPath = asString(args.out);
  if (
    regionalSourceTensorTargetsPath == null ||
    regionalSourceTensorCandidatePath == null ||
    outPath == null
  ) {
    throw new Error(
      "missing required --regional-source-tensor-targets, --regional-source-tensor-candidate, or --out",
    );
  }
  const artifact = runNhm2RegionalSourceTensorQualityControl({
    repoRoot: process.cwd(),
    regionalSourceTensorTargetsPath,
    regionalSourceTensorCandidatePath,
    regionalMaterialSourceTensorModelPath: asString(
      args["regional-material-source-tensor-model"],
    ),
    materialReceiptPath: asString(args["material-receipt"]),
    outPath,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
