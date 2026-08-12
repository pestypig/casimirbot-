export const HELIX_DOCS_RETRIEVAL_STATUSES = [
  "primary",
  "supporting",
  "archive",
  "excluded",
] as const;

export type HelixDocsRetrievalStatus =
  (typeof HELIX_DOCS_RETRIEVAL_STATUSES)[number];

export const HELIX_DOCS_RETRIEVAL_SCOPES = [
  "default",
  "include_archive",
  "archive_only",
] as const;

export type HelixDocsRetrievalScope =
  (typeof HELIX_DOCS_RETRIEVAL_SCOPES)[number];

export type HelixDocsRetrievalAuthorityMetadata = {
  retrieval_status?: HelixDocsRetrievalStatus;
  topic_id?: string;
  authority_rank?: number;
  superseded_by?: string;
};

export const isHelixDocsRetrievalStatus = (
  value: unknown,
): value is HelixDocsRetrievalStatus =>
  typeof value === "string" &&
  HELIX_DOCS_RETRIEVAL_STATUSES.includes(
    value as HelixDocsRetrievalStatus,
  );

export const isHelixDocsRetrievalScope = (
  value: unknown,
): value is HelixDocsRetrievalScope =>
  typeof value === "string" &&
  HELIX_DOCS_RETRIEVAL_SCOPES.includes(value as HelixDocsRetrievalScope);
