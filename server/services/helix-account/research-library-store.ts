import crypto from "node:crypto";
import {
  HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
  HELIX_RESEARCH_LIBRARY_LIST_SCHEMA,
  type HelixResearchLibraryDocument,
  type HelixResearchLibraryDocumentSummary,
  type HelixResearchLibraryList,
  type HelixResearchLibraryPage,
} from "@shared/helix-research-library";
import { ensureDatabase, getPool } from "../../db/client";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTED_CONTENT_PREFIX = "v1";
const DEFAULT_PROFILE_QUOTA_BYTES = 100 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 16 * 1024 * 1024;

type ResearchLibraryRow = {
  document_id: string;
  profile_id: string;
  source_integrity_hash: string;
  metadata: HelixResearchLibraryDocumentSummary | string;
  encrypted_content: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type SaveResearchLibraryExtractionInput = {
  profile_id: string;
  title?: string | null;
  source_url?: string | null;
  source_kind: "pdf" | "html" | "unknown";
  source_pdf_ref?: string | null;
  source_integrity_hash: string;
  paper_result_id?: string | null;
  query?: string | null;
  extraction_status: "full_text_usable" | "page_image_parse_required";
  pages: HelixResearchLibraryPage[];
};

const clean = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const iso = (value: Date | string): string => value instanceof Date ? value.toISOString() : value;
const canonicalResearchSourceUrl = (value: unknown): string => {
  const raw = clean(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    if (url.hostname.toLowerCase() === "arxiv.org") {
      const match = url.pathname.match(/^\/(?:abs|pdf)\/([^/?#]+?)(?:\.pdf)?$/i);
      if (match?.[1]) return `https://arxiv.org/pdf/${match[1]}`;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
};

const encryptionKey = (): { key: Buffer; keyId: string } => {
  const configured = clean(process.env.HELIX_PROFILE_STORAGE_ENCRYPTION_KEY);
  if (configured) {
    const decoded = Buffer.from(configured, "base64url");
    const key = decoded.length >= 32 ? decoded.subarray(0, 32) : crypto.createHash("sha256").update(configured).digest();
    return { key, keyId: `env:${crypto.createHash("sha256").update(key).digest("base64url").slice(0, 12)}` };
  }
  if (clean(process.env.NODE_ENV).toLowerCase() === "production") {
    throw new Error("research_library_encryption_key_missing");
  }
  return {
    key: crypto.createHash("sha256").update("casimirbot-local-profile-storage-dev-key").digest(),
    keyId: "dev-local",
  };
};

const encryptPages = (pages: HelixResearchLibraryPage[]) => {
  const { key, keyId } = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(pages), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    encryptedContent: [
      ENCRYPTED_CONTENT_PREFIX,
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      encrypted.toString("base64url"),
    ].join(":"),
    keyId,
    contentBytes: plaintext.byteLength,
  };
};

const decryptPages = (value: string): HelixResearchLibraryPage[] => {
  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_CONTENT_PREFIX) throw new Error("research_library_content_invalid");
  const { key } = encryptionKey();
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(parts[1], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed = JSON.parse(plaintext);
  return Array.isArray(parsed) ? parsed as HelixResearchLibraryPage[] : [];
};

const parseMetadata = (row: ResearchLibraryRow): HelixResearchLibraryDocumentSummary => {
  const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
  return {
    ...metadata,
    schema: HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
    document_id: row.document_id,
    profile_id: row.profile_id,
    source_integrity_hash: row.source_integrity_hash,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
    private: true,
    raw_content_included: false,
  };
};

export async function saveResearchLibraryExtraction(
  input: SaveResearchLibraryExtractionInput,
): Promise<HelixResearchLibraryDocumentSummary> {
  const profileId = clean(input.profile_id);
  const integrityHash = clean(input.source_integrity_hash);
  if (!profileId) throw new Error("profile_session_required");
  if (!integrityHash) throw new Error("research_library_source_hash_required");
  const pages = input.pages
    .filter((page) => Number.isInteger(page.page) && page.page > 0)
    .sort((left, right) => left.page - right.page);
  const encrypted = encryptPages(pages);
  if (encrypted.contentBytes > MAX_DOCUMENT_BYTES) throw new Error("research_library_document_too_large");
  await ensureDatabase();
  const { rows: usageRows } = await getPool().query<{ total_bytes: string | number }>(
    `SELECT COALESCE(SUM(content_bytes), 0) AS total_bytes
     FROM helix_research_library_documents
     WHERE profile_id = $1 AND deleted_at IS NULL AND source_integrity_hash <> $2`,
    [profileId, integrityHash],
  );
  const currentBytes = Number(usageRows[0]?.total_bytes ?? 0);
  if (currentBytes + encrypted.contentBytes > DEFAULT_PROFILE_QUOTA_BYTES) {
    throw new Error("research_library_profile_quota_exceeded");
  }
  const documentId = `research:${crypto.createHash("sha256").update(`${profileId}:${integrityHash}`).digest("base64url").slice(0, 24)}`;
  const now = new Date().toISOString();
  const metadata: HelixResearchLibraryDocumentSummary = {
    schema: HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
    document_id: documentId,
    profile_id: profileId,
    title: clean(input.title) || clean(input.source_url) || "Extracted research paper",
    source_url: clean(input.source_url) || null,
    source_kind: input.source_kind,
    source_pdf_ref: clean(input.source_pdf_ref) || null,
    source_integrity_hash: integrityHash,
    paper_result_id: clean(input.paper_result_id) || null,
    query: clean(input.query) || null,
    page_count: pages.length,
    text_char_count: pages.reduce((sum, page) => sum + page.text.length, 0),
    extraction_status: input.extraction_status,
    language: null,
    sidecar_refs: [],
    created_at: now,
    updated_at: now,
    private: true,
    raw_content_included: false,
  };
  const { rows } = await getPool().query<ResearchLibraryRow>(
    `INSERT INTO helix_research_library_documents (
       document_id, profile_id, source_integrity_hash, metadata, encrypted_content,
       encryption_key_id, encryption_algorithm, content_bytes, created_at, updated_at, deleted_at
     ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, now(), now(), NULL)
     ON CONFLICT (profile_id, source_integrity_hash) DO UPDATE SET
       metadata = EXCLUDED.metadata,
       encrypted_content = EXCLUDED.encrypted_content,
       encryption_key_id = EXCLUDED.encryption_key_id,
       encryption_algorithm = EXCLUDED.encryption_algorithm,
       content_bytes = EXCLUDED.content_bytes,
       updated_at = now(),
       deleted_at = NULL
     RETURNING *`,
    [documentId, profileId, integrityHash, JSON.stringify(metadata), encrypted.encryptedContent, encrypted.keyId, ENCRYPTION_ALGORITHM, encrypted.contentBytes],
  );
  return parseMetadata(rows[0]);
}

export async function listResearchLibraryDocuments(profileId: string): Promise<HelixResearchLibraryList> {
  await ensureDatabase();
  const { rows } = await getPool().query<ResearchLibraryRow>(
    `SELECT * FROM helix_research_library_documents
     WHERE profile_id = $1 AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [profileId],
  );
  return {
    schema: HELIX_RESEARCH_LIBRARY_LIST_SCHEMA,
    ok: true,
    profile_id: profileId,
    documents: rows.map(parseMetadata),
    private: true,
    raw_content_included: false,
  };
}

export async function readResearchLibraryDocument(
  profileId: string,
  documentId: string,
): Promise<HelixResearchLibraryDocument | null> {
  await ensureDatabase();
  const { rows } = await getPool().query<ResearchLibraryRow>(
    `SELECT * FROM helix_research_library_documents
     WHERE profile_id = $1 AND document_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [profileId, documentId],
  );
  const row = rows[0];
  if (!row) return null;
  return { ...parseMetadata(row), pages: decryptPages(row.encrypted_content), raw_content_included: true };
}

export async function findResearchLibraryDocument(input: {
  profile_id: string;
  document_id?: string | null;
  source_url?: string | null;
  source_integrity_hash?: string | null;
}): Promise<HelixResearchLibraryDocument | null> {
  const profileId = clean(input.profile_id);
  const documentId = clean(input.document_id);
  const sourceUrl = clean(input.source_url);
  const integrityHash = clean(input.source_integrity_hash);
  if (!profileId || (!documentId && !sourceUrl && !integrityHash)) return null;
  await ensureDatabase();
  const { rows } = await getPool().query<ResearchLibraryRow>(
    `SELECT * FROM helix_research_library_documents
     WHERE profile_id = $1 AND deleted_at IS NULL
     ORDER BY updated_at DESC LIMIT 200`,
    [profileId],
  );
  const canonicalSourceUrl = canonicalResearchSourceUrl(sourceUrl);
  const row = rows.find((candidate) => {
    const metadata = typeof candidate.metadata === "string" ? JSON.parse(candidate.metadata) : candidate.metadata;
    return (
      (!documentId || candidate.document_id === documentId) &&
      (!integrityHash || candidate.source_integrity_hash === integrityHash) &&
      (!canonicalSourceUrl || canonicalResearchSourceUrl(metadata.source_url) === canonicalSourceUrl)
    );
  });
  if (!row) return null;
  return { ...parseMetadata(row), pages: decryptPages(row.encrypted_content), raw_content_included: true };
}

export async function deleteResearchLibraryDocument(profileId: string, documentId: string): Promise<boolean> {
  await ensureDatabase();
  const result = await getPool().query(
    `UPDATE helix_research_library_documents SET deleted_at = now(), updated_at = now()
     WHERE profile_id = $1 AND document_id = $2 AND deleted_at IS NULL`,
    [profileId, documentId],
  );
  return (result.rowCount ?? 0) > 0;
}
