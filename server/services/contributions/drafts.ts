import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import type { WhyBelongs } from "@shared/rationale";
import type { TruthFunction } from "@shared/contributions/contributions.schema";
import type {
  TruthFunctionCompileError,
  TruthFunctionExecutionPlan,
} from "@shared/contributions/truth-function-compiler";
import type { Risk, Tier } from "@shared/ideology/ideology-verifiers.schema";
import type { TrainingTraceCertificate } from "@shared/schema";
import {
  ContributionDraftLogSchema,
  type ContributionDraftLogRecord,
} from "@shared/contributions/contribution-storage.schema";
import { upsertTruthFunctionRecord } from "./truth-functions";

export type ContributionClaim = {
  id: string;
  text: string;
  kind: "prediction" | "mechanism" | "threshold";
};

export type TruthFunctionDraft = {
  truthFunction: TruthFunction;
  compilation: {
    ok: boolean;
    plan?: TruthFunctionExecutionPlan;
    errors?: TruthFunctionCompileError[];
  };
};

export type ContributionVerificationStep = {
  truthFunctionId: string;
  kind: "test" | "query" | "rule";
  ref: string;
  ok: boolean;
  message?: string;
};

export type ContributionTruthFunctionResult = {
  truthFunctionId: string;
  ok: boolean;
  tier?: Tier;
  risk?: Risk;
  errors?: TruthFunctionCompileError[];
};

export type ContributionVerificationResult = {
  ok: boolean;
  mintable: boolean;
  traceId: string;
  certificateRequired: boolean;
  certificateOk: boolean;
  certificate?: TrainingTraceCertificate;
  steps: ContributionVerificationStep[];
  truthFunctions: ContributionTruthFunctionResult[];
  errors?: string[];
};

export type ContributionDraft = {
  id: string;
  contributorId: string;
  createdAt: string;
  updatedAt: string;
  status: "draft";
  kind?: string;
  text: string;
  nodeIds: string[];
  claims: ContributionClaim[];
  why: WhyBelongs;
  truthFunctions: TruthFunctionDraft[];
  verification?: ContributionVerificationResult;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CONTRIBUTION_DRAFT_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DRAFT_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DRAFT_ROTATE_MAX_FILES ?? 5,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const parseRetentionDays = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DRAFT_RETENTION_DAYS ?? 180,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 180;
  }
  return Math.min(Math.max(0, requested), 3650);
};

const parseRetentionSweepMinutes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_DRAFT_RETENTION_SWEEP_MINUTES ?? 10,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 10;
  }
  return Math.min(Math.max(1, requested), 1440);
};

const MAX_DRAFTS = 500;
const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.CONTRIBUTION_DRAFT_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const RETENTION_DAYS = parseRetentionDays();
const RETENTION_MS =
  RETENTION_DAYS > 0 ? RETENTION_DAYS * 24 * 60 * 60 * 1000 : null;
const RETENTION_SWEEP_MS = parseRetentionSweepMinutes() * 60 * 1000;
const RETENTION_COMPACT_ENABLED =
  process.env.CONTRIBUTION_DRAFT_RETENTION_COMPACT !== "0";
const draftById = new Map<string, ContributionDraftLogRecord>();
const draftBuffer: ContributionDraftLogRecord[] = [];
let draftSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();
let lastRetentionSweep = 0;

const nextSequence = (): number => {
  draftSequence += 1;
  return draftSequence;
};

const storeDraftRecord = (record: ContributionDraftLogRecord): void => {
  draftById.set(record.id, record);
  draftBuffer.push(record);
  if (draftBuffer.length > MAX_BUFFER_SIZE) {
    draftBuffer.splice(0, draftBuffer.length - MAX_BUFFER_SIZE);
  }
};

const persistDraftRecord = (record: ContributionDraftLogRecord): void => {
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
      console.warn("[contribution-drafts] failed to persist audit log", error);
    });
};

const updateDraftRecord = (
  record: ContributionDraftLogRecord,
  draft: ContributionDraft,
): ContributionDraftLogRecord => {
  const nextRecord: ContributionDraftLogRecord = {
    ...record,
    seq: nextSequence(),
    draft,
  };
  draftById.set(record.id, nextRecord);
  persistDraftRecord(nextRecord);
  return nextRecord;
};

const isRetentionExpired = (
  record: ContributionDraftLogRecord,
  now: number,
): boolean => {
  if (!RETENTION_MS) return false;
  const created = Date.parse(record.draft.createdAt);
  if (!Number.isFinite(created)) return false;
  return created < now - RETENTION_MS;
};

const compactDraftLog = async (
  records: ContributionDraftLogRecord[],
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
      console.warn("[contribution-drafts] failed to compact audit log", error);
    });
};

