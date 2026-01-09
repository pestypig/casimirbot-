import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import type { ContributionReceipt } from "@shared/contributions/contributions.schema";
import {
  ContributionKindSchema,
  ContributionReceiptSchema,
} from "@shared/contributions/contributions.schema";
import {
  ContributionReceiptRecordSchema,
  ContributionReviewRoleSchema,
  type ContributionReviewRole as ContributionReviewRoleType,
  type ContributionRevocationRecord,
} from "@shared/contributions/contribution-storage.schema";
import type { Tier } from "@shared/ideology/ideology-verifiers.schema";
import { sha256Hex } from "../../utils/information-boundary";
import type { ContributionDraft, ContributionVerificationResult } from "./drafts";
import {
  getDisputeSummaryForReceipt,
  type ContributionDisputeSummary,
} from "./disputes";
import { recordContributionTraceLink } from "./trace-links";

export type ContributionReceiptStatus =
  | "cooldown"
  | "minted"
  | "revoked"
  | "rejected";

export type ContributionReceiptRecord = {
  id: string;
  seq: number;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  draftId: string;
  contributorId: string;
  status: ContributionReceiptStatus;
  plannedVcu: number;
  capped: boolean;
  ledgerAwardedVcu?: number;
  ledgerMintedAt?: string;
  ledgerRevokedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  mintedAt?: string;
  reviews: ContributionReview[];
  revocations: ContributionRevocationRecord[];
  receipt: ContributionReceipt;
};

export type ContributionReviewDecision = "approve" | "reject";
export type ContributionReviewRole = ContributionReviewRoleType;

export type ContributionReview = {
  id: string;
  reviewerId: string;
  createdAt: string;
  decision: ContributionReviewDecision;
  role: ContributionReviewRole;
  notes?: string;
};

export type ContributionReviewSummary = {
  required: number;
  approvals: number;
  rejections: number;
  roleCounts: Record<ContributionReviewRole, number>;
  roleMinimums: Record<ContributionReviewRole, number>;
  openDisputes: number;
  totalDisputes: number;
  ok: boolean;
};

export type ContributionReceiptDisclosure = {
  id: string;
  status: ContributionReceiptStatus;
  createdAt: string;
  updatedAt: string;
  mintedAt?: string;
  revokedAt?: string;
  draftId?: string;
  contributorId?: string;
  contributorRef?: string;
  nodeIds?: string[];
  truthFunctionIds?: string[];
  reviewSummary?: ContributionReviewSummary;
  disputeSummary?: ContributionDisputeSummary;
  reviews?: ContributionReview[];
  revocations?: ContributionRevocationRecord[];
  verification?: ContributionReceipt["verification"];
  cooldown?: ContributionReceipt["cooldown"];
  payout?: ContributionReceipt["payout"];
  privacy?: ContributionReceipt["privacy"];
};

export type CreateContributionReceiptInput = {
  draft: ContributionDraft;
  verification: ContributionVerificationResult;
  tenantId?: string;
  cooldownMs?: number;
  plannedVcu?: number;
  capped?: boolean;
  kind?: ContributionReceipt["kind"];
  shareLevel?: ContributionReceipt["privacy"]["shareLevel"];
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CONTRIBUTION_RECEIPT_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 5000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_RECEIPT_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_RECEIPT_ROTATE_MAX_FILES ?? 5,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const parseDefaultCooldownDays = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_RECEIPT_COOLDOWN_DAYS ?? 30,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 30;
  }
  return Math.min(Math.max(0, requested), 365);
};

const parseDefaultVcu = (): number => {
  const requested = Number(process.env.CONTRIBUTION_RECEIPT_DEFAULT_VCU ?? 1);  
  if (!Number.isFinite(requested) || requested < 0) {
    return 1;
  }
  return requested;
};

const parseRetentionDays = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_RECEIPT_RETENTION_DAYS ?? 180,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 180;
  }
  return Math.min(Math.max(0, requested), 3650);
};

const parseRetentionSweepMinutes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_RECEIPT_RETENTION_SWEEP_MINUTES ?? 10,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 10;
  }
  return Math.min(Math.max(1, requested), 1440);
};

const parseReviewMinimum = (value: string | undefined, fallback: number): number => {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested < 0) {
    return fallback;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 10);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED =
  process.env.CONTRIBUTION_RECEIPT_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const DEFAULT_COOLDOWN_MS = parseDefaultCooldownDays() * 24 * 60 * 60 * 1000;   
