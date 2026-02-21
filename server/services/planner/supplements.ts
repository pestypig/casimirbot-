import { z } from "zod";

export const SUPPLEMENT_KINDS = ["warp", "repo", "logs", "metrics", "sector-control"] as const;
export type SupplementKind = (typeof SUPPLEMENT_KINDS)[number];

export interface Supplement {
  kind: SupplementKind;
  tool: string;
  title: string;
  summary: string;
  detail?: string;
  citations?: string[];
  importance?: number;
}

export const SupplementSchema = z.object({
  kind: z.enum(SUPPLEMENT_KINDS),
  tool: z.string(),
  title: z.string(),
  summary: z.string(),
  detail: z.string().optional(),
  citations: z.array(z.string()).optional(),
  importance: z.number().min(0).max(1).optional(),
});

const CONTROL_CHARS = /[\u0000-\u001F]/g;

const sanitize = (value: string): string => value.replace(CONTROL_CHARS, " ");

const truncate = (value: string, max = 2000): string =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const isSupplement = (value: unknown): value is Supplement =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { kind?: unknown }).kind === "string" &&
      typeof (value as { tool?: unknown }).tool === "string" &&
      typeof (value as { title?: unknown }).title === "string" &&
      typeof (value as { summary?: unknown }).summary === "string",
  );

export const formatSupplementForPrompt = (supplement: Supplement): string => {
  const text = sanitize(supplement.detail || supplement.summary || "");
  const truncated = truncate(text);
  const citeLine =
    supplement.citations && supplement.citations.length > 0
      ? `\nCitations: ${supplement.citations.join(", ")}`
      : "";
  return `${supplement.title} [${supplement.tool}]\n${truncated}${citeLine}`;
};

export const extractSupplement = (value: unknown): Supplement | null => {
  if (!value) return null;
  if (isSupplement(value)) {
    return value;
  }
  if (typeof value === "object") {
    const direct = (value as { supplement?: unknown }).supplement;
    if (direct && isSupplement(direct)) {
      return direct;
    }
    const nested = (value as { output?: unknown }).output;
    if (nested) {
      return extractSupplement(nested);
    }
  }
  return null;
};

export const collectSupplements = (values: Iterable<unknown>): Supplement[] => {
  const out: Array<{ supplement: Supplement; index: number }> = [];
  let index = 0;
  for (const value of values) {
    const supplement = extractSupplement(value);
    if (supplement) {
      out.push({ supplement, index });
      index += 1;
    }
  }
  out.sort((a, b) => {
    const importanceDelta = (b.supplement.importance ?? 0) - (a.supplement.importance ?? 0);
    if (importanceDelta !== 0) {
      return importanceDelta;
    }
    return b.index - a.index;
  });
  return out.map((entry) => entry.supplement);
};

export const collectSupplementsFromOutputs = (outputs: Iterable<unknown>): Supplement[] => {
  return collectSupplements(outputs);
};

export const collectSupplementsFromResults = (results: Array<{ output?: unknown }>): Supplement[] => {
  return collectSupplements(results.map((result) => result.output));
};
