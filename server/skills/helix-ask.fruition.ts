import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type { FruitionProcedureExpressionV1 } from "@shared/fruition-procedure-expression";
import type { HelixRecommendedActionAdmissionV1 } from "@shared/contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionInputKindV1,
  IdeologyContextReflectionV1,
} from "@shared/ideology-context-reflection";
import type { MoralBadgeLocatorV1 } from "@shared/moral-badge-locator";
import { loadIdeologyGraphFromFile } from "@shared/moral-graph/load-ideology-graph";
import { reflectIdeologyContext } from "@shared/moral-graph/reflect-ideology-context";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "@shared/moral-graph/map-ideology-recommendations-to-admission";
import { calculateFruitionFromReflection } from "@shared/moral-graph/calculate-fruition";
import { locateMoralBadges } from "@shared/moral-graph/locate-moral-badges";

export const HELIX_ASK_FRUITION_TOOL_NAME = "helix_ask.calculate_fruition" as const;

const inputKinds = [
  "user_prompt",
  "workstation_event",
  "document_selection",
  "note",
  "repo_evidence",
  "situation_room_event",
  "voice_event",
] as const;

const FruitionToolInputSchema = z.object({
  inputKind: z.enum(inputKinds).default("user_prompt"),
  text: z.string().optional(),
  prompt: z.string().optional(),
  question: z.string().optional(),
  refs: z.array(z.string()).optional(),
  objective: z.string().optional(),
  options: z
    .object({
      includeReflection: z.boolean().optional(),
      includeAdmissionArtifacts: z.boolean().optional(),
      includeLocator: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskFruitionToolInput = {
  inputKind: IdeologyContextReflectionInputKindV1;
  text: string;
  refs?: string[];
  objective?: string;
  options?: {
    includeReflection?: boolean;
    includeAdmissionArtifacts?: boolean;
    includeLocator?: boolean;
  };
};

export type HelixAskFruitionToolOutput = {
  reflection?: IdeologyContextReflectionV1;
  locator?: MoralBadgeLocatorV1;
  fruition: FruitionProcedureExpressionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

let graphPromise: ReturnType<typeof loadIdeologyGraphFromFile> | null = null;

function getIdeologyGraph() {
  graphPromise ??= loadIdeologyGraphFromFile();
  return graphPromise;
}

export async function runHelixAskFruitionTool(
  input: HelixAskFruitionToolInput,
): Promise<HelixAskFruitionToolOutput> {
  const graph = await getIdeologyGraph();
  const reflection = reflectIdeologyContext(graph, {
    kind: input.inputKind,
    text: input.text,
    refs: input.refs,
  });
  const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection);
  const fruition = calculateFruitionFromReflection({
    reflection,
    admission,
    objective: input.objective,
  });
  const locator = input.options?.includeLocator === false
    ? undefined
    : locateMoralBadges(graph, {
        kind: input.inputKind,
        text: input.text,
        refs: input.refs,
        reflection,
      });
  const admissions = input.options?.includeAdmissionArtifacts === false ? [] : [admission];

  return {
    ...(input.options?.includeReflection === false ? {} : { reflection }),
    ...(locator ? { locator } : {}),
    fruition,
    admissions,
  };
}

export const fruitionSpec: ToolSpecShape = {
  name: HELIX_ASK_FRUITION_TOOL_NAME,
  desc: "Deterministic Fruition procedure calculator over MoralGraph reflection. Produces traceable procedural expressions and evidence-only admissions; never execution authority.",
  inputSchema: {
    type: "object",
    properties: {
      inputKind: { type: "string", enum: [...inputKinds] },
      text: { type: "string" },
      refs: { type: "array", items: { type: "string" } },
      objective: { type: "string" },
      options: {
        type: "object",
        properties: {
          includeReflection: { type: "boolean" },
          includeAdmissionArtifacts: { type: "boolean" },
          includeLocator: { type: "boolean" },
        },
      },
    },
    required: ["text"],
  },
  outputSchema: {
    type: "object",
    properties: {
      reflection: { type: "object" },
      locator: { type: "object" },
      fruition: { type: "object" },
      admissions: { type: "array", items: { type: "object" } },
    },
    required: ["fruition", "admissions"],
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

export const fruitionHandler: ToolHandler = async (input: unknown) => {
  const parsed = FruitionToolInputSchema.parse(input);
  const text = parsed.text ?? parsed.prompt ?? parsed.question;
  if (!text || text.trim().length === 0) {
    throw new Error("fruition_text_required");
  }

  return runHelixAskFruitionTool({
    inputKind: parsed.inputKind,
    text,
    refs: parsed.refs,
    objective: parsed.objective,
    options: parsed.options,
  });
};
