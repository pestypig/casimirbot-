import { z } from "zod";

import {
  CASIMIR_LANYON_PINNED_COMMIT,
  CASIMIR_LANYON_REPOSITORY_URI,
  CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256,
} from "./casimir-lanyon-advection-diffusion-adapter.v1";
import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import { THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION } from "./theory-experiment-procedure.v1";

export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_ARTIFACT_ID =
  "casimir_independent_numerical_executor_capability" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_SCHEMA_VERSION =
  "casimir_independent_numerical_executor_capability/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_HASH_DOMAIN =
  "casimir-independent-numerical-executor-capability/v1" as const;

export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_ARTIFACT_ID =
  "casimir_independent_numerical_execution_enrollment" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_SCHEMA_VERSION =
  "casimir_independent_numerical_execution_enrollment/v1" as const;
export const CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_HASH_DOMAIN =
  "casimir-independent-numerical-execution-enrollment/v1" as const;

export const CASIMIR_LANYON_PERIODIC_1D_BACKEND_ID =
  "casimir_advection_diffusion_periodic_1d_bundle/v1" as const;
export const CASIMIR_LANYON_PERIODIC_1D_CASE_ID =
  "advection_diffusion_full_1d" as const;
export const CASIMIR_LANYON_PERIODIC_1D_PRIMARY_IMPLEMENTATION_ID =
  "casimir-lanyon-advection-diffusion-full-1d" as const;
export const CASIMIR_LANYON_PERIODIC_1D_PRIMARY_LINEAGE_ID =
  "lanyon-generated-kernel-with-casimir-driver" as const;
export const CASIMIR_LANYON_PERIODIC_1D_REFERENCE_IMPLEMENTATION_ID =
  "casimir-advection-diffusion-analytic-reference" as const;
export const CASIMIR_LANYON_PERIODIC_1D_REFERENCE_LINEAGE_ID =
  "casimir-analytic-periodic-solution" as const;

export const CASIMIR_LANYON_PERIODIC_1D_BUNDLE_ARTIFACT_ROLES = [
  "analytic_reference_build_manifest",
  "analytic_reference_executable",
  "analytic_reference_source",
  "harness_executable",
  "harness_runtime_manifest",
  "harness_source",
  "lanyon_upstream_source",
  "primary_build_manifest",
  "primary_driver_source",
  "primary_executable",
] as const;

export type CasimirLanyonPeriodic1dBundleArtifactRoleV1 =
  (typeof CASIMIR_LANYON_PERIODIC_1D_BUNDLE_ARTIFACT_ROLES)[number];

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const nonEmptyStringSchema = z.string().trim().min(1);
const windowsReservedPathComponentSchema =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const safeRelativePathSchema = z
  .string()
  .min(1)
  .refine((value) => {
    if (
      value !== value.trim() ||
      value !== value.replace(/\\/g, "/") ||
      value.startsWith("/") ||
      /[:\u0000-\u001f\u007f]/.test(value)
    ) {
      return false;
    }
    return value
      .split("/")
      .every(
        (part) =>
          part !== "" &&
          part !== "." &&
          part !== ".." &&
          !/[. ]$/.test(part) &&
          !windowsReservedPathComponentSchema.test(part),
      );
  }, "must be a portable relative path without unsafe or reserved components");

const executorAuthoritySchema = z
  .object({
    outputRole: z.literal("execution_capability_attestation_only"),
    provesScientificCorrectness: z.literal(false),
    validatesNumericalImplementation: z.literal(false),
    validatesTheory: z.literal(false),
    assistantAnswer: z.literal(false),
    terminalEligible: z.literal(false),
    promotionAllowed: z.literal(false),
  })
  .strict();

export const casimirIndependentNumericalExecutorCapabilityV1Schema = z
  .object({
    artifactId: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_ARTIFACT_ID,
    ),
    schemaVersion: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_SCHEMA_VERSION,
    ),
    generatedAt: z.string().datetime(),
    capabilityId: nonEmptyStringSchema,
    platform: nonEmptyStringSchema,
    architecture: nonEmptyStringSchema,
    enforcement: z
      .object({
        networkIsolationEnforced: z.boolean(),
        filesystemWriteIsolationEnforced: z.boolean(),
        processTreeContainmentEnforced: z.boolean(),
        wallTimeoutEnforced: z.boolean(),
        outputByteLimitEnforced: z.boolean(),
      })
      .strict(),
    attestation: z
      .object({
        issuer: nonEmptyStringSchema,
        evidenceSha256: sha256Schema,
      })
      .strict(),
    authority: executorAuthoritySchema,
    artifactSha256: sha256Schema,
  })
  .strict();

