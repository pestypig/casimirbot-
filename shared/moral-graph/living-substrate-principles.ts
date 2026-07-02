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
    id: "valence-before-preference",
    title: "Valence Before Preference",
    plainMeaning: "Classify a sensed state as viable, costly, attractive, or aversive before naming a preference.",
    whyItMatters:
      "Preference should not appear as a human-only primitive; it emerges after sensing is evaluated against viable-range maintenance.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.sensing_state_discrimination",
      "biophysics.homeostatic_regulation",
    ],
    sourceRefs: [MICROBIAL_THERMODYNAMICS_SOURCE_REF],
    tags: ["valence", "preference", "viability", "cost", "aversive", "attractive", "substrate"],
    hintKeys: ["valence", "preference", "better worse", "costly", "attractive", "aversive", "viable", "preference ranking"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Valence evidence is a procedural viability signal, not proof of human-like preference.",
    ],
  },
  {
    id: "affordance-before-action",
    title: "Affordance Before Action",
    plainMeaning: "Identify possible action openings before treating a response as chosen action.",
    whyItMatters:
      "Action requires more than stimulus; the graph should represent possible moves before it represents selected agency.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.sensing_state_discrimination",
      "biophysics.perturbation_response",
    ],
    sourceRefs: [],
    tags: ["affordance", "action", "possibility", "response", "option", "substrate"],
    hintKeys: ["affordance", "possible action", "option", "opening", "available move", "action path", "possible response"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Affordance evidence identifies possible response paths, not deliberate agency by itself.",
    ],
  },
  {
    id: "actuation-before-agency",
    title: "Actuation Before Agency",
    plainMeaning: "Trace the output mechanism that moves or changes the system before naming agency.",
    whyItMatters:
      "Agency should be derived from sensing, response, and actuation rather than being inserted as an unexplained label.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.perturbation_response",
      "biophysics.homeostatic_regulation",
    ],
    sourceRefs: [],
    tags: ["actuation", "agency", "output", "movement", "response", "substrate"],
    hintKeys: ["actuation", "agency", "move", "output", "motor", "response output", "change the system"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Actuation is not yet moral agency; it is the response-output layer a later agency claim must pass through.",
    ],
  },
  {
    id: "feedback-before-learning",
    title: "Feedback Before Learning",
    plainMeaning: "Track whether action output changes later sensing or response before claiming learning.",
    whyItMatters:
      "Learning is a loop property; it should be built from feedback rather than inferred from one observed response.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.perturbation_response",
      "biophysics.homeostatic_regulation",
    ],
    sourceRefs: [],
    tags: ["feedback", "learning", "loop", "adaptation", "response", "substrate"],
    hintKeys: ["feedback", "learning", "loop", "adapt", "update", "reinforce", "correction", "feedback loop"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Feedback evidence supports a learning hypothesis only when the loop changes later response.",
    ],
  },
  {
    id: "memory-before-commitment",
    title: "Memory Before Commitment",
    plainMeaning: "Require persistence across time before naming commitment, stable preference, or vow-like behavior.",
    whyItMatters:
      "Commitment needs retained state; this badge keeps the graph from treating one-time response as stable volition.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.homeostatic_regulation",
      "frequency.fourier_action_mapping",
    ],
    sourceRefs: [],
    tags: ["memory", "commitment", "persistence", "temporal", "learning", "substrate"],
    hintKeys: ["memory", "commitment", "persistent", "retained", "stable preference", "over time", "history"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Memory here means retained procedural state, not a claim of autobiographical human memory.",
    ],
  },
  {
    id: "prediction-before-planning",
    title: "Prediction Before Planning",
    plainMeaning: "Represent anticipated future state before calling a sequence a plan.",
    whyItMatters:
      "Planning should be derived from prediction over possible action outcomes, not collapsed into any complex response.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.sensing_state_discrimination",
      "frequency.fourier_action_mapping",
    ],
    sourceRefs: [],
    tags: ["prediction", "planning", "anticipation", "future_state", "sequence", "substrate"],
    hintKeys: ["prediction", "planning", "anticipate", "future state", "forecast", "plan", "sequence"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Prediction/planning labels remain procedural unless stronger evidence supports conscious deliberation.",
    ],
  },
  {
    id: "choice-before-mandate",
    title: "Choice Before Mandate",
    plainMeaning: "Show selection among viable action paths before a rule, duty, or mandate is introduced.",
    whyItMatters:
      "Mandates are late procedural constraints; the graph should first show how available actions become selected.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "biophysics.perturbation_response",
      "evolution.single_cell_to_multicellular_coordination",
    ],
    sourceRefs: [],
    tags: ["choice", "selection", "mandate", "action_selection", "volition", "substrate"],
    hintKeys: ["choice", "select", "selection", "choose", "action selection", "volition", "before mandate"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Choice evidence in this graph is action-selection structure, not proof of free will or personhood.",
    ],
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
    id: "communication-before-norm",
    title: "Communication Before Norm",
    plainMeaning: "Trace signaling between systems before treating a shared pattern as a norm.",
    whyItMatters:
      "Norms require communicative coordination; this prevents the graph from jumping from individual response to social rule.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "evolution.single_cell_to_multicellular_coordination",
      "biophysics.sensing_state_discrimination",
    ],
    sourceRefs: [],
    tags: ["communication", "signal", "norm", "coordination", "social", "substrate"],
    hintKeys: ["communication", "signal", "signaling", "norm", "shared pattern", "message", "social cue"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Communication evidence does not by itself establish a norm or obligation.",
    ],
  },
  {
    id: "reciprocity-before-law",
    title: "Reciprocity Before Law",
    plainMeaning: "Represent repeated mutual adjustment before treating the pattern as law or institution.",
    whyItMatters:
      "Law is a late institutional layer; repeated reciprocal coordination is the procedural bridge that should come first.",
    maturity: "substrate",
    sourceTheoryBadgeIds: [
      "evolution.single_cell_to_multicellular_coordination",
      "frequency.fourier_action_mapping",
    ],
    sourceRefs: [],
    tags: ["reciprocity", "law", "norm", "institution", "coordination", "substrate"],
    hintKeys: ["reciprocity", "mutual", "law", "institution", "repeated coordination", "norm", "social rule"],
    claimBoundaryNotes: [
      ...COMMON_BOUNDARIES,
      "Reciprocity can support later norms, but it is not itself legal or institutional authority.",
    ],
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
