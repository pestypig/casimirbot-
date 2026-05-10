import { z } from "zod";

import {
  erEprCouplingSchema,
  erEprInitialStateSchema,
  erEprModelFamilySchema,
  erEprSimulationInputSchema,
  erEprSimulationVerdictSchema,
} from "./er-epr-simulation";
import { quantumSpacetimeCongruenceInputSchema } from "./quantum-spacetime-congruence";

const nonEmptyStringArray = z.array(z.string().min(1)).min(1);

export const erEprSimulationRunArtifactSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    runId: z.string().min(1),
    createdAt: z.string().datetime(),
    modelFamily: erEprModelFamilySchema,
    nQubitsOrModes: z.number().int().positive(),
    initialState: erEprInitialStateSchema,
    coupling: erEprCouplingSchema,
    hamiltonianRef: z.string().min(1).optional(),
    modelRef: z.string().min(1).optional(),
    hamiltonianHash: z.string().min(1).optional(),
    seed: z.union([z.string().min(1), z.number().int()]).optional(),
    inputHash: z.string().min(1),
    thresholds: z
      .object({
        signalMin: z.number().finite().min(0).max(1).optional(),
        controlMax: z.number().finite().min(0).max(1).optional(),
        diagnosticMin: z.number().finite().min(0).max(1).optional(),
        entropyAreaTrackingMin: z.number().finite().min(0).max(1).optional(),
        entropyVisibilityMin: z.number().finite().min(0).max(1).optional(),
        strongSupportMin: z.number().finite().min(0).max(1).optional(),
      })
      .passthrough(),
    rawObservables: z.record(z.unknown()),
    normalizedObservables: erEprSimulationInputSchema.shape.observables,
    controls: z.record(z.unknown()),
    qstEntropyStretch: quantumSpacetimeCongruenceInputSchema.shape.entropyStretch,
    evaluation: z
      .object({
        evidence: z
          .object({
            verdict: erEprSimulationVerdictSchema,
            claimIds: nonEmptyStringArray,
            citations: nonEmptyStringArray,
          })
          .passthrough(),
      })
      .passthrough(),
    claimIds: nonEmptyStringArray,
    citations: nonEmptyStringArray,
    caveats: nonEmptyStringArray,
    reproducibilityStatus: z.enum(["fixture_only", "simulated", "reproduced", "failed"]),
  })
  .refine((artifact) => Boolean(artifact.hamiltonianRef || artifact.modelRef), {
    message: "Either hamiltonianRef or modelRef is required.",
    path: ["modelRef"],
  });

export type ErEprSimulationRunArtifact = z.infer<typeof erEprSimulationRunArtifactSchema>;
