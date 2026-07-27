import { z } from "zod";

import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_ARTIFACT_ID =
  "casimir_independent_numerical_replay_policy" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_SCHEMA_VERSION =
  "casimir_independent_numerical_replay_policy/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_HASH_DOMAIN =
  "casimir-independent-numerical-replay-policy/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_HARNESS_PROTOCOL =
  "casimir_numerical_harness_json_files/v1" as const;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const nonEmptyStringSchema = z.string().trim().min(1);

const environmentBindingSchema = z
  .object({
    environmentId: nonEmptyStringSchema,
    toolchainSha256: sha256Schema,
    runtimeSha256: sha256Schema,
    platformSha256: sha256Schema,
  })
  .strict();

const laneSchema = z
  .object({
    implementationId: nonEmptyStringSchema,
    lineageId: nonEmptyStringSchema,
    sourceSha256: sha256Schema,
    buildManifestSha256: sha256Schema,
    executableSha256: sha256Schema,
    environment: environmentBindingSchema,
  })
  .strict();

const authoritySchema = z
  .object({
    outputRole: z.literal("execution_policy_only"),
    validatesSemanticIntent: z.literal(false),
    validatesTheory: z.literal(false),
    validatesGeneratedCode: z.literal(false),
    validatesNumericalImplementation: z.literal(false),
    validatesEmpiricalClaim: z.literal(false),
    validatesPhysicalMechanism: z.literal(false),
    formalPropositionChecked: z.literal(false),
    numericalAuthority: z.literal(false),
    assistantAnswer: z.literal(false),
    terminalEligible: z.literal(false),
    promotionAllowed: z.literal(false),
  })
  .strict();

export const casimirIndependentNumericalReplayPolicyV1Schema = z
  .object({
    artifactId: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_ARTIFACT_ID,
    ),
    schemaVersion: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_SCHEMA_VERSION,
    ),
    generatedAt: z.string().datetime(),
    policyId: nonEmptyStringSchema,
    artifactSha256: sha256Schema,
    backendId: z.literal("casimir_independent_numerical_replay_backend/v1"),
    harness: z
      .object({
        protocol: z.literal(CASIMIR_INDEPENDENT_NUMERICAL_HARNESS_PROTOCOL),
        launchMode: z.enum(["native_executable", "node_script"]),
        executableSha256: sha256Schema,
        sourceSha256: sha256Schema,
      })
      .strict(),
    lanes: z
      .object({
        primary: laneSchema,
        independent: laneSchema,
      })
      .strict(),
    execution: z
      .object({
        replayCount: z.literal(2),
        networkAllowed: z.literal(false),
        arbitraryCommandAllowed: z.literal(false),
        outerObservedProcessRequired: z.literal(true),
        timeoutMs: z.number().int().min(1).max(300_000),
        maxOutputBytes: z
          .number()
          .int()
          .min(1)
          .max(16 * 1024 * 1024),
        maximumRefinementLevels: z.number().int().min(2).max(32),
      })
      .strict(),
    authority: authoritySchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.lanes.primary.implementationId ===
      value.lanes.independent.implementationId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes", "independent", "implementationId"],
        message: "implementation IDs must be distinct",
      });
    }
    if (value.lanes.primary.lineageId === value.lanes.independent.lineageId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes", "independent", "lineageId"],
        message: "lineage IDs must be distinct",
      });
    }
    if (
      value.lanes.primary.sourceSha256 === value.lanes.independent.sourceSha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes", "independent", "sourceSha256"],
        message: "implementation source hashes must be distinct",
      });
    }
    if (
      value.lanes.primary.buildManifestSha256 ===
      value.lanes.independent.buildManifestSha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes", "independent", "buildManifestSha256"],
        message: "build manifest hashes must be distinct",
      });
    }
    if (
      value.lanes.primary.executableSha256 ===
      value.lanes.independent.executableSha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes", "independent", "executableSha256"],
        message: "implementation executable hashes must be distinct",
      });
    }
  });

export type CasimirIndependentNumericalReplayPolicyV1 = z.infer<
  typeof casimirIndependentNumericalReplayPolicyV1Schema
>;

export type BuildCasimirIndependentNumericalReplayPolicyV1Input = Omit<
  CasimirIndependentNumericalReplayPolicyV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "backendId"
  | "authority"
> & {
  generatedAt?: string;
};

const authority =
  (): CasimirIndependentNumericalReplayPolicyV1["authority"] => ({
    outputRole: "execution_policy_only",
    validatesSemanticIntent: false,
    validatesTheory: false,
    validatesGeneratedCode: false,
    validatesNumericalImplementation: false,
    validatesEmpiricalClaim: false,
    validatesPhysicalMechanism: false,
    formalPropositionChecked: false,
    numericalAuthority: false,
    assistantAnswer: false,
    terminalEligible: false,
    promotionAllowed: false,
  });

export async function buildCasimirIndependentNumericalReplayPolicyV1(
  input: BuildCasimirIndependentNumericalReplayPolicyV1Input,
): Promise<CasimirIndependentNumericalReplayPolicyV1> {
  const withoutHash: Omit<
    CasimirIndependentNumericalReplayPolicyV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_ARTIFACT_ID,
    schemaVersion: CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    policyId: input.policyId,
    backendId: "casimir_independent_numerical_replay_backend/v1",
    harness: input.harness,
    lanes: input.lanes,
    execution: input.execution,
    authority: authority(),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function validateCasimirIndependentNumericalReplayPolicyIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const parsed =
    casimirIndependentNumericalReplayPolicyV1Schema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "$";
      return `${path}: ${issue.message}`;
    });
  }
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_INDEPENDENT_NUMERICAL_REPLAY_POLICY_HASH_DOMAIN,
    value: withoutHash,
  });
  return artifactSha256 === expected
    ? []
    : ["artifactSha256 does not match replay policy content"];
}
