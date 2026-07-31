import { z } from "zod";

import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_ARTIFACT_ID =
  "casimir_formal_artifact_generation_lineage_audit" as const;
export const CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_SCHEMA_VERSION =
  "casimir_formal_artifact_generation_lineage_audit/v1" as const;
export const CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_HASH_DOMAIN =
  "casimir-formal-artifact-generation-lineage-audit/v1" as const;

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

const authoritySchema = z
  .object({
    outputRole: z.literal("generator_lineage_absence_audit"),
    sourceTreeInspectionAuthority: z.literal(true),
    generatorRegistrationAuthority: z.literal(false),
    executionEnrollmentAuthority: z.literal(false),
    provesGeneratorCorrectness: z.literal(false),
    provesGeneratedArtifactsCorrect: z.literal(false),
    validatesFormalProposition: z.literal(false),
    validatesNumericalImplementation: z.literal(false),
    validatesScientificTruth: z.literal(false),
    assistantAnswer: z.literal(false),
    terminalEligible: z.literal(false),
  })
  .strict();

export const casimirFormalArtifactGenerationLineageAuditV1Schema = z
  .object({
    artifactId: z.literal(
      CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_ARTIFACT_ID,
    ),
    schemaVersion: z.literal(
      CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_SCHEMA_VERSION,
    ),
    auditId: nonEmptyStringSchema,
    generatedAt: z.string().datetime(),
    artifactSha256: sha256Schema,
    sourceAuditArtifactSha256: sha256Schema,
    repository: z
      .object({
        producerId: nonEmptyStringSchema,
        uri: z.string().url(),
        commitSha: commitShaSchema,
        selectedSourceTreeSha256: sha256Schema,
        canonicalByteSource: z.literal("git_blob"),
      })
      .strict(),
    recursiveTreeInspection: z
      .object({
        ref: commitShaSchema,
        complete: z.literal(true),
        truncated: z.literal(false),
        entryCount: z.number().int().positive(),
        pathSetSha256: sha256Schema,
        paths: z.array(safeRelativePathSchema).min(1),
        generatorCandidatePaths: z.array(safeRelativePathSchema),
      })
      .strict(),
    generatorLineage: z
      .object({
        status: z.literal("not_published_in_pinned_repository"),
        generatorArtifactId: z.null(),
        generatorRevisionSha256: z.null(),
        invocationManifestSha256: z.null(),
        generationReceiptId: z.null(),
        generationReceiptSha256: z.null(),
        requiredForExecutionEnrollment: z.literal(true),
        blockerCode: z.literal("formal_generator_lineage_unavailable"),
      })
      .strict(),
    authority: authoritySchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.recursiveTreeInspection.ref !== value.repository.commitSha) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recursiveTreeInspection", "ref"],
        message: "must match repository.commitSha",
      });
    }
    if (
      value.recursiveTreeInspection.entryCount !==
      value.recursiveTreeInspection.paths.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recursiveTreeInspection", "entryCount"],
        message: "must match paths length",
      });
    }
    const sorted = [...value.recursiveTreeInspection.paths].sort((left, right) =>
      left.localeCompare(right, "en"),
    );
    if (
      new Set(value.recursiveTreeInspection.paths).size !==
        value.recursiveTreeInspection.paths.length ||
      JSON.stringify(sorted) !==
        JSON.stringify(value.recursiveTreeInspection.paths)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recursiveTreeInspection", "paths"],
        message: "must be exact, unique, and sorted",
      });
    }
    const expectedCandidates = value.recursiveTreeInspection.paths.filter(
      (entry) => /(generator|generate|prompt|lanyon)/i.test(entry),
    );
    if (
      JSON.stringify(expectedCandidates) !==
      JSON.stringify(value.recursiveTreeInspection.generatorCandidatePaths)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recursiveTreeInspection", "generatorCandidatePaths"],
        message: "must exactly match the generator-name path scan",
      });
    }
    if (expectedCandidates.length !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["generatorLineage", "status"],
        message:
          "not_published status requires an empty generator candidate path scan",
      });
    }
  });

export type CasimirFormalArtifactGenerationLineageAuditV1 = z.infer<
  typeof casimirFormalArtifactGenerationLineageAuditV1Schema
>;

export type BuildCasimirFormalArtifactGenerationLineageAuditV1Input = Omit<
  CasimirFormalArtifactGenerationLineageAuditV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "artifactSha256" | "authority"
> & {
  generatedAt?: string;
};

const authority =
  (): CasimirFormalArtifactGenerationLineageAuditV1["authority"] => ({
    outputRole: "generator_lineage_absence_audit",
    sourceTreeInspectionAuthority: true,
    generatorRegistrationAuthority: false,
    executionEnrollmentAuthority: false,
    provesGeneratorCorrectness: false,
    provesGeneratedArtifactsCorrect: false,
    validatesFormalProposition: false,
    validatesNumericalImplementation: false,
    validatesScientificTruth: false,
    assistantAnswer: false,
    terminalEligible: false,
  });

export async function computeCasimirFormalArtifactGenerationLineagePathSetSha256V1(
  input: {
    repositoryUri: string;
    commitSha: string;
    paths: string[];
  },
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: "casimir-formal-artifact-generation-lineage-path-set/v1",
    value: input,
  });
}

export async function buildCasimirFormalArtifactGenerationLineageAuditV1(
  input: BuildCasimirFormalArtifactGenerationLineageAuditV1Input,
): Promise<CasimirFormalArtifactGenerationLineageAuditV1> {
  const withoutHash: Omit<
    CasimirFormalArtifactGenerationLineageAuditV1,
    "artifactSha256"
  > = {
    artifactId:
      CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_ARTIFACT_ID,
    schemaVersion:
      CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_SCHEMA_VERSION,
    auditId: input.auditId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceAuditArtifactSha256: input.sourceAuditArtifactSha256,
    repository: input.repository,
    recursiveTreeInspection: input.recursiveTreeInspection,
    generatorLineage: input.generatorLineage,
    authority: authority(),
  };
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain:
        CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

export async function validateCasimirFormalArtifactGenerationLineageAuditIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const parsed =
    casimirFormalArtifactGenerationLineageAuditV1Schema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "$";
      return `${path}: ${issue.message}`;
    });
  }
  const expectedPathSet =
    await computeCasimirFormalArtifactGenerationLineagePathSetSha256V1({
      repositoryUri: parsed.data.repository.uri,
      commitSha: parsed.data.repository.commitSha,
      paths: parsed.data.recursiveTreeInspection.paths,
    });
  const issues =
    parsed.data.recursiveTreeInspection.pathSetSha256 === expectedPathSet
      ? []
      : ["recursiveTreeInspection.pathSetSha256 does not match paths"];
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expectedArtifact = await computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_ARTIFACT_GENERATION_LINEAGE_AUDIT_HASH_DOMAIN,
    value: withoutHash,
  });
  if (artifactSha256 !== expectedArtifact) {
    issues.push("artifactSha256 does not match generation-lineage audit");
  }
  return issues;
}
