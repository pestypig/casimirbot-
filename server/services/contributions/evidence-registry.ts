import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  TruthInputKindSchema,
  type TruthInputKind,
} from "@shared/contributions/contributions.schema";
import {
  EvidenceRegistryRecordSchema,
  EvidenceSignatureSchema,
  type EvidenceRecord,
  type EvidenceRegistryRecord,
  type EvidenceSignature,
  type EvidenceStatus,
  type EvidenceIndependence,
  type EvidenceSource,
} from "@shared/contributions/evidence-registry.schema";
import { hashStableJson } from "../../utils/information-boundary";

export type EvidenceRegistryInput = {
  id?: string;
  kind: EvidenceRecord["kind"];
  label: string;
  description?: string;
  source: EvidenceSource;
  retention: EvidenceRecord["retention"];
  status?: EvidenceStatus;
  tags?: string[];
  signature?: EvidenceSignature;
};

export type EvidenceRegistryQuery = {
  kind?: TruthInputKind;
  origin?: EvidenceSource["origin"];
  independence?: EvidenceIndependence;
  status?: EvidenceStatus;
  tag?: string;
  includeInactive?: boolean;
  admissibleOnly?: boolean;
  limit?: number;
  now?: Date;
};

export type EvidenceRegistryIndex = {
  admissibleByRef: Map<string, EvidenceRecord>;
  admissibleRefsByKind: Partial<Record<TruthInputKind, Set<string>>>;
};

const MAX_RECORDS = 2000;
const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.EVIDENCE_REGISTRY_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const SIGNING_SECRET = process.env.EVIDENCE_REGISTRY_SIGNING_SECRET?.trim();
const SIGNING_KEY_ID =
  process.env.EVIDENCE_REGISTRY_SIGNING_KEY_ID?.trim() || "env:evidence-registry";

const evidenceById = new Map<string, EvidenceRegistryRecord>();
const evidenceBuffer: EvidenceRegistryRecord[] = [];
let evidenceSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

const nextSequence = (): number => {
  evidenceSequence += 1;
  return evidenceSequence;
};

const storeRecord = (record: EvidenceRegistryRecord): void => {
  evidenceById.set(record.id, record);
  evidenceBuffer.push(record);
  if (evidenceBuffer.length > MAX_BUFFER_SIZE) {
    evidenceBuffer.splice(0, evidenceBuffer.length - MAX_BUFFER_SIZE);
  }
};

const persistRecord = (record: EvidenceRegistryRecord): void => {
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
      console.warn("[evidence-registry] failed to persist audit log", error);
    });
};

const buildEvidenceId = () => `ev_${crypto.randomUUID()}`;

const buildSignablePayload = (record: EvidenceRecord) => {
  const { signature: _signature, ...rest } = record;
  return rest;
};

const computeEvidenceHash = (record: EvidenceRecord): string =>
  hashStableJson(buildSignablePayload(record));

const signEvidencePayload = (
  payloadHash: string,
  nowIso: string,
): EvidenceSignature | undefined => {
  if (!SIGNING_SECRET) return undefined;
  const sig = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payloadHash)
    .digest("hex");
  return EvidenceSignatureSchema.parse({
    alg: "hmac-sha256",
    keyId: SIGNING_KEY_ID,
    sig,
    payloadHash,
    signedAt: nowIso,
  });
};

const resolveSignature = (
  input: EvidenceSignature | undefined,
  payloadHash: string,
  nowIso: string,
): EvidenceSignature | undefined => {
  if (input) {
    if (input.payloadHash && input.payloadHash !== payloadHash) {
      throw new Error("signature_payload_hash_mismatch");
    }
    return EvidenceSignatureSchema.parse({
      ...input,
      payloadHash,
      signedAt: input.signedAt ?? nowIso,
    });
  }
  return signEvidencePayload(payloadHash, nowIso);
};

const isWithinRetention = (
  retention: EvidenceRecord["retention"],
  now: Date,
): boolean => {
  const startsAt = Date.parse(retention.startsAt);
  if (!Number.isFinite(startsAt) || now.getTime() < startsAt) return false;
  if (!retention.endsAt) return true;
  const endsAt = Date.parse(retention.endsAt);
  if (!Number.isFinite(endsAt)) return false;
  return now.getTime() <= endsAt;
};

const isSignatureValid = (
  signature: EvidenceSignature | undefined,
  payloadHash: string,
): boolean => {
  if (!signature) return false;
  if (!signature.sig.trim()) return false;
  if (signature.payloadHash !== payloadHash) return false;
  if (signature.alg === "hmac-sha256" && SIGNING_SECRET) {
    const expected = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(payloadHash)
      .digest("hex");
    return expected === signature.sig;
  }
  return true;
};

export const isEvidenceAdmissible = (
  record: EvidenceRecord,
  now: Date = new Date(),
): boolean => {
  if (record.status !== "active") return false;
  if (!isWithinRetention(record.retention, now)) return false;
  const payloadHash = computeEvidenceHash(record);
  return isSignatureValid(record.signature, payloadHash);
};

