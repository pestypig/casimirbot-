import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateNhm2QeiFeasibilityFrontierFilesystem,
  isPinnedNhm2QeiRepoPath,
  isPinnedNhm2QeiRunId,
  readPinnedNhm2QeiJsonSource,
  type Nhm2QeiFeasibilityFrontierFilesystemEvaluationV1,
} from "../../server/services/theory/nhm2-qei-feasibility-frontier-evaluator";
import { createTheoryRuntimeJsonFile } from "../../server/services/theory/runtime-atomic-json-store";

export const NHM2_QEI_FEASIBILITY_FRONTIER_RUN_ROOT =
  "artifacts/research/full-solve/qei-feasibility-frontier-runs" as const;

export type Nhm2QeiFeasibilityFrontierCliArgs = {
  frontierPath: string;
  outputPath: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

async function assertSafeOutputAncestors(input: {
  projectRoot: string;
  outputPath: string;
}): Promise<void> {
  const projectRootStat = await fs.lstat(input.projectRoot);
  if (projectRootStat.isSymbolicLink() || !projectRootStat.isDirectory()) {
    throw new Error("The project root must be one real directory.");
  }
  const realProjectRoot = await fs.realpath(input.projectRoot);
  const outputParent = path.dirname(input.outputPath);
  if (!isInside(input.projectRoot, outputParent)) {
    throw new Error("The evaluation output parent escaped the project root.");
  }
  const relativeParent = path.relative(input.projectRoot, outputParent);
  let current = input.projectRoot;
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(
          `The evaluation output has a symlink ancestor: ${path.relative(input.projectRoot, current)}`,
        );
      }
      if (!stat.isDirectory()) {
        throw new Error(
          `The evaluation output ancestor is not a directory: ${path.relative(input.projectRoot, current)}`,
        );
      }
      const realCurrent = await fs.realpath(current);
      if (!isInside(realProjectRoot, realCurrent)) {
        throw new Error("The evaluation output ancestor escaped the project root.");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
}

export function parseNhm2QeiFeasibilityFrontierCliArgs(
  argv: string[],
): Nhm2QeiFeasibilityFrontierCliArgs {
  let frontierPath: string | null = null;
  let outputPath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--frontier") {
      if (frontierPath != null)
        throw new Error("--frontier may be provided only once.");
      frontierPath = argv[++index] ?? null;
      continue;
    }
    if (argument === "--output") {
      if (outputPath != null)
        throw new Error("--output may be provided only once.");
      outputPath = argv[++index] ?? null;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!isPinnedNhm2QeiRepoPath(frontierPath)) {
    throw new Error(
      "--frontier must be one pinned repository-relative JSON path without latest aliases.",
    );
  }
  if (outputPath != null && !isPinnedNhm2QeiRepoPath(outputPath)) {
    throw new Error(
      "--output must be one pinned repository-relative JSON path without latest aliases.",
    );
  }
  return { frontierPath, outputPath };
}

function frontierRunId(frontier: unknown): string {
  const runId =
    isRecord(frontier) &&
    isRecord(frontier.provenance) &&
    isRecord(frontier.provenance.run)
      ? frontier.provenance.run.runId
      : null;
  if (!isPinnedNhm2QeiRunId(runId)) {
    throw new Error(
      "The frontier provenance runId must be one pinned path-safe segment.",
    );
  }
  return runId;
}

function resolveOutputPath(input: {
  projectRoot: string;
  runId: string;
  requestedPath: string | null;
}): { repoPath: string; absolutePath: string } {
  const runRootRepoPath = `${NHM2_QEI_FEASIBILITY_FRONTIER_RUN_ROOT}/${input.runId}`;
  const repoPath =
    input.requestedPath ??
    `${runRootRepoPath}/qei-feasibility-frontier-evaluation.json`;
  const runRoot = path.resolve(input.projectRoot, runRootRepoPath);
  const absolutePath = path.resolve(input.projectRoot, repoPath);
  if (!isInside(runRoot, absolutePath) || absolutePath === runRoot) {
    throw new Error(
      `--output must resolve beneath the pinned run directory ${runRootRepoPath}.`,
    );
  }
  if (path.extname(absolutePath).toLowerCase() !== ".json") {
    throw new Error("--output must name a JSON file.");
  }
  return { repoPath, absolutePath };
}

export async function runNhm2QeiFeasibilityFrontierCli(input: {
  argv: string[];
  projectRoot?: string;
  verifyGitObjects?: boolean;
}): Promise<{
  exitCode: 0 | 2;
  outputPath: string;
  evaluation: Nhm2QeiFeasibilityFrontierFilesystemEvaluationV1;
}> {
  const args = parseNhm2QeiFeasibilityFrontierCliArgs(input.argv);
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const absoluteFrontierPath = path.resolve(projectRoot, args.frontierPath);
  if (!isInside(projectRoot, absoluteFrontierPath)) {
    throw new Error("The frontier path escaped the project root.");
  }
  const frontier = await readPinnedNhm2QeiJsonSource({
    projectRoot,
    artifactRef: args.frontierPath,
  });
  const runId = frontierRunId(frontier);
  const output = resolveOutputPath({
    projectRoot,
    runId,
    requestedPath: args.outputPath,
  });
  if (path.resolve(absoluteFrontierPath) === output.absolutePath) {
    throw new Error("The evaluation output cannot overwrite its source frontier.");
  }

  const evaluation =
    await evaluateNhm2QeiFeasibilityFrontierFilesystem({
      projectRoot,
      frontierPath: args.frontierPath,
      frontier,
      verifyGitObjects: input.verifyGitObjects,
    });
  await assertSafeOutputAncestors({
    projectRoot,
    outputPath: output.absolutePath,
  });
  await createTheoryRuntimeJsonFile(output.absolutePath, evaluation);
  return {
    exitCode: evaluation.verdict === "frontier_not_evaluable" ? 2 : 0,
    outputPath: output.repoPath,
    evaluation,
  };
}

async function main(): Promise<void> {
  const result = await runNhm2QeiFeasibilityFrontierCli({
    argv: process.argv.slice(2),
  });
  process.stdout.write(`${JSON.stringify(result.evaluation, null, 2)}\n`);
  process.exitCode = result.exitCode;
}

const invokedPath = process.argv[1]
  ? path.normalize(path.resolve(process.argv[1]))
  : "";
const modulePath = path.normalize(fileURLToPath(import.meta.url));
if (invokedPath === modulePath) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
