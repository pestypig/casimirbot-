import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isCasimirMaterialReceipt,
  type CasimirMaterialReceiptV1,
} from "../../shared/contracts/casimir-material-receipt.v1";
import {
  isNhm2CoupledClosurePassCandidateArtifact,
  type Nhm2CoupledClosurePassCandidateArtifactV1,
} from "../../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import {
  isNhm2ObserverRobustEnergyConditionArtifact,
  type Nhm2ObserverRobustEnergyConditionArtifactV1,
} from "../../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import {
  isNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  buildNhm2RegionalTensorPassPathHarness,
  isNhm2RegionalTensorPassPathHarnessArtifact,
  type Nhm2RegionalTensorPassPathHarnessArtifactV1,
} from "../../shared/contracts/nhm2-regional-tensor-pass-path-harness.v1";
import {
  isNhm2RegionalMaterialSourceTensorModelArtifact,
  type Nhm2RegionalMaterialSourceTensorModelV1,
} from "../../shared/contracts/nhm2-regional-material-source-tensor-model.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
  type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
} from "../../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import {
  isNhm2TileCounterpartConservationArtifact,
  type Nhm2TileCounterpartConservationArtifact,
} from "../../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import {
  isNhm2SourceClosurePassReadinessArtifact,
  type Nhm2SourceClosurePassReadinessArtifact,
} from "./source-closure-pass-readiness";

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

const readOptional = <T>(
  repoRoot: string,
  path: string | null,
  validator: (value: unknown) => value is T,
  label: string,
): T | null => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`${label} missing: ${path}`);
  }
  const value = readJson(repoRoot, path);
  if (!validator(value)) {
    throw new Error(`${label} has invalid contract`);
  }
  return value;
};

