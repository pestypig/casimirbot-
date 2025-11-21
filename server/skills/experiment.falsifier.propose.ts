import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const ExperimentFalsifierProposeInput = z.object({
  hypothesis: z.string().min(1),
  constraints: z
    .object({
      time: z.string().optional(),
      budget: z.string().optional(),
    })
    .optional(),
});

const ExperimentFalsifierProposeOutput = z.object({
  tests: z.array(
    z.object({
      name: z.string(),
      steps: z.array(z.string()),
      expectedFail: z.string(),
      risk: z.string().optional(),
    }),
  ),
});

export const experimentFalsifierProposeSpec: ToolSpecShape = {
  name: "experiment.falsifier.propose",
  desc: "Suggest quick falsifier experiments for the active hypothesis.",
  inputSchema: ExperimentFalsifierProposeInput,
  outputSchema: ExperimentFalsifierProposeOutput,
  deterministic: true,
  rateLimit: { rpm: 20 },
  safety: { risks: [] },
};

export const experimentFalsifierProposeHandler: ToolHandler = async (rawInput) => {
  const input = ExperimentFalsifierProposeInput.parse(rawInput ?? {});
  const bound = input.constraints?.time ?? "10min";
  const tests = [
    {
      name: "Wide window probe",
      steps: [
        `Expand sampling window within ${bound}.`,
        "Capture coherence and Q before/after.",
        "Log badge color transitions.",
      ],
      expectedFail: "Coherence rises above threshold while badge stays yellow.",
      risk: "Low; observational only.",
    },
    {
      name: "Threshold nudge",
      steps: ["Lower tile activation by 10%", "Observe badge change and coherence delta"],
      expectedFail: "Badge stays yellow despite coherence increase.",
      risk: "Medium; may reduce coverage temporarily.",
    },
  ];
  return { tests };
};

