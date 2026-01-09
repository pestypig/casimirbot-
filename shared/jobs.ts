import { z } from "zod";

export const jobPrioritySchema = z.enum(["low", "medium", "high"]);
export type JobPriority = z.infer<typeof jobPrioritySchema>;

export const jobKindSchema = z.enum(["code", "research", "agi", "ops"]);
export type JobKind = z.infer<typeof jobKindSchema>;

export const jobStatusSchema = z.enum(["open", "claimed", "completed", "expired"]);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const jobSourceSchema = z.enum([
  "docs:essence-gap-report",
  "docs:essence-patch-plan",
  "docs:agi-roadmap",
  "docs:alcubierre-alignment",
  "repo:todo",
  "repo:fixme",
  "tests",
  "essence:proposal",
  "other",
]);
export type JobSource = z.infer<typeof jobSourceSchema>;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  kind: jobKindSchema,
  priority: jobPrioritySchema.default("medium"),
  source: jobSourceSchema.default("other"),
  rewardTokens: z.number().int().nonnegative().default(0),
  paths: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: jobStatusSchema.default("open"),
  createdAt: z.number().int(),
  dueAt: z.number().int().optional(),
});
export type Job = z.infer<typeof jobSchema>;

export const jobListResponseSchema = z.object({
  jobs: z.array(jobSchema),
  generatedAt: z.number().int(),
});
export type JobListResponse = z.infer<typeof jobListResponseSchema>;

export const tokenLedgerSourceSchema = z.enum([
  "job",
  "contribution",
  "proposal",
  "ubi",
  "payout",
  "adjustment",
]);
export type TokenLedgerSource = z.infer<typeof tokenLedgerSourceSchema>;

export const tokenLedgerEntrySchema = z.object({
  id: z.string(),
  at: z.number().int(),
  delta: z.number().int(),
  reason: z.string(),
  jobId: z.string().optional(),
  source: tokenLedgerSourceSchema.optional(),
  ref: z.string().optional(),
  evidence: z.string().optional(),
});
export type TokenLedgerEntry = z.infer<typeof tokenLedgerEntrySchema>;

export const tokenBalanceSchema = z.object({
  userId: z.string(),
  balance: z.number().int(),
  dailyBase: z.number().int(),
  nextResetAt: z.number().int(),
  ledger: z.array(tokenLedgerEntrySchema).optional(),
});
export type TokenBalance = z.infer<typeof tokenBalanceSchema>;

export const payoutKindSchema = z.enum(["withdrawal", "ubi"]);
export type PayoutKind = z.infer<typeof payoutKindSchema>;

export const payoutStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "canceled",
]);
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const payoutRecordSchema = z.object({
  id: z.string(),
  seq: z.number().int(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  userId: z.string().optional(),
  kind: payoutKindSchema,
  status: payoutStatusSchema,
  amount: z.number().int().nonnegative(),
  reason: z.string().optional(),
  distributionId: z.string().optional(),
  destination: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});
export type PayoutRecord = z.infer<typeof payoutRecordSchema>;

export const payoutListResponseSchema = z.object({
  payouts: z.array(payoutRecordSchema),
  generatedAt: z.number().int(),
});
export type PayoutListResponse = z.infer<typeof payoutListResponseSchema>;

// --- User proposal flow ------------------------------------------------------

export const jobProposalSchema = z.object({
  title: z.string().min(6),
  description: z.string().min(20),
  kind: jobKindSchema.default("code"),
  priority: jobPrioritySchema.default("medium").optional(),
  paths: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  traceId: z.string().optional(),
  rewardTokens: z.number().int().nonnegative().optional(),
});
export type JobProposal = z.infer<typeof jobProposalSchema>;

export const jobCreateResponseSchema = z.object({
  ok: z.boolean(),
  agreed: z.boolean().default(false),
  job: jobSchema.optional(),
  message: z.string().optional(),
});
export type JobCreateResponse = z.infer<typeof jobCreateResponseSchema>;

// --- Essence proposals ------------------------------------------------------

export const desktopPanelProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  componentPath: z.string(),
  panelId: z.string(),
  dataSources: z.array(z.string()).default([]),
});
export type DesktopPanelProposal = z.infer<typeof desktopPanelProposalSchema>;

export const desktopPanelProposalsResponseSchema = z.object({
  generatedAt: z.number().int(),
  proposals: z.array(desktopPanelProposalSchema),
});
export type DesktopPanelProposalsResponse = z.infer<typeof desktopPanelProposalsResponseSchema>;
