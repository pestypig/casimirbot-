import { z } from "zod";

export const tinySykValidationSweepReportSchema = z.object({
  schemaVersion: z.literal("er-epr-tiny-syk-validation-sweep-report.v1"),
  runId: z.string().min(1),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  aggregate: z.object({
    totalCandidateRuns: z.number().int().nonnegative(),
    candidatePassCount: z.number().int().nonnegative(),
    candidatePassRate: z.number().min(0).max(1),
    controlLeakageCount: z.number().int().nonnegative(),
    entropyWashoutPassCount: z.number().int().nonnegative(),
    numericalAgreementPassCount: z.number().int().nonnegative(),
    strongestAllowedVerdict: z.enum([
      "not_tested",
      "validation_blocked",
      "control_leakage_observed",
      "numerical_convergence_failed",
      "entropy_washout_failed",
      "model_internal_validation_support_observed",
    ]),
  }),
  perSeedSummaries: z.array(z.object({
    seed: z.number().int(),
    nMajoranasPerSide: z.number().int().positive(),
    hamiltonianHash: z.string().min(1),
    candidateVerdict: z.string().min(1),
    controlLeakageMax: z.number().min(0),
    entropyWashoutMonotonic: z.boolean(),
    numericalMethodAgreement: z.boolean(),
  })).min(1),
  blockers: z.array(z.object({
    blockerId: z.enum([
      "control_leakage",
      "missing_required_control",
      "numerical_method_disagreement",
      "entropy_washout_not_monotonic",
      "thermalization_failed",
      "scrambling_failed",
      "noncommutativity_failed",
      "missing_hashes",
      "overclaim_blocked",
    ]),
    detail: z.string().min(1),
  })),
  evidence: z.object({
    stage: z.literal("ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1"),
    claimTier: z.literal("Stage1_model_internal_validation_sweep"),
    claimIds: z.array(z.string().min(1)).min(1),
    citations: z.array(z.string().min(1)).min(1),
    sourceRoles: z.record(z.enum(["supports_model", "supports_guardrail", "supports_boundary", "supports_precedent"])),
    uncertaintyNotes: z.array(z.string().min(1)).min(1),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string().min(1)).min(1),
  }),
});

export type TinySykValidationSweepArtifact = z.infer<typeof tinySykValidationSweepReportSchema>;