const DEFAULT_VCU = parseDefaultVcu();
const RETENTION_DAYS = parseRetentionDays();
const RETENTION_MS =
  RETENTION_DAYS > 0 ? RETENTION_DAYS * 24 * 60 * 60 * 1000 : null;
const RETENTION_SWEEP_MS =
  parseRetentionSweepMinutes() * 60 * 1000;
const RETENTION_COMPACT_ENABLED =
  process.env.CONTRIBUTION_RECEIPT_RETENTION_COMPACT !== "0";
const REVIEW_MIN_L2 = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L2_MIN_APPROVALS,
  2,
);
const REVIEW_MIN_L3 = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L3_MIN_APPROVALS,
  3,
);
const REVIEW_ROLE_MIN_L2_STEWARD = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L2_MIN_STEWARD,
  1,
);
const REVIEW_ROLE_MIN_L2_ARBITER = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L2_MIN_ARBITER,
  0,
);
const REVIEW_ROLE_MIN_L3_STEWARD = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L3_MIN_STEWARD,
  1,
);
const REVIEW_ROLE_MIN_L3_ARBITER = parseReviewMinimum(
  process.env.CONTRIBUTION_REVIEW_L3_MIN_ARBITER,
  1,
);
const REVIEW_ROLE_OVERRIDE_ENABLED =
  process.env.CONTRIBUTION_REVIEW_ALLOW_ROLE_OVERRIDE === "1";
const SHARE_ALLOW_PARTIAL =
  process.env.CONTRIBUTION_RECEIPT_ALLOW_PARTIAL === "1";
const SHARE_ALLOW_PUBLIC =
  process.env.CONTRIBUTION_RECEIPT_ALLOW_PUBLIC === "1";
const SHARE_ALLOW_NON_LOCAL =
  process.env.CONTRIBUTION_RECEIPT_ALLOW_NON_LOCAL === "1" ||
  SHARE_ALLOW_PARTIAL ||
  SHARE_ALLOW_PUBLIC;
const receiptBuffer: ContributionReceiptRecord[] = [];
const receiptById = new Map<string, ContributionReceiptRecord>();
let receiptSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();
let lastRetentionSweep = 0;

const TIER_ORDER: Tier[] = ["L0", "L1", "L2", "L3"];
const REVIEW_ROLE_ORDER: ContributionReviewRole[] = [
  "peer",
  "steward",
  "arbiter",
];

const resolveCooldownMs = (override?: number): number => {
  if (override === undefined || override === null || Number.isNaN(override)) {
    return DEFAULT_COOLDOWN_MS;
  }
  return Math.min(Math.max(0, Math.floor(override)), 365 * 24 * 60 * 60 * 1000);
};

const resolveShareLevel = (
  shareLevel?: ContributionReceipt["privacy"]["shareLevel"],
  canShare = true,
): ContributionReceipt["privacy"]["shareLevel"] => {
  if (!canShare) return "local";
  const desired = shareLevel ?? "local";
  if (desired === "local") return "local";
  if (!SHARE_ALLOW_NON_LOCAL) return "local";
  if (desired === "public" && SHARE_ALLOW_PUBLIC) return "public";
  if (desired === "partial" && SHARE_ALLOW_PARTIAL) return "partial";
  return "local";
};

const normalizeVcu = (value?: number): number => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return DEFAULT_VCU;
  }
  return Math.max(0, value);
};

const resolveCertificateHash = (
  verification: ContributionVerificationResult,
): string | undefined => {
  const hash =
    typeof verification.certificate?.certificateHash === "string"
      ? verification.certificate.certificateHash.trim()
      : "";
  return hash.length > 0 ? hash : undefined;
};

const resolveHighestTier = (
  verification: ContributionVerificationResult,
): Tier | undefined => {
  let highest: Tier | undefined;
  for (const entry of verification.truthFunctions) {
    if (!entry.tier) continue;
    if (!highest) {
      highest = entry.tier;
      continue;
    }
    if (TIER_ORDER.indexOf(entry.tier) > TIER_ORDER.indexOf(highest)) {
      highest = entry.tier;
    }
  }
  return highest;
};

const resolveReviewRequirement = (tier?: Tier): number => {
  if (!tier) return 0;
  if (tier === "L3") return REVIEW_MIN_L3;
  if (tier === "L2") return REVIEW_MIN_L2;
  return 0;
};

