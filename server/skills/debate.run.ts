import { z } from "zod";
import { DebateConfig, DEBATE_TOOL_NAME } from "@shared/essence-debate";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { startDebateAndWaitForOutcome } from "../services/debate/orchestrator";

const Attachment = z.object({
  title: z.string(),
  url: z.string(),
});

const DebateRunInput = z.object({
  topic: z.string(),
  personaId: z.string(),
  context: z
    .object({
      resonance_patch: z.any().optional(),
      telemetry_summary: z.any().optional(),
      knowledge_hints: z.any().optional(),
      attachments: z.array(Attachment).optional(),
      planner_prompt: z.string().optional(),
    })
    .optional(),
  budgets: z
    .object({
      max_rounds: z.number().int().positive().optional(),
      max_wall_ms: z.number().int().positive().optional(),
    })
    .optional(),
});

const DebateRunOutput = z.object({
  debateId: z.string(),
  verdict: z.string(),
  confidence: z.number(),
  key_turn_ids: z.array(z.string()),
});

export const debateRunSpec: ToolSpecShape = {
  name: DEBATE_TOOL_NAME,
  desc: "Starts a proponent/skeptic debate and waits for the referee verdict.",
  inputSchema: DebateRunInput,
  outputSchema: DebateRunOutput,
  deterministic: false,
  rateLimit: { rpm: 10 },
  safety: { risks: [] },
};

export const debateRunHandler: ToolHandler = async (rawInput) => {
  const input = DebateRunInput.parse(rawInput ?? {});
  const config = DebateConfig.parse({
    goal: input.topic,
    persona_id: input.personaId,
    max_rounds: input.budgets?.max_rounds,
    max_wall_ms: input.budgets?.max_wall_ms,
    context: input.context,
  });
  const { debateId, outcome } = await startDebateAndWaitForOutcome(config);
  return {
    debateId,
    verdict: outcome?.verdict ?? "stalemate",
    confidence: outcome?.confidence ?? 0,
    key_turn_ids: outcome?.key_turn_ids ?? [],
  };
};
