import { z } from "zod";
import {
  ContributionReceiptSchema,
  PrivacyShareLevelSchema,
} from "./contributions.schema";
import { trainingTraceSchema } from "../schema";

export const WalletSignatureSchema = z
  .object({
    alg: z.enum(["ed25519"]),
    keyId: z.string().min(1),
    sig: z.string().min(1),
    payloadHash: z.string().min(1),
    signedAt: z.string().datetime(),
  })
  .strict();
export type WalletSignature = z.infer<typeof WalletSignatureSchema>;

export const WalletReceiptRecordSchema = z
  .object({
    id: z.string().min(1),
    receiptId: z.string().min(1),
    storedAt: z.string().datetime(),
    source: z
      .object({
        receiptSource: z.string().min(1).optional(),
        traceSource: z.string().min(1).optional(),
      })
      .optional(),
    receipt: ContributionReceiptSchema,
    trace: trainingTraceSchema.optional(),
    signature: WalletSignatureSchema,
  })
  .strict();
export type WalletReceiptRecord = z.infer<typeof WalletReceiptRecordSchema>;

export const WalletDisclosureSchema = z
  .object({
    id: z.string().min(1),
    receiptId: z.string().min(1),
    shareLevel: PrivacyShareLevelSchema,
    createdAt: z.string().datetime(),
    payload: z.record(z.unknown()),
    signature: WalletSignatureSchema,
  })
  .strict();
export type WalletDisclosure = z.infer<typeof WalletDisclosureSchema>;
