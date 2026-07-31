import { z } from "zod";

import { CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION } from "./casimir-formal-sandbox-executor-capability.v1";
import { CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION } from "./casimir-formal-verification-request.v2";
import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import { THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION } from "./theory-experiment-procedure.v1";

export const CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_ARTIFACT_ID =
  "casimir_formal_execution_enrollment_v2" as const;
export const CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_SCHEMA_VERSION =
  "casimir_formal_execution_enrollment/v2" as const;
export const CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_HASH_DOMAIN =
  "casimir-formal-execution-enrollment/v2" as const;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const commitShaSchema = z.string().regex(/^[a-f0-9]{40}$/);
const nonEmptyStringSchema = z.string().trim().min(1);
const safeRelativePathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value === value.trim() &&
      value === value.replace(/\\/g, "/") &&
      !value.startsWith("/") &&
      !/^[A-Za-z]:/.test(value) &&
      !value.split("/").some((part) => part === "" || part === ".."),
    "must be a safe repository-relative path",
  );

const sourceArtifactSchema = z
  .object({
    logicalPath: safeRelativePathSchema,
    sha256: sha256Schema,
  })
  .strict();

const authoritySchema = z
  .object({
    outputRole: z.literal("server_owned_formal_execution_enrollment"),
    serverRegistrationRequired: z.literal(true),
    procedureBound: z.literal(true),
    sealedExecutionBound: z.literal(true),
    specificationBound: z.literal(true),
    formalSourceBound: z.literal(true),
    implementationSourceBound: z.literal(true),
    generatorLineageBound: z.literal(true),
    semanticBindingBound: z.literal(true),
    graphSnapshotBound: z.literal(true),
    environmentBound: z.literal(true),
    executionEnabled: z.literal(false),
    validatesGeneratorCorrectness: z.literal(false),
    validatesFormalProposition: z.literal(false),
    validatesNumericalImplementation: z.literal(false),
    validatesEmpiricalClaim: z.literal(false),
    validatesScientificTruth: z.literal(false),
    validatesPhysicalMechanism: z.literal(false),
    assistantAnswer: z.literal(false),
    terminalEligible: z.literal(false),
  })
  .strict();

export const casimirFormalExecutionEnrollmentV2Schema = z
  .object({
    artifactId: z.literal(
      CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_ARTIFACT_ID,
    ),
    schemaVersion: z.literal(
      CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_SCHEMA_VERSION,
    ),
    generatedAt: z.string().datetime(),
    enrollmentId: nonEmptyStringSchema,
    executionCatalogEntryId: nonEmptyStringSchema,
    artifactSha256: sha256Schema,
    sealedExecutionSha256: sha256Schema,
    procedure: z
      .object({
        schemaVersion: z.literal(THEORY_EXPERIMENT_PROCEDURE_SCHEMA_VERSION),
        procedureId: nonEmptyStringSchema,
        procedureSha256: sha256Schema,
      })
      .strict(),
    request: z
      .object({
        schemaVersion: z.literal(
          CASIMIR_FORMAL_VERIFICATION_REQUEST_V2_SCHEMA_VERSION,
        ),
        requestId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
      })
      .strict(),
    sourceLineage: z
      .object({
        sourceAuditId: nonEmptyStringSchema,
        sourceAuditArtifactSha256: sha256Schema,
        generationLineageAuditId: nonEmptyStringSchema,
        generationLineageAuditArtifactSha256: sha256Schema,
        repository: z
          .object({
            producerId: nonEmptyStringSchema,
            uri: z.string().url(),
            commitSha: commitShaSchema,
            selectedSourceTreeSha256: sha256Schema,
          })
          .strict(),
        caseId: nonEmptyStringSchema,
        specification: sourceArtifactSchema,
        formalSource: sourceArtifactSchema.extend({
          moduleName: nonEmptyStringSchema,
        }),
        implementationSource: sourceArtifactSchema.extend({
          numericModel: z.literal("c_ieee754_binary64"),
          entrypointStatus: z.enum(["placeholder_noop", "executable"]),
          formalRefinementStatus: z.enum(["unassessed", "reviewed"]),
        }),
        generator: z
          .object({
            registrationId: nonEmptyStringSchema,
            producerId: nonEmptyStringSchema,
            generatorArtifactId: nonEmptyStringSchema,
            generatorRevisionSha256: sha256Schema,
            invocationManifestSha256: sha256Schema,
            generationReceiptId: nonEmptyStringSchema,
            generationReceiptSha256: sha256Schema,
            outputBundleSha256: sha256Schema,
          })
          .strict(),
      })
      .strict(),
    theorem: z
      .object({
        formalArtifactId: nonEmptyStringSchema,
        theoremName: nonEmptyStringSchema,
        theoremModule: nonEmptyStringSchema,
        declarationSha256: sha256Schema,
        propositionSourceSha256: sha256Schema,
        observedTheoremTypeSha256: sha256Schema,
      })
      .strict(),
    semanticBinding: z
      .object({
        bindingId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
        status: z.literal("reviewed"),
        claimId: nonEmptyStringSchema,
        semanticPropositionSha256: sha256Schema,
      })
      .strict(),
    graph: z
      .object({
        graphId: nonEmptyStringSchema,
        snapshotSha256: sha256Schema,
      })
      .strict(),
    environment: z
      .object({
        policyId: nonEmptyStringSchema,
        policySha256: sha256Schema,
        pinnedVersion: nonEmptyStringSchema,
        kernelBinarySha256: sha256Schema,
        dependencyLockSha256: sha256Schema,
        importClosureSha256: sha256Schema,
      })
      .strict(),
    sourceBundle: z
      .object({
        bundleId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
        formalSourceSha256: sha256Schema,
        importClosureSha256: sha256Schema,
        resolverRef: z
          .string()
          .regex(
            /^casimir-formal-bundle:[A-Za-z0-9][A-Za-z0-9._~-]{0,255}$/,
          ),
      })
      .strict(),
    executorCapability: z
      .object({
        schemaVersion: z.literal(
          CASIMIR_FORMAL_SANDBOX_EXECUTOR_CAPABILITY_SCHEMA_VERSION,
        ),
        capabilityId: nonEmptyStringSchema,
        artifactSha256: sha256Schema,
      })
      .strict(),
    authority: authoritySchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.sourceLineage.repository.producerId !==
      value.sourceLineage.generator.producerId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceLineage", "generator", "producerId"],
        message: "must match sourceLineage.repository.producerId",
      });
    }
    if (
      value.sourceLineage.formalSource.moduleName !== value.theorem.theoremModule
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["theorem", "theoremModule"],
        message: "must match sourceLineage.formalSource.moduleName",
      });
    }
    if (
      value.sourceLineage.formalSource.sha256 !==
      value.sourceBundle.formalSourceSha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceBundle", "formalSourceSha256"],
        message: "must match sourceLineage.formalSource.sha256",
      });
    }
    if (
      value.environment.importClosureSha256 !==
      value.sourceBundle.importClosureSha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceBundle", "importClosureSha256"],
        message: "must match environment.importClosureSha256",
      });
    }
  });

