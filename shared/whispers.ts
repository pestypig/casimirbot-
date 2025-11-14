import { z } from "zod";

/**
 * Next-gen whisper context shared by client & server scoring.
 * Allows blending telemetry, per-panel context, and canonical hash.
 */
export const whisperContextZ = z.object({
  hash: z.string(),
  ts: z.number().default(() => Date.now()),
  telemetry: z.record(z.any()).optional(),
  panel: z.record(z.any()).optional(),
});

export const whisperSeedZ = z.object({
  id: z.string(),
  text: z.string(),
  tags: z.array(z.string()).default([]),
  when: z
    .array(
      z.object({
        key: z.string(),
        op: z.enum(["<", "<=", "==", ">=", ">"]),
        value: z.number(),
      }),
    )
    .default([]),
  priority: z.number().default(0),
  mode: z.enum(["bubble", "speak", "both"]).default("bubble"),
});

export const whisperZ = z.object({
  id: z.string(),
  zen: z.string(),
  body: z.string(),
  action: z.string().optional(),
  hashes: z.array(z.string()).default([]),
  score: z.number(),
  mode: z.enum(["bubble", "speak", "both"]).default("bubble"),
  source: z.enum(["local", "remote"]).default("local"),
  severity: z.enum(["hint", "info", "warn"]).default("hint"),
  refs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type WhisperContext = z.infer<typeof whisperContextZ>;
export type WhisperSeed = z.infer<typeof whisperSeedZ>;
export type Whisper = z.infer<typeof whisperZ>;

/**
 * Legacy Luma whisper schema (pre-score). Retained for compatibility while the
 * new scored whisper pipeline is phased in.
 */
export const LumaSignal = z.object({
  dutyEffectiveFR: z.number().optional(),
  sectorCount: z.number().optional(),
  qCavity: z.number().optional(),
  modulationFreq_GHz: z.number().optional(),
  gammaGeo: z.number().optional(),
  zeta: z.number().optional(),
  staySubThreshold: z.boolean().optional(),
});

export const LumaContext = z.object({
  hash: z.string().optional(),
  panel: z.string().optional(),
  signals: LumaSignal.optional(),
});

const whisperRuleZ = z
  .object({
    anyHash: z.array(z.string()).optional(),
    minZeta: z.number().optional(),
    maxZeta: z.number().optional(),
    minQ: z.number().optional(),
    maxDuty: z.number().optional(),
    requireSubThreshold: z.boolean().optional(),
  })
  .default({});

export const LumaWhisper = z.object({
  id: z.string(),
  tags: z.array(z.string()).default([]),
  hashes: z.array(z.string()).default([]),
  severity: z.enum(["hint", "info", "warn"]).default("hint"),
  mode: z.enum(["bubble", "speak", "both"]).default("bubble"),
  zen: z.string(),
  body: z.string(),
  action: z.string().optional(),
  score: z.number().min(0).max(1).default(0.5),
  rule: whisperRuleZ,
  refs: z.array(z.string()).default([]),
  source: z.enum(["local", "remote"]).default("local"),
});

export const LumaWhisperList = z.array(LumaWhisper);

export type TLumaContext = z.infer<typeof LumaContext>;
export type TLumaWhisper = z.infer<typeof LumaWhisper>;
