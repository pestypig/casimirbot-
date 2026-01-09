import { z } from "zod";
import {
  ContributionReceiptSchema,
  TruthFunctionSchema,
  TruthFunctionStageSchema,
  TruthFunctionStatusSchema,
  TruthInputSchema,
  TruthPredicateSchema,
} from "./contributions.schema";
import { RiskSchema, TierSchema } from "../ideology/ideology-verifiers.schema";
import { whyBelongsSchema } from "../rationale";
import { trainingTraceCertificateSchema } from "../schema";

export const TruthFunctionCompileErrorSchema = z
  .object({
    kind: z.enum([
      "DUPLICATE_NODE",
      "UNKNOWN_NODE",
      "UNKNOWN_INPUT_REF",
      "UNKNOWN_PREDICATE_REF",
      "MISSING_NON_MODEL_EVIDENCE",
    ]),
    message: z.string().min(1),
    nodeId: z.string().min(1).optional(),
    ref: z.string().min(1).optional(),
  })
  .strict();
export type TruthFunctionCompileErrorRecord = z.infer<
  typeof TruthFunctionCompileErrorSchema
>;

export const TruthFunctionExecutionPlanStepSchema = z
  .object({
    kind: z.enum(["test", "query", "rule"]),
    ref: z.string().min(1),
  })
  .strict();
export type TruthFunctionExecutionPlanStepRecord = z.infer<
  typeof TruthFunctionExecutionPlanStepSchema
>;

export const TruthFunctionExecutionPlanSchema = z
  .object({
    truthFunctionId: z.string().min(1),
    claim: z.string().min(1),
    nodeIds: z.array(z.string().min(1)).min(1),
    stage: TruthFunctionStageSchema,
    tier: TierSchema,
    risk: RiskSchema,
    inputs: z.array(TruthInputSchema).min(1),
    predicate: TruthPredicateSchema,
    steps: z.array(TruthFunctionExecutionPlanStepSchema).default([]),
  })
  .strict();
export type TruthFunctionExecutionPlanRecord = z.infer<
  typeof TruthFunctionExecutionPlanSchema
>;

export const TruthFunctionCompilationSchema = z
  .object({
    ok: z.boolean(),
    plan: TruthFunctionExecutionPlanSchema.optional(),
    errors: z.array(TruthFunctionCompileErrorSchema).optional(),
  })
  .strict();
export type TruthFunctionCompilationRecord = z.infer<
  typeof TruthFunctionCompilationSchema
>;

export const TruthFunctionDraftSchema = z
  .object({
    truthFunction: TruthFunctionSchema,
    compilation: TruthFunctionCompilationSchema,
  })
  .strict();
export type TruthFunctionDraftRecord = z.infer<typeof TruthFunctionDraftSchema>;

export const ContributionClaimSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    kind: z.enum(["prediction", "mechanism", "threshold"]),
  })
  .strict();
export type ContributionClaimRecord = z.infer<typeof ContributionClaimSchema>;

export const ContributionVerificationStepSchema = z
  .object({
    truthFunctionId: z.string().min(1),
    kind: z.enum(["test", "query", "rule"]),
    ref: z.string().min(1),
    ok: z.boolean(),
    message: z.string().min(1).optional(),
  })
  .strict();
export type ContributionVerificationStepRecord = z.infer<
  typeof ContributionVerificationStepSchema
>;

export const ContributionTruthFunctionResultSchema = z
  .object({
    truthFunctionId: z.string().min(1),
    ok: z.boolean(),
    tier: TierSchema.optional(),
    risk: RiskSchema.optional(),
    errors: z.array(TruthFunctionCompileErrorSchema).optional(),
  })
  .strict();
export type ContributionTruthFunctionResultRecord = z.infer<
  typeof ContributionTruthFunctionResultSchema
>;

export const ContributionVerificationResultSchema = z
  .object({
    ok: z.boolean(),
    mintable: z.boolean(),
    traceId: z.string().min(1),
    certificateRequired: z.boolean(),
    certificateOk: z.boolean(),
    certificate: trainingTraceCertificateSchema.optional(),
    steps: z.array(ContributionVerificationStepSchema).default([]),
    truthFunctions: z.array(ContributionTruthFunctionResultSchema).default([]),
    errors: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type ContributionVerificationResultRecord = z.infer<
  typeof ContributionVerificationResultSchema
>;

export const ContributionDraftSchema = z
  .object({
    id: z.string().min(1),
    contributorId: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    status: z.literal("draft"),
    kind: z.string().min(1).optional(),
    text: z.string().min(1),
    nodeIds: z.array(z.string().min(1)).min(1),
    claims: z.array(ContributionClaimSchema).default([]),
    why: whyBelongsSchema,
    truthFunctions: z.array(TruthFunctionDraftSchema).default([]),
    verification: ContributionVerificationResultSchema.optional(),
  })
  .strict();
export type ContributionDraftRecord = z.infer<typeof ContributionDraftSchema>;

export const ContributionDraftLogSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    tenantId: z.string().min(1).optional(),
    draft: ContributionDraftSchema,
  })
  .strict();
export type ContributionDraftLogRecord = z.infer<
  typeof ContributionDraftLogSchema
>;

export const ContributionReviewDecisionSchema = z.enum(["approve", "reject"]);  
export type ContributionReviewDecision = z.infer<
  typeof ContributionReviewDecisionSchema
