import { z } from "zod";
import { TelemetrySnapshot } from "./star-telemetry";

export const DebateRole = z.enum(["proponent", "skeptic", "referee"]);

const DEFAULT_MAX_ROUNDS = Number(process.env.DEBATE_MAX_ROUNDS ?? 6);
const DEFAULT_MAX_WALL_MS = Number(process.env.DEBATE_MAX_WALL_MS ?? 900000);
const DEFAULT_SATISFACTION_THRESHOLD = Number(process.env.DEBATE_SATISFACTION_THRESHOLD ?? 0.75);
const DEFAULT_MIN_IMPROVEMENT = Number(process.env.DEBATE_MIN_IMPROVEMENT ?? 0.03);
const DEFAULT_STAGNATION_ROUNDS = Number(process.env.DEBATE_STAGNATION_ROUNDS ?? 2);
const DEFAULT_MAX_TOOL_CALLS = Number(process.env.DEBATE_MAX_TOOL_CALLS ?? 12);
const DEFAULT_NOVELTY_EPSILON = Number(process.env.DEBATE_NOVELTY_EPSILON ?? 0.05);
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
  coherence_snapshot: TelemetrySnapshot.optional(),
  coherence_governor: z.any().optional(),
  knowledge_hints: z.any().optional(),
  environment_tags: z.array(z.string()).optional(),
  environment_alignment: z.number().min(-1).max(1).optional(),
  planner_prompt: z.string().optional(),
  attachments: z.array(DebateAttachment).optional(),
});
export type TDebateContext = z.infer<typeof DebateContext>;

const clamp01 = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const DebateRoundMetrics = z.object({
  round: z.number().int().nonnegative(),
  verifier_pass: z.number().min(0).max(1),
  coverage: z.number().min(0).max(1),
  stability: z.number().min(0).max(1),
  novelty_gain: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
  improvement: z.number(),
  flags: z.number().int().nonnegative(),
  tool_calls: z.number().int().nonnegative().optional(),
  time_used_ms: z.number().nonnegative().optional(),
  time_left_ms: z.number().nonnegative().optional(),
});
export type TDebateRoundMetrics = z.infer<typeof DebateRoundMetrics>;

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
  max_tool_calls: z
    .number()
    .int()
    .positive()
    .default(Number.isFinite(DEFAULT_MAX_TOOL_CALLS) ? DEFAULT_MAX_TOOL_CALLS : 12),
  satisfaction_threshold: z
    .number()
    .min(0)
    .max(1)
    .default(clamp01(DEFAULT_SATISFACTION_THRESHOLD, 0.75)),
  min_improvement: z
    .number()
    .min(0)
    .max(1)
    .default(clamp01(DEFAULT_MIN_IMPROVEMENT, 0.03)),
  stagnation_rounds: z
    .number()
    .int()
    .positive()
    .default(Number.isFinite(DEFAULT_STAGNATION_ROUNDS) ? DEFAULT_STAGNATION_ROUNDS : 2),
  novelty_epsilon: z.number().min(0).max(1).default(clamp01(DEFAULT_NOVELTY_EPSILON, 0.05)),
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
  rounds: z.number().int().nonnegative().default(0),
  score: z.number().min(0).max(1).default(0),
  stop_reason: z.string().optional(),
  metrics: DebateRoundMetrics.optional(),
  created_at: z.string(),
});

export type TDebateConfig = z.infer<typeof DebateConfig>;
export type TDebateTurn = z.infer<typeof DebateTurn>;
export type TDebateOutcome = z.infer<typeof DebateOutcome>;

export const DEBATE_TOOL_NAME = "debate.run" as const;
