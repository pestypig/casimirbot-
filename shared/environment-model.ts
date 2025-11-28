import { z } from "zod";

/**
 * EnvironmentModel captures session-level context the debate/agents share.
 * Keep this lightweight so it can be emitted alongside InformationEvent tags.
 */
export const EnvironmentModel = z.object({
  session_id: z.string(),
  task: z.string().optional(),
  repo: z.string().optional(),
  mode: z.string().optional(),
  user_tags: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  environment_tags: z.array(z.string()).default([]),
  updated_at: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TEnvironmentModel = z.infer<typeof EnvironmentModel>;

export const EnvironmentAlignment = z.object({
  hypothesis_id: z.string(),
  alignment: z.number().min(-1).max(1).default(0),
  reasons: z.array(z.string()).default([]),
  evidence: z.record(z.unknown()).optional(),
});

export type TEnvironmentAlignment = z.infer<typeof EnvironmentAlignment>;
