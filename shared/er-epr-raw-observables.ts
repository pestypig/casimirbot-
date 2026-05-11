import { z } from "zod";

export const erEprSolverBackendSchema = z.enum([
  "two_sided_syk_tiny_exact_diag",
  "two_sided_sparse_syk_import",
  "jt_gravity_fixture_import",
  "tensor_network_ads_toy",
  "random_matrix_control",
  "spin_chain_control",
]);

export type ErEprSolverBackend = z.infer<typeof erEprSolverBackendSchema>;

export const erEprRawSolverObservablesSchema = z.object({
  schemaVersion: z.literal("er-epr-raw-solver-observables.v1"),
  runId: z.string().min(1),
  createdAt: z.string().datetime(),
  backend: erEprSolverBackendSchema,
  model: z.object({
    nQubitsOrModes: z.number().int().positive(),
    qBodyOrder: z.number().int().positive().optional(),
    beta: z.number().nonnegative().optional(),
    temperatureRegime: z.enum(["low", "intermediate", "high"]),
    statePreparation: z.enum([
      "thermofield_double",
      "partially_entangled",
      "disentangled_control",
      "random_control",
    ]),
    coupling: z.enum([
      "double_trace_correct_sign",
      "double_trace_wrong_sign",
      "none",
    ]),
    hamiltonianHash: z.string().min(1).optional(),
    seed: z.number().int().optional(),
  }),
  rawTelemetry: z.object({
    leftRightMutualInformation: z.number().nonnegative().optional(),
    entanglementEntropy_nats: z.number().nonnegative().optional(),
    injectionTime: z.number().optional(),
    couplingTime: z.number().optional(),
    extractionTime: z.number().optional(),
    teleportationFidelityRaw: z.number().optional(),
    preCouplingLeakageRaw: z.number().optional(),
    wrongSignFidelityRaw: z.number().optional(),
    noCouplingFidelityRaw: z.number().optional(),
    disentangledFidelityRaw: z.number().optional(),
    shuffledHamiltonianFidelityRaw: z.number().optional(),
    twoPointCorrelator: z.array(z.number()).optional(),
    outOfTimeOrderCorrelator: z.array(z.number()).optional(),
    spectralFormFactor: z.array(z.number()).optional(),
    operatorSizeCurve: z.array(z.object({
      time: z.number(),
      size: z.number().nonnegative(),
    })).optional(),
    timeDelayEstimate: z.number().optional(),
    causalOrderingPass: z.boolean().optional(),
  }),
  normalization: z.object({
    thresholdProfileId: z.string().min(1),
    teleportationFidelityScale: z.literal("0_to_1"),
    diagnosticsScale: z.literal("0_to_1"),
    notes: z.array(z.string().min(1)).min(1),
  }),
  provenance: z.object({
    reproducibilityStatus: z.enum([
      "fixture_only",
      "solver_simulated",
      "externally_reproduced",
      "failed",
    ]),
    claimIds: z.array(z.string().min(1)).min(1),
    citations: z.array(z.string().min(1)).min(1),
    caveats: z.array(z.string().min(1)).min(1),
  }),
});

export type ErEprRawSolverObservables = z.infer<typeof erEprRawSolverObservablesSchema>;

export function parseErEprRawSolverObservables(value: unknown): ErEprRawSolverObservables {
  return erEprRawSolverObservablesSchema.parse(value);
}
