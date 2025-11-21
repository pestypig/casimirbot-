import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const ChecklistFrames = z.object({
  observer: z.string().optional(),
  timescale: z.string().optional(),
  domain: z.string().optional(),
});

const DebateChecklistGenerateInput = z.object({
  goal: z.string().min(1),
  frames: ChecklistFrames.optional(),
  sources: z.array(z.string()).optional(),
});

const Hypothesis = z.object({
  id: z.string(),
  text: z.string(),
  predictions: z.array(z.string()).default([]),
  disconfirmers: z.array(z.string()).default([]),
});

const ChecklistSchema = z.object({
  intention: z.string(),
  frames: ChecklistFrames.default({}),
  hypotheses: z.array(Hypothesis),
  evidence: z.array(z.any()).default([]),
  conflicts: z.array(z.any()).default([]),
  tests: z.array(z.any()).default([]),
  metrics: z
    .object({
      coverage: z.number().min(0).max(1).default(0),
      falsifiers_tested: z.number().int().nonnegative().default(0),
      open_conflicts: z.number().int().nonnegative().default(0),
    })
    .default({ coverage: 0, falsifiers_tested: 0, open_conflicts: 0 }),
  verdict: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0),
});

const DebateChecklistGenerateOutput = z.object({
  checklist: ChecklistSchema,
});

export const debateChecklistGenerateSpec: ToolSpecShape = {
  name: "checklist.method.generate",
  desc: "Instantiate a falsifiability checklist for the debate session.",
  inputSchema: DebateChecklistGenerateInput,
  outputSchema: DebateChecklistGenerateOutput,
  deterministic: true,
  rateLimit: { rpm: 10 },
  safety: { risks: [] },
};

export const debateChecklistGenerateHandler: ToolHandler = async (rawInput) => {
  const input = DebateChecklistGenerateInput.parse(rawInput ?? {});
  const baseHypothesis: z.infer<typeof Hypothesis> = {
    id: "H1",
    text: input.goal,
    predictions: ["coherence_mhz < 0.56 when tilesActive < 32", "sampling wider increases coherence if transient"],
    disconfirmers: ["coherence_mhz >= 0.56 while badge is yellow", "coherence rises with sampling but badge stays yellow"],
  };
  const checklist: z.infer<typeof ChecklistSchema> = {
    intention: input.goal,
    frames: input.frames ?? {},
    hypotheses: [baseHypothesis],
    evidence: [],
    conflicts: [],
    tests: [],
    metrics: { coverage: 0, falsifiers_tested: 0, open_conflicts: 0 },
    verdict: null,
    confidence: 0,
  };
  return { checklist };
};

// Alias for debate-prefixed name.
export const debateChecklistGenerateAliasSpec: ToolSpecShape = {
  ...debateChecklistGenerateSpec,
  name: "debate.checklist.generate",
};
