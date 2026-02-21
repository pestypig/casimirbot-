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
      observerGrid: z
        .object({
          paybackGain: z.number().positive().optional(),
          observers: z
            .array(
              z.object({
                observerId: z.string().min(1),
                rho_Jm3: z.number().optional(),
                debt_Jm3s: z.number().nonnegative().optional(),
                maxDebt_Jm3s: z.number().positive().optional(),
                dt_ms: z.number().positive().optional(),
              }),
            )
            .optional(),
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
  rateLimit: { rpm: 60 },
  safety: { risks: [] },
  risk: { writesFiles: false, touchesNetwork: false, privileged: false },
  health: "ok",
};

export const sectorControlPlanHandler: ToolHandler = async (rawInput) => {
  const input = inputSchema.parse(rawInput);
  const plan = buildSectorControlPlan({
    mode: input.mode,
    timing: input.overrides?.timing,
    allocation: input.overrides?.allocation,
    observerGrid: input.overrides?.observerGrid,
  });

  if (!plan.ok) {
    throw new Error(`tool_not_allowed:firstFail=${plan.firstFail}`);
  }
  return sectorControlPlanSchema.parse(plan.plan);
};