export const runNhm2RegionalTensorPassPathHarness = (args: {
  repoRoot: string;
  outPath: string;
  regionalSupportAtlasPath?: string | null;
  regionalMaterialSourceTensorModelPath?: string | null;
  sourceSideAuthorityPath?: string | null;
  regionalSourceClosureEvidencePath?: string | null;
  sourceClosurePassReadinessPath?: string | null;
  conservationPath?: string | null;
  qeiWorldlineDossierPath?: string | null;
  observerRobustEnergyConditionsPath?: string | null;
  casimirMaterialReceiptPath?: string | null;
  coupledClosurePassCandidatePath?: string | null;
}): Nhm2RegionalTensorPassPathHarnessArtifactV1 => {
  const regionalSupportFunctionAtlas =
    readOptional<Nhm2RegionalSupportFunctionAtlasV1>(
      args.repoRoot,
      args.regionalSupportAtlasPath ?? null,
      isNhm2RegionalSupportFunctionAtlas,
      "regional support-function atlas",
    );
  const regionalMaterialSourceTensorModel =
    readOptional<Nhm2RegionalMaterialSourceTensorModelV1>(
      args.repoRoot,
      args.regionalMaterialSourceTensorModelPath ?? null,
      isNhm2RegionalMaterialSourceTensorModelArtifact,
      "regional material source tensor model",
    );
  const sourceSideSameBasisTensorAuthority =
    readOptional<Nhm2SourceSideSameBasisTensorAuthorityArtifactV1>(
      args.repoRoot,
      args.sourceSideAuthorityPath ?? null,
      isNhm2SourceSideSameBasisTensorAuthorityArtifact,
      "source-side same-basis tensor authority",
    );
  const regionalSourceClosureEvidence =
    readOptional<Nhm2RegionalSourceClosureEvidenceArtifact>(
      args.repoRoot,
      args.regionalSourceClosureEvidencePath ?? null,
      isNhm2RegionalSourceClosureEvidenceArtifact,
      "regional source-closure evidence",
    );
  const sourceClosurePassReadiness =
    readOptional<Nhm2SourceClosurePassReadinessArtifact>(
      args.repoRoot,
      args.sourceClosurePassReadinessPath ?? null,
      isNhm2SourceClosurePassReadinessArtifact,
      "source-closure pass-readiness",
    );
  const conservation = readOptional<Nhm2TileCounterpartConservationArtifact>(
    args.repoRoot,
    args.conservationPath ?? null,
    isNhm2TileCounterpartConservationArtifact,
    "tile-counterpart conservation",
  );
  const qeiWorldlineDossier = readOptional<Nhm2QeiWorldlineDossierV1>(
    args.repoRoot,
    args.qeiWorldlineDossierPath ?? null,
    isNhm2QeiWorldlineDossier,
    "QEI worldline dossier",
  );
  const observerRobustEnergyConditions =
    readOptional<Nhm2ObserverRobustEnergyConditionArtifactV1>(
      args.repoRoot,
      args.observerRobustEnergyConditionsPath ?? null,
      isNhm2ObserverRobustEnergyConditionArtifact,
      "observer-robust energy conditions",
    );
  const casimirMaterialReceipt = readOptional<CasimirMaterialReceiptV1>(
    args.repoRoot,
    args.casimirMaterialReceiptPath ?? null,
    isCasimirMaterialReceipt,
    "Casimir material receipt",
  );
  const coupledClosurePassCandidate =
    readOptional<Nhm2CoupledClosurePassCandidateArtifactV1>(
      args.repoRoot,
      args.coupledClosurePassCandidatePath ?? null,
      isNhm2CoupledClosurePassCandidateArtifact,
      "coupled closure pass-candidate",
    );

  const artifact = buildNhm2RegionalTensorPassPathHarness({
    artifactRefs: {
      regionalSupportFunctionAtlas: args.regionalSupportAtlasPath ?? null,
      regionalMaterialSourceTensorModel:
        args.regionalMaterialSourceTensorModelPath ?? null,
      sourceSideSameBasisTensorAuthority: args.sourceSideAuthorityPath ?? null,
      regionalSourceClosureEvidence: args.regionalSourceClosureEvidencePath ?? null,
      sourceClosurePassReadiness: args.sourceClosurePassReadinessPath ?? null,
      conservation: args.conservationPath ?? null,
      qeiWorldlineDossier: args.qeiWorldlineDossierPath ?? null,
      observerRobustEnergyConditions:
        args.observerRobustEnergyConditionsPath ?? null,
      casimirMaterialReceipt: args.casimirMaterialReceiptPath ?? null,
      coupledClosurePassCandidate: args.coupledClosurePassCandidatePath ?? null,
    },
    regionalSupportFunctionAtlas,
    regionalMaterialSourceTensorModel,
    sourceSideSameBasisTensorAuthority,
    regionalSourceClosureEvidence,
    sourceClosurePassReadiness,
    conservation,
    qeiWorldlineDossier,
    observerRobustEnergyConditions,
    casimirMaterialReceipt,
    coupledClosurePassCandidate,
  });
  if (!isNhm2RegionalTensorPassPathHarnessArtifact(artifact)) {
    throw new Error(
      "built artifact failed nhm2_regional_tensor_pass_path_harness/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  const artifact = runNhm2RegionalTensorPassPathHarness({
    repoRoot: process.cwd(),
    outPath,
    regionalSupportAtlasPath: asString(args["regional-support-atlas"]),
    regionalMaterialSourceTensorModelPath: asString(
      args["regional-material-source-tensor-model"],
    ),
    sourceSideAuthorityPath: asString(args["source-side-authority"]),
    regionalSourceClosureEvidencePath: asString(args["regional-source-closure-evidence"]),
    sourceClosurePassReadinessPath: asString(args["source-closure-pass-readiness"]),
    conservationPath: asString(args.conservation),
    qeiWorldlineDossierPath: asString(args["qei-worldline-dossier"]),
    observerRobustEnergyConditionsPath: asString(
      args["observer-robust-energy-conditions"],
    ),
    casimirMaterialReceiptPath: asString(args["casimir-material-receipt"]),
    coupledClosurePassCandidatePath: asString(args["coupled-closure-pass-candidate"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
