import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  buildNhm2RegionalSourceTensorTargets,
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

export const runNhm2RegionalSourceTensorTargets = (args: {
  repoRoot: string;
  regionalSourceClosureEvidencePath: string;
  outPath: string;
}): Nhm2RegionalSourceTensorTargetsArtifactV1 => {
  const regionalSourceClosureEvidence = readJson(
    args.repoRoot,
    args.regionalSourceClosureEvidencePath,
  );
  if (!isNhm2RegionalSourceClosureEvidenceArtifact(regionalSourceClosureEvidence)) {
    throw new Error(
      "regional source-closure evidence must be nhm2_regional_source_closure_evidence/v1",
    );
  }
  const artifact = buildNhm2RegionalSourceTensorTargets({
    sourceEvidenceRef: args.regionalSourceClosureEvidencePath,
    regionalSourceClosureEvidence:
      regionalSourceClosureEvidence as Nhm2RegionalSourceClosureEvidenceArtifact,
  });
  if (!isNhm2RegionalSourceTensorTargetsArtifact(artifact)) {
    throw new Error(
      "built artifact failed nhm2_regional_source_tensor_targets/v1 validation",
    );
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const regionalSourceClosureEvidencePath = asString(
    args["regional-source-closure-evidence"],
  );
  const outPath = asString(args.out);
  if (regionalSourceClosureEvidencePath == null || outPath == null) {
    throw new Error("missing required --regional-source-closure-evidence or --out");
  }
  const artifact = runNhm2RegionalSourceTensorTargets({
    repoRoot: process.cwd(),
    regionalSourceClosureEvidencePath,
    outPath,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
