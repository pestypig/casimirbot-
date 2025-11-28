import { z } from "zod";

export const essencePromptProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseTemplate: z.string(),
  baseScript: z.string(),
  isActive: z.boolean().default(true),
  keywords: z.array(z.string()).optional(),
  globs: z.array(z.string()).optional(),
  ignore: z.array(z.string()).optional(),
  lastRunAt: z.string().optional(),
  lastError: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EssencePromptProfile = z.infer<typeof essencePromptProfileSchema>;

export const essencePromptVariantSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  finalPrompt: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  directions: z.array(z.string()),
  createdAt: z.string(),
  analysisSummary: z.string().optional(),
});
export type EssencePromptVariant = z.infer<typeof essencePromptVariantSchema>;

export const essencePromptVariantListSchema = z.object({
  variants: z.array(essencePromptVariantSchema),
});
export type EssencePromptVariantList = z.infer<typeof essencePromptVariantListSchema>;
