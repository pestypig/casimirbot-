import type { MoralLivingSubstrateBadgeV1 } from "../contracts/moral-living-substrate-reflection.v1";

const PENROSE_LOW_ENTROPY_SOURCE_REF = {
  id: "penrose-2018-low-entropy-sun-dark-sky",
  kind: "article",
  title: "The Big Bang and its Dark-Matter Content: Whence, Whither, and Wherefore",
  url: "https://link.springer.com/article/10.1007/s10701-018-0162-3",
  note: "Penrose-linked low-entropy source/sink framing for a hot localized Sun against cold dark sky.",
} as const;

const HYDROTHERMAL_VENT_SOURCE_REF = {
  id: "herschy-2014-origin-life-reactor-alkaline-vents",
  kind: "article",
  title: "An Origin-of-Life Reactor to Simulate Alkaline Hydrothermal Vents",
  url: "https://link.springer.com/article/10.1007/s00239-014-9658-4",
  note: "Alkaline vent proton gradients, inorganic barriers, micropores, and concentration mechanisms before modern cells.",
} as const;

const MICROBIAL_THERMODYNAMICS_SOURCE_REF = {
  id: "von-stockar-liu-1999-microbial-negative-entropy",
  kind: "paper",
  title: "Does microbial life always feed on negative entropy? Thermodynamic analysis of microbial growth",
  url: "https://www.sciencedirect.com/science/article/pii/S0005272899000651",
  note: "Careful microbial thermodynamics framing for entropy production, heat, Gibbs energy dissipation, and maintenance.",
} as const;

const ORCH_OR_FRONTIER_SOURCE_REF = {
  id: "hameroff-penrose-2014-orch-or-review",
  kind: "paper",
  title: "Consciousness in the universe: a review of the 'Orch OR' theory",
  url: "https://pubmed.ncbi.nlm.nih.gov/24070914/",
  note: "Frontier context for Orch-OR; not a Moral Graph proof of consciousness or personhood.",
} as const;

export const MORAL_LIVING_SUBSTRATE_THEORY_BADGE_IDS = [
  "thermodynamics.low_entropy_source_sink",
  "thermodynamics.energy_gradient_flux",
  "prebiotic.inorganic_compartment_gradient",
  "prebiotic.concentration_before_replication",
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
    id: "gradient-before-boundary",
    title: "Gradient Before Boundary",
    plainMeaning: "Identify the energy or entropy contrast that makes persistent organization possible before naming a living boundary.",
    whyItMatters:
      "The Moral Graph should not start with obligation or even organism boundary when the first relevant condition is a source/sink gradient that can support later persistence.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "thermodynamics.low_entropy_source_sink",
      "thermodynamics.energy_gradient_flux",
    ],
    sourceRefs: [PENROSE_LOW_ENTROPY_SOURCE_REF],
    tags: ["gradient", "entropy", "low_entropy", "source_sink", "sun", "dark_sky", "substrate"],
    hintKeys: [
      "gradient",
      "energy gradient",
      "entropy contrast",
      "low entropy",
      "hot sun",
      "dark sky",
      "source sink",
      "temperature difference",
    ],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Thermodynamic source/sink mechanics are Theory Badge Graph evidence, not a Moral Graph proof.",
    ],
  },
  {
    id: "flux-before-action",
    title: "Flux Before Action",
    plainMeaning: "Treat the earliest action-like substrate as matter and energy flow through a non-equilibrium condition.",
    whyItMatters:
      "It keeps Moral Graph from mistaking physical flux for agency while still preserving the procedural origin of possible action.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "thermodynamics.energy_gradient_flux",
      "biophysics.open_system_entropy_flow",
    ],
    sourceRefs: [PENROSE_LOW_ENTROPY_SOURCE_REF, MICROBIAL_THERMODYNAMICS_SOURCE_REF],
    tags: ["flux", "flow", "dissipation", "non_equilibrium", "free_energy", "substrate"],
    hintKeys: ["flux", "flow", "dissipation", "non equilibrium", "free energy", "gibbs", "heat", "matter energy flow"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Flux evidence is not agency evidence; it only supplies possible substrate conditions.",
    ],
  },
  {
    id: "compartment-before-organism",
    title: "Compartment Before Organism",
    plainMeaning: "Recognize pores, vesicles, mineral barriers, or membranes as compartment conditions before assuming a full organism.",
    whyItMatters:
      "Origin-of-life scenarios can create inside/outside structure before modern cellular identity, so boundary reasoning should not overstate organism status.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "prebiotic.inorganic_compartment_gradient",
      "biophysics.organism_environment_boundary",
    ],
    sourceRefs: [HYDROTHERMAL_VENT_SOURCE_REF],
    tags: ["compartment", "vesicle", "micropore", "mineral_barrier", "membrane", "prebiotic", "substrate"],
    hintKeys: ["compartment", "vesicle", "micropore", "mineral barrier", "inorganic barrier", "membrane", "hydrothermal vent", "proton gradient"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Compartment evidence does not by itself prove organism status.",
    ],
  },
  {
    id: "concentration-before-replication",
    title: "Concentration Before Replication",
    plainMeaning: "Track local concentration of useful molecules before treating replication or heredity as present.",
    whyItMatters:
      "Concentration mechanisms can make later replication plausible without letting the graph jump directly to life, agency, or obligation.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "prebiotic.concentration_before_replication",
      "prebiotic.inorganic_compartment_gradient",
    ],
    sourceRefs: [HYDROTHERMAL_VENT_SOURCE_REF],
    tags: ["concentration", "replication", "thermophoresis", "molecule", "prebiotic", "substrate"],
    hintKeys: ["concentration", "concentrate", "thermophoresis", "before replication", "replication", "molecules", "organic molecules"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Concentration evidence is a pre-life condition and cannot settle living or moral status.",
    ],
  },
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
    sourceRefs: [PENROSE_LOW_ENTROPY_SOURCE_REF, MICROBIAL_THERMODYNAMICS_SOURCE_REF],
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
    sourceRefs: [],
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
    sourceRefs: [MICROBIAL_THERMODYNAMICS_SOURCE_REF],
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
    sourceRefs: [MICROBIAL_THERMODYNAMICS_SOURCE_REF],
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
    sourceRefs: [],
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
    sourceRefs: [],
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
    sourceRefs: [ORCH_OR_FRONTIER_SOURCE_REF],
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