const resolveRoleMinimums = (tier?: Tier): Record<ContributionReviewRole, number> => {
  if (!tier) {
    return { peer: 0, steward: 0, arbiter: 0 };
  }
  if (tier === "L3") {
    return {
      peer: 0,
      steward: REVIEW_ROLE_MIN_L3_STEWARD,
      arbiter: REVIEW_ROLE_MIN_L3_ARBITER,
    };
  }
  if (tier === "L2") {
    return {
      peer: 0,
      steward: REVIEW_ROLE_MIN_L2_STEWARD,
      arbiter: REVIEW_ROLE_MIN_L2_ARBITER,
    };
  }
  return { peer: 0, steward: 0, arbiter: 0 };
};

const resolveExistingPath = (primary: string, fallback?: string) => {
  if (fs.existsSync(primary)) return primary;
  if (fallback && fs.existsSync(fallback)) return fallback;
  return primary;
};

let cachedReviewerRoles:
  | { path: string; mtimeMs: number; map: Map<string, ContributionReviewRole> }
  | null = null;

const parseReviewerRoleMap = (
  raw: unknown,
): Map<string, ContributionReviewRole> => {
  const map = new Map<string, ContributionReviewRole>();
  if (!raw || typeof raw !== "object") return map;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.trim()) continue;
    const parsed = ContributionReviewRoleSchema.safeParse(value);
    if (parsed.success) {
      map.set(key.trim(), parsed.data);
    }
  }
  return map;
};

const mergeReviewerRoleMaps = (
  base: Map<string, ContributionReviewRole>,
  override: Map<string, ContributionReviewRole>,
): Map<string, ContributionReviewRole> => {
  const merged = new Map(base);
  for (const [key, value] of override.entries()) {
    merged.set(key, value);
  }
  return merged;
};

const loadReviewerRoleMap = (): Map<string, ContributionReviewRole> => {
  const envRaw = process.env.CONTRIBUTION_REVIEWER_ROLE_MAP?.trim();
  let envMap = new Map<string, ContributionReviewRole>();
  if (envRaw) {
    try {
      envMap = parseReviewerRoleMap(JSON.parse(envRaw));
    } catch {
      envMap = new Map();
    }
  }
  const rolePath = resolveExistingPath(
    path.resolve(process.cwd(), "configs", "contribution-reviewers.json"),
    path.resolve(process.cwd(), "contribution-reviewers.json"),
  );
  if (!fs.existsSync(rolePath)) {
    return envMap;
  }
  const stats = fs.statSync(rolePath);
  if (
    cachedReviewerRoles &&
    cachedReviewerRoles.path === rolePath &&
    cachedReviewerRoles.mtimeMs === stats.mtimeMs
  ) {
    return mergeReviewerRoleMaps(envMap, cachedReviewerRoles.map);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(rolePath, "utf8"));
    const map = parseReviewerRoleMap(raw);
    cachedReviewerRoles = { path: rolePath, mtimeMs: stats.mtimeMs, map };
    return mergeReviewerRoleMaps(envMap, map);
  } catch {
    return envMap;
  }
};

const resolveReviewRole = (
  reviewerId: string,
  requestedRole?: ContributionReviewRole,
): ContributionReviewRole => {
  const map = loadReviewerRoleMap();
  const mapped = map.get(reviewerId);
  if (mapped) return mapped;
  if (requestedRole && REVIEW_ROLE_OVERRIDE_ENABLED) return requestedRole;
  return "peer";
};

export const getContributionReviewSummary = (
  record: ContributionReceiptRecord,
): ContributionReviewSummary => {
  const required = resolveReviewRequirement(record.receipt.verification.tier);
  const approvals = record.reviews.filter((r) => r.decision === "approve").length;
  const rejections = record.reviews.filter((r) => r.decision === "reject").length;
  const roleCounts: Record<ContributionReviewRole, number> = {
    peer: 0,
    steward: 0,
    arbiter: 0,
  };
  for (const review of record.reviews) {
    if (roleCounts[review.role] !== undefined) {
      roleCounts[review.role] += 1;
    }
  }
  const roleMinimums = resolveRoleMinimums(record.receipt.verification.tier);
  const meetsApprovals =
    required === 0 ? rejections === 0 : approvals >= required && rejections === 0;
  const meetsRoles = REVIEW_ROLE_ORDER.every(
    (role) => roleCounts[role] >= roleMinimums[role],
  );
  const disputeSummary = getDisputeSummaryForReceipt(record.id);
  const ok = meetsApprovals && meetsRoles && disputeSummary.open === 0;
  return {
    required,
    approvals,
    rejections,
    roleCounts,
    roleMinimums,
    openDisputes: disputeSummary.open,
    totalDisputes: disputeSummary.total,
    ok,
  };
};