>;

export const ContributionReviewRoleSchema = z.enum([
  "peer",
  "steward",
  "arbiter",
]);
export type ContributionReviewRole = z.infer<
  typeof ContributionReviewRoleSchema
>;

export const ContributionReviewSchema = z
  .object({
    id: z.string().min(1),
    reviewerId: z.string().min(1),
    createdAt: z.string().datetime(),
    decision: ContributionReviewDecisionSchema,
    role: ContributionReviewRoleSchema.default("peer"),
    notes: z.string().min(1).optional(),
  })
  .strict();
export type ContributionReviewRecord = z.infer<typeof ContributionReviewSchema>;

export const ContributionRevocationSourceSchema = z.enum([
  "manual",
  "dispute",
  "policy",
  "ledger",
]);
export type ContributionRevocationSource = z.infer<
  typeof ContributionRevocationSourceSchema
>;

export const ContributionRevocationSchema = z
  .object({
    id: z.string().min(1),
    revokedAt: z.string().datetime(),
    actorId: z.string().min(1).optional(),
    reason: z.string().min(1).optional(),
    source: ContributionRevocationSourceSchema,
  })
  .strict();
export type ContributionRevocationRecord = z.infer<
  typeof ContributionRevocationSchema
>;

export const ContributionDisputeActionSchema = z.enum([
  "review",
  "revoke",
  "reinstate",
]);
export type ContributionDisputeAction = z.infer<
  typeof ContributionDisputeActionSchema
>;

export const ContributionDisputeStatusSchema = z.enum([
  "open",
  "accepted",
  "rejected",
  "resolved",
]);
export type ContributionDisputeStatus = z.infer<
  typeof ContributionDisputeStatusSchema
>;

export const ContributionDisputeResolutionSchema = z
  .object({
    decision: z.enum(["accept", "reject"]),
    resolvedBy: z.string().min(1),
    resolvedAt: z.string().datetime(),
    action: ContributionDisputeActionSchema.optional(),
    notes: z.string().min(1).optional(),
  })
  .strict();
export type ContributionDisputeResolutionRecord = z.infer<
  typeof ContributionDisputeResolutionSchema
>;

export const ContributionDisputeSchema = z
  .object({
    id: z.string().min(1),
    receiptId: z.string().min(1),
    contributorId: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    status: ContributionDisputeStatusSchema,
    reason: z.string().min(1),
    action: ContributionDisputeActionSchema,
    evidenceRefs: z.array(z.string().min(1)).default([]),
    resolution: ContributionDisputeResolutionSchema.optional(),
  })
  .strict();
export type ContributionDisputeRecord = z.infer<
  typeof ContributionDisputeSchema
>;

export const ContributionDisputeLogSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    tenantId: z.string().min(1).optional(),
    dispute: ContributionDisputeSchema,
  })
  .strict();
export type ContributionDisputeLogRecord = z.infer<
  typeof ContributionDisputeLogSchema
>;

export const ContributionReceiptStatusSchema = z.enum([
  "cooldown",
  "minted",
  "revoked",
  "rejected",
]);
export type ContributionReceiptStatus = z.infer<
  typeof ContributionReceiptStatusSchema
>;

export const ContributionReceiptRecordSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tenantId: z.string().min(1).optional(),
    draftId: z.string().min(1),
    contributorId: z.string().min(1),
    status: ContributionReceiptStatusSchema,
    plannedVcu: z.number().nonnegative(),
    capped: z.boolean(),
    ledgerAwardedVcu: z.number().nonnegative().optional(),
    ledgerMintedAt: z.string().datetime().optional(),
    ledgerRevokedAt: z.string().datetime().optional(),
    revokedAt: z.string().datetime().optional(),
    revocationReason: z.string().min(1).optional(),
    mintedAt: z.string().datetime().optional(),
    reviews: z.array(ContributionReviewSchema).default([]),
    revocations: z.array(ContributionRevocationSchema).default([]),
    receipt: ContributionReceiptSchema,
  })
  .strict();
export type ContributionReceiptRecord = z.infer<
  typeof ContributionReceiptRecordSchema
>;

export const TruthFunctionRecordSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    contributorId: z.string().min(1),
    tenantId: z.string().min(1).optional(),
    status: TruthFunctionStatusSchema,
    sourceContributionId: z.string().min(1).optional(),
    traceId: z.string().min(1).optional(),
    truthFunction: TruthFunctionSchema,
    verification: z
      .object({
        ok: z.boolean(),
        tier: TierSchema.optional(),
        risk: RiskSchema.optional(),
        traceId: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type TruthFunctionRecord = z.infer<typeof TruthFunctionRecordSchema>;

export const ContributionTraceLinkKindSchema = z.enum([
  "verification",
  "receipt",
  "mint",
  "revoke",
]);
export type ContributionTraceLinkKind = z.infer<
  typeof ContributionTraceLinkKindSchema
>;

export const ContributionTraceLinkSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    tenantId: z.string().min(1).optional(),
    traceId: z.string().min(1),
    kind: ContributionTraceLinkKindSchema,
    contributionId: z.string().min(1).optional(),
    receiptId: z.string().min(1).optional(),
    truthFunctionIds: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type ContributionTraceLink = z.infer<typeof ContributionTraceLinkSchema>;
