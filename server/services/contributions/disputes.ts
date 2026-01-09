import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  ContributionDisputeLogSchema,
  type ContributionDisputeAction,
  type ContributionDisputeLogRecord,
  type ContributionDisputeRecord,
  type ContributionDisputeResolutionRecord,
  type ContributionDisputeStatus,
} from "@shared/contributions/contribution-storage.schema";

export type ContributionDisputeInput = {
  receiptId: string;
  contributorId: string;
  reason: string;
  action: ContributionDisputeAction;
  evidenceRefs?: string[];
  tenantId?: string;
};

export type ContributionDisputeResolutionInput = {
  decision: "accept" | "reject";
  resolvedBy: string;
  action?: ContributionDisputeAction;
  notes?: string;
  tenantId?: string;
};

export type ContributionDisputeQuery = {
  receiptId?: string;
  contributorId?: string;
  status?: ContributionDisputeStatus;
  tenantId?: string;
  limit?: number;
};

export type ContributionDisputeSummary = {
  total: number;
  open: number;
  latestUpdatedAt?: string;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CONTRIBUTION_DISPUTE_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DISPUTE_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DISPUTE_ROTATE_MAX_FILES ?? 5,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const parseRetentionDays = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DISPUTE_RETENTION_DAYS ?? 180,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 180;
  }
  return Math.min(Math.max(0, requested), 3650);
};

const parseRetentionSweepMinutes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DISPUTE_RETENTION_SWEEP_MINUTES ?? 10,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 10;
  }
  return Math.min(Math.max(1, requested), 1440);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED =
  process.env.CONTRIBUTION_DISPUTE_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const RETENTION_DAYS = parseRetentionDays();
const RETENTION_MS =
  RETENTION_DAYS > 0 ? RETENTION_DAYS * 24 * 60 * 60 * 1000 : null;
const RETENTION_SWEEP_MS = parseRetentionSweepMinutes() * 60 * 1000;
const RETENTION_COMPACT_ENABLED =
  process.env.CONTRIBUTION_DISPUTE_RETENTION_COMPACT !== "0";
const disputeById = new Map<string, ContributionDisputeLogRecord>();
const disputeBuffer: ContributionDisputeLogRecord[] = [];
let disputeSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();
let lastRetentionSweep = 0;

const nextSequence = (): number => {
  disputeSequence += 1;
  return disputeSequence;
};

const storeRecord = (record: ContributionDisputeLogRecord): void => {
  disputeById.set(record.id, record);
  disputeBuffer.push(record);
  if (disputeBuffer.length > MAX_BUFFER_SIZE) {
    disputeBuffer.splice(0, disputeBuffer.length - MAX_BUFFER_SIZE);
  }
};

const persistRecord = (record: ContributionDisputeLogRecord): void => {
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
      console.warn("[contribution-disputes] failed to persist audit log", error);
    });
};

const updateRecord = (
  record: ContributionDisputeLogRecord,
  updater: (record: ContributionDisputeRecord) => ContributionDisputeRecord,
): ContributionDisputeLogRecord => {
  const updated = updater(record.dispute);
  const nextRecord: ContributionDisputeLogRecord = {
    ...record,
    seq: nextSequence(),
    dispute: updated,
  };
  disputeById.set(record.id, nextRecord);
  persistRecord(nextRecord);
  return nextRecord;
};

const isRetentionExpired = (
  record: ContributionDisputeLogRecord,
  now: number,
): boolean => {
  if (!RETENTION_MS) return false;
  const created = Date.parse(record.dispute.createdAt);
  if (!Number.isFinite(created)) return false;
  return created < now - RETENTION_MS;
};

const compactDisputeLog = async (
  records: ContributionDisputeLogRecord[],
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
      console.warn("[contribution-disputes] failed to compact audit log", error);
    });
};

const sweepRetention = (now: number, force = false): void => {
  if (!RETENTION_MS) return;
  if (!force && now - lastRetentionSweep < RETENTION_SWEEP_MS) return;
  lastRetentionSweep = now;
  const retained: ContributionDisputeLogRecord[] = [];
  let removed = 0;
  for (const record of disputeById.values()) {
    if (isRetentionExpired(record, now)) {
      removed += 1;
      continue;
    }
    retained.push(record);
  }
  if (removed === 0) return;
  disputeById.clear();
  for (const record of retained) {
    disputeById.set(record.id, record);
  }
  disputeBuffer.splice(
    0,
    disputeBuffer.length,
    ...retained.slice(-MAX_BUFFER_SIZE),
  );
  void compactDisputeLog(retained);
};

const isOpen = (status: ContributionDisputeStatus): boolean => status === "open";