export type CasimirIndependentNumericalExecutorCapabilityV1 = z.infer<
  typeof casimirIndependentNumericalExecutorCapabilityV1Schema
>;

export type BuildCasimirIndependentNumericalExecutorCapabilityV1Input = Omit<
  CasimirIndependentNumericalExecutorCapabilityV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & {
  generatedAt?: string;
};

const executorAuthority =
  (): CasimirIndependentNumericalExecutorCapabilityV1["authority"] => ({
    outputRole: "execution_capability_attestation_only",
    provesScientificCorrectness: false,
    validatesNumericalImplementation: false,
    validatesTheory: false,
    assistantAnswer: false,
    terminalEligible: false,
    promotionAllowed: false,
  });

export async function buildCasimirIndependentNumericalExecutorCapabilityV1(
  input: BuildCasimirIndependentNumericalExecutorCapabilityV1Input,
): Promise<CasimirIndependentNumericalExecutorCapabilityV1> {
  const withoutHash: Omit<
    CasimirIndependentNumericalExecutorCapabilityV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_ARTIFACT_ID,
    schemaVersion:
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    capabilityId: input.capabilityId,
    platform: input.platform,
    architecture: input.architecture,
    enforcement: input.enforcement,
    attestation: input.attestation,
    authority: executorAuthority(),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function validateCasimirIndependentNumericalExecutorCapabilityIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const parsed =
    casimirIndependentNumericalExecutorCapabilityV1Schema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "$";
      return `${path}: ${issue.message}`;
    });
  }
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTOR_CAPABILITY_HASH_DOMAIN,
    value: withoutHash,
  });
  return artifactSha256 === expected
    ? []
    : ["artifactSha256 does not match executor capability content"];
}

const bundleArtifactSchema = z
  .object({
    role: z.enum(CASIMIR_LANYON_PERIODIC_1D_BUNDLE_ARTIFACT_ROLES),
    relativePath: safeRelativePathSchema,
    sha256: sha256Schema,
    sizeBytes: z.number().int().nonnegative(),
  })
  .strict();

const enrollmentAuthoritySchema = z
  .object({
    outputRole: z.literal("server_owned_execution_enrollment"),
    procedureBound: z.literal(true),
    sealedInputBound: z.literal(true),
    analyticReferenceIsNumericalSolver: z.literal(false),
    networkPolicyIsSandboxProof: z.literal(false),
    executionEnabled: z.literal(false),
    validatesNumericalImplementation: z.literal(false),
    validatesTheory: z.literal(false),
    assistantAnswer: z.literal(false),
    terminalEligible: z.literal(false),
    promotionAllowed: z.literal(false),
  })
  .strict();

