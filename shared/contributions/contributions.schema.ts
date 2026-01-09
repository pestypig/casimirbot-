import { z } from "zod";
import { RiskSchema, TierSchema } from "../ideology/ideology-verifiers.schema";
import { whyBelongsSchema } from "../rationale";

export const TruthFunctionStageSchema = z.enum([
  "exploratory",
  "reduced-order",
  "diagnostic",
  "certified",
]);
export type TruthFunctionStage = z.infer<typeof TruthFunctionStageSchema>;

export const TruthFunctionStatusSchema = z.enum(["draft", "verified", "revoked"]);
export type TruthFunctionStatus = z.infer<typeof TruthFunctionStatusSchema>;

export const TruthInputKindSchema = z.enum([
  "metric",
  "log",
  "audit",
  "survey",
  "attestation",
]);
export const TruthPredicateKindSchema = z.enum(["query", "test", "rule"]);
export type TruthInputKind = z.infer<typeof TruthInputKindSchema>;
export type TruthPredicateKind = z.infer<typeof TruthPredicateKindSchema>;

export const TruthInputSourceOriginSchema = z.enum([
  "model",
  "human",
  "sensor",
  "audit",
  "system",
  "external",
]);
export type TruthInputSourceOrigin = z.infer<typeof TruthInputSourceOriginSchema>;

export const TruthInputSourceSchema = z
  .object({
    origin: TruthInputSourceOriginSchema,
    lineage: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type TruthInputSource = z.infer<typeof TruthInputSourceSchema>;

export const TruthInputSchema = z
  .object({
    kind: TruthInputKindSchema,
    refs: z.array(z.string().min(1)).min(1),
    source: TruthInputSourceSchema.optional(),
  })
  .strict();

export const TruthPredicateSchema = z
  .object({
    kind: TruthPredicateKindSchema,
    ref: z.string().min(1),
  })
  .strict();

export const TruthFunctionSchema = z
  .object({
    id: z.string().min(1),
    claim: z.string().min(1),
    nodeIds: z.array(z.string().min(1)).min(1),
    stage: TruthFunctionStageSchema,
    inputs: z.array(TruthInputSchema).min(1),
    predicate: TruthPredicateSchema,
    tests: z.array(z.string().min(1)).default([]),
    risk: RiskSchema,
    status: TruthFunctionStatusSchema,
    why: whyBelongsSchema,
  })
  .strict();

export type TruthFunction = z.infer<typeof TruthFunctionSchema>;

export const ContributionKindSchema = z.enum([
  "truth-correction",
  "test-case",
  "protocol",
  "local-context",
  "interpretation",
]);

export const VerificationVerdictSchema = z.enum(["pass", "fail"]);
export const PrivacyShareLevelSchema = z.enum(["local", "partial", "public"]);

export const ContributionReceiptSchema = z
  .object({
    id: z.string().min(1),
    contributorId: z.string().min(1),
    createdAt: z.string().datetime(),
    kind: ContributionKindSchema,
    nodeIds: z.array(z.string().min(1)).min(1),
    truthFunctionIds: z.array(z.string().min(1)).default([]),

    verification: z
      .object({
        verdict: VerificationVerdictSchema,
        traceId: z.string().min(1).optional(),
        certificateHash: z.string().min(1).optional(),
        integrityOk: z.boolean().optional(),
        tier: TierSchema.optional(),
      })
      .strict(),

    cooldown: z
      .object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .strict(),

    payout: z
      .object({
        vcu: z.number().nonnegative(),
        capped: z.boolean(),
      })
      .strict(),

    privacy: z
      .object({
        shareLevel: PrivacyShareLevelSchema,
      })
      .strict(),
  })
  .strict();

export type ContributionReceipt = z.infer<typeof ContributionReceiptSchema>;