const resolveVerdict = (
  verification: ContributionVerificationResult,
): ContributionReceipt["verification"]["verdict"] => {
  if (!verification.mintable) return "fail";
  const traceId = verification.traceId?.trim();
  if (!traceId) return "fail";
  return "pass";
};

const resolveReceiptKind = (
  input?: ContributionReceipt["kind"],
  fallback?: ContributionReceipt["kind"],
): ContributionReceipt["kind"] => input ?? fallback ?? "interpretation";        

const normalizeDraftKind = (
  draftKind?: string,
): ContributionReceipt["kind"] | undefined => {
  if (!draftKind) return undefined;
  const parsed = ContributionKindSchema.safeParse(draftKind);
  return parsed.success ? parsed.data : undefined;
};

const isCooldownComplete = (endsAt: string, now: number): boolean => {
  const parsed = Date.parse(endsAt);
  if (!Number.isFinite(parsed)) return false;
  return parsed <= now;
};

const isRetentionExpired = (
  record: ContributionReceiptRecord,
  now: number,
): boolean => {
  if (!RETENTION_MS) return false;
  const created = Date.parse(record.createdAt);
  if (!Number.isFinite(created)) return false;
  return created < now - RETENTION_MS;
};

const compactReceiptLog = async (
  records: ContributionReceiptRecord[],
): Promise<void> => {
  if (!AUDIT_PERSIST_ENABLED || !RETENTION_COMPACT_ENABLED) {
    return;
  }
  const lines = records
    .sort((a, b) => a.seq - b.seq)
    .map((record) => JSON.stringify(record))
    .join("\n");
  const payload = lines ? `${lines}\n` : "";
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await fsPromises.writeFile(AUDIT_LOG_PATH, payload, "utf8");
      persistedBytes = Buffer.byteLength(payload, "utf8");
    })
    .catch((error) => {
      console.warn("[contribution-receipts] failed to compact audit log", error);
    });
};

const sweepRetention = (now: number, force = false): void => {
  if (!RETENTION_MS) return;
  if (!force && now - lastRetentionSweep < RETENTION_SWEEP_MS) return;
  lastRetentionSweep = now;
  const retained: ContributionReceiptRecord[] = [];
  let removed = 0;
  for (const record of receiptById.values()) {
    if (isRetentionExpired(record, now)) {
      removed += 1;
      continue;
    }
    retained.push(record);
  }
  if (removed === 0) return;
  receiptById.clear();
  for (const record of retained) {
    receiptById.set(record.id, record);
  }
  receiptBuffer.splice(
    0,
    receiptBuffer.length,
    ...retained.slice(-MAX_BUFFER_SIZE),
  );
  void compactReceiptLog(retained);
};

const nextSequence = (): number => {
  receiptSequence += 1;
  return receiptSequence;
};

const persistReceiptRecord = (record: ContributionReceiptRecord): void => {
  if (!AUDIT_PERSIST_ENABLED) {
    return;
  }
  const line = JSON.stringify(record);
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await maybeRotateAuditLog(lineBytes);
      await fsPromises.appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
      persistedBytes += lineBytes;
    })
    .catch((error) => {
      console.warn("[contribution-receipts] failed to persist audit log", error);
    });
};

const storeReceiptRecord = (record: ContributionReceiptRecord): void => {
  receiptById.set(record.id, record);
  receiptBuffer.push(record);
  if (receiptBuffer.length > MAX_BUFFER_SIZE) {
    receiptBuffer.splice(0, receiptBuffer.length - MAX_BUFFER_SIZE);
  }
};

const updateReceiptRecord = (
  record: ContributionReceiptRecord,
  updater: (record: ContributionReceiptRecord) => ContributionReceiptRecord,
): ContributionReceiptRecord => {
  const updated = updater(record);
  const nextRecord = { ...updated, seq: nextSequence() };
  receiptById.set(nextRecord.id, nextRecord);
  persistReceiptRecord(nextRecord);
  return nextRecord;
};

