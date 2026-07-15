import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type { FruitionProcedureExpressionV1 } from "@shared/fruition-procedure-expression";
import type { HelixRecommendedActionAdmissionV1 } from "@shared/contracts/helix-recommended-action-admission.v1";
import type { ProceduralMoralClassificationV1 } from "@shared/procedural-moral-classification";
import type {
  IdeologyContextReflectionInputKindV1,
  IdeologyContextReflectionV1,
} from "@shared/ideology-context-reflection";
import type { MoralBadgeLocatorV1 } from "@shared/moral-badge-locator";
import type { CivicTrustTraversabilityV1 } from "@shared/civic-trust-traversability";
import type { CivicOrderParticipationV1 } from "@shared/civic-order-participation";
import type { CivilizationProvisioningNetworkV1 } from "@shared/civilization-provisioning-network";
import { buildCivicTrustTraversabilityV1 } from "@shared/moral-graph/build-civic-trust-traversability";
import { buildCivicOrderParticipationV1 } from "@shared/civic-order/build-civic-order-participation";
import { buildCivilizationProvisioningNetworkV1 } from "@shared/civilization/build-civilization-provisioning-network";
import { loadIdeologyGraphFromFile } from "@shared/moral-graph/load-ideology-graph";
import { reflectIdeologyContext } from "@shared/moral-graph/reflect-ideology-context";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "@shared/moral-graph/map-ideology-recommendations-to-admission";
import { locateMoralBadges } from "@shared/moral-graph/locate-moral-badges";
import { calculateFruitionFromReflection } from "@shared/moral-graph/calculate-fruition";
import { classifyProceduralMoralContext } from "@shared/moral-graph/classify-procedural-moral-context";

export const HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME = "helix_ask.reflect_ideology_context" as const;

const inputKinds = [
  "user_prompt",
  "workstation_event",
  "document_selection",
  "note",
  "repo_evidence",
  "situation_room_event",
  "voice_event",
] as const;

const MoralGraphToolInputSchema = z.object({
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
      includeLocator: z.boolean().optional(),
      includeFruition: z.boolean().optional(),
      includeProceduralClassification: z.boolean().optional(),
      includeCivicTrustTraversability: z.boolean().optional(),
      includeCivicOrderParticipation: z.boolean().optional(),
      includeCivilizationProvisioning: z.boolean().optional(),
    })
    .optional(),
});

export type HelixAskMoralGraphReflectionToolInput = {
  inputKind: IdeologyContextReflectionInputKindV1;
  text: string;
  refs?: string[];
  options?: {
    includeOverlay?: boolean;
    includeRecommendedActions?: boolean;
    includeAdmissionArtifacts?: boolean;
    includeLocator?: boolean;
    includeFruition?: boolean;
    includeProceduralClassification?: boolean;
    includeCivicTrustTraversability?: boolean;
    includeCivicOrderParticipation?: boolean;
    includeCivilizationProvisioning?: boolean;
  };
};

