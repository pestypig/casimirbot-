import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const PREBIOTIC_BRIDGE_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const docRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "doc",
  path,
  id: id ?? null,
  note: note ?? null,
});

const literatureRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
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

const prebioticBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: PREBIOTIC_BRIDGE_BOUNDARY,
});

export const ASTROCHEMISTRY_PREBIOTIC_THEORY_BADGES: TheoryBadgeV1[] = [
  prebioticBadge({
    id: "astrochemistry.aromatic_carbon.interstellar_context",
    title: "Interstellar Aromatic Carbon Context",
    plainMeaning:
      "Represents aromatic carbon chemistry in circumstellar and interstellar environments as astrochemical context.",
    whyItMatters:
      "It anchors prebiotic-organic discussions in stellar carbon enrichment without implying biology, reward, consciousness, or collapse.",
    subjects: ["astrochemistry", "aromatic_carbon", "interstellar", "stellar_carbon"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    equationFamilies: ["astrochemistry_context", "aromatic_carbon_context"],
    tags: ["aromatic_carbon", "stellar_context", "diagnostic_context"],
    equations: [
      {
        id: "aromatic_carbon_context_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{stellar\\ carbon}\\rightarrow\\mathrm{aromatic\\ carbon\\ chemistry}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["stellar_carbon_synthesis"],
        outputSymbols: ["aromatic_carbon_context"],
      },
    ],
    units: [],
    assumptions: [
      "Aromatic-carbon evidence is astrochemical context.",
      "Aromatic carbon does not imply biology, dopamine inheritance, consciousness, or objective collapse.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(
        "docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md",
        "interstellar_aromatic_carbon_chemistry_definition",
      ),
      docRef("docs/knowledge/physics/interstellar-aromatic-carbon-chemistry.md"),
      literatureRef("ESA-ISO-benzene-in-space", "Aromatic ring molecule detection in carbon-rich stellar contexts."),
    ],
    hintKeys: {
      subjects: ["astrochemistry", "aromatic_carbon", "interstellar", "stellar_carbon"],
      symbols: ["aromatic_carbon_context", "stellar_carbon_synthesis"],
      unitSignatures: [],
      repoPaths: [
        "docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md",
        "docs/knowledge/physics/interstellar-aromatic-carbon-chemistry.md",
      ],
      equationFamilies: ["astrochemistry_context", "aromatic_carbon_context"],
      simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    },
  }),
  prebioticBadge({
    id: "astrochemistry.fullerene.c60_stellar_context",
    title: "C60 Stellar/Circumstellar Context",
    plainMeaning:
      "Represents fullerene C60 as a spectral carbon-chemistry context in circumstellar or interstellar environments.",
    whyItMatters:
      "It lets Helix discuss buckyballs observed in stellar or circumstellar light without turning that observation into a life, consciousness, or collapse claim.",
    subjects: ["astrochemistry", "fullerene", "c60", "spectroscopy", "stellar_carbon"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["spectral_observable", "planck_relation", "astrochemistry_context"],
    tags: ["fullerene", "buckyball", "stellar_context", "calculator_loadable"],
    equations: [
      {
        id: "c60_feature_frequency",
        role: "calculator_demo",
        displayLatex: "f_{C60}=c/\\lambda_{C60}",
        computableExpression: "f_C60_Hz = c/lambda_C60_m",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "lambda_C60_m"],
        outputSymbols: ["f_C60_Hz"],
      },
      {
        id: "c60_feature_energy",
        role: "calculator_demo",
        displayLatex: "E_{C60}=h f_{C60}",
        computableExpression: "E_C60_J = h*f_C60_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "f_C60_Hz"],
        outputSymbols: ["E_C60_J"],
      },
    ],
    units: [
      { symbol: "lambda_C60_m", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "f_C60_Hz", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "E_C60_J", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "C60 spectral features are astrochemical context.",
      "This badge does not assert that fullerenes caused life, consciousness, or objective collapse.",
    ],
    calculatorPayloads: [
      payload({
        id: "c60_feature_frequency_payload",
        expression: "f_C60_Hz = c/lambda_C60_m",
        displayLatex: "f_{C60}=c/\\lambda_{C60}",
        targetVariable: "f_C60_Hz",
      }),
      payload({
        id: "c60_feature_energy_payload",
        expression: "E_C60_J = h*f_C60_Hz",
        displayLatex: "E_{C60}=h f_{C60}",
        targetVariable: "E_C60_J",
      }),
    ],
    sourceRefs: [
      literatureRef("arXiv:1102.2985", "C60 spectral detections in proto-planetary nebula context."),
      docRef("docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md", "stellar-carbon-entry-point"),
    ],
    hintKeys: {
      subjects: ["astrochemistry", "fullerene", "c60", "spectroscopy", "stellar_carbon"],
      symbols: ["lambda_C60_m", "f_C60_Hz", "E_C60_J", "c", "h"],
      unitSignatures: ["L", "T^-1", "M L^2 T^-2"],
      repoPaths: ["docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md"],
      equationFamilies: ["spectral_observable", "planck_relation", "astrochemistry_context"],
      simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    },
  }),
  prebioticBadge({
    id: "prebiotic.aromatic_ring.coupled_oscillator_context",
    title: "Coupled Aromatic-Ring Oscillator Context",
    plainMeaning:
      "Represents two or more aromatic rings as a speculative coupled-oscillator context for prebiotic molecular-coherence discussions.",
    whyItMatters:
      "It captures the Hameroff-adjacent claim in mathematically inspectable form while blocking collapse, pleasure, and consciousness promotion.",
    subjects: ["prebiotic", "aromatic_ring", "coupled_oscillator", "coherence"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["astrochemistry_prebiotic"],
    equationFamilies: ["coupled_oscillator", "coherence_window", "claim_boundary"],
    tags: ["exploratory_bridge", "calculator_loadable", "hameroff_quote_context"],
    equations: [
      {
        id: "ring_frequency_detuning",
        role: "calculator_demo",
        displayLatex: "\\Delta\\omega=|\\omega_1-\\omega_2|",
        computableExpression: "delta_omega_rad_s = abs(omega_1_rad_s - omega_2_rad_s)",
        operatorKind: "scalar_expression",
        inputSymbols: ["omega_1_rad_s", "omega_2_rad_s"],
        outputSymbols: ["delta_omega_rad_s"],
      },
      {
        id: "ring_coupling_gate",
        role: "gate",
        displayLatex: "K_{12}>\\Delta\\omega \\;\\land\\; N_{rings}\\ge 2",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["K_12_rad_s", "delta_omega_rad_s", "N_rings"],
        outputSymbols: ["ring_coupling_gate_status"],
      },
    ],
    units: [
      { symbol: "omega_1_rad_s", unit: "rad/s", quantity: "angular_frequency", dimensionSignature: "T^-1" },
      { symbol: "omega_2_rad_s", unit: "rad/s", quantity: "angular_frequency", dimensionSignature: "T^-1" },
      { symbol: "delta_omega_rad_s", unit: "rad/s", quantity: "detuning", dimensionSignature: "T^-1" },
      { symbol: "K_12_rad_s", unit: "rad/s", quantity: "coupling_rate", dimensionSignature: "T^-1" },
      { symbol: "N_rings", unit: null, quantity: "ring_count", dimensionSignature: "1" },
    ],
    assumptions: [
      "At least two oscillatory units are required for coupling language.",
      "Coupled aromatic oscillators are molecular-coherence context only.",
      "This does not validate OR, consciousness, pleasure optimization, or wavefunction-collapse biology.",
    ],
    calculatorPayloads: [
      payload({
        id: "ring_frequency_detuning_payload",
        expression: "delta_omega_rad_s = abs(omega_1_rad_s - omega_2_rad_s)",
        displayLatex: "\\Delta\\omega=|\\omega_1-\\omega_2|",
        targetVariable: "delta_omega_rad_s",
      }),
    ],
    sourceRefs: [
      docRef("docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md", "claim-context"),
      docRef("docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json", "prebiotic-organic-inventory"),
    ],
    hintKeys: {
      subjects: ["prebiotic", "aromatic_ring", "coupled_oscillator", "coherence"],
      symbols: ["omega_1_rad_s", "omega_2_rad_s", "delta_omega_rad_s", "K_12_rad_s", "N_rings"],
      unitSignatures: ["T^-1", "1"],
      repoPaths: [
        "docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md",
        "docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json",
      ],
      equationFamilies: ["coupled_oscillator", "coherence_window", "claim_boundary"],
      simulationOwners: ["astrochemistry_prebiotic"],
    },
  }),
  prebioticBadge({
    id: "prebiotic.rna_world.ribozyme_context",
    title: "RNA-World Ribozyme Context",
    plainMeaning:
      "Represents RNA catalytic function as origin-of-life context separate from aromatic-ring origin hypotheses.",
    whyItMatters:
      "It keeps RNA-world support retrievable without using RNA catalysis as validation of Hameroff-style aromatic-ring or Orch-OR claims.",
    subjects: ["prebiotic", "rna_world", "ribozyme", "origin_of_life"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic"],
    equationFamilies: ["rna_world_context", "origin_of_life_context"],
    tags: ["rna_world", "ribozyme", "noncomputable_reference"],
    equations: [
      {
        id: "rna_catalytic_context_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{RNA\\ catalysis}\\neq\\mathrm{Orch\\text{-}OR\\ validation}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["rna_catalysis_evidence"],
        outputSymbols: ["rna_world_context"],
      },
    ],
    units: [],
    assumptions: [
      "RNA-world context is represented as origin-of-life chemistry context.",
      "RNA catalysis does not validate aromatic-ring OR claims or Orch-OR.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("NobelPrize-1989-RNA-catalysis", "Catalytic properties of RNA reference."),
      docRef("docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md", "recommended-tree-split"),
    ],
    hintKeys: {
      subjects: ["prebiotic", "rna_world", "ribozyme", "origin_of_life"],
      symbols: ["rna_world_context", "rna_catalysis_evidence"],
      unitSignatures: [],
      repoPaths: ["docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md"],
      equationFamilies: ["rna_world_context", "origin_of_life_context"],
      simulationOwners: ["astrochemistry_prebiotic"],
    },
  }),
  prebioticBadge({
    id: "biophysics.membrane.open_system_entropy_flow",
    title: "Membrane Open-System Entropy Flow",
    plainMeaning:
      "Represents membrane-bounded chemistry as open-system entropy production and entropy-flow context.",
    whyItMatters:
      "It gives synchrony and membrane language a thermodynamic footing without encoding will, pleasure, or teleology as a law.",
    subjects: ["biophysics", "membrane", "open_system", "entropy", "non_equilibrium"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic"],
    equationFamilies: ["open_system_entropy", "membrane_transport_context"],
    tags: ["entropy", "membrane", "open_system", "calculator_loadable"],
    equations: [
      {
        id: "open_system_entropy_balance",
        role: "law",
        displayLatex: "\\frac{dS_{sys}}{dt}=\\sigma+\\Phi",
        computableExpression: "dS_system_dt = sigma_entropy_production + Phi_entropy_flow",
        operatorKind: "scalar_expression",
        inputSymbols: ["sigma_entropy_production", "Phi_entropy_flow"],
        outputSymbols: ["dS_system_dt"],
      },
      {
        id: "entropy_production_nonnegative",
        role: "constraint",
        displayLatex: "\\sigma\\ge 0",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["sigma_entropy_production"],
        outputSymbols: ["entropy_production_gate_status"],
      },
    ],
    units: [
      { symbol: "dS_system_dt", unit: "J/K/s", quantity: "entropy_rate", dimensionSignature: "M L^2 T^-3 Theta^-1" },
      {
        symbol: "sigma_entropy_production",
        unit: "J/K/s",
        quantity: "entropy_production_rate",
        dimensionSignature: "M L^2 T^-3 Theta^-1",
      },
      {
        symbol: "Phi_entropy_flow",
        unit: "J/K/s",
        quantity: "entropy_flow_rate",
        dimensionSignature: "M L^2 T^-3 Theta^-1",
      },
    ],
    assumptions: [
      "Membranes regulate matter, energy, charge, and chemical-potential gradients.",
      "Local order may be maintained by exporting entropy.",
      "This row does not encode will, pleasure optimization, or consciousness.",
    ],
    calculatorPayloads: [
      payload({
        id: "open_system_entropy_balance_payload",
        expression: "dS_system_dt = sigma_entropy_production + Phi_entropy_flow",
        displayLatex: "\\frac{dS_{sys}}{dt}=\\sigma+\\Phi",
        targetVariable: "dS_system_dt",
      }),
    ],
    sourceRefs: [
      docRef("docs/knowledge/physics/physics-thermodynamics-entropy-tree.json", "open-system entropy context"),
      docRef("docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md", "maturity-policy"),
    ],
    hintKeys: {
      subjects: ["biophysics", "membrane", "open_system", "entropy", "non_equilibrium"],
      symbols: ["dS_system_dt", "sigma_entropy_production", "Phi_entropy_flow"],
      unitSignatures: ["M L^2 T^-3 Theta^-1"],
      repoPaths: [
        "docs/knowledge/physics/physics-thermodynamics-entropy-tree.json",
        "docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md",
      ],
      equationFamilies: ["open_system_entropy", "membrane_transport_context"],
      simulationOwners: ["astrochemistry_prebiotic"],
    },
  }),
  prebioticBadge({
    id: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    title: "Prebiotic Consciousness Bridge Boundary",
    plainMeaning:
      "Blocks prebiotic chemistry, molecular oscillator, RNA, membrane, and stellar-carbon rows from promoting into consciousness or objective-collapse claims.",
    whyItMatters:
      "It keeps the astrochemistry bridge adjacent to Orch-OR without treating adjacency as evidence.",
    subjects: ["astrochemistry_prebiotic", "claim_boundary", "orch_or", "consciousness", "objective_collapse"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["astrochemistry_prebiotic", "orch_or_coherence"],
    equationFamilies: ["prebiotic_claim_boundary", "orch_or_claim_boundary"],
    tags: ["claim_boundary", "exploratory_only", "blocks_promotion"],
    equations: [
      {
        id: "prebiotic_bridge_boundary_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{prebiotic\\ coherence\\ context}\\nRightarrow\\mathrm{consciousness\\ validation}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [],
        outputSymbols: ["prebiotic_consciousness_claim_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "Coupled aromatic oscillators may be represented as exploratory open-system molecular-coherence context.",
      "This does not validate OR, consciousness, pleasure optimization, or wavefunction-collapse biology.",
      "No row in this lane validates NHM2, objective collapse, Orch-OR, or a physical consciousness mechanism.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef("docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md", "falsifier-requirements"),
      docRef("docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json", "orch_or_requires_direct_measurement_contract"),
    ],
    hintKeys: {
      subjects: ["astrochemistry_prebiotic", "claim_boundary", "orch_or", "consciousness", "objective_collapse"],
      symbols: ["prebiotic_consciousness_claim_boundary"],
      unitSignatures: [],
      repoPaths: [
        "docs/architecture/astrochemistry-prebiotic-neuro-consciousness-bridge-plan.md",
        "docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json",
      ],
      equationFamilies: ["prebiotic_claim_boundary", "orch_or_claim_boundary"],
      simulationOwners: ["astrochemistry_prebiotic", "orch_or_coherence"],
    },
  }),
];

export const ASTROCHEMISTRY_PREBIOTIC_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "stellar_nucleosynthesis_documents_aromatic_carbon",
    from: "stellar.nucleosynthesis.reaction_network_context",
    to: "astrochemistry.aromatic_carbon.interstellar_context",
    relation: "documents",
    label: "Stellar nucleosynthesis provides the carbon-enrichment context for aromatic astrochemistry.",
    claimBoundaryNote: "Stellar carbon context does not imply prebiotic success or consciousness.",
  },
  {
    id: "aromatic_carbon_documents_c60_fullerene",
    from: "astrochemistry.aromatic_carbon.interstellar_context",
    to: "astrochemistry.fullerene.c60_stellar_context",
    relation: "documents",
    label: "Aromatic carbon context documents fullerene C60 spectral chemistry.",
    claimBoundaryNote: "C60 spectral context is not evidence for life, consciousness, or objective collapse.",
  },
  {
    id: "aromatic_carbon_documents_coupled_ring_context",
    from: "astrochemistry.aromatic_carbon.interstellar_context",
    to: "prebiotic.aromatic_ring.coupled_oscillator_context",
    relation: "documents",
    label: "Aromatic carbon chemistry can document speculative coupled-ring oscillator context.",
    claimBoundaryNote: "Molecular coupling is not OR evidence.",
  },
  {
    id: "coupled_ring_documents_membrane_entropy_context",
    from: "prebiotic.aromatic_ring.coupled_oscillator_context",
    to: "biophysics.membrane.open_system_entropy_flow",
    relation: "documents",
    label: "Coupled molecular context can be discussed alongside membrane-bounded open-system entropy flow.",
    claimBoundaryNote: "Open-system entropy flow is not a pleasure or consciousness law.",
  },
  {
    id: "membrane_entropy_bounds_rna_world_context",
    from: "biophysics.membrane.open_system_entropy_flow",
    to: "prebiotic.rna_world.ribozyme_context",
    relation: "bounds",
    label: "Open-system thermodynamic boundaries constrain origin-of-life chemistry context.",
    claimBoundaryNote: "RNA-world context is separate from Hameroff-style aromatic-ring claims.",
  },
  {
    id: "coupled_ring_blocks_prebiotic_consciousness_promotion",
    from: "prebiotic.aromatic_ring.coupled_oscillator_context",
    to: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    relation: "blocks",
    label: "Coupled aromatic oscillators cannot promote into consciousness or objective-collapse validation.",
    claimBoundaryNote: "Requires direct OR-specific evidence and remains exploratory.",
  },
  {
    id: "rna_world_blocks_prebiotic_consciousness_promotion",
    from: "prebiotic.rna_world.ribozyme_context",
    to: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    relation: "blocks",
    label: "RNA catalytic context cannot promote into Orch-OR or consciousness validation.",
    claimBoundaryNote: "RNA-world evidence is origin-of-life context, not consciousness evidence.",
  },
  {
    id: "prebiotic_boundary_documents_orch_or_boundary",
    from: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    to: "orch_or.claim_boundary.exploratory_only",
    relation: "documents",
    label: "The prebiotic bridge boundary points to the broader Orch-OR exploratory boundary.",
    claimBoundaryNote: "Adjacency to Orch-OR is boundary context, not proof.",
  },
];

export function buildAstrochemistryPrebioticTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: ASTROCHEMISTRY_PREBIOTIC_THEORY_BADGES.map((badge: TheoryBadgeV1) => ({ ...badge })),
    edges: ASTROCHEMISTRY_PREBIOTIC_THEORY_EDGES.map((edge: TheoryBadgeEdgeV1) => ({ ...edge })),
  };
}
