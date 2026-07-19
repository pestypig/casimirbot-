import crypto from "node:crypto";
import {
  HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
  HELIX_RESEARCH_LIBRARY_LIST_SCHEMA,
  HELIX_RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX,
  researchLibraryDocViewerPath,
  type HelixResearchLibraryDocument,
  type HelixResearchLibraryDocumentSummary,
  type HelixResearchLibraryList,
  type HelixResearchLibraryPage,
} from "@shared/helix-research-library";
import {
  buildHelixPaperEvidenceSidecarV1,
  type HelixPaperEvidenceSidecarV1,
} from "@shared/helix-paper-evidence-sidecar";
import {
  applyHelixPaperEvidenceEnrichmentV1,
  type ApplyHelixPaperEvidenceEnrichmentResultV1,
} from "@shared/helix-paper-evidence-enrichment";
import { ensureDatabase, getPool } from "../../db/client";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTED_CONTENT_PREFIX = "v1";
const DEFAULT_PROFILE_QUOTA_BYTES = 100 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 16 * 1024 * 1024;
export const RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX =
  HELIX_RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX;

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

export const researchLibraryPrivateAccountToken = (profileId: string): string => {
  const { key } = encryptionKey();
  return crypto
    .createHmac("sha256", key)
    .update(`research-library-private-account\n${clean(profileId)}`)
    .digest("base64url")
    .slice(0, 24);
};

export const researchLibraryDocumentViewerRef = (profileId: string, documentId: string): string => {
  const { key } = encryptionKey();
  const documentToken = crypto
    .createHmac("sha256", key)
    .update(`research-library-private-document\n${clean(profileId)}\n${clean(documentId)}`)
    .digest("base64url")
    .slice(0, 24);
  return `private-research:${researchLibraryPrivateAccountToken(profileId)}:${documentToken}`;
};

export const researchLibraryPrivateMailboxThreadId = (profileId: string): string => {
  return `${RESEARCH_LIBRARY_PRIVATE_MAILBOX_THREAD_PREFIX}${researchLibraryPrivateAccountToken(profileId)}`;
};

type EncryptedResearchLibraryContentV2 = {
  schema: "helix.research_library_encrypted_content.v2";
  pages: HelixResearchLibraryPage[];
  paper_evidence_sidecars: HelixPaperEvidenceSidecarV1[];
};

const encryptContent = (content: EncryptedResearchLibraryContentV2) => {
  const { key, keyId } = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(content), "utf8");
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

const decryptContent = (value: string): EncryptedResearchLibraryContentV2 => {
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
  if (Array.isArray(parsed)) {
    return {
      schema: "helix.research_library_encrypted_content.v2",
      pages: parsed as HelixResearchLibraryPage[],
      paper_evidence_sidecars: [],
    };
  }
  if (parsed && typeof parsed === "object") {
    const record = parsed as Partial<EncryptedResearchLibraryContentV2>;
    return {
      schema: "helix.research_library_encrypted_content.v2",
      pages: Array.isArray(record.pages) ? record.pages : [],
      paper_evidence_sidecars: Array.isArray(record.paper_evidence_sidecars)
        ? record.paper_evidence_sidecars
        : [],
    };
  }
  return {
    schema: "helix.research_library_encrypted_content.v2",
    pages: [],
    paper_evidence_sidecars: [],
  };
};

