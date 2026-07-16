import type {
  HelixResearchLibraryDocument,
  HelixResearchLibraryDocumentSummary,
  HelixResearchLibraryList,
} from "@shared/helix-research-library";

const readError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    return typeof body?.message === "string" ? body.message : typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

export async function listResearchLibraryDocuments(signal?: AbortSignal): Promise<HelixResearchLibraryDocumentSummary[]> {
  const response = await fetch("/api/research-library", { credentials: "same-origin", signal });
  if (!response.ok) throw new Error(await readError(response));
  const body = await response.json() as HelixResearchLibraryList;
  return Array.isArray(body.documents) ? body.documents : [];
}

export async function readResearchLibraryDocument(
  documentId: string,
  signal?: AbortSignal,
): Promise<HelixResearchLibraryDocument> {
  const response = await fetch(`/api/research-library/${encodeURIComponent(documentId)}`, {
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = await response.json() as { document?: HelixResearchLibraryDocument };
  if (!body.document) throw new Error("research_library_document_missing");
  return body.document;
}

export async function deleteResearchLibraryDocument(
  documentId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/research-library/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw new Error(await readError(response));
}

export function researchLibraryDocumentToMarkdown(document: HelixResearchLibraryDocument): string {
  const provenance = [
    `# ${document.title}`,
    "",
    `> Private extracted research document. Extraction status: \`${document.extraction_status}\`.`,
    document.source_url ? `> Source: ${document.source_url}` : null,
    `> Integrity: \`${document.source_integrity_hash}\``,
    "",
  ].filter((line): line is string => line !== null);
  const pages = document.pages.flatMap((page) => [
    `## Page ${page.page}`,
    "",
    page.text || "_No machine-readable text was extracted from this page._",
    "",
  ]);
  return [...provenance, ...pages].join("\n");
}