export const listContributionDisputes = (
  opts: ContributionDisputeQuery = {},
): ContributionDisputeRecord[] => {
  sweepRetention(Date.now());
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  const receiptId = opts.receiptId?.trim();
  const contributorId = opts.contributorId?.trim();
  const tenantId = opts.tenantId?.trim();
  const status = opts.status;
  return Array.from(disputeById.values())
    .filter((record) => (receiptId ? record.dispute.receiptId === receiptId : true))
    .filter((record) =>
      contributorId ? record.dispute.contributorId === contributorId : true,
    )
    .filter((record) => (tenantId ? record.tenantId === tenantId : true))
    .filter((record) => (status ? record.dispute.status === status : true))
    .sort((a, b) => b.dispute.createdAt.localeCompare(a.dispute.createdAt))
    .slice(0, limit)
    .map((entry) => entry.dispute);
};

export const getContributionDispute = (
  id: string,
): ContributionDisputeRecord | null => {
  sweepRetention(Date.now());
  return disputeById.get(id)?.dispute ?? null;
};

export const getDisputeSummaryForReceipt = (
  receiptId: string,
): ContributionDisputeSummary => {
  sweepRetention(Date.now());
  let total = 0;
  let open = 0;
  let latestUpdatedAt: string | undefined;
  for (const entry of disputeById.values()) {
    if (entry.dispute.receiptId !== receiptId) continue;
    total += 1;
    if (isOpen(entry.dispute.status)) open += 1;
    if (
      !latestUpdatedAt ||
      entry.dispute.updatedAt.localeCompare(latestUpdatedAt) > 0
    ) {
      latestUpdatedAt = entry.dispute.updatedAt;
    }
  }
  return { total, open, latestUpdatedAt };
};

export const hasOpenDispute = (receiptId: string): boolean =>
  getDisputeSummaryForReceipt(receiptId).open > 0;

export const createContributionDispute = (
  input: ContributionDisputeInput,
): { ok: true; dispute: ContributionDisputeRecord } | { ok: false; error: string } => {
  sweepRetention(Date.now());
  const receiptId = input.receiptId.trim();
  const contributorId = input.contributorId.trim();
  const reason = input.reason.trim();
  if (!receiptId || !contributorId || !reason) {
    return { ok: false, error: "invalid_payload" };
  }
  if (hasOpenDispute(receiptId)) {
    return { ok: false, error: "dispute_already_open" };
  }
  const nowIso = new Date().toISOString();
  const dispute: ContributionDisputeRecord = {
    id: `disp_${crypto.randomUUID().replace(/-/g, "")}`,
    receiptId,
    contributorId,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "open",
    reason,
    action: input.action,
    evidenceRefs: input.evidenceRefs?.filter((ref) => ref.trim().length > 0) ?? [],
    resolution: undefined,
  };
  const record = ContributionDisputeLogSchema.parse({
    id: dispute.id,
    seq: nextSequence(),
    tenantId: input.tenantId,
    dispute,
  });
  storeRecord(record);
  persistRecord(record);
  return { ok: true, dispute: record.dispute };
};

export const resolveContributionDispute = (
  id: string,
  input: ContributionDisputeResolutionInput,
): { ok: true; dispute: ContributionDisputeRecord } | { ok: false; error: string } => {
  sweepRetention(Date.now());
  const record = disputeById.get(id);
  if (!record) {
    return { ok: false, error: "not_found" };
  }
  if (record.tenantId && input.tenantId && record.tenantId !== input.tenantId) {
    return { ok: false, error: "tenant_mismatch" };
  }
  if (record.dispute.status !== "open") {
    return { ok: false, error: "dispute_closed" };
  }
  const nowIso = new Date().toISOString();
  const resolution: ContributionDisputeResolutionRecord = {
    decision: input.decision,
    resolvedBy: input.resolvedBy,
    resolvedAt: nowIso,
    action: input.action,
    notes: input.notes?.trim() || undefined,
  };
  const status: ContributionDisputeStatus =
    input.decision === "accept" ? "accepted" : "rejected";
  const updated = updateRecord(record, (current) => ({
    ...current,
    status,
    updatedAt: nowIso,
    resolution,
  }));
  return { ok: true, dispute: updated.dispute };
};

export const __resetContributionDisputeStore = (): void => {
  disputeById.clear();
  disputeBuffer.length = 0;
  disputeSequence = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.CONTRIBUTION_DISPUTE_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.CONTRIBUTION_DISPUTE_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "contribution-disputes.jsonl");
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

function readPersistedRecords(): ContributionDisputeLogRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: ContributionDisputeLogRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = ContributionDisputeLogSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[contribution-disputes] failed to read audit log", error);
    return [];
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

function hydrateFromPersisted(): void {
  const persisted = readPersistedRecords();
  if (persisted.length === 0) return;
  for (const record of persisted) {
    disputeById.set(record.id, record);
    disputeBuffer.push(record);
    if (record.seq > disputeSequence) {
      disputeSequence = record.seq;
    }
  }
  if (disputeBuffer.length > MAX_BUFFER_SIZE) {
    disputeBuffer.splice(0, disputeBuffer.length - MAX_BUFFER_SIZE);
  }
}

hydrateFromPersisted();
sweepRetention(Date.now(), true);
