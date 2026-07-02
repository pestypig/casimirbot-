import {
  buildMoralLivingSubstrateReflectionV1,
  type MoralLivingSubstrateReflectionV1,
  type MoralLivingSubstrateRecommendedActionV1,
  type MoralLivingSubstrateSourceRefV1,
} from "../contracts/moral-living-substrate-reflection.v1";
import type { IdeologyContextReflectionInputKindV1 } from "../ideology-context-reflection";
import { matchLivingSubstratePrinciples } from "./match-living-substrate-principles";
import { deriveLivingSubstrateProceduralLayer } from "./living-substrate-procedural-derivations";
import {
  decideMoralGraphAgentInvocationPolicyV1,
  moralGraphPolicyPrefersTheoryFirst,
} from "./moral-graph-agent-invocation-policy";

export type ReflectLivingSubstrateContextInput = {
  prompt: string;
  inputKind?: IdeologyContextReflectionInputKindV1;
  conversationContext?: string | null;
  refs?: string[];
  sourceTheoryBadgeIds?: string[];
  requestedSubstrateBadgeIds?: string[];
  includeTheoryBridge?: boolean;
  includeRecommendedActions?: boolean;
  includeAdmissions?: boolean;
  reflectionId?: string;
  generatedAt?: string;
  limit?: number;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const uniqueSourceRefs = (values: MoralLivingSubstrateSourceRefV1[]): MoralLivingSubstrateSourceRefV1[] => {
  const seen = new Set<string>();
  return values.filter((ref) => {
    if (seen.has(ref.id)) return false;
    seen.add(ref.id);
    return true;
  });
};

const THEORY_OWNED_MECHANISM_BADGE_IDS = [
  "thermodynamics.low_entropy_source_sink",
  "thermodynamics.energy_gradient_flux",
  "prebiotic.inorganic_compartment_gradient",
  "prebiotic.concentration_before_replication",
  "frequency.fourier_action_mapping",
  "consciousness.microtubule_orchestration_frontier",
  "consciousness.objective_reduction_frontier",
  "consciousness.anesthetic_microtubule_perturbation",
] as const;

function buildRecommendedActions(input: {
  prompt: string;
  sourceTheoryBadgeIds: string[];
  includeTheoryBridge: boolean;
}): MoralLivingSubstrateRecommendedActionV1[] {
  const actions: MoralLivingSubstrateRecommendedActionV1[] = [
    {
      actionId: "moral-graph.inspect_living_substrate_badges",
      label: "Inspect living substrate badges",
      panelId: "moral-badge-graph",
      args: { prompt: input.prompt },
      mutatesCalculator: false,
      solves: false,
    },
  ];

  if (input.includeTheoryBridge && input.sourceTheoryBadgeIds.length > 0) {
    actions.push({
      actionId: "theory-badge-graph.reflect_discussion_context",
      label: "Reflect source theory badges",
      panelId: "theory-badge-graph",
      args: {
        prompt: input.prompt,
        source_theory_badge_ids: input.sourceTheoryBadgeIds,
        claim_boundary:
          "Source mechanisms, equations, and physics maturity are Theory Badge Graph-owned; Moral Graph only reflects procedural relevance.",
      },
      mutatesCalculator: false,
      solves: false,
    });
  }

  const theoryOwnedMechanismIds = input.sourceTheoryBadgeIds.filter((id) =>
    THEORY_OWNED_MECHANISM_BADGE_IDS.includes(id as (typeof THEORY_OWNED_MECHANISM_BADGE_IDS)[number]),
  );
  const asksForCalculatorPayload =
    input.sourceTheoryBadgeIds.includes("frequency.fourier_action_mapping") ||
    /\b(?:equations?|numeric|calculate|calculator|fourier|frequency|mechanism|source physics)\b/i.test(input.prompt);
  if (theoryOwnedMechanismIds.length > 0 && asksForCalculatorPayload) {
    actions.push({
      actionId: "theory-badge-graph.load_payloads_to_calculator",
      label: "Load theory calculator payloads",
      panelId: "scientific-calculator",
      args: {
        source_theory_badge_ids: theoryOwnedMechanismIds,
        claim_boundary: "Calculator payloads and numeric mechanisms are theory-owned; Moral Graph does not embed equations.",
      },
      mutatesCalculator: true,
      solves: false,
    });
  }

  return actions;
}

function summaryFor(input: {
  exactCount: number;
  likelyCount: number;
  sourceTheoryBadgeIds: string[];
}): string {
  if (input.exactCount === 0 && input.likelyCount === 0) {
    return "No living-substrate Moral Graph badge matched strongly; keep ordinary Moral Graph reflection or Theory Graph orientation.";
  }
  return `Living-substrate reflection matched ${input.exactCount} exact and ${input.likelyCount} likely substrate badge(s), with ${input.sourceTheoryBadgeIds.length} source theory badge link(s).`;
}

export function reflectLivingSubstrateContext(
  input: ReflectLivingSubstrateContextInput,
): MoralLivingSubstrateReflectionV1 {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("living substrate reflection requires prompt");
  }

  const matches = matchLivingSubstratePrinciples({
    text: [prompt, input.conversationContext ?? ""].filter(Boolean).join("\n"),
    requestedSubstrateBadgeIds: input.requestedSubstrateBadgeIds,
    sourceTheoryBadgeIds: input.sourceTheoryBadgeIds,
    limit: input.limit,
  });
  const sourceTheoryBadgeIds = unique([
    ...(input.sourceTheoryBadgeIds ?? []),
    ...matches.sourceTheoryBadgeIds,
  ]);
  const sourceRefs = uniqueSourceRefs(matches.sourceRefs);
  const claimBoundaryNotes = unique([
    ...matches.claimBoundaryNotes,
    "Moral substrate reflection is diagnostic evidence, not terminal answer authority.",
  ]);
  const proceduralLayer = deriveLivingSubstrateProceduralLayer({
    prompt,
    exactMatches: matches.exactMatches,
    likelyMatches: matches.likelyMatches,
  });
  const recommendedNextActions = input.includeRecommendedActions === false
    ? []
    : buildRecommendedActions({
        prompt,
        sourceTheoryBadgeIds,
        includeTheoryBridge: input.includeTheoryBridge !== false,
      });
  const admissionDecision = input.includeAdmissions
    ? decideMoralGraphAgentInvocationPolicyV1({
        inputKind: input.inputKind ?? "user_prompt",
        text: prompt,
        refs: input.refs,
      })
    : null;

  return buildMoralLivingSubstrateReflectionV1({
    generatedAt: input.generatedAt,
    reflectionId: input.reflectionId,
    graphId: "moral-graph",
    input: {
      kind: input.inputKind ?? "user_prompt",
      prompt,
      conversationContext: input.conversationContext ?? null,
      refs: input.refs ?? [],
      sourceTheoryBadgeIds: input.sourceTheoryBadgeIds ?? [],
      requestedSubstrateBadgeIds: input.requestedSubstrateBadgeIds ?? [],
    },
    exactMatches: matches.exactMatches,
    likelyMatches: matches.likelyMatches,
    proceduralDerivations: proceduralLayer.derivations,
    synthesisPath: proceduralLayer.synthesisPath,
    sourceTheoryBadgeIds,
    sourceRefs,
    claimBoundaryNotes,
    evidenceForAsk: {
      summary: summaryFor({
        exactCount: matches.exactMatches.length,
        likelyCount: matches.likelyMatches.length,
        sourceTheoryBadgeIds,
      }),
      claimBoundaries: claimBoundaryNotes,
      recommendedNextActions,
    },
    admissions: admissionDecision
      ? {
          requested: true,
          toolAdmitted: admissionDecision.eligible,
          theoryFirstRecommended: moralGraphPolicyPrefersTheoryFirst({
            inputKind: input.inputKind ?? "user_prompt",
            text: prompt,
            refs: input.refs,
          }),
          reasonCodes: admissionDecision.reasonCodes,
          blockingReasonCodes: admissionDecision.blockingReasonCodes,
          authority: admissionDecision.authorityBoundary,
        }
      : null,
  });
}
