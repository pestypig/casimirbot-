import { z } from "zod";
import {
  grConstraintPolicySchema,
  grConstraintThresholdSchema,
} from "../../shared/schema.js";

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
const grUnitSystemSchema = z.enum(["SI", "geometric"]);

const grAgentLoopProposalSchema = z.object({
  label: z.string().optional(),
  params: z.record(z.unknown()).optional(),
});

const grAgentLoopStrategySchema = z.object({
  dutyDecay: z.number().positive().optional(),
  gammaGeoDecay: z.number().positive().optional(),
  gammaVdBDecay: z.number().positive().optional(),
  qSpoilGrow: z.number().positive().optional(),
});

const grAgentLoopGrParamsSchema = z.object({
    dims: z
      .tuple([
        z.number().int().positive(),
        z.number().int().positive(),
        z.number().int().positive(),
      ])
      .optional(),
    bounds: z
      .object({
        min: vec3Schema,
        max: vec3Schema,
      })
      .optional(),
    unitSystem: grUnitSystemSchema.optional(),
    stencils: z.record(z.unknown()).optional(),
    gauge: z.record(z.unknown()).optional(),
    boundary: z.record(z.unknown()).optional(),
    fixups: z.record(z.unknown()).optional(),
    includeExtra: z.boolean().optional(),
    includeMatter: z.boolean().optional(),
    includeKij: z.boolean().optional(),
    initialIterations: z.number().int().nonnegative().optional(),
    initialTolerance: z.number().nonnegative().optional(),
    evolveSteps: z.number().int().positive().optional(),
    evolveDt_s: z.number().positive().optional(),
    evolveIterations: z.number().int().nonnegative().optional(),
    evolveTolerance: z.number().nonnegative().optional(),
  });

const grAgentLoopBudgetSchema = z.object({
  maxTotalMs: z.number().nonnegative().optional(),
  maxAttemptMs: z.number().nonnegative().optional(),
});

const grAgentLoopEscalationSchema = z.object({
  enabled: z.boolean().optional(),
  dimsScale: z.number().positive().optional(),
  stepsScale: z.number().positive().optional(),
  initialIterationsScale: z.number().positive().optional(),
  evolveIterationsScale: z.number().positive().optional(),
  maxDims: z
    .tuple([
      z.number().int().positive(),
      z.number().int().positive(),
      z.number().int().positive(),
    ])
    .optional(),
  maxSteps: z.number().int().positive().optional(),
  maxInitialIterations: z.number().int().nonnegative().optional(),
  maxEvolveIterations: z.number().int().nonnegative().optional(),
  includeExtraAfter: z.number().int().nonnegative().optional(),
});

export const grAgentLoopOptionsSchema = z.object({
    maxIterations: z.number().int().min(1).max(50).optional(),
    proposals: z.array(grAgentLoopProposalSchema).optional(),
    strategy: grAgentLoopStrategySchema.optional(),
    warpConfig: z.record(z.unknown()).optional(),
    thresholds: grConstraintThresholdSchema.partial().optional(),
    policy: grConstraintPolicySchema.partial().optional(),
    useLiveSnapshot: z.boolean().optional(),
    commitAccepted: z.boolean().optional(),
    budget: grAgentLoopBudgetSchema.optional(),
    escalation: grAgentLoopEscalationSchema.optional(),
    gr: grAgentLoopGrParamsSchema.optional(),
  });

export type GrAgentLoopOptionsInput = z.infer<
  typeof grAgentLoopOptionsSchema
>;
