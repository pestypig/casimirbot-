import type { MoralLivingSubstrateBadgeV1 } from "../contracts/moral-living-substrate-reflection.v1";

export const MORAL_LIVING_SUBSTRATE_THEORY_BADGE_IDS = [
  "biophysics.organism_environment_boundary",
  "biophysics.open_system_entropy_flow",
  "biophysics.sensing_state_discrimination",
  "biophysics.homeostatic_regulation",
  "biophysics.perturbation_response",
  "consciousness.microtubule_orchestration_frontier",
  "consciousness.objective_reduction_frontier",
  "consciousness.anesthetic_microtubule_perturbation",
  "evolution.single_cell_to_multicellular_coordination",
  "frequency.fourier_action_mapping",
] as const;

export type MoralLivingSubstrateTheoryBadgeId = (typeof MORAL_LIVING_SUBSTRATE_THEORY_BADGE_IDS)[number];

const COMMON_BOUNDARIES = [
  "Substrate reflection is evidence-only and cannot produce a final moral verdict.",
  "Living-system substrate matches do not prove human-like consciousness, personhood, or final moral status.",
  "Mechanism, equations, and Fourier/frequency payloads remain owned by the Theory Badge Graph and calculator.",
] as const;

export const MORAL_LIVING_SUBSTRATE_PRINCIPLES: readonly MoralLivingSubstrateBadgeV1[] = [
  {
    id: "boundary-before-obligation",
    title: "Boundary Before Obligation",
    plainMeaning: "Identify the living-system boundary before deriving any duty or care constraint.",
    whyItMatters:
      "A moral procedure should know what system is being maintained, exposed, or perturbed before it names obligations.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.organism_environment_boundary",
      "biophysics.open_system_entropy_flow",
    ],
    tags: ["boundary", "organism", "environment", "entropy", "substrate"],
    hintKeys: ["boundary", "organism environment", "membrane", "inside outside", "entropy gradient"],
    claimBoundaryNotes: [...COMMON_BOUNDARIES],
  },
  {
    id: "sensing-before-judgment",
    title: "Sensing Before Judgment",
    plainMeaning: "Treat sensing as state discrimination before translating a situation into judgment.",
    whyItMatters:
      "This keeps the first procedural move below human-only interpretation and grounded in how organisms detect perturbation.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.sensing_state_discrimination",
      "biophysics.perturbation_response",
    ],
    tags: ["sensing", "state_discrimination", "perturbation", "substrate"],
    hintKeys: ["sensing", "state discrimination", "detect", "perceive", "signal", "stimulus"],
    claimBoundaryNotes: [...COMMON_BOUNDARIES],
  },
  {
    id: "maintenance-before-optimization",
    title: "Maintenance Before Optimization",
    plainMeaning: "Prioritize viable maintenance before asking what action is optimal.",
    whyItMatters:
      "Homeostatic maintenance is a cross-organism primitive that comes before complex social mandates or preference ranking.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.homeostatic_regulation",
      "biophysics.open_system_entropy_flow",
    ],
    tags: ["homeostasis", "maintenance", "viability", "regulation", "substrate"],
    hintKeys: ["homeostasis", "maintain", "viability", "equilibrium", "regulation", "survive"],
    claimBoundaryNotes: [...COMMON_BOUNDARIES],
  },
  {
    id: "perturbation-response-before-verdict",
    title: "Perturbation Response Before Verdict",
    plainMeaning: "Model the perturbation and response path before assigning a moral verdict.",
    whyItMatters:
      "It separates evidence about stress, adaptation, and repair from premature blame or praise.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.perturbation_response",
      "biophysics.sensing_state_discrimination",
    ],
    tags: ["perturbation", "response", "repair", "adaptation", "substrate"],
    hintKeys: ["perturbation", "response", "stress", "repair", "adapt", "damage"],
    claimBoundaryNotes: [...COMMON_BOUNDARIES],
  },
  {
    id: "coordination-before-mandate",
    title: "Coordination Before Mandate",
    plainMeaning: "Trace coordination across cells or agents before treating a mandate as legitimate.",
    whyItMatters:
      "Mandates are late-stage coordination products; this badge keeps the graph from starting at social authority.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "evolution.single_cell_to_multicellular_coordination",
      "biophysics.homeostatic_regulation",
    ],
    tags: ["coordination", "multicellular", "mandate", "priority", "substrate"],
    hintKeys: ["coordination", "multicellular", "mandate", "priority", "collective", "cooperate"],
    claimBoundaryNotes: [...COMMON_BOUNDARIES],
  },
  {
    id: "scale-continuity-from-cell-to-society",
    title: "Scale Continuity From Cell To Society",
    plainMeaning: "Keep continuity visible from single-cell regulation to multicellular and social coordination.",
    whyItMatters:
      "This lets Moral Graph reflect non-human organisms without collapsing every scale into human moral language.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "evolution.single_cell_to_multicellular_coordination",
      "frequency.fourier_action_mapping",
    ],
    tags: ["scale", "single_cell", "multicellular", "society", "coordination", "substrate"],
    hintKeys: ["single cell", "multicellular", "scale", "society", "organisms", "fourier", "action mapping"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Frequency-domain action mapping is a theory/calculator bridge, not a Moral Graph equation.",
    ],
  },
  {
    id: "microtubule-orch-or-frontier-boundary",
    title: "Microtubule Orch-OR Frontier Boundary",
    plainMeaning: "Use microtubule and objective-reduction ideas only as frontier mechanism context.",
    whyItMatters:
      "It allows Hameroff/Penrose-inspired substrate reflection without treating Orch-OR as settled moral evidence.",
    maturity: "frontier",
    sourceTheoryBadgeIds: [
      "consciousness.microtubule_orchestration_frontier",
      "consciousness.objective_reduction_frontier",
      "consciousness.anesthetic_microtubule_perturbation",
    ],
    tags: ["orch_or", "hameroff", "penrose", "microtubule", "anesthetic", "frontier"],
    hintKeys: ["orch or", "hameroff", "penrose", "objective reduction", "microtubule", "anesthetic"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Orch-OR is a frontier lens here, not a required truth condition or proof of consciousness.",
    ],
  },
] as const;

export function getMoralLivingSubstratePrinciple(id: string): MoralLivingSubstrateBadgeV1 | undefined {
  return MORAL_LIVING_SUBSTRATE_PRINCIPLES.find((principle: MoralLivingSubstrateBadgeV1) => principle.id === id);
}