export const updateContributionReceipt = (
  id: string,
  updater: (record: ContributionReceiptRecord) => ContributionReceiptRecord,
): ContributionReceiptRecord | null => {
  const record = receiptById.get(id);
  if (!record) return null;
  return updateReceiptRecord(record, updater);
};

export const getContributionReceiptEntries = (): ContributionReceiptRecord[] => {
  sweepRetention(Date.now());
  return Array.from(receiptById.values());
};

const buildContributorRef = (value: string): string => sha256Hex(value);

export const addContributionReceiptReview = (
  id: string,
  input: {
    reviewerId: string;
    decision: ContributionReviewDecision;
    notes?: string;
    role?: ContributionReviewRole;
  },
): { ok: true; record: ContributionReceiptRecord; summary: ContributionReviewSummary }
  | { ok: false; error: string } => {
  sweepRetention(Date.now());
  const record = receiptById.get(id);
  if (!record) {
    return { ok: false, error: "not_found" };
  }
  if (record.receipt.verification.verdict !== "pass") {
    return { ok: false, error: "verification_fail" };
  }
  if (input.reviewerId === record.contributorId) {
    return { ok: false, error: "self_review_not_allowed" };
  }
  const nowIso = new Date().toISOString();
  const resolvedRole = resolveReviewRole(input.reviewerId, input.role);
  const reviews = record.reviews.slice();
  const existingIndex = reviews.findIndex(
    (review) => review.reviewerId === input.reviewerId,
  );
  const nextReview: ContributionReview = {
    id: existingIndex >= 0 ? reviews[existingIndex].id : crypto.randomUUID(),
    reviewerId: input.reviewerId,
    createdAt: nowIso,
    decision: input.decision,
    role: resolvedRole,
    notes: input.notes?.trim() || undefined,
  };
  if (existingIndex >= 0) {
    reviews[existingIndex] = nextReview;
  } else {
    reviews.push(nextReview);
  }
  const updated = updateReceiptRecord(record, (current) => ({
    ...current,
    reviews,
    updatedAt: nowIso,
  }));
  return {
    ok: true,
    record: updated,
    summary: getContributionReviewSummary(updated),
  };
};

export const discloseContributionReceipt = (
  record: ContributionReceiptRecord,
  viewerId?: string | null,
): ContributionReceiptDisclosure | null => {
  const shareLevel = record.receipt.privacy.shareLevel;
  const isOwner = !!viewerId && viewerId === record.contributorId;
  if (!isOwner && shareLevel === "local") {
    return null;
  }
  const base: ContributionReceiptDisclosure = {
    id: record.id,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    mintedAt: record.mintedAt,
    revokedAt: record.revokedAt,
    reviewSummary: getContributionReviewSummary(record),
    disputeSummary: getDisputeSummaryForReceipt(record.id),
    privacy: record.receipt.privacy,
  };
  if (isOwner) {
    return {
      ...base,
      draftId: record.draftId,
      contributorId: record.contributorId,
      reviews: record.reviews,
      revocations: record.revocations,
      nodeIds: record.receipt.nodeIds,
      truthFunctionIds: record.receipt.truthFunctionIds,
      verification: record.receipt.verification,
      cooldown: record.receipt.cooldown,
      payout: record.receipt.payout,
    };
  }
  const contributorRef = buildContributorRef(record.contributorId);
  const shared = {
    ...base,
    contributorRef,
    nodeIds: record.receipt.nodeIds,
    truthFunctionIds: record.receipt.truthFunctionIds,
  };
  if (shareLevel === "public") {
    return {
      ...shared,
      verification: record.receipt.verification,
    };
  }
  return {
    ...shared,
    verification: {
      verdict: record.receipt.verification.verdict,
      tier: record.receipt.verification.tier,
    },
  };
};

