import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import type { TruthFunction } from "@shared/contributions/contributions.schema";
import type { Risk, Tier } from "@shared/ideology/ideology-verifiers.schema";
import {
  TruthFunctionRecordSchema,
  type TruthFunctionRecord,
} from "@shared/contributions/contribution-storage.schema";

export type TruthFunctionRecordInput = {
  truthFunction: TruthFunction;
  contributorId: string;
  tenantId?: string;
  sourceContributionId?: string;
  status?: TruthFunction["status"];
  traceId?: string;
  verification?: {
    ok: boolean;
    tier?: Tier;
    risk?: Risk;
    traceId?: string;
  };
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.TRUTH_FUNCTION_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(process.env.TRUTH_FUNCTION_ROTATE_MAX_BYTES ?? 20000000);
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(process.env.TRUTH_FUNCTION_ROTATE_MAX_FILES ?? 5);
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.TRUTH_FUNCTION_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const truthFunctionBuffer: TruthFunctionRecord[] = [];
const truthFunctionById = new Map<string, TruthFunctionRecord>();
let truthFunctionSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

const nextSequence = (): number => {
  truthFunctionSequence += 1;
  return truthFunctionSequence;
};

const storeRecord = (record: TruthFunctionRecord): void => {
  truthFunctionById.set(record.id, record);
  truthFunctionBuffer.push(record);
  if (truthFunctionBuffer.length > MAX_BUFFER_SIZE) {
    truthFunctionBuffer.splice(0, truthFunctionBuffer.length - MAX_BUFFER_SIZE);
  }
};

const updateRecord = (
  record: TruthFunctionRecord,
): TruthFunctionRecord => {
  const next = { ...record, seq: nextSequence() };
  truthFunctionById.set(next.id, next);
  persistRecord(next);
  return next;
};

export const upsertTruthFunctionRecord = (
  input: TruthFunctionRecordInput,
): TruthFunctionRecord => {
  const existing = truthFunctionById.get(input.truthFunction.id);
  const nowIso = new Date().toISOString();
  if (existing) {
    return updateRecord({
      ...existing,
      updatedAt: nowIso,
      status: input.status ?? existing.status,
      traceId: input.traceId ?? existing.traceId,
      verification: input.verification ?? existing.verification,
      truthFunction: input.truthFunction,
      sourceContributionId:
        input.sourceContributionId ?? existing.sourceContributionId,
      tenantId: input.tenantId ?? existing.tenantId,
    });
  }
  const record: TruthFunctionRecord = TruthFunctionRecordSchema.parse({
    id: input.truthFunction.id,
    seq: nextSequence(),
    createdAt: nowIso,
    updatedAt: nowIso,
    contributorId: input.contributorId,
    tenantId: input.tenantId,
    status: input.status ?? input.truthFunction.status,
    sourceContributionId: input.sourceContributionId,
    traceId: input.traceId,
    truthFunction: input.truthFunction,
    verification: input.verification,
  });
  storeRecord(record);
  persistRecord(record);
  return record;
};

export const getTruthFunctionRecord = (
  id: string,
): TruthFunctionRecord | null => truthFunctionById.get(id) ?? null;

export const listTruthFunctionRecords = (opts?: {
  contributorId?: string | null;
  tenantId?: string | null;
  status?: TruthFunction["status"];
  limit?: number;
}): TruthFunctionRecord[] => {
  const limit = Math.max(1, Math.min(opts?.limit ?? 50, 200));
  const contributorId = opts?.contributorId?.trim() || null;
  const tenantId = opts?.tenantId?.trim() || null;
  const status = opts?.status;
  const records = Array.from(truthFunctionById.values())
    .filter((record) =>
      contributorId ? record.contributorId === contributorId : true,
    )
    .filter((record) => (tenantId ? record.tenantId === tenantId : true))
    .filter((record) => (status ? record.status === status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return records;
};

export const updateTruthFunctionRecord = (
  id: string,
  updater: (record: TruthFunctionRecord) => TruthFunctionRecord,
): TruthFunctionRecord | null => {
  const existing = truthFunctionById.get(id);
  if (!existing) return null;
  const next = updater(existing);
  return updateRecord(next);
};

export const recordTruthFunctionVerification = (input: {
  truthFunctionId: string;
  ok: boolean;
  tier?: Tier;
  risk?: Risk;
  traceId?: string;
}): TruthFunctionRecord | null => {
  const existing = truthFunctionById.get(input.truthFunctionId);
  if (!existing) return null;
  const nowIso = new Date().toISOString();
  return updateRecord({
    ...existing,
    updatedAt: nowIso,
    status: input.ok ? "verified" : existing.status,
    traceId: input.traceId ?? existing.traceId,
    verification: {
      ok: input.ok,
      tier: input.tier,
      risk: input.risk,
      traceId: input.traceId,
    },
  });
};

export const __resetTruthFunctionStore = (): void => {
  truthFunctionById.clear();
  truthFunctionBuffer.length = 0;
  truthFunctionSequence = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.TRUTH_FUNCTION_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.TRUTH_FUNCTION_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "truth-functions.jsonl");
}

function readPersistedRecords(): TruthFunctionRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: TruthFunctionRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = TruthFunctionRecordSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[truth-functions] failed to read audit log", error);
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

function persistRecord(record: TruthFunctionRecord): void {
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
      console.warn("[truth-functions] failed to persist audit log", error);
    });
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
    truthFunctionById.set(record.id, record);
    truthFunctionBuffer.push(record);
    if (record.seq > truthFunctionSequence) {
      truthFunctionSequence = record.seq;
    }
  }
  if (truthFunctionBuffer.length > MAX_BUFFER_SIZE) {
    truthFunctionBuffer.splice(
      0,
      truthFunctionBuffer.length - MAX_BUFFER_SIZE,
    );
  }
}

hydrateFromPersisted();
