import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const NumericExtractUnitsInput = z.object({
  text: z.string().min(1),
  system: z.string().optional(),
});

const NumericExtractUnitsOutput = z.object({
  values: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    }),
  ),
});

const NUMBER_RE = /([a-zA-Z_][a-zA-Z0-9_-]*)?\s*[:=]?\s*([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)/g;

export const numericExtractUnitsSpec: ToolSpecShape = {
  name: "numeric.extract.units",
  desc: "Extract numeric bindings with optional unit hints for math verification.",
  inputSchema: NumericExtractUnitsInput,
  outputSchema: NumericExtractUnitsOutput,
  deterministic: true,
  rateLimit: { rpm: 60 },
  safety: { risks: [] },
};

export const numericExtractUnitsHandler: ToolHandler = async (rawInput) => {
  const input = NumericExtractUnitsInput.parse(rawInput ?? {});
  const values: Array<{ name: string; value: number; unit?: string }> = [];
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = NUMBER_RE.exec(input.text)) !== null) {
    const nameRaw = (match[1] ?? "").trim();
    const name = nameRaw || `value_${values.length + 1}`;
    if (seen.has(name)) continue;
    seen.add(name);
    const value = Number(match[2]);
    if (!Number.isFinite(value)) continue;
    values.push({ name, value, unit: input.system ?? undefined });
    if (values.length >= 12) break;
  }
  return { values };
};

