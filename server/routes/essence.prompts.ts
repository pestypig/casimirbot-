import { Router } from "express";
import { z } from "zod";
import {
  listPromptProfiles,
  listPromptVariants,
  synthesizePromptVariant,
  updatePromptProfile,
} from "../services/essence/prompt-variants";

export const essencePromptsRouter = Router();

const PatchProfileSchema = z.object({
  name: z.string().min(1).optional(),
  baseTemplate: z.string().min(1).optional(),
  baseScript: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  globs: z.array(z.string()).optional(),
  ignore: z.array(z.string()).optional(),
});

essencePromptsRouter.get("/prompt-profiles", (_req, res) => {
  res.json({ profiles: listPromptProfiles() });
});

essencePromptsRouter.patch("/prompt-profiles/:id", (req, res) => {
  const parsed = PatchProfileSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const updated = updatePromptProfile(req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ profile: updated });
});

essencePromptsRouter.get("/prompt-variants", async (req, res) => {
  const profileId = typeof req.query.profileId === "string" ? req.query.profileId : undefined;
  const refresh = req.query.refresh === "1" || req.query.refresh === "true";
  try {
    if (refresh || listPromptVariants(profileId).length === 0) {
      await synthesizePromptVariant(profileId);
    }
    const variants = listPromptVariants(profileId);
    res.json({ variants });
  } catch (err) {
    res.status(500).json({ error: "prompt_variants_failed", message: err instanceof Error ? err.message : String(err) });
  }
});

essencePromptsRouter.post("/prompt-variants/run", async (req, res) => {
  const profileId = typeof req.body?.profileId === "string" ? req.body.profileId : undefined;
  const targetPaths =
    Array.isArray(req.body?.targetPaths) && req.body.targetPaths.every((p: any) => typeof p === "string")
      ? (req.body.targetPaths as string[])
      : undefined;
  try {
    const variant = await synthesizePromptVariant(profileId, { targetPaths });
    res.json({ variant });
  } catch (err) {
    res.status(500).json({ error: "prompt_variant_failed", message: err instanceof Error ? err.message : String(err) });
  }
});
