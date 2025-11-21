import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const TableDoc = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  path: z.string().optional(),
});

const DocsTableExtractInput = z.object({
  doc: TableDoc,
  hint: z.string().optional(),
});

const DocsTableExtractOutput = z.object({
  rows: z.array(z.record(z.any())),
  citation: z.object({
    type: z.enum(["pdf", "md"]).default("pdf"),
    path: z.string(),
    page: z.number().int().positive().optional(),
    heading: z.string().optional(),
  }),
});

export const docsTableExtractSpec: ToolSpecShape = {
  name: "docs.table.extract",
  desc: "Extract structured rows from tables in PDF or markdown sources.",
  inputSchema: DocsTableExtractInput,
  outputSchema: DocsTableExtractOutput,
  deterministic: true,
  rateLimit: { rpm: 15 },
  safety: { risks: [] },
};

export const docsTableExtractHandler: ToolHandler = async (rawInput) => {
  const input = DocsTableExtractInput.parse(rawInput ?? {});
  const rows = [
    {
      metric: input.hint ?? "threshold",
      value: 0.56,
      note: "Synthetic table row for debate scaffolding.",
    },
  ];
  return {
    rows,
    citation: {
      type: "pdf" as const,
      path: input.doc.url,
      page: 1,
    },
  };
};

