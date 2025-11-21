export const KNOWLEDGE_DEFAULT_CONTEXT_LIMIT = 262_144; // 256 KB
export const KNOWLEDGE_DEFAULT_FILES_PER_PROJECT = 64;
export const KNOWLEDGE_FALLBACK_ALLOWED_MIME = [
  "text/plain",
  "text/markdown",
  "application/json",
  "application/pdf",
  "audio/wav",
  "audio/mpeg",
];

export type KnowledgeFileKind = "text" | "json" | "code" | "audio" | "image";

export type KnowledgeProjectMeta = {
  id: string;
  name: string;
  color?: string;
  tags?: string[];
  type?: string;
  hashSlug?: string;
  active?: boolean;
  meta?: Record<string, unknown>;
};

export type KnowledgeFileAttachment = {
  id: string;
  name: string;
  path?: string;
  mime: string;
  size: number;
  hashSlug?: string;
  projectId?: string;
  kind: KnowledgeFileKind;
  preview?: string;
  contentBase64?: string;
};

export type KnowledgeProjectExport = {
  project: Pick<KnowledgeProjectMeta, "id" | "name" | "tags" | "type" | "hashSlug">;
  summary?: string;
  files: KnowledgeFileAttachment[];
  approxBytes?: number;
  omittedFiles?: string[];
};

export type KnowledgeContextPayload = KnowledgeProjectExport[];
