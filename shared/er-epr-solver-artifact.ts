import { z } from "zod";

export const erEprSolverAdapterArtifactSchema = z.object({
  schemaVersion: z.literal("er-epr-solver-adapter-result.v1"),
  adapterRunId: z.string().min(1),
  createdAt: z.string().datetime(),
  raw: z.any(),
  normalizedInput: z.any(),
  evaluation: z.any(),
  evidence: z.object({
    stage: z.literal("ER_EPR_STAGE1_SOLVER_ADAPTER_V1"),
    claimTier: z.enum([
      "fixture_only_solver_adapter",
      "solver_simulated_model_internal_adapter",
      "externally_reproduced_model_internal_adapter",
      "failed_solver_adapter",
    ]),
    claimIds: z.array(z.string().min(1)).min(1),
    citations: z.array(z.string().min(1)).min(1),
    sourceRoles: z.record(z.string()),
    uncertaintyNotes: z.array(z.string().min(1)).min(1),
  }),
  qstBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    caveats: z.array(z.string().min(1)).min(1),
  }),
}).superRefine((artifact, ctx) => {
  const status = artifact.raw?.provenance?.reproducibilityStatus;
  if (
    artifact.evidence.claimTier === "solver_simulated_model_internal_adapter" &&
    status !== "solver_simulated"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "solver_simulated claim tier requires solver_simulated raw provenance",
    });
  }
  if (
    status === "solver_simulated" &&
    (!artifact.raw?.model?.hamiltonianHash || artifact.raw?.model?.seed === undefined)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "solver_simulated raw telemetry requires hamiltonianHash and seed",
    });
  }
});

export type ErEprSolverAdapterArtifact = z.infer<typeof erEprSolverAdapterArtifactSchema>;
