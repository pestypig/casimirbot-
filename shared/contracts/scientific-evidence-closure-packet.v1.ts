import { z } from "zod";

import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import { SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION } from "./scientific-evidence-conformance-manifest.v1";

export const SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_ARTIFACT_ID =
  "scientific_evidence_closure_packet" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_SCHEMA_VERSION =
  "scientific_evidence_closure_packet/v1" as const;
export const SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_HASH_DOMAIN =
  "scientific-evidence-closure-packet/v1" as const;

export const SCIENTIFIC_EVIDENCE_CLOSURE_AXES = [
  "comparison",
  "formal",
  "graph",
  "independent_numerical",
  "semantic",
  "source",
] as const;

const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const nonEmpty = z.string().trim().min(1);
const exactDecimal = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);

const evidenceRef = z
  .object({
    artifactId: nonEmpty,
    schemaVersion: nonEmpty,
    artifactSha256: sha256,
  })
  .strict();

const closureAuthority = (satisfied: boolean) => ({
  outputRole: "immutable_evidence_for_bounded_synthesis" as const,
  canonicalWithinEnrollment: satisfied,
  closureAxesChecked: satisfied,
  evidenceClass: "synthetic_computational" as const,
  sourceAuthority: false as const,
  semanticAuthority: false as const,
  theoryAuthority: false as const,
  empiricalAuthority: false as const,
  physicalAuthority: false as const,
  implementationCorrectnessAuthority: false as const,
  assistantAnswer: false as const,
  terminalEligible: false as const,
  postToolModelStepRequired: true as const,
  promotionAllowed: false as const,
});

export const scientificEvidenceClosurePacketV1Schema = z
  .object({
    artifactId: z.literal(SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_ARTIFACT_ID),
    schemaVersion: z.literal(
      SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_SCHEMA_VERSION,
    ),
    packetId: nonEmpty,
    generatedAt: z.string().datetime(),
    artifactSha256: sha256,
    status: z.enum(["satisfied", "failed", "blocked"]),
    turnBinding: z
      .object({
        turnId: nonEmpty,
        planId: nonEmpty,
        executionPlanArtifactSha256: sha256,
        confirmationReceiptSha256: sha256,
        currentTurnEvidenceReentryRequired: z.literal(true),
      })
      .strict(),
    enrollment: z
      .object({
        manifestId: nonEmpty,
        schemaVersion: z.literal(
          SCIENTIFIC_EVIDENCE_CONFORMANCE_MANIFEST_SCHEMA_VERSION,
        ),
        artifactSha256: sha256,
        orientationId: nonEmpty,
        selectedBadgeIds: z.array(nonEmpty).min(1),
      })
      .strict(),
    intervention: z
      .object({
        parameterId: nonEmpty,
        sourceSymbol: nonEmpty,
        unit: nonEmpty,
        baselineValue: exactDecimal,
        interventionValue: exactDecimal,
        frozenInputsSha256: sha256,
      })
      .strict(),
    evidence: z
      .object({
        sourceClaim: evidenceRef,
        semanticBinding: evidenceRef,
        graphSnapshot: evidenceRef,
        formalCertificate: evidenceRef.extend({
          status: z.enum(["passed", "failed", "blocked"]),
          theoremName: nonEmpty,
          theoremTypeSha256: sha256,
        }),
        baselineNumericalCertificate: evidenceRef.extend({
          status: z.enum(["passed", "failed", "blocked"]),
          caseId: nonEmpty,
          primaryLineageId: nonEmpty,
          independentLineageId: nonEmpty,
          independenceEstablished: z.boolean(),
        }),
        interventionNumericalCertificate: evidenceRef.extend({
          status: z.enum(["passed", "failed", "blocked"]),
          caseId: nonEmpty,
          primaryLineageId: nonEmpty,
          independentLineageId: nonEmpty,
          independenceEstablished: z.boolean(),
        }),
      })
      .strict(),
    axisResults: z
      .array(
        z
          .object({
            axis: z.enum(SCIENTIFIC_EVIDENCE_CLOSURE_AXES),
            status: z.enum(["passed", "failed", "blocked"]),
            evidenceSha256: sha256.nullable(),
            issueCodes: z.array(nonEmpty),
          })
          .strict(),
      )
      .length(SCIENTIFIC_EVIDENCE_CLOSURE_AXES.length),
    comparison: z
      .object({
        policyId: nonEmpty,
        policySha256: sha256,
        observables: z
          .array(
            z
              .object({
                observableId: nonEmpty,
                unit: nonEmpty,
                baselineValue: z.number().finite(),
                interventionValue: z.number().finite(),
                delta: z.number().finite(),
                absoluteTolerance: z.number().finite().nonnegative(),
                relativeTolerance: z.number().finite().nonnegative(),
                withinTolerance: z.boolean(),
              })
              .strict(),
          )
          .min(1),
        gateDeltas: z.array(
          z
            .object({
              gateId: nonEmpty,
              baselineStatus: z.enum(["passed", "failed", "blocked"]),
              interventionStatus: z.enum(["passed", "failed", "blocked"]),
              changed: z.boolean(),
            })
            .strict(),
        ),
      })
      .strict(),
    blockers: z.array(
      z
        .object({
          code: nonEmpty,
          message: nonEmpty,
          evidenceSha256: sha256.nullable(),
        })
        .strict(),
    ),
    claimBoundary: z
      .object({
        establishes: z.array(nonEmpty).min(1),
        doesNotEstablish: z.array(nonEmpty).min(1),
        maximumClaim:
          z.literal(
            "bounded synthetic comparison within the exact enrolled case",
          ),
      })
      .strict(),
    authority: z
      .object({
        outputRole: z.literal("immutable_evidence_for_bounded_synthesis"),
        canonicalWithinEnrollment: z.boolean(),
        closureAxesChecked: z.boolean(),
        evidenceClass: z.literal("synthetic_computational"),
        sourceAuthority: z.literal(false),
        semanticAuthority: z.literal(false),
        theoryAuthority: z.literal(false),
        empiricalAuthority: z.literal(false),
        physicalAuthority: z.literal(false),
        implementationCorrectnessAuthority: z.literal(false),
        assistantAnswer: z.literal(false),
        terminalEligible: z.literal(false),
        postToolModelStepRequired: z.literal(true),
        promotionAllowed: z.literal(false),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const sortedBadges = [...value.enrollment.selectedBadgeIds].sort();
    if (
      new Set(sortedBadges).size !== sortedBadges.length ||
      JSON.stringify(value.enrollment.selectedBadgeIds) !==
        JSON.stringify(sortedBadges)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enrollment", "selectedBadgeIds"],
        message: "must be sorted and duplicate-free",
      });
    }

    const observedAxes = value.axisResults.map((entry) => entry.axis);
    if (
      JSON.stringify(observedAxes) !==
      JSON.stringify(SCIENTIFIC_EVIDENCE_CLOSURE_AXES)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["axisResults"],
        message: "must contain the exact canonical closure-axis order",
      });
    }

    for (const observable of value.comparison.observables) {
      const scale = Math.max(
        Math.abs(observable.baselineValue),
        Math.abs(observable.interventionValue),
        1,
      );
      const expectedWithin =
        Math.abs(observable.delta) <=
        Math.max(
          observable.absoluteTolerance,
          observable.relativeTolerance * scale,
        );
      if (observable.withinTolerance !== expectedWithin) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["comparison", "observables"],
          message: "withinTolerance does not match the declared policy",
        });
        break;
      }
      const expectedDelta =
        observable.interventionValue - observable.baselineValue;
      const deltaError = Math.abs(observable.delta - expectedDelta);
      if (deltaError > Number.EPSILON * Math.max(scale, 1) * 8) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["comparison", "observables"],
          message: "delta does not equal interventionValue - baselineValue",
        });
        break;
      }
    }

    for (const gate of value.comparison.gateDeltas) {
      if (
        gate.changed !==
        (gate.baselineStatus !== gate.interventionStatus)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["comparison", "gateDeltas"],
          message: "changed does not match the two gate statuses",
        });
        break;
      }
    }

    const allAxesPassed = value.axisResults.every(
      (entry) => entry.status === "passed",
    );
    const evidencePassed =
      value.evidence.formalCertificate.status === "passed" &&
      value.evidence.baselineNumericalCertificate.status === "passed" &&
      value.evidence.interventionNumericalCertificate.status === "passed" &&
      value.evidence.baselineNumericalCertificate.independenceEstablished &&
      value.evidence.interventionNumericalCertificate.independenceEstablished;
    const satisfied = value.status === "satisfied";
    if (
      satisfied !==
      (allAxesPassed && evidencePassed && value.blockers.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message:
          "satisfied requires every axis and evidence certificate to pass with no blockers",
      });
    }
    if (
      value.authority.canonicalWithinEnrollment !== satisfied ||
      value.authority.closureAxesChecked !== satisfied
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["authority"],
        message:
          "canonicalWithinEnrollment and closureAxesChecked must equal satisfied status",
      });
    }
    if (
      satisfied &&
      value.intervention.baselineValue === value.intervention.interventionValue
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["intervention", "interventionValue"],
        message: "a satisfied intervention must change the parameter value",
      });
    }
  });

