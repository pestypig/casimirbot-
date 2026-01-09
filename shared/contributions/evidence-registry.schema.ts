import { z } from "zod";
import {
  TruthInputKindSchema,
  TruthInputSourceOriginSchema,
} from "./contributions.schema";

export const EvidenceCollectionMethodSchema = z.enum([
  "sensor",
  "survey",
  "audit",
  "log",
  "manual",
  "experiment",
  "observation",
  "model",
  "derived",
]);
export type EvidenceCollectionMethod = z.infer<
  typeof EvidenceCollectionMethodSchema
>;

export const EvidenceIndependenceSchema = z.enum([
  "self",
  "peer",
  "third-party",
  "external",
]);
export type EvidenceIndependence = z.infer<typeof EvidenceIndependenceSchema>;

export const EvidenceSourceSchema = z
  .object({
    origin: TruthInputSourceOriginSchema,
    collectionMethod: EvidenceCollectionMethodSchema,
    independence: EvidenceIndependenceSchema,
    lineage: z.array(z.string().min(1)).default([]),
    collectorId: z.string().min(1).optional(),
    collectedAt: z.string().datetime().optional(),
  })
  .strict();
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;

export const EvidenceRetentionPolicySchema = z.enum([
  "short",
  "standard",
  "long",
  "indefinite",
]);
export type EvidenceRetentionPolicy = z.infer<
  typeof EvidenceRetentionPolicySchema
>;

export const EvidenceRetentionSchema = z
  .object({
    policy: EvidenceRetentionPolicySchema,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
  })
  .strict();
export type EvidenceRetention = z.infer<typeof EvidenceRetentionSchema>;

export const EvidenceSignatureSchema = z
  .object({
    alg: z.enum(["hmac-sha256", "ed25519", "secp256k1"]),
    keyId: z.string().min(1),
    sig: z.string().min(1),
    payloadHash: z.string().min(1),
    signedAt: z.string().datetime(),
  })
  .strict();
export type EvidenceSignature = z.infer<typeof EvidenceSignatureSchema>;

export const EvidenceStatusSchema = z.enum([
  "active",
  "deprecated",
  "revoked",
  "expired",
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const EvidenceRecordSchema = z
  .object({
    id: z.string().min(1),
    kind: TruthInputKindSchema,
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    source: EvidenceSourceSchema,
    retention: EvidenceRetentionSchema,
    status: EvidenceStatusSchema,
    tags: z.array(z.string().min(1)).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    signature: EvidenceSignatureSchema.optional(),
  })
  .strict();
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

export const EvidenceRegistryRecordSchema = z
  .object({
    id: z.string().min(1),
    seq: z.number().int().nonnegative(),
    tenantId: z.string().min(1).optional(),
    record: EvidenceRecordSchema,
  })
  .strict();
export type EvidenceRegistryRecord = z.infer<
  typeof EvidenceRegistryRecordSchema
>;
