import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const DIAGNOSTIC_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const bridgeBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: DIAGNOSTIC_BOUNDARY,
});

const literatureRef = (id: string, note: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  note,
});

export const FOUNDATIONAL_PHYSICS_BRIDGE_BADGES: TheoryBadgeV1[] = [
  bridgeBadge({
    id: "physics.radiation.massless_photon_kinematics_context",
    title: "Massless Photon Kinematics Context",
    plainMeaning:
      "Joins photon energy, momentum, frequency, and wavelength through E = pc = h nu and p = h/lambda for a massless radiation quantum.",
    whyItMatters:
      "It supplies the missing photon-specific junction between Planck energy, de Broglie momentum, relativistic energy-momentum, and radiation-mode branches.",
    subjects: ["quantum", "radiation", "photon", "relativity", "momentum"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference", "casimir_cavity"],
    equationFamilies: ["photon_kinematics", "planck_relation", "de_broglie_relation", "massless_energy_momentum"],
    tags: ["photon", "massless", "energy", "momentum", "frequency", "wavelength", "selection_convergence_junction"],
    equations: [
      {
        id: "massless_photon_energy_momentum",
        role: "law",
        displayLatex: "E=pc=h\\nu,\\qquad p=h/\\lambda",
        computableExpression: "E_J = p_kg_m_s * c_m_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["p_kg_m_s", "c_m_s", "h_J_s", "nu_Hz", "lambda_m"],
        outputSymbols: ["E_J", "p_kg_m_s"],
      },
    ],
    units: [
      { symbol: "E_J", unit: "J", quantity: "photon_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "p_kg_m_s", unit: "kg m/s", quantity: "photon_momentum", dimensionSignature: "M L T^-1" },
      { symbol: "nu_Hz", unit: "Hz", quantity: "photon_frequency", dimensionSignature: "T^-1" },
      { symbol: "lambda_m", unit: "m", quantity: "photon_wavelength", dimensionSignature: "L" },
    ],
    assumptions: [
      "The massless specialization applies to photons in vacuum; material quasiparticles require a medium-specific dispersion relation.",
      "The relation specifies single-quantum kinematics, not photon occupation, intensity, coherence, or energy density.",
    ],
    calculatorPayloads: [
      {
        id: "massless_photon_energy_momentum_payload",
        expression: "E_J = p_kg_m_s * c_m_s",
        displayLatex: "E=pc",
        preferredAction: "solve_with_steps",
        targetVariable: "E_J",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("Planck-Einstein-de-Broglie-photon-relations", "Canonical massless photon energy-momentum relations."),
    ],
    hintKeys: {
      subjects: ["quantum", "radiation", "photon", "relativity", "momentum"],
      symbols: ["E_J", "p_kg_m_s", "c_m_s", "h_J_s", "nu_Hz", "lambda_m"],
      unitSignatures: ["M L^2 T^-2", "M L T^-1", "T^-1", "L"],
      repoPaths: [],
      equationFamilies: ["photon_kinematics", "planck_relation", "de_broglie_relation", "massless_energy_momentum"],
      simulationOwners: ["general_physics", "stellar_reference", "casimir_cavity"],
    },
  }),
  bridgeBadge({
    id: "physics.energy.amount_to_density_context",
    title: "Energy Amount-to-Density Context",
    plainMeaning:
      "Converts an admitted energy amount or population into energy density only after a volume, number density, or mass density is supplied.",
    whyItMatters:
      "It prevents single-photon energy or rest energy from being mistaken for energy per volume without occupation and spatial context.",
    subjects: ["energy", "energy_density", "volume", "occupation", "mass_density"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["energy_density_construction", "radiation_energy_density", "rest_mass_energy_density"],
    tags: ["energy_density", "volume_required", "occupation_required", "mass_density_required", "claim_boundary"],
    equations: [
      {
        id: "energy_amount_per_volume",
        role: "definition",
        displayLatex: "u=E_{\\mathrm{total}}/V",
        computableExpression: "u_J_m3 = E_total_J / volume_m3",
        operatorKind: "scalar_expression",
        inputSymbols: ["E_total_J", "volume_m3"],
        outputSymbols: ["u_J_m3"],
      },
      {
        id: "photon_population_energy_density",
        role: "law",
        displayLatex: "u=N h\\nu/V",
        computableExpression: "u_J_m3 = photon_number * h_J_s * nu_Hz / volume_m3",
        operatorKind: "scalar_expression",
        inputSymbols: ["photon_number", "h_J_s", "nu_Hz", "volume_m3"],
        outputSymbols: ["u_J_m3"],
      },
      {
        id: "rest_mass_energy_density",
        role: "law",
        displayLatex: "u=\\rho_m c^2",
        computableExpression: "u_J_m3 = mass_density_kg_m3 * c_m_s^2",
        operatorKind: "scalar_expression",
        inputSymbols: ["mass_density_kg_m3", "c_m_s"],
        outputSymbols: ["u_J_m3"],
      },
    ],
    units: [
      { symbol: "E_total_J", unit: "J", quantity: "total_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "volume_m3", unit: "m^3", quantity: "volume", dimensionSignature: "L^3" },
      { symbol: "mass_density_kg_m3", unit: "kg/m^3", quantity: "mass_density", dimensionSignature: "M L^-3" },
      { symbol: "u_J_m3", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "An energy-per-quantum relation requires an admitted occupation and volume before it defines energy density.",
      "A rest-energy relation requires mass density or total mass and volume before it defines energy density.",
    ],
    calculatorPayloads: [
      {
        id: "energy_amount_per_volume_payload",
        expression: "u_J_m3 = E_total_J / volume_m3",
        displayLatex: "u=E_{\\mathrm{total}}/V",
        preferredAction: "solve_with_steps",
        targetVariable: "u_J_m3",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("energy-density-definition", "Canonical extensive-energy per volume and rest-mass-density relations."),
    ],
    hintKeys: {
      subjects: ["energy", "energy_density", "volume", "occupation", "mass_density"],
      symbols: ["E_total_J", "volume_m3", "photon_number", "h_J_s", "nu_Hz", "mass_density_kg_m3", "c_m_s", "u_J_m3"],
      unitSignatures: ["M L^2 T^-2", "L^3", "M L^-3", "M L^-1 T^-2"],
      repoPaths: [],
      equationFamilies: ["energy_density_construction", "radiation_energy_density", "rest_mass_energy_density"],
      simulationOwners: ["general_physics"],
    },
  }),
];

export const FOUNDATIONAL_PHYSICS_BRIDGE_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "uncertainty_relation_specializes_electron_cloud_floor",
    from: "physics.quantum.uncertainty_position_momentum",
    to: "physics.atomic.electron_cloud_uncertainty_floor",
    relation: "specializes",
    label: "The electron-cloud uncertainty floor specializes the canonical position-momentum uncertainty relation.",
    claimBoundaryNote: "The uncertainty inequality constrains spreads but does not derive a complete atomic wavefunction.",
  },
  {
    id: "quantum_energy_specializes_massless_photon_kinematics",
    from: "physics.quantum.energy_frequency",
    to: "physics.radiation.massless_photon_kinematics_context",
    relation: "specializes",
    label: "Photon kinematics combines the Planck energy-frequency relation with the massless momentum relation.",
    claimBoundaryNote: "Single-photon kinematics does not select occupation or coherence.",
  },
  {
    id: "quantum_momentum_specializes_massless_photon_kinematics",
    from: "physics.quantum.momentum_wavelength",
    to: "physics.radiation.massless_photon_kinematics_context",
    relation: "specializes",
    label: "Photon kinematics specializes the de Broglie momentum-wavelength relation to a massless radiation quantum.",
    claimBoundaryNote: "Matter waves and medium quasiparticles require their own dispersion context.",
  },
  {
    id: "relativistic_energy_momentum_specializes_massless_photon_kinematics",
    from: "physics.relativity.energy_momentum_relation",
    to: "physics.radiation.massless_photon_kinematics_context",
    relation: "specializes",
    label: "Setting invariant rest mass to zero specializes relativistic energy-momentum to E = pc.",
    claimBoundaryNote: "The massless specialization does not apply to massive particles.",
  },
  {
    id: "speed_of_light_supports_massless_photon_kinematics",
    from: "physics.constants.speed_of_light",
    to: "physics.radiation.massless_photon_kinematics_context",
    relation: "uses_constant",
    label: "Vacuum photon energy and momentum are related by the speed of light.",
    claimBoundaryNote: "Material propagation requires an admitted dispersion relation.",
  },
  {
    id: "massless_photon_kinematics_documents_radiation_mode",
    from: "physics.radiation.massless_photon_kinematics_context",
    to: "physics.radiation.mode_context",
    relation: "requires",
    label: "Photon kinematics documents the energy-momentum side of a vacuum radiation mode.",
    claimBoundaryNote: "A radiation mode additionally carries polarization, spatial, bandwidth, and boundary context.",
  },
  {
    id: "rest_energy_specializes_nuclear_mass_defect_binding",
    from: "physics.relativity.rest_energy",
    to: "physics.mass_energy.nuclear_binding_energy",
    relation: "specializes",
    label: "Nuclear binding energy specializes mass-energy equivalence to a measured mass defect.",
    claimBoundaryNote: "Mass-energy equivalence does not infer nuclear masses, stability, or reaction yields.",
  },
  {
    id: "quantum_energy_documents_amount_to_density_context",
    from: "physics.quantum.energy_frequency",
    to: "physics.energy.amount_to_density_context",
    relation: "requires",
    label: "Per-quantum energy can enter an energy-density construction only with occupation and volume context.",
    claimBoundaryNote: "E = h nu alone is not an energy density.",
  },
  {
    id: "rest_energy_documents_amount_to_density_context",
    from: "physics.relativity.rest_energy",
    to: "physics.energy.amount_to_density_context",
    relation: "requires",
    label: "Rest energy can enter an energy-density construction only with mass-density or mass-and-volume context.",
    claimBoundaryNote: "E = mc squared alone is not an energy density.",
  },
  {
    id: "amount_to_density_context_derives_energy_density",
    from: "physics.energy.amount_to_density_context",
    to: "physics.energy.energy_density",
    relation: "derives",
    label: "Admitted total energy and volume or mass density define an energy density.",
    claimBoundaryNote: "The conversion does not select a physical source mechanism.",
  },
];

export function buildFoundationalPhysicsBridgeTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: FOUNDATIONAL_PHYSICS_BRIDGE_BADGES.map((badge) => ({ ...badge })),
    edges: FOUNDATIONAL_PHYSICS_BRIDGE_EDGES.map((edge) => ({ ...edge })),
  };
}
