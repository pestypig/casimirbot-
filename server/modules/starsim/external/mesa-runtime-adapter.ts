import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { buildMesaHashManifest, sha256File } from "./mesa-hash-manifest";
import { writeMesaRunLog } from "./mesa-run-log";

export const starSimMesaRuntimePolicySchema = z.object({
  runtimeKind: z.enum(["disabled", "fixture_only", "local", "docker", "wsl"]),
  mesaExecutable: z.string().min(1).optional(),
  mesaArgs: z.array(z.string()).optional(),
  mesaCommand: z.string().optional(),
  dockerImage: z.string().optional(),
  dockerImageDigest: z.string().optional(),
  wslDistro: z.string().optional(),
  workingDirectory: z.string().optional(),
  outputDirectory: z.string().optional(),
  allowFixtureFallback: z.literal(false),
  requireInlistHash: z.boolean(),
  requireProfileHash: z.boolean(),
  requireHistoryHash: z.boolean(),
  requireRunLogHash: z.boolean(),
  integrationTestMode: z.boolean().optional(),
  importOnly: z.boolean().optional(),
  inputs: z.object({
    inlistProjectPath: z.string(),
    inlistSolarPath: z.string().optional(),
  }),
  outputs: z.object({
    profilePath: z.string(),
    historyPath: z.string().optional(),
    photosPath: z.string().optional(),
    gyreSummaryPath: z.string().optional(),
  }),
  mesa: z.object({
    mesaVersion: z.string().optional(),
    mesaRevision: z.string().optional(),
    network: z.string().optional(),
    ratesSource: z.string().optional(),
    eos: z.string().optional(),
    opacity: z.string().optional(),
    atmosphere: z.string().optional(),
    initialMass_Msun: z.number().positive().optional(),
    initialMetallicity_Z: z.number().nonnegative().optional(),
    initialHelium_Y: z.number().nonnegative().optional(),
    mixingLengthAlpha: z.number().positive().optional(),
    age_Gyr: z.number().positive().optional(),
  }).optional(),
});

export type StarSimMesaRuntimePolicy = z.infer<typeof starSimMesaRuntimePolicySchema>;

export type StarSimMesaRuntimeAdapterResult = {
  policy: StarSimMesaRuntimePolicy;
  exitCode: number;
  runLogPath: string;
  runLogHash: string;
  hashes: ReturnType<typeof buildMesaHashManifest>;
  status: "imported" | "reproduced";
};

type OutputSnapshot = { hash: string; mtimeMs: number } | undefined;

function snapshotOutput(path: string | undefined): OutputSnapshot {
  if (!path || !existsSync(path)) return undefined;
  return { hash: sha256File(path), mtimeMs: statSync(path).mtimeMs };
}

function outputWasFresh(path: string | undefined, before: OutputSnapshot): boolean {
  const after = snapshotOutput(path);
  if (!after) return false;
  return !before || before.hash !== after.hash || before.mtimeMs !== after.mtimeMs;
}

export function runStarSimMesaRuntimeAdapter(
  rawPolicy: StarSimMesaRuntimePolicy,
  outPath: string,
): StarSimMesaRuntimeAdapterResult {
  const policy = starSimMesaRuntimePolicySchema.parse(rawPolicy);
  if (policy.runtimeKind === "fixture_only") {
    throw new Error("MESA repro tool rejects fixture_only; use solar reference fixture runner.");
  }
  if (policy.runtimeKind === "disabled") {
    throw new Error("MESA runtime is disabled.");
  }
  if (!existsSync(policy.inputs.inlistProjectPath)) {
    throw new Error("MESA inlist_project is missing.");
  }
  const outputDir = policy.outputDirectory ?? dirname(outPath);
  mkdirSync(outputDir, { recursive: true });
  const runLogPath = join(outputDir, "starsim-solar-mesa-run.log");

  let exitCode = 0;
  let stdout = "";
  let stderr = "";
  let message = "Imported declared MESA outputs without executing solver.";
  const profileBefore = snapshotOutput(policy.outputs.profilePath);
  const historyBefore = snapshotOutput(policy.outputs.historyPath);
  if (!policy.importOnly) {
    if (!policy.mesaExecutable) {
      throw new Error(
        "A real MESA run requires mesaExecutable and mesaArgs; mesaCommand is display-only and is not executed.",
      );
    }
    const execution = spawnSync(policy.mesaExecutable, policy.mesaArgs ?? [], {
      cwd: policy.workingDirectory,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
    });
    stdout = execution.stdout ?? "";
    stderr = execution.stderr ?? "";
    exitCode = execution.status ?? 1;
    if (execution.error) {
      stderr = [stderr, execution.error.message].filter(Boolean).join("\n");
    }
    message =
      exitCode === 0
        ? "External MESA command executed successfully; declared outputs will now be verified."
        : "External MESA command failed; no reproduction status was granted.";
  }

  const runLog = writeMesaRunLog({
    path: runLogPath,
    runtimeKind: policy.runtimeKind,
    command:
      policy.mesaCommand ??
      [policy.mesaExecutable, ...(policy.mesaArgs ?? [])].filter(Boolean).join(" "),
    exitCode,
    stdout,
    stderr,
    message,
  });
  if (exitCode !== 0) {
    throw new Error(`MESA command failed with exit code ${exitCode}; see ${runLogPath}.`);
  }
  if (!existsSync(policy.outputs.profilePath)) {
    throw new Error("MESA profile output is missing.");
  }
  if (policy.requireHistoryHash && (!policy.outputs.historyPath || !existsSync(policy.outputs.historyPath))) {
    throw new Error("MESA history output is required.");
  }
  if (!policy.importOnly && !outputWasFresh(policy.outputs.profilePath, profileBefore)) {
    throw new Error("MESA profile output was not created or refreshed by the executed command.");
  }
  if (
    !policy.importOnly &&
    policy.requireHistoryHash &&
    !outputWasFresh(policy.outputs.historyPath, historyBefore)
  ) {
    throw new Error("MESA history output was not created or refreshed by the executed command.");
  }
  const hashes = buildMesaHashManifest({
    inlistProject: policy.inputs.inlistProjectPath,
    inlistSolar: policy.inputs.inlistSolarPath,
    profile: policy.outputs.profilePath,
    history: policy.outputs.historyPath,
    photos: policy.outputs.photosPath,
    gyreSummary: policy.outputs.gyreSummaryPath,
    runLog: runLogPath,
  });
  for (const [key, required] of [
    ["inlistProject", policy.requireInlistHash],
    ["profile", policy.requireProfileHash],
    ["history", policy.requireHistoryHash],
    ["runLog", policy.requireRunLogHash],
  ] as const) {
    if (required && !hashes.entries[key]?.hash) {
      throw new Error(`Required MESA hash missing: ${key}`);
    }
  }
  return {
    policy,
    exitCode,
    runLogPath,
    runLogHash: runLog.hash,
    hashes,
    status: policy.importOnly ? "imported" : "reproduced",
  };
}
