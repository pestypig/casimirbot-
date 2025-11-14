import { z } from "zod";

export const DebateRole = z.enum(["proponent", "skeptic", "referee"]);

const DEFAULT_MAX_ROUNDS = Number(process.env.DEBATE_MAX_ROUNDS ?? 6);
const DEFAULT_MAX_WALL_MS = Number(process.env.DEBATE_MAX_WALL_MS ?? 900000);
const DEFAULT_VERIFIERS = (process.env.DEBATE_VERIFIERS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DebateConfig = z.object({
  goal: z.string(),
  persona_id: z.string(),
  max_rounds: z
    .number()
    .int()
    .positive()
    .default(Number.isFinite(DEFAULT_MAX_ROUNDS) ? DEFAULT_MAX_ROUNDS : 6),
  max_wall_ms: z
    .number()
    .int()
    .positive()
    .default(Number.isFinite(DEFAULT_MAX_WALL_MS) ? DEFAULT_MAX_WALL_MS : 900000),
  verifiers: z
    .array(z.string())
    .default(DEFAULT_VERIFIERS.length ? DEFAULT_VERIFIERS : []),
});

export const DebateTurn = z.object({
  id: z.string(),
  debate_id: z.string(),
  round: z.number().int().nonnegative(),
  role: DebateRole,
  text: z.string(),
  citations: z.array(z.string()).default([]),
  verifier_results: z
    .array(
      z.object({
        name: z.string(),
        ok: z.boolean(),
        reason: z.string().default(""),
      }),
    )
    .default([]),
  created_at: z.string(),
});

export const DebateOutcome = z.object({
  debate_id: z.string(),
  verdict: z.string(),
  confidence: z.number().min(0).max(1).default(0.5),
  winning_role: DebateRole.optional(),
  key_turn_ids: z.array(z.string()).default([]),
  created_at: z.string(),
});

export type TDebateConfig = z.infer<typeof DebateConfig>;
export type TDebateTurn = z.infer<typeof DebateTurn>;
export type TDebateOutcome = z.infer<typeof DebateOutcome>;
