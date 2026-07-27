import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_SCHEMA = "casimir.independent_numerical_harness.output.v1";
const MAGIC = Buffer.from([0x43, 0x41, 0x53, 0x4e, 0x55, 0x4d, 0x31, 0x00]);

const argument = (name) => {
  const index = process.argv.indexOf(name);
  if (index < 0 || index + 1 >= process.argv.length) {
    throw new Error(`missing_argument:${name}`);
  }
  return path.resolve(process.argv[index + 1]);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const run = (executable, outputPath) =>
  new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const stdout = [];
    const stderr = [];
    const child = spawn(executable, ["--output", outputPath], {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {},
    });
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.once("error", (error) =>
      resolve({
        exitCode: null,
        startedAt,
        completedAt: new Date().toISOString(),
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        error: error.message,
      }),
    );
    child.once("close", (exitCode) =>
      resolve({
        exitCode,
        startedAt,
        completedAt: new Date().toISOString(),
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        error: null,
      }),
    );
  });

const parseLaneOutput = (bytes) => {
  if (bytes.length < 12 || !bytes.subarray(0, 8).equals(MAGIC)) {
    throw new Error("lane_output_magic_invalid");
  }
  let offset = 8;
  const levels = bytes.readUInt32LE(offset);
  offset += 4;
  const values = [];
  for (let level = 0; level < levels; level += 1) {
    if (offset + 4 > bytes.length) throw new Error("lane_output_truncated");
    const cells = bytes.readUInt32LE(offset);
    offset += 4;
    if (cells < 2 || offset + cells * 8 > bytes.length) {
      throw new Error("lane_output_cells_invalid");
    }
    const state = [];
    for (let index = 0; index < cells; index += 1) {
      state.push(bytes.readDoubleLE(offset));
      offset += 8;
    }
    values.push({ cells, state });
  }
  if (offset !== bytes.length) throw new Error("lane_output_trailing_bytes");
  return values;
};

const compareLevels = (primary, independent) => {
  if (
    primary.length !== independent.length ||
    primary.some((level, index) => level.cells !== independent[index]?.cells)
  ) {
    throw new Error("lane_refinement_grid_mismatch");
  }
  const errors = primary.map((level, levelIndex) => {
    const reference = independent[levelIndex].state;
    let squaredError = 0;
    let squaredReference = 0;
    for (let index = 0; index < level.cells; index += 1) {
      const difference = level.state[index] - reference[index];
      squaredError += difference * difference;
      squaredReference += reference[index] * reference[index];
    }
    return {
      cells: level.cells,
      absolute: Math.sqrt(squaredError / level.cells),
      relative:
        squaredReference > 0
          ? Math.sqrt(squaredError / squaredReference)
          : Math.sqrt(squaredError / level.cells),
    };
  });
  if (errors.length < 3) throw new Error("refinement_levels_insufficient");
  const orders = [];
  for (let index = 1; index < errors.length; index += 1) {
    const coarse = errors[index - 1];
    const fine = errors[index];
    if (coarse.absolute <= 0 || fine.absolute <= 0) {
      throw new Error("convergence_order_undefined");
    }
    orders.push(
      Math.log(coarse.absolute / fine.absolute) /
        Math.log(fine.cells / coarse.cells),
    );
  }
  return {
    finest: errors.at(-1),
    observedOrder: Math.min(...orders),
  };
};

const main = async () => {
  const inputPath = argument("--casimir-input");
  const outputPath = argument("--casimir-output");
  const primaryExecutable = argument("--primary-executable");
  const independentExecutable = argument("--independent-executable");
  const sealed = JSON.parse(await readFile(inputPath, "utf8"));
  const workRoot = path.dirname(outputPath);
  const laneConfigs = {
    primary: {
      implementationId: sealed.request.primaryImplementation.implementationId,
      executable: primaryExecutable,
    },
    independent: {
      implementationId:
        sealed.request.independentImplementation.implementationId,
      executable: independentExecutable,
    },
  };
  const blockers = [];
  const observations = {};
  for (const [lane, config] of Object.entries(laneConfigs)) {
    const replays = [];
    for (let replay = 0; replay < 2; replay += 1) {
      const laneOutput = path.join(workRoot, `${lane}-${replay}.bin`);
      const observation = await run(config.executable, laneOutput);
      if (observation.exitCode !== 0 || observation.error) {
        blockers.push({
          code: `${lane}_process_failed`,
          message: `The ${lane} implementation process failed.`,
          evidenceRefs: [],
        });
      }
      let bytes = Buffer.alloc(0);
      try {
        bytes = await readFile(laneOutput);
      } catch {
        blockers.push({
          code: `${lane}_output_unreadable`,
          message: `The ${lane} implementation output was unreadable.`,
          evidenceRefs: [],
        });
      }
      replays.push({
        bytes,
        outputManifestSha256: sha256(bytes),
        transcriptSha256: sha256(JSON.stringify(observation)),
      });
    }
    observations[lane] = { ...config, replays };
  }

  let comparison = {
    finest: { absolute: 0, relative: 0 },
    observedOrder: 0,
  };
  try {
    comparison = compareLevels(
      parseLaneOutput(observations.primary.replays[0].bytes),
      parseLaneOutput(observations.independent.replays[0].bytes),
    );
  } catch (error) {
    blockers.push({
      code: "comparison_failed",
      message:
        error instanceof Error ? error.message : "Numerical comparison failed.",
      evidenceRefs: [],
    });
  }

  const harnessOutput = {
    schema: OUTPUT_SCHEMA,
    requestArtifactSha256: sealed.request.artifactSha256,
    policyArtifactSha256: sealed.policy.artifactSha256,
    runs: Object.fromEntries(
      Object.entries(observations).map(([lane, observation]) => [
        lane,
        {
          implementationId: observation.implementationId,
          replays: observation.replays.map((replay) => ({
            outputManifestSha256: replay.outputManifestSha256,
            transcriptSha256: replay.transcriptSha256,
            refinementLevels: 3,
          })),
        },
      ]),
    ),
    comparisons: [
      {
        observableId: "solution_l2_error",
        unit: "1",
        maximumAbsoluteError: comparison.finest.absolute,
        maximumRelativeError: comparison.finest.relative,
        observedConvergenceOrder: comparison.observedOrder,
      },
    ],
    blockers: blockers.sort((left, right) =>
      left.code.localeCompare(right.code),
    ),
  };
  await writeFile(outputPath, JSON.stringify(harnessOutput), {
    encoding: "utf8",
    flag: "wx",
  });
};

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
