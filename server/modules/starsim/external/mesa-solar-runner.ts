import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  resolveStarSimSolverRuntimePolicy,
  starSimSolverRuntimePolicySchema,
} from "./solver-runtime-policy";
import { parseStarSimFusionProfileImport } from "../../../../shared/starsim-fusion-profile-import";
import type { StarSimFusionProfileImport } from "../../../../shared/starsim-fusion-profile-import";

export const mesaSolarRunnerInputSchema = z.object({
  runtimePolicy: starSimSolverRuntimePolicySchema,
  fixtureProfilePath: z.string().optional(),
  mesa: z.object({
    inlistPath: z.string().optional(),
    inlistHash: z.string().optional(),
    mesaVersion: z.string().optional(),
    network: z.string().optional(),
    ratesSource: z.string().optional(),
    eos: z.string().optional(),
    opacity: z.string().optional(),
    atmosphere: z.string().optional(),
    initialMass_Msun: z.number().positive(),
    initialMetallicity_Z: z.number().nonnegative().optional(),
    initialHelium_Y: z.number().nonnegative().optional(),
    mixingLengthAlpha: z.number().positive().optional(),
    targetAge_Gyr: z.number().positive(),
  }),
});

export type MesaSolarRunnerInput = z.infer<typeof mesaSolarRunnerInputSchema>;

export type MesaSolarRunnerResult = {
  status: "disabled" | "fixture_only" | "unavailable" | "imported";
  profile?: StarSimFusionProfileImport;
  profilePath?: string;
  profileHash?: string;
  inlistHash?: string;
  message: string;
};

export function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path: string) {
  return sha256Text(readFileSync(path, "utf8"));
}

export function runMesaSolarReference(input: MesaSolarRunnerInput): MesaSolarRunnerResult {
  const parsed = mesaSolarRunnerInputSchema.parse(input);
  const runtime = resolveStarSimSolverRuntimePolicy(parsed.runtimePolicy);
  if (runtime.status === "disabled") {
    return { status: "disabled", message: runtime.message };
  }
  if (runtime.status === "fixture_only") {
    if (!parsed.fixtureProfilePath) {
      throw new Error("fixture_only runtime requires fixtureProfilePath.");
    }
    const profile = parseStarSimFusionProfileImport(
      JSON.parse(readFileSync(parsed.fixtureProfilePath, "utf8")),
    );
    return {
      status: "fixture_only",
      profile,
      profilePath: parsed.fixtureProfilePath,
      profileHash: profile.sourceHash ?? sha256File(parsed.fixtureProfilePath),
      inlistHash: parsed.mesa.inlistHash,
      message: "Loaded explicit fixture-only solar profile.",
    };
  }
  if (!runtime.available) {
    if (parsed.runtimePolicy.allowFixtureFallback) {
      throw new Error("External runtime unavailable; silent fixture fallback is forbidden.");
    }
    if (parsed.runtimePolicy.failIfSolverUnavailable) {
      throw new Error(runtime.message);
    }
    return { status: "unavailable", message: runtime.message };
  }
  return { status: "unavailable", message: "External MESA execution is not implemented in CI." };
}