const settleReceiptRecord = (
  record: ContributionReceiptRecord,
  now: number,
): ContributionReceiptRecord => {
  if (record.status === "revoked" || record.status === "rejected") {
    return record;
  }
  const verdict = record.receipt.verification.verdict;
  if (verdict === "fail") {
    return updateReceiptRecord(record, (current) => ({
      ...current,
      status: "rejected",
      plannedVcu: 0,
      updatedAt: new Date().toISOString(),
      receipt: {
        ...current.receipt,
        payout: { ...current.receipt.payout, vcu: 0 },
      },
    }));
  }
  if (isCooldownComplete(record.receipt.cooldown.endsAt, now)) {
    if (record.status === "minted") {
      return record;
    }
    return updateReceiptRecord(record, (current) => ({
      ...current,
      status: "minted",
      mintedAt: new Date(now).toISOString(),
      updatedAt: new Date().toISOString(),
      receipt: {
        ...current.receipt,
        payout: { ...current.receipt.payout, vcu: 0 },
      },
    }));
  }
  if (record.receipt.payout.vcu !== 0) {
    return updateReceiptRecord(record, (current) => ({
      ...current,
      status: "cooldown",
      updatedAt: new Date().toISOString(),
      receipt: {
        ...current.receipt,
        payout: { ...current.receipt.payout, vcu: 0 },
      },
    }));
  }
  if (record.status !== "cooldown") {
    return updateReceiptRecord(record, (current) => ({
      ...current,
      status: "cooldown",
      updatedAt: new Date().toISOString(),
    }));
  }
  return record;
};

export const createContributionReceipt = (
  input: CreateContributionReceiptInput,
): ContributionReceiptRecord => {
  sweepRetention(Date.now());
  const now = new Date();
  const nowIso = now.toISOString();
  const cooldownMs = resolveCooldownMs(input.cooldownMs);
  const endsAt = new Date(now.getTime() + cooldownMs).toISOString();
  const plannedVcu = normalizeVcu(input.plannedVcu);
  const capped = input.capped ?? false;

  const verdict = resolveVerdict(input.verification);
  const status: ContributionReceiptStatus =
    verdict === "fail"
      ? "rejected"
      : cooldownMs === 0
        ? "minted"
        : "cooldown";
  const payoutVcu = 0;
  const receiptId = `rcpt_${crypto.randomUUID().replace(/-/g, "")}`;

  const receipt: ContributionReceipt = ContributionReceiptSchema.parse({
    id: receiptId,
    contributorId: input.draft.contributorId,
    createdAt: nowIso,
    kind: resolveReceiptKind(input.kind, normalizeDraftKind(input.draft.kind)),
    nodeIds: input.draft.nodeIds,
    truthFunctionIds: input.draft.truthFunctions.map(
      (entry) => entry.truthFunction.id,
    ),
    verification: {
      verdict,
      traceId: input.verification.traceId?.trim() || undefined,
      certificateHash: resolveCertificateHash(input.verification),
      integrityOk: input.verification.certificate?.integrityOk,
      tier: resolveHighestTier(input.verification),
    },
    cooldown: {
      startsAt: nowIso,
      endsAt,
    },
    payout: {
      vcu: payoutVcu,
      capped,
    },
    privacy: {
      shareLevel: resolveShareLevel(input.shareLevel, verdict === "pass"),
    },
  });

  const record: ContributionReceiptRecord = {
    id: receipt.id,
    seq: nextSequence(),
    createdAt: nowIso,
    updatedAt: nowIso,
    tenantId: input.tenantId,
    draftId: input.draft.id,
    contributorId: input.draft.contributorId,
    status,
    plannedVcu: verdict === "fail" ? 0 : plannedVcu,
    capped,
    mintedAt: status === "minted" ? nowIso : undefined,
    reviews: [],
    revocations: [],
    receipt,
  };

  storeReceiptRecord(record);
  persistReceiptRecord(record);
  if (receipt.verification.traceId) {
    recordContributionTraceLink({
      traceId: receipt.verification.traceId,
      kind: "receipt",
      tenantId: input.tenantId,
      contributionId: input.draft.id,
      receiptId: receipt.id,
      truthFunctionIds: receipt.truthFunctionIds,
    });
  }
  return record;
};

export const getContributionReceipt = (
  id: string,
): ContributionReceiptRecord | null => {
  sweepRetention(Date.now());
  const record = receiptById.get(id);
  if (!record) return null;
  const settled = settleReceiptRecord(record, Date.now());
  return settled;
};

