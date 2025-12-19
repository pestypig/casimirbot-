import { ensureDatabase, getPool } from "./client";

export type KnowledgeFileSyncPayload = {
  id: string;
  name: string;
  mime: string;
  kind: string;
  size: number;
  hashSlug?: string;
  preview?: string;
  contentBase64?: string;
  approxBytes: number;
  tokens: string[];
  embedding?: number[];
  embeddingDim?: number;
};

export type KnowledgeProjectSyncPayload = {
  id: string;
  name: string;
  tags?: string[];
  type?: string;
  hashSlug?: string;
  summary?: string;
  files: KnowledgeFileSyncPayload[];
};

export type KnowledgeFileRow = {
  project_id: string;
  project_name: string;
  project_tags: string[] | null;
  project_type: string | null;
  project_hash_slug: string | null;
  project_summary: string | null;
  file_id: string;
  name: string;
  mime: string;
  kind: string;
  size: number;
  hash_slug: string | null;
  preview: string | null;
  content_base64: string | null;
  approx_bytes: number | null;
  tokens: unknown;
  embedding: unknown;
  embedding_dim: number | null;
  updated_at: string;
};

const jsonOrNull = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

export async function syncKnowledgeProjects(projects: KnowledgeProjectSyncPayload[]): Promise<void> {
  if (!projects || projects.length === 0) {
    return;
  }
  await ensureDatabase();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const project of projects) {
      await client.query(
        `
          INSERT INTO knowledge_project (id, name, tags, type, hash_slug, summary, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, now())
          ON CONFLICT (id)
          DO UPDATE SET
            name = excluded.name,
            tags = excluded.tags,
            type = excluded.type,
            hash_slug = excluded.hash_slug,
            summary = excluded.summary,
            updated_at = now();
        `,
        [
          project.id,
          project.name,
          project.tags && project.tags.length > 0 ? project.tags : [],
          project.type ?? null,
          project.hashSlug ?? null,
          project.summary ?? null,
        ],
      );

      const keepIds: string[] = [];
      for (const file of project.files) {
        keepIds.push(file.id);
        await client.query(
          `
            INSERT INTO knowledge_file (
              project_id,
              file_id,
              name,
              mime,
              kind,
              size,
              hash_slug,
              preview,
              content_base64,
              approx_bytes,
              tokens,
              embedding,
              embedding_dim,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11::jsonb, $12::jsonb, $13, now()
            )
            ON CONFLICT (project_id, file_id)
            DO UPDATE SET
              name = excluded.name,
              mime = excluded.mime,
              kind = excluded.kind,
              size = excluded.size,
              hash_slug = excluded.hash_slug,
              preview = excluded.preview,
              content_base64 = excluded.content_base64,
              approx_bytes = excluded.approx_bytes,
              tokens = excluded.tokens,
              embedding = excluded.embedding,
              embedding_dim = excluded.embedding_dim,
              updated_at = now();
          `,
          [
            project.id,
            file.id,
            file.name,
            file.mime,
            file.kind,
            file.size,
            file.hashSlug ?? null,
            file.preview ?? null,
            file.contentBase64 ?? null,
            Number.isFinite(file.approxBytes) ? Math.floor(file.approxBytes) : null,
            jsonOrNull(file.tokens ?? []),
            jsonOrNull(file.embedding ?? null),
            file.embeddingDim ?? (file.embedding ? file.embedding.length : null),
          ],
        );
      }

      if (project.files.length > 0) {
        await client.query(
          `DELETE FROM knowledge_file WHERE project_id = $1 AND NOT (file_id = ANY($2::text[]))`,
          [project.id, keepIds],
        );
      } else {
        await client.query(`DELETE FROM knowledge_file WHERE project_id = $1`, [project.id]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listKnowledgeFilesByProjects(projectIds: string[]): Promise<KnowledgeFileRow[]> {
  if (!projectIds || projectIds.length === 0) {
    return [];
  }
  await ensureDatabase();
  const pool = getPool();
  const placeholders = projectIds.map((_, idx) => `$${idx + 1}`).join(", ");
  const params = projectIds;
  const { rows } = await pool.query<KnowledgeFileRow>(
    `
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        p.tags AS project_tags,
        p.type AS project_type,
        p.hash_slug AS project_hash_slug,
        p.summary AS project_summary,
        f.file_id,
        f.name,
        f.mime,
        f.kind,
        f.size,
        f.hash_slug,
        f.preview,
        f.content_base64,
        f.approx_bytes,
        f.tokens,
        f.embedding,
        f.embedding_dim,
        f.updated_at
      FROM knowledge_file f
      JOIN knowledge_project p ON p.id = f.project_id
      WHERE f.project_id IN (${placeholders})
      ORDER BY f.updated_at DESC;
    `,
    params,
  );
  return rows;
}
