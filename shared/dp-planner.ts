import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { DpCollapseInput, DpCollapseResultSchema } from "./dp-collapse";
import { DpAdapterInput } from "./collapse-benchmark";

const DpPlanVisibilityInput = z.object({
  v0: z.number().min(0).max(1).default(1),
  target: z.number().min(0).max(1).optional(),
  times_s: z.array(z.number().nonnegative()).max(512).optional(),
});

export type TDpPlanVisibilityInput = z.infer<typeof DpPlanVisibilityInput>;

const DpPlanEnvironmentInput = z.object({
  gamma_env_s: z.number().nonnegative().optional(),
  label: z.string().optional(),
});

export type TDpPlanEnvironmentInput = z.infer<typeof DpPlanEnvironmentInput>;

export const DpPlanInput = z
  .object({
    schema_version: z.literal("dp_plan/1"),
    dp: DpCollapseInput.optional(),
    dp_adapter: DpAdapterInput.optional(),
    visibility: DpPlanVisibilityInput.optional(),
    environment: DpPlanEnvironmentInput.optional(),
    notes: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    const hasDp = value.dp != null;
    const hasAdapter = value.dp_adapter != null;
    if (!hasDp && !hasAdapter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dp"],
        message: "Provide dp or dp_adapter",
      });
    }
    if (hasDp && hasAdapter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dp_adapter"],
        message: "Provide dp or dp_adapter, not both",
      });
    }
  });

export type TDpPlanInput = z.infer<typeof DpPlanInput>;

const DpPlanVisibilityPoint = z.object({
  t_s: z.number().nonnegative(),
  v: z.number().min(0).max(1),
});

export const DpPlanVisibilityResult = z.object({
  v0: z.number().min(0).max(1),
  target: z.number().min(0).max(1),
  target_source: z.enum(["input", "default"]),
  time_to_target_s: z.number().nonnegative().optional(),
  target_reachable: z.boolean(),
  curve: z.array(DpPlanVisibilityPoint).optional(),
});

export type TDpPlanVisibilityResult = z.infer<typeof DpPlanVisibilityResult>;

export const DpPlanDetectability = z.object({
  gamma_env_s: z.number().nonnegative().optional(),
  ratio: z.number().nonnegative().optional(),
  dominance: z.enum(["unavailable", "dp_dominant", "env_dominant", "equal"]),
});

export type TDpPlanDetectability = z.infer<typeof DpPlanDetectability>;

export const DpPlanResult = DerivedArtifactInformationBoundaryAudit.extend({
  ok: z.literal(true),
  schema_version: z.literal("dp_plan/1"),
  dp: DpCollapseResultSchema,
  gamma_dp_s: z.number().nonnegative(),
  tau_s: z.number().positive(),
  tau_ms: z.number().positive(),
  visibility: DpPlanVisibilityResult.optional(),
  detectability: DpPlanDetectability.optional(),
  notes: z.array(z.string()).optional(),
});

export type TDpPlanResult = z.infer<typeof DpPlanResult>;
