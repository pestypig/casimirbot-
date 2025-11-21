import { z } from "zod";

export const DebateRole = z.enum(["proponent", "skeptic", "referee"]);

const DEFAULT_MAX_ROUNDS = Number(process.env.DEBATE_MAX_ROUNDS ?? 6);
const DEFAULT_MAX_WALL_MS = Number(process.env.DEBATE_MAX_WALL_MS ?? 900000);
const ENV_VERIFIERS = (process.env.DEBATE_VERIFIERS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_VERIFIERS =
  ENV_VERIFIERS.length > 0
    ? ENV_VERIFIERS
    : [
        "citation.verify.span",
        "numeric.extract.units",
        "math.sympy.verify",
        "docs.evidence.search.md",
        "docs.evidence.search.pdf",
        "contradiction.scan",
        "telemetry.crosscheck.docs",
        "debate.checklist.score",
      ];

export const DebateAttachment = z.object({
  title: z.string(),
  url: z.string(),
});

export const DebateContext = z.object({
  resonance_patch: z.any().optional(),
  telemetry_summary: z.any().optional(),
  knowledge_hints: z.any().optional(),
  planner_prompt: z.string().optional(),
  attachments: z.array(DebateAttachment).optional(),
});
export type TDebateContext = z.infer<typeof DebateContext>;

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
  context: DebateContext.optional(),
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

export const DEBATE_TOOL_NAME = "debate.run" as const;
