import { createHash } from "node:crypto";
import { MemoryRecord, type TMemoryRecord, type TMemorySearchHit } from "@shared/essence-persona";
import {
  deleteAllMemories,
  getMemoryById,
  listAllMemories,
  persistMemoryRecord,
  searchMemoryCandidates,
  type MemoryCandidate,
} from "../../db/essence";
import { hashEmbed } from "../hce-text";

const DEFAULT_EMBED_SPACE = "hash/v1";
const EMBEDDING_DIM = 128;
const KEYWORD_WEIGHT = 0.55;
const EMBEDDING_WEIGHT = 1 - KEYWORD_WEIGHT;
const NON_WORD = /[^\p{Letter}\p{Number}]+/gu;
const ENABLE_DEBATE_SEARCH = process.env.ENABLE_DEBATE_SEARCH === "1";

type StoredMemory = TMemoryRecord & {
  tokenSet: Set<string>;
  vector: Float64Array | null;
};

type StoredMemoryWithSnippet = StoredMemory & { snippet: string };

const memories = new Map<string, StoredMemory>();

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const shouldUseInMemory = () => process.env.USE_INMEM_MEMORY !== "0";

const tokenize = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed
    .normalize("NFKD")
    .toLowerCase()
    .replace(NON_WORD, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
};

const collectTokens = (record: TMemoryRecord) => {
  const value = [record.text ?? "", ...(record.keys ?? [])].join(" ");
  return tokenize(value);
};

const ensureEmbeddingCid = (record: TMemoryRecord): string | undefined => {
  if (record.embedding_cid) return record.embedding_cid;
  if (record.text?.trim()) {
    return `mem:${createHash("sha256").update(record.text).digest("hex")}`;
  }
  if (record.essence_id) {
    return `essence:${record.essence_id}`;
  }
  return undefined;
};

const buildSnippet = (text?: string): string => {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= 320) return trimmed;
  return `${trimmed.slice(0, 317)}...`;
};

const dot = (a: Float64Array, b: Float64Array): number => {
  const len = Math.min(a.length, b.length);
  let acc = 0;
  for (let i = 0; i < len; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
};

const keywordScore = (queryTokens: string[], tokenSet: Set<string>): number => {
  if (queryTokens.length === 0 || tokenSet.size === 0) return 0;
  let hits = 0;
  for (const token of queryTokens) {
    if (tokenSet.has(token)) {
      hits += 1;
    }
  }
  return hits / queryTokens.length;
};

const normalizeRecord = (record: TMemoryRecord): StoredMemory => {
  const embedding_space = record.embedding_space ?? DEFAULT_EMBED_SPACE;
  const embedding_cid = ensureEmbeddingCid(record);
  const tokens = collectTokens(record);
  const vector = record.text?.trim() ? hashEmbed(record.text, EMBEDDING_DIM) : null;

  const normalizedRecord: TMemoryRecord = {
    ...record,
    embedding_space,
    ...(embedding_cid ? { embedding_cid } : {}),
  };

  return {
    ...normalizedRecord,
    tokenSet: new Set(tokens),
    vector,
  };
};

const stripInternal = ({ tokenSet, vector, ...publicRecord }: StoredMemory): TMemoryRecord => ({
  ...publicRecord,
});

const mapCandidate = (candidate: MemoryCandidate): StoredMemoryWithSnippet => ({
  ...candidate.record,
  tokenSet: new Set(candidate.tokens),
  vector: candidate.vector.length ? Float64Array.from(candidate.vector) : null,
  snippet: candidate.snippet ?? buildSnippet(candidate.record.text),
});

const hasDebateKey = (keys?: string[]): boolean => {
  if (!Array.isArray(keys)) return false;
  return keys.some((key) => key.startsWith("debate:") || key === "verdict");
};

const rankMemories = (
  entries: StoredMemoryWithSnippet[],
  queryTokens: string[],
  queryVector: Float64Array,
  limit: number,
) => {
  return entries
    .map((entry) => {
      const kw = keywordScore(queryTokens, entry.tokenSet);
      const similarity = entry.vector ? dot(entry.vector, queryVector) : 0;
      const embedScore = entry.vector ? (clamp(similarity, -1, 1) + 1) / 2 : 0;
      const score = KEYWORD_WEIGHT * kw + EMBEDDING_WEIGHT * embedScore;
      return { entry, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export async function putMemoryRecord(record: TMemoryRecord): Promise<TMemoryRecord> {
  const parsed = MemoryRecord.parse(record);
  const stored = normalizeRecord(parsed);
  const snippet = buildSnippet(stored.text);

  if (shouldUseInMemory()) {
    memories.set(stored.id, stored);
    return stripInternal(stored);
  }

  return persistMemoryRecord({
    record: stripInternal(stored),
    tokens: Array.from(stored.tokenSet),
    vector: stored.vector ? Array.from(stored.vector) : null,
    snippet,
  });
}

export async function getMemoryRecord(id: string): Promise<TMemoryRecord | null> {
  if (shouldUseInMemory()) {
    const existing = memories.get(id);
    return existing ? stripInternal(existing) : null;
  }
  return getMemoryById(id);
}

type SearchOptions = {
  debateOnly?: boolean;
};

export async function searchMemories(
  query: string,
  topK = 6,
  options?: SearchOptions,
): Promise<TMemorySearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return [];
  const queryVector = hashEmbed(trimmed, EMBEDDING_DIM);
  const limit = clamp(Math.floor(topK) || 1, 1, 50);

  let entries: StoredMemoryWithSnippet[];
  if (shouldUseInMemory()) {
    entries = Array.from(memories.values()).map((entry) => ({
      ...entry,
      snippet: buildSnippet(entry.text),
    }));
  } else {
    const candidates = await searchMemoryCandidates(trimmed, limit * 8);
    entries = candidates.map(mapCandidate);
  }

  const ranked = rankMemories(entries, tokens, queryVector, limit);
  const filtered =
    ENABLE_DEBATE_SEARCH && options?.debateOnly
      ? ranked.filter(({ entry }) => hasDebateKey(entry.keys))
      : ranked;

  return filtered.map(({ entry, score }) => ({
    id: entry.id,
    snippet: entry.snippet,
    envelope_id: entry.essence_id ?? null,
    score,
    owner_id: entry.owner_id,
    created_at: entry.created_at,
    kind: entry.kind,
    keys: entry.keys,
    visibility: entry.visibility,
    embedding_space: entry.embedding_space ?? null,
    embedding_cid: entry.embedding_cid ?? null,
  }));
}

export async function resetMemoryStore(): Promise<void> {
  if (shouldUseInMemory()) {
    memories.clear();
    return;
  }
  await deleteAllMemories();
}

export async function listMemoryRecords(): Promise<TMemoryRecord[]> {
  if (shouldUseInMemory()) {
    return Array.from(memories.values()).map(stripInternal);
  }
  return listAllMemories();
}
