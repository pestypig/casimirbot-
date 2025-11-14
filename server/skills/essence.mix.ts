import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { createEssenceMix } from "../services/essence/mix";

const MixInputSchema = z.object({
  mode: z.enum(["project-assets", "proposal-identity"]),
  creatorId: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(64).optional(),
  label: z.string().trim().max(240).optional(),
  seed: z.number().int().nonnegative().optional(),
});

export const essenceMixSpec: ToolSpecShape = {
  name: "essence.mix.create",
  desc: "Collapse/mixer helper that fuses project assets or accepted proposals into a single identity mix.",
  inputSchema: MixInputSchema,
  outputSchema: z.object({
    mixId: z.string(),
    summary: z.string(),
    space: z.string(),
    dim: z.number(),
    mode: z.enum(["project-assets", "proposal-identity"]),
    sourceIds: z.array(z.string()),
  }),
  deterministic: true,
  rateLimit: { rpm: 2 },
  safety: { risks: ["writes_files"] },
};

export const essenceMixHandler: ToolHandler = async (rawInput, ctx) => {
  const parsed = MixInputSchema.parse(rawInput ?? {});
  if (parsed.mode === "project-assets" && !parsed.creatorId) {
    throw new Error("creatorId is required when mode = project-assets");
  }
  const personaId = ctx?.personaId ?? "persona:unknown";
  const result = await createEssenceMix({
    ...parsed,
    personaId,
    creatorId: parsed.creatorId ?? personaId,
  });
  return result;
};
