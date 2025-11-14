import { z } from "zod";

// Lightweight, portable routine schema for agent instructions.
// Stored on task_trace.routine_json and surfaced in trace export.

export const OutputSchema = z
  .object({
    type: z.enum(["object", "array", "string", "number", "boolean", "null"]).optional(),
    // When type === "object", these apply
    required: z.array(z.string()).optional(),
    properties: z.record(z.any()).optional(),
  })
  .optional();

export const Routine = z.object({
  id: z.string().optional(),
  name: z.string(),
  version: z.string(),
  persona: z.string().optional(),
  steps: z.array(z.string()).default([]),
  guardrails: z
    .object({
      hints: z.array(z.string()).default([]),
    })
    .default({}),
  knobs: z
    .object({
      // Max executor steps to run (best-effort enforcement)
      max_turns: z.number().int().positive().max(250).optional(),
      // Shape expectation for the final output
      final_output: OutputSchema,
    })
    .default({}),
});

export type TRoutine = z.infer<typeof Routine>;

