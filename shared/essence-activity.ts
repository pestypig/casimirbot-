import { z } from "zod";

export const ActivitySample = z.object({
  id: z.string().optional(),
  ts: z.string(),
  panelId: z.string().optional(),
  file: z.string().optional(),
  repo: z.string().optional(),
  tag: z.string().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  updates: z.number().int().nonnegative().optional(),
  meta: z.record(z.any()).optional(),
});
export type TActivitySample = z.infer<typeof ActivitySample>;

export const PhaseProfile = z.object({
  id: z.string(),
  score: z.number().min(0).max(1),
  topPanels: z.array(z.string()).default([]),
  topFiles: z.array(z.string()).default([]),
  envHints: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  sampleStart: z.string(),
  sampleEnd: z.string(),
  rationale: z.string().optional(),
});
export type TPhaseProfile = z.infer<typeof PhaseProfile>;

const TemplatePanelConfig = z.object({
  id: z.string(),
  layout: z.string().optional(),
  props: z.record(z.any()).optional(),
});

const TemplateChanges = z.object({
  openPanels: z.array(TemplatePanelConfig).default([]),
  pinFiles: z.array(z.string()).default([]),
  setEnv: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  consoleTabs: z.array(z.string()).default([]),
});

const TemplateSafety = z.object({
  requiresSecrets: z.array(z.string()).optional(),
  migrations: z.array(z.string()).optional(),
});

export const ProposalTemplate = z.object({
  id: z.string(),
  baseOsImage: z.string(),
  templateVersion: z.string(),
  userOverridesRef: z.string(),
  changes: TemplateChanges,
  rationale: z.string(),
  safety: TemplateSafety.default({}),
  createdAt: z.string(),
  phaseId: z.string(),
});
export type TProposalTemplate = z.infer<typeof ProposalTemplate>;
