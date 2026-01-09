import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ContributionReceiptSchema } from "@shared/contributions/contributions.schema";
import type { ContributionReceipt } from "@shared/contributions/contributions.schema";
import {
  WalletDisclosureSchema,
  WalletReceiptRecordSchema,
  type WalletDisclosure,
  type WalletReceiptRecord,
  type WalletSignature,
} from "@shared/contributions/wallet-agent.schema";
import { trainingTraceSchema, type TrainingTraceRecord } from "@shared/schema";
import { stableJsonStringify } from "../server/utils/stable-json";

export type WalletAgentConfig = {
  dir?: string;
};

export type WalletReceiptImportInput = {
  receipt: ContributionReceipt;
  trace?: TrainingTraceRecord;
  receiptSource?: string;
  traceSource?: string;
};

export type WalletDisclosureRequest = {
  receiptId: string;
  shareLevel: "local" | "partial" | "public";
  includeTraceSummary?: boolean;
  includePublicKey?: boolean;
  allowOverride?: boolean;
};

export type WalletDisclosureResult =
  | { ok: true; disclosure: WalletDisclosure }
  | { ok: false; error: string };

export type WalletReceiptVerification = {
  ok: boolean;
  issues: string[];
  traceMatched?: boolean;
  certificateMatched?: boolean;
};

type WalletKeyMaterial = {
  keyId: string;
  publicKeyPem: string;
  privateKeyPem: string;
};

const WALLET_PUBLIC_KEY = "wallet-public.pem";
const WALLET_PRIVATE_KEY = "wallet-private.pem";
const WALLET_RECEIPTS = "wallet-receipts.jsonl";

const SHARE_RANK: Record<WalletDisclosureRequest["shareLevel"], number> = {
  local: 0,
  partial: 1,
  public: 2,
};

const resolveWalletDir = (dir?: string): string => {
  const fromEnv = process.env.WALLET_AGENT_DIR?.trim();
  if (dir && dir.trim()) return path.resolve(dir.trim());
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(os.homedir(), ".casimir", "wallet-agent");
};

const ensureWalletDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true });
};

const hashString = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const buildPayloadHash = (payload: unknown): string =>
  hashString(stableJsonStringify(payload));

const deriveKeyId = (publicKeyPem: string): string => hashString(publicKeyPem);