export type CasimirFormalExecutionEnrollmentV2 = z.infer<
  typeof casimirFormalExecutionEnrollmentV2Schema
>;

export type BuildCasimirFormalExecutionEnrollmentV2Input = Omit<
  CasimirFormalExecutionEnrollmentV2,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & {
  generatedAt?: string;
};

const authority = (): CasimirFormalExecutionEnrollmentV2["authority"] => ({
  outputRole: "server_owned_formal_execution_enrollment",
  serverRegistrationRequired: true,
  procedureBound: true,
  sealedExecutionBound: true,
  specificationBound: true,
  formalSourceBound: true,
  implementationSourceBound: true,
  generatorLineageBound: true,
  semanticBindingBound: true,
  graphSnapshotBound: true,
  environmentBound: true,
  executionEnabled: false,
  validatesGeneratorCorrectness: false,
  validatesFormalProposition: false,
  validatesNumericalImplementation: false,
  validatesEmpiricalClaim: false,
  validatesScientificTruth: false,
  validatesPhysicalMechanism: false,
  assistantAnswer: false,
  terminalEligible: false,
});

export async function buildCasimirFormalExecutionEnrollmentV2(
  input: BuildCasimirFormalExecutionEnrollmentV2Input,
): Promise<CasimirFormalExecutionEnrollmentV2> {
  const withoutHash: Omit<
    CasimirFormalExecutionEnrollmentV2,
    "artifactSha256"
  > = {
    artifactId: CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_ARTIFACT_ID,
    schemaVersion: CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    enrollmentId: input.enrollmentId,
    executionCatalogEntryId: input.executionCatalogEntryId,
    sealedExecutionSha256: input.sealedExecutionSha256,
    procedure: input.procedure,
    request: input.request,
    sourceLineage: input.sourceLineage,
    theorem: input.theorem,
    semanticBinding: input.semanticBinding,
    graph: input.graph,
    environment: input.environment,
    sourceBundle: input.sourceBundle,
    executorCapability: input.executorCapability,
    authority: authority(),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function validateCasimirFormalExecutionEnrollmentIntegrityV2(
  value: unknown,
): Promise<string[]> {
  const parsed = casimirFormalExecutionEnrollmentV2Schema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "$";
      return `${path}: ${issue.message}`;
    });
  }
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_EXECUTION_ENROLLMENT_V2_HASH_DOMAIN,
    value: withoutHash,
  });
  return artifactSha256 === expected
    ? []
    : ["artifactSha256 does not match formal execution enrollment"];
}
