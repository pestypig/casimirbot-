import { z } from "zod";

export const TierSchema = z.enum(["L0", "L1", "L2", "L3"]);
export type Tier = z.infer<typeof TierSchema>;

export const RiskSchema = z.enum(["low", "medium", "high", "systemic"]);
export type Risk = z.infer<typeof RiskSchema>;

export const EvidenceKindSchema = z.enum([
  "metric",
  "test",
  "audit",
  "attestation",
]);
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;

export const VerifierKindSchema = z.enum(["tool", "test", "manual"]);
export type VerifierKind = z.infer<typeof VerifierKindSchema>;

export const EvidenceSpecSchema = z
  .object({
    kind: EvidenceKindSchema,
    refs: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const VerifierSpecSchema = z
  .object({
    kind: VerifierKindSchema,
    ref: z.string().min(1),
    required: z.boolean(),
  })
  .strict();

export const NodeVerifierMappingSchema = z
  .object({
    nodeId: z.string().min(1),
    outcomes: z.array(z.string().min(1)).min(1),
    evidence: z.array(EvidenceSpecSchema).default([]),
    invalidators: z.array(z.string().min(1)).default([]),
    defaultTier: TierSchema,
    risk: RiskSchema,
    verifiers: z.array(VerifierSpecSchema).default([]),
  })
  .strict();

export type NodeVerifierMapping = z.infer<typeof NodeVerifierMappingSchema>;

export const IdeologyVerifierPackSchema = z
  .object({
    version: z.number().int().positive(),
    mappings: z.array(NodeVerifierMappingSchema).min(1),
  })
  .strict();

export type IdeologyVerifierPack = z.infer<typeof IdeologyVerifierPackSchema>;
