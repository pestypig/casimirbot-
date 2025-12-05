import { z } from "zod";
import { TelemetrySnapshot } from "./star-telemetry";
import type { WarpConfig, WarpSnapshot } from "../types/warpViability";

export const DebateRole = z.enum(["proponent", "skeptic", "referee"]);
export const ViabilityStatus = z.enum(["ADMISSIBLE", "MARGINAL", "INADMISSIBLE", "NOT_CERTIFIED"]);

const DEFAULT_MAX_ROUNDS = Number(process.env.DEBATE_MAX_ROUNDS ?? 6);
// Default wall-clock budget for a debate: 20 minutes unless overridden by env.
const DEFAULT_MAX_WALL_MS = Number(process.env.DEBATE_MAX_WALL_MS ?? 20 * 60 * 1000);
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

export const WarpConstraintEvidence = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(["HARD", "SOFT"]),
  passed: z.boolean(),
  lhs: z.number().optional(),
  rhs: z.number().optional(),
  margin: z.number().nullable().optional(),
});

const WarpConfigSchema = z.object({
  bubbleRadius_m: z.number().optional(),
  wallThickness_m: z.number().optional(),
  targetVelocity_c: z.number().optional(),
  tileConfigId: z.string().optional(),
  tileCount: z.number().optional(),
  dutyCycle: z.number().optional(),
  gammaGeoOverride: z.number().optional(),
});

const WarpSnapshotSchema = z
  .object({
    TS_ratio: z.number().optional(),
    gamma_VdB: z.number().optional(),
    d_eff: z.number().optional(),
    U_static: z.number().optional(),
    T00_min: z.number().optional(),
    M_exotic: z.number().optional(),
    thetaCal: z.number().optional(),
    gamma_geo_cubed: z.number().optional(),
    T00_avg: z.number().optional(),
  })
  .catchall(z.number());

const WarpGroundingBase = z.object({
  status: ViabilityStatus.optional(),
  viabilityStatus: ViabilityStatus.optional(), // legacy alias accepted on input
  summary: z.string().optional(),
  config: WarpConfigSchema.nullish().optional(),
  snapshot: WarpSnapshotSchema.nullish().optional(),
  constraints: z.array(WarpConstraintEvidence).optional(),
  certificateHash: z.string().optional(),
  certificateId: z.string().optional(),
  citations: z.array(z.string()).optional(),
  askAnswer: z.string().optional(),
});

export const WarpGrounding = WarpGroundingBase.transform((value) => ({
  status: value.status ?? value.viabilityStatus ?? "NOT_CERTIFIED",
  summary: value.summary ?? "",
  config: value.config ?? undefined,
  snapshot: (value.snapshot ?? {}) as WarpSnapshot,
  constraints: value.constraints ?? [],
  certificateHash: value.certificateHash ?? undefined,
  certificateId: value.certificateId ?? undefined,
  citations: value.citations ?? undefined,
  askAnswer: value.askAnswer ?? undefined,
}));

// Backward-compatible alias
export const WarpGroundingEvidence = WarpGrounding;

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
  warp_grounding: WarpGroundingEvidence.optional(),
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

export type TViabilityStatus = z.infer<typeof ViabilityStatus>;
export type TWarpConstraintEvidence = z.infer<typeof WarpConstraintEvidence>;
export type TWarpGrounding = z.infer<typeof WarpGrounding>;
export type TWarpGroundingEvidence = TWarpGrounding;
export type TWarpConfig = WarpConfig;
export type TWarpSnapshot = WarpSnapshot;
export type TDebateConfig = z.infer<typeof DebateConfig>;
export type TDebateTurn = z.infer<typeof DebateTurn>;
export type TDebateOutcome = z.infer<typeof DebateOutcome>;

export const DEBATE_TOOL_NAME = "debate.run" as const;
