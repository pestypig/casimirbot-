import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const PREBOUNDARY_BIOENERGETICS_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const literatureRef = (id: string, path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  path,
  note: note ?? null,
});

const payload = (args: {
  id: string;
  expression: string;
  displayLatex: string;
  targetVariable: string;
}): TheoryBadgeV1["calculatorPayloads"][number] => ({
  id: args.id,
  expression: args.expression,
  displayLatex: args.displayLatex,
  preferredAction: "solve_with_steps",
  targetVariable: args.targetVariable,
  setupContext: null,
});

const preboundaryBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: PREBOUNDARY_BIOENERGETICS_BOUNDARY,
});

export const PREBOUNDARY_BIOENERGETICS_THEORY_BADGES: TheoryBadgeV1[] = [
  preboundaryBadge({
    id: "bio.preboundary.energy_entropy_gradient",
    title: "Gradient Before Boundary",
    plainMeaning:
      "Represents an energy or entropy contrast as a condition that can drive persistence before a living boundary exists.",
    whyItMatters:
      "It gives the map a pre-organism starting point: directed dissipation can precede compartments, sensing, maintenance, and obligation language.",
    subjects: ["biology", "preboundary", "bioenergetics", "entropy_gradient", "nonequilibrium"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    equationFamilies: ["thermal_contrast", "entropy_gradient_context"],
    tags: ["preboundary", "calculator_loadable", "condition_before_boundary"],
    equations: [
      {
        id: "thermal_contrast_proxy",
        role: "calculator_demo",
        displayLatex: "\\Delta T=T_{hot}-T_{cold}",
        computableExpression: "Delta_T = T_hot - T_cold",
        operatorKind: "scalar_expression",
        inputSymbols: ["T_hot", "T_cold"],
        outputSymbols: ["Delta_T"],
      },
    ],
    units: [
      { symbol: "T_hot", unit: "K", quantity: "hot_reservoir_temperature", dimensionSignature: "Theta" },
      { symbol: "T_cold", unit: "K", quantity: "cold_sink_temperature", dimensionSignature: "Theta" },
      { symbol: "Delta_T", unit: "K", quantity: "temperature_contrast", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Thermal contrast is a placement and context proxy, not a full entropy-production model.",
      "The row does not claim that a gradient alone creates life, agency, or moral obligation.",
    ],
    calculatorPayloads: [
      payload({
        id: "energy_entropy_gradient_payload",
        expression: "Delta_T = T_hot - T_cold",
        displayLatex: "\\Delta T=T_{hot}-T_{cold}",
        targetVariable: "Delta_T",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1007/s10701-018-0162-3",
        "https://link.springer.com/article/10.1007/s10701-018-0162-3",
        "Penrose-related low-entropy environment framing for hot Sun and cold dark sky context.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "preboundary", "bioenergetics", "entropy_gradient", "nonequilibrium"],
      symbols: ["T_hot", "T_cold", "Delta_T"],
      unitSignatures: ["Theta"],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["thermal_contrast", "entropy_gradient_context"],
      simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    },
  }),
  preboundaryBadge({
    id: "bio.preboundary.nonequilibrium_flux",
    title: "Flux Before Action",
    plainMeaning:
      "Represents matter or energy flow through a non-equilibrium setting before interpreting anything as action or agency.",
    whyItMatters:
      "It keeps early-system behavior grounded in flow and dissipation rather than projecting moral or cognitive action backward.",
    subjects: ["biology", "preboundary", "flux", "dissipation", "nonequilibrium"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics"],
    equationFamilies: ["nonequilibrium_flux", "dissipation_context"],
    tags: ["preboundary", "calculator_loadable", "flux_before_action"],
    equations: [
      {
        id: "free_energy_flux_proxy",
        role: "calculator_demo",
        displayLatex: "\\Phi=J\\Delta\\mu",
        computableExpression: "Phi = J * Delta_mu",
        operatorKind: "scalar_expression",
        inputSymbols: ["J", "Delta_mu"],
        outputSymbols: ["Phi"],
      },
    ],
    units: [
      { symbol: "J", unit: null, quantity: "flow_rate_proxy", dimensionSignature: "context" },
      { symbol: "Delta_mu", unit: null, quantity: "chemical_potential_difference_proxy", dimensionSignature: "context" },
      { symbol: "Phi", unit: null, quantity: "flux_power_proxy", dimensionSignature: "context" },
    ],
    assumptions: [
      "Flux is a reduced scalar proxy for graph placement.",
      "Flux language is not agency, intention, obligation, or consciousness language.",
    ],
    calculatorPayloads: [
      payload({
        id: "nonequilibrium_flux_payload",
        expression: "Phi = J * Delta_mu",
        displayLatex: "\\Phi=J\\Delta\\mu",
        targetVariable: "Phi",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1007/s10701-018-0162-3",
        "https://link.springer.com/article/10.1007/s10701-018-0162-3",
        "Low-entropy environmental contrast motivates non-equilibrium flow context.",
      ),
      literatureRef(
        "pii:S0005272899000651",
        "https://www.sciencedirect.com/science/article/pii/S0005272899000651",
        "Microbial growth thermodynamics requires careful heat, Gibbs-energy, and entropy accounting.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "preboundary", "flux", "dissipation", "nonequilibrium"],
      symbols: ["J", "Delta_mu", "Phi"],
      unitSignatures: ["context"],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["nonequilibrium_flux", "dissipation_context"],
      simulationOwners: ["preboundary_bioenergetics"],
    },
  }),
  preboundaryBadge({
    id: "bio.origin.alkaline_vent_proton_gradient",
    title: "Proton Gradient Before Cell Boundary",
    plainMeaning:
      "Represents alkaline hydrothermal vent proton-gradient context before modern cellular membranes or metabolism.",
    whyItMatters:
      "It makes a concrete origin-of-life pathway visible: a natural gradient can be supplied by environment and geology before full cells exist.",
    subjects: ["biology", "origin_of_life", "alkaline_vent", "proton_gradient", "prebiotic_chemistry"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    equationFamilies: ["proton_gradient", "ph_gradient_context"],
    tags: ["origin_of_life", "calculator_loadable", "proton_gradient"],
    equations: [
      {
        id: "vent_delta_ph_proxy",
        role: "calculator_demo",
        displayLatex: "\\Delta pH=pH_{alkaline}-pH_{ocean}",
        computableExpression: "delta_pH = pH_alkaline - pH_ocean",
        operatorKind: "scalar_expression",
        inputSymbols: ["pH_alkaline", "pH_ocean"],
        outputSymbols: ["delta_pH"],
      },
    ],
    units: [
      { symbol: "pH_alkaline", unit: null, quantity: "alkaline_phase_pH", dimensionSignature: "1" },
      { symbol: "pH_ocean", unit: null, quantity: "ocean_phase_pH", dimensionSignature: "1" },
      { symbol: "delta_pH", unit: null, quantity: "ph_contrast", dimensionSignature: "1" },
    ],
    assumptions: [
      "Natural proton-gradient context is origin-of-life scaffolding, not a solved abiogenesis pathway.",
      "The row does not require modern lipid cell boundaries to already exist.",
    ],
    calculatorPayloads: [
      payload({
        id: "alkaline_vent_delta_ph_payload",
        expression: "delta_pH = pH_alkaline - pH_ocean",
        displayLatex: "\\Delta pH=pH_{alkaline}-pH_{ocean}",
        targetVariable: "delta_pH",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1007/s00239-014-9658-4",
        "https://link.springer.com/article/10.1007/s00239-014-9658-4",
        "Alkaline hydrothermal vent reactors model natural proton gradients, H2/CO2 supply, and mineral context.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "origin_of_life", "alkaline_vent", "proton_gradient", "prebiotic_chemistry"],
      symbols: ["pH_alkaline", "pH_ocean", "delta_pH"],
      unitSignatures: ["1"],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["proton_gradient", "ph_gradient_context"],
      simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    },
  }),
  preboundaryBadge({
    id: "bio.origin.inorganic_compartment_barrier",
    title: "Compartment Before Organism",
    plainMeaning:
      "Represents pores, mineral barriers, vesicles, or membranes as inside/outside structure before a full organism exists.",
    whyItMatters:
      "It places boundary language downstream of the pre-boundary gradient while still allowing compartment structure before organism language.",
    subjects: ["biology", "origin_of_life", "compartment", "mineral_barrier", "boundary"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    equationFamilies: ["compartment_boundary_context", "inside_outside_difference"],
    tags: ["origin_of_life", "boundary_before_organism", "noncomputable_reference"],
    equations: [
      {
        id: "inside_outside_boundary_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{boundary}_{context}=\\mathrm{separation}(inside,outside)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["inside_context", "outside_context"],
        outputSymbols: ["boundary_context"],
      },
    ],
    units: [],
    assumptions: [
      "Compartment structure may be inorganic or protocellular.",
      "A compartment is not yet an organism, obligation boundary, or consciousness substrate.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "doi:10.1007/s00239-014-9658-4",
        "https://link.springer.com/article/10.1007/s00239-014-9658-4",
        "Alkaline vent models include thin inorganic barriers and mineral pore contexts.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "origin_of_life", "compartment", "mineral_barrier", "boundary"],
      symbols: ["inside_context", "outside_context", "boundary_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["compartment_boundary_context", "inside_outside_difference"],
      simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    },
  }),
  preboundaryBadge({
    id: "bio.origin.local_concentration_before_replication",
    title: "Concentration Before Replication",
    plainMeaning:
      "Represents local concentration of useful molecules before heredity, complex sensing, or full replication cycles.",
    whyItMatters:
      "It fills the gap between available chemistry and repeatable life-like systems by tracking whether ingredients can become locally dense enough to matter.",
    subjects: ["biology", "origin_of_life", "concentration", "replication", "prebiotic_chemistry"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    equationFamilies: ["local_concentration", "prebiotic_inventory_context"],
    tags: ["origin_of_life", "calculator_loadable", "concentration_before_replication"],
    equations: [
      {
        id: "local_concentration_proxy",
        role: "calculator_demo",
        displayLatex: "C_{local}=f_{conc}C_{bulk}",
        computableExpression: "C_local = concentration_factor * C_bulk",
        operatorKind: "scalar_expression",
        inputSymbols: ["concentration_factor", "C_bulk"],
        outputSymbols: ["C_local"],
      },
    ],
    units: [
      { symbol: "C_bulk", unit: null, quantity: "bulk_concentration", dimensionSignature: "context" },
      { symbol: "concentration_factor", unit: null, quantity: "concentration_factor", dimensionSignature: "1" },
      { symbol: "C_local", unit: null, quantity: "local_concentration", dimensionSignature: "context" },
    ],
    assumptions: [
      "Concentration helps structure prebiotic plausibility but does not prove replication.",
      "Replication, heredity, and sensing remain downstream questions.",
    ],
    calculatorPayloads: [
      payload({
        id: "local_concentration_payload",
        expression: "C_local = concentration_factor * C_bulk",
        displayLatex: "C_{local}=f_{conc}C_{bulk}",
        targetVariable: "C_local",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1007/s00239-014-9658-4",
        "https://link.springer.com/article/10.1007/s00239-014-9658-4",
        "Vent-origin models discuss concentration mechanisms before modern cells.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "origin_of_life", "concentration", "replication", "prebiotic_chemistry"],
      symbols: ["C_bulk", "concentration_factor", "C_local"],
      unitSignatures: ["context", "1"],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["local_concentration", "prebiotic_inventory_context"],
      simulationOwners: ["preboundary_bioenergetics", "astrochemistry_prebiotic"],
    },
  }),
  preboundaryBadge({
    id: "bio.thermo.microbial_growth_entropy_boundary",
    title: "Microbial Growth Is Not Simple Negative Entropy",
    plainMeaning:
      "Keeps biological thermodynamics framed through heat, Gibbs energy, entropy production, maintenance, and growth rather than a loose negative-entropy slogan.",
    whyItMatters:
      "It blocks the map from treating thermodynamic language as a one-line explanation of life or obligation.",
    subjects: ["biology", "thermodynamics", "microbial_growth", "entropy", "claim_boundary"],
    level: "claim_boundary",
    status: "diagnostic",
    simulationOwners: ["preboundary_bioenergetics"],
    equationFamilies: ["growth_thermodynamics_boundary", "entropy_accounting"],
    tags: ["claim_boundary", "negative_entropy_boundary", "noncomputable_reference"],
    equations: [
      {
        id: "growth_entropy_accounting_boundary",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{growth}_{thermo}=\\mathrm{account}(Q,\\Delta G,S_{prod},maintenance)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Q", "Delta_G", "S_prod", "maintenance"],
        outputSymbols: ["growth_thermodynamic_context"],
      },
    ],
    units: [],
    assumptions: [
      "Negative-entropy language is historical shorthand and not the formal badge definition.",
      "Growth thermodynamics is diagnostic context and does not validate a biological mechanism by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "pii:S0005272899000651",
        "https://www.sciencedirect.com/science/article/pii/S0005272899000651",
        "Thermodynamic analysis of microbial growth treats entropy production, heat, Gibbs energy, and maintenance carefully.",
      ),
      literatureRef(
        "pmid:10482783",
        "https://pubmed.ncbi.nlm.nih.gov/10482783/",
        "PubMed record for von Stockar and Liu microbial-growth thermodynamics.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "thermodynamics", "microbial_growth", "entropy", "claim_boundary"],
      symbols: ["Q", "Delta_G", "S_prod", "maintenance", "growth_thermodynamic_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["growth_thermodynamics_boundary", "entropy_accounting"],
      simulationOwners: ["preboundary_bioenergetics"],
    },
  }),
  preboundaryBadge({
    id: "bio.consciousness.orch_or_frontier_context",
    title: "Orch OR Frontier Consciousness Context",
    plainMeaning:
      "Places Orch OR as a bounded frontier consciousness mechanism that requires biological substrate context before it is relevant.",
    whyItMatters:
      "It keeps Hameroff/Penrose available for later reasoning while preventing it from becoming the root of the living-system map.",
    subjects: ["biology", "consciousness", "orch_or", "microtubule", "claim_boundary"],
    level: "claim_boundary",
    status: "review",
    simulationOwners: ["orch_or_coherence", "preboundary_bioenergetics"],
    equationFamilies: ["orch_or_context_boundary", "microtubule_substrate_context"],
    tags: ["claim_boundary", "frontier_context", "noncomputable_reference"],
    equations: [
      {
        id: "orch_or_substrate_boundary",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{OrchOR}_{context}\\Rightarrow\\mathrm{microtubule\\ substrate\\ required}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["microtubule_substrate_context", "coherence_evidence_context"],
        outputSymbols: ["orch_or_frontier_context"],
      },
    ],
    units: [],
    assumptions: [
      "Orch OR is not a first root for life, bioenergetics, or obligation.",
      "A consciousness mechanism claim requires evidence beyond prebiotic gradients, compartments, or concentration.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "pmid:24070914",
        "https://pubmed.ncbi.nlm.nih.gov/24070914/",
        "Hameroff and Penrose Orch OR review context; treated here as frontier and bounded, not foundational.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "consciousness", "orch_or", "microtubule", "claim_boundary"],
      symbols: ["microtubule_substrate_context", "coherence_evidence_context", "orch_or_frontier_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/preboundary-bioenergetics-theory-badges.ts"],
      equationFamilies: ["orch_or_context_boundary", "microtubule_substrate_context"],
      simulationOwners: ["orch_or_coherence", "preboundary_bioenergetics"],
    },
  }),
];

export const PREBOUNDARY_BIOENERGETICS_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "bio_energy_entropy_gradient_enables_nonequilibrium_flux",
    from: "bio.preboundary.energy_entropy_gradient",
    to: "bio.preboundary.nonequilibrium_flux",
    relation: "requires",
    label: "Non-equilibrium flux interpretation requires an energy or entropy contrast.",
    claimBoundaryNote: "Flux is not action, agency, or obligation.",
  },
  {
    id: "bio_nonequilibrium_flux_documents_alkaline_vent_gradient",
    from: "bio.preboundary.nonequilibrium_flux",
    to: "bio.origin.alkaline_vent_proton_gradient",
    relation: "documents",
    label: "Alkaline vent proton gradients are one concrete origin-of-life flux context.",
    claimBoundaryNote: "Vent context is not a solved abiogenesis proof.",
  },
  {
    id: "bio_alkaline_gradient_requires_compartment_barrier",
    from: "bio.origin.alkaline_vent_proton_gradient",
    to: "bio.origin.inorganic_compartment_barrier",
    relation: "requires",
    label: "A proton-gradient interpretation requires separated phases or barriers.",
    claimBoundaryNote: "A barrier is not yet a modern organism.",
  },
  {
    id: "bio_compartment_enables_local_concentration",
    from: "bio.origin.inorganic_compartment_barrier",
    to: "bio.origin.local_concentration_before_replication",
    relation: "documents",
    label: "Compartment structure can support local concentration before replication.",
    claimBoundaryNote: "Concentration context does not prove heredity or life.",
  },
  {
    id: "bio_local_concentration_bounds_rna_world_context",
    from: "bio.origin.local_concentration_before_replication",
    to: "prebiotic.rna_world.ribozyme_context",
    relation: "bounds",
    label: "Local concentration context bounds downstream RNA-world interpretation.",
    claimBoundaryNote: "Concentration is plausibility context, not RNA-world validation.",
  },
  {
    id: "bio_growth_entropy_boundary_blocks_negative_entropy_shortcut",
    from: "bio.thermo.microbial_growth_entropy_boundary",
    to: "bio.preboundary.energy_entropy_gradient",
    relation: "blocks",
    label: "Microbial growth thermodynamics blocks treating life as a simple negative-entropy slogan.",
    claimBoundaryNote: "Use heat, Gibbs energy, entropy production, maintenance, and growth context instead.",
  },
  {
    id: "bio_growth_entropy_boundary_bounds_flux_context",
    from: "bio.thermo.microbial_growth_entropy_boundary",
    to: "bio.preboundary.nonequilibrium_flux",
    relation: "bounds",
    label: "Flux language must stay inside careful thermodynamic accounting.",
    claimBoundaryNote: "Flux does not by itself prove life, agency, or obligation.",
  },
  {
    id: "bio_orch_or_frontier_requires_microtubule_context",
    from: "bio.consciousness.orch_or_frontier_context",
    to: "orch_or.microtubule.coherence_window",
    relation: "documents",
    label: "Orch OR belongs downstream in bounded microtubule/coherence context, not at the pre-boundary root.",
    claimBoundaryNote: "This is frontier context only and does not validate consciousness or objective collapse.",
  },
];

export function buildPreboundaryBioenergeticsTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: PREBOUNDARY_BIOENERGETICS_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: PREBOUNDARY_BIOENERGETICS_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
