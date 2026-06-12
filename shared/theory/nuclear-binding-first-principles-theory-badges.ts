import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { ELEMENT_ORIGIN_REGISTRY } from "../periodic-table";

const NUCLEAR_BINDING_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const calculatorPayload = (args: {
  id: string;
  expression: string;
  displayLatex: string;
  targetVariable?: string;
}): TheoryBadgeV1["calculatorPayloads"][number] => ({
  id: args.id,
  expression: args.expression,
  displayLatex: args.displayLatex,
  preferredAction: "solve_with_steps",
  targetVariable: args.targetVariable ?? null,
  setupContext: null,
});

const nuclearBindingBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: NUCLEAR_BINDING_BOUNDARY,
});

const elementBadgeId = (symbol: string) => `element.${symbol.toLowerCase()}.origin`;

const commonAssumptions = [
  "Nuclear-binding rows are first-principles or bounded diagnostic context, not full reaction-network solvers.",
  "They do not validate NHM2, propulsion, consciousness, biology, or prebiotic-success claims.",
  "Astrophysical rates and yields require external reaction-rate, cross-section, abundance, or runtime evidence.",
];

export const NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES: TheoryBadgeV1[] = [
  nuclearBindingBadge({
    id: "physics.mass_energy.nuclear_binding_energy",
    title: "Nuclear Binding Mass-Energy",
    plainMeaning: "Represents nuclear binding energy as mass defect converted through mass-energy equivalence.",
    whyItMatters:
      "It gives element-origin and fusion prompts a scalar bridge from nuclear mass differences to released or required energy.",
    subjects: ["mass_energy", "nuclear_binding", "binding_energy", "first_principles"],
    level: "first_principle",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["mass_energy", "nuclear_binding_energy"],
    tags: ["mass_defect", "binding_energy", "calculator_loadable"],
    equations: [
      {
        id: "nuclear_binding_energy_mass_defect",
        role: "law",
        displayLatex: "E_b=\\Delta m c^2",
        computableExpression: "E_b_J = delta_m_kg * c_m_s^2",
        operatorKind: "scalar_expression",
        inputSymbols: ["delta_m_kg", "c_m_s"],
        outputSymbols: ["E_b_J"],
      },
    ],
    units: [
      { symbol: "delta_m_kg", unit: "kg", quantity: "mass_defect", dimensionSignature: "M" },
      { symbol: "E_b_J", unit: "J", quantity: "binding_energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      ...commonAssumptions,
      "The scalar payload computes an energy from a supplied mass defect; it does not infer nuclear masses.",
    ],
    calculatorPayloads: [
      calculatorPayload({
        id: "nuclear_binding_mass_energy_payload",
        expression: "E_b_J = delta_m_kg * c_m_s^2",
        displayLatex: "E_b=\\Delta m c^2",
        targetVariable: "E_b_J",
      }),
    ],
    sourceRefs: [
      literatureRef("doi:10.1002/andp.19053231314", "Einstein 1905 mass-energy equivalence reference."),
    ],
    hintKeys: {
      subjects: ["mass_energy", "nuclear_binding", "binding_energy", "mass_defect"],
      symbols: ["delta_m_kg", "c_m_s", "E_b_J"],
      unitSignatures: ["M", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["mass_energy", "nuclear_binding_energy"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.nuclear.coulomb_barrier",
    title: "Nuclear Coulomb Barrier",
    plainMeaning: "Represents electromagnetic repulsion between positively charged nuclei before close approach.",
    whyItMatters:
      "It prevents the graph from saying the strong force starts fusion at long range; charged nuclei must first face the Coulomb barrier.",
    subjects: ["nuclear_physics", "coulomb_barrier", "electromagnetic_repulsion", "fusion"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["coulomb_potential", "fusion_barrier"],
    tags: ["coulomb_barrier", "repulsion", "calculator_loadable", "claim_boundary"],
    equations: [
      {
        id: "coulomb_barrier_potential",
        role: "law",
        displayLatex: "V_C(r)=\\frac{Z_1Z_2e^2}{4\\pi\\epsilon_0 r}",
        computableExpression: "V_c_J = (Z1 * Z2 * e_C^2) / (4 * pi * epsilon0_F_m * r_m)",
        operatorKind: "scalar_expression",
        inputSymbols: ["Z1", "Z2", "e_C", "epsilon0_F_m", "r_m"],
        outputSymbols: ["V_c_J"],
      },
    ],
    units: [
      { symbol: "r_m", unit: "m", quantity: "separation", dimensionSignature: "L" },
      { symbol: "V_c_J", unit: "J", quantity: "coulomb_potential_energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      ...commonAssumptions,
      "The Coulomb barrier is electromagnetic repulsion, not nuclear strong-force attraction.",
      "The scalar payload is a point-charge barrier estimate and not a plasma-screened fusion rate.",
    ],
    calculatorPayloads: [
      calculatorPayload({
        id: "nuclear_coulomb_barrier_payload",
        expression: "V_c_J = (Z1 * Z2 * e_C^2) / (4 * pi * epsilon0_F_m * r_m)",
        displayLatex: "V_C(r)=\\frac{Z_1Z_2e^2}{4\\pi\\epsilon_0 r}",
        targetVariable: "V_c_J",
      }),
    ],
    sourceRefs: [
      literatureRef("doi:10.1038/122805b0", "Gamow 1928 tunneling/barrier context for nuclear processes."),
      literatureRef("doi:10.1103/PhysRev.55.434", "Bethe stellar fusion energy-production reference."),
    ],
    hintKeys: {
      subjects: ["nuclear_physics", "coulomb_barrier", "electromagnetic_repulsion", "fusion"],
      symbols: ["Z1", "Z2", "e_C", "epsilon0_F_m", "r_m", "V_c_J"],
      unitSignatures: ["L", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["coulomb_potential", "fusion_barrier"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.quantum.tunneling_fusion_entrance",
    title: "Quantum Tunneling Fusion Entrance",
    plainMeaning: "Represents tunneling through a charged-particle barrier as bounded fusion-entrance context.",
    whyItMatters:
      "It explains how fusion can occur despite classical Coulomb repulsion without pretending to compute full stellar reaction rates.",
    subjects: ["quantum", "tunneling", "fusion", "coulomb_barrier", "gamow_factor"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["quantum_tunneling", "gamow_proxy", "fusion_entrance"],
    tags: ["tunneling", "gamow_factor", "fusion_proxy", "claim_boundary"],
    equations: [
      {
        id: "fusion_tunneling_probability_proxy",
        role: "calculator_demo",
        displayLatex: "P_{\\mathrm{tunnel}}\\sim e^{-2\\pi\\eta}",
        computableExpression: "P_tunnel_proxy = exp(-2 * pi * eta)",
        operatorKind: "scalar_expression",
        inputSymbols: ["eta"],
        outputSymbols: ["P_tunnel_proxy"],
      },
    ],
    units: [{ symbol: "P_tunnel_proxy", quantity: "dimensionless_tunneling_proxy", dimensionSignature: "1" }],
    assumptions: [
      ...commonAssumptions,
      "This is a tunneling proxy, not a full astrophysical S-factor, screening, or reaction-rate calculation.",
      "Fusion entrance depends on temperature, density, plasma screening, cross sections, and reaction channels not solved here.",
    ],
    calculatorPayloads: [
      calculatorPayload({
        id: "fusion_tunneling_proxy_payload",
        expression: "P_tunnel_proxy = exp(-2 * pi * eta)",
        displayLatex: "P_{\\mathrm{tunnel}}\\sim e^{-2\\pi\\eta}",
        targetVariable: "P_tunnel_proxy",
      }),
    ],
    sourceRefs: [
      literatureRef("doi:10.1038/122805b0", "Gamow 1928 quantum tunneling reference."),
      literatureRef("doi:10.1103/PhysRev.55.434", "Bethe stellar fusion energy-production reference."),
    ],
    hintKeys: {
      subjects: ["quantum", "tunneling", "fusion", "coulomb_barrier", "gamow_factor"],
      symbols: ["eta", "P_tunnel_proxy"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["quantum_tunneling", "gamow_proxy", "fusion_entrance"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.nuclear.strong_force_short_range_binding",
    title: "Short-Range Nuclear Binding Force",
    plainMeaning:
      "Represents residual strong nuclear binding as short-range nuclear context after nucleons get close enough.",
    whyItMatters:
      "It separates the strong-force binding step from the long-range electromagnetic repulsion that fusion must enter through.",
    subjects: ["nuclear_physics", "strong_force", "short_range", "nuclear_binding", "nucleon"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["strong_force_context", "nuclear_binding"],
    tags: ["strong_force", "short_range", "nuclear_binding", "claim_boundary"],
    equations: [
      {
        id: "strong_force_short_range_context",
        role: "noncomputable_reference",
        displayLatex: "r_{\\mathrm{nuclear}}\\sim10^{-15}\\,\\mathrm{m}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["r_nuclear_m"],
        outputSymbols: ["strong_binding_context"],
      },
    ],
    units: [{ symbol: "r_nuclear_m", unit: "m", quantity: "nuclear_range_context", dimensionSignature: "L" }],
    assumptions: [
      ...commonAssumptions,
      "Residual strong force is short range and does not act as the long-range force that starts fusion.",
      "This badge documents binding context; it is not a quantum chromodynamics or nuclear-structure solver.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Yukawa-1935-Proc-Phys-Math-Soc-Japan-17-48", "Yukawa short-range nuclear-force model."),
    ],
    hintKeys: {
      subjects: ["nuclear_physics", "strong_force", "short_range", "nuclear_binding", "nucleon"],
      symbols: ["r_nuclear_m", "strong_binding_context"],
      unitSignatures: ["L"],
      repoPaths: [],
      equationFamilies: ["strong_force_context", "nuclear_binding"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.atomic.quantum_bound_state_structure",
    title: "Atomic Quantum Bound-State Structure",
    plainMeaning: "Represents atoms as quantum bound states governed by eigenvalue structure, not classical orbits.",
    whyItMatters:
      "It gives element and chemistry prompts a first-principles bridge from nuclear charge to electron-state structure.",
    subjects: ["atomic_physics", "quantum_bound_state", "electron_structure", "schrodinger_equation"],
    level: "first_principle",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["schrodinger_bound_state", "atomic_structure"],
    tags: ["bound_state", "electron_cloud", "atomic_structure"],
    equations: [
      {
        id: "atomic_bound_state_eigenvalue_context",
        role: "law",
        displayLatex: "\\hat{H}\\psi=E\\psi",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["H_hat", "psi"],
        outputSymbols: ["E"],
      },
    ],
    units: [{ symbol: "E", unit: "J", quantity: "energy_eigenvalue", dimensionSignature: "M L^2 T^-2" }],
    assumptions: [
      ...commonAssumptions,
      "Bound-state structure is quantum/electromagnetic context and does not imply molecular formation by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("doi:10.1002/andp.19263840404", "Schrodinger 1926 eigenvalue formulation."),
    ],
    hintKeys: {
      subjects: ["atomic_physics", "quantum_bound_state", "electron_structure", "schrodinger_equation"],
      symbols: ["H_hat", "psi", "E"],
      unitSignatures: ["M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["schrodinger_bound_state", "atomic_structure"],
      simulationOwners: ["general_physics"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.atomic.electron_cloud_uncertainty_floor",
    title: "Electron Cloud Uncertainty Floor",
    plainMeaning: "Represents the position-momentum uncertainty lower bound as electron-cloud structure context.",
    whyItMatters:
      "It prevents atomic structure from being explained as classical point-electron orbits with simultaneously exact position and momentum.",
    subjects: ["atomic_physics", "electron_cloud", "uncertainty", "quantum"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["uncertainty_relation", "electron_cloud_context"],
    tags: ["uncertainty", "electron_cloud", "calculator_loadable"],
    equations: [
      {
        id: "electron_cloud_uncertainty_bound",
        role: "constraint",
        displayLatex: "\\Delta x\\Delta p\\geq\\hbar/2",
        computableExpression: "delta_p_min_kg_m_s = hbar_J_s / (2 * delta_x_m)",
        operatorKind: "scalar_expression",
        inputSymbols: ["delta_x_m", "hbar_J_s"],
        outputSymbols: ["delta_p_min_kg_m_s"],
      },
    ],
    units: [
      { symbol: "delta_x_m", unit: "m", quantity: "position_spread", dimensionSignature: "L" },
      { symbol: "delta_p_min_kg_m_s", unit: "kg m/s", quantity: "minimum_momentum_spread", dimensionSignature: "M L T^-1" },
    ],
    assumptions: [
      ...commonAssumptions,
      "The scalar payload estimates a lower-bound momentum spread from a supplied position spread.",
    ],
    calculatorPayloads: [
      calculatorPayload({
        id: "electron_cloud_uncertainty_floor_payload",
        expression: "delta_p_min_kg_m_s = hbar_J_s / (2 * delta_x_m)",
        displayLatex: "\\Delta p_{min}=\\frac{\\hbar}{2\\Delta x}",
        targetVariable: "delta_p_min_kg_m_s",
      }),
    ],
    sourceRefs: [
      literatureRef("doi:10.1007/BF01397280", "Heisenberg 1927 uncertainty principle reference."),
      literatureRef("doi:10.1007/BF01391200", "Kennard 1927 formal position-momentum inequality."),
    ],
    hintKeys: {
      subjects: ["atomic_physics", "electron_cloud", "uncertainty", "quantum"],
      symbols: ["delta_x_m", "delta_p_min_kg_m_s", "hbar_J_s"],
      unitSignatures: ["L", "M L T^-1"],
      repoPaths: [],
      equationFamilies: ["uncertainty_relation", "electron_cloud_context"],
      simulationOwners: ["general_physics"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.atomic.pauli_shell_structure",
    title: "Pauli Shell Structure Context",
    plainMeaning: "Represents fermionic exclusion as electron-shell and periodic-structure context.",
    whyItMatters:
      "It bridges element identity into electron shell structure without treating atomic periodicity as a nuclear fusion claim.",
    subjects: ["atomic_physics", "pauli_exclusion", "electron_shell", "periodic_table"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["pauli_exclusion", "electron_shell_structure"],
    tags: ["pauli_exclusion", "shell_structure", "periodicity"],
    equations: [
      {
        id: "pauli_shell_context",
        role: "constraint",
        displayLatex: "(n,l,m_l,m_s)_i\\neq(n,l,m_l,m_s)_j",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["n", "l", "m_l", "m_s"],
        outputSymbols: ["shell_occupancy_context"],
      },
    ],
    units: [{ symbol: "shell_occupancy_context", quantity: "dimensionless_shell_context", dimensionSignature: "1" }],
    assumptions: [
      ...commonAssumptions,
      "Shell structure describes electron-state occupancy and does not by itself prove a chemical or molecular pathway.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("doi:10.1007/BF02980631", "Pauli 1925 exclusion principle reference."),
    ],
    hintKeys: {
      subjects: ["atomic_physics", "pauli_exclusion", "electron_shell", "periodic_table"],
      symbols: ["n", "l", "m_l", "m_s", "shell_occupancy_context"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["pauli_exclusion", "electron_shell_structure"],
      simulationOwners: ["general_physics"],
    },
  }),
  nuclearBindingBadge({
    id: "physics.atomic.electromagnetic_molecular_binding_context",
    title: "Electromagnetic Molecular Binding Context",
    plainMeaning:
      "Represents molecular binding as electron-nucleus attraction and electron-electron/nucleus-nucleus repulsion under quantum structure.",
    whyItMatters:
      "It keeps molecular chemistry downstream of atomic quantum/electromagnetic structure and distinct from nuclear fusion.",
    subjects: ["atomic_physics", "molecular_binding", "electromagnetism", "chemistry_context"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    equationFamilies: ["electromagnetic_binding_context", "molecular_binding_context"],
    tags: ["molecular_binding", "electromagnetic", "chemistry_context", "claim_boundary"],
    equations: [
      {
        id: "molecular_binding_context",
        role: "noncomputable_reference",
        displayLatex: "E_{\\mathrm{mol}}=\\mathrm{context}(Z,\\psi,\\mathrm{EM},\\mathrm{Pauli})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Z", "psi", "EM", "pauli_context"],
        outputSymbols: ["molecular_binding_context"],
      },
    ],
    units: [{ symbol: "molecular_binding_context", quantity: "dimensionless_binding_context", dimensionSignature: "1" }],
    assumptions: [
      ...commonAssumptions,
      "Molecular binding is electromagnetic/quantum chemistry context, not nuclear binding or fusion.",
      "Water formation still requires local physical chemistry and formation/destruction routes.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("doi:10.1002/andp.19263840404", "Schrodinger 1926 bound-state quantum structure reference."),
      literatureRef("doi:10.1007/BF02980631", "Pauli 1925 electron-shell exclusion reference."),
    ],
    hintKeys: {
      subjects: ["atomic_physics", "molecular_binding", "electromagnetism", "chemistry_context"],
      symbols: ["Z", "psi", "EM", "pauli_context", "molecular_binding_context"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["electromagnetic_binding_context", "molecular_binding_context"],
      simulationOwners: ["general_physics", "astrochemistry_prebiotic"],
    },
  }),
];

export const NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "strong_force_documents_nuclear_binding_energy",
    from: "physics.nuclear.strong_force_short_range_binding",
    to: "physics.mass_energy.nuclear_binding_energy",
    relation: "documents",
    label: "Short-range nuclear binding documents the mass-defect energy context.",
    claimBoundaryNote: "This edge documents binding context and does not compute nuclear masses or reaction rates.",
  },
  {
    id: "coulomb_barrier_requires_tunneling_fusion_entrance",
    from: "physics.nuclear.coulomb_barrier",
    to: "physics.quantum.tunneling_fusion_entrance",
    relation: "requires",
    label: "Charged-particle fusion entrance requires barrier/tunneling context.",
    claimBoundaryNote: "Tunneling proxy context is not a full fusion-rate calculation.",
  },
  {
    id: "tunneling_entrance_documents_hydrogen_burning",
    from: "physics.quantum.tunneling_fusion_entrance",
    to: "nucleosynthesis.hydrogen_burning.helium_production",
    relation: "documents",
    label: "Tunneling entrance context documents hydrogen-burning fusion access.",
    claimBoundaryNote: "Hydrogen burning primarily produces helium, not direct oxygen production.",
  },
  {
    id: "tunneling_entrance_documents_alpha_capture",
    from: "physics.quantum.tunneling_fusion_entrance",
    to: "nucleosynthesis.alpha_capture.oxygen_neon_magnesium",
    relation: "documents",
    label: "Tunneling entrance context documents charged-particle alpha-capture access.",
    claimBoundaryNote: "Alpha-capture context remains isotope- and environment-dependent.",
  },
  {
    id: "binding_energy_documents_hydrogen_burning",
    from: "physics.mass_energy.nuclear_binding_energy",
    to: "nucleosynthesis.hydrogen_burning.helium_production",
    relation: "documents",
    label: "Mass-defect binding energy documents the energy accounting side of hydrogen burning.",
    claimBoundaryNote: "Binding-energy context is not a complete stellar fusion network.",
  },
  {
    id: "binding_energy_documents_alpha_capture",
    from: "physics.mass_energy.nuclear_binding_energy",
    to: "nucleosynthesis.alpha_capture.oxygen_neon_magnesium",
    relation: "documents",
    label: "Mass-defect binding energy documents the energy accounting side of alpha-capture products.",
    claimBoundaryNote: "Binding-energy context is not a complete element-yield calculation.",
  },
  {
    id: "quantum_bound_state_requires_uncertainty_floor",
    from: "physics.atomic.quantum_bound_state_structure",
    to: "physics.atomic.electron_cloud_uncertainty_floor",
    relation: "requires",
    label: "Atomic bound-state explanations require electron-cloud uncertainty context.",
    claimBoundaryNote: "Uncertainty context blocks classical point-orbit overclaims.",
  },
  {
    id: "uncertainty_floor_documents_pauli_shell_structure",
    from: "physics.atomic.electron_cloud_uncertainty_floor",
    to: "physics.atomic.pauli_shell_structure",
    relation: "documents",
    label: "Electron-cloud uncertainty documents the quantum-state side of shell structure.",
    claimBoundaryNote: "Uncertainty alone does not derive the full periodic table.",
  },
  {
    id: "pauli_shell_documents_molecular_binding_context",
    from: "physics.atomic.pauli_shell_structure",
    to: "physics.atomic.electromagnetic_molecular_binding_context",
    relation: "documents",
    label: "Pauli shell context documents the electron-occupancy side of molecular binding.",
    claimBoundaryNote: "Shell context does not guarantee molecule formation.",
  },
  {
    id: "electromagnetic_binding_documents_water_context",
    from: "physics.atomic.electromagnetic_molecular_binding_context",
    to: "astrochemistry.water.h_o_binding_context",
    relation: "documents",
    label: "Electromagnetic molecular-binding context documents why H-O chemistry is molecular rather than nuclear.",
    claimBoundaryNote: "Water formation still depends on local physical chemistry and does not follow from H and O alone.",
  },
  {
    id: "electromagnetic_binding_documents_phase_structural_order",
    from: "physics.atomic.electromagnetic_molecular_binding_context",
    to: "matter.phase.structural_order_context",
    relation: "documents",
    label: "Molecular binding context documents a microscopic contributor to phase structural order.",
    claimBoundaryNote: "Phase structural order is conditioned matter context, not a nuclear fusion claim.",
  },
  ...ELEMENT_ORIGIN_REGISTRY.map((entry) => ({
    id: `strong_force_binding_documents_element_${entry.symbol.toLowerCase()}`,
    from: "physics.nuclear.strong_force_short_range_binding",
    to: elementBadgeId(entry.symbol),
    relation: "documents" as const,
    label: `Short-range nuclear binding documents bounded nuclear identity context for ${entry.name}.`,
    claimBoundaryNote: "Nuclear binding documents element identity context but does not prove a specific isotope yield pathway.",
  })),
  ...ELEMENT_ORIGIN_REGISTRY.map((entry) => ({
    id: `pauli_shell_documents_element_${entry.symbol.toLowerCase()}`,
    from: "physics.atomic.pauli_shell_structure",
    to: elementBadgeId(entry.symbol),
    relation: "documents" as const,
    label: `Pauli shell structure documents bounded electron-structure context for ${entry.name}.`,
    claimBoundaryNote: "Electron-shell context documents periodic structure but does not derive element origin.",
  })),
];

export function buildNuclearBindingFirstPrinciplesTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_BADGES,
    edges: NUCLEAR_BINDING_FIRST_PRINCIPLES_THEORY_EDGES,
  };
}
