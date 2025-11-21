import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const CitationInput = z.object({
  quote: z.string().min(1),
  citation: z.object({
    type: z.enum(["pdf", "md"]),
    path: z.string(),
    page: z.number().int().positive().optional(),
    heading: z.string().optional(),
  }),
});

const CitationVerifyOutput = z.object({
  ok: z.boolean(),
  loc: z.string().optional(),
  similarity: z.number().min(0).max(1).optional(),
});

const cosineLike = (a: string, b: string): number => {
  const ta = a.toLowerCase().split(/\s+/).filter(Boolean);
  const tb = b.toLowerCase().split(/\s+/).filter(Boolean);
  const setA = new Set(ta);
  const setB = new Set(tb);
  let overlap = 0;
  for (const token of setA) {
    if (setB.has(token)) overlap += 1;
  }
  const denom = Math.max(setA.size + setB.size - overlap, 1);
  return Math.min(1, overlap / denom);
};

export const citationVerifySpanSpec: ToolSpecShape = {
  name: "citation.verify.span",
  desc: "Lightweight quote-to-citation consistency check.",
  inputSchema: CitationInput,
  outputSchema: CitationVerifyOutput,
  deterministic: true,
  rateLimit: { rpm: 60 },
  safety: { risks: [] },
};

export const citationVerifySpanHandler: ToolHandler = async (rawInput) => {
  const input = CitationInput.parse(rawInput ?? {});
  const sim = cosineLike(input.quote, `${input.citation.path} ${input.citation.heading ?? ""}`);
  const ok = sim >= 0.3;
  const loc = input.citation.page ? `page ${input.citation.page}` : input.citation.heading ?? "context";
  return { ok, loc, similarity: Number(sim.toFixed(2)) };
};

