import { z } from "zod";
import { CurvatureBoundaryCondition2D } from "./essence-physics";
import { TokamakPrecursorScoreKey } from "./tokamak-precursor";

export const TokamakSimStatus = z.enum([
  "idle",
  "running",
  "paused",
  "completed",
  "error",
]);

export type TTokamakSimStatus = z.infer<typeof TokamakSimStatus>;

export const TokamakSimCommandAction = z.enum([
  "start",
  "pause",
  "resume",
  "stop",
  "step",
  "apply_config",
  "load_dataset",
]);

export type TTokamakSimCommandAction = z.infer<typeof TokamakSimCommandAction>;

export const TokamakSimConfig = z
  .object({
    drive_hz: z.number().positive().optional(),
    max_link_distance_m: z.number().positive().optional(),
    boundary: CurvatureBoundaryCondition2D.optional(),
    score_key: TokamakPrecursorScoreKey.optional(),
    notes: z.string().optional(),
  })
  .default({});

export type TTokamakSimConfig = z.infer<typeof TokamakSimConfig>;

export const TokamakSimTelemetry = z.object({
  frame_id: z.string().optional(),
  timestamp_iso: z.string().optional(),
  frame_index: z.number().int().nonnegative().optional(),
  k0: z.number().nonnegative().optional(),
  k1: z.number().nonnegative().optional(),
  k2: z.number().nonnegative().optional(),
  k3: z.number().min(0).max(1).optional(),
  fragmentation_rate: z.number().nonnegative().optional(),
  ridge_count: z.number().int().nonnegative().optional(),
  score: z.number().optional(),
  event_present: z.boolean().optional(),
});

export type TTokamakSimTelemetry = z.infer<typeof TokamakSimTelemetry>;

export const TokamakSimState = z.object({
  status: TokamakSimStatus,
  updated_at: z.string().datetime(),
  dataset_path: z.string().optional(),
  run_id: z.string().optional(),
  error: z.string().optional(),
  config: TokamakSimConfig,
  telemetry: TokamakSimTelemetry.optional(),
  report: z
    .object({
      auc: z.number().min(0).max(1).nullable().optional(),
      report_hash: z.string().optional(),
    })
    .optional(),
  last_command: z
    .object({
      action: TokamakSimCommandAction,
      issued_at: z.string().datetime(),
      params: z.record(z.any()).optional(),
    })
    .optional(),
});

export type TTokamakSimState = z.infer<typeof TokamakSimState>;

export const TokamakSimCommandInput = z.object({
  action: TokamakSimCommandAction,
  dataset_path: z.string().optional(),
  config: TokamakSimConfig.optional(),
});

export type TTokamakSimCommandInput = z.infer<typeof TokamakSimCommandInput>;
