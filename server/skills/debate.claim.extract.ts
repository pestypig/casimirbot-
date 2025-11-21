import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const ClaimExtractInput = z.object({
  text: z.string().min(1),
});

const ClaimExtractOutput = z.object({
  claims: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      kind: z.enum(["prediction", "mechanism", "threshold"]).default("prediction"),
    }),
  ),
});

const pickKind = (sentence: string): "prediction" | "mechanism" | "threshold" => {
  const normalized = sentence.toLowerCase();
  if (/[\d.]+\s*(hz|mhz|ghz|q|coherence|threshold)/.test(normalized)) return "threshold";
  if (/\b(cause|because|drives|leads|due to|mechanism)\b/.test(normalized)) return "mechanism";
  return "prediction";
};

export const debateClaimExtractSpec: ToolSpecShape = {
  name: "debate.claim.extract",
  desc: "Extract atomic debate claims for downstream verification.",
  inputSchema: ClaimExtractInput,
  outputSchema: ClaimExtractOutput,
  deterministic: true,
  rateLimit: { rpm: 60 },
  safety: { risks: [] },
};

export const debateClaimExtractHandler: ToolHandler = async (rawInput) => {
  const input = ClaimExtractInput.parse(rawInput ?? {});
  const sentences = input.text
    .split(/[.?!]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const claims = sentences.slice(0, 6).map((sentence, idx) => ({
    id: `c${idx + 1}`,
    text: sentence,
    kind: pickKind(sentence),
  }));
  return { claims };
};

