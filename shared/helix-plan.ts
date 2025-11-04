import { z } from "zod";

export const HELIX_PLAN_VERSION = "1.0" as const;

const peakSchema = z
  .object({
    f: z.number().min(5).max(20_000),
    q: z.number().min(0.1).max(50),
    gain: z.number().min(0).max(2),
  })
  .strict();

const setPeaksSchema = z
  .object({
    op: z.literal("set_peaks"),
    peaks: z.array(peakSchema).min(1).max(12),
    mode: z.enum(["absolute", "relative"]).default("absolute"),
  })
  .strict();

const setRcSchema = z
  .object({
    op: z.literal("set_rc"),
    rc: z.number().min(0.01).max(1),
  })
  .strict();

const setWeirdnessSchema = z
  .object({
    op: z.literal("set_T"),
    T: z.number().min(0.01).max(1),
  })
  .strict();

const moveWarpBubbleSchema = z
  .object({
    op: z.literal("move_bubble"),
    dx: z.number().min(-1).max(1),
    dy: z.number().min(-1).max(1),
    speed: z.number().min(0).max(1).default(0.2),
    confirm: z.boolean().default(true),
  })
  .strict();

const sweepSchema = z
  .object({
    op: z.literal("sweep"),
    param: z.enum(["rc", "T", "peak_gain", "peak_q"]),
    values: z.array(z.number()).min(2).max(12),
    measure: z.enum(["MI", "PSD", "dwell"]).default("PSD"),
  })
  .strict();

const explainSchema = z
  .object({
    op: z.literal("explain"),
    why: z.string().min(3),
  })
  .strict();

export const helixPlanActionSchema = z.discriminatedUnion("op", [
  setPeaksSchema,
  setRcSchema,
  setWeirdnessSchema,
  moveWarpBubbleSchema,
  sweepSchema,
  explainSchema,
]);

export type HelixPlanAction = z.infer<typeof helixPlanActionSchema>;

export const helixPlanSchema = z
  .object({
    version: z.literal(HELIX_PLAN_VERSION),
    plan_id: z.string().uuid().optional(),
    intent: z.string().min(1).max(240).optional(),
    actions: z.array(helixPlanActionSchema).min(1).max(8),
  })
  .strict();

export type HelixPlan = z.infer<typeof helixPlanSchema>;

export const helixSurfaceStateSchema = z
  .object({
    seed: z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).optional(),
    branch: z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).optional(),
    rc: z.number().min(0).max(1).optional(),
    T: z.number().min(0).max(1).optional(),
    peaks: z
      .object({
        count: z.number().int().min(0).max(32),
      })
      .optional(),
    capabilities: z.array(z.string().max(64)).max(64).optional(),
    lastIntent: z.string().max(240).optional(),
  })
  .strict();

export type HelixSurfaceState = z.infer<typeof helixSurfaceStateSchema>;

export const helixPlanJsonSchema = {
  $id: "https://helix/schema/plan",
  type: "object",
  required: ["version", "actions"],
  properties: {
    version: { type: "string", const: HELIX_PLAN_VERSION },
    plan_id: { type: "string", format: "uuid" },
    intent: { type: "string", description: "High-level user goal (free text)" },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { $ref: "#/$defs/Action" },
    },
  },
  $defs: {
    Action: {
      type: "object",
      oneOf: [
        { $ref: "#/$defs/SetPeaks" },
        { $ref: "#/$defs/SetRC" },
        { $ref: "#/$defs/SetWeirdness" },
        { $ref: "#/$defs/MoveWarpBubble" },
        { $ref: "#/$defs/Sweep" },
        { $ref: "#/$defs/Explain" },
      ],
    },
    Peak: {
      type: "object",
      required: ["f", "q", "gain"],
      properties: {
        f: { type: "number", minimum: 5, maximum: 20_000 },
        q: { type: "number", minimum: 0.1, maximum: 50 },
        gain: { type: "number", minimum: 0, maximum: 2 },
      },
    },
    SetPeaks: {
      type: "object",
      required: ["op", "peaks"],
      properties: {
        op: { const: "set_peaks" },
        peaks: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: { $ref: "#/$defs/Peak" },
        },
        mode: {
          type: "string",
          enum: ["absolute", "relative"],
          default: "absolute",
        },
      },
    },
    SetRC: {
      type: "object",
      required: ["op", "rc"],
      properties: {
        op: { const: "set_rc" },
        rc: { type: "number", minimum: 0.01, maximum: 1 },
      },
    },
    SetWeirdness: {
      type: "object",
      required: ["op", "T"],
      properties: {
        op: { const: "set_T" },
        T: { type: "number", minimum: 0.01, maximum: 1 },
      },
    },
    MoveWarpBubble: {
      type: "object",
      required: ["op", "dx", "dy"],
      properties: {
        op: { const: "move_bubble" },
        dx: { type: "number", minimum: -1, maximum: 1 },
        dy: { type: "number", minimum: -1, maximum: 1 },
        speed: { type: "number", minimum: 0, maximum: 1, default: 0.2 },
        confirm: { type: "boolean", default: true },
      },
    },
    Sweep: {
      type: "object",
      required: ["op", "param", "values"],
      properties: {
        op: { const: "sweep" },
        param: { enum: ["rc", "T", "peak_gain", "peak_q"] },
        values: {
          type: "array",
          minItems: 2,
          maxItems: 12,
          items: { type: "number" },
        },
        measure: { enum: ["MI", "PSD", "dwell"], default: "PSD" },
      },
    },
    Explain: {
      type: "object",
      required: ["op", "why"],
      properties: {
        op: { const: "explain" },
        why: { type: "string", minLength: 3 },
      },
    },
  },
} as const satisfies Record<string, unknown>;

export type HelixPlanJsonSchema = typeof helixPlanJsonSchema;
