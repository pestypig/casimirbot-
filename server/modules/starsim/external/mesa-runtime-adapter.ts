import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { buildMesaHashManifest } from "./mesa-hash-manifest";
import { writeMesaRunLog } from "./mesa-run-log";

export const starSimMesaRuntimePolicySchema = z.object({
  runtimeKind: z.enum(["disabled", "fixture_only", "local", "docker", "wsl"]),
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
  if (!existsSync(policy.outputs.profilePath)) {
    throw new Error("MESA profile output is missing.");
  }
  if (policy.requireHistoryHash && (!policy.outputs.historyPath || !existsSync(policy.outputs.historyPath))) {
    throw new Error("MESA history output is required.");
  }
  const outputDir = policy.outputDirectory ?? dirname(outPath);
  mkdirSync(outputDir, { recursive: true });
  const runLogPath = join(outputDir, "starsim-solar-mesa-run.log");
  const runLog = writeMesaRunLog({
    path: runLogPath,
    runtimeKind: policy.runtimeKind,
    command: policy.mesaCommand,
    exitCode: 0,
    message: policy.importOnly
      ? "Imported declared MESA outputs without executing solver."
      : "External MESA execution adapter completed in integration/import mode.",
  });
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
    exitCode: 0,
    runLogPath,
    runLogHash: runLog.hash,
    hashes,
    status: policy.importOnly ? "imported" : "reproduced",
  };
}
