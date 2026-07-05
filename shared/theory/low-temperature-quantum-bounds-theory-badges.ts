import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const LOW_TEMP_QUANTUM_BOUNDS_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const lowTempBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: LOW_TEMP_QUANTUM_BOUNDS_BOUNDARY,
});

export const LOW_TEMPERATURE_QUANTUM_BOUNDS_THEORY_BADGES: TheoryBadgeV1[] = [
  lowTempBadge({
    id: "low_temp.temperature.thermal_energy_not_pressure",
    title: "Thermodynamic Temperature Scale",
    plainMeaning:
      "Represents temperature through the thermal energy scale kBT while keeping pressure as only one possible thermometer signal.",
    whyItMatters:
      "It blocks the common shortcut where gas pressure is treated as the definition of temperature near zero-temperature regimes.",
    subjects: ["low_temperature", "thermodynamics", "kelvin", "pressure", "thermal_energy"],
    level: "first_principle",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["thermal_energy_scale", "ideal_gas_context"],
    tags: ["calculator_loadable", "temperature", "not_pressure_definition"],
    equations: [
      {
        id: "thermal_energy_scale",
        role: "definition",
        displayLatex: "E_{thermal}=k_B T",
        computableExpression: "thermal_energy = k_B * T",
        operatorKind: "scalar_expression",
        inputSymbols: ["k_B", "T"],
        outputSymbols: ["thermal_energy"],
      },
      {
        id: "ideal_gas_pressure_temperature_context",
        role: "noncomputable_reference",
        displayLatex: "pV=Nk_B T",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["p", "V", "N", "k_B", "T"],
        outputSymbols: ["ideal_gas_temperature_context"],
      },
    ],
    units: [
      { symbol: "k_B", unit: "J/K", quantity: "boltzmann_constant", dimensionSignature: "M L^2 T^-2 Theta^-1" },
      { symbol: "T", unit: "K", quantity: "thermodynamic_temperature", dimensionSignature: "Theta" },
      { symbol: "thermal_energy", unit: "J", quantity: "thermal_energy_scale", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "Pressure can be proportional to temperature in an ideal gas thermometer.",
      "Pressure does not define temperature and can remain nonzero at zero thermal temperature in other systems.",
    ],
    calculatorPayloads: [
      payload({
        id: "thermal_energy_scale_payload",
        expression: "thermal_energy = k_B * T",
        displayLatex: "E_{thermal}=k_B T",
        targetVariable: "thermal_energy",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "BIPM-kelvin-definition",
        "https://www.bipm.org/en/si-base-units/kelvin",
        "SI kelvin definition fixes Boltzmann's constant so kBT is the thermal energy scale.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "thermodynamics", "kelvin", "pressure", "thermal_energy"],
      symbols: ["k_B", "T", "thermal_energy", "p", "V", "N"],
      unitSignatures: ["M L^2 T^-2 Theta^-1", "Theta", "M L^2 T^-2"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["thermal_energy_scale", "ideal_gas_context"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.third_law.absolute_zero_unattainable",
    title: "Third-Law Cooling Limit",
    plainMeaning:
      "Represents absolute zero as a limiting state that no finite ordinary cooling process reaches exactly.",
    whyItMatters:
      "It separates the zero-temperature limit from a physical claim that a finite apparatus can remove all remaining structure.",
    subjects: ["low_temperature", "third_law", "absolute_zero", "cooling_limit"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["third_law_unattainability", "cooling_gap"],
    tags: ["calculator_loadable", "absolute_zero", "unattainability"],
    equations: [
      {
        id: "absolute_zero_gap_proxy",
        role: "calculator_demo",
        displayLatex: "\\Delta T_0=T-T_{floor}",
        computableExpression: "cooling_gap = T - T_floor",
        operatorKind: "scalar_expression",
        inputSymbols: ["T", "T_floor"],
        outputSymbols: ["cooling_gap"],
      },
    ],
    units: [
      { symbol: "T", unit: "K", quantity: "thermodynamic_temperature", dimensionSignature: "Theta" },
      { symbol: "T_floor", unit: "K", quantity: "zero_temperature_reference", dimensionSignature: "Theta" },
      { symbol: "cooling_gap", unit: "K", quantity: "temperature_gap_to_floor", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "The zero-temperature floor is a limiting reference, not a reachable finite-step target.",
      "Unattainability is not caused by a pressure gauge bottoming out.",
    ],
    calculatorPayloads: [
      payload({
        id: "absolute_zero_gap_payload",
        expression: "cooling_gap = T - T_floor",
        displayLatex: "\\Delta T_0=T-T_{floor}",
        targetVariable: "cooling_gap",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1038/ncomms14538",
        "https://www.nature.com/articles/ncomms14538",
        "Masanes and Oppenheim derive and quantify third-law unattainability bounds.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "third_law", "absolute_zero", "cooling_limit"],
      symbols: ["T", "T_floor", "cooling_gap"],
      unitSignatures: ["Theta"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["third_law_unattainability", "cooling_gap"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.quantum.zero_point_energy_floor",
    title: "Quantum Ground-State Energy Floor",
    plainMeaning:
      "Represents quantum ground-state energy as a remaining floor after removable thermal disorder is gone.",
    whyItMatters:
      "It prevents absolute zero from being interpreted as zero energy, zero fields, or no quantum structure.",
    subjects: ["low_temperature", "quantum", "ground_state", "zero_point_energy"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["quantum_harmonic_oscillator", "zero_point_energy"],
    tags: ["calculator_loadable", "zero_point_floor", "not_heat"],
    equations: [
      {
        id: "oscillator_zero_point_energy",
        role: "law",
        displayLatex: "E_0=\\hbar\\omega/2",
        computableExpression: "E_0 = hbar * omega / 2",
        operatorKind: "scalar_expression",
        inputSymbols: ["hbar", "omega"],
        outputSymbols: ["E_0"],
      },
    ],
    units: [
      { symbol: "hbar", unit: "J s", quantity: "reduced_planck_constant", dimensionSignature: "M L^2 T^-1" },
      { symbol: "omega", unit: "s^-1", quantity: "angular_frequency", dimensionSignature: "T^-1" },
      { symbol: "E_0", unit: "J", quantity: "zero_point_energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "Zero-point energy is ground-state structure, not heat.",
      "This badge does not claim extractable free energy or any propulsion result.",
    ],
    calculatorPayloads: [
      payload({
        id: "zero_point_energy_payload",
        expression: "E_0 = hbar * omega / 2",
        displayLatex: "E_0=\\hbar\\omega/2",
        targetVariable: "E_0",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "quantum-harmonic-oscillator-zero-point-reference",
        "https://www.nist.gov/publications/observation-bose-einstein-condensation-dilute-atomic-vapor-below-200-nanokelvins",
        "Low-temperature quantum-state context; oscillator zero-point expression is canonical quantum-mechanics reference context.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "quantum", "ground_state", "zero_point_energy"],
      symbols: ["hbar", "omega", "E_0"],
      unitSignatures: ["M L^2 T^-1", "T^-1", "M L^2 T^-2"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["quantum_harmonic_oscillator", "zero_point_energy"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.radiation.thermal_population_floor",
    title: "Thermal Occupation Suppression",
    plainMeaning:
      "Represents the thermal photon occupation scale that vanishes as temperature approaches zero while vacuum-mode structure remains distinct.",
    whyItMatters:
      "It keeps Planck radiation, vacuum fluctuations, and Casimir stresses from being collapsed into one meaning of zero.",
    subjects: ["low_temperature", "black_body", "thermal_radiation", "vacuum_structure", "planck_law"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["planck_occupation", "thermal_radiation_floor"],
    tags: ["calculator_loadable", "thermal_photon_floor", "not_vacuum_erasure"],
    equations: [
      {
        id: "planck_thermal_scale",
        role: "calculator_demo",
        displayLatex: "x=h\\nu/(k_B T)",
        computableExpression: "thermal_scale = h * nu/(k_B * T)",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "nu", "k_B", "T"],
        outputSymbols: ["thermal_scale"],
      },
      {
        id: "black_body_energy_density_reference",
        role: "noncomputable_reference",
        displayLatex: "u=aT^4",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["a", "T"],
        outputSymbols: ["u"],
      },
    ],
    units: [
      { symbol: "h", unit: "J s", quantity: "planck_constant", dimensionSignature: "M L^2 T^-1" },
      { symbol: "nu", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "thermal_scale", unit: null, quantity: "dimensionless_planck_ratio", dimensionSignature: "1" },
    ],
    assumptions: [
      "Thermal photon occupation vanishes for fixed nonzero frequency as temperature approaches zero.",
      "Vanishing thermal radiation is not the same as vanishing vacuum field structure.",
    ],
    calculatorPayloads: [
      payload({
        id: "thermal_radiation_scale_payload",
        expression: "thermal_scale = h * nu/(k_B * T)",
        displayLatex: "x=h\\nu/(k_B T)",
        targetVariable: "thermal_scale",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "Planck-1901-black-body-law",
        "https://www.bipm.org/en/si-base-units/kelvin",
        "Kelvin/kB definition anchors the thermal occupation scale used in Planck-law reasoning.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "black_body", "thermal_radiation", "vacuum_structure", "planck_law"],
      symbols: ["h", "nu", "k_B", "T", "thermal_scale", "u"],
      unitSignatures: ["M L^2 T^-1", "T^-1", "1"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["planck_occupation", "thermal_radiation_floor"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.bose.phase_space_density_threshold",
    title: "Bosonic Phase-Space Degeneracy",
    plainMeaning:
      "Represents Bose-Einstein condensation as a phase-space-density threshold rather than ordinary freezing.",
    whyItMatters:
      "It lets the map distinguish quantum degeneracy from absolute-zero nothingness or classical solidification.",
    subjects: ["low_temperature", "bose_einstein_condensation", "phase_space_density", "quantum_degeneracy"],
    level: "diagnostic_gate",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["bose_degeneracy", "phase_space_density"],
    tags: ["calculator_loadable", "bec_threshold", "not_freezing"],
    equations: [
      {
        id: "bose_phase_space_density_margin",
        role: "calculator_demo",
        displayLatex: "m_{BEC}=n\\lambda_{dB}^3-2.612",
        computableExpression: "bec_margin = phase_space_density - 2.612",
        operatorKind: "scalar_expression",
        inputSymbols: ["phase_space_density"],
        outputSymbols: ["bec_margin"],
      },
    ],
    units: [
      { symbol: "phase_space_density", unit: null, quantity: "n_lambda_dB_cubed", dimensionSignature: "1" },
      { symbol: "bec_margin", unit: null, quantity: "bose_threshold_margin", dimensionSignature: "1" },
    ],
    assumptions: [
      "The 2.612 threshold is ideal-gas context.",
      "BEC is quantum-degenerate occupation, not a statement that everything freezes or disappears.",
    ],
    calculatorPayloads: [
      payload({
        id: "bose_degeneracy_margin_payload",
        expression: "bec_margin = phase_space_density - 2.612",
        displayLatex: "m_{BEC}=n\\lambda_{dB}^3-2.612",
        targetVariable: "bec_margin",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "NIST-BEC-1995-Science",
        "https://www.nist.gov/publications/observation-bose-einstein-condensation-dilute-atomic-vapor-below-200-nanokelvins",
        "NIST publication record for dilute-gas BEC below about 200 nanokelvins.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "bose_einstein_condensation", "phase_space_density", "quantum_degeneracy"],
      symbols: ["phase_space_density", "bec_margin", "lambda_dB"],
      unitSignatures: ["1"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["bose_degeneracy", "phase_space_density"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.superfluid.helium_rollin_film_boundary",
    title: "Helium-II Superfluid Surface Flow",
    plainMeaning:
      "Represents helium II Rollin-film and superfluid wetting behavior as bounded low-temperature fluid physics.",
    whyItMatters:
      "It prevents wall-climbing helium from being read as gravity violation or an ordinary trapped dilute-gas BEC effect.",
    subjects: ["low_temperature", "superfluid", "helium_ii", "rollin_film", "lambda_point"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["superfluid_lambda_transition", "rollin_film_boundary"],
    tags: ["calculator_loadable", "superfluid_helium", "not_gravity_violation"],
    equations: [
      {
        id: "helium_lambda_margin",
        role: "calculator_demo",
        displayLatex: "m_{\\lambda}=T_{\\lambda}-T",
        computableExpression: "lambda_margin = T_lambda - T",
        operatorKind: "scalar_expression",
        inputSymbols: ["T_lambda", "T"],
        outputSymbols: ["lambda_margin"],
      },
    ],
    units: [
      { symbol: "T_lambda", unit: "K", quantity: "helium_lambda_transition_temperature", dimensionSignature: "Theta" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
      { symbol: "lambda_margin", unit: "K", quantity: "superfluid_transition_margin", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Rollin-film motion depends on superfluid wetting, chemical potential, surface forces, and low viscosity.",
      "The wall-climbing effect does not violate gravity.",
    ],
    calculatorPayloads: [
      payload({
        id: "helium_lambda_margin_payload",
        expression: "lambda_margin = T_lambda - T",
        displayLatex: "m_{\\lambda}=T_{\\lambda}-T",
        targetVariable: "lambda_margin",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1103/PhysRev.79.626",
        "https://link.aps.org/doi/10.1103/PhysRev.79.626",
        "Liquid-solid transformation in helium near absolute zero.",
      ),
      literatureRef(
        "doi:10.1103/PhysRev.76.1209",
        "https://link.aps.org/doi/10.1103/PhysRev.76.1209",
        "Rollin film rate measurements in liquid helium II.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "superfluid", "helium_ii", "rollin_film", "lambda_point"],
      symbols: ["T_lambda", "T", "lambda_margin", "rho_s", "rho_n", "eta", "mu", "sigma"],
      unitSignatures: ["Theta"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["superfluid_lambda_transition", "rollin_film_boundary"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.casimir.boundary_stress_not_temperature",
    title: "Boundary-Induced Vacuum Stress",
    plainMeaning:
      "Represents zero-temperature Casimir pressure as geometry-dependent boundary stress rather than thermal pressure.",
    whyItMatters:
      "It keeps vacuum/free-energy stress separate from thermodynamic temperature when the graph reasons about low-temperature floors.",
    subjects: ["low_temperature", "casimir", "vacuum_stress", "boundary_condition", "not_temperature"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds", "casimir_cavity"],
    equationFamilies: ["casimir_pressure", "vacuum_boundary_stress"],
    tags: ["calculator_loadable", "casimir", "not_temperature"],
    equations: [
      {
        id: "ideal_parallel_plate_casimir_pressure",
        role: "law",
        displayLatex: "P_{Casimir}=-\\pi^2\\hbar c/(240a^4)",
        computableExpression: "P_casimir = -pi2_hbar_c / (240 * a4)",
        operatorKind: "scalar_expression",
        inputSymbols: ["pi2_hbar_c", "a4"],
        outputSymbols: ["P_casimir"],
      },
    ],
    units: [
      { symbol: "pi2_hbar_c", unit: "J m", quantity: "pi_squared_hbar_c_constant", dimensionSignature: "M L^3 T^-2" },
      { symbol: "a4", unit: "m^4", quantity: "plate_separation_fourth_power", dimensionSignature: "L^4" },
      { symbol: "P_casimir", unit: "Pa", quantity: "casimir_pressure", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "The calculator expression is the ideal perfect-conductor parallel-plate zero-temperature reference.",
      "Casimir pressure is not a temperature and does not validate NHM2 or propulsion claims.",
    ],
    calculatorPayloads: [
      payload({
        id: "casimir_pressure_payload",
        expression: "P_casimir = -pi2_hbar_c / (240 * a4)",
        displayLatex: "P_{Casimir}=-\\pi^2\\hbar c/(240a^4)",
        targetVariable: "P_casimir",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "Casimir-1948",
        "https://www.mit.edu/~kardar/research/seminars/Casimir/Casimir1948.pdf",
        "Casimir's original ideal-plate attraction paper.",
      ),
      literatureRef(
        "UCSD-Casimir-review",
        "https://courses.physics.ucsd.edu/2014/Fall/physics215a/project/Casimir-Review.pdf",
        "Review context for Casimir force background, experiments, and finite-temperature corrections.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "casimir", "vacuum_stress", "boundary_condition", "not_temperature"],
      symbols: ["pi2_hbar_c", "a4", "P_casimir"],
      unitSignatures: ["M L^3 T^-2", "L^4", "M L^-1 T^-2"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["casimir_pressure", "vacuum_boundary_stress"],
      simulationOwners: ["low_temperature_quantum_bounds", "casimir_cavity"],
    },
  }),
  lowTempBadge({
    id: "low_temp.superconductivity.zero_dc_resistance_bounds",
    title: "Superconducting Critical Surface",
    plainMeaning:
      "Represents superconducting zero DC resistance as bounded by temperature, current density, and magnetic field conditions.",
    whyItMatters:
      "It prevents zero resistance from being read as zero impedance or all electrical opposition disappearing.",
    subjects: ["low_temperature", "superconductivity", "dc_resistance", "critical_surface", "meissner_effect"],
    level: "diagnostic_gate",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["superconducting_critical_surface", "zero_dc_resistance_bounds"],
    tags: ["calculator_loadable", "superconductivity", "not_zero_impedance"],
    equations: [
      {
        id: "superconducting_temperature_margin",
        role: "calculator_demo",
        displayLatex: "m_T=T_c-T",
        computableExpression: "T_margin = T_c - T",
        operatorKind: "scalar_expression",
        inputSymbols: ["T_c", "T"],
        outputSymbols: ["T_margin"],
      },
      {
        id: "superconducting_current_margin",
        role: "calculator_demo",
        displayLatex: "m_J=J_c-J",
        computableExpression: "J_margin = J_c - J",
        operatorKind: "scalar_expression",
        inputSymbols: ["J_c", "J"],
        outputSymbols: ["J_margin"],
      },
      {
        id: "superconducting_field_margin",
        role: "calculator_demo",
        displayLatex: "m_B=B_c-B",
        computableExpression: "B_margin = B_c - B",
        operatorKind: "scalar_expression",
        inputSymbols: ["B_c", "B"],
        outputSymbols: ["B_margin"],
      },
    ],
    units: [
      { symbol: "T_c", unit: "K", quantity: "critical_temperature", dimensionSignature: "Theta" },
      { symbol: "J_c", unit: "A/m^2", quantity: "critical_current_density", dimensionSignature: "I L^-2" },
      { symbol: "B_c", unit: "T", quantity: "critical_magnetic_field", dimensionSignature: "M T^-2 I^-1" },
    ],
    assumptions: [
      "Zero DC resistance requires conditions inside the superconducting critical surface.",
      "AC impedance is generally not zero because response can include reactive and pair-breaking effects.",
    ],
    calculatorPayloads: [
      payload({
        id: "superconducting_temperature_margin_payload",
        expression: "T_margin = T_c - T",
        displayLatex: "m_T=T_c-T",
        targetVariable: "T_margin",
      }),
      payload({
        id: "superconducting_current_margin_payload",
        expression: "J_margin = J_c - J",
        displayLatex: "m_J=J_c-J",
        targetVariable: "J_margin",
      }),
      payload({
        id: "superconducting_field_margin_payload",
        expression: "B_margin = B_c - B",
        displayLatex: "m_B=B_c-B",
        targetVariable: "B_margin",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "doi:10.1103/PhysRev.108.1175",
        "https://link.aps.org/doi/10.1103/PhysRev.108.1175",
        "BCS theory of conventional superconductivity.",
      ),
      literatureRef(
        "NISTIR-3977",
        "https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir3977.pdf",
        "NIST superconducting susceptibility report discusses critical surfaces and measurement limits.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "superconductivity", "dc_resistance", "critical_surface", "meissner_effect"],
      symbols: ["T_c", "T", "T_margin", "J_c", "J", "J_margin", "B_c", "B", "B_margin", "Z_omega"],
      unitSignatures: ["Theta", "I L^-2", "M T^-2 I^-1"],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["superconducting_critical_surface", "zero_dc_resistance_bounds"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
  lowTempBadge({
    id: "low_temp.qft.virtual_particle_propagator_boundary",
    title: "Off-Shell Propagator Boundary",
    plainMeaning:
      "Represents virtual particles as off-shell internal lines in perturbative QFT calculations, not directly observed short-lived beads.",
    whyItMatters:
      "It blocks collider and annihilation evidence from being misread as direct proof of spacetime foam or literal vacuum particles popping into existence.",
    subjects: ["low_temperature", "qft", "virtual_particle", "propagator", "vacuum_boundary"],
    level: "claim_boundary",
    status: "canonical_reference",
    simulationOwners: ["low_temperature_quantum_bounds"],
    equationFamilies: ["off_shell_propagator_boundary", "qed_amplitude_context"],
    tags: ["claim_boundary", "virtual_particle", "not_vacuum_foam"],
    equations: [
      {
        id: "off_shell_gap_context",
        role: "noncomputable_reference",
        displayLatex: "q^2\\neq m^2c^2\\ \\mathrm{for\\ an\\ internal\\ off\\ shell\\ line}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["q2", "m2_c2"],
        outputSymbols: ["off_shell_context"],
      },
    ],
    units: [],
    assumptions: [
      "Virtual particles are calculation terms in a perturbative expansion.",
      "QED scattering tests do not prove spacetime foam.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "CERN-QED-lecture-virtual-particles",
        "https://indico.cern.ch/event/1032744/contributions/4340227/attachments/2233852/3785727/QUANTUM%20ELECTRODYNAMICS.pdf",
        "CERN lecture notes distinguish internal virtual-particle lines from observable external particles.",
      ),
      literatureRef(
        "doi:10.1103/PhysRevD.35.1",
        "https://link.aps.org/doi/10.1103/PhysRevD.35.1",
        "QED annihilation tests constrain amplitudes rather than directly observing virtual particles.",
      ),
    ],
    hintKeys: {
      subjects: ["low_temperature", "qft", "virtual_particle", "propagator", "vacuum_boundary"],
      symbols: ["q2", "m2_c2", "off_shell_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/low-temperature-quantum-bounds-theory-badges.ts"],
      equationFamilies: ["off_shell_propagator_boundary", "qed_amplitude_context"],
      simulationOwners: ["low_temperature_quantum_bounds"],
    },
  }),
];

export const LOW_TEMPERATURE_QUANTUM_BOUNDS_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "thermal_energy_context_to_absolute_zero_limit",
    from: "low_temp.temperature.thermal_energy_not_pressure",
    to: "low_temp.third_law.absolute_zero_unattainable",
    relation: "requires",
    label: "Absolute-zero reasoning requires temperature as thermal energy scale, not pressure definition.",
    claimBoundaryNote: "Pressure does not define temperature.",
  },
  {
    id: "absolute_zero_limit_to_zero_point_floor",
    from: "low_temp.third_law.absolute_zero_unattainable",
    to: "low_temp.quantum.zero_point_energy_floor",
    relation: "bounds",
    label: "The zero-temperature limit still allows quantum ground-state energy.",
    claimBoundaryNote: "Absolute zero is not nothing.",
  },
  {
    id: "zero_point_floor_to_thermal_radiation_floor",
    from: "low_temp.quantum.zero_point_energy_floor",
    to: "low_temp.radiation.thermal_population_floor",
    relation: "bounds",
    label: "Ground-state structure remains distinct from vanishing thermal photon populations.",
    claimBoundaryNote: "Zero-point energy is not heat.",
  },
  {
    id: "zero_point_floor_to_casimir_stress",
    from: "low_temp.quantum.zero_point_energy_floor",
    to: "low_temp.casimir.boundary_stress_not_temperature",
    relation: "documents",
    label: "Zero-point field structure gives context for boundary-dependent Casimir stress.",
    claimBoundaryNote: "Casimir pressure is not temperature.",
  },
  {
    id: "zero_point_floor_to_bose_degeneracy",
    from: "low_temp.quantum.zero_point_energy_floor",
    to: "low_temp.bose.phase_space_density_threshold",
    relation: "documents",
    label: "Low-temperature quantum ground-state structure supports Bose-degeneracy reasoning.",
    claimBoundaryNote: "Bose degeneracy is not ordinary freezing.",
  },
  {
    id: "bose_degeneracy_to_superfluid_helium_boundary",
    from: "low_temp.bose.phase_space_density_threshold",
    to: "low_temp.superfluid.helium_rollin_film_boundary",
    relation: "bounds",
    label: "Superfluid helium should be discussed as bounded helium II physics, not ordinary BEC bowl magic.",
    claimBoundaryNote: "Superfluid helium does not violate gravity.",
  },
  {
    id: "zero_point_floor_to_superconducting_bounds",
    from: "low_temp.quantum.zero_point_energy_floor",
    to: "low_temp.superconductivity.zero_dc_resistance_bounds",
    relation: "documents",
    label: "Low-temperature quantum phases include superconducting zero-DC-resistance regimes under critical bounds.",
    claimBoundaryNote: "Superconductivity is not zero AC impedance.",
  },
  {
    id: "virtual_propagator_to_casimir_boundary",
    from: "low_temp.qft.virtual_particle_propagator_boundary",
    to: "low_temp.casimir.boundary_stress_not_temperature",
    relation: "bounds",
    label: "QFT propagator language must stay separate from Casimir boundary-stress interpretation.",
    claimBoundaryNote: "Virtual particles do not prove spacetime foam.",
  },
];

export function buildLowTemperatureQuantumBoundsTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: LOW_TEMPERATURE_QUANTUM_BOUNDS_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: LOW_TEMPERATURE_QUANTUM_BOUNDS_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
