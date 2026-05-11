import { z } from "zod";

export const tinySykSolverArtifactSchema = z.object({
  schemaVersion: z.literal("er-epr-tiny-syk-artifact.v1"),
  runId: z.string().min(1),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  backend: z.literal("two_sided_syk_tiny_exact_diag"),
  numerical: z.object({
    numericalMethod: z.enum(["exact_diagonalization", "matrix_exponential_taylor", "matrix_exponential_pade"]),
    numericalTolerance: z.number().positive(),
    dimension: z.number().int().positive(),
    nMajoranasPerSide: z.number().int().positive(),
  }),
  hashes: z.object({
    planHash: z.string().min(1),
    hamiltonianHash: z.string().min(1),
    rawTelemetryHash: z.string().min(1),
    normalizedObservablesHash: z.string().min(1),
  }),
  outputs: z.object({
    rawTelemetryRef: z.string().min(1),
    normalizedObservablesRef: z.string().min(1),
    erEprEvaluationRef: z.string().min(1),
    stage1RunnerReportRef: z.string().min(1).optional(),
  }),
  verdict: z.object({
    solverVerdict: z.enum([
      "solver_not_tested",
      "solver_simulated_controls_failed",
      "solver_simulated_control_leakage",
      "solver_simulated_entropy_washout",
      "solver_simulated_model_internal_support",
      "overclaim_blocked",
    ]),
  }),
  evidence: z.object({
    stage: z.literal("ER_EPR_TINY_SYK_EXACT_DIAG_V1"),
    claimTier: z.literal("Stage1_model_internal_toy_solver"),
    claimIds: z.array(z.string().min(1)).min(1),
    citations: z.array(z.string().min(1)).min(1),
    sourceRoles: z.record(z.enum([
      "supports_model",
      "supports_guardrail",
      "supports_boundary",
      "supports_precedent",
    ])),
    uncertaintyNotes: z.array(z.string().min(1)).min(1),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string().min(1)).min(1),
  }),
}).superRefine((artifact, ctx) => {
  const joined = [
    artifact.evidence.claimIds.join(" "),
    artifact.evidence.citations.join(" "),
    artifact.qstBoundary.caveats.join(" "),
  ].join(" ");
  if (/CL4 support|real wormhole|proves ER=EPR/i.test(joined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tiny SYK artifact contains forbidden overclaim language",
    });
  }
});

export type TinySykSolverArtifact = z.infer<typeof tinySykSolverArtifactSchema>;
