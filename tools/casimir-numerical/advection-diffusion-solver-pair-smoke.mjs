import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const MAGIC = Buffer.from([0x43, 0x41, 0x53, 0x4e, 0x55, 0x4d, 0x31, 0x00]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const requiredArgument = (name) => {
  const index = process.argv.indexOf(name);
  if (index < 0 || index + 1 >= process.argv.length) {
    throw new Error(`missing_argument:${name}`);
  }
  return path.resolve(process.argv[index + 1]);
};

const run = (executable, outputPath) =>
  new Promise((resolve) => {
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
        error: error.message,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      }),
    );
    child.once("close", (exitCode) =>
      resolve({
        exitCode,
        error: null,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      }),
    );
  });

const parseOutput = (bytes) => {
  if (bytes.length < 12 || !bytes.subarray(0, 8).equals(MAGIC)) {
    throw new Error("lane_output_magic_invalid");
  }
  let offset = 8;
  const levelCount = bytes.readUInt32LE(offset);
  offset += 4;
  const levels = [];
  for (let level = 0; level < levelCount; level += 1) {
    if (offset + 4 > bytes.length) throw new Error("lane_output_truncated");
    const cells = bytes.readUInt32LE(offset);
    offset += 4;
    if (cells < 2 || offset + cells * 8 > bytes.length) {
      throw new Error("lane_output_cells_invalid");
    }
    const state = Array.from({ length: cells }, () => {
      const value = bytes.readDoubleLE(offset);
      offset += 8;
      return value;
    });
    levels.push({ cells, state });
  }
  if (offset !== bytes.length) throw new Error("lane_output_trailing_bytes");
  return levels;
};

const l2Difference = (left, right) => {
  if (left.length !== right.length) throw new Error("state_size_mismatch");
  let squared = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    squared += difference * difference;
  }
  return Math.sqrt(squared / left.length);
};

const fourierAmplitude = (state) => {
  let sine = 0;
  let cosine = 0;
  for (let index = 0; index < state.length; index += 1) {
    const x = (index + 0.5) / state.length;
    sine += state[index] * Math.sin(2 * Math.PI * x);
    cosine += state[index] * Math.cos(2 * Math.PI * x);
  }
  return (2 / state.length) * Math.hypot(sine, cosine);
};

const compareLanes = (primary, independent) => {
  if (
    primary.length !== independent.length ||
    primary.some(
      (level, index) => level.cells !== independent[index]?.cells,
    )
  ) {
    throw new Error("lane_refinement_grid_mismatch");
  }
  const errors = primary.map((level, index) => ({
    cells: level.cells,
    l2: l2Difference(level.state, independent[index].state),
  }));
  const orders = errors.slice(1).map((entry, index) => {
    const coarse = errors[index];
    return Math.log(coarse.l2 / entry.l2) /
      Math.log(entry.cells / coarse.cells);
  });
  return {
    errors,
    minimumObservedOrder: Math.min(...orders),
    finestL2: errors.at(-1).l2,
  };
};

const replayLane = async (workRoot, label, executable) => {
  const replays = [];
  for (let index = 0; index < 2; index += 1) {
    const outputPath = path.join(workRoot, `${label}-${index}.bin`);
    const observation = await run(executable, outputPath);
    if (observation.exitCode !== 0 || observation.error) {
      throw new Error(`${label}_process_failed`);
    }
    const bytes = await readFile(outputPath);
    replays.push({
      outputSha256: sha256(bytes),
      levels: parseOutput(bytes),
    });
  }
  return {
    executableSha256: sha256(await readFile(executable)),
    replayOutputSha256: replays.map((entry) => entry.outputSha256),
    byteIdentical:
      replays[0].outputSha256 === replays[1].outputSha256,
    levels: replays[0].levels,
  };
};

const main = async () => {
  const executables = {
    baseline: {
      primary: requiredArgument("--primary-baseline"),
      independent: requiredArgument("--independent-baseline"),
    },
    intervention: {
      primary: requiredArgument("--primary-intervention"),
      independent: requiredArgument("--independent-intervention"),
    },
  };
  const workRoot = await mkdtemp(
    path.join(os.tmpdir(), "scientific-evidence-numerical-smoke-"),
  );
  try {
    const cases = {};
    for (const [caseName, lanes] of Object.entries(executables)) {
      const [primary, independent] = await Promise.all([
        replayLane(workRoot, `${caseName}-primary`, lanes.primary),
        replayLane(workRoot, `${caseName}-independent`, lanes.independent),
      ]);
      const comparison = compareLanes(primary.levels, independent.levels);
      const primaryFinest = primary.levels.at(-1).state;
      const independentFinest = independent.levels.at(-1).state;
      cases[caseName] = {
        primary,
        independent,
        comparison,
        observables: {
          primaryFundamentalAmplitude: fourierAmplitude(primaryFinest),
          independentFundamentalAmplitude:
            fourierAmplitude(independentFinest),
        },
      };
    }
    const baseline = cases.baseline.observables;
    const intervention = cases.intervention.observables;
    const primaryAmplitudeDelta =
      intervention.primaryFundamentalAmplitude -
      baseline.primaryFundamentalAmplitude;
    const independentAmplitudeDelta =
      intervention.independentFundamentalAmplitude -
      baseline.independentFundamentalAmplitude;
    const report = {
      schema: "scientific_evidence_numerical_solver_pair_smoke/v1",
      cases: Object.fromEntries(
        Object.entries(cases).map(([caseName, entry]) => [
          caseName,
          {
            primary: {
              executableSha256: entry.primary.executableSha256,
              replayOutputSha256: entry.primary.replayOutputSha256,
              byteIdentical: entry.primary.byteIdentical,
              refinementLevels: entry.primary.levels.map(
                (level) => level.cells,
              ),
            },
            independent: {
              executableSha256: entry.independent.executableSha256,
              replayOutputSha256: entry.independent.replayOutputSha256,
              byteIdentical: entry.independent.byteIdentical,
              refinementLevels: entry.independent.levels.map(
                (level) => level.cells,
              ),
            },
            comparison: entry.comparison,
            observables: entry.observables,
          },
        ]),
      ),
      interventionComparison: {
        observableId: "fundamental_mode_amplitude",
        unit: "1",
        primaryAmplitudeDelta,
        independentAmplitudeDelta,
        crossLaneDeltaDiscrepancy: Math.abs(
          primaryAmplitudeDelta - independentAmplitudeDelta,
        ),
      },
      gates: {
        deterministicReplay:
          Object.values(cases).every(
            (entry) =>
              entry.primary.byteIdentical &&
              entry.independent.byteIdentical,
          ),
        distinctExecutables:
          Object.values(cases).every(
            (entry) =>
              entry.primary.executableSha256 !==
              entry.independent.executableSha256,
          ),
        finestPairL2BelowPoint01:
          Object.values(cases).every(
            (entry) => entry.comparison.finestL2 <= 0.01,
          ),
        observedOrderAtLeastPoint8:
          Object.values(cases).every(
            (entry) => entry.comparison.minimumObservedOrder >= 0.8,
          ),
      },
      authority: {
        outputRole: "unsandboxed_numerical_smoke_observation",
        canonicalCertificate: false,
        validatesImplementationCorrectness: false,
        validatesTheory: false,
        empiricalEvidence: false,
        physicalEvidence: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!Object.values(report.gates).every(Boolean)) process.exitCode = 1;
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
};

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
