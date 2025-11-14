import type { TEssenceEnvelope } from "@shared/essence-schema";
import {
  deleteAllEnvelopes,
  findEssenceEnvelopeByHash,
  findEssenceEnvelopeByOwnerHash,
  getEssenceEnvelope,
  listEssenceByCreator,
  persistEssenceEnvelope,
  searchEssenceEnvelopes,
} from "../../db/essence";
import { metrics } from "../../metrics";

const cache = new Map<string, TEssenceEnvelope>();
const hashIndex = new Map<string, Map<string, TEssenceEnvelope>>();

const hashKey = (algo: string, value: string): string => `${algo.toLowerCase()}:${value.toLowerCase()}`;
const ownerKey = (ownerId?: string | null): string => (ownerId?.trim() && ownerId.trim().toLowerCase()) || "__anon__";

const upsertHashEntry = (env: TEssenceEnvelope): void => {
  const original = env.header.source?.original_hash;
  if (!original?.algo || !original?.value) {
    return;
  }
  const key = hashKey(original.algo, original.value);
  const bucket = hashIndex.get(key) ?? new Map<string, TEssenceEnvelope>();
  bucket.set(ownerKey(env.header.source?.creator_id), env);
  hashIndex.set(key, bucket);
};

export async function putEnvelope(env: TEssenceEnvelope): Promise<void> {
  cache.set(env.header.id, env);
  const original = env.header.source?.original_hash;
  if (original?.algo && original?.value) {
    upsertHashEntry(env);
  }
  await persistEssenceEnvelope(env);
  metrics.incrementEnvelope();
}

export async function getEnvelope(id: string): Promise<TEssenceEnvelope | null> {
  const stored = await getEssenceEnvelope(id);
  if (stored) {
    return stored;
  }
  return cache.get(id) ?? null;
}

export async function findEnvelopeByOriginalHash(
  algo: "sha256" | "blake3",
  value: string,
  ownerId?: string | null,
): Promise<TEssenceEnvelope | null> {
  const key = hashKey(algo, value);
  const bucket = hashIndex.get(key);
  if (ownerId) {
    const cached = bucket?.get(ownerKey(ownerId));
    if (cached) {
      return cached;
    }
  } else if (bucket) {
    const first = bucket.values().next();
    if (!first.done) {
      return first.value;
    }
  }

  for (const env of cache.values()) {
    const original = env.header.source?.original_hash;
    if (original?.algo === algo && original?.value === value) {
      upsertHashEntry(env);
      if (!ownerId || ownerKey(env.header.source?.creator_id) === ownerKey(ownerId)) {
        return env;
      }
    }
  }

  if (ownerId) {
    const fromDbByOwner = await findEssenceEnvelopeByOwnerHash(algo, value, ownerId);
    if (fromDbByOwner) {
      cache.set(fromDbByOwner.header.id, fromDbByOwner);
      upsertHashEntry(fromDbByOwner);
      return fromDbByOwner;
    }
    return null;
  }

  const fromDb = await findEssenceEnvelopeByHash(algo, value);
  if (fromDb) {
    cache.set(fromDb.header.id, fromDb);
    upsertHashEntry(fromDb);
    return fromDb;
  }
  return null;
}

export async function listEnvelopeByCreator(creatorId: string, limit = 20): Promise<TEssenceEnvelope[]> {
  return listEssenceByCreator(creatorId, limit);
}

export async function searchEnvelopes(query: string, limit = 20): Promise<TEssenceEnvelope[]> {
  return searchEssenceEnvelopes(query, limit);
}

export async function resetEnvelopeStore(): Promise<void> {
  cache.clear();
  hashIndex.clear();
  await deleteAllEnvelopes();
}
