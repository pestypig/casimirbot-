import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  constraintPackPolicyProfileInputSchema,
  constraintPackPolicyProfileSchema,
  type ConstraintPackPolicyProfile,
  type ConstraintPackPolicyProfileInput,
} from "../../../shared/schema.js";

type ListPolicyProfilesOptions = {
  customerId?: string;
  limit?: number;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.CONSTRAINT_PACK_POLICY_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const POLICY_PERSIST_ENABLED =
  process.env.CONSTRAINT_PACK_POLICY_PERSIST !== "0";
const POLICY_LOG_PATH = resolvePolicyLogPath();
const policyStore = new Map<string, ConstraintPackPolicyProfile>();
let persistChain = Promise.resolve();

const persisted = loadPersistedProfiles();
if (persisted.length > 0) {
  for (const profile of persisted) {
    policyStore.set(profile.id, profile);
  }
}

export function recordConstraintPackPolicyProfile(
  input: ConstraintPackPolicyProfileInput,
): ConstraintPackPolicyProfile {
  const parsed = constraintPackPolicyProfileInputSchema.parse(input);
  const now = new Date().toISOString();
  const existing = parsed.id ? policyStore.get(parsed.id) : undefined;
  const id = parsed.id ?? crypto.randomUUID();
  const version =
    parsed.version ?? (existing ? existing.version + 1 : 1);
  const profile: ConstraintPackPolicyProfile =
    constraintPackPolicyProfileSchema.parse({
      ...parsed,
      id,
      version,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  policyStore.set(id, profile);
  persistPolicyProfile(profile);
  return profile;
}

export function getConstraintPackPolicyProfileById(
  id: string | undefined,
): ConstraintPackPolicyProfile | null {
  if (!id) return null;
  return policyStore.get(id) ?? null;
}

export function getConstraintPackPolicyProfiles(
  options?: ListPolicyProfilesOptions,
): ConstraintPackPolicyProfile[] {
  const limit = clampLimit(options?.limit);
  const customerId = options?.customerId;
  const values = Array.from(policyStore.values());
  const filtered = customerId
    ? values.filter((profile) => profile.customerId === customerId)
    : values;
  return filtered
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export function __resetConstraintPackPolicyStore(): void {
  policyStore.clear();
}

export function getConstraintPackPolicyLogPath(): string {
  return POLICY_LOG_PATH;
}

const clampLimit = (value?: number): number => {
  const fallback = 25;
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.floor(value)), MAX_BUFFER_SIZE);
};

function resolvePolicyLogPath(): string {
  const explicit = process.env.CONSTRAINT_PACK_POLICY_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.CONSTRAINT_PACK_POLICY_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "constraint-pack-policies.jsonl");
}

function loadPersistedProfiles(): ConstraintPackPolicyProfile[] {
  if (!POLICY_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(POLICY_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(POLICY_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: ConstraintPackPolicyProfile[] = [];
    for (const line of lines) {
      const record = parsePolicyRecord(line);
      if (record) {
        parsed.push(record);
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[constraint-pack-policy] failed to read policy log", error);
    return [];
  }
}

function parsePolicyRecord(
  line: string,
): ConstraintPackPolicyProfile | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const result = constraintPackPolicyProfileSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function persistPolicyProfile(profile: ConstraintPackPolicyProfile): void {
  if (!POLICY_PERSIST_ENABLED) {
    return;
  }
  const line = JSON.stringify(profile);
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(POLICY_LOG_PATH), { recursive: true });
      await fsPromises.appendFile(POLICY_LOG_PATH, `${line}\n`, "utf8");
    })
    .catch((error) => {
      console.warn(
        "[constraint-pack-policy] failed to persist policy log",
        error,
      );
    });
}
