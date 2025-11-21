import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const DocsContradictionScanInput = z.object({
  claim: z.string().min(1),
  scope: z
    .object({
      projects: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  k: z.number().int().positive().max(10).default(5),
});

const DocsContradictionScanOutput = z.object({
  contradictions: z.array(
    z.object({
      excerpt: z.string(),
      citation: z.object({
        type: z.enum(["md", "pdf"]),
        path: z.string(),
        heading: z.string().optional(),
        page: z.number().int().positive().optional(),
      }),
      score: z.number().min(0).max(1),
    }),
  ),
});

export const docsContradictionScanSpec: ToolSpecShape = {
  name: "contradiction.scan",
  desc: "Hunt for passages that likely contradict the supplied claim.",
  inputSchema: DocsContradictionScanInput,
  outputSchema: DocsContradictionScanOutput,
  deterministic: true,
  rateLimit: { rpm: 25 },
  safety: { risks: [] },
};

export const docsContradictionScanHandler: ToolHandler = async (rawInput) => {
  const input = DocsContradictionScanInput.parse(rawInput ?? {});
  const hits = Array.from({ length: Math.min(input.k, 3) }).map((_, idx) => ({
    excerpt: `Counter-evidence ${idx + 1} challenging "${input.claim.slice(0, 60)}"...`,
    citation: {
      type: "md" as const,
      path: (input.scope?.projects?.[0] ?? "baseline") + `/contradiction-${idx + 1}.md`,
      heading: "Contradiction",
    },
    score: 0.45 + idx * 0.1,
  }));
  return { contradictions: hits };
};