export const listContributionReceipts = (opts?: {
  contributorId?: string | null;
  tenantId?: string | null;
  status?: ContributionReceiptStatus;
  limit?: number;
}): ContributionReceiptRecord[] => {
  sweepRetention(Date.now());
  const limit = Math.max(1, Math.min(opts?.limit ?? 50, 200));
  const now = Date.now();
  const contributorId = opts?.contributorId?.trim() || null;
  const tenantId = opts?.tenantId?.trim() || null;
  const status = opts?.status;
  const records = Array.from(receiptById.values())
    .map((record) => settleReceiptRecord(record, now))
    .filter((record) =>
      contributorId ? record.contributorId === contributorId : true,
    )
    .filter((record) => (tenantId ? record.tenantId === tenantId : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return records;
};

export const revokeContributionReceipt = (
  id: string,
  input?: {
    reason?: string;
    actorId?: string;
    source?: ContributionRevocationRecord["source"];
  },
): ContributionReceiptRecord | null => {
  const record = receiptById.get(id);
  if (!record) return null;
  if (record.status === "revoked") return record;
  const nowIso = new Date().toISOString();
  const revocation: ContributionRevocationRecord = {
    id: `rev_${crypto.randomUUID().replace(/-/g, "")}`,
    revokedAt: nowIso,
    actorId: input?.actorId,
    reason: input?.reason?.trim() || record.revocationReason,
    source: input?.source ?? "manual",
  };
  return updateReceiptRecord(record, (current) => ({
    ...current,
    status: "revoked",
    plannedVcu: 0,
    revokedAt: nowIso,
    revocationReason: input?.reason?.trim() || current.revocationReason,
    updatedAt: nowIso,
    revocations: [...(current.revocations ?? []), revocation],
    receipt: {
      ...current.receipt,
      payout: { ...current.receipt.payout, vcu: 0 },
    },
  }));
};

export const __resetContributionReceiptStore = (): void => {
  receiptById.clear();
  receiptBuffer.length = 0;
  receiptSequence = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.CONTRIBUTION_RECEIPT_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.CONTRIBUTION_RECEIPT_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "contribution-receipts.jsonl");
}

function loadPersistedBytes(): number {
  if (!AUDIT_PERSIST_ENABLED) {
    return 0;
  }
  try {
    const stat = fs.statSync(AUDIT_LOG_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function readPersistedRecords(): ContributionReceiptRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: ContributionReceiptRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = ContributionReceiptRecordSchema.safeParse(record);       
        if (result.success) {
          parsed.push(result.data);
          continue;
        }
        const legacy = record as ContributionReceiptRecord;
        if (legacy && legacy.id && legacy.receipt) {
          const reviews = Array.isArray(legacy.reviews)
            ? legacy.reviews.map((review) => ({
                ...review,
                role: review.role ?? "peer",
              }))
            : [];
          const revocations = Array.isArray(legacy.revocations)
            ? legacy.revocations
            : [];
          parsed.push({ ...legacy, reviews, revocations });
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[contribution-receipts] failed to read audit log", error);
    return [];
  }
}

function hydrateFromPersisted(): void {
  const persisted = readPersistedRecords();
  if (persisted.length === 0) return;
  for (const record of persisted) {
    receiptById.set(record.id, record);
    receiptBuffer.push(record);
    if (record.seq > receiptSequence) {
      receiptSequence = record.seq;
    }
  }
  if (receiptBuffer.length > MAX_BUFFER_SIZE) {
    receiptBuffer.splice(0, receiptBuffer.length - MAX_BUFFER_SIZE);
  }
}

function maybeRotateAuditLog(nextBytes: number): Promise<void> {
  if (ROTATE_MAX_BYTES <= 0) return Promise.resolve();
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) {
    return Promise.resolve();
  }
  return rotateAuditLog();
}

async function rotateAuditLog(): Promise<void> {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(AUDIT_LOG_PATH);
  const ext = path.extname(AUDIT_LOG_PATH) || ".jsonl";
  const base = path.basename(AUDIT_LOG_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  await fsPromises.rename(AUDIT_LOG_PATH, rotated);
  persistedBytes = 0;
  await pruneAuditRotations(dir, base, ext);
}

async function pruneAuditRotations(
  dir: string,
  base: string,
  ext: string,
): Promise<void> {
  if (ROTATE_MAX_FILES <= 0) return;
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const prefix = `${base}.`;
  const candidates = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(prefix) &&
        entry.name.endsWith(ext),
    )
    .map((entry) => entry.name)
    .sort();
  const excess = candidates.length - ROTATE_MAX_FILES;
  if (excess <= 0) return;
  const toRemove = candidates.slice(0, excess);
  await Promise.all(
    toRemove.map((name) =>
      fsPromises.unlink(path.join(dir, name)).catch(() => undefined),
    ),
  );
}

hydrateFromPersisted();
sweepRetention(Date.now(), true);
