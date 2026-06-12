import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const PHASE_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const literatureRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  note: note ?? null,
});

const phaseBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: PHASE_BOUNDARY,
});

export const PHASE_OF_MATTER_THEORY_BADGES: TheoryBadgeV1[] = [
  phaseBadge({
    id: "matter.phase.composition_identity_context",
    title: "Composition Identity Across Phases",
    plainMeaning:
      "Represents the rule that an element or molecule can persist across ordinary phase changes while its arrangement changes.",
    whyItMatters:
      "It keeps identity, phase, and structure separate so phase badges do not accidentally become chemical or nuclear reaction claims.",
    subjects: ["matter", "phase", "composition_identity", "chemistry"],
    level: "first_principle",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    equationFamilies: ["composition_identity", "phase_context"],
    tags: ["phase_of_matter", "composition_identity", "claim_boundary"],
    equations: [
      {
        id: "composition_identity_phase_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{identity}=\\mathrm{context}(\\mathrm{composition},\\mathrm{reaction\\ boundary})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["composition", "reaction_boundary"],
        outputSymbols: ["composition_identity_context"],
      },
    ],
    units: [{ symbol: "composition", unit: null, quantity: "chemical_identity", dimensionSignature: "1" }],
    assumptions: [
      "Ordinary phase changes preserve composition identity unless a chemical reaction, ionization, dissociation, isotope change, or nuclear reaction is admitted as separate evidence.",
      "Element-origin badges provide composition context, not a phase, structure, or density solve.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Gibbs 1876 heterogeneous substances", "Classical thermodynamic phase-equilibrium foundation."),
      literatureRef("Atkins physical chemistry phase equilibrium", "Reference chemistry framing for phase and composition identity."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "composition_identity", "chemistry"],
      symbols: ["composition", "reaction_boundary", "composition_identity_context"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["composition_identity", "phase_context"],
      simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    },
  }),
  phaseBadge({
    id: "matter.phase.thermodynamic_state_context",
    title: "Thermodynamic State Phase Context",
    plainMeaning:
      "Represents phase as a condition-dependent state selected by temperature, pressure, composition, and relevant intensive variables.",
    whyItMatters:
      "It lets Helix ask for temperature and pressure conditions before assigning solid, liquid, gas, plasma, supercritical, or mixed-state meaning.",
    subjects: ["matter", "phase", "thermodynamics", "temperature", "pressure"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["thermodynamic_state", "phase_equilibrium"],
    tags: ["phase_of_matter", "temperature", "pressure", "conditioned_state"],
    equations: [
      {
        id: "phase_state_context",
        role: "noncomputable_reference",
        displayLatex: "\\alpha=\\mathrm{phase}(T,P,x_i,\\mu_i,\\mathrm{boundary})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T_K", "P_Pa", "x_i", "mu_i", "phase_boundary"],
        outputSymbols: ["phase_alpha"],
      },
    ],
    units: [
      { symbol: "T_K", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
      { symbol: "P_Pa", unit: "Pa", quantity: "pressure", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "x_i", unit: null, quantity: "composition_fraction", dimensionSignature: "1" },
    ],
    assumptions: [
      "A phase label is condition-dependent and may require an equilibrium model, phase diagram, or measured state table.",
      "Temperature and pressure constrain phase; they do not alone determine molecular structure for every material without composition and boundary context.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Gibbs 1876 heterogeneous substances", "Equilibrium and phase-rule foundation."),
      literatureRef("Callen thermodynamics", "Thermodynamic state variable reference."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "thermodynamics", "temperature", "pressure"],
      symbols: ["T_K", "P_Pa", "x_i", "mu_i", "phase_alpha"],
      unitSignatures: ["Theta", "M L^-1 T^-2", "1"],
      repoPaths: [],
      equationFamilies: ["thermodynamic_state", "phase_equilibrium"],
      simulationOwners: ["general_physics"],
    },
  }),
  phaseBadge({
    id: "matter.phase.equation_of_state_density_context",
    title: "Equation-Of-State Density Context",
    plainMeaning:
      "Represents bulk density as a condition-dependent property from an equation of state, measured table, or simulation receipt.",
    whyItMatters:
      "It blocks the unsafe shortcut from quantum frequency or rest energy directly to phase density without EOS or structural evidence.",
    subjects: ["matter", "phase", "density", "equation_of_state", "thermodynamics"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    equationFamilies: ["equation_of_state", "mass_density", "phase_context"],
    tags: ["density", "equation_of_state", "phase_of_matter", "conditioned_state"],
    equations: [
      {
        id: "phase_density_eos_context",
        role: "noncomputable_reference",
        displayLatex: "\\rho_m=\\mathrm{EOS}(T,P,x_i,\\alpha,\\mathrm{model})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T_K", "P_Pa", "x_i", "phase_alpha", "eos_model"],
        outputSymbols: ["rho_m_kg_m3"],
      },
    ],
    units: [
      { symbol: "rho_m_kg_m3", unit: "kg/m^3", quantity: "mass_density", dimensionSignature: "M L^-3" },
      { symbol: "T_K", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
      { symbol: "P_Pa", unit: "Pa", quantity: "pressure", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "Bulk density is selected by EOS, measured table, or simulation evidence under a declared validity range.",
      "Mass-energy equivalence can map mass density into rest-energy density only after mass density and volume context are established.",
      "Quantum frequency observables do not by themselves determine bulk density or phase.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("doi:10.1063/1.1461829", "Wagner and Pruss IAPWS-95 water thermodynamic formulation."),
      literatureRef("IAPWS R6-95(2018)", "Official IAPWS release for ordinary water substance in fluid phases."),
      literatureRef("NIST Chemistry WebBook SRD 69", "Thermochemical and thermophysical reference data source."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "density", "equation_of_state", "thermodynamics"],
      symbols: ["rho_m_kg_m3", "T_K", "P_Pa", "x_i", "phase_alpha", "eos_model"],
      unitSignatures: ["M L^-3", "Theta", "M L^-1 T^-2", "1"],
      repoPaths: [],
      equationFamilies: ["equation_of_state", "mass_density", "phase_context"],
      simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    },
  }),
  phaseBadge({
    id: "matter.phase.structural_order_context",
    title: "Phase Structural Order Context",
    plainMeaning:
      "Represents molecular or atomic arrangement through lattice, amorphous, radial-distribution, coordination, or ionization descriptors.",
    whyItMatters:
      "It makes the structure change explicit while preserving the distinction between composition identity and phase-conditioned arrangement.",
    subjects: ["matter", "phase", "structure", "condensed_matter", "molecular_structure"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    equationFamilies: ["structural_order", "phase_context"],
    tags: ["structure", "phase_of_matter", "lattice", "radial_distribution", "coordination"],
    equations: [
      {
        id: "structural_order_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{structure}=\\mathrm{context}(g(r),\\mathrm{lattice},N_c,\\chi_e,\\alpha)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["g_r", "lattice", "N_c", "chi_e", "phase_alpha"],
        outputSymbols: ["structure_context"],
      },
    ],
    units: [
      { symbol: "g_r", unit: null, quantity: "radial_distribution_function", dimensionSignature: "1" },
      { symbol: "N_c", unit: null, quantity: "coordination_number", dimensionSignature: "1" },
      { symbol: "chi_e", unit: null, quantity: "ionization_fraction", dimensionSignature: "1" },
    ],
    assumptions: [
      "Structure descriptors are evidence-conditioned and may come from diffraction, scattering, spectroscopy, microscopy, or simulation.",
      "A phase label alone is not a complete molecular-structure description.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Ashcroft Mermin solid state physics", "Condensed-matter structural and lattice reference."),
      literatureRef("Hansen McDonald theory of simple liquids", "Radial-distribution and liquid-structure reference."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "structure", "condensed_matter", "molecular_structure"],
      symbols: ["g_r", "lattice", "N_c", "chi_e", "phase_alpha", "structure_context"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["structural_order", "phase_context"],
      simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    },
  }),
  phaseBadge({
    id: "matter.phase.quantized_mode_frequency_context",
    title: "Quantized Mode Frequency Context",
    plainMeaning:
      "Represents rotational, vibrational, phonon, electronic, spectral-line, or plasma modes as energy-gap observables using Delta E = h nu.",
    whyItMatters:
      "It gives frequency observables a safe quantum bridge while preventing frequency rows from replacing EOS or structure evidence.",
    subjects: ["matter", "phase", "frequency", "spectroscopy", "quantum"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "astrochemistry_prebiotic", "stellar_reference"],
    equationFamilies: ["planck_relation", "spectroscopy", "phase_observable"],
    tags: ["frequency", "spectroscopy", "phonon", "vibrational_mode", "rotational_mode", "claim_boundary"],
    equations: [
      {
        id: "phase_mode_energy_frequency",
        role: "law",
        displayLatex: "\\Delta E=h\\nu",
        computableExpression: "deltaE = h * nu",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "nu_Hz"],
        outputSymbols: ["deltaE_J"],
      },
    ],
    units: [
      { symbol: "nu_Hz", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "deltaE_J", unit: "J", quantity: "transition_energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "Delta E = h nu applies to specific quanta or transition energy gaps, not to bulk phase density by itself.",
      "Observed frequencies require mode assignment, calibration, and environmental broadening context before structural claims are promoted.",
      "Phase-dependent frequency shifts can document structure or environment only when compared against admitted reference evidence.",
    ],
    calculatorPayloads: [
      {
        id: "phase_mode_energy_frequency_payload",
        expression: "deltaE = h * nu",
        displayLatex: "\\Delta E=h\\nu",
        preferredAction: "solve_with_steps",
        targetVariable: "deltaE",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("Planck relation", "Canonical energy-frequency relation."),
      literatureRef("doi:10.1016/j.jqsrt.2021.107949", "HITRAN2020 molecular spectroscopic database."),
      literatureRef("NIST Chemistry WebBook SRD 69", "Reference spectra and thermophysical data source."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "frequency", "spectroscopy", "quantum"],
      symbols: ["h", "nu_Hz", "deltaE_J", "structure_context"],
      unitSignatures: ["T^-1", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["planck_relation", "spectroscopy", "phase_observable"],
      simulationOwners: ["general_physics", "astrochemistry_prebiotic", "stellar_reference"],
    },
  }),
  phaseBadge({
    id: "matter.phase.water_conditioned_state_context",
    title: "Water Conditioned Phase-State Context",
    plainMeaning:
      "Represents H2O phase, density, and structure as conditioned by temperature, pressure, composition, and environment.",
    whyItMatters:
      "It extends the water-origin badge into phase behavior without saying hydrogen and oxygen availability determines water state or density.",
    subjects: ["matter", "phase", "water", "H2O", "density", "structure"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["astrochemistry_prebiotic", "general_physics"],
    equationFamilies: ["water_phase_context", "equation_of_state", "gas_ice_chemistry"],
    tags: ["water", "ice", "liquid", "vapor", "supercritical", "phase_of_matter", "density"],
    equations: [
      {
        id: "water_conditioned_phase_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{H_2O\\ phase}=\\mathrm{context}(T,P,\\rho_m,\\mathrm{structure},\\mathrm{chemistry})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["H2O", "T_K", "P_Pa", "rho_m_kg_m3", "structure_context", "chemistry_context"],
        outputSymbols: ["H2O_phase_context"],
      },
    ],
    units: [
      { symbol: "T_K", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
      { symbol: "P_Pa", unit: "Pa", quantity: "pressure", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "rho_m_kg_m3", unit: "kg/m^3", quantity: "mass_density", dimensionSignature: "M L^-3" },
    ],
    assumptions: [
      "H2O identity can persist across ice, liquid, vapor, and supercritical contexts, but molecular network structure and density change with conditions.",
      "Water phase assignment requires temperature, pressure, composition, and validity range evidence.",
      "Water phase context is not a habitability, life, prebiotic-success, or fusion-origin claim.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("doi:10.1063/1.1461829", "IAPWS-95 scientific formulation for ordinary water substance."),
      literatureRef("IAPWS R6-95(2018)", "Official thermodynamic release for ordinary water substance."),
      literatureRef("NIST Chemistry WebBook SRD 69", "Water thermochemical and thermophysical data source."),
    ],
    hintKeys: {
      subjects: ["matter", "phase", "water", "H2O", "density", "structure"],
      symbols: ["H2O", "T_K", "P_Pa", "rho_m_kg_m3", "H2O_phase_context"],
      unitSignatures: ["Theta", "M L^-1 T^-2", "M L^-3"],
      repoPaths: [],
      equationFamilies: ["water_phase_context", "equation_of_state", "gas_ice_chemistry"],
      simulationOwners: ["astrochemistry_prebiotic", "general_physics"],
    },
  }),
];

export const PHASE_OF_MATTER_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "composition_identity_requires_dimension_consistency",
    from: "physics.units.dimension_consistency",
    to: "matter.phase.composition_identity_context",
    relation: "requires",
    label: "Composition identity still requires dimensionally coherent state descriptors.",
    claimBoundaryNote: "Identity context is not a reaction or phase-density solve.",
  },
  {
    id: "composition_identity_bounds_thermodynamic_phase_state",
    from: "matter.phase.composition_identity_context",
    to: "matter.phase.thermodynamic_state_context",
    relation: "bounds",
    label: "Thermodynamic phase state is interpreted within a declared composition identity.",
    claimBoundaryNote: "A phase label cannot replace composition or reaction-boundary evidence.",
  },
  {
    id: "thermodynamic_state_requires_eos_density_context",
    from: "matter.phase.thermodynamic_state_context",
    to: "matter.phase.equation_of_state_density_context",
    relation: "requires",
    label: "Density claims require thermodynamic state and EOS or table context.",
    claimBoundaryNote: "Temperature and pressure are necessary context, not a universal density derivation.",
  },
  {
    id: "thermodynamic_state_conditions_structural_order",
    from: "matter.phase.thermodynamic_state_context",
    to: "matter.phase.structural_order_context",
    relation: "requires",
    label: "Structural-order claims require thermodynamic condition context.",
    claimBoundaryNote: "Phase labels do not uniquely determine microscopic structure.",
  },
  {
    id: "structural_order_documents_mode_frequency_context",
    from: "matter.phase.structural_order_context",
    to: "matter.phase.quantized_mode_frequency_context",
    relation: "documents",
    label: "Structure context can document which frequency modes are meaningful.",
    claimBoundaryNote: "Frequency observations still need mode assignment and calibration evidence.",
  },
  {
    id: "quantum_energy_frequency_specializes_phase_mode_frequency",
    from: "physics.quantum.energy_frequency",
    to: "matter.phase.quantized_mode_frequency_context",
    relation: "specializes",
    label: "Phase mode frequencies use the shared quantum energy-frequency relation for transition gaps.",
    claimBoundaryNote: "Delta E = h nu is a transition relation, not a bulk-density equation of state.",
  },
  {
    id: "phase_eos_density_documents_energy_density_bridge",
    from: "matter.phase.equation_of_state_density_context",
    to: "physics.energy.energy_density",
    relation: "documents",
    label: "Mass-density context can document later energy-density bridges only after EOS and volume context are admitted.",
    claimBoundaryNote: "Mass density is not automatically stress-energy or NHM2 source evidence.",
  },
  {
    id: "water_binding_requires_conditioned_phase_state",
    from: "astrochemistry.water.h_o_binding_context",
    to: "matter.phase.water_conditioned_state_context",
    relation: "requires",
    label: "Water molecular context must be condition-qualified before phase, structure, or density claims.",
    claimBoundaryNote: "Hydrogen and oxygen availability does not determine water phase or density.",
  },
  {
    id: "thermodynamic_phase_state_specializes_water_state",
    from: "matter.phase.thermodynamic_state_context",
    to: "matter.phase.water_conditioned_state_context",
    relation: "specializes",
    label: "Water phase-state context specializes the generic thermodynamic phase condition pattern.",
    claimBoundaryNote: "Water-specific state selection requires an admitted water EOS or measured reference table.",
  },
  {
    id: "eos_density_context_specializes_water_density",
    from: "matter.phase.equation_of_state_density_context",
    to: "matter.phase.water_conditioned_state_context",
    relation: "specializes",
    label: "Water density context specializes the generic EOS density pattern.",
    claimBoundaryNote: "The selected water formulation has a validity range and cannot be used outside it without a boundary note.",
  },
  {
    id: "water_state_documents_phase_mode_frequency",
    from: "matter.phase.water_conditioned_state_context",
    to: "matter.phase.quantized_mode_frequency_context",
    relation: "documents",
    label: "Water state can document rotational, vibrational, librational, or phonon mode contexts.",
    claimBoundaryNote: "Frequency modes are observables, not a direct derivation of water density.",
  },
];

export function buildPhaseOfMatterTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: PHASE_OF_MATTER_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: PHASE_OF_MATTER_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
