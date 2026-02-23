import { z } from "zod";

export const EVOLUTION_SCHEMA_VERSION = "evolution/1" as const;

export const evolutionPatchSchema = z.object({
  schemaVersion: z.literal(EVOLUTION_SCHEMA_VERSION).default(EVOLUTION_SCHEMA_VERSION),
  patchId: z.string().min(1),
  timestamp: z.string().min(1),
  touchedPaths: z.array(z.string().min(1)).default([]),
  intentTags: z.array(z.string().min(1)).default([]),
});

export const evolutionMomentumSchema = z.object({
  schemaVersion: z.literal(EVOLUTION_SCHEMA_VERSION).default(EVOLUTION_SCHEMA_VERSION),
  patchId: z.string().min(1),
  components: z.object({
    scope: z.number(),
    subsystem: z.number(),
    coupling: z.number(),
    test: z.number(),
    uncertainty: z.number(),
  }),
});

export const evolutionConstraintSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(["HARD", "SOFT"]),
  status: z.enum(["pass", "warn", "fail"]),
  value: z.union([z.string(), z.number(), z.null()]).optional(),
  limit: z.union([z.string(), z.number(), z.null()]).optional(),
  note: z.string().optional(),
});

export const evolutionDeltaSchema = z.object({
  id: z.string().min(1),
  before: z.number(),
  after: z.number(),
  delta: z.number(),
});

export const evolutionArtifactSchema = z.object({
  kind: z.string().min(1),
  ref: z.string().min(1),
});

export const evolutionCongruenceSchema = z.object({
  schemaVersion: z.literal(EVOLUTION_SCHEMA_VERSION).default(EVOLUTION_SCHEMA_VERSION),
  verdict: z.enum(["PASS", "WARN", "FAIL"]),
  firstFail: evolutionConstraintSchema.nullable().default(null),
  deltas: z.array(evolutionDeltaSchema).default([]),
  artifacts: z.array(evolutionArtifactSchema).default([]),
});

export const evolutionChecklistSchema = z.object({
  schema_version: z.literal("helix_agent_patch_checklist_addendum/1"),
  patchId: z.string().min(1),
  intentTags: z.array(z.string()).default([]),
  mandatory_reads: z.array(z.string()).default([]),
  required_tests: z.array(z.string()).default([]),
  verification_hooks: z.array(z.string()).default([]),
  agent_steps: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

export type EvolutionPatch = z.infer<typeof evolutionPatchSchema>;
export type EvolutionMomentum = z.infer<typeof evolutionMomentumSchema>;
export type EvolutionCongruence = z.infer<typeof evolutionCongruenceSchema>;
export type EvolutionChecklist = z.infer<typeof evolutionChecklistSchema>;

export const evolutionConfigSchema = z.object({
  version: z.literal(1),
  intentVector: z.array(z.number()).default([1, 1, 1, 1, 1]),
  weights: z.object({
    wI: z.number().default(0.25),
    wA: z.number().default(0.25),
    wP: z.number().default(0.2),
    wE: z.number().default(0.2),
    wD: z.number().default(0.1),
  }).default({}),
  thresholds: z.object({
    passMin: z.number().default(75),
    diagnosticMin: z.number().default(65),
  }).default({}),
});

export type EvolutionConfig = z.infer<typeof evolutionConfigSchema>;
