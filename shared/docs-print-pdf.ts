export const DOCS_PRINT_PDF_SCHEMA = "docs_print_pdf/1" as const;
export const DOCS_PRINT_PDF_FEATURE_FLAG = "docs_viewer_print_pdf_export" as const;
export const DOCS_PRINT_PDF_MAX_MARKDOWN_CHARS = 1_500_000;
export const DOCS_PRINT_PDF_MAX_TITLE_CHARS = 240;
export const DOCS_PRINT_PDF_MAX_SOURCE_PATH_CHARS = 1_000;

export type DocsPrintPdfSourceKind = "canonical_docs" | "private_research";

export type DocsPrintPdfRequest = {
  schema: typeof DOCS_PRINT_PDF_SCHEMA;
  title: string;
  source_path: string;
  source_kind: DocsPrintPdfSourceKind;
  source_markdown: string;
};

export type DocsPrintPdfResponseHeaders = {
  schema: typeof DOCS_PRINT_PDF_SCHEMA;
  filename: string;
  sha256: string;
  page_count: number;
  equation_count: number;
  table_count: number;
  validation: "pass";
};

export function sanitizeDocsPrintPdfFilename(title: string): string {
  const stem = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .toLowerCase();
  return `${stem || "document"}-print.pdf`;
}