export const casimirIndependentNumericalExecutionEnrollmentV1Schema = z
  .object({
    artifactId: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_ARTIFACT_ID,
    ),
    schemaVersion: z.literal(
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_SCHEMA_VERSION,
    ),
    generatedAt: z.string().datetime(),
    enrollmentId: nonEmptyStringSchema,
    catalogEntryId: nonEmptyStringSchema,
    backendId: z.literal(CASIMIR_LANYON_PERIODIC_1D_BACKEND_ID),
    procedure: z
      .object({
        schemaVersion: z.literal(THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION),
        procedureId: nonEmptyStringSchema,
        procedureSha256: sha256Schema,
      })
      .strict(),
    request: z
      .object({
        requestId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
      })
      .strict(),
    replayPolicy: z
      .object({
        policyId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
      })
      .strict(),
    sealedInputSha256: sha256Schema,
    platform: z
      .object({
        platform: nonEmptyStringSchema,
        architecture: nonEmptyStringSchema,
      })
      .strict(),
    lanyon: z
      .object({
        repositoryUri: z.literal(CASIMIR_LANYON_REPOSITORY_URI),
        commitSha: z.literal(CASIMIR_LANYON_PINNED_COMMIT),
        selectedSourceTreeSha256: z.literal(
          CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256,
        ),
        caseId: z.literal(CASIMIR_LANYON_PERIODIC_1D_CASE_ID),
        generatedSourceSha256: sha256Schema,
      })
      .strict(),
    primaryLane: z
      .object({
        role: z.literal("lanyon_generated_kernel_with_casimir_driver"),
        implementationId: z.literal(
          CASIMIR_LANYON_PERIODIC_1D_PRIMARY_IMPLEMENTATION_ID,
        ),
        lineageId: z.literal(CASIMIR_LANYON_PERIODIC_1D_PRIMARY_LINEAGE_ID),
        sourceSha256: sha256Schema,
        buildManifestSha256: sha256Schema,
        executableSha256: sha256Schema,
      })
      .strict(),
    comparisonLane: z
      .object({
        role: z.literal("analytic_reference"),
        implementationId: z.literal(
          CASIMIR_LANYON_PERIODIC_1D_REFERENCE_IMPLEMENTATION_ID,
        ),
        lineageId: z.literal(CASIMIR_LANYON_PERIODIC_1D_REFERENCE_LINEAGE_ID),
        isNumericalSolver: z.literal(false),
        sourceSha256: sha256Schema,
        buildManifestSha256: sha256Schema,
        executableSha256: sha256Schema,
      })
      .strict(),
    bundle: z
      .object({
        bundleId: nonEmptyStringSchema,
        artifacts: z
          .array(bundleArtifactSchema)
          .length(CASIMIR_LANYON_PERIODIC_1D_BUNDLE_ARTIFACT_ROLES.length),
      })
      .strict(),
    executorCapability: z
      .object({
        capabilityId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
        requiresNetworkIsolation: z.literal(true),
        requiresFilesystemWriteIsolation: z.literal(true),
        requiresProcessTreeContainment: z.literal(true),
        requiresWallTimeout: z.literal(true),
        requiresOutputByteLimit: z.literal(true),
      })
      .strict(),
    authority: enrollmentAuthoritySchema,
    artifactSha256: sha256Schema,
  })
  .strict()
  .superRefine((value, context) => {
    const roles = value.bundle.artifacts.map((artifact) => artifact.role);
    if (
      JSON.stringify(roles) !==
      JSON.stringify(CASIMIR_LANYON_PERIODIC_1D_BUNDLE_ARTIFACT_ROLES)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bundle", "artifacts"],
        message: "bundle artifact roles must be exact, unique, and sorted",
      });
    }
    const paths = value.bundle.artifacts.map(
      (artifact) => artifact.relativePath,
    );
    if (new Set(paths).size !== paths.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bundle", "artifacts"],
        message: "bundle artifact paths must be unique",
      });
    }
  });

export type CasimirIndependentNumericalExecutionEnrollmentV1 = z.infer<
  typeof casimirIndependentNumericalExecutionEnrollmentV1Schema
>;

export type BuildCasimirIndependentNumericalExecutionEnrollmentV1Input = Omit<
  CasimirIndependentNumericalExecutionEnrollmentV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & {
  generatedAt?: string;
};

const enrollmentAuthority =
  (): CasimirIndependentNumericalExecutionEnrollmentV1["authority"] => ({
    outputRole: "server_owned_execution_enrollment",
    procedureBound: true,
    sealedInputBound: true,
    analyticReferenceIsNumericalSolver: false,
    networkPolicyIsSandboxProof: false,
    executionEnabled: false,
    validatesNumericalImplementation: false,
    validatesTheory: false,
    assistantAnswer: false,
    terminalEligible: false,
    promotionAllowed: false,
  });

export async function buildCasimirIndependentNumericalExecutionEnrollmentV1(
  input: BuildCasimirIndependentNumericalExecutionEnrollmentV1Input,
): Promise<CasimirIndependentNumericalExecutionEnrollmentV1> {
  const withoutHash: Omit<
    CasimirIndependentNumericalExecutionEnrollmentV1,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_ARTIFACT_ID,
    schemaVersion:
      CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    enrollmentId: input.enrollmentId,
    catalogEntryId: input.catalogEntryId,
    backendId: input.backendId,
    procedure: input.procedure,
    request: input.request,
    replayPolicy: input.replayPolicy,
    sealedInputSha256: input.sealedInputSha256,
    platform: input.platform,
    lanyon: input.lanyon,
    primaryLane: input.primaryLane,
    comparisonLane: input.comparisonLane,
    bundle: input.bundle,
    executorCapability: input.executorCapability,
    authority: enrollmentAuthority(),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function validateCasimirIndependentNumericalExecutionEnrollmentIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const parsed =
    casimirIndependentNumericalExecutionEnrollmentV1Schema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "$";
      return `${path}: ${issue.message}`;
    });
  }
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_INDEPENDENT_NUMERICAL_EXECUTION_ENROLLMENT_HASH_DOMAIN,
    value: withoutHash,
  });
  return artifactSha256 === expected
    ? []
    : ["artifactSha256 does not match numerical enrollment content"];
}
