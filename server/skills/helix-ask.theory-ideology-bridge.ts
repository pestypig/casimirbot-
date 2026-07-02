import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type { TheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";
import { validateTheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";
import type { IdeologyContextReflectionV1 } from "@shared/ideology-context-reflection";
import { validateIdeologyContextReflectionV1 } from "@shared/ideology-context-reflection";
import {
  buildTheoryIdeologyBridgeFromReflections,
  type TheoryIdeologyBridgeV1,
} from "@shared/theory-ideology-bridge";

export const HELIX_ASK_THEORY_IDEOLOGY_BRIDGE_TOOL_NAME =
  "helix_ask.bridge_theory_ideology_context" as const;

const TheoryIdeologyBridgeToolInputSchema = z.object({
  prompt: z.string(),
  objective: z.string().optional(),
  refs: z.array(z.string()).optional(),
  theoryReflection: z.record(z.unknown()).optional(),
  ideologyReflection: z.record(z.unknown()),
  options: z
    .object({
      includeRecommendedActions: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskTheoryIdeologyBridgeToolInput = {
  prompt: string;
  objective?: string;
  refs?: string[];
  theoryReflection?: TheoryContextReflectionV1 | null;
  ideologyReflection: IdeologyContextReflectionV1;
  options?: {
    includeRecommendedActions?: boolean;
  };
};

export type HelixAskTheoryIdeologyBridgeToolOutput = {
  bridge: TheoryIdeologyBridgeV1;
};

export async function runHelixAskTheoryIdeologyBridgeTool(
  input: HelixAskTheoryIdeologyBridgeToolInput,
): Promise<HelixAskTheoryIdeologyBridgeToolOutput> {
  const theoryIssues = input.theoryReflection
    ? validateTheoryContextReflectionV1(input.theoryReflection)
    : [];
  if (theoryIssues.length > 0) {
    throw new Error(`theory_ideology_bridge_invalid_theory_reflection:${theoryIssues.join("; ")}`);
  }

  const ideologyIssues = validateIdeologyContextReflectionV1(input.ideologyReflection);
  if (ideologyIssues.length > 0) {
    throw new Error(`theory_ideology_bridge_invalid_ideology_reflection:${ideologyIssues.join("; ")}`);
  }

  const bridge = buildTheoryIdeologyBridgeFromReflections({
    prompt: input.prompt,
    objective: input.objective,
    refs: input.refs,
    theoryReflection: input.theoryReflection,
    ideologyReflection: input.ideologyReflection,
  });

  return {
    bridge:
      input.options?.includeRecommendedActions === false
        ? { ...bridge, recommendedActions: [] }
        : bridge,
  };
}

export const theoryIdeologyBridgeSpec: ToolSpecShape = {
  name: HELIX_ASK_THEORY_IDEOLOGY_BRIDGE_TOOL_NAME,
  desc: "Deterministic evidence-only bridge between Theory graph reflection and MoralGraph reflection. It may relate observable constraints, mathematical structure, and declared/lived context to procedural justice lenses, but must not claim that physics proves morality, that a person is morally approved or failed, or that any action has execution permission. Analogy links remain analogy_only unless both graph receipts supply direct evidence for a stronger procedural relation.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      objective: { type: "string" },
      refs: { type: "array", items: { type: "string" } },
      theoryReflection: { type: "object" },
      ideologyReflection: { type: "object" },
      options: {
        type: "object",
        properties: {
          includeRecommendedActions: { type: "boolean" },
        },
      },
    },
    required: ["prompt", "ideologyReflection"],
  },
  outputSchema: {
    type: "object",
    properties: {
      bridge: { type: "object" },
    },
    required: ["bridge"],
  },
  deterministic: true,
  rateLimit: { rpm: 120 },
  safety: { risks: [] },
  risk: {
    writesFiles: false,
    touchesNetwork: false,
    privileged: false,
  },
  provenance: {
    maturity: "diagnostic",
    certifying: false,
    metadataComplete: true,
    sourceClass: "declared",
  },
  health: "ok",
};

export const theoryIdeologyBridgeHandler: ToolHandler = async (input: unknown) => {
  const parsed = TheoryIdeologyBridgeToolInputSchema.parse(input);
  return runHelixAskTheoryIdeologyBridgeTool({
    prompt: parsed.prompt,
    objective: parsed.objective,
    refs: parsed.refs,
    theoryReflection: parsed.theoryReflection as TheoryContextReflectionV1 | undefined,
    ideologyReflection: parsed.ideologyReflection as IdeologyContextReflectionV1,
    options: parsed.options,
  });
};