export type ScientificEvidenceClosurePacketV1 = z.infer<
  typeof scientificEvidenceClosurePacketV1Schema
>;

export type BuildScientificEvidenceClosurePacketV1Input = Omit<
  ScientificEvidenceClosurePacketV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "artifactSha256"
  | "authority"
> & { generatedAt?: string };

export async function computeScientificEvidenceClosurePacketSha256V1(
  value: Omit<ScientificEvidenceClosurePacketV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_HASH_DOMAIN,
    value,
  });
}

export async function buildScientificEvidenceClosurePacketV1(
  input: BuildScientificEvidenceClosurePacketV1Input,
): Promise<ScientificEvidenceClosurePacketV1> {
  const satisfied = input.status === "satisfied";
  const withoutHash: Omit<
    ScientificEvidenceClosurePacketV1,
    "artifactSha256"
  > = {
    ...input,
    artifactId: SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_ARTIFACT_ID,
    schemaVersion: SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authority: closureAuthority(satisfied),
  };
  const packet = {
    ...withoutHash,
    artifactSha256:
      await computeScientificEvidenceClosurePacketSha256V1(withoutHash),
  };
  return scientificEvidenceClosurePacketV1Schema.parse(packet);
}

export function validateScientificEvidenceClosurePacketShapeV1(
  value: unknown,
): string[] {
  const parsed = scientificEvidenceClosurePacketV1Schema.safeParse(value);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "$";
    return `${path}: ${issue.message}`;
  });
}

export async function validateScientificEvidenceClosurePacketIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const parsed = scientificEvidenceClosurePacketV1Schema.safeParse(value);
  if (!parsed.success) return validateScientificEvidenceClosurePacketShapeV1(value);
  const { artifactSha256, ...withoutHash } = parsed.data;
  const expected =
    await computeScientificEvidenceClosurePacketSha256V1(withoutHash);
  return artifactSha256 === expected
    ? []
    : ["artifactSha256 does not match closure packet content"];
}
