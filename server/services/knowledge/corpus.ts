import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";
import { hashEmbed } from "../hce-text";
import {
  listKnowledgeFilesByProjects,
  syncKnowledgeProjects as persistKnowledgeProjects,
  type KnowledgeProjectSyncPayload,
  type KnowledgeFileRow,
} from "../../db/knowledge";
import { estimateAttachmentBytes } from "./validation";

const NON_WORD = /[^\p{Letter}\p{Number}]+/gu;
const KEYWORD_WEIGHT = 0.55;
const EMBEDDING_DIM = 128;

const tokenize = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed
    .normalize("NFKC")
    .toLowerCase()
    .replace(NON_WORD, " ")
    .split(/\s+/)
    .filter(Boolean);
};

const dedupeTokens = (tokens: string[]): string[] => Array.from(new Set(tokens));

const toNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry) || 0);
  }
  return [];
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  return [];
};

const dot = (a: Float64Array, b: Float64Array): number => {
  const len = Math.min(a.length, b.length);
  let acc = 0;
  for (let i = 0; i < len; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
};

const normalizeScore = (value: number): number => Math.max(0, Math.min(1, (value + 1) / 2));

const keywordScore = (queryTokens: string[], docTokens: string[]): number => {
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return 0;
  }
  const set = new Set(docTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (set.has(token)) {
      hits += 1;
    }
  }
  return hits / queryTokens.length;
};

const embeddingScore = (query: Float64Array | null, doc: Float64Array | null): number => {
  if (!query || !doc || query.length === 0 || doc.length === 0) {
    return 0;
  }
  const similarity = dot(query, doc);
  return normalizeScore(similarity);
};

const buildEmbedding = (text?: string): number[] | undefined => {
  const normalized = text?.trim();
  if (!normalized) {
    return undefined;
  }
  const vector = hashEmbed(normalized, EMBEDDING_DIM);
  return Array.from(vector);
};

const attachmentText = (file: KnowledgeFileAttachment): string =>
  [file.name ?? "", file.preview ?? ""].join(" ").trim();

const toSyncPayload = (project: KnowledgeProjectExport): KnowledgeProjectSyncPayload => {
  return {
    id: project.project.id,
    name: project.project.name,
    tags: project.project.tags,
    type: project.project.type,
    hashSlug: project.project.hashSlug,
    summary: project.summary,
    files: project.files.map((file) => {
      const tokens = dedupeTokens(tokenize(attachmentText(file)));
      const embedding = buildEmbedding(file.preview);
      return {
        id: file.id,
        name: file.name,
        mime: file.mime,
        kind: file.kind,
        size: file.size,
        hashSlug: file.hashSlug,
        preview: file.preview,
        contentBase64: file.contentBase64,
        approxBytes: estimateAttachmentBytes(file),
        tokens,
        embedding,
        embeddingDim: embedding?.length ?? undefined,
      };
    }),
  };
};

type FetchOptions = {
  goal: string;
  maxBytes?: number;
  maxFilesPerProject: number;
};

type RankedFile = {
  row: KnowledgeFileRow;
  approxBytes: number;
  tokens: string[];
  embedding: Float64Array | null;
  score: number;
};

const parseEmbedding = (row: KnowledgeFileRow): Float64Array | null => {
  const vector = toNumberArray(row.embedding);
  if (!vector.length) {
    return null;
  }
  return Float64Array.from(vector);
};

const estimateRowBytes = (row: KnowledgeFileRow): number => {
  const preview = row.preview ?? "";
  const fakeAttachment: KnowledgeFileAttachment = {
    id: row.file_id,
    name: row.name,
    mime: row.mime,
    size: row.size,
    kind: row.kind as KnowledgeFileAttachment["kind"],
    hashSlug: row.hash_slug ?? undefined,
    preview,
    contentBase64: row.content_base64 ?? undefined,
  };
  return estimateAttachmentBytes(fakeAttachment);
};

const rowToAttachment = (row: KnowledgeFileRow): KnowledgeFileAttachment => ({
  id: row.file_id,
  name: row.name,
  mime: row.mime,
  size: row.size,
  hashSlug: row.hash_slug ?? undefined,
  projectId: row.project_id,
  kind: row.kind as KnowledgeFileAttachment["kind"],
  preview: row.preview ?? undefined,
  contentBase64: row.content_base64 ?? undefined,
});

