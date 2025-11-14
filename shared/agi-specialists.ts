import { z } from "zod";

/** Natural language goal + optional structured input */
export const ProblemStatement = z.object({
  id: z.string(),
  persona_id: z.string(),
  goal: z.string(),
  context: z.record(z.any()).optional(),
});

export const SolverInput = z.object({
  problem: ProblemStatement,
  params: z.record(z.any()).default({}),
});

export const SolverOutput = z.object({
  summary: z.string(),
  data: z.any().optional(), // typed object (domain-specific)
  artifacts: z
    .array(
      z.object({
        kind: z.enum(["text", "json", "image", "audio", "binary"]),
        uri: z.string(),
        cid: z.string().optional(),
        hash: z
          .object({
            algo: z.string(),
            value: z.string(),
          })
          .optional(),
      }),
    )
    .default([]),
  essence_ids: z.array(z.string()).default([]),
});

export const VerifierInput = z.object({
  problem: ProblemStatement,
  solver_output: SolverOutput,
});

export const CheckResult = z.object({
  ok: z.boolean(),
  reason: z.string().default(""),
  metrics: z.record(z.number()).default({}), // e.g., compile_rate, unit_ok
  citations: z.array(z.string()).default([]), // Essence IDs or URIs
});

export const RepairAction = z.object({
  suggested_params: z.record(z.any()).default({}),
  note: z.string().default(""),
});

/** Registry specs */
export const SolverSpec = z.object({
  name: z.string(),
  desc: z.string(),
  inputSchema: z.custom<typeof SolverInput>(() => true),
  outputSchema: z.custom<typeof SolverOutput>(() => true),
});

export const VerifierSpec = z.object({
  name: z.string(),
  desc: z.string(),
  inputSchema: z.custom<typeof VerifierInput>(() => true),
  outputSchema: z.custom<typeof CheckResult>(() => true),
});

export type TProblemStatement = z.infer<typeof ProblemStatement>;
export type TSolverInput = z.infer<typeof SolverInput>;
export type TSolverOutput = z.infer<typeof SolverOutput>;
export type TVerifierInput = z.infer<typeof VerifierInput>;
export type TCheckResult = z.infer<typeof CheckResult>;
export type TRepairAction = z.infer<typeof RepairAction>;