export const registerEvidenceRecord = (
  input: EvidenceRegistryInput,
  opts?: { tenantId?: string },
): EvidenceRecord => {
  const nowIso = new Date().toISOString();
  const existing = input.id ? evidenceById.get(input.id) : undefined;
  const id = input.id ?? buildEvidenceId();
  const recordBase: EvidenceRecord = {
    id,
    kind: input.kind,
    label: input.label,
    description: input.description,
    source: input.source,
    retention: input.retention,
    status: input.status ?? "active",
    tags: input.tags ?? [],
    createdAt: existing?.record.createdAt ?? nowIso,
    updatedAt: nowIso,
    signature: undefined,
  };
  const payloadHash = computeEvidenceHash(recordBase);
  const signature = resolveSignature(input.signature, payloadHash, nowIso);
  const record = EvidenceRegistryRecordSchema.parse({
    id,
    seq: nextSequence(),
    tenantId: opts?.tenantId,
    record: { ...recordBase, signature },
  });

  storeRecord(record);
  persistRecord(record);
  pruneRegistry();
  return record.record;
};

export const getEvidenceRecord = (id: string): EvidenceRecord | null =>
  evidenceById.get(id)?.record ?? null;

export const listEvidenceRecords = (
  opts: EvidenceRegistryQuery = {},
): EvidenceRecord[] => {
  const now = opts.now ?? new Date();
  const records = Array.from(evidenceById.values()).map((entry) => entry.record);
  const filtered = records.filter((record) => {
    if (opts.kind && record.kind !== opts.kind) return false;
    if (opts.status && record.status !== opts.status) return false;
    if (opts.origin && record.source.origin !== opts.origin) return false;
    if (opts.independence && record.source.independence !== opts.independence) {
      return false;
    }
    if (opts.tag && !record.tags.includes(opts.tag)) return false;
    if (opts.admissibleOnly && !isEvidenceAdmissible(record, now)) return false;
    if (!opts.includeInactive && record.status !== "active") return false;
    if (!opts.includeInactive && !isWithinRetention(record.retention, now)) {
      return false;
    }
    return true;
  });
  const sorted = filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (opts.limit && Number.isFinite(opts.limit)) {
    return sorted.slice(0, Math.max(0, Math.floor(opts.limit)));
  }
  return sorted;
};

export const buildEvidenceRegistryIndex = (
  now: Date = new Date(),
): EvidenceRegistryIndex => {
  const admissibleByRef = new Map<string, EvidenceRecord>();
  const admissibleRefsByKind: Partial<Record<TruthInputKind, Set<string>>> = {};
  for (const kind of TruthInputKindSchema.options) {
    admissibleRefsByKind[kind] = new Set<string>();
  }
  for (const record of listEvidenceRecords({ includeInactive: true })) {
    if (!isEvidenceAdmissible(record, now)) continue;
    admissibleByRef.set(record.id, record);
    const set = admissibleRefsByKind[record.kind] ?? new Set<string>();
    set.add(record.id);
    admissibleRefsByKind[record.kind] = set;
  }
  return { admissibleByRef, admissibleRefsByKind };
};

export const __resetEvidenceRegistry = (): void => {
  evidenceById.clear();
  evidenceBuffer.length = 0;
  evidenceSequence = 0;
};

function parseBufferSize(): number {
  const requested = Number(process.env.EVIDENCE_REGISTRY_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
}

function parseRotateMaxBytes(): number {
  const requested = Number(
    process.env.EVIDENCE_REGISTRY_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
}

function parseRotateMaxFiles(): number {
  const requested = Number(
    process.env.EVIDENCE_REGISTRY_ROTATE_MAX_FILES ?? 5,
  );
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
}

function resolveAuditLogPath(): string {
  const explicit = process.env.EVIDENCE_REGISTRY_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.EVIDENCE_REGISTRY_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "evidence-registry.jsonl");
}

function pruneRegistry(): void {
  if (evidenceById.size <= MAX_RECORDS) return;
  const ordered = Array.from(evidenceById.values()).sort((a, b) =>
    a.record.createdAt.localeCompare(b.record.createdAt),
  );
  const toRemove = ordered.length - MAX_RECORDS;
  const toRemoveIds = new Set<string>();
  for (let i = 0; i < toRemove; i += 1) {
    const record = ordered[i];
    evidenceById.delete(record.id);
    toRemoveIds.add(record.id);
  }
  if (toRemoveIds.size > 0) {
    evidenceBuffer.splice(
      0,
      evidenceBuffer.length,
      ...evidenceBuffer.filter((record) => !toRemoveIds.has(record.id)),
    );
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
  if (!AUDIT_PERSIST_ENABLED) {
    return;
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return;
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: EvidenceRegistryRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = EvidenceRegistryRecordSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    if (parsed.length === 0) return;
    parsed.sort((a, b) => a.seq - b.seq);
    for (const entry of parsed) {
      evidenceSequence = Math.max(evidenceSequence, entry.seq);
      storeRecord(entry);
    }
  } catch (error) {
    console.warn("[evidence-registry] failed to read audit log", error);
  }
}

hydrateFromPersisted();
