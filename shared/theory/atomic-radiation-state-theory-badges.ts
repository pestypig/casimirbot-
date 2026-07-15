import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { ELEMENT_ORIGIN_REGISTRY } from "../periodic-table";

const DIAGNOSTIC_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const literatureRef = (id: string, note: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  note,
});

const stateBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: DIAGNOSTIC_BOUNDARY,
});

const commonAssumptions = [
  "State context must be declared independently of element-origin context.",
  "A graph connection identifies compatible theory context; it does not prove that a transition or radiation state is present.",
];

export const ATOMIC_RADIATION_STATE_THEORY_BADGES: TheoryBadgeV1[] = [
  stateBadge({
    id: "physics.atomic.element_identity_context",
    title: "Atomic Element Identity Context",
    plainMeaning:
      "Represents atomic number as element identity while keeping isotope, ionization, excitation, phase, and origin as separate state variables.",
    whyItMatters:
      "It prevents selecting an element-origin badge from silently selecting a ground state, charge state, phase of matter, or radiation frequency.",
    subjects: ["atomic_physics", "element_identity", "periodic_table", "state_context"],
    level: "first_principle",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["atomic_identity", "state_separation"],
    tags: ["element_identity", "atomic_number", "not_state_selection", "claim_boundary"],
    equations: [
      {
        id: "atomic_identity_by_proton_number",
        role: "definition",
        displayLatex: "\\mathrm{element}=\\mathrm{identity}(Z)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Z_atomic_number"],
        outputSymbols: ["element_identity"],
      },
    ],
    units: [{ symbol: "Z_atomic_number", unit: null, quantity: "atomic_number", dimensionSignature: "1" }],
    assumptions: [
      ...commonAssumptions,
      "Changing isotope, electron count, excitation, or bulk phase does not change element identity; changing proton number does.",
    ],
    calculatorPayloads: [],
    sourceRefs: [literatureRef("IUPAC-periodic-table", "Element identity is indexed by atomic number Z.")],
    hintKeys: {
      subjects: ["atomic_physics", "element_identity", "periodic_table", "state_context"],
      symbols: ["Z_atomic_number", "element_identity"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["atomic_identity", "state_separation"],
      simulationOwners: ["general_physics", "stellar_reference", "astrochemistry_prebiotic"],
    },
  }),
  stateBadge({
    id: "physics.atomic.ionization_charge_state_context",
    title: "Atomic Ionization and Charge-State Context",
    plainMeaning:
      "Represents the electron count and ionic charge of a selected element independently of its nuclear identity or bulk phase.",
    whyItMatters:
      "Atomic spectra and electronic levels depend on charge state, so an element name alone is not enough to choose a frequency.",
    subjects: ["atomic_physics", "ionization", "charge_state", "electron_count"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["ionization_state", "atomic_charge_balance"],
    tags: ["ion", "charge_state", "electron_configuration", "conditioned_state"],
    equations: [
      {
        id: "atomic_charge_state",
        role: "definition",
        displayLatex: "q/e=Z-N_e",
        computableExpression: "charge_number = Z_atomic_number - electron_count",
        operatorKind: "scalar_expression",
        inputSymbols: ["Z_atomic_number", "electron_count"],
        outputSymbols: ["charge_number"],
      },
    ],
    units: [
      { symbol: "Z_atomic_number", unit: null, quantity: "atomic_number", dimensionSignature: "1" },
      { symbol: "electron_count", unit: null, quantity: "electron_count", dimensionSignature: "1" },
      { symbol: "charge_number", unit: null, quantity: "ionic_charge_number", dimensionSignature: "1" },
    ],
    assumptions: [
      ...commonAssumptions,
      "Ionization state requires an admitted preparation, environment, or observation; it is not inferred from element identity alone.",
    ],
    calculatorPayloads: [
      {
        id: "atomic_charge_state_payload",
        expression: "charge_number = Z_atomic_number - electron_count",
        displayLatex: "q/e=Z-N_e",
        preferredAction: "solve_with_steps",
        targetVariable: "charge_number",
        setupContext: null,
      },
    ],
    sourceRefs: [literatureRef("NIST-Atomic-Spectra-Database", "Atomic spectra are indexed by element and ionization stage.")],
    hintKeys: {
      subjects: ["atomic_physics", "ionization", "charge_state", "electron_count"],
      symbols: ["Z_atomic_number", "electron_count", "charge_number"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["ionization_state", "atomic_charge_balance"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  stateBadge({
    id: "physics.atomic.electronic_level_structure_context",
    title: "Atomic Electronic-Level Structure Context",
    plainMeaning:
      "Represents the allowed electronic eigenlevels for a declared element, ionization stage, Hamiltonian, and environment.",
    whyItMatters:
      "It distinguishes general bound-state structure from selecting a particular ground or excited state.",
    subjects: ["atomic_physics", "electronic_levels", "bound_state", "excitation"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["atomic_eigenlevels", "schrodinger_bound_state", "fine_structure"],
    tags: ["energy_levels", "ground_and_excited_states", "environment_conditioned"],
    equations: [
      {
        id: "conditioned_atomic_eigenlevels",
        role: "law",
        displayLatex: "\\hat H(Z,q,\\mathrm{environment})\\lvert\\psi_n\\rangle=E_n\\lvert\\psi_n\\rangle",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["H_atomic", "Z_atomic_number", "charge_number", "environment_context"],
        outputSymbols: ["E_n", "psi_n"],
      },
    ],
    units: [{ symbol: "E_n", unit: "J", quantity: "electronic_energy_level", dimensionSignature: "M L^2 T^-2" }],
    assumptions: [
      ...commonAssumptions,
      "The level index n may denote a ground or excited eigenstate; this badge does not select one without state-population evidence.",
      "Fine, hyperfine, Zeeman, Stark, and environmental shifts require additional model context.",
    ],
    calculatorPayloads: [],
    sourceRefs: [literatureRef("NIST-Atomic-Spectra-Database", "Evaluated atomic energy levels and transition data.")],
    hintKeys: {
      subjects: ["atomic_physics", "electronic_levels", "bound_state", "excitation"],
      symbols: ["H_atomic", "Z_atomic_number", "charge_number", "E_n", "psi_n"],
      unitSignatures: ["M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["atomic_eigenlevels", "schrodinger_bound_state", "fine_structure"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  stateBadge({
    id: "physics.atomic.level_population_context",
    title: "Atomic Level-Population Context",
    plainMeaning:
      "Represents how ground and excited electronic levels are populated under declared thermal, collisional, pumping, and radiative conditions.",
    whyItMatters:
      "A possible transition does not become an observed line or laser gain channel unless the relevant levels are populated.",
    subjects: ["atomic_physics", "level_population", "excitation", "non_lte", "spectroscopy"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["boltzmann_population", "statistical_equilibrium", "population_inversion"],
    tags: ["ground_state_population", "excited_state_population", "lte_boundary", "non_lte", "selection_convergence_junction"],
    equations: [
      {
        id: "lte_level_population_ratio",
        role: "noncomputable_reference",
        displayLatex: "N_u/N_l=(g_u/g_l)e^{-\\Delta E/(k_BT)}\\quad\\mathrm{(LTE)}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["N_u", "N_l", "g_u", "g_l", "deltaE_J", "k_B", "T_K"],
        outputSymbols: ["level_population_context"],
      },
    ],
    units: [
      { symbol: "N_u", unit: null, quantity: "upper_level_population", dimensionSignature: "mixed" },
      { symbol: "N_l", unit: null, quantity: "lower_level_population", dimensionSignature: "mixed" },
      { symbol: "T_K", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      ...commonAssumptions,
      "The displayed Boltzmann ratio is an LTE reference only; lasers and dilute plasmas commonly require non-LTE rate equations.",
      "Element identity alone does not select ground-state occupancy or population inversion.",
    ],
    calculatorPayloads: [],
    sourceRefs: [literatureRef("Rybicki-Lightman-Radiative-Processes-in-Astrophysics", "Level populations and radiative processes require physical-condition context.")],
    hintKeys: {
      subjects: ["atomic_physics", "level_population", "excitation", "non_lte", "spectroscopy"],
      symbols: ["N_u", "N_l", "g_u", "g_l", "deltaE_J", "k_B", "T_K", "level_population_context"],
      unitSignatures: ["mixed", "Theta", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["boltzmann_population", "statistical_equilibrium", "population_inversion"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  stateBadge({
    id: "physics.atomic.transition_gap_frequency_context",
    title: "Atomic Transition-Gap Frequency Context",
    plainMeaning:
      "Relates a specific upper-to-lower electronic energy gap to an emitted or absorbed quantum frequency.",
    whyItMatters:
      "It is the missing bridge between an element's allowed electronic levels and the shared Planck energy-frequency relation.",
    subjects: ["atomic_physics", "transition_energy", "frequency", "spectroscopy"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference"],
    equationFamilies: ["atomic_transition", "planck_relation", "spectral_line_frequency"],
    tags: ["transition_gap", "emission", "absorption", "calculator_loadable", "selection_convergence_junction"],
    equations: [
      {
        id: "atomic_transition_gap_frequency",
        role: "law",
        displayLatex: "\\Delta E_{ul}=E_u-E_l=h\\nu_{ul}",
        computableExpression: "nu_Hz = (E_upper_J - E_lower_J) / h_J_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["E_upper_J", "E_lower_J", "h_J_s"],
        outputSymbols: ["deltaE_J", "nu_Hz"],
      },
    ],
    units: [
      { symbol: "E_upper_J", unit: "J", quantity: "upper_level_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "E_lower_J", unit: "J", quantity: "lower_level_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "h_J_s", unit: "J s", quantity: "planck_constant", dimensionSignature: "M L^2 T^-1" },
      { symbol: "nu_Hz", unit: "Hz", quantity: "transition_frequency", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      ...commonAssumptions,
      "The relation selects a possible transition frequency only after upper and lower levels are identified.",
      "Line visibility additionally requires selection rules, transition probability, level population, and environment context.",
    ],
    calculatorPayloads: [
      {
        id: "atomic_transition_gap_frequency_payload",
        expression: "nu_Hz = (E_upper_J - E_lower_J) / h_J_s",
        displayLatex: "\\nu_{ul}=\\frac{E_u-E_l}{h}",
        preferredAction: "solve_with_steps",
        targetVariable: "nu_Hz",
        setupContext: null,
      },
    ],
    sourceRefs: [literatureRef("Planck-Einstein-relation", "Photon frequency is related to the energy exchanged by a transition.")],
    hintKeys: {
      subjects: ["atomic_physics", "transition_energy", "frequency", "spectroscopy"],
      symbols: ["E_upper_J", "E_lower_J", "deltaE_J", "h_J_s", "nu_Hz"],
      unitSignatures: ["M L^2 T^-2", "M L^2 T^-1", "T^-1"],
      repoPaths: [],
      equationFamilies: ["atomic_transition", "planck_relation", "spectral_line_frequency"],
      simulationOwners: ["general_physics", "stellar_reference"],
    },
  }),
  stateBadge({
    id: "physics.radiation.mode_context",
    title: "Radiation Mode and Frequency Context",
    plainMeaning:
      "Represents a radiation mode by frequency or wavelength together with propagation, polarization, bandwidth, and boundary context.",
    whyItMatters:
      "It makes frequency a selectable radiation-mode property without confusing it with matter phase or source identity.",
    subjects: ["radiation", "electromagnetic_mode", "frequency", "wavelength", "polarization"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "stellar_reference", "casimir_cavity"],
    equationFamilies: ["electromagnetic_mode", "frequency_wavelength", "spectral_bandwidth"],
    tags: ["frequency", "wavelength", "polarization", "bandwidth", "mode", "selection_convergence_junction"],
    equations: [
      {
        id: "vacuum_mode_frequency_wavelength",
        role: "law",
        displayLatex: "\\nu=c/\\lambda",
        computableExpression: "nu_Hz = c_m_s / lambda_m",
        operatorKind: "scalar_expression",
        inputSymbols: ["c_m_s", "lambda_m"],
        outputSymbols: ["nu_Hz"],
      },
    ],
    units: [
      { symbol: "nu_Hz", unit: "Hz", quantity: "mode_frequency", dimensionSignature: "T^-1" },
      { symbol: "lambda_m", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "bandwidth_Hz", unit: "Hz", quantity: "spectral_bandwidth", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      ...commonAssumptions,
      "Frequency alone does not specify polarization, spatial mode, bandwidth, photon number, coherence, or intensity.",
      "The vacuum relation must be replaced by an admitted dispersion relation in a material medium.",
    ],
    calculatorPayloads: [
      {
        id: "radiation_mode_frequency_payload",
        expression: "nu_Hz = c_m_s / lambda_m",
        displayLatex: "\\nu=c/\\lambda",
        preferredAction: "solve_with_steps",
        targetVariable: "nu_Hz",
        setupContext: null,
      },
    ],
    sourceRefs: [literatureRef("Maxwell-electromagnetic-wave-relation", "Vacuum electromagnetic frequency-wavelength relation.")],
    hintKeys: {
      subjects: ["radiation", "electromagnetic_mode", "frequency", "wavelength", "polarization"],
      symbols: ["nu_Hz", "c_m_s", "lambda_m", "bandwidth_Hz"],
      unitSignatures: ["T^-1", "L", "L T^-1"],
      repoPaths: [],
      equationFamilies: ["electromagnetic_mode", "frequency_wavelength", "spectral_bandwidth"],
      simulationOwners: ["general_physics", "stellar_reference", "casimir_cavity"],
    },
  }),
  stateBadge({
    id: "physics.radiation.quantum_field_state_context",
    title: "Radiation Quantum Field-State Context",
    plainMeaning:
      "Distinguishes vacuum, number-state, thermal, coherent, squeezed, and mixed radiation states within a declared mode basis.",
    whyItMatters:
      "Two beams can share a frequency while having different photon occupation, statistics, coherence, noise, and intensity.",
    subjects: ["radiation", "quantum_optics", "photon_occupation", "coherence", "field_state"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "casimir_cavity"],
    equationFamilies: ["quantized_field_mode", "photon_occupation", "quantum_optical_state"],
    tags: ["fock_state", "thermal_state", "coherent_state", "squeezed_state", "not_matter_phase", "selection_convergence_junction"],
    equations: [
      {
        id: "quantized_mode_energy",
        role: "law",
        displayLatex: "E_n=(n+1/2)h\\nu",
        computableExpression: "mode_energy_J = (photon_number + 0.5) * h_J_s * nu_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["photon_number", "h_J_s", "nu_Hz"],
        outputSymbols: ["mode_energy_J"],
      },
    ],
    units: [
      { symbol: "photon_number", unit: null, quantity: "mode_occupation", dimensionSignature: "1" },
      { symbol: "nu_Hz", unit: "Hz", quantity: "mode_frequency", dimensionSignature: "T^-1" },
      { symbol: "mode_energy_J", unit: "J", quantity: "quantized_mode_energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      ...commonAssumptions,
      "E = h nu is the one-quantum increment; it does not specify photon number or field statistics.",
      "The half-quantum term is mode zero-point structure and is not a claim of extractable free energy.",
    ],
    calculatorPayloads: [
      {
        id: "quantized_mode_energy_payload",
        expression: "mode_energy_J = (photon_number + 0.5) * h_J_s * nu_Hz",
        displayLatex: "E_n=(n+1/2)h\\nu",
        preferredAction: "solve_with_steps",
        targetVariable: "mode_energy_J",
        setupContext: null,
      },
    ],
    sourceRefs: [literatureRef("quantum-optics-field-states", "Canonical single-mode quantum-optics state context.")],
    hintKeys: {
      subjects: ["radiation", "quantum_optics", "photon_occupation", "coherence", "field_state"],
      symbols: ["photon_number", "h_J_s", "nu_Hz", "mode_energy_J"],
      unitSignatures: ["1", "T^-1", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["quantized_field_mode", "photon_occupation", "quantum_optical_state"],
      simulationOwners: ["general_physics", "casimir_cavity"],
    },
  }),
  stateBadge({
    id: "physics.radiation.laser_coherence_context",
    title: "Laser Coherence and Gain Context",
    plainMeaning:
      "Represents laser output as a driven radiation state requiring a selected mode, gain medium, pumping, stimulated emission, and net-gain conditions.",
    whyItMatters:
      "It prevents a frequency or photon-energy badge from being treated as sufficient evidence that the radiation is a laser.",
    subjects: ["radiation", "laser", "coherence", "stimulated_emission", "gain_medium"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["laser_gain", "coherent_state", "population_inversion", "cavity_mode"],
    tags: ["laser", "coherence", "gain", "population_inversion", "driven_state", "not_frequency_alone", "explicit_prerequisite_gate_required"],
    equations: [
      {
        id: "laser_context_gate",
        role: "gate",
        displayLatex: "\\mathrm{laser}=\\mathrm{context}(\\mathrm{mode},\\mathrm{gain},\\mathrm{pump},\\mathrm{loss},\\mathrm{coherence})",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["radiation_mode", "gain_context", "pump_context", "loss_context", "coherence_context"],
        outputSymbols: ["laser_state_context"],
      },
    ],
    units: [
      { symbol: "gain_context", unit: null, quantity: "gain_model_context", dimensionSignature: "mixed" },
      { symbol: "coherence_context", unit: null, quantity: "coherence_evidence", dimensionSignature: "mixed" },
    ],
    assumptions: [
      ...commonAssumptions,
      "A narrow spectral line is not sufficient by itself to establish laser coherence or gain.",
      "Population inversion is a common route, but platform-specific gain and threshold evidence remains required.",
    ],
    calculatorPayloads: [],
    sourceRefs: [literatureRef("laser-physics-gain-coherence", "Laser classification requires mode, gain, pumping, loss, and coherence context.")],
    hintKeys: {
      subjects: ["radiation", "laser", "coherence", "stimulated_emission", "gain_medium"],
      symbols: ["radiation_mode", "gain_context", "pump_context", "loss_context", "coherence_context", "laser_state_context"],
      unitSignatures: ["mixed"],
      repoPaths: [],
      equationFamilies: ["laser_gain", "coherent_state", "population_inversion", "cavity_mode"],
      simulationOwners: ["general_physics"],
    },
  }),
];

const elementContextEdges: TheoryBadgeEdgeV1[] = ELEMENT_ORIGIN_REGISTRY.flatMap((entry) => {
  const elementId = `element.${entry.symbol.toLowerCase()}.origin`;
  return [
    {
      id: `atomic_identity_specializes_element_${entry.symbol.toLowerCase()}_origin_context`,
      from: "physics.atomic.element_identity_context",
      to: elementId,
      relation: "specializes" as const,
      label: `${entry.name} is an element-identity specialization with separately bounded origin context.`,
      claimBoundaryNote: "Element identity does not select isotope, ionization, excitation, phase, or origin evidence.",
    },
    {
      id: `element_${entry.symbol.toLowerCase()}_admits_ionization_state_context`,
      from: elementId,
      to: "physics.atomic.ionization_charge_state_context",
      relation: "requires" as const,
      label: `${entry.name} spectroscopy requires a declared neutral or ionic charge-state context.`,
      claimBoundaryNote: "Element selection alone does not choose a charge state.",
    },
  ];
});

export const ATOMIC_RADIATION_STATE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  ...elementContextEdges,
  {
    id: "atomic_bound_state_documents_electronic_level_structure",
    from: "physics.atomic.quantum_bound_state_structure",
    to: "physics.atomic.electronic_level_structure_context",
    relation: "documents",
    label: "The atomic bound-state eigenvalue principle documents general electronic-level structure.",
    claimBoundaryNote: "A level spectrum does not select ground-state or excited-state occupation.",
  },
  {
    id: "ionization_state_conditions_electronic_level_structure",
    from: "physics.atomic.ionization_charge_state_context",
    to: "physics.atomic.electronic_level_structure_context",
    relation: "requires",
    label: "Electronic-level structure is conditioned on the atom or ion charge state.",
    claimBoundaryNote: "Neutral and ionic spectra must not be merged without charge-state evidence.",
  },
  {
    id: "electronic_levels_derive_atomic_transition_gap",
    from: "physics.atomic.electronic_level_structure_context",
    to: "physics.atomic.transition_gap_frequency_context",
    relation: "derives",
    label: "A selected upper and lower electronic level define the transition energy gap.",
    claimBoundaryNote: "A possible energy gap is not evidence that the transition is populated or observed.",
  },
  {
    id: "quantum_energy_frequency_specializes_atomic_transition_gap",
    from: "physics.quantum.energy_frequency",
    to: "physics.atomic.transition_gap_frequency_context",
    relation: "specializes",
    label: "Atomic transition gaps specialize the shared Planck energy-frequency relation to Delta E = h nu.",
    claimBoundaryNote: "The Planck relation does not identify an element or transition by itself.",
  },
  {
    id: "thermodynamic_state_documents_atomic_level_population",
    from: "matter.phase.thermodynamic_state_context",
    to: "physics.atomic.level_population_context",
    relation: "documents",
    label: "Thermodynamic state can document an LTE population prior when its validity assumptions are admitted.",
    claimBoundaryNote: "Temperature and phase do not guarantee LTE or determine every excitation pathway.",
  },
  {
    id: "electronic_levels_require_level_population_context",
    from: "physics.atomic.electronic_level_structure_context",
    to: "physics.atomic.level_population_context",
    relation: "requires",
    label: "Observed transition strength requires populations over the available electronic levels.",
    claimBoundaryNote: "Allowed levels are not automatically occupied.",
  },
  {
    id: "atomic_transition_gap_documents_atomic_line_identification",
    from: "physics.atomic.transition_gap_frequency_context",
    to: "stellar.spectroscopy.atomic_line_identification_context",
    relation: "documents",
    label: "A calibrated transition gap provides the rest-frequency context used for atomic line identification.",
    claimBoundaryNote: "Line identification also requires charge state, transition probability, population, broadening, and calibration.",
  },
  {
    id: "atomic_level_population_documents_line_identification",
    from: "physics.atomic.level_population_context",
    to: "stellar.spectroscopy.atomic_line_identification_context",
    relation: "documents",
    label: "Level populations document whether a candidate emission or absorption line can be active.",
    claimBoundaryNote: "Population context is not a detection or abundance proof.",
  },
  {
    id: "transition_probability_documents_atomic_line_identification",
    from: "physics.atomic.spectra.transition_probability_context",
    to: "stellar.spectroscopy.atomic_line_identification_context",
    relation: "documents",
    label: "Transition probabilities document selection-rule and line-strength context for atomic line identification.",
    claimBoundaryNote: "Transition data without calibrated observation and population context remains incomplete.",
  },
  {
    id: "speed_of_light_supports_radiation_mode_context",
    from: "physics.constants.speed_of_light",
    to: "physics.radiation.mode_context",
    relation: "uses_constant",
    label: "Vacuum radiation-mode frequency and wavelength use the speed of light.",
    claimBoundaryNote: "Material dispersion requires a medium-specific relation.",
  },
  {
    id: "radiation_mode_requires_quantum_field_state_context",
    from: "physics.radiation.mode_context",
    to: "physics.radiation.quantum_field_state_context",
    relation: "requires",
    label: "A radiation quantum state is defined over a declared mode basis.",
    claimBoundaryNote: "The same mode frequency can carry vacuum, thermal, number, coherent, squeezed, or mixed states.",
  },
  {
    id: "thermal_population_documents_radiation_field_state",
    from: "low_temp.radiation.thermal_population_floor",
    to: "physics.radiation.quantum_field_state_context",
    relation: "documents",
    label: "Thermal occupation provides one radiation field-state context while remaining distinct from vacuum and coherent states.",
    claimBoundaryNote: "Thermal suppression is not vacuum erasure and does not establish laser coherence.",
  },
  {
    id: "radiation_field_state_requires_laser_gain_context",
    from: "physics.radiation.quantum_field_state_context",
    to: "physics.radiation.laser_coherence_context",
    relation: "specializes",
    label: "Laser output specializes radiation field-state context with drive, gain, loss, and coherence evidence.",
    claimBoundaryNote: "A coherent-state approximation alone does not prove a functioning laser mechanism.",
  },
  {
    id: "atomic_level_population_documents_laser_gain_context",
    from: "physics.atomic.level_population_context",
    to: "physics.radiation.laser_coherence_context",
    relation: "documents",
    label: "Atomic level populations can document gain or inversion context for an admitted laser medium.",
    claimBoundaryNote: "Element identity and a possible transition do not establish population inversion or threshold gain.",
  },
];

export function buildAtomicRadiationStateTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: ATOMIC_RADIATION_STATE_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: ATOMIC_RADIATION_STATE_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
