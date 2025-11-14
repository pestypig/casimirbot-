import { z } from "zod";

export const ThemeEvidence = z.object({
  envelopeId: z.string(),
  label: z.string(),
  uri: z.string().optional(),
  excerpt: z.string().optional(),
});
export type TThemeEvidence = z.infer<typeof ThemeEvidence>;

export const ThemeForce = z.object({
  id: z.string(),
  label: z.string(),
  summary: z.string(),
  magnitude: z.number().min(0).max(1).default(0),
  evidence: z.array(ThemeEvidence).default([]),
});
export type TThemeForce = z.infer<typeof ThemeForce>;

export const ThemeConstraint = z.object({
  id: z.string(),
  label: z.string(),
  summary: z.string(),
  weight: z.number().min(0).max(1).default(0),
  evidence: z.array(ThemeEvidence).default([]),
});
export type TThemeConstraint = z.infer<typeof ThemeConstraint>;

export const ThemeStateNode = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
  emphasis: z.number().min(0).max(1).default(0),
  evidence: ThemeEvidence.optional(),
});
export type TThemeStateNode = z.infer<typeof ThemeStateNode>;

export const ThemeStatePanel = z.object({
  dominant: z.string(),
  stuckIn: z.string().optional(),
  nodes: z.array(ThemeStateNode),
});
export type TThemeStatePanel = z.infer<typeof ThemeStatePanel>;

export const ThemeDualityAxis = z.object({
  id: z.string(),
  label: z.string(),
  negative: z.string(),
  positive: z.string(),
  leaning: z.number().min(-1).max(1),
  evidence: z.array(ThemeEvidence).default([]),
});
export type TThemeDualityAxis = z.infer<typeof ThemeDualityAxis>;

export const ThemeReframe = z.object({
  id: z.string(),
  prompt: z.string(),
  emphasis: z.string().optional(),
  evidence: ThemeEvidence.optional(),
  relatedForces: z.array(z.string()).default([]),
});
export type TThemeReframe = z.infer<typeof ThemeReframe>;

export const ThemeFieldPanel = z.object({
  forces: z.array(ThemeForce),
  constraints: z.array(ThemeConstraint),
});
export type TThemeFieldPanel = z.infer<typeof ThemeFieldPanel>;

export const ThemePanelRecord = z.object({
  id: z.string(),
  label: z.string(),
  summary: z.string(),
  color: z.string().default("#0f172a"),
  priority: z.number().nonnegative().default(0),
  corpusSize: z.number().int().nonnegative(),
  recencyDays: z.number().nonnegative(),
  topKeywords: z.array(z.string()).default([]),
  mediums: z.record(z.number()).default({}),
  roles: z.record(z.number()).default({}),
  field: ThemeFieldPanel,
  stateSpace: ThemeStatePanel,
  dualities: z.array(ThemeDualityAxis),
  reframes: z.array(ThemeReframe),
  evidence: z.array(ThemeEvidence),
});
export type TThemePanelRecord = z.infer<typeof ThemePanelRecord>;

export const EssenceThemeDeck = z.object({
  ownerId: z.string().nullable(),
  generatedAt: z.string(),
  totalEnvelopes: z.number().int().nonnegative(),
  themes: z.array(ThemePanelRecord),
});
export type TEssenceThemeDeck = z.infer<typeof EssenceThemeDeck>;