export async function persistKnowledgeBundles(projects: KnowledgeProjectExport[]): Promise<{ synced: number; projectIds: string[] }> {
  if (!projects || projects.length === 0) {
    return { synced: 0, projectIds: [] };
  }
  const payload = projects.map(toSyncPayload);
  await persistKnowledgeProjects(payload);
  return { synced: payload.length, projectIds: payload.map((project) => project.id) };
}

export async function fetchKnowledgeForProjects(
  projectIds: string[],
  options: FetchOptions,
): Promise<KnowledgeProjectExport[]> {
  if (!projectIds || projectIds.length === 0) {
    return [];
  }
  const rows = await listKnowledgeFilesByProjects(projectIds);
  if (rows.length === 0) {
    return [];
  }

  const queryTokens = dedupeTokens(tokenize(options.goal ?? ""));
  const queryVector = hashEmbed(options.goal ?? "", EMBEDDING_DIM);
  const buckets = new Map<string, RankedFile[]>();

  for (const row of rows) {
    const candidate: RankedFile = {
      row,
      approxBytes: row.approx_bytes ?? estimateRowBytes(row),
      tokens: dedupeTokens(toStringArray(row.tokens)),
      embedding: parseEmbedding(row),
      score: 0,
    };
    const kwScore = keywordScore(queryTokens, candidate.tokens);
    const embScore = embeddingScore(queryVector, candidate.embedding);
    candidate.score = KEYWORD_WEIGHT * kwScore + (1 - KEYWORD_WEIGHT) * embScore;
    const bucket = buckets.get(row.project_id) ?? [];
    bucket.push(candidate);
    buckets.set(row.project_id, bucket);
  }

  const maxFiles = Math.max(1, options.maxFilesPerProject);
  const results: KnowledgeProjectExport[] = [];
  let remaining =
    typeof options.maxBytes === "number" && Number.isFinite(options.maxBytes) && options.maxBytes > 0
      ? options.maxBytes
      : Number.POSITIVE_INFINITY;

  const consumeBudget = (bytes: number): boolean => {
    if (!Number.isFinite(remaining)) {
      return true;
    }
    if (bytes > remaining) {
      return false;
    }
    remaining = Math.max(0, remaining - bytes);
    return true;
  };

  const hasBudget = (bytes: number): boolean => {
    if (!Number.isFinite(remaining)) {
      return true;
    }
    return bytes <= remaining;
  };

  for (const projectId of projectIds) {
    const bucket = buckets.get(projectId);
    if (!bucket || bucket.length === 0) {
      continue;
    }
    const sorted = [...bucket].sort((a, b) => b.score - a.score);
    const files: KnowledgeFileAttachment[] = [];
    const omitted: string[] = [];
    let projectBytes = 0;

    for (const candidate of sorted) {
      if (files.length >= maxFiles) {
        omitted.push(candidate.row.name);
        continue;
      }
      const bytes = Math.max(candidate.approxBytes, 0);
      if (!hasBudget(bytes)) {
        omitted.push(candidate.row.name);
        continue;
      }
      files.push(rowToAttachment(candidate.row));
      projectBytes += bytes;
      consumeBudget(bytes);
      if (Number.isFinite(remaining) && remaining <= 0) {
        break;
      }
    }

    if (files.length === 0) {
      continue;
    }

    const first = bucket[0];
    results.push({
      project: {
        id: projectId,
        name: first.row.project_name,
        tags: Array.isArray(first.row.project_tags) ? first.row.project_tags.map((tag) => String(tag)) : undefined,
        type: first.row.project_type ?? undefined,
        hashSlug: first.row.project_hash_slug ?? undefined,
      },
      summary: first.row.project_summary ?? undefined,
      files,
      approxBytes: projectBytes,
      omittedFiles: omitted.length > 0 ? omitted : undefined,
    });

    if (Number.isFinite(remaining) && remaining <= 0) {
      break;
    }
  }

  return results;
}
