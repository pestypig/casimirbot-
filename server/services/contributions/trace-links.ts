import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  ContributionTraceLinkSchema,
  type ContributionTraceLink,
  type ContributionTraceLinkKind,
} from "@shared/contributions/contribution-storage.schema";

export type ContributionTraceLinkInput = {
  traceId: string;
  kind: ContributionTraceLinkKind;
  tenantId?: string;
  contributionId?: string;
  receiptId?: string;
  truthFunctionIds?: string[];
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CONTRIBUTION_TRACE_LINK_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_TRACE_LINK_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(
    process.env.CONTRIBUTION_TRACE_LINK_ROTATE_MAX_FILES ?? 5,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED =
  process.env.CONTRIBUTION_TRACE_LINK_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const traceLinkBuffer: ContributionTraceLink[] = [];
const traceLinkById = new Map<string, ContributionTraceLink>();
let traceLinkSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

const nextSequence = (): number => {
  traceLinkSequence += 1;
  return traceLinkSequence;
};

const storeRecord = (record: ContributionTraceLink): void => {
  traceLinkById.set(record.id, record);
  traceLinkBuffer.push(record);
  if (traceLinkBuffer.length > MAX_BUFFER_SIZE) {
    traceLinkBuffer.splice(0, traceLinkBuffer.length - MAX_BUFFER_SIZE);
  }
};

export const recordContributionTraceLink = (
  input: ContributionTraceLinkInput,
): ContributionTraceLink => {
  const nowIso = new Date().toISOString();
  const record = ContributionTraceLinkSchema.parse({
    id: `trace_${crypto.randomUUID().replace(/-/g, "")}`,
    seq: nextSequence(),
    createdAt: nowIso,
    tenantId: input.tenantId,
    traceId: input.traceId,
    kind: input.kind,
    contributionId: input.contributionId,
    receiptId: input.receiptId,
    truthFunctionIds: input.truthFunctionIds,
  });
  storeRecord(record);
  persistRecord(record);
  return record;
};

export const listContributionTraceLinks = (opts?: {
  traceId?: string;
  tenantId?: string;
  limit?: number;
}): ContributionTraceLink[] => {
  const limit = Math.max(1, Math.min(opts?.limit ?? 50, 200));
  const traceId = opts?.traceId?.trim();
  const tenantId = opts?.tenantId?.trim();
  const records = Array.from(traceLinkById.values())
    .filter((record) => (traceId ? record.traceId === traceId : true))
    .filter((record) => (tenantId ? record.tenantId === tenantId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return records;
};

export const __resetContributionTraceLinks = (): void => {
  traceLinkById.clear();
  traceLinkBuffer.length = 0;
  traceLinkSequence = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.CONTRIBUTION_TRACE_LINK_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.CONTRIBUTION_TRACE_LINK_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "contribution-trace-links.jsonl");
}

function readPersistedRecords(): ContributionTraceLink[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: ContributionTraceLink[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = ContributionTraceLinkSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[contribution-trace-links] failed to read audit log", error);
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

function persistRecord(record: ContributionTraceLink): void {
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
      console.warn(
        "[contribution-trace-links] failed to persist audit log",
        error,
      );
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
    traceLinkById.set(record.id, record);
    traceLinkBuffer.push(record);
    if (record.seq > traceLinkSequence) {
      traceLinkSequence = record.seq;
    }
  }
  if (traceLinkBuffer.length > MAX_BUFFER_SIZE) {
    traceLinkBuffer.splice(0, traceLinkBuffer.length - MAX_BUFFER_SIZE);
  }
}

hydrateFromPersisted();
