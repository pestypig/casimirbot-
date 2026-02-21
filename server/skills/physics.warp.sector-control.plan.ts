import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { sectorControlPlanSchema } from "@shared/schema";
import { buildSectorControlPlan } from "../control/sectorControlPlanner";

const inputSchema = z.object({
  mode: z.enum(["diagnostic", "stability_scan", "qi_conservative", "theta_balanced"]),
  overrides: z
    .object({
      timing: z
        .object({
          strobeHz: z.number().positive().optional(),
          sectorPeriod_ms: z.number().positive().optional(),
          TS_ratio: z.number().positive().optional(),
          tauLC_ms: z.number().positive().optional(),
          tauPulse_ms: z.number().positive().optional(),
        })
        .optional(),
      allocation: z
        .object({
          sectorCount: z.number().int().positive().optional(),
          concurrentSectors: z.number().int().positive().optional(),
          negativeFraction: z.number().min(0).max(1).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const sectorControlPlanSpec: ToolSpecShape = {
  name: "physics.warp.sector_control.plan",
  desc: "Create a diagnostic sector strobing control plan with deterministic guardrail status.",
  inputSchema,
  outputSchema: sectorControlPlanSchema,
  deterministic: true,
  risk: { writesFiles: false, touchesNetwork: false, privileged: false },
  health: "ok",
};

export const sectorControlPlanHandler: ToolHandler<typeof inputSchema, typeof sectorControlPlanSchema> = async (
  input,
) => {
  const plan = buildSectorControlPlan({
    mode: input.mode,
    timing: input.overrides?.timing,
    allocation: input.overrides?.allocation,
  });

  if (!plan.ok) {
    throw new Error(`tool_not_allowed:firstFail=${plan.firstFail}`);
  }
  return plan.plan;
};
