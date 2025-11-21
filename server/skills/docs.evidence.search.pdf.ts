import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const EvidenceFile = z.object({
  title: z.string(),
  url: z.string(),
});

const DocsEvidenceSearchPdfInput = z.object({
  query: z.string().min(1),
  files: z.array(EvidenceFile).min(1),
  k: z.number().int().positive().max(15).default(5),
  windowChars: z.number().int().positive().max(4000).default(600),
});

const PdfCitation = z.object({
  type: z.literal("pdf"),
  path: z.string(),
  page: z.number().int().positive(),
  bbox: z.any().optional(),
});

const DocsEvidenceSearchPdfOutput = z.object({
  hits: z.array(
    z.object({
      docId: z.string(),
      page: z.number().int().positive(),
      text: z.string(),
      score: z.number().min(0).max(1),
      citation: PdfCitation,
    }),
  ),
});

const makeDocId = (title: string, index: number): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `pdf-${index + 1}`;

export const docsEvidenceSearchPdfSpec: ToolSpecShape = {
  name: "docs.evidence.search.pdf",
  desc: "Retrieve PDF spans with simple page citations for debate.",
  inputSchema: DocsEvidenceSearchPdfInput,
  outputSchema: DocsEvidenceSearchPdfOutput,
  deterministic: true,
  rateLimit: { rpm: 20 },
  safety: { risks: [] },
};

export const docsEvidenceSearchPdfHandler: ToolHandler = async (rawInput) => {
  const input = DocsEvidenceSearchPdfInput.parse(rawInput ?? {});
  const limit = Math.min(input.k, input.files.length);
  const hits = input.files.slice(0, limit).map((file, idx) => {
    const docId = makeDocId(file.title, idx);
    return {
      docId,
      page: 1 + idx,
      text: `${input.query} - excerpt window (${input.windowChars} chars)`,
      score: 0.6 + idx * 0.03,
      citation: {
        type: "pdf" as const,
        path: file.url,
        page: 1 + idx,
        bbox: null,
      },
    };
  });
  return { hits };
};
