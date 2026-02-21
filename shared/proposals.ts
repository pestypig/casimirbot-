import { z } from "zod";
import { jobSourceSchema } from "./jobs";

export const proposalKindSchema = z.enum(["panel", "theme", "toolchain", "layout", "knowledge", "sector-control"]);
export type ProposalKind = z.infer<typeof proposalKindSchema>;

export const proposalStatusSchema = z.enum(["new", "approved", "denied", "building", "applied", "error"]);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const proposalSafetyStatusSchema = z.enum(["unknown", "pending", "running-evals", "passed", "failed"]);
export type ProposalSafetyStatus = z.infer<typeof proposalSafetyStatusSchema>;

export const proposalPatchKindSchema = z.enum(["ui-config", "code-diff"]);
export type ProposalPatchKind = z.infer<typeof proposalPatchKindSchema>;

const panelTargetSchema = z.object({
  type: z.literal("panel"),
  panelId: z.string(),
});

const panelSeedTargetSchema = z.object({
  type: z.literal("panel-seed"),
  componentPath: z.string(),
});

const backendFileTargetSchema = z.object({
  type: z.literal("backend-file"),
  path: z.string(),
});

const backendMultiTargetSchema = z.object({
  type: z.literal("backend-multi"),
  paths: z.array(z.string()).min(1),
});

const environmentTargetSchema = z.object({
  type: z.literal("environment"),
  ownerId: z.string().optional(),
  scope: z.enum(["desktop-template", "layout", "theme"]).default("desktop-template"),
});

export const proposalTargetSchema = z.discriminatedUnion("type", [
  panelTargetSchema,
  panelSeedTargetSchema,
  backendFileTargetSchema,
  backendMultiTargetSchema,
  environmentTargetSchema,
]);
export type ProposalTarget = z.infer<typeof proposalTargetSchema>;

export const uiConfigPatchSchema = z.object({
  patchKind: z.literal("ui-config"),
  patch: z.string(), // JSON patch stringified
});

export const codeDiffPatchSchema = z.object({
  patchKind: z.literal("code-diff"),
  patch: z.string(), // unified diff text
});

export const proposalPatchSchema = z.discriminatedUnion("patchKind", [uiConfigPatchSchema, codeDiffPatchSchema]);
export type ProposalPatch = z.infer<typeof proposalPatchSchema>;

export const proposalEvidenceSchema = z.object({
  guardrailStatus: z.record(z.enum(["pass", "fail", "unknown"])).optional(),
  maturity: z.enum(["exploratory", "reduced-order", "diagnostic", "certified"]).optional(),
  traceRef: z.string().optional(),
  runRef: z.string().optional(),
});

export const essenceProposalSchema = z.object({
  id: z.string(),
  kind: proposalKindSchema,
  status: proposalStatusSchema.default("new"),
  source: jobSourceSchema,
  title: z.string(),
  summary: z.string(),
  explanation: z.string(),
  target: proposalTargetSchema,
  patchKind: proposalPatchKindSchema,
  patch: z.string(),
  rewardTokens: z.number().int().nonnegative().default(0),
  ownerId: z.string().optional().nullable(),
  safetyStatus: proposalSafetyStatusSchema.default("unknown"),
  safetyScore: z.number().min(0).max(1).optional(),
  safetyReport: z.string().optional().nullable(),
  jobId: z.string().nullable().optional(),
  evalRunId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdForDay: z.string(), // YYYY-MM-DD
  metadata: z.record(z.any()).optional(),
  evidence: proposalEvidenceSchema.optional(),
});
export type EssenceProposal = z.infer<typeof essenceProposalSchema>;

export const proposalActionSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  action: z.enum(["preview", "approve", "deny", "status-update", "builder-note"]),
  userId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
});
export type ProposalActionRecord = z.infer<typeof proposalActionSchema>;

export const proposalListResponseSchema = z.object({
  day: z.string(),
  proposals: z.array(essenceProposalSchema),
});
export type ProposalListResponse = z.infer<typeof proposalListResponseSchema>;

export const proposalPromptPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  prompt: z.string(),
  context: z.string().optional(),
  updatedAt: z.string(),
});
export type ProposalPromptPreset = z.infer<typeof proposalPromptPresetSchema>;
