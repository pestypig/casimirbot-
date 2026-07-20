import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { evaluateNhm2ExperimentReadyTheoryClosureFilesystem } from "../../server/services/theory/nhm2-experiment-ready-theory-closure-evaluator";
import { writeTheoryRuntimeJsonFile } from "../../server/services/theory/runtime-atomic-json-store";

const EVALUATION_ROOT =
  "artifacts/research/full-solve/theory-closure-evaluations" as const;

type CliArgs = {
  artifactPath: string;
  outputPath: string | null;
  requireClosed: boolean;
};

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const portableRepoPath = (value: string): boolean =>
  value.length > 0 &&
  !value.includes("\\") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !value.split("/").includes("..") &&
  !/(^|\/)latest(?:\.|\/|$)/i.test(value);

function parseArgs(argv: string[]): CliArgs {
  let artifactPath: string | null = null;
  let outputPath: string | null = null;
  let requireClosed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--artifact") {
      artifactPath = argv[++index] ?? null;
      continue;
    }
    if (arg === "--output") {
      outputPath = argv[++index] ?? null;
      continue;
    }
    if (arg === "--require-closed") {
      requireClosed = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (artifactPath == null || !portableRepoPath(artifactPath)) {
    throw new Error(
      "--artifact must be one pinned repository-relative JSON path.",
    );
  }
  if (outputPath != null && !portableRepoPath(outputPath)) {
    throw new Error(
      "--output must be one pinned repository-relative JSON path.",
    );
  }
  return { artifactPath, outputPath, requireClosed };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(process.cwd());
  const absoluteArtifactPath = path.resolve(projectRoot, args.artifactPath);
  if (!isInside(projectRoot, absoluteArtifactPath)) {
    throw new Error("Closure artifact escaped the project root.");
  }
  const artifactBytes = await fs.readFile(absoluteArtifactPath);
  const artifact = JSON.parse(artifactBytes.toString("utf8")) as unknown;
  const evaluation = await evaluateNhm2ExperimentReadyTheoryClosureFilesystem({
    projectRoot,
    artifactPath: args.artifactPath,
    artifact,
  });
  const report = {
    artifactId: "nhm2_experiment_ready_theory_closure_evaluation",
    schemaVersion: "nhm2_experiment_ready_theory_closure_evaluation/v1",
    generatedAt: new Date().toISOString(),
    sourceArtifactPath: args.artifactPath,
    sourceArtifactSha256: createHash("sha256")
      .update(artifactBytes)
      .digest("hex"),
    evaluation,
    claimBoundary: {
      evaluationOnly: true,
      theoryClosureIsNotPhysicalValidation: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };

  if (args.outputPath != null) {
    const evaluationRoot = path.resolve(projectRoot, EVALUATION_ROOT);
    const outputPath = path.resolve(projectRoot, args.outputPath);
    if (
      !isInside(evaluationRoot, outputPath) ||
      outputPath === evaluationRoot
    ) {
      throw new Error(`--output must resolve beneath ${EVALUATION_ROOT}.`);
    }
    if (isInside(path.dirname(absoluteArtifactPath), outputPath)) {
      throw new Error(
        "Evaluation output must not be written inside the source artifact directory.",
      );
    }
    await writeTheoryRuntimeJsonFile(outputPath, report);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (args.requireClosed && evaluation.gateStatus !== "pass")
    process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
