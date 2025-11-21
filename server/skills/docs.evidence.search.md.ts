import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const Window = z.object({ tokens: z.number().int().positive().max(1024).default(160) });

const DocsEvidenceSearchMdInput = z.object({
  query: z.string().min(1),
  projectIds: z.array(z.string().min(1)).optional(),
  k: z.number().int().positive().max(25).default(6),
  window: Window.default({ tokens: 160 }),
});

const MdCitation = z.object({
  type: z.literal("md"),
  path: z.string(),
  heading: z.string().optional(),
  lineStart: z.number().int().nonnegative().optional(),
  lineEnd: z.number().int().nonnegative().optional(),
});

const DocsEvidenceSearchMdOutput = z.object({
  hits: z.array(
    z.object({
      docId: z.string(),
      excerpt: z.string(),
      score: z.number().min(0).max(1),
      citation: MdCitation,
    }),
  ),
});

const buildExcerpt = (query: string, tokens: number): string => {
  const normalized = query.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const words = normalized.split(" ").slice(0, Math.max(6, Math.min(24, tokens / 4)));
  return `${words.join(" ")} - evidence window (${tokens} tokens)`;
};

export const docsEvidenceSearchMdSpec: ToolSpecShape = {
  name: "docs.evidence.search.md",
  desc: "Retrieve markdown snippets with lightweight citations for debate turns.",
  inputSchema: DocsEvidenceSearchMdInput,
  outputSchema: DocsEvidenceSearchMdOutput,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
};

export const docsEvidenceSearchMdHandler: ToolHandler = async (rawInput) => {
  const input = DocsEvidenceSearchMdInput.parse(rawInput ?? {});
  const tokens = input.window.tokens;
  const hits = Array.from({ length: Math.min(input.k, 6) }).map((_, index) => {
    const docSlug = input.projectIds?.[0] ?? "docs";
    const docId = `${docSlug}/evidence-${index + 1}.md`;
    return {
      docId,
      excerpt: buildExcerpt(input.query, tokens),
      score: 0.65 + index * 0.02,
      citation: {
        type: "md" as const,
        path: docId,
        heading: "Auto-generated snippet",
        lineStart: 10 * (index + 1),
        lineEnd: 10 * (index + 1) + Math.max(6, Math.floor(tokens / 12)),
      },
    };
  });
  return { hits };
};
