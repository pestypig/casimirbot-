import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type { HelixRecommendedActionAdmissionV1 } from "@shared/contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionInputKindV1,
  IdeologyContextReflectionV1,
} from "@shared/ideology-context-reflection";
import { loadIdeologyGraphFromFile } from "@shared/zen-graph/load-ideology-graph";
import { reflectIdeologyContext } from "@shared/zen-graph/reflect-ideology-context";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "@shared/zen-graph/map-ideology-recommendations-to-admission";

export const HELIX_ASK_ZEN_GRAPH_REFLECTION_TOOL_NAME = "helix_ask.reflect_ideology_context" as const;

const inputKinds = [
  "user_prompt",
  "workstation_event",
  "document_selection",
  "note",
  "repo_evidence",
  "situation_room_event",
  "voice_event",
] as const;

const ZenGraphToolInputSchema = z.object({
  inputKind: z.enum(inputKinds).default("user_prompt"),
  text: z.string().optional(),
  prompt: z.string().optional(),
  question: z.string().optional(),
  refs: z.array(z.string()).optional(),
  options: z
    .object({
      includeOverlay: z.boolean().optional(),
      includeRecommendedActions: z.boolean().optional(),
      includeAdmissionArtifacts: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskZenGraphReflectionToolInput = {
  inputKind: IdeologyContextReflectionInputKindV1;
  text: string;
  refs?: string[];
  options?: {
    includeOverlay?: boolean;
    includeRecommendedActions?: boolean;
    includeAdmissionArtifacts?: boolean;
  };
};

export type HelixAskZenGraphReflectionToolOutput = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

let graphPromise: ReturnType<typeof loadIdeologyGraphFromFile> | null = null;

function getIdeologyGraph() {
  graphPromise ??= loadIdeologyGraphFromFile();
  return graphPromise;
}

function applyOutputOptions(
  reflection: IdeologyContextReflectionV1,
  options: HelixAskZenGraphReflectionToolInput["options"] | undefined,
): IdeologyContextReflectionV1 {
  const includeOverlay = options?.includeOverlay !== false;
  const includeRecommendedActions = options?.includeRecommendedActions !== false;
  const withRecommendedActions = includeRecommendedActions ? reflection : { ...reflection, recommended_actions: [] };
  if (includeOverlay) return withRecommendedActions;
  const { overlay: _overlay, ...withoutOverlay } = withRecommendedActions;
  return withoutOverlay;
}

export async function runHelixAskZenGraphReflectionTool(
  input: HelixAskZenGraphReflectionToolInput,
): Promise<HelixAskZenGraphReflectionToolOutput> {
  const graph = await getIdeologyGraph();
  const rawReflection = reflectIdeologyContext(graph, {
    kind: input.inputKind,
    text: input.text,
    refs: input.refs,
  });
  const reflection = applyOutputOptions(rawReflection, input.options);
  const admissions =
    input.options?.includeAdmissionArtifacts === false
      ? []
      : [mapIdeologyReflectionToRecommendedActionAdmission(reflection)];

  return { reflection, admissions };
}

export const zenGraphReflectionSpec: ToolSpecShape = {
  name: HELIX_ASK_ZEN_GRAPH_REFLECTION_TOOL_NAME,
  desc: "Deterministic ZenGraph ideology reflection for evidence-only lenses, missing checks, and recommended next steps. Never final authority or execution permission.",
  inputSchema: {
    type: "object",
    properties: {
      inputKind: { type: "string", enum: [...inputKinds] },
      text: { type: "string" },
      refs: { type: "array", items: { type: "string" } },
      options: {
        type: "object",
        properties: {
          includeOverlay: { type: "boolean" },
          includeRecommendedActions: { type: "boolean" },
          includeAdmissionArtifacts: { type: "boolean" },
        },
      },
    },
    required: ["text"],
  },
  outputSchema: {
    type: "object",
    properties: {
      reflection: { type: "object" },
      admissions: { type: "array", items: { type: "object" } },
    },
    required: ["reflection", "admissions"],
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

export const zenGraphReflectionHandler: ToolHandler = async (input: unknown) => {
  const parsed = ZenGraphToolInputSchema.parse(input);
  const text = parsed.text ?? parsed.prompt ?? parsed.question;
  if (!text || text.trim().length === 0) {
    throw new Error("zen_graph_reflection_text_required");
  }

  return runHelixAskZenGraphReflectionTool({
    inputKind: parsed.inputKind,
    text,
    refs: parsed.refs,
    options: parsed.options,
  });
};