const sweepRetention = (now: number, force = false): void => {
  if (!RETENTION_MS) return;
  if (!force && now - lastRetentionSweep < RETENTION_SWEEP_MS) return;
  lastRetentionSweep = now;
  const retained: ContributionDraftLogRecord[] = [];
  let removed = 0;
  for (const record of draftById.values()) {
    if (isRetentionExpired(record, now)) {
      removed += 1;
      continue;
    }
    retained.push(record);
  }
  if (removed === 0) return;
  draftById.clear();
  for (const record of retained) {
    draftById.set(record.id, record);
  }
  draftBuffer.splice(
    0,
    draftBuffer.length,
    ...retained.slice(-MAX_BUFFER_SIZE),
  );
  void compactDraftLog(retained);
};

const pruneDrafts = () => {
  if (draftById.size <= MAX_DRAFTS) return;
  const ordered = Array.from(draftById.values()).sort((a, b) =>
    a.draft.createdAt.localeCompare(b.draft.createdAt),
  );
  const toRemove = ordered.length - MAX_DRAFTS;
  const toRemoveIds = new Set<string>();
  for (let i = 0; i < toRemove; i += 1) {
    const record = ordered[i];
    draftById.delete(record.id);
    toRemoveIds.add(record.id);
  }
  if (toRemoveIds.size > 0) {
    draftBuffer.splice(
      0,
      draftBuffer.length,
      ...draftBuffer.filter((record) => !toRemoveIds.has(record.id)),
    );
  }
};

export const createContributionDraft = (
  draft: ContributionDraft,
  opts?: { tenantId?: string },
): ContributionDraft => {
  sweepRetention(Date.now());
  const record = ContributionDraftLogSchema.parse({
    id: draft.id,
    seq: nextSequence(),
    tenantId: opts?.tenantId,
    draft,
  });
  storeDraftRecord(record);
  persistDraftRecord(record);
  for (const entry of draft.truthFunctions) {
    upsertTruthFunctionRecord({
      truthFunction: entry.truthFunction,
      contributorId: draft.contributorId,
      tenantId: opts?.tenantId,
      sourceContributionId: draft.id,
    });
  }
  pruneDrafts();
  return draft;
};

export const getContributionDraft = (id: string): ContributionDraft | null => {
  sweepRetention(Date.now());
  return draftById.get(id)?.draft ?? null;
};

export const listContributionDrafts = (opts?: {
  contributorId?: string | null;
  tenantId?: string | null;
  limit?: number;
}): ContributionDraft[] => {
  sweepRetention(Date.now());
  const contributorId = opts?.contributorId?.trim() || null;
  const tenantId = opts?.tenantId?.trim() || null;
  const limit = Math.max(1, Math.min(opts?.limit ?? 50, 200));
  const filtered = Array.from(draftById.values()).filter((record) =>
    contributorId ? record.draft.contributorId === contributorId : true,
  );
  const tenantFiltered = tenantId
    ? filtered.filter((record) => record.tenantId === tenantId)
    : filtered;
  return tenantFiltered
    .map((record) => record.draft)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
};

export const makeContributionDraftId = (): string =>
  crypto.randomUUID().replace(/-/g, "");

export const updateContributionDraft = (
  id: string,
  updater: (draft: ContributionDraft) => ContributionDraft,
): ContributionDraft | null => {
  sweepRetention(Date.now());
  const record = draftById.get(id);
  if (!record) return null;
  const nextDraft = updater(record.draft);
  const nextRecord = updateDraftRecord(record, nextDraft);
  for (const entry of nextDraft.truthFunctions) {
    upsertTruthFunctionRecord({
      truthFunction: entry.truthFunction,
      contributorId: nextDraft.contributorId,
      tenantId: nextRecord.tenantId,
      sourceContributionId: nextDraft.id,
    });
  }
  return nextDraft;
};

export const __resetContributionDraftStore = (): void => {
  draftById.clear();
  draftBuffer.length = 0;
  draftSequence = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.CONTRIBUTION_DRAFT_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.CONTRIBUTION_DRAFT_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "contribution-drafts.jsonl");
}

function readPersistedRecords(): ContributionDraftLogRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: ContributionDraftLogRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = ContributionDraftLogSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[contribution-drafts] failed to read audit log", error);
    return [];
  }
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
    draftById.set(record.id, record);
    draftBuffer.push(record);
    if (record.seq > draftSequence) {
      draftSequence = record.seq;
    }
    for (const entry of record.draft.truthFunctions) {
      upsertTruthFunctionRecord({
        truthFunction: entry.truthFunction,
        contributorId: record.draft.contributorId,
        tenantId: record.tenantId,
        sourceContributionId: record.draft.id,
      });
    }
  }
  if (draftBuffer.length > MAX_BUFFER_SIZE) {
    draftBuffer.splice(0, draftBuffer.length - MAX_BUFFER_SIZE);
  }
  pruneDrafts();
}

hydrateFromPersisted();
sweepRetention(Date.now(), true);
