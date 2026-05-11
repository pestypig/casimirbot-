import { z } from "zod";

export const starSimExternalSolverRuntimeKindSchema = z.enum([
  "disabled",
  "fixture_only",
  "local",
  "docker",
  "wsl",
]);

export type StarSimExternalSolverRuntimeKind = z.infer<
  typeof starSimExternalSolverRuntimeKindSchema
>;

export const starSimSolverRuntimePolicySchema = z.object({
  runtimeKind: starSimExternalSolverRuntimeKindSchema,
  allowFixtureFallback: z.boolean(),
  requireExternalHashes: z.boolean(),
  failIfSolverUnavailable: z.boolean(),
});

export type StarSimSolverRuntimePolicy = z.infer<
  typeof starSimSolverRuntimePolicySchema
>;

export type StarSimSolverRuntimeStatus = {
  runtimeKind: StarSimExternalSolverRuntimeKind;
  available: boolean;
  status: "disabled" | "fixture_only" | "available" | "unavailable";
  message: string;
};

export function resolveStarSimSolverRuntimePolicy(
  rawPolicy: StarSimSolverRuntimePolicy,
): StarSimSolverRuntimeStatus {
  const policy = starSimSolverRuntimePolicySchema.parse(rawPolicy);
  if (policy.runtimeKind === "disabled") {
    return {
      runtimeKind: policy.runtimeKind,
      available: false,
      status: "disabled",
      message: "External solver runtime is disabled.",
    };
  }
  if (policy.runtimeKind === "fixture_only") {
    return {
      runtimeKind: policy.runtimeKind,
      available: true,
      status: "fixture_only",
      message: "Fixture-only runtime selected explicitly.",
    };
  }
  return {
    runtimeKind: policy.runtimeKind,
    available: false,
    status: "unavailable",
    message: `${policy.runtimeKind} solver runtime is unavailable in this environment.`,
  };
}