export type HelixAskMoralGraphReflectionToolOutput = {
  reflection: IdeologyContextReflectionV1;
  proceduralClassification?: ProceduralMoralClassificationV1;
  locator?: MoralBadgeLocatorV1;
  fruition?: FruitionProcedureExpressionV1;
  civicTrustTraversability?: CivicTrustTraversabilityV1;
  civicOrderParticipation?: CivicOrderParticipationV1;
  civilizationProvisioningNetwork?: CivilizationProvisioningNetworkV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

let graphPromise: ReturnType<typeof loadIdeologyGraphFromFile> | null = null;

function getIdeologyGraph() {
  graphPromise ??= loadIdeologyGraphFromFile();
  return graphPromise;
}

function applyOutputOptions(
  reflection: IdeologyContextReflectionV1,
  options: HelixAskMoralGraphReflectionToolInput["options"] | undefined,
): IdeologyContextReflectionV1 {
  const includeOverlay = options?.includeOverlay !== false;
  const includeRecommendedActions = options?.includeRecommendedActions !== false;
  const withRecommendedActions = includeRecommendedActions ? reflection : { ...reflection, recommended_actions: [] };
  if (includeOverlay) return withRecommendedActions;
  const { overlay: _overlay, ...withoutOverlay } = withRecommendedActions;
  return withoutOverlay;
}

export async function runHelixAskMoralGraphReflectionTool(
  input: HelixAskMoralGraphReflectionToolInput,
): Promise<HelixAskMoralGraphReflectionToolOutput> {
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
  const admission = admissions[0] ?? mapIdeologyReflectionToRecommendedActionAdmission(reflection);
  const locator = input.options?.includeLocator === false
    ? undefined
    : locateMoralBadges(graph, {
        kind: input.inputKind,
        text: input.text,
        refs: input.refs,
        reflection,
      });
  const proceduralClassification = input.options?.includeProceduralClassification === false
    ? undefined
    : classifyProceduralMoralContext({
        graph,
        reflection,
        text: input.text,
      });
  const fruition = input.options?.includeFruition
    ? calculateFruitionFromReflection({
        reflection,
        admission,
        objective: reflection.input.summary,
      })
    : undefined;
  const locatedBadgeIds = locator
    ? [...locator.locatedBadges.exact, ...locator.locatedBadges.likely, ...locator.locatedBadges.inferred].map(
        (badge) => badge.nodeId,
      )
    : [];
  const civicTrustTraversability = input.options?.includeCivicTrustTraversability === false
    ? null
    : buildCivicTrustTraversabilityV1({
        text: input.text,
        refs: input.refs,
        activatedBadgeIds: locatedBadgeIds,
      });
  const civicOrderParticipation = input.options?.includeCivicOrderParticipation === false
    ? null
    : buildCivicOrderParticipationV1({
        text: input.text,
        refs: input.refs,
        activatedBadgeIds: locatedBadgeIds,
      });
  const civilizationProvisioningNetwork = input.options?.includeCivilizationProvisioning === false
    ? null
    : buildCivilizationProvisioningNetworkV1({
        text: input.text,
        refs: input.refs,
        moralNodeIds: locatedBadgeIds,
      });

  return {
    reflection,
    ...(proceduralClassification ? { proceduralClassification } : {}),
    ...(locator ? { locator } : {}),
    ...(fruition ? { fruition } : {}),
    ...(civicTrustTraversability ? { civicTrustTraversability } : {}),
    ...(civicOrderParticipation ? { civicOrderParticipation } : {}),
    ...(civilizationProvisioningNetwork ? { civilizationProvisioningNetwork } : {}),
    admissions,
  };
}

export const moralGraphReflectionSpec: ToolSpecShape = {
  name: HELIX_ASK_MORAL_GRAPH_REFLECTION_TOOL_NAME,
  desc: "Deterministic MoralGraph ideology reflection for evidence-only lenses, missing checks, and recommended next steps. Never final authority or execution permission.",
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
          includeLocator: { type: "boolean" },
          includeFruition: { type: "boolean" },
          includeProceduralClassification: { type: "boolean" },
          includeCivicTrustTraversability: { type: "boolean" },
          includeCivicOrderParticipation: { type: "boolean" },
          includeCivilizationProvisioning: { type: "boolean" },
        },
      },
    },
    required: ["text"],
  },
  outputSchema: {
    type: "object",
    properties: {
      reflection: { type: "object" },
      proceduralClassification: { type: "object" },
      locator: { type: "object" },
      fruition: { type: "object" },
      civicTrustTraversability: { type: "object" },
      civicOrderParticipation: { type: "object" },
      civilizationProvisioningNetwork: { type: "object" },
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

export const moralGraphReflectionHandler: ToolHandler = async (input: unknown) => {
  const parsed = MoralGraphToolInputSchema.parse(input);
  const text = parsed.text ?? parsed.prompt ?? parsed.question;
  if (!text || text.trim().length === 0) {
    throw new Error("moral_graph_reflection_text_required");
  }

  return runHelixAskMoralGraphReflectionTool({
    inputKind: parsed.inputKind,
    text,
    refs: parsed.refs,
    options: parsed.options,
  });
};