const parseMetadata = (row: ResearchLibraryRow): HelixResearchLibraryDocumentSummary => {
  const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
  const viewerRef = researchLibraryDocumentViewerRef(row.profile_id, row.document_id);
  const docPath = researchLibraryDocViewerPath(viewerRef);
  return {
    ...metadata,
    schema: HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
    document_id: row.document_id,
    viewer_ref: viewerRef,
    private_translation_scope: {
      doc_path: docPath,
      source_id: `document_markdown:${docPath}`,
      mailbox_thread_id: researchLibraryPrivateMailboxThreadId(row.profile_id),
    },
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
  const documentId = `research:${crypto.createHash("sha256").update(`${profileId}:${integrityHash}`).digest("base64url").slice(0, 24)}`;
  const now = new Date().toISOString();
  const freshPaperEvidenceSidecar = buildHelixPaperEvidenceSidecarV1({
    document_id: documentId,
    source_integrity_hash: integrityHash,
    paper_result_id: clean(input.paper_result_id) || null,
    extraction_status: input.extraction_status,
    pages,
    generated_at: now,
  });
  await ensureDatabase();
  const { rows: existingRows } = await getPool().query<ResearchLibraryRow>(
    `SELECT * FROM helix_research_library_documents
     WHERE profile_id = $1 AND source_integrity_hash = $2 AND deleted_at IS NULL LIMIT 1`,
    [profileId, integrityHash],
  );
  const existingContent = existingRows[0]
    ? decryptContent(existingRows[0].encrypted_content)
    : null;
  const preserveEnrichedContent = Boolean(existingContent?.paper_evidence_sidecars.some((sidecar) =>
    (sidecar.revision ?? 1) > 1 || (sidecar.enrichment?.history?.length ?? 0) > 0,
  ));
  const contentToPersist: EncryptedResearchLibraryContentV2 = preserveEnrichedContent && existingContent
    ? existingContent
    : {
        schema: "helix.research_library_encrypted_content.v2",
        pages,
        paper_evidence_sidecars: [freshPaperEvidenceSidecar],
      };
  const persistedPages = contentToPersist.pages;
  const paperEvidenceSidecar = contentToPersist.paper_evidence_sidecars[0] ?? freshPaperEvidenceSidecar;
  const encrypted = encryptContent({
    schema: "helix.research_library_encrypted_content.v2",
    pages: persistedPages,
    paper_evidence_sidecars: contentToPersist.paper_evidence_sidecars.length > 0
      ? contentToPersist.paper_evidence_sidecars
      : [paperEvidenceSidecar],
  });
  if (encrypted.contentBytes > MAX_DOCUMENT_BYTES) throw new Error("research_library_document_too_large");
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
  const metadata: HelixResearchLibraryDocumentSummary = {
    schema: HELIX_RESEARCH_LIBRARY_DOCUMENT_SCHEMA,
    document_id: documentId,
    viewer_ref: researchLibraryDocumentViewerRef(profileId, documentId),
    private_translation_scope: {
      doc_path: researchLibraryDocViewerPath(researchLibraryDocumentViewerRef(profileId, documentId)),
      source_id: `document_markdown:${researchLibraryDocViewerPath(researchLibraryDocumentViewerRef(profileId, documentId))}`,
      mailbox_thread_id: researchLibraryPrivateMailboxThreadId(profileId),
    },
    profile_id: profileId,
    title: clean(input.title) || clean(input.source_url) || "Extracted research paper",
    source_url: clean(input.source_url) || null,
    source_kind: input.source_kind,
    source_pdf_ref: clean(input.source_pdf_ref) || null,
    source_integrity_hash: integrityHash,
    paper_result_id: clean(input.paper_result_id) || null,
    query: clean(input.query) || null,
    page_count: persistedPages.length,
    text_char_count: persistedPages.reduce((sum, page) => sum + page.text.length, 0),
    extraction_status: input.extraction_status,
    language: null,
    sidecar_refs: [{
      sidecar_id: paperEvidenceSidecar.sidecar_id,
      kind: paperEvidenceSidecar.sidecar_kind,
      artifact_ref: paperEvidenceSidecar.sidecar_id,
      ...(persistedPages[0]?.page ? { page_start: persistedPages[0].page } : {}),
      ...(persistedPages.at(-1)?.page ? { page_end: persistedPages.at(-1)?.page } : {}),
      created_at: paperEvidenceSidecar.generated_at,
    }],
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
  const content = decryptContent(row.encrypted_content);
  return {
    ...parseMetadata(row),
    pages: content.pages,
    paper_evidence_sidecars: content.paper_evidence_sidecars,
    raw_content_included: true,
  };
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
  const content = decryptContent(row.encrypted_content);
  return {
    ...parseMetadata(row),
    pages: content.pages,
    paper_evidence_sidecars: content.paper_evidence_sidecars,
    raw_content_included: true,
  };
}

export type ApplyResearchLibraryEvidenceEnrichmentResult =
  | (Extract<ApplyHelixPaperEvidenceEnrichmentResultV1, { ok: true }> & {
      document_id: string;
      sidecar_id: string;
      updated_at: string;
    })
  | Extract<ApplyHelixPaperEvidenceEnrichmentResultV1, { ok: false }>;

export async function applyResearchLibraryEvidenceEnrichment(input: {
  profile_id: string;
  document_id: string;
  proposal: unknown;
}): Promise<ApplyResearchLibraryEvidenceEnrichmentResult> {
  const profileId = clean(input.profile_id);
  const documentId = clean(input.document_id);
  if (!profileId) throw new Error("profile_session_required");
  if (!documentId) throw new Error("research_library_document_id_required");
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<ResearchLibraryRow>(
      `SELECT * FROM helix_research_library_documents
       WHERE profile_id = $1 AND document_id = $2 AND deleted_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [profileId, documentId],
    );
    const row = rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      throw new Error("research_library_document_not_found");
    }
    const content = decryptContent(row.encrypted_content);
    const proposalRecord = input.proposal && typeof input.proposal === "object"
      ? input.proposal as Record<string, unknown>
      : null;
    const requestedSidecarId = clean(proposalRecord?.sidecar_id);
    const sidecarIndex = content.paper_evidence_sidecars.findIndex((sidecar) =>
      sidecar.sidecar_id === requestedSidecarId,
    );
    if (sidecarIndex < 0) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        status: "blocked",
        failure_code: "paper_evidence_enrichment_identity_mismatch",
        missing_requirements: ["saved_paper_evidence_sidecar_required"],
      };
    }
    const appliedAt = new Date().toISOString();
    const result = applyHelixPaperEvidenceEnrichmentV1({
      sidecar: content.paper_evidence_sidecars[sidecarIndex],
      pages: content.pages,
      proposal: input.proposal,
      applied_at: appliedAt,
    });
    if (!result.ok) {
      await client.query("ROLLBACK");
      return result;
    }
    if (result.status === "idempotent") {
      await client.query("ROLLBACK");
      return {
        ...result,
        document_id: documentId,
        sidecar_id: result.sidecar.sidecar_id,
        updated_at: result.sidecar.updated_at ?? iso(row.updated_at),
      };
    }
    const paperEvidenceSidecars = [...content.paper_evidence_sidecars];
    paperEvidenceSidecars[sidecarIndex] = result.sidecar;
    const encrypted = encryptContent({
      schema: "helix.research_library_encrypted_content.v2",
      pages: content.pages,
      paper_evidence_sidecars: paperEvidenceSidecars,
    });
    if (encrypted.contentBytes > MAX_DOCUMENT_BYTES) {
      await client.query("ROLLBACK");
      throw new Error("research_library_document_too_large");
    }
    const { rows: usageRows } = await client.query<{ total_bytes: string | number }>(
      `SELECT COALESCE(SUM(content_bytes), 0) AS total_bytes
       FROM helix_research_library_documents
       WHERE profile_id = $1 AND document_id <> $2 AND deleted_at IS NULL`,
      [profileId, documentId],
    );
    if (Number(usageRows[0]?.total_bytes ?? 0) + encrypted.contentBytes > DEFAULT_PROFILE_QUOTA_BYTES) {
      await client.query("ROLLBACK");
      throw new Error("research_library_profile_quota_exceeded");
    }
    const metadata = parseMetadata(row);
    metadata.updated_at = appliedAt;
    await client.query(
      `UPDATE helix_research_library_documents SET
         metadata = $3::jsonb,
         encrypted_content = $4,
         encryption_key_id = $5,
         encryption_algorithm = $6,
         content_bytes = $7,
         updated_at = $8
       WHERE profile_id = $1 AND document_id = $2 AND deleted_at IS NULL`,
      [
        profileId,
        documentId,
        JSON.stringify(metadata),
        encrypted.encryptedContent,
        encrypted.keyId,
        ENCRYPTION_ALGORITHM,
        encrypted.contentBytes,
        appliedAt,
      ],
    );
    await client.query("COMMIT");
    return {
      ...result,
      document_id: documentId,
      sidecar_id: result.sidecar.sidecar_id,
      updated_at: appliedAt,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original failure.
    }
    throw error;
  } finally {
    client.release();
  }
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