const loadKeyMaterial = (dir: string): WalletKeyMaterial => {
  ensureWalletDir(dir);
  const publicPath = path.join(dir, WALLET_PUBLIC_KEY);
  const privatePath = path.join(dir, WALLET_PRIVATE_KEY);
  if (fs.existsSync(publicPath) && fs.existsSync(privatePath)) {
    const publicKeyPem = fs.readFileSync(publicPath, "utf8");
    const privateKeyPem = fs.readFileSync(privatePath, "utf8");
    return { keyId: deriveKeyId(publicKeyPem), publicKeyPem, privateKeyPem };
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey
    .export({ type: "spki", format: "pem" })
    .toString();
  const privateKeyPem = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  fs.writeFileSync(publicPath, publicKeyPem, "utf8");
  fs.writeFileSync(privatePath, privateKeyPem, "utf8");
  return { keyId: deriveKeyId(publicKeyPem), publicKeyPem, privateKeyPem };
};

const signPayload = (payload: unknown, keys: WalletKeyMaterial): WalletSignature => {
  const payloadHash = buildPayloadHash(payload);
  const signature = crypto.sign(
    null,
    Buffer.from(payloadHash, "utf8"),
    keys.privateKeyPem,
  );
  return {
    alg: "ed25519",
    keyId: keys.keyId,
    sig: signature.toString("base64"),
    payloadHash,
    signedAt: new Date().toISOString(),
  };
};

const verifySignature = (
  payload: unknown,
  signature: WalletSignature,
  publicKeyPem: string,
): boolean => {
  const payloadHash = buildPayloadHash(payload);
  if (payloadHash !== signature.payloadHash) return false;
  return crypto.verify(
    null,
    Buffer.from(payloadHash, "utf8"),
    publicKeyPem,
    Buffer.from(signature.sig, "base64"),
  );
};

const sanitizeShareLevel = (
  requested: WalletDisclosureRequest["shareLevel"],
  receiptLevel: ContributionReceipt["privacy"]["shareLevel"],
  allowOverride?: boolean,
): WalletDisclosureRequest["shareLevel"] => {
  if (allowOverride) return requested;
  return SHARE_RANK[requested] > SHARE_RANK[receiptLevel]
    ? receiptLevel
    : requested;
};

const buildContributorRef = (contributorId: string): string =>
  hashString(contributorId);

const buildTraceSummary = (trace: TrainingTraceRecord) => ({
  traceId: trace.traceId ?? trace.id,
  pass: trace.pass,
  firstFail: trace.firstFail,
  certificate: trace.certificate,
});

const buildDisclosurePayload = (
  record: WalletReceiptRecord,
  shareLevel: WalletDisclosureRequest["shareLevel"],
  includeTraceSummary?: boolean,
  signer?: { keyId: string; publicKeyPem?: string },
) => {
  const receipt = record.receipt;
  const payload: Record<string, unknown> = {
    receiptId: receipt.id,
    receiptCreatedAt: receipt.createdAt,
    shareLevel,
  };
  if (shareLevel !== "local") {
    payload.nodeIds = receipt.nodeIds;
    payload.truthFunctionIds = receipt.truthFunctionIds;
    payload.contributorRef = buildContributorRef(receipt.contributorId);
    payload.verification =
      shareLevel === "public"
        ? receipt.verification
        : {
            verdict: receipt.verification.verdict,
            tier: receipt.verification.tier,
          };
  }
  if (shareLevel === "public" && includeTraceSummary && record.trace) {
    payload.trace = buildTraceSummary(record.trace);
  }
  if (signer) {
    payload.signer = {
      keyId: signer.keyId,
      ...(signer.publicKeyPem ? { publicKeyPem: signer.publicKeyPem } : {}),
    };
  }
  return payload;
};

export class WalletAgent {
  readonly dir: string;
  readonly keys: WalletKeyMaterial;
  private readonly receiptsById = new Map<string, WalletReceiptRecord>();
  private readonly receiptsByReceiptId = new Map<string, WalletReceiptRecord>();

  constructor(config: WalletAgentConfig = {}) {
    this.dir = resolveWalletDir(config.dir);
    this.keys = loadKeyMaterial(this.dir);
    this.loadReceipts();
  }

  get publicKeyPem(): string {
    return this.keys.publicKeyPem;
  }

  get keyId(): string {
    return this.keys.keyId;
  }

  listReceipts(): WalletReceiptRecord[] {
    return Array.from(this.receiptsById.values()).sort((a, b) =>
      b.storedAt.localeCompare(a.storedAt),
    );
  }

  getReceiptById(id: string): WalletReceiptRecord | null {
    return this.receiptsById.get(id) ?? null;
  }

  getReceiptByReceiptId(receiptId: string): WalletReceiptRecord | null {
    return this.receiptsByReceiptId.get(receiptId) ?? null;
  }

  importReceipt(input: WalletReceiptImportInput): WalletReceiptRecord {
    const receipt = ContributionReceiptSchema.parse(input.receipt);
    const trace = input.trace ? trainingTraceSchema.parse(input.trace) : undefined;
    const recordId = `wrcpt_${crypto.randomUUID().replace(/-/g, "")}`;
    const storedAt = new Date().toISOString();
    const payload = { receipt, trace };
    const signature = signPayload(payload, this.keys);
    const record = WalletReceiptRecordSchema.parse({
      id: recordId,
      receiptId: receipt.id,
      storedAt,
      source: {
        receiptSource: input.receiptSource?.trim() || undefined,
        traceSource: input.traceSource?.trim() || undefined,
      },
      receipt,
      trace,
      signature,
    });
    this.receiptsById.set(record.id, record);
    this.receiptsByReceiptId.set(record.receiptId, record);
    this.persistReceipt(record);
    return record;
  }

  verifyReceipt(receiptId: string): WalletReceiptVerification {
    const record =
      this.receiptsByReceiptId.get(receiptId) ??
      this.receiptsById.get(receiptId);
    if (!record) {
      return { ok: false, issues: ["not_found"] };
    }
    const issues: string[] = [];
    const payload = { receipt: record.receipt, trace: record.trace };
    if (!verifySignature(payload, record.signature, this.keys.publicKeyPem)) {
      issues.push("signature_invalid");
    }
    let traceMatched: boolean | undefined;
    let certificateMatched: boolean | undefined;
    if (record.trace) {
      const traceId = record.trace.traceId ?? record.trace.id;
      traceMatched = record.receipt.verification.traceId
        ? record.receipt.verification.traceId === traceId
        : true;
      if (!traceMatched) {
        issues.push("trace_id_mismatch");
      }
      if (record.trace.pass !== true) {
        issues.push("trace_not_pass");
      }
      const receiptCert = record.receipt.verification.certificateHash;
      const traceCert = record.trace.certificate?.certificateHash ?? undefined;
      if (receiptCert && traceCert) {
        certificateMatched = receiptCert === traceCert;
        if (!certificateMatched) {
          issues.push("certificate_hash_mismatch");
        }
      }
      if (record.receipt.verification.integrityOk === true) {
        if (record.trace.certificate?.integrityOk !== true) {
          issues.push("certificate_integrity_missing");
        }
      }
    } else if (record.receipt.verification.traceId) {
      issues.push("trace_missing");
    }
    return {
      ok: issues.length === 0,
      issues,
      traceMatched,
      certificateMatched,
    };
  }

  buildDisclosure(request: WalletDisclosureRequest): WalletDisclosureResult {
    const record =
      this.receiptsByReceiptId.get(request.receiptId) ??
      this.receiptsById.get(request.receiptId);
    if (!record) {
      return { ok: false, error: "not_found" };
    }
    const shareLevel = sanitizeShareLevel(
      request.shareLevel,
      record.receipt.privacy.shareLevel,
      request.allowOverride,
    );
    const createdAt = new Date().toISOString();
    const payload = buildDisclosurePayload(
      record,
      shareLevel,
      request.includeTraceSummary,
      request.includePublicKey
        ? { keyId: this.keys.keyId, publicKeyPem: this.keys.publicKeyPem }
        : undefined,
    );
    const signature = signPayload(payload, this.keys);
    const disclosure = WalletDisclosureSchema.parse({
      id: `wdisc_${crypto.randomUUID().replace(/-/g, "")}`,
      receiptId: record.receiptId,
      shareLevel,
      createdAt,
      payload,
      signature,
    });
    return { ok: true, disclosure };
  }

  verifyDisclosure(disclosure: WalletDisclosure, publicKeyPem?: string): boolean {
    const payload = disclosure.payload;
    const key = publicKeyPem ?? this.keys.publicKeyPem;
    return verifySignature(payload, disclosure.signature, key);
  }

  private loadReceipts(): void {
    const logPath = path.join(this.dir, WALLET_RECEIPTS);
    if (!fs.existsSync(logPath)) return;
    try {
      const raw = fs.readFileSync(logPath, "utf8");
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = WalletReceiptRecordSchema.parse(JSON.parse(trimmed));
          this.receiptsById.set(parsed.id, parsed);
          this.receiptsByReceiptId.set(parsed.receiptId, parsed);
        } catch {
          continue;
        }
      }
    } catch {
      return;
    }
  }

  private persistReceipt(record: WalletReceiptRecord): void {
    const logPath = path.join(this.dir, WALLET_RECEIPTS);
    const line = `${JSON.stringify(record)}\n`;
    fs.appendFileSync(logPath, line, "utf8");
  }
}
